from django.db import migrations, models
import django.db.models.deletion



from konnaxion.worlds.migration_context import get_target_ekoh_schema


def set_ekoh_schema_scope(apps, schema_editor):
    schema = get_target_ekoh_schema()
    quoted = schema_editor.connection.ops.quote_name(schema)
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(f"SET LOCAL search_path TO {quoted}, public")

class Migration(migrations.Migration):
    dependencies = [
        ("smart_vote", "0003_vote_orm"),
    ]

    operations = [
        # Local/dev settings intentionally remove PostgreSQL startup search_path
        # options (e.g. for pooled providers). Consultation was created under
        # the legacy ekoh_smartvote schema, so make that schema visible for
        # this atomic migration before Django emits the FK constraint.
        migrations.RunPython(set_ekoh_schema_scope, migrations.RunPython.noop),
        migrations.CreateModel(
            name="SourceConsultationBinding",
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
                ("source_type", models.CharField(max_length=64)),
                ("source_id", models.CharField(max_length=128)),
                ("source_key", models.CharField(blank=True, max_length=160)),
                ("metadata_json", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "consultation",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="source_binding",
                        to="smart_vote.consultation",
                    ),
                ),
            ],
            options={
                "db_table": "smart_vote_source_binding",
                "indexes": [
                    models.Index(
                        fields=["source_type", "source_id"],
                        name="idx_sv_source_binding",
                    )
                ],
                "constraints": [
                    models.UniqueConstraint(
                        fields=("source_type", "source_id"),
                        name="uq_sv_source_binding",
                    )
                ],
            },
        )
    ]
