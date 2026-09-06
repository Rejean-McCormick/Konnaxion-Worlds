"""Load/update the bundled ISCED-F taxonomy without deleting EkoH scores."""

from __future__ import annotations

import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from konnaxion.ekoh.db import set_local_ekoh_smartvote_search_path

from konnaxion.ekoh.models.taxonomy import ExpertiseCategory


class Command(BaseCommand):
    help = "Upsert UNESCO ISCED-F taxonomy from fixtures/isced_f_2013.json"

    def handle(self, *args, **options):
        fixture_path = (
            Path(__file__).resolve().parents[2] / "fixtures" / "isced_f_2013.json"
        )
        if not fixture_path.exists():
            raise CommandError(f"Fixture not found: {fixture_path}")

        data = json.loads(fixture_path.read_text(encoding="utf-8"))
        if not isinstance(data, list):
            raise CommandError("ISCED-F fixture must contain a JSON list.")

        entries = sorted(
            data,
            key=lambda entry: (
                int(entry.get("depth", 0)),
                str(entry.get("code", "")),
            ),
        )

        created_count = 0
        updated_count = 0

        with transaction.atomic():
            # Local settings may not carry the startup search_path. Keep the
            # schema change transaction-local so public Konnaxion tables are
            # unaffected after this command completes.
            set_local_ekoh_smartvote_search_path()
            code_to_obj: dict[str, ExpertiseCategory] = {
                obj.code: obj for obj in ExpertiseCategory.objects.all()
            }

            for entry in entries:
                code = str(entry.get("code", "")).strip()
                name = str(entry.get("name", "")).strip()
                parent_code = entry.get("parent_code")
                depth = int(entry.get("depth", 0))

                if not code or not name:
                    raise CommandError(f"Invalid ISCED-F entry: {entry!r}")

                parent = None
                if parent_code not in (None, "", "null"):
                    parent = code_to_obj.get(str(parent_code))
                    if parent is None:
                        raise CommandError(
                            f"Missing parent {parent_code!r} for ISCED-F code {code!r}."
                        )

                path = code if parent is None else f"{parent.path}.{code}"
                defaults = {
                    "name": name,
                    "parent": parent,
                    "depth": depth,
                    "path": path,
                }
                obj, created = ExpertiseCategory.objects.update_or_create(
                    code=code,
                    defaults=defaults,
                )
                code_to_obj[code] = obj
                if created:
                    created_count += 1
                else:
                    updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                "ISCED-F taxonomy synchronized: "
                f"{created_count} created, {updated_count} updated; "
                "existing EkoH user scores preserved."
            )
        )
