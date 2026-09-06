# 03 — Boundaries and Ownership Contracts

**Document ID:** `03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md`  
**Pack:** ethiKos Kintsugi Update Documentation Pack  
**Status:** Canonical / Normative  
**Last aligned:** 2026-04-25  
**Primary purpose:** Prevent architectural drift by fixing ownership, write rules, source-of-truth boundaries, and integration rules for the ethiKos Kintsugi upgrade.

---

## 1. Purpose

This document defines the hard boundaries for the ethiKos Kintsugi upgrade.

It answers:

- Which component owns which truth?
- Which component may compute, read, project, or publish?
- Which component must never mutate upstream facts?
- How do Korum, Konsultations, Smart Vote, EkoH, Kialo-style deliberation, and external OSS patterns coexist without corrupting the architecture?
- Which boundaries must AI-assisted implementation never cross?

This document is normative. The terms **MUST**, **MUST NOT**, **SHOULD**, **MAY**, and **FORBIDDEN** are intentional.

Source basis: the existing Kintsugi boundaries document defines ethiKos v2 as a deliberation and decision-formation module, with a Stage 0→5 pipeline, hard submodule boundaries, Smart Vote/EkoH integration, foreign-tool integration without merges, canonical objects, and audit requirements. :contentReference[oaicite:0]{index=0}

---

## 2. Scope

This document applies to the complete ethiKos Kintsugi upgrade.

It governs:

- Korum
- Konsultations
- Smart Vote
- EkoH
- Kollective Intelligence where it intersects with ethiKos
- Kialo-style argument mapping under `/ethikos/deliberate/*`
- OSS-inspired patterns used through mimic or future annex
- Backend model ownership
- Frontend route ownership
- API/service ownership
- Derived readings and result publication
- Drafting, decision, and accountability boundaries

It does **not** define every model field, serializer shape, frontend component, or implementation task. Those belong to the related technical-contract documents listed near the end.

---

## 3. Canonical Variables Used

