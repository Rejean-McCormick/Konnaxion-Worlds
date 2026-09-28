from __future__ import annotations

import hashlib
import re
from contextlib import contextmanager
from dataclasses import dataclass

from django.apps import apps
from django.conf import settings
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.db.migrations.loader import MigrationLoader
from django.utils.module_loading import import_string

from ..db import validate_schema_name

# Canonical ownership groups from the Worlds data-ownership matrix.
# Keep EkoH/Smart Vote physically separate from the domain schema.
DOMAIN_MIGRATION_APPS = (
    "kollective_intelligence",
    "ethikos",
    "keenkonnect",
    "konnected",
    "kreative",
    "moderation",
    "teambuilder",
)
AUXILIARY_MIGRATION_APPS = ("ekoh", "smart_vote")
WORLD_OWNED_APP_LABELS = frozenset((*DOMAIN_MIGRATION_APPS, *AUXILIARY_MIGRATION_APPS))
DOMAIN_REQUIRED_RAW_TABLES = frozenset()
AUXILIARY_REQUIRED_RAW_TABLES = frozenset({"vote", "vote_result", "vote_ledger", "vote_modality"})
LEGACY_AUXILIARY_SCHEMA = "ekoh_smartvote"
MIGRATION_TABLE = "django_migrations"


@dataclass(frozen=True, slots=True)
class ProvisioningReport:
    domain_migration_fingerprint: str
    auxiliary_migration_fingerprint: str
    fixture_checksum: str
    domain_apps: tuple[str, ...]
    auxiliary_apps: tuple[str, ...]

    def as_dict(self) -> dict:
        return {
            "mode": "scoped_migrations",
            "domain_apps": list(self.domain_apps),
            "auxiliary_apps": list(self.auxiliary_apps),
            "domain_migration_fingerprint": self.domain_migration_fingerprint,
            "auxiliary_migration_fingerprint": self.auxiliary_migration_fingerprint,
            "fixture_checksum": self.fixture_checksum,
        }


def _q(identifier: str) -> str:
    return connection.ops.quote_name(validate_schema_name(identifier))


def _control_schema() -> str:
    return validate_schema_name(getattr(settings, "KONNAXION_CONTROL_SCHEMA", "public"))


def _installed(labels: tuple[str, ...]) -> tuple[str, ...]:
    installed: list[str] = []
    for label in labels:
        try:
            apps.get_app_config(label)
        except LookupError:
            continue
        installed.append(label)
    return tuple(installed)


def _show_search_path() -> str:
    with connection.cursor() as cursor:
        cursor.execute("SHOW search_path")
        return str(cursor.fetchone()[0])


def _set_search_path(schema: str) -> None:
    control = _control_schema()
    with connection.cursor() as cursor:
        cursor.execute(f"SET search_path TO {_q(schema)}, {_q(control)}")


def _restore_search_path(value: str) -> None:
    # SHOW search_path returns server-generated SQL syntax such as '"$user", public'.
    # It is not user-controlled and is restored verbatim to the same connection.
    with connection.cursor() as cursor:
        cursor.execute(f"SET search_path TO {value}")


def _migration_loader_from_control_schema() -> MigrationLoader:
    """Load the migration graph against the global/control migration ledger.

    The graph itself is code-defined, but Django also inspects the active
    ``django_migrations`` table while constructing a loader.  Force that read to
    the control schema so a partially provisioned World schema can never affect
    graph construction.
    """

    previous = _show_search_path()
    try:
        _set_search_path(_control_schema())
        return MigrationLoader(connection, ignore_no_migrations=True)
    finally:
        _restore_search_path(previous)


