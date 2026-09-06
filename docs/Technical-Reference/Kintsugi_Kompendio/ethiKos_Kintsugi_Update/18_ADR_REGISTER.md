# 18 — ADR Register

**File:** `18_ADR_REGISTER.md`
**Doc pack:** ethiKos Kintsugi Update Documentation Pack
**Status:** Draft for parallel documentation generation
**Mode:** Documentation-first architecture planning
**Primary owner:** ethiKos / Kintsugi planning
**Last updated:** 2026-04-25

**Related docs:**

* `00_KINTSUGI_START_HERE.md`
* `01_ETHIKOS_KINTSUGI_EXECUTION_STRATEGY.md`
* `02_SOURCE_OF_TRUTH_AND_DRIFT_CONTROL.md`
* `03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md`
* `04_CANONICAL_NAMING_AND_VARIABLES.md`
* `06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md`
* `07_API_AND_SERVICE_CONTRACTS.md`
* `08_DATA_MODEL_AND_MIGRATION_PLAN.md`
* `09_SMART_VOTE_EKOH_READING_CONTRACT.md`
* `10_FIRST_PASS_INTEGRATION_MATRIX.md`
* `11_MIMIC_VS_ANNEX_RULEBOOK.md`
* `14_FRONTEND_ALIGNMENT_CONTRACT.md`
* `15_BACKEND_ALIGNMENT_CONTRACT.md`
* `20_AI_GENERATION_GUARDRAILS.md`
* `21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md`
* `22_IMPLEMENTATION_BACKLOG_TEMPLATE.md`

---

## 1. Purpose

This document records the **Architecture Decision Records** for the ethiKos Kintsugi upgrade.

Its purpose is to prevent architectural drift during parallel AI-assisted documentation and future implementation work.

Each ADR records:

* the decision;
* the context;
* the consequences;
* the documents affected;
* the anti-drift rule created by the decision.

These ADRs are binding for the Kintsugi documentation pack unless explicitly superseded by a later ADR.

---

## 2. Scope

This ADR register covers decisions about:

* OSS integration strategy;
* ethiKos route stability;
* Korum / Konsultations boundaries;
* Smart Vote and EkoH boundaries;
* Kialo-style argument mapping;
* data model evolution;
* frontend/backend alignment;
* migration sequencing;
* known legacy issues;
* documentation-first workflow.

This ADR register does **not** define:

* final backend code;
* final frontend code;
* complete serializer definitions;
* full endpoint payloads;
* backlog tasks;
* final implementation schedule.

Those belong in the technical contract docs and implementation backlog template.

---

## 3. Canonical Variables Used

```yaml id="adr-vars-001"
DOCUMENT_NAME: "18_ADR_REGISTER.md"
KINTSUGI_UPDATE_TYPE: "documentation-first architecture upgrade"
IMPLEMENTATION_STYLE: "partial native mimic"
FULL_EXTERNAL_MERGE_ALLOWED: false
ANNEX_FIRST_PASS_ALLOWED: false
BIG_BANG_REWRITE_ALLOWED: false

PRIMARY_ROUTE_SURFACE: "/ethikos/*"
PRIMARY_API_PREFIX: "/api/ethikos/*"

KORUM_OWNS:
  - "topics"
  - "stances"
  - "arguments"
  - "argument moderation"

KONSULTATIONS_OWNS:
  - "intake"
  - "ballots"
  - "result snapshots"
  - "impact tracking"

SMART_VOTE_OWNS:
  - "readings"
  - "lens declarations"
  - "aggregations"
  - "result publication"

EKOH_OWNS:
  - "expertise context"
  - "ethics context"
  - "cohort eligibility"
  - "snapshots"

KIALO_STRATEGY: "native_mimic"
KIALO_ROUTE_SCOPE: "/ethikos/deliberate/*"
KIALO_BACKEND_SCOPE: "konnaxion.ethikos"

DOCS_BEFORE_CODE: true
BACKLOG_AFTER_DOCS_AND_CODE_READING: true
```

---

## 4. Source Basis

The current ethiKos implementation already has a concrete `/ethikos/*` frontend route surface with Decide, Deliberate, Trust, Pulse, Impact, Learn, Insights, and Admin route families; the canonical backend scope is currently `/api/ethikos/topics/`, `/api/ethikos/stances/`, `/api/ethikos/arguments/`, and `/api/ethikos/categories/`, backed by `EthikosCategory`, `EthikosTopic`, `EthikosStance`, and `EthikosArgument`. 

