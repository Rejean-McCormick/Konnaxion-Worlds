from __future__ import annotations

import json

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from konnaxion.worlds.models import World, WorldRelease
from konnaxion.worlds.services.schema import (
    DEFAULT_DOMAIN_APPS,
    expected_migration_fingerprint,
    migrate_app_group_into_schema,
    migration_fingerprint,
    missing_required_tables,
)


class Command(BaseCommand):
    help = "Prepare the Orgo->Konnaxion Impact bridge for a current Konnaxion World."

    def add_arguments(self, parser):
        parser.add_argument("--list-worlds", action="store_true")
        parser.add_argument("--world", dest="world_key")
        parser.add_argument("--json", action="store_true", dest="as_json")

    def _world_rows(self):
        rows = []
        for world in (
            World.objects.select_related("current_release")
            .exclude(status=World.STATUS_ARCHIVED)
            .order_by("key")
        ):
            release = world.current_release
            rows.append(
                {
                    "key": world.key,
                    "title": world.title,
                    "status": world.status,
                    "release_id": release.id if release else None,
                    "release": release.release_number if release else None,
                    "release_status": release.status if release else None,
                }
            )
        return rows

    def handle(self, *args, **options):
        as_json = bool(options["as_json"])
        if options["list_worlds"]:
            payload = {"ok": True, "worlds": self._world_rows()}
            self.stdout.write(json.dumps(payload) if as_json else json.dumps(payload, indent=2))
            return

        world_key = (options.get("world_key") or "").strip()
        if not world_key:
            raise CommandError("--world is required unless --list-worlds is used")

        try:
            world = World.objects.select_related("current_release").get(key=world_key)
        except World.DoesNotExist as exc:
            raise CommandError(f"Unknown World: {world_key}") from exc

        if world.status == World.STATUS_ARCHIVED:
            raise CommandError(f"World {world_key} is archived")
        release = world.current_release
        if release is None or release.status != WorldRelease.STATUS_CURRENT:
            raise CommandError(f"World {world_key} does not point to a CURRENT release")

        control_schema = getattr(settings, "KONNAXION_CONTROL_SCHEMA", "public")
        # ethikos is already a World-owned app in the current architecture. Replay
        # only its migration group into the current domain schema.
        migrate_app_group_into_schema(
            primary_schema=release.domain_schema,
            fallback_schemas=(control_schema,),
            app_labels=("ethikos",),
        )

        domain_apps = tuple(
            getattr(settings, "KONNAXION_WORLD_DOMAIN_APPS", DEFAULT_DOMAIN_APPS)
        )
        actual = migration_fingerprint(release.domain_schema, app_labels=domain_apps)
        expected = expected_migration_fingerprint(domain_apps)
        missing = missing_required_tables(release.domain_schema, domain_apps)
        if actual != expected or missing:
            raise CommandError(
                "World domain schema is not current after bridge migration: "
                f"fingerprint_match={actual == expected}, missing_tables={missing}"
            )

        WorldRelease.objects.filter(pk=release.pk).update(
            domain_migration_fingerprint=actual
        )
        payload = {
            "ok": True,
            "world": world.key,
            "release": release.release_number,
            "release_id": release.id,
            "domain_schema": release.domain_schema,
            "domain_migration_fingerprint": actual,
            "bridge_table": "ethikos_orgoimpactpublication",
        }
        self.stdout.write(json.dumps(payload) if as_json else json.dumps(payload, indent=2))
