from rest_framework import serializers

from .models import (
    SeedPackRecord,
    Universe,
    UniverseMembership,
    World,
    WorldAuditEvent,
    WorldBuildJob,
    WorldMembership,
    WorldPersona,
    WorldPublication,
    WorldRelation,
    WorldRelease,
    WorldSnapshot,
    WorldSubscription,
)


class UniverseSerializer(serializers.ModelSerializer):
    default_world_key = serializers.SlugRelatedField(
        source="default_world",
        slug_field="key",
        queryset=World.objects.all(),
        allow_null=True,
        required=False,
    )
    world_count = serializers.IntegerField(read_only=True, required=False)
    can_manage = serializers.SerializerMethodField()

    class Meta:
        model = Universe
        fields = (
            "id", "key", "title", "description", "status", "visibility",
            "default_world_key", "world_count", "can_manage", "metadata_json",
            "created_at", "updated_at", "archived_at",
        )
        read_only_fields = (
            "id", "world_count", "can_manage", "created_at", "updated_at", "archived_at",
        )

    def get_can_manage(self, obj) -> bool:
        request = self.context.get("request")
        user = getattr(request, "user", None) if request else None
        if not user or not user.is_authenticated:
            return False
        if user.is_staff or user.is_superuser or obj.created_by_id == user.pk:
            return True
        return obj.memberships.filter(
            user=user, is_active=True, role__in=("owner", "maintainer")
        ).exists()

    def validate_default_world_key(self, world):
        if world is None:
            return None
        universe = self.instance
        requested_key = self.initial_data.get("key") if universe is None else universe.key
        if universe is not None and world.universe_id != universe.id:
            raise serializers.ValidationError("Default World must belong to this Universe.")
        if universe is None and world.universe.key != requested_key:
            raise serializers.ValidationError(
                "Assign default_world_key after creating the Universe and its Worlds."
            )
        return world


class UniverseMembershipSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = UniverseMembership
        fields = ("id", "universe_id", "user_id", "username", "role", "is_active", "created_at")
        read_only_fields = ("id", "universe_id", "username", "created_at")


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
    universe_id = serializers.IntegerField(read_only=True)
    universe_key = serializers.SlugRelatedField(
        source="universe", slug_field="key", queryset=Universe.objects.all()
    )
    universe_title = serializers.CharField(source="universe.title", read_only=True)
    current_release = WorldReleaseSummarySerializer(read_only=True)
    can_manage = serializers.SerializerMethodField()

    class Meta:
        model = World
        fields = (
            "id", "universe_id", "universe_key", "universe_title",
            "key", "title", "description", "status", "visibility",
            "current_release", "parent_world_id", "can_manage",
            "created_at", "updated_at", "archived_at",
        )
        read_only_fields = (
            "id", "universe_id", "universe_title", "current_release", "parent_world_id", "can_manage",
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

    def validate_universe_key(self, universe: Universe) -> Universe:
        if self.instance and self.instance.pk and universe.pk != self.instance.universe_id:
            raise serializers.ValidationError(
                "Moving an existing World between Universes is not supported; clone/fork it instead."
            )
        return universe

    def validate_key(self, value: str) -> str:
        value = value.strip().lower()
        if self.instance and self.instance.pk and value != self.instance.key:
            if self.instance.releases.exists():
                raise serializers.ValidationError(
                    "World key is immutable after the first release has been created."
                )
        return value


class WorldRelationSerializer(serializers.ModelSerializer):
    source_world_key = serializers.SlugRelatedField(source="source_world", slug_field="key", queryset=World.objects.all())
    target_world_key = serializers.SlugRelatedField(source="target_world", slug_field="key", queryset=World.objects.all())
    universe_key = serializers.CharField(source="universe.key", read_only=True)

    class Meta:
        model = WorldRelation
        fields = (
            "id", "universe_id", "universe_key", "source_world_key",
            "target_world_key", "relation_type", "title", "description",
            "metadata_json", "created_at",
        )
        read_only_fields = ("id", "universe_id", "universe_key", "created_at")

    def validate(self, attrs):
        attrs = super().validate(attrs)
        source = attrs.get("source_world") or getattr(self.instance, "source_world", None)
        target = attrs.get("target_world") or getattr(self.instance, "target_world", None)
        universe = self.context.get("universe")
        if source and target and source.pk == target.pk:
            raise serializers.ValidationError("A World relation must connect distinct Worlds.")
        if universe and source and source.universe_id != universe.id:
            raise serializers.ValidationError("Source World must belong to this Universe.")
        if universe and target and target.universe_id != universe.id:
            raise serializers.ValidationError("Target World must belong to this Universe.")
        return attrs


class WorldPublicationSerializer(serializers.ModelSerializer):
    source_world_key = serializers.SlugRelatedField(source="source_world", slug_field="key", queryset=World.objects.all())
    source_release_id = serializers.PrimaryKeyRelatedField(
        source="source_release", queryset=WorldRelease.objects.all(), allow_null=True, required=False
    )
    source_release_number = serializers.IntegerField(source="source_release.release_number", read_only=True)

    class Meta:
        model = WorldPublication
        fields = (
            "id", "source_world_key", "source_release_id", "source_release_number",
            "publication_type", "key", "version", "title", "summary",
            "payload_json", "artifact_location", "checksum", "created_by_id", "created_at",
        )
        read_only_fields = ("id", "source_release_number", "created_by_id", "created_at")

    def validate(self, attrs):
        attrs = super().validate(attrs)
        source_world = attrs.get("source_world") or getattr(self.instance, "source_world", None)
        source_release = attrs.get("source_release") or getattr(self.instance, "source_release", None)
        universe = self.context.get("universe")
        if universe and source_world and source_world.universe_id != universe.id:
            raise serializers.ValidationError("Publication source World must belong to this Universe.")
        if source_release and source_world and source_release.world_id != source_world.id:
            raise serializers.ValidationError("Publication release must belong to source World.")
        return attrs


class WorldSubscriptionSerializer(serializers.ModelSerializer):
    consumer_world_key = serializers.SlugRelatedField(source="consumer_world", slug_field="key", queryset=World.objects.all())
    source_world_key = serializers.SlugRelatedField(source="source_world", slug_field="key", queryset=World.objects.all())

    class Meta:
        model = WorldSubscription
        fields = ("id", "consumer_world_key", "source_world_key", "publication_type", "status", "metadata_json", "created_at")
        read_only_fields = ("id", "created_at")

    def validate(self, attrs):
        attrs = super().validate(attrs)
        consumer = attrs.get("consumer_world") or getattr(self.instance, "consumer_world", None)
        source = attrs.get("source_world") or getattr(self.instance, "source_world", None)
        universe = self.context.get("universe")
        if consumer and source and consumer.id == source.id:
            raise serializers.ValidationError("A World cannot subscribe to itself.")
        if universe:
            if consumer and consumer.universe_id != universe.id:
                raise serializers.ValidationError("Consumer World must belong to this Universe.")
            if source and source.universe_id != universe.id:
                raise serializers.ValidationError("Source World must belong to this Universe.")
        return attrs


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