The clean-slate plan establishes that the Kintsugi work should be planning-first, not bugfix-first; it explicitly preserves the existing Ethikos frame and route families, rejects a full external merge now, requires partial native mimic, and defers code inspection until docs are stable. 

The boundaries document establishes the core Kintsugi principle: ethiKos keeps a baseline truth while allowing Smart Vote readings/lenses, preserves existing core tables and routes, and adds only non-breaking fields/tables such as reading audit fields, `ExternalArtifact`, `ProjectionMapping`, and drafting tables. 

The Kialo corpus makes Kialo-style structured deliberation relevant as a native mimic target for `/ethikos/deliberate/*`, including discussion topology, participant roles, permissions, sources, navigation surfaces, and claim-oriented workflows. 

---

## 5. ADR Status Values

```yaml id="adr-status-values"
ADR_STATUS_VALUES:
  PROPOSED: "Documented but not yet accepted."
  ACCEPTED: "Binding decision for this documentation pack."
  SUPERSEDED: "Replaced by a later ADR."
  DEPRECATED: "No longer recommended but retained for historical context."
```

Unless otherwise stated, all ADRs in this register are **Accepted**.

---

## 6. ADR Index

| ADR     | Title                                                                          | Status   |
| ------- | ------------------------------------------------------------------------------ | -------- |
| ADR-001 | No full OSS merge for the first Kintsugi pass                                  | Accepted |
| ADR-002 | Existing ethiKos route families remain stable                                  | Accepted |
| ADR-003 | Korum and Konsultations remain separate ownership domains                      | Accepted |
| ADR-004 | Smart Vote publishes readings only                                             | Accepted |
| ADR-005 | EkoH is context, not the voting engine                                         | Accepted |
| ADR-006 | Drafting is a bounded ethiKos capability                                       | Accepted |
| ADR-007 | External tools use mimic first, annex later                                    | Accepted |
| ADR-008 | `/api/home/*` legacy calls must be removed or isolated                         | Accepted |
| ADR-009 | Impact belongs to ethiKos/Konsultations truth, not KeenKonnect truth           | Accepted |
| ADR-010 | Implementation backlog comes after docs and code-reading                       | Accepted |
| ADR-011 | Kialo-style features extend Korum; no separate Kialo module                    | Accepted |
| ADR-012 | Existing Ethikos core models must not be renamed or replaced                   | Accepted |
| ADR-013 | Separate topic stances, claim impact votes, and Smart Vote readings            | Accepted |
| ADR-014 | Kintsugi database changes must be non-breaking additive migrations             | Accepted |
| ADR-015 | Frontend implementation must stay inside the existing shell and services layer | Accepted |
| ADR-016 | Route concepts from older docs are conceptual, not implementation routes       | Accepted |
| ADR-017 | OSS source documents are pattern references, not source-of-truth architecture  | Accepted |
| ADR-018 | Known bugs must not drive Kintsugi architecture                                | Accepted |
| ADR-019 | EkoH migration drift must be treated as a schema-stability concern             | Accepted |
| ADR-020 | ADRs are binding across parallel documentation generation                      | Accepted |

---

# ADR-001 — No full OSS merge for the first Kintsugi pass

**Status:** Accepted
**Date:** 2026-04-25
**Decision owner:** ethiKos Kintsugi planning

## Context

Kintsugi uses inspiration from civic technology systems, including Consider.it, Kialo-style argument mapping, Loomio, Citizen OS, Decidim, CONSUL Democracy, and DemocracyOS.

However, the clean-slate plan explicitly rejects a full external merge for the current pass and preserves the existing ethiKos frame and route families. 

## Decision

The first Kintsugi pass MUST NOT merge any external OSS platform directly into Konnaxion.

The first pass MUST use:

```yaml id="adr-001-decision"
IMPLEMENTATION_STYLE: "partial native mimic"
FULL_EXTERNAL_MERGE_ALLOWED: false
ANNEX_FIRST_PASS_ALLOWED: false
```

## Consequences

* External systems are treated as pattern sources.
* No external app becomes a first-pass dependency.
* No external database schema becomes canonical.
* No external route family becomes canonical.
* Licensing and architectural risk are reduced.
* Implementation remains aligned with the existing Konnaxion stack.

## Anti-drift rule

