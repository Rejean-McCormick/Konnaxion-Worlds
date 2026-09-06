# 24 — Wave 1 Slice Register

**Document ID:** `24_WAVE1_SLICE_REGISTER.md`  
**Pack:** ethiKos Kintsugi Update Documentation Pack  
**Status:** Working implementation coordination document  
**Last aligned:** 2026-04-27  
**Primary scope:** Existing `/ethikos/*` route family  
**Implementation mode:** Partial native mimic, no full external merge  
**Target repository path:** `docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/24_WAVE1_SLICE_REGISTER.md`

---

## 1. Purpose

This document splits **ethiKos Kintsugi Wave 1** into implementation slices so that work can be generated, reviewed, tested, and merged in focused units.

The slice register exists to prevent:

- route drift;
- API drift;
- ownership drift;
- repeated edits to shared files without coordination;
- speculative common abstractions;
- duplicate models/endpoints across slices;
- accidental creation of parallel Kialo/Kintsugi applications;
- accidental expansion of legacy `/api/home/*` usage.

This document is **not** the implementation backlog. It is a coordination map used by the implementation backlog, patch notes, and QA checklist.

---

## 2. Canonical Variables

```yaml
KINTSUGI_UPDATE_TYPE: "documentation-first architecture upgrade"
IMPLEMENTATION_STYLE: "partial native mimic"

FULL_EXTERNAL_MERGE_ALLOWED: false
ANNEX_FIRST_PASS_ALLOWED: false
EXISTING_ROUTE_FAMILIES_STABLE: true
EXISTING_CORE_MODELS_STABLE: true

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

CURRENT_ETHIKOS_CORE_MODELS:
  - "EthikosCategory"
  - "EthikosTopic"
  - "EthikosStance"
  - "EthikosArgument"

CURRENT_CANONICAL_ENDPOINTS:
  - "/api/ethikos/topics/"
  - "/api/ethikos/stances/"
  - "/api/ethikos/arguments/"
  - "/api/ethikos/categories/"
  - "/api/kollective/votes/"

OWNERSHIP:
  KORUM: "topics, arguments, argument graph, topic-level stances, debate moderation"
  KONSULTATIONS: "intake, consultations, ballots, result snapshots, impact tracking"
  SMART_VOTE: "readings, lens declarations, derived aggregations, result publication"
  EKOH: "expertise context, ethics context, cohort eligibility, snapshot context"

WRITE_RULES:
  FOREIGN_TOOLS_WRITE_CORE_TABLES: false
  SMART_VOTE_MUTATES_SOURCE_FACTS: false
  EKOH_IS_VOTING_ENGINE: false
  READINGS_ARE_DERIVED: true

KIALO:
  STRATEGY: "native_mimic"
  ROUTE_SCOPE: "/ethikos/deliberate/*"
  BACKEND_SCOPE: "konnaxion.ethikos"
  CREATE_KIALO_BACKEND_APP: false
  CREATE_KIALO_FRONTEND_ROUTE: false
  IMPORT_KIALO_CODE: false
```

---

## 3. Slice Strategy

Wave 1 should be implemented as vertical slices plus a small number of cross-cutting coordination slices.

The preferred strategy is:

```txt
1. Seed only a thin common foundation.
2. Implement vertical slices one at a time.
3. Let Korum / Deliberate become the first real reference slice.
4. Consolidate shared helpers after real slice pressure appears.
5. Keep every slice runnable and reviewable.
6. Do not prebuild the full common layer speculatively.
```

### 3.1 Slice Types

```txt
Foundation slices:
  - establish shared conventions and no-drift tests.

Vertical product slices:
  - implement one route/domain owner at a time.

Cross-cutting slices:
  - harden shared services, shared tests, shared documentation, and final QA.
```

### 3.2 Slice Completion Rule

A slice is complete only when it declares:

- touched backend files;
- touched frontend files;
- models or migrations added;
- endpoints added or changed;
- frontend services added or changed;
- tests added or changed;
- drift checks performed;
- rollback notes;
- deferred items.

---

## 4. Wave 1 Slice Register

