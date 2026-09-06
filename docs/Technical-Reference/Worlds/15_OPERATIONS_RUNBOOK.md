# Operations Runbook

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

## 2. Open a World

User action:

```text
select World
→ navigate to /w/{world_key}/...
```

No build.
No reset.
No import.
No cache flush.

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

## 14. Demo checklist

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
