# Test and Acceptance Plan

The defining test of the World architecture is not "can I load two seeds?"

It is "can two Worlds coexist, mutate independently, switch instantly and never cross-contaminate?"

## 1. Golden two-World fixture

Always maintain two intentionally overlapping test Worlds:

### World A — CUNY

```text
actor key: expert_1
topic title: Shared Title
category name: Democracy
EkoH domain: same code
```

### World B — Hydro

Use deliberately colliding display data:

```text
actor key: expert_1
topic title: Shared Title
category name: Democracy
same EkoH domain code
```

But different:
- display person;
- EkoH values;
- arguments;
- votes.

This catches accidental use of display/natural keys.

## 2. Acceptance test

```text
Open A
→ A actor visible
→ A EkoH score = 0.95
→ A Topic exists
→ B actor absent

Open B
→ B actor visible
→ B EkoH score = 0.42
→ B Topic exists
→ A actor absent

Mutate B
→ add argument
→ change EkoH context if permitted

Return A
→ A state exactly unchanged
```

## 3. API missing context

Every World-owned endpoint:
- valid World succeeds;
- missing World fails;
- nonexistent World fails;
- unauthorized World fails.

No default fallback.

## 4. Release pinning

Test:
1. request resolves r1;
2. simulate promotion to r2 before query completes;
3. request still reads r1.

## 5. Cache isolation

Populate same logical cache key in A and B with different values.

Assert no collision.

## 6. Celery isolation

Queue A and B tasks with same user/source IDs.

Assert each task reads/writes only its Release.

Queue A task, promote A to new Release, then execute task.

Assert exact queued Release behavior.

## 7. Search isolation

Index same title/content key in both Worlds.

Search A must never return B document.

## 8. Smart Vote isolation

Same bridge user can have different EkoH scores in A and B.

Assert:
- A reading uses A EkoH;
- B reading uses B EkoH;
- source stance remains unchanged;
- no reading uses mixed data.

## 9. WebSocket isolation

Subscribe A and B clients to identical topic IDs.

Event in A must not reach B.

## 10. Media isolation

Same filename in A/B.

Resolve correct World path and content.

## 11. Public fallback guard

After final cutover, CI/health check asserts World-owned table names are absent from control/public schema.

This test is mandatory before multi-World mode can be enabled.

## 12. Import collision test

Two Worlds use:
- same actor source key;
- same display username request;
- same category name;
- same topic title.

Importer must not update the other World.

## 13. Reset test

Reset one scenario in A.

Assert:
- B unchanged;
- other scenario in A unchanged;
- global real auth principal unchanged.

## 14. Snapshot/restore

Create A snapshot.
Mutate A.
Restore snapshot into new Release.
Promote restored Release.
Assert exact pre-mutation World state.

## 15. Frontend stale-response test

Delay A API response.
Switch to B.
Return delayed A response.
Assert UI remains B.

## 16. CI gates

Required CI groups:

```text
worlds-unit
worlds-db-scope
worlds-two-world-integration
worlds-ekoh-smartvote-isolation
worlds-cache-task-search
worlds-frontend-switch
worlds-schema-health
```

No World feature is "done" until two-World tests pass.
