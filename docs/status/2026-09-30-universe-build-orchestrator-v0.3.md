# Universe build orchestrator v0.3 — 2026-09-30

Status: implemented in Konnaxion_Worlds source snapshot.

## Problems fixed

- Re-applying a Universe Pack with existing `WorldRelation` / `WorldSubscription` rows could fail model uniqueness validation before `update_or_create` had a chance to reuse the row.
- `worlds_apply_universe` repeatedly rediscovered and hashed the full Seed Pack catalog while building multiple Worlds.
- Queue workers resolved one job by rediscovering the full Seed Pack catalog again.
- Synchronous Universe applies emitted no useful progress until the final JSON report.
- Existing `WorldBuildJob` progress was limited to coarse release states.

## Runtime changes

- Topology reconciliation is idempotent: upsert first, then validate the persisted row inside the final transaction.
- `SeedPackCatalog` performs one explicit discovery/hash pass and is reused by a bulk Universe operation.
- Queued workers load/hash only the exact registered Seed Pack for their job and fail closed if its checksum drifted after queueing.
- `build_world_release` persists `metadata_json.progress` stages and callbacks:
  - `preparing`
  - `creating_schemas`
  - `migrating_domain`
  - `migrating_auxiliary`
  - `loading_fixtures`
  - `importing`
  - `validating`
  - `ready` / `failed`
- `WorldBuildJob.metadata_json.progress` mirrors release progress and `updated_at` acts as the persisted heartbeat.

## Universe orchestration

Recommended multi-World command:

```text
python manage.py worlds_apply_universe <universe> --pack-version <version> --queue --wait --promote
```

It reuses exact CURRENT/READY releases and active exact jobs, queues only missing builds with `promote_after_build=false`, waits for all exact targets, then performs the final promotion/visibility/topology transaction atomically.

Monitor separately with:

```text
python manage.py worlds_jobs --universe <universe> --watch
```

Controlled parallelism still uses the existing PostgreSQL advisory-lock slot pool:

```text
KONNAXION_WORLD_BUILD_CONCURRENCY=2
```

No new database migration is required; fine-grained progress uses the existing JSON metadata fields.

## Local brokerless mode

For the Windows/local workflow, the orchestrator also supports:

```text
python manage.py worlds_apply_universe levis --pack-version 0.5.0 --local-workers 2 --promote
```

This creates normal persisted jobs but runs them in isolated child Django processes rather than requiring a Celery broker. The desktop World Manager uses this mode by default with a configurable worker count.
