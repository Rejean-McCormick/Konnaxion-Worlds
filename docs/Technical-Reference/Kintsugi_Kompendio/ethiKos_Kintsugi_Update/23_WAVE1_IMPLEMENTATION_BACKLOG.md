# 23 — Wave 1 Implementation Backlog

**Document ID:** `23_WAVE1_IMPLEMENTATION_BACKLOG.md`  
**Pack:** ethiKos Kintsugi Update Documentation Pack  
**Target repo path:** `docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/23_WAVE1_IMPLEMENTATION_BACKLOG.md`  
**Generated for local path:** `C:\mycode\Konnaxion\Konnaxion\docs\Technical-Reference\Kintsugi_Kompendio\ethiKos_Kintsugi_Update\23_WAVE1_IMPLEMENTATION_BACKLOG.md`  
**Status:** Implementation backlog draft  
**Last aligned:** 2026-04-27  
**Primary scope:** Existing `/ethikos/*` route family  
**Implementation mode:** Partial native mimic, no full external merge  
**Execution strategy:** Slice-by-slice, with a thin shared foundation first

---

## 1. Purpose

This document converts the ethiKos Kintsugi documentation pack into an implementation backlog for Wave 1.

Wave 1 is defined as **all work included in `DocKintsugi_Kompendio.txt`**, landed inside the current Konnaxion codebase without creating a new Kintsugi app, new Kialo app, parallel route family, or foreign OSS import.

The backlog is intentionally organized into vertical slices so implementation can be split across multiple focused coding sessions. The Korum slice is expected to be the first full vertical slice after the shared foundation, because it exercises the canonical backend/frontend patterns without crossing too deeply into Smart Vote or EkoH ownership.

---

## 2. Canonical Variables

```yaml
DOCUMENT_ID: "23_WAVE1_IMPLEMENTATION_BACKLOG.md"
KINTSUGI_UPDATE_TYPE: "documentation-first architecture upgrade"
IMPLEMENTATION_STYLE: "partial_native_mimic"
FULL_EXTERNAL_MERGE_ALLOWED: false
ANNEX_FIRST_PASS_ALLOWED: false
EXISTING_ROUTE_FAMILIES_STABLE: true
EXISTING_CORE_MODELS_STABLE: true
BACKLOG_AFTER_DOCS_AND_CODE_READING: true
```

```yaml
PRIMARY_ROUTE_SURFACE: "/ethikos/*"

ETHIKOS_ROUTE_FAMILIES:
  DECIDE: "/ethikos/decide/*"
  DELIBERATE: "/ethikos/deliberate/*"
  TRUST: "/ethikos/trust/*"
  PULSE: "/ethikos/pulse/*"
  IMPACT: "/ethikos/impact/*"
  LEARN: "/ethikos/learn/*"
  INSIGHTS: "/ethikos/insights"
  ADMIN: "/ethikos/admin/*"
```

```yaml
CURRENT_ETHIKOS_CORE_MODELS:
  - "EthikosCategory"
  - "EthikosTopic"
  - "EthikosStance"
  - "EthikosArgument"

CURRENT_CANONICAL_ENDPOINTS:
  ETHIKOS_TOPICS: "/api/ethikos/topics/"
  ETHIKOS_STANCES: "/api/ethikos/stances/"
  ETHIKOS_ARGUMENTS: "/api/ethikos/arguments/"
  ETHIKOS_CATEGORIES: "/api/ethikos/categories/"
  KOLLECTIVE_VOTES: "/api/kollective/votes/"
```

```yaml
OWNERSHIP:
  KORUM:
    - "topics"
    - "arguments"
    - "argument graph"
    - "topic-level stances"
    - "debate moderation"

  KONSULTATIONS:
    - "intake"
    - "consultations"
    - "ballots"
    - "result snapshots"
    - "impact tracking"

  SMART_VOTE:
    - "readings"
    - "lens declarations"
    - "derived aggregations"
    - "result publication"

  EKOH:
    - "expertise context"
    - "ethics context"
    - "cohort eligibility"
    - "snapshot context"
```

```yaml
WRITE_RULES:
  FOREIGN_TOOLS_WRITE_CORE_TABLES: false
  SMART_VOTE_MUTATES_SOURCE_FACTS: false
  EKOH_IS_VOTING_ENGINE: false
  READINGS_ARE_DERIVED: true
```

```yaml
KIALO:
  STRATEGY: "native_mimic"
  ROUTE_SCOPE: "/ethikos/deliberate/*"
  BACKEND_SCOPE: "konnaxion.ethikos"
  CREATE_KIALO_BACKEND_APP: false
  CREATE_KIALO_FRONTEND_ROUTE: false
  IMPORT_KIALO_CODE: false
```

---

## 3. Source-of-Truth Priority

When the implementation session encounters conflicting information, use this priority order:

```yaml
SOURCE_PRIORITY_ORDER:
  1_CODE_SNAPSHOT_REALITY:
    description: "Routes, files, endpoints, current models, current serializers, current frontend services, current tests."

  2_BOUNDARIES_AND_OWNERSHIP:
    description: "Korum/Konsultations/Smart Vote/EkoH ownership, write rules, and pipeline boundaries."

  3_KINTSUGI_KOMPENDIO:
    description: "Wave 1 scope, route-by-route plan, API contracts, payload contracts, backend/frontend alignment."

  4_KIALO_STYLE_MAPPING:
    description: "Structured deliberation inspiration only for /ethikos/deliberate/*."

  5_OSS_REFERENCE_DOCS:
    description: "Pattern inspiration only; no first-pass merge or import."
```

