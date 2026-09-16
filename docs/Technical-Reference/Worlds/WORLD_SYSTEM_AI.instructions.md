# KONNAXION WORLDS — AI IMPLEMENTATION LOCK

Architecture lock: **KX-WORLDS-1**

Before World-related coding, read:
1. `GENERALinstructionsForAI.txt`
2. `BOUNDARIES_AND_OWNERSHIP.md`
3. `CONTRACTS.txt`
4. `Worlds/AI_LOCK.yaml`
5. `Worlds/KONNAXION_WORLDS_FULL_SPEC.md`
6. the exact current source files to modify.

Mandatory:
- World selection is route/context only; never reset/reseed on toggle.
- World context is explicit per request, not process-global/session-only.
- each WorldRelease owns isolated domain + EkoH/Smart Vote schemas.
- pin exact World + Release for request/task lifetime.
- fail closed when context is missing.
- namespace cache/tasks/search/WebSockets/media.
- global auth principal stays global; World Personas are scoped.
- EkoH and Smart Vote are World-local.
- preserve `source fact != baseline != derived reading`.
- no global per-person voting weight.
- no display title/name/raw username as cross-World identity.
- no direct cross-World ORM join.
- build new Release then promote; never destructively rebuild current.
- two-World collision tests are required.
- production target is ~120 registered Worlds in one shared logical deployment; never introduce per-World stacks.
- World switch must remain normal navigation/request routing and must never trigger build/import/reset/migration/provision/restart.
- keep lightweight server health separate from deep all-World validation.

Never assume target classes/routes already exist. Inspect code first.

If a requested implementation conflicts with `AI_LOCK.yaml`, do not silently redesign. Draft an ADR, name the invariant, and wait for the architecture decision.

ECOSYSTEM BOUNDARY GUARDS
- Worlds control plane is Konnaxion-local, never kOA-global.
- Seed Pack != Kristal Runtime Pack.
- WorldRelease != Kristal Working/Reference Exchange.
- Snapshot != Kristal Exchange.
- Promote Release != physical Runtime Pack activation.
- Do not invent IK/Orgo/Kristal adapters from target architecture text; require executable evidence.
