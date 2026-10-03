# Konnaxion Worlds ↔ Kristal v7 boundary

**Status:** normative additive boundary over the retained Kristal v6 compatibility boundary  
**Kristal Standard:** `7.0.0-draft.3.1`  
**Portable-state compatibility foundation:** Kristal v6 `kristal_state` (`6.0.0`)

## Purpose

Kristal v7 is an additive Kristall meta-orchestration layer above the unchanged v6 portable-state contract. Konnaxion Worlds remains the authority for Universe/World/WorldRelease isolation and lifecycle. Kristal/Kristall remains the authority for Kristal-native portable state, semantic identity, registries, Mesh, resonance, subjects, axes, Surfaces, projections and crystallization. Interaction Kernel remains the cross-system interoperability protocol.

This boundary extends `22_KRISTAL_V6_BOUNDARY.md`; it does not invalidate it. A valid v6 `kristal_state` remains valid and unchanged. v7 ingestion is registration/factorization/orchestration, not destructive conversion of Worlds or v6 artifacts.

## 1. Artifact identity remains separate

```text
Konnaxion Seed Pack     != Kristal v6 kristal_state/build artifact
Konnaxion WorldRelease != Kristal v6 state revision/exchange artifact
Konnaxion Snapshot     != Kristal v6 kristal_state
Konnaxion World*       != Kristall KQ/KP/KA/KS identity or meta-artifact
WorldRelease promotion != Kristal actionability or Kristall crystallization
```

A bridge MAY map or project World-derived information into Kristal/Kristall, but it MUST preserve both artifact families, ownership and provenance. KQ/KP/KA/KS identifiers remain Kristall semantic identities; they do not become Konnaxion primary keys or runtime isolation keys.

## 2. v7 is additive over the v6 portable projection

When a World-derived projection is materialized for Kristal v7, the portable artifact remains a v6-compatible `kristal_state` and MAY carry `extensions.kristal_v7`. Worlds MUST NOT rewrite an existing v6 state merely to enroll it in Kristall.

A v7 projection MUST preserve enough stable context to identify the source Universe, World and exact Release. The Release is pinned at projection time. Display names, human-readable World names, raw usernames and an implicit later-resolved “current World” are forbidden as persistent identity carriers.

## 3. Kristall semantic structures do not transfer Worlds authority

Kristall may organize external projections using KQ/KP/KA/KS identities, assertion families, typed Mesh edges, subjects, axis types, orientation axes, KOS mappings, Surfaces and crystallization records. None of those structures changes Konnaxion ownership of Universe/World/WorldRelease lifecycle state.

Specifically:

- semantic resonance is a candidate/vector signal and MUST NOT establish identity, equivalence, truth, causality or execution authority;
- a Mesh path MUST NOT be treated as a source or derived assertion merely because a path exists;
- factorization/deduplication MUST NOT erase source membership or provenance;
- external KOS identifiers (including UNESCO mappings) remain external mappings and MUST NOT replace Kristall KQ identity or Konnaxion World identity;
- a Kristall Subject or Surface is not a Konnaxion World, WorldRelease or runtime scope.

## 4. Actionability and crystallization are not execution authority

Kristal actionability remains classification of a possible work path, not permission to mutate Worlds state. `actionability.mode = automatic` and a Kristall crystallization/promotion record MUST NOT by themselves:

- call a Worlds control-plane API;
- promote `World.current_release`;
- start a build/import/migration;
- bypass Konnaxion authentication or authorization;
- bypass Universe/World/Release pinning;
- bypass idempotency or lifecycle guards;
- bypass a required qualified Interaction Kernel Profile;
- acquire kOA-Linux host activation authority.

Execution authority remains with the owner of the operation. For local Worlds operations, that is the Konnaxion Worlds control plane under Konnaxion authorization.

## 5. Epistemic separation is mandatory

Worlds consumers and adapters MUST preserve the v7 distinction:

```text
source assertion
!= derived assertion
!= structural relation
!= semantic resonance/similarity signal
!= hypothesis
!= Mesh path
```

AI-generated or similarity-generated proposals do not gain authority by generation. Missing Surface content remains a gap rather than a synthesized fact.

## 6. Runtime terminology remains local

Konnaxion terms such as `world_db_scope`, request scope, task scope and cache scope are runtime-isolation concepts. They are not Kristal `applicability`, Kristall Subjects, axes or Surfaces. Existing isolation terminology MUST remain where technically correct.

## 7. Integration rule

This package enforces the ownership and projection boundary but does not become a Kristal/Kristall runtime and does not vendor the main Konnaxion Interaction Kernel adapter. A concrete cross-system bridge is qualified only through an explicit IK Profile/adapter and its executable tests.

Machine-readable companion: `KRISTAL_V7_BOUNDARY.json`.
