# FILE: backend/konnaxion/kreative/models.py
import os

from django.conf import settings
from django.db import models
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _


def kreative_artwork_upload_to(instance, filename: str) -> str:
    """
    Storage path for KreativeArtwork media files.

    Pattern:
        kreative/artworks/<artist_id-or-anon>/<artwork_id-or-new>/<slugified-filename><ext>
    """
    # Use artist_id FK field directly; it is present even if the related object is not loaded.
    artist_id = getattr(instance, "artist_id", None) or "anon"

    name_part, ext = os.path.splitext(filename)
    safe_name = slugify(name_part) or "artwork"

    pk_part = instance.pk or "new"
    return f"kreative/artworks/{artist_id}/{pk_part}/{safe_name}{ext}"


def tradition_media_upload_to(instance, filename: str) -> str:
    """
    Storage path for TraditionEntry media files.

    Pattern:
        kreative/traditions/<region-or-id>/<slugified-filename><ext>
    """
    # Prefer the human-readable region; fall back to a stable id-based segment.
    raw_region = getattr(instance, "region", "") or f"id-{instance.pk or 'new'}"
    safe_region = slugify(raw_region) or f"id-{instance.pk or 'new'}"

    name_part, ext = os.path.splitext(filename)
    safe_name = slugify(name_part) or "media"

    return f"kreative/traditions/{safe_region}/{safe_name}{ext}"


# -- Simple reusable tag --
class Tag(models.Model):
    """
    Simple tagging table that can be reused by other apps.
    """
    name = models.CharField(max_length=64, unique=True)

    class Meta:
        verbose_name = _("Tag")
        verbose_name_plural = _("Tags")

    def __str__(self):
        return self.name


# -- Artwork and curation --
class KreativeArtwork(models.Model):
    """
    A single piece of art uploaded by a user.
    """
    class MediaType(models.TextChoices):
        IMAGE = "image", _("Image")
        VIDEO = "video", _("Video")
        AUDIO = "audio", _("Audio")
        OTHER = "other", _("Other")

    artist = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="artworks",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    media_file = models.FileField(upload_to=kreative_artwork_upload_to)
    media_type = models.CharField(
        max_length=10, choices=MediaType.choices, default=MediaType.IMAGE
    )
    year = models.PositiveIntegerField(null=True, blank=True)
    medium = models.CharField(max_length=120, blank=True)
    style = models.CharField(max_length=120, blank=True)
    tags = models.ManyToManyField(Tag, through="ArtworkTag", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Artwork")
        verbose_name_plural = _("Artworks")
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class ArtworkTag(models.Model):
    """
    Through-table for artwork <-> tag, for ManyToMany.
    """
    artwork = models.ForeignKey(KreativeArtwork, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("artwork", "tag")


# -- Gallery and ordering --
class Gallery(models.Model):
    """
    A curated set of artworks.
    """
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="galleries_created",
    )
    theme = models.CharField(max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    artworks = models.ManyToManyField(
        KreativeArtwork, through="GalleryArtwork", related_name="galleries"
    )

    class Meta:
        verbose_name = _("Gallery")
        verbose_name_plural = _("Galleries")
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class GalleryArtwork(models.Model):
    """
    Through-table giving order inside a gallery.
    """
    gallery = models.ForeignKey(Gallery, on_delete=models.CASCADE)
    artwork = models.ForeignKey(KreativeArtwork, on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("gallery", "artwork")
        ordering = ["order"]


# -- Co-creation room --
class CollabSession(models.Model):
    """
    Real-time co-creation room (painting, music, etc.).
    """
    SESSION_TYPES = [
        ("painting", _("Painting")),
        ("music", _("Music")),
        ("mixed", _("Mixed Media")),
    ]

    name = models.CharField(max_length=255)
    host = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="collab_sessions_hosted",
    )
    session_type = models.CharField(max_length=20, choices=SESSION_TYPES)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    final_artwork = models.ForeignKey(
        KreativeArtwork,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_in_sessions",
    )

    class Meta:
        verbose_name = _("Collaboration Session")
        verbose_name_plural = _("Collaboration Sessions")
        ordering = ["-started_at"]


# -- Cultural heritage/tradition entry --
class TraditionEntry(models.Model):
    """
    Cultural-heritage submission for Konservation archive.
    """
    REGION_MAX_LENGTH = 120

    title = models.CharField(max_length=255)
    description = models.TextField()
    region = models.CharField(max_length=REGION_MAX_LENGTH)  # could be ref-table later
    media_file = models.FileField(upload_to=tradition_media_upload_to)
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="tradition_entries",
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tradition_entries_approved",
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = _("Tradition Entry")
        verbose_name_plural = _("Tradition Entries")
        ordering = ["-submitted_at"]

    def __str__(self):
        return self.title


# -- NEW: VirtualExhibition, DigitalArchive, ArchiveDocument, AICatalogueEntry, CulturalPartner --
class VirtualExhibition(models.Model):
    """
    Online curated show.
    """
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Virtual Exhibition")
        verbose_name_plural = _("Virtual Exhibitions")

    def __str__(self):
        return self.name


class DigitalArchive(models.Model):
    """
    Stored artwork master entry (collection/archive).
    """
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Digital Archive")
        verbose_name_plural = _("Digital Archives")

    def __str__(self):
        return self.title


class ArchiveDocument(models.Model):
    """
    Documents linked to archives (e.g., image, PDF, scan).
    """
    archive = models.ForeignKey(
        DigitalArchive,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    document_type = models.CharField(max_length=64)
    url = models.URLField()
    metadata = models.JSONField(blank=True, default=dict)

    class Meta:
        verbose_name = _("Archive Document")
        verbose_name_plural = _("Archive Documents")


class AICatalogueEntry(models.Model):
    """
    AI-generated tags/classification for an archive document.
    """
    archive_document = models.ForeignKey(
        ArchiveDocument,
        on_delete=models.CASCADE,
        related_name="ai_entries",
    )
    tags = models.JSONField(blank=True, default=list)
    classification = models.CharField(max_length=120, blank=True)

    class Meta:
        verbose_name = _("AI Catalogue Entry")
        verbose_name_plural = _("AI Catalogue Entries")


class CulturalPartner(models.Model):
    """
    Museum/heritage sources or partners.
    """
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=64)
    contact_info = models.JSONField(blank=True, default=dict)

    class Meta:
        verbose_name = _("Cultural Partner")
        verbose_name_plural = _("Cultural Partners")

    def __str__(self):
        return self.name
