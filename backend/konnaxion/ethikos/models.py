# backend/konnaxion/ethikos/models.py

from __future__ import annotations

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

# Imported so Django registers the demo importer tracking model
# when loading the ethikos app models.
from .models_demo import DemoScenarioImport as DemoScenarioImport  # noqa: F401


class EthikosCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ("name",)

    def __str__(self) -> str:
        return self.name


class EthikosArgument(models.Model):
    PRO = "pro"
    CON = "con"
    NEUTRAL = "neutral"

    SIDE_CHOICES = (
        (PRO, "Pro"),
        (CON, "Con"),
    )

    content = models.TextField()
    side = models.CharField(
        max_length=3,
        choices=SIDE_CHOICES,
        blank=True,
        null=True,
    )
    is_hidden = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    parent = models.ForeignKey(
        "self",
        blank=True,
        null=True,
        on_delete=models.CASCADE,
        related_name="replies",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ethikos_arguments",
    )
    topic = models.ForeignKey(
        "EthikosTopic",
        on_delete=models.CASCADE,
        related_name="arguments",
    )

    class Meta:
        ordering = ("created_at",)
        indexes = [
            models.Index(fields=["topic"], name="ethikos_eth_topic_i_53cecf_idx"),
            models.Index(fields=["user"], name="ethikos_eth_user_id_0f0683_idx"),
        ]

    def __str__(self) -> str:
        return self.content[:80]


class EthikosStance(models.Model):
    value = models.SmallIntegerField(
        validators=[
            MinValueValidator(-3),
            MaxValueValidator(3),
        ],
    )
    timestamp = models.DateTimeField(auto_now=True)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ethikos_stances",
    )
    topic = models.ForeignKey(
        "EthikosTopic",
        on_delete=models.CASCADE,
        related_name="stances",
    )

    class Meta:
        unique_together = (("user", "topic"),)
        indexes = [
            models.Index(fields=["topic"], name="ethikos_eth_topic_i_791d0c_idx"),
            models.Index(fields=["user"], name="ethikos_eth_user_id_fe6937_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(value__gte=-3, value__lte=3),
                name="stance_value_between_-3_and_3",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.user} · {self.topic} · {self.value}"


class EthikosTopic(models.Model):
    OPEN = "open"
    CLOSED = "closed"
    ARCHIVED = "archived"

    STATUS_CHOICES = (
        (OPEN, "Open"),
        (CLOSED, "Closed"),
        (ARCHIVED, "Archived"),
    )

    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(
        max_length=8,
        choices=STATUS_CHOICES,
        default=OPEN,
    )
    total_votes = models.PositiveIntegerField(default=0)
    last_activity = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    category = models.ForeignKey(
        EthikosCategory,
        on_delete=models.PROTECT,
        related_name="topics",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ethikos_topics",
    )
    expertise_category = models.ForeignKey(
        "kollective_intelligence.ExpertiseCategory",
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
    )

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return self.title


class ArgumentSource(models.Model):
    argument = models.ForeignKey(
        EthikosArgument,
        on_delete=models.CASCADE,
        related_name="sources",
    )
    url = models.URLField(
        max_length=2048,
        blank=True,
        null=True,
    )
    title = models.CharField(
        max_length=255,
        blank=True,
    )
    excerpt = models.TextField(blank=True)
    source_type = models.CharField(
        max_length=64,
        blank=True,
    )
    citation_text = models.TextField(blank=True)
    quote = models.TextField(blank=True)
    note = models.TextField(blank=True)
    is_removed = models.BooleanField(default=False)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="ethikos_argument_sources_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["argument"], name="eth_arg_src_argument_idx"),
            models.Index(fields=["created_by"], name="eth_arg_src_creator_idx"),
            models.Index(fields=["is_removed"], name="eth_arg_src_removed_idx"),
        ]

    def __str__(self) -> str:
        return (
            self.title
            or self.url
            or self.citation_text
            or f"Source for argument {self.argument_id}"
        )


