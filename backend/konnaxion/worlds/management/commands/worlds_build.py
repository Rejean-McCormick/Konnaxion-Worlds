from django.core.management.base import BaseCommand, CommandError

from konnaxion.worlds.models import World
from konnaxion.worlds.services.builder import build_world_release


class Command(BaseCommand):
    help = "Create/build a Konnaxion WorldRelease from a Seed Pack."

    def add_arguments(self, parser):
        parser.add_argument("world_key")
        parser.add_argument("seed_pack_key")
        parser.add_argument("--seed-version")
        parser.add_argument("--title")
        parser.add_argument("--description", default="")
        parser.add_argument("--public", action="store_true")
        parser.add_argument("--create", action="store_true")
        parser.add_argument("--promote", action="store_true")

    def handle(self, *args, **options):
        key = options["world_key"]
        try:
            world = World.objects.get(key=key)
        except World.DoesNotExist:
            if not options["create"]:
                raise CommandError(f"World {key!r} does not exist. Use --create.")
            world = World.objects.create(
                key=key,
                title=options["title"] or key,
                description=options["description"],
                visibility=(
                    World.VISIBILITY_PUBLIC if options["public"] else World.VISIBILITY_PRIVATE
                ),
            )
        release = build_world_release(
            world=world,
            seed_pack_key=options["seed_pack_key"],
            seed_version=options["seed_version"],
            promote=options["promote"],
        )
        self.stdout.write(self.style.SUCCESS(
            f"Built {world.key} r{release.release_number} status={release.status}"
        ))
