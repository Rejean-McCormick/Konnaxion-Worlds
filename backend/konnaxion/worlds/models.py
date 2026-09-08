from __future__ import annotations

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models


WORLD_KEY_VALIDATOR = RegexValidator(
    regex=r"^[a-z0-9](?:[a-z0-9-]{0,118}[a-z0-9])?$",
    message="World keys must be lowercase letters/digits with optional internal hyphens.",
)


class SeedPackRecord(models.Model):
    key = models.SlugField(max_length=120)
    version = models.CharField(max_length=64)
    manifest_path = models.TextField()
    checksum = models.CharField(max_length=128)
    scenario_schema_version = models.CharField(max_length=80, blank=True)
    discovered_at = models.DateTimeField(auto_now=True)
    metadata_json = models.JSONField(default=dict, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=("key", "version"), name="uq_world_seed_pack_version")
        ]
        ordering = ("key", "-version")

    def __str__(self) -> str:
        return f"{self.key}@{self.version}"


class World(models.Model):
    STATUS_ACTIVE = "active"
    STATUS_MAINTENANCE = "maintenance"
    STATUS_ARCHIVED = "archived"
    STATUS_CHOICES = (
        (STATUS_ACTIVE, "Active"),
        (STATUS_MAINTENANCE, "Maintenance"),
        (STATUS_ARCHIVED, "Archived"),
    )
    VISIBILITY_PUBLIC = "public"
    VISIBILITY_PRIVATE = "private"
    VISIBILITY_CHOICES = (
        (VISIBILITY_PUBLIC, "Public"),
        (VISIBILITY_PRIVATE, "Private"),
    )

    key = models.SlugField(max_length=120, unique=True, validators=[WORLD_KEY_VALIDATOR])
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    visibility = models.CharField(
        max_length=16, choices=VISIBILITY_CHOICES, default=VISIBILITY_PRIVATE
    )
    current_release = models.ForeignKey(
        "WorldRelease", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="current_for_worlds",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="worlds_created",
    )
    parent_world = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="forks"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    archived_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("title", "key")

    def clean(self) -> None:
        super().clean()
        if self.current_release_id and self.current_release.world_id != self.pk:
            raise ValidationError({"current_release": "Release must belong to this World."})

    def __str__(self) -> str:
        return self.title


class WorldRelease(models.Model):
    STATUS_BUILDING = "building"
    STATUS_VALIDATING = "validating"
    STATUS_READY = "ready"
    STATUS_CURRENT = "current"
    STATUS_FROZEN = "frozen"
    STATUS_FAILED = "failed"
    STATUS_ARCHIVED = "archived"
    STATUS_CHOICES = tuple((value, value.title()) for value in (
        STATUS_BUILDING, STATUS_VALIDATING, STATUS_READY, STATUS_CURRENT,
        STATUS_FROZEN, STATUS_FAILED, STATUS_ARCHIVED,
    ))

    world = models.ForeignKey(World, on_delete=models.CASCADE, related_name="releases")
    release_number = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_BUILDING)
    domain_schema = models.CharField(max_length=63, unique=True)
    ekoh_schema = models.CharField(max_length=63, unique=True)
    seed_pack = models.ForeignKey(
        SeedPackRecord, null=True, blank=True, on_delete=models.SET_NULL, related_name="releases"
    )
    seed_pack_key = models.CharField(max_length=120, blank=True)
    seed_version = models.CharField(max_length=64, blank=True)
    seed_checksum = models.CharField(max_length=128, blank=True)
    scenario_schema_version = models.CharField(max_length=80, blank=True)
    domain_migration_fingerprint = models.CharField(max_length=128, blank=True)
    ekoh_migration_fingerprint = models.CharField(max_length=128, blank=True)
    fixture_checksum = models.CharField(max_length=128, blank=True)
    build_started_at = models.DateTimeField(null=True, blank=True)
    build_finished_at = models.DateTimeField(null=True, blank=True)
    promoted_at = models.DateTimeField(null=True, blank=True)
    is_dirty = models.BooleanField(default=False)
    dirty_since = models.DateTimeField(null=True, blank=True)
    build_metadata_json = models.JSONField(default=dict, blank=True)
    validation_report_json = models.JSONField(default=dict, blank=True)
    parent_release = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="derived_releases"
    )
    build_reason = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=("world", "release_number"), name="uq_world_release_number"),
            models.UniqueConstraint(
                fields=("world",),
                condition=models.Q(status="current"),
                name="uq_world_one_current",
            ),
            models.CheckConstraint(
                condition=~models.Q(domain_schema=models.F("ekoh_schema")),
                name="ck_world_schema_distinct",
            ),
        ]
        indexes = [
            models.Index(fields=("world", "status"), name="ix_world_release_status"),
        ]
        ordering = ("world", "-release_number")

    def clean(self) -> None:
        super().clean()
        if self.domain_schema == self.ekoh_schema:
            raise ValidationError("Domain and EkoH schemas must be distinct.")

    def __str__(self) -> str:
        return f"{self.world.key} r{self.release_number}"