---

## 4. Readiness Gate

The backlog is generated because the planning session has access to:

- the Kintsugi Kompendio documentation pack;
- the current repo snapshot volumes for backend, frontend, docs, endpoint graph, PlantUML, scripts, and miscellaneous files;
- OSS reference documentation uploads for Kialo-style mapping, Loomio, Citizen OS, Consider.it, Decidim, CONSUL Democracy, and DemocracyOS.

Local repository execution has not been performed inside the planning session. Therefore, implementation tasks MUST still be validated in the developer checkout.

```yaml
READINESS_STATUS:
  DOCS_PACK_AVAILABLE: true
  REPO_SNAPSHOT_AVAILABLE: true
  BACKEND_SNAPSHOT_AVAILABLE: true
  FRONTEND_SNAPSHOT_AVAILABLE: true
  ENDPOINT_GRAPH_AVAILABLE: true
  OSS_REFERENCE_DOCS_AVAILABLE: true
  LOCAL_TESTS_EXECUTED_BY_AI_SESSION: false
  MIGRATIONS_GENERATED_IN_LIVE_CHECKOUT: false
  FINAL_BACKLOG_CAN_BE_USED_FOR_SLICE_PLANNING: true
```

---

## 5. Wave 1 Execution Strategy

Use a hybrid strategy:

1. code a thin shared foundation first;
2. build vertical slices one at a time;
3. consolidate common files after real slice pressure appears;
4. run validation and no-drift checks after every slice;
5. only merge a slice when it leaves the repo runnable.

Do not pre-build every model, endpoint, service, and component up front. Do not leave all shared files until the end. Seed the reference pattern, then let slices expand it.

---

## 6. Slice Register

| Slice | Name | Primary ownership | Primary route/API surface | Status |
|---:|---|---|---|---|
| 0 | Foundation / no-drift baseline | Shared | all `/ethikos/*`, `/api/ethikos/*` | Ready |
| 1 | Korum / Deliberate | Korum | `/ethikos/deliberate/*`, `/api/ethikos/*` | Ready next |
| 2 | Konsultations / Decide | Konsultations | `/ethikos/decide/*`, `/api/ethikos/*` | Planned |
| 3 | Smart Vote readings | Smart Vote | `/ethikos/decide/*`, `/ethikos/insights`, `/api/kollective/*` | Planned |
| 4 | EkoH trust/context | EkoH | `/ethikos/trust/*`, `/ethikos/insights`, EkoH APIs | Planned |
| 5 | Drafting / rationale | ethiKos bounded capability | `/ethikos/decide/*`, `/ethikos/deliberate/*` | Planned |
| 6 | Impact / accountability | Konsultations | `/ethikos/impact/*` | Planned |
| 7 | Pulse / civic health | ethiKos read model | `/ethikos/pulse/*` | Planned |
| 8 | Insights / interpretation | Smart Vote + EkoH + Impact | `/ethikos/insights` | Planned |
| 9 | Admin / governance | Admin + moderation | `/ethikos/admin/*` | Planned |
| 10 | Learn / public explanation | Documentation/UI | `/ethikos/learn/*`, `/ethikos/decide/methodology` | Planned |
| 11 | Test/smoke hardening | QA | backend + frontend tests | Planned |
| 12 | Documentation/ADR/release notes | Docs | Kintsugi docs | Planned |

---

## 7. Shared Files Strategy

### 7.1 Code now as foundation

These files form the initial reference pattern and may be touched before Slice 1:

```txt
backend/konnaxion/ethikos/constants.py
backend/konnaxion/ethikos/permissions.py
backend/konnaxion/ethikos/models.py
backend/konnaxion/ethikos/serializers.py
backend/konnaxion/ethikos/api_views.py
backend/konnaxion/ethikos/urls.py
backend/konnaxion/ethikos/admin.py
backend/konnaxion/ethikos/tests.py
backend/config/api_router.py

frontend/services/ethikos.ts
frontend/services/deliberate.ts
frontend/services/index.ts
frontend/api.ts

docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/23_WAVE1_IMPLEMENTATION_BACKLOG.md
```

Foundation edits should introduce conventions, constants, safe helper patterns, route stability checks, and minimal service normalization. They should not add every future Wave 1 model.

### 7.2 Shared files that must be conflict-managed

These files are common across multiple slices and should be patched carefully:

```txt
backend/konnaxion/ethikos/models.py
backend/konnaxion/ethikos/serializers.py
backend/konnaxion/ethikos/api_views.py
backend/konnaxion/ethikos/admin.py
backend/konnaxion/ethikos/urls.py
backend/config/api_router.py
frontend/services/ethikos.ts
frontend/services/deliberate.ts
frontend/services/decide.ts
frontend/services/impact.ts
frontend/services/pulse.ts
frontend/services/admin.ts
frontend/services/index.ts
frontend/api.ts
frontend/app/ethikos/EthikosPageShell.tsx
frontend/app/ethikos/layout.tsx
```

