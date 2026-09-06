# FILE: backend/konnaxion/konnected/serializers.py
from rest_framework import serializers

from .models import (
    CertificationPath,
    Evaluation,
    PeerValidation,
    Portfolio,
    KnowledgeResource,
    KnowledgeRecommendation,
    LearningProgress,
    OfflinePackage,
    MentorProfile,
    MentorshipRequest,
    CoCreationProject,
    CoCreationContribution,
    ForumTopic,
    ForumPost,
)

__all__ = [
    "KnowledgeResourceSerializer",
    "CertificationPathSerializer",
    "EvaluationSerializer",
    "PeerValidationSerializer",
    "PortfolioSerializer",
    "KnowledgeRecommendationSerializer",
    "LearningProgressSerializer",
    "OfflinePackageSerializer",
    "ExamAttemptSerializer",
    "MentorProfileSerializer",
    "MentorshipRequestSerializer",
    "CoCreationProjectSerializer",
    "CoCreationContributionSerializer",
    "ForumTopicSerializer",
    "ForumPostSerializer",
]


class KnowledgeResourceSerializer(serializers.ModelSerializer):
    """
    Serialises library items (video, doc, course…) defined by the
    KnowledgeResource model in v14.
    """

    author = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = KnowledgeResource
        fields = "__all__"


class CertificationPathSerializer(serializers.ModelSerializer):
    """
    Minimal representation of a certification / learning path.

    v14 only stores basic metadata in the database (name, description…).
    Any extra fields used by the frontend (level, tags, KPIs) can be
    added later either as DB columns or via a CMS / enrichment layer.
    """

    class Meta:
        model = CertificationPath
        fields = "__all__"


class EvaluationSerializer(serializers.ModelSerializer):
    """
    Stores a single evaluation / exam attempt for a user on a path.

    The JSON `metadata` field is intentionally flexible and can contain:
        - delivery_mode, proctored, status
        - session_id, full_name, agreed_terms
        - score_percent, max_score
        - appeal_status, peer_validation_required, etc.
    """

    user = serializers.StringRelatedField(read_only=True)
    path = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Evaluation
        fields = "__all__"
        read_only_fields = ("id", "user", "path", "created_at", "updated_at")


class PeerValidationSerializer(serializers.ModelSerializer):
    """
    Peer mentor validation on a given evaluation.
    """

    peer = serializers.StringRelatedField(read_only=True)
    evaluation = serializers.PrimaryKeyRelatedField(queryset=Evaluation.objects.all())

    class Meta:
        model = PeerValidation
        fields = "__all__"
        read_only_fields = ("id", "peer", "created_at", "updated_at")


class PortfolioSerializer(serializers.ModelSerializer):
    """
    User skill portfolio – curated collection of KnowledgeResources.
    """

    user = serializers.StringRelatedField(read_only=True)
    items = serializers.PrimaryKeyRelatedField(
        queryset=KnowledgeResource.objects.all(),
        many=True,
        required=False,
    )

    class Meta:
        model = Portfolio
        fields = "__all__"
        read_only_fields = ("id", "user", "created_at", "updated_at")


class KnowledgeRecommendationSerializer(serializers.ModelSerializer):
    """
    Minimal serializer for KnowledgeRecommendation.

    Used by the recommendations API; the frontend can either consume the
    nested resource or fall back to treating the recommendation row
    itself as a resource-ish object.
    """

    user = serializers.StringRelatedField(read_only=True)
    resource = KnowledgeResourceSerializer(read_only=True)

    class Meta:
        model = KnowledgeRecommendation
        fields = "__all__"
        read_only_fields = ("id", "user", "created_at", "updated_at")


class LearningProgressSerializer(serializers.ModelSerializer):
    """
    Tracks per-user progress on individual knowledge resources.

    Exposes progress_percent as a numeric value (not a JSON string) so
    the dashboard widgets can use it directly.
    """

    user = serializers.StringRelatedField(read_only=True)
    resource = serializers.PrimaryKeyRelatedField(
        queryset=KnowledgeResource.objects.all(),
    )
    # Force numeric JSON instead of DRF's default Decimal->string.
    progress_percent = serializers.FloatField()

    class Meta:
        model = LearningProgress
        fields = "__all__"
        read_only_fields = ("id", "user", "created_at", "updated_at")


