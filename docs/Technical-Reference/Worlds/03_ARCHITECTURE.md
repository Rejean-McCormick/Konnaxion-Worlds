# Architecture

> **Boundary note:** The term **control plane** in this document is local to Konnaxion Worlds. It is not the kOA Digital Ecosystem control plane, an Orgo control plane, an Interaction Kernel coordinator, a Kristal authority, or the kOA-Linux host activation owner.


## 1. High-level topology

```text
                         Konnaxion
                             |
              +--------------+--------------+
              |                             |
         Control Plane                 Runtime Router
              |                             |
      World Registry / ACL          /w/{world_key}/...
              |                             |
              +--------------+--------------+
                             |
                      WorldResolver
                             |
                      current release
                             |
            +----------------+----------------+
            |                                 |
     World domain schema               EkoH schema
     kx_w_cuny_r12                      kx_e_cuny_r12
            |                                 |
      ethiKos, etc.                    EkoH + Smart Vote
```

## 2. One deployment, many Worlds

A World is a data/runtime boundary, not a deployment boundary.

Normal production topology remains:

```text
Next.js
Django/DRF
Celery
Redis
PostgreSQL
search/vector infrastructure
media/object storage
```

These services are shared infrastructure but all World-derived state is namespaced.

### 2.1 Initial production topology for ~120 Worlds

The operational baseline is one deployed Konnaxion stack capable of serving approximately 120 registered Worlds:

```text
ONE SERVER / VPS (initial baseline)
  reverse proxy / TLS
  Next.js
  Django/DRF
  Celery workers
  Redis
  PostgreSQL
  search/vector services as enabled
  World-scoped media storage

120 logical Worlds
  -> registry rows in control plane
  -> one current WorldRelease each
  -> isolated schema pair per stored Release
```

The number of Worlds does not imply 120 running application stacks. World selection is resolved per request, so different users and browser tabs MAY concurrently use different Worlds through the same Django/Next.js deployment.

Scaling beyond one physical server MAY split PostgreSQL, Redis, Celery, frontend, backend, search or object storage onto separate hosts. This is infrastructure scaling, not World-per-host deployment.

### 2.2 Capacity dimensions

Capacity MUST be planned using separate dimensions:
- registered World count;
- retained Release count per World;
- schema/table/storage footprint;
- concurrent requests/users by World;
- Celery/background workload;
- search/vector index size;
- media footprint;
- snapshot/backup retention.

A release-retention policy is therefore part of production sizing. Keeping many historical Releases for all 120 Worlds can dominate database object count and storage even when user traffic is low.

## 3. Canonical backend owner

Create a dedicated canonical backend package:

```text
backend/konnaxion/worlds/
```

Suggested layout:

```text
worlds/
  apps.py
  models.py
  admin.py
  context.py
  db.py
  middleware.py
  permissions.py
  api/
    serializers.py
    views.py
    urls.py
  services/
    resolver.py
    provisioner.py
    release_builder.py
    promotion.py
    snapshot.py
    clone.py
    audit.py
  management/
    commands/
      world_build.py
      world_check.py
      world_snapshot.py
      world_restore.py
      world_promote.py
```

Worlds is a cross-cutting infrastructure owner.

Do not put the World registry inside `konnaxion.ethikos`.

## 4. Frontend structure

Suggested:

```text
frontend/app/w/[world]/...
frontend/modules/worlds/
frontend/components/worlds/WorldSwitcher.tsx
frontend/app/kontrol/worlds/...
```

The World switcher may be globally visible, but the control/management UI naturally belongs in the Kontrol administrative surface.

Presentation ownership in Kontrol does not move backend World ownership away from `konnaxion.worlds`.

## 5. Database schemas

Each Release owns a pair:

```text
domain_schema = kx_w_{safe_world_token}_r{release_number}
ekoh_schema   = kx_e_{safe_world_token}_r{release_number}
```

Schema names are generated and stored by the backend.

They must never be generated from arbitrary client-provided strings at SQL execution time.

## 6. Runtime search path

Conceptual runtime path:

```sql
SET LOCAL search_path TO
  <ekoh_schema>,
  <domain_schema>,
  <control_schema>;
```

The implementation must account for current global auth/control tables.

The exact control schema may initially be `public`; however final cutover must guarantee that it contains no World-owned table fallback copies.

## 7. Migration topology

Migrations are applied in three categories.

### Global/control migrations

Normal deployment migrations for:
- users/auth;
- World registry;
- global platform configuration;
- control-plane audit.

### World domain migrations

Applied by a World provisioner against:

```text
domain_schema
```

and restricted to the allowlisted World-domain apps.

### EkoH/Smart Vote migrations

Applied against:

```text
ekoh_schema
```

and restricted to the EkoH/Smart Vote app group.

Each schema must have independent migration recording appropriate to its app group.

The provisioner must not simply run all Django migrations twice into arbitrary search paths.

## 8. Runtime canary

Each Release schema should contain a tiny metadata/canary table or equivalent check containing:

```text
world_id
release_id
schema_kind
schema_contract_version
seed_checksum
```

`world_db_scope()` should verify the registry and canary agree in test/debug mode and during health checks.

This makes accidental schema-pointer corruption visible.

## 9. Shared resources

Shared data is opt-in.

A new developer must not infer that a resource should be global because "all Worlds could use it."

Preferred rules:
- mutable civic content: World-local;
- immutable platform configuration: global;
- canonical fixtures such as ISCED may be duplicated reproducibly into each EkoH schema from one canonical fixture source.

Duplication of deterministic fixtures is acceptable and safer than accidental cross-World mutable sharing.
## Post-separation product boundary

`Konnaxion_Worlds` owns World/WorldRelease/routing/provenance infrastructure only.
The main `Konnaxion` repository owns ethiKos `DecisionRecord`, durable Interaction
Kernel emission, impact ingress and the Konnaxion↔Orgo product integration.
This repository must not import or recreate that runtime.

