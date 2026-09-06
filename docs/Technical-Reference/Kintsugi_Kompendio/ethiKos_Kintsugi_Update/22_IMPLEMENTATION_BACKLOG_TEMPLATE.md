# 22 — Implementation Backlog Template

**Project:** Konnaxion  
**Module:** ethiKos  
**Upgrade:** Kintsugi  
**Document ID:** `22_IMPLEMENTATION_BACKLOG_TEMPLATE.md`  
**Status:** Backlog generation template  
**Version:** `2026-04-25-kintsugi-doc-pack-v1`  
**Audience:** Human maintainers, implementation planners, AI coding agents, project managers, backend/frontend developers  
**Purpose:** Define the only approved format for converting the Kintsugi documentation pack into implementation tasks after documentation contracts and code-reading are complete.

---

## 1. Purpose

This document defines the canonical implementation backlog format for the ethiKos Kintsugi upgrade.

It exists to prevent premature, speculative, or drifted implementation work.

The backlog must only be generated after:

1. the Kintsugi documentation pack is stable;
2. source-of-truth rules are accepted;
3. ownership boundaries are accepted;
4. canonical variables are accepted;
5. route-by-route upgrade mapping is accepted;
6. API/service contracts are accepted;
7. data/model/migration contracts are accepted;
8. Kialo-style argument mapping contract is accepted;
9. code snapshot inspection is complete;
10. first-pass OSS code reading is complete or explicitly waived.

This document does **not** contain the actual implementation backlog.

It defines the template that the real backlog must follow.

---

## 2. Scope

This template governs backlog items for:

- backend models;
- backend migrations;
- serializers;
- DRF ViewSets;
- API router registrations;
- frontend services;
- frontend route upgrades;
- UI components;
- Smart Vote readings;
- EkoH snapshot/context references;
- Kialo-style argument mapping;
- Konsultations intake/ballots/impact;
- tests;
- smoke checks;
- documentation updates;
- migration verification;
- rollback planning;
- QA sequencing.

This template does not authorize:

- full external OSS merge;
- annex/sidecar implementation in first pass;
- new route families outside `/ethikos/*`;
- new backend apps for Kialo, Loomio, Decidim, CONSUL, DemocracyOS, or Consider.it;
- destructive changes to existing Ethikos core models;
- premature implementation before contracts are stable.

---

## 3. Canonical Variables Used

```yaml id="u8hqqq"
PROJECT:
  PLATFORM_NAME: "Konnaxion"
  MODULE_NAME: "ethiKos"
  UPDATE_NAME: "Kintsugi"

BACKLOG_POLICY:
  THIS_FILE_IS_TEMPLATE_ONLY: true
  GENERATE_REAL_BACKLOG_ONLY_AFTER_DOCS_AND_CODE_READING: true
  BACKLOG_ITEMS_MUST_TRACE_TO_SOURCE_DOCS: true
  BACKLOG_ITEMS_MUST_DECLARE_ROUTE_ENDPOINT_MODEL_TESTS: true
  BACKLOG_ITEMS_MUST_INCLUDE_ROLLBACK_NOTES: true
  BACKLOG_ITEMS_MUST_PASS_DRIFT_CHECK: true

IMPLEMENTATION_STYLE:
  MODE: "partial native mimic"
  FULL_EXTERNAL_MERGE_ALLOWED: false
  ANNEX_FIRST_PASS_ALLOWED: false
  EXISTING_ROUTE_FAMILIES_STABLE: true
  EXISTING_CORE_MODELS_STABLE: true

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
````

---

## 4. Backlog Readiness Gate

The real implementation backlog MUST NOT be generated until every readiness item is checked.

```markdown id="r7s2xb"
## Backlog Readiness Checklist

- [ ] `00_KINTSUGI_START_HERE.md` is accepted.
- [ ] `02_SOURCE_OF_TRUTH_AND_DRIFT_CONTROL.md` is accepted.
- [ ] `03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md` is accepted.
- [ ] `04_CANONICAL_NAMING_AND_VARIABLES.md` is accepted.
- [ ] `05_CURRENT_STATE_BASELINE.md` is accepted.
- [ ] `06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md` is accepted.
- [ ] `07_API_AND_SERVICE_CONTRACTS.md` is accepted.
- [ ] `08_DATA_MODEL_AND_MIGRATION_PLAN.md` is accepted.
- [ ] `09_SMART_VOTE_EKOH_READING_CONTRACT.md` is accepted.
- [ ] `10_FIRST_PASS_INTEGRATION_MATRIX.md` is accepted.
- [ ] `11_MIMIC_VS_ANNEX_RULEBOOK.md` is accepted.
- [ ] `12_CANONICAL_OBJECTS_AND_EVENTS.md` is accepted.
- [ ] `13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md` is accepted.
- [ ] `14_FRONTEND_ALIGNMENT_CONTRACT.md` is accepted.
- [ ] `15_BACKEND_ALIGNMENT_CONTRACT.md` is accepted.
- [ ] `16_TEST_AND_SMOKE_CONTRACT.md` is accepted.
- [ ] `17_KNOWN_BUGS_AND_NON_KINTSUGI_ITEMS.md` is accepted.
- [ ] `18_ADR_REGISTER.md` is accepted.
- [ ] `19_OSS_CODE_READING_PLAN.md` is accepted or explicitly waived.
- [ ] `20_AI_GENERATION_GUARDRAILS.md` is accepted.
- [ ] `21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md` is accepted.
- [ ] Current code snapshot has been inspected.
- [ ] Existing frontend route reality has been confirmed.
- [ ] Existing backend model/API reality has been confirmed.
- [ ] First-pass OSS patterns have been classified as mimic-only.
```

If any item is unchecked, the backlog may only be drafted as a **candidate backlog**, not as an implementation-ready backlog.

---

## 5. Backlog Generation Rule

All backlog items MUST be generated from accepted documentation.

No task may exist without at least one source document reference.

```yaml id="wxs8ew"
BACKLOG_ITEM_REQUIRES:
  source_doc: true
  source_section: true
  owner_domain: true
  route_scope: true
  backend_scope: true
  frontend_scope: true
  test_scope: true
  risk_level: true
  rollback_note: true
  drift_check: true
