from __future__ import annotations

import re
from contextlib import contextmanager

from django.conf import settings
from django.db import connection, transaction

from .runtime import (
    WorldRuntime,
    get_world_runtime,
    reset_world_runtime,
    set_world_runtime,
)

_SCHEMA_RE = re.compile(r"^[a-z][a-z0-9_]{0,62}$")


def validate_schema_name(schema: str) -> str:
    if not isinstance(schema, str) or not _SCHEMA_RE.fullmatch(schema):
        raise ValueError(f"Unsafe World schema name: {schema!r}")
    return schema


def _quote_schema(schema: str) -> str:
    return connection.ops.quote_name(validate_schema_name(schema))


def world_search_path(runtime: WorldRuntime) -> str:
    control_schema = getattr(settings, "KONNAXION_CONTROL_SCHEMA", "public")
    schemas = (runtime.ekoh_schema, runtime.domain_schema, control_schema)
    return ", ".join(_quote_schema(schema) for schema in schemas)


def set_local_world_search_path(runtime: WorldRuntime) -> None:
    with connection.cursor() as cursor:
        cursor.execute(f"SET LOCAL search_path TO {world_search_path(runtime)}")


@contextmanager
def world_db_scope(runtime: WorldRuntime):
    existing = get_world_runtime()
    if existing is not None:
        if existing != runtime:
            raise RuntimeError(
                "Nested Konnaxion World scopes may not cross World/Release boundaries."
            )
        # Same-scope nesting is allowed for services that defensively establish scope.
        with transaction.atomic():
            set_local_world_search_path(runtime)
            yield runtime
        return

    with transaction.atomic():
        set_local_world_search_path(runtime)
        token = set_world_runtime(runtime)
        try:
            yield runtime
        finally:
            reset_world_runtime(token)
