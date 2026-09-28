from __future__ import annotations

from django.core.exceptions import PermissionDenied
from django.http import Http404

from .models import Universe, UniverseMembership, World, WorldMembership, WorldRelease
from .runtime import WorldRuntime


class WorldUnavailable(Http404):
    """Raised when a Universe/World must not be served to the current request."""


def can_manage_universe(user, universe: Universe) -> bool:
    if not user or not getattr(user, "is_authenticated", False):
        return False
    if user.is_staff or user.is_superuser or universe.created_by_id == user.pk:
        return True
    return UniverseMembership.objects.filter(
        universe=universe,
        user=user,
        is_active=True,
        role__in=(UniverseMembership.ROLE_OWNER, UniverseMembership.ROLE_MAINTAINER),
    ).exists()


def can_access_universe(user, universe: Universe) -> bool:
    if universe.visibility == Universe.VISIBILITY_PUBLIC:
        return True
    if user and getattr(user, "is_authenticated", False):
        if can_manage_universe(user, universe):
            return True
        return UniverseMembership.objects.filter(
            universe=universe,
            user=user,
            is_active=True,
        ).exists()
    return False


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
    # Universe is an outer governance boundary. A public World inside a private
    # Universe is not visible to users who cannot enter that Universe.
    if not can_access_universe(user, world.universe):
        return False
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


def _runtime_for_world(world: World, *, user=None) -> WorldRuntime:
    universe = world.universe
    if universe.status == Universe.STATUS_ARCHIVED:
        raise WorldUnavailable(f"Universe {universe.key} is archived.")
    if universe.status == Universe.STATUS_MAINTENANCE and not can_manage_universe(user, universe):
        raise WorldUnavailable(f"Universe {universe.key} is in maintenance mode.")
    if world.status == World.STATUS_ARCHIVED:
        raise WorldUnavailable(f"World {world.key} is archived.")
    if not can_access_world(user, world):
        raise PermissionDenied("You do not have access to this World.")
    if world.status == World.STATUS_MAINTENANCE and not can_manage_world(user, world):
        raise WorldUnavailable(f"World {world.key} is in maintenance mode.")

    release = world.current_release
    if release is None:
        raise WorldUnavailable(f"World {world.key} has no current release.")
    if release.world_id != world.id:
        raise WorldUnavailable("World current release points to another World.")
    if release.status != WorldRelease.STATUS_CURRENT:
        raise WorldUnavailable(
            f"World {world.key} current release is not CURRENT ({release.status})."
        )

    return WorldRuntime(
        universe_id=universe.id,
        universe_key=universe.key,
        world_id=world.id,
        world_key=world.key,
        release_id=release.id,
        release_number=release.release_number,
        domain_schema=release.domain_schema,
        ekoh_schema=release.ekoh_schema,
        is_dirty=release.is_dirty,
    )


def resolve_world_runtime(*, world_key: str, user=None, universe_key: str | None = None) -> WorldRuntime:
    qs = World.objects.select_related("universe", "current_release")
    try:
        if universe_key is None:
            # Phase U1 compatibility route. World.key remains globally unique until
            # the old /w/<world>/ route is retired.
            world = qs.get(key=world_key)
        else:
            world = qs.get(key=world_key, universe__key=universe_key)
    except World.DoesNotExist as exc:
        if universe_key:
            detail = f"Unknown Konnaxion World: {universe_key}/{world_key}"
        else:
            detail = f"Unknown Konnaxion World: {world_key}"
        raise WorldUnavailable(detail) from exc
    return _runtime_for_world(world, user=user)


def runtime_from_release(release: WorldRelease) -> WorldRuntime:
    """Build an explicit runtime for control-plane/build/task operations."""
    world = release.world
    universe = world.universe
    return WorldRuntime(
        universe_id=universe.id,
        universe_key=universe.key,
        world_id=release.world_id,
        world_key=world.key,
        release_id=release.id,
        release_number=release.release_number,
        domain_schema=release.domain_schema,
        ekoh_schema=release.ekoh_schema,
        is_dirty=release.is_dirty,
    )
