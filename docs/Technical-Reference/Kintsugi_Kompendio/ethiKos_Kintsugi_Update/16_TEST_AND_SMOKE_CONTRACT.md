# 16 — Test and Smoke Contract

**Document ID:** `16_TEST_AND_SMOKE_CONTRACT.md`  
**Pack:** ethiKos Kintsugi Update Documentation Pack  
**Status:** Canonical testing contract  
**Last aligned:** 2026-04-25  
**Primary scope:** ethiKos Kintsugi upgrade validation  
**Implementation mode:** Documentation-first, partial native mimic, no full external merge

---

## 1. Purpose

This document defines the minimum test, smoke, and regression contract for the ethiKos Kintsugi upgrade.

The goal is to ensure that every Kintsugi implementation step preserves the existing stable baseline while adding new civic deliberation, decision, Smart Vote, EkoH, impact, and Kialo-style argument-mapping capabilities.

This document prevents test drift by defining:

- what must continue to work;
- what must be tested before and after each Kintsugi implementation slice;
- what belongs in backend tests;
- what belongs in frontend smoke tests;
- what belongs in API contract tests;
- what belongs in migration drift tests;
- what must not be treated as optional once a Kintsugi feature is implemented.

---

## 2. Scope

This contract applies to:

```txt
/ethikos/*
/api/ethikos/*
/api/kollective/*
konnaxion.ethikos
konnaxion.kollective_intelligence
konnaxion.ekoh
frontend/app/ethikos/*
frontend/services/*
frontend/smoke/*
backend/tests/*
````

It covers the following Kintsugi route families:

```txt id="91qzk8"
/ethikos/deliberate/*
/ethikos/decide/*
/ethikos/impact/*
/ethikos/pulse/*
/ethikos/trust/*
/ethikos/admin/*
/ethikos/learn/*
/ethikos/insights
```

It also covers Kintsugi-specific test obligations for:

```txt id="emk8eo"
Korum
Konsultations
Smart Vote
EkoH
Kialo-style argument mapping
Mimic-vs-annex boundaries
Legacy endpoint containment
```

---

## 3. Canonical Variables Used

```yaml id="39p7mx"
KINTSUGI_UPDATE_TYPE: "documentation-first architecture upgrade"
IMPLEMENTATION_STYLE: "partial native mimic"
FULL_EXTERNAL_MERGE_ALLOWED: false
ANNEX_FIRST_PASS_ALLOWED: false
EXISTING_ROUTE_FAMILIES_STABLE: true

CURRENT_BASELINE:
  FRONTEND_BUILD_WORKS: true
  PLAYWRIGHT_SMOKE_RAN_SUCCESSFULLY: true
  BACKEND_LOCAL_STARTUP_WORKS_WITH_UV: true
  AUTH_CSRF_CATEGORY_TOPIC_CREATION_FIXED: true
  ARGUMENT_POSTING_WORKS: true
  EKOH_MIGRATION_0002_CREATED_AND_APPLIED: true
  REMAINING_VISIBLE_ETHIKOS_BUG: "Deliberate preview drawer shows 'Preview / No data'"

PRIMARY_ROUTE_SURFACE: "/ethikos/*"

CURRENT_ETHIKOS_ENDPOINTS:
  TOPICS: "/api/ethikos/topics/"
  STANCES: "/api/ethikos/stances/"
  ARGUMENTS: "/api/ethikos/arguments/"
  CATEGORIES: "/api/ethikos/categories/"

CURRENT_COMPAT_ENDPOINTS:
  DELIBERATE_ALIAS: "/api/deliberate/..."
  DELIBERATE_ELITE_ALIAS: "/api/deliberate/elite/..."

RELATED_ENDPOINTS:
  KOLLECTIVE_VOTES: "/api/kollective/votes/"

LEGACY_ENDPOINTS:
  API_HOME_PREFIX: "/api/home/*"

CURRENT_ETHIKOS_MODELS:
  - "EthikosCategory"
  - "EthikosTopic"
  - "EthikosStance"
  - "EthikosArgument"

KORUM_OWNS:
  - "topics"
  - "stances"
  - "arguments"
  - "argument moderation"

KONSULTATIONS_OWNS:
  - "intake"
  - "ballots"
  - "consultation results"
  - "impact tracking"

SMART_VOTE_OWNS:
  - "readings"
  - "lens declarations"
  - "result publication"

EKOH_OWNS:
  - "expertise context"
  - "ethics context"
  - "cohort eligibility"
  - "snapshots"

VOTE_TYPE_SEPARATION:
  ETHIKOS_STANCE_RANGE: "-3..+3"
  KIALO_IMPACT_VOTE_RANGE: "0..4"
  SMART_VOTE_READING_IS_DERIVED: true

KIALO_ROUTE_SCOPE: "/ethikos/deliberate/*"
KIALO_IMPACT_VOTE_IS_TOPIC_STANCE: false
KIALO_IMPACT_VOTE_IS_SMART_VOTE_BALLOT: false
```

---

## 4. Non-goals

This document does not define the full implementation backlog.

It also does not require:

* complete production-grade load testing in the first Kintsugi pass;
* browser coverage for every visual state;
* full external OSS integration tests;
* tests against imported Kialo, Loomio, Decidim, CONSUL, Citizen OS, Consider.it, or DemocracyOS code;
* full annex/sidecar test suites;
* replacing current tests with a new test framework;
* changing the existing route surface to make testing easier.

The purpose is to stabilize the current Konnaxion testing contract before implementation tasks are generated.

---

## 5. Current Stable Baseline

The following baseline is considered already achieved and must not regress:

```yaml id="6gpx48"
frontend_build: "working"
playwright_smoke: "passed"
backend_local_startup_with_uv: "working"
auth_csrf_category_topic_creation: "fixed"
argument_posting: "working"
ekoh_migration_0002: "created_and_applied"
known_open_bug: "Deliberate preview drawer shows Preview / No data"
```

This baseline means the Kintsugi upgrade may proceed as documentation and architecture work, but every implementation slice must preserve these guarantees.

---

## 6. Test Layers

Kintsugi validation is divided into five layers.

```txt id="efztd8"
Layer 1 — Build and static validation
Layer 2 — Backend unit/API tests
Layer 3 — Frontend smoke/navigation tests
Layer 4 — Cross-layer contract tests
Layer 5 — Kintsugi domain invariant tests
```

Each layer has a different purpose.

| Layer             | Purpose                                                 | Required before merge     |
| ----------------- | ------------------------------------------------------- | ------------------------- |
| Build/static      | Detect syntax/type/package breakage                     | Yes                       |
| Backend API       | Validate models, serializers, permissions, endpoints    | Yes                       |
| Frontend smoke    | Validate route render and navigation health             | Yes                       |
| Contract          | Validate payload shape and service/API alignment        | Yes for changed routes    |
| Domain invariants | Validate Korum/Konsultations/Smart Vote/EkoH boundaries | Yes for Kintsugi features |

---

## 7. Minimum Commands

The exact command names may vary by environment, but the following categories are required.

### 7.1 Backend local startup

```bash id="mwm1re"
cd backend
uv run python manage.py check
uv run python manage.py migrate
uv run python manage.py runserver
```

### 7.2 Backend tests

```bash id="e4s35n"
cd backend
uv run pytest
```

If a narrower target is needed:

```bash id="1sk7z7"
cd backend
uv run pytest backend/tests/
uv run pytest backend/tests/test_smoke_platform.py
```

### 7.3 Frontend build

```bash id="9b5nd5"
cd frontend
npm run build
```

### 7.4 Frontend smoke

```bash id="m1s3p0"
cd frontend
npx playwright test frontend/smoke/smoke.spec.ts
```

Or, if the project script wraps Playwright:

```bash id="zhx9tz"
cd frontend
npm run smoke
```

### 7.5 Migration drift check

```bash id="bs4oz2"
cd backend
uv run python manage.py makemigrations --check --dry-run
```

This command is mandatory before considering Kintsugi schema work stable.

---

## 8. Backend Smoke Contract

### 8.1 Existing backend smoke expectations

The backend smoke suite must confirm that the platform can:

```txt id="e79w8d"
Start Django
Load URL routing
Authenticate or create a test user
Access basic API documentation/admin paths where applicable
Create or retrieve EthikosCategory
Create or retrieve EthikosTopic
POST EthikosStance
POST EthikosArgument
POST or validate Kollective vote endpoint when available
Run without migration drift
```

### 8.2 Required Ethikos API smoke paths

The following endpoints must remain smoke-covered:

```txt id="lzcqoe"
GET /api/ethikos/topics/
POST /api/ethikos/topics/
GET /api/ethikos/topics/{id}/

GET /api/ethikos/categories/
POST /api/ethikos/categories/

GET /api/ethikos/stances/
POST /api/ethikos/stances/

GET /api/ethikos/arguments/
POST /api/ethikos/arguments/
```

### 8.3 Required compatibility smoke paths

Compatibility routes must be tested if they remain registered:

```txt id="1xs4wf"
GET /api/deliberate/...
GET /api/deliberate/elite/...
```

These tests may be lightweight. Their goal is not to duplicate all canonical endpoint tests, but to ensure that compatibility aliases do not silently break.

### 8.4 Required Kollective / Smart Vote smoke path

The current decision/vote path must remain validated where available:

```txt id="j9160n"
GET or POST /api/kollective/votes/
```

If the endpoint is optional in the router, the test must distinguish:

```txt id="gk9x1g"
Endpoint missing because optional module is not registered = documented skip
Endpoint registered but broken = failure
Endpoint registered and response < 500 = pass for smoke
```

---

## 9. Backend Domain Tests

### 9.1 EthikosTopic tests

Required assertions:

```txt id="ptmd0j"
Can create topic with valid title and description.
Can assign category if category exists.
Topic status defaults to an allowed value.
Topic status only allows known values.
Topic has created_by where required.
Topic timestamps are set.
Topic can be listed through API.
Topic can be retrieved through API.
```

### 9.2 EthikosCategory tests

Required assertions:

```txt id="o1109x"
Can create category.
Category name is stable.
Category can be associated to topics.
Category list endpoint works.
```

### 9.3 EthikosStance tests

Required assertions:

```txt id="fkf1n2"
Can create stance for user/topic.
Stance value accepts values from -3 to +3.
Stance value rejects values outside -3..+3.
One user/topic stance rule is respected if enforced.
Stance is not treated as Smart Vote reading.
```

### 9.4 EthikosArgument tests

Required assertions:

```txt id="v3r2ki"
Can create argument for topic.
Can create pro argument.
Can create con argument.
Can create neutral argument if supported.
Can create reply using parent argument.
Can list arguments for topic.
Can hide/moderate argument if moderation field exists.
Argument posting works through API.
```

### 9.5 Kialo-style future tests

Once Kialo-style models are implemented, the following tests become required:

```txt id="ktb9i4"
ArgumentSource can be attached to EthikosArgument.
ArgumentImpactVote accepts 0..4 only.
ArgumentImpactVote is linked to an argument, not directly to a topic stance.
ArgumentSuggestion can be submitted by a suggester role.
ArgumentSuggestion requires approval before publication when role is suggester.
DiscussionParticipantRole enforces allowed roles.
DiscussionVisibilitySetting enforces author/vote visibility enums.
Anonymous mode does not expose identity to non-admin participants.
```

---

## 10. Frontend Smoke Contract

### 10.1 Current smoke behavior

The frontend smoke suite should navigate a route, wait for `domcontentloaded`, assert a valid response, assert status `< 400`, and assert the page body is visible.

Minimum behavior:

```txt id="qi1q43"
page.goto(path, waitUntil='domcontentloaded')
response exists
status < 400
body is visible
logs route status and timing
```

### 10.2 Required route smoke set

The smoke suite must cover at least one route in every ethiKos route family.

Minimum set:

```txt id="z6bdns"
/ethikos/deliberate/guidelines
/ethikos/decide/public
/ethikos/decide/results
/ethikos/impact/tracker
/ethikos/pulse/overview
/ethikos/trust/profile
/ethikos/learn/glossary
/ethikos/insights
/ethikos/admin/audit
```

Preferred full ethiKos smoke set:

```txt id="1lfxgn"
/ethikos/admin/audit
/ethikos/admin/moderation
/ethikos/admin/roles

/ethikos/decide/elite
/ethikos/decide/public
/ethikos/decide/results
/ethikos/decide/methodology

/ethikos/deliberate/elite
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

### 10.3 Dynamic topic route smoke

The dynamic route:

```txt id="wcd5fr"
/ethikos/deliberate/[topic]
```

must not be smoke-tested with a fake ID unless the test fixture creates a real topic first.

Required pattern:

```txt id="m9nzwz"
1. Create topic through backend API or fixture.
2. Navigate to /ethikos/deliberate/{createdTopicIdOrSlug}.
3. Assert route loads with status < 400.
4. Assert page body is visible.
5. Assert topic title or stable data-testid is visible.
```

### 10.4 Admin route auth behavior

Admin routes may require authentication or admin role.

Allowed outcomes must be explicit:

```txt id="qyzybm"
Public smoke environment:
  - admin route may redirect to login only if documented
  - redirect must not be mistaken for successful admin page render

Authenticated smoke environment:
  - admin route must render with status < 400
  - admin shell must be visible
```

The current smoke principle treats redirects to login as failure unless adjusted. Kintsugi tests must choose one mode and document it.

---

## 11. Frontend Shell Smoke Contract

All ethiKos pages must remain inside the existing shell structure.

Smoke checks SHOULD assert the presence of a stable shell marker, when available:

```txt id="980gd7"
MainLayout is present
EthikosPageShell is present
page title area is present
module content is visible
no duplicate full-page header is introduced
```

If data-testid markers do not exist yet, this contract recommends adding stable test identifiers:

```tsx id="sr7jsk"
data-testid="ethikos-shell"
data-testid="ethikos-page-title"
data-testid="ethikos-page-content"
```

Required rule:

```txt id="rbnzum"
Frontend smoke should validate that route rendering works.
Frontend smoke should not depend on fragile visual text unless no better selector exists.
```

---

## 12. API and Service Contract Tests

Every Kintsugi feature must have a service-layer contract.

### 12.1 Service-layer rule

Frontend pages SHOULD call APIs through services, not raw page-level fetches.

Required test posture:

```txt id="qy0yqj"
If a route depends on a backend endpoint, the corresponding frontend service must have a documented payload contract.
If a page uses a new Kintsugi endpoint, a service wrapper must exist.
If raw fetch is used, it must be legacy or explicitly documented.
```

### 12.2 Required service contracts

The following service contracts must be tested or type-checked as they are introduced:

```txt id="s9lctr"
fetchEthikosTopics
createEthikosTopic
fetchEthikosCategories
createEthikosCategory
createEthikosStance
createEthikosArgument
fetchTopicPreview
fetchArgumentTree
createArgumentSource
createArgumentImpactVote
submitArgumentSuggestion
fetchDecisionRecords
createDecisionRecord
fetchReadingResults
fetchImpactTracks
fetchAdminAuditEvents
fetchModerationQueue
```

### 12.3 Legacy endpoint containment

Tests SHOULD detect accidental new usage of:

```txt id="f8vhk4"
/api/home/*
```

Policy:

```txt id="6kk4qa"
Existing /api/home/* usage may be documented as legacy.
New Kintsugi work must not add new /api/home/* calls.
Tests or static checks should fail on new /api/home/* additions unless explicitly waived.
```

---

## 13. Korum Test Contract

Korum owns deliberation truth.

Required Korum tests:

```txt id="ljcaz6"
Topic creation
Topic listing
Topic detail retrieval
Stance creation
Stance validation -3..+3
Argument creation
Argument reply creation
Argument side validation
Argument moderation/hiding if supported
Argument tree retrieval once implemented
Argument source attachment once implemented
Argument impact vote 0..4 once implemented
Suggested claim approval once implemented
```

Korum tests must enforce:

```txt id="jevn3e"
Korum records are canonical source facts.
Smart Vote cannot mutate Korum records.
EkoH cannot mutate Korum records.
Foreign tools cannot write directly into Korum core tables.
```

---

## 14. Konsultations Test Contract

Konsultations owns consultation, ballot, result snapshot, and impact tracking truth.

Required Konsultations tests once models exist:

```txt id="rewwj0"
Intake submission creation
Consultation creation
Ballot event creation
DecisionRecord creation
DecisionProtocol validation
EligibilityRule validation
ImpactTrack creation
ImpactUpdate creation
Result snapshot creation
```

Before dedicated Konsultations models exist, tests must explicitly document whether the route is:

```txt id="udab5p"
Using EthikosTopic as temporary consultation container
Using Kollective votes as temporary ballot endpoint
Using stub/mock data
Not yet wired
```

Stub/mock use must not be confused with canonical Kintsugi completion.

---

## 15. Smart Vote and EkoH Test Contract

### 15.1 Smart Vote tests

Smart Vote owns derived readings.

Required tests once reading models exist:

```txt id="x6b1ue"
Can create LensDeclaration.
Can compute or store ReadingResult.
ReadingResult includes reading_key.
ReadingResult includes lens_hash.
ReadingResult includes computed_at.
ReadingResult includes results_payload.
ReadingResult includes snapshot_ref when EkoH context is used.
ReadingResult references topic_id or consultation_id.
Baseline reading remains available.
Derived reading is clearly separate from baseline.
```

### 15.2 Smart Vote immutability tests

Required invariant:

```txt id="xzub5l"
Smart Vote must not mutate upstream Korum/Konsultations facts.
```

Test strategy:

```txt id="rnb2qj"
1. Create source topic/stance/argument or ballot.
2. Compute/store reading.
3. Re-read source records.
4. Assert source records are unchanged.
5. Assert reading exists as derived artifact.
```

### 15.3 EkoH tests

EkoH owns context, not vote mutation.

Required tests:

```txt id="jbjign"
EkoH snapshot can be referenced by reading.
EkoH snapshot is optional for raw baseline reading.
EkoH snapshot is required for expertise/ethics-weighted reading.
EkoH context does not directly alter raw stance/ballot values.
```

---

## 16. Kialo-Style Argument Mapping Test Contract

Kialo-style mimic belongs under:

```txt id="8zj1ny"
/ethikos/deliberate/*
```

It extends Korum. It does not create a separate Kialo module.

### 16.1 Required test distinction

Tests must distinguish:

```txt id="9cvb5w"
EthikosStance:
  range: -3..+3
  level: topic
  model: EthikosStance

ArgumentImpactVote:
  range: 0..4
  level: argument/claim-to-parent impact
  proposed model: ArgumentImpactVote

Smart Vote Reading:
  level: derived aggregate
  proposed model: ReadingResult
```

### 16.2 Required Kialo-style tests

Once implemented:

```txt id="hucd4m"
Argument tree renders parent-child relationships.
Pro/con/neutral sides render correctly.
Argument source can be added, edited, removed if supported.
Impact vote accepts 0..4 only.
Impact vote does not create or modify EthikosStance.
Suggested claim submitted by suggester is not immediately published.
Admin/editor can approve suggested claim.
Anonymous author identity is hidden from normal participants.
Admin can see required moderation metadata.
Discussion topology is single_thesis by default unless multi_thesis is explicitly selected.
```

### 16.3 Required frontend checks

```txt id="tp4ess"
ArgumentTreeView renders.
ArgumentNodeCard renders.
ArgumentSourcesPanel renders when a node has sources.
GuidedVotingDrawer does not block base route smoke if not implemented.
AnonymousModeBanner appears when anonymous mode is active.
SuggestedClaimsPanel is role-aware.
```

---

## 17. Impact and Accountability Test Contract

Impact tracking belongs to ethiKos/Konsultations.

Required tests once impact models exist:

```txt id="kpcux5"
Can create ImpactTrack linked to DecisionRecord.
Can update ImpactTrack status.
Impact status accepts allowed values only.
ImpactTrack can include public evidence links.
ImpactTrack can be displayed under /ethikos/impact/tracker.
Impact outcome can be displayed under /ethikos/impact/outcomes.
Impact feedback can be submitted under /ethikos/impact/feedback.
```

Allowed impact status values:

```txt id="8m1bg1"
planned
in_progress
blocked
completed
cancelled
```

Anti-drift invariant:

```txt id="au2gt6"
KeenKonnect may receive handoff links later, but KeenKonnect Project is not the canonical civic impact truth for Kintsugi first pass.
```

---

## 18. Admin, Audit, and Moderation Test Contract

Admin routes must verify that governance controls exist.

Required tests:

```txt id="62xt1v"
Admin audit route renders.
Admin moderation route renders.
Admin roles route renders.
Moderation queue can display arguments or suggested claims.
Moderation action can hide or approve relevant artifact if implemented.
Role settings enforce allowed values.
Anonymous identity visibility follows role rules.
Audit events are emitted for critical Kintsugi actions once audit exists.
```

Critical audit event types:

```txt id="rwh8j7"
TopicCreated
StanceRecorded
ArgumentCreated
ArgumentUpdated
ArgumentHidden
ArgumentSourceAttached
ArgumentImpactVoteRecorded
ArgumentSuggestionSubmitted
ArgumentSuggestionAccepted
ArgumentSuggestionRejected
DecisionOpened
DecisionClosed
ReadingComputed
ImpactUpdated
ModerationActionRecorded
```

Audit tests may be added incrementally, but any implemented audit event must be deterministic and testable.

---

## 19. Known Bug Regression Contract

### BUG-001

```yaml id="48tu3h"
title: "Deliberate preview drawer shows 'Preview / No data'"
route: "/ethikos/deliberate/[topic]"
status: "known_open"
classification: "targeted bugfix, not architecture"
```

### Required test after fix

Once the preview drawer is fixed, add a regression test.

Expected behavior:

```txt id="eogkqu"
Given a real topic exists
When the user opens the topic preview drawer
Then the drawer displays topic title or summary
And the drawer does not display "No data" for a valid topic
And the drawer handles missing/invalid topic with an explicit empty/error state
```

### Required test category

```txt id="0l5ko0"
Frontend route/component test OR Playwright smoke extension
Service contract test for fetchTopicPreview
Backend API test only if a dedicated preview endpoint exists
```

### Anti-drift rule

The preview bug must not be used to redesign the entire route family.

---

## 20. Migration Drift Contract

Before and after Kintsugi schema work:

```bash id="3f0w01"
uv run python manage.py makemigrations --check --dry-run
uv run python manage.py migrate
uv run pytest
```

Required assertions:

```txt id="mxtuvt"
No unexpected migrations are generated.
All committed migrations apply cleanly.
EkoH migration 0002 remains stable.
New Kintsugi migrations are explicit and named.
New models do not alter existing Ethikos core tables destructively.
```

Migration drift failures are blocking.

---

## 21. Test Data and Fixtures

Kintsugi tests should use predictable fixtures.

### 21.1 Required baseline fixtures

```txt id="kzjgyh"
test_user
admin_user
ethikos_category
ethikos_topic
ethikos_open_topic
ethikos_closed_topic
ethikos_stance
ethikos_argument
ethikos_argument_reply
```

### 21.2 Required future fixtures

```txt id="b24yxf"
argument_source
argument_impact_vote
argument_suggestion
decision_protocol
decision_record
lens_declaration
reading_result
ekoh_snapshot_ref
impact_track
moderation_action
```

### 21.3 Fixture rules

```txt id="n9tbdd"
Fixtures must not rely on production IDs.
Fixtures must not rely on external OSS services.
Fixtures must create records through canonical models or APIs.
Fixtures must not bypass invariants unless explicitly testing invalid data.
```

---

## 22. CI Gate Contract

The following checks are required for any Kintsugi implementation PR:

```txt id="fw9m5f"
Backend check passes.
Backend migrations apply.
Backend makemigrations dry-run has no unexpected changes.
Backend tests pass.
Frontend build passes.
Frontend smoke passes.
Changed route has at least one smoke or contract test.
Changed endpoint has at least one API test.
Changed model has migration and model test.
Changed payload shape is documented.
```

Optional but recommended:

```txt id="m1hqa6"
Frontend typecheck
Frontend lint
Storybook build
Visual regression for key Ethikos routes
Coverage report
```

---

## 23. First-Pass Required Test Matrix

| Area             | Required before Kintsugi implementation    | Required after implementation             |
| ---------------- | ------------------------------------------ | ----------------------------------------- |
| Build            | frontend build, backend check              | unchanged                                 |
| Smoke            | current Playwright route smoke             | all route families covered                |
| Ethikos API      | topics, categories, stances, arguments     | same plus new Korum endpoints             |
| Deliberate       | route loads                                | topic preview fixed, argument tree tested |
| Decide           | route loads                                | decision protocol/result tested           |
| Results          | route loads                                | baseline vs reading tested                |
| Impact           | route loads                                | impact tracker tested                     |
| Admin            | route loads/auth behavior documented       | audit/moderation/roles tested             |
| Smart Vote       | optional vote endpoint behavior documented | reading result tested                     |
| EkoH             | migration 0002 stable                      | snapshot reference tested                 |
| Kialo-style      | not imported                               | native mimic tests only                   |
| Legacy endpoints | known `/api/home/*` use documented         | no new `/api/home/*` use                  |

---

## 24. Acceptance Criteria

A Kintsugi implementation slice may be considered test-complete only when:

```txt id="sn8mib"
1. Existing baseline still passes.
2. No unexpected migrations are generated.
3. Changed backend endpoints have API tests.
4. Changed frontend routes have smoke or component coverage.
5. Changed service payloads are documented and validated.
6. Korum/Konsultations/Smart Vote/EkoH ownership is preserved.
7. Vote-type separation is preserved.
8. Legacy /api/home/* usage is not expanded.
9. Known preview drawer bug is either still documented or covered by regression test after fix.
10. No full external OSS merge or Kialo module is introduced.
```

---

## 25. Anti-Drift Rules

```txt id="plzj51"
Do not treat smoke passing as proof of full feature correctness.
Do not treat route render as proof of backend contract correctness.
Do not add Kintsugi implementation without tests for changed contracts.
Do not add models without migration drift checks.
Do not add new API endpoints without service-layer alignment.
Do not add route-level raw fetches unless explicitly documented.
Do not collapse EthikosStance, ArgumentImpactVote, and Smart Vote Reading.
Do not test external OSS code in first pass.
Do not create tests for imaginary routes.
Do not expand /api/home/*.
```

---

## 26. Related Docs

This document depends on:

```txt id="b45qbg"
00_KINTSUGI_START_HERE.md
02_SOURCE_OF_TRUTH_AND_DRIFT_CONTROL.md
03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md
04_CANONICAL_NAMING_AND_VARIABLES.md
05_CURRENT_STATE_BASELINE.md
06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md
07_API_AND_SERVICE_CONTRACTS.md
08_DATA_MODEL_AND_MIGRATION_PLAN.md
09_SMART_VOTE_EKOH_READING_CONTRACT.md
12_CANONICAL_OBJECTS_AND_EVENTS.md
13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md
14_FRONTEND_ALIGNMENT_CONTRACT.md
15_BACKEND_ALIGNMENT_CONTRACT.md
17_KNOWN_BUGS_AND_NON_KINTSUGI_ITEMS.md
20_AI_GENERATION_GUARDRAILS.md
21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md
22_IMPLEMENTATION_BACKLOG_TEMPLATE.md
```

---

## 27. Final Contract

The Kintsugi test contract is:

```txt id="ozpm9m"
Preserve the current stable baseline.
Test every changed route, endpoint, model, and payload.
Keep smoke tests fast and broad.
Keep API tests precise and invariant-driven.
Keep Smart Vote and EkoH read/derived boundaries testable.
Keep Kialo-style mimic native to /ethikos/deliberate/*.
Never allow tests to normalize route, endpoint, or ownership drift.
```

---

## V4.1 EkoH rating-access smoke matrix

Tests MUST cover public, private, self, staff compatibility, direct scope grants, descendant scope grants, cross-department denial, ratings-vs-history detail, profile redaction, and Smart Vote participant-detail filtering. Aggregate baseline/reading arithmetic MUST remain unchanged by display access.

