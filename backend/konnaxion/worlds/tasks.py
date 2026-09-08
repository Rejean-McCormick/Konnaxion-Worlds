from __future__ import annotations

from celery import shared_task
from django.conf import settings
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from .models import WorldBuildJob, WorldRelease
from .services.audit import audit
from .services.build_queue import (
    release_world_build_job_lock,
    release_world_build_slot,
    try_acquire_world_build_job_lock,
    try_acquire_world_build_slot,
)
from .services.builder import build_world_release


def _progress_job(job_id: int, release: WorldRelease) -> None:
    status_map = {
        WorldRelease.STATUS_BUILDING: WorldBuildJob.STATUS_BUILDING,
        WorldRelease.STATUS_VALIDATING: WorldBuildJob.STATUS_VALIDATING,
        WorldRelease.STATUS_READY: WorldBuildJob.STATUS_READY,
        WorldRelease.STATUS_CURRENT: WorldBuildJob.STATUS_READY,
        WorldRelease.STATUS_FAILED: WorldBuildJob.STATUS_FAILED,
    }
    updates = {
        "release_id": release.id,
        "status": status_map.get(release.status, WorldBuildJob.STATUS_BUILDING),
        "updated_at": timezone.now(),
    }
    if release.status in {WorldRelease.STATUS_READY, WorldRelease.STATUS_CURRENT}:
        updates["finished_at"] = timezone.now()
        updates["error_text"] = ""
    elif release.status == WorldRelease.STATUS_FAILED:
        updates["finished_at"] = timezone.now()
        updates["error_text"] = str(
            (release.validation_report_json or {}).get("error") or "World build failed."
        )
    WorldBuildJob.objects.filter(pk=job_id).update(**updates)


def _mark_interrupted_job(job: WorldBuildJob) -> None:
    message = (
        "World build worker was interrupted after the job started. "
        "The partial Release is failed closed; queue a new build after inspection."
    )
    now = timezone.now()
    if job.release_id:
        release = WorldRelease.objects.filter(pk=job.release_id, world_id=job.world_id).first()
        if release and release.status in {
            WorldRelease.STATUS_BUILDING,
            WorldRelease.STATUS_VALIDATING,
        }:
            release.status = WorldRelease.STATUS_FAILED
            release.build_finished_at = now
            release.validation_report_json = {"ok": False, "error": message, "interrupted": True}
            release.save(update_fields=["status", "build_finished_at", "validation_report_json"])

    WorldBuildJob.objects.filter(pk=job.id).update(
        status=WorldBuildJob.STATUS_FAILED,
        error_text=message,
        finished_at=now,
        updated_at=now,
    )
    audit(
        event_type="release_build_job_interrupted",
        world=job.world,
        release_id=job.release_id,
        actor=job.requested_by,
        metadata={"build_job_id": job.id, "error": message},
    )


@shared_task(
    bind=True,
    name="konnaxion.worlds.build_release",
    max_retries=None,
    acks_late=True,
    reject_on_worker_lost=True,
)
def build_world_release_task(self, job_id: int):
    """Execute one persisted World build when a resource slot is free.

    Two PostgreSQL advisory locks are used:
    - one lock per job prevents duplicate/redelivered execution;
    - a small global slot pool limits expensive builds (default: one total).

    Other build tasks retry later instead of blocking worker processes, while
    ordinary Celery work can continue on the same low-RAM worker.
    """
    retry_seconds = max(
        1, int(getattr(settings, "KONNAXION_WORLD_BUILD_RETRY_SECONDS", 5) or 5)
    )

    try:
        job = WorldBuildJob.objects.select_related("world", "requested_by", "release").get(
            pk=job_id
        )
    except WorldBuildJob.DoesNotExist:
        return {"job_id": job_id, "status": "missing"}

    if job.status in WorldBuildJob.TERMINAL_STATUSES:
        return {"job_id": job.id, "status": job.status, "release_id": job.release_id}

    if not try_acquire_world_build_job_lock(job.id):
        raise self.retry(countdown=retry_seconds)

    slot = None
    try:
        job = WorldBuildJob.objects.select_related("world", "requested_by", "release").get(pk=job_id)
        if job.status in WorldBuildJob.TERMINAL_STATUSES:
            return {"job_id": job.id, "status": job.status, "release_id": job.release_id}

        if job.status != WorldBuildJob.STATUS_QUEUED:
            task_id = str(getattr(self.request, "id", "") or "")
            if job.celery_task_id and task_id == job.celery_task_id:
                # Same Celery task id + released job lock means the previous worker
                # stopped. Never restart the same partially built Release in place.
                _mark_interrupted_job(job)
                return {"job_id": job.id, "status": "failed", "interrupted": True}
            return {
                "job_id": job.id,
                "status": job.status,
                "release_id": job.release_id,
                "ignored": True,
            }

        slot = try_acquire_world_build_slot()
        if slot is None:
            raise self.retry(countdown=retry_seconds)

        with transaction.atomic():
            locked = WorldBuildJob.objects.select_for_update().select_related("world").get(pk=job_id)
            if locked.status != WorldBuildJob.STATUS_QUEUED:
                return {
                    "job_id": locked.id,
                    "status": locked.status,
                    "release_id": locked.release_id,
                    "ignored": True,
                }
            locked.status = WorldBuildJob.STATUS_BUILDING
            locked.started_at = locked.started_at or timezone.now()
            locked.concurrency_slot = slot
            locked.attempts = F("attempts") + 1
            if not locked.celery_task_id:
                locked.celery_task_id = str(getattr(self.request, "id", "") or "")
            locked.save(
                update_fields=[
                    "status",
                    "started_at",
                    "concurrency_slot",
                    "attempts",
                    "celery_task_id",
                    "updated_at",
                ]
            )

        job = WorldBuildJob.objects.select_related("world", "requested_by").get(pk=job_id)
        actor = job.requested_by
        audit(
            event_type="release_build_job_started",
            world=job.world,
            actor=actor,
            metadata={"build_job_id": job.id, "concurrency_slot": slot},
        )

        try:
            release = build_world_release(
                world=job.world,
                seed_pack_key=job.seed_pack_key,
                seed_version=job.seed_version or None,
                actor=actor,
                promote=job.promote_after_build,
                progress_callback=lambda current: _progress_job(job.id, current),
            )
        except Exception as exc:
            # ``build_world_release`` already records Release failure when a
            # Release exists. This also covers failures before Release creation.
            current_release_id = WorldBuildJob.objects.filter(pk=job.id).values_list(
                "release_id", flat=True
            ).first()
            WorldBuildJob.objects.filter(pk=job.id).update(
                status=WorldBuildJob.STATUS_FAILED,
                error_text=str(exc),
                finished_at=timezone.now(),
                updated_at=timezone.now(),
            )
            audit(
                event_type="release_build_job_failed",
                world=job.world,
                release_id=current_release_id,
                actor=actor,
                metadata={"build_job_id": job.id, "error": str(exc)},
            )
            raise

        WorldBuildJob.objects.filter(pk=job.id).update(
            release_id=release.id,
            status=WorldBuildJob.STATUS_READY,
            error_text="",
            finished_at=timezone.now(),
            updated_at=timezone.now(),
        )
        audit(
            event_type="release_build_job_ready",
            world=job.world,
            release=release,
            actor=actor,
            metadata={"build_job_id": job.id, "promoted": job.promote_after_build},
        )
        return {"job_id": job.id, "status": "ready", "release_id": release.id}
    finally:
        if slot is not None:
            release_world_build_slot(slot)
        release_world_build_job_lock(job.id)
