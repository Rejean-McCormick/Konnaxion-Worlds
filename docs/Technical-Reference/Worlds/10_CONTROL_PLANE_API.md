# Control Plane and Runtime API

## 1. Separation

Two API families:

```text
CONTROL PLANE
/api/control/worlds/...

WORLD RUNTIME
/api/w/{world_key}/...
```

Control endpoints manage Worlds. Runtime endpoints manipulate civic content inside a selected World.

## 2. World list

```http
GET /api/control/worlds/
```

Returns only Worlds visible/manageable to the principal.

Suggested response:

```json
[
  {
    "key": "cuny-political-philosophy",
    "title": "CUNY Political Philosophy",
    "status": "active",
    "current_release": 12,
    "can_manage": true
  }
]
```

## 3. Create World

```http
POST /api/control/worlds/
```

Creates logical registry entry only.

It does not necessarily build a Release unless explicitly requested.

## 4. Build Release

```http
POST /api/control/worlds/{world_key}/releases/build/
```

Input:

```json
{
  "seed_pack_key": "cuny-political-philosophy",
  "seed_version": "1.3.0"
}
```

Returns build ID / Release ID.

Build should execute as a controlled job and store logs.

## 5. Promote Release

```http
POST /api/control/worlds/{world_key}/releases/{release_id}/promote/
```

Admin mutation.

Requires:
- ready Release;
- matching World;
- validation pass;
- audit event.

## 6. Snapshot

```http
POST /api/control/worlds/{world_key}/snapshots/
```

Input:

```json
{
  "label": "before-georgetown-demo"
}
```

## 7. Restore Snapshot

```http
POST /api/control/worlds/{world_key}/snapshots/{snapshot_id}/restore/
```

Restores into a new Release.

Do not overwrite current schemas.

## 8. Clone

```http
POST /api/control/worlds/{world_key}/clone/
```

Input includes target key and source snapshot/release policy.

## 9. Archive

```http
POST /api/control/worlds/{world_key}/archive/
```

World becomes unavailable for normal write routing.

## 10. Purge

Purge is separate from archive.

Requires:
- elevated permission;
- explicit target Release(s);
- retention checks;
- no current pointer;
- audit;
- destructive confirmation.

## 11. Runtime identity

```http
GET /api/w/{world_key}/runtime/
```

Suggested:

```json
{
  "world": {
    "id": 7,
    "key": "cuny-political-philosophy",
    "title": "CUNY Political Philosophy"
  },
  "release": {
    "id": 12,
    "number": 12,
    "dirty": false
  }
}
```

## 12. Existing APIs

Existing ethiKos/EkoH/Smart Vote API contracts should be adapted under World routing without changing ownership semantics.

Do not create duplicate "World versions" of source models.

## 13. Idempotency

Control-plane destructive/build operations should accept an idempotency key or otherwise prevent accidental double-triggering from repeated UI clicks.

## 14. Errors

Useful explicit codes:

```text
WORLD_NOT_FOUND
WORLD_ACCESS_DENIED
WORLD_CONTEXT_REQUIRED
WORLD_RELEASE_NOT_READY
WORLD_RELEASE_MISMATCH
WORLD_SCHEMA_MISSING
WORLD_SCHEMA_CANARY_MISMATCH
WORLD_BUILD_FAILED
WORLD_SNAPSHOT_FAILED
```
