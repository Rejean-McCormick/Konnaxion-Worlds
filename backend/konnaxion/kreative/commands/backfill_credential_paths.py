# FILE: backend/konnaxion/kreative/commands/backfill_credential_paths.py
import os

from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

from konnaxion.trust.models import Credential


def compute_new_credential_path(instance: Credential, filename: str) -> str:
    """
    New pattern (mirrors intended upload_to):

        trust/credentials/<year>/<month>/user-<user_id-or-anon>/<slugified-filename><ext>
    """
    now = timezone.now()
    user_id = getattr(getattr(instance, "user", None), "id", None)
    user_part = f"user-{user_id}" if user_id is not None else "user-anon"

    name_part, ext = os.path.splitext(filename)
    safe_name = slugify(name_part) or "credential"

    return (
        f"trust/credentials/{now.year:04d}/{now.month:02d}/"
        f"{user_part}/{safe_name}{ext}"
    )


class Command(BaseCommand):
    help = "Backfill Credential.file documents into a uniform directory layout."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            default=False,
            help="Log planned moves only; do not touch files or DB.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            help="Optional limit on number of Credential objects.",
        )
        parser.add_argument(
            "--start-id",
            type=int,
            help="Optional minimum primary key to process.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        limit = options.get("limit")
        start_id = options.get("start_id")

        self._process_credentials(dry_run=dry_run, limit=limit, start_id=start_id)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _queryset_with_options(self, qs, limit=None, start_id=None):
        if start_id is not None:
            qs = qs.filter(pk__gte=start_id)
        qs = qs.order_by("pk")
        if limit is not None:
            qs = qs[:limit]
        return qs

    def _move_file(self, instance: Credential, field_name: str, dry_run: bool) -> bool:
        file_field = getattr(instance, field_name)
        old_path = file_field.name

        if not old_path:
            return False

        filename = os.path.basename(old_path)
        new_path = compute_new_credential_path(instance, filename)

        if new_path == old_path:
            return False

        if default_storage.exists(new_path):
            self.stderr.write(
                self.style.WARNING(
                    f"Skipping Credential pk={instance.pk}: target '{new_path}' already exists."
                )
            )
            return False

        self.stdout.write(
            f"Credential pk={instance.pk} file: '{old_path}' -> '{new_path}'"
        )

        if dry_run:
            return False

        if not default_storage.exists(old_path):
            self.stderr.write(
                self.style.WARNING(
                    f"Old file '{old_path}' does not exist for Credential pk={instance.pk}. Skipping."
                )
            )
            return False

        with default_storage.open(old_path, "rb") as src:
            default_storage.save(new_path, src)

        default_storage.delete(old_path)

        file_field.name = new_path
        instance.save(update_fields=[field_name])

        return True

    # ------------------------------------------------------------------

    @transaction.atomic
    def _process_credentials(self, dry_run: bool, limit=None, start_id=None):
        self.stdout.write(self.style.MIGRATE_HEADING("Processing Credential.file ..."))

        qs = Credential.objects.exclude(file="").exclude(file__isnull=True)
        qs = self._queryset_with_options(qs, limit=limit, start_id=start_id)

        moved = 0
        for cred in qs.iterator():
            if self._move_file(cred, "file", dry_run=dry_run):
                moved += 1

        self.stdout.write(self.style.SUCCESS(f"Credential: moved {moved} files."))
