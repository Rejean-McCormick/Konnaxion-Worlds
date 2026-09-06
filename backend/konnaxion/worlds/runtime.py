from __future__ import annotations

from contextvars import ContextVar
from dataclasses import dataclass


class WorldContextRequired(RuntimeError):
    pass


class WorldContextConflict(RuntimeError):
    pass


@dataclass(frozen=True, slots=True)
class WorldRuntime:
    world_id: int
    world_key: str
    release_id: int
    release_number: int
    domain_schema: str
    ekoh_schema: str
    is_dirty: bool = False


_current_world_runtime: ContextVar[WorldRuntime | None] = ContextVar(
    "konnaxion_world_runtime", default=None
)


def get_world_runtime() -> WorldRuntime | None:
    return _current_world_runtime.get()


def require_world_runtime() -> WorldRuntime:
    runtime = get_world_runtime()
    if runtime is None:
        raise WorldContextRequired("A Konnaxion World context is required.")
    return runtime


def set_world_runtime(runtime: WorldRuntime):
    existing = get_world_runtime()
    if existing is not None and existing != runtime:
        raise WorldContextConflict(
            f"Cannot enter {runtime.world_key}/r{runtime.release_number} while "
            f"already scoped to {existing.world_key}/r{existing.release_number}."
        )
    return _current_world_runtime.set(runtime)


def reset_world_runtime(token) -> None:
    _current_world_runtime.reset(token)