| ID | Slice | Primary Owner | Primary Routes | Primary Backend Area | Status | Recommended Order |
|---:|---|---|---|---|---|---:|
| 00 | Foundation / No-Drift Baseline | Shared | all `/ethikos/*` | `ethikos`, router, tests, services | planned | 1 |
| 01 | Korum / Deliberate | Korum | `/ethikos/deliberate/*` | `konnaxion.ethikos` | planned | 2 |
| 02 | Konsultations / Decide | Konsultations | `/ethikos/decide/*` | `konnaxion.ethikos` | planned | 3 |
| 03 | Smart Vote Readings | Smart Vote | `/ethikos/decide/*`, `/ethikos/insights` | `kollective_intelligence`, `ethikos` read-side | planned | 4 |
| 04 | EkoH Trust / Context | EkoH | `/ethikos/trust/*`, `/ethikos/insights` | `ekoh`, read-side bridges | planned | 5 |
| 05 | Drafting / Rationale | Shared: Korum + Konsultations | `/ethikos/decide/*`, `/ethikos/deliberate/*` | `konnaxion.ethikos` | planned | 6 |
| 06 | Impact / Accountability | Konsultations | `/ethikos/impact/*` | `konnaxion.ethikos` | planned | 7 |
| 07 | Pulse / Civic Health | Shared | `/ethikos/pulse/*` | read-side services | planned | 8 |
| 08 | Insights / Interpretation | Shared | `/ethikos/insights` | `ethikos`, `kollective_intelligence`, `ekoh` read-side | planned | 9 |
| 09 | Admin / Governance | Shared | `/ethikos/admin/*` | admin, permissions, audit-facing APIs | planned | 10 |
| 10 | Learn / Public Explanation | Shared | `/ethikos/learn/*`, `/ethikos/decide/methodology` | docs/service-backed content where needed | planned | 11 |
| 11 | Frontend Service Alignment | Shared | all frontend route families | `frontend/services/*` | planned | after 01–03 |
| 12 | Backend API / Schema Alignment | Shared | all API families | serializers, viewsets, router, migrations | planned | after 01–04 |
| 13 | Test / Smoke / QA Hardening | Shared | all | backend tests, frontend smoke, e2e | planned | continuous + final |
| 14 | Docs / ADR / Release Notes | Shared | all | implementation docs | planned | continuous + final |

---

## 5. Slice Details

### 5.1 Slice 00 — Foundation / No-Drift Baseline

**Purpose:** Establish the minimum shared foundation before any feature slice.

**Primary goal:** Create reference conventions without prebuilding the full Wave 1 architecture.

**Files likely touched now:**

```txt
backend/konnaxion/ethikos/constants.py
backend/konnaxion/ethikos/permissions.py
backend/konnaxion/ethikos/api_views.py
backend/konnaxion/ethikos/serializers.py
backend/config/api_router.py
frontend/services/ethikos.ts
frontend/services/deliberate.ts
frontend/services/index.ts
backend/konnaxion/ethikos/tests.py
docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/23_WAVE1_IMPLEMENTATION_BACKLOG.md
docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/24_WAVE1_SLICE_REGISTER.md
docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/25_WAVE1_QA_CHECKLIST.md
```

**Do now:**

- define shared constants;
- define reusable permission conventions;
- add no-drift tests;
- normalize ethiKos service helper names;
- document shared file ownership;
- keep router conventions stable.

**Do not do now:**

- create all migrations;
- add all Wave 1 models;
- build Smart Vote/EkoH bridges;
- rewrite shell/layout files;
- create new `/kialo` or `/kintsugi` routes.

**Exit criteria:**

- existing `EthikosCategory`, `EthikosTopic`, `EthikosStance`, and `EthikosArgument` are preserved;
- existing canonical endpoints remain registered;
- no forbidden routes are registered;
- shared service helper compiles conceptually with current service style;
- Korum slice can use the foundation without inventing parallel patterns.

---

### 5.2 Slice 01 — Korum / Deliberate

**Purpose:** Upgrade structured deliberation while staying inside existing ethiKos/Korum ownership.

**Primary routes:**

```txt
/ethikos/deliberate/*
```

**Primary backend APIs:**

```txt
/api/ethikos/topics/
/api/ethikos/arguments/
/api/ethikos/stances/
/api/ethikos/categories/
```

**Likely backend files:**

```txt
backend/konnaxion/ethikos/models.py
backend/konnaxion/ethikos/serializers.py
backend/konnaxion/ethikos/api_views.py
backend/konnaxion/ethikos/admin.py
backend/konnaxion/ethikos/urls.py
backend/config/api_router.py
backend/konnaxion/ethikos/migrations/0003_kintsugi_wave1_korum.py
backend/konnaxion/ethikos/tests.py
```

**Likely frontend files:**

```txt
frontend/services/deliberate.ts
frontend/services/ethikos.ts
frontend/app/ethikos/deliberate/[topic]/page.tsx
frontend/app/ethikos/deliberate/elite/page.tsx
frontend/app/ethikos/deliberate/guidelines/page.tsx
```

**Likely model additions:**

```txt
ArgumentSource
ArgumentImpactVote
ArgumentSuggestion
DiscussionParticipantRole
DiscussionVisibilitySetting
```

**Special known issue:**

```txt
Deliberate preview drawer shows "Preview / No data".
```

This should be treated as a targeted runtime/UI bug, not as a reason to redesign ethiKos architecture.

