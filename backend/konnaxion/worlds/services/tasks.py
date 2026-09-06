from __future__ import annotations

from contextlib import contextmanager

from django.db import transaction

from ..db import world_db_scope
from ..models import World, WorldRelease
from ..resolver import runtime_from_release


class WorldTaskContextError(RuntimeError):
    pass


def get_task_release(*, world_id: int, release_id: int) -> WorldRelease:
    """Resolve an exact task target and reject stale/non-current releases.

    This light-weight resolver is useful for validation outside a task scope.
    Mutation tasks MUST use ``world_task_scope`` so promotion and execution are
    serialized against the release row for the full task transaction.
    """
    if not world_id or not release_id:
        raise WorldTaskContextError("World-scoped task requires world_id and release_id.")
    try:
        release = WorldRelease.objects.select_related("world").get(
            pk=release_id, world_id=world_id
        )
    except WorldRelease.DoesNotExist as exc:
        raise WorldTaskContextError(
            f"Unknown World task context world={world_id} release={release_id}."
        ) from exc
    if (
        release.status != WorldRelease.STATUS_CURRENT
        or release.world.current_release_id != release.id
    ):
        raise WorldTaskContextError(
            f"Stale World task context world={world_id} release={release_id}; "
            "mutation tasks may only target the exact CURRENT release."
        )
    return release


@contextmanager
def world_task_scope(*, world_id: int, release_id: int):
    """Pin a mutation task to the exact CURRENT release for its full lifetime.

    The release row is locked until the task transaction completes. Promotion
    locks that same row before freezing the previous current release, so a task
    either finishes before promotion or observes the release as stale and fails
    closed. This prevents delayed Celery work from mutating immutable history.
    """
    if not world_id or not release_id:
        raise WorldTaskContextError("World-scoped task requires world_id and release_id.")

    with transaction.atomic():
        try:
            release = (
                WorldRelease.objects.select_for_update()
                .select_related("world")
                .get(pk=release_id, world_id=world_id)
            )
        except WorldRelease.DoesNotExist as exc:
            raise WorldTaskContextError(
                f"Unknown World task context world={world_id} release={release_id}."
            ) from exc

        # Read the control-plane pointer after acquiring the release lock. If a
        # promotion is in flight, the lock ordering guarantees one side waits.
        is_current = World.objects.filter(
            pk=world_id, current_release_id=release_id
        ).exists()
        if release.status != WorldRelease.STATUS_CURRENT or not is_current:
            raise WorldTaskContextError(
                f"Stale World task context world={world_id} release={release_id}; "
                "mutation tasks may only target the exact CURRENT release."
            )

        runtime = runtime_from_release(release)
        with world_db_scope(runtime):
            yield release
