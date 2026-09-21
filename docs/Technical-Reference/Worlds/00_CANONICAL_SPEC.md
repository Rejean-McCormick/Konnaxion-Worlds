# Konnaxion Worlds — Canonical Specification

**Lock:** `KX-WORLDS-1`  
**Version:** `1.2.0`  
**Status:** LOCKED TARGET ARCHITECTURE  
**Keywords:** MUST, MUST NOT, SHOULD, SHOULD NOT, MAY are normative.

## 1. Purpose

Konnaxion Worlds provides isolated, switchable civic environments inside a single Konnaxion deployment.

A World selector MUST allow a user to move from one World to another without resetting, re-importing, mutating, or destroying either World.

Example:

```text
World: CUNY Philosophy
  participants: Gould, Dahbour, Fraser...
  EkoH: CUNY-specific profiles
  ethiKos: CUNY debates
  Smart Vote: CUNY readings

switch

World: Hydro / AI
  participants: different population
  EkoH: different profiles
  ethiKos: different debates
  Smart Vote: different readings
```

Returning to CUNY MUST restore the same CUNY state, subject only to legitimate mutations that occurred inside CUNY.

## 2. Core architecture

> **Post-separation repository note (2026-09-21):** `Konnaxion_Worlds` is now a standalone sibling infrastructure repository. It owns World/WorldRelease/routing/provenance mechanics only. The main `Konnaxion` repository owns ethiKos, DecisionRecord, durable Interaction Kernel emission and impact ingress. "One Konnaxion codebase" below means one authoritative main-product implementation per domain; it MUST NOT be interpreted as permission to duplicate main-product runtime code into this repository.

Konnaxion remains one authoritative product implementation and one logical deployed application stack.

Normal World isolation MUST NOT be implemented by:
- copying the Konnaxion repository;
- running one Konnaxion container stack per seed;
- resetting and reseeding a shared database on every World switch;
- adding a `scenario_id` filter ad hoc to every existing table;
- using only a global/session variable to decide which data to show.

The target isolation model is:

```text
ONE KONNAXION CODEBASE
ONE FRONTEND
ONE BACKEND
ONE POSTGRES CLUSTER
ONE CONTROL PLANE

N LOGICAL WORLDS
N WORLD RELEASES
N ISOLATED SCHEMA PAIRS
```

### 2.1 Production scale target

The production design target is **at least 120 registered Worlds in one logical Konnaxion deployment**.

The normal baseline MAY run the shared Konnaxion stack on one production server/VPS when measured CPU, RAM, storage, I/O and concurrency permit. The architecture MUST NOT depend on one physical host: shared services MAY later scale horizontally without changing the World isolation model.

At the 120-World target:
- a World remains a data/runtime boundary, never a deployment boundary;
- selecting a World MUST NOT start/stop containers or services;
- selecting a World MUST NOT build, import, reset, restore, migrate or provision schemas;
- all registered/current World Releases MAY coexist in PostgreSQL;
- only request/task traffic for a World consumes active runtime work at that moment, apart from explicitly scheduled background jobs;
- capacity planning MUST distinguish **registered Worlds**, **stored Releases**, **concurrent active users**, **background jobs**, and **data volume**.

A design that requires one repository, one Docker stack, one process-global active World, or one server process per World is non-conforming.

Each physical `WorldRelease` MUST own:
- one World-domain PostgreSQL schema;
- one EkoH/Smart Vote PostgreSQL schema.

Example:

```text
World: cuny
Release: 12

domain schema: kx_w_cuny_r12
ekoh schema:   kx_e_cuny_r12
```

## 3. Control plane

The shared control plane owns only global platform state.

Target global state includes:
- real authentication principals;
- sessions/auth infrastructure;
- World registry;
- WorldRelease registry;
- Seed Pack registry/provenance;
- World permissions/membership;
- control-plane audit events;
- deployment/platform configuration.

World-owned civic content MUST NOT be stored in the control-plane schema after final cutover.