```txt id="adr-001-rule"
Do not propose a direct merge of Consider.it, Kialo, Loomio, Citizen OS, Decidim, CONSUL Democracy, DemocracyOS, Polis, LiquidFeedback, All Our Ideas, Your Priorities, or OpenSlides into the Konnaxion core.
```

---

# ADR-002 — Existing ethiKos route families remain stable

**Status:** Accepted
**Date:** 2026-04-25
**Decision owner:** ethiKos Kintsugi planning

## Context

The current ethiKos frontend is already implemented under `/ethikos/*` with specific route families: Decide, Deliberate, Trust, Pulse, Impact, Learn, Insights, and Admin. 

Older conceptual docs mention routes such as `/platforms/konnaxion/ethikos`, `/platforms/konnaxion/ethikos/kintsugi`, `/platforms/konnaxion/ethikos/korum`, and `/consult`, but these are not the current implementation route surface. 

## Decision

The Kintsugi upgrade MUST preserve and upgrade the existing `/ethikos/*` route families.

Canonical implementation route families:

```txt id="adr-002-routes"
/ethikos/decide/*
/ethikos/deliberate/*
/ethikos/trust/*
/ethikos/pulse/*
/ethikos/impact/*
/ethikos/learn/*
/ethikos/insights
/ethikos/admin/*
```

## Consequences

* Kintsugi does not create a parallel frontend application.
* Korum maps primarily to `/ethikos/deliberate/*`.
* Konsultations maps across Decide, Impact, and relevant consultation-derived surfaces.
* Smart Vote readings appear through Decide, Results, Insights, and Methodology surfaces.
* EkoH context appears through Trust, Decide, and Insights where appropriate.

## Anti-drift rule

```txt id="adr-002-rule"
Do not replace the existing /ethikos/* route surface with /kintsugi, /kialo, /consult, /platforms/konnaxion/ethikos/*, or any other new first-pass route family.
```

---

# ADR-003 — Korum and Konsultations remain separate ownership domains

**Status:** Accepted
**Date:** 2026-04-25
**Decision owner:** ethiKos Kintsugi planning

## Context

The Kintsugi boundaries define ethiKos as a deliberation and decision-formation module with submodule boundaries. Korum owns structured debates, while Konsultations owns consultation intake, ballots, result snapshots, and impact tracking. 

## Decision

Korum and Konsultations MUST remain distinct ownership domains.

```yaml id="adr-003-ownership"
KORUM_OWNS:
  - "topics"
  - "stances"
  - "arguments"
  - "argument moderation"

KONSULTATIONS_OWNS:
  - "intake"
  - "ballots"
  - "result snapshots"
  - "impact tracking"
```

## Consequences

* Argument graph work belongs to Korum.
* Topic-level stance capture belongs to Korum.
* Formal consultation result snapshots belong to Konsultations.
* Impact tracking belongs to Konsultations.
* Shared objects must have explicit ownership.
* UI pages may combine data from both domains, but write ownership remains separated.

## Anti-drift rule

```txt id="adr-003-rule"
Do not collapse Korum and Konsultations into a generic Debate module or a generic Consultation module without ownership boundaries.
```

---

# ADR-004 — Smart Vote publishes readings only

**Status:** Accepted
**Date:** 2026-04-25
**Decision owner:** ethiKos / Smart Vote planning

## Context

The Kintsugi boundary rule is “single truth, multiple readings”: baseline events remain visible and canonical, while Smart Vote computes explicit readings/lenses over that data. 

## Decision

Smart Vote MUST publish derived readings and MUST NOT mutate upstream source facts.

```yaml id="adr-004-smart-vote"
SMART_VOTE_OWNS:
  - "readings"
  - "lens declarations"
  - "aggregations"
  - "result publication"

SMART_VOTE_MUTATES_SOURCE_FACTS: false
```

## Consequences

* Smart Vote may compute `ReadingResult`.
* Smart Vote may define `LensDeclaration`.
* Smart Vote may publish result interpretations.
* Smart Vote must not rewrite `EthikosStance`.
* Smart Vote must not rewrite `EthikosArgument`.
* Smart Vote must not rewrite Konsultations ballot source events.
* Every non-baseline reading must be declared and reproducible.

## Anti-drift rule

```txt id="adr-004-rule"
Do not implement Smart Vote as a mutation layer over EthikosTopic, EthikosStance, EthikosArgument, ballot events, or baseline results.
```

---

# ADR-005 — EkoH is context, not the voting engine

**Status:** Accepted
**Date:** 2026-04-25
**Decision owner:** ethiKos / EkoH / Smart Vote planning

