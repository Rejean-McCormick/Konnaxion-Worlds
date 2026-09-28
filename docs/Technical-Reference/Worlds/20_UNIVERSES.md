# Konnaxion Universes — Canonical Extension

**Architecture lock:** `KX-UNIVERSES-1`  
**Foundation:** `KX-WORLDS-1`  
**Status:** locked target architecture; Phase U1 implemented in the control plane/runtime  
**Owner:** `Konnaxion_Worlds`

This document is the normative Universe extension to the existing Worlds specification.
Where an older `KX-WORLDS-1` document assumes globally unique World identity or a canonical
`/w/{world_key}` route, this document supersedes that assumption. All other World/Release
isolation invariants remain in force.

## 1. Canonical hierarchy and topology

```text
Konnaxion
  └── Universe
        ├── World
        │     └── WorldRelease
        ├── World
        │     └── WorldRelease
        └── World
              └── WorldRelease
```

The containment hierarchy is `Universe -> World -> WorldRelease`, but functional relationships
between Worlds form a graph, not a mandatory parent/child tree.

Canonical meanings:

- **Universe** = coherence, navigation, governance, membership and discovery boundary.
- **World** = isolated working/data/runtime boundary.
- **WorldRelease** = physical/versioned materialization of a World.
- **WorldRelation** = explicit graph edge between Worlds in the same Universe.
- **WorldPublication** = immutable/versioned output intentionally exposed by a source World.
- **WorldSubscription** = explicit declaration that one World consumes a publication type from another.

## 2. Non-negotiable invariants

### UNI-001 — Every World belongs to one Universe

In normal `KX-UNIVERSES-1` operation, `World.universe_id` is mandatory.

### UNI-002 — Universe is not a storage schema

Universe MUST NOT receive a shared business-data PostgreSQL schema. Physical isolation remains at
`WorldRelease` through its domain + EkoH/Smart Vote schema pair.

### UNI-003 — Same-Universe Worlds remain isolated

Two Worlds in the same Universe are no less isolated than two Worlds in different Universes.
Universe membership MUST NOT authorize direct cross-World ORM/SQL joins.

### UNI-004 — Relations do not grant data access

`WorldRelation(A, B)` describes topology. It MUST NOT act as a database permission or bypass
World access checks.

### UNI-005 — Inter-World transfer is explicit

Data/results may cross a World boundary only through an explicit integration/read service or a
versioned `WorldPublication`. Consumers MUST retain source World/Release provenance.

### UNI-006 — `parent_world` remains provenance

`World.parent_world` means fork/lineage. It MUST NOT be repurposed as a live sub-World hierarchy.

### UNI-007 — Runtime identity includes Universe

A resolved request/runtime identifies at least:

```text
universe_id + universe_key
world_id + world_key
release_id + release_number
```

World/Release remains the infrastructure namespace for cache, tasks, search, WebSockets, media and
schema routing. Universe is additional identity/governance context, not a replacement for Release pinning.

### UNI-008 — No process-global active Universe

Universe and World are resolved per request/task. A UI preference may remember the last selection,
but it is never authority for data access.

### UNI-009 — World keys become Universe-scoped only after legacy route retirement

Phase U1 intentionally retains global uniqueness of `World.key` so `/w/{world_key}` remains
unambiguous. The final constraint is:

```text
UNIQUE(universe_id, world_key)
```

That change MUST NOT happen until legacy `/w/{world_key}` routing has been retired or made
unambiguous by another explicit identifier.

### UNI-010 — One canonical repository owner

Models, migrations, resolver/runtime, lifecycle services and canonical Universe/World documentation
are owned by the `Konnaxion_Worlds` repository/package. The main Konnaxion repository may contain
host adapters, route mounting and UI navigation, but MUST NOT vendor a second engine/spec copy.

## 3. Canonical data model

### Universe

Core fields:

```text
key
title
description
status: active | maintenance | archived
visibility: public | private
default_world -> World? (must belong to the Universe)
created_by
metadata_json
created_at / updated_at / archived_at
```

### UniverseMembership

```text
universe
user
role: owner | maintainer | member | viewer
is_active
```

Universe access is an outer governance boundary. A public World inside a private Universe does not
become publicly accessible. World permissions may remain stricter than Universe membership.

### World

`World` gains mandatory `universe`. During Phase U1 `key` remains globally unique for compatibility.
Moving an existing World between Universes is not an ordinary update; use an explicit clone/fork or
future migration operation so provenance and isolation remain auditable.

### WorldRelation

```text
universe
source_world
target_world
relation_type: coordinates | depends_on | constrains | publishes_to | references
title / description / metadata_json
```

Source and target MUST be distinct and MUST belong to the relation Universe.

### WorldPublication

```text
source_world
source_release?
publication_type
key
version
title / summary
payload_json and/or artifact_location
checksum
created_by / created_at
```

If `source_release` is present, it MUST belong to `source_world`. Published versions are append-only
at the API contract level: corrections create a new version rather than editing historical output.

### WorldSubscription

