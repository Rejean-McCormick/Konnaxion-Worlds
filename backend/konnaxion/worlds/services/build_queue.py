from __future__ import annotations

from contextlib import contextmanager

from django.conf import settings
from django.db import connection

from ..models import WorldBuildJob

WORLD_BUILD_QUEUE = "world-build"
# Two-int PostgreSQL advisory-lock namespace for Konnaxion World build slots.
_WORLD_BUILD_LOCK_NAMESPACE = 1264088908
_WORLD_BUILD_JOB_LOCK_NAMESPACE = 1264088909


class WorldBuildQueueError(RuntimeError):
    pass


def world_build_concurrency() -> int:
    """Return the configured build-slot count, clamped to a sane small range."""
    raw = int(getattr(settings, "KONNAXION_WORLD_BUILD_CONCURRENCY", 1) or 1)
    return max(1, min(raw, 16))


def try_acquire_world_build_slot() -> int | None:
    """Acquire one global PostgreSQL advisory-lock slot without blocking.

    The default configuration exposes exactly one slot, so only one expensive
    schema/migration/import build can run at a time even when the Celery worker
    has higher concurrency for ordinary tasks. Raising the configured limit later
    enables controlled parallel builds without changing the API/job model.
    """
    if connection.vendor != "postgresql":
        raise WorldBuildQueueError(
            "Konnaxion World build concurrency requires PostgreSQL advisory locks."
        )

    for slot in range(world_build_concurrency()):
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT pg_try_advisory_lock(%s, %s)",
                [_WORLD_BUILD_LOCK_NAMESPACE, slot],
            )
            acquired = bool(cursor.fetchone()[0])
        if acquired:
            return slot
    return None


def try_acquire_world_build_job_lock(job_id: int) -> bool:
    """Prevent duplicate/redelivered Celery executions of one persisted job."""
    if connection.vendor != "postgresql":
        raise WorldBuildQueueError(
            "Konnaxion World build jobs require PostgreSQL advisory locks."
        )
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT pg_try_advisory_lock(%s, %s)",
            [_WORLD_BUILD_JOB_LOCK_NAMESPACE, int(job_id)],
        )
        return bool(cursor.fetchone()[0])


def release_world_build_job_lock(job_id: int) -> None:
    if connection.vendor != "postgresql":
        return
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT pg_advisory_unlock(%s, %s)",
            [_WORLD_BUILD_JOB_LOCK_NAMESPACE, int(job_id)],
        )


def release_world_build_slot(slot: int) -> None:
    if connection.vendor != "postgresql":
        return
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT pg_advisory_unlock(%s, %s)",
            [_WORLD_BUILD_LOCK_NAMESPACE, int(slot)],
        )


@contextmanager
def world_build_slot():
    slot = try_acquire_world_build_slot()
    if slot is None:
        yield None
        return
    try:
        yield slot
    finally:
        release_world_build_slot(slot)


def enqueue_world_build_job(job: WorldBuildJob) -> WorldBuildJob:
    """Submit a persisted build job to the low-memory World build queue."""
    if job.status != WorldBuildJob.STATUS_QUEUED:
        raise WorldBuildQueueError(f"Build job {job.pk} is not queued: {job.status}")

    # Local import prevents Celery autodiscovery/model import cycles at Django startup.
    from ..tasks import build_world_release_task

    async_result = build_world_release_task.apply_async(
        args=[job.pk],
        queue=WORLD_BUILD_QUEUE,
        soft_time_limit=int(
            getattr(settings, "KONNAXION_WORLD_BUILD_SOFT_TIME_LIMIT", 30 * 60)
        ),
        time_limit=int(
            getattr(settings, "KONNAXION_WORLD_BUILD_TIME_LIMIT", 45 * 60)
        ),
    )
    job.celery_task_id = async_result.id or ""
    job.queue_name = WORLD_BUILD_QUEUE
    job.save(update_fields=["celery_task_id", "queue_name", "updated_at"])
    return job
