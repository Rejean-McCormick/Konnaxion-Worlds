from django.core.management.base import BaseCommand, CommandError

from konnaxion.worlds.models import World, WorldRelease
from konnaxion.worlds.services.builder import promote_release


class Command(BaseCommand):
    help = "Promote one ready Konnaxion WorldRelease atomically."

    def add_arguments(self, parser):
        parser.add_argument("world_key")
        parser.add_argument("release_number", type=int)

    def handle(self, *args, **options):
        try:
            world = World.objects.get(key=options["world_key"])
            release = world.releases.get(release_number=options["release_number"])
        except (World.DoesNotExist, WorldRelease.DoesNotExist) as exc:
            raise CommandError("World or Release not found.") from exc
        promote_release(world=world, release=release)
        self.stdout.write(self.style.SUCCESS(
            f"Promoted {world.key} r{release.release_number}"
        ))
