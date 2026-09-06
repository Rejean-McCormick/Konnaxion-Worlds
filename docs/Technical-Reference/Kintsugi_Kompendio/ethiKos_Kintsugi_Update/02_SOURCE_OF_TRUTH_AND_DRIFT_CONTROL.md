# 02 — Source of Truth and Drift Control

**Project:** Konnaxion  
**Module:** ethiKos  
**Upgrade:** Kintsugi  
**Document ID:** `02_SOURCE_OF_TRUTH_AND_DRIFT_CONTROL.md`  
**Status:** Canonical planning contract  
**Version:** `2026-04-25-kintsugi-doc-pack-v1`  
**Audience:** Human maintainers, AI assistants, implementation agents, documentation generators  
**Purpose:** Prevent architectural, naming, route, model, API, and scope drift while generating and implementing the ethiKos Kintsugi upgrade.

---

## 1. Purpose

This document defines the **source-of-truth hierarchy** and **drift-control rules** for the complete ethiKos Kintsugi upgrade documentation pack.

The Kintsugi upgrade is intentionally being documented before implementation so that future AI-assisted work does not:

- invent new route families;
- rename existing backend models;
- bypass current services;
- import external civic-tech architectures directly;
- confuse Korum, Konsultations, Smart Vote, and EkoH ownership;
- turn Smart Vote readings into source facts;
- turn EkoH into a voting engine;
- mistake Kialo-style impact voting for topic-level stance voting;
- generate implementation backlog before the contracts are stable.

This document is binding for all other Kintsugi documentation files.

If any generated file conflicts with this document, this document wins unless explicitly superseded by a later human-approved ADR.

---

## 2. Scope

This document governs:

- documentation generation;
- parallel AI conversation generation;
- source priority;
- conflict resolution;
- canonical naming;
- first-pass scope;
- deferred scope;
- code-vs-doc interpretation;
- OSS mimic-vs-annex interpretation;
- route, API, model, frontend, and backend drift prevention.

This document does **not** define the full implementation plan. It defines the rules that all implementation plans must obey.

---

## 3. Canonical Variables Used

The following variables are binding across the complete Kintsugi documentation pack.