### 7.3 Do not code in foundation

Delay these until their vertical slices:

```txt
backend/konnaxion/kollective_intelligence/models.py
backend/konnaxion/kollective_intelligence/serializers.py
backend/konnaxion/kollective_intelligence/api_views.py
backend/konnaxion/kollective_intelligence/admin.py
backend/konnaxion/ekoh/models/*
backend/konnaxion/ekoh/serializers/*
backend/konnaxion/ekoh/services/*
backend/konnaxion/ekoh/views/*
frontend/app/ethikos/decide/*
frontend/app/ethikos/impact/*
frontend/app/ethikos/pulse/*
frontend/app/ethikos/trust/*
frontend/app/ethikos/insights/page.tsx
frontend/app/ethikos/admin/*
```

---

## 8. Backlog Items

Each backlog item must declare route, endpoint, model, tests, source trace, and rollback notes.

### W1-000 — Foundation / no-drift baseline

**Goal:** Establish the shared implementation guardrails before vertical slices begin.

**Scope:**

- create `backend/konnaxion/ethikos/constants.py`;
- create `backend/konnaxion/ethikos/permissions.py`;
- define allowed stance and impact-vote ranges as separate constants;
- define shared visibility, role, moderation, and publication choices only where they are stable;
- normalize `/api/ethikos/*` path helpers in frontend service layer;
- add no-drift tests for forbidden route/app creation;
- document slice order and shared-file conflict policy in this backlog.

**Files:**

```txt
backend/konnaxion/ethikos/constants.py
backend/konnaxion/ethikos/permissions.py
backend/konnaxion/ethikos/api_views.py
backend/konnaxion/ethikos/serializers.py
backend/config/api_router.py
backend/konnaxion/ethikos/tests.py
frontend/services/ethikos.ts
frontend/services/deliberate.ts
frontend/services/index.ts
frontend/api.ts
docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/23_WAVE1_IMPLEMENTATION_BACKLOG.md
```

**Endpoints:**

- preserve `/api/ethikos/topics/`;
- preserve `/api/ethikos/stances/`;
- preserve `/api/ethikos/arguments/`;
- preserve `/api/ethikos/categories/`;
- preserve `/api/kollective/votes/`;
- do not add `/api/kialo/*`;
- do not add `/api/kintsugi/*`;
- do not expand `/api/home/*`.

**Tests:**

- current ethiKos models still import;
- current ethiKos routes still reverse;
- forbidden Kialo/Kintsugi routes are absent;
- `/api/home/*` is not expanded for Wave 1;
- frontend services import without circular dependency.

**Rollback:**

- remove newly created helper files if unused;
- revert service helper imports;
- keep existing model and router definitions intact.

---

### W1-010 — Korum / Deliberate structured argument slice

**Goal:** Upgrade `/ethikos/deliberate/*` into the first full Kintsugi slice and use it as the reference implementation pattern.

**Scope:**

- fix the Deliberate preview drawer `Preview / No data` bug;
- add source metadata for arguments;
- add argument-level impact vote distinct from topic stance and Smart Vote reading;
- add argument suggestion workflow;
- add participant role and discussion visibility models;
- expose new serializers/viewsets/actions under `/api/ethikos/*`;
- update the deliberate topic UI to display sources, impact votes, suggestions, roles, and visibility state;
- preserve `EthikosTopic`, `EthikosArgument`, `EthikosStance`, and `EthikosCategory` names.

**Candidate models:**

```txt
ArgumentSource
ArgumentImpactVote
ArgumentSuggestion
DiscussionParticipantRole
DiscussionVisibilitySetting
```

**Files:**

```txt
backend/konnaxion/ethikos/models.py
backend/konnaxion/ethikos/serializers.py
backend/konnaxion/ethikos/api_views.py
backend/konnaxion/ethikos/admin.py
backend/konnaxion/ethikos/urls.py
backend/config/api_router.py
backend/konnaxion/ethikos/migrations/0003_kintsugi_wave1_korum.py
backend/konnaxion/ethikos/tests.py
frontend/services/ethikos.ts
frontend/services/deliberate.ts
frontend/app/ethikos/deliberate/[topic]/page.tsx
frontend/app/ethikos/deliberate/elite/page.tsx
```

**Endpoints:**

```txt
GET    /api/ethikos/topics/{id}/preview/
GET    /api/ethikos/arguments/?topic=<id>
POST   /api/ethikos/arguments/
GET    /api/ethikos/argument-sources/?argument=<id>
POST   /api/ethikos/argument-sources/
GET    /api/ethikos/argument-impact-votes/?argument=<id>
POST   /api/ethikos/argument-impact-votes/
GET    /api/ethikos/argument-suggestions/?topic=<id>
POST   /api/ethikos/argument-suggestions/
PATCH  /api/ethikos/argument-suggestions/{id}/
GET    /api/ethikos/discussion-roles/?topic=<id>
GET    /api/ethikos/discussion-visibility/?topic=<id>
```

**Tests:**

- preview returns topic metadata when topic exists even if arguments are empty;
- `EthikosStance.value` remains `-3..3`;
- `ArgumentImpactVote.value` is separate from stance and uses the Kialo-style impact scale;
- suggestions do not create arguments until accepted;
- hidden arguments are excluded from public reads unless requester is allowed;
- no `/kialo` or `/kintsugi` routes are introduced.

