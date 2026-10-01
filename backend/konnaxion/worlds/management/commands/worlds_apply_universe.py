from __future__ import annotations

import json
import os
import subprocess
import sys
import time
from statistics import median
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from konnaxion.worlds.services.seed_packs import SeedPackError, discover_seed_pack_catalog
from konnaxion.worlds.services.storage import database_storage_report, format_bytes
from konnaxion.worlds.services.universe_packs import (
    UniversePackError,
    apply_universe_pack,
    finalize_universe_pack,
    get_universe_pack,
    queue_universe_pack,
    universe_pack_status,
)


class Command(BaseCommand):
    help = (
        "Build/apply one kx-universe-pack/v1 composition. Default mode is synchronous; "
        "--queue uses persisted WorldBuildJob/Celery builds with bounded concurrency."
    )

    def add_arguments(self, parser):
        parser.add_argument("universe_key")
        parser.add_argument("--pack-version", dest="pack_version", help="Exact Universe Pack SemVer to apply.")
        parser.add_argument(
            "--promote",
            action="store_true",
            help="Promote every exact target WorldRelease, then expose declared visibility atomically.",
        )
        parser.add_argument(
            "--queue",
            action="store_true",
            help=(
                "Queue missing World builds on the world-build Celery queue instead of building inline. "
                "Existing CURRENT/READY exact releases and active exact jobs are reused."
            ),
        )
        parser.add_argument(
            "--wait",
            action="store_true",
            help="With --queue, watch jobs until all exact target releases are ready, then finalize the Universe.",
        )
        parser.add_argument(
            "--poll-seconds",
            type=float,
            default=2.0,
            help="Polling interval while --wait is active (default: 2 seconds).",
        )
        parser.add_argument(
            "--timeout-seconds",
            type=int,
            default=0,
            help="Maximum --wait duration; 0 means no command-level timeout.",
        )
        parser.add_argument(
            "--local-workers",
            type=int,
            default=0,
            help=(
                "Run queued jobs locally in up to N child Django processes (no Celery/Redis required). "
                "Implies --queue --wait and preserves final atomic Universe promotion."
            ),
        )
        parser.add_argument(
            "--quiet-progress",
            action="store_true",
            help="Suppress live progress lines; the final JSON report is still written to stdout.",
        )
        parser.add_argument(
            "--skip-storage-check",
            action="store_true",
            help="Skip the PostgreSQL/Neon capacity preflight for queued/local Universe builds.",
        )
        parser.add_argument(
            "--storage-reserve-mib",
            type=int,
            default=32,
            help=(
                "Capacity headroom kept beyond the estimated target schemas (default: 32 MiB). "
                "This absorbs provider accounting lag/catalog growth during DDL."
            ),
        )

    def _progress(self, payload: dict) -> None:
        event = payload.get("event")
        if event == "catalog":
            self.stderr.write("[catalog] discovering/validating/hashing Seed Packs once")
            return
        if event == "catalog_ready":
            self.stderr.write(f"[catalog] ready ({payload.get('pack_count', 0)} packs)")
            return
        if event == "world_start":
            self.stderr.write(
                f"[{payload.get('index')}/{payload.get('total')}] {payload.get('world')} "
                f"start {payload.get('seed')}"
            )
            return
        if event == "world_progress":
            progress = payload.get("progress") or {}
            stage = progress.get("stage") or payload.get("status") or "working"
            pct = progress.get("percent")
            detail = progress.get("message") or ""
            sub = ""
            if progress.get("stage_steps_total"):
                sub = f" {progress.get('stage_step', 0)}/{progress.get('stage_steps_total')}"
            pct_text = f" {pct}%" if pct is not None else ""
            self.stderr.write(
                f"[{payload.get('index')}/{payload.get('total')}] {payload.get('world')} "
                f"r{payload.get('release')} {stage}{sub}{pct_text} {detail}".rstrip()
            )
            return
        if event == "world_done":
            self.stderr.write(
                f"[{payload.get('index')}/{payload.get('total')}] {payload.get('world')} "
                f"{payload.get('action')} r{payload.get('release')}"
            )
            return
        if event == "world_queued":
            self.stderr.write(
                f"[{payload.get('index')}/{payload.get('total')}] {payload.get('world')} "
                f"queued job={payload.get('job')}"
            )
            return
        if event == "promoting":
            self.stderr.write(f"[universe] atomically promoting {payload.get('count', 0)} target releases")
            return
        if event == "promoted":
            self.stderr.write(f"[universe] promotion complete ({payload.get('count', 0)} changed)")
            return
        self.stderr.write(f"[{event}] {json.dumps(payload, ensure_ascii=False, default=str)}")

    def _status_signature(self, report: dict) -> tuple:
        return tuple(
            (
                row.get("world"),
                row.get("state"),
                row.get("release"),
                (row.get("progress") or {}).get("stage"),
                (row.get("progress") or {}).get("stage_step"),
                (row.get("progress") or {}).get("percent"),
                row.get("error"),
            )
            for row in report.get("worlds", [])
        )

    def _print_status(self, report: dict) -> None:
        self.stderr.write(
            f"[universe] current={report['current']} ready={report['ready']} "
            f"active={report['active']} failed={report['failed']} total={report['total']}"
        )
        for row in report.get("worlds", []):
            progress = row.get("progress") or {}
            stage = progress.get("stage") or row.get("state")
            pct = progress.get("percent")
            pct_text = f" {pct}%" if pct is not None else ""
            release = f" r{row['release']}" if row.get("release") else ""
            message = progress.get("message") or row.get("error") or ""
            self.stderr.write(
                f"  {row.get('world'):<34} {row.get('state'):<11}{release:<6} {stage}{pct_text} {message}".rstrip()
            )

    def _storage_preflight(self, *, pack, catalog, workers: int = 1, reserve_mib: int = 32) -> None:
        status = universe_pack_status(pack=pack, catalog=catalog)
        missing = max(0, int(status["total"]) - int(status["current"]) - int(status["ready"]))
        if missing == 0:
            return

        report = database_storage_report()
        limit = report.get("limit_bytes")
        if not limit:
            return
        used = int(report.get("capacity_used_bytes") or report.get("database_bytes") or 0)
        remaining = max(0, int(limit) - used)

        target_worlds = {str(row.get("world_key") or "") for row in pack.worlds}
        target_current_sizes = [
            int(row.get("total_bytes") or 0)
            for row in report.get("releases", [])
            if row.get("is_current")
            and row.get("world") in target_worlds
            and int(row.get("total_bytes") or 0) > 0
        ]
        all_current_sizes = [
            int(row.get("total_bytes") or 0)
            for row in report.get("releases", [])
            if row.get("is_current") and int(row.get("total_bytes") or 0) > 0
        ]
        sample = target_current_sizes or all_current_sizes
        typical = int(median(sample)) if sample else 0
        estimated = typical * missing if typical else 0

        configured_reserve = max(0, int(reserve_mib or 0)) * 1024 * 1024
        # Keep enough extra room for at least the concurrently executing DDL
        # workers as well as a fixed provider/accounting buffer.
        concurrency_reserve = typical * max(1, int(workers or 1)) if typical else 0
        reserve = max(configured_reserve, concurrency_reserve)
        required = estimated + reserve
        source = str(report.get("capacity_source") or "database")

        self.stderr.write(
            f"[storage] used={format_bytes(used)} limit={format_bytes(limit)} "
            f"remaining={format_bytes(remaining)} source={source} missing_targets={missing}"
            + (f" estimated_add={format_bytes(estimated)}" if estimated else "")
            + f" reserve={format_bytes(reserve)} required_headroom={format_bytes(required)}"
        )

        # A release-per-schema upgrade retains previous CURRENT releases until
        # final atomic promotion.  Refuse early unless the provider-measured
        # headroom can hold the estimated new schemas *plus* a safety reserve.
        # On Neon, neon.pg_cluster_size() is preferred because max_cluster_size
        # is enforced against that pageserver/timeline metric rather than only
        # pg_database_size(current_database()).
        if remaining <= 0 or (required and required > remaining):
            reclaim_failed = int(report.get("reclaimable_failed_bytes") or 0)
            reclaim_incomplete = int(report.get("reclaimable_incomplete_bytes") or 0)
            reclaim_frozen = int(report.get("reclaimable_frozen_bytes") or 0)
            raise UniversePackError(
                "Insufficient database headroom for the queued Universe build. "
                f"remaining={format_bytes(remaining)}, estimated_add={format_bytes(estimated)}, "
                f"reserve={format_bytes(reserve)}, source={source}. "
                f"Reclaimable failed={format_bytes(reclaim_failed)}, "
                f"incomplete={format_bytes(reclaim_incomplete)}, "
                f"frozen={format_bytes(reclaim_frozen)}. "
                "Run `python manage.py worlds_storage` and `python manage.py worlds_gc` "
                "before retrying, or use --skip-storage-check only when the provider limit is known to be safe."
            )

    @staticmethod
    def _fatal_local_build_error(message: str) -> bool:
        text = str(message or "").lower()
        markers = (
            "project size limit",
            "max_cluster_size",
            "diskfull",
            "disk full",
            "no space left on device",
            # Concurrent schema migrations must never collide. Treat any such
            # DDL collision as a run-level safety failure instead of cascading
            # through the remaining Universe jobs.
            "relation \"",
            " already exists",
        )
        if "relation \"" in text and " already exists" in text:
            return True
        return any(marker in text for marker in markers[:-2])

    def _mark_interrupted_local_jobs(self, job_ids: list[int], reason: str) -> None:
        from konnaxion.worlds.models import WorldBuildJob, WorldRelease

        if not job_ids:
            return
        now = timezone.now()
        for job in WorldBuildJob.objects.filter(pk__in=job_ids):
            if job.status in WorldBuildJob.TERMINAL_STATUSES:
                continue
            job.status = WorldBuildJob.STATUS_FAILED
            job.error_text = reason
            job.finished_at = now
            job.save(update_fields=["status", "error_text", "finished_at", "updated_at"])
            if job.release_id:
                WorldRelease.objects.filter(
                    pk=job.release_id,
                    status__in=(WorldRelease.STATUS_BUILDING, WorldRelease.STATUS_VALIDATING),
                ).update(
                    status=WorldRelease.STATUS_FAILED,
                    build_finished_at=now,
                    validation_report_json={
                        "ok": False,
                        "error": reason,
                        "interrupted": True,
                    },
                )

    def _stop_local_processes(self, running: dict[subprocess.Popen, int], reason: str) -> None:
        active_ids = []
        for proc, job_id in running.items():
            if proc.poll() is None:
                active_ids.append(job_id)
                proc.terminate()
        for proc in running:
            if proc.poll() is not None:
                continue
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
        self._mark_interrupted_local_jobs(active_ids, reason)

    def _run_local_jobs(self, job_ids: list[int], workers: int) -> None:
        from konnaxion.worlds.models import WorldBuildJob

        pending = []
        for job in WorldBuildJob.objects.filter(pk__in=job_ids).order_by("created_at"):
            if (
                job.status == WorldBuildJob.STATUS_QUEUED
                and not job.celery_task_id
                and job.queue_name == "local-world-build"
            ):
                pending.append(job.id)
        if not pending:
            return

        manage_path = str(Path(sys.argv[0]).resolve())
        env = os.environ.copy()
        env["KONNAXION_WORLD_BUILD_CONCURRENCY"] = str(workers)
        running: dict[subprocess.Popen, int] = {}
        self.stderr.write(
            f"[local] running {len(pending)} queued jobs with up to {workers} worker processes"
        )
        try:
            fatal_reason = ""
            while pending or running:
                while pending and len(running) < workers and not fatal_reason:
                    job_id = pending.pop(0)
                    proc = subprocess.Popen(
                        [
                            sys.executable,
                            manage_path,
                            "worlds_run_job",
                            str(job_id),
                            "--wait-slot",
                        ],
                        env=env,
                    )
                    running[proc] = job_id
                    self.stderr.write(f"[local] started job={job_id} pid={proc.pid}")

                finished = []
                for proc, job_id in list(running.items()):
                    code = proc.poll()
                    if code is None:
                        continue
                    finished.append(proc)
                    if code:
                        self.stderr.write(f"[local] job={job_id} exited code={code}")
                        job = WorldBuildJob.objects.filter(pk=job_id).first()
                        if job is not None and job.status not in WorldBuildJob.TERMINAL_STATUSES:
                            job.status = WorldBuildJob.STATUS_FAILED
                            job.error_text = f"Local worker process exited with code {code}."
                            job.finished_at = timezone.now()
                            job.save(update_fields=[
                                "status", "error_text", "finished_at", "updated_at"
                            ])
                        error_text = job.error_text if job is not None else ""
                        if self._fatal_local_build_error(error_text):
                            fatal_reason = (
                                "Local Universe build stopped after a fatal database/schema error: "
                                + str(error_text)
                            )
                            self.stderr.write(
                                "[local] fatal build error detected; no additional queued jobs will be started"
                            )
                    else:
                        self.stderr.write(f"[local] job={job_id} complete")

                for proc in finished:
                    running.pop(proc, None)

                if fatal_reason:
                    self._stop_local_processes(running, fatal_reason)
                    # Keep never-started jobs QUEUED so the same Universe command
                    # can resume them after storage/configuration is corrected.
                    if pending:
                        self.stderr.write(
                            f"[local] preserved {len(pending)} not-yet-started job(s) as queued for resume"
                        )
                    return

                if running and not finished:
                    time.sleep(0.5)
        except KeyboardInterrupt:
            self.stderr.write("[local] interrupt received; terminating local worker processes")
            self._stop_local_processes(
                running,
                "Local Universe build was interrupted by the operator.",
            )
            raise

    def handle(self, *args, **options):
        local_workers = max(0, int(options.get("local_workers") or 0))
        if local_workers:
            options["queue"] = True
            options["wait"] = True
        if options["wait"] and not options["queue"]:
            raise CommandError("--wait requires --queue.")
        if options["queue"] and options["promote"] and not options["wait"]:
            raise CommandError("--promote with --queue requires --wait so Universe promotion stays atomic.")
        poll_seconds = max(0.5, float(options["poll_seconds"] or 2.0))
        timeout_seconds = max(0, int(options["timeout_seconds"] or 0))
        progress = None if options["quiet_progress"] else self._progress

        try:
            pack = get_universe_pack(options["universe_key"], options.get("pack_version"))
            # One catalog discovery/hash pass for the entire command.  Status polling
            # and finalization reuse this in-memory catalog instead of rescanning disk.
            catalog = discover_seed_pack_catalog(persist=True)

            if options["queue"] and not options.get("skip_storage_check"):
                self._storage_preflight(
                    pack=pack,
                    catalog=catalog,
                    workers=local_workers or 1,
                    reserve_mib=max(0, int(options.get("storage_reserve_mib") or 0)),
                )

            if not options["queue"]:
                report = apply_universe_pack(
                    pack=pack,
                    promote=bool(options["promote"]),
                    progress_callback=progress,
                    catalog=catalog,
                )
            else:
                report = queue_universe_pack(
                    pack=pack,
                    progress_callback=progress,
                    catalog=catalog,
                    dispatch=not bool(local_workers),
                )
                if local_workers:
                    self._run_local_jobs(report.get("job_ids", []), local_workers)
                if options["wait"]:
                    started = time.monotonic()
                    previous_signature = None
                    while True:
                        status_report = universe_pack_status(pack=pack, catalog=catalog)
                        signature = self._status_signature(status_report)
                        if progress is not None and signature != previous_signature:
                            self._print_status(status_report)
                            previous_signature = signature
                        failed = [row for row in status_report["worlds"] if row.get("state") == "failed"]
                        if failed:
                            details = "; ".join(
                                f"{row['world']}: {row.get('error') or 'build failed'}" for row in failed
                            )
                            raise UniversePackError(f"Universe build failed: {details}")
                        if status_report["current"] + status_report["ready"] == status_report["total"]:
                            break
                        if timeout_seconds and time.monotonic() - started >= timeout_seconds:
                            raise UniversePackError(
                                f"Timed out after {timeout_seconds}s waiting for Universe build jobs."
                            )
                        time.sleep(poll_seconds)

                    final = finalize_universe_pack(
                        pack=pack,
                        promote=bool(options["promote"]),
                        progress_callback=progress,
                        catalog=catalog,
                    )
                    report = {
                        **report,
                        "waited": True,
                        "final": final,
                    }
        except (UniversePackError, SeedPackError) as exc:
            raise CommandError(str(exc)) from exc

        self.stdout.write(json.dumps(report, ensure_ascii=False, indent=2, default=str))