## Context

Kollective Intelligence provides the cross-module intelligence substrate, including EkoH and Smart Vote concepts. The technical reference identifies EkoH and Smart Vote as part of the broader merit-weighted decision and reputation substrate, while ethiKos remains the structured deliberation and consultation module. 

## Decision

EkoH MUST provide expertise, ethics, cohort, and snapshot context.

EkoH MUST NOT become the voting engine.

```yaml id="adr-005-ekoh"
EKOH_OWNS:
  - "expertise context"
  - "ethics context"
  - "cohort eligibility"
  - "snapshots"

EKOH_IS_VOTING_ENGINE: false
EKOH_MUTATES_VOTES: false
```

## Consequences

* EkoH can provide `snapshot_ref`.
* EkoH can provide expertise and ethics context.
* EkoH can support Smart Vote lenses.
* EkoH cannot mutate baseline votes.
* EkoH cannot replace Smart Vote.
* EkoH cannot own ethiKos decision results.

## Anti-drift rule

```txt id="adr-005-rule"
Do not treat EkoH as the source of ballots, stances, readings, or decision records.
```

---

# ADR-006 — Drafting is a bounded ethiKos capability

**Status:** Accepted
**Date:** 2026-04-25
**Decision owner:** ethiKos Kintsugi planning

## Context

Kintsugi’s civic pipeline includes drafting as a bridge between deliberation and decision. Citizen OS contributes useful patterns for phases and drafting, but the first pass must not merge external systems.

## Decision

Drafting MUST be added as a bounded ethiKos capability using additive models.

First-pass drafting model vocabulary MAY include:

```txt id="adr-006-models"
Draft
DraftVersion
Amendment
RationalePacket
```

## Consequences

* Drafts do not replace topics.
* Draft versions do not replace arguments.
* Amendments do not mutate prior draft versions.
* Drafting remains auditable.
* Drafting can connect Korum deliberation to Decide outcomes.

## Anti-drift rule

```txt id="adr-006-rule"
Do not store draft versions by overwriting EthikosTopic.description or EthikosArgument.content.
```

---

# ADR-007 — External tools use mimic first, annex later

**Status:** Accepted
**Date:** 2026-04-25
**Decision owner:** ethiKos Kintsugi planning

## Context

The Kintsugi strategy distinguishes “mimic” from “annex.” The current first pass is partial native mimic only. External tools may later be represented through boundary objects such as `ExternalArtifact` and `ProjectionMapping`, but they must not write directly to core tables. 

## Decision

The default external tool strategy is native mimic.

Annex is deferred and requires:

```yaml id="adr-007-annex"
ANNEX_REQUIRES_ISOLATION: true
ANNEX_REQUIRES_REPLACEABILITY: true
ANNEX_REQUIRES_NO_CORE_TABLE_WRITES: true
ANNEX_REQUIRES_LICENSE_CLEARANCE: true
ANNEX_REQUIRES_ADAPTER_LAYER: true
```

## Consequences

* First-pass OSS patterns are translated into native Konnaxion concepts.
* External artifacts are optional boundary references, not source truth.
* Future annex integrations must use adapter boundaries.
* No OSS tool is allowed to dominate the ethiKos product shape.

## Anti-drift rule

```txt id="adr-007-rule"
If an OSS pattern conflicts with ethiKos architecture, mimic the pattern only; do not import the architecture.
```

---

# ADR-008 — `/api/home/*` legacy calls must be removed or isolated

**Status:** Accepted
**Date:** 2026-04-25
**Decision owner:** frontend/backend alignment

## Context

Current API guidance requires frontend calls to use the services layer and respect existing `/api/...` prefixes. It explicitly says not to rename `/api/ethikos/...` to invented alternatives and not to use GraphQL or WebSockets for CRUD unless the codebase explicitly does so. 

Some legacy or loose mappings still point to older `/api/home/*` style endpoints in the broader analysis.

## Decision

Kintsugi MUST NOT expand `/api/home/*`.

Any remaining `/api/home/*` usage MUST be:

1. removed;
2. isolated behind compatibility services; or
3. explicitly marked as legacy pending replacement.

## Consequences

* API contracts remain centered on `/api/ethikos/*`.
* New Kintsugi data must not be added under `/api/home/*`.
* Services must be cleaned up before implementation hardening.
* Documentation must not introduce new `/api/home/*` references.

## Anti-drift rule

