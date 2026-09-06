# 07 — API and Service Contracts

**Document ID:** `07_API_AND_SERVICE_CONTRACTS.md`
**Pack:** ethiKos Kintsugi Update Documentation Pack
**Status:** Canonical contract draft
**Audience:** frontend implementers, backend implementers, AI assistants, reviewers
**Primary purpose:** prevent API/service drift during the Kintsugi upgrade.

---

## 1. Purpose

This document defines the canonical API and frontend service contracts for the ethiKos Kintsugi upgrade.

It fixes:

* the backend API prefixes that are allowed;
* the frontend service layer rules;
* the existing ethiKos endpoints that MUST remain stable;
* the compatibility aliases that MAY remain during migration;
* the legacy endpoints that MUST NOT be expanded;
* the new Kintsugi endpoint families that MAY be introduced later;
* the anti-drift rules for generated code and parallel AI sessions.

The current implementation uses Django REST Framework with a central API router. The router registers ethiKos topics, stances, arguments, optional categories, and Kollective Intelligence vote endpoints under `/api/...`. 

---

## 2. Scope

This document covers API and service contracts for:

* ethiKos / Korum;
* Konsultations;
* Smart Vote;
* EkoH reading context;
* Kialo-style argument mapping;
* Kintsugi drafting;
* Kintsugi impact tracking;
* frontend service modules;
* legacy endpoint containment.

This document does **not** define database schema details. Schema belongs to:

```txt
08_DATA_MODEL_AND_MIGRATION_PLAN.md
```

This document does **not** define serializer payloads in full detail. Payload shapes belong to:

```txt
13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md
```

This document does **not** define frontend layout rules beyond API/service access. Frontend layout belongs to:

```txt
14_FRONTEND_ALIGNMENT_CONTRACT.md
```

---

## 3. Canonical Variables Used

```yaml
DOCUMENT_ID: "07_API_AND_SERVICE_CONTRACTS.md"

PRIMARY_API_BASE: "/api/"
PRIMARY_FRONTEND_ROUTE_SURFACE: "/ethikos/*"

BACKEND_STYLE: "Django REST Framework ViewSet + Serializer + Router"
API_ROUTER_FILE: "backend/config/api_router.py"
ROOT_URLCONF: "config.urls"
AUTH_USER_MODEL: "users.User"

ETHIKOS_BACKEND_APP: "konnaxion.ethikos"
KOLLECTIVE_BACKEND_APP: "konnaxion.kollective_intelligence"
EKOH_BACKEND_APP: "konnaxion.ekoh"

FRONTEND_SERVICE_LAYER_REQUIRED: true
RAW_FETCH_FROM_COMPONENTS_ALLOWED: false
GRAPHQL_FOR_CORE_CRUD_ALLOWED: false
WEBSOCKET_FOR_CORE_CRUD_ALLOWED: false

CANONICAL_ETHIKOS_ENDPOINTS:
  TOPICS: "/api/ethikos/topics/"
  STANCES: "/api/ethikos/stances/"
  ARGUMENTS: "/api/ethikos/arguments/"
  CATEGORIES: "/api/ethikos/categories/"

CANONICAL_KOLLECTIVE_ENDPOINTS:
  VOTES: "/api/kollective/votes/"
  VOTE_RESULTS: "/api/kollective/vote-results/"

COMPATIBILITY_ENDPOINTS:
  DELIBERATE_ALIAS: "/api/deliberate/..."
  DELIBERATE_ELITE_ALIAS: "/api/deliberate/elite/..."

LEGACY_ENDPOINTS:
  API_HOME_PREFIX: "/api/home/*"

LEGACY_ENDPOINT_POLICY: "Do not expand. Replace, isolate, or mark as legacy."
```

---

## 4. Source of Truth

For implementation reality, the source of truth is:

```txt
backend/config/api_router.py
```

The router currently registers:

```txt
/api/ethikos/topics/
/api/ethikos/stances/
/api/ethikos/arguments/
/api/ethikos/categories/   optional
/api/kollective/votes/     optional
/api/kollective/vote-results/ optional
```

The existing technical contract also states that frontend code should access ethiKos through a service module wrapping `/api/ethikos/...` and `/api/deliberate/...`, not through ad hoc component-level calls. 

When this document conflicts with older speculative docs, this document wins for API/service alignment.

When this document conflicts with the code snapshot, the code snapshot wins for current implementation reality, and this document should be updated.

---

## 5. Core API Principles

### 5.1 REST First

Kintsugi API work MUST use REST over HTTP by default.

```yaml
DEFAULT_API_STYLE: "REST"
DEFAULT_BACKEND_PATTERN: "DRF ViewSet + Serializer + Router"
DEFAULT_FRONTEND_PATTERN: "services/* wrapper"
```

GraphQL MUST NOT be introduced for ethiKos CRUD unless a future ADR explicitly approves it.

WebSockets MUST NOT be introduced for ethiKos CRUD.

Realtime features MAY later use WebSockets only for live updates, not for canonical record creation.

---

### 5.2 Service Layer Required

Frontend pages MUST NOT directly call backend endpoints unless the file is itself part of the service layer.

Allowed:

```ts
import { fetchTopicDetail } from "@/services/deliberate";
import { getEthikosTopics } from "@/services/ethikos";
```

Avoid:

```ts
fetch("/api/ethikos/topics/");
```

Preferred service locations:

```txt
frontend/services/ethikos.ts
frontend/services/deliberate.ts
frontend/services/decide.ts
frontend/services/impact.ts
frontend/services/pulse.ts
frontend/services/admin.ts
frontend/services/trust.ts
frontend/services/learn.ts
frontend/services/insights.ts
```

The existing AI guidance explicitly says that frontend API calls should use the services layer, respect `/api/...` prefixes, avoid inventing paths, and avoid renaming `/api/ethikos/...` to `/api/deliberation/...`. 

---

### 5.3 Canonical Prefixes Must Stay Stable

The following prefixes MUST NOT be renamed:

```txt
/api/ethikos/
/api/kollective/
/api/users/
/api/keenkonnect/
/api/konnected/
/api/kreative/
```

