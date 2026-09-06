# FILE: backend/konnaxion/users/models.py
import os

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import CharField
from django.urls import reverse
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _


def user_avatar_upload_to(instance, filename: str) -> str:
    """
    Storage path for user avatar uploads.

    Pattern:
        users/<user_id>/avatar/<slugified-filename><ext>
    """
    name, ext = os.path.splitext(filename)
    safe_name = slugify(name) or "avatar"
    # For new users without pk, this will use "new" once; normally avatars are set post-signup.
    user_id = instance.pk or "new"
    return f"users/{user_id}/avatar/{safe_name}{ext}"


class User(AbstractUser):
    """
    Default custom user model for Konnaxion.
    If adding fields that need to be filled at user signup,
    check forms.SignupForm and forms.SocialSignupForms accordingly.

    Ontology:
      - account_type: human vs internal/service account
      - is_klone: whether this human account is a synthetic "klone" persona
      - is_ethikos_elite: whether this account may write in Ethikos debates
    """

    # --- Account type / ontology ---

    TYPE_HUMAN = "human"
    TYPE_SERVICE = "service"

    ACCOUNT_TYPE_CHOICES = [
        (TYPE_HUMAN, "Human"),
        (TYPE_SERVICE, "Service"),
    ]

    account_type = models.CharField(
        max_length=16,
        choices=ACCOUNT_TYPE_CHOICES,
        default=TYPE_HUMAN,
        help_text="Categorises the account: human or internal service.",
    )

    # Synthetic persona flag: klones are still human-type accounts
    is_klone = models.BooleanField(
        default=False,
        help_text=(
            "If true, this human account represents a synthetic 'klone' persona "
            "rather than a self-controlled user."
        ),
    )

    # Ethikos-specific permission flag
    is_ethikos_elite = models.BooleanField(
        default=False,
        help_text=(
            "If true, this account is allowed to write (stances/arguments) "
            "in Ethikos debates. Klones and staff may also participate via "
            "can_participate_in_ethikos."
        ),
    )

    # First and last name do not cover name patterns around the globe
    name = CharField(_("Name of User"), blank=True, max_length=255)
    first_name = None  # type: ignore[assignment]
    last_name = None  # type: ignore[assignment]

    # Binary avatar image uploaded by the user
    avatar = models.ImageField(
        upload_to=user_avatar_upload_to,
        blank=True,
        null=True,
        help_text="User-uploaded avatar image.",
    )

    # Chosen artwork used as this user's profile picture
    profile_artwork = models.ForeignKey(
        "kreative.KreativeArtwork",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="users_using_as_profile",
    )

    def get_absolute_url(self) -> str:
        """Get URL for user's detail view."""
        return reverse("users:detail", kwargs={"username": self.username})

    # --- Convenience flags / properties ---

    @property
    def is_human(self) -> bool:
        return self.account_type == self.TYPE_HUMAN

    @property
    def is_service_account(self) -> bool:
        return self.account_type == self.TYPE_SERVICE

    @property
    def is_klone_account(self) -> bool:
        """
        Alias property for clarity in calling code.
        """
        return self.is_human and self.is_klone

    @property
    def can_participate_in_ethikos(self) -> bool:
        """
        Who is allowed to actively debate in Ethikos.

        Current rule:
          - staff and superusers
          - klone personas
          - explicitly flagged 'Ethikos elite' users (humans)

        Normal human accounts are read-only in Ethikos by default.
        """
        if not self.is_authenticated:
            return False
        if self.is_staff or self.is_superuser:
            return True
        if self.is_klone_account:
            return True
        if self.is_ethikos_elite:
            return True
        return False
