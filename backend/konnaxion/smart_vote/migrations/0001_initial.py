# FILE: backend/konnaxion/smart_vote/migrations/0001_initial.py
from django.db import migrations, models
from django.contrib.postgres.operations import CreateExtension

from konnaxion.worlds.migration_context import get_target_ekoh_schema


def _ddl(schema: str) -> str:
    return f"""
CREATE SCHEMA IF NOT EXISTS {schema};

CREATE TABLE IF NOT EXISTS {schema}.vote (
    id              BIGSERIAL,
    user_id         INT NOT NULL,
    target_type     VARCHAR(64) NOT NULL,
    target_id       UUID  NOT NULL,
    modality_name   VARCHAR(32) NOT NULL,
    raw_value       NUMERIC(12,4) NOT NULL,
    weighted_value  NUMERIC(12,4) NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (id, created_at),
    UNIQUE (user_id, target_type, target_id, created_at)
) PARTITION BY RANGE (created_at);

CREATE INDEX IF NOT EXISTS idx_vote_target ON {schema}.vote (target_type, target_id);

CREATE TABLE IF NOT EXISTS {schema}.vote_result (
    id                  BIGSERIAL PRIMARY KEY,
    target_type         VARCHAR(64) NOT NULL,
    target_id           UUID NOT NULL,
    sum_weighted_value  NUMERIC(20,4) NOT NULL,
    vote_count          INT NOT NULL,
    UNIQUE (target_type, target_id)
);

CREATE TABLE IF NOT EXISTS {schema}.vote_ledger (
    ledger_id    BIGSERIAL,
    vote_id      BIGINT NOT NULL,
    sha256_hash  BYTEA  NOT NULL,
    block_height BIGINT,
    logged_at    TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (ledger_id, logged_at)
) PARTITION BY RANGE (logged_at);

CREATE INDEX IF NOT EXISTS idx_ledger_vote ON {schema}.vote_ledger (vote_id);
"""

def create_parent_tables(apps, schema_editor):
    schema = get_target_ekoh_schema()
    quoted = schema_editor.connection.ops.quote_name(schema)
    with schema_editor.connection.cursor() as cur:
        cur.execute(f"SET LOCAL search_path TO {quoted}, public")
        cur.execute(_ddl(quoted))

def make_current_month_partitions(apps, schema_editor):
    import datetime as _dt
    schema = get_target_ekoh_schema()
    quoted = schema_editor.connection.ops.quote_name(schema)
    today = _dt.date.today()
    first = today.replace(day=1)
    nxt = (first + _dt.timedelta(days=32)).replace(day=1)
    month_suffix = first.strftime("%Y_%m")
    with schema_editor.connection.cursor() as cur:
        cur.execute(f"""
            CREATE TABLE IF NOT EXISTS {quoted}.vote_{month_suffix}
                PARTITION OF {quoted}.vote FOR VALUES FROM ('{first}') TO ('{nxt}');
            CREATE TABLE IF NOT EXISTS {quoted}.vote_ledger_{month_suffix}
                PARTITION OF {quoted}.vote_ledger FOR VALUES FROM ('{first}') TO ('{nxt}');
        """)

class Migration(migrations.Migration):
    initial = True
    dependencies = []  # No dependencies to avoid circular loops with Ekoh

    operations = [
        CreateExtension("ltree"),
        CreateExtension("pgcrypto"),
        migrations.RunPython(create_parent_tables, migrations.RunPython.noop),
        migrations.CreateModel(
            name="VoteModality",
            fields=[
                ("name", models.CharField(
                    choices=[("approval", "Approval"), ("ranking", "Ranking"), ("rating", "Rating 1-5"), ("preferential", "Preferential"), ("budget_split", "Budget split")],
                    max_length=32, primary_key=True, serialize=False
                )),
                ("parameters", models.JSONField(blank=True, null=True)),
            ],
            options={"db_table": "vote_modality"},
        ),
        migrations.RunPython(make_current_month_partitions, migrations.RunPython.noop),
    ]