```txt id="adr-008-rule"
Do not create new Kintsugi service calls against /api/home/*.
```

---

# ADR-009 — Impact belongs to ethiKos/Konsultations truth, not KeenKonnect truth

**Status:** Accepted
**Date:** 2026-04-25
**Decision owner:** ethiKos / Konsultations planning

## Context

Impact surfaces currently exist under `/ethikos/impact/*`. The functional interpretation of the current docs says Impact translates consultations and debates into feedback, outcomes, and tracker views. 

KeenKonnect may own project collaboration and delivery workflows, but civic accountability must remain part of ethiKos/Konsultations truth.

## Decision

Impact tracking for Kintsugi MUST belong to ethiKos/Konsultations.

KeenKonnect MAY receive handoff links or execution references, but it MUST NOT become the canonical owner of ethiKos civic impact.

## Consequences

* `ImpactTrack` belongs to ethiKos/Konsultations.
* `ImpactUpdate` belongs to ethiKos/Konsultations.
* KeenKonnect links are references, not source truth.
* Impact remains accountable to decisions and topics.

## Anti-drift rule

```txt id="adr-009-rule"
Do not make KeenKonnect Project the canonical data source for /ethikos/impact/*.
```

---

# ADR-010 — Implementation backlog comes after docs and code-reading

**Status:** Accepted
**Date:** 2026-04-25
**Decision owner:** Kintsugi planning

## Context

The clean-slate plan defines the work order: refine documentation, add companion docs, inspect downloaded OSS repos, then produce implementation backlog. It explicitly warns against mixing product strategy and low-level code tasks too early. 

## Decision

Implementation backlog MUST be generated only after:

1. core Kintsugi docs are stable;
2. companion docs are drafted;
3. current code is inspected;
4. OSS repo patterns are reviewed against reality.

## Consequences

* Docs remain architectural and normative.
* Backlog tasks do not pollute strategy docs.
* Parallel documentation generation can proceed safely.
* Implementation tasks can later reference stable decisions.

## Anti-drift rule

```txt id="adr-010-rule"
Do not generate backend/frontend implementation tasks inside strategy, boundaries, route, or data model docs except by reference to 22_IMPLEMENTATION_BACKLOG_TEMPLATE.md.
```

---

# ADR-011 — Kialo-style features extend Korum; no separate Kialo module

**Status:** Accepted
**Date:** 2026-04-25
**Decision owner:** Korum / Deliberate planning

## Context

The Kialo corpus provides first-pass inspiration for structured deliberation: discussion topology, participant roles, permissions, sources, navigation, claim structure, and related discussion mechanics. 

The Kintsugi first pass uses native mimic, not direct code import or a separate Kialo module.

## Decision

Kialo-style features MUST extend Korum under `/ethikos/deliberate/*`.

```yaml id="adr-011-kialo"
KIALO_STRATEGY: "native_mimic"
KIALO_ROUTE_SCOPE: "/ethikos/deliberate/*"
KIALO_BACKEND_SCOPE: "konnaxion.ethikos"
CREATE_KIALO_BACKEND_APP: false
CREATE_KIALO_FRONTEND_ROUTE: false
IMPORT_KIALO_CODE: false
```

## Consequences

* Kialo “claims” map conceptually to `EthikosArgument`.
* Kialo discussion topology maps to ethiKos topic settings.
* Kialo participant roles map to ethiKos discussion roles.
* Kialo source/citation behavior maps to `ArgumentSource`.
* No `/kialo` route is created.
* No `konnaxion.kialo` app is created.

## Anti-drift rule

```txt id="adr-011-rule"
Do not create a separate Kialo module, Kialo app, Kialo route family, or Kialo database core in the first pass.
```

---

# ADR-012 — Existing Ethikos core models must not be renamed or replaced

**Status:** Accepted
**Date:** 2026-04-25
**Decision owner:** backend alignment

## Context

The current canonical ethiKos backend uses `EthikosCategory`, `EthikosTopic`, `EthikosStance`, and `EthikosArgument`. 

These are already connected to frontend services and UI behavior.

## Decision

The current core ethiKos models MUST be preserved.

```yaml id="adr-012-models"
PRESERVE_MODELS:
  - "EthikosCategory"
  - "EthikosTopic"
  - "EthikosStance"
  - "EthikosArgument"

RENAME_EXISTING_MODELS: false
DELETE_EXISTING_MODELS: false
REPLACE_EXISTING_MODELS: false
```

