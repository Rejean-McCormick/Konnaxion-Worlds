# 05 — Current State Baseline

**File:** `05_CURRENT_STATE_BASELINE.md`
**Pack:** ethiKos Kintsugi Update Documentation Pack
**Status:** Canonical baseline snapshot before Kintsugi upgrade
**Last aligned:** 2026-04-25
**Purpose:** Freeze the current known implementation state so the Kintsugi upgrade does not drift into re-debugging, route invention, model renaming, or speculative architecture.

---

## 1. Purpose

This document records the **current state of ethiKos and related Konnaxion infrastructure before the Kintsugi upgrade**.

It is not a strategy document, not a backlog, and not a future-state architecture proposal.

Its role is to answer:

1. What currently exists?
2. What currently works?
3. What current routes, endpoints, models, services, and module boundaries must be preserved?
4. What known defects must be tracked separately from the Kintsugi architecture work?
5. What implementation facts must future Kintsugi documents treat as fixed?

The baseline is intentionally conservative. When future documents conflict with this baseline, they must explicitly explain whether they are describing:

* current state,
* target state,
* migration step,
* deferred capability.

---

## 2. Scope

This baseline covers:

* current repository snapshot structure;
* current frontend route surface for ethiKos;
* current backend app structure relevant to ethiKos;
* current canonical API endpoints;
* current canonical Ethikos models;
* current service-layer and graph observations;
* current smoke/build/runtime baseline;
* current known defect;
* current anti-drift constraints for the Kintsugi documentation pack.

This baseline does **not** define:

* the final Kintsugi target architecture;
* the full implementation backlog;
* the complete OSS integration plan;
* future schema migrations;
* future Smart Vote / EkoH weighting logic;
* new UI components.

Those belong in related documents listed near the end of this file.

---

## 3. Source Basis

This baseline is derived from the uploaded Konnaxion repository snapshot, the technical reference docs, the contracts file, the endpoint graph, and the clean-slate Kintsugi carry-over plan.

The snapshot index identifies the repository as `Konnaxion`, split into root, frontend, backend, docs, PlantUML, EndPoints-Graphs, scripts, and miscellaneous volumes. 

The technical reference identifies ethiKos as the platform’s structured deliberation and consultation module, with the current canonical backend centered on topics, stances, arguments, and categories. 

The clean-slate carry-over plan establishes the stable pre-Kintsugi baseline: frontend build works, smoke tests passed, backend local startup works with `uv`, CSRF/auth/category/topic creation were fixed, argument posting works, EkoH migration `0002...` was created and applied, and the remaining visible Ethikos bug is the Deliberate preview drawer showing “Preview / No data.” 

---

## 4. Canonical Variables Used

```yaml
DOCUMENT_ID: "05_CURRENT_STATE_BASELINE"
DOCUMENT_ROLE: "Freeze current implementation reality before Kintsugi upgrade"

PROJECT_NAME: "Konnaxion"
MODULE_NAME: "ethiKos"
UPDATE_NAME: "Kintsugi"

CURRENT_BASELINE_DATE: "2026-04-25"
PRIMARY_FRONTEND_SURFACE: "/ethikos/*"
PRIMARY_BACKEND_APP: "konnaxion.ethikos"
PRIMARY_API_PREFIX: "/api/ethikos/"

CURRENT_ETHIKOS_MODELS:
  - "EthikosCategory"
  - "EthikosTopic"
  - "EthikosStance"
  - "EthikosArgument"

CURRENT_CANONICAL_ENDPOINTS:
  - "/api/ethikos/topics/"
  - "/api/ethikos/stances/"
  - "/api/ethikos/arguments/"
  - "/api/ethikos/categories/"

COMPATIBILITY_ENDPOINT_PREFIXES:
  - "/api/deliberate/..."
  - "/api/deliberate/elite/..."

KNOWN_OPEN_BUG:
  id: "BUG-ETHIKOS-PREVIEW-DRAWER-001"
  label: "Deliberate preview drawer shows 'Preview / No data'"
  classification: "targeted_bugfix_not_architecture"

KINTSUGI_ALLOWED_BASELINE_ACTIONS:
  - "document current state"
  - "preserve existing route families"
  - "preserve existing backend core"
  - "add non-breaking target-state docs"
  - "separate known bugfix from architecture"

KINTSUGI_FORBIDDEN_BASELINE_ACTIONS:
  - "rename current models"
  - "replace current route families"
  - "invent new API prefixes"
  - "expand /api/home/* usage"
  - "treat preview drawer bug as reason for architecture redesign"
```

