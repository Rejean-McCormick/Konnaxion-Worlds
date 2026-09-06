from __future__ import annotations

from django.core.exceptions import PermissionDenied
from django.http import Http404

from .models import World, WorldMembership, WorldRelease
from .runtime import WorldRuntime


class WorldUnavailable(Http404):
    """Raised when a World must not be served to the current request."""


def can_manage_world(user, world: World) -> bool:
    if not user or not getattr(user, "is_authenticated", False):
        return False
    if user.is_staff or user.is_superuser or world.created_by_id == user.pk:
        return True
    return WorldMembership.objects.filter(
        world=world,
        user=user,
        is_active=True,
        role__in=(WorldMembership.ROLE_OWNER, WorldMembership.ROLE_MAINTAINER),
    ).exists()


def can_access_world(user, world: World) -> bool:
    if world.visibility == World.VISIBILITY_PUBLIC:
        return True
    if user and getattr(user, "is_authenticated", False):
        if can_manage_world(user, world):
            return True
        return WorldMembership.objects.filter(
            world=world,
            user=user,
            is_active=True,
        ).exists()
    return False


def resolve_world_runtime(*, world_key: str, user=None) -> WorldRuntime:
    try:
        world = World.objects.select_related("current_release").get(key=world_key)
    except World.DoesNotExist as exc:
        raise WorldUnavailable(f"Unknown Konnaxion World: {world_key}") from exc

    if world.status == World.STATUS_ARCHIVED:
        raise WorldUnavailable(f"World {world_key} is archived.")

    if not can_access_world(user, world):
        raise PermissionDenied("You do not have access to this World.")

    # Maintenance is deliberately fail-closed for ordinary viewers. Owners,
    # maintainers and staff can still inspect the World while repairing it.
    if world.status == World.STATUS_MAINTENANCE and not can_manage_world(user, world):
        raise WorldUnavailable(f"World {world_key} is in maintenance mode.")

    release = world.current_release
    if release is None:
        raise WorldUnavailable(f"World {world_key} has no current release.")
    if release.world_id != world.id:
        raise WorldUnavailable("World current release points to another World.")
    # A runtime pointer is only valid when the pointed release is CURRENT.
    # READY/FROZEN releases may exist, but must never become user-visible merely
    # because a control-plane pointer drifted.
    if release.status != WorldRelease.STATUS_CURRENT:
        raise WorldUnavailable(
            f"World {world_key} current release is not CURRENT ({release.status})."
        )

    return WorldRuntime(
        world_id=world.id,
        world_key=world.key,
        release_id=release.id,
        release_number=release.release_number,
        domain_schema=release.domain_schema,
        ekoh_schema=release.ekoh_schema,
        is_dirty=release.is_dirty,
    )


def runtime_from_release(release: WorldRelease) -> WorldRuntime:
    """Build an explicit runtime for control-plane/build/task operations.

    This helper intentionally does not require ``release.status == current``:
    builders, validators, snapshots and release-pinned tasks must be able to
    operate on non-current releases when they name the exact release.
    """
    return WorldRuntime(
        world_id=release.world_id,
        world_key=release.world.key,
        release_id=release.id,
        release_number=release.release_number,
        domain_schema=release.domain_schema,
        ekoh_schema=release.ekoh_schema,
        is_dirty=release.is_dirty,
    )