## Consequences

* Kintsugi data changes must be additive.
* `EthikosArgument` must not be renamed to `Claim`.
* `EthikosStance` must not be replaced by Smart Vote readings.
* `EthikosTopic` remains the anchor for deliberation and consultation.
* New models may reference existing models.

## Anti-drift rule

```txt id="adr-012-rule"
Do not rename or replace EthikosCategory, EthikosTopic, EthikosStance, or EthikosArgument.
```

---

# ADR-013 — Separate topic stances, claim impact votes, and Smart Vote readings

**Status:** Accepted
**Date:** 2026-04-25
**Decision owner:** data model / Smart Vote / Korum planning

## Context

Current ethiKos stances are topic-level numeric values constrained to `-3..+3`. 

Kialo-style voting introduces claim-level impact voting, which must remain separate from topic-level stances and Smart Vote readings.

## Decision

The Kintsugi data model MUST maintain three separate concepts:

```yaml id="adr-013-votes"
EthikosStance:
  level: "topic-level"
  range: "-3..+3"
  owner: "Korum"

ArgumentImpactVote:
  level: "argument/claim-level"
  range: "0..4"
  owner: "Korum"

ReadingResult:
  level: "derived aggregation"
  range: "lens-dependent"
  owner: "Smart Vote"
```

## Consequences

* Claim impact votes do not alter topic stances.
* Topic stances do not become Smart Vote readings.
* Smart Vote readings are derived from declared inputs.
* Results can be explained without mixing semantics.

## Anti-drift rule

```txt id="adr-013-rule"
EthikosStance != ArgumentImpactVote != ReadingResult.
```

---

# ADR-014 — Kintsugi database changes must be non-breaking additive migrations

**Status:** Accepted
**Date:** 2026-04-25
**Decision owner:** backend/data model alignment

## Context

The boundaries document states that the Kintsugi upgrade is a documentation and boundary upgrade first, and that existing core tables and routes must remain stable. It recommends adding only non-breaking fields/tables such as reading audit fields, external artifact boundaries, and drafting tables. 

## Decision

Kintsugi migrations MUST be additive and non-breaking.

Allowed:

```yaml id="adr-014-allowed"
ADD_NEW_TABLES: true
ADD_NULLABLE_FIELDS: true
ADD_SAFE_DEFAULT_FIELDS: true
ADD_INDEXES: true
ADD_AUDIT_TABLES: true
```

Forbidden:

```yaml id="adr-014-forbidden"
RENAME_EXISTING_TABLES: false
DELETE_EXISTING_TABLES: false
DELETE_EXISTING_FIELDS: false
CHANGE_EXISTING_PRIMARY_KEYS: false
CHANGE_EXISTING_ENDPOINT_SEMANTICS: false
```

## Consequences

* Current data remains readable.
* Migrations can be staged safely.
* Existing smoke tests should continue to pass.
* Kintsugi extensions can be rolled out incrementally.

## Anti-drift rule

```txt id="adr-014-rule"
Do not generate destructive migrations for the Kintsugi first pass.
```

---

# ADR-015 — Frontend implementation must stay inside the existing shell and services layer

**Status:** Accepted
**Date:** 2026-04-25
**Decision owner:** frontend alignment

## Context

The current ethiKos frontend uses `EthikosPageShell` and `PageContainer` consistently, and the route structure is already deeper and more explicit than older simplified navigation concepts. 

API guidance also requires frontend API calls to use the services layer and established `/api/...` routes. 

## Decision

Kintsugi frontend work MUST stay inside the existing ethiKos shell and services layer.

## Consequences

* No second shell is created.
* No second theme system is created.
* Page groups remain under `/ethikos/*`.
* New API calls must go through services.
* Components may be added, but layout ownership remains stable.

## Anti-drift rule

```txt id="adr-015-rule"
Do not create a new Kintsugi shell, Kialo shell, or standalone civic-tech shell for first-pass Kintsugi pages.
```

---

# ADR-016 — Route concepts from older docs are conceptual, not implementation routes

**Status:** Accepted
**Date:** 2026-04-25
**Decision owner:** source-of-truth alignment

## Context

Older Kintsugi and boundaries docs include recommended public surfaces such as `/platforms/konnaxion/ethikos`, `/platforms/konnaxion/ethikos/kintsugi`, and `/consult`. 

The code snapshot and technical reference show the actual implementation route surface under `/ethikos/*`. 

## Decision

