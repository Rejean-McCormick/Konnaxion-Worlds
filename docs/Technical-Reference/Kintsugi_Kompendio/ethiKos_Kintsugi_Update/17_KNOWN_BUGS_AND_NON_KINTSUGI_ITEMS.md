# 17 — Known Bugs and Non-Kintsugi Items

**Document ID:** `17_KNOWN_BUGS_AND_NON_KINTSUGI_ITEMS.md`
**Pack:** ethiKos Kintsugi Update Documentation Pack
**Status:** Canonical scope-control contract
**Audience:** maintainers, frontend implementers, backend implementers, AI assistants, reviewers
**Primary purpose:** prevent bugfixing, legacy cleanup, and unrelated implementation work from drifting into the Kintsugi architecture upgrade.

---

## 1. Purpose

This document separates:

1. known bugs that may require targeted fixes;
2. technical cleanup items that are real but not part of the Kintsugi architecture definition;
3. deferred features and OSS integrations;
4. non-goals that must not be reintroduced during parallel documentation or implementation work.

The Kintsugi upgrade is a **documentation-first architecture upgrade**. It must not become an open-ended bugfixing, refactoring, OSS integration, or frontend rewrite campaign.

The clean-slate plan explicitly says the next work should be **Kintsugi planning for Ethikos, not bugfixing**, and identifies the remaining visible ethiKos bug as the Deliberate preview drawer showing “Preview / No data.” 

---

## 2. Scope

This document covers:

* known visible bugs;
* known technical risks;
* items to defer;
* items to classify outside Kintsugi;
* anti-drift rules for AI-generated work;
* triage categories for future findings.

This document does **not** provide implementation fixes. Fixes belong in the implementation backlog only after the documentation pack and code-reading plan are stable.

Related implementation details belong to:

```txt
07_API_AND_SERVICE_CONTRACTS.md
08_DATA_MODEL_AND_MIGRATION_PLAN.md
14_FRONTEND_ALIGNMENT_CONTRACT.md
15_BACKEND_ALIGNMENT_CONTRACT.md
16_TEST_AND_SMOKE_CONTRACT.md
22_IMPLEMENTATION_BACKLOG_TEMPLATE.md
```

---

## 3. Canonical Variables Used

```yaml
DOCUMENT_ID: "17_KNOWN_BUGS_AND_NON_KINTSUGI_ITEMS.md"

KINTSUGI_UPDATE_TYPE: "documentation-first architecture upgrade"
DOCS_BEFORE_CODE: true
BUGFIXING_IS_NOT_PRIMARY_SCOPE: true
IMPLEMENTATION_BACKLOG_AFTER_DOCS: true

PRIMARY_ROUTE_SURFACE: "/ethikos/*"
PRIMARY_API_SURFACE:
  - "/api/ethikos/*"
  - "/api/kollective/*"

KNOWN_OPEN_VISIBLE_BUG:
  BUG_ID: "BUG-001"
  TITLE: "Deliberate preview drawer shows 'Preview / No data'"
  CLASSIFICATION: "targeted_bugfix_not_architecture"
  STATUS: "known_open"

FULL_EXTERNAL_MERGE_ALLOWED: false
ANNEX_FIRST_PASS_ALLOWED: false
LEGACY_API_EXPANSION_ALLOWED: false
NEW_KIALO_MODULE_ALLOWED: false
NEW_KINTSUGI_ROUTE_FAMILY_ALLOWED: false
```

---

## 4. Current Stable Baseline

The following baseline is accepted and must not be repeatedly re-litigated in Kintsugi documentation sessions:

```yaml
CURRENT_BASELINE:
  FRONTEND_BUILD_WORKS: true
  PLAYWRIGHT_SMOKE_RAN_SUCCESSFULLY: true
  BACKEND_LOCAL_STARTUP_WORKS_WITH_UV: true
  AUTH_FIXED: true
  CSRF_FIXED: true
  CATEGORY_CREATION_FIXED: true
  TOPIC_CREATION_FIXED: true
  ARGUMENT_POSTING_WORKS: true
  EKOH_MIGRATION_0002_CREATED_AND_APPLIED: true
  REMAINING_VISIBLE_ETHIKOS_BUG: "Deliberate preview drawer shows 'Preview / No data'"
```

These facts are carried from the clean-slate plan and are the accepted context for the Kintsugi documentation phase. 

