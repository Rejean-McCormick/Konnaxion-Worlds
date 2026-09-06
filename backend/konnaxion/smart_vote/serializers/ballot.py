"""Source-ballot input/output schema for Smart Vote."""

from rest_framework import serializers

from konnaxion.ekoh.db import ekoh_smartvote_db_scope
from konnaxion.smart_vote.models.core import Vote, VoteModality


class BallotSerializer(serializers.Serializer):
    consultation = serializers.UUIDField()
    target_id = serializers.UUIDField()
    modality = serializers.ChoiceField(
        choices=[m[0] for m in VoteModality._meta.get_field("name").choices]
    )
    raw_value = serializers.DecimalField(max_digits=12, decimal_places=4)

    def validate(self, attrs):
        user = self.context["request"].user
        with ekoh_smartvote_db_scope():
            already_exists = Vote.objects.filter(
                user=user,
                target_type="consultation",
                target_id=attrs["target_id"],
            ).exists()

        if already_exists:
            raise serializers.ValidationError(
                "You have already voted on this target."
            )
        return attrs

    def create(self, validated_data):
        user = self.context["request"].user

        with ekoh_smartvote_db_scope():
            modality = VoteModality.objects.get(name=validated_data["modality"])
            return Vote.objects.create(
                user=user,
                target_type="consultation",
                target_id=validated_data["target_id"],
                modality=modality,
                raw_value=validated_data["raw_value"],
                weighted_value=None,
            )

    id = serializers.IntegerField(read_only=True)
    weighted_value = serializers.DecimalField(
        max_digits=12,
        decimal_places=4,
        read_only=True,
        allow_null=True,
    )
