from django.db import migrations, models
import django.db.models.deletion

from konnaxion.worlds.migration_context import get_target_ekoh_schema


def _constraint_exists(cursor, schema: str, table: str, name: str) -> bool:
    cursor.execute(
        """
        SELECT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conrelid = %s::regclass
              AND conname = %s
        )
        """,
        (f"{schema}.{table}", name),
    )
    return bool(cursor.fetchone()[0])


def _column_exists(cursor, schema: str, table: str, column: str) -> bool:
    cursor.execute(
        """
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = %s
              AND table_name = %s
              AND column_name = %s
        )
        """,
        (schema, table, column),
    )
    return bool(cursor.fetchone()[0])


def reconcile_vote_schema(apps, schema_editor):
    schema = get_target_ekoh_schema()
    quoted = schema_editor.connection.ops.quote_name(schema)
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(f"SET LOCAL search_path TO {quoted}, public")

        # ------------------------------------------------------------------
        # vote_modality: migrate name-as-PK -> integer id PK + unique name.
        # ------------------------------------------------------------------
        cursor.execute(
            f"ALTER TABLE {quoted}.vote_modality "
            "ADD COLUMN IF NOT EXISTS id integer"
        )

        cursor.execute(
            f"CREATE SEQUENCE IF NOT EXISTS {quoted}.vote_modality_id_seq"
        )

        cursor.execute(
            f"ALTER SEQUENCE {quoted}.vote_modality_id_seq "
            f"OWNED BY {quoted}.vote_modality.id"
        )

        cursor.execute(
            f"ALTER TABLE {quoted}.vote_modality "
            f"ALTER COLUMN id SET DEFAULT "
            f"nextval('{quoted}.vote_modality_id_seq')"
        )

        cursor.execute(
            f"UPDATE {quoted}.vote_modality "
            f"SET id = nextval('{quoted}.vote_modality_id_seq') "
            "WHERE id IS NULL"
        )

        # Canonical modality rows; preserves any additional existing rows.
        for name in (
            "approval",
            "ranking",
            "rating",
            "preferential",
            "budget_split",
        ):
            cursor.execute(
                f"""
                INSERT INTO {quoted}.vote_modality (name, parameters)
                VALUES (%s, '{{}}'::jsonb)
                ON CONFLICT (name) DO NOTHING
                """,
                (name,),
            )

        cursor.execute(
            f"UPDATE {quoted}.vote_modality "
            f"SET id = nextval('{quoted}.vote_modality_id_seq') "
            "WHERE id IS NULL"
        )

        cursor.execute(
            f"SELECT COALESCE(MAX(id), 0) "
            f"FROM {quoted}.vote_modality"
        )
        max_id = int(cursor.fetchone()[0])

        if max_id > 0:
            cursor.execute(
                f"SELECT setval("
                f"'{quoted}.vote_modality_id_seq', %s, true"
                f")",
                (max_id,),
            )

        # Determine whether the existing PK is still on name.
        cursor.execute(
            """
            SELECT conname, pg_get_constraintdef(oid)
            FROM pg_constraint
            WHERE conrelid = %s::regclass
              AND contype = 'p'
            """,
            (f"{quoted}.vote_modality",),
        )

        primary_key = cursor.fetchone()

        if primary_key and "(name)" in primary_key[1]:
            constraint_name = primary_key[0].replace('"', '""')

            cursor.execute(
                f'ALTER TABLE {quoted}.vote_modality '
                f'DROP CONSTRAINT "{constraint_name}"'
            )

        # Preserve name uniqueness after removing name as PK.
        if not _constraint_exists(
            cursor,
            schema,
            "vote_modality",
            "vote_modality_name_key",
        ):
            cursor.execute(
                f"ALTER TABLE {quoted}.vote_modality "
                "ADD CONSTRAINT vote_modality_name_key "
                "UNIQUE (name)"
            )

        # Check whether id is already the primary key.
        #
        # IMPORTANT:
        # Use equality instead of LIKE with a '%' wildcard here.
        # psycopg3 interprets '%' sequences in parameterized SQL and the
        # previous LIKE 'PRIMARY KEY (id)%' caused:
        #
        #   ProgrammingError:
        #   only '%s', '%b', '%t' are allowed as placeholders
        #
        cursor.execute(
            """
            SELECT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conrelid = %s::regclass
                  AND contype = 'p'
                  AND pg_get_constraintdef(oid) = 'PRIMARY KEY (id)'
            )
            """,
            (f"{quoted}.vote_modality",),
        )

        id_is_primary_key = bool(cursor.fetchone()[0])

        if not id_is_primary_key:
            cursor.execute(
                f"ALTER TABLE {quoted}.vote_modality "
                "ALTER COLUMN id SET NOT NULL"
            )

            cursor.execute(
                f"ALTER TABLE {quoted}.vote_modality "
                "ADD CONSTRAINT vote_modality_pkey "
                "PRIMARY KEY (id)"
            )

        # ------------------------------------------------------------------
        # vote: modality_name -> modality_id FK.
        # ------------------------------------------------------------------
        if not _column_exists(cursor, schema, "vote", "modality_id"):
            cursor.execute(
                f"ALTER TABLE {quoted}.vote "
                "ADD COLUMN modality_id integer"
            )

        if _column_exists(cursor, schema, "vote", "modality_name"):
            cursor.execute(
                f"""
                UPDATE {quoted}.vote AS vote
                SET modality_id = modality.id
                FROM {quoted}.vote_modality AS modality
                WHERE vote.modality_id IS NULL
                  AND vote.modality_name::text = modality.name::text
                """
            )

        cursor.execute(
            f"SELECT COUNT(*) "
            f"FROM {quoted}.vote "
            "WHERE modality_id IS NULL"
        )

        missing_modality_count = int(cursor.fetchone()[0])

        if missing_modality_count:
            raise RuntimeError(
                "Cannot reconcile Smart Vote schema: "
                f"{missing_modality_count} vote row(s) "
                "have no matching modality."
            )

        cursor.execute(
            f"ALTER TABLE {quoted}.vote "
            "ALTER COLUMN modality_id SET NOT NULL"
        )

        if not _constraint_exists(
            cursor,
            schema,
            "vote",
            "vote_modality_id_fk",
        ):
            cursor.execute(
                f"ALTER TABLE {quoted}.vote "
                "ADD CONSTRAINT vote_modality_id_fk "
                "FOREIGN KEY (modality_id) "
                f"REFERENCES {quoted}.vote_modality(id) "
                "ON DELETE RESTRICT"
            )

        if _column_exists(cursor, schema, "vote", "modality_name"):
            cursor.execute(
                f"ALTER TABLE {quoted}.vote "
                "DROP COLUMN modality_name"
            )

        # New source ballots do not persist a derived reading weight.
        cursor.execute(
            f"ALTER TABLE {quoted}.vote "
            "ALTER COLUMN weighted_value DROP NOT NULL"
        )