class WorldMembership(models.Model):
    ROLE_OWNER = "owner"
    ROLE_MAINTAINER = "maintainer"
    ROLE_PRESENTER = "presenter"
    ROLE_MEMBER = "member"
    ROLE_VIEWER = "viewer"
    ROLE_CHOICES = tuple((v, v.title()) for v in (
        ROLE_OWNER, ROLE_MAINTAINER, ROLE_PRESENTER, ROLE_MEMBER, ROLE_VIEWER
    ))

    world = models.ForeignKey(World, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="world_memberships"
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_VIEWER)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=("world", "user"), name="uq_world_membership_user")
        ]
        indexes = [
            models.Index(fields=("user", "is_active"), name="ix_world_membership_user"),
        ]


class WorldPersona(models.Model):
    TYPE_SIMULATED = "simulated_person"
    TYPE_THINKER = "cited_thinker"
    TYPE_CITIZEN = "citizen"
    TYPE_EXPERT = "expert"
    TYPE_ORGANIZATION = "organization"
    TYPE_DEMO_ACTOR = "demo_actor"
    TYPE_CHOICES = tuple((v, v.replace("_", " " ).title()) for v in (
        TYPE_SIMULATED, TYPE_THINKER, TYPE_CITIZEN, TYPE_EXPERT, TYPE_ORGANIZATION, TYPE_DEMO_ACTOR
    ))

    world = models.ForeignKey(World, on_delete=models.CASCADE, related_name="personas")
    source_key = models.CharField(max_length=160)
    bridge_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="current_world_personas",
    )
    display_name = models.CharField(max_length=255)
    persona_type = models.CharField(max_length=32, choices=TYPE_CHOICES, default=TYPE_DEMO_ACTOR)
    metadata_json = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=("world", "source_key"), name="uq_world_persona_source")
        ]
        indexes = [
            models.Index(fields=("world", "display_name"), name="ix_world_persona_name"),
        ]
        ordering = ("display_name",)

    def __str__(self) -> str:
        return f"{self.world.key}:{self.display_name}"


class WorldPersonaBridge(models.Model):
    """Release-specific auth bridge for a stable WorldPersona.

    This prevents a build of rN+1 from mutating the bridge user referenced by rN.
    """
    persona = models.ForeignKey(WorldPersona, on_delete=models.CASCADE, related_name="release_bridges")
    release = models.ForeignKey(WorldRelease, on_delete=models.CASCADE, related_name="persona_bridges")
    bridge_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="world_persona_bridges"
    )
    display_name = models.CharField(max_length=255)
    metadata_json = models.JSONField(default=dict, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=("persona", "release"), name="uq_world_persona_release_bridge"),
            models.UniqueConstraint(fields=("release", "bridge_user"), name="uq_world_release_bridge_user"),
        ]


