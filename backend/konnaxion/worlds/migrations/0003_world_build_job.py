from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("worlds", "0002_harden_world_invariants"),
    ]

    operations = [
        migrations.CreateModel(
            name="WorldBuildJob",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("seed_pack_key", models.CharField(max_length=120)),
                ("seed_version", models.CharField(blank=True, max_length=64)),
                ("promote_after_build", models.BooleanField(default=False)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("queued", "Queued"),
                            ("building", "Building"),
                            ("validating", "Validating"),
                            ("ready", "Ready"),
                            ("failed", "Failed"),
                        ],
                        default="queued",
                        max_length=20,
                    ),
                ),
                ("celery_task_id", models.CharField(blank=True, max_length=255)),
                ("queue_name", models.CharField(default="world-build", max_length=80)),
                ("concurrency_slot", models.PositiveSmallIntegerField(blank=True, null=True)),
                ("attempts", models.PositiveIntegerField(default=0)),
                ("error_text", models.TextField(blank=True)),
                ("metadata_json", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("started_at", models.DateTimeField(blank=True, null=True)),
                ("finished_at", models.DateTimeField(blank=True, null=True)),
                (
                    "release",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="build_jobs",
                        to="worlds.worldrelease",
                    ),
                ),
                (
                    "requested_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="world_build_jobs_requested",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "world",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="build_jobs",
                        to="worlds.world",
                    ),
                ),
            ],
            options={"ordering": ("-created_at",)},
        ),
        migrations.AddIndex(
            model_name="worldbuildjob",
            index=models.Index(fields=["status", "created_at"], name="ix_world_buildjob_state"),
        ),
        migrations.AddIndex(
            model_name="worldbuildjob",
            index=models.Index(fields=["world", "status"], name="ix_world_buildjob_world"),
        ),
    ]
