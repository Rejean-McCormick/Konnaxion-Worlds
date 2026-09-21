# AI Lock and Anti-Drift Contract

This document is normative for AI coding agents and developers working on Konnaxion Worlds.

## 1. Mandatory preflight

Before changing World-related code, read:

```text
docs/Technical-Reference/GENERALinstructionsForAI.txt
docs/Technical-Reference/BOUNDARIES_AND_OWNERSHIP.md
docs/Technical-Reference/CONTRACTS.txt
docs/Technical-Reference/Worlds/AI_LOCK.yaml
docs/Technical-Reference/Worlds/00_CANONICAL_SPEC.md
```

Then inspect the exact current source files being modified.

Do not generate implementation from documentation alone.

## 2. Architecture lock

Lock ID:

```text
KX-WORLDS-1
```

The AI MUST treat `AI_LOCK.yaml` as machine-readable invariants.

If a user request conflicts with a locked invariant:
- do not silently reinterpret the invariant;
- state the conflict;
- create/propose an ADR;
- update the lock only after the architectural decision is accepted.

## 3. Current vs target

The target docs contain classes/routes that may not exist yet.

AI MUST distinguish:
- `CURRENT`: observed in source;
- `TARGET`: defined by this architecture;
- `PROPOSED CHANGE`: code to implement.

Never say `WorldRelease` exists until source inspection confirms it.

## 4. Forbidden substitutions

Without ADR, AI MUST NOT replace the design with:
- database-per-seed because it seems easier;
- one Docker stack per World;
- one repository copy per World;
- `scenario_id` columns scattered across every model;
- session-only selected World;
- a destructive reset/reseed toggle;
- implicit default World fallback;
- shared global EkoH profile;
- global Smart Vote weight;
- shared Redis keys;
- async tasks that resolve "current World" at execution time;
- cross-World ORM joins;
- display title/name/username as cross-World identity;
- one app/container/server process per World as the normal 120-World scaling model;
- lifecycle build/import/provision work in the user World-switch path;
- exhaustive all-World deep validation inside ordinary liveness/readiness probes.

## 5. Naming lock

Use these meanings:

```text
World           logical selected environment
WorldRelease    physical schema pair/runtime generation
Seed Pack       reproducible authored build input
Scenario        import/provenance unit inside Release
Snapshot        runtime point-in-time capture
Platform Principal  authenticated request.user
World Persona   World-specific represented actor
Select/Open World   navigation
Promote Release     admin mutation
```

Do not invent synonyms in code that blur these boundaries.

## 6. Domain ownership lock

World infrastructure does not change Konnaxion owners.

Post-separation hard boundary:
- `Konnaxion_Worlds` MUST NOT contain the Konnaxion↔Orgo product Interaction Kernel boundary;
- it MUST NOT define `DecisionRecord`, `InteractionEmission`, impact-ingress models or ethiKos delivery workers;
- it MAY expose World/Release identifiers as routing/provenance data to the main product through an explicit contract;
- the main `Konnaxion` repository remains the authoritative owner of those product-domain objects and integrations.

Preserve:
- ethiKos owns deliberation source state;
- EkoH owns expertise/ethics context;
- Smart Vote owns derived reading;
- source facts are not overwritten by derived weights;
- Kontrol can present/administer without taking ownership.

## 7. Isolation review for every code change

For any new:
- model;
- cache;
- task;
- search document;
- WebSocket;
- media path;
- API;
- AI/RAG retriever;

the AI must answer internally:

```text
Is this GLOBAL or WORLD-SCOPED?
If World-scoped, where are world_id and release_id enforced?
What happens if World context is missing?
Can another World address the same natural key?
```

If those answers are absent, implementation is incomplete.

## 8. Fail-closed rule

AI MUST prefer an explicit error over an implicit fallback.

Missing World context is a bug, not a signal to infer one.

## 9. Tests required

Every isolation-related change requires at least one test using two Worlds with deliberately colliding display keys.

One-World happy-path tests are insufficient.

For production-scale changes, also verify the approximately 120-World catalog target, A -> B -> C -> A switching, concurrent clients in different Worlds, and bounded lightweight health checks.

## 10. Importer rules

When modifying demo/seed importer:
- preserve JSON/source facts as canonical seed input;
- do not derive Smart Vote source state from a reading;
- do not use display values as persistent identities;
- scope provenance to Release;
- do not delete global real users during scenario reset;
- do not reintroduce broad prefix-based reset logic.

## 11. Temporary compatibility code

Temporary adapter code must be labeled:

```text
TEMPORARY WORLD MIGRATION ADAPTER
removal condition: ...
```

It must not become an undocumented permanent alternate path.

## 12. ADR trigger conditions

ADR required when changing:
- storage isolation strategy;
- World URL/API context strategy;
- global vs World ownership;
- auth/principal/persona model;
- Release semantics;
- cache/task/search scope;
- source-vs-reading semantics;
- default/fallback behavior.

## 13. Documentation drift

When a locked architecture change is accepted:
1. update ADR;
2. update `AI_LOCK.yaml`;
3. update `00_CANONICAL_SPEC.md`;
4. update affected detailed docs;
5. increment architecture version;
6. add migration notes.

Never update only code.

## 14. Implementation drift

CI should verify critical invariants automatically.

The AI should prefer adding executable checks rather than relying only on prose:
- missing World context exceptions;
- schema canaries;
- two-World tests;
- response headers;
- cache key helpers;
- WorldTask base class;
- public fallback-table checks.

## 15. Stop conditions

AI should stop implementation and surface the issue when:
- it cannot determine whether a model is global or World-scoped;
- current code conflicts with two locked invariants;
- a migration would expose existing real user data to a demo World;
- a change requires deleting/moving production tables without a backup/cutover plan;
- requested "optimization" would weaken isolation.

Do not improvise around these conditions.
