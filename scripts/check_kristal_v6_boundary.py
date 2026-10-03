#!/usr/bin/env python3
"""Static Kristal v6 / Konnaxion Worlds boundary conformance check."""
from __future__ import annotations
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
W = ROOT / "docs" / "Technical-Reference" / "Worlds"

def fail(msg: str) -> None:
    print(f"Kristal v6 boundary: FAIL: {msg}", file=sys.stderr)
    raise SystemExit(1)

def main() -> int:
    contract_path = W / "KRISTAL_V6_BOUNDARY.json"
    try:
        c = json.loads(contract_path.read_text(encoding="utf-8"))
    except Exception as exc:
        fail(f"cannot parse {contract_path}: {exc}")
    expected = {
        "contract_id": "konnaxion.worlds.kristal-v6-boundary",
        "contract_version": "1.0.0",
        "kristal_standard": "6.0.0",
        "architecture_lock": "KX-UNIVERSES-1",
    }
    for key, value in expected.items():
        if c.get(key) != value:
            fail(f"{key} must be {value!r}")
    a = c.get("actionability") or {}
    if a.get("classification_is_execution_authority") is not False:
        fail("actionability classification must not be execution authority")
    if a.get("automatic_requires_owner_admission") is not True:
        fail("automatic must require owner admission")
    if a.get("cross_system_mutation_requires_explicit_profile") is not True:
        fail("cross-system mutation must require explicit profile")
    p = c.get("projection_rules") or {}
    if p.get("preserve_universe_world_release_provenance") is not True:
        fail("World projections must preserve Universe/World/Release provenance")
    if p.get("display_name_is_persistent_identity") is not False:
        fail("display name cannot be persistent identity")
    t = c.get("terminology") or {}
    if t.get("konnaxion_runtime_scope_is_kristal_applicability") is not False:
        fail("Konnaxion runtime scope must remain distinct from Kristal applicability")
    required_text = {
        W / "22_KRISTAL_V6_BOUNDARY.md": ["actionability.mode = automatic", "execution authority", "Universe / World / Release"],
        W / "AI_LOCK.yaml": ["WLD-046", "WLD-047", "kristal_portable_state_compatibility: 6.0.0"],
        ROOT / "README.md": ["Kristal v6 ecosystem boundary", "Kristal Standard 6.0.0"],
    }
    for path, needles in required_text.items():
        text = path.read_text(encoding="utf-8")
        for needle in needles:
            if needle not in text:
                fail(f"{path.relative_to(ROOT)} missing {needle!r}")
    print("Kristal v6 boundary: PASS")
    print("  Kristal Standard 6.0.0 retained as portable-state compatibility foundation")
    print("  actionability kept separate from execution authority")
    print("  Universe/World/Release provenance required for projections")
    print("  Konnaxion runtime scope kept distinct from Kristal applicability")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
