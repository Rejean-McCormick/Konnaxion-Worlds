from __future__ import annotations

import hashlib
import json

from ..models import WorldRelease, WorldSnapshot
from .audit import audit
from .builder import clone_release_state, promote_release


def create_snapshot(*, world, label: str, actor=None) -> WorldSnapshot:
    source = world.current_release
    if source is None:
        raise ValueError("World has no current release to snapshot.")
    snapshot = WorldSnapshot.objects.create(
        world=world,
        source_release=source,
        label=label,
        created_by=actor if getattr(actor, "is_authenticated", False) else None,
    )
    try:
        frozen = clone_release_state(
            source=source,
            target_world=world,
            actor=actor,
            reason="snapshot",
            target_status=WorldRelease.STATUS_FROZEN,
        )
        manifest = {
            "architecture_lock": "KX-WORLDS-1",
            "source_release_id": source.id,
            "frozen_release_id": frozen.id,
            "source_release_number": source.release_number,
        }
        checksum = hashlib.sha256(json.dumps(manifest, sort_keys=True).encode("utf-8")).hexdigest()
        snapshot.frozen_release = frozen
        snapshot.status = WorldSnapshot.STATUS_READY
        snapshot.manifest_json = manifest
        snapshot.artifact_location = f"postgres://world-release/{frozen.id}"
        snapshot.checksum = checksum
        snapshot.save(update_fields=["frozen_release", "status", "manifest_json", "artifact_location", "checksum"])
        audit(event_type="snapshot_created", world=world, release=source, actor=actor, metadata={"snapshot_id": snapshot.id})
        return snapshot
    except Exception as exc:
        snapshot.status = WorldSnapshot.STATUS_FAILED
        snapshot.manifest_json = {"error": str(exc)}
        snapshot.save(update_fields=["status", "manifest_json"])
        raise


def restore_snapshot(*, snapshot: WorldSnapshot, actor=None, promote: bool = False):
    if snapshot.status != WorldSnapshot.STATUS_READY or snapshot.frozen_release is None:
        raise ValueError("Snapshot is not restorable.")
    restored = clone_release_state(
        source=snapshot.frozen_release,
        target_world=snapshot.world,
        actor=actor,
        reason="snapshot_restore",
        target_status=WorldRelease.STATUS_READY,
    )
    audit(event_type="snapshot_restored", world=snapshot.world, release=restored, actor=actor, metadata={"snapshot_id": snapshot.id})
    if promote:
        promote_release(world=snapshot.world, release=restored, actor=actor)
    return restored
