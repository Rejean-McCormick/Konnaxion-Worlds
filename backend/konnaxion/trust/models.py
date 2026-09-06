# FILE: backend/konnaxion/trust/models.py
# konnaxion/trust/models.py
from __future__ import annotations

import os

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify

__all__ = ["Credential"]


def credential_upload_to(instance, filename: str) -> str:
    """
    Storage path for user-submitted credentials.

    Pattern (UTC date):
        trust/credentials/<year>/<month>/user-<user_id-or-anon>/<slugified-filename><ext>
    """
    now = timezone.now()
    # Use FK id directly; falls back to "anon" if no user is attached yet.
    user_id = getattr(instance, "user_id", None) or "anon"

    name, ext = os.path.splitext(filename)
    safe_name = slugify(name) or "credential"

    return (
        f"trust/credentials/{now.year:04d}/{now.month:02d}/"
        f"user-{user_id}/{safe_name}{ext}"
    )


class Credential(models.Model):
    """
    Real-world credential uploaded by a user for the Trust module.

    This model backs:
      - The Trust credentials UI (Ethikos > Trust > Credentials).
      - The `CredentialSerializer` in `konnaxion/trust/serializers.py`.
    """

    # Default review message used when a credential is first created.
    # `CredentialSerializer` will read this via `Credential.DEFAULT_PENDING_NOTES`.
    DEFAULT_PENDING_NOTES: str = "Awaiting manual verification"

    class Status(models.TextChoices):
        # Values and labels are kept identical so the API can safely expose
        # "Pending" | "Verified" | "Rejected" to the frontend.
        PENDING = "Pending", "Pending"
        VERIFIED = "Verified", "Verified"
        REJECTED = "Rejected", "Rejected"

    # Owner of the credential
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="trust_credentials",
        help_text="User who submitted this credential.",
    )

    # Basic metadata
    title = models.CharField(
        max_length=255,
        help_text="Short title, e.g. 'MSc Climate Policy'.",
    )
    issuer = models.CharField(
        max_length=255,
        blank=True,
        help_text="Issuing institution or body.",
    )
    issued_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the credential was issued (if known).",
    )

    # Uploaded document (PDF / JPG / PNG, etc.)
    file = models.FileField(
        upload_to=credential_upload_to,
        blank=True,
        null=True,
        help_text="Binary document attached to this credential.",
    )

    # Review state + notes (managed by stewards/admins)
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PENDING,
        help_text="Review status in the trust workflow.",
    )
    notes = models.TextField(
        blank=True,
        help_text="Optional reviewer notes shown read-only in the UI.",
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=("user", "status")),
        ]

    def __str__(self) -> str:
        return f"{self.title} ({self.user})"

    # ------------------------------------------------------------------
    # Compatibility alias for serializers
    # ------------------------------------------------------------------
    @property
    def document(self):
        """
        Alias to the underlying `file` field.

        `konnaxion/trust/serializers.py` looks for a `document` attribute
        when building the public URL; exposing this property keeps that
        serializer working without duplicating the storage field.
        """
        return self.file