**Rollback:**

- reverse Korum migration;
- unregister Korum-specific ViewSets;
- remove frontend rendering of Korum-specific panels;
- leave existing topics, stances, arguments, and categories intact.

---

### W1-020 — Konsultations / Decide slice

**Goal:** Upgrade `/ethikos/decide/*` for intake, consultation participation, public/elite ballot capture, and result snapshots while remaining inside ethiKos route and model boundaries.

**Scope:**

- formalize consultation lifecycle using existing ethiKos topics as the source object where appropriate;
- add intake/suggestion workflow if not covered by Korum suggestion model;
- add ballot capture distinct from topic stance when needed;
- add result snapshot model for published consultation outcomes;
- align public and elite decide pages with service layer;
- preserve current stance endpoints during migration.

**Candidate models:**

```txt
ConsultationIntake
ConsultationBallot
ConsultationResultSnapshot
DecisionProtocol
DecisionRecord
```

**Files:**

```txt
backend/konnaxion/ethikos/models.py
backend/konnaxion/ethikos/serializers.py
backend/konnaxion/ethikos/api_views.py
backend/konnaxion/ethikos/admin.py
backend/config/api_router.py
backend/konnaxion/ethikos/migrations/0004_kintsugi_wave1_konsultations.py
backend/konnaxion/ethikos/tests.py
frontend/services/decide.ts
frontend/services/ethikos.ts
frontend/app/ethikos/decide/public/page.tsx
frontend/app/ethikos/decide/elite/page.tsx
frontend/app/ethikos/decide/results/page.tsx
frontend/app/ethikos/decide/methodology/page.tsx
frontend/modules/konsultations/hooks/useConsultationResults.ts
frontend/modules/konsultations/hooks/useConsultationVote.ts
```

**Endpoints:**

```txt
GET    /api/ethikos/consultation-intakes/
POST   /api/ethikos/consultation-intakes/
GET    /api/ethikos/consultation-ballots/?topic=<id>
POST   /api/ethikos/consultation-ballots/
GET    /api/ethikos/consultation-results/?topic=<id>
POST   /api/ethikos/consultation-results/
GET    /api/ethikos/decision-protocols/?topic=<id>
POST   /api/ethikos/decision-protocols/
GET    /api/ethikos/decision-records/?topic=<id>
POST   /api/ethikos/decision-records/
```

**Tests:**

- public vote/ballot capture succeeds for valid topic;
- duplicate ballot policy is explicit;
- result snapshot is immutable after publication unless admin action records an audit event;
- `EthikosStance` compatibility remains available;
- public/elite decide routes do not call unmapped legacy placeholders.

**Rollback:**

- reverse Konsultations migration;
- remove decide service methods and UI calls;
- preserve existing topic/stance state.

---

### W1-030 — Smart Vote readings slice

**Goal:** Add Smart Vote reading artifacts as derived outputs without allowing Smart Vote to mutate Korum or Konsultations source facts.

**Scope:**

- create lens declaration and reading result structures;
- connect readings to consultation/topic/result snapshots;
- keep `/api/kollective/*` as the Smart Vote-compatible API surface;
- expose reading summaries to decide results and insights;
- do not write to Korum arguments, topic stances, or consultation ballots from Smart Vote processing.

**Candidate models:**

```txt
LensDeclaration
ReadingResult
ReadingPublication
ReadingInputSnapshot
```

**Files:**

```txt
backend/konnaxion/kollective_intelligence/models.py
backend/konnaxion/kollective_intelligence/serializers.py
backend/konnaxion/kollective_intelligence/api_views.py
backend/konnaxion/kollective_intelligence/admin.py
backend/konnaxion/kollective_intelligence/migrations/0002_kintsugi_wave1_readings.py
backend/konnaxion/kollective_intelligence/tests/test_kintsugi_wave1_readings.py
backend/config/api_router.py
frontend/services/readings.ts
frontend/services/decide.ts
frontend/app/ethikos/decide/results/page.tsx
frontend/app/ethikos/insights/page.tsx
```

**Endpoints:**

```txt
GET    /api/kollective/lens-declarations/
POST   /api/kollective/lens-declarations/
GET    /api/kollective/reading-results/?topic=<id>
POST   /api/kollective/reading-results/
GET    /api/kollective/reading-publications/?topic=<id>
POST   /api/kollective/reading-publications/
```

**Tests:**

- reading result can reference source topic/consultation snapshot;
- reading creation does not modify `EthikosTopic`, `EthikosStance`, `EthikosArgument`, consultation ballot, or result snapshot rows;
- publication status changes are auditable;
- decide results page can display reading output.

**Rollback:**

- reverse Kollective reading migration;
- unregister reading ViewSets;
- remove frontend reading panels;
- preserve existing `/api/kollective/votes/` behavior.

---

### W1-040 — EkoH trust/context slice

**Goal:** Expose EkoH expertise, ethics, cohort, and snapshot context to ethiKos without turning EkoH into a voting engine.

**Scope:**

