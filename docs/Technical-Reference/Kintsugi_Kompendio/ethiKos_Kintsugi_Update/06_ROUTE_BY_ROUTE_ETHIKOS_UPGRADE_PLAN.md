# 06 — Route-by-Route ethiKos Upgrade Plan

**Document ID:** `06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md`  
**Pack:** ethiKos Kintsugi Update Documentation Pack  
**Status:** Canonical planning document  
**Last aligned:** 2026-04-25  
**Primary scope:** Existing `/ethikos/*` route family  
**Implementation mode:** Partial native mimic, no full external merge

---

## 1. Purpose

This document maps the Kintsugi upgrade onto the existing ethiKos route surface.

The goal is to prevent route drift, feature drift, and architecture drift while upgrading ethiKos from a structured debate module into a full civic deliberation, drafting, decision, reading, and accountability engine.

This document defines:

- which existing ethiKos routes remain canonical;
- what each route family owns after the Kintsugi upgrade;
- which OSS-inspired patterns are allowed on each route;
- which backend domain each route should read from or write to;
- which routes should be upgraded, kept stable, or deferred;
- what must not be created as a parallel route family.

---

## 2. Scope

This document covers the existing frontend route family:

```txt
/ethikos/*
````

The canonical ethiKos route families are:

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

This document does not define a new application, a new module shell, or a new top-level Kintsugi route.

---

## 3. Canonical Variables Used

```yaml
PRIMARY_ROUTE_SURFACE: "/ethikos/*"

PRIMARY_DELIBERATION_ROUTE: "/ethikos/deliberate/*"
PRIMARY_DECISION_ROUTE: "/ethikos/decide/*"
PRIMARY_IMPACT_ROUTE: "/ethikos/impact/*"
PRIMARY_ADMIN_ROUTE: "/ethikos/admin/*"

KINTSUGI_UPDATE_TYPE: "documentation-first architecture upgrade"
IMPLEMENTATION_STYLE: "partial native mimic"
FULL_EXTERNAL_MERGE_ALLOWED: false
ANNEX_FIRST_PASS_ALLOWED: false
EXISTING_ROUTE_FAMILIES_STABLE: true

KORUM_OWNS:
  - topics
  - stances
  - arguments
  - argument moderation
  - structured deliberation

KONSULTATIONS_OWNS:
  - intake
  - ballots
  - consultation results
  - impact tracking

SMART_VOTE_OWNS:
  - readings
  - lenses
  - result publication

EKOH_OWNS:
  - expertise context
  - ethics context
  - cohort eligibility
  - snapshots

KIALO_ROUTE_SCOPE: "/ethikos/deliberate/*"
KIALO_BACKEND_SCOPE: "konnaxion.ethikos"
KIALO_DISCUSSION_MAPPING: "Discussion -> EthikosTopic"
KIALO_CLAIM_MAPPING: "Claim -> EthikosArgument"
KIALO_EDGE_MAPPING: "parent + side"
KIALO_IMPACT_VOTE_IS_TOPIC_STANCE: false

LEGACY_OR_PROBLEMATIC_ENDPOINTS:
  - "/api/home/*"
