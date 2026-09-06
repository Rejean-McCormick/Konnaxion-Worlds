from __future__ import annotations

from ..models import WorldAuditEvent


def audit(
    *,
    event_type: str,
    world=None,
    release=None,
    world_id=None,
    release_id=None,
    actor=None,
    metadata=None,
    request_id="",
):
    return WorldAuditEvent.objects.create(
        event_type=event_type,
        world=world,
        release=release,
        world_id=world_id if world is None else None,
        release_id=release_id if release is None else None,
        actor=actor if getattr(actor, "is_authenticated", False) else None,
        request_id=request_id or "",
        metadata_json=metadata or {},
    )