- add or expose EkoH context snapshots relevant to ethiKos;
- show trust/profile/context information under `/ethikos/trust/*`;
- allow Smart Vote readings to reference EkoH context snapshots as read-only inputs;
- add admin-visible controls for context/eligibility review only where supported by current EkoH models.

**Candidate models or read models:**

```txt
EkohContextSnapshot
EkohCohortEligibilitySnapshot
EkohEthicsContextSnapshot
EkohExpertiseContextSnapshot
```

**Files:**

```txt
backend/konnaxion/ekoh/models/*
backend/konnaxion/ekoh/serializers/*
backend/konnaxion/ekoh/services/*
backend/konnaxion/ekoh/views/*
backend/konnaxion/ekoh/urls.py
backend/konnaxion/ekoh/admin.py
backend/konnaxion/ekoh/migrations/0003_kintsugi_wave1_context.py
backend/konnaxion/ekoh/tests/test_kintsugi_wave1_context.py
frontend/services/trust.ts
frontend/app/ethikos/trust/profile/page.tsx
frontend/app/ethikos/trust/badges/page.tsx
frontend/app/ethikos/trust/credentials/page.tsx
frontend/app/ethikos/insights/page.tsx
```

**Endpoints:**

```txt
GET    /api/ekoh/context-snapshots/?topic=<id>
GET    /api/ekoh/cohort-eligibility/?topic=<id>
GET    /api/ekoh/expertise-context/?user=<id>
GET    /api/ekoh/ethics-context/?user=<id>
```

**Tests:**

- EkoH context reads do not create or mutate votes;
- Smart Vote can reference EkoH snapshot IDs read-only;
- trust pages load with fallback if no EkoH context exists;
- visibility and privacy restrictions are enforced.

**Rollback:**

- remove ethiKos-facing EkoH views and serializers;
- reverse context migration if added;
- leave existing EkoH profile/scoring state intact.

---

### W1-050 — Drafting / rationale slice

**Goal:** Add bounded drafting and rationale support without replacing deliberation, consultation, or Smart Vote ownership.

**Scope:**

- create draft/version/amendment/rationale packet workflow;
- connect drafts to topics, argument sources, consultation snapshots, and decision records;
- keep drafting inside ethiKos, not external document editing sidecars;
- ensure rationale packets are traceable to argument/decision sources.

**Candidate models:**

```txt
Draft
DraftVersion
Amendment
RationalePacket
RationaleSourceLink
```

**Files:**

```txt
backend/konnaxion/ethikos/models.py
backend/konnaxion/ethikos/serializers.py
backend/konnaxion/ethikos/api_views.py
backend/konnaxion/ethikos/admin.py
backend/konnaxion/ethikos/migrations/0005_kintsugi_wave1_drafting.py
backend/konnaxion/ethikos/tests.py
frontend/services/decide.ts
frontend/services/deliberate.ts
frontend/app/ethikos/decide/elite/page.tsx
frontend/app/ethikos/deliberate/[topic]/page.tsx
frontend/app/ethikos/admin/audit/page.tsx
```

**Endpoints:**

```txt
GET    /api/ethikos/drafts/?topic=<id>
POST   /api/ethikos/drafts/
GET    /api/ethikos/draft-versions/?draft=<id>
POST   /api/ethikos/draft-versions/
GET    /api/ethikos/amendments/?draft=<id>
POST   /api/ethikos/amendments/
GET    /api/ethikos/rationale-packets/?topic=<id>
POST   /api/ethikos/rationale-packets/
```

**Tests:**

- draft versioning preserves history;
- amendment state transitions are explicit;
- rationale packet references are valid;
- draft publication does not mutate Smart Vote readings.

**Rollback:**

- reverse drafting migration;
- remove draft panels and service methods;
- preserve existing deliberation and decision records.

---

### W1-060 — Impact / accountability slice

**Goal:** Implement impact tracking and accountability views under `/ethikos/impact/*` using Kintsugi ownership rules.

**Scope:**

- add impact tracks linked to decisions/result snapshots;
- support outcome updates and feedback loops;
- avoid relying on unrelated KeenKonnect project endpoints as long-term backing;
- show feedback, outcomes, and tracker pages from ethiKos/Konsultations-owned records.

**Candidate models:**

```txt
ImpactTrack
ImpactMilestone
ImpactFeedback
ImpactOutcomeSnapshot
```

**Files:**

```txt
backend/konnaxion/ethikos/models.py
backend/konnaxion/ethikos/serializers.py
backend/konnaxion/ethikos/api_views.py
backend/konnaxion/ethikos/admin.py
backend/konnaxion/ethikos/migrations/0006_kintsugi_wave1_impact.py
backend/konnaxion/ethikos/tests.py
frontend/services/impact.ts
frontend/app/ethikos/impact/feedback/page.tsx
frontend/app/ethikos/impact/outcomes/page.tsx
frontend/app/ethikos/impact/tracker/page.tsx
```

**Endpoints:**

```txt
GET    /api/ethikos/impact-tracks/
POST   /api/ethikos/impact-tracks/
PATCH  /api/ethikos/impact-tracks/{id}/
GET    /api/ethikos/impact-feedback/?track=<id>
POST   /api/ethikos/impact-feedback/
GET    /api/ethikos/impact-outcomes/?track=<id>
POST   /api/ethikos/impact-outcomes/
```