```

---

## 4. Non-goals

The Kintsugi route upgrade MUST NOT:

* create a new `/kintsugi` top-level application;
* create a new `/kialo` route family;
* create a separate `konnaxion.kialo` backend app;
* replace existing `/ethikos/*` routes;
* rename `EthikosArgument` to `Claim`;
* rename `/api/ethikos/...` to `/api/deliberation/...`;
* convert EkoH into a voting engine;
* let Smart Vote mutate Korum or Konsultations source facts;
* expand legacy `/api/home/*` usage;
* create a second module shell or theme system;
* treat Kialo-style impact votes as topic-level stances;
* treat Kialo-style impact votes as Smart Vote ballots.

---

## 5. Current Route Surface

The existing ethiKos frontend already contains the required product surface for the Kintsugi upgrade.

```txt
/ethikos/admin/audit
/ethikos/admin/moderation
/ethikos/admin/roles

/ethikos/decide/elite
/ethikos/decide/public
/ethikos/decide/results
/ethikos/decide/methodology

/ethikos/deliberate/elite
/ethikos/deliberate/[topic]
/ethikos/deliberate/guidelines

/ethikos/impact/feedback
/ethikos/impact/outcomes
/ethikos/impact/tracker

/ethikos/insights

/ethikos/learn/changelog
/ethikos/learn/glossary
/ethikos/learn/guides

/ethikos/pulse/health
/ethikos/pulse/live
/ethikos/pulse/overview
/ethikos/pulse/trends

/ethikos/trust/badges
/ethikos/trust/credentials
/ethikos/trust/profile
```

These routes are sufficient for the Kintsugi first pass. New top-level civic routes SHOULD NOT be introduced unless a future ADR explicitly authorizes them.

---

## 6. Route Ownership Summary

| Route family            | Kintsugi role                             | Primary owner                  | Supporting layers                      | First-pass OSS inspiration            |
| ----------------------- | ----------------------------------------- | ------------------------------ | -------------------------------------- | ------------------------------------- |
| `/ethikos/deliberate/*` | Structured deliberation                   | Korum                          | EkoH, Smart Vote readings later        | Kialo-style, Consider.it, DemocracyOS |
| `/ethikos/decide/*`     | Decision protocols and result publication | Konsultations + Smart Vote     | EkoH                                   | Loomio, CONSUL Democracy, DemocracyOS |
| `/ethikos/impact/*`     | Accountability and outcomes               | Konsultations                  | KeenKonnect handoff later              | Decidim, CONSUL Democracy             |
| `/ethikos/pulse/*`      | Civic health and live signals             | ethiKos analytics              | Korum, Konsultations, Smart Vote       | Decidim-style process visibility      |
| `/ethikos/trust/*`      | Expertise and trust context               | EkoH                           | Smart Vote                             | EkoH internal model                   |
| `/ethikos/admin/*`      | Moderation, audit, roles                  | ethiKos admin                  | Korum, Konsultations, Smart Vote, EkoH | Decidim, CONSUL, Kialo permissions    |
| `/ethikos/learn/*`      | Methodology and public explanation        | ethiKos documentation UX       | All layers                             | Native                                |
| `/ethikos/insights`     | Analytics and reading comparison          | Smart Vote + ethiKos analytics | EkoH                                   | Smart Vote, Decidim accountability    |

---

## 7. Backend Alignment

### 7.1 Existing canonical backend endpoints

Current ethiKos core API endpoints:

```txt
/api/ethikos/topics/
/api/ethikos/stances/
/api/ethikos/arguments/
/api/ethikos/categories/
```

Current compatibility aliases:

```txt
/api/deliberate/...
/api/deliberate/elite/...
```

Current related decision/vote endpoint:

```txt
/api/kollective/votes/
```

### 7.2 Current core models

```txt
EthikosCategory
EthikosTopic
EthikosStance
EthikosArgument
```

### 7.3 Route upgrade principle

Routes SHOULD continue to read/write through the existing service layer and canonical API endpoints.

Legacy or problematic endpoints such as:

```txt
/api/home/*
```

MUST NOT be expanded. They SHOULD be replaced, isolated, or documented as legacy.

---

## 8. Frontend Shell Alignment

All ethiKos pages MUST remain inside the existing ethiKos/global shell.

Pages MUST NOT:

* create local full-page shells;
* redefine a separate major page header outside the module shell;
* define local breadcrumbs if handled globally;
* create a second theme system;
* bypass the established module layout pattern.

Expected shell behavior:

```txt
Global layout
  -> MainLayout
    -> ethiKos module layout
      -> EthikosPageShell
        -> Route page content
```

The Kintsugi upgrade is a route-content and service-contract upgrade, not a layout replacement.

---

# 9. Route-by-Route Upgrade Plan

---

## 9.1 `/ethikos/deliberate/[topic]`

### Current role

Topic-level deliberation page.

### Kintsugi role

Primary Korum workspace for structured argumentation.

This is the most important route for Kialo-style mimic.

### Canonical ownership

```yaml
Primary owner: Korum
Backend app: konnaxion.ethikos
Current model base:
  - EthikosTopic
  - EthikosArgument
  - EthikosStance
```

### First-pass upgrade targets

This route SHOULD become the primary structured argument workspace.

Required capabilities:

```txt
Argument tree
Claim detail panel
Pro/con branch visualization
Sources panel
Topic background panel
Topic-level stance capture
Claim-level impact vote distinction
Suggested claims queue
Role-aware participation
Author visibility awareness
Preview drawer fix
```

### Kialo-style mapping

```txt
Kialo Discussion -> EthikosTopic
Kialo Thesis -> EthikosTopic.title + description, later explicit thesis field
Kialo Claim -> EthikosArgument
Kialo Pro/Con relation -> EthikosArgument.parent + EthikosArgument.side
Kialo Source -> ArgumentSource
Kialo Impact Vote -> ArgumentImpactVote
Kialo Suggested Claim -> ArgumentSuggestion
```

### Vote separation

This route MUST distinguish:

```txt
EthikosStance:
  range: -3..+3
  meaning: user stance on topic
  model: EthikosStance

ArgumentImpactVote:
  range: 0..4
  meaning: impact/relevance/veracity of a claim relative to its parent
  proposed model: ArgumentImpactVote
```

### First-pass data additions

```txt
ArgumentSource
ArgumentImpactVote
ArgumentSuggestion
DiscussionParticipantRole
DiscussionVisibilitySetting
```

### Deferred data additions

```txt
ArgumentBookmark
ArgumentLink
DiscussionPerspective
DiscussionTemplate
DiscussionGroup
DiscussionExport
```

### OSS patterns

| Source      | Pattern                                                      |
| ----------- | ------------------------------------------------------------ |
| Kialo-style | claim graph, pro/con relation, sources, impact voting, roles |
| Consider.it | reason capture and deliberative compression                  |
| DemocracyOS | proposal-centric discussion framing                          |

### Required anti-drift rules

```txt
Do not rename EthikosArgument to Claim.
Do not create /kialo routes.
Do not create konnaxion.kialo.
Do not treat impact votes as stances.
Do not treat impact votes as Smart Vote ballots.
```

### Status

```txt
Upgrade: required
Priority: P0
Risk: medium
```

---

## 9.2 `/ethikos/deliberate/elite`

### Current role

Elite or expertise-oriented deliberation view.

### Kintsugi role

Expert-informed deliberation workspace.

This route SHOULD display deliberation through an expertise-aware lens without changing the baseline argument record.

### Canonical ownership

```yaml
Primary owner: Korum
Supporting context: EkoH
Derived reading layer: Smart Vote, if needed
```

### First-pass upgrade targets

```txt
Expertise-aware topic list
Expert contribution markers
EkoH context visibility
High-signal arguments
Moderation status indicators
Argument quality indicators
```

### Data source rules

This route MAY read EkoH context but MUST NOT let EkoH mutate Korum source facts.

### OSS patterns

| Source      | Pattern                                  |
| ----------- | ---------------------------------------- |
| Kialo-style | structured argument tree                 |
| Consider.it | reason quality and pro/con compression   |
| Decidim     | process legitimacy and transparent roles |

### Status

```txt
Upgrade: should
Priority: P1
Risk: medium
```

---

## 9.3 `/ethikos/deliberate/guidelines`

### Current role

Guidelines and methodology page for deliberation.

### Kintsugi role

Public explanation of Korum participation rules.

### First-pass upgrade targets

```txt
Explain topic-level stance vs claim-level impact vote
Explain pro/con argument tree
Explain sources and evidence expectations
Explain anonymous participation rules
Explain suggested claim approval flow
Explain moderation and role boundaries
```

### Required cross-links

```txt
/ethikos/deliberate/[topic]
/ethikos/learn/glossary
/ethikos/decide/methodology
```

### Status

```txt
Upgrade: required
Priority: P1
Risk: low
```

---

## 9.4 `/ethikos/decide/public`

### Current role

Public decision or voting page.

### Kintsugi role

Public-facing Konsultations decision workspace.

### Canonical ownership

```yaml
Primary owner: Konsultations
Reading publisher: Smart Vote
Context provider: EkoH
Related current endpoint: /api/kollective/votes/
```

### First-pass upgrade targets

```txt
Public proposal list
Open decision windows
Baseline ballot capture
Eligibility hints
Decision protocol display
Clear link to result methodology
```

### Proposed model alignment

```txt
DecisionProtocol
DecisionRecord
BallotEvent
EligibilityRule
```

### OSS patterns

| Source           | Pattern                                |
| ---------------- | -------------------------------------- |
| Loomio           | proposal lifecycle and decision states |
| CONSUL Democracy | eligibility, thresholds, civic gating  |
| DemocracyOS      | proposal-centric public debate         |

### Critical distinction

This route captures or displays decision participation. It does not perform Smart Vote weighting directly in the source event.

Smart Vote readings are derived later.

### Status

```txt
Upgrade: required
Priority: P0
Risk: medium
```

---

## 9.5 `/ethikos/decide/elite`

### Current role

Elite or expert-oriented decision page.

### Kintsugi role

Expert-context decision workspace.

### Canonical ownership

```yaml
Primary owner: Konsultations
Context provider: EkoH
Reading publisher: Smart Vote
```

### First-pass upgrade targets

```txt
Expert cohort visibility
Eligibility context
Expertise-weighted reading preview
Baseline vs expert-context distinction
Decision protocol metadata
```

### Anti-drift rules

```txt
Do not make EkoH the voting engine.
Do not hide baseline public result.
Do not replace raw ballots with weighted results.
Do not mutate source ballots from this route.
```

### OSS patterns

| Source           | Pattern                                 |
| ---------------- | --------------------------------------- |
| Loomio           | proposal lifecycle                      |
| CONSUL Democracy | eligibility rules                       |
| Decidim          | transparent participatory process roles |

### Status

```txt
Upgrade: should
Priority: P1
Risk: medium-high
```

---

## 9.6 `/ethikos/decide/results`

### Current role

Results page.

### Kintsugi role

Canonical result publication and reading comparison route.

### Canonical ownership

```yaml
Baseline owner: Konsultations
Derived readings owner: Smart Vote
Snapshot context: EkoH
```

### First-pass upgrade targets

```txt
Baseline unweighted result
Declared Smart Vote readings
Reading metadata
Lens declaration display
Snapshot reference display
Computed-at timestamp
Comparison between baseline and derived readings
```

### Required data concepts

```txt
BaselineResult
LensDeclaration
ReadingResult
SnapshotRef
DecisionRecord
```

### Required reading fields

```txt
reading_key
lens_hash
snapshot_ref
computed_at
topic_id or consultation_id
results_payload
```

### Anti-drift rules

```txt
Baseline result must remain visible.
Derived readings must be labeled as readings.
Derived readings must be reproducible.
Smart Vote must not mutate source facts.
```

### Status

```txt
Upgrade: required
Priority: P0
Risk: high
```

---

## 9.7 `/ethikos/decide/methodology`

### Current role

Methodology explanation page.

### Kintsugi role

Public explanation of decision protocols, Smart Vote readings, and EkoH context.

### First-pass upgrade targets

```txt
Explain baseline vs reading
Explain Smart Vote lens declarations
Explain EkoH snapshot context
Explain eligibility rules
Explain decision protocol states
Explain audit/reproducibility requirements
```

### Related docs

```txt
09_SMART_VOTE_EKOH_READING_CONTRACT.md
12_CANONICAL_OBJECTS_AND_EVENTS.md
13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md
```

### Status

```txt
Upgrade: required
Priority: P1
Risk: low
```

---

## 9.8 `/ethikos/impact/tracker`

### Current role

Impact tracking route.

### Kintsugi role

Canonical accountability tracker.

### Canonical ownership

```yaml
Primary owner: Konsultations
Downstream handoff: KeenKonnect optional, later
```

### First-pass upgrade targets

```txt
Decision-to-impact traceability
Impact status
Public milestones
Implementation updates
Blocked/completed/cancelled states
Evidence links
Accountability snapshots
```

### Proposed model alignment

```txt
ImpactTrack
ImpactUpdate
DecisionRecord
ExternalArtifact
ProjectionMapping
```

### OSS patterns

| Source           | Pattern                             |
| ---------------- | ----------------------------------- |
| Decidim          | accountability and process tracking |
| CONSUL Democracy | public civic follow-through         |

### Anti-drift rules

```txt
Impact truth belongs to ethiKos/Konsultations.
KeenKonnect may receive handoffs later.
Do not make KeenKonnect Project the canonical civic impact source.
```

### Status

```txt
Upgrade: required
Priority: P1
Risk: medium
```

---

## 9.9 `/ethikos/impact/outcomes`

### Current role

Outcome display.

### Kintsugi role

Public outcome ledger.

### First-pass upgrade targets

```txt
Published decision outcomes
Outcome explanations
Baseline result link
Smart Vote reading link
Implementation state
Public accountability notes
```

### Related routes

```txt
/ethikos/decide/results
/ethikos/impact/tracker
/ethikos/insights
```

### Status

```txt
Upgrade: should
Priority: P1
Risk: medium
```

---

## 9.10 `/ethikos/impact/feedback`

### Current role

Feedback route.

### Kintsugi role

Post-decision feedback loop.

### First-pass upgrade targets

```txt
Citizen feedback after decision
Impact satisfaction signal
Implementation concern capture
Feedback-to-impact linkage
Moderation state
```

### Proposed model alignment

```txt
ImpactTrack
ImpactUpdate
FeedbackSubmission
ModerationAction
```

### OSS patterns

| Source           | Pattern                           |
| ---------------- | --------------------------------- |
| Decidim          | participatory accountability      |
| CONSUL Democracy | civic feedback and follow-through |

### Status

```txt
Upgrade: should
Priority: P2
Risk: low-medium
```

---

## 9.11 `/ethikos/pulse/overview`

### Current role

Pulse overview.

### Kintsugi role

Civic process overview.

### First-pass upgrade targets

```txt
Open topics
Open decisions
Active deliberations
Participation volume
Health summary
Stage distribution
```

### Data sources

```txt
EthikosTopic
EthikosArgument
EthikosStance
DecisionRecord
ReadingResult
ImpactTrack
```

### Status

```txt
Upgrade: should
Priority: P2
Risk: low
```

---

## 9.12 `/ethikos/pulse/live`

### Current role

Live activity view.

### Kintsugi role

Live civic activity stream.

### First-pass upgrade targets

```txt
Recent arguments
Recent stances
Recent decision activity
Recent moderation actions
Recent impact updates
```

### Anti-drift rule

This route SHOULD display activity. It SHOULD NOT become a separate source of truth.

### Status

```txt
Upgrade: should
Priority: P2
Risk: low
```

---

## 9.13 `/ethikos/pulse/health`

### Current role

Health metrics.

### Kintsugi role

Deliberation and decision health dashboard.

### First-pass upgrade targets

```txt
Argument balance
Participation diversity
Moderation load
Stance distribution
Decision completion rate
Impact follow-through rate
```

### Related concepts

```txt
ArgumentGraph
StanceEvent
DecisionRecord
ReadingResult
ImpactTrack
ModerationAction
```

### Status

```txt
Upgrade: optional first pass
Priority: P3
Risk: medium
```

---

## 9.14 `/ethikos/pulse/trends`

### Current role

Trends route.

### Kintsugi role

Longitudinal civic intelligence route.

### First-pass upgrade targets

```txt
Topic trend over time
Stance trend over time
Argument activity trend
Decision trend
Impact trend
Reading comparison trend
```

### Status

```txt
Upgrade: optional first pass
Priority: P3
Risk: medium
```

---

## 9.15 `/ethikos/trust/profile`

### Current role

Trust profile route.

### Kintsugi role

User-facing EkoH trust and expertise context for civic participation.

### Canonical ownership

```yaml
Primary owner: EkoH
Civic display context: ethiKos
```

### First-pass upgrade targets

```txt
Expertise areas
Trust context
Civic contribution context
Participation role context
Readable explanation of influence boundaries
```

### Anti-drift rules

```txt
Trust profile does not grant hidden vote mutation.
EkoH is context, not ballot engine.
```

### Status

```txt
Upgrade: should
Priority: P2
Risk: medium
```

---

## 9.16 `/ethikos/trust/badges`

### Current role

Badge display.

### Kintsugi role

Recognition and credibility surface.

### First-pass upgrade targets

```txt
Civic participation badges
Expertise badges
Moderation trust markers
Contribution quality markers
```

### Status

```txt
Upgrade: optional first pass
Priority: P3
Risk: low
```

---

## 9.17 `/ethikos/trust/credentials`

### Current role

Credential display.

### Kintsugi role

Credential and eligibility context.

### First-pass upgrade targets

```txt
Credential display
Eligibility explanation
Expertise verification status
Cohort participation context
```

### Related routes

```txt
/ethikos/decide/elite
/ethikos/admin/roles
/ethikos/decide/methodology
```

### Status

```txt
Upgrade: optional first pass
Priority: P3
Risk: medium
```

---

## 9.18 `/ethikos/insights`

### Current role

Insights and analytics.

### Kintsugi role

Cross-layer civic intelligence dashboard.

### Canonical ownership

```yaml
Primary owner: ethiKos analytics
Reading owner: Smart Vote
Context provider: EkoH
```

### First-pass upgrade targets

```txt
Baseline result summaries
Smart Vote reading summaries
Topic-level participation analytics
Argument graph analytics
Impact/accountability analytics
Cohort/lens comparison summaries
```

### Data concepts

```txt
EthikosTopic
EthikosStance
EthikosArgument
DecisionRecord
LensDeclaration
ReadingResult
ImpactTrack
```

### Anti-drift rule

Insights may aggregate and visualize. It MUST NOT mutate source facts.

### Status

```txt
Upgrade: should
Priority: P1
Risk: medium
```

---

## 9.19 `/ethikos/admin/audit`

### Current role

Audit route.

### Kintsugi role

Canonical audit visibility surface.

### First-pass upgrade targets

```txt
Topic events
Argument events
Stance events
Decision events
Reading computation events
Moderation events
Impact update events
External artifact mapping events
```

### Proposed event alignment

```txt
TopicCreated
StanceRecorded
ArgumentCreated
ArgumentUpdated
ArgumentHidden
ArgumentSourceAttached
ArgumentImpactVoteRecorded
DecisionOpened
DecisionClosed
ReadingComputed
ImpactUpdated
ModerationActionRecorded
```

### OSS patterns

| Source           | Pattern                             |
| ---------------- | ----------------------------------- |
| Decidim          | admin transparency and traceability |
| CONSUL Democracy | governance controls                 |
| Kialo-style      | role and visibility controls        |

### Status

```txt
Upgrade: required
Priority: P1
Risk: medium
```

---

## 9.20 `/ethikos/admin/moderation`

### Current role

Moderation route.

### Kintsugi role

Korum and Konsultations moderation workspace.

### First-pass upgrade targets

```txt
Moderate arguments
Moderate suggested claims
Moderate sources
Moderate feedback
Hide/unhide argument artifacts
Review flagged participation
Role-aware moderation permissions
```

### Kialo-style requirements

Suggested claims from restricted roles SHOULD require approval before publication.

Anonymous participation MUST NOT expose identities to ordinary participants.

### Status

```txt
Upgrade: required
Priority: P1
Risk: medium-high
```

---

## 9.21 `/ethikos/admin/roles`

### Current role

Role management route.

### Kintsugi role

Canonical civic role and permission control.

### First-pass upgrade targets

```txt
Kialo-style discussion roles
Decision eligibility roles
Moderation roles
Admin roles
Expertise/credential visibility
Author visibility rules
Vote visibility rules
```

### Required role values

```txt
owner
admin
editor
writer
suggester
viewer
```

### Required visibility values

```txt
author_visibility:
  - never
  - admins_only
  - all

vote_visibility:
  - all
  - admins_only
  - self_only

participation_type:
  - standard
  - anonymous
```

### Status

```txt
Upgrade: required
Priority: P1
Risk: high
```

---

## 9.22 `/ethikos/learn/glossary`

### Current role

Glossary route.

### Kintsugi role

Terminology stabilization route.

### First-pass upgrade targets

The glossary SHOULD define:

```txt
Kintsugi
Korum
Konsultations
Smart Vote
EkoH
Baseline
Reading
Lens
Snapshot
Claim
Argument
Stance
Impact Vote
Decision Protocol
Impact Track
External Artifact
Projection Mapping
```

### Status

```txt
Upgrade: required
Priority: P2
Risk: low
```

---

## 9.23 `/ethikos/learn/guides`

### Current role

Guides route.

### Kintsugi role

User guidance route for participation.

### First-pass upgrade targets

```txt
How to deliberate
How to add sources
How to vote on a topic stance
How to vote on claim impact
How decisions work
How Smart Vote readings work
How accountability tracking works
```

### Status

```txt
Upgrade: should
Priority: P2
Risk: low
```

---

## 9.24 `/ethikos/learn/changelog`

### Current role

Changelog route.

### Kintsugi role

Public update log for Kintsugi rollout.

### First-pass upgrade targets

```txt
Kintsugi phase history
Route upgrade history
Methodology changes
Public feature status
Known limitations
```

### Status

```txt
Upgrade: optional first pass
Priority: P3
Risk: low
```

---

# 10. First-Pass Route Priorities

## P0 — Required for Kintsugi core

```txt
/ethikos/deliberate/[topic]
/ethikos/decide/public
/ethikos/decide/results
```

## P1 — Required for coherent governance

```txt
/ethikos/deliberate/guidelines
/ethikos/decide/elite
/ethikos/decide/methodology
/ethikos/impact/tracker
/ethikos/impact/outcomes
/ethikos/insights
/ethikos/admin/audit
/ethikos/admin/moderation
/ethikos/admin/roles
```

## P2 — Should upgrade after core

```txt
/ethikos/deliberate/elite
/ethikos/impact/feedback
/ethikos/pulse/overview
/ethikos/pulse/live
/ethikos/trust/profile
/ethikos/learn/glossary
/ethikos/learn/guides
```

## P3 — Optional first pass

```txt
/ethikos/pulse/health
/ethikos/pulse/trends
/ethikos/trust/badges
/ethikos/trust/credentials
/ethikos/learn/changelog
```

---

# 11. Route-to-Model Matrix

| Route family            | Current models                                      | Proposed first-pass additions                                                                                            | Owner                      |
| ----------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| `/ethikos/deliberate/*` | `EthikosTopic`, `EthikosArgument`, `EthikosStance`  | `ArgumentSource`, `ArgumentImpactVote`, `ArgumentSuggestion`, `DiscussionParticipantRole`, `DiscussionVisibilitySetting` | Korum                      |
| `/ethikos/decide/*`     | `EthikosTopic`, Kollective vote models              | `DecisionProtocol`, `DecisionRecord`, `BallotEvent`, `EligibilityRule`                                                   | Konsultations + Smart Vote |
| `/ethikos/impact/*`     | none canonical yet / possible loose project mapping | `ImpactTrack`, `ImpactUpdate`                                                                                            | Konsultations              |
| `/ethikos/pulse/*`      | aggregate only                                      | no source model required first pass                                                                                      | ethiKos analytics          |
| `/ethikos/trust/*`      | EkoH context                                        | no source model required first pass                                                                                      | EkoH                       |
| `/ethikos/insights`     | aggregate only                                      | `ReadingResult`, `LensDeclaration`                                                                                       | Smart Vote + analytics     |
| `/ethikos/admin/*`      | admin/audit/moderation records                      | `ModerationAction`, `AuditEvent`                                                                                         | ethiKos admin              |
| `/ethikos/learn/*`      | static/content                                      | no source model required                                                                                                 | ethiKos docs UX            |

---

# 12. Route-to-OSS Pattern Matrix

| Route                         | Consider.it | Kialo-style |  Loomio | Citizen OS | Decidim |  CONSUL | DemocracyOS |
| ----------------------------- | ----------: | ----------: | ------: | ---------: | ------: | ------: | ----------: |
| `/ethikos/deliberate/[topic]` |         yes |         yes |      no |         no |      no |      no |         yes |
| `/ethikos/deliberate/elite`   |         yes |         yes |      no |         no | partial |      no |     partial |
| `/ethikos/decide/public`      |          no |          no |     yes |    partial | partial |     yes |         yes |
| `/ethikos/decide/elite`       |          no |          no |     yes |    partial | partial |     yes |     partial |
| `/ethikos/decide/results`     |          no |          no |     yes |         no | partial |     yes |          no |
| `/ethikos/impact/tracker`     |          no |          no |      no |         no |     yes |     yes |          no |
| `/ethikos/admin/*`            |          no |     partial | partial |         no |     yes |     yes |     partial |
| `/ethikos/learn/*`            |     partial |     partial | partial |    partial | partial | partial |     partial |
| `/ethikos/insights`           |          no |     partial | partial |         no |     yes | partial |          no |

---

# 13. Legacy Endpoint Cleanup Notes

The route upgrade should reduce or isolate legacy front-back links.

Problematic pattern:

```txt
/api/home/*
```

Policy:

```txt
Do not expand this usage.
Do not create new Kintsugi features on /api/home/*.
Replace with /api/ethikos/*, /api/kollective/*, or future documented endpoints.
If immediate replacement is unsafe, wrap behind service-layer adapter and mark legacy.
```

---

# 14. Known Bug Routing Note

## BUG-001

```yaml
title: "Deliberate preview drawer shows 'Preview / No data'"
status: "known_open"
route: "/ethikos/deliberate/[topic]"
classification: "targeted bugfix, not architecture"
```

This bug SHOULD be fixed during or before the `/ethikos/deliberate/[topic]` Kialo-style upgrade.

However, it MUST NOT be used as justification to redesign the route family, shell, or backend ownership model.

Likely category:

```txt
Preview drawer expects enriched topic preview shape, but receives raw topic or incompatible data.
```

Required handling:

```txt
Document expected preview payload.
Fix service-layer contract.
Avoid new raw fetch in page component.
```

---

# 15. Anti-Drift Rules

## 15.1 Route rules

```txt
Do not create /kintsugi as a product route.
Do not create /kialo as a product route.
Do not create /consult as a replacement for /ethikos/decide.
Do not create /debate as a replacement for /ethikos/deliberate.
Do not move ethiKos pages out of /ethikos/*.
```

## 15.2 Backend rules

```txt
Do not rename konnaxion.ethikos.
Do not create konnaxion.kialo in first pass.
Do not rename EthikosArgument to Claim.
Do not remove EthikosStance.
Do not rename /api/ethikos/* to /api/deliberation/*.
Do not let Smart Vote mutate upstream facts.
Do not let EkoH mutate ballots or stances.
```

## 15.3 Frontend rules

```txt
Do not create a second ethiKos shell.
Do not bypass EthikosPageShell.
Do not create a separate theme system.
Do not add raw fetch calls directly in page components unless documented.
Do not use route pages as data ownership sources.
```

## 15.4 Voting rules

```txt
EthikosStance = topic-level stance, range -3..+3.
ArgumentImpactVote = claim-level impact score, range 0..4.
Smart Vote Reading = derived result, reproducible from baseline events and lens declaration.
These three must never be collapsed into one concept.
```

---

# 16. Implementation Sequencing Notes

This document does not define the implementation backlog. It defines the route map that the backlog must obey.

Recommended implementation order after the documentation pack is complete:

```txt
1. Fix /ethikos/deliberate/[topic] preview contract.
2. Stabilize deliberate service layer.
3. Add Kialo-style argument tree/source/impact-vote contracts.
4. Add decision protocol/result reading contracts.
5. Add Smart Vote result display contracts.
6. Add impact tracking contracts.
7. Add admin audit/moderation/roles contracts.
8. Add glossary and methodology pages.
9. Add pulse/insights refinements.
```

---

# 17. Related Docs

This document depends on:

```txt
00_KINTSUGI_START_HERE.md
02_SOURCE_OF_TRUTH_AND_DRIFT_CONTROL.md
03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md
04_CANONICAL_NAMING_AND_VARIABLES.md
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
20_AI_GENERATION_GUARDRAILS.md
21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md
22_IMPLEMENTATION_BACKLOG_TEMPLATE.md
```

---

# 18. Final Route Contract

The Kintsugi upgrade MUST land inside the existing ethiKos route surface.

```txt
Kintsugi is not a new app.
Kintsugi is not a new route family.
Kintsugi is the route-by-route strengthening of ethiKos.
```

Canonical final mapping:

```txt
/ethikos/deliberate/* = Korum structured deliberation
/ethikos/decide/* = Konsultations decision + Smart Vote readings
/ethikos/impact/* = Konsultations accountability
/ethikos/pulse/* = civic health and live signals
/ethikos/trust/* = EkoH context visibility
/ethikos/admin/* = audit, moderation, roles
/ethikos/learn/* = methodology and public explanation
/ethikos/insights = analytics and reading comparison
```