---

## 5. Repository Snapshot Baseline

The uploaded snapshot is a codedump split into multiple volumes. The master index identifies the following relevant volumes:

| Volume                                              | Purpose             |
| --------------------------------------------------- | ------------------- |
| `Konnaxion_20260425_152801_01_ROOT.txt`             | root files          |
| `Konnaxion_20260425_152801_02_frontend.txt`         | frontend source     |
| `Konnaxion_20260425_152801_03_backend.txt`          | backend source      |
| `Konnaxion_20260425_152801_04_docs.txt`             | documentation       |
| `Konnaxion_20260425_152801_05_PlantUML.txt`         | diagrams            |
| `Konnaxion_20260425_152801_06_EndPoints-Graphs.txt` | endpoint graph      |
| `Konnaxion_20260425_152801_07_scripts.txt`          | scripts             |
| `Konnaxion_20260425_152801_99_OTHERS.txt`           | miscellaneous files |

The frontend volume contains 472 files, and the backend volume contains 309 files.  

### Baseline rule

Future Kintsugi documents must cite the snapshot reality when describing implementation state. Conceptual route names from older docs may be retained as product language, but implementation work must map onto the actual current repository structure.

---

## 6. Stable Operational Baseline

The following operational state is considered fixed for the Kintsugi documentation pack:

| Area                          | Current state                                       |
| ----------------------------- | --------------------------------------------------- |
| Frontend build                | Works                                               |
| Smoke tests                   | Passed                                              |
| Backend local startup         | Works with `uv`                                     |
| Auth / CSRF                   | Fixed for the tested flows                          |
| Category creation             | Fixed                                               |
| Topic creation                | Fixed                                               |
| Argument posting              | Works                                               |
| EkoH migration                | `0002...` created and applied                       |
| Remaining visible Ethikos bug | Deliberate preview drawer shows “Preview / No data” |

This baseline comes from the clean-slate carry-over plan and must not be re-litigated inside Kintsugi strategy docs. 

### Anti-drift rule

Kintsugi documentation must not restart the prior debugging narrative. The known remaining bug must be tracked as a targeted defect, not used to redesign the Kintsugi architecture.

---

## 7. Current Frontend Baseline

### 7.1 Primary route surface

The current Ethikos frontend is implemented under:

```txt
/ethikos/*
```

The implemented page groups are:

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

The technical reference states that this route structure is deeper and more explicit than older simplified navigation concepts such as `/debate`, `/consult`, or `/reputation`. 

### 7.2 Implemented route inventory

#### Decide

```txt
/ethikos/decide/elite
/ethikos/decide/public
/ethikos/decide/results
/ethikos/decide/methodology
```

Current role:

* decision-oriented surfaces;
* results views;
* methodology explanation;
* public and elite decision participation surfaces.

#### Deliberate

```txt
/ethikos/deliberate/elite
/ethikos/deliberate/[topic]
/ethikos/deliberate/guidelines
```

Current role:

* topic-centered deliberation;
* argument threads;
* stance capture;
* guidelines.

#### Trust

```txt
/ethikos/trust/profile
/ethikos/trust/badges
/ethikos/trust/credentials
```

Current role:

* credibility;
* badges;
* credentials;
* legitimacy and expertise signaling.

#### Pulse

