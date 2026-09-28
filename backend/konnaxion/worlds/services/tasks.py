from __future__ import annotations

import logging
from contextlib import contextmanager
from typing import Any

from celery import Task
from celery.exceptions import Retry
from django.db import transaction

from ..db import world_db_scope
from ..models import World, WorldRelease
from ..resolver import runtime_from_release

LOGGER = logging.getLogger(__name__)


class WorldTaskContextError(RuntimeError):
    pass


PINNED_TASK_RELEASE_STATUSES = frozenset(
    {
        WorldRelease.STATUS_READY,
        WorldRelease.STATUS_CURRENT,
        WorldRelease.STATUS_FROZEN,
    }
)


def _validate_task_ids(*, world_id: int | None, release_id: int | None) -> tuple[int, int]:
    if not world_id or not release_id:
        raise WorldTaskContextError(
            "World-scoped task requires explicit world_id and release_id."
        )
    return int(world_id), int(release_id)


def get_task_release(
    *,
    world_id: int,
    release_id: int,
    require_current: bool = False,
) -> WorldRelease:
    """Resolve the exact release named by an async task.

    The exact queued release is authoritative. READY/CURRENT/FROZEN releases are
    eligible; callers may opt into ``require_current=True`` only for operations
    whose business semantics explicitly require the current pointer.
    """
    world_id, release_id = _validate_task_ids(
        world_id=world_id, release_id=release_id
    )
    try:
        release = WorldRelease.objects.select_related("world").get(
            pk=release_id, world_id=world_id
        )
    except WorldRelease.DoesNotExist as exc:
        raise WorldTaskContextError(
            f"Unknown World task context world={world_id} release={release_id}."
        ) from exc

    if require_current:
        if (
            release.status != WorldRelease.STATUS_CURRENT
            or release.world.current_release_id != release.id
        ):
            raise WorldTaskContextError(
                f"Stale World task context world={world_id} release={release_id}; "
                "mutation tasks may only target the exact CURRENT release."
            )
    elif release.status not in PINNED_TASK_RELEASE_STATUSES:
        raise WorldTaskContextError(
            f"Unavailable World task context world={world_id} release={release_id} "
            f"status={release.status}."
        )
    return release


@contextmanager
def world_release_scope(
    *,
    world_id: int,
    release_id: int,
    require_current: bool = False,
):
    """Pin work to the exact named WorldRelease for the full DB transaction."""
    world_id, release_id = _validate_task_ids(
        world_id=world_id, release_id=release_id
    )

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

        if require_current:
            is_current = World.objects.filter(
                pk=world_id, current_release_id=release_id
            ).exists()
            if release.status != WorldRelease.STATUS_CURRENT or not is_current:
                raise WorldTaskContextError(
                    f"Stale World task context world={world_id} release={release_id}; "
                    "mutation tasks may only target the exact CURRENT release."
                )
        elif release.status not in PINNED_TASK_RELEASE_STATUSES:
            raise WorldTaskContextError(
                f"Unavailable World task context world={world_id} release={release_id} "
                f"status={release.status}."
            )

        runtime = runtime_from_release(release)
        with world_db_scope(runtime):
            yield release


@contextmanager
def world_task_scope(*, world_id: int, release_id: int):
    """Pin async work to the exact queued release, never to a later current one."""
    with world_release_scope(
        world_id=world_id,
        release_id=release_id,
        require_current=False,
    ) as release:
        yield release


@contextmanager
def current_world_task_scope(*, world_id: int, release_id: int):
    """Opt-in scope for operations that must still target the current pointer."""
    with world_release_scope(
        world_id=world_id,
        release_id=release_id,
        require_current=True,
    ) as release:
        yield release


class PinnedWorldTask(Task):
    """Celery base that fails closed unless world_id + release_id are explicit."""

    abstract = True
    require_current_release = False

    def __call__(self, *args: Any, **kwargs: Any):
        world_id = kwargs.get("world_id")
        release_id = kwargs.get("release_id")
        world_id, release_id = _validate_task_ids(
            world_id=world_id, release_id=release_id
        )
        retry_exc: Retry | None = None
        with world_release_scope(
            world_id=world_id,
            release_id=release_id,
            require_current=bool(self.require_current_release),
        ):
            LOGGER.debug(
                "Executing World task %s world=%s release=%s",
                self.name,
                world_id,
                release_id,
            )
            try:
                return super().__call__(*args, **kwargs)
            except Retry as exc:
                # Celery Retry is control flow, not a failed transaction.  Let the
                # scoped transaction/search_path commit first (for example a
                # RETRYING status update), then re-raise outside the scope so
                # Celery can schedule the retry.  Real exceptions still roll back.
                retry_exc = exc

        if retry_exc is not None:
            raise retry_exc
        raise AssertionError("unreachable")


class CurrentWorldTask(PinnedWorldTask):
    """Celery base for tasks that mutate current World-owned state."""

    abstract = True
    require_current_release = True


def current_world_release_targets() -> list[tuple[int, int]]:
    """Return stable control-plane IDs for every active current WorldRelease."""
    return list(
        World.objects.filter(
            status=World.STATUS_ACTIVE,
            current_release__status=WorldRelease.STATUS_CURRENT,
        )
        .exclude(current_release_id__isnull=True)
        .order_by("id")
        .values_list("id", "current_release_id")
    )


def enqueue_for_current_releases(
    task,
    *,
    kwargs: dict[str, Any] | None = None,
    queue: str | None = None,
) -> int:
    """Fan a periodic/global coordinator out to release-pinned Celery tasks."""
    scheduled = 0
    common = dict(kwargs or {})
    for world_id, release_id in current_world_release_targets():
        task_kwargs = {
            **common,
            "world_id": int(world_id),
            "release_id": int(release_id),
        }
        options = {"kwargs": task_kwargs}
        if queue:
            options["queue"] = queue
        task.apply_async(**options)
        scheduled += 1
    return scheduled