def _safe_control_migration_rows() -> list[tuple[str, str, object]]:
    """Return global migration rows safe to seed into a World ledger.

    A global migration can still depend on a World-owned migration.  Copying
    such a row as "already applied" makes Django render an impossible partial
    ProjectState.  The concrete example in Konnaxion is users.0003, which adds a
    FK to kreative.KreativeArtwork and therefore depends on kreative.0002.

    We seed only global migrations whose *entire ancestry* is global.  Global
    descendants of a World-owned dependency are intentionally left unapplied in
    the release ledger; they are control-plane history, not schema work that
    should run inside the World schema.  World migrations only require the safe
    global frontier (for example users.0001 for AUTH_USER_MODEL).
    """

    loader = _migration_loader_from_control_schema()
    graph_nodes = set(loader.graph.nodes)
    control = _q(_control_schema())
    q_table = connection.ops.quote_name(MIGRATION_TABLE)

    with connection.cursor() as cursor:
        cursor.execute(
            f"SELECT app, name, applied FROM {control}.{q_table} ORDER BY id"
        )
        rows = list(cursor.fetchall())

    safe: list[tuple[str, str, object]] = []
    for app_label, migration_name, applied in rows:
        node = (str(app_label), str(migration_name))
        if node[0] in WORLD_OWNED_APP_LABELS:
            continue
        # Ignore stale ledger rows for migrations no longer present in the
        # installed migration graph.  They cannot contribute useful ProjectState.
        if node not in graph_nodes:
            continue
        ancestry = loader.graph.forwards_plan(node)
        if any(parent_app in WORLD_OWNED_APP_LABELS for parent_app, _ in ancestry):
            continue
        safe.append((node[0], node[1], applied))
    return safe


def _ensure_local_migration_recorder(schema: str) -> None:
    q_schema = _q(schema)
    q_table = connection.ops.quote_name(MIGRATION_TABLE)
    with connection.cursor() as cursor:
        cursor.execute(
            f"CREATE TABLE IF NOT EXISTS {q_schema}.{q_table} ("
            "id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, "
            "app varchar(255) NOT NULL, "
            "name varchar(255) NOT NULL, "
            "applied timestamptz NOT NULL"
            ")"
        )
        cursor.execute(f"SELECT COUNT(*) FROM {q_schema}.{q_table}")
        if int(cursor.fetchone()[0]) != 0:
            return

    rows = _safe_control_migration_rows()
    if not rows:
        return
    with connection.cursor() as cursor:
        cursor.executemany(
            f"INSERT INTO {q_schema}.{q_table} (app, name, applied) VALUES (%s, %s, %s)",
            rows,
        )


def _scoped_migration_sql_wrapper(
    target_schema: str, *, rewrite_legacy_auxiliary: bool = False
):
    """Pin Django's migration ledger and legacy auxiliary SQL to one schema.

    ``SET search_path`` is still used for ordinary model DDL, but the migration
    recorder is safety-critical: its ORM queries must never resolve the global
    ``public.django_migrations`` table while a WorldRelease is being built.

    Django emits recorder SQL with the table name as both relation and column
    qualifier (for example ``\"django_migrations\".\"app\"``). PostgreSQL
    accepts ``schema.table.column`` references, so qualifying every quoted
    recorder occurrence keeps SELECT/INSERT/DELETE statements internally
    consistent and makes the local ledger authoritative.
    """

    validate_schema_name(target_schema)
    quoted_schema = _q(target_schema)
    quoted_migration_table = connection.ops.quote_name(MIGRATION_TABLE)
    qualified_migration_table = f"{quoted_schema}.{quoted_migration_table}"
    legacy_pattern = re.compile(
        r'(?<![A-Za-z0-9_])(?:"ekoh_smartvote"|ekoh_smartvote)(?![A-Za-z0-9_])'
    )

    def rewrite_value(value):
        if isinstance(value, str) and rewrite_legacy_auxiliary:
            if value == LEGACY_AUXILIARY_SCHEMA:
                return target_schema
            legacy_prefix = f"{LEGACY_AUXILIARY_SCHEMA}."
            if value.startswith(legacy_prefix):
                return f"{target_schema}{value[len(LEGACY_AUXILIARY_SCHEMA):]}"
            quoted_prefix = f'"{LEGACY_AUXILIARY_SCHEMA}".'
            if value.startswith(quoted_prefix):
                return f'"{target_schema}"{value[len(LEGACY_AUXILIARY_SCHEMA) + 2:]}'
            return value
        if isinstance(value, tuple):
            return tuple(rewrite_value(item) for item in value)
        if isinstance(value, list):
            return [rewrite_value(item) for item in value]
        if isinstance(value, dict):
            return {key: rewrite_value(item) for key, item in value.items()}
        return value

    def wrapper(execute, sql, params, many, context):
        if isinstance(sql, str):
            # MigrationRecorder uses an unqualified db_table by design. During a
            # World build, force every reference to the release-local ledger so
            # a startup/default search_path can never make public authoritative.
            if quoted_migration_table in sql:
                sql = sql.replace(quoted_migration_table, qualified_migration_table)

            if rewrite_legacy_auxiliary and LEGACY_AUXILIARY_SCHEMA in sql:
                sql = legacy_pattern.sub(quoted_schema, sql)

        if params:
            params = rewrite_value(params)
        return execute(sql, params, many, context)

    return wrapper


