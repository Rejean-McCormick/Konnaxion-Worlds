from __future__ import annotations

import hashlib
from collections import defaultdict, deque
from functools import lru_cache

from django.conf import settings
from django.db import connection

from ..db import validate_schema_name
from .provisioning import (
    AUXILIARY_MIGRATION_APPS,
    AUXILIARY_REQUIRED_RAW_TABLES,
    DOMAIN_MIGRATION_APPS,
    DOMAIN_REQUIRED_RAW_TABLES,
    canonical_fixture_checksum,
    expected_tables_for_apps,
    global_control_tables,
    migration_fingerprint,
    missing_leaf_migrations,
    provision_release,
)

CANARY_TABLE = "kx_world_canary"
MIGRATION_TABLE = "django_migrations"
SCHEMA_CONTRACT_VERSION = "kx-world-schema/v3"


class WorldSchemaNotReady(RuntimeError):
    pass


def _q(identifier: str) -> str:
    return connection.ops.quote_name(validate_schema_name(identifier))


def _contract_fingerprint(kind: str) -> str:
    return hashlib.sha256(f"{SCHEMA_CONTRACT_VERSION}:{kind}".encode("utf-8")).hexdigest()


def schema_exists(schema: str) -> bool:
    validate_schema_name(schema)
    with connection.cursor() as cursor:
        cursor.execute("SELECT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname = %s)", [schema])
        return bool(cursor.fetchone()[0])


def create_schema(schema: str) -> None:
    with connection.cursor() as cursor:
        cursor.execute(f"CREATE SCHEMA IF NOT EXISTS {_q(schema)}")


def drop_schema(schema: str) -> None:
    with connection.cursor() as cursor:
        cursor.execute(f"DROP SCHEMA IF EXISTS {_q(schema)} CASCADE")


def write_canary(
    *,
    schema: str,
    world_id: int,
    release_id: int,
    schema_kind: str,
    seed_checksum: str = "",
    migration_fingerprint: str = "",
) -> None:
    q_schema = _q(schema)
    with connection.cursor() as cursor:
        cursor.execute(
            f"CREATE TABLE IF NOT EXISTS {q_schema}.{CANARY_TABLE} ("
            "world_id bigint NOT NULL, release_id bigint NOT NULL, "
            "schema_kind varchar(32) NOT NULL, contract_version varchar(64) NOT NULL, "
            "seed_checksum varchar(128) NOT NULL DEFAULT '', "
            "migration_fingerprint varchar(128) NOT NULL DEFAULT ''"
            ")"
        )
        cursor.execute(
            f"ALTER TABLE {q_schema}.{CANARY_TABLE} "
            "ADD COLUMN IF NOT EXISTS seed_checksum varchar(128) NOT NULL DEFAULT ''"
        )
        cursor.execute(
            f"ALTER TABLE {q_schema}.{CANARY_TABLE} "
            "ADD COLUMN IF NOT EXISTS migration_fingerprint varchar(128) NOT NULL DEFAULT ''"
        )
        cursor.execute(f"TRUNCATE TABLE {q_schema}.{CANARY_TABLE}")
        cursor.execute(
            f"INSERT INTO {q_schema}.{CANARY_TABLE} "
            "(world_id, release_id, schema_kind, contract_version, seed_checksum, migration_fingerprint) "
            "VALUES (%s, %s, %s, %s, %s, %s)",
            [
                world_id,
                release_id,
                schema_kind,
                SCHEMA_CONTRACT_VERSION,
                seed_checksum or "",
                migration_fingerprint or "",
            ],
        )


def read_canary(schema: str) -> dict | None:
    """Read v1/v2/v3 canaries without crashing during rolling upgrades.

    Older CURRENT releases only have the four identity columns.  v3 adds
    ``seed_checksum`` and ``migration_fingerprint``.  Runtime validation must
    classify an old release as not-ready, not raise ProgrammingError before a
    replacement release can be built/promoted.
    """

    q_schema = _q(schema)
    with connection.cursor() as cursor:
        cursor.execute("SELECT to_regclass(%s)", [f"{schema}.{CANARY_TABLE}"])
        if cursor.fetchone()[0] is None:
            return None
        cursor.execute(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = %s AND table_name = %s
            """,
            [schema, CANARY_TABLE],
        )
        columns = {str(row[0]) for row in cursor.fetchall()}
        required = {"world_id", "release_id", "schema_kind", "contract_version"}
        if not required.issubset(columns):
            return None

        optional = [
            name
            for name in ("seed_checksum", "migration_fingerprint")
            if name in columns
        ]
        selected = ["world_id", "release_id", "schema_kind", "contract_version", *optional]
        sql_columns = ", ".join(connection.ops.quote_name(name) for name in selected)
        cursor.execute(
            f"SELECT {sql_columns} FROM {q_schema}.{CANARY_TABLE} LIMIT 1"
        )
        row = cursor.fetchone()

    if not row:
        return None
    values = dict(zip(selected, row, strict=True))
    return {
        "world_id": values.get("world_id"),
        "release_id": values.get("release_id"),
        "schema_kind": values.get("schema_kind"),
        "contract_version": values.get("contract_version"),
        "seed_checksum": values.get("seed_checksum", ""),
        "migration_fingerprint": values.get("migration_fingerprint", ""),
    }


def _schema_tables(schema: str) -> list[str]:
    validate_schema_name(schema)
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT c.relname
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = %s
              AND c.relkind IN ('r', 'p')
              AND NOT c.relispartition
            ORDER BY c.relname
            """,
            [schema],
        )
        return [row[0] for row in cursor.fetchall()]