class Migration(migrations.Migration):
    dependencies = [
        ("smart_vote", "0004_source_consultation_binding"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(
                    reconcile_vote_schema,
                    migrations.RunPython.noop,
                ),
            ],
            state_operations=[
                migrations.AlterField(
                    model_name="votemodality",
                    name="name",
                    field=models.CharField(
                        choices=[
                            ("approval", "Approval"),
                            ("ranking", "Ranking"),
                            ("rating", "Rating 1-5"),
                            ("preferential", "Preferential"),
                            ("budget_split", "Budget split"),
                        ],
                        max_length=32,
                        unique=True,
                    ),
                ),
                migrations.AddField(
                    model_name="votemodality",
                    name="id",
                    field=models.AutoField(
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                migrations.AlterField(
                    model_name="vote",
                    name="modality",
                    field=models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        to="smart_vote.votemodality",
                    ),
                ),
                migrations.AlterField(
                    model_name="vote",
                    name="weighted_value",
                    field=models.DecimalField(
                        blank=True,
                        decimal_places=4,
                        max_digits=12,
                        null=True,
                    ),
                ),
                migrations.AlterField(
                    model_name="voteledger",
                    name="vote",
                    field=models.ForeignKey(
                        db_constraint=False,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="smart_vote.vote",
                    ),
                ),
            ],
        ),
    ]