**Tests:**

- impact track can link to decision/result snapshot;
- status changes are auditable;
- public feedback does not overwrite official outcome snapshots;
- impact pages stop depending on loose non-ethiKos placeholder mappings.

**Rollback:**

- reverse impact migration;
- revert impact service to prior placeholder behavior only if necessary;
- preserve decision records and result snapshots.

---

### W1-070 — Pulse / civic health slice

**Goal:** Implement civic-health and live-signal read models under `/ethikos/pulse/*` without turning Pulse into a write owner for core records.

**Scope:**

- expose overview, live, health, and trends pages from derived signals;
- compute or store snapshot records if needed;
- keep Pulse as read model / analytics, not mutation surface for Korum/Konsultations facts.

**Candidate models:**

```txt
PulseSignalSnapshot
PulseHealthMetric
PulseTrendSnapshot
```

**Files:**

```txt
backend/konnaxion/ethikos/models.py
backend/konnaxion/ethikos/serializers.py
backend/konnaxion/ethikos/api_views.py
backend/konnaxion/ethikos/admin.py
backend/konnaxion/ethikos/migrations/0007_kintsugi_wave1_pulse.py
backend/konnaxion/ethikos/tests.py
frontend/services/pulse.ts
frontend/app/ethikos/pulse/overview/page.tsx
frontend/app/ethikos/pulse/live/page.tsx
frontend/app/ethikos/pulse/health/page.tsx
frontend/app/ethikos/pulse/trends/page.tsx
```

**Endpoints:**

```txt
GET    /api/ethikos/pulse/overview/
GET    /api/ethikos/pulse/live/
GET    /api/ethikos/pulse/health/
GET    /api/ethikos/pulse/trends/
```

**Tests:**

- pulse endpoints are read-only unless snapshot generation is admin-only;
- pulse calculations tolerate empty datasets;
- pulse pages render fallback states.

**Rollback:**

- unregister pulse endpoints;
- remove pulse service methods;
- preserve source records.

---

### W1-080 — Insights / interpretation slice

**Goal:** Make `/ethikos/insights` the comparison and interpretation surface for deliberation, decision, Smart Vote, EkoH, Pulse, and Impact outputs.

**Scope:**

- aggregate read-only summaries;
- compare reading results, stance distributions, argument impact votes, EkoH context, pulse signals, and impact progress;
- keep writes out of insights except explicit admin annotations if later approved.

**Files:**

```txt
backend/konnaxion/ethikos/api_views.py
backend/konnaxion/kollective_intelligence/api_views.py
backend/konnaxion/ekoh/views/*
frontend/services/ethikos.ts
frontend/services/readings.ts
frontend/services/trust.ts
frontend/services/pulse.ts
frontend/services/impact.ts
frontend/app/ethikos/insights/page.tsx
```

**Endpoints:**

```txt
GET /api/ethikos/insights/overview/
GET /api/ethikos/insights/topic/{id}/
```

**Tests:**

- insights endpoint tolerates missing Smart Vote/EkoH/Pulse/Impact data;
- insights does not mutate source records;
- frontend renders partial states clearly.

**Rollback:**

- remove insights aggregate endpoint and service calls;
- keep source slice endpoints intact.

---

### W1-090 — Admin / governance slice

**Goal:** Align `/ethikos/admin/*` with Kintsugi audit, moderation, and roles requirements.

**Scope:**

- moderate arguments, suggestions, and consultation records;
- review roles and visibility;
- expose audit trail entries for publications, status changes, and admin decisions;
- do not create a separate admin backend outside existing Konnaxion conventions.

**Candidate models:**

```txt
EthikosAuditEvent
ModerationAction
GovernanceRoleAssignment
```

**Files:**

```txt
backend/konnaxion/ethikos/models.py
backend/konnaxion/ethikos/serializers.py
backend/konnaxion/ethikos/api_views.py
backend/konnaxion/ethikos/admin.py
backend/konnaxion/ethikos/migrations/0008_kintsugi_wave1_admin.py
backend/konnaxion/ethikos/tests.py
frontend/services/admin.ts
frontend/app/ethikos/admin/audit/page.tsx
frontend/app/ethikos/admin/moderation/page.tsx
frontend/app/ethikos/admin/roles/page.tsx
```

**Endpoints:**

```txt
GET    /api/ethikos/admin/audit/
GET    /api/ethikos/admin/moderation/
POST   /api/ethikos/admin/moderation/{id}/act/
GET    /api/ethikos/admin/roles/
POST   /api/ethikos/admin/roles/
PATCH  /api/ethikos/admin/roles/{id}/
```

**Tests:**

- moderation actions require staff/admin permission;
- audit entries are append-only;
- role changes are explicit and auditable;
- admin pages stop relying on unmapped placeholder endpoints.

**Rollback:**

- remove admin Kintsugi endpoints and UI panels;
- preserve historical moderation state if records exist.

---

### W1-100 — Learn / public explanation slice

**Goal:** Align `/ethikos/learn/*` and methodology pages with the Kintsugi public explanation model.

**Scope:**

- explain Korum, Konsultations, Smart Vote, EkoH, Impact, Pulse, and Insights in user-facing language;
- expose glossary, guides, changelog, and methodology content;
- avoid hard-coding facts that should come from docs/services if a content source exists.

