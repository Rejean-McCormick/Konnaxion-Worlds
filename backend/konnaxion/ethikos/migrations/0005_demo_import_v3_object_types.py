from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("ethikos", "0004_demoscenarioimport"),
    ]

    operations = [
        migrations.AlterField(
            model_name="demoscenarioimport",
            name="object_type",
            field=models.CharField(
                choices=[
                    ("user", "User"),
                    ("category", "Ethikos Category"),
                    ("topic", "Ethikos Topic"),
                    ("stance", "Ethikos Stance"),
                    ("argument", "Ethikos Argument"),
                    ("consultation", "Consultation"),
                    ("consultation_vote", "Consultation Vote"),
                    ("consultation_result", "Consultation Result"),
                    ("impact_item", "Impact Item"),
                    ("ekoh_expertise_score", "EkoH Expertise Score"),
                    ("ekoh_ethics_score", "EkoH Ethics Score"),
                    ("smart_vote_source_binding", "Smart Vote Source Binding"),
                ],
                db_index=True,
                help_text=(
                    "Type of imported object, e.g. topic, stance, EkoH score, "
                    "or Smart Vote source binding."
                ),
                max_length=120,
            ),
        ),
    ]
