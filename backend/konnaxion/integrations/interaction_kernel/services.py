from __future__ import annotations

from copy import deepcopy
from typing import Any, Mapping

from .contracts import build_decision_execute_envelope
from .jcs import sha256_jcs


class DecisionLifecycleError(ValueError):
    pass


def _iso(value: Any) -> str | None:
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat().replace("+00:00", "Z")
    return str(value)


def _record(value: Mapping[str, Any] | object) -> dict[str, Any]:
    if isinstance(value, Mapping):
        return dict(value)
    data: dict[str, Any] = {}
    for name in (
        "id",
        "pk",
        "artifact_id",
        "revision",
        "topic_id",
        "protocol_id",
        "title",
        "description",
        "status",
        "baseline_result_json",
        "reading_result_refs",
        "opened_at",
        "closed_at",
        "published_at",
        "published_payload",
        "artifact_digest",
    ):
        if hasattr(value, name):
            data[name] = getattr(value, name)
    return data


def decision_artifact_payload(record: Mapping[str, Any] | object) -> dict[str, Any]:
    """Build the canonical decision artifact without importing an app-owned model."""

    item = _record(record)
    identifier = item.get("id", item.get("pk"))
    artifact_id = item.get("artifact_id") or f"konnaxion:decision:{identifier}"
    return {
        "artifact_type": "konnaxion.decision_record",
        "artifact_id": str(artifact_id),
        "revision": str(item.get("revision", "1")),
        "decision": {
            "id": str(identifier),
            "topic": item.get("topic_id"),
            "protocol": item.get("protocol_id"),
            "title": item.get("title"),
            "description": item.get("description"),
            "status": item.get("status", "published"),
            "baseline_result": deepcopy(item.get("baseline_result_json") or {}),
            "reading_result_refs": list(item.get("reading_result_refs") or []),
            "opened_at": _iso(item.get("opened_at")),
            "closed_at": _iso(item.get("closed_at")),
            "published_at": _iso(item.get("published_at")),
        },
    }


def publish_decision_record(record: Mapping[str, Any] | object) -> dict[str, Any]:
    """Pure publication transition used by the standalone Worlds boundary.

    Persistence belongs to the caller.  Keeping this module model-agnostic prevents
    Konnaxion Worlds from importing the main Konnaxion application's domain apps.
    """

    item = _record(record)
    status = str(item.get("status") or "").lower()
    if status not in {"closed", "published"}:
        raise DecisionLifecycleError("Only a closed decision can be published.")
    payload = decision_artifact_payload({**item, "status": "published"})
    return {
        **item,
        "status": "published",
        "published_payload": payload,
        "artifact_digest": sha256_jcs(payload),
    }


def enqueue_decision_execution(
    *,
    decision: Mapping[str, Any] | object,
    runtime: Mapping[str, Any],
    target_organization: str,
    target_world: str | None = None,
    execution_scope: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Build an IK command; delivery/persistence is owned by the caller."""

    item = _record(decision)
    payload = item.get("published_payload") or decision_artifact_payload(item)
    digest = str(item.get("artifact_digest") or sha256_jcs(payload))
    identifier = item.get("id", item.get("pk"))
    return build_decision_execute_envelope(
        decision_id=str(identifier),
        revision=str(item.get("revision", "1")),
        artifact_digest=digest,
        world_key=str(runtime["world_key"]),
        world_release=int(runtime["release_number"]),
        target_organization=target_organization,
        target_world=target_world,
        effective_at=_iso(item.get("published_at")),
        execution_scope=execution_scope,
    )


def build_konnaxion_export(
    *,
    decision: Mapping[str, Any] | object,
    runtime: Mapping[str, Any],
) -> dict[str, Any]:
    """Build a source-owned export manifest without coupling to Konnaxion models."""

    item = _record(decision)
    payload = item.get("published_payload") or decision_artifact_payload(item)
    digest = str(item.get("artifact_digest") or sha256_jcs(payload))
    identifier = item.get("id", item.get("pk"))
    revision = str(item.get("revision", "1"))
    return {
        "id": f"kx-export:decision:{identifier}:r{revision}",
        "profile": "konnaxion.export/1.0.0",
        "producer": {"system": "konnaxion"},
        "snapshot_at": _iso(item.get("published_at")),
        "source_revision": revision,
        "scope": {
            "world": str(runtime["world_key"]),
            "release": str(runtime["release_number"]),
        },
        "subjects": [{"type": "decision", "id": str(identifier)}],
        "items": [
            {
                "type": "canonical_decision_artifact",
                "ref": str(item.get("artifact_id") or f"konnaxion:decision:{identifier}"),
                "digest": f"sha256:{digest}",
            }
        ],
        "intended_use": ["kristal_compilation"],
        "integrity": {"algorithm": "sha256", "digest": sha256_jcs(payload)},
    }
