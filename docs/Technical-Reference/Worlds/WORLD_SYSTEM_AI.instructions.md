# KONNAXION UNIVERSES / WORLDS — AI IMPLEMENTATION LOCK

Architecture locks: **KX-UNIVERSES-1** over foundation **KX-WORLDS-1**.

Before Universe/World-related coding, read:
1. `GENERALinstructionsForAI.txt` when present in the host repo
2. `BOUNDARIES_AND_OWNERSHIP.md` when present in the host repo
3. `CONTRACTS.txt` when present in the host repo
4. `Worlds/AI_LOCK.yaml`
5. `Worlds/20_UNIVERSES.md`
6. `Worlds/23_KRISTAL_V7_BOUNDARY.md`
7. `Worlds/22_KRISTAL_V6_BOUNDARY.md` (retained portable-state compatibility foundation)
8. `Worlds/KONNAXION_WORLDS_FULL_SPEC.md`
9. the exact current source files to modify.

Mandatory:
- Universe is governance/navigation/coherence, never a shared business-data schema.
- World remains the isolated data/runtime boundary; WorldRelease remains its physical/versioned schema pair.
- every World belongs to one Universe.
- Universe/World context is explicit per request; never process-global/session-only.
- canonical target route is `/u/{universe_key}/w/{world_key}`; `/w/{world_key}` is Phase-U1 compatibility only.
- World selection is route/context only; never reset/reseed/build/migrate/provision on toggle.
- pin exact World + Release for request/task lifetime.
- fail closed when context is missing or inconsistent.
- no direct cross-World ORM/SQL join, including between Worlds in the same Universe.
- WorldRelation describes topology and grants no data access.
- inter-World transfer is explicit and provenance-bearing; prefer WorldPublication/contracts.
- `parent_world` remains fork/lineage, not live sub-World hierarchy.
- namespace cache/tasks/search/WebSockets/media by World/Release.
- global auth principal stays global; Universe and World memberships govern scoped access.
- EkoH and Smart Vote are World-local.
- preserve `source fact != baseline != derived reading`.
- no global per-person voting weight.
- no display title/name/raw username as cross-World identity.
- build new Release then promote; never destructively rebuild current.
- two-World collision tests are required; Universe tests must include cross-Universe rejection.
- production target remains ~120 registered Worlds in one shared logical deployment; never introduce per-World stacks.
- keep lightweight server health separate from deep all-World validation.
- canonical engine/spec owner is the `Konnaxion_Worlds` repository/package; main Konnaxion MUST NOT vendor a second backend engine or canonical spec copy.
- Kristal Standard 7.0.0-draft.3.1 is the current additive ecosystem boundary over unchanged v6 portable `kristal_state`; Worlds artifacts remain distinct from both Kristal and Kristall artifacts.
- Kristal `actionability.mode = automatic` is never sufficient authority to mutate Konnaxion Worlds state.
- preserve stable Universe/World/Release provenance in any Kristal projection.
- do not rename Konnaxion database/runtime `scope` primitives to `applicability`; they are not the same concept.

Never assume target classes/routes already exist. Inspect code first.

If a requested implementation conflicts with `AI_LOCK.yaml` or `20_UNIVERSES.md`, do not silently redesign. Draft an ADR and name the invariant.


## Frontend ownership lock

- Konnaxion_Worlds MUST NOT grow a duplicate product web frontend while main Konnaxion is the host.
- The main Konnaxion repo MAY own Universe/World switchers and host route adapters, but MUST consume engine contracts rather than reimplement backend World/Universe authority.
- A reusable frontend SDK requires a separate package + ADR; do not copy files between repos.
