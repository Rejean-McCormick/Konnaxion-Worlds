# 13 — Payload Shapes and Serializer Contracts

**Document ID:** `13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md`
**Pack:** ethiKos Kintsugi Update Documentation Pack
**Status:** Canonical / Technical Contract
**Last aligned:** 2026-04-25
**Primary purpose:** Fix request/response payload shapes, serializer responsibilities, naming conventions, enum values, and frontend/backend normalization rules for the ethiKos Kintsugi upgrade.

---

## 1. Purpose

This document defines the canonical JSON payload shapes and serializer contracts for the ethiKos Kintsugi upgrade.

It prevents drift between:

* frontend TypeScript interfaces;
* Django REST Framework serializers;
* backend viewsets;
* service-layer adapters;
* future Kintsugi models;
* Smart Vote readings;
* EkoH snapshot references;
* Kialo-style argument mapping;
* Konsultations-style suggestions, ballots, and impact tracking.

The current ethiKos backend core is centered on `EthikosTopic`, `EthikosStance`, `EthikosArgument`, and `EthikosCategory`, exposed under `/api/ethikos/topics/`, `/api/ethikos/stances/`, `/api/ethikos/arguments/`, and `/api/ethikos/categories/` when registered. Compatibility aliases also exist under `/api/deliberate/...` and `/api/deliberate/elite/...`. 

---

## 2. Scope

This document covers:

* current ethiKos payloads;
* current serializer behavior that must remain stable;
* frontend normalization rules;
* Kintsugi first-pass additive payloads;
* Smart Vote / EkoH reading payloads;
* Kialo-style deliberation payloads;
* drafting payloads;
* impact/accountability payloads;
* error response shapes;
* pagination shape expectations;
* enum and value constraints.

This document does not authorize implementation by itself. New models, migrations, endpoints, and serializers must still be governed by:

* `07_API_AND_SERVICE_CONTRACTS.md`
* `08_DATA_MODEL_AND_MIGRATION_PLAN.md`
* `09_SMART_VOTE_EKOH_READING_CONTRACT.md`
* `14_FRONTEND_ALIGNMENT_CONTRACT.md`
* `15_BACKEND_ALIGNMENT_CONTRACT.md`
* `22_IMPLEMENTATION_BACKLOG_TEMPLATE.md`

---

## 3. Canonical Variables Used

```yaml
DOCUMENT_NAME: "13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md"
DOCUMENT_ROLE: "Payload and serializer contract"

API_STYLE: "Django REST Framework ViewSet + Serializer + Router"
TRANSPORT: "REST over HTTP"
GRAPHQL_FOR_CRUD_ALLOWED: false
WEBSOCKET_FOR_CRUD_ALLOWED: false

BACKEND_JSON_FIELD_STYLE: "snake_case"
FRONTEND_INTERNAL_FIELD_STYLE: "camelCase allowed after normalization"
DATE_FORMAT: "ISO_8601"
CURRENT_ID_TYPE: "integer"
PAGINATION_STYLE: "DRF-compatible"

PRIMARY_API_PREFIX: "/api/ethikos/"
CURRENT_ETHIKOS_ENDPOINTS:
  TOPICS: "/api/ethikos/topics/"
  STANCES: "/api/ethikos/stances/"
  ARGUMENTS: "/api/ethikos/arguments/"
  CATEGORIES: "/api/ethikos/categories/"

COMPATIBILITY_ENDPOINTS:
  DELIBERATE: "/api/deliberate/..."
  DELIBERATE_ELITE: "/api/deliberate/elite/..."

LEGACY_ENDPOINTS:
  API_HOME: "/api/home/*"

CURRENT_ETHIKOS_MODELS:
  - "EthikosCategory"
  - "EthikosTopic"
  - "EthikosStance"
  - "EthikosArgument"

STANCE_VALUE_RANGE: "-3..+3"
ARGUMENT_SIDE_VALUES:
  - "pro"
  - "con"
  - "neutral"
  - null

KIALO_IMPACT_VOTE_RANGE: "0..4"
KIALO_IMPACT_VOTE_IS_TOPIC_STANCE: false

SMART_VOTE_READING_IS_SOURCE_FACT: false
SMART_VOTE_MUTATES_SOURCE_FACTS: false
EKOH_IS_VOTING_ENGINE: false
```

---

## 4. Source-of-Truth Rules

## 4.1 Backend Payload Truth

The backend API payload truth is DRF JSON using `snake_case`.

Backend serializers must expose field names that are stable, documented, and compatible with existing frontend service adapters.

## 4.2 Frontend Payload Truth

Frontend components may use normalized TypeScript shapes in `camelCase`, but raw API types must remain documented.

Frontend code must not invent backend field names.

Frontend service modules may normalize:

```txt
created_at -> createdAt
updated_at -> updatedAt
parent_id -> parentId
target_type -> targetType
target_id -> targetId
```

Normalization belongs in services/hooks/adapters, not scattered across page components.

The project guidance explicitly requires frontend API calls to use the services layer, respect existing `/api/...` path prefixes, avoid invented paths, and avoid renaming `/api/ethikos/...` to alternatives such as `/api/deliberation/...`. 

---

## 5. Serializer Design Principles

## 5.1 Stable Read / Flexible Write

Serializers SHOULD expose rich read fields but accept compact write fields.

Example:

* read may include `category_detail`;
* write may accept `category` or `category_id`;
* read may include `created_by`;
* write should inject `created_by` from the request user.

The current `TopicViewSet` injects `created_by` and resolves category from either `category` or `category_id`, while categories are exposed through a read-only viewset by default. 

## 5.2 Explicit Ownership

Serializer names must match the owning domain.

Examples:

```txt
EthikosTopicSerializer
EthikosStanceSerializer
EthikosArgumentSerializer
EthikosCategorySerializer
ReadingResultSerializer
LensDeclarationSerializer
ArgumentImpactVoteSerializer
ArgumentSourceSerializer
```

Do not create ambiguous names such as:

```txt
VoteSerializer
PostSerializer
OpinionSerializer
ClaimSerializer
GenericResultSerializer
```

unless the relevant ownership contract explicitly approves them.

## 5.3 No Silent Semantic Collapse

Serializers must not collapse distinct concepts:

| Concept              | Must remain distinct from                     |
| -------------------- | --------------------------------------------- |
| `EthikosStance`      | `ArgumentImpactVote`, `ReadingResult`, ballot |
| `ArgumentImpactVote` | topic stance, Smart Vote ballot               |
| `ReadingResult`      | raw stance, raw ballot, source fact           |
| `EkoHSnapshot`       | vote, reading, ballot                         |
| `DraftVersion`       | decision outcome                              |
| `ImpactTrack`        | KeenKonnect project                           |

---

## 6. API Envelope and Pagination

## 6.1 List Response Compatibility

The current frontend must tolerate both DRF paginated and bare-list responses where legacy code already does so.

Allowed list shapes:

```json
[
  {
    "id": 1
  }
]
```

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1
    }
  ]
}
```

New endpoints SHOULD use standard DRF pagination where appropriate.

Frontend adapters SHOULD normalize both forms into arrays.

The current frontend Smart Vote polling code already handles both a bare list and a paginated `{ "results": [...] }` shape when reading `/api/kollective/votes/`. 

## 6.2 Detail Response Shape

Detail endpoints SHOULD return a single JSON object.

```json
{
  "id": 1,
  "created_at": "2026-04-25T15:28:01Z",
  "updated_at": "2026-04-25T15:28:01Z"
}
```

## 6.3 Error Response Shape

Use DRF-compatible error responses.

Field-level error:

```json
{
  "value": ["Ensure this value is greater than or equal to -3."]
}
```

Non-field error:

```json
{
  "non_field_errors": ["Invalid payload."]
}
```

Detail error:

```json
{
  "detail": "Not found."
}
```

Kintsugi-specific serializers MAY add stable error codes later, but they must remain compatible with DRF clients.

---

## 7. Current Canonical ethiKos Payloads

## 7.1 `EthikosCategoryPayload`

### Owner

```yaml
OWNER: "ethiKos"
MODEL: "EthikosCategory"
ENDPOINT: "/api/ethikos/categories/"
CURRENT_STATUS: "current canonical model; endpoint only if registered"
```

### Read Shape

```json
{
  "id": 1,
  "name": "Climate",
  "description": "Topics related to climate policy."
}
```

### Write Shape

Categories are read-only by default unless an admin endpoint explicitly permits writes.

```json
{
  "name": "Climate",
  "description": "Topics related to climate policy."
}
```

### Serializer Rules

* `id` is read-only.
* `name` is required.
* `description` may be blank.
* Public category listing may allow `AllowAny`.

The current contracts describe `EthikosCategory` as a topic grouping with `name` and `description`. 

---

## 7.2 `EthikosTopicPayload`

### Owner

```yaml
OWNER: "Korum / ethiKos"
MODEL: "EthikosTopic"
ENDPOINT: "/api/ethikos/topics/"
```

### Read Shape

```json
{
  "id": 42,
  "title": "Should the city prioritize protected bike lanes?",
  "description": "A structured public deliberation about mobility priorities.",
  "status": "open",
  "category": 3,
  "category_detail": {
    "id": 3,
    "name": "Mobility",
    "description": "Transport and public space."
  },
  "created_by": 7,
  "created_by_display": "alice",
  "expertise_category": 12,
  "total_votes": 18,
  "last_activity": "2026-04-25T15:00:00Z",
  "created_at": "2026-04-25T14:00:00Z",
  "updated_at": "2026-04-25T15:00:00Z"
}
```

### Minimum Read Shape

Serializers may omit nested display fields, but must preserve the core shape:

```json
{
  "id": 42,
  "title": "Should the city prioritize protected bike lanes?",
  "description": "A structured public deliberation about mobility priorities.",
  "status": "open",
  "category": 3,
  "created_by": 7,
  "total_votes": 18,
  "last_activity": "2026-04-25T15:00:00Z",
  "created_at": "2026-04-25T14:00:00Z",
  "updated_at": "2026-04-25T15:00:00Z"
}
```

### Create Shape

```json
{
  "title": "Should the city prioritize protected bike lanes?",
  "description": "A structured public deliberation about mobility priorities.",
  "category": 3
}
```

Also accepted for compatibility:

```json
{
  "title": "Should the city prioritize protected bike lanes?",
  "description": "A structured public deliberation about mobility priorities.",
  "category_id": 3
}
```

### Update Shape

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "closed",
  "category": 4
}
```

### Allowed `status`

```yaml
TOPIC_STATUS:
  - "open"
  - "closed"
  - "archived"
```

### Serializer Rules

* `id` is read-only.
* `created_by` is read-only and injected from request user.
* `created_by_display` is read-only if present.
* `total_votes` is read-only unless explicitly managed by backend logic.
* `last_activity` is read-only unless explicitly managed by backend logic.
* `category` is required on create.
* `category` is optional on update.
* `status` must be one of `open`, `closed`, `archived`.

`EthikosTopic` is documented as the debate/consultation prompt with `status`, category, creator, vote totals, and activity timestamps. 

---

## 7.3 `EthikosTopicPreviewPayload`

### Owner

```yaml
OWNER: "Korum / ethiKos"
MODEL: "EthikosTopic"
LIKELY_ACTION: "TopicViewSet.preview"
ENDPOINT_PATTERN: "/api/ethikos/topics/{id}/preview/"
CURRENT_BUG_CONTEXT: "Deliberate preview drawer shows 'Preview / No data'"
```

