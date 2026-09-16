# Glossary — Konnaxion Worlds

Precise terminology is part of the architecture lock.

## World

A stable logical civic environment.

Examples:
- `cuny-political-philosophy`;
- `hydro-ai-governance`;
- `quebec-democracy`.

A user selects a World. The World points to one current `WorldRelease`.

A World is **not**:
- a seed file;
- a scenario;
- a Docker stack;
- a database copy of the code;
- a user session.

## World Key

Stable URL-safe identifier for a World.

Example:

```text
cuny-political-philosophy
```

The World key is used for resolution, not directly as an SQL identifier.

## WorldRelease

A physical runtime generation of a World.

It owns:
- `domain_schema`;
- `ekoh_schema`;
- seed/build provenance;
- status;
- validation state.

A World can have multiple Releases, but only one is current.

## Current Release

The `WorldRelease` currently served for a logical World.

This is a server/control-plane pointer.

It is not the same as the World selected by one browser user.

## Seed Pack

Versioned source material capable of building a World Release.

It may contain:
- one or more ethiKos scenario JSON files;
- EkoH contextual data;
- source documents;
- media;
- World manifest;
- fixture requirements.

Seed Pack content is reproducible input, not live runtime state.

## Scenario

A logical import/provenance unit inside a World Release.

The existing `scenario_key` remains useful for tracing and replacing one scenario within a Release.

A Scenario is not the World isolation boundary.

## Snapshot

Point-in-time capture of mutable runtime state.

Use cases:
- before a live presentation;
- before a large import;
- before risky demo interactions;
- reproducible restore.

Snapshot differs from Seed Pack:
- Seed Pack = authored input;
- Snapshot = captured runtime state.

## Platform Principal

The real authenticated Konnaxion user represented by `request.user`.

Examples:
- administrator;
- developer;
- presenter;
- normal authenticated participant.

Platform Principals are global.

## World Persona

World-specific identity presented as a participant/actor.

Examples:
- Carol Gould in the CUNY demonstration;
- an AI energy expert in Hydro/AI;
- a simulated citizen.

A World Persona is not automatically a real authenticated account.

## Persona Bridge User

v1 compatibility technique: a globally stored Django `User` row used because existing Konnaxion models have foreign keys to `AUTH_USER_MODEL`.

Persona Bridge Users must use namespaced usernames and World membership.

## World Membership

Permission or participation relationship between a global principal/persona and a World.

Do not confuse:
- authorization membership;
- civic participation role;
- ethiKos discussion role;
- View As selection.

## Selected World

The World currently represented in a browser route/request.

Canonical source: URL path.

Example:

```text
/w/cuny-political-philosophy/ethikos/...
```

## Promote Release

Admin operation changing `World.current_release`.

This is not what the user-facing World toggle does.

## Open / Select World

Per-user navigation operation.

No database mutation.

## Dirty Release

A current release whose live runtime state differs from its Seed Pack baseline because legitimate interactions occurred.

Dirty does not mean corrupted.

## Control Plane

Global shared infrastructure that manages Worlds but does not own their civic content.

## World Domain Schema

PostgreSQL schema containing World-owned Konnaxion domain tables other than the EkoH/Smart Vote legacy group.

Example:

```text
kx_w_cuny_r12
```

## EkoH Schema

PostgreSQL schema containing World-local EkoH and Smart Vote tables.

Example:

```text
kx_e_cuny_r12
```

## WorldRuntime

Immutable request/task-local resolved context:

```text
world_id
world_key
release_id
domain_schema
ekoh_schema
```

## View As

Presentation feature that changes the displayed/acting World Persona without changing `request.user`.

## Ecosystem artifact distinctions

These names are not aliases across systems:

```text
Konnaxion Worlds Seed Pack   != Kristal Runtime Pack
Konnaxion Worlds WorldRelease != Kristal Working/Reference Exchange
Konnaxion Worlds Snapshot     != Kristal Exchange
Promote WorldRelease          != Runtime Pack activation
Worlds Control Plane          != kOA ecosystem control plane
```

Future mappings require an explicit Interaction Kernel/Profile contract and may not erase the source artifact identity.