### 3.1 Ecosystem boundary of the Worlds control plane

The Worlds control plane is **Konnaxion-local** platform state. It MUST NOT be described as:

- the kOA Digital Ecosystem control plane;
- an Orgo control plane;
- an Interaction Kernel coordinator or owner;
- a Kristal authority/recognition service;
- a kOA-Linux host/runtime activation authority.

Interaction Kernel is an interoperability protocol between systems. It does not own `World`, `WorldRelease`, Seed Pack, Snapshot or Konnaxion civic state.

## 4. World selection vs Release promotion

These are different operations.

**Select/Open World**
- per user/request;
- navigation/context operation;
- MUST NOT mutate World data;
- MUST NOT rebuild a World;
- MUST NOT call reset/import;
- MUST be represented explicitly in the URL.

**Promote Release**
- administrative control-plane mutation;
- changes `World.current_release`;
- affects which physical release serves that logical World;
- requires audit and permission checks.

AI and implementation code MUST NOT use the word `activate` ambiguously for both concepts.

Promote Release is not Kristal Runtime Pack activation, Reference Exchange recognition, publication, or kOA-Linux physical activation. It is a Konnaxion-local pointer mutation selecting which `WorldRelease` serves a logical World.


## 4.1 Cross-ecosystem artifact distinction

A **Seed Pack** is a Konnaxion Worlds build input. It is not a Kristal Runtime Pack.

A **WorldRelease** is a Konnaxion Worlds runtime/data generation. It is not a Kristal Working Exchange or Reference Exchange.

A **Snapshot** is a Konnaxion Worlds state capture. It is not a Kristal Exchange.

Any future bridge between these artifact families MUST use an explicit Integration Kernel/Profile contract and MUST preserve each system's identity and ownership semantics.

## 5. Explicit World context

Canonical UI path:

```text
/w/{world_key}/...
```

Canonical World-scoped API path:

```text
/api/w/{world_key}/...
```

The World key MUST be explicit in each World-scoped request.

A session or user preference MAY remember the last opened World for navigation convenience, but MUST NOT be authoritative for data access.

In multi-World mode, a World-scoped API request without a valid World MUST fail closed.

There MUST NOT be a silent production fallback to a "default World".

## 6. Request pinning

At request start the backend MUST resolve:

```text
world_key
→ World
→ World.current_release
→ immutable request WorldRuntime
```

The request MUST remain pinned to that `world_id + release_id` until completion even if an administrator promotes another release concurrently.

Every World-scoped response MUST expose:

```text
X-Konnaxion-World
X-Konnaxion-World-Release
```

## 7. Database scope

All World-owned ORM operations MUST execute inside an explicit World database scope.

Conceptually:

```python
with world_db_scope(runtime):
    ...
```

The scope MUST:
1. open a transaction;
2. validate the registered schema pair;
3. set a transaction-local PostgreSQL `search_path`;
4. set a request/task-local `WorldRuntime` context variable;
5. clear that context when the scope exits.

Schema names MUST come from trusted registry state and MUST be quoted safely. URL input MUST never be interpolated directly into SQL identifiers.

## 8. Fail-closed schema rule

After final cutover, the control-plane/public schema MUST NOT contain World-owned table copies that could act as fallback tables.

This is critical because PostgreSQL `search_path` resolves the first matching table name.

Multi-World mode MUST NOT be enabled until a cutover check confirms that World-owned tables cannot silently resolve to legacy shared tables.

## 9. Data ownership

World-scoped by default:
- ethiKos/Korum source state;
- consultations and civic intake;
- EkoH scores, ethics, visibility/access context and histories;
- Smart Vote bindings, relevance and readings;
- Konsensus voting state;
- World participants/personas;
- keenKonnect project/collaboration state;
- KonnectED World-specific learning/resource state;
- Kreative World-specific content;
- TeamBuilder World-specific state;
- World reports, analytics, search and derived indexes;
- World attachments/media.

Global by default:
- real platform auth principal;
- World registry/control models;
- platform permissions;
- control-plane audit;
- deployment configuration.

