#!/usr/bin/env python3
"""Fail when Konnaxion_Worlds regains product-owned or host-owned surfaces."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]

FORBIDDEN = (
    "backend/konnaxion/integrations/interaction_kernel",
    "backend/konnaxion/ethikos/tasks.py",
    "backend/konnaxion/ethikos/ik_bridge_views.py",
    "backend/konnaxion/ethikos/ik_bridge_urls.py",
    # Konnaxion owns the browser shell. Reusable UI requires a separately
    # versioned frontend SDK + ADR, not a copied product implementation.
    "frontend/components/worlds/WorldSwitcher.tsx",
    "frontend/components/worlds/WorldViewAsSwitcher.tsx",
    "frontend/lib/worlds.ts",
)

violations = [rel for rel in FORBIDDEN if (ROOT / rel).exists()]
if violations:
    print("Konnaxion_Worlds repository boundary: FAIL", file=sys.stderr)
    for rel in violations:
        print(f"  forbidden host/product surface: {rel}", file=sys.stderr)
    sys.exit(1)

print("Konnaxion_Worlds repository boundary: PASS")
print("  engine/spec/control-plane ownership retained")
print("  product browser shell remains Konnaxion-owned")