def _table_exists(schema: str, table: str) -> bool:
    validate_schema_name(schema)
    with connection.cursor() as cursor:
        cursor.execute("SELECT to_regclass(%s)", [f"{schema}.{table}"])
        return cursor.fetchone()[0] is not None


def _missing_tables(schema: str, expected: set[str]) -> list[str]:
    actual = set(_schema_tables(schema)) if schema_exists(schema) else set()
    return sorted(expected - actual)


def provision_release_schemas(release, *, progress_callback=None):
    """Canonical release provisioner: scoped migrations + deterministic fixture.

    This replaces the temporary structure-cloning adapter. The release schemas
    receive independent Django migration ledgers and replay only their allowlisted
    World-owned migration groups. EkoH/Smart Vote historical SQL is redirected by
    the scoped runner without editing migration history.
    """

    report = provision_release(release, progress_callback=progress_callback)
    write_canary(
        schema=release.domain_schema,
        world_id=release.world_id,
        release_id=release.id,
        schema_kind="domain",
        seed_checksum=release.seed_checksum,
        migration_fingerprint=report.domain_migration_fingerprint,
    )
    write_canary(
        schema=release.ekoh_schema,
        world_id=release.world_id,
        release_id=release.id,
        schema_kind="auxiliary",
        seed_checksum=release.seed_checksum,
        migration_fingerprint=report.auxiliary_migration_fingerprint,
    )
    return report


