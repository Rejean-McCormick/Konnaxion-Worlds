from __future__ import annotations

import json

from django.core.management.base import BaseCommand, CommandError

from konnaxion.worlds.services.universe_packs import (
    UniversePackError,
    apply_universe_pack,
    get_universe_pack,
)


class Command(BaseCommand):
    help = "Build/apply one kx-universe-pack/v1 composition."

    def add_arguments(self, parser):
        parser.add_argument("universe_key")
        parser.add_argument("--pack-version", dest="pack_version", help="Exact Universe Pack SemVer to apply.")
        parser.add_argument(
            "--promote",
            action="store_true",
            help="Promote every exact target WorldRelease, then expose declared visibility atomically.",
        )

    def handle(self, *args, **options):
        try:
            pack = get_universe_pack(options["universe_key"], options.get("pack_version"))
            report = apply_universe_pack(pack=pack, promote=bool(options["promote"]))
        except UniversePackError as exc:
            raise CommandError(str(exc)) from exc
        self.stdout.write(json.dumps(report, ensure_ascii=False, indent=2))
