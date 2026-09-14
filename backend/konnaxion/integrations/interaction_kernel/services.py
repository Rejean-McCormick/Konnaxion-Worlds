from __future__ import annotations

from typing import Any, Mapping

from django.db import transaction
from django.utils import timezone

from konnaxion.ethikos.models import DecisionRecord, InteractionEmission
from konnaxion.worlds.runtime import require_world_runtime

from .contracts import build_decision_execute_envelope
from .fingerprint import request_fingerprint
from .jcs import sha256_jcs


class DecisionLifecycleError(ValueError):
    pass


class IKIdempotencyConflict(ValueError):
    pass


def _iso(value) -> str | None:
    if value is None:
        return None
    return value.isoformat().replace("+00:00", "Z")


def decision_artifact_payload(record: DecisionRecord) -> dict[str, Any]:
    """Return the immutable, source-owned decision artifact payload."""

    return {
        "artifact_type": "konnaxion.decision_record",
        "artifact_id": record.artifact_id,
        "revision": str(record.revision),
        "decision": {
            "id": str(record.pk),
            "topic": record.topic_id,
            "protocol": record.protocol_id,
            "title": record.title,
            "description": record.description,
            "status": DecisionRecord.STATUS_PUBLISHED,
            "baseline_result": record.baseline_result_json or {},
            "reading_result_refs": list(record.reading_result_refs or []),
            "opened_at": _iso(record.opened_at),
            "closed_at": _iso(record.closed_at),
            "published_at": _iso(record.published_at),
        },
    }


def publish_decision_record(*, decision_id: int) -> DecisionRecord:
    """Publish a closed DecisionRecord and freeze its artifact snapshot.

    Publication intentionally does *not* execute the decision in Orgo. External
    execution is a separate governed action (`enqueue_decision_execution`).
    """

    require_world_runtime()
    with transaction.atomic():
        record = (
            DecisionRecord.objects.select_for_update()
            .select_related("topic", "protocol")
            .get(pk=decision_id)
        )
        if record.status == DecisionRecord.STATUS_PUBLISHED:
            return record
        if record.status != DecisionRecord.STATUS_CLOSED:
            raise DecisionLifecycleError("Only a closed decision can be published.")
        if record.closed_at is None:
            raise DecisionLifecycleError("A closed decision requires closed_at before publication.")

        record.published_at = timezone.now()
        record.status = DecisionRecord.STATUS_PUBLISHED
        # artifact_id requires a persisted primary key, which is guaranteed here.
        payload = decision_artifact_payload(record)
        record.published_payload = payload
        record.artifact_digest = sha256_jcs(payload)
        record.save(
            update_fields=[
                "status",
                "published_at",
                "published_payload",
                "artifact_digest",
                "updated_at",
            ]
        )
        return record


def enqueue_decision_execution(
    *,
    decision_id: int,
    target_organization: str,
    target_world: str | None = None,
    execution_scope: Mapping[str, Any] | None = None,
) -> InteractionEmission:
    """Create/replay one durable Konnaxion -> Orgo governed-work emission."""

    runtime = require_world_runtime()
    with transaction.atomic():
        record = DecisionRecord.objects.select_for_update().get(pk=decision_id)
        if record.status != DecisionRecord.STATUS_PUBLISHED:
            raise DecisionLifecycleError("Decision must be published before execution is requested.")
        if not record.artifact_digest or not record.published_payload:
            raise DecisionLifecycleError("Published decision artifact is incomplete.")

        envelope = build_decision_execute_envelope(
            decision_id=str(record.pk),
            revision=str(record.revision),
            artifact_digest=record.artifact_digest,
            world_key=runtime.world_key,
            world_release=runtime.release_number,
            target_organization=target_organization,
            target_world=target_world,
            effective_at=_iso(record.published_at),
            execution_scope=execution_scope,
        )
        fingerprint = request_fingerprint(envelope)
        key = envelope["idempotency_key"]

        existing = InteractionEmission.objects.select_for_update().filter(idempotency_key=key).first()
        if existing is not None:
            if existing.request_fingerprint != fingerprint:
                raise IKIdempotencyConflict(
                    "Same IK idempotency key already exists with divergent semantic content."
                )
            return existing

        emission = InteractionEmission.objects.create(
            interaction_id=envelope["id"],
            profile_id=envelope["profile"]["id"],
            profile_version=envelope["profile"]["version"],
            target_system=envelope["target"]["system"],
            target_organization=envelope["target"].get("organization") or "",
            target_world=envelope["target"].get("world") or "",
            subject_type=envelope["subject"]["type"],
            subject_id=envelope["subject"]["id"],
            idempotency_key=key,
            request_fingerprint=fingerprint,
            envelope_json=envelope,
            status=InteractionEmission.STATUS_QUEUED,
        )

        # Celery is scheduled only if the surrounding World transaction commits.
        def _schedule() -> None:
            from konnaxion.ethikos.tasks import deliver_interaction_emission_task

            deliver_interaction_emission_task.delay(runtime.release_id, emission.pk)

        transaction.on_commit(_schedule)
        return emission


def build_konnaxion_export(*, decision: DecisionRecord) -> dict[str, Any]:
    """Build source-owned ExportManifest data for a published decision.

    This returns the profile payload. Transporting it to Da'at is a separate IK
    interaction and does not transfer Konnaxion ownership.
    """

    runtime = require_world_runtime()
    if decision.status != DecisionRecord.STATUS_PUBLISHED or not decision.artifact_digest:
        raise DecisionLifecycleError("Only a fully published decision can be exported.")
    return {
        "id": f"kx-export:decision:{decision.pk}:r{decision.revision}",
        "profile": "konnaxion.export/1.0.0",
        "producer": {"system": "konnaxion"},
        "snapshot_at": _iso(decision.published_at),
        "source_revision": str(decision.revision),
        "scope": {
            "world": runtime.world_key,
            "release": str(runtime.release_number),
        },
        "subjects": [{"type": "decision", "id": str(decision.pk)}],
        "items": [
            {
                "type": "canonical_decision_artifact",
                "ref": decision.artifact_id,
                "digest": f"sha256:{decision.artifact_digest}",
            }
        ],
        "intended_use": ["kristal_compilation"],
        "provenance": {
            "world": runtime.world_key,
            "world_release": runtime.release_number,
        },
        "integrity": {
            "algorithm": "sha256",
            "digest": sha256_jcs(decision.published_payload),
        },
    }
