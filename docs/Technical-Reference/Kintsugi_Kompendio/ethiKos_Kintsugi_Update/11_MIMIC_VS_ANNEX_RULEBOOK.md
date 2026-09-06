# 11 — Mimic vs Annex Rulebook

**File:** `11_MIMIC_VS_ANNEX_RULEBOOK.md`  
**Pack:** `ethiKos Kintsugi Update Documentation Pack`  
**Canonical path:** `docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/`  
**Status:** Draft for execution alignment  
**Version:** `2026-04-25-kintsugi-doc-pack-v1`  
**Primary module:** `ethiKos`  
**Update name:** `Kintsugi`  

---

## 1. Purpose

This document defines the rules for deciding whether an external civic technology pattern should be:

1. **Mimicked** natively inside ethiKos;
2. **Annexed** later as an isolated sidecar or adapter-based integration;
3. **Deferred** entirely;
4. **Rejected** for Kintsugi purposes.

The Kintsugi Upgrade uses external civic technology as inspiration, not as a reason to merge foreign architectures into Konnaxion.

This rulebook exists to prevent:

- full OSS merge drift;
- duplicate truth systems;
- accidental route-family expansion;
- foreign tool capture of Korum or Konsultations tables;
- Smart Vote/EkoH boundary confusion;
- speculative integration work before documentation contracts are stable.

The rule for the first pass is:

```txt
Mimic useful patterns natively.
Do not annex first.
Do not merge external tools.
Do not let external tools own ethiKos truth.
````

---

## 2. Scope

This document applies to all external civic technology patterns considered for the ethiKos Kintsugi Upgrade, including but not limited to:

* Consider.it;
* Kialo-style argument mapping;
* Loomio;
* Citizen OS;
* Decidim;
* CONSUL Democracy;
* DemocracyOS;
* Polis;
* LiquidFeedback;
* All Our Ideas;
* Your Priorities;
* OpenSlides.

It governs:

* first-pass pattern selection;
* mimic vs annex classification;
* deferred source handling;
* adapter boundaries;
* route mapping;
* data ownership;
* audit requirements;
* anti-drift rules;
* AI generation behavior.

It does not define:

* exact model fields;
* exact serializers;
* final UI copy;
* implementation tasks;
* repository-specific code-reading results;
* license conclusions beyond strategic classification.

Those details belong in the companion docs listed in Section 21.

---

## 3. Canonical Variables Used

```yaml
RULEBOOK:
  DEFAULT_EXTERNAL_TOOL_STRATEGY: "mimic"
  FIRST_PASS_STRATEGY: "partial_native_mimic"
  FULL_EXTERNAL_MERGE_ALLOWED: false
  ANNEX_FIRST_PASS_ALLOWED: false
  BIG_BANG_REWRITE_ALLOWED: false

ROUTE_POLICY:
  PRIMARY_ROUTE_SURFACE: "/ethikos/*"
  CREATE_NEW_TOP_LEVEL_ROUTE_FAMILY: false
  CREATE_KIALO_ROUTE_FAMILY: false
  CREATE_KINTSUGI_APP_ROUTE: false

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
  ANNEX_REQUIRES_ADAPTERS: true
  ANNEX_REQUIRES_NO_DUAL_TRUTH: true

ANNEX_BOUNDARY_OBJECTS:
  - "ExternalArtifact"
  - "ProjectionMapping"