---

## 5. Known Bugs Registry

## 5.1 BUG-001 — Deliberate Preview Drawer Shows “Preview / No data”

```yaml
BUG_ID: "BUG-001"
TITLE: "Deliberate preview drawer shows 'Preview / No data'"
STATUS: "known_open"
SEVERITY: "visible_ui_bug"
CLASSIFICATION: "targeted_bugfix_not_architecture"
AFFECTED_AREA: "ethiKos / Deliberate"
LIKELY_ROUTE_SURFACE:
  - "/ethikos/deliberate/elite"
  - "/ethikos/deliberate/[topic]"
LIKELY_FRONTEND_SERVICE:
  - "frontend/services/deliberate.ts"
LIKELY_API_SURFACE:
  - "/api/ethikos/topics/{id}/"
  - "/api/ethikos/arguments/?topic={id}"
DO_NOT_USE_AS_ARCHITECTURE_DRIVER: true
```

### Observed behavior

The Deliberate preview drawer opens with a generic title/state such as:

```txt
Preview / No data
```

or otherwise appears empty when a preview should be available.

### Current implementation evidence

The frontend drawer already has explicit states for:

* loading;
* preview object present;
* preview object absent;
* no latest statements available.

When `preview` is missing, the drawer renders “No preview data available.” 

The current `fetchTopicPreview` service is designed to be resilient: it fetches topic metadata from `ethikos/topics/{topicId}/`, tries to fetch latest arguments from `ethikos/arguments/?topic=<id>`, and still returns topic metadata even if argument loading fails. 

The endpoint graph currently marks `fetchTopicPreview` as a loose mapping from `/deliberate/topics/:id/preview` to `GET api/ethikos/topics`, which indicates that the conceptual preview route and the actual backend topic endpoint are not yet formalized as a strict contract. 

### Classification

This is a **targeted bugfix**, not a Kintsugi architecture issue.

It must not trigger:

* a redesign of `/ethikos/deliberate/*`;
* a new preview API namespace;
* a new Kialo route;
* a new Kintsugi frontend shell;
* a new debate data model;
* replacement of the current ethiKos service layer.

### Acceptable resolution path

The fix should be limited to verifying:

```yaml
BUG_001_ACCEPTABLE_INVESTIGATION:
  CHECK_ROUTE_PARAM_ID: true
  CHECK_RESOLVED_PREVIEW_ID: true
  CHECK_DRAWER_STATE_ASSIGNMENT: true
  CHECK_FETCH_TOPIC_PREVIEW_RETURN_SHAPE: true
  CHECK_TOPIC_DETAIL_ENDPOINT_RESPONSE: true
  CHECK_ARGUMENTS_QUERY_RESPONSE: true
  CHECK_EMPTY_STATEMENTS_COPY: true
```

### Non-acceptable resolution path

```yaml
BUG_001_FORBIDDEN_RESPONSES:
  - "Create /api/kintsugi/preview/"
  - "Create /api/kialo/preview/"
  - "Replace EthikosArgument with Claim"
  - "Rewrite Deliberate page architecture"
  - "Move topic preview into Smart Vote"
  - "Move topic preview into EkoH"
  - "Use this bug to justify a full Kialo module"
  - "Use this bug to justify a full external OSS merge"
```

### Target backlog format

When this bug is eventually moved to implementation, it should be represented as:

```yaml
TASK_ID: "BUG-001"
TASK_TYPE: "targeted_bugfix"
TITLE: "Fix Deliberate preview drawer empty state"
SOURCE_DOC: "17_KNOWN_BUGS_AND_NON_KINTSUGI_ITEMS.md"
AFFECTED_DOCS:
  - "07_API_AND_SERVICE_CONTRACTS.md"
  - "14_FRONTEND_ALIGNMENT_CONTRACT.md"
  - "16_TEST_AND_SMOKE_CONTRACT.md"
AFFECTED_FRONTEND:
  - "frontend/app/ethikos/deliberate/elite/page.tsx"
  - "frontend/services/deliberate.ts"
AFFECTED_BACKEND:
  - "backend/konnaxion/ethikos/views.py"
  - "backend/konnaxion/ethikos/serializers.py"
EXPECTED_TEST:
  - "Preview drawer shows topic title and metadata when topic exists"
  - "Preview drawer does not show total empty state when arguments are empty"
  - "Preview drawer still opens with topic metadata when latest statements are empty"
```