def foreign_key_targets(schema: str) -> list[dict[str, str]]:
    validate_schema_name(schema)
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT child.relname, parent_ns.nspname, parent.relname, con.conname
            FROM pg_constraint con
            JOIN pg_class child ON child.oid = con.conrelid
            JOIN pg_namespace child_ns ON child_ns.oid = child.relnamespace
            JOIN pg_class parent ON parent.oid = con.confrelid
            JOIN pg_namespace parent_ns ON parent_ns.oid = parent.relnamespace
            WHERE con.contype = 'f' AND child_ns.nspname = %s
            ORDER BY child.relname, con.conname
            """,
            [schema],
        )
        return [
            {
                "child_table": child,
                "parent_schema": parent_schema,
                "parent_table": parent,
                "constraint": constraint,
            }
            for child, parent_schema, parent, constraint in cursor.fetchall()
        ]


def fk_isolation_violations(*, domain_schema: str, auxiliary_schema: str) -> list[dict[str, str]]:
    release_schemas = {domain_schema, auxiliary_schema}
    control_schema = validate_schema_name(getattr(settings, "KONNAXION_CONTROL_SCHEMA", "public"))
    allowed_global_tables = global_control_tables()
    violations: list[dict[str, str]] = []
    for child_schema in release_schemas:
        for row in foreign_key_targets(child_schema):
            parent_schema = row["parent_schema"]
            parent_table = row["parent_table"]
            if parent_schema in release_schemas:
                continue
            # v1 compatibility: authenticated principals/control-plane models are
            # globally owned. A FK to an explicitly global table is permitted.
            if parent_schema == control_schema and parent_table in allowed_global_tables:
                continue
            violations.append(
                {
                    "child_schema": child_schema,
                    **row,
                    "reason": "foreign key escapes the WorldRelease ownership boundary",
                }
            )
    return violations


def validate_release_schemas(release) -> dict:
    domain_exists = schema_exists(release.domain_schema)
    auxiliary_exists = schema_exists(release.ekoh_schema)
    domain_canary = read_canary(release.domain_schema) if domain_exists else None
    auxiliary_canary = read_canary(release.ekoh_schema) if auxiliary_exists else None

    expected_identity = {
        "world_id": release.world_id,
        "release_id": release.id,
        "contract_version": SCHEMA_CONTRACT_VERSION,
        "seed_checksum": release.seed_checksum or "",
    }
    domain_canary_ok = bool(
        domain_canary
        and all(domain_canary.get(k) == v for k, v in expected_identity.items())
        and domain_canary.get("schema_kind") == "domain"
        and domain_canary.get("migration_fingerprint") == release.domain_migration_fingerprint
    )
    auxiliary_canary_ok = bool(
        auxiliary_canary
        and all(auxiliary_canary.get(k) == v for k, v in expected_identity.items())
        and auxiliary_canary.get("schema_kind") == "auxiliary"
        and auxiliary_canary.get("migration_fingerprint") == release.ekoh_migration_fingerprint
    )

    expected_domain_tables = expected_tables_for_apps(DOMAIN_MIGRATION_APPS) | set(DOMAIN_REQUIRED_RAW_TABLES)
    expected_auxiliary_tables = expected_tables_for_apps(AUXILIARY_MIGRATION_APPS) | set(AUXILIARY_REQUIRED_RAW_TABLES)
    missing_domain_tables = _missing_tables(release.domain_schema, expected_domain_tables) if domain_exists else sorted(expected_domain_tables)
    missing_auxiliary_tables = _missing_tables(release.ekoh_schema, expected_auxiliary_tables) if auxiliary_exists else sorted(expected_auxiliary_tables)

    missing_domain_migrations = (
        missing_leaf_migrations(schema=release.domain_schema, app_labels=DOMAIN_MIGRATION_APPS)
        if domain_exists
        else ["schema_missing"]
    )
    missing_auxiliary_migrations = (
        missing_leaf_migrations(schema=release.ekoh_schema, app_labels=AUXILIARY_MIGRATION_APPS)
        if auxiliary_exists
        else ["schema_missing"]
    )

    actual_domain_fp = (
        migration_fingerprint(schema=release.domain_schema, app_labels=DOMAIN_MIGRATION_APPS)
        if domain_exists
        else ""
    )
    actual_auxiliary_fp = (
        migration_fingerprint(schema=release.ekoh_schema, app_labels=AUXILIARY_MIGRATION_APPS)
        if auxiliary_exists
        else ""
    )
    fixture_expected = canonical_fixture_checksum() if auxiliary_exists else ""
    fixture_ok = (
        True
        if not fixture_expected
        else bool(release.fixture_checksum and release.fixture_checksum == fixture_expected)
    )

    violations = (
        fk_isolation_violations(
            domain_schema=release.domain_schema,
            auxiliary_schema=release.ekoh_schema,
        )
        if domain_exists and auxiliary_exists
        else [{"reason": "release schema missing"}]
    )

    checks = {
        "domain_schema_exists": domain_exists,
        "auxiliary_schema_exists": auxiliary_exists,
        "domain_canary": domain_canary,
        "auxiliary_canary": auxiliary_canary,
        "domain_canary_ok": domain_canary_ok,
        "auxiliary_canary_ok": auxiliary_canary_ok,
        "domain_missing_tables": missing_domain_tables,
        "auxiliary_missing_tables": missing_auxiliary_tables,
        "domain_business_tables_ok": not missing_domain_tables,
        "auxiliary_business_tables_ok": not missing_auxiliary_tables,
        "domain_missing_migrations": missing_domain_migrations,
        "auxiliary_missing_migrations": missing_auxiliary_migrations,
        "domain_migrations_ok": not missing_domain_migrations,
        "auxiliary_migrations_ok": not missing_auxiliary_migrations,
        "domain_migration_fingerprint": actual_domain_fp,
        "auxiliary_migration_fingerprint": actual_auxiliary_fp,
        "domain_migration_fingerprint_ok": bool(
            release.domain_migration_fingerprint
            and release.domain_migration_fingerprint == actual_domain_fp
        ),
        "auxiliary_migration_fingerprint_ok": bool(
            release.ekoh_migration_fingerprint
            and release.ekoh_migration_fingerprint == actual_auxiliary_fp
        ),
        "fixture_checksum": fixture_expected,
        "fixture_checksum_ok": fixture_ok,
        "fk_isolation_violations": violations,
        "fk_isolation_ok": not violations,
        # This is the runtime fail-closed condition: every World-owned current
        # model table must exist locally, so public cannot satisfy a missing ORM table.
        "public_fallback_guard_ok": not missing_domain_tables and not missing_auxiliary_tables,
    }
    required = (
        "domain_schema_exists",
        "auxiliary_schema_exists",
        "domain_canary_ok",
        "auxiliary_canary_ok",
        "domain_business_tables_ok",
        "auxiliary_business_tables_ok",
        "domain_migrations_ok",
        "auxiliary_migrations_ok",
        "domain_migration_fingerprint_ok",
        "auxiliary_migration_fingerprint_ok",
        "fixture_checksum_ok",
        "fk_isolation_ok",
        "public_fallback_guard_ok",
    )
    checks["ok"] = all(bool(checks[key]) for key in required)
    return checks


@lru_cache(maxsize=512)
def _runtime_guard_cached(
    release_id: int,
    domain_schema: str,
    auxiliary_schema: str,
    domain_fingerprint: str,
    auxiliary_fingerprint: str,
    fixture_checksum: str,
    seed_checksum: str,
) -> tuple[bool, str]:
    from ..models import WorldRelease

    release = WorldRelease.objects.get(pk=release_id)
    checks = validate_release_schemas(release)
    if checks.get("ok"):
        return True, ""
    compact = {
        key: value
        for key, value in checks.items()
        if key.endswith("_ok") and value is False
    }
    compact["domain_missing_tables"] = checks.get("domain_missing_tables", [])
    compact["auxiliary_missing_tables"] = checks.get("auxiliary_missing_tables", [])
    return False, repr(compact)


def assert_runtime_schema_ready(runtime) -> None:
    from ..models import WorldRelease

    release = WorldRelease.objects.only(
        "id",
        "domain_schema",
        "ekoh_schema",
        "domain_migration_fingerprint",
        "ekoh_migration_fingerprint",
        "fixture_checksum",
        "seed_checksum",
    ).get(pk=runtime.release_id)
    ok, detail = _runtime_guard_cached(
        release.id,
        release.domain_schema,
        release.ekoh_schema,
        release.domain_migration_fingerprint,
        release.ekoh_migration_fingerprint,
        release.fixture_checksum,
        release.seed_checksum,
    )
    if not ok:
        raise WorldSchemaNotReady(
            f"World {runtime.world_key}/r{runtime.release_number} data plane is not ready: {detail}"
        )


def _base_tables(schema: str) -> list[str]:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT c.relname
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = %s
              AND c.relkind IN ('r', 'p')
              AND NOT c.relispartition
              AND c.relname NOT IN (%s, %s)
            ORDER BY c.relname
            """,
            [schema, CANARY_TABLE, MIGRATION_TABLE],
        )
        return [row[0] for row in cursor.fetchall()]


