# Operations Runbook

## 0. Production deployment target — one stack, ~120 Worlds

Initial production objective:

```text
one server/VPS
one Konnaxion deployment
~120 registered Worlds
one shared frontend/backend/worker/cache/database stack
per-World current Release + isolated schema pair
```

This is an operational baseline, not a requirement that all services remain forever on one physical machine. If load requires it, shared services may be moved/scaled independently while preserving one logical Konnaxion deployment.

Before onboarding the full World catalog, record:
- server CPU/RAM/disk and database limits;
- expected concurrent users;
- expected data size per World;
- Release retention count;
- snapshot retention;
- Celery build/runtime concurrency;
- search/vector/media footprint.

## 1. Build a new World from Seed Pack

1. Validate Pack manifest.
2. Validate all scenario payloads.
3. Compute Pack checksum.
4. Create logical World if needed.
5. Create new Release in `building`.
6. Provision schemas.
7. Run scoped migrations.
8. Load fixtures.
9. Import scenarios.
10. Rebuild required derived indexes.
11. Run schema/integrity/two-World smoke checks.
12. Mark `ready`.
13. Operator explicitly promotes when desired.

## 2. Open / switch World

User action:

```text
select World
→ navigate to /w/{world_key}/...
→ resolve current Release
→ serve scoped data
```

No build.  
No reset.  
No import.  
No migration.  
No schema provisioning.  
No service/container restart.  
No global cache flush.

Switching A -> B affects only that user's request/navigation context. Other users may continue using A, C, or any other World concurrently.

## 3. Promote a Release

Checklist:
- Release belongs to World;
- status ready;
- validation pass;
- migration fingerprints expected;
- canaries match;
- smoke tests pass.

Action:
- atomic current-release pointer update;
- audit;
- notify clients if necessary.

## 4. Snapshot before demo

1. Identify current Release.
2. Ensure no build in progress.
3. Create snapshot label.
4. Back up both schemas.
5. Record migration/seed/media manifest.
6. Verify checksum.
7. Mark snapshot ready.

## 5. Restore after demo

1. Select snapshot.
2. Restore into **new** Release schemas.
3. Validate.
4. Promote restored Release.
5. Preserve prior dirty Release for retention/debugging.

## 6. Rebuild from updated Seed Pack

Never rebuild active schemas.

```text
r12 current
build r13
validate
promote r13
```

## 7. Failed build

- current Release stays untouched;
- failed schemas remain quarantined until inspected/purged;
- store error report;
- do not retry by mutating the current World.

## 8. World maintenance

Set World `maintenance`.

Runtime behavior:
- admins may inspect;
- writes rejected or restricted;
- build/snapshot operations allowed by policy.

## 9. Archive World

Archive:
- prevents ordinary routing;
- preserves state;
- does not purge schemas.

## 10. Purge Release

Never purge:
- current Release;
- Release referenced by required snapshot/retention;
- Release in active task execution.

Purge:
- explicit elevated permission;
- audit;
- schema deletion;
- derived cache/search/media cleanup.

## 11. Incident: suspected contamination

Immediate:
1. disable writes for affected Worlds;
2. record World/Release IDs;
3. snapshot affected releases if safe;
4. inspect logs/cache/task/search context;
5. compare schema canaries;
6. do not "fix" by reseeding over evidence.

Recovery:
- restore known-good Snapshot into new Release;
- validate;
- promote;
- file incident report and invariant breach ID.

## 12. Incident: World route missing

Do not fall back.

Return explicit error and investigate:
- frontend route construction;
- reverse proxy;
- API client;
- task/consumer context.

## 13. Incident: schema missing

Do not use public/shared table.

Mark Release unhealthy and block runtime routing.

## 14. Prepare the 120-World catalog

Do not prepare 120 Worlds by manually opening/switching each one.

Use the control plane/build job workflow:
1. discover/validate Seed Packs;
2. create missing World registry records;
3. enqueue Release builds with a configured concurrency limit;
4. monitor queued/building/validating/failed jobs;
5. promote only validated Releases;
6. run deep World health across all current Releases;
7. confirm every intended active World has exactly one valid current Release;
8. apply Release/snapshot retention policy;
9. run representative switch and concurrency acceptance tests.

Bulk preparation MUST NOT modify already-current healthy Releases unless an explicit new build/promotion is requested.

Normal single-World CLI builds are queued by default:

```bash
python manage.py worlds_build <world_key> <seed_pack_key> --promote
```

`--sync` is an explicit maintenance/debug escape hatch for an inline build.

Current implementation command for a Seed-Pack catalog:

```bash
python manage.py worlds_queue_catalog --create-missing --promote
```

The command queues all eligible builds; it does not execute them in parallel itself. The default server setting is:

```text
KONNAXION_WORLD_BUILD_CONCURRENCY=1
```

This is the preferred low-RAM baseline. Increase it only after measuring server headroom. `--world <key>` limits the queue operation to selected Worlds and `--force` intentionally rebuilds a World whose current Release already matches the Seed Pack checksum.

## 15. Health monitoring

Use lightweight probes for normal server monitoring:
- process liveness;
- PostgreSQL/Redis readiness;
- routing/config readiness.

Run expensive all-World validation separately:
- on deployment/cutover;
- after bulk build/migration operations;
- on a periodic maintenance schedule;
- on demand during incidents.

Deep health output must identify `world_key`, `release_id` and failed invariant/canary so one bad World does not hide behind an aggregate boolean.

## 16. Release retention at scale

For 120 Worlds, historical Releases multiply schema/table/storage count. Define explicit retention, for example:
- current Release: always retain;
- previous known-good Release: retain;
- Releases referenced by protected snapshots: retain;
- older unreferenced frozen/failed Releases: eligible for audited purge after retention window.

The exact numeric retention policy is deployment-specific, but an unbounded retain-every-release policy MUST NOT be assumed operationally free.

## 17. Production switch checklist

Before declaring the deployment ready:
- at least representative Worlds A/B/C are current and healthy;
- World selector can find entries in the ~120-World catalog;
- A -> B -> C -> A works through public server routes;
- A state is unchanged on return;
- a second concurrent client can remain in another World;
- no switch triggers build/import/reset/restart;
- stale-response protection is active;
- server liveness/readiness remains lightweight.

## 18. Demo checklist

Before presentation:
- World status active;
- correct current Release;
- snapshot created;
- World switcher shows expected Worlds;
- View As list correct;
- two-World isolation smoke test;
- EkoH profiles verified;
- source links accessible;
- Smart Vote readings computed only where intended.

After presentation:
- retain live state if useful, or restore snapshot into new Release.
