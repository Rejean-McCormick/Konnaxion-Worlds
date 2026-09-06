# FILE: backend/konnaxion/kollective_intelligence/serializers.py
# konnaxion/kollective_intelligence/serializers.py
from rest_framework import serializers

from .models import (
    ExpertiseCategory,
    UserExpertiseScore,
    UserEthicsScore,
    ScoreConfiguration,
    ContextAnalysisLog,
    ConfidentialitySetting,
    ScoreHistory,
    Vote,
    VoteModality,
    EmergingExpert,
    VoteResult,
    IntegrationMapping,
)

__all__ = [
    "ExpertiseCategorySerializer",
    "UserExpertiseScoreSerializer",
    "UserEthicsScoreSerializer",
    "ScoreConfigurationSerializer",
    "ContextAnalysisLogSerializer",
    "ConfidentialitySettingSerializer",
    "ScoreHistorySerializer",
    "VoteSerializer",
    "VoteResultSerializer",
    "VoteModalitySerializer",
    "EmergingExpertSerializer",
    "IntegrationMappingSerializer",
]


# ────────────────────────────────
# Ekoh / reputation domain
# ────────────────────────────────


class ExpertiseCategorySerializer(serializers.ModelSerializer):
    """
    Simple catalogue of knowledge / expertise domains.
    """

    class Meta:
        model = ExpertiseCategory
        fields = "__all__"
        read_only_fields = ("id",)


class UserExpertiseScoreSerializer(serializers.ModelSerializer):
    """
    Current domain‑specific expertise weight per user.

    The `user` and `category` relations are exposed read‑only for display,
    while `category_id` is used for writes. The view is expected to inject
    the authenticated user on create/update.
    """

    user = serializers.StringRelatedField(read_only=True)
    category = ExpertiseCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        queryset=ExpertiseCategory.objects.all(),
        write_only=True,
        required=True,
    )

    class Meta:
        model = UserExpertiseScore
        fields = (
            "id",
            "user",
            "category",
            "category_id",
            "raw_score",
            "weighted_score",
        )
        read_only_fields = ("id", "user")


class UserEthicsScoreSerializer(serializers.ModelSerializer):
    """
    Ethical multiplier influencing all expertise weights.
    """

    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = UserEthicsScore
        fields = "__all__"
        read_only_fields = ("user",)


class ScoreConfigurationSerializer(serializers.ModelSerializer):
    """
    Named weight configuration (global or field‑specific).
    """

    class Meta:
        model = ScoreConfiguration
        fields = "__all__"
        read_only_fields = ("id",)


class ContextAnalysisLogSerializer(serializers.ModelSerializer):
    """
    Audit log of AI/context adjustments applied to scores.

    Exposed as read‑only; entries are intended to be created server‑side.
    """

    class Meta:
        model = ContextAnalysisLog
        fields = "__all__"
        read_only_fields = (
            "id",
            "entity_type",
            "entity_id",
            "field",
            "input_metadata",
            "adjustments_applied",
            "logged_at",
        )


class ConfidentialitySettingSerializer(serializers.ModelSerializer):
    """
    Per‑user anonymity / visibility preferences.
    """

    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = ConfidentialitySetting
        fields = "__all__"
        read_only_fields = ("user",)


class ScoreHistorySerializer(serializers.ModelSerializer):
    """
    Immutable audit trail of expertise score changes.
    """

    merit_score = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = ScoreHistory
        fields = "__all__"
        read_only_fields = (
            "id",
            "merit_score",
            "old_value",
            "new_value",
            "change_reason",
            "changed_at",
        )


# ────────────────────────────────
# Smart Vote domain
# ────────────────────────────────


class VoteSerializer(serializers.ModelSerializer):
    """
    Serializer for Vote (individual vote record with raw and weighted values).
    """

    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Vote
        fields = "__all__"
        read_only_fields = ("id", "user", "voted_at")


class VoteResultSerializer(serializers.ModelSerializer):
    """
    Serializer for VoteResult (aggregated vote totals for a target object).

    Read‑only – these results are typically computed by background jobs
    or database queries, not created directly via the public API.
    """

    class Meta:
        model = VoteResult
        fields = "__all__"
        read_only_fields = ("id",)


class VoteModalitySerializer(serializers.ModelSerializer):
    """
    Serializer for VoteModality (definition of a voting mode and its parameters).
    """

    class Meta:
        model = VoteModality
        fields = "__all__"
        read_only_fields = ("id",)


class EmergingExpertSerializer(serializers.ModelSerializer):
    """
    Flags fast‑rising contributors in a given period.
    """

    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = EmergingExpert
        fields = "__all__"
        read_only_fields = ("id", "user")


class IntegrationMappingSerializer(serializers.ModelSerializer):
    """
    Links Smart Vote / Ekoh context to other modules' objects.
    """

    class Meta:
        model = IntegrationMapping
        fields = "__all__"
        read_only_fields = ("id",)
