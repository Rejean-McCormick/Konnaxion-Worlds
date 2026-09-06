from __future__ import annotations

import hashlib
import re

_SCHEMA_TOKEN_RE = re.compile(r"[^a-z0-9]+")


def safe_world_token(world_key: str, *, max_length: int = 32) -> str:
    base = _SCHEMA_TOKEN_RE.sub("_", world_key.lower()).strip("_") or "world"
    digest = hashlib.sha256(world_key.encode("utf-8")).hexdigest()[:8]
    room = max_length - len(digest) - 1
    return f"{base[:room]}_{digest}"


def release_schema_names(world_key: str, release_number: int) -> tuple[str, str]:
    token = safe_world_token(world_key)
    return (
        f"kx_w_{token}_r{release_number}",
        f"kx_e_{token}_r{release_number}",
    )
