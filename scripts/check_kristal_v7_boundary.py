#!/usr/bin/env python3
"""Static Kristal v7 / Konnaxion Worlds boundary conformance check."""
from __future__ import annotations
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
W = ROOT / "docs" / "Technical-Reference" / "Worlds"


def fail(msg: str) -> None:
    print(f"Kristal v7 boundary: FAIL: {msg}", file=sys.stderr)
    raise SystemExit(1)


def main() -> int:
    contract_path = W / "KRISTAL_V7_BOUNDARY.json"
    try:
        c = json.loads(contract_path.read_text(encoding="utf-8"))
    except Exception as exc:
        fail(f"cannot parse {contract_path}: {exc}")

    expected = {
        "contract_id": "konnaxion.worlds.kristal-v7-boundary",
        "contract_version": "1.0.0",
        "kristal_standard": "7.0.0-draft.3.1",
        "portable_state_compatibility": "6.0.0",
        "architecture_lock": "KX-UNIVERSES-1",
    }
    for key, value in expected.items():
        if c.get(key) != value:
            fail(f"{key} must be {value!r}")

    v7 = c.get("v7_additive_rules") or {}
    required_true = (
        "v6_kristal_state_remains_valid_and_unchanged",
        "kq_kp_ka_ks_are_external_semantic_ids_to_worlds",
    )
    for key in required_true:
        if v7.get(key) is not True:
            fail(f"v7_additive_rules.{key} must be true")
    required_false = (
        "v7_replaces_v6_wire_schema",
        "external_kos_ids_replace_kq_identity",
        "semantic_resonance_establishes_identity_truth_or_authority",
        "mesh_path_is_assertion",
        "deduplication_may_delete_source_provenance",
    )
    for key in required_false:
        if v7.get(key) is not False:
            fail(f"v7_additive_rules.{key} must be false")

    p = c.get("projection_rules") or {}
    if p.get("preserve_universe_world_release_provenance") is not True:
        fail("World projections must preserve Universe/World/Release provenance")
    if p.get("release_must_be_pinned_at_projection_time") is not True:
        fail("World projection must pin the exact Release")
    if p.get("display_name_is_persistent_identity") is not False:
        fail("display name cannot be persistent identity")
    if p.get("kristall_projection_may_replace_worlds_system_of_record") is not False:
        fail("Kristall projection cannot replace Worlds system of record")

    a = c.get("actionability") or {}
    if a.get("classification_is_execution_authority") is not False:
        fail("actionability classification must not be execution authority")
    if a.get("automatic_requires_owner_admission") is not True:
        fail("automatic must require owner admission")
    if a.get("cross_system_mutation_requires_explicit_profile") is not True:
        fail("cross-system mutation must require explicit profile")

    t = c.get("terminology") or {}
    if t.get("konnaxion_runtime_scope_is_kristal_applicability") is not False:
        fail("Konnaxion runtime scope must remain distinct from Kristal applicability")
    if t.get("kristall_subject_is_konnaxion_world") is not False:
        fail("Kristall Subject cannot be equated with Konnaxion World")

    required_text = {
        W / "23_KRISTAL_V7_BOUNDARY.md": [
            "7.0.0-draft.3.1",
            "extensions.kristal_v7",
            "semantic resonance",
            "Mesh path",
            "Universe, World and exact Release",
        ],
        W / "AI_LOCK.yaml": [
            "WLD-050",
            "WLD-054",
            "kristal_standard: 7.0.0-draft.3.1",
        ],
        ROOT / "README.md": [
            "Kristal v7 additive ecosystem boundary",
            "7.0.0-draft.3.1",
        ],
    }
    for path, needles in required_text.items():
        text = path.read_text(encoding="utf-8")
        for needle in needles:
            if needle not in text:
                fail(f"{path.relative_to(ROOT)} missing {needle!r}")

    print("Kristal v7 boundary: PASS")
    print("  Kristal Standard 7.0.0-draft.3.1 pinned as additive meta layer")
    print("  v6 portable kristal_state compatibility retained unchanged")
    print("  resonance/Mesh/KQ-KP-KA-KS kept separate from Worlds authority")
    print("  Universe/World/exact Release provenance remains mandatory")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