**Exit criteria:**

- argument tree remains based on `EthikosArgument`;
- topic-level stance remains `EthikosStance`;
- Kialo-style impact vote is not confused with Smart Vote ballot;
- no `/kialo/*` frontend route exists;
- no `konnaxion.kialo` backend app exists;
- `/api/ethikos/topics/{id}/preview/` returns useful topic metadata even when argument rows are empty.

---

### 5.3 Slice 02 — Konsultations / Decide

**Purpose:** Upgrade decision and consultation flows without moving ownership away from ethiKos/Konsultations.

**Primary routes:**

```txt
/ethikos/decide/elite
/ethikos/decide/public
/ethikos/decide/results
/ethikos/decide/methodology
```

**Likely backend files:**

```txt
backend/konnaxion/ethikos/models.py
backend/konnaxion/ethikos/serializers.py
backend/konnaxion/ethikos/api_views.py
backend/konnaxion/ethikos/admin.py
backend/konnaxion/ethikos/urls.py
backend/config/api_router.py
backend/konnaxion/ethikos/migrations/0004_kintsugi_wave1_konsultations.py
backend/konnaxion/ethikos/tests.py
```

**Likely frontend files:**

```txt
frontend/services/decide.ts
frontend/services/ethikos.ts
frontend/app/ethikos/decide/elite/page.tsx
frontend/app/ethikos/decide/public/page.tsx
frontend/app/ethikos/decide/results/page.tsx
frontend/app/ethikos/decide/methodology/page.tsx
```

**Likely model areas:**

```txt
consultation intake
consultation status
ballot capture
result snapshot
citizen suggestion
```

**Exit criteria:**

- decide routes read/write through canonical ethiKos services;
- consultation results do not bypass documented ownership;
- Smart Vote derived readings remain separate from consultation source facts;
- current topic/stance models are preserved.

---

### 5.4 Slice 03 — Smart Vote Readings

**Purpose:** Add or align derived reading surfaces without allowing Smart Vote to mutate Korum or Konsultations source records.

**Primary routes:**

```txt
/ethikos/decide/results
/ethikos/decide/methodology
/ethikos/insights
```

**Primary backend API areas:**

```txt
/api/kollective/*
/api/ethikos/* read-side references
```

**Likely backend files:**

```txt
backend/konnaxion/kollective_intelligence/models.py
backend/konnaxion/kollective_intelligence/serializers.py
backend/konnaxion/kollective_intelligence/api_views.py
backend/konnaxion/kollective_intelligence/admin.py
backend/konnaxion/kollective_intelligence/migrations/0002_kintsugi_wave1_readings.py
backend/config/api_router.py
backend/konnaxion/ethikos/models.py
backend/konnaxion/ethikos/serializers.py
backend/konnaxion/ethikos/api_views.py
```

**Likely frontend files:**

```txt
frontend/services/decide.ts
frontend/services/ethikos.ts
frontend/services/readings.ts
frontend/app/ethikos/decide/results/page.tsx
frontend/app/ethikos/decide/methodology/page.tsx
frontend/app/ethikos/insights/page.tsx
```

**Likely model additions:**

```txt
LensDeclaration
ReadingResult
DecisionRecord
```

**Exit criteria:**

- readings are derived artifacts;
- Smart Vote does not mutate `EthikosTopic`, `EthikosArgument`, `EthikosStance`, consultation source records, or EkoH source context;
- result publication is auditable;
- `/api/kollective/votes/` remains stable.

---

### 5.5 Slice 04 — EkoH Trust / Context

**Purpose:** Surface expertise, ethics, cohort, and snapshot context without making EkoH the voting engine.

**Primary routes:**

```txt
/ethikos/trust/profile
/ethikos/trust/badges
/ethikos/trust/credentials
/ethikos/insights
```

**Likely backend files:**

```txt
backend/konnaxion/ekoh/models/__init__.py
backend/konnaxion/ekoh/models/audit.py
backend/konnaxion/ekoh/models/config.py
backend/konnaxion/ekoh/models/privacy.py
backend/konnaxion/ekoh/models/scores.py
backend/konnaxion/ekoh/models/taxonomy.py
backend/konnaxion/ekoh/serializers/__init__.py
backend/konnaxion/ekoh/serializers/profile.py
backend/konnaxion/ekoh/services/contextual_analysis.py
backend/konnaxion/ekoh/services/multidimensional_scoring.py
backend/konnaxion/ekoh/views/__init__.py
backend/konnaxion/ekoh/views/profile.py
backend/konnaxion/ekoh/urls.py
backend/konnaxion/ekoh/admin.py
backend/config/api_router.py
```

**Likely frontend files:**

