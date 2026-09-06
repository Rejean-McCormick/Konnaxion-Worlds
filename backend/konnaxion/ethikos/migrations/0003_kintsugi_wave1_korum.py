# FILE: backend/konnaxion/ethikos/migrations/0003_kintsugi_wave1_korum.py
# Generated for ethiKos Kintsugi Wave 1 — Korum / Deliberate slice.

from __future__ import annotations

import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("ethikos", "0002_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ArgumentSource",
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
                (
                    "url",
                    models.URLField(
                        blank=True,
                        max_length=2048,
                        null=True,
                    ),
                ),
                (
                    "title",
                    models.CharField(
                        blank=True,
                        max_length=255,
                    ),
                ),
                (
                    "excerpt",
                    models.TextField(
                        blank=True,
                    ),
                ),
                (
                    "source_type",
                    models.CharField(
                        blank=True,
                        max_length=64,
                    ),
                ),
                (
                    "citation_text",
                    models.TextField(
                        blank=True,
                    ),
                ),
                (
                    "quote",
                    models.TextField(
                        blank=True,
                    ),
                ),
                (
                    "note",
                    models.TextField(
                        blank=True,
                    ),
                ),
                (
                    "is_removed",
                    models.BooleanField(
                        default=False,
                    ),
                ),
                (
                    "created_at",
                    models.DateTimeField(
                        auto_now_add=True,
                    ),
                ),
                (
                    "updated_at",
                    models.DateTimeField(
                        auto_now=True,
                    ),
                ),
                (
                    "argument",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="sources",
                        to="ethikos.ethikosargument",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="ethikos_argument_sources_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ("-created_at",),
                "indexes": [
                    models.Index(
                        fields=["argument"],
                        name="eth_arg_src_argument_idx",
                    ),
                    models.Index(
                        fields=["created_by"],
                        name="eth_arg_src_creator_idx",
                    ),
                    models.Index(
                        fields=["is_removed"],
                        name="eth_arg_src_removed_idx",
                    ),
                ],
            },
        ),
        migrations.CreateModel(
            name="ArgumentImpactVote",
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
                (
                    "value",
                    models.PositiveSmallIntegerField(
                        validators=[
                            django.core.validators.MinValueValidator(0),
                            django.core.validators.MaxValueValidator(4),
                        ],
                    ),
                ),
                (
                    "created_at",
                    models.DateTimeField(
                        auto_now_add=True,
                    ),
                ),
                (
                    "updated_at",
                    models.DateTimeField(
                        auto_now=True,
                    ),
                ),
                (
                    "argument",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="impact_votes",
                        to="ethikos.ethikosargument",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="ethikos_argument_impact_votes",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ("-updated_at", "-created_at"),
                "indexes": [
                    models.Index(
                        fields=["argument"],
                        name="eth_arg_vote_argument_idx",
                    ),
                    models.Index(
                        fields=["user"],
                        name="eth_arg_vote_user_idx",
                    ),
                    models.Index(
                        fields=["value"],
                        name="eth_arg_vote_value_idx",
                    ),
                ],
                "constraints": [
                    models.UniqueConstraint(
                        fields=("user", "argument"),
                        name="uniq_arg_impact_vote_user_argument",
                    ),
                    models.CheckConstraint(
                        condition=models.Q(value__gte=0, value__lte=4),
                        name="arg_impact_value_0_4",
                    ),
                ],
            },
        ),
        migrations.CreateModel(
            name="ArgumentSuggestion",
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
                (
                    "side",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("pro", "Pro"),
                            ("con", "Con"),
                            ("neutral", "Neutral"),
                        ],
                        max_length=7,
                        null=True,
                    ),
                ),
                (
                    "content",
                    models.TextField(),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("accepted", "Accepted"),
                            ("rejected", "Rejected"),
                            ("revision_requested", "Revision requested"),
                        ],
                        default="pending",
                        max_length=24,
                    ),
                ),
                (
                    "reviewed_at",
                    models.DateTimeField(
                        blank=True,
                        null=True,
                    ),
                ),
                (
                    "created_at",
                    models.DateTimeField(
                        auto_now_add=True,
                    ),
                ),
                (
                    "updated_at",
                    models.DateTimeField(
                        auto_now=True,
                    ),
                ),
                (
                    "accepted_argument",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="accepted_suggestions",
                        to="ethikos.ethikosargument",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="ethikos_argument_suggestions_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "parent",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="suggested_replies",
                        to="ethikos.ethikosargument",
                    ),
                ),
                (
                    "reviewed_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="ethikos_argument_suggestions_reviewed",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "topic",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="argument_suggestions",
                        to="ethikos.ethikostopic",
                    ),
                ),
            ],
            options={
                "ordering": ("-created_at",),
                "indexes": [
                    models.Index(
                        fields=["topic"],
                        name="eth_arg_sugg_topic_idx",
                    ),
                    models.Index(
                        fields=["status"],
                        name="eth_arg_sugg_status_idx",
                    ),
                    models.Index(
                        fields=["created_by"],
                        name="eth_arg_sugg_creator_idx",
                    ),
                    models.Index(
                        fields=["parent"],
                        name="eth_arg_sugg_parent_idx",
                    ),
                    models.Index(
                        fields=["accepted_argument"],
                        name="eth_arg_sugg_accept_idx",
                    ),
                ],
            },
        ),
        migrations.CreateModel(
            name="DiscussionParticipantRole",
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
                (
                    "role",
                    models.CharField(
                        choices=[
                            ("owner", "Owner"),
                            ("admin", "Admin"),
                            ("editor", "Editor"),
                            ("writer", "Writer"),
                            ("suggester", "Suggester"),
                            ("viewer", "Viewer"),
                        ],
                        default="viewer",
                        max_length=16,
                    ),
                ),
                (
                    "created_at",
                    models.DateTimeField(
                        auto_now_add=True,
                    ),
                ),
                (
                    "updated_at",
                    models.DateTimeField(
                        auto_now=True,
                    ),
                ),
                (
                    "assigned_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="ethikos_discussion_roles_assigned",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "topic",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="participant_roles",
                        to="ethikos.ethikostopic",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="ethikos_discussion_roles",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ("topic", "user"),
                "indexes": [
                    models.Index(
                        fields=["topic"],
                        name="eth_disc_role_topic_idx",
                    ),
                    models.Index(
                        fields=["user"],
                        name="eth_disc_role_user_idx",
                    ),
                    models.Index(
                        fields=["role"],
                        name="eth_disc_role_role_idx",
                    ),
                ],
                "constraints": [
                    models.UniqueConstraint(
                        fields=("topic", "user"),
                        name="uniq_discussion_role_topic_user",
                    ),
                ],
            },
        ),
        migrations.CreateModel(
            name="DiscussionVisibilitySetting",
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
                (
                    "participation_type",
                    models.CharField(
                        choices=[
                            ("standard", "Standard"),
                            ("anonymous", "Anonymous"),
                        ],
                        default="standard",
                        max_length=16,
                    ),
                ),
                (
                    "author_visibility",
                    models.CharField(
                        choices=[
                            ("never", "Never"),
                            ("admins_only", "Admins only"),
                            ("all", "All"),
                        ],
                        default="all",
                        max_length=16,
                    ),
                ),
                (
                    "vote_visibility",
                    models.CharField(
                        choices=[
                            ("all", "All"),
                            ("admins_only", "Admins only"),
                            ("self_only", "Self only"),
                        ],
                        default="all",
                        max_length=16,
                    ),
                ),
                (
                    "created_at",
                    models.DateTimeField(
                        auto_now_add=True,
                    ),
                ),
                (
                    "updated_at",
                    models.DateTimeField(
                        auto_now=True,
                    ),
                ),
                (
                    "changed_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="ethikos_visibility_settings_changed",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "topic",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="visibility_setting",
                        to="ethikos.ethikostopic",
                    ),
                ),
            ],
            options={
                "ordering": ("topic",),
                "indexes": [
                    models.Index(
                        fields=["participation_type"],
                        name="eth_disc_vis_part_idx",
                    ),
                    models.Index(
                        fields=["author_visibility"],
                        name="eth_disc_vis_author_idx",
                    ),
                    models.Index(
                        fields=["vote_visibility"],
                        name="eth_disc_vis_vote_idx",
                    ),
                ],
            },
        ),
    ]