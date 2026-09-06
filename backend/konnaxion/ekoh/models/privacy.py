"""User privacy / anonymity settings."""

from django.db import models
from django.conf import settings


class ConfidentialitySetting(models.Model):
    PUBLIC = "public"
    PSEUDONYM = "pseudonym"
    ANONYMOUS = "anonymous"

    LEVEL_CHOICES = [
        (PUBLIC, "Public"),
        (PSEUDONYM, "Pseudonym"),
        (ANONYMOUS, "Anonymous"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True
    )
    level = models.CharField(
        max_length=16,
        choices=LEVEL_CHOICES,
        default=PUBLIC,
    )

    class Meta:
        db_table = "confidentiality_setting"
