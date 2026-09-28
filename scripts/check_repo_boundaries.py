#!/usr/bin/env python3
"""Fail when Konnaxion_Worlds regains product-owned or host-owned surfaces."""
from __future__ import annotations

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
ENGINE_NAMESPACE = ROOT / "backend" / "konnaxion"
ENGINE_ALLOWED_CHILDREN = {"worlds"}
GENERATED_NAMESPACE_CHILDREN = {"__pycache__"}

FORBIDDEN = (
    ROOT / "frontend",
    ROOT / "backend" / "konnaxion" / "integrations" / "interaction_kernel",
    ROOT / "backend" / "konnaxion" / "ethikos" / "tasks.py",
    ROOT / "backend" / "konnaxion" / "ethikos" / "ik_bridge_views.py",
    ROOT / "backend" / "konnaxion" / "ethikos" / "ik_bridge_urls.py",
)


def _namespace_violations() -> list[Path]:
    if not ENGINE_NAMESPACE.is_dir():
        return []
    allowed = ENGINE_ALLOWED_CHILDREN | GENERATED_NAMESPACE_CHILDREN
    return [child for child in ENGINE_NAMESPACE.iterdir() if child.name not in allowed]


def main() -> int:
    violations = [path for path in FORBIDDEN if path.exists()]
    violations.extend(_namespace_violations())

    if violations:
        print("Konnaxion_Worlds repository boundary: FAIL", file=sys.stderr)
        for path in violations:
            try:
                relative = path.relative_to(ROOT)
            except ValueError:
                relative = path
            print(f"  forbidden host/product surface: {relative}", file=sys.stderr)
        print(
            "  backend/konnaxion may contain only the canonical worlds package "
            "(plus generated __pycache__).",
            file=sys.stderr,
        )
        return 1

    print("Konnaxion_Worlds repository boundary: PASS")
    print("  engine/spec/control-plane ownership retained")
    print("  product browser shell remains Konnaxion-owned")
    print("  backend/konnaxion contains only worlds")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