@contextmanager
def _migration_scope(schema: str, *, rewrite_legacy_auxiliary: bool = False):
    validate_schema_name(schema)
    previous = _show_search_path()
    wrapper = _scoped_migration_sql_wrapper(
        schema,
        rewrite_legacy_auxiliary=rewrite_legacy_auxiliary,
    )
    try:
        _set_search_path(schema)
        with connection.execute_wrapper(wrapper):
            yield
    finally:
        _restore_search_path(previous)


def _leaf_targets(executor: MigrationExecutor, app_labels: tuple[str, ...]) -> list[tuple[str, str]]:
    targets: list[tuple[str, str]] = []
    for label in app_labels:
        nodes = executor.loader.graph.leaf_nodes(label)
        if not nodes:
            raise RuntimeError(f"World migration app {label!r} has no migration leaf node.")
        targets.extend(nodes)
    return targets


def run_scoped_migrations(
    *, schema: str, app_labels: tuple[str, ...], rewrite_legacy_auxiliary: bool = False
) -> str:
    """Apply one allowlisted migration group into exactly one release schema.

    The schema owns its own django_migrations ledger. Global/control migrations
    are copied into that ledger as satisfied dependencies, while World-owned
    migrations are replayed locally. Historical EkoH/Smart Vote migrations that
    hard-code ``ekoh_smartvote`` are connection-locally rewritten to the release
    auxiliary schema; the migration files themselves remain unchanged.
    """

    labels = _installed(app_labels)
    if not labels:
        return hashlib.sha256(b"no-installed-apps").hexdigest()

    _ensure_local_migration_recorder(schema)
    with _migration_scope(schema, rewrite_legacy_auxiliary=rewrite_legacy_auxiliary):
        executor = MigrationExecutor(connection)
        targets = _leaf_targets(executor, labels)
        executor.migrate(targets)

    missing = missing_leaf_migrations(schema=schema, app_labels=labels)
    if missing:
        raise RuntimeError(
            f"Scoped migrations incomplete for {schema}: missing leaf migrations {missing}"
        )
    return migration_fingerprint(schema=schema, app_labels=labels)


def applied_migrations(*, schema: str, app_labels: tuple[str, ...]) -> list[tuple[str, str]]:
    validate_schema_name(schema)
    q_schema = _q(schema)
    q_table = connection.ops.quote_name(MIGRATION_TABLE)
    with connection.cursor() as cursor:
        cursor.execute("SELECT to_regclass(%s)", [f"{schema}.{MIGRATION_TABLE}"])
        if cursor.fetchone()[0] is None:
            return []
        cursor.execute(
            f"SELECT app, name FROM {q_schema}.{q_table} "
            "WHERE app = ANY(%s) ORDER BY app, name",
            [list(app_labels)],
        )
        return [(str(app), str(name)) for app, name in cursor.fetchall()]