---

## 6. Known Technical Cleanup Items

The following items are real, but they are **not** architecture-definition work. They may be referenced in Kintsugi docs only as constraints or future backlog candidates.

---

## 6.1 Legacy `/api/home/*` Usage

```yaml
ITEM_ID: "TECH-DEBT-001"
TITLE: "Legacy /api/home/* endpoint usage"
STATUS: "known_cleanup_item"
CLASSIFICATION: "service_contract_cleanup"
KINTSUGI_ARCHITECTURE_BLOCKER: false
```

### Description

Some frontend-to-backend mappings still reference legacy `/api/home/*` routes, including categories, debate categories, debate topics, response formats, public votes, and topic vote endpoints. 

### Correct Kintsugi policy

Kintsugi must not expand this usage.

```yaml
API_HOME_POLICY:
  MAY_ADD_NEW_HOME_CALLS: false
  MAY_WRAP_TEMPORARILY_FOR_MIGRATION: true
  MUST_REPLACE_LONG_TERM: true
  TARGET_REPLACEMENTS:
    TOPICS: "/api/ethikos/topics/"
    STANCES: "/api/ethikos/stances/"
    ARGUMENTS: "/api/ethikos/arguments/"
    VOTES: "/api/kollective/votes/"
```

### Not a Kintsugi architecture decision

This cleanup must not be used to:

* rename `/api/ethikos/*`;
* introduce `/api/deliberation/*`;
* introduce `/api/kintsugi/*`;
* introduce GraphQL for basic CRUD;
* rewrite the frontend service layer.

---

## 6.2 Loose Endpoint Mappings

```yaml
ITEM_ID: "TECH-DEBT-002"
TITLE: "Loose service-to-backend mappings"
STATUS: "known_cleanup_item"
CLASSIFICATION: "contract_formalization"
KINTSUGI_ARCHITECTURE_BLOCKER: false
```

### Description

The endpoint graph identifies several frontend service calls as loose mappings. Examples include:

* `frontend/services/deliberate.ts` preview/detail/topic calls mapped loosely to `api/ethikos/topics`;
* `frontend/services/impact.ts` calls mapped loosely to `api/keenkonnect/projects`;
* learn routes mapped loosely to KonnectED resources. 

### Correct Kintsugi policy

Loose mappings should be formalized in:

```txt
07_API_AND_SERVICE_CONTRACTS.md
13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md
14_FRONTEND_ALIGNMENT_CONTRACT.md
15_BACKEND_ALIGNMENT_CONTRACT.md
```

### Not a Kintsugi architecture decision

Loose mapping cleanup must not become a full rewrite.

---

## 6.3 Impact Currently Depends on KeenKonnect-like Project Semantics

```yaml
ITEM_ID: "TECH-DEBT-003"
TITLE: "Impact service is loosely mapped to KeenKonnect projects"
STATUS: "known_cleanup_item"
CLASSIFICATION: "ownership_alignment"
KINTSUGI_ARCHITECTURE_BLOCKER: false
```

### Description

The endpoint graph shows `/impact/feedback`, `/impact/outcomes`, and `/impact/tracker` service functions loosely mapped to `api/keenkonnect/projects`. 

### Correct Kintsugi policy

Kintsugi ownership should eventually be:

```yaml
IMPACT_TRUTH_OWNER: "ethiKos / Konsultations"
KEENKONNECT_ROLE: "handoff or execution/project implementation surface"
KEENKONNECT_MUST_NOT_OWN_CIVIC_IMPACT_TRUTH: true
```

### Not a first-step bugfix

This should be documented in the route and data model plans, then converted into backlog later.

---

## 6.4 Konsultations Hooks Are Incomplete or Partially Stubbed

```yaml
ITEM_ID: "TECH-DEBT-004"
TITLE: "Konsultations hooks are incomplete or partially stubbed"
STATUS: "known_cleanup_item"
CLASSIFICATION: "future_consultation_backend_formalization"
KINTSUGI_ARCHITECTURE_BLOCKER: false
```

### Description

Current Konsultations logic partially maps consultation behavior onto ethiKos topics and stances. One hook explicitly aggregates consultation results from `/api/ethikos/stances/?topic=<consultationId>`, and another `useConsultations.ts` hook is still a stub. 

### Correct Kintsugi policy