```txt
/ethikos/pulse/overview
/ethikos/pulse/live
/ethikos/pulse/health
/ethikos/pulse/trends
```

Current role:

* participation monitoring;
* health signals;
* live activity;
* trends.

#### Impact

```txt
/ethikos/impact/feedback
/ethikos/impact/outcomes
/ethikos/impact/tracker
```

Current role:

* feedback;
* outcomes;
* tracker views;
* accountability surface.

#### Learn

```txt
/ethikos/learn/changelog
/ethikos/learn/glossary
/ethikos/learn/guides
```

Current role:

* changelog;
* glossary;
* guides;
* explanatory content.

#### Insights

```txt
/ethikos/insights
```

Current role:

* analytics;
* interpretation;
* reporting surface.

#### Admin

```txt
/ethikos/admin/audit
/ethikos/admin/moderation
/ethikos/admin/roles
```

Current role:

* audit;
* moderation;
* role management.

The docs volume and technical reference both confirm these implemented route families as first-class Ethikos page groups. 

---

## 8. Frontend Shell and Layout Baseline

Ethikos pages currently use the existing module/global shell structure.

The technical reference states that the Ethikos frontend uses `EthikosPageShell` and `PageContainer` consistently. 

The frontend file index includes:

```txt
frontend/app/ethikos/EthikosPageShell.tsx
frontend/app/ethikos/layout.tsx
```

and route pages under all major Ethikos route families. 

### Baseline rule

Future Kintsugi UI work must:

* keep the existing `/ethikos/*` route surface;
* keep the existing shell pattern;
* use `EthikosPageShell` where appropriate;
* avoid creating a second Kintsugi shell;
* avoid creating a separate Kialo route family;
* avoid creating a separate top-level Kintsugi application.

### Forbidden

```txt
/kintsugi/*
/kialo/*
/platforms/konnaxion/ethikos/kintsugi as implementation route
new root-level Ethikos shell
new independent civic-tech shell
```

Conceptual/public routes may appear in strategy docs, but implementation mapping must target the current `/ethikos/*` surface.

---

## 9. Current Backend Baseline

### 9.1 Backend stack

The current backend is a Django / Django REST Framework project with local apps including:

```txt
konnaxion.users
konnaxion.kollective_intelligence
konnaxion.ethikos
konnaxion.keenkonnect
konnaxion.konnected
konnaxion.kreative
```

The AI technical instructions identify the backend as Django 5.1 + Django REST Framework + Celery + Redis, using a Cookiecutter-Django-style layout and PostgreSQL as the relational database. 

The same technical instructions state that generated backend code should assume:

```txt
AUTH_USER_MODEL = "users.User"
ROOT_URLCONF = "config.urls"
```

and should not refer to Django’s default `auth.User`. 

### 9.2 Canonical backend app

The canonical backend app for Ethikos is:

```txt
konnaxion.ethikos
```

The contracts document states that Ethikos uses the `konnaxion.ethikos` backend app, exposed under `/api/ethikos/...` through the central DRF router. 

### 9.3 Current DRF style

The current API style is:

```txt
Django REST Framework ViewSet + Serializer + Router
```

The backend code imports and uses Ethikos ViewSets including:

```txt
CategoryViewSet
TopicViewSet
StanceViewSet
ArgumentViewSet
```

The backend snapshot shows `CategoryViewSet` as a `ReadOnlyModelViewSet` and `TopicViewSet` as a `ModelViewSet` with authenticated-or-read-only permissions and owner-or-read-only behavior. 

---

## 10. Current Canonical Ethikos API

The current canonical Ethikos API endpoints are:

```txt
/api/ethikos/topics/
/api/ethikos/stances/
/api/ethikos/arguments/
/api/ethikos/categories/
```

The contracts file maps these endpoints respectively to topic, stance, argument, and category ViewSets. 

Compatibility aliases also exist:

```txt
/api/deliberate/...
/api/deliberate/elite/...
```

These aliases include the same Ethikos URLs under different namespaces and must be treated as compatibility surfaces, not separate backends. 