For this upgrade, ethiKos Kintsugi work MUST primarily use:

```txt
/api/ethikos/*
/api/kollective/*
```

Future EkoH-specific endpoints MAY use:

```txt
/api/ekoh/*
```

only if already present or added by an explicit backend contract.

---

### 5.4 Compatibility Aliases Are Transitional

The following aliases MAY remain during the Kintsugi upgrade:

```txt
/api/deliberate/...
/api/deliberate/elite/...
```

They MUST NOT become the preferred canonical API.

Preferred API:

```txt
/api/ethikos/*
```

Compatibility API:

```txt
/api/deliberate/*
```

---

### 5.5 Legacy `/api/home/*` Must Not Expand

The endpoint graph shows direct legacy calls to `/api/home/categories/`, `/api/home/debatecategory/`, `/api/home/debatetopic/`, `/api/home/responseformat/`, `/api/home/publicvote/`, and `/api/home/debatetopic/${topic.id}/vote`. These are direct API usages outside the intended ethiKos/Kollective service contracts. 

Policy:

```yaml
API_HOME_USAGE:
  STATUS: "legacy/problematic"
  MAY_ADD_NEW_CALLS: false
  MAY_WRAP_FOR_MIGRATION: true
  MUST_REPLACE_LONG_TERM: true
  TARGET_REPLACEMENT:
    TOPICS: "/api/ethikos/topics/"
    STANCES: "/api/ethikos/stances/"
    ARGUMENTS: "/api/ethikos/arguments/"
    VOTES: "/api/kollective/votes/"
```

---

## 6. Current Canonical Endpoint Registry

## 6.1 ethiKos Core

### `/api/ethikos/topics/`

Backend:

```yaml
ROUTE: "/api/ethikos/topics/"
VIEWSET: "TopicViewSet"
MODEL: "EthikosTopic"
APP: "konnaxion.ethikos"
OWNER: "Korum / ethiKos core"
```

Allowed operations:

```yaml
LIST:
  METHOD: "GET"
  PATH: "/api/ethikos/topics/"
  AUTH: "public read allowed"

CREATE:
  METHOD: "POST"
  PATH: "/api/ethikos/topics/"
  AUTH: "authenticated"

RETRIEVE:
  METHOD: "GET"
  PATH: "/api/ethikos/topics/{id}/"
  AUTH: "public read allowed"

UPDATE:
  METHOD: "PATCH"
  PATH: "/api/ethikos/topics/{id}/"
  AUTH: "owner/admin"

DELETE:
  METHOD: "DELETE"
  PATH: "/api/ethikos/topics/{id}/"
  AUTH: "owner/admin"
```

Known supported query params:

```yaml
QUERY_PARAMS:
  category: "Filter by category id."
  status: "Filter by topic status."
```

Topic creation MUST resolve category by `category` or `category_id`, not by arbitrary label strings at the backend boundary. Existing frontend service code already resolves category labels to IDs before posting to `ethikos/topics/`. 

---

### `/api/ethikos/topics/{id}/preview/`

Backend:

```yaml
ROUTE: "/api/ethikos/topics/{id}/preview/"
VIEWSET_ACTION: "TopicViewSet.preview"
MODEL: "EthikosTopic"
APP: "konnaxion.ethikos"
OWNER: "Korum / ethiKos core"
```

Purpose:

```txt
Return a minimal topic preview for the Deliberate preview drawer.
```

Required behavior:

* MUST return topic metadata even if related arguments fail to load.
* MUST NOT return an empty shape when the topic exists.
* MUST be resilient enough to prevent the visible `Preview / No data` drawer bug.

Frontend service SHOULD expose:

```ts
fetchTopicPreview(id: string): Promise<TopicPreviewResponse>
```

Current implementation already contains a frontend `fetchTopicPreview` that retrieves topic metadata from `ethikos/topics/{topicId}/` and attempts to load latest arguments from `ethikos/arguments/?topic=<id>`. 

---

### `/api/ethikos/stances/`

Backend:

```yaml
ROUTE: "/api/ethikos/stances/"
VIEWSET: "StanceViewSet"
MODEL: "EthikosStance"
APP: "konnaxion.ethikos"
OWNER: "Korum"
```

Semantic contract:

```yaml
STANCE_LEVEL: "topic-level"
STANCE_RANGE: "-3..+3"
ONE_STANCE_PER_USER_TOPIC: true
IS_KIALO_IMPACT_VOTE: false
IS_SMART_VOTE_READING: false
```

Allowed operations:

```yaml
LIST:
  METHOD: "GET"
  PATH: "/api/ethikos/stances/"

CREATE_OR_UPDATE:
  METHOD: "POST"
  PATH: "/api/ethikos/stances/"
  AUTH: "authenticated"

RETRIEVE:
  METHOD: "GET"
  PATH: "/api/ethikos/stances/{id}/"

UPDATE:
  METHOD: "PATCH"
  PATH: "/api/ethikos/stances/{id}/"
  AUTH: "owner/admin"

DELETE:
  METHOD: "DELETE"
  PATH: "/api/ethikos/stances/{id}/"
  AUTH: "owner/admin"
```

Known supported query params:

```yaml
QUERY_PARAMS:
  topic: "Filter by topic id."
```

Frontend examples MAY aggregate stances by topic for consultation-style result buckets. Current Konsultations result hooks already map a consultation to an Ethikos topic and aggregate rows from `GET /api/ethikos/stances/?topic=<consultationId>`. 

---

### `/api/ethikos/arguments/`

Backend:

```yaml
ROUTE: "/api/ethikos/arguments/"
VIEWSET: "ArgumentViewSet"
MODEL: "EthikosArgument"
APP: "konnaxion.ethikos"
OWNER: "Korum"
```

Semantic contract:

```yaml
ARGUMENT_LEVEL: "topic discussion / claim-like argument"
ARGUMENT_TREE_SUPPORTED: true
TREE_MECHANISM: "parent + side"
SIDE_VALUES:
  - "pro"
  - "con"
  - null
KIALO_CLAIM_MAPPING: "EthikosArgument"
```

