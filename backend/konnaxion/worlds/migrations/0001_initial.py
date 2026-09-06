from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="SeedPackRecord",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("key", models.SlugField(max_length=120)),
                ("version", models.CharField(max_length=64)),
                ("manifest_path", models.TextField()),
                ("checksum", models.CharField(max_length=128)),
                ("scenario_schema_version", models.CharField(blank=True, max_length=80)),
                ("discovered_at", models.DateTimeField(auto_now=True)),
                ("metadata_json", models.JSONField(blank=True, default=dict)),
            ],
            options={"ordering": ("key", "-version")},
        ),
        migrations.CreateModel(
            name="World",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("key", models.SlugField(max_length=120, unique=True)),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("status", models.CharField(choices=[("active", "Active"), ("maintenance", "Maintenance"), ("archived", "Archived")], default="active", max_length=20)),
                ("visibility", models.CharField(choices=[("public", "Public"), ("private", "Private")], default="private", max_length=16)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("archived_at", models.DateTimeField(blank=True, null=True)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="worlds_created", to=settings.AUTH_USER_MODEL)),
                ("parent_world", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="forks", to="worlds.world")),
            ],
            options={"ordering": ("title", "key")},
        ),
        migrations.CreateModel(
            name="WorldRelease",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("release_number", models.PositiveIntegerField()),
                ("status", models.CharField(choices=[("building", "Building"), ("validating", "Validating"), ("ready", "Ready"), ("current", "Current"), ("frozen", "Frozen"), ("failed", "Failed"), ("archived", "Archived")], default="building", max_length=20)),
                ("domain_schema", models.CharField(max_length=63, unique=True)),
                ("ekoh_schema", models.CharField(max_length=63, unique=True)),
                ("seed_pack_key", models.CharField(blank=True, max_length=120)),
                ("seed_version", models.CharField(blank=True, max_length=64)),
                ("seed_checksum", models.CharField(blank=True, max_length=128)),
                ("scenario_schema_version", models.CharField(blank=True, max_length=80)),
                ("domain_migration_fingerprint", models.CharField(blank=True, max_length=128)),
                ("ekoh_migration_fingerprint", models.CharField(blank=True, max_length=128)),
                ("fixture_checksum", models.CharField(blank=True, max_length=128)),
                ("build_started_at", models.DateTimeField(blank=True, null=True)),
                ("build_finished_at", models.DateTimeField(blank=True, null=True)),
                ("promoted_at", models.DateTimeField(blank=True, null=True)),
                ("is_dirty", models.BooleanField(default=False)),
                ("dirty_since", models.DateTimeField(blank=True, null=True)),
                ("build_metadata_json", models.JSONField(blank=True, default=dict)),
                ("validation_report_json", models.JSONField(blank=True, default=dict)),
                ("build_reason", models.CharField(blank=True, max_length=64)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("parent_release", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="derived_releases", to="worlds.worldrelease")),
                ("seed_pack", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="releases", to="worlds.seedpackrecord")),
                ("world", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="releases", to="worlds.world")),
            ],
            options={"ordering": ("world", "-release_number")},
        ),
        migrations.AddField(
            model_name="world",
            name="current_release",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="current_for_worlds", to="worlds.worldrelease"),
        ),
        migrations.CreateModel(
            name="WorldMembership",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("role", models.CharField(choices=[("owner", "Owner"), ("maintainer", "Maintainer"), ("presenter", "Presenter"), ("member", "Member"), ("viewer", "Viewer")], default="viewer", max_length=20)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="world_memberships", to=settings.AUTH_USER_MODEL)),
                ("world", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="memberships", to="worlds.world")),
            ],
        ),
        migrations.CreateModel(
            name="WorldPersona",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("source_key", models.CharField(max_length=160)),
                ("display_name", models.CharField(max_length=255)),
                ("persona_type", models.CharField(choices=[("simulated_person", "Simulated Person"), ("cited_thinker", "Cited Thinker"), ("citizen", "Citizen"), ("expert", "Expert"), ("organization", "Organization"), ("demo_actor", "Demo Actor")], default="demo_actor", max_length=32)),
                ("metadata_json", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("bridge_user", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="current_world_personas", to=settings.AUTH_USER_MODEL)),
                ("world", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="personas", to="worlds.world")),
            ],
            options={"ordering": ("display_name",)},
        ),
        migrations.CreateModel(
            name="WorldPersonaBridge",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("display_name", models.CharField(max_length=255)),
                ("metadata_json", models.JSONField(blank=True, default=dict)),
                ("bridge_user", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="world_persona_bridges", to=settings.AUTH_USER_MODEL)),
                ("persona", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="release_bridges", to="worlds.worldpersona")),
                ("release", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="persona_bridges", to="worlds.worldrelease")),
            ],
        ),
        migrations.CreateModel(
            name="WorldSnapshot",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("label", models.CharField(max_length=255)),
                ("status", models.CharField(choices=[("creating", "Creating"), ("ready", "Ready"), ("failed", "Failed")], default="creating", max_length=20)),
                ("manifest_json", models.JSONField(blank=True, default=dict)),
                ("artifact_location", models.TextField(blank=True)),
                ("checksum", models.CharField(blank=True, max_length=128)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="world_snapshots_created", to=settings.AUTH_USER_MODEL)),
                ("frozen_release", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="frozen_snapshots", to="worlds.worldrelease")),
                ("source_release", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="source_snapshots", to="worlds.worldrelease")),
                ("world", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="snapshots", to="worlds.world")),
            ],
            options={"ordering": ("-created_at",)},
        ),
        migrations.CreateModel(
            name="WorldAuditEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("event_type", models.CharField(db_index=True, max_length=80)),
                ("request_id", models.CharField(blank=True, max_length=120)),
                ("metadata_json", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("actor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="world_audit_events", to=settings.AUTH_USER_MODEL)),
                ("release", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="audit_events", to="worlds.worldrelease")),
                ("world", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="audit_events", to="worlds.world")),
            ],
            options={"ordering": ("-created_at",)},
        ),
        migrations.AddConstraint(model_name="seedpackrecord", constraint=models.UniqueConstraint(fields=("key", "version"), name="uq_world_seed_pack_version")),
        migrations.AddConstraint(model_name="worldrelease", constraint=models.UniqueConstraint(fields=("world", "release_number"), name="uq_world_release_number")),
        migrations.AddConstraint(model_name="worldmembership", constraint=models.UniqueConstraint(fields=("world", "user"), name="uq_world_membership_user")),
        migrations.AddConstraint(model_name="worldpersona", constraint=models.UniqueConstraint(fields=("world", "source_key"), name="uq_world_persona_source")),
        migrations.AddConstraint(model_name="worldpersonabridge", constraint=models.UniqueConstraint(fields=("persona", "release"), name="uq_world_persona_release_bridge")),
        migrations.AddConstraint(model_name="worldpersonabridge", constraint=models.UniqueConstraint(fields=("release", "bridge_user"), name="uq_world_release_bridge_user")),
    ]
