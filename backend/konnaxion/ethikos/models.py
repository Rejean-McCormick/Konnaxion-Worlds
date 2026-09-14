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


class DecisionProtocol(models.Model):
    """Konsultations/Decide-owned rules for opening and publishing a decision."""

    SIMPLE_MAJORITY = "simple_majority"
    STANCE_DISTRIBUTION = "stance_distribution"
    CONSENT_CHECK = "consent_check"
    RANKED_OPTION = "ranked_option"
    EXPERTISE_WEIGHTED_READING = "expertise_weighted_reading"
    MANUAL_PUBLICATION = "manual_publication"
    PROTOCOL_TYPE_CHOICES = tuple(
        (value, value.replace("_", " ").title())
        for value in (
            SIMPLE_MAJORITY,
            STANCE_DISTRIBUTION,
            CONSENT_CHECK,
            RANKED_OPTION,
            EXPERTISE_WEIGHTED_READING,
            MANUAL_PUBLICATION,
        )
    )

    key = models.SlugField(max_length=120, unique=True)
    label = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    protocol_type = models.CharField(max_length=64, choices=PROTOCOL_TYPE_CHOICES)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("label", "key")

    def __str__(self) -> str:
        return self.label


class DecisionRecord(models.Model):
    """Canonical published decision artifact for governed external handoff.

    The record is Konnaxion-owned. Publication freezes ``published_payload`` and
    ``artifact_digest``. External systems receive an IK ArtifactRef; they never
    write this table directly.
    """

    STATUS_DRAFT = "draft"
    STATUS_OPEN = "open"
    STATUS_CLOSED = "closed"
    STATUS_PUBLISHED = "published"
    STATUS_ARCHIVED = "archived"
    STATUS_CHOICES = tuple(
        (value, value.title())
        for value in (
            STATUS_DRAFT,
            STATUS_OPEN,
            STATUS_CLOSED,
            STATUS_PUBLISHED,
            STATUS_ARCHIVED,
        )
    )

    topic = models.ForeignKey(
        EthikosTopic,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="decision_records",
    )
    protocol = models.ForeignKey(
        DecisionProtocol,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="decision_records",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    opened_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    revision = models.PositiveIntegerField(default=1)
    baseline_result_json = models.JSONField(default=dict, blank=True)
    reading_result_refs = models.JSONField(default=list, blank=True)
    published_payload = models.JSONField(default=dict, blank=True)
    artifact_digest = models.CharField(max_length=64, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="ethikos_decision_records_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["topic"], name="eth_decision_topic_idx"),
            models.Index(fields=["status"], name="eth_decision_status_idx"),
            models.Index(fields=["created_by"], name="eth_decision_creator_idx"),
            models.Index(fields=["opened_at"], name="eth_decision_opened_idx"),
            models.Index(fields=["closed_at"], name="eth_decision_closed_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=(
                    ~models.Q(status__in=(STATUS_CLOSED, STATUS_PUBLISHED))
                    | models.Q(closed_at__isnull=False)
                ),
                name="eth_decision_closed_requires_time",
            ),
            models.CheckConstraint(
                condition=(
                    ~models.Q(status=STATUS_PUBLISHED)
                    | models.Q(published_at__isnull=False)
                ),
                name="eth_decision_published_requires_time",
            ),
        ]

    @property
    def artifact_id(self) -> str:
        return f"konnaxion:decision_record:{self.pk}"

    def __str__(self) -> str:
        return self.title


class InteractionEmission(models.Model):
    """World-owned durable outbound IK delivery intent.

    This is delivery state, not business state. A delivered emission does not
    imply that the remote business workflow has reached terminal success.
    """

    STATUS_QUEUED = "queued"
    STATUS_SENDING = "sending"
    STATUS_DELIVERED = "delivered"
    STATUS_RETRYING = "retrying"
    STATUS_DEAD = "dead"
    STATUS_CHOICES = tuple(
        (value, value.title())
        for value in (
            STATUS_QUEUED,
            STATUS_SENDING,
            STATUS_DELIVERED,
            STATUS_RETRYING,
            STATUS_DEAD,
        )
    )
    TERMINAL_STATUSES = (STATUS_DELIVERED, STATUS_DEAD)

    interaction_id = models.UUIDField(unique=True)
    profile_id = models.CharField(max_length=160)
    profile_version = models.CharField(max_length=80)
    target_system = models.CharField(max_length=120)
    target_organization = models.CharField(max_length=200, blank=True)
    target_world = models.CharField(max_length=200, blank=True)
    subject_type = models.CharField(max_length=120)
    subject_id = models.CharField(max_length=500)
    idempotency_key = models.CharField(max_length=500, unique=True)
    request_fingerprint = models.CharField(max_length=80)
    envelope_json = models.JSONField(default=dict)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_QUEUED)
    attempts = models.PositiveIntegerField(default=0)
    next_attempt_at = models.DateTimeField(null=True, blank=True)
    last_error_code = models.CharField(max_length=120, blank=True)
    last_error_detail = models.TextField(blank=True)
    receipt_json = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("created_at",)
        indexes = [
            models.Index(fields=["status", "next_attempt_at"], name="eth_ik_emit_state_idx"),
            models.Index(fields=["profile_id", "created_at"], name="eth_ik_emit_profile_idx"),
            models.Index(fields=["subject_type", "subject_id"], name="eth_ik_emit_subject_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.profile_id}:{self.subject_type}:{self.subject_id} [{self.status}]"


class OrgoImpactPublication(models.Model):
    """Konnaxion-owned publication receipt created from the Orgo bridge.

    Rows live in the active World's domain schema because ``ethikos`` is a
    World-owned app. Orgo identifiers are references only; they are never
    foreign keys into the Orgo database.
    """

    STATUS_PUBLISHED = "published"

    operation_id = models.UUIDField(unique=True)
    organization_id = models.UUIDField()
    idempotency_key = models.CharField(max_length=200, unique=True)
    correlation_id = models.CharField(max_length=255)
    subject_type = models.CharField(max_length=80)
    subject_id = models.UUIDField()
    artifact_type = models.CharField(max_length=80, default="impact_update")
    external_reference = models.CharField(max_length=255, unique=True)
    checkpoint = models.CharField(max_length=80, blank=True)
    demo_id = models.CharField(max_length=160, blank=True)
    epistemic_status = models.CharField(max_length=80, blank=True)
    status = models.CharField(max_length=32, default=STATUS_PUBLISHED)
    payload_hash = models.CharField(max_length=64)
    request_json = models.JSONField(default=dict)
    receipt_json = models.JSONField(default=dict)
    published_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-published_at",)
        indexes = [
            models.Index(fields=["demo_id", "checkpoint"], name="eth_orgo_demo_ckpt_idx"),
            models.Index(fields=["correlation_id"], name="eth_orgo_corr_idx"),
        ]

    def __str__(self) -> str:
        return self.external_reference