Allowed operations:

```yaml
LIST:
  METHOD: "GET"
  PATH: "/api/ethikos/arguments/"

CREATE:
  METHOD: "POST"
  PATH: "/api/ethikos/arguments/"
  AUTH: "authenticated"

RETRIEVE:
  METHOD: "GET"
  PATH: "/api/ethikos/arguments/{id}/"

UPDATE:
  METHOD: "PATCH"
  PATH: "/api/ethikos/arguments/{id}/"
  AUTH: "owner/admin"

DELETE:
  METHOD: "DELETE"
  PATH: "/api/ethikos/arguments/{id}/"
  AUTH: "owner/admin"
```

Known supported query params:

```yaml
QUERY_PARAMS:
  topic: "Filter by topic id."
  parent: "Optional future filter for child arguments."
  side: "Optional future filter for pro/con/neutral side."
```

Rules:

* `EthikosArgument` MUST NOT be renamed to `Claim`.
* Kialo-style “claim” language MAY be used in UI, but backend model naming remains `EthikosArgument`.
* `EthikosArgument.side` MUST NOT be used as a Smart Vote ballot.
* `EthikosArgument.parent + side` is the first-pass argument graph contract.

---

### `/api/ethikos/categories/`

Backend:

```yaml
ROUTE: "/api/ethikos/categories/"
VIEWSET: "CategoryViewSet" or "EthikosCategoryViewSet"
MODEL: "EthikosCategory"
APP: "konnaxion.ethikos"
OWNER: "Korum / ethiKos core"
OPTIONAL: true
```

Current router registers categories only if the ViewSet exists. 

Allowed operations:

```yaml
LIST:
  METHOD: "GET"
  PATH: "/api/ethikos/categories/"
  AUTH: "public read allowed"

RETRIEVE:
  METHOD: "GET"
  PATH: "/api/ethikos/categories/{id}/"
  AUTH: "public read allowed"
```

First-pass policy:

```yaml
CATEGORY_CREATION_FROM_FRONTEND: false
CATEGORY_READ_ONLY_DEFAULT: true
```

---

## 6.2 Kollective Intelligence / Smart Vote

### `/api/kollective/votes/`

Backend:

```yaml
ROUTE: "/api/kollective/votes/"
VIEWSET: "VoteViewSet"
APP: "konnaxion.kollective_intelligence"
OWNER: "Kollective Intelligence / Smart Vote"
OPTIONAL_IN_CURRENT_ROUTER: true
```

Current router registers `kollective/votes` optionally when `VoteViewSet` exists. 

Contract:

```yaml
PURPOSE: "Formal vote capture for decision workflows."
MUST_NOT_REPLACE_ETHIKOS_STANCES: true
MUST_NOT_REPLACE_KIALO_IMPACT_VOTES: true
USED_BY:
  - "/ethikos/decide/public"
  - "/ethikos/decide/elite"
  - "/ethikos/decide/results"
```

Frontend service:

```txt
frontend/services/decide.ts
```

Current endpoint graph marks `services/decide.ts` as loosely mapped to `api/kollective/votes`, so Kintsugi must convert this loose mapping into a formal contract before implementation. 

---

### `/api/kollective/vote-results/`

Backend:

```yaml
ROUTE: "/api/kollective/vote-results/"
VIEWSET: "VoteResultViewSet"
APP: "konnaxion.kollective_intelligence"
OWNER: "Kollective Intelligence / Smart Vote"
OPTIONAL_IN_CURRENT_ROUTER: true
```

Contract:

```yaml
PURPOSE: "Raw or baseline vote result retrieval."
MUST_NOT_MIX_WITH_READING_RESULT: true
```

Kintsugi readings SHOULD be separated into explicit reading result models/endpoints, not hidden inside baseline vote results.

---

## 6.3 Users

### `/api/users/me/`

Backend:

```yaml
ROUTE: "/api/users/me/"
OWNER: "users"
PURPOSE: "Current authenticated user"
```

Use cases:

* frontend session awareness;
* ownership checks;
* admin visibility;
* role-aware Kintsugi UI.

The smoke test verifies `/api/users/me/` as part of the platform baseline. 

---

## 7. Kintsugi Proposed Endpoint Families

The endpoints in this section are **proposed contracts**, not necessarily current implementation.

They MUST NOT be generated as code until the corresponding data model and serializer contracts are approved.

---

## 7.1 Decision Protocols

```yaml
PROPOSED_ENDPOINT: "/api/ethikos/decision-protocols/"
APP: "konnaxion.ethikos"
MODEL: "DecisionProtocol"
OWNER: "Konsultations / Decision layer coordination"
STATUS: "proposed"
```

Purpose:

```txt
Define reusable decision protocol templates for ethiKos decision workflows.
```

Expected service:

```txt
frontend/services/decide.ts
```

Allowed first-pass operations:

```yaml
LIST: "GET /api/ethikos/decision-protocols/"
RETRIEVE: "GET /api/ethikos/decision-protocols/{id}/"
CREATE: "POST /api/ethikos/decision-protocols/"
UPDATE: "PATCH /api/ethikos/decision-protocols/{id}/"
```

Non-goal:

```txt
Do not use DecisionProtocol as a replacement for Smart Vote readings.
```

---

## 7.2 Decision Records

```yaml
PROPOSED_ENDPOINT: "/api/ethikos/decision-records/"
APP: "konnaxion.ethikos"
MODEL: "DecisionRecord"
OWNER: "Konsultations + Smart Vote publication boundary"
STATUS: "proposed"
```

Purpose:

```txt
Represent a concrete decision instance attached to an ethiKos topic, consultation, or proposal.
```

Expected service:

```txt
frontend/services/decide.ts
```

Contract:

```yaml
DECISION_RECORD_MAY_REFERENCE:
  - "EthikosTopic"
  - "DecisionProtocol"
  - "BaselineResult"
  - "ReadingResult"
DECISION_RECORD_MUST_NOT:
  - "mutate raw stances"
  - "mutate raw ballots"
  - "hide baseline result"
```

---