This must be handled by the Konsultations contract in:

```txt
03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md
06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md
08_DATA_MODEL_AND_MIGRATION_PLAN.md
```

### Not a bugfix scope

Do not attempt to fully implement Konsultations during documentation generation.

---

## 6.5 Optional or Incomplete Backend Modules

```yaml
ITEM_ID: "TECH-DEBT-005"
TITLE: "Optional or incomplete backend modules"
STATUS: "known_platform_alpha_signal"
CLASSIFICATION: "readiness_signal"
KINTSUGI_ARCHITECTURE_BLOCKER: false
```

### Description

The completion report identifies several backend modules as partial or optional, notes that vote endpoints are imported under `try/except`, and recommends eliminating or gating mocks/stubs before beta readiness. 

### Correct Kintsugi policy

Kintsugi docs may reference these as readiness constraints, but must not attempt to resolve all platform incompleteness.

---

## 6.6 EkoH Migration Drift Risk

```yaml
ITEM_ID: "TECH-DEBT-006"
TITLE: "Verify EkoH model source and GiST index setup"
STATUS: "known_follow_up"
CLASSIFICATION: "migration_discipline"
KINTSUGI_ARCHITECTURE_BLOCKER: false
```

### Description

The clean-slate plan says the EkoH migration `0002...` was created and applied successfully, but also notes that the EkoH model source should be verified so future `makemigrations` does not drift again. 

### Correct Kintsugi policy

This belongs to backend migration hygiene. It must not turn into a redesign of Smart Vote or EkoH.

---

## 7. Non-Kintsugi Items

The following items must not be included as active Kintsugi implementation work.

---

## 7.1 General Frontend/Backend Debugging

```yaml
NON_KINTSUGI_ITEM: "general_frontend_backend_debugging"
STATUS: "excluded"
```

Do not rehash:

* previous frontend build errors;
* previous CSRF/auth debugging;
* previous category creation debugging;
* previous argument posting debugging;
* previous migration debugging;
* previous Ant Design warning cleanup.

These are baseline history, not current Kintsugi scope.

---

## 7.2 Full External OSS Integration

```yaml
NON_KINTSUGI_ITEM: "full_external_oss_merge"
STATUS: "excluded"
```

Kintsugi first pass uses **partial native mimic**, not full merge.

Do not directly merge or embed:

* Consider.it;
* Kialo;
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

The clean-slate plan explicitly says there should be no big-bang full merge; existing ethiKos frame and route families remain stable; partial native mimic is the current strategy; annex/sidecar tools are deferred. 

---

## 7.3 Deferred OSS Sources

```yaml
NON_KINTSUGI_ITEM: "deferred_oss_sources"
STATUS: "excluded_from_first_pass"
```

These are not first pass:

```txt
Polis
LiquidFeedback
All Our Ideas
Your Priorities
OpenSlides
```

They may receive public credit or future study, but they must not drive current route, model, service, or migration design.

---

## 7.4 New Top-Level Kintsugi Application

```yaml
NON_KINTSUGI_ITEM: "new_top_level_kintsugi_app"
STATUS: "forbidden"
```

Do not create:

```txt
/kintsugi
/api/kintsugi/*
frontend/app/kintsugi/*
backend/konnaxion/kintsugi/
```

Kintsugi is an upgrade layer for ethiKos, not a new standalone application.

---

## 7.5 New Kialo Module or Kialo API

```yaml
NON_KINTSUGI_ITEM: "new_kialo_module"
STATUS: "forbidden"
```

Do not create:

```txt
/kialo
/api/kialo/*
frontend/app/kialo/*
backend/konnaxion/kialo/
```

Kialo-style features belong under:

```txt
/ethikos/deliberate/*
/api/ethikos/*
konnaxion.ethikos
```

The codebase already has first-class ethiKos Deliberate routes and canonical ethiKos endpoints; Kialo-style work must extend those surfaces instead of creating a separate app. 

---

## 7.6 GraphQL or WebSocket Rewrite

```yaml
NON_KINTSUGI_ITEM: "graphql_or_websocket_rewrite"
STATUS: "excluded"
```

The current guidance says to use the services layer and existing `/api/...` prefixes, not to invent paths, and not to use GraphQL or WebSockets for CRUD unless the codebase explicitly does so. 

Do not introduce GraphQL or WebSockets for:

* topics;
* stances;
* arguments;
* categories;
* votes;
* readings;
* drafts;
* impact tracks.

---

## 7.7 New Layout Shell or Theme System

```yaml
NON_KINTSUGI_ITEM: "new_layout_shell_or_theme"
STATUS: "excluded"
```

Do not create a new global shell, route shell, theme provider, or duplicated navigation system.

The current ethiKos frontend is already implemented under `/ethikos/*` with page groups for Decide, Deliberate, Trust, Pulse, Impact, Learn, Insights, and Admin, and it uses `EthikosPageShell` and `PageContainer` consistently. 

---

## 7.8 Full Konsultations Implementation

```yaml
NON_KINTSUGI_ITEM: "full_konsultations_implementation"
STATUS: "deferred_to_backlog"
```

The documentation may define Konsultations ownership and target contracts.

It must not implement the entire Konsultations backend during documentation generation.

---

## 7.9 Full Smart Vote / EkoH Implementation

```yaml
NON_KINTSUGI_ITEM: "full_smart_vote_ekoh_implementation"
STATUS: "deferred_to_backlog"
```

This documentation pack may define:

* readings;
* lenses;
* snapshot references;
* audit fields;
* result publication rules.

It must not implement the entire weighted voting system during doc generation.

---

## 7.10 Reports / Insights Rewrite

```yaml
NON_KINTSUGI_ITEM: "reports_insights_rewrite"
STATUS: "excluded"
```

Insights may consume ethiKos and Kollective data, but Kintsugi must not become a Reports module rewrite.

The Insights contract already describes analytics over Kollective and domain endpoints, including `/api/kollective/votes/` and ethiKos topics, stances, and arguments. 

---

## 8. Classification System for Future Findings

Future items must be classified before entering any backlog.

```yaml
FINDING_CLASSIFICATION:
  ARCHITECTURE_CONTRACT:
    DESCRIPTION: "Belongs in Kintsugi docs before implementation."
    EXAMPLES:
      - "ownership boundary"
      - "route mapping"
      - "API contract"
      - "data model contract"

  TARGETED_BUGFIX:
    DESCRIPTION: "Small concrete defect with known surface."
    EXAMPLES:
      - "Preview drawer empty state"
      - "button disabled incorrectly"
      - "wrong data shape adapter"

  TECH_DEBT:
    DESCRIPTION: "Real cleanup, but not architecture-defining."
    EXAMPLES:
      - "legacy endpoint usage"
      - "loose service mapping"
      - "stub hook"

  PLATFORM_READINESS:
    DESCRIPTION: "Alpha/beta hardening item across the platform."
    EXAMPLES:
      - "mock mode"
      - "missing integration tests"
      - "optional backend module gating"

  DEFERRED_FEATURE:
    DESCRIPTION: "Valid future feature but not first pass."
    EXAMPLES:
      - "Polis-style clustering"
      - "LiquidFeedback delegation"
      - "OpenSlides meeting control"

  OUT_OF_SCOPE:
    DESCRIPTION: "Must not be done in Kintsugi."
    EXAMPLES:
      - "new top-level Kintsugi app"
      - "full OSS merge"
      - "GraphQL rewrite"
```

---

## 9. Allowed vs Forbidden Work

## 9.1 Allowed During Documentation Generation

```yaml
ALLOWED_DURING_DOC_GENERATION:
  - "Define known bug registry"
  - "Classify current visible bugs"
  - "Mark legacy routes as cleanup items"
  - "Document non-goals"
  - "Define triage rules"
  - "Reference current route and endpoint reality"
  - "Reserve implementation details for backlog"
```

---

## 9.2 Not Allowed During Documentation Generation

```yaml
FORBIDDEN_DURING_DOC_GENERATION:
  - "Implement bugfixes"
  - "Generate code patches"
  - "Create migrations"
  - "Invent new endpoints"
  - "Rewrite services"
  - "Refactor route hierarchy"
  - "Resolve all mocks/stubs"
  - "Merge external OSS code"
  - "Create implementation tasks outside doc 22"
```

---

## 10. Known Items Summary Table

