# Konnaxion_Worlds

Canonical owner of the Konnaxion Universe/World control plane and WorldRelease runtime-isolation engine.

The package is installable from `backend/`:

```text
pip install -e <path-to-Konnaxion_Worlds>/backend
```

The main Konnaxion repository consumes `konnaxion.worlds`; it must not carry a second copy of the engine, migrations, or canonical Universe/World specifications.

Architecture locks:

- `KX-WORLDS-1`: World/WorldRelease isolation invariants.
- `KX-UNIVERSES-1`: Universe grouping, graph relations, explicit inter-World publications, and canonical Universe-aware routing.

See `docs/Technical-Reference/Worlds/20_UNIVERSES.md` and `WORLD_SYSTEM_AI.instructions.md` before modifying the engine.

Repository boundary: this engine repository intentionally does **not** ship the Konnaxion browser shell. `WorldContext`, the Universe/World switcher, Next.js rewrites and product navigation remain Konnaxion-owned host adapters consuming this package's contracts.

## Web UI ownership

`Konnaxion_Worlds` is the canonical owner of the Universe/World engine, contracts, control plane, runtime scoping, migrations, and canonical specification. It does **not** ship a second maintained Konnaxion web frontend.

The product-host integration UI (`UniverseSwitcher`, `WorldSwitcher`, route rewrites, browser stale-response guards) is owned by the main `Konnaxion` repository and consumes this engine through its HTTP/runtime contract. This prevents a second frontend implementation from drifting beside the product shell.

Before committing boundary changes, run:

```text
python scripts/check_repo_boundaries.py
```

## Standalone routing safety

The standalone Django bootstrap uses the same fail-closed routing switch as the hosted engine:

```text
KONNAXION_WORLDS_ENFORCE_SCOPED_API=true
```

It defaults to `true`. `KONNAXION_WORLDS_STRICT_ROUTING` is not a supported setting. Health/readiness and `WorldRouteMiddleware` both read `KONNAXION_WORLDS_ENFORCE_SCOPED_API`, so keep this name aligned in host and standalone settings.

Build/snapshot metadata records `KX-UNIVERSES-1` as the current `architecture_lock`; `KX-WORLDS-1` remains the lower-level World/WorldRelease foundation lock.