### Baseline rule

Future Kintsugi documents must not invent alternate CRUD prefixes such as:

```txt
/api/deliberation/
/api/kintsugi/
/api/korum/
/api/kialo/
```

unless a later implementation document explicitly defines a non-breaking migration and its ownership.

---

## 11. Current Canonical Ethikos Models

Current canonical Ethikos tables/models:

```txt
EthikosCategory
EthikosTopic
EthikosStance
EthikosArgument
```

The technical reference and contracts document both identify these as the current canonical Ethikos model set.  

### 11.1 `EthikosCategory`

Current role:

* groups topics thematically;
* supports category filters;
* exposed through `/api/ethikos/categories/` when registered.

Known fields from contracts:

```txt
name
description
```



### 11.2 `EthikosTopic`

Current role:

* main debate / consultation prompt;
* main object used by Decide and Deliberate surfaces;
* current candidate mapping for future Korum `Discussion` / `Thesis` container.

Known semantics:

```txt
title
description
status: open | closed | archived
total_votes
last_activity
category
created_by
optional expertise_category
timestamps
```



### 11.3 `EthikosStance`

Current role:

* one user’s numeric position on a topic;
* topic-level stance, not claim-level vote;
* current basis for topic stance summaries and some consultation result calculations.

Known semantics:

```txt
user
topic
value: integer constrained to -3..+3
timestamp
unique per user/topic
```



### 11.4 `EthikosArgument`

Current role:

* discussion entry;
* threaded reply;
* current candidate mapping for future Kialo-style `Claim`;
* supports pro/con classification and nesting.

Known semantics:

```txt
topic
user
content
side: pro | con | null
parent
is_hidden
timestamps
```



### Baseline model rule

Do not rename current models during Kintsugi documentation or first-pass implementation planning.

Specifically:

```txt
Do not rename EthikosArgument to Claim.
Do not rename EthikosTopic to Discussion.
Do not rename EthikosStance to Ballot.
Do not rename EthikosCategory to Taxonomy.
```

Future documents may define conceptual mappings, but current model names remain stable.

---

## 12. Current Participation and Permission Baseline

The technical reference states that the user model already contains Ethikos-specific semantics such as:

```txt
is_ethikos_elite
can_participate_in_ethikos
```

with participation rules for staff, klones, and explicitly flagged elite users. 

The backend snapshot also shows simple owner-or-read-only behavior for objects using either `created_by_id` or `user_id`. 

### Baseline rule

Kintsugi docs may propose richer participation and role contracts, but they must recognize that current implementation already has:

* authenticated-or-read-only behavior;
* owner-or-read-only behavior;
* elite participation semantics;
* staff/klone/elite participation rules.

These must be extended carefully, not replaced implicitly.

---

## 13. Current Service-Layer Baseline

Ethikos data access should go through service modules rather than raw component-level fetches. The contracts document states that data access goes through an Ethikos service module wrapping `/api/ethikos/...` and `/api/deliberate/...`, and that Ethikos pages are rendered inside the global shell using shared UI primitives. 

Current frontend service exports include:

```txt
audit
decide
deliberate
pulse
```

The frontend snapshot shows `frontend/services/index.ts` exporting several service modules. 

### Baseline rule

Future Kintsugi frontend work must:

* use the existing services layer;
* avoid raw API fetches directly inside route pages unless documented as legacy or exceptional;
* preserve the service-wrapper pattern;
* avoid inventing an unrelated client architecture.

---

## 14. Current Endpoint Graph Observations

The endpoint graph identifies several important current-state mappings.

### 14.1 Deliberate service mappings are loose

The endpoint graph maps `frontend/services/deliberate.ts` calls such as:

```txt
/deliberate/topics/${id}
/deliberate/topics/${id}/preview
/deliberate/elite/topics
```

to backend `api/ethikos/topics`, with `TopicViewSet`, `EthikosTopic`, and `link_type = loose`. 

