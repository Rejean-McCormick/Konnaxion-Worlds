# Production Scale and Server Deployment — ~120 Worlds

**Architecture lock:** `KX-WORLDS-1`  
**Documentation version:** `1.1.0`  
**Target:** approximately 120 registered, switchable Worlds in one logical Konnaxion deployment.

## 1. Objective

Konnaxion MUST be deployable as one shared application stack that hosts the complete World catalog. A user selects a World through the normal `/w/{world_key}/...` route and immediately reads/writes only that World's current Release.

The target user experience is:

```text
World A -> World B -> World C -> World A
```

with no server restart, container switch, database reseed, import or rebuild between selections.

## 2. Initial one-server baseline

The initial production deployment MAY colocate the shared services on one sufficiently sized server/VPS:

```text
reverse proxy / TLS
Next.js
Django/DRF
Celery
Redis
PostgreSQL
search/vector services when enabled
World-scoped media storage
```

The invariant is **one logical Konnaxion deployment**, not permanently one physical machine. If measured load exceeds one server, shared services may scale to additional hosts without changing World identity or isolation.

## 3. What 120 Worlds means

A registered World is a control-plane object pointing to one current `WorldRelease`.

A World does **not** require:
- its own source repository;
- its own frontend/backend containers;
- a permanently running worker;
- its own process-global active state;
- a reset/reseed when selected.

A stored `WorldRelease` owns its schema pair. Historical Releases increase database object/storage footprint even when not receiving traffic.

## 4. Runtime switch path

```text
browser selects world_key
→ /w/{world_key}/...
→ WorldResolver
→ permission/visibility check
→ pin World.current_release
→ create immutable WorldRuntime
→ SET LOCAL search_path to the registered schema pair
→ serve request
```

This operation is request-scoped. Multiple clients may simultaneously use different Worlds on the same server.

## 5. Lifecycle path is separate

World creation and Release lifecycle operations are control-plane work:

```text
Seed Pack
→ build job
→ schema provisioning
→ scoped migrations
→ import
→ derived indexes
→ validation
→ READY
→ explicit promotion
```

They MUST NOT execute merely because a user opens/switches to a World.

At large catalog size, production SHOULD queue these jobs and enforce explicit concurrency/resource limits.

The low-RAM baseline serializes expensive Release builds:

```text
Celery queue: world-build
KONNAXION_WORLD_BUILD_CONCURRENCY=1
```

The same Celery worker consumes ordinary tasks and `world-build`, so this baseline does not add a second worker process/container. A PostgreSQL advisory-lock slot enforces the limit globally. If the server is later sized for parallel preparation, the setting MAY be raised (for example 2 or 4) without changing World identity, routing or API semantics.

## 6. World selector at catalog scale

A selector for ~120 Worlds SHOULD provide:
- type-ahead search;
- recent/favorite Worlds;
- optional category/tag/status filters;
- clear current World;
- disabled/hidden treatment for archived, unauthorized or unavailable Worlds.

A hard navigation is the v1 default because it clears previous-World client state and works with stale-response protection.

## 7. Capacity planning

Measure and budget independently for:
- number of registered Worlds;
- current + retained historical Releases;
- PostgreSQL schema/table/storage footprint;
- concurrent users and requests;
- Celery runtime/build workload;
- Redis cache footprint;
- search/vector index footprint;
- media/object storage;
- snapshot/backup retention.

Do not infer capacity solely from `World count = 120`.

## 8. Health model

Ordinary monitoring is bounded:

```text
liveness  -> process responds
readiness -> core dependencies/configuration ready
```

Deep catalog validation is separate:

```text
registry health
schema canaries
migration fingerprints
isolation checks
all-current-Release validation
```

One unhealthy World must be reported by exact `world_key + release_id`; it must not require making every liveness probe scan all 120 Worlds.

## 9. Release retention

Production MUST define retention because schema count grows approximately with stored Releases, not only Worlds.

Minimum safe concept:
- current Release retained;
- previous known-good Release retained according to policy;
- protected snapshot references retained;
- old unreferenced frozen/failed Releases eligible for audited purge after retention.

## 10. Production acceptance gate

Before rollout of the intended catalog:

- [ ] ~120 Worlds registered in one logical deployment.
- [ ] intended active Worlds each have one healthy current Release.
- [ ] no World requires a dedicated app/container stack.
- [ ] World search/switcher usable at catalog scale.
- [ ] A -> B -> C -> A switch succeeds with A unchanged.
- [ ] concurrent clients remain isolated in different Worlds.
- [ ] switch triggers no build/import/reset/migration/provision/restart/global cache flush.
- [ ] stale responses from prior World/Release are rejected.
- [ ] bulk lifecycle jobs have concurrency/resource limits.
- [ ] lightweight liveness/readiness remains bounded.
- [ ] deep all-World health reports per-World/Release failures.
- [ ] backup/snapshot and Release retention policies are defined.

This gate validates operability at the catalog target. It does not replace the two-World collision/isolation campaign, which remains mandatory for correctness.
