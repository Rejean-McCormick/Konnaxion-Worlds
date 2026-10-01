from __future__ import annotations

import time

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from konnaxion.worlds.models import WorldBuildJob, WorldRelease
from konnaxion.worlds.services.audit import audit
from konnaxion.worlds.services.build_queue import (
    release_world_build_job_lock,
    release_world_build_slot,
    try_acquire_world_build_job_lock,
    try_acquire_world_build_slot,
)
from konnaxion.worlds.services.builder import build_world_release
from konnaxion.worlds.services.seed_packs import SeedPackError, get_registered_seed_pack


def _persist_progress(job_id: int, release: WorldRelease) -> None:
    job = WorldBuildJob.objects.filter(pk=job_id).first()
    if job is None:
        return
    metadata = dict(job.metadata_json or {})
    progress = dict((release.build_metadata_json or {}).get("progress") or {})
    if progress:
        metadata["progress"] = progress
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
        "metadata_json": metadata,
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


class Command(BaseCommand):
    help = "Run one persisted WorldBuildJob locally without a Celery broker."

    def add_arguments(self, parser):
        parser.add_argument("job_id", type=int)
        parser.add_argument(
            "--wait-slot",
            action="store_true",
            help="Wait until a configured PostgreSQL build slot becomes available.",
        )
        parser.add_argument("--slot-poll-seconds", type=float, default=1.0)

    def handle(self, *args, **options):
        job_id = int(options["job_id"])
        poll = max(0.2, float(options.get("slot_poll_seconds") or 1.0))
        try:
            job = WorldBuildJob.objects.select_related("world", "requested_by", "release").get(pk=job_id)
        except WorldBuildJob.DoesNotExist as exc:
            raise CommandError(f"WorldBuildJob not found: {job_id}") from exc

        if job.status in WorldBuildJob.TERMINAL_STATUSES:
            self.stdout.write(f"job={job.id} status={job.status} release={job.release_id or '-'}")
            return
        if job.status != WorldBuildJob.STATUS_QUEUED:
            raise CommandError(f"WorldBuildJob {job.id} is not queued: {job.status}")
        if not try_acquire_world_build_job_lock(job.id):
            raise CommandError(f"WorldBuildJob {job.id} is already executing.")

        slot = None
        try:
            while slot is None:
                slot = try_acquire_world_build_slot()
                if slot is not None:
                    break
                if not options.get("wait_slot"):
                    raise CommandError("No World build concurrency slot is available.")
                time.sleep(poll)

            with transaction.atomic():
                locked = WorldBuildJob.objects.select_for_update().select_related("world").get(pk=job.id)
                if locked.status != WorldBuildJob.STATUS_QUEUED:
                    raise CommandError(f"WorldBuildJob {locked.id} changed state: {locked.status}")
                locked.status = WorldBuildJob.STATUS_BUILDING
                locked.started_at = locked.started_at or timezone.now()
                locked.concurrency_slot = slot
                locked.attempts = int(locked.attempts or 0) + 1
                locked.save(
                    update_fields=[
                        "status", "started_at", "concurrency_slot", "attempts", "updated_at"
                    ]
                )

            job = WorldBuildJob.objects.select_related("world", "requested_by").get(pk=job.id)
            audit(
                event_type="release_build_job_started",
                world=job.world,
                actor=job.requested_by,
                metadata={
                    "build_job_id": job.id,
                    "concurrency_slot": slot,
                    "runner": "local_process",
                },
            )
            try:
                resolved_pack, seed_record = get_registered_seed_pack(job.seed_pack_key, job.seed_version)
                expected_checksum = str((job.metadata_json or {}).get("seed_checksum") or "")
                if expected_checksum and resolved_pack.checksum != expected_checksum:
                    raise SeedPackError(
                        f"Queued Seed Pack checksum drift for {job.seed_pack_key}@{job.seed_version}: "
                        f"expected {expected_checksum}, got {resolved_pack.checksum}."
                    )

                def progress(release):
                    _persist_progress(job.id, release)
                    detail = dict((release.build_metadata_json or {}).get("progress") or {})
                    stage = detail.get("stage") or release.status
                    percent = detail.get("percent")
                    pct = f" {percent}%" if percent is not None else ""
                    message = detail.get("message") or ""
                    self.stderr.write(
                        f"job={job.id} {job.world.key} r{release.release_number} {stage}{pct} {message}".rstrip()
                    )

                release = build_world_release(
                    world=job.world,
                    seed_pack_key=job.seed_pack_key,
                    seed_version=job.seed_version or None,
                    actor=job.requested_by,
                    promote=job.promote_after_build,
                    progress_callback=progress,
                    resolved_pack=resolved_pack,
                    seed_record=seed_record,
                )
            except Exception as exc:
                failure_text = str(exc)
                # Provider hard-limit errors may leave the child connection closed
                # or unusable. Reconnect once, then record failure best-effort.
                # Never replace the original failure with bookkeeping noise.
                try:
                    from django.db import connection

                    if not connection.in_atomic_block:
                        connection.close()
                        connection.ensure_connection()
                    WorldBuildJob.objects.filter(pk=job.id).update(
                        status=WorldBuildJob.STATUS_FAILED,
                        error_text=failure_text,
                        finished_at=timezone.now(),
                        updated_at=timezone.now(),
                    )
                    current_release_id = WorldBuildJob.objects.filter(pk=job.id).values_list(
                        "release_id", flat=True
                    ).first()
                    try:
                        audit(
                            event_type="release_build_job_failed",
                            world=job.world,
                            release_id=current_release_id,
                            actor=job.requested_by,
                            metadata={
                                "build_job_id": job.id,
                                "error": failure_text,
                                "runner": "local_process",
                            },
                        )
                    except Exception:
                        pass
                except Exception:
                    try:
                        connection.close()
                    except Exception:
                        pass
                raise CommandError(failure_text) from exc

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
                actor=job.requested_by,
                metadata={
                    "build_job_id": job.id,
                    "promoted": job.promote_after_build,
                    "runner": "local_process",
                },
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f"job={job.id} world={job.world.key} release=r{release.release_number} status=ready"
                )
            )
        finally:
            if slot is not None:
                release_world_build_slot(slot)
            release_world_build_job_lock(job.id)
