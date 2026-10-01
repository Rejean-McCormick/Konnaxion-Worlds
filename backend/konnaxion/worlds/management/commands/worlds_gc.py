from __future__ import annotations

from collections import defaultdict

from django.core.management.base import BaseCommand, CommandError

from konnaxion.worlds.models import WorldBuildJob, WorldRelease
from konnaxion.worlds.services.builder import purge_release
from konnaxion.worlds.services.storage import database_storage_report, format_bytes


class Command(BaseCommand):
    help = (
        "Garbage-collect non-current failed/frozen WorldRelease schemas and, when requested, "
        "orphaned incomplete releases. Dry-run unless --execute is supplied."
    )

    def add_arguments(self, parser):
        parser.add_argument("--universe", help="Limit cleanup to one Universe key.")
        parser.add_argument("--failed", action="store_true", help="Include FAILED releases.")
        parser.add_argument("--frozen", action="store_true", help="Include FROZEN releases.")
        parser.add_argument(
            "--incomplete",
            action="store_true",
            help=(
                "Include non-current BUILDING/VALIDATING releases only when they have no active "
                "WorldBuildJob. Useful after interrupted/fatal local builds."
            ),
        )
        parser.add_argument(
            "--keep-frozen",
            type=int,
            default=0,
            help="When --frozen is used, retain N newest frozen releases per World (default: 0).",
        )
        parser.add_argument("--execute", action="store_true", help="Actually purge; otherwise only show candidates.")

    @staticmethod
    def _incomplete_is_orphaned(release: WorldRelease) -> bool:
        active_states = {
            WorldBuildJob.STATUS_QUEUED,
            WorldBuildJob.STATUS_BUILDING,
            WorldBuildJob.STATUS_VALIDATING,
        }
        return not any(job.status in active_states for job in release.build_jobs.all())

    def handle(self, *args, **options):
        include_failed = bool(options.get("failed"))
        include_frozen = bool(options.get("frozen"))
        include_incomplete = bool(options.get("incomplete"))
        if not include_failed and not include_frozen and not include_incomplete:
            include_failed = True

        statuses = []
        if include_failed:
            statuses.append(WorldRelease.STATUS_FAILED)
        if include_frozen:
            statuses.append(WorldRelease.STATUS_FROZEN)
        if include_incomplete:
            statuses.extend((WorldRelease.STATUS_BUILDING, WorldRelease.STATUS_VALIDATING))

        qs = (
            WorldRelease.objects.select_related("world", "world__universe")
            .prefetch_related("build_jobs")
            .filter(status__in=statuses)
        )
        universe_key = str(options.get("universe") or "").strip().lower()
        if universe_key:
            qs = qs.filter(world__universe__key=universe_key)
        qs = qs.order_by("world__key", "-release_number")

        keep_frozen = max(0, int(options.get("keep_frozen") or 0))
        frozen_seen = defaultdict(int)
        candidates = []
        skipped_active_incomplete = []
        for release in qs:
            if release.world.current_release_id == release.id:
                continue
            if release.status == WorldRelease.STATUS_FROZEN and keep_frozen:
                frozen_seen[release.world_id] += 1
                if frozen_seen[release.world_id] <= keep_frozen:
                    continue
            if release.status in {WorldRelease.STATUS_BUILDING, WorldRelease.STATUS_VALIDATING}:
                if not self._incomplete_is_orphaned(release):
                    skipped_active_incomplete.append(release)
                    continue
            candidates.append(release)

        size_report = database_storage_report(universe_key=universe_key or None)
        sizes = {row["release_id"]: row["total_bytes"] for row in size_report.get("releases", [])}
        total_bytes = sum(int(sizes.get(release.id, 0)) for release in candidates)

        mode = "EXECUTE" if options.get("execute") else "DRY-RUN"
        self.stdout.write(f"{mode}: {len(candidates)} release(s), estimated reclaim {format_bytes(total_bytes)}")
        for release in candidates:
            self.stdout.write(
                f"  {release.world.universe.key}/{release.world.key} "
                f"r{release.release_number} {release.status} {format_bytes(sizes.get(release.id, 0))}"
            )
        for release in skipped_active_incomplete:
            self.stdout.write(
                self.style.WARNING(
                    f"  KEEP active incomplete {release.world.universe.key}/{release.world.key} "
                    f"r{release.release_number} {release.status}"
                )
            )

        if not options.get("execute"):
            self.stdout.write("No changes made. Re-run with --execute to purge these non-current releases.")
            return

        purged = 0
        reclaimed = 0
        failures = []
        warning_count = 0
        for release in candidates:
            release_id = release.id
            estimate = int(sizes.get(release_id, 0))
            label = f"{release.world.universe.key}/{release.world.key} r{release.release_number}"
            try:
                result = purge_release(release=release)
            except Exception as exc:
                failures.append(f"{label}: {exc}")
                self.stderr.write(self.style.ERROR(f"SKIP {label}: {exc}"))
                continue
            purged += 1
            reclaimed += estimate
            warnings = list((result or {}).get("warnings") or [])
            warning_count += len(warnings)
            self.stdout.write(self.style.SUCCESS(f"PURGED {label}"))
            for warning in warnings:
                self.stdout.write(self.style.WARNING(f"  warning: {warning}"))

        self.stdout.write(
            f"GC complete: purged={purged} estimated_reclaimed={format_bytes(reclaimed)} "
            f"warnings={warning_count} failed={len(failures)}"
        )
        if failures:
            raise CommandError("Some releases could not be purged: " + "; ".join(failures))
