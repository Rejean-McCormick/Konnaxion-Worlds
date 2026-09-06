# FILE: backend/konnaxion/smart_vote/migrations/0002_consultation.py
import uuid
from decimal import Decimal
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
        ("smart_vote", "0001_initial"),
        ("ekoh", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(set_ekoh_schema_scope, migrations.RunPython.noop),
        migrations.CreateModel(
            name="Consultation",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("title", models.CharField(max_length=256)),
                ("opens_at", models.DateTimeField(blank=True, null=True)),
                ("closes_at", models.DateTimeField(blank=True, null=True)),
            ],
            options={"db_table": "consultation"},
        ),
        migrations.CreateModel(
            name="ConsultationRelevance",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("weight", models.DecimalField(decimal_places=4, default=Decimal("0.0"), max_digits=5)),
                ("criteria_json", models.JSONField(blank=True, null=True)),
                ("category", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="ekoh.expertisecategory")),
                ("consultation", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="smart_vote.consultation")),
            ],
            options={
                "db_table": "consultation_relevance",
                "unique_together": {("consultation", "category")},
                "indexes": [models.Index(fields=["consultation"], name="idx_consult_relevance")],
            },
        ),
    ]