**Files:**

```txt
frontend/services/learn.ts
frontend/app/ethikos/learn/changelog/page.tsx
frontend/app/ethikos/learn/glossary/page.tsx
frontend/app/ethikos/learn/guides/page.tsx
frontend/app/ethikos/decide/methodology/page.tsx
docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/*
```

**Endpoints:**

```txt
GET /api/ethikos/learn/glossary/
GET /api/ethikos/learn/guides/
GET /api/ethikos/learn/changelog/
```

If no backend content source is implemented in Wave 1, these pages may remain static frontend pages with clear Kintsugi wording and no misleading API calls.

**Tests:**

- learn pages render;
- glossary includes canonical names;
- no external OSS-branded route is exposed.

**Rollback:**

- revert wording/components;
- preserve route existence.

---

### W1-110 — Test and smoke hardening slice

**Goal:** Add enough backend and frontend verification to prevent Wave 1 drift.

**Scope:**

- backend API tests for every added ViewSet/action;
- migration checks;
- route reverse checks;
- frontend smoke for every `/ethikos/*` route family;
- anti-drift checks for forbidden routes/apps;
- service import tests where supported.

**Files:**

```txt
backend/konnaxion/ethikos/tests.py
backend/konnaxion/ethikos/tests/test_kintsugi_wave1_models.py
backend/konnaxion/ethikos/tests/test_kintsugi_wave1_api.py
backend/konnaxion/kollective_intelligence/tests/test_kintsugi_wave1_readings.py
backend/konnaxion/ekoh/tests/test_kintsugi_wave1_context.py
backend/tests/test_smoke_platform.py
frontend/_e2e/ethikos-kintsugi-wave1.spec.ts
frontend/_e2e/ethikos-deliberate.spec.ts
frontend/_e2e/ethikos-decide.spec.ts
frontend/_e2e/ethikos-impact.spec.ts
frontend/services/__tests__/*.test.ts
```

**Required local commands:**

```bash
cd C:\mycode\Konnaxion\Konnaxion\backend
uv run python manage.py makemigrations --check --dry-run
uv run python manage.py migrate --plan
uv run pytest
```

```bash
cd C:\mycode\Konnaxion\Konnaxion\frontend
npm run lint
npm run build
npm run test -- --runInBand
npm run smoke
```

Use the project’s actual package manager and test commands if these differ from the repo scripts.

---

### W1-120 — Documentation, ADR, and release notes slice

**Goal:** Keep the Kintsugi docs synchronized with the actual implementation.

**Scope:**

- update route/API contract docs after endpoints are finalized;
- update data model/migration docs after migrations are created;
- update payload contracts after serializers stabilize;
- update frontend/backend alignment docs after services and ViewSets are complete;
- add ADR entries for any tradeoff or deviation;
- add final QA checklist and patch notes.

**Files:**

```txt
docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md
docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/07_API_AND_SERVICE_CONTRACTS.md
docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/08_DATA_MODEL_AND_MIGRATION_PLAN.md
docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/09_SMART_VOTE_EKOH_READING_CONTRACT.md
docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md
docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/14_FRONTEND_ALIGNMENT_CONTRACT.md
docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/15_BACKEND_ALIGNMENT_CONTRACT.md
docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/16_TEST_AND_SMOKE_CONTRACT.md
docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/18_ADR_REGISTER.md
docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/24_WAVE1_SLICE_REGISTER.md
docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/25_WAVE1_QA_CHECKLIST.md
```

**Tests:**

- docs reflect actual endpoint names and model names;
- docs do not claim tests passed unless local output exists;
- docs do not introduce forbidden routes/apps.

---

## 9. Dependency Order

Recommended implementation order:

```txt
0. Foundation / no-drift baseline
1. Korum / Deliberate
2. Common-pattern cleanup after Korum
3. Konsultations / Decide
4. Smart Vote readings
5. Common-pattern cleanup after Decide + Smart Vote
6. EkoH trust/context
7. Drafting / rationale
8. Impact / accountability
9. Pulse / civic health
10. Insights / interpretation
11. Admin / governance
12. Learn / public explanation
13. Test/smoke hardening
14. Documentation/ADR/release notes
```

Korum should be first because it exercises models, migrations, serializers, ViewSets, router registration, frontend service normalization, page rendering, and no-drift rules while remaining mostly inside `konnaxion.ethikos`.

---

## 10. Common-File Conflict Notes

### 10.1 Backend common files

`backend/konnaxion/ethikos/models.py` is the highest-conflict file. Each slice that adds models should use one contiguous section and avoid unrelated reordering.

Recommended section order:

```txt
1. Current core models
2. Foundation constants/helpers if kept in file
3. Korum models
4. Konsultations models
5. Drafting/rationale models
6. Impact models
7. Pulse/read-model snapshot models
8. Admin/audit models
```

`backend/konnaxion/ethikos/serializers.py` should mirror model section order.

`backend/konnaxion/ethikos/api_views.py` should group ViewSets by slice and keep helper methods near the top.

`backend/config/api_router.py` should add registrations in a stable order and never rename existing basenames.

### 10.2 Frontend common files

`frontend/services/ethikos.ts` should host only generic ethiKos API helpers.

