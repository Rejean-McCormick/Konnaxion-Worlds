from __future__ import annotations

from pathlib import PurePosixPath

from ..runtime import WorldRuntime, require_world_runtime


def world_media_path(filename: str, *, category: str = "files", runtime: WorldRuntime | None = None) -> str:
    """Build an isolated storage key for World-owned files."""
    rt = runtime or require_world_runtime()
    safe_name = PurePosixPath(str(filename)).name or "file"
    safe_category = PurePosixPath(str(category)).name or "files"
    return f"worlds/{rt.world_id}/releases/{rt.release_id}/{safe_category}/{safe_name}"