def _foreign_key_edges(schema: str, tables: list[str]) -> dict[str, set[str]]:
    deps: dict[str, set[str]] = {table: set() for table in tables}
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT child.relname, parent.relname
            FROM pg_constraint con
            JOIN pg_class child ON child.oid = con.conrelid
            JOIN pg_namespace child_ns ON child_ns.oid = child.relnamespace
            JOIN pg_class parent ON parent.oid = con.confrelid
            JOIN pg_namespace parent_ns ON parent_ns.oid = parent.relnamespace
            WHERE con.contype = 'f' AND child_ns.nspname = %s AND parent_ns.nspname = %s
            """,
            [schema, schema],
        )
        for child, parent in cursor.fetchall():
            if child in deps and parent in deps and child != parent:
                deps[child].add(parent)
    return deps


def _copy_order(schema: str, tables: list[str]) -> list[str]:
    deps = _foreign_key_edges(schema, tables)
    reverse: dict[str, set[str]] = defaultdict(set)
    indegree = {table: len(parents) for table, parents in deps.items()}
    for child, parents in deps.items():
        for parent in parents:
            reverse[parent].add(child)
    queue = deque(sorted(table for table, degree in indegree.items() if degree == 0))
    ordered: list[str] = []
    while queue:
        table = queue.popleft()
        ordered.append(table)
        for child in sorted(reverse.get(table, ())):
            indegree[child] -= 1
            if indegree[child] == 0:
                queue.append(child)
    if len(ordered) != len(tables):
        raise RuntimeError(
            f"World schema contains a cross-table FK cycle: {sorted(set(tables) - set(ordered))}"
        )
    return ordered


def clear_schema_data(schema: str) -> None:
    tables = _base_tables(schema)
    if not tables:
        return
    qualified = ", ".join(
        f"{_q(schema)}.{connection.ops.quote_name(table)}" for table in tables
    )
    with connection.cursor() as cursor:
        cursor.execute(f"TRUNCATE TABLE {qualified} RESTART IDENTITY CASCADE")


def copy_schema_data(source_schema: str, target_schema: str) -> None:
    validate_schema_name(source_schema)
    validate_schema_name(target_schema)
    tables = _base_tables(source_schema)
    if not tables:
        return
    order = _copy_order(source_schema, tables)
    for table in order:
        q_table = connection.ops.quote_name(table)
        with connection.cursor() as cursor:
            cursor.execute(
                f"INSERT INTO {_q(target_schema)}.{q_table} "
                f"SELECT * FROM {_q(source_schema)}.{q_table}"
            )


def remap_global_user_references(schema: str, mapping: dict[int, int]) -> int:
    """No implicit cross-application user rewrites in the standalone Worlds runtime."""

    validate_schema_name(schema)
    return 0
