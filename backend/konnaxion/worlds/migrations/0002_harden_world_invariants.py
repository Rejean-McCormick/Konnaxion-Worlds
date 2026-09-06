from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):
    dependencies = [
        ("worlds", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="world",
            name="key",
            field=models.SlugField(
                max_length=120,
                unique=True,
                validators=[django.core.validators.RegexValidator(
                    regex=r"^[a-z0-9](?:[a-z0-9-]{0,118}[a-z0-9])?$",
                    message="World keys must be lowercase letters/digits with optional internal hyphens.",
                )],
            ),
        ),
        migrations.AddConstraint(
            model_name="worldrelease",
            constraint=models.UniqueConstraint(
                fields=("world",),
                condition=models.Q(status="current"),
                name="uq_world_one_current",
            ),
        ),
        migrations.AddConstraint(
            model_name="worldrelease",
            constraint=models.CheckConstraint(
                condition=~models.Q(domain_schema=models.F("ekoh_schema")),
                name="ck_world_schema_distinct",
            ),
        ),
        migrations.AddIndex(
            model_name="worldrelease",
            index=models.Index(fields=["world", "status"], name="ix_world_release_status"),
        ),
        migrations.AddIndex(
            model_name="worldmembership",
            index=models.Index(fields=["user", "is_active"], name="ix_world_membership_user"),
        ),
        migrations.AddIndex(
            model_name="worldpersona",
            index=models.Index(fields=["world", "display_name"], name="ix_world_persona_name"),
        ),
        migrations.AddIndex(
            model_name="worldsnapshot",
            index=models.Index(fields=["world", "status", "created_at"], name="ix_world_snapshot_state"),
        ),
    ]
