# backend/konnaxion/teambuilder/serializers.py
from django.contrib.auth import get_user_model
from rest_framework import serializers

from konnaxion.worlds.runtime import get_world_runtime
from konnaxion.worlds.services.personas import user_belongs_to_release

from konnaxion.users.api.serializers import UserSerializer
from .models import (
    BuilderSession,
    Team,
    TeamMember,
    Problem,
    ProblemChangeEvent,
)

User = get_user_model()


# ---------------------------------------------------------------------------
# Team / session serializers (existing, extended with optional Problem link)
# ---------------------------------------------------------------------------


class TeamMemberSerializer(serializers.ModelSerializer):
    """
    Serializes a member within a team, expanding the User details.
    """
    user = UserSerializer(read_only=True)

    class Meta:
        model = TeamMember
        fields = ["id", "user", "suggested_role", "match_reason"]


class TeamSerializer(serializers.ModelSerializer):
    """
    Serializes a generated team and its members.
    """
    members = TeamMemberSerializer(many=True, read_only=True)

    class Meta:
        model = Team
        fields = ["id", "name", "metrics", "members", "created_at"]


class BuilderSessionSerializer(serializers.ModelSerializer):
    """
    Serializes the session configuration and the resulting teams.
    """
    teams = TeamSerializer(many=True, read_only=True)

    # Helper to see how many people are in the pool without loading all User objects
    candidates_count = serializers.IntegerField(
        source="candidates.count",
        read_only=True,
    )

    # Field to accept a list of User IDs when creating/updating the session
    candidate_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.all(),
        write_only=True,
        source="candidates",
    )

    # Optional link to a reusable Problem template
    problem = serializers.PrimaryKeyRelatedField(
        read_only=True,
    )
    problem_id = serializers.PrimaryKeyRelatedField(
        queryset=Problem.objects.all(),
        source="problem",
        write_only=True,
        required=False,
        allow_null=True,
    )


    def validate_candidate_ids(self, users):
        runtime = get_world_runtime()
        if runtime is None:
            return users
        invalid = [
            user.pk
            for user in users
            if not user_belongs_to_release(user_id=user.pk, release_id=runtime.release_id)
        ]
        if invalid:
            raise serializers.ValidationError(
                f"Candidate users do not belong to the active World release: {invalid}"
            )
        return users

    class Meta:
        model = BuilderSession
        fields = [
            "id",
            "name",
            "description",
            "status",
            "algorithm_config",
            "created_by",
            "created_at",
            "updated_at",
            "teams",
            "candidates_count",
            "candidate_ids",
            "problem",      # read-only: problem UUID
            "problem_id",   # write-only: for create/update
        ]
        read_only_fields = ["created_by", "created_at", "updated_at", "status"]


# ---------------------------------------------------------------------------
# Problem serializers (for problems library / detail pages)
# ---------------------------------------------------------------------------


class ProblemSerializer(serializers.ModelSerializer):
    """
    Basic serializer for Problem used in list & detail views.
    Adds usage_count and average_outcome as optional read-only fields
    that a view can populate via annotation or custom logic.
    """

    usage_count = serializers.IntegerField(
        read_only=True,
        help_text="Number of sessions referencing this problem.",
    )
    # Use SerializerMethodField so we don't require a real model/annotation field.
    average_outcome = serializers.SerializerMethodField()

    def get_average_outcome(self, obj) -> float | None:
        # If the queryset later annotates average_outcome, this will pick it up.
        # For now it safely returns None if not present.
        return getattr(obj, "average_outcome", None)

    class Meta:
        model = Problem
        fields = [
            "id",
            "name",
            "description",
            "status",
            "risk_level",
            "min_team_size",
            "max_team_size",
            "unesco_codes",
            "categories",
            "recommended_modes",
            "facilitator_notes",
            "created_by",
            "created_at",
            "updated_at",
            "usage_count",
            "average_outcome",
        ]
        read_only_fields = ["created_by", "created_at", "updated_at"]


class ProblemChangeEventSerializer(serializers.ModelSerializer):
    """
    Serializer for Problem change history entries, used to populate
    the timeline in the problem detail view.
    """

    changed_by = UserSerializer(read_only=True)

    class Meta:
        model = ProblemChangeEvent
        fields = [
            "id",
            "type",
            "title",
            "description",
            "timestamp",
            "changed_by",
        ]


class ProblemSessionSummarySerializer(serializers.ModelSerializer):
    """
    Lightweight summary of a BuilderSession for inclusion in
    Problem detail (sessions tab).
    """

    class Meta:
        model = BuilderSession
        fields = [
            "id",
            "name",
            "status",
            "algorithm_config",
            "created_at",
        ]
