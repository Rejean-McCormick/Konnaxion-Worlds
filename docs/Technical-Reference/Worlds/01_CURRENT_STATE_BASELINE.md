# Current State Baseline — 2026-09-08 Snapshot

This document records the **observed implementation state** in the repository snapshot reviewed on 2026-09-08. It distinguishes implemented anchors from production validation still required.

## 1. Implemented World control plane

Current package:

```text
backend/konnaxion/worlds/
```

Observed implementation includes:
- `World` and `WorldRelease` registry models;
- `SeedPackRecord`;
- World membership/permissions;
- World persona/bridge support;
- snapshots and audit records;
- migrations and model constraints, including one current Release per World.

This means Worlds are no longer documentation-only target objects in this snapshot.

## 2. Implemented request/runtime scope

Observed files include:

```text
backend/konnaxion/worlds/runtime.py
backend/konnaxion/worlds/resolver.py
backend/konnaxion/worlds/db.py
backend/konnaxion/worlds/middleware.py
```

Observed behavior includes:
- immutable `WorldRuntime` request/task context;
- `ContextVar` storage instead of a process-global active World;
- route-based World resolution;
- permission/visibility checks;
- exact current-Release pinning;
- fail-closed behavior for missing, archived, unauthorized, release-less or invalid-current Worlds;
- transaction-local PostgreSQL `search_path` using registered schema names;
- schema-name validation/quoting;
- nested-scope conflict protection;
- World/Release response metadata for stale-response protection.

## 3. Implemented schema/release lifecycle anchors

Observed services include:

```text
backend/konnaxion/worlds/services/builder.py
backend/konnaxion/worlds/services/schema.py
backend/konnaxion/worlds/services/snapshots.py
backend/konnaxion/worlds/services/seed_packs.py
```

Observed capabilities include:
- Release record creation;
- domain + EkoH schema provisioning;
- scoped migrations;
- schema canaries/validation;
- Seed Pack loading/build flow;
- promotion with transactional locking;
- previous-current freezing;
- snapshot/restore/clone-oriented lifecycle paths.

`promote_release()` rechecks the target under control-plane locks and changes the World current-release pointer atomically.

## 4. Implemented infrastructure scoping anchors

Observed service helpers include:

```text
services/cache.py
services/tasks.py
services/search.py
services/media.py
services/health.py
```

These provide World/Release-aware primitives for cache keys, task context, search namespaces, media paths and health checks.

These anchors do not by themselves prove that every legacy/current Konnaxion call site is fully migrated. Production validation must still prove there is no unscoped bypass.

## 5. Implemented frontend World switching

Observed frontend files include:

```text
frontend/components/worlds/WorldSwitcher.tsx
frontend/components/worlds/WorldViewAsSwitcher.tsx
frontend/lib/worlds.ts
```

Observed behavior includes:
- fetching visible Worlds from the control plane;
- extracting the selected World from `/w/{world_key}/...`;
- hard navigation when switching Worlds;
- API-path World scoping in browser clients;
- rejection of stale responses from another World/Release;
- separation of World selection from `View As` persona selection.

The current simple selector is functionally appropriate for small lists but needs search/filter/recent-world UX for the intended ~120-World catalog.

## 6. Implemented control-plane API/CLI anchors

Observed control-plane API and management commands support operations such as:
- list/create Worlds;
- build Releases;
- promote Releases;
- inspect health;
- snapshot-related operations.

Important current limitation for the 120-World production target:

**The HTTP build endpoint currently invokes Release build work directly from the request path.**

The v1.1 production target therefore requires lifecycle build/provision/import work to move behind a controlled queued/asynchronous job boundary or equivalent execution model before bulk 120-World preparation is considered production-ready.

## 7. Existing importer and provenance compatibility

The existing ethiKos demo importer/provenance system remains relevant:
- `DemoScenarioImport` tracks imported objects/source provenance;
- Seed Pack/scenario import semantics preserve source-vs-reading distinctions;
- persona/user bridging must remain namespaced to prevent cross-World natural-key collisions.

Worlds extends these existing domain mechanisms rather than replacing ethiKos/EkoH/Smart Vote ownership.

## 8. Observed tests and validation status

The snapshot contains:
- World primitive/context tests;
- Seed Pack tests;
- PostgreSQL multi-World isolation tests, including deliberately colliding identities/data;
- switch-back isolation assertions (`A -> B -> A`).

The architecture remains **implemented pending runtime/production validation** because repository presence and unit/integration code are not equivalent to proving the deployed server configuration.

## 9. Production gates still open

Before claiming the intended server deployment is ready for ~120 Worlds, validate on the actual PostgreSQL/Django production topology:

- [ ] World migrations applied correctly in the production database.
- [ ] no World-owned fallback tables can silently resolve from control/public schema.
- [ ] current Release schema canaries pass for every production World.
- [ ] EkoH/Smart Vote isolation passes under real runtime requests.
- [ ] cache/task/search/WebSocket/media scoping has no legacy bypass.
- [ ] lifecycle builds are isolated from interactive World switching and resource-limited.
- [ ] lightweight liveness/readiness does not perform exhaustive all-World validation.
- [ ] ~120 registered World scale campaign passes.
- [ ] concurrent clients can remain in different Worlds.
- [ ] production route sequence `A -> B -> C -> A` preserves A state exactly.
- [ ] Release/snapshot retention and backup capacity are defined for the server.

## 10. Current-to-target conclusion

The repository has moved from a seed-centric prototype toward the locked multi-World architecture. The remaining work is primarily **production integration, scale hardening and operational proof**, not a redesign of the isolation model.

Do not replace the current design with repository/container-per-World deployment. The target remains one logical Konnaxion deployment with request-scoped switching and isolated WorldRelease schema pairs.