| ID              | Item                                                |                         Type | Status | Kintsugi impact        | Action                        |
| --------------- | --------------------------------------------------- | ---------------------------: | -----: | ---------------------- | ----------------------------- |
| `BUG-001`       | Deliberate preview drawer shows “Preview / No data” |              targeted bugfix |   open | visible UI issue only  | backlog later                 |
| `TECH-DEBT-001` | Legacy `/api/home/*` usage                          |              service cleanup |  known | contract risk          | document and replace later    |
| `TECH-DEBT-002` | Loose endpoint mappings                             |             contract cleanup |  known | alignment risk         | formalize in docs             |
| `TECH-DEBT-003` | Impact mapped to KeenKonnect projects               |            ownership cleanup |  known | future ownership risk  | define native Impact contract |
| `TECH-DEBT-004` | Konsultations hooks incomplete/stubbed              | future backend formalization |  known | scope risk             | defer to data/API plan        |
| `TECH-DEBT-005` | Optional/incomplete backend modules                 |             readiness signal |  known | platform maturity risk | feature-gate later            |
| `TECH-DEBT-006` | EkoH migration drift risk                           |            migration hygiene |  known | backend hygiene risk   | verify later                  |

---

## 11. Bug Intake Template

Any new bug discovered during Kintsugi planning must use this format:

```yaml
BUG_ID: "BUG-XXX"
TITLE: ""
STATUS: "candidate | confirmed | fixed | deferred"
SEVERITY: "low | medium | high | critical"
CLASSIFICATION: "targeted_bugfix | tech_debt | platform_readiness | out_of_scope"
AFFECTED_AREA: ""
AFFECTED_ROUTE_SURFACE: []
AFFECTED_FRONTEND_FILES: []
AFFECTED_BACKEND_FILES: []
AFFECTED_ENDPOINTS: []
SOURCE_EVIDENCE: []
KINTSUGI_ARCHITECTURE_BLOCKER: false
WHY_NOT_ARCHITECTURE: ""
ACCEPTABLE_FIX_SCOPE: []
FORBIDDEN_FIX_SCOPE: []
RELATED_DOCS: []
```

---

## 12. Non-Kintsugi Item Intake Template

Any request that looks related but may be outside Kintsugi must use this format:

```yaml
ITEM_ID: "NON-KINTSUGI-XXX"
TITLE: ""
REQUESTED_WORK: ""
CLASSIFICATION: "out_of_scope | deferred_feature | platform_readiness | tech_debt"
WHY_OUTSIDE_KINTSUGI: ""
MAY_BE_REFERENCED_IN_DOCS: true
MAY_ENTER_BACKLOG_LATER: true
BLOCKS_DOC_GENERATION: false
RELATED_DOCS: []
```

---

## 13. Anti-Drift Rules

```yaml
ANTI_DRIFT_RULES:
  - "Do not turn BUG-001 into an architecture redesign."
  - "Do not restart the previous frontend/backend debugging history."
  - "Do not expand /api/home/*."
  - "Do not use loose mappings as permission to invent new APIs."
  - "Do not move civic impact truth into KeenKonnect."
  - "Do not implement Konsultations during documentation generation."
  - "Do not implement Smart Vote/EkoH during documentation generation."
  - "Do not create a new Kintsugi app."
  - "Do not create a new Kialo module."
  - "Do not introduce GraphQL or WebSockets for CRUD."
  - "Do not create a second layout shell."
  - "Do not create a new theme system."
  - "Do not merge external OSS projects."
  - "Do not treat deferred OSS sources as first-pass scope."
  - "Do not generate implementation backlog outside 22_IMPLEMENTATION_BACKLOG_TEMPLATE.md."
```

---

## 14. Related Documents

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
18_ADR_REGISTER.md
19_OSS_CODE_READING_PLAN.md
20_AI_GENERATION_GUARDRAILS.md
21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md
22_IMPLEMENTATION_BACKLOG_TEMPLATE.md
```

---

## 15. Final Contract Summary

This file exists to prevent scope drift.

The Kintsugi update must proceed as:

```txt
documentation → contracts → code reading → backlog → implementation
```

It must not proceed as:

```txt
visible bug → broad rewrite → new architecture → uncontrolled backlog
```

The only currently accepted open visible bug is:

```txt
BUG-001 — Deliberate preview drawer shows “Preview / No data”
```

That bug is real, but it is not the architecture.

Final rule:

```txt
If an item does not clarify the Kintsugi architecture, route mapping, ownership model, API/service contract, data contract, or AI drift rules, it belongs outside the Kintsugi documentation pack or in the later implementation backlog.
```
