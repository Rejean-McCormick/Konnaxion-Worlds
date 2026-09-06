# 01 — ethiKos Kintsugi Execution Strategy

**File:** `01_ETHIKOS_KINTSUGI_EXECUTION_STRATEGY.md`  
**Pack:** `ethiKos Kintsugi Update Documentation Pack`  
**Canonical path:** `docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/`  
**Status:** Draft for execution alignment  
**Version:** `2026-04-25-kintsugi-doc-pack-v1`  
**Primary module:** `ethiKos`  
**Update name:** `Kintsugi`  

---

## 1. Purpose

This document defines the execution strategy for the **ethiKos Kintsugi Upgrade**.

The Kintsugi Upgrade transforms ethiKos from a structured debate module into a fuller civic deliberation, consultation, drafting, decision-formation, and accountability engine while preserving the existing Konnaxion architecture.

This strategy is not an implementation backlog. It is the execution-level architectural frame that all later technical plans, route plans, migrations, payload contracts, and code-reading passes MUST obey.

The purpose of this document is to fix:

- the strategic intent of the Kintsugi upgrade;
- the first-pass scope;
- the relationship between ethiKos, Korum, Konsultations, Smart Vote, and EkoH;
- the rule that OSS civic tools are mimicked natively before any annex/sidecar approach;
- the route-level execution strategy;
- the distinction between baseline facts, derived readings, and external inspiration patterns;
- the non-goals and anti-drift rules for future AI-assisted generation.

---

## 2. Scope

This document covers the execution strategy for the first Kintsugi planning and documentation pass.

It covers:

- ethiKos product positioning;
- strategic transformation goals;
- first-pass OSS source usage;
- deferred OSS source usage;
- mimic vs annex strategy;
- ownership boundaries;
- route-family strategy;
- data-model posture;
- Smart Vote and EkoH relationship;
- Kialo-style deliberation strategy;
- execution sequence;
- success criteria;
- anti-drift rules.

It does not define:

- exact Django model fields;
- exact serializers;
- exact migrations;
- exact frontend component implementation;
- exact test files;
- full implementation backlog;
- direct code modifications;
- final UI copy;
- deployment procedure.

Those details belong in the companion documents listed in Section 18.

---

## 3. Canonical Variables Used

This document is governed by the following canonical variables.