```txt
frontend/services/trust.ts
frontend/services/ethikos.ts
frontend/app/ethikos/trust/profile/page.tsx
frontend/app/ethikos/trust/badges/page.tsx
frontend/app/ethikos/trust/credentials/page.tsx
frontend/app/ethikos/insights/page.tsx
```

**Exit criteria:**

- EkoH is shown as context, not voting authority;
- privacy and visibility rules are respected;
- Smart Vote may reference EkoH snapshots only through approved read-side linkage;
- no EkoH write path is introduced from Korum or Konsultations flows.

---

### 5.6 Slice 05 — Drafting / Rationale

**Purpose:** Add bounded drafting and rationale support after deliberation and consultation basics are stable.

**Primary routes:**

```txt
/ethikos/decide/*
/ethikos/deliberate/*
/ethikos/admin/*
```

**Likely backend files:**

```txt
backend/konnaxion/ethikos/models.py
backend/konnaxion/ethikos/serializers.py
backend/konnaxion/ethikos/api_views.py
backend/konnaxion/ethikos/admin.py
backend/config/api_router.py
backend/konnaxion/ethikos/migrations/0005_kintsugi_wave1_drafting.py
```

**Likely frontend files:**

```txt
frontend/services/decide.ts
frontend/services/deliberate.ts
frontend/app/ethikos/decide/elite/page.tsx
frontend/app/ethikos/decide/public/page.tsx
frontend/app/ethikos/deliberate/[topic]/page.tsx
frontend/app/ethikos/admin/moderation/page.tsx
```

**Likely model additions:**

```txt
Draft
DraftVersion
Amendment
RationalePacket
```

**Exit criteria:**

- rationale traces to source objects;
- draft state transitions are explicit;
- draft records do not replace consultation result snapshots;
- moderation/admin handling is reviewable.

---

### 5.7 Slice 06 — Impact / Accountability

**Purpose:** Add accountability and impact tracking after consultation/decision state exists.

**Primary routes:**

```txt
/ethikos/impact/feedback
/ethikos/impact/outcomes
/ethikos/impact/tracker
```

**Likely backend files:**

```txt
backend/konnaxion/ethikos/models.py
backend/konnaxion/ethikos/serializers.py
backend/konnaxion/ethikos/api_views.py
backend/konnaxion/ethikos/admin.py
backend/config/api_router.py
backend/konnaxion/ethikos/migrations/0006_kintsugi_wave1_impact.py
```

**Likely frontend files:**

```txt
frontend/services/impact.ts
frontend/services/ethikos.ts
frontend/app/ethikos/impact/feedback/page.tsx
frontend/app/ethikos/impact/outcomes/page.tsx
frontend/app/ethikos/impact/tracker/page.tsx
```

**Likely model additions:**

```txt
ImpactTrack
OutcomeSnapshot
FeedbackEntry
```

**Exit criteria:**

- impact state links to decisions/consultations without rewriting them;
- feedback is distinct from ballots and argument impact votes;
- tracker status is auditable.

---

### 5.8 Slice 07 — Pulse / Civic Health

**Purpose:** Add civic health, live signal, and trend surfaces based on existing source records and derived metrics.

**Primary routes:**

```txt
/ethikos/pulse/overview
/ethikos/pulse/live
/ethikos/pulse/health
/ethikos/pulse/trends
```

**Likely backend files:**

```txt
backend/konnaxion/ethikos/api_views.py
backend/konnaxion/ethikos/serializers.py
backend/config/api_router.py
```

**Likely frontend files:**

```txt
frontend/services/pulse.ts
frontend/services/ethikos.ts
frontend/app/ethikos/pulse/overview/page.tsx
frontend/app/ethikos/pulse/live/page.tsx
frontend/app/ethikos/pulse/health/page.tsx
frontend/app/ethikos/pulse/trends/page.tsx
```

**Exit criteria:**

- pulse metrics are read-side summaries;
- no pulse endpoint mutates source deliberation/decision facts;
- route family remains under `/ethikos/pulse/*`.

---

### 5.9 Slice 08 — Insights / Interpretation

**Purpose:** Provide cross-domain interpretation and comparison of deliberation, decision, Smart Vote, EkoH, pulse, and impact signals.

**Primary route:**

```txt
/ethikos/insights
```

**Likely backend files:**

```txt
backend/konnaxion/ethikos/api_views.py
backend/konnaxion/ethikos/serializers.py
backend/konnaxion/kollective_intelligence/api_views.py
backend/konnaxion/ekoh/views/profile.py
backend/config/api_router.py
```

**Likely frontend files:**

```txt
frontend/services/ethikos.ts
frontend/services/readings.ts
frontend/services/trust.ts
frontend/services/pulse.ts
frontend/services/impact.ts
frontend/app/ethikos/insights/page.tsx
```

**Exit criteria:**