class ArgumentImpactVote(models.Model):
    argument = models.ForeignKey(
        EthikosArgument,
        on_delete=models.CASCADE,
        related_name="impact_votes",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ethikos_argument_impact_votes",
    )
    value = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(0),
            MaxValueValidator(4),
        ],
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-updated_at", "-created_at")
        indexes = [
            models.Index(fields=["argument"], name="eth_arg_vote_argument_idx"),
            models.Index(fields=["user"], name="eth_arg_vote_user_idx"),
            models.Index(fields=["value"], name="eth_arg_vote_value_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=("user", "argument"),
                name="uniq_arg_impact_vote_user_argument",
            ),
            models.CheckConstraint(
                condition=models.Q(value__gte=0, value__lte=4),
                name="arg_impact_value_0_4",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.user} → {self.argument_id} = {self.value}"


class ArgumentSuggestion(models.Model):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    REVISION_REQUESTED = "revision_requested"

    STATUS_CHOICES = (
        (PENDING, "Pending"),
        (ACCEPTED, "Accepted"),
        (REJECTED, "Rejected"),
        (REVISION_REQUESTED, "Revision requested"),
    )

    SIDE_CHOICES = (
        (EthikosArgument.PRO, "Pro"),
        (EthikosArgument.CON, "Con"),
        (EthikosArgument.NEUTRAL, "Neutral"),
    )

    topic = models.ForeignKey(
        EthikosTopic,
        on_delete=models.CASCADE,
        related_name="argument_suggestions",
    )
    parent = models.ForeignKey(
        EthikosArgument,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="suggested_replies",
    )
    accepted_argument = models.ForeignKey(
        EthikosArgument,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="accepted_suggestions",
    )
    side = models.CharField(
        max_length=7,
        choices=SIDE_CHOICES,
        blank=True,
        null=True,
    )
    content = models.TextField()
    status = models.CharField(
        max_length=24,
        choices=STATUS_CHOICES,
        default=PENDING,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="ethikos_argument_suggestions_created",
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="ethikos_argument_suggestions_reviewed",
    )
    reviewed_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["topic"], name="eth_arg_sugg_topic_idx"),
            models.Index(fields=["status"], name="eth_arg_sugg_status_idx"),
            models.Index(fields=["created_by"], name="eth_arg_sugg_creator_idx"),
            models.Index(fields=["parent"], name="eth_arg_sugg_parent_idx"),
            models.Index(fields=["accepted_argument"], name="eth_arg_sugg_accept_idx"),
        ]

    def __str__(self) -> str:
        return self.content[:80]


class DiscussionParticipantRole(models.Model):
    OWNER = "owner"
    ADMIN = "admin"
    EDITOR = "editor"
    WRITER = "writer"
    SUGGESTER = "suggester"
    VIEWER = "viewer"

    ROLE_CHOICES = (
        (OWNER, "Owner"),
        (ADMIN, "Admin"),
        (EDITOR, "Editor"),
        (WRITER, "Writer"),
        (SUGGESTER, "Suggester"),
        (VIEWER, "Viewer"),
    )

    topic = models.ForeignKey(
        EthikosTopic,
        on_delete=models.CASCADE,
        related_name="participant_roles",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ethikos_discussion_roles",
    )
    role = models.CharField(
        max_length=16,
        choices=ROLE_CHOICES,
        default=VIEWER,
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="ethikos_discussion_roles_assigned",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("topic", "user")
        indexes = [
            models.Index(fields=["topic"], name="eth_disc_role_topic_idx"),
            models.Index(fields=["user"], name="eth_disc_role_user_idx"),
            models.Index(fields=["role"], name="eth_disc_role_role_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=("topic", "user"),
                name="uniq_discussion_role_topic_user",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.user} · {self.topic} · {self.role}"


class DiscussionVisibilitySetting(models.Model):
    PARTICIPATION_STANDARD = "standard"
    PARTICIPATION_ANONYMOUS = "anonymous"

    AUTHOR_VISIBILITY_NEVER = "never"
    AUTHOR_VISIBILITY_ADMINS_ONLY = "admins_only"
    AUTHOR_VISIBILITY_ALL = "all"

    VOTE_VISIBILITY_ALL = "all"
    VOTE_VISIBILITY_ADMINS_ONLY = "admins_only"
    VOTE_VISIBILITY_SELF_ONLY = "self_only"

    PARTICIPATION_TYPE_CHOICES = (
        (PARTICIPATION_STANDARD, "Standard"),
        (PARTICIPATION_ANONYMOUS, "Anonymous"),
    )

    AUTHOR_VISIBILITY_CHOICES = (
        (AUTHOR_VISIBILITY_NEVER, "Never"),
        (AUTHOR_VISIBILITY_ADMINS_ONLY, "Admins only"),
        (AUTHOR_VISIBILITY_ALL, "All"),
    )

    VOTE_VISIBILITY_CHOICES = (
        (VOTE_VISIBILITY_ALL, "All"),
        (VOTE_VISIBILITY_ADMINS_ONLY, "Admins only"),
        (VOTE_VISIBILITY_SELF_ONLY, "Self only"),
    )

    topic = models.OneToOneField(
        EthikosTopic,
        on_delete=models.CASCADE,
        related_name="visibility_setting",
    )
    participation_type = models.CharField(
        max_length=16,
        choices=PARTICIPATION_TYPE_CHOICES,
        default=PARTICIPATION_STANDARD,
    )
    author_visibility = models.CharField(
        max_length=16,
        choices=AUTHOR_VISIBILITY_CHOICES,
        default=AUTHOR_VISIBILITY_ALL,
    )
    vote_visibility = models.CharField(
        max_length=16,
        choices=VOTE_VISIBILITY_CHOICES,
        default=VOTE_VISIBILITY_ALL,
    )
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="ethikos_visibility_settings_changed",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("topic",)
        indexes = [
            models.Index(fields=["participation_type"], name="eth_disc_vis_part_idx"),
            models.Index(fields=["author_visibility"], name="eth_disc_vis_author_idx"),
            models.Index(fields=["vote_visibility"], name="eth_disc_vis_vote_idx"),
        ]

    def __str__(self) -> str:
        return f"Visibility · {self.topic}"