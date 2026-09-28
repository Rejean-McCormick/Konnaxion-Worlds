from __future__ import annotations

from pathlib import Path, PurePosixPath

from django.conf import settings

from ..runtime import WorldRuntime, require_world_runtime


def _safe_relative_parts(value: str, *, fallback: str) -> tuple[str, ...]:
    raw = str(value or "").replace("\\", "/").strip("/")
    if not raw:
        return (fallback,)
    path = PurePosixPath(raw)
    parts = tuple(part for part in path.parts if part not in ("", "."))
    if not parts or any(part == ".." for part in parts):
        raise ValueError(f"Unsafe World media path component: {value!r}")
    return parts


def world_media_prefix(
    *,
    category: str = "files",
    runtime: WorldRuntime | None = None,
) -> str:
    rt = runtime or require_world_runtime()
    category_parts = _safe_relative_parts(category, fallback="files")
    return "/".join(
        (
            "worlds",
            str(rt.world_id),
            "releases",
            str(rt.release_id),
            *category_parts,
        )
    )


def world_media_path(
    filename: str,
    *,
    category: str = "files",
    runtime: WorldRuntime | None = None,
) -> str:
    """Build an isolated storage key for World-owned files."""
    prefix = world_media_prefix(category=category, runtime=runtime)
    safe_name = PurePosixPath(str(filename).replace("\\", "/")).name or "file"
    return f"{prefix}/{safe_name}"


def world_media_fs_directory(
    *,
    category: str = "files",
    runtime: WorldRuntime | None = None,
) -> Path:
    """Filesystem directory matching the canonical World media namespace."""
    relative = world_media_prefix(category=category, runtime=runtime)
    root = Path(getattr(settings, "MEDIA_ROOT", "."))
    return root / Path(*PurePosixPath(relative).parts)
