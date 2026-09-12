from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("ethikos", "0005_demo_import_v3_object_types"),
    ]

    operations = [
        migrations.CreateModel(
            name="OrgoImpactPublication",
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
                ("operation_id", models.UUIDField(unique=True)),
                ("organization_id", models.UUIDField()),
                ("idempotency_key", models.CharField(max_length=200, unique=True)),
                ("correlation_id", models.CharField(max_length=255)),
                ("subject_type", models.CharField(max_length=80)),
                ("subject_id", models.UUIDField()),
                ("artifact_type", models.CharField(default="impact_update", max_length=80)),
                ("external_reference", models.CharField(max_length=255, unique=True)),
                ("checkpoint", models.CharField(blank=True, max_length=80)),
                ("demo_id", models.CharField(blank=True, max_length=160)),
                ("epistemic_status", models.CharField(blank=True, max_length=80)),
                ("status", models.CharField(default="published", max_length=32)),
                ("payload_hash", models.CharField(max_length=64)),
                ("request_json", models.JSONField(default=dict)),
                ("receipt_json", models.JSONField(default=dict)),
                ("published_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ("-published_at",),
                "indexes": [
                    models.Index(fields=["demo_id", "checkpoint"], name="eth_orgo_demo_ckpt_idx"),
                    models.Index(fields=["correlation_id"], name="eth_orgo_corr_idx"),
                ],
            },
        ),
    ]
