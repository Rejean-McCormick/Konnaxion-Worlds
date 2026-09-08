# Infrastructure Scoping

Database isolation alone is insufficient. World contamination can occur through caches, jobs, search indexes, WebSockets, media and analytics.

## 1. Redis/cache

Required key prefix:

```text
kx:w:{world_id}:r:{release_id}:{domain}:{key}
```

Examples:

```text
kx:w:7:r:12:ekoh:user:44
kx:w:7:r:12:ethikos:topic:183
kx:w:8:r:5:ethikos:topic:183
```

Forbidden:

```text
ethikos:topic:183
ekoh:user:44
```

unless the cached value is proven global and documented.

Cache clearing should be scoped to World/Release.

Do not globally flush Redis during a World switch.

## 2. Celery

Every task touching World-owned state must include:

```text
world_id
release_id
```

Prefer a common base:

```python
class WorldTask(Task):
    ...
```

Task execution:
1. resolve exact Release;
2. reject invalid/purged Release;
3. enter `world_db_scope`;
4. execute;
5. log World/Release.

Forbidden:

```python
recalc_scores.delay(user_id)
```

Required shape:

```python
recalc_scores.delay(
    world_id=7,
    release_id=12,
    user_id=44,
)
```

Do not replace release ID with "whatever is current when the worker starts"; that breaks reproducibility.

## 3. Celery Beat

Periodic tasks need explicit targeting policy:
- global task enumerates eligible Worlds and enqueues per-Release work; or
- one task record explicitly identifies a World.

A periodic task must never accidentally run only against the last World selected in a web session.

## 4. WebSockets

Handshake must carry World key.

Consumer pins:

```text
world_id
release_id
```

Channel/group names must be namespaced:

```text
w7.r12.ethikos.topic.123
```

If current Release is promoted, existing sockets may:
- remain pinned until reconnect; or
- receive a release-changed event and reconnect.

They must not silently start reading a different Release mid-session.

## 5. Search

Every indexed World document must store:

```text
world_id
release_id
source_type
source_id
```

Every World search automatically filters World/Release.

No user-supplied filter is required for safety; the backend injects it.

Cross-World search is a separate explicit feature.

## 6. Embeddings / vector stores

Use:
- separate namespaces/collections per World/Release; or
- mandatory metadata filter by World/Release.

The safety contract is identical to search.

A vector hit from another World must be impossible in ordinary World-local retrieval.

## 7. AI/RAG

Any AI prompt constructed from Konnaxion World data must include only retrieval results from the selected World/Release unless the feature explicitly declares cross-World comparison.

Prompt logs/audit should record the World context used.

Do not trust the language model to "remember" the World boundary. Enforce it before retrieval.

## 8. Media

Storage path:

```text
worlds/{world_id}/releases/{release_id}/...
```

or equivalent World-aware namespace.

World assets may be copied/referenced from immutable shared assets only through explicit metadata.

## 9. Analytics

Analytics rows/events must carry World ID.

Dashboards default to one World when viewed inside `/w/{world}/...`.

Cross-World analytics is an explicit control-plane/reporting view.

## 10. Production job isolation at 120-World scale

Release build/provision/import work is operationally different from user World switching.

For production control-plane requests, long-running operations SHOULD execute as explicit jobs outside the interactive request path. A build job MUST pin its target World/Release and MUST NOT change the current Release until validation and explicit promotion succeed.

Recommended shape:

```text
POST build
→ create/identify WorldRelease + build job
→ worker provisions schemas
→ scoped migrations
→ Seed Pack import
→ derived-index rebuild
→ validation
→ READY
→ explicit promote
```

Multiple World builds MAY run concurrently only within configured resource limits. Production SHOULD provide queue/concurrency limits so bulk preparation of 120 Worlds cannot starve ordinary runtime traffic.

## 11. Health checks at 120-World scale

Server liveness/readiness MUST remain lightweight and MUST NOT perform exhaustive schema validation across all Worlds on every probe.

Separate:
- **liveness** — process responds;
- **readiness** — core dependencies such as PostgreSQL/Redis are reachable and required migrations/configuration are valid;
- **registry health** — compact status of Worlds/current Releases;
- **deep World health** — canaries, schema validation, isolation checks and expensive audits, executed on demand or periodically.

A reverse proxy/orchestrator health probe MUST NOT become slower in proportion to the number of registered Worlds.

## 12. Logging

Structured logs should include:

```text
request_id
world_id
world_key
release_id
principal_id
view_as_persona_id
domain
```

Do not log sensitive content merely to improve debugging.
