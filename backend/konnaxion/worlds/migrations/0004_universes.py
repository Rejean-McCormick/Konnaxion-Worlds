from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.core.validators


def attach_existing_worlds_to_legacy_universe(apps, schema_editor):
    Universe = apps.get_model("worlds", "Universe")
    World = apps.get_model("worlds", "World")
    legacy, _ = Universe.objects.get_or_create(
        key="legacy",
        defaults={
            "title": "Legacy Worlds",
            "description": "Migration container for Worlds created before KX-UNIVERSES-1.",
            "status": "active",
            "visibility": "private",
            "metadata_json": {"migration_adapter": True, "architecture_lock": "KX-UNIVERSES-1"},
        },
    )
    World.objects.filter(universe__isnull=True).update(universe=legacy)


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("worlds", "0003_world_build_job"),
    ]

    operations = [
        migrations.CreateModel(
            name="Universe",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("key", models.SlugField(
                    max_length=120,
                    unique=True,
                    validators=[django.core.validators.RegexValidator(
                        regex=r"^[a-z0-9](?:[a-z0-9-]{0,118}[a-z0-9])?$",
                        message="World keys must be lowercase letters/digits with optional internal hyphens.",
                    )],
                )),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("status", models.CharField(choices=[("active", "Active"), ("maintenance", "Maintenance"), ("archived", "Archived")], default="active", max_length=20)),
                ("visibility", models.CharField(choices=[("public", "Public"), ("private", "Private")], default="private", max_length=16)),
                ("metadata_json", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("archived_at", models.DateTimeField(blank=True, null=True)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="universes_created", to=settings.AUTH_USER_MODEL)),
                ("default_world", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to="worlds.world")),
            ],
            options={"ordering": ("title", "key")},
        ),
        migrations.CreateModel(
            name="UniverseMembership",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("role", models.CharField(choices=[("owner", "Owner"), ("maintainer", "Maintainer"), ("member", "Member"), ("viewer", "Viewer")], default="viewer", max_length=20)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("universe", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="memberships", to="worlds.universe")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="universe_memberships", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddConstraint(
            model_name="universemembership",
            constraint=models.UniqueConstraint(fields=("universe", "user"), name="uq_universe_membership_user"),
        ),
        migrations.AddIndex(
            model_name="universemembership",
            index=models.Index(fields=["user", "is_active"], name="ix_universe_membership_user"),
        ),
        migrations.AddField(
            model_name="world",
            name="universe",
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, related_name="worlds", to="worlds.universe"),
        ),
        migrations.RunPython(attach_existing_worlds_to_legacy_universe, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="world",
            name="universe",
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="worlds", to="worlds.universe"),
        ),
        migrations.CreateModel(
            name="WorldRelation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("relation_type", models.CharField(choices=[("coordinates", "Coordinates"), ("depends_on", "Depends On"), ("constrains", "Constrains"), ("publishes_to", "Publishes To"), ("references", "References")], max_length=32)),
                ("title", models.CharField(blank=True, max_length=255)),
                ("description", models.TextField(blank=True)),
                ("metadata_json", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("source_world", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="outgoing_relations", to="worlds.world")),
                ("target_world", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="incoming_relations", to="worlds.world")),
                ("universe", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="world_relations", to="worlds.universe")),
            ],
            options={"ordering": ("source_world", "relation_type", "target_world")},
        ),
        migrations.AddConstraint(
            model_name="worldrelation",
            constraint=models.UniqueConstraint(fields=("source_world", "target_world", "relation_type"), name="uq_world_relation_edge_type"),
        ),
        migrations.AddConstraint(
            model_name="worldrelation",
            constraint=models.CheckConstraint(condition=~models.Q(source_world=models.F("target_world")), name="ck_world_relation_distinct_worlds"),
        ),
        migrations.AddIndex(
            model_name="worldrelation",
            index=models.Index(fields=["universe", "relation_type"], name="ix_world_relation_kind"),
        ),
        migrations.CreateModel(
            name="WorldPublication",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("publication_type", models.CharField(max_length=80)),
                ("key", models.SlugField(max_length=160)),
                ("version", models.PositiveIntegerField(default=1)),
                ("title", models.CharField(max_length=255)),
                ("summary", models.TextField(blank=True)),
                ("payload_json", models.JSONField(blank=True, default=dict)),
                ("artifact_location", models.TextField(blank=True)),
                ("checksum", models.CharField(blank=True, max_length=128)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="world_publications_created", to=settings.AUTH_USER_MODEL)),
                ("source_release", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="publications", to="worlds.worldrelease")),
                ("source_world", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="publications", to="worlds.world")),
            ],
            options={"ordering": ("-created_at",)},
        ),
        migrations.AddConstraint(
            model_name="worldpublication",
            constraint=models.UniqueConstraint(fields=("source_world", "key", "version"), name="uq_world_publication_version"),
        ),
        migrations.AddIndex(
            model_name="worldpublication",
            index=models.Index(fields=["source_world", "publication_type", "-created_at"], name="ix_world_publication_type"),
        ),
        migrations.CreateModel(
            name="WorldSubscription",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("publication_type", models.CharField(max_length=80)),
                ("status", models.CharField(choices=[("active", "Active"), ("paused", "Paused")], default="active", max_length=20)),
                ("metadata_json", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("consumer_world", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="publication_subscriptions", to="worlds.world")),
                ("source_world", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="publication_subscribers", to="worlds.world")),
            ],
        ),
        migrations.AddConstraint(
            model_name="worldsubscription",
            constraint=models.UniqueConstraint(fields=("consumer_world", "source_world", "publication_type"), name="uq_world_subscription_source_type"),
        ),
        migrations.AddConstraint(
            model_name="worldsubscription",
            constraint=models.CheckConstraint(condition=~models.Q(consumer_world=models.F("source_world")), name="ck_world_subscription_distinct_worlds"),
        ),
    ]