- insights are read-side and explanatory;
- Smart Vote readings are labelled as derived;
- EkoH context is labelled as contextual;
- source routes remain canonical.

---

### 5.10 Slice 09 — Admin / Governance

**Purpose:** Align audit, moderation, and roles pages with Kintsugi governance boundaries.

**Primary routes:**

```txt
/ethikos/admin/audit
/ethikos/admin/moderation
/ethikos/admin/roles
```

**Likely backend files:**

```txt
backend/konnaxion/ethikos/admin.py
backend/konnaxion/ethikos/permissions.py
backend/konnaxion/ethikos/api_views.py
backend/konnaxion/ethikos/serializers.py
backend/config/api_router.py
```

**Likely frontend files:**

```txt
frontend/services/admin.ts
frontend/services/ethikos.ts
frontend/app/ethikos/admin/audit/page.tsx
frontend/app/ethikos/admin/moderation/page.tsx
frontend/app/ethikos/admin/roles/page.tsx
```

**Exit criteria:**

- moderation controls do not bypass ownership rules;
- role changes are auditable;
- admin endpoints do not become broad generic backdoors;
- admin service calls do not remain unmapped if backend support is added.

---

### 5.11 Slice 10 — Learn / Public Explanation

**Purpose:** Explain methodology, glossary, guides, and changelog for the upgraded system.

**Primary routes:**

```txt
/ethikos/learn/changelog
/ethikos/learn/glossary
/ethikos/learn/guides
/ethikos/decide/methodology
```

**Likely frontend files:**

```txt
frontend/services/learn.ts
frontend/app/ethikos/learn/changelog/page.tsx
frontend/app/ethikos/learn/glossary/page.tsx
frontend/app/ethikos/learn/guides/page.tsx
frontend/app/ethikos/decide/methodology/page.tsx
```

**Likely docs files:**

```txt
docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/24_WAVE1_SLICE_REGISTER.md
docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/25_WAVE1_QA_CHECKLIST.md
docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/26_WAVE1_PATCH_NOTES.md
```

**Exit criteria:**

- public explanation matches actual implemented behavior;
- methodology text distinguishes Korum, Konsultations, Smart Vote, and EkoH;
- no route or endpoint promise is documented unless implemented or clearly marked deferred.

---

### 5.12 Slice 11 — Frontend Service Alignment

**Purpose:** Align the frontend service layer after initial vertical slices reveal real shared patterns.

**Likely files:**

```txt
frontend/api.ts
frontend/services/index.ts
frontend/services/ethikos.ts
frontend/services/deliberate.ts
frontend/services/decide.ts
frontend/services/impact.ts
frontend/services/pulse.ts
frontend/services/learn.ts
frontend/services/admin.ts
frontend/services/readings.ts
frontend/services/trust.ts
```

**Exit criteria:**

- services own API access;
- page files do not duplicate raw fetch logic unnecessarily;
- `/api/home/*` is not expanded;
- service methods map to canonical backend endpoints;
- frontend types match serializer payloads.

---

### 5.13 Slice 12 — Backend API / Schema Alignment

**Purpose:** Consolidate backend models, serializers, viewsets, routers, permissions, admin, and migrations after several slices have produced real code.

**Likely files:**

```txt
backend/konnaxion/ethikos/models.py
backend/konnaxion/ethikos/constants.py
backend/konnaxion/ethikos/permissions.py
backend/konnaxion/ethikos/serializers.py
backend/konnaxion/ethikos/api_views.py
backend/konnaxion/ethikos/urls.py
backend/konnaxion/ethikos/admin.py
backend/config/api_router.py
backend/konnaxion/kollective_intelligence/models.py
backend/konnaxion/kollective_intelligence/serializers.py
backend/konnaxion/kollective_intelligence/api_views.py
backend/konnaxion/ekoh/views/profile.py
```

**Exit criteria:**

- model names remain canonical;
- serializer fields match payload contracts;
- router basenames are stable;
- migration history is linear and reviewable;
- app boundaries remain intact.

---

### 5.14 Slice 13 — Test / Smoke / QA Hardening

**Purpose:** Make the whole Wave 1 patch set verifiable.

**Likely backend files:**

```txt
backend/konnaxion/ethikos/tests.py
backend/konnaxion/ethikos/tests/
backend/konnaxion/kollective_intelligence/tests/
backend/konnaxion/ekoh/tests/
```

**Likely frontend files:**

```txt
frontend/_e2e/ethikos-kintsugi-wave1.spec.ts
frontend/_e2e/ethikos-deliberate.spec.ts
frontend/_e2e/ethikos-decide.spec.ts
frontend/_e2e/ethikos-impact.spec.ts
frontend/_e2e/ethikos-admin.spec.ts
```

**Minimum checks:**

