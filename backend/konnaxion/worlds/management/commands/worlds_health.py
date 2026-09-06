import json

from django.core.management.base import BaseCommand, CommandError

from konnaxion.worlds.services.health import world_system_health


class Command(BaseCommand):
    help = "Validate KX-WORLDS-1 schema canaries and current releases."

    def handle(self, *args, **options):
        report = world_system_health()
        self.stdout.write(json.dumps(report, ensure_ascii=False, indent=2, default=str))
        if not report.get("ok"):
            raise CommandError("Konnaxion Worlds health check failed.")
