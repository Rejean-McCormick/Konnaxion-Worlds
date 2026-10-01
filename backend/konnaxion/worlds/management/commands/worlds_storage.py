from __future__ import annotations

import json

from django.core.management.base import BaseCommand, CommandError

from konnaxion.worlds.services.storage import database_storage_report, format_bytes


class Command(BaseCommand):
    help = "Show PostgreSQL/Neon storage used by WorldRelease schemas and reclaimable releases."

    def add_arguments(self, parser):
        parser.add_argument("--universe", help="Limit release detail to one Universe key.")
        parser.add_argument("--json", action="store_true", help="Emit the full report as JSON.")
        parser.add_argument(
            "--details",
            action="store_true",
            help="Show every release/schema instead of only the per-Universe summary.",
        )

    def handle(self, *args, **options):
        try:
            report = database_storage_report(universe_key=options.get("universe"))
        except Exception as exc:
            raise CommandError(str(exc)) from exc

        if options.get("json"):
            self.stdout.write(json.dumps(report, ensure_ascii=False, indent=2, default=str))
            return

        limit = format_bytes(report.get("limit_bytes"))
        current_db = format_bytes(report.get("database_bytes"))
        all_dbs = format_bytes(report.get("all_databases_bytes"))
        capacity_used = format_bytes(report.get("capacity_used_bytes"))
        remaining = format_bytes(report.get("remaining_bytes"))
        percent = report.get("usage_percent")
        pct = f" ({percent:.2f}%)" if percent is not None else ""

        self.stdout.write(f"Current database: {current_db}")
        self.stdout.write(f"Visible PostgreSQL databases: {all_dbs}")
        if report.get("provider_cluster_bytes") is not None:
            self.stdout.write(
                f"Provider cluster: {format_bytes(report.get('provider_cluster_bytes'))} "
                f"via {report.get('provider_size_source') or 'provider metric'}"
            )
        self.stdout.write(
            f"Capacity: used={capacity_used} limit={limit} remaining={remaining}{pct} "
            f"source={report.get('capacity_source') or '-'}"
        )
        if report.get("limit_raw"):
            self.stdout.write(f"Provider limit: neon.max_cluster_size={report['limit_raw']}")
        self.stdout.write(
            "Reclaimable: "
            f"failed={format_bytes(report.get('reclaimable_failed_bytes'))} "
            f"incomplete={format_bytes(report.get('reclaimable_incomplete_bytes'))} "
            f"frozen={format_bytes(report.get('reclaimable_frozen_bytes'))}"
        )
        self.stdout.write("")
        self.stdout.write(
            "UNIVERSE                      RELEASES   SCHEMAS      CURRENT      FAILED   INCOMPLETE       FROZEN"
        )
        for key, values in sorted(report.get("by_universe", {}).items()):
            self.stdout.write(
                f"{key:<29} {values['release_count']:>8}   "
                f"{format_bytes(values['schema_bytes']):>10}   "
                f"{format_bytes(values['current_bytes']):>10}   "
                f"{format_bytes(values['failed_bytes']):>10}   "
                f"{format_bytes(values.get('incomplete_bytes', 0)):>10}   "
                f"{format_bytes(values['frozen_bytes']):>10}"
            )

        if options.get("details"):
            self.stdout.write("")
            self.stdout.write("WORLD                              REL   STATUS       CURRENT  SIZE       SEED")
            for row in report.get("releases", []):
                self.stdout.write(
                    f"{row['world']:<34} "
                    f"r{row['release_number']:<4} "
                    f"{row['status']:<12} "
                    f"{str(row['is_current']):<8} "
                    f"{format_bytes(row['total_bytes']):>10} "
                    f"{row.get('seed_version') or '-'}"
                )
