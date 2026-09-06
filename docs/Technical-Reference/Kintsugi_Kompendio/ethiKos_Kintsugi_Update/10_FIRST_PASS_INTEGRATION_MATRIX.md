# 10 — First-Pass Integration Matrix

**File:** `10_FIRST_PASS_INTEGRATION_MATRIX.md`  
**Pack:** ethiKos Kintsugi Update Documentation Pack  
**Canonical path:** `docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/`  
**Version:** `2026-04-25-kintsugi-doc-pack-v1`  
**Status:** Canonical first-pass scope matrix  
**Module:** `ethiKos`  
**Platform:** `Konnaxion`

---

## 1. Purpose

This document defines the **first-pass integration matrix** for the ethiKos Kintsugi Upgrade.

Its purpose is to prevent drift when translating external civic-tech inspiration into native ethiKos features.

This matrix answers:

- which external sources are in scope now;
- which sources are explicitly deferred;
- which patterns are retained;
- which patterns are rejected or postponed;
- where each pattern maps into the existing `/ethikos/*` route surface;
- which current or proposed ethiKos objects each pattern affects;
- whether each pattern should be implemented as native mimic, future annex, or no-go;
- what must not be imported, renamed, or merged.

This document is not an implementation backlog. It is a scope and alignment contract.

---

## 2. Scope

This document covers first-pass Kintsugi inspiration from:

```yaml
FIRST_PASS_OSS_SOURCES:
  - "Consider.it"
  - "Kialo-style argument mapping"
  - "Loomio"
  - "Citizen OS"
  - "Decidim"
  - "CONSUL Democracy"
  - "DemocracyOS"
````

This document also records the explicitly deferred sources:

```yaml
DEFERRED_OSS_SOURCES:
  - "Polis"
  - "LiquidFeedback"
  - "All Our Ideas"
  - "Your Priorities"
  - "OpenSlides"
```

---

## 3. Canonical variables used

```yaml
KINTSUGI_UPDATE_TYPE: "documentation-first architecture upgrade"
IMPLEMENTATION_STYLE: "partial native mimic"
FULL_EXTERNAL_MERGE_ALLOWED: false
ANNEX_FIRST_PASS_ALLOWED: false
BIG_BANG_REWRITE_ALLOWED: false
EXISTING_ROUTE_FAMILIES_STABLE: true
EXISTING_ETHIKOS_FRAME_STABLE: true
DOCS_BEFORE_CODE: true
CODE_INSPECTION_AFTER_DOCS: true
BACKLOG_AFTER_DOCS_AND_CODE_READING: true
```

```yaml
PRIMARY_ROUTE_SURFACE: "/ethikos/*"

ETHIKOS_ROUTE_FAMILIES:
  DELIBERATE: "/ethikos/deliberate/*"
  DECIDE: "/ethikos/decide/*"
  IMPACT: "/ethikos/impact/*"
  PULSE: "/ethikos/pulse/*"
  TRUST: "/ethikos/trust/*"
  LEARN: "/ethikos/learn/*"
  INSIGHTS: "/ethikos/insights"
  ADMIN: "/ethikos/admin/*"
```

```yaml
OWNERSHIP:
  KORUM_OWNS:
    - "Topics"
    - "Arguments"
    - "Threaded argument graph"
    - "Topic-level stance events"
    - "Debate moderation"

  KONSULTATIONS_OWNS:
    - "Intake"
    - "Consultations"
    - "Citizen suggestions"
    - "Ballot capture"
    - "Result snapshots"
    - "Impact tracking"

  SMART_VOTE_OWNS:
    - "Derived readings"
    - "Lens declarations"
    - "Aggregations"
    - "Result publication"

  EKOH_OWNS:
    - "Expertise context"
    - "Ethics context"
    - "Cohort eligibility"
    - "Snapshots"
```

```yaml
MIMIC_VS_ANNEX:
  DEFAULT_EXTERNAL_TOOL_STRATEGY: "mimic"
  MIMIC_FIRST_PASS: true
  ANNEX_FIRST_PASS_ALLOWED: false
  FULL_CODE_IMPORT_DEFAULT: false
