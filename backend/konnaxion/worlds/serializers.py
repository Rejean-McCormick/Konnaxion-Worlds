from rest_framework import serializers

from .models import (
    SeedPackRecord,
    World,
    WorldAuditEvent,
    WorldBuildJob,
    WorldMembership,
    WorldPersona,
    WorldRelease,
    WorldSnapshot,
)


class WorldReleaseSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = WorldRelease
        fields = (
            "id", "release_number", "status", "seed_pack_key", "seed_version",
            "is_dirty", "dirty_since", "promoted_at", "created_at",
        )
        read_only_fields = fields


class WorldReleaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorldRelease
        fields = (
            "id", "release_number", "status", "domain_schema", "ekoh_schema",
            "seed_pack_key", "seed_version", "seed_checksum", "scenario_schema_version",
            "domain_migration_fingerprint", "ekoh_migration_fingerprint",
            "is_dirty", "dirty_since", "build_started_at", "build_finished_at",
            "promoted_at", "validation_report_json", "build_reason", "parent_release_id",
            "created_at",
        )
        read_only_fields = fields


class WorldBuildJobSerializer(serializers.ModelSerializer):
    release = WorldReleaseSummarySerializer(read_only=True)

    class Meta:
        model = WorldBuildJob
        fields = (
            "id", "world_id", "release_id", "release", "requested_by_id",
            "seed_pack_key", "seed_version", "promote_after_build", "status",
            "celery_task_id", "queue_name", "concurrency_slot", "attempts",
            "error_text", "metadata_json", "created_at", "updated_at",
            "started_at", "finished_at",
        )
        read_only_fields = fields


class WorldSerializer(serializers.ModelSerializer):
    current_release = WorldReleaseSummarySerializer(read_only=True)
    can_manage = serializers.SerializerMethodField()

    class Meta:
        model = World
        fields = (
            "id", "key", "title", "description", "status", "visibility",
            "current_release", "parent_world_id", "can_manage",
            "created_at", "updated_at", "archived_at",
        )
        read_only_fields = (
            "id", "current_release", "parent_world_id", "can_manage",
            "created_at", "updated_at", "archived_at",
        )

    def get_can_manage(self, obj) -> bool:
        request = self.context.get("request")
        if not request or not getattr(request, "user", None) or not request.user.is_authenticated:
            return False
        user = request.user
        if user.is_staff or user.is_superuser or obj.created_by_id == user.pk:
            return True
        hint = getattr(obj, "can_manage_membership", None)
        if hint is not None:
            return bool(hint)
        return obj.memberships.filter(
            user=user, is_active=True, role__in=("owner", "maintainer")
        ).exists()

    def validate_key(self, value: str) -> str:
        value = value.strip().lower()
        if self.instance and self.instance.pk and value != self.instance.key:
            if self.instance.releases.exists():
                raise serializers.ValidationError(
                    "World key is immutable after the first release has been created."
                )
        return value


class SeedPackRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = SeedPackRecord
        fields = (
            "id", "key", "version", "manifest_path", "checksum",
            "scenario_schema_version", "discovered_at", "metadata_json",
        )
        read_only_fields = fields


class WorldPersonaSerializer(serializers.ModelSerializer):
    bridge_user_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = WorldPersona
        fields = (
            "id", "source_key", "display_name", "persona_type",
            "bridge_user_id", "metadata_json",
        )
        read_only_fields = fields


class WorldSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorldSnapshot
        fields = (
            "id", "world_id", "source_release_id", "frozen_release_id",
            "label", "status", "manifest_json", "artifact_location",
            "checksum", "created_by_id", "created_at",
        )
        read_only_fields = fields


class WorldMembershipSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    display_name = serializers.CharField(source="user.name", read_only=True)

    class Meta:
        model = WorldMembership
        fields = (
            "id", "world_id", "user_id", "username", "display_name",
            "role", "is_active", "created_at",
        )
        read_only_fields = ("id", "world_id", "username", "display_name", "created_at")


class WorldAuditEventSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source="actor.username", read_only=True)

    class Meta:
        model = WorldAuditEvent
        fields = (
            "id", "world_id", "release_id", "actor_id", "actor_username",
            "event_type", "request_id", "metadata_json", "created_at",
        )
        read_only_fields = fields
