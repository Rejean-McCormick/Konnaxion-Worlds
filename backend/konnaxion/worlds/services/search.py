from __future__ import annotations

from ..runtime import WorldRuntime, require_world_runtime


def world_search_metadata(*, runtime: WorldRuntime | None = None) -> dict[str, int]:
    rt = runtime or require_world_runtime()
    return {"world_id": rt.world_id, "release_id": rt.release_id}


def enforce_world_search_filter(filters: dict | None = None, *, runtime: WorldRuntime | None = None) -> dict:
    """Attach the mandatory World/Release filter for external indexes."""
    rt = runtime or require_world_runtime()
    out = dict(filters or {})
    for key, expected in (("world_id", rt.world_id), ("release_id", rt.release_id)):
        if key in out and int(out[key]) != expected:
            raise ValueError(f"Cross-World search filter rejected: {key}={out[key]!r}")
        out[key] = expected
    return out