```text
consumer_world
source_world
publication_type
status: active | paused
metadata_json
```

Consumer and source MUST be distinct and MUST belong to the same Universe.

## 4. Runtime and routing

Canonical UI route:

```text
/u/{universe_key}/w/{world_key}/...
```

Canonical API route:

```text
/api/u/{universe_key}/w/{world_key}/...
```

Phase U1 compatibility routes remain:

```text
/w/{world_key}/...
/api/w/{world_key}/...
```

The middleware resolves canonical routes with both keys. Legacy routes resolve by globally unique
World key only during the compatibility phase.

Every World-scoped HTTP response SHOULD expose:

```text
X-Konnaxion-Universe
X-Konnaxion-World
X-Konnaxion-World-Release
```

The browser MUST reject stale responses when Universe, World or Release does not match the active context.

## 5. Control-plane API

Phase U1 control-plane resources include:

```text
GET/POST  /api/control/universes/
GET/PATCH /api/control/universes/{universe}/
GET/POST  /api/control/universes/{universe}/worlds/
GET/POST  /api/control/universes/{universe}/memberships/
DELETE    /api/control/universes/{universe}/memberships/{id}/
GET/POST  /api/control/universes/{universe}/relations/
GET/POST  /api/control/universes/{universe}/publications/
GET/POST  /api/control/universes/{universe}/subscriptions/
```

Legacy World control endpoints remain during Phase U1.

## 6. Universe/World switcher contract

The product shell may render one compact control, but state remains two-dimensional:

```text
selectedUniverse
selectedWorld
```

Changing World keeps Universe and navigates strongly to the target World route. Changing Universe
selects its declared `default_world` when accessible, otherwise an accessible World, and performs a
strong navigation. Switching MUST NOT build, seed, migrate, reset, promote or provision anything.

## 7. Project-integration pattern

For multidisciplinary projects, use a hub-and-spoke graph when appropriate:

```text
Engineering -------+
Finance -----------+---> Project Integration <--- Regulatory
Construction ------+              ^
Logistics ---------+--------------+--- Communications
```

`Project Integration` is a real World for cross-discipline schedule, milestones, risks, decisions,
interfaces and scope arbitration. It MUST NOT become a duplicate database for Engineering, Finance,
Regulatory, Logistics, etc. Detailed state stays in its owning World and crosses boundaries only as
explicit publications/integration outputs.

## 8. Reference Universe fixtures

Architecture tests/design reviews SHOULD use at least these shapes:

1. **Canadian public-policy domain Universe** — parallel ministry/domain Worlds and transversal topics.
2. **Christian studies/action Universe** — intellectual history, contemporary theology, charity/action,
   and public-affairs Worlds.
3. **Quebec mining-project simulation Universe** — Project Integration plus Engineering, Finance,
   Regulatory/Environment, Construction/Logistics and Communications/Relations Worlds.

These are architecture fixtures/examples, not privileged hard-coded product taxonomies.

## 9. Migration phases

### U0 — ownership separation

`Konnaxion_Worlds` becomes the only engine/spec owner. Main Konnaxion retains host adapters/UI only.

### U1 — Universe foundation (current implementation target)

Add Universe/Membership/Relation/Publication/Subscription, attach existing Worlds to an explicitly
marked `legacy` migration Universe, enrich runtime identity, add canonical routes while preserving
legacy World routes.

### U2 — Universe-first navigation

Make `/u/{universe}/w/{world}` the normal browser/API route and ensure all clients carry Universe.

### U3 — retire ambiguous legacy routing

Remove dependencies on globally unique World keys and retire/redefine `/w/{world}`.

### U4 — scoped World keys

Replace global World key uniqueness with `UNIQUE(universe_id, key)` only after U3 is complete.

## 10. Acceptance criteria

A conforming implementation demonstrates that:

- same-Universe Worlds cannot accidentally access each other's data;
- a private Universe blocks public child Worlds from outsiders;
- cross-Universe relations/subscriptions fail validation;
- publication Release provenance cannot point to another World;
- two browser tabs can use different Universe/World tuples without contamination;
- switching context never triggers lifecycle work;
- legacy routing works only under its declared migration condition;
- the main Konnaxion repository contains no second backend engine or canonical Worlds/Universes spec;
- the canonical engine remains usable standalone, with host-domain behavior provided by configured adapters.

## Web integration ownership

The canonical engine repository owns the **navigation/runtime contract**, not a duplicate product web UI.

- `Konnaxion_Worlds`: Universe/World models, APIs, resolver, middleware, release isolation, relations/publications/subscriptions, canonical documentation.
- `Konnaxion`: host-specific `UniverseSwitcher`/`WorldSwitcher`, Next.js route integration, browser stale-response protection, and product-shell presentation.

A second maintained `frontend/components/worlds/*` or `frontend/lib/worlds.ts` implementation MUST NOT be recreated inside `Konnaxion_Worlds` while Konnaxion remains the product host. A future reusable frontend SDK would require its own independently versioned package and an ADR before ownership can change.
