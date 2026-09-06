# FILE: backend/konnaxion/konnected/models.py
# backend/konnaxion/konnected/models.py
from django.conf import settings
from django.db import models


class TimeStampedModel(models.Model):
    """Adds created_at / updated_at to every table."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


# ──────────────────────────────
#  CertifiKation sub-module
# ──────────────────────────────
class CertificationPath(TimeStampedModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    def __str__(self) -> str:
        return self.name


class Evaluation(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    path = models.ForeignKey(CertificationPath, on_delete=models.CASCADE)
    raw_score = models.FloatField()
    metadata = models.JSONField()

    def __str__(self) -> str:
        return f"{self.user} – {self.path} ({self.raw_score})"


class PeerValidation(TimeStampedModel):
    class Decision(models.TextChoices):
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    evaluation = models.ForeignKey(Evaluation, on_delete=models.CASCADE)
    peer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    decision = models.CharField(max_length=8, choices=Decision.choices)

    def __str__(self) -> str:
        return f"{self.peer} → {self.evaluation} [{self.decision}]"


class Portfolio(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    items = models.ManyToManyField(
        "KnowledgeResource",
        blank=True,
        related_name="portfolios",
    )

    def __str__(self) -> str:
        return self.title


class InteropMapping(TimeStampedModel):
    local_certification = models.ForeignKey(CertificationPath, on_delete=models.CASCADE)
    external_system = models.CharField(max_length=120)
    external_id = models.CharField(max_length=255)

    def __str__(self) -> str:
        return f"{self.external_system}:{self.external_id}"


# ──────────────────────────────
#  Knowledge sub-module
# ──────────────────────────────
class KnowledgeResource(TimeStampedModel):
    class ResourceType(models.TextChoices):
        VIDEO = "video", "Video"
        DOC = "doc", "Document"
        COURSE = "course", "Course"
        OTHER = "other", "Other"

    title = models.CharField(max_length=255)
    type = models.CharField(max_length=10, choices=ResourceType.choices)
    url = models.URLField()
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
    )

    def __str__(self) -> str:
        return self.title


class KnowledgeRecommendation(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    resource = models.ForeignKey(KnowledgeResource, on_delete=models.CASCADE)
    recommended_at = models.DateTimeField()

    def __str__(self) -> str:
        return f"{self.user} ⇢ {self.resource}"


class LearningProgress(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    resource = models.ForeignKey(KnowledgeResource, on_delete=models.CASCADE)
    progress_percent = models.DecimalField(max_digits=5, decimal_places=2)

    class Meta:
        unique_together = ("user", "resource")  # each user/resource pair only once

    def __str__(self) -> str:
        return f"{self.user} – {self.resource} ({self.progress_percent}%)"


# ──────────────────────────────
#  Offline content packaging
# ──────────────────────────────
class OfflinePackage(TimeStampedModel):
    """
    Represents an offline bundle of KonnectED resources.

    Backing model for the Offline Content page:
      app/konnected/learning-library/offline-content/page.tsx

    Fields map to the OfflinePackage type used by the frontend.
    """

    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "Scheduled"
        BUILDING = "building", "Building"
        READY = "ready", "Ready"
        FAILED = "failed", "Failed"

    class TargetDeviceType(models.TextChoices):
        LAPTOP = "laptop", "Laptop / desktop"
        TABLET = "tablet", "Tablet"
        USB = "usb", "USB / external media"
        OTHER = "other", "Other / mixed devices"

    # Human-facing metadata
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    # Lifecycle and build state
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.SCHEDULED,
    )
    item_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of resources included in the last built bundle.",
    )
    total_size_mb = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Approximate total bundle size in megabytes.",
    )
    last_built_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this package was last fully built.",
    )
    bundle_path = models.CharField(
        max_length=500,
        blank=True,
        help_text="Filesystem path to the last generated manifest, if any.",
    )

    target_device_type = models.CharField(
        max_length=16,
        choices=TargetDeviceType.choices,
        blank=True,
        help_text="Intended primary device type, if any.",
    )
    auto_sync = models.BooleanField(
        default=False,
        help_text="If true, include in scheduled offline build jobs.",
    )
    build_progress_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Current build progress (0–100).",
    )
    last_error_message = models.TextField(
        blank=True,
        help_text="Last build error, if the package is in a failed state.",
    )

    # Selection filters / constraints (mirror CreateOfflinePackagePayload)
    max_size_mb = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Optional upper bound for package size in MB.",
    )
    include_types = models.JSONField(
        null=True,
        blank=True,
        help_text=(
            "Optional list of content types to include "
            "(article, video, lesson, quiz, dataset)."
        ),
    )
    subject_filter = models.CharField(
        max_length=255,
        blank=True,
        help_text="Optional subject/topic filter applied when resolving resources.",
    )
    level_filter = models.CharField(
        max_length=255,
        blank=True,
        help_text="Optional difficulty/level filter.",
    )
    language_filter = models.CharField(
        max_length=32,
        blank=True,
        help_text="Optional language filter (e.g. 'en', 'fr').",
    )

    # Resources actually included in the last build (if relation is used)
    resources = models.ManyToManyField(
        KnowledgeResource,
        blank=True,
        related_name="offline_packages",
        help_text="Resources currently included in this offline package.",
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="offline_packages",
        help_text="User who created this offline package definition.",
    )

    class Meta:
        ordering = ("name",)

    def __str__(self) -> str:
        return self.name


# ──────────────────────────────
#  Mentorship sub-module
# ──────────────────────────────
class MentorProfile(TimeStampedModel):
    """
    Mentor profile for KonnectED mentorship.

    Matches the v14 spec and the mentorship UI needs:
    - basic bio and focus areas
    - languages and target learner level
    - simple capacity/availability fields
    """

    class MentorLevel(models.TextChoices):
        PRIMARY = "primary", "Primary"
        SECONDARY = "secondary", "Secondary"
        ADULT = "adult", "Adult / educator"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mentor_profile",
    )
    display_name = models.CharField(
        max_length=255,
        blank=True,
        help_text="Optional public display name; falls back to user if blank.",
    )
    bio = models.TextField(
        blank=True,
        help_text="Short biography shown on the mentorship page.",
    )
    expertise_areas = models.JSONField(
        null=True,
        blank=True,
        help_text="List of expertise/subject tags (e.g. ['Math', 'Physics']).",
    )
    languages = models.JSONField(
        null=True,
        blank=True,
        help_text="List of language names or codes (e.g. ['English', 'French']).",
    )
    level = models.CharField(
        max_length=16,
        choices=MentorLevel.choices,
        blank=True,
        help_text="Primary learner level this mentor supports.",
    )
    focus_areas = models.JSONField(
        null=True,
        blank=True,
        help_text="Optional list of focus areas for mentoring.",
    )

    max_mentees = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Optional cap on active mentees this mentor will take.",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Controls whether the mentor appears in discovery lists.",
    )
    is_accepting_mentees = models.BooleanField(
        default=True,
        help_text="Quick toggle for whether new requests are allowed.",
    )

    # Lightweight metrics (can be updated by services)
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Optional average feedback rating (e.g. 4.8).",
    )
    sessions_completed = models.PositiveIntegerField(
        default=0,
        help_text="Approximate count of completed mentorship sessions.",
    )

    def __str__(self) -> str:
        return self.display_name or str(self.user)


class MentorshipRequest(TimeStampedModel):
    """
    A mentee asking a mentor for support.

    Mirrors the v14 spec + frontend form fields:
    - learningGoal, preferredLanguage, ageGroup, contactChannel, additionalNotes
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        DECLINED = "declined", "Declined"
        CANCELLED = "cancelled", "Cancelled"

    mentor = models.ForeignKey(
        MentorProfile,
        on_delete=models.CASCADE,
        related_name="requests_received",
    )
    mentee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mentorship_requests_sent",
    )

    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PENDING,
    )
    learning_goal = models.TextField(
        help_text="Learner's main goal or topic for mentorship.",
    )
    preferred_language = models.CharField(
        max_length=64,
        blank=True,
        help_text="Optional preferred language for sessions.",
    )
    age_group = models.CharField(
        max_length=64,
        blank=True,
        help_text="Optional age group descriptor (e.g. '12–14').",
    )
    contact_channel = models.CharField(
        max_length=64,
        blank=True,
        help_text="Preferred communication channel (e.g. email, chat, video).",
    )
    additional_notes = models.TextField(
        blank=True,
        help_text="Any extra context the learner wants to share.",
    )

    responded_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when the mentor accepted/declined the request.",
    )

    def __str__(self) -> str:
        return f"{self.mentee} → {self.mentor} [{self.status}]"


# ──────────────────────────────
#  Co-Creation sub-module
# ──────────────────────────────
class CoCreationProject(TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ACTIVE = "active", "Active"
        ARCHIVED = "archived", "Archived"

    title = models.CharField(max_length=255)
    status = models.CharField(
        max_length=8,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    def __str__(self) -> str:
        return self.title


class CoCreationContribution(TimeStampedModel):
    project = models.ForeignKey(CoCreationProject, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()

    def __str__(self) -> str:
        return f"{self.user} → {self.project}"


# ──────────────────────────────
#  Forum sub-module
# ──────────────────────────────
class ForumTopic(TimeStampedModel):
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=120)
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    def __str__(self) -> str:
        return self.title


class ForumPost(TimeStampedModel):
    topic = models.ForeignKey(
        ForumTopic,
        on_delete=models.CASCADE,
        related_name="posts",
    )
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()

    def __str__(self) -> str:
        return f"{self.author} @ {self.topic}"
