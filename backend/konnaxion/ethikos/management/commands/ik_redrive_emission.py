from __future__ import annotations

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from konnaxion.worlds.db import world_db_scope
from konnaxion.worlds.models import WorldRelease
from konnaxion.worlds.resolver import runtime_from_release

from ...models import InteractionEmission
from ...tasks import deliver_interaction_emission_task


class Command(BaseCommand):
    help = "Redrive an existing IK InteractionEmission without changing its idempotency identity."

    def add_arguments(self, parser):
        parser.add_argument("--release-id", type=int, required=True)
        parser.add_argument("--emission-id", type=int, required=True)

    def handle(self, *args, **options):
        release_id = options["release_id"]
        emission_id = options["emission_id"]
        try:
            release = WorldRelease.objects.select_related("world").get(pk=release_id)
        except WorldRelease.DoesNotExist as exc:
            raise CommandError(f"Unknown WorldRelease id: {release_id}") from exc

        runtime = runtime_from_release(release)
        with world_db_scope(runtime):
            with transaction.atomic():
                try:
                    emission = InteractionEmission.objects.select_for_update().get(pk=emission_id)
                except InteractionEmission.DoesNotExist as exc:
                    raise CommandError(
                        f"Emission {emission_id} does not exist in {release.world.key}/r{release.release_number}."
                    ) from exc
                if emission.status == InteractionEmission.STATUS_DELIVERED:
                    raise CommandError("Delivered emissions are terminal and cannot be redriven.")
                emission.status = InteractionEmission.STATUS_QUEUED
                emission.attempts = 0
                emission.next_attempt_at = None
                emission.last_error_code = ""
                emission.last_error_detail = ""
                emission.receipt_json = {}
                emission.save(
                    update_fields=[
                        "status",
                        "attempts",
                        "next_attempt_at",
                        "last_error_code",
                        "last_error_detail",
                        "receipt_json",
                        "updated_at",
                    ]
                )

        task = deliver_interaction_emission_task.delay(release_id, emission_id)
        self.stdout.write(
            self.style.SUCCESS(
                f"Queued IK emission {emission_id} for {release.world.key}/r{release.release_number}; task={task.id}"
            )
        )