### Read Shape

```json
{
  "id": 42,
  "title": "Should the city prioritize protected bike lanes?",
  "description": "A structured public deliberation about mobility priorities.",
  "status": "open",
  "category": {
    "id": 3,
    "name": "Mobility"
  },
  "stats": {
    "stance_count": 18,
    "argument_count": 9,
    "pro_count": 4,
    "con_count": 3,
    "neutral_count": 2
  },
  "last_activity": "2026-04-25T15:00:00Z"
}
```

### Serializer Rules

* This payload is a read-only preview projection.
* It must not replace `EthikosTopicPayload`.
* The preview drawer must accept this shape explicitly.
* If the backend returns only the minimal topic shape, the frontend adapter must normalize it into this preview shape.

The backend code contains a `preview` action intended to return a minimal topic preview compatible with frontend usage like `topics/{id}/preview`. 

---

## 7.4 `EthikosStancePayload`

### Owner

```yaml
OWNER: "Korum"
MODEL: "EthikosStance"
ENDPOINT: "/api/ethikos/stances/"
LEVEL: "topic-level"
RANGE: "-3..+3"
```

### Read Shape

```json
{
  "id": 1001,
  "topic": 42,
  "user": 7,
  "user_display": "alice",
  "value": 2,
  "timestamp": "2026-04-25T15:10:00Z"
}
```

### Create / Update Shape

```json
{
  "topic": 42,
  "value": 2
}
```

### Allowed `value`

```yaml
STANCE_VALUE_RANGE:
  MIN: -3
  MAX: 3
  INTEGER_ONLY: true
```

Semantic labels:

```yaml
-3: "Strongly against"
-2: "Moderately against"
-1: "Somewhat against"
0: "Neutral / undecided"
1: "Somewhat for"
2: "Moderately for"
3: "Strongly for"
```

### Serializer Rules

* `id` is read-only.
* `user` is read-only and injected from request user.
* `timestamp` is read-only.
* `topic` is required.
* `value` is required.
* `value` must be an integer between `-3` and `3`.
* A user should have one stance per topic.
* Updating a stance should upsert or replace the user’s previous stance, depending on backend implementation.

The current docs and frontend logic use `EthikosStance` as one user’s numeric topic-level position, constrained to `-3 … +3`; consultation-result hooks aggregate stance rows returned from `/api/ethikos/stances/?topic=<consultationId>`.  

---

## 7.5 `EthikosArgumentPayload`

### Owner

```yaml
OWNER: "Korum"
MODEL: "EthikosArgument"
ENDPOINT: "/api/ethikos/arguments/"
LEVEL: "argument/thread-entry"
```

### Read Shape

```json
{
  "id": 501,
  "topic": 42,
  "user": 7,
  "user_display": "alice",
  "content": "Protected bike lanes reduce severe injuries and improve access.",
  "side": "pro",
  "parent": null,
  "parent_id": null,
  "is_hidden": false,
  "created_at": "2026-04-25T15:12:00Z",
  "updated_at": "2026-04-25T15:12:00Z"
}
```

### Create Shape

```json
{
  "topic": 42,
  "content": "Protected bike lanes reduce severe injuries and improve access.",
  "side": "pro",
  "parent": null
}
```

### Reply Create Shape

```json
{
  "topic": 42,
  "content": "This depends on street design and winter maintenance.",
  "side": "con",
  "parent": 501
}
```

### Allowed `side`

```yaml
ARGUMENT_SIDE:
  - "pro"
  - "con"
  - "neutral"
  - null
```

### Serializer Rules

* `id` is read-only.
* `user` is read-only and injected from request user.
* `topic` is required.
* `content` is required.
* `side` is optional.
* `parent` is optional.
* `parent_id` may be exposed for frontend compatibility.
* `is_hidden` is read-only for normal users and writable only through moderation/admin flows.
* `created_at` and `updated_at` are read-only.

The current frontend documents a raw argument shape returned from `/api/ethikos/arguments/`, including optional `parent` and `parent_id` fields depending on serializer configuration; Konsultations suggestions currently normalize Ethikos arguments into suggestion objects. 

---

## 8. Kialo-Style Deliberation Payloads

## 8.1 `ArgumentTreePayload`

### Owner

```yaml
OWNER: "Korum"
ROUTE_SCOPE: "/ethikos/deliberate/*"
SOURCE_PATTERN: "Kialo-style structured argument mapping"
```

### Read Shape

```json
{
  "topic": {
    "id": 42,
    "title": "Should the city prioritize protected bike lanes?",
    "description": "A structured public deliberation about mobility priorities.",
    "status": "open"
  },
  "root_nodes": [
    {
      "id": 501,
      "topic": 42,
      "content": "Protected bike lanes reduce severe injuries and improve access.",
      "side": "pro",
      "parent": null,
      "children": [],
      "source_count": 2,
      "impact_summary": {
        "average": 3.5,
        "count": 12
      }
    }
  ],
  "settings": {
    "topology": "single_thesis",
    "author_visibility": "all",
    "vote_visibility": "all",
    "participation_type": "standard"
  }
}
```

### Serializer Rules

* This is a projection over `EthikosTopic` and `EthikosArgument`.
* It must not replace the canonical `EthikosArgumentPayload`.
* It may be assembled in a service layer instead of a database model.
* Children must preserve stable IDs.
* The tree must distinguish `side` from stance.

---

## 8.2 `ArgumentNodePayload`

### Read Shape

