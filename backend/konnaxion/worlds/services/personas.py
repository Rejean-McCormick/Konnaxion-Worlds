from __future__ import annotations

import hashlib

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from ..models import WorldPersona, WorldPersonaBridge
from ..runtime import require_world_runtime


def _username_max_length() -> int:
    User = get_user_model()
    return int(getattr(User._meta.get_field("username"), "max_length", 150) or 150)


def bridge_username(*, source_key: str, requested_username: str) -> str:
    runtime = require_world_runtime()
    return bridge_username_for_release(
        world_id=runtime.world_id,
        release_id=runtime.release_id,
        source_key=source_key,
        requested_username=requested_username,
    )


def bridge_username_for_release(
    *, world_id: int, release_id: int, source_key: str, requested_username: str
) -> str:
    """Return a deterministic release-local auth username.

    The hash suffix prevents truncation collisions when two long requested
    usernames share the same prefix.  It also keeps the identity stable across
    idempotent imports of the same release.
    """
    prefix = f"w{int(world_id)}r{int(release_id)}__"
    raw = requested_username.strip() or source_key.strip() or "persona"
    digest = hashlib.sha256(f"{source_key}\0{raw}".encode("utf-8")).hexdigest()[:10]
    suffix = f"__{digest}"
    max_length = _username_max_length()
    room = max(1, max_length - len(prefix) - len(suffix))
    return f"{prefix}{raw[:room]}{suffix}"


def register_persona_bridge(*, source_key: str, display_name: str, bridge_user, metadata=None):
    runtime = require_world_runtime()
    metadata = dict(metadata or {})
    persona, _ = WorldPersona.objects.get_or_create(
        world_id=runtime.world_id,
        source_key=source_key,
        defaults={
            "display_name": display_name,
            "persona_type": WorldPersona.TYPE_DEMO_ACTOR,
            "metadata_json": metadata,
        },
    )
    WorldPersonaBridge.objects.update_or_create(
        persona=persona,
        release_id=runtime.release_id,
        defaults={
            "bridge_user": bridge_user,
            "display_name": display_name,
            "metadata_json": metadata,
        },
    )
    return persona


def _copy_bridge_user(source_user, *, username: str):
    User = get_user_model()
    candidate_fields = (
        "email",
        "name",
        "account_type",
        "is_klone",
        "is_ethikos_elite",
        "is_active",
        "avatar",
    )
    values = {}
    field_names = {field.name for field in User._meta.concrete_fields}
    for name in candidate_fields:
        if name in field_names:
            values[name] = getattr(source_user, name)
    # World personas are never elevated principals.
    for name in ("is_staff", "is_superuser"):
        if name in field_names:
            values[name] = False
    user = User(username=username, **values)
    user.set_unusable_password()
    user.save()
    return user


def clone_persona_bridges(*, source_release, target_release) -> dict[int, int]:
    """Clone release bridge users and return old_user_id -> new_user_id.

    Bridge users are duplicated even for snapshots inside the same World. This
    is deliberate: release snapshots must remain immutable even if persona
    account attributes later change.
    """
    mapping: dict[int, int] = {}
    bridges = (
        WorldPersonaBridge.objects.select_related("persona", "bridge_user")
        .filter(release=source_release)
        .order_by("id")
    )
    for source_bridge in bridges:
        source_persona = source_bridge.persona
        if source_release.world_id == target_release.world_id:
            target_persona = source_persona
        else:
            target_persona, _ = WorldPersona.objects.get_or_create(
                world_id=target_release.world_id,
                source_key=source_persona.source_key,
                defaults={
                    "display_name": source_bridge.display_name or source_persona.display_name,
                    "persona_type": source_persona.persona_type,
                    "metadata_json": dict(source_persona.metadata_json or {}),
                },
            )

        requested = (source_bridge.metadata_json or {}).get("requested_username")
        if not requested:
            # Older bridge usernames may not have the hash suffix; source_key is
            # the stable identity, so readability here is best-effort only.
            raw = source_bridge.bridge_user.username
            requested = raw.split("__", 1)[-1] if "__" in raw else raw
        username = bridge_username_for_release(
            world_id=target_release.world_id,
            release_id=target_release.id,
            source_key=target_persona.source_key,
            requested_username=str(requested),
        )
        target_user = _copy_bridge_user(source_bridge.bridge_user, username=username)
        WorldPersonaBridge.objects.create(
            persona=target_persona,
            release=target_release,
            bridge_user=target_user,
            display_name=source_bridge.display_name,
            metadata_json=dict(source_bridge.metadata_json or {}),
        )
        mapping[source_bridge.bridge_user_id] = target_user.id
    return mapping


def promote_persona_bridges(release) -> None:
    """Atomically move stable personas to the bridge data of a promoted release."""
    bridges = list(
        WorldPersonaBridge.objects.select_related("persona")
        .filter(release=release)
        .order_by("persona_id")
    )
    if not bridges:
        return
    personas = []
    now = timezone.now()
    for bridge in bridges:
        persona = bridge.persona
        persona.bridge_user_id = bridge.bridge_user_id
        persona.display_name = bridge.display_name
        persona.metadata_json = dict(bridge.metadata_json or {})
        persona.updated_at = now
        personas.append(persona)
    WorldPersona.objects.bulk_update(
        personas,
        ["bridge_user", "display_name", "metadata_json", "updated_at"],
    )


def cleanup_orphan_bridge_users(user_ids: list[int] | tuple[int, ...] | set[int]) -> int:
    """Delete release bridge accounts no longer referenced by the control plane.

    This is intentionally conservative.  A user still referenced by another
    bridge or by a stable WorldPersona is retained.  Staff/superusers are never
    eligible for automatic cleanup.
    """
    ids = {int(value) for value in user_ids if value}
    if not ids:
        return 0
    User = get_user_model()
    filters = {
        "pk__in": ids,
        "world_persona_bridges__isnull": True,
        "current_world_personas__isnull": True,
        "is_staff": False,
        "is_superuser": False,
    }
    if "is_klone" in {field.name for field in User._meta.concrete_fields}:
        filters["is_klone"] = True
    qs = User.objects.filter(**filters).distinct()
    count = qs.count()
    if count:
        with transaction.atomic():
            qs.delete()
    return count


def release_bridge_user_ids(*, release_id: int | None = None) -> list[int]:
    """Return auth bridge ids visible inside one World release.

    The release defaults to the active runtime.  This helper is the canonical
    boundary for APIs that accept/reference users from a World-scoped model.
    """
    if release_id is None:
        release_id = require_world_runtime().release_id
    return list(
        WorldPersonaBridge.objects.filter(release_id=int(release_id))
        .values_list("bridge_user_id", flat=True)
        .order_by("bridge_user_id")
    )


def user_belongs_to_release(*, user_id: int, release_id: int | None = None) -> bool:
    if release_id is None:
        release_id = require_world_runtime().release_id
    return WorldPersonaBridge.objects.filter(
        release_id=int(release_id), bridge_user_id=int(user_id)
    ).exists()