```

Forbidden backlog origins:

```txt id="ef3qwl"
"AI intuition"
"nice-to-have feature"
"OSS repo has this so Ethikos should have it"
"route invented during implementation"
"model invented during implementation"
"endpoint invented during implementation"
"UI redesign unrelated to Kintsugi"
```

Valid backlog origins:

```txt id="utbl5i"
"Derived from 06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md"
"Required by 08_DATA_MODEL_AND_MIGRATION_PLAN.md"
"Required by 09_SMART_VOTE_EKOH_READING_CONTRACT.md"
"Required by 21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md"
"Required by current code snapshot mismatch"
"Required by known bug registry"
```

---

## 6. Backlog ID Convention

Every backlog item MUST use a stable ID.

```txt id="c4cqrx"
KIN-EPIC-###
KIN-BE-###
KIN-FE-###
KIN-API-###
KIN-DATA-###
KIN-MIG-###
KIN-TEST-###
KIN-DOC-###
KIN-QA-###
KIN-BUG-###
KIN-ADR-###
```

### 6.1 Prefix Meanings

| Prefix     | Meaning                                                                     |
| ---------- | --------------------------------------------------------------------------- |
| `KIN-EPIC` | Larger workstream grouping several tasks.                                   |
| `KIN-BE`   | Backend model, serializer, service, permission, or viewset task.            |
| `KIN-FE`   | Frontend route, component, service, state, or UI task.                      |
| `KIN-API`  | API endpoint contract, router registration, payload, or compatibility task. |
| `KIN-DATA` | Data model design or data-shape task.                                       |
| `KIN-MIG`  | Migration task.                                                             |
| `KIN-TEST` | Unit, integration, API, frontend, or smoke test task.                       |
| `KIN-DOC`  | Documentation patch task.                                                   |
| `KIN-QA`   | Verification, manual QA, regression, or release-readiness task.             |
| `KIN-BUG`  | Targeted bugfix task.                                                       |
| `KIN-ADR`  | Architecture decision record task.                                          |

### 6.2 ID Examples

```txt id="q3fhhn"
KIN-EPIC-001
KIN-BE-001
KIN-FE-001
KIN-API-001
KIN-DATA-001
KIN-MIG-001
KIN-TEST-001
KIN-DOC-001
KIN-QA-001
KIN-BUG-001
KIN-ADR-001
```

IDs must not be reused.

---

## 7. Backlog Status Values

Every backlog item MUST use one of these statuses.

```yaml id="dwbeuw"
BACKLOG_STATUS:
  - "candidate"
  - "ready_for_review"
  - "approved"
  - "blocked"
  - "in_progress"
  - "implemented"
  - "verified"
  - "deferred"
  - "rejected"
```

### 7.1 Status Definitions

| Status             | Meaning                                                      |
| ------------------ | ------------------------------------------------------------ |
| `candidate`        | Draft task, not yet approved for implementation.             |
| `ready_for_review` | Task is fully specified and ready for human review.          |
| `approved`         | Task is approved for implementation.                         |
| `blocked`          | Task cannot proceed until dependency is resolved.            |
| `in_progress`      | Task is actively being implemented.                          |
| `implemented`      | Code/doc change is complete but not fully verified.          |
| `verified`         | Task passed tests and acceptance criteria.                   |
| `deferred`         | Valid task, but not in current implementation wave.          |
| `rejected`         | Task violates scope, ownership, or architecture constraints. |

---

## 8. Backlog Priority Values

```yaml id="mofri0"
PRIORITY:
  P0: "Required before any implementation can safely proceed."
  P1: "Required for first-pass Kintsugi implementation."
  P2: "Important but can follow first-pass implementation."
  P3: "Optional enhancement."
  P4: "Deferred future work."
```

### Priority Rules

* `P0` tasks are contract, safety, migration, or drift-control blockers.
* `P1` tasks are first-pass implementation requirements.
* `P2` tasks may improve completeness but are not blockers.
* `P3` tasks are optional enhancements.
* `P4` tasks must not be included in first-pass implementation.

---

## 9. Risk Values

```yaml id="f9dqlf"
RISK_LEVEL:
  LOW: "Small isolated change; no schema break; easy rollback."
  MEDIUM: "Crosses frontend/backend or adds schema; manageable rollback."
  HIGH: "Touches source-of-truth data, permissions, migrations, or result publication."
  CRITICAL: "Should not proceed without explicit ADR and human approval."
```

Any `HIGH` or `CRITICAL` task MUST include:

* explicit owner approval;
* rollback plan;
* migration safety note;
* test plan;
* drift-control check;
* affected docs list.

---

## 10. Epic Template

Use this template for every epic.

```markdown id="z6ewv4"
## <KIN-EPIC-###> — <Epic Title>

**Status:** candidate  
**Priority:** P1  
**Risk:** MEDIUM  
**Owner Domain:** Korum | Konsultations | Smart Vote | EkoH | Drafting | Admin/Audit | External Boundary  
**Primary Route Family:** `/ethikos/...`  
**Primary Backend App:** `konnaxion.ethikos` | `konnaxion.kollective_intelligence` | `konnaxion.ekoh`  
**Source Docs:**
- `<doc filename>#<section>`
- `<doc filename>#<section>`

### Purpose

Explain why this epic exists.

### Scope

List what is included.

### Non-Goals

List what must not be included.

### Required Tasks

- `<KIN-BE-###>`
- `<KIN-FE-###>`
- `<KIN-API-###>`
- `<KIN-DATA-###>`
- `<KIN-MIG-###>`
- `<KIN-TEST-###>`
- `<KIN-QA-###>`

### Dependencies

- `<KIN-...>`
- `<accepted doc>`
- `<code reading finding>`

### Acceptance Criteria

- [ ] All child tasks are verified.
- [ ] No anti-drift rule is violated.
- [ ] Existing smoke tests still pass.
- [ ] New tests are added where required.
- [ ] Related docs are updated.

### Rollback Strategy