```json
{
  "id": 501,
  "topic": 42,
  "user": 7,
  "user_display": "alice",
  "content": "Protected bike lanes reduce severe injuries and improve access.",
  "side": "pro",
  "parent": null,
  "depth": 0,
  "path": [501],
  "is_hidden": false,
  "source_count": 2,
  "impact_summary": {
    "average": 3.5,
    "count": 12,
    "my_vote": 4
  },
  "created_at": "2026-04-25T15:12:00Z",
  "updated_at": "2026-04-25T15:12:00Z"
}
```

### Serializer Rules

* `depth` and `path` are computed projection fields.
* `impact_summary` is computed from `ArgumentImpactVote`.
* `my_vote` is included only for authenticated users.
* Hidden arguments should not expose content to unauthorized users.

---

## 8.3 `ArgumentSourcePayload`

### Owner

```yaml
OWNER: "Korum"
PROPOSED_MODEL: "ArgumentSource"
ATTACHES_TO: "EthikosArgument"
```

### Read Shape

```json
{
  "id": 9001,
  "argument": 501,
  "url": "https://example.org/safety-study",
  "title": "Road Safety Study",
  "publisher": "Example Institute",
  "published_at": "2025-11-01",
  "excerpt": "Short excerpt or summary.",
  "added_by": 7,
  "created_at": "2026-04-25T15:20:00Z",
  "updated_at": "2026-04-25T15:20:00Z"
}
```

### Create Shape

```json
{
  "argument": 501,
  "url": "https://example.org/safety-study",
  "title": "Road Safety Study",
  "publisher": "Example Institute",
  "published_at": "2025-11-01",
  "excerpt": "Short excerpt or summary."
}
```

### Serializer Rules

* `argument` is required.
* `url` is required unless a future non-URL source type is defined.
* `title` is recommended.
* `added_by` is injected from request user.
* Sources must not be used as hidden weights.
* Sources must remain attached to arguments, not to Smart Vote readings.

---

## 8.4 `ArgumentImpactVotePayload`

### Owner

```yaml
OWNER: "Korum"
PROPOSED_MODEL: "ArgumentImpactVote"
LEVEL: "argument/claim-level"
RANGE: "0..4"
NOT_A_TOPIC_STANCE: true
NOT_A_SMART_VOTE_BALLOT: true
```

### Read Shape

```json
{
  "id": 3001,
  "argument": 501,
  "user": 7,
  "value": 4,
  "created_at": "2026-04-25T15:30:00Z",
  "updated_at": "2026-04-25T15:30:00Z"
}
```

### Create / Update Shape

```json
{
  "argument": 501,
  "value": 4
}
```

### Allowed `value`

```yaml
ARGUMENT_IMPACT_VALUE:
  MIN: 0
  MAX: 4
  INTEGER_ONLY: true
```

### Serializer Rules

* `argument` is required.
* `value` is required.
* `value` must be integer `0..4`.
* `user` is injected from request user.
* One user should have one impact vote per argument.
* This payload must never be merged with `EthikosStancePayload`.

---

## 8.5 `ArgumentSuggestionPayload`

### Owner

```yaml
OWNER: "Korum"
PROPOSED_MODEL: "ArgumentSuggestion"
ROLES_RELATED:
  - "suggester"
  - "editor"
  - "admin"
  - "owner"
```

### Read Shape

```json
{
  "id": 7101,
  "topic": 42,
  "parent": 501,
  "suggested_side": "pro",
  "content": "A possible supporting claim.",
  "status": "pending",
  "suggested_by": 9,
  "reviewed_by": null,
  "accepted_argument": null,
  "created_at": "2026-04-25T15:40:00Z",
  "updated_at": "2026-04-25T15:40:00Z"
}
```

### Create Shape

```json
{
  "topic": 42,
  "parent": 501,
  "suggested_side": "pro",
  "content": "A possible supporting claim."
}
```

### Allowed `status`

```yaml
ARGUMENT_SUGGESTION_STATUS:
  - "pending"
  - "accepted"
  - "rejected"
```

### Serializer Rules

* Suggestions must not publish directly as arguments unless accepted by an authorized role.
* `accepted_argument` links to the created `EthikosArgument` after approval.
* Suggested content must preserve author/audit metadata.

---

## 8.6 `DiscussionSettingsPayload`

### Owner

```yaml
OWNER: "Korum"
PROPOSED_MODEL: "DiscussionVisibilitySetting"
ATTACHES_TO: "EthikosTopic"
```

### Read / Write Shape

```json
{
  "topic": 42,
  "topology": "single_thesis",
  "participation_type": "standard",
  "author_visibility": "all",
  "vote_visibility": "all",
  "suggestions_enabled": true,
  "sources_required": false,
  "created_at": "2026-04-25T15:00:00Z",
  "updated_at": "2026-04-25T15:00:00Z"
}
```

### Enums

```yaml
DISCUSSION_TOPOLOGY:
  - "single_thesis"
  - "multi_thesis"

PARTICIPATION_TYPE:
  - "standard"
  - "anonymous"

AUTHOR_VISIBILITY:
  - "never"
  - "admins_only"
  - "all"

VOTE_VISIBILITY:
  - "all"
  - "admins_only"
  - "self_only"
```

### Serializer Rules

* Anonymous mode must not remove admin auditability.
* Author visibility must not expose anonymous identities to normal participants.
* Vote visibility controls claim-level impact votes, not topic-level stance visibility unless explicitly documented.

---

## 8.7 `ParticipantRolePayload`

### Owner

```yaml
OWNER: "Korum"
PROPOSED_MODEL: "DiscussionParticipantRole"
ATTACHES_TO: "EthikosTopic"
```

### Read Shape

```json
{
  "id": 8101,
  "topic": 42,
  "user": 7,
  "role": "editor",
  "assigned_by": 1,
  "created_at": "2026-04-25T15:00:00Z",
  "updated_at": "2026-04-25T15:00:00Z"
}
```

