# Architecture Decision Record Register — Worlds

These decisions define `KX-WORLDS-1`.

Changing an accepted decision requires a superseding ADR.

## ADR-WLD-001 — One deployment, many data Worlds

**Decision:** Worlds are data/runtime boundaries inside one Konnaxion deployment.  
**Rejected default:** repository/container duplication per seed.

## ADR-WLD-002 — Explicit route-based World context

**Decision:** selected World is explicit in `/w/{world_key}` and World API paths.  
**Rejected default:** session-only/global active World.

## ADR-WLD-003 — PostgreSQL schema pair per WorldRelease

**Decision:** each Release owns one domain schema and one EkoH/Smart Vote schema.  
**Reason:** strong isolation while preserving one codebase and aligning with existing EkoH schema-scope precedent.

## ADR-WLD-004 — Shared control plane

**Decision:** real auth principals and World registry remain global.  
**World civic state:** isolated.

## ADR-WLD-005 — No silent default World in multi-World mode

**Decision:** missing World context fails closed.

## ADR-WLD-006 — World switch is navigation, not mutation

**Decision:** toggle changes route/context only.  
**Rejected:** reset/reseed on switch.

## ADR-WLD-007 — Release pinning per request/task

**Decision:** exact Release resolved once and retained for request/task lifetime.

## ADR-WLD-008 — Seed Pack != World != Release != Snapshot

**Decision:** distinct lifecycle objects.

## ADR-WLD-009 — Non-destructive rebuild

**Decision:** build new Release, validate, then promote pointer.

## ADR-WLD-010 — Global auth, World Persona bridge for v1

**Decision:** retain global `AUTH_USER_MODEL` for current compatibility; persona usernames namespaced.  
**Future actor abstraction:** separate ADR.

## ADR-WLD-011 — EkoH and Smart Vote are World-local

**Decision:** same global bridge user may have different World-local score/readings.

## ADR-WLD-012 — Infrastructure scoping is mandatory

**Decision:** cache, tasks, WebSockets, search, embeddings, media and analytics are part of isolation boundary.

## ADR-WLD-013 — Cross-World direct joins forbidden

**Decision:** comparison uses explicit sequential read scopes/control service.

## ADR-WLD-014 — World-owned public fallback tables forbidden after cutover

**Decision:** final multi-World mode cannot rely on `public` fallback copies.

## ADR-WLD-015 — Existing domain ownership remains unchanged

**Decision:** Worlds is infrastructure, not a replacement owner for ethiKos/EkoH/Smart Vote.
