# Runtime Context and Routing

## 1. Why World context must be explicit

A process-global `active_world` is unsafe:
- multiple users can select different Worlds;
- one user can have two tabs open to different Worlds;
- Celery tasks execute outside browser sessions;
- WebSockets outlive ordinary requests.

Therefore World is request/task context.

## 2. Canonical routes

UI:

```text
/w/{world_key}/ethikos/...
/w/{world_key}/ekoh/...
/w/{world_key}/keenkonnect/...
```

API:

```text
/api/w/{world_key}/ethikos/...
/api/w/{world_key}/v1/ekoh/...
/api/w/{world_key}/v1/smart-vote/...
```

Control-plane API remains unscoped:

```text
/api/control/worlds/...
```

## 3. WorldResolver

Resolution order:

```text
route world_key
→ lookup World
→ permission/visibility check
→ resolve current_release once
→ validate release status
→ create WorldRuntime
```

Example immutable context:

```python
@dataclass(frozen=True)
class WorldRuntime:
    world_id: int
    world_key: str
    release_id: int
    domain_schema: str
    ekoh_schema: str
```

## 4. Context variable

Use `contextvars.ContextVar`, not a module global.

Required helpers:

```python
get_world_runtime()
require_world_runtime()
set_world_runtime(...)
```

World-owned services SHOULD call `require_world_runtime()` at trust boundaries.

## 5. DB scope

Conceptual:

```python
@contextmanager
def world_db_scope(runtime):
    with transaction.atomic():
        set_local_world_search_path(runtime)
        token = current_world_runtime.set(runtime)
        try:
            yield
        finally:
            current_world_runtime.reset(token)
```

The real implementation must:
- safely quote schema identifiers;
- validate schema names from registry;
- never accept raw path strings from request input;
- restore context reliably on exceptions.

## 6. Middleware

World UI/API requests:

```text
request
→ WorldRouteMiddleware
→ WorldResolver
→ world_db_scope
→ view
→ response headers
```

Do not put control-plane endpoints inside a World scope unnecessarily.

## 7. Response headers

Every scoped response:

```http
X-Konnaxion-World: cuny-political-philosophy
X-Konnaxion-World-Release: 12
```

Optional:

```http
X-Konnaxion-World-Dirty: true
```

Frontend clients must reject stale responses whose World/Release does not match the current route/cache context.

## 8. Frontend switch behavior

For v1, prefer a hard navigation:

```javascript
window.location.assign(targetWorldEquivalentPath)
```

Hard navigation intentionally clears:
- pending React state;
- in-memory query caches;
- components tied to old World.

For a deployment with ~120 Worlds, switch latency MUST remain a normal navigation/request cost. A World switch MUST NOT wait for:
- container startup/shutdown;
- Django/Next.js restart;
- migrations;
- schema provisioning;
- Seed Pack import;
- snapshot restore;
- release build.

The target sequence is:

```text
user selects World B
→ navigate to /w/world-b/...
→ backend resolves World B current_release
→ establish WorldRuntime + schema scope
→ serve World B
```

Different concurrent requests MAY resolve different Worlds. There is no server-global selected World.

Later SPA optimization is allowed only after stale-response protection exists.

## 9. No hidden authority

The following may exist only as convenience:
- last selected World user preference;
- cookie remembering last World;
- frontend store.

They MUST NOT replace route-based World resolution.

## 10. Missing World behavior

In multi-World mode:

```text
GET /api/ethikos/topics/
```

must not silently return data from some default World.

Acceptable:
- 400/404 requiring World route;
- compatibility redirect for UI;
- explicit single-World deployment mode.

Single-World mode must be configured, not inferred from whatever World happens to exist.

## 11. Streaming and long-lived responses

A transaction-local `search_path` ends when transaction scope ends.

Therefore:
- streaming responses must not lazily query World data after scope exit;
- all World ORM work must finish before leaving the scope;
- WebSockets need their own WorldRuntime pinning mechanism.