### Create / Update Shape

```json
{
  "topic": 42,
  "user": 7,
  "role": "editor"
}
```

### Allowed `role`

```yaml
DISCUSSION_ROLE:
  - "owner"
  - "admin"
  - "editor"
  - "writer"
  - "suggester"
  - "viewer"
```

### Serializer Rules

* `owner` should be unique or controlled per topic.
* Role assignment requires admin/owner-level permission.
* Role changes must be auditable.

---

## 9. Konsultations Payloads

## 9.1 `ConsultationSuggestionPayload`

### Owner

```yaml
OWNER: "Konsultations"
CURRENT_BACKING_SOURCE: "EthikosArgument when mapped to topic suggestions"
CURRENT_FRONTEND_NORMALIZATION: "Suggestion"
```

### Normalized Frontend Shape

```json
{
  "id": "501",
  "consultationId": "42",
  "author": "alice",
  "body": "Protected bike lanes should be prioritized.",
  "createdAt": "2026-04-25T15:12:00Z",
  "parentId": null
}
```

### Create Shape

```json
{
  "body": "Protected bike lanes should be prioritized.",
  "parentId": null
}
```

### Backend Write Projection

When backed by `EthikosArgument`, the service adapter posts:

```json
{
  "topic": 42,
  "content": "Protected bike lanes should be prioritized.",
  "parent": null
}
```

### Serializer Rules

* This is a projection, not a new canonical backend truth unless future Konsultations models are added.
* `consultationId` maps to `EthikosTopic.id` in the current implementation.
* `body` maps to `EthikosArgument.content`.
* `parentId` maps to `EthikosArgument.parent`.

The current frontend hook reads consultation suggestions from `ethikos/arguments/`, maps `EthikosArgumentApi` into a normalized `Suggestion`, and posts suggestions back to `ethikos/arguments/`. 

---

## 9.2 `ConsultationResultsPayload`

### Owner

```yaml
OWNER: "Konsultations"
CURRENT_BACKING_SOURCE: "EthikosStance rows aggregated by topic"
```

### Read Shape

```json
{
  "consultation_id": 42,
  "stats": {
    "total": 18,
    "average": 1.2,
    "counts": {
      "-3": 1,
      "-2": 1,
      "-1": 2,
      "0": 3,
      "1": 4,
      "2": 5,
      "3": 2
    }
  },
  "buckets": [
    {
      "value": -3,
      "label": "Strongly against",
      "count": 1,
      "share": 0.0556
    },
    {
      "value": 3,
      "label": "Strongly for",
      "count": 2,
      "share": 0.1111
    }
  ]
}
```

### Serializer Rules

* This can be a frontend-computed aggregate or backend projection.
* It must preserve raw stance counts.
* It must not be confused with `ReadingResultPayload`.
* If weighted readings are included, they must be nested under a separate `readings` key.

---

## 10. Smart Vote / EkoH Payloads

## 10.1 `LensDeclarationPayload`

### Owner

```yaml
OWNER: "Smart Vote"
PURPOSE: "Declare how a derived reading is computed"
```

### Read Shape

```json
{
  "id": 1201,
  "reading_key": "expertise_weighted_mobility",
  "label": "Expertise-weighted mobility reading",
  "description": "Weights baseline stance events using declared mobility expertise context.",
  "target_type": "ethikos_topic",
  "target_id": 42,
  "method": "weighted_average",
  "parameters": {
    "weight_source": "ekoh_snapshot",
    "domain": "mobility",
    "min_confidence": 0.6
  },
  "lens_hash": "sha256:abc123",
  "created_by": 1,
  "created_at": "2026-04-25T16:00:00Z",
  "updated_at": "2026-04-25T16:00:00Z"
}
```

### Create Shape

```json
{
  "reading_key": "expertise_weighted_mobility",
  "label": "Expertise-weighted mobility reading",
  "description": "Weights baseline stance events using declared mobility expertise context.",
  "target_type": "ethikos_topic",
  "target_id": 42,
  "method": "weighted_average",
  "parameters": {
    "weight_source": "ekoh_snapshot",
    "domain": "mobility",
    "min_confidence": 0.6
  }
}
```

### Serializer Rules

* `reading_key` is required and stable.
* `lens_hash` is computed from method and parameters.
* `parameters` must be JSON-serializable.
* A lens must not mutate source events.

---

## 10.2 `ReadingResultPayload`

### Owner

```yaml
OWNER: "Smart Vote"
PURPOSE: "Published derived result"
NOT_SOURCE_FACT: true
```

### Read Shape

```json
{
  "id": 1301,
  "reading_key": "expertise_weighted_mobility",
  "lens_hash": "sha256:abc123",
  "snapshot_ref": "ekoh-snapshot-2026-04-25T16:00:00Z",
  "target_type": "ethikos_topic",
  "target_id": 42,
  "baseline_ref": {
    "source": "ethikos_stances",
    "topic": 42,
    "event_count": 18
  },
  "results_payload": {
    "score": 0.68,
    "distribution": {
      "-3": 0.03,
      "-2": 0.04,
      "-1": 0.08,
      "0": 0.12,
      "1": 0.21,
      "2": 0.34,
      "3": 0.18
    },
    "summary": "Weighted support is moderately positive."
  },
  "status": "published",
  "computed_at": "2026-04-25T16:05:00Z",
  "published_at": "2026-04-25T16:06:00Z"
}
```

### Serializer Rules

* `reading_key` is required.
* `lens_hash` is required.
* `snapshot_ref` is required when EkoH context is used.
* `results_payload` is required.
* `computed_at` is required.
* `target_type` and `target_id` are required.
* `ReadingResult` must not overwrite baseline.
* `ReadingResult` must not be treated as raw vote/stance truth.

