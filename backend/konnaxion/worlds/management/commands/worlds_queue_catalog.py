from __future__ import annotations

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from konnaxion.worlds.models import World, WorldBuildJob
from konnaxion.worlds.services.build_queue import enqueue_world_build_job
from konnaxion.worlds.services.seed_packs import SeedPackError, discover_seed_packs


class Command(BaseCommand):
    help = (
        "Queue Seed Pack builds for the World catalog. Builds are resource-limited "
        "globally (default: one at a time)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--create-missing",
            action="store_true",
            help="Create missing World registry rows from Seed Pack metadata.",
        )
        parser.add_argument(
            "--promote",
            action="store_true",
            help="Promote each successfully built Release after validation.",
        )
        parser.add_argument(
            "--public",
            action="store_true",
            help="When creating Worlds, make them public instead of private.",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Queue even when the current Release already matches the Seed Pack checksum.",
        )
        parser.add_argument(
            "--world",
            action="append",
            dest="world_keys",
            help="Limit to one or more World keys. May be repeated.",
        )

    def handle(self, *args, **options):
        try:
            packs = discover_seed_packs(persist=True)
        except SeedPackError as exc:
            raise CommandError(str(exc)) from exc

        selected = {str(key).strip().lower() for key in (options["world_keys"] or []) if key}
        if selected:
            packs = [pack for pack in packs if pack.world_key in selected]
            missing = selected - {pack.world_key for pack in packs}
            if missing:
                raise CommandError(f"Seed Pack(s) not found: {', '.join(sorted(missing))}")

        queued = skipped = failed = created = 0
        for pack in packs:
            try:
                world = World.objects.select_related("current_release").get(key=pack.world_key)
            except World.DoesNotExist:
                if not options["create_missing"]:
                    self.stdout.write(self.style.WARNING(
                        f"SKIP {pack.world_key}: World does not exist (use --create-missing)."
                    ))
                    skipped += 1
                    continue
                world = World.objects.create(
                    key=pack.world_key,
                    title=pack.title,
                    visibility=(
                        World.VISIBILITY_PUBLIC if options["public"] else World.VISIBILITY_PRIVATE
                    ),
                )
                created += 1

            if world.status == World.STATUS_ARCHIVED:
                self.stdout.write(self.style.WARNING(f"SKIP {world.key}: archived."))
                skipped += 1
                continue

            active_job = world.build_jobs.filter(
                status__in=(
                    WorldBuildJob.STATUS_QUEUED,
                    WorldBuildJob.STATUS_BUILDING,
                    WorldBuildJob.STATUS_VALIDATING,
                ),
                seed_pack_key=pack.world_key,
                seed_version=pack.version,
            ).first()
            if active_job:
                self.stdout.write(
                    f"SKIP {world.key}: build job {active_job.id} already {active_job.status}."
                )
                skipped += 1
                continue

            current = world.current_release
            if (
                not options["force"]
                and current is not None
                and current.seed_checksum
                and current.seed_checksum == pack.checksum
            ):
                self.stdout.write(f"SKIP {world.key}: current Release already matches {pack.version}.")
                skipped += 1
                continue

            job = WorldBuildJob.objects.create(
                world=world,
                seed_pack_key=pack.world_key,
                seed_version=pack.version,
                promote_after_build=bool(options["promote"]),
                metadata_json={
                    "architecture_lock": "KX-WORLDS-1",
                    "source": "worlds_queue_catalog",
                    "seed_checksum": pack.checksum,
                    "scenario_count": len(pack.scenario_paths),
                },
            )
            try:
                enqueue_world_build_job(job)
            except Exception as exc:
                job.status = WorldBuildJob.STATUS_FAILED
                job.error_text = str(exc)
                job.finished_at = timezone.now()
                job.save(update_fields=["status", "error_text", "finished_at", "updated_at"])
                self.stderr.write(self.style.ERROR(f"FAIL {world.key}: {exc}"))
                failed += 1
                continue

            self.stdout.write(
                self.style.SUCCESS(
                    f"QUEUED {world.key} {pack.version}: job={job.id} task={job.celery_task_id}"
                )
            )
            queued += 1

        self.stdout.write(
            f"Catalog queue complete: queued={queued} skipped={skipped} "
            f"created={created} failed={failed}."
        )
        if failed:
            raise CommandError(f"{failed} build job(s) could not be enqueued.")