Interpretation:

* the frontend deliberate service is conceptually mapped to Ethikos topics;
* the mapping is not a fully strict one-to-one documented contract;
* Kintsugi should stabilize this service/API contract before adding complex Kialo-style argument mapping.

### 14.2 Preview service exists as a concept

The frontend service contains a `fetchTopicPreview` function that loads a topic from `ethikos/topics/{id}/`, then attempts to load arguments for that topic from `ethikos/arguments/`, and returns topic metadata plus a latest-statements slice. 

Interpretation:

* preview behavior has a service-level shape;
* runtime UI behavior still has a known visible defect from the baseline;
* the bug must be tracked separately.

### 14.3 Impact service mappings are loose

The endpoint graph maps several `frontend/services/impact.ts` calls to `api/keenkonnect/projects` with `ProjectViewSet`, `Project`, and `link_type = loose`. 

Interpretation:

* current Impact views are partially backed by KeenKonnect project concepts;
* Kintsugi target-state docs must clarify that civic accountability truth belongs to Ethikos/Konsultations, not KeenKonnect;
* any future handoff from Impact to KeenKonnect must be explicit.

### 14.4 Learn service mixes static and backend-derived content

The Learn service defines canonical local content and notes that glossary terms are synced from Ethikos categories, while category fetching must degrade safely because the backend categories endpoint may be optional. 

Interpretation:

* Learn is partly static/semi-static;
* Learn may read Ethikos categories;
* Learn should not be treated as a full dynamic Kintsugi engine surface.

---

## 15. Current Konsultations Baseline

Current Konsultations implementation is not yet a full independent backend module in the observed snapshot.

The frontend snapshot includes:

```txt
frontend/modules/konsultations/hooks/useConsultations.ts
```

as a stub, and other Konsultations hooks map consultation results and voting to Ethikos stances or Decide services. 

### Current interpretation

At baseline:

* a “consultation” may be represented by an Ethikos topic;
* consultation result calculations may aggregate `EthikosStance` rows;
* public consultation voting may wrap Decide service behavior;
* Konsultations is conceptually important but technically underdeveloped.

### Baseline rule

Future Kintsugi documents must not pretend that a full Konsultations backend already exists unless they explicitly mark it as target state.

---

## 16. Current Smart Vote / EkoH Baseline

The current Kintsugi baseline recognizes Smart Vote and EkoH as planned/related decision and expertise layers, but not as direct mutators of the Ethikos core.

The boundaries document states that ethiKos v2 is a documentation and boundary upgrade first, must keep existing service code names, core tables, and routes stable, and should only add non-breaking fields/tables such as reading audit fields, `ExternalArtifact`, `ProjectionMapping`, and drafting tables. 

### Baseline rule

For current-state purposes:

```txt
EthikosStance = existing topic-level stance
Smart Vote Reading = target derived reading layer
EkoH Snapshot = target expertise/context audit input
```

Future docs must preserve the separation between:

* raw stance/ballot events;
* Smart Vote readings;
* EkoH expertise/ethics context.

---

## 17. Current Build / Smoke / Runtime Verification Baseline

The baseline states:

```txt
frontend build works
Playwright smoke ran successfully
backend local startup works with uv
```



The technical reference adds that Ethikos participates in the standard frontend production build and now builds cleanly, and that Ethikos pages are part of successful static generation / route preparation in the production build. It also states that runtime verification remains required for live API-backed behavior even after build success. 

### Baseline implication

Build success does not mean all live API-backed Ethikos behavior is complete.

Kintsugi docs must distinguish:

| Category                | Meaning                                       |
| ----------------------- | --------------------------------------------- |
| Build-safe              | Compiles and participates in route generation |
| Smoke-safe              | Passed smoke verification                     |
| API-backed runtime-safe | Verified live against backend                 |
| Target-state            | Planned future behavior                       |

---

## 18. Known Open Bug

### BUG-ETHIKOS-PREVIEW-DRAWER-001