The boundaries plan requires Smart Vote readings to remain additive, explicitly declared, and auditable with fields such as `reading_key`, `lens_hash`, `snapshot_ref` or `ekoh_snapshot_id`, and non-breaking additions only. 

---

## 10.3 `KollectiveVotePayload`

### Owner

```yaml
OWNER: "Kollective Intelligence / Smart Vote"
CURRENT_ENDPOINT: "/api/kollective/votes/"
```

### Read Shape

```json
{
  "id": 2001,
  "target_type": "ethikos_topic",
  "target_id": 42,
  "user": 7,
  "value": 1,
  "created_at": "2026-04-25T16:15:00Z",
  "updated_at": "2026-04-25T16:15:00Z"
}
```

### Create Shape

```json
{
  "target_type": "ethikos_topic",
  "target_id": 42,
  "value": 1
}
```

### Serializer Rules

* This is a Smart Vote / Kollective Intelligence vote primitive.
* It is not the same as `EthikosStance`.
* It is not the same as `ArgumentImpactVote`.
* `target_type` and `target_id` must remain explicit.
* Aggregation into readings belongs in Smart Vote logic.

The current code reads and posts Smart Vote poll data through `/api/kollective/votes/`, using `target_type` and `target_id` filters to aggregate poll results. 

---

## 11. Drafting Payloads

## 11.1 `DraftPayload`

### Owner

```yaml
OWNER: "ethiKos bounded drafting capability"
PROPOSED_MODEL: "Draft"
```

### Read Shape

```json
{
  "id": 4001,
  "topic": 42,
  "title": "Mobility Policy Draft",
  "status": "draft",
  "current_version": 3,
  "created_by": 7,
  "created_at": "2026-04-25T17:00:00Z",
  "updated_at": "2026-04-25T17:30:00Z"
}
```

### Create Shape

```json
{
  "topic": 42,
  "title": "Mobility Policy Draft"
}
```

### Allowed `status`

```yaml
DRAFT_STATUS:
  - "draft"
  - "review"
  - "accepted"
  - "superseded"
  - "archived"
```

### Serializer Rules

* A draft links to a topic or consultation source.
* A draft must not overwrite arguments or ballots.
* `current_version` is computed.

---

## 11.2 `DraftVersionPayload`

### Read Shape

```json
{
  "id": 4101,
  "draft": 4001,
  "version_number": 3,
  "body": "The city should prioritize protected bike lanes...",
  "summary": "Adds winter maintenance clause.",
  "created_by": 7,
  "created_at": "2026-04-25T17:30:00Z"
}
```

### Create Shape

```json
{
  "draft": 4001,
  "body": "The city should prioritize protected bike lanes...",
  "summary": "Adds winter maintenance clause."
}
```

### Serializer Rules

* `version_number` is server-assigned.
* Versions are append-only.
* Editing a draft creates a new version; it does not mutate historical versions.

---

## 11.3 `AmendmentPayload`

### Read Shape

```json
{
  "id": 4201,
  "draft": 4001,
  "draft_version": 4101,
  "target_text": "protected bike lanes",
  "proposed_text": "protected bike lanes and pedestrian safety improvements",
  "rationale": "Broadens the policy scope.",
  "status": "submitted",
  "submitted_by": 8,
  "reviewed_by": null,
  "created_at": "2026-04-25T17:35:00Z",
  "updated_at": "2026-04-25T17:35:00Z"
}
```

### Allowed `status`

```yaml
AMENDMENT_STATUS:
  - "submitted"
  - "accepted"
  - "rejected"
  - "withdrawn"
```

---

## 11.4 `RationalePacketPayload`

### Read Shape

```json
{
  "id": 4301,
  "draft": 4001,
  "source_arguments": [501, 502, 503],
  "source_stances_summary": {
    "total": 18,
    "average": 1.2
  },
  "source_readings": [1301],
  "summary": "The draft reflects strong safety arguments and moderate positive stance distribution.",
  "created_at": "2026-04-25T17:40:00Z"
}
```

### Serializer Rules

* Rationale packets link drafting output back to deliberation/consultation evidence.
* They must not become independent source truth.

---

## 12. Decision Payloads

## 12.1 `DecisionProtocolPayload`

### Owner

```yaml
OWNER: "Smart Vote + ethiKos decision protocol"
PROPOSED_MODEL: "DecisionProtocol"
```

### Read Shape

```json
{
  "id": 5101,
  "key": "simple_majority",
  "label": "Simple majority",
  "description": "Decision closes when a simple majority threshold is reached.",
  "parameters_schema": {
    "threshold": "number",
    "minimum_participants": "integer"
  },
  "created_at": "2026-04-25T18:00:00Z",
  "updated_at": "2026-04-25T18:00:00Z"
}
```

---

## 12.2 `DecisionRecordPayload`

### Read Shape

```json
{
  "id": 5201,
  "topic": 42,
  "protocol": 5101,
  "status": "published",
  "baseline_result": {
    "total": 18,
    "average": 1.2,
    "distribution": {
      "-3": 1,
      "-2": 1,
      "-1": 2,
      "0": 3,
      "1": 4,
      "2": 5,
      "3": 2
    }
  },
  "reading_results": [1301],
  "opened_at": "2026-04-25T18:00:00Z",
  "closed_at": "2026-04-26T18:00:00Z",
  "published_at": "2026-04-26T18:30:00Z",
  "created_at": "2026-04-25T18:00:00Z",
  "updated_at": "2026-04-26T18:30:00Z"
}
```

### Allowed `status`

```yaml
DECISION_STATUS:
  - "draft"
  - "open"
  - "closed"
  - "published"
  - "archived"
```

### Serializer Rules

