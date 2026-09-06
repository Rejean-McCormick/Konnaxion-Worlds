#!/usr/bin/env python3
"""Pure-static KX-WORLDS-1 architecture lock checker.

This intentionally has no Django dependency so CI/review agents can run it
before installing the application stack. It does not replace integration tests.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAILURES: list[str] = []


def text(path: str) -> str:
    p = ROOT / path
    if not p.is_file():
        FAILURES.append(f"missing required file: {path}")
        return ""
    return p.read_text(encoding="utf-8", errors="replace")


def require(path: str, pattern: str, label: str, *, regex: bool = False) -> None:
    body = text(path)
    ok = bool(re.search(pattern, body, re.M | re.S)) if regex else pattern in body
    if not ok:
        FAILURES.append(f"{label}: {path}")


def forbid(path: str, pattern: str, label: str, *, regex: bool = False) -> None:
    body = text(path)
    found = bool(re.search(pattern, body, re.M | re.S)) if regex else pattern in body
    if found:
        FAILURES.append(f"forbidden {label}: {path}")


require("docs/Technical-Reference/Worlds/AI_LOCK.yaml", "id: KX-WORLDS-1", "architecture lock")
require("backend/config/urls.py", 'path("api/w/<slug:world_key>/"', "explicit World API URL")
require("backend/konnaxion/worlds/db.py", "SET LOCAL search_path", "transaction-local search_path")
require("backend/konnaxion/worlds/db.py", "validate_schema_name", "schema-name validation")
require("backend/konnaxion/worlds/runtime.py", "WorldContextRequired", "fail-closed runtime")
require("backend/konnaxion/worlds/services/cache.py", 'f"w:{rt.world_id}:r:{rt.release_id}:', "release-pinned cache keys")
require("backend/konnaxion/worlds/services/tasks.py", "world_id: int, release_id: int", "task release pinning")
require("backend/konnaxion/worlds/services/personas.py", "world_id=runtime.world_id", "World persona bridge")
require("backend/konnaxion/worlds/services/personas.py", "release_id=runtime.release_id", "release persona bridge")
require("frontend/lib/worlds.ts", "assertCurrentWorldResponse", "frontend stale response guard")
require("frontend/components/worlds/WorldSwitcher.tsx", "switchWorldPath", "World selector is navigation")
require("backend/config/settings/production.py", "default=True", "production strict routing")
require("backend/konnaxion/worlds/models.py", 'condition=models.Q(status="current")', "one current release constraint")
require("backend/konnaxion/worlds/services/schema.py", "expected_migration_fingerprint", "schema drift detection")
require("backend/konnaxion/worlds/services/builder.py", "select_for_update", "serialized release mutation")

# World selection must never invoke destructive lifecycle endpoints/services.
switcher = text("frontend/components/worlds/WorldSwitcher.tsx").lower()
for token in ("/reset", "/build", "/promote", "resetscenario", "buildrelease", "importscenario", "rebuildworld"):
    if token in switcher:
        FAILURES.append(f"WorldSwitcher contains destructive lifecycle operation: {token}")

# Requirements corruption guard encountered during implementation.
forbid("backend/requirements/base.txt", "drf-spectacular==0.28.0PyYAML", "concatenated requirements")
require("backend/requirements/base.txt", "PyYAML==", "PyYAML dependency")

# World-owned migrations must not hardcode the legacy EkoH schema.
world_apps = ("ethikos", "keenkonnect", "konnected", "kreative", "kollective_intelligence", "teambuilder", "moderation", "trust")
for app in world_apps:
    mig_dir = ROOT / "backend" / "konnaxion" / app / "migrations"
    if not mig_dir.exists():
        continue
    for file in mig_dir.glob("*.py"):
        if "ekoh_smartvote" in file.read_text(encoding="utf-8", errors="replace"):
            FAILURES.append(f"domain migration hardcodes ekoh_smartvote: {file.relative_to(ROOT)}")

if FAILURES:
    print("KX-WORLDS-1 architecture check FAILED")
    for failure in FAILURES:
        print(f" - {failure}")
    sys.exit(1)

print("KX-WORLDS-1 architecture check PASSED")