```

---

## 4. Core Definitions

## 4.1 Mimic

**Mimic** means native reimplementation of a useful product, workflow, or data pattern inside Konnaxion.

A mimicked pattern:

* is implemented in the existing Konnaxion stack;
* uses existing ethiKos route families;
* writes canonical records through ethiKos-owned services;
* preserves ethiKos data ownership;
* avoids importing foreign app architecture;
* avoids direct dependency on the source project;
* credits the inspiration without becoming a clone.

Mimic is the default Kintsugi strategy.

### Example

Kialo-style argument mapping is mimicked by extending `/ethikos/deliberate/*` with claim-tree UX, source panels, argument impact votes, and suggested claims. It does not create `/kialo/*`, does not import Kialo code, and does not rename `EthikosArgument` to `Claim`.

---

## 4.2 Annex

**Annex** means optional sidecar integration through a controlled adapter boundary.

An annexed tool:

* remains operationally separate;
* is replaceable;
* is isolated from core ethiKos tables;
* never writes directly to Korum or Konsultations records;
* exposes artifacts that ethiKos may ingest, project, or reference;
* is connected through `ExternalArtifact` and `ProjectionMapping`;
* does not become the canonical source of ethiKos truth.

Annex is not allowed in the first Kintsugi pass.

Annex may be considered later only after documentation, code reading, licensing review, and ADR approval.

---

## 4.3 Merge

**Merge** means importing an external tool’s code, schema, architecture, workflow, or app surface into the Konnaxion core.

Merge is forbidden for the Kintsugi first pass.

Examples of forbidden merge behavior:

```txt
Importing Loomio as the decision engine.
Embedding Decidim as the ethiKos process layer.
Creating a full Citizen OS stack inside Konnaxion.
Replacing EthikosArgument with Kialo Claim models.
Letting DemocracyOS own proposal truth.
Letting OpenSlides own ethiKos decisions.
```

---

## 4.4 Deferred

**Deferred** means the source is acknowledged but not used for first-pass implementation.

Deferred sources may be:

* credited publicly;
* kept in Kompendio as references;
* revisited after the Kintsugi contracts are stable;
* reviewed in future code-reading work.

Deferred sources MUST NOT create first-pass models, routes, services, migrations, or backlog tasks.

---

## 4.5 Rejected

**Rejected** means the source or pattern is not suitable for Kintsugi.

Reasons may include:

* license conflict;
* architecture capture risk;
* duplicate truth risk;
* security risk;
* incompatible governance model;
* unnecessary complexity;
* route or ownership conflict;
* mismatch with ethiKos purpose.

Rejected sources should be documented only if they are likely to be proposed again.

---

## 5. First-Pass Classification

The first Kintsugi pass is mimic-only.

| Source                       | First-pass status | Rule                                                         |
| ---------------------------- | ----------------: | ------------------------------------------------------------ |
| Consider.it                  |             Mimic | Reason capture and pro/con deliberation compression          |
| Kialo-style argument mapping |             Mimic | Structured argument tree, sources, impact votes, permissions |
| Loomio                       |             Mimic | Proposal lifecycle and decision protocol patterns            |
| Citizen OS                   |             Mimic | Drafting, amendments, versioning, topic phases               |
| Decidim                      |             Mimic | Process architecture, accountability, admin patterns         |
| CONSUL Democracy             |             Mimic | Eligibility, thresholds, public proposal mechanics           |
| DemocracyOS                  |             Mimic | Proposal-centric policy debate UX                            |

No first-pass source is annexed.

No first-pass source is merged.

---

## 6. Deferred Classification

The following sources are explicitly not first pass.

| Source          |                           Status | Rule                                             |
| --------------- | -------------------------------: | ------------------------------------------------ |
| Polis           |    Deferred / public credit only | Do not implement consensus mapping now           |
| LiquidFeedback  |    Deferred / public credit only | Do not implement delegation/liquid democracy now |
| All Our Ideas   |                         Deferred | Do not implement pairwise ranking now            |
| Your Priorities |                         Deferred | Do not implement idea prioritization sidecar now |
| OpenSlides      | Deferred / possible future annex | Do not implement assembly/parliament mode now    |

These tools may appear in public credits or long-term architecture notes, but they MUST NOT drive first-pass implementation.

---

## 7. Decision Rule Summary

Use this decision tree before adopting any external pattern.

```txt
1. Is the feature needed for the first-pass Kintsugi scope?
   - No  → Defer.
   - Yes → Continue.

2. Can the pattern be implemented natively inside existing ethiKos routes?
   - Yes → Mimic.
   - No  → Continue.

3. Is the external tool modular, isolated, replaceable, and license-compatible?
   - No  → Defer or reject.
   - Yes → Continue.

4. Would annexing it create duplicate truth or direct writes to core ethiKos tables?
   - Yes → Reject or redesign as mimic.
   - No  → Future annex candidate.

5. Is this first pass?
   - Yes → Mimic or defer only.
   - No  → Annex may be considered with ADR approval.
```

---

## 8. Mimic Criteria

A source SHOULD be mimicked when one or more of the following are true:

* the idea is valuable but the codebase is too large;
* the source stack is incompatible with Konnaxion;
* the license creates friction or risk;
* the tool is effectively a full civic operating system;
* the UX pattern is useful but the data model is not;
* Konnaxion needs a unified ethiKos experience;
* canonical records must remain native ethiKos truth;
* the source would otherwise dominate the product;
* the pattern is easy to express through current routes and models;
* the pattern improves legitimacy without adding infrastructure burden.

A mimic implementation MUST:

* live under `/ethikos/*`;
* use Konnaxion frontend conventions;
* use the existing services layer;
* use Django/DRF contracts on the backend;
* preserve current core models unless a non-breaking extension is documented;
* map foreign concepts to canonical objects;
* cite the source as inspiration where appropriate;
* avoid imported code unless separately approved.

---

## 9. Annex Criteria

A source MAY be considered for annex later when all conditions below are true:

```yaml
ANNEX_REQUIREMENTS:
  FEATURE_IS_MODULAR: true
  FEATURE_IS_OPTIONAL: true
  FEATURE_IS_REPLACEABLE: true
  LICENSE_REVIEW_COMPLETE: true
  SECURITY_REVIEW_COMPLETE: true
  ADAPTER_BOUNDARY_DEFINED: true
  NO_CORE_TABLE_WRITES: true
  NO_DUAL_TRUTH: true
  NO_ROUTE_FAMILY_CAPTURE: true
  NO_PRODUCT_DOMINANCE: true
  ADR_APPROVED: true
```

An annex candidate MUST use:

```txt
ExternalArtifact
ProjectionMapping
Adapter service
Explicit provenance
Optional projection through ethiKos services
```

An annex candidate MUST NOT:

* write directly to Korum tables;
* write directly to Konsultations tables;
* mutate Smart Vote readings;
* mutate EkoH snapshots;
* become the baseline result authority;
* require ethiKos users to leave the core product flow;
* bypass permissions, audit, or identity rules.

---

## 10. Merge Rejection Criteria

A proposal MUST be rejected if it requires any of the following:

* replacing existing ethiKos route families;
* replacing existing Korum or Konsultations ownership;
* importing a full external civic application into core;
* letting an external tool own baseline facts;
* letting an external tool write directly into core tables;
* creating a second decision engine;
* creating a second shell or navigation system;
* duplicating user identity or permission systems;
* forcing Konnaxion to adopt the external tool’s stack;
* hiding raw baseline results behind a derived interpretation;
* making Smart Vote mutate upstream facts;
* making EkoH the voting engine.

---

## 11. Pattern Mapping Rules

Every external source must be reduced to patterns before implementation.

A pattern entry MUST specify:

```yaml
PATTERN_ENTRY:
  SOURCE_NAME: ""
  SOURCE_STATUS: "mimic | annex_candidate | deferred | rejected"
  PATTERN_NAME: ""
  ETHIKOS_ROUTE_TARGET: ""
  CANONICAL_OBJECT_TARGET: ""
  OWNER_LAYER: "Korum | Konsultations | Smart Vote | EkoH | Drafting"
  DATA_IMPACT: "none | new field | new table | adapter artifact"
  RISK_LEVEL: "low | medium | high"
  FIRST_PASS_ALLOWED: true_or_false
  NON_GOALS:
    - ""
```

A pattern entry MUST NOT say only:

```txt
Use Loomio.
Use Decidim.
Integrate Kialo.
Add Polis.
```

It MUST say:

```txt
Mimic Loomio-style proposal lifecycle under /ethikos/decide/* using native DecisionRecord objects.
```

---

## 12. Route Mapping Rules

All first-pass patterns MUST map to existing ethiKos route families.

| Route family            | Allowed pattern types                                                         |
| ----------------------- | ----------------------------------------------------------------------------- |
| `/ethikos/deliberate/*` | argument mapping, pro/con reasoning, sources, suggested claims, moderation    |
| `/ethikos/decide/*`     | proposal lifecycle, decision protocols, ballots, results, Smart Vote readings |
| `/ethikos/impact/*`     | accountability, outcomes, implementation tracking, feedback                   |
| `/ethikos/pulse/*`      | participation health, live signals, trends, process visibility                |
| `/ethikos/trust/*`      | expertise context, credentials, EkoH-facing trust markers                     |
| `/ethikos/admin/*`      | roles, audit, moderation, eligibility, visibility controls                    |
| `/ethikos/learn/*`      | glossary, guides, methodology, public explanation                             |
| `/ethikos/insights`     | analytics, reading comparison, interpretation                                 |

Forbidden route drift:

```txt
/kialo/*
/loomio/*
/decidim/*
/consul/*
/citizen-os/*
/democracyos/*
/kintsugi-app/*
/deliberation/*
```

Conceptual or public documentation pages may refer to Kintsugi, Korum, or Konsultations, but implementation work must respect the actual `/ethikos/*` surface.

---

## 13. Ownership Rules

The following ownership rules are binding.

## 13.1 Korum

Korum owns:

* debate topics;
* stance events;
* arguments;
* argument graph;
* claim-like UX;
* sources attached to arguments;
* argument impact votes;
* suggested claims;
* debate moderation.

Korum MAY mimic:

* Kialo-style argument mapping;
* Consider.it-style pro/con reason capture;
* DemocracyOS-style proposal discussion.

Korum MUST NOT:

* own Smart Vote readings;
* own consultation ballot truth;
* embed drafting tables directly into argument tables;
* let Kialo become a separate backend app.

---

## 13.2 Konsultations

Konsultations owns:

* intake;
* consultation framing;
* ballots;
* result snapshots;
* citizen suggestions;
* impact tracking.

Konsultations MAY mimic:

* Citizen OS topic phases;
* CONSUL proposal mechanics;
* Decidim process phases;
* DemocracyOS policy proposal framing.

Konsultations MUST NOT:

* overwrite Korum arguments;
* mutate Smart Vote readings;
* make KeenKonnect the civic impact source of truth;
* use external tools as baseline ballot authority.

---

## 13.3 Smart Vote

Smart Vote owns:

* baseline and declared result publication;
* derived readings;
* lens declarations;
* aggregations;
* result payloads.

Smart Vote MAY use EkoH snapshots as context.

Smart Vote MUST NOT:

* mutate Korum records;
* mutate Konsultations records;
* replace source events;
* hide the baseline reading;
* treat Kialo impact votes as ballots.

---

## 13.4 EkoH

EkoH owns:

* expertise context;
* ethics context;
* cohort eligibility;
* snapshot and audit context.

EkoH MAY inform Smart Vote readings.

EkoH MUST NOT:

* become the voting engine;
* mutate votes;
* override baseline results;
* write directly into Korum or Konsultations truth.

---

## 14. Adapter Boundary Rules

Any future annex must use explicit adapter objects.

## 14.1 `ExternalArtifact`

`ExternalArtifact` stores append-only imported or linked external payloads.

It SHOULD include:

```yaml
ExternalArtifact:
  source_system: string
  source_version: string
  external_id: string
  artifact_type: string
  raw_payload: json
  provenance: json
  captured_at: datetime
  captured_by: user_or_service
  checksum: string
  trust_status: enum
```

It MUST NOT become canonical ethiKos truth by itself.

---

## 14.2 `ProjectionMapping`

`ProjectionMapping` maps external IDs to internal canonical IDs.

It SHOULD include:

```yaml
ProjectionMapping:
  source_system: string
  external_id: string
  internal_object_type: string
  internal_object_id: string
  mapping_confidence: enum
  mapping_status: enum
  created_at: datetime
  reviewed_by: user_or_service
```

Projection into canonical objects MUST happen through ethiKos services, not direct database writes.

---

## 15. First-Pass Source Rules

## 15.1 Consider.it

Status:

```txt
first_pass_mimic
```

Allowed pattern extraction:

* reason capture;
* pro/con positioning;
* deliberation compression;
* strength/clarity signals;
* comparison of reasons.

Target:

```txt
/ethikos/deliberate/*
Korum
EthikosArgument
ArgumentSource
ArgumentImpactVote
```

Forbidden:

* direct code import;
* separate Consider.it route;
* replacing Korum argument model.

---

## 15.2 Kialo-style Argument Mapping

Status:

```txt
first_pass_mimic
```

Allowed pattern extraction:

* thesis-centered discussion;
* claim tree;
* pro/con relation;
* sources;
* impact votes;
* suggested claims;
* roles and permissions;
* anonymity settings;
* minimap as future/optional;
* perspectives as future/optional.

Target:

```txt
/ethikos/deliberate/*
Korum
EthikosTopic
EthikosArgument
ArgumentSource
ArgumentImpactVote
ArgumentSuggestion
DiscussionParticipantRole
DiscussionVisibilitySetting
```

Forbidden:

* creating `konnaxion.kialo`;
* creating `/kialo/*`;
* renaming `EthikosArgument` to `Claim`;
* treating impact votes as topic stances;
* treating impact votes as Smart Vote ballots.

---

## 15.3 Loomio

Status:

```txt
first_pass_mimic
```

Allowed pattern extraction:

* discussion-to-proposal transition;
* sense-check patterns;
* proposal lifecycle;
* time-boxed decision;
* outcome publication;
* dissent visibility.

Target:

```txt
/ethikos/decide/*
DecisionProtocol
DecisionRecord
BaselineResult
ReadingResult
```

Forbidden:

* direct Loomio import;
* separate Loomio auth model;
* replacing Smart Vote publication logic;
* making Loomio the decision source of truth.

---

## 15.4 Citizen OS

Status:

```txt
first_pass_mimic
```

Allowed pattern extraction:

* topic phases;
* collaborative drafting;
* amendments;
* version history;
* structured discussion around text;
* action handoff.

Target:

```txt
ethiKos drafting capability
Draft
DraftVersion
Amendment
RationalePacket
```

Forbidden:

* embedding Etherpad stack in first pass;
* direct Citizen OS deployment;
* merging drafting tables into Korum argument tables;
* replacing ethiKos routes with Citizen OS flow.

---

## 15.5 Decidim

Status:

```txt
first_pass_mimic
```

Allowed pattern extraction:

* process phases;
* accountability;
* proposals;
* debates;
* meetings as conceptual future reference;
* admin/process configuration;
* participatory component structure.

Target:

```txt
/ethikos/impact/*
/ethikos/admin/*
/ethikos/pulse/*
ProcessPhase
ImpactTrack
AuditEvent
ModerationAction
```

Forbidden:

* direct Decidim import;
* adopting Decidim’s full Rails architecture;
* making Decidim the process source of truth;
* creating a second participatory process platform beside ethiKos.

---

## 15.6 CONSUL Democracy

Status:

```txt
first_pass_mimic
```

Allowed pattern extraction:

* eligibility rules;
* thresholds;
* proposal gating;
* civic administration;
* public accountability patterns.

Target:

```txt
/ethikos/decide/*
/ethikos/admin/*
/ethikos/impact/*
EligibilityRule
DecisionProtocol
ImpactTrack
```

Forbidden:

* direct CONSUL import;
* replacing Konnaxion auth/permissions;
* making CONSUL census logic canonical without EkoH/Konnaxion alignment.

---

## 15.7 DemocracyOS

Status:

```txt
first_pass_mimic
```

Allowed pattern extraction:

* proposal-centric policy discussion;
* clause-level review patterns;
* public debate around proposals;
* role/visibility ideas where useful.

Target:

```txt
/ethikos/decide/*
/ethikos/deliberate/*
DecisionRecord
EthikosArgument
Draft
```

Forbidden:

* direct DemocracyOS import;
* adopting its stack;
* creating a separate proposal truth system.

---

## 16. Deferred Source Rules

## 16.1 Polis

Status:

```txt
deferred_public_credit_only
```

Allowed now:

* public inspiration credit;
* future research note.

Forbidden now:

* implementing clustering;
* implementing bridge statement engine;
* implementing agree/disagree/pass at Polis scale;
* adding Polis-specific models;
* annexing Polis.

---

## 16.2 LiquidFeedback

Status:

```txt
deferred_public_credit_only
```

Allowed now:

* public inspiration credit;
* future governance theory reference.

Forbidden now:

* implementing delegation;
* implementing liquid democracy vote flows;
* adding delegation tables;
* adding delegation UI;
* making Smart Vote a delegation engine.

---

## 16.3 All Our Ideas

Status:

```txt
deferred
```

Forbidden now:

* pairwise ranking implementation;
* sidecar integration;
* ranking-specific models;
* first-pass prioritization engine.

---

## 16.4 Your Priorities

Status:

```txt
deferred
```

Forbidden now:

* idea-prioritization sidecar;
* standalone idea-intake route;
* external prioritization data source;
* first-pass annex.

---

## 16.5 OpenSlides

Status:

```txt
deferred_possible_future_annex
```

Allowed later:

* possible assembly/parliament mode analysis.

Forbidden now:

* assembly mode implementation;
* formal meeting governance route;
* motions/elections stack;
* first-pass annex.

---

## 17. Scoring Rubric

Each candidate pattern SHOULD be scored before adoption.

| Criterion             | Score 0                  | Score 1             | Score 2                        |
| --------------------- | ------------------------ | ------------------- | ------------------------------ |
| First-pass relevance  | Not relevant             | Useful later        | Needed now                     |
| Route fit             | Needs new route family   | Partial fit         | Fits existing `/ethikos/*`     |
| Ownership fit         | Conflicts with ownership | Needs clarification | Clean owner                    |
| Data safety           | Creates duplicate truth  | Needs adapter       | Native canonical fit           |
| Stack fit             | Incompatible             | Adapter needed      | Native implementation easy     |
| UX coherence          | Fragments UX             | Needs redesign      | Strengthens ethiKos UX         |
| License risk          | High                     | Unknown             | Low or irrelevant due to mimic |
| Implementation weight | Heavy                    | Medium              | Light                          |
| Auditability          | Weak                     | Possible            | Strong                         |
| Replaceability        | Hard                     | Medium              | Easy                           |

Interpretation:

```txt
16–20 = good mimic candidate
10–15 = document carefully; mimic only if strategic
5–9   = defer
0–4   = reject
```

Annex cannot be approved by score alone. Annex requires explicit ADR approval.

---

## 18. Required Decision Record

Every future annex or major mimic must produce a short decision record.

Template:

```md
# Pattern Decision Record

## Source
Name:

## Status
Mimic / Annex candidate / Deferred / Rejected:

## Pattern retained

## Pattern rejected

## Route target

## Owner layer

## Canonical object target

## Data impact

## Adapter required?

## License concern

## Security concern

## Audit concern

## Decision

## Rationale

## Related docs
```

---

## 19. Non-Goals

This rulebook does not authorize:

* implementation of all listed sources;
* sidecar integration in first pass;
* full code import from any civic tool;
* new top-level app routes;
* new backend apps for source-specific clones;
* implementation of Polis clustering;
* implementation of LiquidFeedback delegation;
* implementation of OpenSlides parliament mode;
* implementation of All Our Ideas pairwise ranking;
* implementation of Your Priorities idea intake;
* changes to Smart Vote ownership;
* changes to EkoH ownership;
* replacement of current ethiKos models.

---

## 20. Anti-Drift Rules

The following rules are binding.

## 20.1 Default to Mimic

If uncertain, choose:

```txt
mimic_or_defer
```

Do not choose annex by default.

---

## 20.2 Existing Routes Win

If a pattern can fit under `/ethikos/*`, it MUST fit under `/ethikos/*`.

Do not create route families named after external tools.

---

## 20.3 Native Truth Wins

If an external tool produces data that overlaps with Korum or Konsultations truth, ethiKos canonical records win.

External payloads remain artifacts until explicitly projected.

---

## 20.4 Baseline Stays Visible

No mimic or annex may hide baseline results behind a weighted or filtered interpretation.

Smart Vote readings are additional readings, not replacements.

---

## 20.5 No Tool Capture

A foreign civic tool must never become the controlling architecture for ethiKos.

The source may inspire:

```txt
UX pattern
workflow pattern
data vocabulary
audit idea
permission idea
```

It must not control:

```txt
routes
database ownership
identity
permissions
truth source
decision authority
```

---

## 20.6 No Backlog Leakage

This rulebook does not create implementation tasks.

Implementation tasks must be produced later through:

```txt
22_IMPLEMENTATION_BACKLOG_TEMPLATE.md
```

---

## 21. Related Docs

This file should be read with:

| File                                          | Relationship                            |
| --------------------------------------------- | --------------------------------------- |
| `00_KINTSUGI_START_HERE.md`                   | Entry point and baseline                |
| `01_ETHIKOS_KINTSUGI_EXECUTION_STRATEGY.md`   | Strategic execution frame               |
| `02_SOURCE_OF_TRUTH_AND_DRIFT_CONTROL.md`     | Conflict resolution and source priority |
| `03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md`    | Ownership and write rules               |
| `04_CANONICAL_NAMING_AND_VARIABLES.md`        | Fixed names and constants               |
| `06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md`   | Route target mapping                    |
| `08_DATA_MODEL_AND_MIGRATION_PLAN.md`         | Non-destructive model additions         |
| `09_SMART_VOTE_EKOH_READING_CONTRACT.md`      | Baseline/readings/snapshot rules        |
| `10_FIRST_PASS_INTEGRATION_MATRIX.md`         | Source-to-pattern matrix                |
| `18_ADR_REGISTER.md`                          | Architecture decisions                  |
| `19_OSS_CODE_READING_PLAN.md`                 | How to inspect source repos             |
| `20_AI_GENERATION_GUARDRAILS.md`              | AI drift prevention                     |
| `21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md` | Kialo-specific mimic contract           |
| `22_IMPLEMENTATION_BACKLOG_TEMPLATE.md`       | Future task-generation format           |

---

## 22. Final Rule

The Kintsugi integration posture is:

```txt
Learn from external civic tools.
Credit them clearly.
Mimic useful patterns natively.
Protect ethiKos truth.
Keep routes stable.
Keep ownership explicit.
Defer annexes.
Never merge blindly.
```

For first-pass Kintsugi work, the only valid actions are:

```txt
Mimic
Defer
Reject
Document future annex candidate
```

The invalid action is:

```txt
Merge
```

```

Source basis: Kintsugi clean-slate scope, the existing Kintsugi master draft, the boundaries document’s Annex/Mimic and ownership rules, and the code/documentation snapshot showing the need to preserve existing ethiKos surfaces and contracts. :contentReference[oaicite:0]{index=0} :contentReference[oaicite:1]{index=1} :contentReference[oaicite:2]{index=2} :contentReference[oaicite:3]{index=3}
```