Describe how to disable, revert, or isolate the epic safely.

### Drift Check

- [ ] Does not create full OSS merge.
- [ ] Does not create new route family.
- [ ] Does not rename existing models.
- [ ] Does not mutate source facts through Smart Vote.
- [ ] Does not turn EkoH into a voting engine.
```

---

## 11. Task Template

Use this template for every implementation task.

````markdown id="xwzvox"
## <KIN-AREA-###> — <Task Title>

**Status:** candidate  
**Priority:** P1  
**Risk:** LOW | MEDIUM | HIGH | CRITICAL  
**Owner Domain:** Korum | Konsultations | Smart Vote | EkoH | Drafting | Admin/Audit | External Boundary  
**Task Type:** backend | frontend | api | data | migration | test | doc | qa | bugfix | adr  
**Source Docs:**
- `<doc filename>#<section>`
- `<doc filename>#<section>`

### 1. Intent

Describe the task in one paragraph.

### 2. Scope

This task includes:

- `<scope item>`
- `<scope item>`

This task excludes:

- `<non-goal>`
- `<non-goal>`

### 3. Current Reality

**Current frontend route(s):**

```txt
<existing route or N/A>
````

**Current backend endpoint(s):**

```txt
<existing endpoint or N/A>
```

**Current backend model(s):**

```txt
<existing model or N/A>
```

**Current service/component/file(s):**

```txt
<path or N/A>
```

### 4. Target Change

Describe the exact desired change.

### 5. Affected Files

**Frontend:**

```txt
<path>
<path>
```

**Backend:**

```txt
<path>
<path>
```

**Docs:**

```txt
<path>
<path>
```

**Tests:**

```txt
<path>
<path>
```

### 6. Data / Schema Impact

```yaml
SCHEMA_CHANGE_REQUIRED: false
MIGRATION_REQUIRED: false
NEW_MODEL_REQUIRED: false
EXISTING_MODEL_MODIFIED: false
DATA_BACKFILL_REQUIRED: false
```

If any value is `true`, describe the migration plan.

### 7. API Contract Impact

```yaml
NEW_ENDPOINT_REQUIRED: false
EXISTING_ENDPOINT_CHANGED: false
SERIALIZER_CHANGED: false
BACKWARD_COMPATIBLE: true
```

If any endpoint is added or changed, list the canonical API path.

### 8. Frontend Contract Impact

```yaml
ROUTE_CHANGED: false
NEW_COMPONENT_REQUIRED: false
SERVICE_LAYER_CHANGE_REQUIRED: false
RAW_FETCH_ALLOWED: false
SHELL_LAYOUT_CHANGED: false
```

If UI is affected, list the route and component.

### 9. Acceptance Criteria

* [ ] `<criterion>`
* [ ] `<criterion>`
* [ ] Existing behavior remains backward compatible.
* [ ] No forbidden route/model/API drift.
* [ ] Tests pass.

### 10. Tests Required

* [ ] Backend unit test
* [ ] Backend API test
* [ ] Migration test
* [ ] Frontend component test
* [ ] Frontend route smoke
* [ ] Playwright smoke
* [ ] Manual QA

### 11. Rollback Plan

Describe how to revert safely.

### 12. Risks

| Risk     | Severity        | Mitigation     |
| -------- | --------------- | -------------- |
| `<risk>` | LOW/MEDIUM/HIGH | `<mitigation>` |

### 13. Drift Check

* [ ] Uses `/ethikos/*` route surface.
* [ ] Uses canonical `/api/ethikos/*` or approved endpoint.
* [ ] Does not expand `/api/home/*`.
* [ ] Does not rename `EthikosTopic`, `EthikosStance`, `EthikosArgument`, or `EthikosCategory`.
* [ ] Does not create `konnaxion.kialo`.
* [ ] Does not treat `ArgumentImpactVote` as `EthikosStance`.
* [ ] Does not treat `ReadingResult` as source fact.
* [ ] Does not let Smart Vote mutate upstream records.
* [ ] Does not let EkoH act as voting engine.
* [ ] Does not directly import external OSS code.

````

---

## 12. Backend Task Template

Use this specialization for backend tasks.

```markdown id="rrtrh2"
## <KIN-BE-###> — <Backend Task Title>

**Status:** candidate  
**Priority:** P1  
**Risk:** MEDIUM  
**Owner Domain:** `<domain>`  
**Backend App:** `konnaxion.ethikos` | `konnaxion.kollective_intelligence` | `konnaxion.ekoh`  
**Source Docs:**
- `<doc>#<section>`

### Intent

Describe the backend change.

### Allowed Backend Pattern

```yaml
API_STYLE: "Django REST Framework ViewSet + Serializer + Router"
AUTH_USER_MODEL: "users.User"
ROUTER_FILE: "backend/config/api_router.py"
DEFAULT_BACKEND_APP: "konnaxion.ethikos"
````

### Affected Backend Files

```txt
backend/konnaxion/ethikos/models.py
backend/konnaxion/ethikos/api/serializers.py
backend/konnaxion/ethikos/api/views.py
backend/config/api_router.py
```

Replace paths with actual inspected paths.

### Model Impact

```yaml
NEW_MODEL: "<model or null>"
EXISTING_MODEL: "<model or null>"
FIELDS_ADDED:
  - "<field>"
FIELDS_REMOVED: []
FIELDS_RENAMED: []
```

### Serializer Impact

```yaml
NEW_SERIALIZER: "<serializer or null>"
EXISTING_SERIALIZER_CHANGED: "<serializer or null>"
BACKWARD_COMPATIBLE: true
```

### ViewSet / Endpoint Impact

```yaml
NEW_VIEWSET: "<viewset or null>"
EXISTING_VIEWSET_CHANGED: "<viewset or null>"
ENDPOINT: "/api/ethikos/<resource>/"
```

### Permissions

Describe authentication, ownership, moderation, and admin rules.

### Acceptance Criteria

* [ ] Existing endpoints still work.
* [ ] New endpoint follows DRF style.
* [ ] Serializer output matches contract.
* [ ] Permissions are explicit.
* [ ] Tests cover happy path and denied path.
* [ ] No direct foreign tool writes to core tables.

````

---

## 13. Frontend Task Template

Use this specialization for frontend tasks.

```markdown id="fy8t8s"
## <KIN-FE-###> — <Frontend Task Title>

**Status:** candidate  
**Priority:** P1  
**Risk:** MEDIUM  
**Owner Domain:** `<domain>`  
**Route Family:** `/ethikos/...`  
**Source Docs:**
- `<doc>#<section>`

### Intent

Describe the frontend change.

### Allowed Frontend Pattern

```yaml
PRIMARY_ROUTE_SURFACE: "/ethikos/*"
USE_EXISTING_ETHIKOS_SHELL: true
CREATE_SECOND_SHELL: false
USE_SERVICE_LAYER: true
RAW_FETCH_FROM_PAGE_COMPONENTS: false
````

### Affected Frontend Files

```txt
frontend/app/ethikos/<route>/page.tsx
frontend/app/ethikos/EthikosPageShell.tsx
frontend/services/<service>.ts
frontend/components/<component>.tsx
```

Replace paths with actual inspected paths.

### Route Impact

```yaml
EXISTING_ROUTE: "/ethikos/<family>/<page>"
NEW_ROUTE_REQUIRED: false
ROUTE_RENAME_REQUIRED: false
```

### Component Impact

```yaml
NEW_COMPONENTS:
  - "<component>"
UPDATED_COMPONENTS:
  - "<component>"
REMOVED_COMPONENTS: []
```

### Service Impact

```yaml
SERVICE_FILE: "frontend/services/<service>.ts"
NEW_SERVICE_FUNCTIONS:
  - "<function>"
UPDATED_SERVICE_FUNCTIONS:
  - "<function>"
RAW_FETCH_ALLOWED: false
```

### Acceptance Criteria

* [ ] Page remains under existing Ethikos shell.
* [ ] No duplicate layout shell is introduced.
* [ ] API calls go through service layer.
* [ ] Route remains under `/ethikos/*`.
* [ ] UI handles loading, empty, error, and success states.
* [ ] Manual QA instructions are documented.

````

---

## 14. Data / Migration Task Template

Use this specialization for model and migration tasks.

```markdown id="ge2x4y"
## <KIN-MIG-###> — <Migration Task Title>

**Status:** candidate  
**Priority:** P1  
**Risk:** HIGH  
**Owner Domain:** `<domain>`  
**Source Docs:**
- `08_DATA_MODEL_AND_MIGRATION_PLAN.md#<section>`
- `12_CANONICAL_OBJECTS_AND_EVENTS.md#<section>`

### Intent

Describe why the migration is needed.

### Migration Policy

```yaml
BREAK_EXISTING_MODELS: false
RENAME_EXISTING_MODELS: false
DELETE_EXISTING_FIELDS: false
ADD_NON_BREAKING_TABLES_ALLOWED: true
ADD_NON_BREAKING_FIELDS_ALLOWED: true
DATA_BACKFILL_REQUIRED: false
ROLLBACK_REQUIRED: true
````

### Current Model State

```txt
<current model details from inspected code>
```

### Proposed Schema Change

```yaml
NEW_TABLES:
  - "<table>"
FIELDS_ADDED:
  - "<model.field>"
INDEXES_ADDED:
  - "<index>"
CONSTRAINTS_ADDED:
  - "<constraint>"
```

### Backward Compatibility

Explain why existing data and endpoints remain valid.

### Migration Commands

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py check
```

Use project-approved local execution commands from the current development environment.

### Verification

* [ ] Migration applies cleanly.
* [ ] Migration rollback strategy exists.
* [ ] No unexpected `makemigrations` drift.
* [ ] Existing smoke tests still pass.
* [ ] Existing Ethikos endpoints still work.

````

---

## 15. API Contract Task Template

Use this specialization for endpoint and payload tasks.

```markdown id="t8xjhe"
## <KIN-API-###> — <API Contract Task Title>

**Status:** candidate  
**Priority:** P1  
**Risk:** MEDIUM  
**Owner Domain:** `<domain>`  
**Source Docs:**
- `07_API_AND_SERVICE_CONTRACTS.md#<section>`
- `13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md#<section>`

### Intent

Describe the API contract to add or stabilize.

### Endpoint

```yaml
METHOD: "GET | POST | PATCH | DELETE"
PATH: "/api/ethikos/<resource>/"
CANONICAL: true
COMPAT_ALIAS: "<alias or null>"
````

### Request Payload

```json
{
  "field": "value"
}
```

### Response Payload

```json
{
  "id": 1,
  "field": "value"
}
```

### Error Payload

```json
{
  "detail": "Error message"
}
```

### Compatibility

* [ ] Does not break existing consumers.
* [ ] Does not rename existing endpoint.
* [ ] Does not expand `/api/home/*`.
* [ ] Uses DRF-compatible pagination/errors where relevant.

### Tests

* [ ] Authorized request succeeds.
* [ ] Unauthorized request fails correctly.
* [ ] Invalid payload returns expected error.
* [ ] Serializer shape matches contract.

````

---

## 16. Test Task Template

Use this specialization for test tasks.

```markdown id="p34jss"
## <KIN-TEST-###> — <Test Task Title>

**Status:** candidate  
**Priority:** P1  
**Risk:** LOW  
**Owner Domain:** `<domain>`  
**Source Docs:**
- `16_TEST_AND_SMOKE_CONTRACT.md#<section>`

### Intent

Describe the behavior that must be tested.

### Test Type

```yaml
BACKEND_UNIT: false
BACKEND_API: false
MIGRATION: false
FRONTEND_COMPONENT: false
FRONTEND_ROUTE: false
PLAYWRIGHT_SMOKE: false
MANUAL_QA: false
````

### Target Behavior

```txt
<behavior>
```

### Test Data

```yaml
USERS:
  - "<role>"
TOPICS:
  - "<topic state>"
ARGUMENTS:
  - "<argument state>"
READINGS:
  - "<reading state>"
```

### Acceptance Criteria

* [ ] Test fails before implementation if applicable.
* [ ] Test passes after implementation.
* [ ] Test covers success case.
* [ ] Test covers failure/permission case where applicable.
* [ ] Test does not rely on external OSS services.

````

---

## 17. Bugfix Task Template

Use this specialization for known bug tasks.

```markdown id="b1n4af"
## <KIN-BUG-###> — <Bug Title>

**Status:** candidate  
**Priority:** P1  
**Risk:** LOW | MEDIUM | HIGH  
**Classification:** targeted_bugfix_not_architecture  
**Source Docs:**
- `17_KNOWN_BUGS_AND_NON_KINTSUGI_ITEMS.md#<section>`

### Bug Summary

Describe the visible bug.

### Current Behavior

```txt
<what happens now>
````

### Expected Behavior

```txt
<what should happen>
```

### Suspected Cause

```txt
<suspected cause, if known>
```

### Affected Files

```txt
<path>
<path>
```

### Fix Scope

This bugfix may:

* `<allowed fix>`

This bugfix must not:

* redesign architecture;
* change route families;
* rename models;
* introduce unrelated features.

### Acceptance Criteria

* [ ] Bug no longer reproduces.
* [ ] Existing behavior remains stable.
* [ ] Regression test or manual QA step exists.
* [ ] Fix does not become architecture rewrite.

````

---

## 18. Documentation Task Template

Use this specialization for documentation updates.

```markdown id="zkwwr0"
## <KIN-DOC-###> — <Documentation Task Title>

**Status:** candidate  
**Priority:** P2  
**Risk:** LOW  
**Source Docs:**
- `<doc>#<section>`

### Intent

Describe the documentation update.

### Target Files

```txt
<doc path>
<doc path>
````

### Required Changes

* `<change>`
* `<change>`

### Acceptance Criteria

* [ ] Terminology matches `04_CANONICAL_NAMING_AND_VARIABLES.md`.
* [ ] Ownership matches `03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md`.
* [ ] Route references match `06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md`.
* [ ] No deferred OSS source is promoted to first pass.
* [ ] Related docs are cross-linked.

````

---

## 19. QA Task Template

Use this specialization for verification tasks.

```markdown id="i9tx0h"
## <KIN-QA-###> — <QA Task Title>

**Status:** candidate  
**Priority:** P1  
**Risk:** LOW  
**Source Docs:**
- `16_TEST_AND_SMOKE_CONTRACT.md#<section>`

### Intent

Describe the verification target.

### Verification Type

```yaml
MANUAL_ROUTE_QA: false
API_SMOKE: false
FRONTEND_SMOKE: false
MIGRATION_CHECK: false
REGRESSION_CHECK: false
DOC_CONSISTENCY_CHECK: false
````

### Steps

1. `<step>`
2. `<step>`
3. `<step>`

### Expected Result

```txt
<expected result>
```

### Evidence to Capture

* screenshot;
* terminal output;
* test result;
* API response;
* migration output;
* linked PR/commit.

### Acceptance Criteria

* [ ] Verification completed.
* [ ] Evidence captured.
* [ ] No new regression found.
* [ ] Drift-control checklist passed.

````

---

## 20. Required Backlog Columns

When converting tasks into a spreadsheet, project board, issue tracker, or Markdown table, use these columns.

| Column | Required | Description |
|---|---:|---|
| `id` | Yes | Stable backlog ID. |
| `title` | Yes | Short task title. |
| `status` | Yes | Candidate, approved, in progress, verified, etc. |
| `priority` | Yes | P0–P4. |
| `risk` | Yes | LOW, MEDIUM, HIGH, CRITICAL. |
| `owner_domain` | Yes | Korum, Konsultations, Smart Vote, EkoH, etc. |
| `task_type` | Yes | backend, frontend, api, data, migration, test, doc, qa, bugfix, adr. |
| `source_docs` | Yes | Source documentation references. |
| `route_scope` | Yes | Route family affected. |
| `backend_scope` | Yes | Backend app/model/endpoint affected. |
| `frontend_scope` | Yes | Frontend route/component/service affected. |
| `schema_change` | Yes | true/false. |
| `migration_required` | Yes | true/false. |
| `tests_required` | Yes | Required tests. |
| `dependencies` | Yes | Blocking tasks or docs. |
| `acceptance_criteria` | Yes | Verification checklist. |
| `rollback_note` | Yes | How to revert safely. |
| `drift_check_passed` | Yes | true/false. |

---

## 21. Backlog Markdown Table Template

```markdown id="nl34yc"
| ID | Title | Status | Priority | Risk | Owner Domain | Type | Route Scope | Backend Scope | Frontend Scope | Source Docs | Depends On |
|---|---|---|---|---|---|---|---|---|---|---|---|
| KIN-XXX-001 | <title> | candidate | P1 | MEDIUM | Korum | backend | /ethikos/deliberate/* | konnaxion.ethikos | N/A | 12, 21 | <dependency> |
````

---

## 22. Backlog YAML Item Template

```yaml id="dwcn66"
id: "KIN-XXX-###"
title: "<Task title>"
status: "candidate"
priority: "P1"
risk: "MEDIUM"
owner_domain: "Korum"
task_type: "backend"
source_docs:
  - "12_CANONICAL_OBJECTS_AND_EVENTS.md#<section>"
  - "21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md#<section>"
route_scope:
  - "/ethikos/deliberate/*"
backend_scope:
  app: "konnaxion.ethikos"
  models:
    - "<model>"
  endpoints:
    - "/api/ethikos/<resource>/"
frontend_scope:
  routes:
    - "/ethikos/deliberate/[topic]"
  services:
    - "frontend/services/<service>.ts"
schema:
  schema_change_required: false
  migration_required: false
  data_backfill_required: false
tests_required:
  - "backend_api"
  - "frontend_route_smoke"
dependencies:
  - "<KIN-... or doc>"
acceptance_criteria:
  - "<criterion>"
rollback:
  strategy: "<rollback strategy>"
drift_check:
  route_drift: false
  model_rename_drift: false
  ownership_drift: false
  vote_semantics_drift: false
  oss_merge_drift: false
```

---

## 23. Epic Categories for the Real Backlog

The real backlog should be grouped into these epics after code reading.

```yaml id="a8fh3y"
RECOMMENDED_EPICS:
  KIN-EPIC-001:
    title: "Drift-control and documentation alignment"
    owner_domain: "Admin/Audit"
  KIN-EPIC-002:
    title: "Ethikos API and service contract stabilization"
    owner_domain: "Korum"
  KIN-EPIC-003:
    title: "Kialo-style structured deliberation"
    owner_domain: "Korum"
  KIN-EPIC-004:
    title: "Konsultations intake, decisions, and ballots"
    owner_domain: "Konsultations"
  KIN-EPIC-005:
    title: "Smart Vote readings and EkoH snapshot references"
    owner_domain: "Smart Vote / EkoH"
  KIN-EPIC-006:
    title: "Drafting and rationale packets"
    owner_domain: "Drafting"
  KIN-EPIC-007:
    title: "Impact and accountability tracking"
    owner_domain: "Konsultations"
  KIN-EPIC-008:
    title: "Admin, audit, moderation, and permissions"
    owner_domain: "Admin/Audit"
  KIN-EPIC-009:
    title: "Frontend route-by-route Kintsugi alignment"
    owner_domain: "Frontend"
  KIN-EPIC-010:
    title: "Tests, smoke checks, and release verification"
    owner_domain: "QA"
```

These are suggested groupings, not implementation tasks.

---

## 24. Sequencing Template

The real backlog SHOULD be sequenced in waves.

```markdown id="yrnzjz"
# Implementation Sequence

## Wave 0 — Safety and Baseline Confirmation

Purpose: confirm current system state and prevent drift.

Required before Wave 1:

- [ ] Current routes confirmed.
- [ ] Current endpoints confirmed.
- [ ] Current models confirmed.
- [ ] Known bug list confirmed.
- [ ] Smoke tests confirmed.
- [ ] Docs accepted.

## Wave 1 — Backend Contract Foundations

Purpose: add only non-breaking backend foundations.

Allowed work:

- serializers;
- viewsets;
- non-breaking models;
- migrations;
- permissions;
- tests.

Forbidden work:

- frontend redesign;
- full UX rebuild;
- annex integrations.

## Wave 2 — Frontend Service and Route Alignment

Purpose: connect existing `/ethikos/*` pages to stable services and contracts.

Allowed work:

- service wrappers;
- route-level data loading;
- empty/error/loading states;
- Kintsugi panels;
- bugfixes tied to known issues.

## Wave 3 — Korum / Kialo-Style Deliberation

Purpose: add structured argument graph, sources, impact votes, suggestions, permissions.

Allowed work:

- argument tree;
- source panel;
- impact vote distinction;
- participant roles;
- visibility/anonymity controls.

## Wave 4 — Konsultations / Decision / Smart Vote

Purpose: add decision records, protocols, readings, lens declarations, result publication.

Allowed work:

- decision records;
- baseline results;
- reading results;
- Smart Vote/EkoH references.

## Wave 5 — Drafting and Accountability

Purpose: add draft/version/amendment and impact tracking capabilities.

Allowed work:

- drafts;
- amendments;
- rationale packets;
- impact tracks;
- impact updates.

## Wave 6 — QA, Docs, and Release Readiness

Purpose: verify and document.

Allowed work:

- smoke tests;
- regression QA;
- docs patching;
- final release checklist.
```

---

## 25. Dependency Rules

Backlog tasks must express dependencies explicitly.

### 25.1 Backend Before Frontend

Frontend tasks that consume new data must depend on backend/API tasks.

```txt id="frxrwe"
KIN-FE-### depends on KIN-API-### and/or KIN-BE-###
```

### 25.2 Migration Before Serializer

Serializer tasks that expose new model fields must depend on migration tasks.

```txt id="oz4dce"
KIN-API-### depends on KIN-MIG-###
```

### 25.3 Payload Contract Before UI

UI tasks that render new payloads must depend on payload contract tasks.

```txt id="iqwcvv"
KIN-FE-### depends on KIN-API-### and 13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACT.md
```

### 25.4 Reading Before Result UI

Smart Vote result UI must depend on reading contract and backend reading result support.

```txt id="uvlgyz"
KIN-FE-### depends on KIN-BE-### + KIN-API-### + 09_SMART_VOTE_EKOH_READING_CONTRACT.md
```

### 25.5 Bugfix Isolation

Known bug tasks must not depend on unrelated architecture tasks unless code reading proves a direct dependency.

---

## 26. Acceptance Criteria Library

Use these reusable criteria when applicable.

### 26.1 General

```markdown id="kis8ub"
- [ ] Task is traceable to accepted Kintsugi docs.
- [ ] Task does not conflict with source-of-truth hierarchy.
- [ ] Task does not introduce route drift.
- [ ] Task does not introduce model naming drift.
- [ ] Task does not introduce ownership drift.
- [ ] Task does not introduce vote semantics drift.
- [ ] Task includes tests or explicit QA.
- [ ] Task includes rollback note.
```

### 26.2 Backend

```markdown id="v7qcon"
- [ ] Uses existing backend app unless explicitly approved.
- [ ] Uses DRF ViewSet/Serializer/Router pattern.
- [ ] Preserves existing endpoints.
- [ ] Adds only backward-compatible fields/tables.
- [ ] Does not mutate upstream facts from Smart Vote.
- [ ] Does not make EkoH a voting engine.
```

### 26.3 Frontend

```markdown id="ucul9o"
- [ ] Page remains under `/ethikos/*`.
- [ ] Existing module/global shell is preserved.
- [ ] No duplicate layout or theme system is introduced.
- [ ] API access goes through service layer.
- [ ] Loading, empty, error, and success states are handled.
```

### 26.4 Kialo-Style Deliberation

```markdown id="m7dpdt"
- [ ] `Claim` remains conceptual; backend model remains `EthikosArgument`.
- [ ] `ArgumentImpactVote` is separate from `EthikosStance`.
- [ ] Sources attach to argument/claim nodes.
- [ ] Suggested claims follow role/approval rules.
- [ ] Anonymous identities are protected from normal participants.
```

### 26.5 Smart Vote / EkoH

```markdown id="v3etft"
- [ ] Baseline remains visible.
- [ ] Reading is derived and reproducible.
- [ ] Reading stores `reading_key`, `lens_hash`, `snapshot_ref`, `computed_at`, and `results_payload`.
- [ ] EkoH is used as context only.
- [ ] Smart Vote does not mutate source facts.
```

---

## 27. Drift Rejection Rules

A backlog item MUST be rejected if it does any of the following.

```txt id="lq8m4d"
Creates /kialo route family.
Creates /kintsugi route family as implementation target.
Creates konnaxion.kialo.
Renames EthikosArgument to Claim.
Renames EthikosStance to Opinion.
Treats ArgumentImpactVote as EthikosStance.
Treats ReadingResult as source fact.
Uses Smart Vote to mutate Korum or Konsultations records.
Uses EkoH as voting engine.
Expands /api/home/*.
Imports external OSS app directly.
Adds Polis, LiquidFeedback, All Our Ideas, Your Priorities, or OpenSlides to first pass.
Introduces implementation tasks without source docs.
Introduces schema changes without migration/testing plan.
```

---

## 28. Candidate Backlog Generation Prompt

Use this prompt after all readiness gates are passed.

```text id="i85cqc"
Generate the candidate implementation backlog for the ethiKos Kintsugi upgrade.

Use:
- 02_SOURCE_OF_TRUTH_AND_DRIFT_CONTROL.md
- 03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md
- 04_CANONICAL_NAMING_AND_VARIABLES.md
- 05_CURRENT_STATE_BASELINE.md
- 06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md
- 07_API_AND_SERVICE_CONTRACTS.md
- 08_DATA_MODEL_AND_MIGRATION_PLAN.md
- 09_SMART_VOTE_EKOH_READING_CONTRACT.md
- 10_FIRST_PASS_INTEGRATION_MATRIX.md
- 11_MIMIC_VS_ANNEX_RULEBOOK.md
- 12_CANONICAL_OBJECTS_AND_EVENTS.md
- 13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md
- 14_FRONTEND_ALIGNMENT_CONTRACT.md
- 15_BACKEND_ALIGNMENT_CONTRACT.md
- 16_TEST_AND_SMOKE_CONTRACT.md
- 17_KNOWN_BUGS_AND_NON_KINTSUGI_ITEMS.md
- 18_ADR_REGISTER.md
- 19_OSS_CODE_READING_PLAN.md
- 20_AI_GENERATION_GUARDRAILS.md
- 21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md
- current code-reading findings

Generate:
1. Epics
2. Backend tasks
3. Frontend tasks
4. API tasks
5. Data/migration tasks
6. Test tasks
7. QA tasks
8. Documentation patch tasks

Use the exact template from 22_IMPLEMENTATION_BACKLOG_TEMPLATE.md.

Do not implement code.
Do not invent routes, apps, models, or endpoints.
Do not promote deferred OSS sources to first pass.
```

---

## 29. Candidate Backlog Review Prompt

Use this prompt after generating the candidate backlog.

```text id="f0y0e3"
Review the candidate Kintsugi implementation backlog for drift.

Check every task against:
- source-of-truth hierarchy
- ownership boundaries
- canonical naming
- route contracts
- API contracts
- data model contracts
- Smart Vote/EkoH reading rules
- Kialo-style argument mapping rules
- anti-drift rules
- first-pass/deferred OSS scope

Return:
1. tasks approved as-is
2. tasks requiring revision
3. tasks that must be rejected
4. missing dependencies
5. missing tests
6. missing rollback notes
7. sequencing corrections
```

---

## 30. Example Candidate Task

This is an example of the expected format. It is not an approved task.

````markdown id="yc2ipj"
## KIN-BE-EXAMPLE — Add ArgumentSource model

**Status:** candidate  
**Priority:** P1  
**Risk:** MEDIUM  
**Owner Domain:** Korum  
**Task Type:** backend  
**Source Docs:**
- `12_CANONICAL_OBJECTS_AND_EVENTS.md#ArgumentSource`
- `21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md#Sources`

### 1. Intent

Add a first-pass native Ethikos model for source links attached to `EthikosArgument`, supporting Kialo-style evidence transparency without creating a separate Kialo app.

### 2. Scope

This task includes:

- defining `ArgumentSource`;
- linking it to `EthikosArgument`;
- adding serializer support;
- adding API test coverage.

This task excludes:

- source export UI;
- custom source ranking;
- external citation crawling;
- importing Kialo code.

### 3. Current Reality

**Current frontend route(s):**

```txt
/ethikos/deliberate/[topic]
````

**Current backend endpoint(s):**

```txt
/api/ethikos/arguments/
```

**Current backend model(s):**

```txt
EthikosArgument
```

### 4. Target Change

Add source attachment support for argument nodes while preserving existing argument behavior.

### 5. Affected Files

**Backend:**

```txt
backend/konnaxion/ethikos/models.py
backend/konnaxion/ethikos/api/serializers.py
backend/konnaxion/ethikos/api/views.py
backend/config/api_router.py
```

**Tests:**

```txt
backend/konnaxion/ethikos/tests/
```

### 6. Data / Schema Impact

```yaml
SCHEMA_CHANGE_REQUIRED: true
MIGRATION_REQUIRED: true
NEW_MODEL_REQUIRED: true
EXISTING_MODEL_MODIFIED: false
DATA_BACKFILL_REQUIRED: false
```

### 7. API Contract Impact

```yaml
NEW_ENDPOINT_REQUIRED: true
EXISTING_ENDPOINT_CHANGED: false
SERIALIZER_CHANGED: true
BACKWARD_COMPATIBLE: true
```

### 8. Acceptance Criteria

* [ ] `EthikosArgument` remains unchanged in name and core semantics.
* [ ] `ArgumentSource` links to `EthikosArgument`.
* [ ] Existing argument posting still works.
* [ ] Source creation requires authenticated user.
* [ ] Tests cover creation and retrieval.
* [ ] No `/kialo` route or backend app is introduced.

### 9. Rollback Plan

Drop the new endpoint and model migration before production use, or disable source UI while preserving existing argument flow.

### 10. Drift Check

* [x] Uses `/ethikos/deliberate/*`.
* [x] Uses `konnaxion.ethikos`.
* [x] Does not rename `EthikosArgument`.
* [x] Does not import Kialo code.

````

---

## 31. Final Backlog Output Structure

When the real backlog is generated, output it in this order.

```markdown id="r2p25d"
# ethiKos Kintsugi Implementation Backlog

## 1. Readiness Gate Result

## 2. Epic Overview

## 3. Sequencing Plan

## 4. Dependency Graph Summary

## 5. Backend Tasks

## 6. API Tasks

## 7. Data / Migration Tasks

## 8. Frontend Tasks

## 9. Smart Vote / EkoH Tasks

## 10. Kialo-Style Deliberation Tasks

## 11. Konsultations / Impact Tasks

## 12. Test Tasks

## 13. QA Tasks

## 14. Documentation Patch Tasks

## 15. Deferred Tasks

## 16. Rejected Tasks

## 17. Risk Register

## 18. Release Checklist
````

---

## 32. Backlog Risk Register Template

```markdown id="mk5tv0"
# Risk Register

| Risk ID | Related Task | Risk | Severity | Mitigation | Owner | Status |
|---|---|---|---|---|---|---|
| RISK-001 | KIN-XXX-### | <risk> | MEDIUM | <mitigation> | <owner> | open |
```

Required risk categories:

```yaml id="nfbrbz"
RISK_CATEGORIES:
  - "schema_migration"
  - "route_drift"
  - "api_contract_break"
  - "frontend_shell_drift"
  - "ownership_drift"
  - "vote_semantics_drift"
  - "smart_vote_reproducibility"
  - "ekoh_role_confusion"
  - "oss_scope_drift"
  - "test_coverage_gap"
  - "rollback_gap"
```

---

## 33. Release Checklist Template

```markdown id="g3nw71"
# Kintsugi Release Checklist

## Documentation

- [ ] All Kintsugi docs are accepted.
- [ ] Related docs are cross-linked.
- [ ] Deferred scope is clearly marked.
- [ ] ADRs are complete.

## Backend

- [ ] Migrations apply cleanly.
- [ ] No unexpected `makemigrations` drift.
- [ ] Existing Ethikos endpoints still work.
- [ ] New endpoints are tested.
- [ ] Permissions are verified.

## Frontend

- [ ] Existing `/ethikos/*` routes render.
- [ ] No duplicate shell/layout is introduced.
- [ ] New UI uses service layer.
- [ ] Loading/empty/error states work.
- [ ] Preview drawer known bug is either fixed or explicitly tracked.

## Smart Vote / EkoH

- [ ] Baseline remains visible.
- [ ] Readings are reproducible.
- [ ] `snapshot_ref` is handled correctly.
- [ ] EkoH remains context only.

## Kialo-Style Deliberation

- [ ] Claims map to `EthikosArgument`.
- [ ] Impact votes remain separate from topic stances.
- [ ] Sources attach correctly.
- [ ] Suggested claims follow role rules.
- [ ] Anonymity rules are respected.

## Tests

- [ ] Backend tests pass.
- [ ] Frontend smoke passes.
- [ ] Playwright smoke passes where applicable.
- [ ] Manual QA completed.

## Drift Control

- [ ] No full OSS merge.
- [ ] No new Kialo app.
- [ ] No route drift.
- [ ] No model rename drift.
- [ ] No `/api/home/*` expansion.
```

---

## 34. Non-Goals

This document does not:

* generate the actual backlog;
* implement code;
* define final migrations;
* write serializers;
* write frontend components;
* write API payloads;
* resolve the preview drawer bug;
* inspect OSS repositories;
* approve annex architecture;
* authorize full external merges.

---

## 35. Anti-Drift Rules

The implementation backlog must obey these rules.

```txt id="k8pd4v"
Do not generate implementation tasks before docs and code-reading are complete.
Do not create tasks without source document references.
Do not create tasks without affected route/API/model/file scope.
Do not create tasks without tests or QA.
Do not create tasks without rollback notes.
Do not create tasks that rename current Ethikos core models.
Do not create tasks that bypass current Ethikos route families.
Do not create tasks that import full OSS applications.
Do not create tasks that confuse Kialo impact votes with Ethikos stances.
Do not create tasks that treat Smart Vote readings as source facts.
Do not create tasks that make EkoH the voting engine.
Do not create tasks that expand `/api/home/*`.
```

---

## 36. Related Docs

This template depends on:

```txt id="q409w2"
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
19_OSS_CODE_READING_PLAN.md
20_AI_GENERATION_GUARDRAILS.md
21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md
```

This template is used after those documents are accepted.

---

## 37. Final Binding Rule

The real Kintsugi implementation backlog is invalid unless it follows this template.

```yaml id="kvrksw"
FINAL_RULE:
  IF_BACKLOG_ITEM_HAS_NO_SOURCE_DOC:
    RESULT: "invalid"

  IF_BACKLOG_ITEM_HAS_NO_ROUTE_API_MODEL_SCOPE:
    RESULT: "invalid"

  IF_BACKLOG_ITEM_HAS_NO_TEST_OR_QA_PLAN:
    RESULT: "invalid"

  IF_BACKLOG_ITEM_HAS_NO_ROLLBACK_NOTE:
    RESULT: "invalid"

  IF_BACKLOG_ITEM_VIOLATES_SOURCE_OF_TRUTH:
    RESULT: "invalid"

  IF_BACKLOG_ITEM_EXPANDS_FIRST_PASS_SCOPE:
    RESULT: "invalid"

  IF_BACKLOG_ITEM_IMPORTS_FULL_OSS_APP:
    RESULT: "invalid"

  IF_BACKLOG_ITEM_RENAMES_EXISTING_CORE_MODEL:
    RESULT: "invalid"
```

This document is the canonical template for converting the ethiKos Kintsugi documentation pack into implementation work.