## 7.3 Lens Declarations

```yaml
PROPOSED_ENDPOINT: "/api/kollective/lens-declarations/"
APP: "konnaxion.kollective_intelligence"
MODEL: "LensDeclaration"
OWNER: "Smart Vote"
STATUS: "proposed"
```

Purpose:

```txt
Declare the formula, cohort, weighting, and audit context used to compute a Smart Vote reading.
```

Contract:

```yaml
REQUIRED_CONCEPTS:
  - "reading_key"
  - "lens_hash"
  - "snapshot_ref"
  - "computed_at"
```

Smart Vote readings must remain reproducible and must not mutate baseline facts. The boundary document explicitly requires reading audit fields such as `reading_key`, `lens_hash`, `ekoh_snapshot_id` or `snapshot_ref`. 

---

## 7.4 Reading Results

```yaml
PROPOSED_ENDPOINT: "/api/kollective/reading-results/"
APP: "konnaxion.kollective_intelligence"
MODEL: "ReadingResult"
OWNER: "Smart Vote"
STATUS: "proposed"
```

Purpose:

```txt
Publish derived Smart Vote readings computed from baseline events and declared lenses.
```

Contract:

```yaml
READING_RESULT_IS_DERIVED: true
READING_RESULT_IS_SOURCE_FACT: false
MUST_INCLUDE_BASELINE_REFERENCE: true
MUST_INCLUDE_LENS_DECLARATION_REFERENCE: true
MAY_INCLUDE_EKOH_SNAPSHOT_REFERENCE: true
```

Allowed first-pass operations:

```yaml
LIST: "GET /api/kollective/reading-results/"
RETRIEVE: "GET /api/kollective/reading-results/{id}/"
CREATE: "POST /api/kollective/reading-results/"
```

Write policy:

```txt
Only trusted backend/admin processes should create computed readings.
```

---

## 7.5 Drafts

```yaml
PROPOSED_ENDPOINT: "/api/ethikos/drafts/"
APP: "konnaxion.ethikos"
MODEL: "Draft"
OWNER: "ethiKos bounded drafting capability"
STATUS: "proposed"
```

Purpose:

```txt
Represent draft text created from deliberation and consultation workflows.
```

Expected services:

```txt
frontend/services/drafting.ts
frontend/services/decide.ts
```

Contract:

```yaml
DRAFT_MAY_REFERENCE:
  - "EthikosTopic"
  - "DecisionRecord"
  - "RationalePacket"
DRAFT_MUST_NOT:
  - "overwrite topic"
  - "overwrite arguments"
  - "be stored inside EthikosArgument"
```

---

## 7.6 Draft Versions

```yaml
PROPOSED_ENDPOINT: "/api/ethikos/draft-versions/"
APP: "konnaxion.ethikos"
MODEL: "DraftVersion"
OWNER: "ethiKos bounded drafting capability"
STATUS: "proposed"
```

Purpose:

```txt
Version history for collaborative drafting.
```

Contract:

```yaml
VERSION_HISTORY_REQUIRED: true
MUST_BE_APPEND_FRIENDLY: true
MUST_SUPPORT_AUDIT: true
```

---

## 7.7 Amendments

```yaml
PROPOSED_ENDPOINT: "/api/ethikos/amendments/"
APP: "konnaxion.ethikos"
MODEL: "Amendment"
OWNER: "ethiKos bounded drafting capability"
STATUS: "proposed"
```

Purpose:

```txt
Represent proposed edits to a draft.
```

Contract:

```yaml
AMENDMENT_MAY_REFERENCE:
  - "Draft"
  - "DraftVersion"
  - "EthikosArgument"
AMENDMENT_STATUS_VALUES:
  - "draft"
  - "submitted"
  - "accepted"
  - "rejected"
  - "superseded"
```

---

## 7.8 Impact Tracks

```yaml
PROPOSED_ENDPOINT: "/api/ethikos/impact-tracks/"
APP: "konnaxion.ethikos"
MODEL: "ImpactTrack"
OWNER: "Konsultations accountability"
STATUS: "proposed"
```

Purpose:

```txt
Track implementation, feedback, outcomes, and public accountability after a decision.
```

Expected service:

```txt
frontend/services/impact.ts
```

Current risk:

```txt
The existing endpoint graph loosely maps impact service calls to KeenKonnect ProjectViewSet/Project.
```

Policy:

```yaml
IMPACT_TRUTH_OWNER: "ethiKos / Konsultations"
KEENKONNECT_MAY_RECEIVE_HANDOFF: true
KEENKONNECT_MUST_NOT_OWN_CIVIC_IMPACT_TRUTH: true
```

The current graph shows `/impact/feedback`, `/impact/outcomes`, and `/impact/tracker` loosely mapped to `api/keenkonnect/projects`; Kintsugi must formalize native ethiKos/Konsultations impact endpoints instead of relying on KeenKonnect as the source of truth. 

---

## 7.9 External Artifacts

```yaml
PROPOSED_ENDPOINT: "/api/ethikos/external-artifacts/"
APP: "konnaxion.ethikos"
MODEL: "ExternalArtifact"
OWNER: "Mimic/Annex boundary"
STATUS: "proposed"
```

Purpose:

```txt
Represent external civic-tech artifacts without allowing external tools to write into core ethiKos tables.
```

Contract:

```yaml
FOREIGN_TOOLS_WRITE_CORE_TABLES: false
EXTERNAL_ARTIFACT_IS_REFERENCE_ONLY: true
```

---

## 7.10 Projection Mappings

```yaml
PROPOSED_ENDPOINT: "/api/ethikos/projection-mappings/"
APP: "konnaxion.ethikos"
MODEL: "ProjectionMapping"
OWNER: "Mimic/Annex boundary"
STATUS: "proposed"
```

Purpose:

```txt
Map external artifacts to native ethiKos objects without duplicating canonical truth.
```

Contract:

```yaml
PROJECTION_MAPPING_MAY_LINK:
  - "ExternalArtifact"
  - "EthikosTopic"
  - "EthikosArgument"
  - "DecisionRecord"
  - "ImpactTrack"
PROJECTION_MAPPING_MUST_NOT:
  - "modify source facts"
  - "replace native ownership"
```