Older conceptual route references MAY remain in public strategy docs as conceptual surfaces, but implementation planning MUST target the actual `/ethikos/*` routes.

## Consequences

* Prevents route drift.
* Keeps implementation grounded in the snapshot.
* Allows conceptual docs to discuss future public positioning without breaking current architecture.

## Anti-drift rule

```txt id="adr-016-rule"
When route docs conflict, implementation reality wins over older conceptual route proposals.
```

---

# ADR-017 — OSS source documents are pattern references, not source-of-truth architecture

**Status:** Accepted
**Date:** 2026-04-25
**Decision owner:** OSS code-reading planning

## Context

The first-pass OSS source list includes civic-tech systems whose product ideas are useful, but their architecture, stack, licensing model, or route design may not fit Konnaxion.

## Decision

OSS source documents are pattern references only.

They MUST NOT override:

1. current Konnaxion code reality;
2. Kintsugi boundaries;
3. canonical naming variables;
4. existing ethiKos route families;
5. existing backend app structure.

## Consequences

* OSS review remains useful without causing architectural drift.
* Strong patterns can be mimicked.
* Unfit architecture can be rejected.
* Annexes remain future-only unless explicitly approved.

## Anti-drift rule

```txt id="adr-017-rule"
Do not treat an OSS repo’s native data model, route model, or app architecture as canonical for ethiKos.
```

---

# ADR-018 — Known bugs must not drive Kintsugi architecture

**Status:** Accepted
**Date:** 2026-04-25
**Decision owner:** Kintsugi planning

## Context

The clean-slate baseline carries one known visible bug: the Deliberate preview drawer shows “Preview / No data”. The plan explicitly frames the next phase as Kintsugi planning, not broad bugfixing. 

## Decision

Known bugs MUST be tracked separately from Kintsugi architecture.

The preview drawer issue is classified as:

```yaml id="adr-018-bug"
BUG_001:
  title: "Deliberate preview drawer shows 'Preview / No data'"
  classification: "targeted_bugfix_not_architecture"
```

## Consequences

* The architecture is not redesigned around one drawer bug.
* The bug can be fixed with a targeted service/UI correction.
* Documentation remains focused on Kintsugi upgrade contracts.

## Anti-drift rule

```txt id="adr-018-rule"
Do not use BUG_001 to justify redesigning Deliberate, Korum, Ethikos routes, or the data model.
```

---

# ADR-019 — EkoH migration drift must be treated as a schema-stability concern

**Status:** Accepted
**Date:** 2026-04-25
**Decision owner:** backend/schema alignment

## Context

The stable baseline says EkoH migration `0002` was created and applied. The clean-slate plan also mentions verifying EkoH model source and GiST/index setup so future `makemigrations` does not drift again. 

## Decision

EkoH migration drift must be treated as a schema-stability issue, not a Kintsugi feature design issue.

## Consequences

* Future EkoH migration changes require explicit review.
* Kintsugi docs may reference EkoH snapshots, but should not rewrite EkoH schema casually.
* Schema drift prevention belongs in backend alignment and test/smoke contracts.

## Anti-drift rule

```txt id="adr-019-rule"
Do not generate new EkoH schema changes for Kintsugi unless they are explicitly required by the Smart Vote/EkoH reading contract and verified against current migrations.
```

---

# ADR-020 — ADRs are binding across parallel documentation generation

**Status:** Accepted
**Date:** 2026-04-25
**Decision owner:** documentation governance

## Context

The Kintsugi documentation pack is being generated in parallel conversations. Parallel generation creates a high risk of naming drift, scope drift, route drift, and model drift.

## Decision

This ADR register is binding across all parallel documentation generation.

If another generated doc conflicts with this ADR register, resolve as follows:

```yaml id="adr-020-conflict"
IF_CONFLICT_WITH_CODE_SNAPSHOT: "Code snapshot wins for implementation reality."
IF_CONFLICT_WITH_BOUNDARIES_DOC: "Boundaries doc wins for ownership and write rules."
IF_CONFLICT_WITH_CANONICAL_VARIABLES: "Canonical variables win for naming and constants."
IF_CONFLICT_WITH_ADR_REGISTER: "ADR register wins for architectural decisions."
IF_CONFLICT_WITH_OSS_DOC: "ADR register wins; OSS remains pattern reference only."
```

## Consequences

* Parallel docs can be reconciled.
* AI-generated content has a governance layer.
* Drift is easier to detect and correct.
* Later ADRs can supersede earlier ADRs explicitly.

