# Migration and Implementation Plan

This plan originated from the observed 2026-09-06 Konnaxion snapshot. As of the 2026-09-08 review, major phases are implemented/anchored in source, but the sequence remains useful as a migration/cutover checklist. Production PostgreSQL integration, lifecycle-job hardening and the ~120-World acceptance campaign remain open gates.

## Phase 0 — Documentation lock

Before code:
- add this documentation pack;
- add `AI_LOCK.yaml`;
- add `WORLD_SYSTEM_AI.instructions.md`;
- register ADRs;
- mark target as not yet implemented.

Exit criterion:
- implementation agents can distinguish current state from target state.

## Phase 1 — Control-plane app

Create:

```text
konnaxion.worlds
```

Implement:
- World;
- WorldRelease;
- SeedPackRecord;
- WorldMembership;
- WorldPersona;
- WorldAuditEvent.

No data switching yet.

## Phase 2 — World context

Implement:
- `WorldRuntime`;
- resolver;
- `contextvars`;
- route parsing;
- response headers;
- missing-context errors.

Initially World scope may still point to existing schemas only in test mode.

## Phase 3 — Generalize DB scope

Refactor current:

```text
konnaxion.ekoh.db
```

from fixed:

```text
ekoh_smartvote, public
```

toward a World-aware scope.

Do not break existing EkoH semantics.

Add:
- safe schema quoting;
- nested-scope guard;
- schema canary checks.

## Phase 4 — Provisioner

Implement Release schema creation and scoped migrations.

Create first test pair:

```text
kx_w_test_a_r1
kx_e_test_a_r1
```

and second pair.

Run two-World integration tests.

## Phase 5 — Legacy/default migration

Create a logical World representing existing local/demo content.

Backup first.

Copy current World-owned content into new schemas.

Important:
- leave real auth/control tables global;
- retain or namespace persona bridge users;
- load EkoH taxonomy into each EkoH schema.

Do not enable multi-World production mode while World-owned fallback tables remain in `public`.

## Phase 6 — Importer upgrade

Existing importer becomes Release-aware.

Changes:
- require WorldRelease build context;
- connect `DemoScenarioImport` to Release;
- generate namespaced persona usernames;
- resolve objects by source provenance within Release, not display text;
- preserve current source-vs-reading contract.

Replace unsafe cross-World natural-key assumptions.

## Phase 7 — World-scoped runtime APIs

Move/adapt World-owned endpoints under:

```text
/api/w/{world_key}/...
```

Legacy unscoped endpoints:
- may redirect or proxy only under explicit compatibility mode;
- must not silently choose a World in production multi-World mode.

## Phase 8 — Infrastructure scoping

Implement:
- cache prefixes;
- `WorldTask`;
- search namespace;
- embedding namespace;
- WebSocket scope;
- media paths;
- analytics fields.

This phase is required before claiming full isolation.

## Phase 9 — Frontend routes/toggle

Introduce:

```text
/w/[world]/...
```

Add World switcher.

v1 switch uses hard navigation.

Add stale-response guard.

## Phase 10 — World Manager

Refactor `Konnaxion_Ethikos_Seed_Manager.pyw` into World Manager:
- Seed Library;
- World list;
- Build Release;
- Preview;
- Promote;
- Snapshot;
- Clone;
- Archive;
- logs.

Retain canonical importer calls through service boundaries.

## Phase 11 — Releases and snapshots

Implement:
- build new Release without touching current;
- validation;
- promotion;
- dirty marker;
- schema snapshot/restore;
- rollback via new Release.

## Phase 12 — Cutover hardening

Before multi-World feature flag:
- remove/move legacy World tables from public control schema;
- run schema fallback detector;
- run golden two-World campaign;
- run Smart Vote/EkoH isolation;
- run cache/task/search/WebSocket isolation.

## Phase 13 — Optional actor abstraction

Only if justified later.

Potential target:

```text
WorldActor
```

instead of using Django `User` as every civic actor.

This is **not required for Worlds v1** and must not be smuggled into the initial implementation without an ADR.
