from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from typing import Any, Mapping
from uuid import UUID


@dataclass(frozen=True)
class BridgeContractError(ValueError):
    code: str
    status: int
    detail: str

    def __str__(self) -> str:
        return f"{self.code}: {self.detail}"


_ALLOWED_TOP_LEVEL = {
    "operation_id",
    "organization_id",
    "operation",
    "idempotency_key",
    "correlation_id",
    "subject",
    "input",
}

# Aggregate/public impact updates must not carry student-level/private data.
# Matching is done on normalized JSON key names, not arbitrary text values.
_FORBIDDEN_INPUT_KEYS = {
    "student",
    "students",
    "student_name",
    "student_names",
    "student_email",
    "student_emails",
    "email",
    "emails",
    "student_id",
    "student_ids",
    "raw_grade",
    "raw_grades",
    "private_message",
    "private_messages",
    "appeal_body",
    "medical_details",
    "medical_detail",
    "accommodation_details",
    "private_accommodation_details",
}

_KEY_NORMALIZER = re.compile(r"[^a-z0-9]+")


def _normalized_key(value: str) -> str:
    return _KEY_NORMALIZER.sub("_", value.strip().lower()).strip("_")


def _walk_forbidden_keys(value: Any, *, path: str = "input") -> list[str]:
    hits: list[str] = []
    if isinstance(value, Mapping):
        for key, child in value.items():
            key_text = str(key)
            normalized = _normalized_key(key_text)
            child_path = f"{path}.{key_text}"
            if normalized in _FORBIDDEN_INPUT_KEYS:
                hits.append(child_path)
            hits.extend(_walk_forbidden_keys(child, path=child_path))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            hits.extend(_walk_forbidden_keys(child, path=f"{path}[{index}]"))
    return hits


def _require_string(mapping: Mapping[str, Any], key: str, *, max_length: int) -> str:
    value = mapping.get(key)
    if not isinstance(value, str) or not value.strip():
        raise BridgeContractError("INVALID_REQUEST", 400, f"{key} must be a non-empty string")
    value = value.strip()
    if len(value) > max_length:
        raise BridgeContractError("INVALID_REQUEST", 400, f"{key} exceeds {max_length} characters")
    return value


def _require_uuid(mapping: Mapping[str, Any], key: str) -> str:
    value = _require_string(mapping, key, max_length=80)
    try:
        return str(UUID(value))
    except (ValueError, AttributeError) as exc:
        raise BridgeContractError("INVALID_REQUEST", 400, f"{key} must be a UUID") from exc


def validate_publish_request(
    value: Any,
    *,
    idempotency_header: str | None,
    correlation_header: str | None,
) -> dict[str, Any]:
    if not isinstance(value, Mapping):
        raise BridgeContractError("INVALID_REQUEST", 400, "JSON body must be an object")

    unknown = sorted(set(value) - _ALLOWED_TOP_LEVEL)
    if unknown:
        raise BridgeContractError(
            "INVALID_REQUEST",
            400,
            f"unexpected top-level fields: {', '.join(unknown)}",
        )

    operation_id = _require_uuid(value, "operation_id")
    organization_id = _require_uuid(value, "organization_id")
    operation = _require_string(value, "operation", max_length=80)
    if operation != "publish":
        raise BridgeContractError("UNSUPPORTED_OPERATION", 400, "only publish is supported")

    idempotency_key = _require_string(value, "idempotency_key", max_length=200)
    correlation_id = _require_string(value, "correlation_id", max_length=255)

    if not isinstance(idempotency_header, str) or idempotency_header != idempotency_key:
        raise BridgeContractError(
            "IDEMPOTENCY_MISMATCH",
            400,
            "Idempotency-Key must match body.idempotency_key",
        )
    if not isinstance(correlation_header, str) or correlation_header != correlation_id:
        raise BridgeContractError(
            "CORRELATION_MISMATCH",
            400,
            "X-Correlation-ID must match body.correlation_id",
        )

    subject = value.get("subject")
    if not isinstance(subject, Mapping):
        raise BridgeContractError("INVALID_REQUEST", 400, "subject must be an object")
    if set(subject) - {"type", "id"}:
        raise BridgeContractError("INVALID_REQUEST", 400, "subject has unexpected fields")
    subject_type = _require_string(subject, "type", max_length=80)
    if subject_type != "case":
        raise BridgeContractError("INVALID_SUBJECT", 400, "J30 Impact publication requires a case subject")
    subject_id = _require_uuid(subject, "id")

    input_value = value.get("input")
    if not isinstance(input_value, Mapping):
        raise BridgeContractError("INVALID_REQUEST", 400, "input must be an object")
    input_data = dict(input_value)

    artifact_type = _require_string(input_data, "artifact_type", max_length=80)
    if artifact_type != "impact_update":
        raise BridgeContractError("INVALID_ARTIFACT", 400, "artifact_type must be impact_update")
    external_reference = _require_string(input_data, "external_reference", max_length=255)

    forbidden = _walk_forbidden_keys(input_data)
    if forbidden:
        raise BridgeContractError(
            "PRIVATE_DATA_REJECTED",
            400,
            "forbidden private/student fields: " + ", ".join(sorted(forbidden)),
        )

    return {
        "operation_id": operation_id,
        "organization_id": organization_id,
        "operation": operation,
        "idempotency_key": idempotency_key,
        "correlation_id": correlation_id,
        "subject": {"type": subject_type, "id": subject_id},
        "input": input_data,
        "external_reference": external_reference,
        "artifact_type": artifact_type,
    }


def publication_payload_hash(request_data: Mapping[str, Any]) -> str:
    """Hash provider-owned business input, excluding transport retry identity."""
    payload = {
        "organization_id": request_data["organization_id"],
        "operation": request_data["operation"],
        "correlation_id": request_data["correlation_id"],
        "subject": request_data["subject"],
        "input": request_data["input"],
    }
    encoded = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def build_success_receipt(
    *,
    external_reference: str,
    impact_id: int,
    world_key: str,
    release_number: int,
    input_data: Mapping[str, Any],
) -> dict[str, Any]:
    return {
        "status": "succeeded",
        "external_reference": external_reference,
        "data": {
            "artifact_type": "impact_update",
            "impact_id": str(impact_id),
            "world_key": world_key,
            "world_release": release_number,
            "published": True,
            "checkpoint": str(input_data.get("checkpoint") or ""),
            "synthetic": bool(input_data.get("synthetic", False)),
            "epistemic_status": str(input_data.get("epistemic_status") or ""),
        },
    }