```txt
backend model preservation
backend endpoint availability
forbidden route absence
forbidden app absence
frontend route smoke
service endpoint mapping
migration sanity
Smart Vote source mutation prohibition
EkoH voting-engine prohibition
Kialo native-mimic boundary
```

**Exit criteria:**

- all backend tests pass locally;
- frontend build succeeds locally;
- e2e/smoke tests pass locally or are explicitly marked pending with reason;
- QA checklist is updated.

---

### 5.15 Slice 14 — Docs / ADR / Release Notes

**Purpose:** Keep implementation documentation aligned with actual code.

**Likely docs files:**

```txt
docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/18_ADR_REGISTER.md
docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/23_WAVE1_IMPLEMENTATION_BACKLOG.md
docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/24_WAVE1_SLICE_REGISTER.md
docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/25_WAVE1_QA_CHECKLIST.md
docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/26_WAVE1_PATCH_NOTES.md
```

**Exit criteria:**

- every implemented endpoint is documented;
- every schema change is documented;
- every deferred item is visible;
- rollback notes are present;
- ADRs capture decisions that affect multiple slices.

---

## 6. Files Common to More Than One Slice

### 6.1 Highest-Conflict Shared Backend Files

These files are common to many slices and must be edited deliberately.

```txt
backend/konnaxion/ethikos/models.py
backend/konnaxion/ethikos/serializers.py
backend/konnaxion/ethikos/api_views.py
backend/konnaxion/ethikos/admin.py
backend/konnaxion/ethikos/urls.py
backend/config/api_router.py
```

Used by:

```txt
Slice 00 — Foundation / No-Drift Baseline
Slice 01 — Korum / Deliberate
Slice 02 — Konsultations / Decide
Slice 03 — Smart Vote Readings
Slice 05 — Drafting / Rationale
Slice 06 — Impact / Accountability
Slice 07 — Pulse / Civic Health
Slice 08 — Insights / Interpretation
Slice 09 — Admin / Governance
Slice 12 — Backend API / Schema Alignment
Slice 13 — Test / Smoke / QA Hardening
```

**Rule:** avoid speculative generalization. Add only what the active slice needs, then consolidate after real duplication appears.

---

### 6.2 Shared Backend Foundation Files

```txt
backend/konnaxion/ethikos/constants.py
backend/konnaxion/ethikos/permissions.py
```

Used by:

```txt
Slice 00 — Foundation / No-Drift Baseline
Slice 01 — Korum / Deliberate
Slice 02 — Konsultations / Decide
Slice 05 — Drafting / Rationale
Slice 06 — Impact / Accountability
Slice 09 — Admin / Governance
Slice 12 — Backend API / Schema Alignment
Slice 13 — Test / Smoke / QA Hardening
```

**Rule:** keep these small. Prefer simple constants and permissions. Do not turn them into a hidden framework.

---

### 6.3 Shared Migration Files

Likely migration files:

```txt
backend/konnaxion/ethikos/migrations/0003_kintsugi_wave1_korum.py
backend/konnaxion/ethikos/migrations/0004_kintsugi_wave1_konsultations.py
backend/konnaxion/ethikos/migrations/0005_kintsugi_wave1_drafting.py
backend/konnaxion/ethikos/migrations/0006_kintsugi_wave1_impact.py
backend/konnaxion/kollective_intelligence/migrations/0002_kintsugi_wave1_readings.py
backend/konnaxion/ekoh/migrations/0003_kintsugi_wave1_context.py
```

Used by:

```txt
Slice 01 — Korum / Deliberate
Slice 02 — Konsultations / Decide
Slice 03 — Smart Vote Readings
Slice 04 — EkoH Trust / Context
Slice 05 — Drafting / Rationale
Slice 06 — Impact / Accountability
Slice 12 — Backend API / Schema Alignment
Slice 13 — Test / Smoke / QA Hardening
```

**Rule:** migrations should be created only when the slice introduces real schema changes. Do not create all migrations during foundation.

---

### 6.4 Shared Frontend Service Files

```txt
frontend/api.ts
frontend/services/index.ts
frontend/services/ethikos.ts
frontend/services/deliberate.ts
frontend/services/decide.ts
frontend/services/impact.ts
frontend/services/pulse.ts
frontend/services/learn.ts
frontend/services/admin.ts
frontend/services/readings.ts
frontend/services/trust.ts
```

Used by:

```txt
Slice 00 — Foundation / No-Drift Baseline
Slice 01 — Korum / Deliberate
Slice 02 — Konsultations / Decide
Slice 03 — Smart Vote Readings
Slice 04 — EkoH Trust / Context
Slice 06 — Impact / Accountability
Slice 07 — Pulse / Civic Health
Slice 08 — Insights / Interpretation
Slice 09 — Admin / Governance
Slice 10 — Learn / Public Explanation
Slice 11 — Frontend Service Alignment
Slice 13 — Test / Smoke / QA Hardening
```