## Anti-drift rule

```txt id="adr-020-rule"
Every generated Kintsugi document must comply with this ADR register or explicitly mark a proposed conflict for review.
```

---

## 7. ADR Template for Future Decisions

Use this template for any new ADR.

```md id="adr-template"
# ADR-XXX — Title

**Status:** Proposed | Accepted | Superseded | Deprecated  
**Date:** YYYY-MM-DD  
**Decision owner:** <owner>

## Context

Describe the problem, prior constraints, current implementation reality, and relevant documents.

## Decision

State the decision clearly.

## Consequences

List positive, negative, and neutral consequences.

## Alternatives considered

List alternatives and why they were rejected or deferred.

## Related docs

- `...`

## Anti-drift rule

State the future rule created by this ADR.
```

---

## 8. Supersession Policy

An ADR may only be superseded by another ADR.

A superseding ADR MUST include:

```yaml id="supersession-policy"
SUPERSEDES: "ADR-XXX"
REASON: "Clear reason for replacement"
MIGRATION_IMPACT: "none | docs-only | code-required | data-migration-required"
```

Old ADRs MUST remain in the register for historical traceability.

---

## 9. Anti-Drift Summary

The following rules summarize the current ADR set:

```txt id="adr-summary-rules"
Do not full-merge OSS platforms.
Do not replace /ethikos/* routes.
Do not create a separate Kialo module.
Do not rename EthikosArgument to Claim.
Do not collapse EthikosStance, ArgumentImpactVote, and ReadingResult.
Do not let Smart Vote mutate source facts.
Do not turn EkoH into a voting engine.
Do not let external tools write core ethiKos tables.
Do not expand /api/home/*.
Do not make KeenKonnect the canonical owner of civic impact.
Do not generate implementation backlog before docs and code-reading.
Do not create destructive migrations.
Do not use known bugs as architecture drivers.
```

---

## 10. Related Documents

This ADR register must be read together with:

```txt id="related-docs"
00_KINTSUGI_START_HERE.md
01_ETHIKOS_KINTSUGI_EXECUTION_STRATEGY.md
02_SOURCE_OF_TRUTH_AND_DRIFT_CONTROL.md
03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md
04_CANONICAL_NAMING_AND_VARIABLES.md
06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md
07_API_AND_SERVICE_CONTRACTS.md
08_DATA_MODEL_AND_MIGRATION_PLAN.md
09_SMART_VOTE_EKOH_READING_CONTRACT.md
10_FIRST_PASS_INTEGRATION_MATRIX.md
11_MIMIC_VS_ANNEX_RULEBOOK.md
14_FRONTEND_ALIGNMENT_CONTRACT.md
15_BACKEND_ALIGNMENT_CONTRACT.md
20_AI_GENERATION_GUARDRAILS.md
21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md
22_IMPLEMENTATION_BACKLOG_TEMPLATE.md
```

---

## 11. Final Register Statement

The ethiKos Kintsugi upgrade is a documentation-first, architecture-controlled, non-breaking expansion of the existing ethiKos module.

The binding direction is:

```txt id="final-direction"
partial native mimic
no full OSS merge
existing /ethikos/* routes preserved
existing core Ethikos models preserved
Korum and Konsultations separated
Smart Vote as readings only
EkoH as context only
Kialo-style as native Deliberate/Korum pattern
implementation backlog after docs and code-reading
```

Any generated document or implementation plan that violates this register must be corrected before use.

---

## ADR-012 — EkoH owns rating disclosure without becoming a second RBAC system

**Status:** Accepted — 2026-08-20

**Decision:** EkoH owns disclosure of EkoH-owned ratings through `RatingVisibilitySetting`, generic hierarchical `RatingAccessScope`, `RatingScopeSubject`, and `RatingAccessGrant`. EkoH does not define business roles such as CEO or Supervisor and does not duplicate Konnaxion identity/permission systems. Identity visibility remains separate in `ConfidentialitySetting`; contextual influence remains owned by Smart Vote readings.

**Reason:** public figures may require publicly reviewable ratings, while organisational use requires bounded access such as enterprise-wide leadership and department-only supervision. A generic scope/grant model satisfies both without coupling EkoH to Ethikos, Team Builder, KeenKonnect, Kontrol, or a specific HR schema.

**Contract:** `27_EKOH_RATING_VISIBILITY_AND_ACCESS_CONTRACT.md`.