```yaml
DOCUMENT_NAME: "03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md"
DOCUMENT_ROLE: "Canonical ownership and boundary contract"
PROJECT_NAME: "Konnaxion"
MODULE_NAME: "ethiKos"
UPDATE_NAME: "Kintsugi"

KINTSUGI_UPDATE_TYPE: "documentation-first architecture upgrade"
IMPLEMENTATION_STYLE: "partial native mimic"
FULL_EXTERNAL_MERGE_ALLOWED: false
ANNEX_FIRST_PASS_ALLOWED: false
EXISTING_ROUTE_FAMILIES_STABLE: true
DOCS_BEFORE_CODE: true
BACKLOG_AFTER_DOCS_AND_CODE_READING: true

PRIMARY_ROUTE_SURFACE: "/ethikos/*"
PRIMARY_BACKEND_APP: "konnaxion.ethikos"
PRIMARY_API_PREFIX: "/api/ethikos/"

KORUM_OWNS:
  - "topics"
  - "stances"
  - "arguments"
  - "threaded argument graph"
  - "argument moderation"

KONSULTATIONS_OWNS:
  - "intake"
  - "consultations"
  - "ballot capture"
  - "result snapshots"
  - "impact tracking"

SMART_VOTE_OWNS:
  - "derived readings"
  - "lens declarations"
  - "aggregations"
  - "result publication"

EKOH_OWNS:
  - "expertise context"
  - "ethics context"
  - "cohort eligibility"
  - "domain vectors"
  - "snapshot/audit context"

FOREIGN_TOOLS_WRITE_CORE_TABLES: false
SMART_VOTE_MUTATES_SOURCE_FACTS: false
EKOH_IS_VOTING_ENGINE: false

KIALO_STRATEGY: "native_mimic"
KIALO_ROUTE_SCOPE: "/ethikos/deliberate/*"
KIALO_BACKEND_SCOPE: "konnaxion.ethikos"
KIALO_MODULE_CREATED: false
KIALO_CODE_IMPORTED: false
````

---

## 4. Source Priority

When documents, code, old plans, or generated AI output disagree, use this priority order.

| Priority | Source                       | Governs                                                      |
| -------: | ---------------------------- | ------------------------------------------------------------ |
|        1 | Current code snapshot        | Real routes, current files, actual models, current endpoints |
|        2 | Kintsugi boundaries document | Ownership, write rules, single-truth policy                  |
|        3 | Clean-slate Kintsugi plan    | First-pass scope and no-merge strategy                       |
|        4 | Kialo core notes             | Structured deliberation behavior under Korum                 |
|        5 | OSS source docs              | Pattern inspiration only                                     |
|        6 | Older master Kintsugi docs   | Strategy only after correcting scope and route reality       |

The current implementation confirms that the real ethiKos surface is `/ethikos/*`, with first-class page groups for Decide, Deliberate, Trust, Pulse, Impact, Learn, Insights, and Admin. 

---

## 5. Core Principle: Single Truth, Multiple Readings

ethiKos legitimacy depends on keeping source facts stable while allowing multiple declared interpretations.

### 5.1 Baseline

The **baseline** is the canonical unweighted aggregation of recorded source events.

Examples:

* raw topic stances
* raw consultation ballots
* raw participation counts
* raw argument graph state

The baseline MUST remain visible whenever derived readings are published.

### 5.2 Reading / Lens

A **reading** is an explicitly declared transformation, aggregation, filter, or weighting over baseline events.

Examples:

* cohort-filtered reading
* expertise-weighted reading
* ethics-adjusted reading
* jurisdiction-specific reading
* stakeholder-group reading
* expert-panel reading

Readings are computed by Smart Vote and may use EkoH snapshot context. The boundary source defines a reading/lens as a declared transformation or aggregation computed by Smart Vote and bound to audit context, often an EkoH snapshot. 

### 5.3 Reproducibility Rule

Every published reading MUST be reproducible.

```txt
Reading = f(BaselineEvents, LensDeclaration, SnapshotContext?)
```

A reading that cannot be recomputed from recorded inputs MUST NOT be treated as legitimate output.

---

## 6. Ownership Matrix

| Component          |        Owns source truth? |       Owns derived truth? |                   May mutate upstream facts? | Primary responsibility                                  |
| ------------------ | ------------------------: | ------------------------: | -------------------------------------------: | ------------------------------------------------------- |
| Korum              |                       Yes |                   Limited |       Yes, only for debate artifacts it owns | Structured debate, topics, stances, arguments           |
| Konsultations      |                       Yes |                   Limited | Yes, only for consultation artifacts it owns | Intake, ballots, consultation snapshots, impact         |
| Smart Vote         |                        No |                       Yes |                                           No | Readings, lenses, aggregation, result publication       |
| EkoH               |                        No |              Context only |                                           No | Expertise, ethics, eligibility, snapshot context        |
| Kialo-style layer  |         No separate truth |                        No |                                           No | Native deliberation UX pattern inside Korum             |
| External OSS tools |                        No |                        No |                                           No | Inspiration or future sidecar through adapter           |
| KeenKonnect        | No for civic result truth |              Handoff only |                                           No | Project/resource execution handoff after civic decision |
| KonnectED          | No for civic result truth | Learning/resource support |                                           No | Educational resources, learning materials               |
| Kreative           | No for civic result truth |                        No |                                           No | Creative module, unrelated to civic truth               |

---

## 7. Component Boundary Contracts

## 7.1 Korum Contract

### 7.1.1 Role

Korum is the structured debate and deliberation submodule inside ethiKos.

It owns the canonical debate layer.

### 7.1.2 Korum Owns

Korum owns:

* debate topics
* argument threads
* argument graph structure
* topic-level stance events
* argument moderation
* deliberation-specific participation state
* Kialo-style claim mapping when implemented natively

In the current implementation, this maps to the canonical Ethikos models:

* `EthikosTopic`
* `EthikosStance`
* `EthikosArgument`
* `EthikosCategory`

The current backend semantics confirm that topics are the main debate/consultation objects, stances store one user’s numeric position on a topic, arguments store threaded discussion entries and replies, and categories group topics thematically. 

### 7.1.3 Korum MUST

Korum MUST:

* preserve `EthikosTopic` as the current canonical topic/debate container;
* preserve `EthikosStance` as topic-level stance state;
* preserve `EthikosArgument` as the current canonical argument/thread entry;
* support Kialo-style structured deliberation through additive fields/tables or service logic;
* distinguish topic-level stances from claim-level impact votes;
* expose debate artifacts through ethiKos API/service contracts;
* keep moderation actions auditable.

### 7.1.4 Korum MUST NOT

Korum MUST NOT:

* become the Smart Vote aggregation engine;
* publish weighted outcomes directly;
* mutate Smart Vote readings;
* mutate EkoH expertise or ethics snapshots;
* absorb Konsultations ballot truth without a declared boundary;
* rename `EthikosArgument` to `Claim`;
* create a separate `konnaxion.kialo` backend app in the first pass.

---

## 7.2 Konsultations Contract

### 7.2.1 Role

Konsultations is the consultation, intake, ballot, and accountability submodule inside ethiKos.

It owns the canonical consultation layer.

### 7.2.2 Konsultations Owns

Konsultations owns:

* issue intake
* citizen suggestions
* deduplication and scoping
* consultation prompts
* ballot capture
* result snapshots
* impact tracking
* feedback loops
* accountability records

### 7.2.3 Konsultations MUST

Konsultations MUST:

* preserve raw consultation input separately from derived readings;
* make result snapshots auditable;
* keep intake and ballot events reproducible;
* provide handoff points to Smart Vote for reading computation;
* provide handoff points to Impact for accountability;
* remain inside ethiKos ownership, even when UI surfaces interact with other modules.

### 7.2.4 Konsultations MUST NOT

Konsultations MUST NOT:

* let Smart Vote mutate ballots;
* let EkoH mutate ballots;
* let external OSS tools write directly into consultation truth tables;
* let KeenKonnect become the owner of civic impact truth;
* merge citizen suggestions, formal ballots, and argument stances into one ambiguous vote object.

---

## 7.3 Smart Vote Contract

### 7.3.1 Role

Smart Vote is the derived reading, aggregation, and result-publication layer.

It belongs to Kollective Intelligence but is used by ethiKos to publish interpretable outcomes.

The Kintsugi plan defines Smart Vote as a common reading layer that allows civic input to be compared, audited, analyzed through multiple lenses, and displayed without forcing a single “correct” outcome. 

### 7.3.2 Smart Vote Owns

Smart Vote owns:

* `LensDeclaration`
* `ReadingResult`
* derived aggregations
* baseline result publication
* weighted result publication
* cohort-filtered readings
* result comparison payloads
* reading audit metadata

### 7.3.3 Smart Vote MUST

Smart Vote MUST:

* read upstream events from Korum and/or Konsultations;
* compute readings from immutable or versioned inputs;
* store required audit metadata;
* publish baseline and derived readings separately;
* expose all weighting/filtering assumptions;
* preserve reproducibility.

Each published reading MUST include at minimum:

```yaml
reading_key: "string"
lens_hash: "content-addressable stable hash"
snapshot_ref: "nullable string; required when EkoH context is used"
computed_at: "ISO-8601 timestamp"
topic_id_or_consultation_id: "integer or stable reference"
results_payload: "JSON snapshot"
```

The boundaries source requires `reading_key`, `lens_hash`, `snapshot_ref`, `computed_at`, `topic/consultation_id`, and `results_payload` for each published reading. 

### 7.3.4 Smart Vote MUST NOT

Smart Vote MUST NOT:

* mutate Korum source records;
* mutate Konsultations source records;
* hide the raw baseline;
* silently replace baseline outcomes with weighted readings;
* treat EkoH weighting as automatically legitimate without lens declaration;
* store unexplained or unreproducible result transformations;
* become the owner of raw votes, raw stances, raw arguments, or raw ballots.

---

## 7.4 EkoH Contract

### 7.4.1 Role

EkoH provides expertise, ethics, cohort, and audit context.

EkoH is not the voting engine.

The boundaries source explicitly states that EkoH owns expertise/ethics ledger context, domain vectors, ethics multipliers, cohort eligibility, and snapshot/audit context, but is not the voting engine. 

### 7.4.2 EkoH Owns

EkoH owns:

* expertise profiles
* domain vectors
* ethics context
* cohort eligibility
* credibility signals
* snapshot references
* audit context for weighted readings

### 7.4.3 EkoH MAY

EkoH MAY:

* provide `snapshot_ref` for Smart Vote readings;
* provide cohort eligibility signals;
* provide expertise-weighting context;
* provide ethics-adjustment context;
* provide trust markers for `/ethikos/trust/*`;
* support explainability in `/ethikos/insights`.

### 7.4.4 EkoH MUST NOT

EkoH MUST NOT:

* record civic votes as the source of truth;
* mutate Ethikos stances;
* mutate consultation ballots;
* mutate Smart Vote readings after publication;
* decide outcomes directly;
* become a substitute for transparent decision protocols.

---

## 7.5 Kialo-Style Argument Mapping Contract

### 7.5.1 Role

Kialo-style argument mapping is the canonical structured-deliberation UX reference for Korum.

It is not a separate product module.

The Kialo core corpus adds deliberation patterns such as claim creation, sources, voting visibility, background info, perspectives, discussion roles, anonymity, suggested claims, and discussion lifecycle controls.  

### 7.5.2 Mapping

| Kialo-style concept | ethiKos/Korum mapping                               |
| ------------------- | --------------------------------------------------- |
| Discussion          | `EthikosTopic`                                      |
| Thesis              | Topic title / prompt / future thesis field          |
| Claim               | `EthikosArgument`                                   |
| Pro/con relation    | `EthikosArgument.parent` + `EthikosArgument.side`   |
| Source              | `ArgumentSource`                                    |
| Impact vote         | `ArgumentImpactVote`                                |
| Suggested claim     | `ArgumentSuggestion`                                |
| Participant role    | `DiscussionParticipantRole`                         |
| Perspective         | `DiscussionPerspective` or declared reading context |
| Background info     | Topic prompt/context block                          |

### 7.5.3 Kialo-Style Layer MUST

The Kialo-style layer MUST:

* live under `/ethikos/deliberate/*`;
* extend Korum natively;
* preserve `EthikosArgument` as the backend model name;
* distinguish `ArgumentImpactVote` from `EthikosStance`;
* distinguish claim-level evidence from topic-level background information;
* support role-aware suggestions before publishing suggested claims;
* preserve author visibility and vote visibility boundaries.

### 7.5.4 Kialo-Style Layer MUST NOT

The Kialo-style layer MUST NOT:

* create `/kialo` routes;
* create `konnaxion.kialo`;
* import Kialo code;
* rename `EthikosArgument` to `Claim`;
* treat impact votes as topic stances;
* treat impact votes as Smart Vote ballots;
* expose anonymous identities to normal participants.

---

## 7.6 Drafting Contract

### 7.6.1 Role

Drafting converts deliberation and consultation outputs into text that can be reviewed, amended, and decided upon.

Drafting is a bounded ethiKos capability.

### 7.6.2 Drafting Owns

Drafting owns:

* `Draft`
* `DraftVersion`
* `Amendment`
* `RationalePacket`
* version history
* amendment metadata
* linkage from arguments or consultations to text

### 7.6.3 Drafting MUST

Drafting MUST:

* be additive;
* preserve the source debate/consultation artifacts;
* link back to supporting arguments, ballot events, and rationale;
* maintain version history;
* preserve author and reviewer audit state.

### 7.6.4 Drafting MUST NOT

Drafting MUST NOT:

* overwrite Korum arguments;
* overwrite Konsultations ballots;
* treat drafted text as an outcome until a decision protocol closes;
* collapse debate, drafting, and decision into one opaque object.

---

## 7.7 Impact / Accountability Contract

### 7.7.1 Role

Impact tracks what happened after a decision or consultation result.

Impact belongs to the ethiKos/Konsultations accountability truth, even when execution handoff points connect to KeenKonnect or other modules.

### 7.7.2 Impact Owns

Impact owns:

* `ImpactTrack`
* `ImpactUpdate`
* public progress status
* outcome explanations
* implementation feedback
* accountability snapshots

### 7.7.3 Impact MUST

Impact MUST:

* remain linked to decision records and result snapshots;
* distinguish planned, in-progress, blocked, completed, cancelled, and archived outcomes;
* preserve public accountability history;
* identify handoffs to execution/project modules without making those modules the civic truth owner.

### 7.7.4 Impact MUST NOT

Impact MUST NOT:

* treat KeenKonnect project state as the canonical civic outcome by default;
* overwrite decision records;
* hide cancelled or blocked outcomes;
* publish impact claims without source linkage.

The endpoint graph currently shows loose mappings between impact services and KeenKonnect projects, which means Kintsugi must clarify ownership rather than silently adopting KeenKonnect as the impact truth owner. 

---

## 7.8 External OSS Tool Contract

### 7.8.1 Role

External OSS tools are pattern sources.

They are not merged into the ethiKos core during the first pass.

### 7.8.2 First-Pass Strategy

The first-pass strategy is **native mimic**.

First-pass sources:

* Consider.it
* Kialo-style argument mapping
* Loomio
* Citizen OS
* Decidim
* CONSUL Democracy
* DemocracyOS

Deferred sources:

* Polis
* LiquidFeedback
* All Our Ideas
* Your Priorities
* OpenSlides

### 7.8.3 Mimic

Use **Mimic** when:

* Konnaxion needs sovereignty;
* UX coherence matters;
* source stack is incompatible;
* source license or architecture is invasive;
* the useful value is a pattern rather than a reusable component;
* native ethiKos truth should remain canonical.

### 7.8.4 Annex

Use **Annex** only when:

* the tool can run as a sidecar;
* the component is replaceable;
* the license is acceptable;
* no dual truth is introduced;
* no direct core-table writes occur;
* an adapter boundary exists.

### 7.8.5 Annex Adapter Requirements

Any future annex MUST use:

```yaml
ExternalArtifact:
  role: "append-only raw external payload with provenance"

ProjectionMapping:
  role: "mapping from external identifiers to internal canonical IDs"
```

The existing boundaries document requires annex integrations to use `ExternalArtifact`, `ProjectionMapping`, and optional projections through ethiKos services rather than direct database writes. 

### 7.8.6 External Tools MUST NOT

External tools MUST NOT:

* write directly to Korum core tables;
* write directly to Konsultations core tables;
* become source of truth for civic outcomes;
* bypass ethiKos services;
* bypass Smart Vote reading contracts;
* bypass EkoH snapshot/audit boundaries;
* replace the existing `/ethikos/*` route families.

---

## 8. Pipeline Ownership

ethiKos Kintsugi uses a staged workflow. Each stage must have a clear owner and reusable output.

| Stage | Name                     | Owner                         | Canonical outputs                                              |
| ----: | ------------------------ | ----------------------------- | -------------------------------------------------------------- |
|     0 | Intake                   | Konsultations                 | `ProblemStatement`, `IntakeQueue`, `TopicTags`                 |
|     1 | Discovery / Consultation | Konsultations                 | `OptionSet`, `ConstraintSet`, consultation landscape           |
|     2 | Deliberation             | Korum                         | `ArgumentGraph`, `StanceEvents`, `ModerationLog`               |
|     3 | Drafting                 | ethiKos bounded capability    | `Draft`, `DraftVersion`, `Amendment`, `RationalePacket`        |
|     4 | Decision                 | Smart Vote + protocol context | `BaselineResult`, `ReadingResult`, `DecisionRecord`            |
|     5 | Accountability           | Konsultations / Impact        | `ImpactTrack`, `ImpactUpdate`, public accountability snapshots |

The original boundaries document defines ethiKos as a workflow kernel where each stage produces reusable output. 

---

## 9. Current Implementation Boundary

The current implementation must be respected.

### 9.1 Current Backend Core

Current canonical Ethikos backend app:

```txt
konnaxion.ethikos
```

Current canonical models:

```txt
EthikosCategory
EthikosTopic
EthikosStance
EthikosArgument
```

Current canonical endpoints:

```txt
/api/ethikos/topics/
/api/ethikos/stances/
/api/ethikos/arguments/
/api/ethikos/categories/
```

Compatibility aliases:

```txt
/api/deliberate/...
/api/deliberate/elite/...
```

The module contracts and technical references confirm these endpoints and models as the current canonical backend scope.  

### 9.2 Current Frontend Surface

Current canonical implementation surface:

```txt
/ethikos/*
```

Implemented page groups:

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

### 9.3 Compatibility Rule

Older conceptual route references MAY remain as documentation references, but implementation planning MUST target the real `/ethikos/*` route surface.

---

## 10. Write Rules

## 10.1 Core Table Writes

Only the owning component may write to its source truth.

| Table/Object family | Owner                | Who may write                           |
| ------------------- | -------------------- | --------------------------------------- |
| `EthikosTopic`      | Korum / ethiKos      | ethiKos services                        |
| `EthikosStance`     | Korum                | ethiKos stance services                 |
| `EthikosArgument`   | Korum                | ethiKos argument services               |
| `EthikosCategory`   | ethiKos              | ethiKos admin/category services         |
| Ballot events       | Konsultations        | consultation services                   |
| Result snapshots    | Konsultations        | consultation/result services            |
| `LensDeclaration`   | Smart Vote           | Smart Vote services                     |
| `ReadingResult`     | Smart Vote           | Smart Vote compute/publication services |
| EkoH snapshots      | EkoH                 | EkoH services                           |
| `ExternalArtifact`  | Integration boundary | adapter services only                   |
| `ProjectionMapping` | Integration boundary | adapter services only                   |

## 10.2 Direct DB Write Rule

Direct cross-domain writes are forbidden.

```yaml
KORUM_WRITES_SMART_VOTE_TABLES: false
SMART_VOTE_WRITES_KORUM_TABLES: false
SMART_VOTE_WRITES_KONSULTATIONS_TABLES: false
EKOH_WRITES_VOTE_TABLES: false
FOREIGN_TOOLS_WRITE_CORE_TABLES: false
```

## 10.3 Service Boundary Rule

All writes SHOULD pass through the owning service/API layer.

Direct model imports across apps for mutation SHOULD be avoided unless explicitly documented and tested.

---

## 11. Vote-Type Separation

The Kintsugi upgrade MUST preserve three distinct participation/result concepts.

| Concept              | Owner      | Level                | Range / Form           | Meaning                                                |
| -------------------- | ---------- | -------------------- | ---------------------- | ------------------------------------------------------ |
| `EthikosStance`      | Korum      | Topic-level          | `-3..+3`               | User stance on a topic                                 |
| `ArgumentImpactVote` | Korum      | Claim/argument-level | `0..4`                 | Impact of a claim on parent; relevance/veracity signal |
| `ReadingResult`      | Smart Vote | Derived aggregation  | JSON / declared schema | Published interpretation of baseline events            |

## 11.1 Hard Rules

```yaml
CLAIM_IMPACT_VOTE_IS_TOPIC_STANCE: false
CLAIM_IMPACT_VOTE_IS_SMART_VOTE_BALLOT: false
ETHIKOS_STANCE_IS_READING: false
SMART_VOTE_READING_IS_SOURCE_FACT: false
```

## 11.2 Why This Matters

If these concepts are merged, ethiKos loses auditability.

Examples of forbidden drift:

* using a Kialo-style impact vote as a topic stance;
* using a topic stance as a ballot;
* treating a weighted reading as raw truth;
* hiding the unweighted baseline after publishing a weighted result.

---

## 12. Route Ownership

## 12.1 Canonical Product Surface

The canonical ethiKos product surface is:

```txt
/ethikos/*
```

## 12.2 Route Family Ownership

| Route family            | Primary owner                  | Boundary role                           |
| ----------------------- | ------------------------------ | --------------------------------------- |
| `/ethikos/deliberate/*` | Korum                          | Debate, arguments, claim graph, stances |
| `/ethikos/decide/*`     | Smart Vote + decision protocol | Ballots, protocols, readings, results   |
| `/ethikos/impact/*`     | Konsultations / Impact         | Accountability, outcomes, feedback      |
| `/ethikos/pulse/*`      | ethiKos analytics              | Participation health, signals, trends   |
| `/ethikos/trust/*`      | EkoH visibility                | Trust, credentials, expertise markers   |
| `/ethikos/admin/*`      | ethiKos governance             | Moderation, roles, audit                |
| `/ethikos/learn/*`      | ethiKos education              | Guides, methodology, glossary           |
| `/ethikos/insights`     | Smart Vote/EkoH interpretation | Readings, analytics, comparisons        |

## 12.3 Route Anti-Drift Rules

The upgrade MUST NOT:

* create a separate `/kialo` product route;
* create a top-level `/kintsugi` app outside ethiKos;
* replace `/ethikos/deliberate/*` with `/debate`;
* replace `/ethikos/decide/*` with `/vote`;
* expand `/api/home/*`;
* rename `/api/ethikos/...` to `/api/deliberation/...`.

The project guidance explicitly instructs API generation to use the service layer, respect `/api/...` prefixes, avoid invented API paths, and avoid renaming `/api/ethikos/...` to `/api/deliberation/...`. 

---

## 13. API Ownership

## 13.1 Canonical API Prefixes

```yaml
ETHIKOS_TOPICS: "/api/ethikos/topics/"
ETHIKOS_STANCES: "/api/ethikos/stances/"
ETHIKOS_ARGUMENTS: "/api/ethikos/arguments/"
ETHIKOS_CATEGORIES: "/api/ethikos/categories/"
KOLLECTIVE_VOTES: "/api/kollective/votes/"
```

## 13.2 Compatibility Prefixes

```yaml
DELIBERATE_ALIAS: "/api/deliberate/..."
DELIBERATE_ELITE_ALIAS: "/api/deliberate/elite/..."
```

## 13.3 Legacy / Problematic Prefixes

```yaml
API_HOME_PREFIX: "/api/home/*"
RULE: "Do not expand usage. Replace, isolate, or mark legacy."
```

## 13.4 API Boundary Rule

Frontend code MUST use service wrappers for new or changed API calls.

Pages and components SHOULD NOT call raw endpoints directly unless that exception is explicitly documented in the appropriate frontend/API contract.

---

## 14. Data Boundary Rules

## 14.1 Existing Models Must Remain Stable

The Kintsugi upgrade MUST NOT rename or remove:

```txt
EthikosCategory
EthikosTopic
EthikosStance
EthikosArgument
```

## 14.2 Additive Model Policy

New capabilities SHOULD be added through non-breaking tables or fields.

Allowed additive families:

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
ImpactUpdate
ArgumentSource
ArgumentImpactVote
ArgumentSuggestion
DiscussionParticipantRole
DiscussionVisibilitySetting
ExternalArtifact
ProjectionMapping
```

## 14.3 Forbidden Data Changes

The upgrade MUST NOT:

* delete existing Ethikos tables;
* rename existing Ethikos models;
* rename existing canonical endpoints;
* collapse all civic input into one generic vote model;
* store Smart Vote readings in Korum source tables;
* store EkoH snapshots as hidden weights without declaration;
* store foreign tool payloads directly in core Korum/Konsultations tables.

---

## 15. Moderation, Roles, and Visibility

## 15.1 Moderation Ownership

Korum owns moderation for debate artifacts.

Konsultations owns moderation for consultation intake and ballot-adjacent content.

Admin surfaces under `/ethikos/admin/*` coordinate moderation, roles, and audit.

## 15.2 Kialo-Style Role Alignment

Kialo-style roles MAY be mimicked as ethiKos discussion roles:

```txt
owner
admin
editor
writer
suggester
viewer
```

Kialo documentation distinguishes role-based permissions such as Owner, Admin, Editor, Writer, Suggester, and Viewer, which should inform ethiKos deliberation permissions without importing Kialo architecture. 

## 15.3 Visibility Controls

The Kialo-style deliberation layer MAY support:

```txt
AUTHOR_VISIBILITY = never | admins_only | all
VOTE_VISIBILITY = all | admins_only | self_only
PARTICIPATION_TYPE = standard | anonymous
```

## 15.4 Anonymity Rule

Anonymous participation MAY hide public identity, but it MUST NOT remove auditability for authorized administrators.

Anonymous identity MUST NOT be exposed to normal participants.

---

## 16. Audit Requirements

Every boundary-crossing event MUST be auditable.

## 16.1 Minimum Audit Targets

Audit records SHOULD exist for:

* topic creation
* topic closure
* stance recording
* argument creation
* argument hiding/unhiding
* source attachment
* impact vote recording
* suggested claim acceptance/rejection
* draft version creation
* amendment submission
* decision opening/closing
* reading computation
* reading publication
* EkoH snapshot usage
* impact update
* moderation action
* external artifact ingestion
* projection mapping creation

## 16.2 Minimum Audit Fields

Where applicable, audit entries SHOULD include:

```yaml
actor_id: "user or system actor"
action: "stable action key"
object_type: "canonical object type"
object_id: "canonical object id"
before: "optional JSON"
after: "optional JSON"
reason: "optional moderation/publication reason"
created_at: "ISO-8601 timestamp"
source_ref: "optional external/source reference"
snapshot_ref: "optional EkoH or state snapshot"
```

---

## 17. Foreign Tool Boundary

## 17.1 First-Pass Source Role

First-pass OSS sources are inspiration only.

| Source              | First-pass boundary role                        |
| ------------------- | ----------------------------------------------- |
| Consider.it         | Mimic reason/pro-con capture                    |
| Kialo-style mapping | Mimic structured argument graph and permissions |
| Loomio              | Mimic proposal lifecycle and decision protocol  |
| Citizen OS          | Mimic drafting and topic-phase patterns         |
| Decidim             | Mimic process/accountability/admin patterns     |
| CONSUL Democracy    | Mimic eligibility/threshold/governance patterns |
| DemocracyOS         | Mimic proposal-centric policy debate            |

## 17.2 Deferred Sources

Deferred sources MUST NOT drive first-pass architecture:

```txt
Polis
LiquidFeedback
All Our Ideas
Your Priorities
OpenSlides
```

## 17.3 Dependency Rule

No first-pass source may become:

* a required runtime dependency;
* a direct data owner;
* a direct database writer;
* a new primary frontend shell;
* a replacement for ethiKos routes.

---

## 18. Conflict Rules

## 18.1 If Korum and Smart Vote Conflict

Korum source facts win for raw deliberation history.

Smart Vote may publish a derived reading, but it may not mutate Korum.

## 18.2 If Konsultations and Smart Vote Conflict

Konsultations source ballot/result snapshots win for raw consultation history.

Smart Vote may publish declared readings, but it may not mutate ballots or snapshots.

## 18.3 If EkoH and Smart Vote Conflict

EkoH provides context.

Smart Vote computes readings.

If EkoH context changes, Smart Vote may compute a new reading with a new `lens_hash` or `snapshot_ref`; it must not silently mutate the old reading.

## 18.4 If OSS Pattern and ethiKos Architecture Conflict

ethiKos architecture wins.

Mimic the useful pattern. Do not import the incompatible architecture.

## 18.5 If Old Docs and Current Code Conflict

Current code wins for implementation reality.

Old docs may be retained for strategy only after correction.

---

## 19. Non-Goals

This document does not:

* define every serializer field;
* create implementation tasks;
* propose migrations directly;
* replace the API contract document;
* replace the Smart Vote/EkoH reading contract;
* replace the Kialo-style argument mapping contract;
* replace the route-by-route upgrade plan;
* authorize a full OSS merge;
* authorize annex integration in the first pass;
* solve the Deliberate preview drawer bug;
* authorize any new top-level product app.

---

## 20. Anti-Drift Rules

The following are absolute.

```yaml
FORBIDDEN:
  - "Do not propose full external OSS merge."
  - "Do not create a new Kialo app."
  - "Do not create a new top-level Kintsugi frontend app."
  - "Do not rename EthikosArgument to Claim."
  - "Do not rename /api/ethikos/... to /api/deliberation/..."
  - "Do not convert EkoH into a voting engine."
  - "Do not let Smart Vote mutate upstream facts."
  - "Do not let foreign tools write to Korum/Konsultations core tables."
  - "Do not treat Kialo impact votes as Ethikos stances."
  - "Do not treat Kialo impact votes as Smart Vote ballots."
  - "Do not expand /api/home/*."
  - "Do not create a second layout shell."
  - "Do not create a second theme system."
  - "Do not produce implementation tasks in this document."
```

---

## 21. Required Contract Blocks for Submodule Pages

Each submodule page SHOULD include a short contract block pointing back to this document.

### 21.1 Korum Page Contract Block

```md
## Contract

Korum owns ethiKos structured debate truth: topics, stances, arguments, argument graph structure, and debate moderation.

Korum does not compute Smart Vote readings, does not mutate EkoH snapshots, and does not own consultation ballots.

See: `03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md`.
```

### 21.2 Konsultations Page Contract Block

```md
## Contract

Konsultations owns ethiKos consultation truth: intake, suggestions, ballots, result snapshots, and impact tracking.

Konsultations does not compute Smart Vote readings, does not mutate EkoH snapshots, and does not replace Korum argument truth.

See: `03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md`.
```

### 21.3 Smart Vote Page Contract Block

```md
## Contract

Smart Vote owns derived readings and result publication. It reads baseline events, applies declared lenses, stores reproducible reading results, and keeps the baseline visible.

Smart Vote never mutates Korum or Konsultations source facts.

See: `03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md`.
```

### 21.4 EkoH Page Contract Block

```md
## Contract

EkoH owns expertise, ethics, cohort, and snapshot context. It may support Smart Vote readings through declared snapshot references.

EkoH is not the voting engine and does not mutate civic source facts.

See: `03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md`.
```

---

## 22. Related Documents

This document should be read with:

```txt
00_KINTSUGI_START_HERE.md
01_ETHIKOS_KINTSUGI_EXECUTION_STRATEGY.md
02_SOURCE_OF_TRUTH_AND_DRIFT_CONTROL.md
04_CANONICAL_NAMING_AND_VARIABLES.md
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
18_ADR_REGISTER.md
20_AI_GENERATION_GUARDRAILS.md
21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md
22_IMPLEMENTATION_BACKLOG_TEMPLATE.md
```

---

## 23. Acceptance Criteria

This document is complete when future Kintsugi docs and implementation tasks can answer the following without ambiguity:

* Who owns this object?
* Who can write to it?
* Is this source truth or a derived reading?
* Is this baseline or lens output?
* Is this Korum, Konsultations, Smart Vote, EkoH, or external?
* Is this first-pass mimic or future annex?
* Does this use the existing `/ethikos/*` route surface?
* Does this preserve current models and endpoints?
* Does this keep Smart Vote read-only on upstream facts?
* Does this keep EkoH out of voting-engine responsibility?
* Does this keep Kialo-style features inside Korum rather than creating a separate module?

If any answer is unclear, the generating document or implementation task MUST be revised before code work proceeds.

---

## 24. Final Boundary Statement

ethiKos Kintsugi is not a merge of civic platforms.

It is a native Konnaxion upgrade that preserves a single source of civic truth while allowing multiple declared readings.

Korum owns structured debate.

Konsultations owns consultation flow and accountability.

Smart Vote owns derived readings.

EkoH owns expertise and ethics context.

Kialo-style deliberation strengthens Korum without becoming a separate module.

Foreign tools may inspire, and later may annex through adapters, but they do not own ethiKos truth.

The baseline remains visible.
The readings remain declared.
The system remains auditable.
The architecture remains sovereign.

---

## V4.1 addendum — EkoH rating disclosure ownership

EkoH owns both its rating ledger and disclosure decisions for that ledger. `ConfidentialitySetting` continues to own identity presentation; `RatingVisibilitySetting` and EkoH scoped grants own rating disclosure. Consuming modules MUST NOT create a parallel rating-visibility policy. Smart Vote remains the owner of derived readings and MUST NOT mutate EkoH ratings. See `27_EKOH_RATING_VISIBILITY_AND_ACCESS_CONTRACT.md`.

