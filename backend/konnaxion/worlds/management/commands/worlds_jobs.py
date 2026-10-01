from __future__ import annotations

import time
from datetime import timedelta

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from konnaxion.worlds.models import World, WorldBuildJob


def _duration(value: timedelta | None) -> str:
    if value is None:
        return "-"
    seconds = max(0, int(value.total_seconds()))
    hours, rem = divmod(seconds, 3600)
    minutes, seconds = divmod(rem, 60)
    if hours:
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    return f"{minutes:02d}:{seconds:02d}"


class Command(BaseCommand):
    help = "Show persisted World build jobs and optional live progress."

    def add_arguments(self, parser):
        parser.add_argument("--universe", help="Limit to one Universe key.")
        parser.add_argument("--world", help="Limit to one World key.")
        parser.add_argument("--watch", action="store_true", help="Refresh until no queued/running jobs remain.")
        parser.add_argument("--interval", type=float, default=2.0, help="Watch refresh interval in seconds.")
        parser.add_argument("--all", action="store_true", help="Include older terminal jobs instead of one latest job per World.")

    def _rows(self, options):
        worlds = World.objects.select_related("universe", "current_release").order_by("universe__key", "key")
        if options.get("universe"):
            worlds = worlds.filter(universe__key=str(options["universe"]).strip().lower())
        if options.get("world"):
            worlds = worlds.filter(key=str(options["world"]).strip().lower())
        if not worlds.exists():
            raise CommandError("No matching Worlds.")

        rows = []
        active = 0
        failed = 0
        now = timezone.now()
        for world in worlds:
            jobs = world.build_jobs.select_related("release").order_by("-created_at")
            if not options.get("all"):
                jobs = jobs[:1]
            if not jobs:
                rows.append(
                    {
                        "universe": world.universe.key,
                        "world": world.key,
                        "job": "-",
                        "status": "idle",
                        "release": f"r{world.current_release.release_number}" if world.current_release else "-",
                        "stage": "current" if world.current_release else "-",
                        "percent": "100" if world.current_release else "-",
                        "elapsed": "-",
                        "updated": "-",
                        "message": "",
                    }
                )
                continue
            for job in jobs:
                progress = dict((job.metadata_json or {}).get("progress") or {})
                if job.status not in WorldBuildJob.TERMINAL_STATUSES:
                    active += 1
                if job.status == WorldBuildJob.STATUS_FAILED:
                    failed += 1
                started = job.started_at or job.created_at
                finished = job.finished_at or now
                rows.append(
                    {
                        "universe": world.universe.key,
                        "world": world.key,
                        "job": str(job.id),
                        "status": job.status,
                        "release": f"r{job.release.release_number}" if job.release_id else "-",
                        "stage": progress.get("stage") or job.status,
                        "percent": str(progress.get("percent", "-")),
                        "elapsed": _duration(finished - started if started else None),
                        "updated": _duration(now - job.updated_at if job.updated_at else None),
                        "message": progress.get("message") or job.error_text or "",
                    }
                )
        return rows, active, failed

    def _render(self, options) -> tuple[int, int]:
        rows, active, failed = self._rows(options)
        header = (
            f"{'UNIVERSE':16} {'WORLD':34} {'JOB':>6} {'STATUS':11} {'REL':>5} "
            f"{'STAGE':22} {'%':>4} {'ELAPSED':>8} {'STALE':>8} MESSAGE"
        )
        self.stdout.write(header)
        self.stdout.write("-" * max(130, len(header)))
        for row in rows:
            self.stdout.write(
                f"{row['universe'][:16]:16} {row['world'][:34]:34} {row['job']:>6} "
                f"{row['status'][:11]:11} {row['release']:>5} {row['stage'][:22]:22} "
                f"{row['percent']:>4} {row['elapsed']:>8} {row['updated']:>8} {row['message']}"
            )
        self.stdout.write(f"active={active} failed={failed} rows={len(rows)}")
        return active, failed

    def handle(self, *args, **options):
        interval = max(0.5, float(options.get("interval") or 2.0))
        while True:
            active, failed = self._render(options)
            if not options.get("watch") or active == 0:
                if failed:
                    raise CommandError(f"{failed} failed build job(s).")
                return
            self.stdout.write(f"--- refresh in {interval:g}s ---")
            time.sleep(interval)
