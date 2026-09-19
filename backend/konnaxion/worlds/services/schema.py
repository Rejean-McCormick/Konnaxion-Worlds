from __future__ import annotations

import hashlib
from collections import defaultdict, deque

from django.db import connection, transaction

from ..db import validate_schema_name

CANARY_TABLE = "kx_world_canary"
SCHEMA_CONTRACT_VERSION = "kx-world-schema/v2"


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


def write_canary(*, schema: str, world_id: int, release_id: int, schema_kind: str) -> None:
    q_schema = _q(schema)
    with connection.cursor() as cursor:
        cursor.execute(
            f"CREATE TABLE IF NOT EXISTS {q_schema}.{CANARY_TABLE} ("
            "world_id bigint NOT NULL, release_id bigint NOT NULL, "
            "schema_kind varchar(32) NOT NULL, contract_version varchar(64) NOT NULL)"
        )
        cursor.execute(f"TRUNCATE TABLE {q_schema}.{CANARY_TABLE}")
        cursor.execute(
            f"INSERT INTO {q_schema}.{CANARY_TABLE} "
            "(world_id, release_id, schema_kind, contract_version) VALUES (%s, %s, %s, %s)",
            [world_id, release_id, schema_kind, SCHEMA_CONTRACT_VERSION],
        )


def read_canary(schema: str) -> dict | None:
    q_schema = _q(schema)
    with connection.cursor() as cursor:
        cursor.execute("SELECT to_regclass(%s)", [f"{schema}.{CANARY_TABLE}"])
        if cursor.fetchone()[0] is None:
            return None
        cursor.execute(
            f"SELECT world_id, release_id, schema_kind, contract_version "
            f"FROM {q_schema}.{CANARY_TABLE} LIMIT 1"
        )
        row = cursor.fetchone()
    if not row:
        return None
    return {
        "world_id": row[0],
        "release_id": row[1],
        "schema_kind": row[2],
        "contract_version": row[3],
    }


def provision_release_schemas(release) -> tuple[str, str]:
    """Provision two release-local schemas owned only by Konnaxion Worlds.

    No migrations from the main Konnaxion application are replayed here.  Domain
    applications can attach their own contracts later through explicit adapters.
    """

    with transaction.atomic():
        create_schema(release.domain_schema)
        create_schema(release.ekoh_schema)
        write_canary(
            schema=release.domain_schema,
            world_id=release.world_id,
            release_id=release.id,
            schema_kind="domain",
        )
        write_canary(
            schema=release.ekoh_schema,
            world_id=release.world_id,
            release_id=release.id,
            schema_kind="auxiliary",
        )
    return _contract_fingerprint("domain"), _contract_fingerprint("auxiliary")


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
    allowed = {domain_schema, auxiliary_schema}
    violations: list[dict[str, str]] = []
    for child_schema in allowed:
        for row in foreign_key_targets(child_schema):
            if row["parent_schema"] not in allowed:
                violations.append(
                    {
                        "child_schema": child_schema,
                        **row,
                        "reason": "foreign key targets a schema outside this WorldRelease",
                    }
                )
    return violations


def validate_release_schemas(release) -> dict:
    domain_exists = schema_exists(release.domain_schema)
    auxiliary_exists = schema_exists(release.ekoh_schema)
    domain_canary = read_canary(release.domain_schema) if domain_exists else None
    auxiliary_canary = read_canary(release.ekoh_schema) if auxiliary_exists else None
    expected = {
        "world_id": release.world_id,
        "release_id": release.id,
        "contract_version": SCHEMA_CONTRACT_VERSION,
    }
    domain_canary_ok = bool(
        domain_canary
        and all(domain_canary.get(k) == v for k, v in expected.items())
        and domain_canary.get("schema_kind") == "domain"
    )
    auxiliary_canary_ok = bool(
        auxiliary_canary
        and all(auxiliary_canary.get(k) == v for k, v in expected.items())
        and auxiliary_canary.get("schema_kind") == "auxiliary"
    )
    violations = (
        fk_isolation_violations(
            domain_schema=release.domain_schema,
            auxiliary_schema=release.ekoh_schema,
        )
        if domain_exists and auxiliary_exists
        else [{"reason": "release schema missing"}]
    )
    domain_fp = _contract_fingerprint("domain")
    auxiliary_fp = _contract_fingerprint("auxiliary")
    checks = {
        "domain_schema_exists": domain_exists,
        "auxiliary_schema_exists": auxiliary_exists,
        "domain_canary": domain_canary,
        "auxiliary_canary": auxiliary_canary,
        "domain_canary_ok": domain_canary_ok,
        "auxiliary_canary_ok": auxiliary_canary_ok,
        "domain_contract_fingerprint": domain_fp,
        "auxiliary_contract_fingerprint": auxiliary_fp,
        "domain_contract_current": release.domain_migration_fingerprint in {"", domain_fp},
        "auxiliary_contract_current": release.ekoh_migration_fingerprint in {"", auxiliary_fp},
        "fk_isolation_violations": violations,
        "fk_isolation_ok": not violations,
    }
    checks["ok"] = all(
        checks[key]
        for key in (
            "domain_schema_exists",
            "auxiliary_schema_exists",
            "domain_canary_ok",
            "auxiliary_canary_ok",
            "domain_contract_current",
            "auxiliary_contract_current",
            "fk_isolation_ok",
        )
    )
    return checks


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
              AND c.relname <> %s
            ORDER BY c.relname
            """,
            [schema, CANARY_TABLE],
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
        raise RuntimeError(f"World schema contains a cross-table FK cycle: {sorted(set(tables) - set(ordered))}")
    return ordered


def clear_schema_data(schema: str) -> None:
    tables = _base_tables(schema)
    if not tables:
        return
    qualified = ", ".join(f"{_q(schema)}.{connection.ops.quote_name(table)}" for table in tables)
    with connection.cursor() as cursor:
        cursor.execute(f"TRUNCATE TABLE {qualified} RESTART IDENTITY CASCADE")


def copy_schema_data(source_schema: str, target_schema: str) -> None:
    validate_schema_name(source_schema)
    validate_schema_name(target_schema)
    tables = _base_tables(source_schema)
    if not tables:
        return
    order = _copy_order(source_schema, tables)
    with transaction.atomic():
        for table in order:
            q_table = connection.ops.quote_name(table)
            with connection.cursor() as cursor:
                cursor.execute(
                    f"CREATE TABLE IF NOT EXISTS {_q(target_schema)}.{q_table} "
                    f"(LIKE {_q(source_schema)}.{q_table} INCLUDING ALL)"
                )
                cursor.execute(
                    f"INSERT INTO {_q(target_schema)}.{q_table} "
                    f"SELECT * FROM {_q(source_schema)}.{q_table}"
                )


def remap_global_user_references(schema: str, mapping: dict[int, int]) -> int:
    """No implicit cross-application user rewrites in the standalone Worlds runtime."""

    validate_schema_name(schema)
    return 0
