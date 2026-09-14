from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("ethikos", "0006_orgo_impact_publication"),
    ]

    operations = [
        migrations.CreateModel(
            name="DecisionProtocol",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("key", models.SlugField(max_length=120, unique=True)),
                ("label", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("protocol_type", models.CharField(choices=[
                    ("simple_majority", "Simple Majority"),
                    ("stance_distribution", "Stance Distribution"),
                    ("consent_check", "Consent Check"),
                    ("ranked_option", "Ranked Option"),
                    ("expertise_weighted_reading", "Expertise Weighted Reading"),
                    ("manual_publication", "Manual Publication"),
                ], max_length=64)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ("label", "key")},
        ),
        migrations.CreateModel(
            name="DecisionRecord",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("status", models.CharField(choices=[
                    ("draft", "Draft"),
                    ("open", "Open"),
                    ("closed", "Closed"),
                    ("published", "Published"),
                    ("archived", "Archived"),
                ], default="draft", max_length=16)),
                ("opened_at", models.DateTimeField(blank=True, null=True)),
                ("closed_at", models.DateTimeField(blank=True, null=True)),
                ("published_at", models.DateTimeField(blank=True, null=True)),
                ("revision", models.PositiveIntegerField(default=1)),
                ("baseline_result_json", models.JSONField(blank=True, default=dict)),
                ("reading_result_refs", models.JSONField(blank=True, default=list)),
                ("published_payload", models.JSONField(blank=True, default=dict)),
                ("artifact_digest", models.CharField(blank=True, max_length=64)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="ethikos_decision_records_created", to=settings.AUTH_USER_MODEL)),
                ("protocol", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="decision_records", to="ethikos.decisionprotocol")),
                ("topic", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="decision_records", to="ethikos.ethikostopic")),
            ],
            options={
                "ordering": ("-created_at",),
                "indexes": [
                    models.Index(fields=["topic"], name="eth_decision_topic_idx"),
                    models.Index(fields=["status"], name="eth_decision_status_idx"),
                    models.Index(fields=["created_by"], name="eth_decision_creator_idx"),
                    models.Index(fields=["opened_at"], name="eth_decision_opened_idx"),
                    models.Index(fields=["closed_at"], name="eth_decision_closed_idx"),
                ],
                "constraints": [
                    models.CheckConstraint(condition=~models.Q(status__in=("closed", "published")) | models.Q(closed_at__isnull=False), name="eth_decision_closed_requires_time"),
                    models.CheckConstraint(condition=~models.Q(status="published") | models.Q(published_at__isnull=False), name="eth_decision_published_requires_time"),
                ],
            },
        ),
        migrations.CreateModel(
            name="InteractionEmission",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("interaction_id", models.UUIDField(unique=True)),
                ("profile_id", models.CharField(max_length=160)),
                ("profile_version", models.CharField(max_length=80)),
                ("target_system", models.CharField(max_length=120)),
                ("target_organization", models.CharField(blank=True, max_length=200)),
                ("target_world", models.CharField(blank=True, max_length=200)),
                ("subject_type", models.CharField(max_length=120)),
                ("subject_id", models.CharField(max_length=500)),
                ("idempotency_key", models.CharField(max_length=500, unique=True)),
                ("request_fingerprint", models.CharField(max_length=80)),
                ("envelope_json", models.JSONField(default=dict)),
                ("status", models.CharField(choices=[
                    ("queued", "Queued"),
                    ("sending", "Sending"),
                    ("delivered", "Delivered"),
                    ("retrying", "Retrying"),
                    ("dead", "Dead"),
                ], default="queued", max_length=16)),
                ("attempts", models.PositiveIntegerField(default=0)),
                ("next_attempt_at", models.DateTimeField(blank=True, null=True)),
                ("last_error_code", models.CharField(blank=True, max_length=120)),
                ("last_error_detail", models.TextField(blank=True)),
                ("receipt_json", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("delivered_at", models.DateTimeField(blank=True, null=True)),
            ],
            options={
                "ordering": ("created_at",),
                "indexes": [
                    models.Index(fields=["status", "next_attempt_at"], name="eth_ik_emit_state_idx"),
                    models.Index(fields=["profile_id", "created_at"], name="eth_ik_emit_profile_idx"),
                    models.Index(fields=["subject_type", "subject_id"], name="eth_ik_emit_subject_idx"),
                ],
            },
        ),
    ]