```yaml
id: "BUG-ETHIKOS-PREVIEW-DRAWER-001"
title: "Deliberate preview drawer shows 'Preview / No data'"
status: "known_open"
classification: "targeted_bugfix_not_architecture"
surface: "/ethikos/deliberate/*"
likely_area:
  - "frontend preview drawer"
  - "frontend/services/deliberate.ts"
  - "topic preview endpoint or response shape"
  - "runtime API data availability"
```

The clean-slate plan identifies this as the remaining visible Ethikos bug. 

The frontend service includes a `fetchTopicPreview` function that returns topic metadata and latest argument statements, which means the correct fix should likely verify runtime routing, response shape, and drawer consumption rather than redesigning the architecture. 

### Bug handling rule

This bug must be tracked in:

```txt
17_KNOWN_BUGS_AND_NON_KINTSUGI_ITEMS.md
```

It must not cause changes to:

* Kintsugi scope;
* ownership model;
* first-pass OSS matrix;
* Smart Vote / EkoH contracts;
* route-family stability.

---

## 19. Current Things That Are Not Yet Canonical

The technical reference explicitly states that the following broader concept-doc items are not part of the current canonical Ethikos implementation set:

```txt
AI clones
comparative analysis logs
debate archives
automated summaries
```



### Baseline rule

Future Kintsugi docs may describe these as possible later capabilities only if they are clearly marked as deferred or out-of-scope.

---

## 20. Current Legacy / Risk Areas

### 20.1 `/api/home/*`

Previous endpoint graph analysis identified lingering or historical `/api/home/*` usage. This baseline treats `/api/home/*` as legacy/problematic.

Rule:

```txt
Do not expand /api/home/*.
Do not define new Kintsugi features on /api/home/*.
Replace or isolate legacy uses through canonical services.
```

### 20.2 Loose service mappings

Current loose mappings exist around:

```txt
frontend/services/deliberate.ts
frontend/services/impact.ts
frontend/services/learn.ts
```

The endpoint graph shows multiple loose mappings from frontend service endpoints to backend viewsets/models. 

Rule:

```txt
Loose mappings must be converted into explicit API/service contracts before complex Kintsugi implementation.
```

### 20.3 Impact ownership ambiguity

Current Impact service mappings touch KeenKonnect project APIs. 

Rule:

```txt
Impact may hand off to KeenKonnect, but Kintsugi civic accountability truth belongs to Ethikos/Konsultations target state.
```

---

## 21. Baseline Route-to-Role Table

| Current route family    | Current baseline role                                      | Kintsugi implication                                                           |
| ----------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `/ethikos/decide/*`     | Decision, results, methodology, public/elite participation | Extend into decision protocols and Smart Vote readings                         |
| `/ethikos/deliberate/*` | Topics, stances, arguments, guidelines                     | Extend into Korum + Kialo-style structured argument mapping                    |
| `/ethikos/trust/*`      | Profile credibility, badges, credentials                   | Connect to EkoH context without making EkoH the voting engine                  |
| `/ethikos/pulse/*`      | Participation monitoring and trends                        | Extend into civic health signals                                               |
| `/ethikos/impact/*`     | Feedback, outcomes, tracker                                | Formalize Konsultations accountability and reduce loose KeenKonnect dependency |
| `/ethikos/learn/*`      | Changelog, glossary, guides                                | Use for Kintsugi methodology and public education                              |
| `/ethikos/insights`     | Analytics and interpretation                               | Use for reading comparisons and Smart Vote/EkoH explanations                   |
| `/ethikos/admin/*`      | Audit, moderation, roles                                   | Extend governance controls and audit trail                                     |

---

## 22. Baseline Model-to-Target Mapping

