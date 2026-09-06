"""Reusable visibility and scoped-access controls for EkoH ratings.

These models deliberately avoid business-role concepts such as CEO, supervisor,
manager, department head, or minister. Calling modules may map their own
organisation/team/project concepts to a generic EkoH scope, while EkoH remains
responsible only for disclosure of EkoH-owned rating data.
"""

from django.conf import settings
from django.db import models


class RatingVisibilitySetting(models.Model):
    """Per-subject publication policy for EkoH ratings.

    Identity visibility remains owned by ``ConfidentialitySetting``. This model
    controls disclosure of rating data only.
    """

    PUBLIC = "public"
    SCOPED = "scoped"
    PRIVATE = "private"

    VISIBILITY_CHOICES = [
        (PUBLIC, "Public"),
        (SCOPED, "Scoped"),
        (PRIVATE, "Private"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="ekoh_rating_visibility",
    )
    visibility = models.CharField(
        max_length=16,
        choices=VISIBILITY_CHOICES,
        default=PUBLIC,
    )
    publication_basis = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "rating_visibility_setting"


class RatingAccessScope(models.Model):
    """Generic hierarchical disclosure scope reusable across Konnaxion modules."""

    key = models.SlugField(max_length=160, unique=True)
    name = models.CharField(max_length=200)
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
    )
    scope_type = models.CharField(max_length=64, blank=True)
    external_namespace = models.CharField(max_length=120, blank=True)
    external_key = models.CharField(max_length=200, blank=True)
    active = models.BooleanField(default=True)

    class Meta:
        db_table = "rating_access_scope"
        indexes = [
            models.Index(fields=["parent", "active"], name="idx_rating_scope_parent"),
            models.Index(
                fields=["external_namespace", "external_key"],
                name="idx_rating_scope_external",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.key} · {self.name}"


class RatingScopeSubject(models.Model):
    """Assign a rated person to a generic EkoH access scope."""

    scope = models.ForeignKey(
        RatingAccessScope,
        on_delete=models.CASCADE,
        related_name="subjects",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ekoh_rating_scopes",
    )
    active = models.BooleanField(default=True)

    class Meta:
        db_table = "rating_scope_subject"
        constraints = [
            models.UniqueConstraint(
                fields=["scope", "user"],
                name="uniq_rating_scope_subject",
            )
        ]
        indexes = [
            models.Index(fields=["user", "active"], name="idx_rating_subject_user"),
        ]


class RatingAccessGrant(models.Model):
    """Grant a viewer access to rating data within a scope.

    ``include_descendants`` lets a grant on an organisation/root scope cover
    child departments/teams without EkoH needing to know business-role names.
    """

    RATINGS = "ratings"
    HISTORY = "history"

    ACCESS_LEVEL_CHOICES = [
        (RATINGS, "Ratings"),
        (HISTORY, "Ratings + history"),
    ]

    viewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ekoh_rating_access_grants",
    )
    scope = models.ForeignKey(
        RatingAccessScope,
        on_delete=models.CASCADE,
        related_name="rating_access_grants",
    )
    include_descendants = models.BooleanField(default=False)
    access_level = models.CharField(
        max_length=16,
        choices=ACCESS_LEVEL_CHOICES,
        default=RATINGS,
    )
    active = models.BooleanField(default=True)

    class Meta:
        db_table = "rating_access_grant"
        constraints = [
            models.UniqueConstraint(
                fields=["viewer", "scope"],
                name="uniq_rating_access_grant",
            )
        ]
        indexes = [
            models.Index(fields=["viewer", "active"], name="idx_rating_grant_viewer"),
        ]
