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

At ~120 Worlds the endpoint MAY still return a compact list in one response, but the API SHOULD support filtering/search without requiring full Release history. Recommended query capabilities include:

```text
?q=hydro
&status=active
&visibility=public
&has_current_release=true
```

If response size or membership counts grow beyond this target, cursor/page pagination MAY be introduced without changing World identity or routing semantics.

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

Returns **HTTP 202** with a persistent `WorldBuildJob`. The `release_id` is null while the job is still queued and appears as soon as the worker creates the Release.

Example:

```json
{
  "id": 412,
  "world_id": 18,
  "release_id": null,
  "seed_pack_key": "cuny-political-philosophy",
  "seed_version": "1.3.0",
  "status": "queued",
  "queue_name": "world-build"
}
```

Poll with:

```http
GET /api/control/worlds/{world_key}/build-jobs/
GET /api/control/worlds/{world_key}/build-jobs/{job_id}/
```

Production build/provision/import executes through Celery. The existing worker consumes the logical `world-build` queue; no second worker/container is required for the low-RAM baseline. PostgreSQL advisory-lock slots enforce the build concurrency limit across worker processes.

Job states:

```text
queued -> building -> validating -> ready | failed
```

Default:

```text
KONNAXION_WORLD_BUILD_CONCURRENCY=1
```

Raising that setting later permits controlled parallel builds (up to the configured worker capacity). Bulk creation of many Worlds remains queue/concurrency limited.

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

## Ecosystem boundary note

Every API in this document is a **Konnaxion Worlds local control/runtime API**. It is not an Interaction Kernel API. If a future operation crosses into Orgo, Kristal, SemantiK Architect or kOA-Linux, the cross-system handoff must occur through that system's explicit integration contract/Profile rather than by reusing Worlds control-plane endpoints as an ecosystem bus.

UI/API labels SHOULD use **Promote Release**, not `Activate`, for changing `World.current_release`.