Any additional shared data MUST be explicitly allowlisted and documented. Shared-by-accident is forbidden.

## 10. Identity

`request.user` is the authenticated platform principal and remains global.

A World Persona is a World-specific participant identity or presentation identity.

The v1 compatibility model MAY use globally stored, namespaced Django `User` rows for demo/persona actors because existing ethiKos/EkoH models reference `AUTH_USER_MODEL`.

Such persona usernames MUST be collision-proof, for example:

```text
w_cuny__carol_gould
w_hydro__expert_01
```

Display names remain human-friendly.

A future `WorldActor` abstraction MAY replace this bridge only through a separate ADR and migration.

## 11. EkoH and Smart Vote

EkoH/Smart Vote MUST change with the World.

A user's EkoH profile in World A MUST NOT be reused as the EkoH profile in World B unless explicitly imported into B.

The existing Konnaxion invariants remain mandatory:

```text
source fact != baseline != derived reading
```

Smart Vote:
- reads World-local source facts;
- uses World-local EkoH context;
- produces a separate World-local reading;
- MUST NOT write weighted values back into source rows;
- MUST NOT invent a global per-person voting weight.

A Smart Vote calculation MUST NOT combine source data from one World with EkoH data from another.

## 12. Seed Pack, World, Release, Snapshot

These terms MUST NOT be conflated.

**Seed Pack**  
Versioned, reproducible source input used to build/populate a World Release.

**World**  
Stable logical environment selected by users.

**WorldRelease**  
Physical schema pair and runtime generation serving a World.

**Snapshot**  
Point-in-time capture of mutable runtime state.

`scenario_key` remains a provenance/import concept inside a Release. It is not the World isolation boundary.

## 13. Releases and rebuilds

An active World MUST NOT be rebuilt destructively in place.

Rebuild flow:

```text
current release r12
      |
build r13 in new schemas
      |
validate r13
      |
promote pointer atomically
      |
r13 becomes current
```

If r13 fails validation, r12 remains untouched.

A release MUST store immutable build provenance:
- Seed Pack key/version;
- Seed checksum;
- schema contract version;
- migration versions;
- build timestamp.

The runtime state of a current interactive release MAY become dirty. Dirty runtime state is captured by snapshots, not by rewriting Seed Pack provenance.

## 14. Cache, jobs, search, WebSockets, media

Every World-derived key or artifact MUST include at least `world_id` and, where release-specific, `release_id`.

Required examples:

```text
cache: w:{world_id}:r:{release_id}:...
task:  world_id + release_id
search metadata: world_id + release_id
embedding namespace: world/release
websocket handshake: world_id + release_id
media path: worlds/{world_id}/...
audit: world_id + release_id
```

A background task without World context MUST fail if it touches World-owned state.

## 15. Import identity

Display strings MUST NOT be used as cross-World persistent identities.

Import identity MUST use stable source keys scoped by scenario/World.

Unsafe examples:
- category identity by display `name` alone;
- topic identity by display `title` alone;
- persona identity by reusable username alone.

The importer MUST NOT cause one World's import to update another World's object.

## 16. View As

A demo/presenter feature MAY allow:

```text
WORLD: CUNY
VIEW AS: Carol Gould
```

`View As` MUST NOT change the authenticated principal or grant the persona's real permissions.

It is a presentation/actor-context feature, with explicit audit and a visible banner when active.

## 17. Cross-World access

Direct joins or foreign keys between two World releases are forbidden.

Cross-World comparison/export MAY exist only through explicit control-plane or reporting services that:
- resolve each World independently;
- read each World under its own scope;
- do not mutate either World by default;
- return a derived comparison artifact.

## 18. AI change control

Any implementation proposal that changes a locked invariant in this document MUST:
1. identify the invariant;
2. create an ADR proposal;
3. explain migration and contamination implications;
4. update `AI_LOCK.yaml`;
5. increment the architecture lock version.

Silent architectural substitutions are forbidden.