```yaml
PROJECT:
  PLATFORM_NAME: "Konnaxion"
  MODULE_NAME: "ethiKos"
  UPDATE_NAME: "Kintsugi"
  FULL_UPDATE_NAME: "ethiKos Kintsugi Upgrade"

STRATEGY:
  KINTSUGI_UPDATE_TYPE: "documentation-first architecture upgrade"
  IMPLEMENTATION_STYLE: "partial native mimic"
  FULL_EXTERNAL_MERGE_ALLOWED: false
  ANNEX_FIRST_PASS_ALLOWED: false
  BIG_BANG_REWRITE_ALLOWED: false
  EXISTING_ROUTE_FAMILIES_STABLE: true
  EXISTING_ETHIKOS_FRAME_STABLE: true
  CODE_INSPECTION_AFTER_DOCS: true
  BACKLOG_AFTER_DOCS_AND_CODE_READING: true

FIRST_PASS_OSS_SOURCES:
  - "Consider.it"
  - "Kialo-style argument mapping"
  - "Loomio"
  - "Citizen OS"
  - "Decidim"
  - "CONSUL Democracy"
  - "DemocracyOS"

DEFERRED_OSS_SOURCES:
  - "Polis"
  - "LiquidFeedback"
  - "All Our Ideas"
  - "Your Priorities"
  - "OpenSlides"

PRIMARY_ROUTE_SURFACE: "/ethikos/*"

OWNERSHIP:
  KORUM_OWNS:
    - "topics"
    - "stances"
    - "arguments"
    - "argument graph"
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
    - "aggregations"
    - "result publication"
  EKOH_OWNS:
    - "expertise context"
    - "ethics context"
    - "cohort eligibility"
    - "snapshots"

WRITE_RULES:
  FOREIGN_TOOLS_WRITE_CORE_TABLES: false
  SMART_VOTE_MUTATES_SOURCE_FACTS: false
  EKOH_IS_VOTING_ENGINE: false
````

---

## 4. Strategic Summary

The Kintsugi Upgrade makes ethiKos the civic reasoning and decision-formation layer of Konnaxion.

The upgrade does not replace the existing ethiKos surface. It strengthens it.

The existing route families remain the execution surface:

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

The upgrade introduces a coherent civic pipeline:

```txt
Intake
→ Discovery / Consultation
→ Deliberation
→ Drafting
→ Decision
→ Accountability
```

The upgrade integrates selected patterns from external civic tools, but it does not merge those tools into Konnaxion.

The guiding rule is:

```txt
Mimic useful civic patterns natively inside ethiKos.
Do not import external architectures into the core product.
```

---

## 5. Why the Upgrade Exists

Online debate usually fails because it is not structured for decision-quality reasoning.

Common failures include:

* chronological feeds that reward repetition and emotional escalation;
* debate threads that collapse into identity conflict;
* unclear separation between arguments, stances, votes, and decisions;
* weak provenance of claims and evidence;
* no clear transition from discussion to drafting;
* no auditable path from vote to outcome;
* no accountability layer after a decision is made;
* no distinction between raw outcomes and interpreted readings.

ethiKos Kintsugi exists to correct these structural failures by turning civic participation into a staged, auditable, and decision-ready process.

The upgrade is not intended to make ethiKos merely more interactive. It is intended to make ethiKos more legitimate, more legible, more reproducible, and more useful for real governance workflows.

---

## 6. Product Positioning

ethiKos is the Konnaxion module responsible for structured civic reasoning and decision-formation.

After Kintsugi, ethiKos SHOULD be understood as:

> A unified civic deliberation, consultation, drafting, decision, and accountability engine that preserves a canonical baseline truth while allowing declared, reproducible Smart Vote readings.

The module is composed of bounded internal responsibilities:

| Layer         | Role                                                                            |
| ------------- | ------------------------------------------------------------------------------- |
| Korum         | Structured deliberation, topics, stances, arguments, argument graph, moderation |
| Konsultations | Intake, consultation flow, ballots, result snapshots, impact tracking           |
| Smart Vote    | Derived readings, lens declarations, aggregation, result publication            |
| EkoH          | Expertise context, ethics context, cohort eligibility, snapshot/audit context   |
| Kintsugi      | Orchestration strategy for integrating civic-tech patterns into ethiKos         |

Kintsugi is not a separate product surface. It is the upgrade strategy and integration architecture for ethiKos.

---

## 7. Execution Principles

### 7.1 Preserve the Existing Frame

The Kintsugi Upgrade MUST preserve the existing ethiKos frame and route families.

It MUST NOT create:

* a new top-level `/kintsugi` application;
* a new `/kialo` route family;
* a second ethiKos shell;
* a separate civic-tech clone beside ethiKos;
* duplicate decision surfaces outside `/ethikos/*`.

### 7.2 Native Mimic First

The first-pass strategy is native mimic.

This means:

* extract the useful product pattern;
* translate it into the existing Konnaxion stack;
* implement it through existing ethiKos route families;
* preserve Konnaxion data ownership;
* avoid importing foreign architecture;
* avoid creating sidecars before the core contracts are stable.

### 7.3 Annex Later Only When Safe

Annex or sidecar integration MAY be considered later only when all of the following are true:

* the feature is modular;
* the license is acceptable;
* the component is isolated;
* the component is replaceable;
* it does not write to core ethiKos tables;
* it has an adapter boundary;
* it does not create duplicate truth;
* it does not dominate the Konnaxion UX.

### 7.4 Docs First, Code Second

The Kintsugi Upgrade MUST proceed in this order:

```txt
1. Documentation contracts
2. Source-of-truth alignment
3. Route-by-route plan
4. Data and payload contracts
5. Code-reading plan
6. Implementation backlog
7. Code changes
```

Code changes before contract stabilization are out of scope for this document.

---

## 8. First-Pass OSS Source Strategy

The following sources are first-pass inspirations.

They are used as pattern references only.

| Source                       | First-pass use                                                   | ethiKos target                               |
| ---------------------------- | ---------------------------------------------------------------- | -------------------------------------------- |
| Consider.it                  | Reason capture, pro/con deliberation compression                 | `/ethikos/deliberate/*`                      |
| Kialo-style argument mapping | Structured claim graph, sources, impact voting, roles, anonymity | `/ethikos/deliberate/*`                      |
| Loomio                       | Proposal lifecycle, discussion-to-decision transition            | `/ethikos/decide/*`                          |
| Citizen OS                   | Drafting, versioning, topic lifecycle                            | Drafting capability under ethiKos            |
| Decidim                      | Process architecture, components, accountability, admin patterns | `/ethikos/impact/*`, `/ethikos/admin/*`      |
| CONSUL Democracy             | Eligibility, thresholds, proposal governance                     | `/ethikos/decide/*`, `/ethikos/admin/*`      |
| DemocracyOS                  | Proposal-centric policy debate                                   | `/ethikos/decide/*`, `/ethikos/deliberate/*` |

The first-pass source strategy is:

```yaml
CONSIDER_IT: "mimic"
KIALO_STYLE: "mimic"
LOOMIO: "mimic"
CITIZEN_OS: "mimic"
DECIDIM: "mimic"
CONSUL_DEMOCRACY: "mimic"
DEMOCRACY_OS: "mimic"
```

No first-pass OSS source is allowed to become a direct merge.

---

## 9. Deferred OSS Sources

The following sources are explicitly deferred.

| Source          | Status                           |
| --------------- | -------------------------------- |
| Polis           | Deferred / public credit only    |
| LiquidFeedback  | Deferred / public credit only    |
| All Our Ideas   | Deferred                         |
| Your Priorities | Deferred                         |
| OpenSlides      | Deferred / possible future annex |

These sources MUST NOT drive first-pass implementation.

They MAY be referenced as longer-term inspiration, but they MUST NOT introduce new first-pass models, routes, services, or architectural decisions.

---

## 10. Korum Strategy

Korum is the structured deliberation side of ethiKos.

It owns:

* topics used as deliberation containers;
* topic-level stances;
* arguments;
* argument threading;
* argument graph;
* argument moderation;
* claim/source evidence attachments;
* Kialo-style structured argument UX.

Korum’s first-pass strategy is to evolve the current `EthikosTopic`, `EthikosStance`, and `EthikosArgument` foundation into a stronger structured deliberation workspace.

The core mapping is:

```txt
Kialo Discussion → EthikosTopic
Kialo Thesis → Topic prompt / thesis / title + description
Kialo Claim → EthikosArgument
Kialo Pro/Con relation → EthikosArgument.parent + EthikosArgument.side
Kialo Source → ArgumentSource
Kialo Impact Vote → ArgumentImpactVote
Kialo Suggested Claim → ArgumentSuggestion
```

Important distinction:

```txt
EthikosStance ≠ ArgumentImpactVote
ArgumentImpactVote ≠ Smart Vote ballot
```

Korum MUST preserve the current `EthikosArgument` concept. The implementation MUST NOT rename `EthikosArgument` to `Claim`.

The term “claim” MAY be used in UX language or documentation, but the current backend object remains `EthikosArgument`.

---

## 11. Konsultations Strategy

Konsultations is the consultation and civic intake side of ethiKos.

It owns:

* intake;
* consultation framing;
* citizen suggestions;
* ballot capture;
* result snapshots;
* accountability preparation;
* impact tracking.

Konsultations converts civic input into structured decision material.

The first-pass strategy is to formalize Konsultations as a bounded ethiKos capability without creating a separate app unless the backend architecture later proves it necessary.

Konsultations MUST NOT collapse into Korum.

Korum and Konsultations are related but distinct:

| Concern             | Owner         |
| ------------------- | ------------- |
| Argument graph      | Korum         |
| Topic stance        | Korum         |
| Consultation ballot | Konsultations |
| Result snapshot     | Konsultations |
| Impact tracking     | Konsultations |
| Derived reading     | Smart Vote    |

Konsultations MAY reuse `EthikosTopic` as a container when the current implementation requires it, but the documentation MUST preserve the conceptual distinction.

---

## 12. Smart Vote Strategy

Smart Vote owns derived readings.

It does not own raw source facts.

It does not mutate Korum records.

It does not mutate Konsultations records.

It does not replace baseline results.

Smart Vote computes declared readings from baseline events.

The core formula is:

```txt
Reading = f(BaselineEvents, LensDeclaration, SnapshotContext?)
```

Smart Vote outputs MUST be reproducible.

A Smart Vote reading MUST be bound to:

```txt
reading_key
lens_hash
snapshot_ref
computed_at
topic_id or consultation_id
results_payload
```

The baseline result MUST remain visible even when weighted or filtered Smart Vote readings are displayed.

The strategic rule is:

```txt
Single truth, multiple readings.
```

Baseline facts are the source of legitimacy. Smart Vote readings are declared interpretations of those facts.

---

## 13. EkoH Strategy

EkoH provides expertise and ethics context.

It owns:

* expertise context;
* ethics context;
* cohort eligibility;
* domain vectors;
* snapshot references;
* audit context for readings.

EkoH is not the voting engine.

EkoH MUST NOT mutate votes.

EkoH MUST NOT replace Smart Vote.

EkoH MAY provide context used by Smart Vote readings, such as:

* expertise-weighted readings;
* cohort-filtered readings;
* ethics-contextualized readings;
* domain-specific readings.

The relationship is:

```txt
EkoH provides context.
Smart Vote computes readings.
ethiKos preserves baseline events.
```

---

## 14. Route-Family Execution Strategy

The Kintsugi Upgrade MUST map onto the existing ethiKos route families.

### 14.1 `/ethikos/deliberate/*`

Primary role:

```txt
Structured deliberation and argument mapping.
```

Patterns:

* Kialo-style claim graph;
* Consider.it-style pro/con reason compression;
* DemocracyOS-style proposal discussion.

First-pass capabilities SHOULD include:

* argument tree;
* parent/child pro/con relation;
* source attachment;
* impact voting separated from topic stance;
* suggested claims;
* role-aware participation;
* author visibility rules;
* basic topic background panel.

Deferred capabilities MAY include:

* sunburst minimap;
* small group mode;
* custom perspectives;
* clone-from-template;
* export;
* cross-discussion claim extraction.

### 14.2 `/ethikos/decide/*`

Primary role:

```txt
Decision protocols, ballots, Smart Vote readings, and result publication.
```

Patterns:

* Loomio proposal lifecycle;
* CONSUL Democracy eligibility/threshold logic;
* DemocracyOS proposal-centric decision framing.

First-pass capabilities SHOULD include:

* decision record;
* decision protocol;
* open/closed/published lifecycle;
* baseline result;
* Smart Vote reading display;
* methodology explanation.

### 14.3 `/ethikos/impact/*`

Primary role:

```txt
Accountability and implementation tracking.
```

Patterns:

* Decidim accountability;
* CONSUL Democracy public follow-through;
* outcome/feedback loops.

First-pass capabilities SHOULD include:

* outcome tracking;
* impact status;
* public feedback;
* accountability updates;
* connection to decision records.

Impact truth SHOULD belong to ethiKos/Konsultations, not to KeenKonnect project truth.

KeenKonnect MAY receive handoff links after a decision is made, but it MUST NOT own the civic impact source of truth.

### 14.4 `/ethikos/pulse/*`

Primary role:

```txt
Participation health and civic signal monitoring.
```

First-pass capabilities SHOULD include:

* activity health;
* participation trends;
* live civic signals;
* deliberation quality indicators.

Pulse SHOULD visualize process state rather than create a separate source of truth.

### 14.5 `/ethikos/trust/*`

Primary role:

```txt
Trust, expertise, credentials, and EkoH-facing civic context.
```

First-pass capabilities SHOULD include:

* trust profile;
* badges;
* credentials;
* EkoH-derived civic context.

Trust MUST NOT become the voting engine.

### 14.6 `/ethikos/admin/*`

Primary role:

```txt
Audit, moderation, roles, and governance controls.
```

First-pass capabilities SHOULD include:

* moderation queue;
* audit trail;
* participant roles;
* eligibility configuration;
* visibility settings;
* Kialo-style discussion role controls.

### 14.7 `/ethikos/learn/*`

Primary role:

```txt
Public explanation and civic literacy.
```

First-pass capabilities SHOULD include:

* glossary;
* guides;
* methodology;
* changelog;
* explanation of baseline vs readings;
* explanation of Korum, Konsultations, Smart Vote, and EkoH.

### 14.8 `/ethikos/insights`

Primary role:

```txt
Analytics, reading comparison, and interpretation.
```

First-pass capabilities SHOULD include:

* baseline vs derived reading comparison;
* Smart Vote reading summaries;
* participation summaries;
* argument and decision quality signals.

Insights MUST NOT create a separate result truth.

---

## 15. Data Strategy

The Kintsugi Upgrade MUST use a non-destructive data strategy.

Existing core models MUST remain stable:

```txt
EthikosCategory
EthikosTopic
EthikosStance
EthikosArgument
```

The upgrade MAY add non-breaking tables and fields.

It MUST NOT:

* rename existing core models;
* delete existing core fields;
* break existing endpoints;
* replace `EthikosArgument` with `Claim`;
* replace `EthikosStance` with `Vote`;
* collapse Smart Vote readings into raw stance records;
* allow external tools to write core tables directly.

Potential new model areas include:

```txt
DecisionProtocol
DecisionRecord
LensDeclaration
ReadingResult
Draft
DraftVersion
Amendment
RationalePacket
ImpactTrack
ExternalArtifact
ProjectionMapping
ArgumentSource
ArgumentImpactVote
ArgumentSuggestion
DiscussionParticipantRole
DiscussionVisibilitySetting
```

The data model details are not finalized in this document. They MUST be defined in:

```txt
08_DATA_MODEL_AND_MIGRATION_PLAN.md
12_CANONICAL_OBJECTS_AND_EVENTS.md
13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md
```

---

## 16. API and Service Strategy

The current canonical ethiKos API prefix remains:

```txt
/api/ethikos/*
```

Current canonical endpoints include:

```txt
/api/ethikos/topics/
/api/ethikos/stances/
/api/ethikos/arguments/
/api/ethikos/categories/
```

Compatibility aliases MAY remain:

```txt
/api/deliberate/...
/api/deliberate/elite/...
```

The upgrade MUST NOT invent a replacement prefix such as:

```txt
/api/deliberation/*
```

The upgrade MUST NOT expand legacy `/api/home/*` usage.

Where `/api/home/*` still appears, it MUST be treated as legacy, isolated, or migrated behind canonical service contracts.

Frontend code SHOULD use the services layer.

New direct raw fetches from page components SHOULD be avoided unless explicitly documented.

---

## 17. Execution Sequence

The strategy is executed in documentation-first phases.

### Phase 1 — Anti-Drift Documentation

Produce and stabilize:

```txt
00_KINTSUGI_START_HERE.md
02_SOURCE_OF_TRUTH_AND_DRIFT_CONTROL.md
03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md
04_CANONICAL_NAMING_AND_VARIABLES.md
20_AI_GENERATION_GUARDRAILS.md
```

### Phase 2 — Strategy and Scope

Produce and stabilize:

```txt
01_ETHIKOS_KINTSUGI_EXECUTION_STRATEGY.md
10_FIRST_PASS_INTEGRATION_MATRIX.md
11_MIMIC_VS_ANNEX_RULEBOOK.md
18_ADR_REGISTER.md
```

### Phase 3 — Product and Route Contracts

Produce and stabilize:

```txt
05_CURRENT_STATE_BASELINE.md
06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md
17_KNOWN_BUGS_AND_NON_KINTSUGI_ITEMS.md
21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md
```

### Phase 4 — Technical Contracts

Produce and stabilize:

```txt
07_API_AND_SERVICE_CONTRACTS.md
08_DATA_MODEL_AND_MIGRATION_PLAN.md
09_SMART_VOTE_EKOH_READING_CONTRACT.md
12_CANONICAL_OBJECTS_AND_EVENTS.md
13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md
14_FRONTEND_ALIGNMENT_CONTRACT.md
15_BACKEND_ALIGNMENT_CONTRACT.md
16_TEST_AND_SMOKE_CONTRACT.md
```

### Phase 5 — Code Reading and Backlog

Produce and stabilize:

```txt
19_OSS_CODE_READING_PLAN.md
22_IMPLEMENTATION_BACKLOG_TEMPLATE.md
```

Only after these phases should implementation tasks be generated.

---

## 18. Companion Documents

This strategy document depends on the full documentation pack.

| File                                            | Purpose                                      |
| ----------------------------------------------- | -------------------------------------------- |
| `00_KINTSUGI_START_HERE.md`                     | Entry point and current baseline             |
| `02_SOURCE_OF_TRUTH_AND_DRIFT_CONTROL.md`       | Source priority and conflict resolution      |
| `03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md`      | Ownership and write rules                    |
| `04_CANONICAL_NAMING_AND_VARIABLES.md`          | Fixed names, slugs, constants                |
| `05_CURRENT_STATE_BASELINE.md`                  | Current code and product baseline            |
| `06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md`     | Route-level execution plan                   |
| `07_API_AND_SERVICE_CONTRACTS.md`               | Backend/frontend service contracts           |
| `08_DATA_MODEL_AND_MIGRATION_PLAN.md`           | Non-destructive model and migration strategy |
| `09_SMART_VOTE_EKOH_READING_CONTRACT.md`        | Readings, lenses, snapshots                  |
| `10_FIRST_PASS_INTEGRATION_MATRIX.md`           | OSS source-to-Ethikos mapping                |
| `11_MIMIC_VS_ANNEX_RULEBOOK.md`                 | Pattern adoption rules                       |
| `12_CANONICAL_OBJECTS_AND_EVENTS.md`            | Civic domain object/event model              |
| `13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md` | JSON and serializer contracts                |
| `14_FRONTEND_ALIGNMENT_CONTRACT.md`             | Frontend shell, routes, services             |
| `15_BACKEND_ALIGNMENT_CONTRACT.md`              | Django/DRF alignment rules                   |
| `16_TEST_AND_SMOKE_CONTRACT.md`                 | Smoke and regression expectations            |
| `17_KNOWN_BUGS_AND_NON_KINTSUGI_ITEMS.md`       | Known bugs and out-of-scope items            |
| `18_ADR_REGISTER.md`                            | Architecture decision records                |
| `19_OSS_CODE_READING_PLAN.md`                   | How to inspect downloaded OSS repos          |
| `20_AI_GENERATION_GUARDRAILS.md`                | AI anti-drift rules                          |
| `21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md`   | Kialo-style structured deliberation contract |
| `22_IMPLEMENTATION_BACKLOG_TEMPLATE.md`         | Template for future implementation tasks     |

---

## 19. Non-Goals

This strategy explicitly does not authorize:

* full external OSS merge;
* direct Kialo code import;
* direct Loomio code import;
* direct Decidim code import;
* direct CONSUL Democracy code import;
* direct DemocracyOS code import;
* direct Citizen OS code import;
* creation of `konnaxion.kialo`;
* creation of `/kialo` routes;
* creation of a second ethiKos shell;
* creation of a separate Kintsugi frontend application;
* expansion of `/api/home/*`;
* renaming `EthikosArgument` to `Claim`;
* renaming `/api/ethikos/*` to `/api/deliberation/*`;
* converting EkoH into the voting engine;
* allowing Smart Vote to mutate source facts;
* allowing foreign tools to write core ethiKos tables;
* treating Kialo impact votes as topic stances;
* treating Smart Vote readings as baseline facts;
* generating implementation tasks before documentation contracts are stable.

---

## 20. Anti-Drift Rules

The following rules are binding for future documentation and code-generation sessions.

### 20.1 Route Drift

Do not invent new route families when an existing `/ethikos/*` route family can carry the feature.

Wrong:

```txt
/kialo/*
/kintsugi/*
/deliberation/*
```

Correct:

```txt
/ethikos/deliberate/*
/ethikos/decide/*
/ethikos/impact/*
/ethikos/admin/*
```

### 20.2 Model Drift

Do not rename existing canonical models.

Wrong:

```txt
Claim replaces EthikosArgument
Vote replaces EthikosStance
```

Correct:

```txt
Claim is a conceptual UX term.
EthikosArgument remains the backend model.
EthikosStance remains the topic-level stance model.
```

### 20.3 Vote Drift

Do not merge the three vote concepts.

```txt
EthikosStance = topic-level stance, range -3..+3
ArgumentImpactVote = claim-level impact vote, range 0..4
Smart Vote Reading = derived aggregation, lens-based
```

### 20.4 Ownership Drift

Do not let layers mutate each other’s source facts.

```txt
Korum owns deliberation facts.
Konsultations owns consultation/ballot/impact facts.
Smart Vote owns readings.
EkoH owns context.
```

### 20.5 OSS Drift

Do not convert OSS inspiration into OSS dependency.

```txt
Pattern mimic is allowed.
Architecture import is not allowed in first pass.
```

### 20.6 Backlog Drift

Do not generate implementation backlog items inside strategy documents.

Implementation tasks belong in:

```txt
22_IMPLEMENTATION_BACKLOG_TEMPLATE.md
```

---

## 21. Success Criteria

The Kintsugi execution strategy is successful when:

1. The existing `/ethikos/*` surface remains intact.
2. Korum and Konsultations are clearly separated.
3. Smart Vote readings are reproducible and separate from baseline facts.
4. EkoH remains a context and eligibility layer, not a voting engine.
5. Kialo-style structured deliberation is mapped into `/ethikos/deliberate/*`.
6. First-pass OSS sources are used only as mimic references.
7. Deferred OSS sources do not drive first-pass work.
8. Data changes are non-destructive.
9. API contracts preserve `/api/ethikos/*`.
10. Legacy `/api/home/*` usage is not expanded.
11. The Deliberate preview drawer bug is tracked as a targeted bug, not an architecture driver.
12. Future AI sessions can generate companion docs without reinterpreting the scope.

---

## 22. Final Execution Position

The Kintsugi Upgrade is a controlled, documentation-first, native-mimic upgrade to ethiKos.

It is not a rewrite.

It is not a merge of civic-tech platforms.

It is not a new module beside ethiKos.

It is an orchestration strategy that strengthens the existing Konnaxion civic layer by combining:

* Korum for structured deliberation;
* Konsultations for civic intake, ballots, and accountability;
* Smart Vote for declared readings;
* EkoH for expertise and ethics context;
* selected OSS civic patterns translated into native ethiKos workflows.

The first-pass execution rule is:

```txt
Keep the ethiKos frame.
Keep the route families.
Mimic selected patterns natively.
Preserve source truth.
Publish declared readings.
Defer annexes.
Generate docs before code.
```

```

Source basis: existing Kintsugi master draft, boundary contract, clean-slate plan, Konnaxion frontend/backend snapshot, Kialo core corpus, and technical contracts. :contentReference[oaicite:0]{index=0} :contentReference[oaicite:1]{index=1} :contentReference[oaicite:2]{index=2} :contentReference[oaicite:3]{index=3} :contentReference[oaicite:4]{index=4} :contentReference[oaicite:5]{index=5}
```
