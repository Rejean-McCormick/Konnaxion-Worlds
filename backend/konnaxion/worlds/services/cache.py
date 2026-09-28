from __future__ import annotations

import re

from ..runtime import WorldRuntime, get_world_runtime, require_world_runtime

_SAFE_KEY_RE = re.compile(r"[^A-Za-z0-9_.:-]+")


def world_cache_scope_token(
    *, runtime: WorldRuntime | None = None
) -> tuple[int, int] | None:
    """Return the active release identity for process-local cache partitioning.

    ``None`` denotes the legacy/global compatibility scope.  World-owned call
    sites should normally execute under an explicit WorldRuntime.
    """
    rt = runtime or get_world_runtime()
    if rt is None:
        return None
    return (rt.world_id, rt.release_id)



def require_world_cache_scope_token(
    *, runtime: WorldRuntime | None = None
) -> tuple[int, int]:
    """Return a deterministic partition for cached World-derived values.

    Active Worlds always use their exact ``(world_id, release_id)``.  The
    ``(0, 0)`` partition is retained only for the repository's explicit legacy
    EkoH/Smart Vote compatibility scope; it is never shared with a World.
    """
    rt = runtime or get_world_runtime()
    if rt is None:
        return (0, 0)
    return (rt.world_id, rt.release_id)

def _clean_key_part(value: str, fallback: str) -> str:
    cleaned = _SAFE_KEY_RE.sub("_", str(value).strip()).strip("_:.")
    return cleaned or fallback


def world_cache_key(
    key: str,
    *,
    domain: str = "core",
    runtime: WorldRuntime | None = None,
) -> str:
    """Return a release-pinned cache key; never silently falls back global."""
    rt = runtime or require_world_runtime()
    clean_domain = _clean_key_part(domain, "core")
    clean_key = _clean_key_part(key, "key")
    return f"kx:w:{rt.world_id}:r:{rt.release_id}:{clean_domain}:{clean_key}"


def world_channel_name(
    name: str,
    *,
    runtime: WorldRuntime | None = None,
) -> str:
    """Return a release-pinned channel/group namespace."""
    rt = runtime or require_world_runtime()
    clean = _clean_key_part(name, "channel")
    return f"w{rt.world_id}.r{rt.release_id}.{clean}"