Slice-specific logic should remain in:

```txt
frontend/services/deliberate.ts
frontend/services/decide.ts
frontend/services/impact.ts
frontend/services/pulse.ts
frontend/services/trust.ts
frontend/services/admin.ts
frontend/services/readings.ts
```

`frontend/app/ethikos/layout.tsx` and `frontend/app/ethikos/EthikosPageShell.tsx` should only be touched for navigation/route-label consistency. Do not introduce a second shell.

---

## 11. Anti-Drift Rules

Every implementation slice MUST pass these checks:

```txt
[ ] No /kialo route was created.
[ ] No /kintsugi route was created.
[ ] No backend/konnaxion/kialo app was created.
[ ] No backend/konnaxion/kintsugi app was created.
[ ] No external OSS code was imported.
[ ] Existing EthikosTopic, EthikosStance, EthikosArgument, and EthikosCategory names are preserved.
[ ] Existing /api/ethikos/topics/ remains stable.
[ ] Existing /api/ethikos/stances/ remains stable.
[ ] Existing /api/ethikos/arguments/ remains stable.
[ ] Existing /api/ethikos/categories/ remains stable if currently registered.
[ ] /api/home/* was not expanded for Kintsugi.
[ ] Smart Vote readings are derived and do not mutate source facts.
[ ] EkoH context is not treated as a voting engine.
[ ] Kialo-style argument impact votes are not treated as topic stances.
[ ] Kialo-style argument impact votes are not treated as Smart Vote ballots.
```

---

## 12. Migration Policy

- Use additive migrations only for Wave 1 unless a later ADR explicitly approves a breaking change.
- Do not rename current ethiKos core models.
- Do not remove existing fields required by current pages/tests.
- Prefer nullable foreign keys and safe defaults when introducing bridge records.
- Each migration should belong to a slice and be named accordingly.
- Do not create all migrations before implementation slices prove the real field needs.

Recommended migration sequence:

```txt
0003_kintsugi_wave1_korum.py
0004_kintsugi_wave1_konsultations.py
0005_kintsugi_wave1_drafting.py
0006_kintsugi_wave1_impact.py
0007_kintsugi_wave1_pulse.py
0008_kintsugi_wave1_admin.py
```

Kollective and EkoH migrations should use their own app migration sequences.

---

## 13. Validation Checklist

### Backend

```txt
[ ] makemigrations --check --dry-run passes.
[ ] migrate --plan is reviewed.
[ ] pytest passes.
[ ] Existing smoke platform test still passes.
[ ] Existing ethiKos endpoints remain stable.
[ ] New endpoints have API tests.
[ ] Admin registrations import.
[ ] Router basenames are stable.
```

### Frontend

```txt
[ ] TypeScript build passes.
[ ] lint passes.
[ ] all /ethikos/* route pages render.
[ ] service imports resolve.
[ ] Deliberate preview drawer no longer shows "Preview / No data" for existing topics.
[ ] Decide public/elite/results pages load with canonical service calls.
[ ] Trust/Pulse/Impact/Insights/Admin pages tolerate empty backend states.
```

### Documentation

```txt
[ ] Route docs match actual routes.
[ ] API docs match actual endpoints.
[ ] Payload docs match serializers.
[ ] Migration docs match migrations.
[ ] Test docs match local test output.
[ ] ADR register records deviations.
```

---

## 14. Rollback Strategy

Rollback should be possible by slice.

For each slice:

1. revert frontend page/service changes for that slice;
2. unregister that slice’s ViewSets from router;
3. remove or disable slice serializers/viewsets;
4. reverse that slice migration if not deployed or if data can be safely discarded;
5. if deployed with data, add a reversible deprecation migration instead of destructive deletion;
6. leave earlier slices intact.

Never rollback by deleting or renaming current core ethiKos models.

---

## 15. Open Decisions

These must be resolved during implementation or recorded as ADRs:

```txt
[ ] Whether ConsultationBallot is separate from EthikosStance or a typed wrapper around stance.
[ ] Whether DecisionProtocol belongs in ethikos or should be split after Wave 1.
[ ] Whether Draft/Rationale records land before or after Smart Vote readings.
[ ] Whether Insights aggregate endpoint is backend-computed or frontend-composed from slice endpoints.
[ ] Whether Pulse snapshots are stored models or read-only computed endpoint responses.
[ ] Whether Learn content is static frontend content or backend-managed content.
[ ] Whether Admin audit uses an ethiKos-specific model or central audit infrastructure.
```

---

## 16. Related Docs

```txt
00_KINTSUGI_START_HERE.md
01_ETHIKOS_KINTSUGI_EXECUTION_STRATEGY.md
02_SOURCE_OF_TRUTH_AND_DRIFT_CONTROL.md
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

## 17. Final Contract

Wave 1 is the route-by-route strengthening of ethiKos under the existing Konnaxion architecture.

```txt
Kintsugi is not a new app.
Kintsugi is not a new route family.
Kialo is not imported.
OSS systems are inspiration sources only.
Smart Vote readings are derived.
EkoH provides context, not votes.
Korum owns deliberation source facts.
Konsultations owns consultation and accountability source facts.
The implementation must land inside existing /ethikos/* and approved /api/* surfaces.
```
