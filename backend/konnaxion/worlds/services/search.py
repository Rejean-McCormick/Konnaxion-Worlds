from __future__ import annotations

from typing import Any

from ..runtime import WorldRuntime, require_world_runtime


def world_search_metadata(*, runtime: WorldRuntime | None = None) -> dict[str, int]:
    rt = runtime or require_world_runtime()
    return {"world_id": rt.world_id, "release_id": rt.release_id}


def world_search_namespace(
    *,
    domain: str = "core",
    runtime: WorldRuntime | None = None,
) -> str:
    rt = runtime or require_world_runtime()
    clean_domain = "".join(
        char if (char.isalnum() or char in "-_.") else "_" for char in str(domain)
    ).strip("-_.") or "core"
    return f"kx-w{rt.world_id}-r{rt.release_id}-{clean_domain}"


def enforce_world_search_filter(
    filters: dict | None = None,
    *,
    runtime: WorldRuntime | None = None,
) -> dict:
    """Attach the mandatory World/Release filter for external indexes."""
    rt = runtime or require_world_runtime()
    out = dict(filters or {})
    for key, expected in (("world_id", rt.world_id), ("release_id", rt.release_id)):
        if key in out and int(out[key]) != expected:
            raise ValueError(f"Cross-World search filter rejected: {key}={out[key]!r}")
        out[key] = expected
    return out


def stamp_world_search_document(
    document: dict[str, Any],
    *,
    source_type: str,
    source_id: str | int,
    runtime: WorldRuntime | None = None,
) -> dict[str, Any]:
    """Return an indexable document with mandatory World provenance."""
    rt = runtime or require_world_runtime()
    out = dict(document)
    expected = {
        "world_id": rt.world_id,
        "release_id": rt.release_id,
        "source_type": str(source_type),
        "source_id": str(source_id),
    }
    for key, value in expected.items():
        if key in out and str(out[key]) != str(value):
            raise ValueError(
                f"Cross-World search document rejected: {key}={out[key]!r}"
            )
        out[key] = value
    return out
