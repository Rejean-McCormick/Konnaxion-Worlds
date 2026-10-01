from django.core.management.base import BaseCommand, CommandError

from konnaxion.worlds.models import World, WorldBuildJob
from konnaxion.worlds.services.build_queue import enqueue_world_build_job
from konnaxion.worlds.services.builder import build_world_release
from konnaxion.worlds.services.universes import get_or_create_universe_for_tooling
from konnaxion.worlds.services.seed_packs import SeedPackError, get_seed_pack


class Command(BaseCommand):
    help = "Create/queue a Konnaxion WorldRelease build from a Seed Pack."

    def add_arguments(self, parser):
        parser.add_argument("--universe", help="Universe key for newly created Worlds; defaults to temporary legacy container.")
        parser.add_argument("world_key")
        parser.add_argument("seed_pack_key")
        parser.add_argument("--seed-version")
        parser.add_argument("--title")
        parser.add_argument("--description", default="")
        parser.add_argument("--public", action="store_true")
        parser.add_argument("--create", action="store_true")
        parser.add_argument("--promote", action="store_true")
        parser.add_argument(
            "--sync",
            action="store_true",
            help="Run the build inline. Intended for maintenance/debug only; normal operation queues it.",
        )

    def handle(self, *args, **options):
        key = options["world_key"]
        try:
            world = World.objects.get(key=key)
        except World.DoesNotExist:
            if not options["create"]:
                raise CommandError(f"World {key!r} does not exist. Use --create.")
            world = World.objects.create(
                universe=get_or_create_universe_for_tooling(options.get("universe")),
                key=key,
                title=options["title"] or key,
                description=options["description"],
                visibility=(
                    World.VISIBILITY_PUBLIC if options["public"] else World.VISIBILITY_PRIVATE
                ),
            )

        requested_universe = str(options.get("universe") or "").strip().lower()
        if requested_universe and world.universe.key != requested_universe:
            raise CommandError(
                f"World {world.key!r} belongs to Universe {world.universe.key!r}, "
                f"not {requested_universe!r}."
            )

        if options["sync"]:
            def progress(current):
                detail = dict((current.build_metadata_json or {}).get("progress") or {})
                stage = detail.get("stage") or current.status
                percent = detail.get("percent")
                message = detail.get("message") or ""
                pct = f" {percent}%" if percent is not None else ""
                self.stderr.write(
                    f"{world.key} r{current.release_number} {stage}{pct} {message}".rstrip()
                )

            release = build_world_release(
                world=world,
                seed_pack_key=options["seed_pack_key"],
                seed_version=options["seed_version"],
                promote=options["promote"],
                progress_callback=progress,
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f"Built inline {world.key} r{release.release_number} status={release.status}"
                )
            )
            return

        try:
            pack, _record = get_seed_pack(options["seed_pack_key"], options["seed_version"])
        except SeedPackError as exc:
            raise CommandError(str(exc)) from exc

        existing = world.build_jobs.filter(
            status__in=(
                WorldBuildJob.STATUS_QUEUED,
                WorldBuildJob.STATUS_BUILDING,
                WorldBuildJob.STATUS_VALIDATING,
            ),
            seed_pack_key=pack.world_key,
            seed_version=pack.version,
            promote_after_build=bool(options["promote"]),
        ).first()
        if existing:
            self.stdout.write(
                self.style.WARNING(
                    f"Build already {existing.status}: job={existing.id} task={existing.celery_task_id}"
                )
            )
            return

        job = WorldBuildJob.objects.create(
            world=world,
            seed_pack_key=pack.world_key,
            seed_version=pack.version,
            promote_after_build=bool(options["promote"]),
            metadata_json={
                "architecture_lock": "KX-UNIVERSES-1",
                "source": "worlds_build",
                "seed_checksum": pack.checksum,
                "scenario_count": len(pack.scenario_paths),
            },
        )
        try:
            enqueue_world_build_job(job)
        except Exception as exc:
            job.status = WorldBuildJob.STATUS_FAILED
            job.error_text = str(exc)
            job.save(update_fields=["status", "error_text", "updated_at"])
            raise CommandError(f"Could not enqueue build job {job.id}: {exc}") from exc

        self.stdout.write(
            self.style.SUCCESS(
                f"Queued {world.key}: job={job.id} seed={pack.world_key}@{pack.version} "
                f"task={job.celery_task_id}"
            )
        )