**Rule:** services are the API access boundary. Route pages should not each invent their own backend mapping.

---

### 6.5 Shared ethiKos Shell Files

Usually avoid modifying these unless navigation or route-shell consistency blocks multiple slices.

```txt
frontend/app/ethikos/layout.tsx
frontend/app/ethikos/EthikosPageShell.tsx
```

Used by:

```txt
all frontend slices
```

**Rule:** do not create a second shell, theme system, `/kialo`, or `/kintsugi` shell.

---

### 6.6 Shared Cross-Slice Frontend Pages

```txt
frontend/app/ethikos/deliberate/[topic]/page.tsx
```

Used by:

```txt
Slice 01 — Korum / Deliberate
Slice 02 — Konsultations / Decide
Slice 03 — Smart Vote Readings
Slice 05 — Drafting / Rationale
Slice 09 — Admin / Governance
```

```txt
frontend/app/ethikos/decide/elite/page.tsx
frontend/app/ethikos/decide/public/page.tsx
frontend/app/ethikos/decide/results/page.tsx
frontend/app/ethikos/decide/methodology/page.tsx
```

Used by:

```txt
Slice 02 — Konsultations / Decide
Slice 03 — Smart Vote Readings
Slice 04 — EkoH Trust / Context
Slice 05 — Drafting / Rationale
Slice 08 — Insights / Interpretation
Slice 10 — Learn / Public Explanation
```

```txt
frontend/app/ethikos/insights/page.tsx
```

Used by:

```txt
Slice 03 — Smart Vote Readings
Slice 04 — EkoH Trust / Context
Slice 07 — Pulse / Civic Health
Slice 08 — Insights / Interpretation
Slice 06 — Impact / Accountability
```

```txt
frontend/app/ethikos/admin/audit/page.tsx
frontend/app/ethikos/admin/moderation/page.tsx
frontend/app/ethikos/admin/roles/page.tsx
```

Used by:

```txt
Slice 01 — Korum / Deliberate
Slice 02 — Konsultations / Decide
Slice 03 — Smart Vote Readings
Slice 04 — EkoH Trust / Context
Slice 06 — Impact / Accountability
Slice 09 — Admin / Governance
```

---

### 6.7 Shared Smart Vote Files

```txt
backend/konnaxion/kollective_intelligence/models.py
backend/konnaxion/kollective_intelligence/serializers.py
backend/konnaxion/kollective_intelligence/api_views.py
backend/konnaxion/kollective_intelligence/admin.py
```

Used by:

```txt
Slice 03 — Smart Vote Readings
Slice 08 — Insights / Interpretation
Slice 13 — Test / Smoke / QA Hardening
```

Possible read-side coordination with:

```txt
Slice 02 — Konsultations / Decide
Slice 04 — EkoH Trust / Context
```

**Rule:** Smart Vote owns derived readings and result publication. It must not mutate source facts.

---

### 6.8 Shared EkoH Files

```txt
backend/konnaxion/ekoh/models/*
backend/konnaxion/ekoh/serializers/*
backend/konnaxion/ekoh/services/*
backend/konnaxion/ekoh/views/*
backend/konnaxion/ekoh/urls.py
backend/konnaxion/ekoh/admin.py
```

Used by:

```txt
Slice 04 — EkoH Trust / Context
Slice 08 — Insights / Interpretation
Slice 13 — Test / Smoke / QA Hardening
```

Possible read-side coordination with:

```txt
Slice 03 — Smart Vote Readings
Slice 02 — Konsultations / Decide
Slice 09 — Admin / Governance
```

**Rule:** EkoH supplies expertise, ethics, cohort, and snapshot context. It is not the voting engine.

---

### 6.9 Shared Test Files

```txt
backend/konnaxion/ethikos/tests.py
backend/konnaxion/ethikos/tests/
backend/konnaxion/kollective_intelligence/tests/
backend/konnaxion/ekoh/tests/
frontend/_e2e/ethikos-kintsugi-wave1.spec.ts
frontend/_e2e/ethikos-deliberate.spec.ts
frontend/_e2e/ethikos-decide.spec.ts
frontend/_e2e/ethikos-impact.spec.ts
frontend/_e2e/ethikos-admin.spec.ts
```

Used by:

```txt
all slices
```

**Rule:** test names should declare the slice and invariant under test.

---

