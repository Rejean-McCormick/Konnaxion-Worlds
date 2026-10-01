from __future__ import annotations

from collections import defaultdict
from typing import Any

from django.db import connection

from ..models import WorldRelease


def _schema_sizes(schemas: list[str]) -> dict[str, int]:
    names = sorted({str(value) for value in schemas if value})
    if not names:
        return {}
    # Sum only table-like relations. pg_total_relation_size(table) already
    # includes indexes and TOAST, so including index relkinds separately would
    # double-count them.
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT n.nspname,
                   COALESCE(SUM(pg_total_relation_size(c.oid)), 0)::bigint
            FROM pg_namespace n
            LEFT JOIN pg_class c
              ON c.relnamespace = n.oid
             AND c.relkind IN ('r', 'p', 'm')
            WHERE n.nspname = ANY(%s)
            GROUP BY n.nspname
            """,
            [names],
        )
        return {str(schema): int(size or 0) for schema, size in cursor.fetchall()}


def _cluster_limit() -> tuple[str, int | None]:
    """Return Neon/project cluster-size setting when the provider exposes it."""

    with connection.cursor() as cursor:
        cursor.execute("SELECT current_setting('neon.max_cluster_size', true)")
        raw = cursor.fetchone()[0]
        if raw is None or not str(raw).strip():
            return "", None
        text = str(raw).strip()
        try:
            cursor.execute("SELECT pg_size_bytes(%s)::bigint", [text])
            value = cursor.fetchone()[0]
            return text, int(value) if value is not None else None
        except Exception:
            # Some providers expose a bare integer that pg_size_bytes may reject.
            try:
                return text, int(text)
            except ValueError:
                return text, None


def _provider_cluster_size() -> tuple[str, int | None]:
    """Return the provider's own cluster/timeline size when exposed.

    Neon enforces ``neon.max_cluster_size`` against its pageserver-reported
    cluster size, not necessarily ``pg_database_size(current_database())``.
    The neon extension exposes that same value as ``pg_cluster_size()``.  Find
    the function dynamically because the extension is relocatable.
    """

    if connection.vendor != "postgresql":
        return "", None
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT n.nspname
                FROM pg_proc p
                JOIN pg_namespace n ON n.oid = p.pronamespace
                WHERE p.proname = 'pg_cluster_size'
                  AND pg_get_function_identity_arguments(p.oid) = ''
                ORDER BY CASE WHEN n.nspname = 'neon' THEN 0 ELSE 1 END, n.nspname
                LIMIT 1
                """
            )
            row = cursor.fetchone()
            if not row:
                return "", None
            schema = str(row[0])
            quoted_schema = connection.ops.quote_name(schema)
            cursor.execute(f"SELECT {quoted_schema}.pg_cluster_size()::bigint")
            value = cursor.fetchone()[0]
            if value is None:
                return f"{schema}.pg_cluster_size()", None
            return f"{schema}.pg_cluster_size()", int(value)
    except Exception:
        # Storage reporting must remain usable on ordinary PostgreSQL or Neon
        # computes where the extension function is temporarily unavailable.
        return "", None


