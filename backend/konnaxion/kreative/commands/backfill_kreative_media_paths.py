# FILE: backend/konnaxion/kreative/commands/backfill_kreative_media_paths.py
import os

from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from konnaxion.kreative.models import KreativeArtwork, TraditionEntry


def compute_new_artwork_path(instance: KreativeArtwork, filename: str) -> str:
    """
    New pattern (mirrors intended upload_to):

        kreative/artworks/<artist_id-or-anon>/<pk>/<slugified-filename><ext>
    """
    artist_id = getattr(getattr(instance, "artist", None), "id", None)
    artist_part = artist_id if artist_id is not None else "anon"

    name_part, ext = os.path.splitext(filename)
    safe_name = slugify(name_part) or "artwork"

    pk_part = instance.pk or "new"
    return f"kreative/artworks/{artist_part}/{pk_part}/{safe_name}{ext}"


def compute_new_tradition_path(instance: TraditionEntry, filename: str) -> str:
    """
    New pattern (mirrors intended upload_to):

        kreative/traditions/<slugified-region-or-id>/<slugified-filename><ext>
    """
    region = getattr(instance, "region", "") or f"id-{instance.pk or 'new'}"
    safe_region = slugify(region)

    name_part, ext = os.path.splitext(filename)
    safe_name = slugify(name_part) or "media"

    return f"kreative/traditions/{safe_region}/{safe_name}{ext}"


class Command(BaseCommand):
    help = "Backfill KreativeArtwork/TraditionEntry media files into a uniform directory layout."

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
            help="Optional limit on number of objects per model.",
        )
        parser.add_argument(
            "--start-id",
            type=int,
            help="Optional minimum primary key to process (per model).",
        )
        parser.add_argument(
            "--only-artworks",
            action="store_true",
            default=False,
            help="Process only KreativeArtwork instances.",
        )
        parser.add_argument(
            "--only-traditions",
            action="store_true",
            default=False,
            help="Process only TraditionEntry instances.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        limit = options.get("limit")
        start_id = options.get("start_id")
        only_artworks = options["only_artworks"]
        only_traditions = options["only_traditions"]

        if only_artworks and only_traditions:
            self.stderr.write(
                self.style.ERROR("Use at most one of --only-artworks / --only-traditions.")
            )
            return

        if not only_traditions:
            self._process_artworks(dry_run=dry_run, limit=limit, start_id=start_id)

        if not only_artworks:
            self._process_traditions(dry_run=dry_run, limit=limit, start_id=start_id)

    # ------------------------------------------------------------------
    # Shared helpers
    # ------------------------------------------------------------------

    def _queryset_with_options(self, qs, limit=None, start_id=None):
        if start_id is not None:
            qs = qs.filter(pk__gte=start_id)
        qs = qs.order_by("pk")
        if limit is not None:
            qs = qs[:limit]
        return qs

    def _move_file(self, instance, field_name: str, new_path_func, dry_run: bool) -> bool:
        file_field = getattr(instance, field_name)
        old_path = file_field.name

        if not old_path:
            return False

        filename = os.path.basename(old_path)
        new_path = new_path_func(instance, filename)

        # Already in target layout (or identical path)
        if new_path == old_path:
            return False

        if default_storage.exists(new_path):
            self.stderr.write(
                self.style.WARNING(
                    f"Skipping {instance._meta.label} pk={instance.pk} {field_name}: "
                    f"target '{new_path}' already exists."
                )
            )
            return False

        self.stdout.write(
            f"{instance._meta.label} pk={instance.pk} {field_name}: "
            f"'{old_path}' -> '{new_path}'"
        )

        if dry_run:
            return False

        if not default_storage.exists(old_path):
            self.stderr.write(
                self.style.WARNING(
                    f"Old file '{old_path}' does not exist for {instance}. Skipping."
                )
            )
            return False

        # Copy then delete (safer than rename across some storages)
        with default_storage.open(old_path, "rb") as src:
            default_storage.save(new_path, src)

        default_storage.delete(old_path)

        file_field.name = new_path
        instance.save(update_fields=[field_name])

        return True

    # ------------------------------------------------------------------
    # Model-specific processors
    # ------------------------------------------------------------------

    @transaction.atomic
    def _process_artworks(self, dry_run: bool, limit=None, start_id=None):
        self.stdout.write(self.style.MIGRATE_HEADING("Processing KreativeArtwork.media_file ..."))

        qs = KreativeArtwork.objects.exclude(media_file="").exclude(media_file__isnull=True)
        qs = self._queryset_with_options(qs, limit=limit, start_id=start_id)

        moved = 0
        for artwork in qs.iterator():
            if self._move_file(artwork, "media_file", compute_new_artwork_path, dry_run):
                moved += 1

        self.stdout.write(self.style.SUCCESS(f"KreativeArtwork: moved {moved} files."))

    @transaction.atomic
    def _process_traditions(self, dry_run: bool, limit=None, start_id=None):
        self.stdout.write(self.style.MIGRATE_HEADING("Processing TraditionEntry.media_file ..."))

        qs = TraditionEntry.objects.exclude(media_file="").exclude(media_file__isnull=True)
        qs = self._queryset_with_options(qs, limit=limit, start_id=start_id)

        moved = 0
        for entry in qs.iterator():
            if self._move_file(entry, "media_file", compute_new_tradition_path, dry_run):
                moved += 1

        self.stdout.write(self.style.SUCCESS(f"TraditionEntry: moved {moved} files."))