class WorldSnapshot(models.Model):
    STATUS_CREATING = "creating"
    STATUS_READY = "ready"
    STATUS_FAILED = "failed"
    STATUS_CHOICES = tuple((v, v.title()) for v in (STATUS_CREATING, STATUS_READY, STATUS_FAILED))

    world = models.ForeignKey(World, on_delete=models.CASCADE, related_name="snapshots")
    source_release = models.ForeignKey(
        WorldRelease, on_delete=models.PROTECT, related_name="source_snapshots"
    )
    frozen_release = models.ForeignKey(
        WorldRelease, null=True, blank=True, on_delete=models.PROTECT, related_name="frozen_snapshots"
    )
    label = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_CREATING)
    manifest_json = models.JSONField(default=dict, blank=True)
    artifact_location = models.TextField(blank=True)
    checksum = models.CharField(max_length=128, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="world_snapshots_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=("world", "status", "created_at"), name="ix_world_snapshot_state"),
        ]
        ordering = ("-created_at",)

    def clean(self) -> None:
        super().clean()
        if self.source_release_id and self.world_id and self.source_release.world_id != self.world_id:
            raise ValidationError("Snapshot source release must belong to the same World.")
        if self.frozen_release_id and self.world_id and self.frozen_release.world_id != self.world_id:
            raise ValidationError("Snapshot frozen release must belong to the same World.")


class WorldBuildJob(models.Model):
    """Persistent control-plane job for a Seed Pack -> WorldRelease build.

    Jobs are deliberately separate from ``WorldRelease``: a queued build may not
    have created a Release yet, and the queue state must survive HTTP requests and
    browser/manager restarts.
    """

    STATUS_QUEUED = "queued"
    STATUS_BUILDING = "building"
    STATUS_VALIDATING = "validating"
    STATUS_READY = "ready"
    STATUS_FAILED = "failed"
    STATUS_CHOICES = tuple(
        (value, value.title())
        for value in (
            STATUS_QUEUED,
            STATUS_BUILDING,
            STATUS_VALIDATING,
            STATUS_READY,
            STATUS_FAILED,
        )
    )
    TERMINAL_STATUSES = (STATUS_READY, STATUS_FAILED)

    world = models.ForeignKey(World, on_delete=models.CASCADE, related_name="build_jobs")
    release = models.ForeignKey(
        WorldRelease,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="build_jobs",
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="world_build_jobs_requested",
    )
    seed_pack_key = models.CharField(max_length=120)
    seed_version = models.CharField(max_length=64, blank=True)
    promote_after_build = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_QUEUED)
    celery_task_id = models.CharField(max_length=255, blank=True)
    queue_name = models.CharField(max_length=80, default="world-build")
    concurrency_slot = models.PositiveSmallIntegerField(null=True, blank=True)
    attempts = models.PositiveIntegerField(default=0)
    error_text = models.TextField(blank=True)
    metadata_json = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=("status", "created_at"), name="ix_world_buildjob_state"),
            models.Index(fields=("world", "status"), name="ix_world_buildjob_world"),
        ]
        ordering = ("-created_at",)

    def clean(self) -> None:
        super().clean()
        if self.release_id and self.world_id and self.release.world_id != self.world_id:
            raise ValidationError("Build job release must belong to the same World.")

    def __str__(self) -> str:
        version = self.seed_version or "latest"
        return f"{self.world.key}:{self.seed_pack_key}@{version} [{self.status}]"


class WorldAuditEvent(models.Model):
    world = models.ForeignKey(World, null=True, blank=True, on_delete=models.SET_NULL, related_name="audit_events")
    release = models.ForeignKey(
        WorldRelease, null=True, blank=True, on_delete=models.SET_NULL, related_name="audit_events"
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="world_audit_events",
    )
    event_type = models.CharField(max_length=80, db_index=True)
    request_id = models.CharField(max_length=120, blank=True)
    metadata_json = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ("-created_at",)
