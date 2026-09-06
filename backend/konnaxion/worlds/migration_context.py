"""Build-time context used by legacy EkoH/Smart Vote migrations.

Normal migrations continue to target ``ekoh_smartvote``. World builds set an
override while replaying those migrations into a release-specific EkoH schema.
"""
from __future__ import annotations

from contextlib import contextmanager
from contextvars import ContextVar

_DEFAULT_EKOH_SCHEMA = "ekoh_smartvote"
_target_ekoh_schema: ContextVar[str | None] = ContextVar(
    "konnaxion_world_target_ekoh_schema", default=None
)


def get_target_ekoh_schema() -> str:
    return _target_ekoh_schema.get() or _DEFAULT_EKOH_SCHEMA


@contextmanager
def override_ekoh_migration_schema(schema: str):
    token = _target_ekoh_schema.set(schema)
    try:
        yield
    finally:
        _target_ekoh_schema.reset(token)