---

## 8. Kialo-Style Endpoint Contracts

The Kialo-style contract is native mimic inside ethiKos.

```yaml
KIALO_STRATEGY: "native_mimic"
KIALO_ROUTE_SCOPE: "/ethikos/deliberate/*"
KIALO_BACKEND_SCOPE: "konnaxion.ethikos"
CREATE_KIALO_APP: false
CREATE_KIALO_ROUTE_FAMILY: false
IMPORT_KIALO_CODE: false
```

---

## 8.1 Argument Sources

```yaml
PROPOSED_ENDPOINT: "/api/ethikos/argument-sources/"
APP: "konnaxion.ethikos"
MODEL: "ArgumentSource"
OWNER: "Korum"
STATUS: "proposed"
```

Purpose:

```txt
Attach source/citation evidence to an EthikosArgument.
```

Expected service:

```txt
frontend/services/deliberate.ts
```

Contract:

```yaml
ARGUMENT_SOURCE_MUST_REFERENCE: "EthikosArgument"
ARGUMENT_SOURCE_MUST_NOT_CREATE_ARGUMENT: true
```

---

## 8.2 Argument Impact Votes

```yaml
PROPOSED_ENDPOINT: "/api/ethikos/argument-impact-votes/"
APP: "konnaxion.ethikos"
MODEL: "ArgumentImpactVote"
OWNER: "Korum"
STATUS: "proposed"
```

Purpose:

```txt
Capture Kialo-style claim impact ratings at argument/claim level.
```

Contract:

```yaml
IMPACT_VOTE_RANGE: "0..4"
IMPACT_VOTE_LEVEL: "argument-level"
IS_TOPIC_STANCE: false
IS_SMART_VOTE_BALLOT: false
IS_BASELINE_READING: false
```

Must remain separate from:

```txt
/api/ethikos/stances/
/api/kollective/votes/
/api/kollective/reading-results/
```

---

## 8.3 Argument Suggestions

```yaml
PROPOSED_ENDPOINT: "/api/ethikos/argument-suggestions/"
APP: "konnaxion.ethikos"
MODEL: "ArgumentSuggestion"
OWNER: "Korum"
STATUS: "proposed"
```

Purpose:

```txt
Allow users with limited permissions to suggest claims/arguments before publication.
```

Contract:

```yaml
SUGGESTER_ROLE_REQUIRES_APPROVAL: true
SUGGESTION_IS_NOT_PUBLISHED_ARGUMENT: true
ACCEPTED_SUGGESTION_MAY_CREATE_ARGUMENT: true
```

---

## 8.4 Discussion Participant Roles

```yaml
PROPOSED_ENDPOINT: "/api/ethikos/discussion-participant-roles/"
APP: "konnaxion.ethikos"
MODEL: "DiscussionParticipantRole"
OWNER: "Korum"
STATUS: "proposed"
```

Purpose:

```txt
Represent owner/admin/editor/writer/suggester/viewer roles for a topic discussion.
```

Contract:

```yaml
ROLE_VALUES:
  - "owner"
  - "admin"
  - "editor"
  - "writer"
  - "suggester"
  - "viewer"
```

---

## 8.5 Discussion Visibility Settings

```yaml
PROPOSED_ENDPOINT: "/api/ethikos/discussion-visibility-settings/"
APP: "konnaxion.ethikos"
MODEL: "DiscussionVisibilitySetting"
OWNER: "Korum"
STATUS: "proposed"
```

Purpose:

```txt
Control author visibility, vote visibility, and anonymous participation settings.
```

Contract:

```yaml
AUTHOR_VISIBILITY_VALUES:
  - "never"
  - "admins_only"
  - "all"

VOTE_VISIBILITY_VALUES:
  - "all"
  - "admins_only"
  - "self_only"

PARTICIPATION_TYPE_VALUES:
  - "standard"
  - "anonymous"
```

---

## 9. Frontend Service Contracts

## 9.1 `frontend/services/ethikos.ts`

Role:

```txt
Canonical low-level service wrapper for /api/ethikos/*.
```

Responsibilities:

```yaml
MUST_WRAP:
  - "/api/ethikos/topics/"
  - "/api/ethikos/stances/"
  - "/api/ethikos/arguments/"
  - "/api/ethikos/categories/"

MAY_WRAP_PROPOSED:
  - "/api/ethikos/argument-sources/"
  - "/api/ethikos/argument-impact-votes/"
  - "/api/ethikos/argument-suggestions/"
  - "/api/ethikos/decision-records/"
  - "/api/ethikos/drafts/"
  - "/api/ethikos/impact-tracks/"
```

Must export typed functions, not raw path strings scattered across pages.

---

## 9.2 `frontend/services/deliberate.ts`

Role:

```txt
Route/domain service for /ethikos/deliberate/* screens.
```

Current responsibilities:

```yaml
FETCH_ELITE_TOPICS: true
CREATE_ELITE_TOPIC: true
FETCH_TOPIC_DETAIL: true
FETCH_TOPIC_PREVIEW: true
```

Target responsibilities:

```yaml
SHOULD_USE_CANONICAL_ETHIKOS_SERVICE: true
SHOULD_NOT_CALL_LEGACY_HOME_API: true
MAY_ADAPT_UI_SHAPES: true
MUST_NOT_OWN_RAW_HTTP_CLIENT: true
```

Allowed backend targets:

```txt
/api/ethikos/topics/
/api/ethikos/topics/{id}/preview/
/api/ethikos/arguments/
/api/ethikos/stances/
/api/ethikos/categories/
```

Future allowed targets:

```txt
/api/ethikos/argument-sources/
/api/ethikos/argument-impact-votes/
/api/ethikos/argument-suggestions/
/api/ethikos/discussion-participant-roles/
/api/ethikos/discussion-visibility-settings/
```

---

## 9.3 `frontend/services/decide.ts`

Role:

```txt
Route/domain service for /ethikos/decide/* screens.
```

Current graph status:

```yaml
CURRENT_MAPPING: "loose"
CURRENT_BACKEND_TARGET: "api/kollective/votes"
```

Allowed backend targets:

```txt
/api/kollective/votes/
/api/kollective/vote-results/
```

Future allowed targets:

```txt
/api/ethikos/decision-protocols/
/api/ethikos/decision-records/
/api/kollective/lens-declarations/
/api/kollective/reading-results/
```

Rules:

* MUST NOT write to `EthikosStance` when capturing formal ballots.
* MUST NOT hide baseline results behind weighted readings.
* MUST distinguish public ballot, elite ballot, result publication, and Smart Vote reading.

---

## 9.4 `frontend/services/impact.ts`

Role:

```txt
Route/domain service for /ethikos/impact/* screens.
```

Current graph status:

```yaml
CURRENT_MAPPING: "loose"
CURRENT_BACKEND_TARGET: "api/keenkonnect/projects"
```

Target backend:

```txt
/api/ethikos/impact-tracks/
```

Transitional policy:

```yaml
MAY_READ_KEENKONNECT_HANDOFFS: true
MUST_NOT_TREAT_KEENKONNECT_PROJECT_AS_IMPACT_TRUTH: true
MUST_MIGRATE_TO_NATIVE_IMPACT_CONTRACT: true
```

---

## 9.5 `frontend/services/pulse.ts`

Role:

```txt
Route/domain service for /ethikos/pulse/* screens.
```

Allowed current backend targets:

```txt
/api/ethikos/topics/
/api/ethikos/stances/
/api/ethikos/arguments/
```

Future allowed targets:

```txt
/api/ethikos/impact-tracks/
/api/kollective/reading-results/
```

Rules:

* Pulse may aggregate.
* Pulse must not mutate.
* Pulse must not define new truth.

---

## 9.6 `frontend/services/insights.ts`

Role:

```txt
Route/domain service for /ethikos/insights.
```

Allowed current backend targets:

```txt
/api/ethikos/topics/
/api/ethikos/stances/
/api/ethikos/arguments/
/api/kollective/vote-results/
```

Future allowed targets:

```txt
/api/kollective/lens-declarations/
/api/kollective/reading-results/
```

Rules:

* Insights may compare baseline and derived readings.
* Insights must label all weighted/filtered readings clearly.
* Insights must not mutate upstream facts.

---

## 9.7 `frontend/services/admin.ts`

Role:

```txt
Route/domain service for /ethikos/admin/* screens.
```

Current graph status:

```yaml
CURRENT_MAPPING: "unmapped"
```

Future allowed targets:

```txt
/api/ethikos/moderation-actions/
/api/ethikos/discussion-participant-roles/
/api/ethikos/discussion-visibility-settings/
/api/ethikos/audit-events/
```

Until backend endpoints exist, admin services MUST use mock/demo data only if clearly marked.

---

## 10. Request / Response Rules

## 10.1 ID Types

```yaml
CURRENT_ETHIKOS_ID_TYPE: "integer"
FRONTEND_ROUTE_PARAM_TYPE: "string"
SERVICE_LAYER_RESPONSIBILITY: "convert route string ids to numeric ids before API calls"
```

Example:

```ts
const topicId = Number(id);
if (!Number.isFinite(topicId)) {
  throw new Error("Invalid topic id");
}
```

---

## 10.2 Date Format

```yaml
DATE_FORMAT: "ISO_8601"
DATE_FIELDS_COMMON:
  - "created_at"
  - "updated_at"
  - "last_activity"
  - "timestamp"
  - "computed_at"
```

Services MAY adapt dates for UI display, but MUST NOT change canonical API date fields.

---

## 10.3 Pagination

Current DRF endpoints may return either arrays or paginated results depending on ViewSet configuration.

Service functions SHOULD normalize where needed.

Recommended helper behavior:

```ts
type DrfList<T> = T[] | { results: T[] };

function unwrapList<T>(value: DrfList<T>): T[] {
  return Array.isArray(value) ? value : value.results;
}
```

---

## 10.4 Errors

Backend errors SHOULD remain DRF-compatible.

Frontend services SHOULD normalize errors into:

```ts
type ServiceError = {
  message: string;
  status?: number;
  details?: unknown;
};
```

Do not hide backend validation errors during Kintsugi work.

---

## 11. Authentication, Authorization, and CSRF

## 11.1 Authentication

Current assumptions:

```yaml
AUTH_USER_MODEL: "users.User"
AUTH_REQUIRED_FOR_WRITES: true
PUBLIC_READ_ALLOWED_FOR_CORE_DELIBERATION: true
```

Default rules:

```yaml
GET_PUBLIC_TOPICS: "allowed"
GET_PUBLIC_ARGUMENTS: "allowed"
GET_PUBLIC_CATEGORIES: "allowed"
POST_TOPIC: "authenticated"
POST_STANCE: "authenticated"
POST_ARGUMENT: "authenticated"
POST_VOTE: "authenticated"
POST_READING_RESULT: "trusted/admin/system"
```

---

## 11.2 Ownership

Current backend permissions include an owner-or-read-only pattern for topics, stances, and arguments. Topic ownership uses `created_by`; stance/argument ownership uses `user`. 

Contract:

```yaml
TOPIC_OWNER_FIELD: "created_by"
STANCE_OWNER_FIELD: "user"
ARGUMENT_OWNER_FIELD: "user"
SAFE_METHODS_PUBLIC_READ: true
WRITE_OWNER_OR_ADMIN: true
```

---

## 11.3 CSRF

For browser-originated writes, service modules MUST use the existing request helper or client mechanism that already handles CSRF/session behavior.

Do not implement a second CSRF client.

Do not bypass CSRF to “fix” write failures.

---

## 12. Endpoint Status Matrix