* `baseline_result` must remain visible when readings exist.
* `reading_results` links to Smart Vote outputs.
* A decision record must not mutate stances, ballots, or arguments.

---

## 13. Impact / Accountability Payloads

## 13.1 `ImpactTrackPayload`

### Owner

```yaml
OWNER: "Konsultations / ethiKos Impact"
PROPOSED_MODEL: "ImpactTrack"
```

### Read Shape

```json
{
  "id": 6101,
  "decision_record": 5201,
  "title": "Protected bike lane implementation",
  "status": "in_progress",
  "summary": "Planning and procurement are underway.",
  "owner_label": "City mobility department",
  "handoff_ref": {
    "module": "keenkonnect",
    "object_type": "project",
    "object_id": 9001
  },
  "created_at": "2026-04-26T19:00:00Z",
  "updated_at": "2026-04-27T10:00:00Z"
}
```

### Allowed `status`

```yaml
IMPACT_STATUS:
  - "planned"
  - "in_progress"
  - "blocked"
  - "completed"
  - "cancelled"
```

### Serializer Rules

* `handoff_ref` is optional.
* `handoff_ref` does not transfer civic truth ownership to KeenKonnect.
* Impact records must remain linked to a decision or consultation result.

---

## 13.2 `ImpactUpdatePayload`

### Read Shape

```json
{
  "id": 6201,
  "impact_track": 6101,
  "status": "in_progress",
  "body": "Procurement process opened.",
  "evidence_url": "https://example.org/procurement",
  "created_by": 7,
  "created_at": "2026-04-27T10:00:00Z"
}
```

### Create Shape

```json
{
  "impact_track": 6101,
  "status": "in_progress",
  "body": "Procurement process opened.",
  "evidence_url": "https://example.org/procurement"
}
```

---

## 14. External Tool Boundary Payloads

## 14.1 `ExternalArtifactPayload`

### Owner

```yaml
OWNER: "Integration boundary"
PURPOSE: "Append-only external raw artifact"
```

### Read Shape

```json
{
  "id": 7001,
  "source_name": "decidim",
  "source_object_type": "proposal",
  "source_object_id": "abc-123",
  "payload": {
    "title": "External proposal title",
    "body": "External proposal body"
  },
  "ingested_at": "2026-04-25T19:00:00Z",
  "created_at": "2026-04-25T19:00:00Z"
}
```

### Serializer Rules

* External artifacts are append-only.
* They do not become Korum/Konsultations source truth.
* They require a projection mapping before being displayed as internal civic objects.

---

## 14.2 `ProjectionMappingPayload`

### Read Shape

```json
{
  "id": 7101,
  "external_artifact": 7001,
  "internal_object_type": "EthikosTopic",
  "internal_object_id": 42,
  "mapping_type": "reference",
  "created_by": 1,
  "created_at": "2026-04-25T19:10:00Z"
}
```

### Allowed `mapping_type`

```yaml
PROJECTION_MAPPING_TYPE:
  - "reference"
  - "imported_copy"
  - "derived_summary"
```

### Serializer Rules

* Projection mappings must not silently write to core tables.
* If an imported copy is created, provenance must remain visible.

---

## 15. Audit Payloads

## 15.1 `AuditEventPayload`

### Owner

```yaml
OWNER: "ethiKos governance/admin"
ROUTE_SCOPE: "/ethikos/admin/audit"
```

### Read Shape

```json
{
  "id": 9001,
  "actor": 7,
  "action": "argument_hidden",
  "object_type": "EthikosArgument",
  "object_id": 501,
  "before": {
    "is_hidden": false
  },
  "after": {
    "is_hidden": true
  },
  "reason": "Violation of deliberation guidelines.",
  "source_ref": null,
  "snapshot_ref": null,
  "created_at": "2026-04-25T20:00:00Z"
}
```

### Serializer Rules

* Audit events should be append-only.
* `before` and `after` are optional JSON.
* `reason` should be required for moderation actions.
* Audit events must not expose sensitive anonymous-user mappings to unauthorized roles.

---

## 16. Frontend TypeScript Alignment

Frontend service modules SHOULD define two layers of types:

1. raw API type;
2. normalized UI type.

Example:

```ts
export interface EthikosArgumentApi {
  id: number;
  topic: number;
  user: number | string;
  user_display?: string;
  content: string;
  side?: 'pro' | 'con' | 'neutral' | null;
  parent?: number | null;
  parent_id?: number | null;
  is_hidden?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ArgumentNode {
  id: string;
  topicId: string;
  author: string;
  content: string;
  side: 'pro' | 'con' | 'neutral' | null;
  parentId: string | null;
  isHidden: boolean;
  createdAt: string;
  updatedAt?: string;
}
```

Rules:

* API types mirror backend JSON.
* UI types may normalize naming and IDs.
* Normalization belongs in service/hook adapters.
* Components should not infer backend shape repeatedly.

---

## 17. Serializer Naming Contract

## 17.1 Current Serializers

```txt
EthikosCategorySerializer
EthikosTopicSerializer
EthikosStanceSerializer
EthikosArgumentSerializer
```

## 17.2 Proposed Kintsugi Serializers

```txt
ArgumentTreeSerializer
ArgumentNodeSerializer
ArgumentSourceSerializer
ArgumentImpactVoteSerializer
ArgumentSuggestionSerializer
DiscussionSettingsSerializer
DiscussionParticipantRoleSerializer

DecisionProtocolSerializer
DecisionRecordSerializer

LensDeclarationSerializer
ReadingResultSerializer

DraftSerializer
DraftVersionSerializer
AmendmentSerializer
RationalePacketSerializer

ImpactTrackSerializer
ImpactUpdateSerializer

ExternalArtifactSerializer
ProjectionMappingSerializer

AuditEventSerializer
```

## 17.3 Forbidden Serializer Names

