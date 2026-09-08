# Konnaxion Worlds — Implementation Package

Architecture lock: `KX-WORLDS-1`  
Documentation: `v1.1.0`  
Production catalog target: approximately **120 registered switchable Worlds** in one logical deployment.

## Implemented

- `World`, `WorldRelease`, `SeedPackRecord`, memberships, personas/bridges, snapshots and audit models.
- Per-release PostgreSQL domain/EkoH schemas and transaction-local `search_path` routing.
- Explicit World routing (`/w/{world}` and `/api/w/{world}/...`) with fail-closed runtime context.
- World-aware Ethikos seed import and release-unique bridge identities.
- World-scoped EkoH and Smart Vote runtime, caches and background task pinning.
- Non-destructive release build, promotion, rollback-via-clone, snapshots, clone/fork and purge safeguards.
- World-aware search/API/frontend switcher and stale-response protection.
- World Manager desktop utility.
- Collision fixtures and Alpha → Beta → Alpha PostgreSQL isolation acceptance test.
- Canonical Worlds documentation and AI anti-drift lock.

## v1.1 production-scale additions

### Persistent asynchronous builds

`WorldBuildJob` records the lifecycle independently from `WorldRelease`:

```text
queued -> building -> validating -> ready | failed
```

`POST /api/control/worlds/{world_key}/releases/build/` now returns HTTP `202` and queues the heavy work through Celery. Polling endpoints:

```text
GET /api/control/worlds/{world_key}/build-jobs/
GET /api/control/worlds/{world_key}/build-jobs/{job_id}/
```

The desktop `Konnaxion_World_Manager.pyw` uses the same queue and no longer executes Seed Pack builds directly.

### Low-RAM build serialization

Default:

```text
KONNAXION_WORLD_BUILD_CONCURRENCY=1
```

The normal Celery worker consumes both `celery` and `world-build`; no second worker/container is added. PostgreSQL advisory locks provide:

- one per-job lock to reject duplicate/redelivered execution;
- a configurable global build-slot pool;
- one expensive build at a time by default;
- optional controlled parallelism later by raising the setting.

Worker prefetch is set to `1` to avoid reserving many queued build jobs in memory.

### Catalog preparation

A single-World CLI build also queues by default:

```bash
python manage.py worlds_build <world_key> <seed_pack_key> --promote
```

Use `--sync` only for explicit maintenance/debug when an inline build is intentionally required.

Queue an entire Seed Pack catalog:

```bash
python manage.py worlds_queue_catalog --create-missing --promote
```

Useful options:

```text
--world <key>   limit to selected Worlds; repeatable
--force         rebuild even if current checksum already matches
--public        make newly-created Worlds public
```

Queuing many Worlds does not make them build simultaneously. Execution still obeys `KONNAXION_WORLD_BUILD_CONCURRENCY`.

### Health split

Normal monitoring no longer performs deep validation of all current Releases:

```text
GET /api/control/health/live/      constant-cost process liveness
GET /api/control/health/ready/     PostgreSQL + cache/Redis readiness
GET /api/control/health/registry/  cheap staff-only catalog state
GET /api/control/health/deep/      staff-only all-current-Release validation
```

The previous `/api/control/health/` remains as a backward-compatible deep-health alias.

### ~120-World selector

The frontend selector now supports type-ahead search by title/key and remembers recent Worlds locally while retaining hard navigation across the World boundary.

The control-plane World list also accepts:

```text
?q=<title-or-key>
&status=<active|maintenance|archived>
```

(Archived Worlds remain excluded from ordinary selectable visibility by the existing control-plane rules.)

## Validation in this artifact environment

Completed:

```text
Python compileall: PASS
Static presence/integration checks: PASS
```

Full Django/Celery/PostgreSQL tests could not run in this artifact environment because its Python environment does not contain Django (`ModuleNotFoundError: django`). The CI workflow has been updated to execute the new build-job/catalog/health tests after dependencies are installed.

Before server rollout, run:

```bash
python manage.py check
python manage.py migrate --noinput
pytest konnaxion/worlds/tests -q
```

and then the production PostgreSQL isolation/120-World acceptance campaign.