| Current model     | Current meaning                           | Future Kintsugi mapping                                            | Preserve name? |
| ----------------- | ----------------------------------------- | ------------------------------------------------------------------ | -------------- |
| `EthikosCategory` | Topic grouping                            | Taxonomy/category seed                                             | Yes            |
| `EthikosTopic`    | Debate / consultation prompt              | Korum discussion container; Konsultations topic proxy where needed | Yes            |
| `EthikosStance`   | User topic-level stance, `-3..+3`         | Raw topic stance event / possible baseline result input            | Yes            |
| `EthikosArgument` | Threaded argument/reply with pro/con side | Kialo-style claim node                                             | Yes            |

---

## 23. Current Baseline Invariants

These statements must remain true unless a future migration document explicitly changes them:

```yaml
ETHIKOS_PRIMARY_ROUTE_SURFACE: "/ethikos/*"
ETHIKOS_PRIMARY_BACKEND_APP: "konnaxion.ethikos"
ETHIKOS_PRIMARY_API_PREFIX: "/api/ethikos/"
ETHIKOS_CURRENT_MODELS_STABLE: true
ETHIKOS_ARGUMENT_POSTING_WORKS: true
ETHIKOS_STANCE_RANGE: "-3..+3"
ETHIKOS_ARGUMENT_GRAPH_CURRENT_BASIS: "EthikosArgument.parent + EthikosArgument.side"
ETHIKOS_COMPAT_ALIASES_EXIST: true
ETHIKOS_PREVIEW_DRAWER_BUG_OPEN: true
KONSULTATIONS_FULL_BACKEND_EXISTS: false
SMART_VOTE_READINGS_ARE_TARGET_STATE: true
EKOH_CONTEXT_IS_TARGET_STATE_FOR_WEIGHTED_READINGS: true
```

---

## 24. Non-Goals

This file does not:

* define the Kintsugi future-state architecture;
* introduce new models;
* introduce new routes;
* introduce new endpoints;
* propose migrations;
* define Smart Vote algorithms;
* define EkoH scoring;
* define Kialo-style payloads;
* fix the preview drawer bug;
* replace existing technical references;
* supersede the ownership/boundaries document.

---

## 25. Anti-Drift Rules

Future Kintsugi docs and AI-generated implementation plans must obey the following:

```txt
Do not treat conceptual docs as implementation reality when code snapshot disagrees.
Do not replace /ethikos/* with public/conceptual route names.
Do not rename current Ethikos models.
Do not create /api/kintsugi/* for first-pass CRUD.
Do not create /api/kialo/*.
Do not create konnaxion.kialo.
Do not expand /api/home/*.
Do not treat Konsultations as fully implemented backend current state.
Do not treat Smart Vote readings as current Ethikos source facts.
Do not treat EkoH as current voting engine.
Do not use BUG-ETHIKOS-PREVIEW-DRAWER-001 as architecture justification.
Do not generate backlog tasks inside this baseline file.
```

---

## 26. Related Documents

This baseline should be read with:

```txt
00_KINTSUGI_START_HERE.md
02_SOURCE_OF_TRUTH_AND_DRIFT_CONTROL.md
03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md
04_CANONICAL_NAMING_AND_VARIABLES.md
06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md
07_API_AND_SERVICE_CONTRACTS.md
08_DATA_MODEL_AND_MIGRATION_PLAN.md
09_SMART_VOTE_EKOH_READING_CONTRACT.md
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

## 27. Final Baseline Statement

The current ethiKos implementation is a working, build-safe structured deliberation module with a stable `/ethikos/*` frontend route surface, a canonical `konnaxion.ethikos` backend, REST endpoints under `/api/ethikos/*`, and four current canonical models: `EthikosCategory`, `EthikosTopic`, `EthikosStance`, and `EthikosArgument`.

The Kintsugi upgrade must build on this baseline without replacing it.

The only known visible Ethikos defect carried into the upgrade is:

```txt
BUG-ETHIKOS-PREVIEW-DRAWER-001:
Deliberate preview drawer shows “Preview / No data”.
```

That defect is a targeted runtime/UI bug, not a reason to redesign Ethikos architecture.
