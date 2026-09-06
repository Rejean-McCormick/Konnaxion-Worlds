from django.core.management.base import BaseCommand

from konnaxion.worlds.models import World


class Command(BaseCommand):
    help = "List Konnaxion Worlds and current immutable releases."

    def handle(self, *args, **options):
        rows = World.objects.select_related("current_release").order_by("key")
        if not rows.exists():
            self.stdout.write("No Worlds installed.")
            return
        for world in rows:
            release = world.current_release
            release_text = "-" if release is None else f"r{release.release_number} ({release.status})"
            self.stdout.write(
                f"{world.key}\t{world.status}\t{release_text}\t{world.title}"
            )