def migration_fingerprint(*, schema: str, app_labels: tuple[str, ...]) -> str:
    rows = applied_migrations(schema=schema, app_labels=app_labels)
    payload = "\n".join(f"{app}:{name}" for app, name in rows).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def expected_leaf_migrations(app_labels: tuple[str, ...]) -> set[tuple[str, str]]:
    labels = _installed(app_labels)
    if not labels:
        return set()
    # Graph topology is independent of which release schema is active.
    executor = MigrationExecutor(connection)
    return set(_leaf_targets(executor, labels))


def missing_leaf_migrations(*, schema: str, app_labels: tuple[str, ...]) -> list[str]:
    expected = expected_leaf_migrations(app_labels)
    applied = set(applied_migrations(schema=schema, app_labels=app_labels))
    return [f"{app}.{name}" for app, name in sorted(expected - applied)]


def expected_tables_for_apps(app_labels: tuple[str, ...]) -> set[str]:
    labels = set(_installed(app_labels))
    tables: set[str] = set()
    for model in apps.get_models(include_auto_created=True):
        opts = model._meta
        if opts.app_label not in labels or opts.proxy or not opts.managed:
            continue
        table = str(opts.db_table)
        # Schema-qualified db_table names are not valid World-owned model tables.
        if table and "." not in table:
            tables.add(table)
    return tables


def global_control_tables() -> set[str]:
    tables: set[str] = set()
    for model in apps.get_models(include_auto_created=True):
        opts = model._meta
        if opts.app_label in WORLD_OWNED_APP_LABELS or opts.proxy or not opts.managed:
            continue
        table = str(opts.db_table)
        if table and "." not in table:
            tables.add(table)
    tables.add(MIGRATION_TABLE)
    return tables


def canonical_fixture_checksum() -> str:
    """Return the host-owned canonical auxiliary fixture checksum, if configured."""
    provider_path = str(
        getattr(settings, "KONNAXION_WORLDS_FIXTURE_CHECKSUM_PROVIDER", "") or ""
    ).strip()
    if not provider_path:
        return ""
    provider = import_string(provider_path)
    value = str(provider() or "").strip()
    if value and len(value) > 128:
        raise RuntimeError("World fixture checksum provider returned an invalid checksum.")
    return value


def load_host_fixture_for_release(release) -> str:
    """Run a host-domain fixture adapter inside the release boundary.

    The engine never imports host models directly. The configured loader owns
    its domain-specific ORM work and returns the checksum it materialized.
    """
    loader_path = str(
        getattr(settings, "KONNAXION_WORLDS_FIXTURE_LOADER", "") or ""
    ).strip()
    if not loader_path:
        return ""
    loader = import_string(loader_path)
    checksum = str(loader(release) or "").strip()
    expected = canonical_fixture_checksum()
    if expected and checksum != expected:
        raise RuntimeError(
            "World fixture loader checksum does not match the configured canonical fixture."
        )
    return checksum


def provision_release(release) -> ProvisioningReport:
    if connection.vendor != "postgresql":
        raise RuntimeError("Konnaxion Worlds scoped migrations require PostgreSQL.")

    from .schema import create_schema

    create_schema(release.domain_schema)
    create_schema(release.ekoh_schema)

    domain_labels = _installed(DOMAIN_MIGRATION_APPS)
    auxiliary_labels = _installed(AUXILIARY_MIGRATION_APPS)

    domain_fp = run_scoped_migrations(
        schema=release.domain_schema,
        app_labels=domain_labels,
        rewrite_legacy_auxiliary=False,
    )
    auxiliary_fp = run_scoped_migrations(
        schema=release.ekoh_schema,
        app_labels=auxiliary_labels,
        rewrite_legacy_auxiliary=True,
    )
    fixture_checksum = load_host_fixture_for_release(release)

    return ProvisioningReport(
        domain_migration_fingerprint=domain_fp,
        auxiliary_migration_fingerprint=auxiliary_fp,
        fixture_checksum=fixture_checksum,
        domain_apps=domain_labels,
        auxiliary_apps=auxiliary_labels,
    )
