# Security, Isolation and Failure Modes

## 1. Primary threat: contamination

"Contamination" means data from one World is:
- read in another World;
- mutated by another World;
- used in another World's EkoH/Smart Vote calculation;
- returned from another World's cache/search;
- written by a delayed job using the wrong context.

The system must assume contamination can happen outside PostgreSQL too.

## 2. Fail closed

If World context is missing, invalid or inconsistent, World-owned operations fail.

Forbidden fallback behavior:
- use first World;
- use last selected session World;
- use `public` data;
- use current release of a different World;
- execute a Celery task against whatever Release is current now.

## 3. SQL identifier safety

Schema names are server-generated.

Allowed source:
- validated `WorldRelease.domain_schema`;
- validated `WorldRelease.ekoh_schema`.

Do not:

```python
cursor.execute(f"SET search_path TO {request.world_key}")
```

Use safe identifier quoting and registry validation.

## 4. Legacy table fallback

Before enabling multi-World mode:
- identify all World-owned tables in `public`;
- copy/migrate required data;
- move/rename/remove legacy copies;
- run a guard proving ordinary World ORM cannot resolve a public fallback.

This is a release blocker.

## 5. In-flight release promotion

Scenario:

```text
request A resolves CUNY r12
admin promotes r13
request A continues
```

Correct:
- request A remains on r12;
- new request B resolves r13.

Do not re-resolve current Release during one request.

## 6. Delayed frontend response

Scenario:

```text
CUNY request starts
user switches to Hydro
old CUNY response arrives
```

Frontend checks response headers/cache key and discards mismatch.

## 7. Async task delay

Task queued under r12 after r13 promotion:
- execute against r12 if retained and policy allows;
- or reject explicitly;
- never silently run against r13.

## 8. Nested World scope

Entering World B while code is already inside World A scope is dangerous.

Default:
- reject nested scope with different World/Release.

A dedicated cross-World comparison service may explicitly sequence separate non-overlapping scopes.

## 9. Cross-World FK

Forbidden:
- World A domain table FK to World B table;
- EkoH World A row FK to World B source row.

Allowed:
- World-local row references explicitly global auth/control row.

## 10. View As security

View As:
- does not replace authentication;
- cannot elevate platform permission;
- must be obvious in UI;
- is audited.

## 11. Seed trust

Seed Pack input is data, not executable code.

Manifest paths:
- remain inside Pack root;
- reject path traversal;
- validate schema;
- hash content.

Source links/media should follow normal validation and content policies.

## 12. Purge

Archive first.

Purge must verify:
- target is not current;
- no active build references it;
- snapshots/retention policy;
- operator has elevated permission.

Global persona bridge users are cleaned only if no World references them.

## 13. Backup

Control plane and World schemas require compatible backup policy.

A full disaster recovery backup must include:
- control plane;
- all active World schemas;
- retained rollback releases as policy requires;
- media manifests/storage;
- Seed Pack Git/file source.

## 14. Schema health

Before serving a Release:
- both schemas exist;
- canaries match;
- expected migrations applied;
- fixture checksum valid;
- critical tables exist;
- no fallback World tables exist in control schema.

## 15. Observability

Every isolation error should produce a structured event containing:
- World;
- Release;
- principal;
- route/task;
- expected vs actual context.

Do not automatically recover by switching to another World.
