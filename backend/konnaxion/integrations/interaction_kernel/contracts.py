from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Mapping
from uuid import NAMESPACE_URL, uuid4, uuid5

IK_SPEC_VERSION = "ik/1.1"
GOVERNANCE_DECISION_EXECUTE = ("governance.decision.execute", "1.0.0")
ACCOUNTABILITY_IMPACT_PUBLISH = ("accountability.impact.publish", "1.0.0")


class IKContractError(ValueError):
    def __init__(self, code: str, detail: str) -> None:
        super().__init__(detail)
        self.code = code
        self.detail = detail


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def build_decision_execute_envelope(
    *,
    decision_id: str,
    revision: str,
    artifact_digest: str,
    world_key: str,
    world_release: int,
    target_organization: str,
    target_world: str | None = None,
    effective_at: str | None = None,
    execution_scope: Mapping[str, Any] | None = None,
    interaction_id: str | None = None,
) -> dict[str, Any]:
    """Build the canonical Konnaxion -> Orgo governed-work Command."""

    if not target_organization:
        raise IKContractError("IK_TARGET_NOT_CONFIGURED", "target organization is required")
    if len(artifact_digest) != 64 or any(c not in "0123456789abcdef" for c in artifact_digest):
        raise IKContractError("IK_INVALID_ARTIFACT", "artifact digest must be lowercase sha256 hex")

    subject_id = str(decision_id)
    target_world_value = target_world or world_key
    identity = f"decision:{subject_id}:r{revision}:orgo:{target_organization}:{target_world_value}:execute:v1"
    data: dict[str, Any] = {
        "decision_revision": str(revision),
        "effective_at": effective_at,
    }
    if execution_scope is not None:
        data["execution_scope"] = dict(execution_scope)

    return {
        "specversion": IK_SPEC_VERSION,
        "id": interaction_id or str(uuid4()),
        "class": "command",
        "time": _utc_now(),
        "profile": {"id": GOVERNANCE_DECISION_EXECUTE[0], "version": GOVERNANCE_DECISION_EXECUTE[1]},
        "source": {
            "system": "konnaxion",
            "world": world_key,
            "release": str(world_release),
        },
        "target": {
            "system": "orgo",
            "organization": target_organization,
            "world": target_world_value,
        },
        "subject": {"type": "decision", "id": subject_id},
        "correlation_id": f"decision:{subject_id}",
        "idempotency_key": identity,
        "authority": {
            "kind": "governance-mandate",
            "claims": [f"authority://konnaxion/decision/{subject_id}"],
        },
        "data": data,
        "artifact_refs": [
            {
                "owner": {"system": "konnaxion", "world": world_key, "release": str(world_release)},
                "artifact_type": "konnaxion.decision_record",
                "artifact_id": f"konnaxion:decision_record:{subject_id}",
                "version": str(revision),
                "integrity": {"algorithm": "sha256", "digest": artifact_digest},
            }
        ],
        "response": {"acceptance_receipt": True, "final_receipt": True},
    }


def validate_impact_publish_envelope(envelope: Mapping[str, Any]) -> None:
    """Validate the IK subset required by the existing impact bridge.

    Full IK schema validation belongs in the standalone IK runtime. This local
    adapter deliberately validates only the invariants required to safely map
    into Konnaxion's already-hardened legacy bridge contract.
    """

    if envelope.get("specversion") != IK_SPEC_VERSION:
        raise IKContractError("IK_UNSUPPORTED_PROTOCOL", "expected ik/1.1")
    if envelope.get("class") != "command":
        raise IKContractError("IK_INVALID_ENVELOPE", "impact publish must be a command")
    if envelope.get("profile") != {"id": ACCOUNTABILITY_IMPACT_PUBLISH[0], "version": ACCOUNTABILITY_IMPACT_PUBLISH[1]}:
        raise IKContractError("IK_UNKNOWN_PROFILE", "unsupported Konnaxion inbound profile")

    source = envelope.get("source")
    target = envelope.get("target")
    subject = envelope.get("subject")
    data = envelope.get("data")
    if not isinstance(source, Mapping) or source.get("system") != "orgo":
        raise IKContractError("IK_UNAUTHORIZED", "profile requires source.system=orgo")
    if not isinstance(target, Mapping) or target.get("system") != "konnaxion":
        raise IKContractError("IK_TARGET_NOT_FOUND", "profile requires target.system=konnaxion")
    if not isinstance(subject, Mapping) or not subject.get("type") or not subject.get("id"):
        raise IKContractError("IK_INVALID_ENVELOPE", "subject.type and subject.id are required")
    if not isinstance(data, Mapping):
        raise IKContractError("IK_SCHEMA_VALIDATION_FAILED", "data must be an object")
    if data.get("artifact_type") != "impact_update":
        raise IKContractError("IK_SCHEMA_VALIDATION_FAILED", "data.artifact_type must be impact_update")
    if not envelope.get("idempotency_key"):
        raise IKContractError("IK_INVALID_ENVELOPE", "idempotency_key is required")
    if not source.get("organization"):
        raise IKContractError("IK_INVALID_ENVELOPE", "source.organization is required by the compatibility bridge")


def impact_publish_to_legacy_request(envelope: Mapping[str, Any]) -> dict[str, Any]:
    validate_impact_publish_envelope(envelope)
    source = envelope["source"]
    subject = envelope["subject"]
    data = dict(envelope.get("data") or {})
    operation_id = uuid5(NAMESPACE_URL, f"interaction-kernel:{envelope['id']}")
    return {
        "operation_id": str(operation_id),
        "organization_id": str(source["organization"]),
        "operation": "publish",
        "idempotency_key": str(envelope["idempotency_key"]),
        "correlation_id": str(envelope.get("correlation_id") or envelope["id"]),
        "subject": {"type": str(subject["type"]), "id": str(subject["id"])},
        "input": data,
    }


def success_receipt(
    envelope: Mapping[str, Any],
    *,
    external_reference: str | None,
    data: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "specversion": IK_SPEC_VERSION,
        "record_type": "receipt",
        "id": str(uuid4()),
        "time": _utc_now(),
        "interaction_id": str(envelope.get("id") or "unknown"),
        "source": {"system": "konnaxion"},
        "target": dict(envelope.get("source") or {"system": "orgo"}),
        "status": "succeeded",
        "code": None,
        "retryable": False,
        "external_reference": external_reference,
        "data": dict(data or {}),
        "correlation_id": envelope.get("correlation_id"),
    }


def error_receipt(
    envelope: Mapping[str, Any] | None,
    *,
    status: str,
    code: str,
    retryable: bool,
    detail: str,
) -> dict[str, Any]:
    source = dict((envelope or {}).get("source") or {"system": "unknown"})
    return {
        "specversion": IK_SPEC_VERSION,
        "record_type": "receipt",
        "id": str(uuid4()),
        "time": _utc_now(),
        "interaction_id": str((envelope or {}).get("id") or "unknown"),
        "source": {"system": "konnaxion"},
        "target": source,
        "status": status,
        "code": code,
        "retryable": retryable,
        "external_reference": None,
        "data": {"detail": detail},
        "correlation_id": (envelope or {}).get("correlation_id"),
    }
