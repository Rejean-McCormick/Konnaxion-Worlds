# Architecture Decision Record Register — Worlds

> **KX-UNIVERSES-1 extension:** Read `20_UNIVERSES.md` before applying this document.
> It supersedes older assumptions that World identity is globally keyed or that `/w/{world_key}` is the final canonical route.
> All WorldRelease isolation invariants in this document remain in force.


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


## ADR-WLD-016 — 120-World production target on one logical deployment

**Decision:** the production architecture targets at least 120 registered Worlds inside one shared Konnaxion deployment. The initial deployment may place the shared stack on one server/VPS when capacity measurements permit.  
**Rejected default:** one repository, container stack, application process, or physical server per World.

World selection remains request-scoped navigation and never starts/stops infrastructure or performs build/import/reset/provision operations.

## ADR-WLD-017 — Long-running World lifecycle work is outside the switch path

**Decision:** Release build, schema provisioning, migration, Seed Pack import, deep validation, snapshot and restore are control-plane lifecycle operations. Production UI/API SHOULD execute long-running lifecycle work as queued/controlled jobs with explicit resource concurrency.  
**Reason:** preparing or updating a large World catalog must not block or destabilize ordinary runtime switching.

## ADR-WLD-018 — Lightweight server health is separate from deep all-World validation

**Decision:** liveness/readiness probes MUST remain bounded and must not perform exhaustive validation of all registered Worlds on every probe. Deep World/schema health is a separate on-demand or scheduled operation.

## ADR-WLD-019 — Worlds control plane is Konnaxion-local

**Decision:** `control plane` in the Worlds architecture refers only to Konnaxion's World registry/lifecycle/platform state. It does not become a kOA-wide control plane or acquire Orgo, Kristal, Interaction Kernel or kOA-Linux authority.

## ADR-WLD-020 — Worlds artifacts are not Kristal artifacts

**Decision:** `Seed Pack`, `WorldRelease` and `Snapshot` remain Konnaxion Worlds artifact identities. They are not aliases of Kristal v6 `kristal_state`, state revisions or exchange/build artifacts. Any mapping requires an explicit integration contract/Profile and preserves the source identity.

## ADR-WLD-021 — Release promotion is not host activation

**Decision:** promoting `World.current_release` is a Konnaxion-local lifecycle mutation. It is not physical Runtime Pack verify/stage/activate/rollback. When kOA-Linux is present, host activation remains kOA-Linux-owned.

## ADR-WLD-022 — Kristal v6 actionability is not Konnaxion execution authority

**Decision:** Kristal v6 `actionability` may classify a projected assertion/action as `automatic`, `human_review`, `human_decision`, `manual`, `prohibited`, `insufficient_information`, or `not_applicable`. This classification does not itself authorize a Konnaxion Worlds mutation. Any execution remains subject to the owning Konnaxion operation, authorization, World/Release pinning, lifecycle invariants and, for cross-system operations, an explicit qualified Interaction Kernel/Profile boundary.

## ADR-WLD-023 — Kristal projections preserve Universe/World/Release provenance

**Decision:** when Konnaxion World-derived state is projected into a Kristal v6 `kristal_state`, the projection must preserve stable Universe/World/Release provenance and must not use display names as persistent identity. `applicability`, statement `coordinates`, provenance/artifact references, or an explicit Profile mapping may carry that context. No single carrier is mandated by Worlds; the integration Profile owns the exact mapping.

## ADR-WLD-024 — Konnaxion runtime scope terminology is not Kristal v5 scope

**Decision:** existing `world_db_scope`, task scope, cache scope and World/Release routing scope remain Konnaxion isolation terminology. Kristal v6's migration from its legacy epistemic `scope` field to `applicability` does not trigger a Konnaxion rename because the concepts are different.

## ADR-WLD-025 — Kristal v7 is additive over the v6 portable-state boundary

**Decision:** Kristal Standard `7.0.0-draft.3.1` is the current ecosystem boundary for Worlds integrations. Existing v6 `kristal_state` remains valid and unchanged; v7 enrollment is registration/orchestration rather than destructive conversion. Portable v7 projections remain v6-compatible and may carry `extensions.kristal_v7`.

## ADR-WLD-026 — Kristall semantics do not become Worlds authority

**Decision:** KQ/KP/KA/KS identities, Subjects, axis types, orientation axes, Surfaces, Mesh paths, semantic resonance and crystallization are Kristall-owned semantic/meta structures. They do not become Konnaxion World/Release identifiers, runtime scope, source assertions or execution authority. Any World-derived projection must preserve Universe/World/exact Release provenance.

## KX-UNIVERSES-1 decisions

### ADR-UNI-001 — Universe is a coherence/governance boundary

**Decision:** Universe groups Worlds for navigation, membership, governance and discovery. It owns no shared World business-data schema.

### ADR-UNI-002 — World remains the isolation boundary

**Decision:** adding Universe does not weaken World/WorldRelease database, cache, task, search, WebSocket, media or AI/RAG isolation.

### ADR-UNI-003 — Functional topology is a graph

**Decision:** use `WorldRelation` for live functional relationships. Do not encode arbitrary live sub-World hierarchy through `parent_world`.

### ADR-UNI-004 — `parent_world` remains provenance

**Decision:** `parent_world` continues to mean fork/lineage history.

### ADR-UNI-005 — Inter-World exchange is explicit

**Decision:** use provenance-bearing `WorldPublication`/integration services instead of direct cross-World joins.

### ADR-UNI-006 — Canonical route contains Universe and World

**Decision:** target routes are `/u/{universe}/w/{world}` and `/api/u/{universe}/w/{world}`. World-only routes are migration compatibility.

### ADR-UNI-007 — World keys become Universe-scoped only after route migration

**Decision:** keep global `World.key` uniqueness in Phase U1; move to `(universe,key)` only after ambiguous World-only routing is retired.

### ADR-UNI-008 — Konnaxion_Worlds is sole engine/spec owner

**Decision:** main Konnaxion is a host/consumer. It may own adapters and navigation, but not a duplicate backend engine or canonical Universe/World spec.

### ADR-UNI-009 — Project Integration is a World, not a shared database

**Decision:** multidisciplinary projects may use a central integration World for cross-domain decisions/risks/schedule; detailed discipline state remains in specialist Worlds and crosses boundaries explicitly.