def _all_database_size() -> int:
    """Approximate the PostgreSQL cluster footprint visible to this compute."""

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT COALESCE(SUM(pg_database_size(datname)), 0)::bigint
                FROM pg_database
                WHERE NOT datistemplate
                """
            )
            return int(cursor.fetchone()[0] or 0)
    except Exception:
        # Cross-database size inspection can be privilege-restricted. The caller
        # will fall back to the current database when no provider metric exists.
        return 0


def database_storage_report(*, universe_key: str | None = None) -> dict[str, Any]:
    if connection.vendor != "postgresql":
        raise RuntimeError("World storage inspection requires PostgreSQL.")

    with connection.cursor() as cursor:
        cursor.execute("SELECT pg_database_size(current_database())::bigint")
        database_bytes = int(cursor.fetchone()[0] or 0)

    all_databases_bytes = _all_database_size()
    provider_size_source, provider_cluster_bytes = _provider_cluster_size()
    limit_raw, limit_bytes = _cluster_limit()

    # Capacity decisions should use the same provider metric that enforces the
    # limit whenever it is available.  ``pg_database_size`` remains useful for
    # attribution, but it can materially under-report Neon timeline usage.
    capacity_used_bytes = (
        int(provider_cluster_bytes)
        if provider_cluster_bytes is not None and provider_cluster_bytes > 0
        else int(all_databases_bytes or database_bytes)
    )
    capacity_source = (
        provider_size_source
        if provider_cluster_bytes is not None and provider_cluster_bytes > 0
        else "sum(pg_database_size)"
    )

    releases = WorldRelease.objects.select_related("world", "world__universe").order_by(
        "world__universe__key", "world__key", "release_number"
    )
    if universe_key:
        releases = releases.filter(world__universe__key=str(universe_key).strip().lower())
    release_rows = list(releases)
    sizes = _schema_sizes(
        [schema for release in release_rows for schema in (release.domain_schema, release.ekoh_schema)]
    )

    by_universe: dict[str, dict[str, Any]] = {}
    rows: list[dict[str, Any]] = []
    reclaimable_failed = 0
    reclaimable_frozen = 0
    reclaimable_incomplete = 0

    for release in release_rows:
        domain_bytes = sizes.get(release.domain_schema, 0)
        auxiliary_bytes = sizes.get(release.ekoh_schema, 0)
        total_bytes = domain_bytes + auxiliary_bytes
        is_current = release.world.current_release_id == release.id
        is_incomplete = release.status in {
            WorldRelease.STATUS_BUILDING,
            WorldRelease.STATUS_VALIDATING,
        }
        row = {
            "universe": release.world.universe.key,
            "world": release.world.key,
            "release_id": release.id,
            "release_number": release.release_number,
            "status": release.status,
            "is_current": is_current,
            "seed_version": release.seed_version,
            "domain_schema": release.domain_schema,
            "auxiliary_schema": release.ekoh_schema,
            "domain_bytes": domain_bytes,
            "auxiliary_bytes": auxiliary_bytes,
            "total_bytes": total_bytes,
        }
        rows.append(row)

        group = by_universe.setdefault(
            release.world.universe.key,
            {
                "release_count": 0,
                "schema_bytes": 0,
                "current_bytes": 0,
                "failed_bytes": 0,
                "frozen_bytes": 0,
                "incomplete_bytes": 0,
            },
        )
        group["release_count"] += 1
        group["schema_bytes"] += total_bytes
        if is_current:
            group["current_bytes"] += total_bytes
        if release.status == WorldRelease.STATUS_FAILED and not is_current:
            group["failed_bytes"] += total_bytes
            reclaimable_failed += total_bytes
        if release.status == WorldRelease.STATUS_FROZEN and not is_current:
            group["frozen_bytes"] += total_bytes
            reclaimable_frozen += total_bytes
        if is_incomplete and not is_current:
            group["incomplete_bytes"] += total_bytes
            reclaimable_incomplete += total_bytes

    return {
        "database_bytes": database_bytes,
        "all_databases_bytes": all_databases_bytes,
        "provider_cluster_bytes": provider_cluster_bytes,
        "provider_size_source": provider_size_source,
        "capacity_used_bytes": capacity_used_bytes,
        "capacity_source": capacity_source,
        "limit_raw": limit_raw,
        "limit_bytes": limit_bytes,
        "remaining_bytes": max(0, limit_bytes - capacity_used_bytes) if limit_bytes is not None else None,
        "usage_percent": (
            round(capacity_used_bytes / limit_bytes * 100.0, 2)
            if limit_bytes
            else None
        ),
        "reclaimable_failed_bytes": reclaimable_failed,
        "reclaimable_frozen_bytes": reclaimable_frozen,
        "reclaimable_incomplete_bytes": reclaimable_incomplete,
        "by_universe": by_universe,
        "releases": rows,
    }


def format_bytes(value: int | None) -> str:
    if value is None:
        return "-"
    number = float(value)
    units = ("B", "KiB", "MiB", "GiB", "TiB")
    unit = units[0]
    for candidate in units:
        unit = candidate
        if abs(number) < 1024 or candidate == units[-1]:
            break
        number /= 1024.0
    if unit == "B":
        return f"{int(number)} {unit}"
    return f"{number:.1f} {unit}"