### 6.10 Shared Documentation Files

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
docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/23_WAVE1_IMPLEMENTATION_BACKLOG.md
docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/24_WAVE1_SLICE_REGISTER.md
docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/25_WAVE1_QA_CHECKLIST.md
docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/26_WAVE1_PATCH_NOTES.md
```

Used by:

```txt
all slices that add endpoints, models, payloads, services, tests, route behavior, or ADR-worthy decisions
```

---

## 7. Recommended Implementation Order

```txt
00. Foundation / No-Drift Baseline
01. Korum / Deliberate
11. Frontend Service Alignment, light pass
12. Backend API / Schema Alignment, light pass
02. Konsultations / Decide
03. Smart Vote Readings
12. Backend API / Schema Alignment, second pass
04. EkoH Trust / Context
05. Drafting / Rationale
06. Impact / Accountability
07. Pulse / Civic Health
08. Insights / Interpretation
09. Admin / Governance
10. Learn / Public Explanation
13. Test / Smoke / QA Hardening
14. Docs / ADR / Release Notes
```

### 7.1 Why Korum Comes First

Korum / Deliberate is the best first vertical reference slice because it exercises:

- current ethiKos models;
- current ethiKos API routes;
- serializer/viewset/router conventions;
- frontend service conventions;
- route-page integration;
- moderation boundaries;
- native-mimic rules;
- Kialo-style mapping without importing Kialo code.

It also contains the known preview bug and therefore provides an immediate test of the foundation layer.

---

## 8. Shared-File Editing Protocol

Before modifying a shared file, the active slice must record:

```yaml
shared_file_edit:
  slice_id: ""
  file: ""
  reason: ""
  adds_model: false
  adds_endpoint: false
  adds_serializer: false
  adds_frontend_service: false
  affects_existing_route: false
  affects_existing_payload: false
  migration_required: false
  tests_required:
    - ""
  rollback_note: ""
```

### 8.1 Shared-File Rules

```txt
1. Do not rename existing ethiKos core models.
2. Do not move ethiKos functionality to a new backend app.
3. Do not create Kialo or Kintsugi routes.
4. Do not expand /api/home/*.
5. Do not let Smart Vote mutate source facts.
6. Do not treat EkoH as a voting engine.
7. Do not mix argument impact votes with topic-level stances.
8. Do not add frontend raw fetches when a service wrapper exists or should exist.
9. Do not add migrations without tests and rollback notes.
10. Do not create generic abstractions before two slices prove the same need.
```

---

## 9. Slice Handoff Template

Each slice handoff should use this template.

```markdown
# Slice Handoff — <ID> <Name>

## Scope

## Files Modified

## Files Created

## Models Added or Changed

## Endpoints Added or Changed

## Frontend Services Added or Changed

## Frontend Routes Added or Changed

## Tests Added or Changed

## Shared Files Touched

## Drift Checks

- [ ] no `/kialo/*`
- [ ] no `/kintsugi/*`
- [ ] no `konnaxion.kialo`
- [ ] no `/api/home/*` expansion
- [ ] existing ethiKos models preserved
- [ ] existing canonical endpoints preserved
- [ ] Smart Vote source mutation prohibition preserved
- [ ] EkoH voting-engine prohibition preserved

## Rollback Notes

## Deferred Items
```

---

## 10. Drift-Control Checklist for This Register

```txt
[ ] Targets /ethikos/* only.
[ ] Maps work to Decide, Deliberate, Trust, Pulse, Impact, Learn, Insights, and Admin.
[ ] Preserves konnaxion.ethikos as primary ethiKos backend app.
[ ] Avoids creating konnaxion.kialo.
[ ] Avoids creating /kialo or /kintsugi frontend routes.
[ ] Preserves EthikosCategory, EthikosTopic, EthikosStance, and EthikosArgument.
[ ] Preserves /api/ethikos/topics/, /stances/, /arguments/, /categories/.
[ ] Preserves /api/kollective/votes/.
[ ] Keeps Smart Vote readings derived.
[ ] Keeps EkoH contextual.
[ ] Separates Kialo-style argument impact votes from topic-level stances.
[ ] Treats this document as a slice coordination register, not a full task backlog.
```

---

## 11. Related Docs

```txt
00_KINTSUGI_START_HERE.md
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
20_AI_GENERATION_GUARDRAILS.md
21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md
22_IMPLEMENTATION_BACKLOG_TEMPLATE.md
23_WAVE1_IMPLEMENTATION_BACKLOG.md
25_WAVE1_QA_CHECKLIST.md
```

---

## 12. Final Contract

```txt
Wave 1 is all implementation work included by DocKintsugi_Kompendio.txt.

Wave 1 must be split into focused slices.

The Korum slice is the preferred first vertical reference slice.

Common files should be seeded lightly, expanded only when a slice needs them, and consolidated after real code exists.

Kintsugi is not a new app.
Kintsugi is not a new route family.
Kintsugi is the route-by-route strengthening of ethiKos.
```
