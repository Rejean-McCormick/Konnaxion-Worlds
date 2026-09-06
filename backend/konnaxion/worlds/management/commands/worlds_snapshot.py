from django.core.management.base import BaseCommand, CommandError

from konnaxion.worlds.models import World
from konnaxion.worlds.services.snapshots import create_snapshot


class Command(BaseCommand):
    help = "Capture a live World as an isolated frozen release."

    def add_arguments(self, parser):
        parser.add_argument("world_key")
        parser.add_argument("label")

    def handle(self, *args, **options):
        try:
            world = World.objects.get(key=options["world_key"])
        except World.DoesNotExist as exc:
            raise CommandError("World not found.") from exc
        snapshot = create_snapshot(world=world, label=options["label"])
        self.stdout.write(self.style.SUCCESS(
            f"Snapshot {snapshot.id} ready: frozen release {snapshot.frozen_release_id}"
        ))
