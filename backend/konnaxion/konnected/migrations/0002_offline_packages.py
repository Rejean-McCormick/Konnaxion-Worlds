# FILE: backend/konnaxion/konnected/migrations/0002_offline_packages.py
# backend/konnaxion/konnected/migrations/0002_offline_packages.py

from django.db import migrations, models

try:
    # Django 3.1+ (built‑in JSONField)
    JSONField = models.JSONField
except AttributeError:
    # Older Django versions (PostgreSQL JSONField)
    from django.contrib.postgres.fields import JSONField  # type: ignore


class Migration(migrations.Migration):

    dependencies = [
        ("konnected", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="OfflinePackage",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                (
                    "status",
                    models.CharField(
                        max_length=16,
                        default="scheduled",
                        choices=[
                            ("scheduled", "Scheduled"),
                            ("building", "Building"),
                            ("ready", "Ready"),
                            ("failed", "Failed"),
                        ],
                    ),
                ),
                ("item_count", models.PositiveIntegerField(default=0)),
                (
                    "total_size_mb",
                    models.DecimalField(
                        max_digits=10,
                        decimal_places=2,
                        default=0,
                    ),
                ),
                ("last_built_at", models.DateTimeField(blank=True, null=True)),
                (
                    "target_device_type",
                    models.CharField(
                        max_length=16,
                        blank=True,
                        choices=[
                            ("laptop", "Laptop / desktop"),
                            ("tablet", "Tablet"),
                            ("usb", "USB / external media"),
                            ("other", "Other"),
                        ],
                    ),
                ),
                ("auto_sync", models.BooleanField(default=False)),
                (
                    "build_progress_percent",
                    models.PositiveSmallIntegerField(blank=True, null=True),
                ),
                ("last_error_message", models.TextField(blank=True)),
                ("max_size_mb", models.PositiveIntegerField(blank=True, null=True)),
                (
                    "include_types",
                    JSONField(
                        blank=True,
                        default=list,
                        help_text=(
                            "List of resource types to include "
                            "(e.g. article, video, lesson, quiz, dataset)."
                        ),
                    ),
                ),
                (
                    "subject_filter",
                    models.CharField(
                        max_length=255,
                        blank=True,
                        help_text=(
                            "Optional subject/topic filter applied when "
                            "resolving resources."
                        ),
                    ),
                ),
                (
                    "level_filter",
                    models.CharField(
                        max_length=255,
                        blank=True,
                        help_text="Optional level/difficulty filter.",
                    ),
                ),
                (
                    "language_filter",
                    models.CharField(
                        max_length=50,
                        blank=True,
                        help_text="Optional language filter (e.g. 'en', 'fr').",
                    ),
                ),
            ],
            options={
                "ordering": ("name",),
            },
        ),
    ]