```yaml
PROJECT:
  PLATFORM_NAME: "Konnaxion"
  MODULE_NAME: "ethiKos"
  UPDATE_NAME: "Kintsugi"
  FULL_UPDATE_NAME: "ethiKos Kintsugi Upgrade"

GENERATION:
  DOCS_BEFORE_CODE: true
  CODE_INSPECTION_AFTER_DOCS: true
  BACKLOG_AFTER_DOCS_AND_CODE_READING: true
  GENERATE_ONE_FILE_PER_PARALLEL_CONVERSATION: true
  DO_NOT_REINTERPRET_SCOPE: true

STRATEGY:
  IMPLEMENTATION_STYLE: "partial native mimic"
  FULL_EXTERNAL_MERGE_ALLOWED: false
  ANNEX_FIRST_PASS_ALLOWED: false
  BIG_BANG_REWRITE_ALLOWED: false
  EXISTING_ETHIKOS_FRAME_STABLE: true
  EXISTING_ROUTE_FAMILIES_STABLE: true

PRIMARY_ROUTE_SURFACE:
  ETHIKOS: "/ethikos/*"
  DELIBERATE: "/ethikos/deliberate/*"
  DECIDE: "/ethikos/decide/*"
  IMPACT: "/ethikos/impact/*"
  TRUST: "/ethikos/trust/*"
  PULSE: "/ethikos/pulse/*"
  LEARN: "/ethikos/learn/*"
  INSIGHTS: "/ethikos/insights"
  ADMIN: "/ethikos/admin/*"

OWNERSHIP:
  KORUM_OWNS:
    - "topics"
    - "arguments"
    - "argument graph"
    - "topic-level stances"
    - "debate moderation"
  KONSULTATIONS_OWNS:
    - "intake"
    - "consultations"
    - "ballots"
    - "result snapshots"
    - "impact tracking"
  SMART_VOTE_OWNS:
    - "readings"
    - "lens declarations"
    - "derived aggregations"
    - "result publication"
  EKOH_OWNS:
    - "expertise context"
    - "ethics context"
    - "cohort eligibility"
    - "snapshot context"

WRITE_RULES:
  FOREIGN_TOOLS_WRITE_CORE_TABLES: false
  SMART_VOTE_MUTATES_SOURCE_FACTS: false
  EKOH_IS_VOTING_ENGINE: false
  WEIGHTED_OUTCOME_REQUIRES_REPRODUCIBILITY: true

FIRST_PASS_OSS_SCOPE:
  - "Consider.it"
  - "Kialo-style argument mapping"
  - "Loomio"
  - "Citizen OS"
  - "Decidim"
  - "CONSUL Democracy"
  - "DemocracyOS"

DEFERRED_OSS_SCOPE:
  - "Polis"
  - "LiquidFeedback"
  - "All Our Ideas"
  - "Your Priorities"
  - "OpenSlides"
````

---

## 4. Source-of-Truth Hierarchy

All Kintsugi documents and future implementation tasks MUST obey the following priority order.

When two sources conflict, the higher-priority source wins.

---

### 4.1 Priority 1 — Current Code Snapshot Reality

The current Konnaxion code snapshot is the source of truth for:

* existing frontend routes;
* existing backend apps;
* existing API prefixes;
* existing DRF routers;
* existing models;
* existing serializers;
* existing services;
* existing shell/layout patterns;
* existing smoke-test reality;
* known implementation gaps;
* known legacy calls.

The code snapshot wins for implementation reality.

#### Examples

If a strategy document suggests a route such as:

```txt
/platforms/konnaxion/ethikos/kintsugi
```

but the actual frontend has:

```txt
/ethikos/decide/*
/ethikos/deliberate/*
/ethikos/impact/*
```

then the implementation plan MUST use the real `/ethikos/*` routes.

If a generated document suggests GraphQL or WebSocket CRUD for basic Ethikos objects, but the backend currently exposes Django REST Framework ViewSets under `/api/ethikos/...`, the generated document is wrong.

---

### 4.2 Priority 2 — Boundaries and Ownership Contract

The boundaries document is the source of truth for:

* ethiKos pipeline stages;
* Korum ownership;
* Konsultations ownership;
* Smart Vote ownership;
* EkoH ownership;
* baseline vs reading separation;
* foreign tool boundaries;
* Mimic vs Annex strategy;
* canonical objects;
* audit requirements;
* write rules.

The boundaries document wins for ownership and legitimacy rules.

#### Binding principle

```txt
Single truth, multiple readings.
```

This means:

* the baseline outcome remains visible;
* raw source events remain canonical;
* Smart Vote readings are derived;
* weighted/filtered outputs must be declared and reproducible;
* EkoH provides context, not votes.

---

### 4.3 Priority 3 — Clean-Slate Kintsugi Planning Context

The clean-slate planning context is the source of truth for:

* first-pass scope;
* deferred scope;
* no full external merge;
* partial native mimic;
* docs before code inspection;
* code inspection before backlog;
* Kintsugi planning focus instead of bugfixing.

The clean-slate plan wins for this upgrade’s execution order.

#### Binding rule

```txt
This phase is Kintsugi planning, not general bugfixing.
```

The only known bug that should remain visible in the Kintsugi documentation is:

```txt
Deliberate preview drawer shows "Preview / No data"
```

This bug must be tracked as a known targeted defect, not as a reason to redesign the architecture.

---

### 4.4 Priority 4 — Kialo Core Documentation

The Kialo core documentation is the source of truth for the Kialo-style structured deliberation pattern.

It governs:

* discussions;
* theses;
* claims;
* pro/con claim relations;
* sources;
* impact voting;
* guided voting;
* perspectives;
* minimaps;
* anonymous participation;
* participant roles;
* suggestions;
* templates;
* exports;
* small group patterns.

Kialo is a first-pass inspiration source, but it MUST be implemented as native mimic inside ethiKos/Korum.

#### Binding rule

```txt
Kialo-style features extend /ethikos/deliberate/*.
They do not create a new Kialo module.
```

---

### 4.5 Priority 5 — First-Pass OSS Source Documents

The following OSS source documents are inspiration sources only:

* Consider.it;
* Loomio;
* Citizen OS;
* Decidim;
* CONSUL Democracy;
* DemocracyOS.

They may influence:

* user experience;
* workflow patterns;
* data modeling;
* permissions;
* lifecycle concepts;
* audit concepts;
* accountability patterns.

They MUST NOT override:

* current Ethikos routes;
* current backend ownership;
* the Korum/Konsultations/Smart Vote/EkoH split;
* the no-full-merge rule;
* the source-of-truth hierarchy.

---

### 4.6 Priority 6 — Older Master Strategy Drafts

Older master Kintsugi drafts are useful for framing and public narrative.

They are not authoritative when they conflict with:

* current code;
* boundaries;
* clean-slate scope;
* current route reality;
* first-pass/deferred source distinctions.

Older docs MUST be corrected before reuse if they imply that the following are first-pass implementation targets:

* Polis;
* LiquidFeedback;
* All Our Ideas;
* Your Priorities;
* OpenSlides.

For this upgrade, those are deferred.

---

## 5. Conflict Resolution Rules

When a contradiction appears, apply these rules in order.

---

### 5.1 Code vs Documentation

```yaml
IF_A_DOC_CONFLICTS_WITH_CODE_SNAPSHOT:
  IMPLEMENTATION_REALITY: "code snapshot wins"
  ACTION: "Update the doc or mark the doc as conceptual only."
```

Example:

* A doc proposes a route that does not exist.
* The code already has `/ethikos/deliberate/[topic]`.
* The generated plan MUST target `/ethikos/deliberate/[topic]`.

---

### 5.2 Boundaries vs OSS Pattern

```yaml
IF_AN_OSS_PATTERN_CONFLICTS_WITH_BOUNDARIES:
  OWNERSHIP_REALITY: "boundaries document wins"
  ACTION: "Mimic the useful pattern without importing ownership, architecture, or data mutation rules."
```

Example:

* An OSS tool stores votes directly in its own proposal model.
* Ethikos must preserve Korum/Konsultations/Smart Vote ownership.
* The OSS pattern may inspire UX, but not source-of-truth mutation.

---

### 5.3 Kialo Vocabulary vs Ethikos Backend

```yaml
IF_KIALO_TERMS_CONFLICT_WITH_ETHIKOS_MODELS:
  BACKEND_REALITY: "Ethikos models win"
  ACTION: "Use Kialo terms as UX/conceptual language only."
```

Example:

* Kialo uses `Claim`.
* Current backend uses `EthikosArgument`.
* Do not rename `EthikosArgument` to `Claim`.

Correct mapping:

```txt
Kialo Claim = conceptual UX object
EthikosArgument = backend model
```

---

### 5.4 Smart Vote vs Source Facts

```yaml
IF_A_READING_CONFLICTS_WITH_BASELINE_EVENTS:
  SOURCE_FACT_REALITY: "baseline events win"
  ACTION: "Mark reading as derived, lens-bound, and reproducible."
```

Smart Vote readings do not replace the baseline.

They are declared transformations over source events.

---

### 5.5 EkoH vs Voting

```yaml
IF_EKOH_IS_USED_AS_A_VOTING_ENGINE:
  RESULT: "invalid design"
  ACTION: "Move EkoH role back to expertise/ethics/snapshot context."
```

EkoH may influence declared readings through context.

EkoH does not own ballots, stances, or final votes.

---

### 5.6 Parallel AI Output Conflict

```yaml
IF_TWO_PARALLEL_DOCS_DISAGREE:
  FIRST: "Check this document."
  SECOND: "Check canonical naming variables."
  THIRD: "Check boundaries document."
  FOURTH: "Check code snapshot."
  ACTION: "Patch the lower-priority doc."
```

Parallel generation MUST NOT be resolved by inventing a compromise.

It must be resolved by source priority.

---

## 6. Drift Types to Prevent

The following drift types are explicitly forbidden.

---

### 6.1 Route Drift

Route drift occurs when a generated document invents or prioritizes routes that do not match the current frontend.

Forbidden examples:

```txt
/kialo
/kintsugi
/platforms/konnaxion/ethikos/kintsugi
/api/deliberation/*
/api/kialo/*
```

Canonical implementation routes:

```txt
/ethikos/decide/*
/ethikos/deliberate/*
/ethikos/trust/*
/ethikos/pulse/*
/ethikos/impact/*
/ethikos/learn/*
/ethikos/insights
/ethikos/admin/*
```

---

### 6.2 Backend App Drift

Backend app drift occurs when a generated document creates new backend apps without need.

Forbidden first-pass apps:

```txt
konnaxion.kialo
konnaxion.kintsugi
konnaxion.considerit
konnaxion.loomio
konnaxion.decidim
konnaxion.consul
konnaxion.democracyos
```

Canonical backend apps to respect:

```txt
konnaxion.ethikos
konnaxion.kollective_intelligence
konnaxion.ekoh
konnaxion.users
```

Kialo-style features MUST extend `konnaxion.ethikos` in first pass.

---

### 6.3 Model Naming Drift

Model naming drift occurs when generated docs rename existing models or create duplicate concepts.

Existing models MUST remain:

```txt
EthikosCategory
EthikosTopic
EthikosStance
EthikosArgument
```

Forbidden replacements:

```txt
Claim instead of EthikosArgument
DebatePost instead of EthikosArgument
Opinion instead of EthikosStance
KialoDiscussion instead of EthikosTopic
```

Allowed conceptual mappings:

```txt
Kialo Discussion -> EthikosTopic
Kialo Thesis -> EthikosTopic prompt/title/description
Kialo Claim -> EthikosArgument
Kialo Pro/Con edge -> EthikosArgument.parent + EthikosArgument.side
```

---

### 6.4 Vote Semantics Drift

Vote semantics drift occurs when different vote types are merged.

The following MUST remain separate.

| Type                 | Owner         | Level                 | Range / Form      | Meaning                         |
| -------------------- | ------------- | --------------------- | ----------------- | ------------------------------- |
| `EthikosStance`      | Korum         | Topic                 | `-3..+3`          | User stance on topic            |
| `ArgumentImpactVote` | Korum         | Argument/claim        | `0..4`            | Impact of a claim on its parent |
| `BallotEvent`        | Konsultations | Consultation/decision | Protocol-specific | Formal decision input           |
| `ReadingResult`      | Smart Vote    | Derived result        | Lens-specific     | Published derived aggregation   |

Forbidden equivalences:

```txt
ArgumentImpactVote = EthikosStance
ArgumentImpactVote = BallotEvent
ReadingResult = source fact
EkoH snapshot = vote
```

---

### 6.5 Ownership Drift

Ownership drift occurs when a document assigns responsibility to the wrong layer.

Correct ownership:

```txt
Korum:
  - topics
  - arguments
  - argument graph
  - topic-level stances
  - debate moderation

Konsultations:
  - intake
  - consultations
  - ballots
  - result snapshots
  - impact tracking

Smart Vote:
  - derived readings
  - lens declarations
  - aggregations
  - result publication

EkoH:
  - expertise context
  - ethics context
  - cohort eligibility
  - snapshot context
```

Forbidden ownership changes:

```txt
Smart Vote owns source ballots
EkoH owns votes
KeenKonnect owns Ethikos impact truth
Foreign OSS tools write Korum core tables
Foreign OSS tools write Konsultations core tables
```

---

### 6.6 OSS Scope Drift

OSS scope drift occurs when deferred sources are reintroduced into first-pass implementation.

First-pass sources:

```txt
Consider.it
Kialo-style argument mapping
Loomio
Citizen OS
Decidim
CONSUL Democracy
DemocracyOS
```

Deferred sources:

```txt
Polis
LiquidFeedback
All Our Ideas
Your Priorities
OpenSlides
```

Deferred means:

* may receive public credit;
* may be mentioned as future inspiration;
* must not drive first-pass data models;
* must not drive first-pass routes;
* must not become an implementation dependency.

---

### 6.7 API Drift

API drift occurs when generated docs create endpoints that bypass current contracts.

Canonical current endpoints:

```txt
/api/ethikos/topics/
/api/ethikos/stances/
/api/ethikos/arguments/
/api/ethikos/categories/
/api/kollective/votes/
```

Compatibility aliases:

```txt
/api/deliberate/...
/api/deliberate/elite/...
```

Problematic legacy prefix:

```txt
/api/home/*
```

Rules:

* Do not expand `/api/home/*`.
* Do not rename `/api/ethikos/*` to `/api/deliberation/*`.
* Do not introduce GraphQL for core Ethikos CRUD in this upgrade.
* Do not bypass the frontend service layer.

---

### 6.8 Frontend Shell Drift

Frontend shell drift occurs when generated pages create layout systems outside the existing module shell.

Rules:

```txt
Use existing global layout.
Use existing Ethikos shell.
Do not create a second Ethikos shell.
Do not create a Kintsugi shell.
Do not create a Kialo shell.
Do not create a second theme system.
Do not duplicate top-level navigation.
```

Kialo-style UX must live under:

```txt
/ethikos/deliberate/*
```

---

### 6.9 Backlog Drift

Backlog drift occurs when a planning document starts creating implementation tasks prematurely.

Only the following document may define backlog template structure:

```txt
22_IMPLEMENTATION_BACKLOG_TEMPLATE.md
```

Implementation tasks MUST be generated only after:

1. documentation contracts are stable;
2. code inspection is complete;
3. route/API/model reality is verified;
4. ownership boundaries are confirmed.

---

## 7. Canonical Interpretation of External Sources

This section defines how each external source may influence the Kintsugi upgrade.

---

### 7.1 Consider.it

Status:

```txt
first_pass_mimic
```

Allowed influence:

* reason capture;
* pro/con comparison;
* deliberation compression;
* participant reasoning clarity.

Forbidden influence:

* direct code import;
* independent data ownership;
* replacement of Korum.

Target:

```txt
/ethikos/deliberate/*
```

---

### 7.2 Kialo-Style Argument Mapping

Status:

```txt
first_pass_mimic
```

Allowed influence:

* thesis/claim structure;
* argument tree;
* pro/con edges;
* source attachment;
* claim impact voting;
* minimap concept;
* guided voting concept;
* participant roles;
* suggestions;
* anonymity settings;
* perspectives.

Forbidden influence:

* renaming `EthikosArgument`;
* creating `/kialo` routes;
* creating `konnaxion.kialo`;
* treating claim impact votes as topic stances;
* treating claim impact votes as Smart Vote ballots.

Target:

```txt
/ethikos/deliberate/*
```

---

### 7.3 Loomio

Status:

```txt
first_pass_mimic
```

Allowed influence:

* proposal lifecycle;
* decision protocols;
* time-boxed decision flow;
* consent/objection patterns;
* outcome publication.

Forbidden influence:

* replacing current auth;
* replacing current Ethikos routes;
* importing Loomio architecture.

Target:

```txt
/ethikos/decide/*
```

---

### 7.4 Citizen OS

Status:

```txt
first_pass_mimic
```

Allowed influence:

* collaborative drafting;
* versioning;
* amendments;
* topic phase progression.

Forbidden influence:

* direct Etherpad integration in first pass unless separately approved;
* replacing Ethikos route structure;
* creating a foreign drafting truth source.

Target:

```txt
Drafting capability under ethiKos, likely connected to /ethikos/decide/* and /ethikos/deliberate/*
```

---

### 7.5 Decidim

Status:

```txt
first_pass_mimic
```

Allowed influence:

* participatory process phases;
* accountability;
* admin governance;
* public process traceability;
* components concept.

Forbidden influence:

* importing Decidim architecture;
* creating a parallel process engine outside Ethikos;
* overriding current Django/Next architecture.

Targets:

```txt
/ethikos/impact/*
/ethikos/admin/*
/ethikos/pulse/*
```

---

### 7.6 CONSUL Democracy

Status:

```txt
first_pass_mimic
```

Allowed influence:

* eligibility;
* thresholds;
* proposal gating;
* civic participation rules;
* administration concepts.

Forbidden influence:

* importing Rails architecture;
* making CONSUL the process owner;
* replacing Ethikos/Konsultations ownership.

Targets:

```txt
/ethikos/decide/*
/ethikos/admin/*
```

---

### 7.7 DemocracyOS

Status:

```txt
first_pass_mimic
```

Allowed influence:

* proposal-centric debate;
* policy discussion;
* forum/space visibility;
* role-based participation.

Forbidden influence:

* importing Node/Mongo architecture;
* replacing Korum;
* replacing current proposal/decision route structure.

Targets:

```txt
/ethikos/decide/*
/ethikos/deliberate/*
```

---

## 8. Source Priority Matrix

| Source                | Priority | Controls                           | May Override Code? | May Override Boundaries? |
| --------------------- | -------: | ---------------------------------- | ------------------ | ------------------------ |
| Current code snapshot |        1 | Implementation reality             | Yes                | No                       |
| Boundaries document   |        2 | Ownership, write rules, legitimacy | No                 | Yes                      |
| Clean-slate plan      |        3 | Execution scope and sequencing     | No                 | No                       |
| Kialo core docs       |        4 | Structured deliberation pattern    | No                 | No                       |
| First-pass OSS docs   |        5 | Pattern inspiration                | No                 | No                       |
| Older master drafts   |        6 | Narrative framing                  | No                 | No                       |

---

## 9. Required Cross-Document References

Every generated Kintsugi document SHOULD include a `Related Docs` section.

The following references SHOULD be used consistently.

```txt
00_KINTSUGI_START_HERE.md
02_SOURCE_OF_TRUTH_AND_DRIFT_CONTROL.md
03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md
04_CANONICAL_NAMING_AND_VARIABLES.md
20_AI_GENERATION_GUARDRAILS.md
21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md
```

Technical documents SHOULD also reference:

```txt
05_CURRENT_STATE_BASELINE.md
06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md
07_API_AND_SERVICE_CONTRACTS.md
08_DATA_MODEL_AND_MIGRATION_PLAN.md
09_SMART_VOTE_EKOH_READING_CONTRACT.md
12_CANONICAL_OBJECTS_AND_EVENTS.md
13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md
14_FRONTEND_ALIGNMENT_CONTRACT.md
15_BACKEND_ALIGNMENT_CONTRACT.md
16_TEST_AND_SMOKE_CONTRACT.md
```

---

## 10. Parallel Generation Rules

Because this documentation pack may be generated across multiple AI conversations, the following rules are mandatory.

### 10.1 One File Per Conversation

Each parallel conversation MUST generate exactly one assigned file.

Do not ask one conversation to generate the entire pack.

### 10.2 Paste Canonical Variables First

Each parallel conversation MUST begin with the canonical variables block from:

```txt
04_CANONICAL_NAMING_AND_VARIABLES.md
```

Until that file exists, use the canonical variable block approved in planning.

### 10.3 Do Not Reinterpret Scope

Each parallel conversation MUST treat the following as fixed:

```txt
FULL_EXTERNAL_MERGE_ALLOWED = false
ANNEX_FIRST_PASS_ALLOWED = false
IMPLEMENTATION_STYLE = partial_native_mimic
PRIMARY_ROUTE_SURFACE = /ethikos/*
FIRST_PASS_SCOPE = Consider.it, Kialo-style, Loomio, Citizen OS, Decidim, CONSUL Democracy, DemocracyOS
DEFERRED_SCOPE = Polis, LiquidFeedback, All Our Ideas, Your Priorities, OpenSlides
```

### 10.4 Do Not Generate Backlog Prematurely

No generated document may create implementation tasks unless the assigned file is:

```txt
22_IMPLEMENTATION_BACKLOG_TEMPLATE.md
```

Other documents may define requirements, contracts, constraints, mappings, and risks.

---

## 11. AI Drift-Control Checklist

Every AI-generated Kintsugi document MUST pass this checklist.

### 11.1 Scope Check

* [ ] Does the document keep `partial_native_mimic` as the implementation style?
* [ ] Does the document avoid full OSS merge?
* [ ] Does the document keep annex/sidecar tools deferred?
* [ ] Does the document keep Polis, LiquidFeedback, All Our Ideas, Your Priorities, and OpenSlides out of first pass?

### 11.2 Route Check

* [ ] Does the document target `/ethikos/*`?
* [ ] Does it avoid `/kialo`, `/kintsugi`, and `/api/deliberation/*`?
* [ ] Does it map work to Decide, Deliberate, Trust, Pulse, Impact, Learn, Insights, and Admin?

### 11.3 Backend Check

* [ ] Does the document preserve `konnaxion.ethikos`?
* [ ] Does it avoid creating `konnaxion.kialo`?
* [ ] Does it preserve `EthikosTopic`, `EthikosStance`, `EthikosArgument`, and `EthikosCategory`?
* [ ] Does it use DRF ViewSet/Serializer/Router as the default backend style?

### 11.4 Ownership Check

* [ ] Does Korum own arguments and topic stances?
* [ ] Does Konsultations own intake, ballots, results, and impact?
* [ ] Does Smart Vote own readings only?
* [ ] Does EkoH remain context, not voting?

### 11.5 Vote Semantics Check

* [ ] Is `EthikosStance` kept distinct from `ArgumentImpactVote`?
* [ ] Is `ArgumentImpactVote` kept distinct from `BallotEvent`?
* [ ] Is `ReadingResult` kept distinct from source facts?
* [ ] Are Smart Vote readings reproducible?

### 11.6 Kialo Check

* [ ] Is Kialo treated as native mimic?
* [ ] Are Kialo features scoped to `/ethikos/deliberate/*`?
* [ ] Is `Claim` mapped conceptually to `EthikosArgument`?
* [ ] Are anonymous identities protected?
* [ ] Are suggested claims moderated by role?

### 11.7 Frontend Check

* [ ] Does the document preserve the existing shell?
* [ ] Does it avoid a second theme system?
* [ ] Does it use the services layer?
* [ ] Does it avoid raw fetch from page components unless explicitly documented?

---

## 12. Invalid Output Patterns

The following outputs are invalid and MUST be rejected.

```txt
"Create a new /kintsugi app."
"Create a new /kialo route family."
"Rename EthikosArgument to Claim."
"Move Ethikos deliberation to a new konnaxion.kialo backend app."
"Use Smart Vote to mutate stances."
"Use EkoH as the voting engine."
"Import Decidim/Loomio/CONSUL directly into Konnaxion."
"Replace /api/ethikos/topics/ with /api/deliberation/topics/."
"Implement Polis in first pass."
"Use /api/home/* as the new canonical API."
"Generate the implementation backlog before code inspection."
```

---

## 13. Valid Output Patterns

The following patterns are valid.

```txt
"Map Kialo Claim to EthikosArgument conceptually."
"Add ArgumentImpactVote as a separate claim-level vote type."
"Keep EthikosStance as topic-level -3..+3 stance."
"Use Smart Vote readings as derived, reproducible outputs."
"Use EkoH snapshots as context for declared readings."
"Extend /ethikos/deliberate/[topic] with argument-tree UX."
"Extend /ethikos/decide/results with baseline vs lens readings."
"Use Decidim as inspiration for /ethikos/impact/* accountability."
"Use CONSUL as inspiration for eligibility and thresholds."
"Use Loomio as inspiration for decision lifecycle."
"Use Citizen OS as inspiration for drafting/versioning."
"Keep all OSS sources as mimic-only in first pass."
```

---

## 14. Review Procedure Before Generating Any Doc

Before generating any file in the Kintsugi documentation pack, perform this review:

1. Identify the assigned filename.
2. Read the canonical variables.
3. Confirm the document’s scope.
4. Confirm which source priorities apply.
5. Confirm whether the doc is:

   * anti-drift;
   * strategy;
   * route/product;
   * technical contract;
   * OSS reading plan;
   * backlog template.
6. Generate only content relevant to that file.
7. Do not redefine global scope unless that is the assigned purpose.
8. Add anti-drift rules.
9. Add related docs.
10. Check against the invalid output patterns.

---

## 15. Non-Goals

This document does not:

* implement code;
* define database migrations in detail;
* write serializers;
* write frontend services;
* fix the Deliberate preview drawer bug;
* generate the implementation backlog;
* select final UI layouts;
* import OSS code;
* approve annex/sidecar architecture;
* replace the boundaries document;
* replace the canonical naming document.

---

## 16. Related Docs

This document must be read before generating or using:

```txt
00_KINTSUGI_START_HERE.md
01_ETHIKOS_KINTSUGI_EXECUTION_STRATEGY.md
03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md
04_CANONICAL_NAMING_AND_VARIABLES.md
05_CURRENT_STATE_BASELINE.md
06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md
07_API_AND_SERVICE_CONTRACTS.md
08_DATA_MODEL_AND_MIGRATION_PLAN.md
09_SMART_VOTE_EKOH_READING_CONTRACT.md
10_FIRST_PASS_INTEGRATION_MATRIX.md
11_MIMIC_VS_ANNEX_RULEBOOK.md
12_CANONICAL_OBJECTS_AND_EVENTS.md
13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md
14_FRONTEND_ALIGNMENT_CONTRACT.md
15_BACKEND_ALIGNMENT_CONTRACT.md
16_TEST_AND_SMOKE_CONTRACT.md
17_KNOWN_BUGS_AND_NON_KINTSUGI_ITEMS.md
18_ADR_REGISTER.md
19_OSS_CODE_READING_PLAN.md
20_AI_GENERATION_GUARDRAILS.md
21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md
22_IMPLEMENTATION_BACKLOG_TEMPLATE.md
```

---

## 17. Final Binding Rule

If a future AI-generated answer, document, backlog item, or code proposal conflicts with this document, the generated output MUST be corrected before use.

```yaml
FINAL_DRIFT_CONTROL_RULE:
  IF_A_DOC_CONFLICTS_WITH_THIS_DOCUMENT:
    RESULT: "this document wins"

  IF_A_DOC_CONFLICTS_WITH_CODE_REALITY:
    RESULT: "code snapshot wins for implementation reality"

  IF_A_DOC_CONFLICTS_WITH_BOUNDARIES:
    RESULT: "boundaries win for ownership and write rules"

  IF_AN_OSS_PATTERN_CONFLICTS_WITH_ETHIKOS_ARCHITECTURE:
    RESULT: "mimic the pattern only; do not import the architecture"

  IF_KIALO_TERMS_CONFLICT_WITH_ETHIKOS_MODEL_NAMES:
    RESULT: "preserve Ethikos model names; use Kialo terms conceptually"

  IF_SMART_VOTE_OR_EKOH_ARE_USED_TO_MUTATE_SOURCE_FACTS:
    RESULT: "invalid design"

  IF_THE_OUTPUT_EXPANDS_FIRST_PASS_SCOPE:
    RESULT: "invalid scope drift"
```

This document is the drift-control root for the ethiKos Kintsugi upgrade.