| Endpoint                              |             Status | Owner                   | Frontend service                         | Notes                            |
| ------------------------------------- | -----------------: | ----------------------- | ---------------------------------------- | -------------------------------- |
| `/api/ethikos/topics/`                |  canonical current | Korum                   | `ethikos`, `deliberate`, `pulse`         | Keep stable                      |
| `/api/ethikos/topics/{id}/preview/`   |     current/target | Korum                   | `deliberate`                             | Must fix preview shape if needed |
| `/api/ethikos/stances/`               |  canonical current | Korum                   | `ethikos`, `decide`, `pulse`, `insights` | Topic-level stance only          |
| `/api/ethikos/arguments/`             |  canonical current | Korum                   | `ethikos`, `deliberate`, `pulse`         | Argument graph base              |
| `/api/ethikos/categories/`            |   optional current | ethiKos core            | `ethikos`, `deliberate`                  | Read-only default                |
| `/api/kollective/votes/`              |   optional current | Smart Vote / Kollective | `decide`                                 | Formal vote, not stance          |
| `/api/kollective/vote-results/`       |   optional current | Smart Vote / Kollective | `decide`, `insights`                     | Baseline result, not reading     |
| `/api/deliberate/...`                 |      compatibility | Korum                   | `deliberate`                             | Transitional alias               |
| `/api/deliberate/elite/...`           |      compatibility | Korum                   | `deliberate`                             | Transitional alias               |
| `/api/home/*`                         | legacy/problematic | legacy                  | none preferred                           | Do not expand                    |
| `/api/ethikos/decision-protocols/`    |           proposed | Konsultations/Decision  | `decide`                                 | Requires model/serializer        |
| `/api/ethikos/decision-records/`      |           proposed | Konsultations/Decision  | `decide`                                 | Requires model/serializer        |
| `/api/kollective/lens-declarations/`  |           proposed | Smart Vote              | `decide`, `insights`                     | Requires model/serializer        |
| `/api/kollective/reading-results/`    |           proposed | Smart Vote              | `decide`, `insights`                     | Derived readings                 |
| `/api/ethikos/drafts/`                |           proposed | Drafting                | `drafting`, `decide`                     | Bounded drafting                 |
| `/api/ethikos/draft-versions/`        |           proposed | Drafting                | `drafting`                               | Version history                  |
| `/api/ethikos/amendments/`            |           proposed | Drafting                | `drafting`                               | Amendment workflow               |
| `/api/ethikos/impact-tracks/`         |           proposed | Konsultations           | `impact`                                 | Native impact truth              |
| `/api/ethikos/argument-sources/`      |           proposed | Korum                   | `deliberate`                             | Kialo-style sources              |
| `/api/ethikos/argument-impact-votes/` |           proposed | Korum                   | `deliberate`                             | Not stance, not ballot           |
| `/api/ethikos/argument-suggestions/`  |           proposed | Korum                   | `deliberate`                             | Role-aware suggestions           |

---

## 13. Compatibility Rules

## 13.1 Compatibility Aliases

Compatibility aliases may exist:

```txt
/api/deliberate/...
/api/deliberate/elite/...
```

Rules:

```yaml
MAY_KEEP_FOR_EXISTING_FRONTEND: true
MAY_USE_FOR_TRANSITION: true
MUST_NOT_BE_PRIMARY_FOR_NEW_DOCS: true
MUST_NOT_EXPAND_IF_CANONICAL_ETHIKOS_ENDPOINT_EXISTS: true
```

---

## 13.2 Legacy Home API

Legacy home endpoints:

```txt
/api/home/categories/
/api/home/debatecategory/
/api/home/debatetopic/
/api/home/responseformat/
/api/home/publicvote/
/api/home/debatetopic/{id}/vote
```

Rules:

```yaml
MAY_ADD_NEW_HOME_ENDPOINTS: false
MAY_WRAP_EXISTING_HOME_ENDPOINTS_TEMPORARILY: true
MUST_CREATE_REPLACEMENT_PLAN: true
TARGET_REPLACEMENT_PREFIXES:
  - "/api/ethikos/"
  - "/api/kollective/"
```

---

## 14. Service Function Naming Rules

Service function names SHOULD be domain-readable and stable.

Preferred examples:

```ts
fetchEthikosTopics()
fetchTopicDetail(topicId)
fetchTopicPreview(topicId)
createEthikosTopic(payload)
submitTopicStance(topicId, value)
fetchTopicArguments(topicId)
createTopicArgument(payload)

fetchPublicBallots()
submitPublicVote(ballotId, payload)
fetchDecisionResults()
fetchReadingResults(params)

fetchImpactTracks()
updateImpactTrackStatus(id, payload)

submitArgumentImpactVote(argumentId, value)
submitArgumentSuggestion(topicId, payload)
attachArgumentSource(argumentId, payload)
```

Avoid vague names:

```ts
getData()
postVote()
loadStuff()
submit()
fetchPreviewData()
```

---

## 15. Cross-Service Ownership Rules

## 15.1 Deliberate / Korum

Allowed data sources:

```txt
/api/ethikos/topics/
/api/ethikos/stances/
/api/ethikos/arguments/
/api/ethikos/categories/
```

Future allowed data sources:

```txt
/api/ethikos/argument-sources/
/api/ethikos/argument-impact-votes/
/api/ethikos/argument-suggestions/
```

Must not call:

```txt
/api/home/*
```

---

## 15.2 Decide / Smart Vote

Allowed data sources:

```txt
/api/kollective/votes/
/api/kollective/vote-results/
```

Future allowed data sources:

```txt
/api/ethikos/decision-protocols/
/api/ethikos/decision-records/
/api/kollective/lens-declarations/
/api/kollective/reading-results/
```

Must not confuse:

```txt
EthikosStance != Vote
ArgumentImpactVote != Vote
ReadingResult != Vote
```

---

## 15.3 Impact / Konsultations

Target data source:

```txt
/api/ethikos/impact-tracks/
```

Transitional data source:

```txt
/api/keenkonnect/projects/
```

Rule:

```txt
KeenKonnect may represent project handoff, but it must not own civic accountability truth.
```

---

## 15.4 Trust / EkoH

Allowed future data source:

```txt
/api/ekoh/*
```

or existing EkoH-backed services if present.

Trust screens MAY display:

* expertise context;
* credential context;
* ethical context;
* cohort eligibility context.

Trust screens MUST NOT:

