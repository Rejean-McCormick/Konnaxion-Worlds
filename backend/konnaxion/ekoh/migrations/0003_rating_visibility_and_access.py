from django.conf import settings
from django.db import migrations, models

from konnaxion.worlds.migration_context import get_target_ekoh_schema


def set_ekoh_schema_scope(apps, schema_editor):
    schema = get_target_ekoh_schema()
    quoted = schema_editor.connection.ops.quote_name(schema)
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(f"SET LOCAL search_path TO {quoted}, public")
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("ekoh", "0002_remove_expertisecategory_idx_cat_path_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(set_ekoh_schema_scope, migrations.RunPython.noop),
        migrations.CreateModel(
            name="RatingVisibilitySetting",
            fields=[
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        primary_key=True,
                        related_name="ekoh_rating_visibility",
                        serialize=False,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "visibility",
                    models.CharField(
                        choices=[
                            ("public", "Public"),
                            ("scoped", "Scoped"),
                            ("private", "Private"),
                        ],
                        default="public",
                        max_length=16,
                    ),
                ),
                ("publication_basis", models.TextField(blank=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"db_table": "rating_visibility_setting"},
        ),
        migrations.CreateModel(
            name="RatingAccessScope",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("key", models.SlugField(max_length=160, unique=True)),
                ("name", models.CharField(max_length=200)),
                ("scope_type", models.CharField(blank=True, max_length=64)),
                ("external_namespace", models.CharField(blank=True, max_length=120)),
                ("external_key", models.CharField(blank=True, max_length=200)),
                ("active", models.BooleanField(default=True)),
                (
                    "parent",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="children",
                        to="ekoh.ratingaccessscope",
                    ),
                ),
            ],
            options={
                "db_table": "rating_access_scope",
                "indexes": [
                    models.Index(fields=["parent", "active"], name="idx_rating_scope_parent"),
                    models.Index(fields=["external_namespace", "external_key"], name="idx_rating_scope_external"),
                ],
            },
        ),
        migrations.CreateModel(
            name="RatingScopeSubject",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("active", models.BooleanField(default=True)),
                (
                    "scope",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="subjects",
                        to="ekoh.ratingaccessscope",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="ekoh_rating_scopes",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "rating_scope_subject",
                "indexes": [models.Index(fields=["user", "active"], name="idx_rating_subject_user")],
                "constraints": [
                    models.UniqueConstraint(fields=("scope", "user"), name="uniq_rating_scope_subject")
                ],
            },
        ),
        migrations.CreateModel(
            name="RatingAccessGrant",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("include_descendants", models.BooleanField(default=False)),
                (
                    "access_level",
                    models.CharField(
                        choices=[("ratings", "Ratings"), ("history", "Ratings + history")],
                        default="ratings",
                        max_length=16,
                    ),
                ),
                ("active", models.BooleanField(default=True)),
                (
                    "scope",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="rating_access_grants",
                        to="ekoh.ratingaccessscope",
                    ),
                ),
                (
                    "viewer",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="ekoh_rating_access_grants",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "rating_access_grant",
                "indexes": [models.Index(fields=["viewer", "active"], name="idx_rating_grant_viewer")],
                "constraints": [
                    models.UniqueConstraint(fields=("viewer", "scope"), name="uniq_rating_access_grant")
                ],
            },
        ),
    ]
