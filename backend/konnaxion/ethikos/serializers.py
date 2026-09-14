# FILE: backend/konnaxion/ethikos/serializers.py
# backend/konnaxion/ethikos/serializers.py

from __future__ import annotations

from typing import Any

from django.contrib.auth import get_user_model
from konnaxion.worlds.runtime import get_world_runtime
from konnaxion.worlds.services.personas import user_belongs_to_release
from rest_framework import serializers

from .constants import (
    ARGUMENT_IMPACT_VOTE_MAX,
    ARGUMENT_IMPACT_VOTE_MIN,
    STANCE_MAX,
    STANCE_MIN,
)
from .models import (
    ArgumentImpactVote,
    ArgumentSource,
    ArgumentSuggestion,
    DiscussionParticipantRole,
    DiscussionVisibilitySetting,
    DecisionProtocol,
    DecisionRecord,
    EthikosArgument,
    EthikosCategory,
    EthikosStance,
    EthikosTopic,
)

__all__ = [
    "EthikosCategorySerializer",
    "EthikosTopicSerializer",
    "EthikosTopicPreviewSerializer",
    "EthikosStanceSerializer",
    "EthikosArgumentSerializer",
    "ArgumentSourceSerializer",
    "ArgumentImpactVoteSerializer",
    "ArgumentSuggestionSerializer",
    "DiscussionParticipantRoleSerializer",
    "DiscussionVisibilitySettingSerializer",
    "DecisionProtocolSerializer",
    "DecisionRecordSerializer",
]


class EthikosCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EthikosCategory
        fields = "__all__"
        read_only_fields = ("id",)


class EthikosTopicSerializer(serializers.ModelSerializer):
    """
    Canonical topic serializer.

    Read shape:
    - category: nested category object
    - category_name: convenience string
    - created_by / created_by_id: read-only creator identity

    Write shape:
    - category_id: explicit PK input mapped to category
    """

    category = EthikosCategorySerializer(read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)

    created_by = serializers.StringRelatedField(read_only=True)
    created_by_id = serializers.IntegerField(read_only=True)

    category_id = serializers.PrimaryKeyRelatedField(
        queryset=EthikosCategory.objects.all(),
        source="category",
        write_only=True,
        required=False,
    )

    class Meta:
        model = EthikosTopic
        fields = (
            "id",
            "title",
            "description",
            "category",
            "category_id",
            "category_name",
            "expertise_category",
            "status",
            "total_votes",
            "created_by",
            "created_by_id",
            "last_activity",
            "created_at",
        )
        read_only_fields = (
            "id",
            "category",
            "category_name",
            "created_by",
            "created_by_id",
            "last_activity",
            "created_at",
            "total_votes",
        )

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        """
        Require category on create while keeping partial updates flexible.

        API views may normalize legacy `category` input into `category_id`
        before serializer validation. The serializer itself only owns the
        canonical write field: category_id.
        """

        if self.instance is None and attrs.get("category") is None:
            raise serializers.ValidationError(
                {"category_id": "Category is required when creating a topic."}
            )

        return attrs


class EthikosTopicPreviewSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for preview surfaces.

    Kintsugi rule:
    the preview endpoint should still return topic metadata even if arguments
    are absent or fail to load in the view.
    """

    category = EthikosCategorySerializer(read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)

    created_by = serializers.StringRelatedField(read_only=True)
    created_by_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = EthikosTopic
        fields = (
            "id",
            "title",
            "description",
            "category",
            "category_name",
            "expertise_category",
            "status",
            "total_votes",
            "created_by",
            "created_by_id",
            "last_activity",
            "created_at",
        )
        read_only_fields = fields


class EthikosStanceSerializer(serializers.ModelSerializer):
    """
    Topic-level stance serializer.

    EthikosStance remains a topic-level -3..+3 position. It is not an
    argument-level impact vote and not a Smart Vote reading.
    """

    user = serializers.StringRelatedField(read_only=True)
    user_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = EthikosStance
        fields = (
            "id",
            "user",
            "user_id",
            "topic",
            "value",
            "timestamp",
        )
        read_only_fields = (
            "id",
            "user",
            "user_id",
            "timestamp",
        )

    def validate_value(self, value: int) -> int:
        if value < STANCE_MIN or value > STANCE_MAX:
            raise serializers.ValidationError(
                f"Stance value must be between {STANCE_MIN} and {STANCE_MAX}."
            )
        return value


class EthikosArgumentSerializer(serializers.ModelSerializer):
    """
    Canonical threaded argument serializer.

    Kialo-style "claim" is a UX/domain concept. The persisted backend model
    remains EthikosArgument.

    Compatibility:
    - parent is exposed as a PK field and remains writable for existing clients.
    - parent_id is accepted as the explicit write-only field for newer services.
    """

    user = serializers.StringRelatedField(read_only=True)
    user_id = serializers.IntegerField(read_only=True)

    parent = serializers.PrimaryKeyRelatedField(
        queryset=EthikosArgument.objects.all(),
        required=False,
        allow_null=True,
    )
    parent_id = serializers.PrimaryKeyRelatedField(
        queryset=EthikosArgument.objects.all(),
        source="parent",
        write_only=True,
        required=False,
        allow_null=True,
    )

    source_count = serializers.IntegerField(read_only=True, required=False)
    impact_vote_count = serializers.IntegerField(read_only=True, required=False)
    suggestion_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = EthikosArgument
        fields = (
            "id",
            "topic",
            "user",
            "user_id",
            "content",
            "parent",
            "parent_id",
            "side",
            "is_hidden",
            "source_count",
            "impact_vote_count",
            "suggestion_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "user",
            "user_id",
            "source_count",
            "impact_vote_count",
            "suggestion_count",
            "created_at",
            "updated_at",
        )

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        """
        Prevent replies from being attached to arguments from another topic.

        Accepted input shapes:
        - {"parent": <argument_id>}
        - {"parent_id": <argument_id>}

        If both are provided, they must identify the same parent argument.
        """

        initial_data = getattr(self, "initial_data", {}) or {}
        raw_parent = initial_data.get("parent")
        raw_parent_id = initial_data.get("parent_id")

        if (
            raw_parent not in (None, "")
            and raw_parent_id not in (None, "")
            and str(raw_parent) != str(raw_parent_id)
        ):
            raise serializers.ValidationError(
                {
                    "parent_id": (
                        "Use either parent or parent_id, or provide the same "
                        "argument id for both fields."
                    )
                }
            )

        topic = attrs.get("topic") or getattr(self.instance, "topic", None)
        parent = attrs.get("parent")

        if parent is not None and topic is not None and parent.topic_id != topic.id:
            raise serializers.ValidationError(
                {"parent_id": "Parent argument belongs to another topic."}
            )

        return attrs


class ArgumentSourceSerializer(serializers.ModelSerializer):
    """
    Source/citation attached to an EthikosArgument.

    This is a Korum/Kialo-style additive model. It does not replace
    EthikosArgument.
    """

    created_by = serializers.StringRelatedField(read_only=True)
    created_by_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = ArgumentSource
        fields = (
            "id",
            "argument",
            "url",
            "title",
            "excerpt",
            "source_type",
            "citation_text",
            "quote",
            "note",
            "is_removed",
            "created_by",
            "created_by_id",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "created_by",
            "created_by_id",
            "created_at",
            "updated_at",
        )

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        url = attrs.get("url")
        citation_text = attrs.get("citation_text")
        quote = attrs.get("quote")
        note = attrs.get("note")

        if not any(
            bool(str(value).strip())
            for value in (url, citation_text, quote, note)
            if value is not None
        ):
            raise serializers.ValidationError(
                "Provide at least one of url, citation_text, quote, or note."
            )

        return attrs


class ArgumentImpactVoteSerializer(serializers.ModelSerializer):
    """
    Argument-level impact vote serializer.

    This is not EthikosStance and not a Smart Vote reading.
    """

    user = serializers.StringRelatedField(read_only=True)
    user_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = ArgumentImpactVote
        fields = (
            "id",
            "argument",
            "user",
            "user_id",
            "value",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "user",
            "user_id",
            "created_at",
            "updated_at",
        )

    def validate_value(self, value: int) -> int:
        if value < ARGUMENT_IMPACT_VOTE_MIN or value > ARGUMENT_IMPACT_VOTE_MAX:
            raise serializers.ValidationError(
                (
                    "Argument impact vote must be between "
                    f"{ARGUMENT_IMPACT_VOTE_MIN} and {ARGUMENT_IMPACT_VOTE_MAX}."
                )
            )

        return value


class ArgumentSuggestionSerializer(serializers.ModelSerializer):
    """
    Suggested argument/reply serializer.

    Suggestions are reviewed into EthikosArgument records. They do not replace
    EthikosArgument itself.
    """

    created_by = serializers.StringRelatedField(read_only=True)
    created_by_id = serializers.IntegerField(read_only=True)

    reviewed_by = serializers.StringRelatedField(read_only=True)
    reviewed_by_id = serializers.IntegerField(read_only=True)

    parent = serializers.PrimaryKeyRelatedField(
        queryset=EthikosArgument.objects.all(),
        required=False,
        allow_null=True,
    )
    parent_id = serializers.PrimaryKeyRelatedField(
        queryset=EthikosArgument.objects.all(),
        source="parent",
        write_only=True,
        required=False,
        allow_null=True,
    )

    accepted_argument = serializers.PrimaryKeyRelatedField(
        queryset=EthikosArgument.objects.all(),
        required=False,
        allow_null=True,
    )
    accepted_argument_id = serializers.PrimaryKeyRelatedField(
        queryset=EthikosArgument.objects.all(),
        source="accepted_argument",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = ArgumentSuggestion
        fields = (
            "id",
            "topic",
            "parent",
            "parent_id",
            "side",
            "content",
            "status",
            "accepted_argument",
            "accepted_argument_id",
            "created_by",
            "created_by_id",
            "reviewed_by",
            "reviewed_by_id",
            "reviewed_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "created_by",
            "created_by_id",
            "reviewed_by",
            "reviewed_by_id",
            "reviewed_at",
            "created_at",
            "updated_at",
        )

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        """
        Keep suggestions scoped to one topic.

        If parent or accepted_argument is provided, it must belong to the same
        topic as the suggestion.
        """

        initial_data = getattr(self, "initial_data", {}) or {}

        raw_parent = initial_data.get("parent")
        raw_parent_id = initial_data.get("parent_id")
        if (
            raw_parent not in (None, "")
            and raw_parent_id not in (None, "")
            and str(raw_parent) != str(raw_parent_id)
        ):
            raise serializers.ValidationError(
                {
                    "parent_id": (
                        "Use either parent or parent_id, or provide the same "
                        "argument id for both fields."
                    )
                }
            )

        raw_accepted = initial_data.get("accepted_argument")
        raw_accepted_id = initial_data.get("accepted_argument_id")
        if (
            raw_accepted not in (None, "")
            and raw_accepted_id not in (None, "")
            and str(raw_accepted) != str(raw_accepted_id)
        ):
            raise serializers.ValidationError(
                {
                    "accepted_argument_id": (
                        "Use either accepted_argument or accepted_argument_id, "
                        "or provide the same argument id for both fields."
                    )
                }
            )

        topic = attrs.get("topic") or getattr(self.instance, "topic", None)
        parent = attrs.get("parent")
        accepted_argument = attrs.get("accepted_argument")

        if parent is not None and topic is not None and parent.topic_id != topic.id:
            raise serializers.ValidationError(
                {"parent_id": "Parent argument belongs to another topic."}
            )

        if (
            accepted_argument is not None
            and topic is not None
            and accepted_argument.topic_id != topic.id
        ):
            raise serializers.ValidationError(
                {
                    "accepted_argument_id": (
                        "Accepted argument belongs to another topic."
                    )
                }
            )

        return attrs


class DiscussionParticipantRoleSerializer(serializers.ModelSerializer):
    """
    Per-topic participant role serializer.

    These are Kialo-style discussion roles, not Django permission group names.

    Read shape:
    - user: display string
    - user_id: raw participant user id
    - assigned_by / assigned_by_id: assignment actor

    Write shape:
    - target_user_id: explicit participant user id mapped to model field `user`
    """

    user = serializers.StringRelatedField(read_only=True)
    user_id = serializers.IntegerField(read_only=True)

    target_user_id = serializers.PrimaryKeyRelatedField(
        queryset=get_user_model().objects.all(),
        source="user",
        write_only=True,
        required=False,
    )

    assigned_by = serializers.StringRelatedField(read_only=True)
    assigned_by_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = DiscussionParticipantRole
        fields = (
            "id",
            "topic",
            "user",
            "user_id",
            "target_user_id",
            "role",
            "assigned_by",
            "assigned_by_id",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "user",
            "user_id",
            "assigned_by",
            "assigned_by_id",
            "created_at",
            "updated_at",
        )
        # POST is an intentional upsert by (topic, user).
        # Uniqueness remains enforced by the database constraint.
        validators = []

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if self.instance is None and attrs.get("user") is None:
            raise serializers.ValidationError(
                {"target_user_id": "Participant user is required."}
            )

        target_user = attrs.get("user") or getattr(self.instance, "user", None)
        runtime = get_world_runtime()
        if runtime is not None and target_user is not None and not user_belongs_to_release(
            user_id=target_user.pk, release_id=runtime.release_id
        ):
            raise serializers.ValidationError(
                {"target_user_id": "Participant does not belong to the active World release."}
            )

        return attrs


class DiscussionVisibilitySettingSerializer(serializers.ModelSerializer):
    """
    Per-topic visibility and participation settings serializer.
    """

    # POST intentionally upserts by topic. Database OneToOne uniqueness remains.
    topic = serializers.PrimaryKeyRelatedField(
        queryset=EthikosTopic.objects.all(),
    )

    changed_by = serializers.StringRelatedField(read_only=True)
    changed_by_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = DiscussionVisibilitySetting
        fields = (
            "id",
            "topic",
            "participation_type",
            "author_visibility",
            "vote_visibility",
            "changed_by",
            "changed_by_id",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "changed_by",
            "changed_by_id",
            "created_at",
            "updated_at",
        )

class DecisionProtocolSerializer(serializers.ModelSerializer):
    class Meta:
        model = DecisionProtocol
        fields = (
            "id",
            "key",
            "label",
            "description",
            "protocol_type",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class DecisionRecordSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    created_by_id = serializers.IntegerField(read_only=True)
    artifact_id = serializers.CharField(read_only=True)

    class Meta:
        model = DecisionRecord
        fields = (
            "id",
            "topic",
            "protocol",
            "title",
            "description",
            "status",
            "opened_at",
            "closed_at",
            "published_at",
            "revision",
            "baseline_result_json",
            "reading_result_refs",
            "published_payload",
            "artifact_id",
            "artifact_digest",
            "created_by",
            "created_by_id",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "published_at",
            "revision",
            "published_payload",
            "artifact_id",
            "artifact_digest",
            "created_by",
            "created_by_id",
            "created_at",
            "updated_at",
        )

    def validate_reading_result_refs(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("reading_result_refs must be a list.")
        if any(not isinstance(item, (str, int)) for item in value):
            raise serializers.ValidationError("reading_result_refs items must be string/int references.")
        return value

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        current_status = getattr(self.instance, "status", DecisionRecord.STATUS_DRAFT)
        next_status = attrs.get("status", current_status)
        closed_at = attrs.get("closed_at", getattr(self.instance, "closed_at", None))

        if self.instance is not None and current_status == DecisionRecord.STATUS_PUBLISHED:
            # Published payload/digest are immutable. Archiving changes discoverability,
            # not the frozen artifact itself.
            attempted = set(attrs) - {"status"}
            if attempted or next_status not in {
                DecisionRecord.STATUS_PUBLISHED,
                DecisionRecord.STATUS_ARCHIVED,
            }:
                raise serializers.ValidationError(
                    "Published DecisionRecord is immutable; only archive transition is allowed."
                )

        if next_status == DecisionRecord.STATUS_PUBLISHED and current_status != DecisionRecord.STATUS_PUBLISHED:
            raise serializers.ValidationError(
                {"status": "Use the publish action so artifact snapshot/digest are frozen atomically."}
            )
        if next_status == DecisionRecord.STATUS_CLOSED and closed_at is None:
            raise serializers.ValidationError({"closed_at": "closed_at is required when status=closed."})
        return attrs