Do not create ambiguous names:

```txt
VoteSerializer
ResultSerializer
OpinionSerializer
PostSerializer
ClaimSerializer
WeightedVoteSerializer
GenericPayloadSerializer
KialoSerializer
```

If such a name is unavoidable, the owning document must explicitly justify it.

---

## 18. Required Validation Rules

## 18.1 Topic Validation

```yaml
title:
  required: true
  blank_allowed: false

description:
  required: true
  blank_allowed: false

status:
  allowed:
    - "open"
    - "closed"
    - "archived"

category:
  required_on_create: true
  required_on_update: false
```

## 18.2 Stance Validation

```yaml
topic:
  required: true

value:
  required: true
  type: integer
  min: -3
  max: 3

unique:
  - "user + topic"
```

## 18.3 Argument Validation

```yaml
topic:
  required: true

content:
  required: true
  blank_allowed: false

side:
  allowed:
    - "pro"
    - "con"
    - "neutral"
    - null

parent:
  required: false
  must_belong_to_same_topic: true
```

## 18.4 Argument Impact Vote Validation

```yaml
argument:
  required: true

value:
  required: true
  type: integer
  min: 0
  max: 4

unique:
  - "user + argument"
```

## 18.5 Reading Result Validation

```yaml
reading_key:
  required: true

lens_hash:
  required: true

target_type:
  required: true

target_id:
  required: true

results_payload:
  required: true
  type: object

computed_at:
  required: true

snapshot_ref:
  required_when: "EkoH context is used"
```

---

## 19. Permission-Related Serializer Rules

## 19.1 Normal User

Normal authenticated users may generally create:

* their own stances;
* their own arguments;
* their own argument impact votes;
* their own suggestions where suggestions are enabled.

They may not:

* set `user`;
* set `created_by`;
* set moderation fields;
* publish readings;
* assign participant roles;
* reveal anonymous identities.

## 19.2 Admin / Moderator

Admins and moderators may:

* hide/unhide arguments;
* accept/reject suggestions;
* update discussion settings;
* assign roles;
* review audit records;
* publish or invalidate readings if authorized.

## 19.3 System / Compute Actor

System actors may:

* compute `ReadingResult`;
* assign `lens_hash`;
* attach `snapshot_ref`;
* create audit events for computations.

System actors may not silently mutate source facts.

---

## 20. Anti-Drift Rules

```yaml
FORBIDDEN:
  - "Do not rename EthikosArgument to Claim."
  - "Do not rename EthikosStance to Vote."
  - "Do not treat ArgumentImpactVote as EthikosStance."
  - "Do not treat Smart Vote ReadingResult as a source fact."
  - "Do not expose EkoH snapshot fields as hidden vote mutations."
  - "Do not create generic VotePayload for all vote-like behavior."
  - "Do not replace /api/ethikos/... with /api/deliberation/..."
  - "Do not expand /api/home/*."
  - "Do not create raw fetch calls in page components for new Kintsugi work."
  - "Do not use GraphQL or WebSockets for CRUD unless a later contract explicitly authorizes it."
```

---

## 21. Related Documents

```txt
00_KINTSUGI_START_HERE.md
02_SOURCE_OF_TRUTH_AND_DRIFT_CONTROL.md
03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md
04_CANONICAL_NAMING_AND_VARIABLES.md
06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md
07_API_AND_SERVICE_CONTRACTS.md
08_DATA_MODEL_AND_MIGRATION_PLAN.md
09_SMART_VOTE_EKOH_READING_CONTRACT.md
12_CANONICAL_OBJECTS_AND_EVENTS.md
14_FRONTEND_ALIGNMENT_CONTRACT.md
15_BACKEND_ALIGNMENT_CONTRACT.md
16_TEST_AND_SMOKE_CONTRACT.md
20_AI_GENERATION_GUARDRAILS.md
21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md
22_IMPLEMENTATION_BACKLOG_TEMPLATE.md
```

---

## 22. Acceptance Criteria

This document is accepted when future frontend/backend work can answer the following without inventing new conventions:

* What is the raw backend JSON shape?
* What is the normalized frontend shape?
* Which serializer owns this payload?
* Which model backs the payload?
* Which fields are read-only?
* Which fields are injected from request context?
* Which fields are computed?
* Which values are valid enum values?
* Is this a source fact or derived projection?
* Is this topic-level, argument-level, decision-level, or reading-level?
* Does this payload preserve the separation between Korum, Konsultations, Smart Vote, EkoH, and Kialo-style deliberation?

If any payload cannot answer those questions, it is not ready for implementation.

---

## 23. Final Contract Statement

Payloads are not neutral.

They encode ownership.

For Kintsugi, every payload must preserve the central architecture:

* `EthikosTopic` remains the topic/debate/consultation container.
* `EthikosStance` remains the topic-level stance.
* `EthikosArgument` remains the argument/thread/claim-equivalent object.
* `ArgumentImpactVote` remains claim-level only.
* `ReadingResult` remains derived Smart Vote output only.
* `EkoH` remains context, not voting.
* Kialo-style deliberation remains a native Korum pattern, not a separate module.
* External OSS patterns remain mimic-first and adapter-only later.

The backend speaks stable DRF JSON.
The frontend normalizes through services.
The baseline remains visible.
The derived readings remain declared.
The serializers preserve the architecture.

---

## V4.1 EkoH profile payload extension

Canonical fields added to the EkoH profile projection: `rating_visibility`, `rating_publication_basis`, `rating_access`, and `score_history`. `rating_access` contains `allowed`, `level`, `reason`, and optional `scope`. Denied callers receive null rating fields rather than client-side hidden values. See `27_EKOH_RATING_VISIBILITY_AND_ACCESS_CONTRACT.md`.