class OfflinePackageSerializer(serializers.ModelSerializer):
    """
    Serializer for OfflinePackage with camelCase field names matching
    the OfflinePackage type used in the KonnectED offline-content UI.

    Backed fields on the model:
      - item_count, total_size_mb, last_built_at
      - target_device_type, auto_sync
      - build_progress_percent, last_error_message
      - max_size_mb, include_types, subject_filter, level_filter, language_filter
    """

    # Read-only build / status metrics (camelCase in JSON)
    itemCount = serializers.IntegerField(source="item_count", read_only=True)
    totalSizeMb = serializers.FloatField(source="total_size_mb", read_only=True)
    lastBuiltAt = serializers.DateTimeField(source="last_built_at", read_only=True)
    buildProgressPercent = serializers.FloatField(
        source="build_progress_percent",
        read_only=True,
        allow_null=True,
    )
    lastErrorMessage = serializers.CharField(
        source="last_error_message",
        read_only=True,
        allow_blank=True,
        allow_null=True,
    )

    # Editable config fields used by CreateOfflinePackagePayload
    targetDeviceType = serializers.CharField(
        source="target_device_type",
        required=False,
        allow_blank=True,
        allow_null=True,
    )
    autoSync = serializers.BooleanField(
        source="auto_sync",
        required=False,
    )
    maxSizeMb = serializers.FloatField(
        source="max_size_mb",
        required=False,
        allow_null=True,
    )
    includeTypes = serializers.ListField(
        source="include_types",
        child=serializers.CharField(),
        required=False,
        allow_null=True,
    )
    subjectFilter = serializers.CharField(
        source="subject_filter",
        required=False,
        allow_blank=True,
    )
    levelFilter = serializers.CharField(
        source="level_filter",
        required=False,
        allow_blank=True,
    )
    languageFilter = serializers.CharField(
        source="language_filter",
        required=False,
        allow_blank=True,
    )

    class Meta:
        model = OfflinePackage
        fields = [
            "id",
            "name",
            "description",
            "status",
            # Build / status metrics
            "itemCount",
            "totalSizeMb",
            "lastBuiltAt",
            "buildProgressPercent",
            "lastErrorMessage",
            # User-configurable fields
            "targetDeviceType",
            "autoSync",
            "maxSizeMb",
            "includeTypes",
            "subjectFilter",
            "levelFilter",
            "languageFilter",
            # Timestamps for debugging / ops (snake_case is fine here)
            "created_at",
            "updated_at",
        ]
        read_only_fields = (
            "id",
            "status",
            "itemCount",
            "totalSizeMb",
            "lastBuiltAt",
            "buildProgressPercent",
            "lastErrorMessage",
            "created_at",
            "updated_at",
        )



class MentorProfileSerializer(serializers.ModelSerializer):
    """Public mentor directory projection backed by MentorProfile."""

    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = MentorProfile
        fields = "__all__"
        read_only_fields = (
            "id",
            "user",
            "created_at",
            "updated_at",
            "rating",
            "sessions_completed",
        )


class MentorshipRequestSerializer(serializers.ModelSerializer):
    """Authenticated learner -> mentor request."""

    mentee = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = MentorshipRequest
        fields = "__all__"
        read_only_fields = (
            "id",
            "mentee",
            "status",
            "responded_at",
            "created_at",
            "updated_at",
        )


class CoCreationProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoCreationProject
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")


class CoCreationContributionSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = CoCreationContribution
        fields = "__all__"
        read_only_fields = ("id", "user", "created_at", "updated_at")


class ForumTopicSerializer(serializers.ModelSerializer):
    creator = serializers.StringRelatedField(read_only=True)
    replies_count = serializers.IntegerField(source="posts.count", read_only=True)

    class Meta:
        model = ForumTopic
        fields = "__all__"
        read_only_fields = ("id", "creator", "created_at", "updated_at")


class ForumPostSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = ForumPost
        fields = "__all__"
        read_only_fields = ("id", "author", "created_at", "updated_at")

class ExamAttemptSerializer(serializers.Serializer):
    """
    Read-only projection used by the Exam Dashboard UI.

    This is *not* backed by a dedicated model; it aggregates data coming
    from Evaluation (+ PeerValidation, Portfolio / certificates) into a
    single flattened record.

    It matches the shape used in:
      app/konnected/certifications/exam-dashboard-results/page.tsx
    """

    id = serializers.CharField()
    certificationPathId = serializers.CharField()
    certificationPathName = serializers.CharField()
    attemptNumber = serializers.IntegerField()
    takenAt = serializers.DateTimeField()

    deliveryMode = serializers.CharField()
    proctored = serializers.BooleanField()

    scorePercent = serializers.FloatField(allow_null=True)
    maxScore = serializers.FloatField(allow_null=True, required=False)

    status = serializers.CharField()
    peerValidationRequired = serializers.BooleanField()
    peerValidationStatus = serializers.CharField(
        allow_null=True,
        required=False,
    )
    appealStatus = serializers.CharField(
        allow_null=True,
        required=False,
    )

    certificateId = serializers.CharField(
        allow_null=True,
        allow_blank=True,
        required=False,
    )
    certificateUrl = serializers.CharField(
        allow_null=True,
        allow_blank=True,
        required=False,
    )
    portfolioItemId = serializers.CharField(
        allow_null=True,
        allow_blank=True,
        required=False,
    )
    portfolioUrl = serializers.CharField(
        allow_null=True,
        allow_blank=True,
        required=False,
    )

    canRetry = serializers.BooleanField()
    nextRetryAt = serializers.DateTimeField(
        allow_null=True,
        required=False,
    )
