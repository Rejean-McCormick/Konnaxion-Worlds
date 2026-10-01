# Konnaxion Worlds ↔ Kristal v6 boundary

**Status:** normative ecosystem boundary for `KX-UNIVERSES-1`

**Kristal baseline:** `6.0.0`

This document aligns Konnaxion Worlds with Kristal v6 without changing ownership. Konnaxion Worlds remains the authority for Universe/World/WorldRelease isolation and lifecycle. Kristal remains a representation/knowledge-state system. Interaction Kernel remains the interoperability protocol.

## 1. Artifact identity stays separate

The following identities are not aliases:

```text
Konnaxion Seed Pack     != Kristal v6 kristal_state/build artifact
Konnaxion WorldRelease != Kristal v6 state revision/exchange artifact
Konnaxion Snapshot     != Kristal v6 kristal_state
WorldRelease promotion != Kristal actionability
```

A bridge may reference or project one family into the other, but it must preserve both identities and provenance.

## 2. v6 projection semantics

When World-derived information is represented in Kristal v6:

| Konnaxion meaning | Kristal v6 role | Rule |
|---|---|---|
| observed World/Release state | `record_role = observed_state` | projection does not replace Konnaxion system of record |
| Worlds invariant/policy | `record_role = organizational_rule` or `reference_knowledge` | exact role belongs to the integration Profile |
| derived World analytics | `record_role = derived_state` | preserve source World/Release provenance |
| externally authoritative rule used by a World | `record_role = authoritative_constraint` | authority remains external |
| decision made by Konnaxion owner | `record_role = decision` | only when an actual decision record exists |
| action description/result | `record_role = action` | description is not execution authority |

`valuations[]` may carry typed measurements about projected state. `coordinates` may carry domain coordinates. `applicability` describes where the Kristal assertion applies. None of these fields become Konnaxion database-security boundaries.

## 3. Preserve Universe / World / Release provenance

A Kristal projection of World-derived state MUST preserve enough stable context to identify its source Universe, World and exact Release. The integration Profile may use `applicability`, statement `coordinates`, provenance/artifact references, or an explicit envelope mapping.

The following are forbidden as persistent identity carriers:

- display title;
- human-readable World name alone;
- raw username;
- an implicit "current World" resolved later.

The Release must be pinned at projection time.

## 4. Actionability is classification, not authority

Kristal v6 separates a representation from what an organization may do with it.

`actionability.mode = automatic` means the relevant policy considers an automated path eligible. It MUST NOT, by itself:

- call a Worlds control-plane API;
- promote `World.current_release`;
- start a build/import/migration;
- bypass Konnaxion permissions;
- bypass World/Release pinning;
- bypass idempotency or lifecycle guards;
- bypass a required Interaction Kernel Profile;
- acquire kOA-Linux host activation authority.

Execution authority stays with the owner of the operation. For local Worlds operations, that is the Konnaxion Worlds control plane under Konnaxion authorization. For cross-system operations, the explicit integration contract/Profile determines the handoff.

## 5. Human boundaries

Kristal v6 modes may help select a work path:

```text
automatic                -> eligible for automated owner path
human_review             -> machine may prepare; human validates
human_decision           -> decision is reserved to authorized human
manual                   -> manual owner procedure
prohibited               -> do not execute in this context
insufficient_information -> gather more state first
not_applicable           -> no action semantics here
```

These modes are inputs to Konnaxion policy/admission, not replacements for it.

## 6. Konnaxion `scope` is not Kristal legacy `scope`

Konnaxion uses terms such as `world_db_scope`, cache scope, task scope and request scope for runtime isolation. Those are not the legacy Kristal v5 epistemic `scope` field. Kristal v6 renamed its own field to `applicability`; Konnaxion MUST keep its existing isolation terminology where it is technically correct.

## 7. No integration claim from this package

This package documents and enforces the boundary but does not vendor the main Konnaxion IK adapter. A concrete bridge is qualified only when the host integration implements the relevant IK Profile and passes its profile-level tests.