```

---

## 4. Non-goals

This document does not:

* authorize importing external OSS code;
* authorize a full merge of any civic-tech platform;
* create a new Kialo app;
* create a new Kintsugi frontend app;
* replace existing `/ethikos/*` routes;
* replace current `EthikosTopic`, `EthikosStance`, `EthikosArgument`, or `EthikosCategory`;
* redefine Korum/Konsultations/Smart Vote/EkoH ownership;
* generate backend tickets;
* generate frontend tickets;
* define migrations in final detail;
* decide final serializer payloads;
* solve the preview drawer bug;
* include Polis, LiquidFeedback, All Our Ideas, Your Priorities, or OpenSlides in first pass.

---

## 5. First-pass matrix summary

| Source                       | First-pass status | Strategy     | Primary retained pattern                                             | Primary ethiKos route family                                 | Primary owner                       | First-pass priority |
| ---------------------------- | ----------------: | ------------ | -------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------- | ------------------: |
| Consider.it                  |          In scope | Native mimic | Reason capture, pro/con deliberation compression                     | `/ethikos/deliberate/*`                                      | Korum                               |                  P2 |
| Kialo-style argument mapping |          In scope | Native mimic | Structured claim graph, sources, impact voting, permissions          | `/ethikos/deliberate/*`                                      | Korum                               |                  P0 |
| Loomio                       |          In scope | Native mimic | Proposal lifecycle, time-boxed decisions, outcome publishing         | `/ethikos/decide/*`                                          | Smart Vote + ethiKos decision layer |                  P1 |
| Citizen OS                   |          In scope | Native mimic | Drafting, versioning, amendments, collaborative text flow            | Drafting capability + `/ethikos/decide/*`                    | ethiKos drafting capability         |                  P1 |
| Decidim                      |          In scope | Native mimic | Civic process architecture, phases, accountability, admin governance | `/ethikos/impact/*`, `/ethikos/admin/*`, `/ethikos/pulse/*`  | Konsultations + Admin               |                  P1 |
| CONSUL Democracy             |          In scope | Native mimic | Eligibility, thresholds, proposal gating, consultation governance    | `/ethikos/decide/*`, `/ethikos/admin/*`, `/ethikos/impact/*` | Konsultations + Smart Vote          |                  P2 |
| DemocracyOS                  |          In scope | Native mimic | Proposal-centric policy debate                                       | `/ethikos/decide/*`, `/ethikos/deliberate/*`                 | Korum + decision layer              |                  P2 |

Priority scale:

```yaml
P0: "Foundational; must shape first-pass documentation and contracts."
P1: "Core Kintsugi extension; likely first implementation wave after contracts."
P2: "Important pattern source; useful after P0/P1 contracts are stable."
P3: "Deferred or reference-only."
```

---

## 6. Deferred matrix summary

| Source          | Status                            | Reason                                                                         | Allowed first-pass use               |
| --------------- | --------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------ |
| Polis           | Deferred                          | Consensus clustering is powerful but outside current partial-native first pass | Public credit / future research only |
| LiquidFeedback  | Deferred                          | Delegated/liquid democracy would alter decision semantics too early            | Public credit / future research only |
| All Our Ideas   | Deferred                          | Pairwise idea ranking is not needed for first pass                             | None beyond future idea note         |
| Your Priorities | Deferred                          | Civic ideation workflow overlaps with later Konsultations work                 | None beyond future idea note         |
| OpenSlides      | Deferred / future annex candidate | Meeting/parliament workflow is too specialized for first pass                  | Future annex research only           |

Deferred sources MUST NOT generate first-pass models, routes, migrations, services, or backlog tasks.

---

## 7. Source-by-source integration detail

---

# 7.1 Consider.it

## 7.1.1 Status

```yaml
SOURCE: "Consider.it"
FIRST_PASS_STATUS: "in_scope"
STRATEGY: "native_mimic"
PRIORITY: "P2"
PRIMARY_ROUTE_SCOPE: "/ethikos/deliberate/*"
PRIMARY_OWNER: "Korum"
```

## 7.1.2 Retained pattern

Consider.it is retained as inspiration for:

* compact pro/con reasoning;
* surfacing reasons rather than chronological noise;
* making participant positions more legible;
* reason clusters;
* structured comparison between support and opposition.

## 7.1.3 ethiKos mapping

| Consider.it concept | ethiKos Kintsugi mapping                           |     |          |
| ------------------- | -------------------------------------------------- | --- | -------- |
| Position on issue   | `EthikosStance`                                    |     |          |
| Reason for/against  | `EthikosArgument` with `side`                      |     |          |
| Pro/con structure   | `EthikosArgument.side = pro                        | con | neutral` |
| Reason grouping     | Future `ArgumentGraph` view or derived clustering  |     |          |
| Participant opinion | Topic-level stance + argument contribution pattern |     |          |

## 7.1.4 Route targets

```yaml
ROUTE_TARGETS:
  PRIMARY:
    - "/ethikos/deliberate/[topic]"
  SECONDARY:
    - "/ethikos/deliberate/elite"
    - "/ethikos/pulse/health"
    - "/ethikos/insights"
```

## 7.1.5 Model impact

Current models sufficient for first expression:

```yaml
CURRENT_MODELS_USED:
  - "EthikosTopic"
  - "EthikosStance"
  - "EthikosArgument"
```

Possible future support models:

```yaml
POSSIBLE_MODELS:
  - "ArgumentCluster"
  - "ArgumentSummary"
```

These possible models are not first-pass mandatory.

## 7.1.6 First-pass allowed work

Consider.it MAY inspire:

* clearer pro/con presentation;
* topic stance summary;
* reason cards;
* argument-side filtering;
* deliberation summary panels.

## 7.1.7 First-pass forbidden work

Consider.it MUST NOT cause:

* a new `considerit` app;
* external code import;
* replacement of `EthikosArgument`;
* replacement of `/ethikos/deliberate/*`;
* direct writes from external tools.

## 7.1.8 Kintsugi classification

```yaml
CLASSIFICATION:
  MIMIC: true
  ANNEX: false
  IMPORT_CODE: false
  CREATE_APP: false
```

---

# 7.2 Kialo-style argument mapping

## 7.2.1 Status

```yaml
SOURCE: "Kialo-style argument mapping"
FIRST_PASS_STATUS: "in_scope"
STRATEGY: "native_mimic"
PRIORITY: "P0"
PRIMARY_ROUTE_SCOPE: "/ethikos/deliberate/*"
PRIMARY_OWNER: "Korum"
```

## 7.2.2 Retained pattern

Kialo-style mapping is the canonical first-pass reference for structured deliberation.

It contributes:

* thesis-centered discussion;
* single-thesis and multi-thesis topology;
* claims as atomic argument nodes;
* pro/con relation to parent;
* argument tree navigation;
* minimap concept;
* sources attached to claims;
* impact voting on claims;
* guided voting;
* perspectives;
* suggested claims;
* participant roles;
* anonymity mode;
* author visibility;
* vote visibility;
* templates;
* small group mode;
* discussion export.

Only a subset is first pass.

## 7.2.3 Canonical ethiKos mapping

```yaml
KIALO_CANONICAL_MAPPING:
  KIALO_DISCUSSION: "EthikosTopic"
  KIALO_THESIS: "Topic thesis/prompt field; current fallback is EthikosTopic.title + description"
  KIALO_CLAIM: "EthikosArgument"
  KIALO_PRO_CON_EDGE: "EthikosArgument.parent + EthikosArgument.side"
  KIALO_SOURCE: "ArgumentSource"
  KIALO_IMPACT_VOTE: "ArgumentImpactVote"
  KIALO_SUGGESTED_CLAIM: "ArgumentSuggestion"
  KIALO_PERSPECTIVE: "DiscussionPerspective / Smart Vote lens depending context"
  KIALO_PARTICIPANT_ROLE: "DiscussionParticipantRole"
```

## 7.2.4 Critical separation

Kialo introduces claim-level impact voting. This must remain separate from ethiKos topic-level stance and Smart Vote readings.

```yaml
VOTE_TYPE_SEPARATION:
  ETHIKOS_STANCE:
    RANGE: "-3..+3"
    LEVEL: "topic-level"
    MODEL: "EthikosStance"

  KIALO_IMPACT_VOTE:
    RANGE: "0..4"
    LEVEL: "claim-level"
    PROPOSED_MODEL: "ArgumentImpactVote"

  SMART_VOTE_READING:
    RANGE: "lens-dependent"
    LEVEL: "derived aggregation"
    PROPOSED_MODEL: "ReadingResult"
```

Mandatory rules:

```yaml
CLAIM_IMPACT_VOTE_IS_TOPIC_STANCE: false
CLAIM_IMPACT_VOTE_IS_SMART_VOTE_BALLOT: false
ETHIKOS_STANCE_IS_READING: false
SMART_VOTE_READING_IS_SOURCE_FACT: false
```

## 7.2.5 Route targets

```yaml
ROUTE_TARGETS:
  PRIMARY:
    - "/ethikos/deliberate/[topic]"
  SECONDARY:
    - "/ethikos/deliberate/elite"
    - "/ethikos/deliberate/guidelines"
    - "/ethikos/admin/moderation"
    - "/ethikos/admin/roles"
    - "/ethikos/insights"
```

## 7.2.6 First-pass feature subset

```yaml
KIALO_FIRST_PASS_FEATURES:
  - "Argument tree using current EthikosArgument parent + side"
  - "Claim/source links"
  - "Role-aware suggested claims"
  - "Impact vote separated from topic stance"
  - "Author visibility settings"
  - "Voting visibility settings"
  - "Basic topic info/background panel"
```

## 7.2.7 Deferred Kialo features

```yaml
KIALO_DEFERRED_FEATURES:
  - "Small group mode"
  - "Sunburst minimap"
  - "Clone-from-template"
  - "Export discussion"
  - "Custom perspectives"
  - "Claim extraction into new discussion"
  - "Move/link claim across discussions"
```

## 7.2.8 Model impact

Existing models:

```yaml
CURRENT_MODELS_USED:
  - "EthikosTopic"
  - "EthikosArgument"
  - "EthikosStance"
```

First-pass proposed models:

```yaml
FIRST_PASS_MODEL_CANDIDATES:
  - "ArgumentSource"
  - "ArgumentImpactVote"
  - "ArgumentSuggestion"
  - "DiscussionParticipantRole"
  - "DiscussionVisibilitySetting"
```

Later model candidates:

```yaml
DEFERRED_MODEL_CANDIDATES:
  - "ArgumentBookmark"
  - "ArgumentLink"
  - "DiscussionPerspective"
  - "DiscussionTemplate"
  - "DiscussionGroup"
  - "DiscussionExport"
```

## 7.2.9 Required enum alignment

```yaml
KIALO_VALUES:
  KIALO_EDGE_SIDE_VALUES:
    - "pro"
    - "con"
    - "neutral"

  KIALO_IMPACT_VOTE_RANGE: "0..4"

  KIALO_ROLES:
    - "owner"
    - "admin"
    - "editor"
    - "writer"
    - "suggester"
    - "viewer"

  KIALO_ANONYMITY_MODES:
    - "standard"
    - "anonymous"

  KIALO_AUTHOR_VISIBILITY:
    - "never"
    - "admins_only"
    - "all"

  KIALO_VOTE_VISIBILITY:
    - "all"
    - "admins_only"
    - "self_only"

  KIALO_DISCUSSION_TOPOLOGY:
    - "single_thesis"
    - "multi_thesis"

  KIALO_MINIMAP_MODES:
    - "tree"
    - "sunburst"
```

## 7.2.10 First-pass forbidden work

Kialo-style mapping MUST NOT cause:

* renaming `EthikosArgument` to `Claim`;
* creating `konnaxion.kialo`;
* creating `/kialo` routes;
* importing Kialo code;
* treating claim impact votes as topic stances;
* treating claim impact votes as Smart Vote ballots;
* exposing anonymous identities to non-admin users;
* publishing suggested claims without approval when role is `suggester`.

## 7.2.11 Kintsugi classification

```yaml
CLASSIFICATION:
  MIMIC: true
  ANNEX: false
  IMPORT_CODE: false
  CREATE_APP: false
```

---

# 7.3 Loomio

## 7.3.1 Status

```yaml
SOURCE: "Loomio"
FIRST_PASS_STATUS: "in_scope"
STRATEGY: "native_mimic"
PRIORITY: "P1"
PRIMARY_ROUTE_SCOPE: "/ethikos/decide/*"
PRIMARY_OWNER: "Smart Vote + ethiKos decision layer"
```

## 7.3.2 Retained pattern

Loomio is retained as inspiration for:

* proposal lifecycle;
* time-boxed decisions;
* consent/objection/approval flows;
* explicit decision closure;
* outcome publication;
* clear transition from discussion to decision.

## 7.3.3 ethiKos mapping

| Loomio concept                  | ethiKos Kintsugi mapping                     |
| ------------------------------- | -------------------------------------------- |
| Discussion thread               | `EthikosTopic` + `EthikosArgument`           |
| Proposal                        | `DecisionRecord`                             |
| Poll/decision                   | `DecisionProtocol` + `DecisionRecord`        |
| Stance/vote in decision context | `BallotEvent` or Smart Vote-compatible event |
| Outcome                         | `DecisionRecord.outcome` + `ReadingResult`   |
| Closing date                    | `DecisionRecord.opens_at` / `closes_at`      |
| Decision method                 | `DecisionProtocol`                           |

## 7.3.4 Route targets

```yaml
ROUTE_TARGETS:
  PRIMARY:
    - "/ethikos/decide/public"
    - "/ethikos/decide/elite"
    - "/ethikos/decide/results"
  SECONDARY:
    - "/ethikos/decide/methodology"
    - "/ethikos/admin/audit"
    - "/ethikos/insights"
```

## 7.3.5 Model impact

First-pass proposed models:

```yaml
FIRST_PASS_MODEL_CANDIDATES:
  - "DecisionProtocol"
  - "DecisionRecord"
  - "LensDeclaration"
  - "ReadingResult"
```

Possible support objects:

```yaml
SUPPORT_OBJECTS:
  - "BallotEvent"
  - "BaselineResult"
```

## 7.3.6 First-pass allowed work

Loomio MAY inspire:

* decision lifecycle states;
* decision protocol names;
* opening and closing windows;
* outcome publishing;
* objection/consent logic;
* result explanation.

## 7.3.7 First-pass forbidden work

Loomio MUST NOT cause:

* importing Loomio code;
* changing the authentication model;
* creating a separate decision app;
* replacing Smart Vote;
* allowing Smart Vote to mutate source records;
* collapsing deliberation and decision into one table.

## 7.3.8 Kintsugi classification

```yaml
CLASSIFICATION:
  MIMIC: true
  ANNEX: false
  IMPORT_CODE: false
  CREATE_APP: false
```

---

# 7.4 Citizen OS

## 7.4.1 Status

```yaml
SOURCE: "Citizen OS"
FIRST_PASS_STATUS: "in_scope"
STRATEGY: "native_mimic"
PRIORITY: "P1"
PRIMARY_ROUTE_SCOPE: "Drafting capability + /ethikos/decide/*"
PRIMARY_OWNER: "ethiKos bounded drafting capability"
```

## 7.4.2 Retained pattern

Citizen OS is retained as inspiration for:

* collaborative drafting;
* versioned text;
* amendments;
* decision-ready documents;
* structured transition from deliberation to written proposal;
* separation between discussion and text editing.

## 7.4.3 Architectural caution

Citizen OS architecture may rely on external collaborative editing infrastructure such as Etherpad-like flows. The first pass MUST NOT annex such infrastructure.

First pass should mimic the product pattern:

* draft;
* version;
* amendment;
* rationale;
* decision-ready text.

It must not integrate external pad infrastructure.

## 7.4.4 ethiKos mapping

| Citizen OS concept     | ethiKos Kintsugi mapping                                 |
| ---------------------- | -------------------------------------------------------- |
| Topic                  | `EthikosTopic`                                           |
| Collaborative document | `Draft`                                                  |
| Document revision      | `DraftVersion`                                           |
| Proposed edit          | `Amendment`                                              |
| Rationale / reasoning  | `RationalePacket`                                        |
| Final proposal text    | `DecisionRecord.subject_ref` or `Draft.accepted_version` |

## 7.4.5 Route targets

```yaml
ROUTE_TARGETS:
  PRIMARY:
    - "/ethikos/decide/public"
    - "/ethikos/decide/elite"
  SECONDARY:
    - "/ethikos/deliberate/[topic]"
    - "/ethikos/impact/outcomes"
    - "/ethikos/admin/audit"
```

If a future `/ethikos/draft/*` route is proposed, it must be documented in `06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md` and approved by ADR before implementation.

## 7.4.6 Model impact

First-pass proposed models:

```yaml
FIRST_PASS_MODEL_CANDIDATES:
  - "Draft"
  - "DraftVersion"
  - "Amendment"
  - "RationalePacket"
```

## 7.4.7 First-pass allowed work

Citizen OS MAY inspire:

* creating a draft from a topic;
* creating versions of a draft;
* attaching rationale to draft text;
* linking amendments to arguments;
* promoting a draft into a decision record.

## 7.4.8 First-pass forbidden work

Citizen OS MUST NOT cause:

* Etherpad annex in first pass;
* external collaborative editing service dependency;
* creating a separate Citizen OS route family;
* importing Citizen OS code;
* mixing draft versions directly into `EthikosArgument`;
* treating draft text as the same object as the debate topic.

## 7.4.9 Kintsugi classification

```yaml
CLASSIFICATION:
  MIMIC: true
  ANNEX: false
  IMPORT_CODE: false
  CREATE_APP: false
```

---

# 7.5 Decidim

## 7.5.1 Status

```yaml
SOURCE: "Decidim"
FIRST_PASS_STATUS: "in_scope"
STRATEGY: "native_mimic"
PRIORITY: "P1"
PRIMARY_ROUTE_SCOPE: "/ethikos/impact/* + /ethikos/admin/* + /ethikos/pulse/*"
PRIMARY_OWNER: "Konsultations + Admin"
```

## 7.5.2 Retained pattern

Decidim is retained as inspiration for:

* civic process architecture;
* participatory phases;
* proposals;
* debates;
* meetings as a future reference only;
* accountability;
* admin governance;
* permissions;
* taxonomies;
* traceability;
* public process transparency.

## 7.5.3 ethiKos mapping

| Decidim concept       | ethiKos Kintsugi mapping                                                       |
| --------------------- | ------------------------------------------------------------------------------ |
| Participatory process | `ProcessPhase` / ethiKos pipeline instance                                     |
| Component             | Route-family capability under `/ethikos/*`                                     |
| Proposal              | `DecisionRecord` or `Draft` depending stage                                    |
| Debate                | `EthikosTopic` + `EthikosArgument`                                             |
| Accountability        | `ImpactTrack`                                                                  |
| Admin permissions     | `/ethikos/admin/roles` + `DiscussionParticipantRole` / future governance rules |
| Traceability          | `AuditEvent` / `ModerationAction`                                              |
| Taxonomy              | `TopicTag` / category / policy domain                                          |

## 7.5.4 Route targets

```yaml
ROUTE_TARGETS:
  PRIMARY:
    - "/ethikos/impact/tracker"
    - "/ethikos/impact/outcomes"
    - "/ethikos/admin/audit"
    - "/ethikos/admin/moderation"
    - "/ethikos/admin/roles"
  SECONDARY:
    - "/ethikos/pulse/overview"
    - "/ethikos/pulse/health"
    - "/ethikos/learn/guides"
```

## 7.5.5 Model impact

First-pass proposed models:

```yaml
FIRST_PASS_MODEL_CANDIDATES:
  - "ImpactTrack"
  - "ImpactUpdate"
  - "ProcessPhase"
  - "AuditEvent"
  - "ModerationAction"
```

Some of these may already exist partially or be represented by current admin/moderation surfaces. The migration plan must verify current code before creating new tables.

## 7.5.6 First-pass allowed work

Decidim MAY inspire:

* process phases;
* impact status tracking;
* public accountability snapshots;
* audit trails;
* moderation transparency;
* route-family explanation in Learn;
* admin permissions review.

## 7.5.7 First-pass forbidden work

Decidim MUST NOT cause:

* importing Decidim/Rails code;
* replacing the Django backend;
* switching to GraphQL for first-pass CRUD;
* creating Decidim-style component framework inside ethiKos;
* making ethiKos a full civic operating system in first pass.

## 7.5.8 Kintsugi classification

```yaml
CLASSIFICATION:
  MIMIC: true
  ANNEX: false
  IMPORT_CODE: false
  CREATE_APP: false
```

---

# 7.6 CONSUL Democracy

## 7.6.1 Status

```yaml
SOURCE: "CONSUL Democracy"
FIRST_PASS_STATUS: "in_scope"
STRATEGY: "native_mimic"
PRIORITY: "P2"
PRIMARY_ROUTE_SCOPE: "/ethikos/decide/* + /ethikos/admin/* + /ethikos/impact/*"
PRIMARY_OWNER: "Konsultations + Smart Vote"
```

## 7.6.2 Retained pattern

CONSUL Democracy is retained as inspiration for:

* consultation governance;
* proposal thresholds;
* eligibility rules;
* census/participation boundaries;
* admin-controlled participation settings;
* public proposal lifecycle;
* open-government accountability patterns.

## 7.6.3 ethiKos mapping

| CONSUL concept                 | ethiKos Kintsugi mapping                     |
| ------------------------------ | -------------------------------------------- |
| Proposal                       | `DecisionRecord` or `Draft`                  |
| Supports / votes               | `BallotEvent` + Smart Vote baseline/readings |
| Census / eligibility           | `EligibilityRule`                            |
| Participatory budget / process | Future consultation process type             |
| Admin moderation               | `/ethikos/admin/moderation`                  |
| Public result                  | `ReadingResult` + `DecisionRecord`           |
| Accountability                 | `ImpactTrack`                                |

## 7.6.4 Route targets

```yaml
ROUTE_TARGETS:
  PRIMARY:
    - "/ethikos/decide/public"
    - "/ethikos/decide/results"
    - "/ethikos/admin/roles"
    - "/ethikos/impact/tracker"
  SECONDARY:
    - "/ethikos/decide/methodology"
    - "/ethikos/learn/guides"
```

## 7.6.5 Model impact

First-pass proposed models:

```yaml
FIRST_PASS_MODEL_CANDIDATES:
  - "EligibilityRule"
  - "DecisionProtocol"
  - "DecisionRecord"
  - "ImpactTrack"
```

## 7.6.6 First-pass allowed work

CONSUL MAY inspire:

* eligibility rules;
* proposal thresholds;
* public voting windows;
* result eligibility notes;
* admin role gating;
* impact follow-up.

## 7.6.7 First-pass forbidden work

CONSUL MUST NOT cause:

* importing CONSUL code;
* replacing current authentication;
* adding full census infrastructure in first pass;
* replacing EkoH cohort context;
* bypassing Smart Vote readings;
* adding separate CONSUL routes.

## 7.6.8 Kintsugi classification

```yaml
CLASSIFICATION:
  MIMIC: true
  ANNEX: false
  IMPORT_CODE: false
  CREATE_APP: false
```

---

# 7.7 DemocracyOS

## 7.7.1 Status

```yaml
SOURCE: "DemocracyOS"
FIRST_PASS_STATUS: "in_scope"
STRATEGY: "native_mimic"
PRIORITY: "P2"
PRIMARY_ROUTE_SCOPE: "/ethikos/decide/* + /ethikos/deliberate/*"
PRIMARY_OWNER: "Korum + ethiKos decision layer"
```

## 7.7.2 Retained pattern

DemocracyOS is retained as inspiration for:

* proposal-centric policy discussion;
* structured public debate around proposals;
* clear voting/discussion relationship;
* public agenda-style issue pages;
* admin/staff controls;
* visibility and participation rules.

## 7.7.3 ethiKos mapping

| DemocracyOS concept    | ethiKos Kintsugi mapping                           |
| ---------------------- | -------------------------------------------------- |
| Topic / law / proposal | `DecisionRecord` or `EthikosTopic` depending stage |
| Discussion             | `EthikosArgument` tree                             |
| Vote                   | `BallotEvent` / Smart Vote-compatible event        |
| Result                 | `ReadingResult`                                    |
| Admin/staff            | `/ethikos/admin/roles`                             |
| Visibility             | `DiscussionVisibilitySetting`                      |

## 7.7.4 Route targets

```yaml
ROUTE_TARGETS:
  PRIMARY:
    - "/ethikos/decide/public"
    - "/ethikos/deliberate/[topic]"
  SECONDARY:
    - "/ethikos/admin/roles"
    - "/ethikos/decide/results"
    - "/ethikos/learn/guides"
```

## 7.7.5 Model impact

First-pass proposed models:

```yaml
FIRST_PASS_MODEL_CANDIDATES:
  - "DecisionRecord"
  - "DecisionProtocol"
  - "DiscussionVisibilitySetting"
```

## 7.7.6 First-pass allowed work

DemocracyOS MAY inspire:

* proposal pages that combine summary, arguments, and vote state;
* clear discussion-to-decision flow;
* public visibility states;
* proposal status labels.

## 7.7.7 First-pass forbidden work

DemocracyOS MUST NOT cause:

* importing Node/Mongo architecture;
* replacing Django/DRF;
* replacing PostgreSQL;
* creating a DemocracyOS subapp;
* collapsing ethiKos topics and decisions into one ambiguous object;
* bypassing Smart Vote readings.

## 7.7.8 Kintsugi classification

```yaml
CLASSIFICATION:
  MIMIC: true
  ANNEX: false
  IMPORT_CODE: false
  CREATE_APP: false
```

---

## 8. Cross-source synthesis by route family

## 8.1 `/ethikos/deliberate/*`

Primary source references:

```yaml
DELIBERATE_SOURCES:
  PRIMARY:
    - "Kialo-style argument mapping"
  SECONDARY:
    - "Consider.it"
    - "DemocracyOS"
```

Main retained patterns:

* argument graph;
* claim cards;
* pro/con edges;
* topic stance;
* claim source links;
* claim-level impact vote;
* role-aware suggestions;
* moderation;
* author visibility;
* vote visibility;
* topic background info;
* deliberation guidelines.

Current core models:

```yaml
CURRENT_MODELS:
  - "EthikosTopic"
  - "EthikosArgument"
  - "EthikosStance"
  - "EthikosCategory"
```

First-pass proposed support models:

```yaml
PROPOSED_SUPPORT_MODELS:
  - "ArgumentSource"
  - "ArgumentImpactVote"
  - "ArgumentSuggestion"
  - "DiscussionParticipantRole"
  - "DiscussionVisibilitySetting"
```

---

## 8.2 `/ethikos/decide/*`

Primary source references:

```yaml
DECIDE_SOURCES:
  PRIMARY:
    - "Loomio"
  SECONDARY:
    - "CONSUL Democracy"
    - "DemocracyOS"
    - "Citizen OS"
```

Main retained patterns:

* proposal lifecycle;
* decision protocol;
* voting window;
* eligibility rule;
* baseline result;
* Smart Vote reading;
* outcome publication;
* methodology explanation.

First-pass proposed support models:

```yaml
PROPOSED_SUPPORT_MODELS:
  - "DecisionProtocol"
  - "DecisionRecord"
  - "EligibilityRule"
  - "LensDeclaration"
  - "ReadingResult"
```

---

## 8.3 Drafting capability

Primary source references:

```yaml
DRAFTING_SOURCES:
  PRIMARY:
    - "Citizen OS"
  SECONDARY:
    - "Loomio"
    - "Decidim"
```

Main retained patterns:

* draft from topic;
* version history;
* amendment;
* rationale packet;
* promotion to decision record;
* auditability.

First-pass proposed support models:

```yaml
PROPOSED_SUPPORT_MODELS:
  - "Draft"
  - "DraftVersion"
  - "Amendment"
  - "RationalePacket"
```

Route note:

```yaml
ROUTE_NOTE:
  CURRENT_ROUTE: "No canonical /ethikos/draft/* route is fixed yet."
  RULE: "Do not invent /ethikos/draft/* implementation without route-plan and ADR alignment."
```

---

## 8.4 `/ethikos/impact/*`

Primary source references:

```yaml
IMPACT_SOURCES:
  PRIMARY:
    - "Decidim"
  SECONDARY:
    - "CONSUL Democracy"
```

Main retained patterns:

* outcome follow-up;
* implementation tracking;
* public accountability;
* feedback loop;
* status timeline.

First-pass proposed support models:

```yaml
PROPOSED_SUPPORT_MODELS:
  - "ImpactTrack"
  - "ImpactUpdate"
```

Important ownership rule:

```yaml
IMPACT_OWNERSHIP_RULE:
  IMPACT_BELONGS_TO: "Konsultations + accountability handoff"
  IMPACT_DOES_NOT_BELONG_TO: "KeenKonnect as source of truth"
```

KeenKonnect may receive execution handoff links, but it must not own civic impact truth.

---

## 8.5 `/ethikos/admin/*`

Primary source references:

```yaml
ADMIN_SOURCES:
  PRIMARY:
    - "Decidim"
    - "CONSUL Democracy"
    - "Kialo-style argument mapping"
```

Main retained patterns:

* audit trail;
* moderation queue;
* participant roles;
* eligibility controls;
* visibility settings;
* permission-gated operations;
* suggested claim review.

First-pass proposed support models:

```yaml
PROPOSED_SUPPORT_MODELS:
  - "DiscussionParticipantRole"
  - "DiscussionVisibilitySetting"
  - "EligibilityRule"
  - "ModerationAction"
  - "AuditEvent"
```

---

## 8.6 `/ethikos/pulse/*`

Primary source references:

```yaml
PULSE_SOURCES:
  PRIMARY:
    - "Decidim"
    - "Consider.it"
  SECONDARY:
    - "Kialo-style argument mapping"
```

Main retained patterns:

* participation health;
* deliberation quality;
* argument balance;
* live participation state;
* trend detection;
* unresolved conflict signals.

First-pass model impact should be minimal. Prefer derived metrics from existing and newly added records.

---

## 8.7 `/ethikos/trust/*`

Primary source references:

```yaml
TRUST_SOURCES:
  PRIMARY:
    - "EkoH internal docs"
  SECONDARY:
    - "CONSUL Democracy"
    - "Decidim"
```

Main retained patterns:

* expertise profile;
* badges;
* credentials;
* cohort context;
* eligibility explanation;
* public/private trust display controls.

EkoH remains context. It is not a voting engine.

---

## 8.8 `/ethikos/learn/*`

Primary source references:

```yaml
LEARN_SOURCES:
  PRIMARY:
    - "Internal Kintsugi docs"
    - "Kialo-style guidance"
    - "Smart Vote/EkoH methodology"
```

Main retained patterns:

* glossary;
* methodology;
* public explanation;
* voting explanation;
* roles explanation;
* deliberation guidance;
* Kintsugi changelog.

---

## 8.9 `/ethikos/insights`

Primary source references:

```yaml
INSIGHTS_SOURCES:
  PRIMARY:
    - "Smart Vote"
    - "EkoH"
    - "Decidim accountability patterns"
    - "Kialo perspectives"
```

Main retained patterns:

* baseline vs reading comparison;
* cohort views;
* argument graph summaries;
* impact visibility;
* decision result interpretation.

---

## 9. Cross-source synthesis by pipeline stage

| Pipeline stage                     | Owner                      | Main sources                          | Main retained patterns                                 |
| ---------------------------------- | -------------------------- | ------------------------------------- | ------------------------------------------------------ |
| Stage 0 — Intake                   | Konsultations              | Decidim, CONSUL                       | issue intake, eligibility, categorization              |
| Stage 1 — Discovery / Consultation | Konsultations              | Consider.it, Decidim, CONSUL          | options, constraints, participation landscape          |
| Stage 2 — Deliberation             | Korum                      | Kialo-style, Consider.it, DemocracyOS | argument graph, claims, sources, reason capture        |
| Stage 3 — Drafting                 | ethiKos bounded capability | Citizen OS, Loomio                    | draft, amendment, versioning, rationale                |
| Stage 4 — Decision                 | Smart Vote                 | Loomio, CONSUL, DemocracyOS           | protocol, ballots, results, readings                   |
| Stage 5 — Accountability           | Konsultations + handoff    | Decidim, CONSUL                       | impact track, outcome follow-up, public accountability |

---

## 10. First-pass model impact matrix

| Model / object                | Source inspiration              | Owner                 | First-pass status | Notes                                         |
| ----------------------------- | ------------------------------- | --------------------- | ----------------- | --------------------------------------------- |
| `EthikosTopic`                | Kialo, DemocracyOS, Consider.it | Korum                 | Existing          | Preserve                                      |
| `EthikosArgument`             | Kialo, Consider.it, DemocracyOS | Korum                 | Existing          | Preserve; do not rename to Claim              |
| `EthikosStance`               | Consider.it, internal ethiKos   | Korum                 | Existing          | Topic-level `-3..+3` only                     |
| `EthikosCategory`             | Internal ethiKos                | Korum                 | Existing          | Preserve                                      |
| `ArgumentSource`              | Kialo                           | Korum                 | Candidate         | Source/citation attached to argument          |
| `ArgumentImpactVote`          | Kialo                           | Korum                 | Candidate         | Claim-level impact `0..4`                     |
| `ArgumentSuggestion`          | Kialo                           | Korum/Admin           | Candidate         | Role-aware suggested claims                   |
| `DiscussionParticipantRole`   | Kialo, Decidim                  | Korum/Admin           | Candidate         | owner/admin/editor/writer/suggester/viewer    |
| `DiscussionVisibilitySetting` | Kialo, DemocracyOS              | Korum/Admin           | Candidate         | anonymity, author visibility, vote visibility |
| `DecisionProtocol`            | Loomio, CONSUL                  | Smart Vote / ethiKos  | Candidate         | Decision method and thresholds                |
| `DecisionRecord`              | Loomio, DemocracyOS, CONSUL     | Smart Vote / ethiKos  | Candidate         | Decision lifecycle and outcome                |
| `EligibilityRule`             | CONSUL, Decidim                 | Konsultations / Admin | Candidate         | Participation eligibility                     |
| `LensDeclaration`             | Smart Vote / EkoH               | Smart Vote            | Candidate         | Declared reading lens                         |
| `ReadingResult`               | Smart Vote / EkoH               | Smart Vote            | Candidate         | Derived result publication                    |
| `Draft`                       | Citizen OS                      | ethiKos drafting      | Candidate         | Decision-ready text                           |
| `DraftVersion`                | Citizen OS                      | ethiKos drafting      | Candidate         | Version history                               |
| `Amendment`                   | Citizen OS                      | ethiKos drafting      | Candidate         | Proposed text change                          |
| `RationalePacket`             | Citizen OS, Kialo               | ethiKos drafting      | Candidate         | Why text says what it says                    |
| `ImpactTrack`                 | Decidim, CONSUL                 | Konsultations         | Candidate         | Accountability tracking                       |
| `ExternalArtifact`            | Annex rulebook                  | Boundary layer        | Candidate         | Future annex artifact                         |
| `ProjectionMapping`           | Annex rulebook                  | Boundary layer        | Candidate         | Future projection mapping                     |

---

## 11. First-pass UI impact matrix

| UI surface                        | Main source         | Route                                                      | First-pass status          |
| --------------------------------- | ------------------- | ---------------------------------------------------------- | -------------------------- |
| Argument tree                     | Kialo               | `/ethikos/deliberate/[topic]`                              | In scope                   |
| Argument node card                | Kialo, Consider.it  | `/ethikos/deliberate/[topic]`                              | In scope                   |
| Source panel                      | Kialo               | `/ethikos/deliberate/[topic]`                              | In scope                   |
| Suggested claims panel            | Kialo               | `/ethikos/deliberate/[topic]`, `/ethikos/admin/moderation` | In scope                   |
| Basic topic info/background panel | Kialo               | `/ethikos/deliberate/[topic]`                              | In scope                   |
| Guided voting drawer              | Kialo               | `/ethikos/deliberate/[topic]`                              | Optional first pass        |
| Minimap tree mode                 | Kialo               | `/ethikos/deliberate/[topic]`                              | Optional first pass        |
| Sunburst minimap                  | Kialo               | `/ethikos/deliberate/[topic]`                              | Deferred                   |
| Proposal lifecycle cards          | Loomio, DemocracyOS | `/ethikos/decide/*`                                        | In scope                   |
| Decision result panel             | Loomio, Smart Vote  | `/ethikos/decide/results`                                  | In scope                   |
| Draft/version panel               | Citizen OS          | Decide/Drafting surface                                    | In scope if model approved |
| Impact timeline                   | Decidim, CONSUL     | `/ethikos/impact/tracker`                                  | In scope                   |
| Admin audit table                 | Decidim             | `/ethikos/admin/audit`                                     | In scope                   |
| Eligibility settings              | CONSUL              | `/ethikos/admin/roles`, `/ethikos/decide/methodology`      | Optional first pass        |
| Reading comparison dashboard      | Smart Vote/EkoH     | `/ethikos/insights`                                        | In scope                   |

---

## 12. Explicit no-go matrix

| Source         | No-go item                            | Reason                                     |
| -------------- | ------------------------------------- | ------------------------------------------ |
| Consider.it    | Import codebase                       | First pass is native mimic only            |
| Kialo          | Create `konnaxion.kialo`              | Kialo-style belongs inside Korum           |
| Kialo          | Rename `EthikosArgument` to `Claim`   | Existing model must remain stable          |
| Kialo          | Treat claim impact votes as stances   | Different semantic level                   |
| Loomio         | Replace auth/session model            | Out of scope                               |
| Loomio         | Replace Smart Vote                    | Smart Vote owns readings                   |
| Citizen OS     | Add Etherpad annex now                | Annex not allowed first pass               |
| Citizen OS     | Store draft versions as arguments     | Drafting is separate bounded capability    |
| Decidim        | Rebuild Decidim component framework   | Too large and incompatible with first pass |
| Decidim        | Switch backend style to Rails/GraphQL | Current backend is Django/DRF              |
| CONSUL         | Add full census infrastructure now    | Too broad for first pass                   |
| CONSUL         | Replace EkoH cohort context           | EkoH owns cohort/expertise context         |
| DemocracyOS    | Import Node/Mongo architecture        | Current stack remains Django/PostgreSQL    |
| DemocracyOS    | Create separate DemocracyOS routes    | Native mimic inside `/ethikos/*`           |
| Polis          | Add clustering models now             | Deferred                                   |
| LiquidFeedback | Add delegation/liquid voting now      | Deferred                                   |
| OpenSlides     | Add meeting/parliament workflow now   | Deferred                                   |

---

## 13. Integration readiness scale

Use this readiness scale in later docs and backlog planning.

```yaml
INTEGRATION_READINESS:
  R0_REJECTED:
    meaning: "Not allowed or explicitly out of scope."

  R1_REFERENCE_ONLY:
    meaning: "Useful for public credit or future research, but not first pass."

  R2_CONCEPT_MIMIC:
    meaning: "Use as product inspiration only."

  R3_CONTRACT_MIMIC:
    meaning: "Define objects, payloads, routes, and rules around this pattern."

  R4_IMPLEMENTATION_CANDIDATE:
    meaning: "Ready for later backlog after docs and code inspection."

  R5_ANNEX_CANDIDATE:
    meaning: "Possible future sidecar, requires isolation, adapter, license clearance, and ADR."
```

First-pass source readiness:

| Source                       | Readiness         |
| ---------------------------- | ----------------- |
| Kialo-style argument mapping | R3                |
| Loomio                       | R3                |
| Citizen OS                   | R3                |
| Decidim                      | R3                |
| CONSUL Democracy             | R2/R3             |
| DemocracyOS                  | R2/R3             |
| Consider.it                  | R2                |
| Polis                        | R1                |
| LiquidFeedback               | R1                |
| All Our Ideas                | R1                |
| Your Priorities              | R1                |
| OpenSlides                   | R1/R5 future only |

---

## 14. Anti-drift rules

The following rules are binding.

```yaml
ANTI_DRIFT_RULES:
  - "First-pass sources are fixed by this document."
  - "Deferred sources MUST NOT produce first-pass tasks."
  - "All first-pass source patterns are native mimic only."
  - "No external source may write directly to Korum or Konsultations core tables."
  - "No first-pass source may create a new top-level frontend app."
  - "No first-pass source may create a new backend app unless an ADR explicitly allows it later."
  - "Kialo-style features extend Korum under /ethikos/deliberate/*."
  - "Loomio-style features inform /ethikos/decide/*."
  - "Citizen OS-style features inform bounded drafting capability."
  - "Decidim-style features inform process, admin, and accountability."
  - "CONSUL-style features inform eligibility, thresholds, and governance."
  - "DemocracyOS-style features inform proposal-centric discussion."
  - "Smart Vote publishes readings only."
  - "EkoH provides expertise/ethics/cohort context only."
  - "Impact truth belongs to Konsultations/accountability, not KeenKonnect."
  - "Do not expand /api/home/*."
```

---

## 15. Related documents

This document should be read with:

```text
00_KINTSUGI_START_HERE.md
01_ETHIKOS_KINTSUGI_EXECUTION_STRATEGY.md
02_SOURCE_OF_TRUTH_AND_DRIFT_CONTROL.md
03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md
04_CANONICAL_NAMING_AND_VARIABLES.md
06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md
08_DATA_MODEL_AND_MIGRATION_PLAN.md
09_SMART_VOTE_EKOH_READING_CONTRACT.md
11_MIMIC_VS_ANNEX_RULEBOOK.md
12_CANONICAL_OBJECTS_AND_EVENTS.md
14_FRONTEND_ALIGNMENT_CONTRACT.md
15_BACKEND_ALIGNMENT_CONTRACT.md
18_ADR_REGISTER.md
19_OSS_CODE_READING_PLAN.md
20_AI_GENERATION_GUARDRAILS.md
21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md
22_IMPLEMENTATION_BACKLOG_TEMPLATE.md
```

---

## 16. Final binding statement

```yaml
FINAL_BINDING_STATEMENT:
  FIRST_PASS_IS:
    - "Native mimic of selected civic-tech patterns"
    - "Route-preserving"
    - "Ownership-preserving"
    - "Documentation-first"
    - "Contract-driven"

  FIRST_PASS_IS_NOT:
    - "Full OSS merge"
    - "Annex integration"
    - "New Kialo module"
    - "New Kintsugi app"
    - "Route rewrite"
    - "Backend ownership collapse"
    - "Implementation backlog"

  MOST_IMPORTANT_SOURCE_PATTERN:
    DELIBERATION: "Kialo-style argument mapping"
    DECISION: "Loomio-style proposal lifecycle"
    DRAFTING: "Citizen OS-style drafting/versioning"
    ACCOUNTABILITY: "Decidim-style process and accountability"
    ELIGIBILITY: "CONSUL-style governance"
    PROPOSAL_DISCUSSION: "DemocracyOS-style proposal-centric debate"
    REASON_CAPTURE: "Consider.it-style pro/con reason clarity"

  PRIMARY_DRIFT_CONTROL_RULE:
    "If an external source pattern conflicts with ethiKos boundaries, mimic the useful idea only and preserve ethiKos ownership, routes, and source-of-truth rules."
