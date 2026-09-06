from __future__ import annotations

from ..runtime import WorldRuntime, require_world_runtime


def world_cache_key(key: str, *, runtime: WorldRuntime | None = None) -> str:
    """Return a release-pinned cache key. Never silently falls back global."""
    rt = runtime or require_world_runtime()
    clean = str(key).lstrip(":")
    return f"w:{rt.world_id}:r:{rt.release_id}:{clean}"


def world_channel_name(name: str, *, runtime: WorldRuntime | None = None) -> str:
    rt = runtime or require_world_runtime()
    clean = str(name).replace(" ", "_").lstrip(":")
    return f"world.{rt.world_id}.release.{rt.release_id}.{clean}"
