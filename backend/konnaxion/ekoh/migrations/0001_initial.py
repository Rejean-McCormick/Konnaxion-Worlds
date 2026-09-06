# FILE: backend/konnaxion/ekoh/migrations/0001_initial.py
from django.conf import settings
from django.contrib.postgres.operations import CreateExtension
from django.contrib.postgres.indexes import GistIndex
from django.db import migrations, models
import django.db.models.deletion

from konnaxion.worlds.migration_context import get_target_ekoh_schema


def set_ekoh_schema_scope(apps, schema_editor):
    schema = get_target_ekoh_schema()
    quoted = schema_editor.connection.ops.quote_name(schema)
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(f"CREATE SCHEMA IF NOT EXISTS {quoted}")
        cursor.execute(f"SET LOCAL search_path TO {quoted}, public")


class LTreeField(models.TextField):
    description = "PostgreSQL ltree field (ltree)"

    def db_type(self, connection):
        return "ltree"


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        CreateExtension("ltree"),
        migrations.RunPython(set_ekoh_schema_scope, migrations.RunPython.noop),

        migrations.CreateModel(
            name="ExpertiseCategory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(max_length=16, unique=True)),
                ("name", models.CharField(max_length=128)),
                ("depth", models.SmallIntegerField()),
                ("path", LTreeField()),
                ("parent", models.ForeignKey("self", null=True, blank=True, on_delete=django.db.models.deletion.CASCADE, related_name="children")),
            ],
            options={
                "db_table": "expertise_category",
                "indexes": [
                    models.Index(fields=["depth", "code"], name="idx_cat_depth"),
                    GistIndex(fields=["path"], name="idx_cat_path", opclasses=["gist_ltree_ops"]),
                ],
            },
        ),
        migrations.CreateModel(
            name="ScoreConfiguration",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("weight_name", models.CharField(max_length=64)),
                ("weight_value", models.DecimalField(decimal_places=3, max_digits=6)),
                ("field", models.CharField(blank=True, max_length=64)),
            ],
            options={
                "db_table": "score_configuration",
                "unique_together": {("weight_name", "field")},
            },
        ),
        migrations.CreateModel(
            name="ConfidentialitySetting",
            fields=[
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, primary_key=True, serialize=False, to=settings.AUTH_USER_MODEL)),
                ("level", models.CharField(choices=[("public", "Public"), ("pseudonym", "Pseudonym"), ("anonymous", "Anonymous")], default="public", max_length=16)),
            ],
            options={"db_table": "confidentiality_setting"},
        ),
        migrations.CreateModel(
            name="UserEthicsScore",
            fields=[
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, primary_key=True, serialize=False, to=settings.AUTH_USER_MODEL)),
                ("ethical_score", models.DecimalField(decimal_places=3, max_digits=5)),
            ],
            options={"db_table": "user_ethics_score"},
        ),
        migrations.CreateModel(
            name="UserExpertiseScore",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("raw_score", models.DecimalField(decimal_places=4, max_digits=12)),
                ("weighted_score", models.DecimalField(decimal_places=4, max_digits=12)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ("category", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="ekoh.expertisecategory")),
            ],
            options={
                "db_table": "user_expertise_score",
                "unique_together": {("user", "category")},
                "indexes": [
                    models.Index(fields=["category", "-weighted_score"], name="idx_score_top", condition=models.Q(("weighted_score__gt", 0))),
                ],
            },
        ),
        migrations.CreateModel(
            name="ContextAnalysisLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("entity_type", models.CharField(max_length=64)),
                ("entity_id", models.UUIDField()),
                ("field", models.CharField(blank=True, max_length=64)),
                ("input_metadata", models.JSONField(blank=True, null=True)),
                ("adjustments_applied", models.JSONField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "db_table": "context_analysis_log",
                "indexes": [models.Index(fields=["entity_type", "entity_id"], name="context_ana_entity__5abedb_idx")],
            },
        ),
        migrations.CreateModel(
            name="ScoreHistory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("old_value", models.DecimalField(decimal_places=4, max_digits=12)),
                ("new_value", models.DecimalField(decimal_places=4, max_digits=12)),
                ("change_reason", models.TextField(blank=True)),
                ("changed_at", models.DateTimeField(auto_now_add=True)),
                ("merit_score", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="ekoh.userexpertisescore")),
            ],
            options={
                "db_table": "score_history",
                "indexes": [models.Index(fields=["changed_at"], name="score_histo_changed_cca210_idx")],
            },
        ),
    ]
