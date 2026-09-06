# FILE: backend/konnaxion/smart_vote/migrations/0003_vote_orm.py
import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        ("smart_vote", "0002_consultation"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[], # Tables created in 0001 SQL
            state_operations=[
                migrations.CreateModel(
                    name="Vote",
                    fields=[
                        ("id", models.BigAutoField(primary_key=True, serialize=False)),
                        ("target_type", models.CharField(max_length=64)),
                        ("target_id", models.UUIDField(default=uuid.uuid4)),
                        ("raw_value", models.DecimalField(decimal_places=4, max_digits=12)),
                        ("weighted_value", models.DecimalField(decimal_places=4, max_digits=12)),
                        ("created_at", models.DateTimeField(auto_now_add=True)),
                        ("modality", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="smart_vote.votemodality")),
                        ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                    ],
                    options={
                        "db_table": "vote",
                        "unique_together": {("user", "target_type", "target_id", "created_at")},
                    },
                ),
                migrations.CreateModel(
                    name="VoteResult",
                    fields=[
                        ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                        ("target_type", models.CharField(max_length=64)),
                        ("target_id", models.UUIDField()),
                        ("sum_weighted_value", models.DecimalField(decimal_places=4, max_digits=20)),
                        ("vote_count", models.IntegerField()),
                    ],
                    options={
                        "db_table": "vote_result",
                        "unique_together": {("target_type", "target_id")},
                    },
                ),
                migrations.CreateModel(
                    name="VoteLedger",
                    fields=[
                        ("ledger_id", models.BigAutoField(primary_key=True, serialize=False)),
                        ("sha256_hash", models.BinaryField()),
                        ("block_height", models.BigIntegerField(blank=True, null=True)),
                        ("logged_at", models.DateTimeField(auto_now_add=True)),
                        ("vote", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="smart_vote.vote")),
                    ],
                    options={"db_table": "vote_ledger"},
                ),
                # Add indexes to state (they exist in DB from 0001)
                migrations.AddIndex(
                    model_name="vote",
                    index=models.Index(fields=["target_type", "target_id"], name="idx_vote_target"),
                ),
                migrations.AddIndex(
                    model_name="voteledger",
                    index=models.Index(fields=["vote_id"], name="idx_ledger_vote"),
                ),
            ],
        ),
    ]