* compute formal votes;
* mutate Smart Vote readings;
* mutate ethiKos stances.

---

## 16. Backend Implementation Rules

When adding a new endpoint:

1. Add model only if approved by `08_DATA_MODEL_AND_MIGRATION_PLAN.md`.
2. Add serializer only if payload is approved by `13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md`.
3. Add ViewSet in the owning app.
4. Register the route in `backend/config/api_router.py`.
5. Add tests.
6. Update this document if the endpoint becomes canonical.

Required backend pattern:

```python
router.register("ethikos/<resource>", ViewSet, basename="ethikos-<resource>")
```

or for Kollective:

```python
router.register("kollective/<resource>", ViewSet, basename="kollective-<resource>")
```

Do not register Kintsugi endpoints under:

```txt
/api/home/*
/api/deliberation/*
/api/kialo/*
/api/kintsugi/*
```

unless a future ADR explicitly changes the route policy.

---

## 17. Frontend Implementation Rules

When adding or changing a frontend API call:

1. Add or update a function in `frontend/services/*`.
2. Use the existing shared request helper.
3. Keep path fragments relative to `/api/` if that is the current service convention.
4. Normalize IDs and payloads in the service layer.
5. Keep page components focused on UI state and rendering.
6. Update related tests or smoke coverage.

Do not:

```txt
- add raw fetches inside page components;
- duplicate HTTP client code;
- introduce a second API helper;
- bypass CSRF/session handling;
- call /api/home/* for new Kintsugi work;
- create /api/kialo/* for Kialo-style features;
- create /api/kintsugi/* as a parallel API universe.
```

---

## 18. Testing Contract

Minimum tests for current canonical endpoints:

```yaml
ETHIKOS_TOPICS:
  - "GET list"
  - "POST create authenticated"
  - "GET detail"

ETHIKOS_STANCES:
  - "POST value within -3..+3"
  - "Reject value outside -3..+3"
  - "Filter by topic"

ETHIKOS_ARGUMENTS:
  - "POST top-level argument"
  - "POST child argument with parent"
  - "Filter by topic"

ETHIKOS_CATEGORIES:
  - "GET list if ViewSet exists"

KOLLECTIVE_VOTES:
  - "POST vote if VoteViewSet exists"
```

The existing smoke test already verifies API docs access, `/api/users/me/`, Ethikos topic list, stance POST, argument POST, and Kollective vote behavior where present. 

Future tests for Kintsugi endpoints must be added only when the endpoints are implemented.

---

## 19. Anti-Drift Rules

The following are absolute rules for this document.

```yaml
ANTI_DRIFT_RULES:
  - "Do not rename /api/ethikos/... to /api/deliberation/..."
  - "Do not create /api/kialo/*."
  - "Do not create /api/kintsugi/* as a parallel core API."
  - "Do not expand /api/home/*."
  - "Do not treat compatibility aliases as canonical."
  - "Do not let frontend pages bypass the service layer."
  - "Do not use GraphQL for core CRUD."
  - "Do not use WebSockets for core CRUD."
  - "Do not treat EthikosStance as Smart Vote ballot."
  - "Do not treat ArgumentImpactVote as EthikosStance."
  - "Do not treat ReadingResult as source fact."
  - "Do not let Smart Vote mutate Korum or Konsultations core records."
  - "Do not let EkoH become the voting engine."
  - "Do not make KeenKonnect Project the source of truth for civic impact."
```

---

## 20. Non-Goals

This document does not authorize:

* a full external OSS merge;
* a new Kialo backend app;
* a new Kintsugi backend app;
* a replacement of existing ethiKos routes;
* a replacement of existing ethiKos models;
* a GraphQL rewrite;
* a realtime rewrite;
* direct database writes from external tools;
* moving civic impact truth into KeenKonnect;
* using `/api/home/*` as the future decision API.

---

## 21. Related Documents

```txt
00_KINTSUGI_START_HERE.md
02_SOURCE_OF_TRUTH_AND_DRIFT_CONTROL.md
03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md
04_CANONICAL_NAMING_AND_VARIABLES.md
05_CURRENT_STATE_BASELINE.md
06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md
08_DATA_MODEL_AND_MIGRATION_PLAN.md
09_SMART_VOTE_EKOH_READING_CONTRACT.md
12_CANONICAL_OBJECTS_AND_EVENTS.md
13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md
14_FRONTEND_ALIGNMENT_CONTRACT.md
15_BACKEND_ALIGNMENT_CONTRACT.md
16_TEST_AND_SMOKE_CONTRACT.md
20_AI_GENERATION_GUARDRAILS.md
21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md
22_IMPLEMENTATION_BACKLOG_TEMPLATE.md
```

---

## 22. Final Contract Summary

The Kintsugi upgrade MUST preserve the current API center of gravity:

```txt
/api/ethikos/*
/api/kollective/*
```

The frontend MUST preserve the current service center of gravity:

```txt
frontend/services/*
```

The first-pass Kintsugi upgrade MUST formalize and extend existing contracts, not create a parallel system.

Canonical current endpoints:

```txt
/api/ethikos/topics/
/api/ethikos/stances/
/api/ethikos/arguments/
/api/ethikos/categories/
/api/kollective/votes/
/api/kollective/vote-results/
```

Forbidden drift endpoints:

```txt
/api/home/*
/api/kialo/*
/api/kintsugi/*
/api/deliberation/*
```

Final rule:

```txt
If a new API or service path does not map clearly to Korum, Konsultations, Smart Vote, EkoH, or an approved Kintsugi boundary object, it must not be introduced.
```

---

## V4.1 EkoH profile access extension

`GET /api/v1/ekoh/profile/{uid}/` remains the canonical EkoH profile endpoint. The response now carries `rating_visibility`, `rating_publication_basis`, and a backend-resolved `rating_access` decision. `expertise`, `ethics_score`, and `score_history` MUST be null when the caller lacks the required EkoH rating access. The service authority is `resolve_rating_access(viewer, subject)`. See `27_EKOH_RATING_VISIBILITY_AND_ACCESS_CONTRACT.md`.

