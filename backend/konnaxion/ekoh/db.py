"""PostgreSQL schema scope helpers for EkoH / Smart Vote.

Legacy single-World deployments use ``ekoh_smartvote``. When a Konnaxion
WorldRuntime is active, the same helpers transparently select that release's
EkoH schema and retain its domain/control fallbacks. This prevents legacy
services from escaping a World scope.
"""
from __future__ import annotations

from contextlib import contextmanager

from django.db import connection, transaction

EKOH_SMARTVOTE_SEARCH_PATH_SQL = "SET LOCAL search_path TO ekoh_smartvote, public"


def _active_world_runtime():
    try:
        from konnaxion.worlds.runtime import get_world_runtime
    except ImportError:
        return None
    return get_world_runtime()


def set_local_ekoh_smartvote_search_path() -> None:
    """Set the EkoH / Smart Vote path without breaking an active World scope."""
    runtime = _active_world_runtime()
    if runtime is not None:
        from konnaxion.worlds.db import set_local_world_search_path

        set_local_world_search_path(runtime)
        return
    with connection.cursor() as cursor:
        cursor.execute(EKOH_SMARTVOTE_SEARCH_PATH_SQL)


@contextmanager
def ekoh_smartvote_db_scope():
    """Run EkoH/Smart Vote ORM work in the current World or legacy schema."""
    with transaction.atomic():
        set_local_ekoh_smartvote_search_path()
        yield
