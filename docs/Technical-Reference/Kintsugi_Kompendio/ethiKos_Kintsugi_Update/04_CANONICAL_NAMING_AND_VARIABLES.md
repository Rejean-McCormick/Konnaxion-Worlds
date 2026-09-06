# 04 — Canonical Naming and Variables

**Document ID:** `04_CANONICAL_NAMING_AND_VARIABLES.md`  
**Pack:** ethiKos Kintsugi Update Documentation Pack  
**Status:** Canonical naming contract  
**Last aligned:** 2026-04-25  
**Primary purpose:** prevent naming drift across documentation, frontend, backend, migrations, prompts, and parallel AI-generated files.

---

## 1. Purpose

This document defines the canonical names, identifiers, slugs, routes, backend apps, model names, payload names, enum names, and reserved variables for the ethiKos Kintsugi upgrade.

Every other Kintsugi documentation file MUST use these names unless it explicitly defines a local alias and maps that alias back to this document.

This file exists because the Kintsugi documentation pack may be generated across parallel AI conversations. Without a fixed naming contract, different conversations may independently invent names such as `Deliberation`, `DebatePost`, `VoteLens`, `KialoClaim`, `WeightedTopicResult`, or `/api/deliberation/...`. Those names MUST NOT become canonical unless this document is amended.

---

## 2. Scope

This document governs naming for:

- product/module names;
- submodule names;
- Kintsugi strategy variables;
- frontend route names;
- backend app names;
- backend model names;
- proposed model names;
- API endpoint names;
- service-layer names;
- Smart Vote and EkoH reading variables;
- Kialo-style argument mapping variables;
- mimic vs annex variables;
- canonical object names;
- canonical event names;
- enum names and values;
- known bug identifiers;
- anti-drift constants.

This document does **not** define full data schemas, serializers, migrations, UI layouts, or implementation tasks. Those belong to the related documents listed at the end.

---

## 3. Source Priority

When naming conflicts occur, apply this priority order:

| Priority | Source | Governs |
|---:|---|---|
| 1 | Code snapshot reality | Existing routes, files, current endpoints, current models, current implementation state |
| 2 | Boundaries and ownership contract | Korum/Konsultations/Smart Vote/EkoH ownership, write rules, pipeline |
| 3 | Clean-slate Kintsugi plan | First-pass scope, no full merge, docs first, code inspection second |
| 4 | Kialo core corpus | Structured deliberation names for `/ethikos/deliberate/*` |
| 5 | OSS source docs | Pattern inspiration only |
| 6 | Prior master docs | Strategic framing after correcting scope and route reality |

If this document conflicts with implementation reality, implementation reality wins for currently existing code names.  
If this document conflicts with a broader concept document, this document wins for naming.

---

## 4. Canonical Product Names

| Concept | Canonical display name | Canonical code/name form | Notes |
|---|---|---|---|
| Platform | `Konnaxion` | `konnaxion` | Root platform |
| Civic module | `ethiKos` | `ethikos` | Preserve stylized display name |
| Upgrade | `Kintsugi` | `kintsugi` | Upgrade/program name, not a separate app |
| Full upgrade | `ethiKos Kintsugi Upgrade` | `ethikos_kintsugi_upgrade` | Documentation pack/program |
| Documentation pack | `ethiKos Kintsugi Update Documentation Pack` | `kintsugi_doc_pack` | Pack name |
| Debate submodule | `Korum` | `korum` | Debate/argumentation ownership label |
| Consultation submodule | `Konsultations` | `konsultations` | Intake/consultation/impact ownership label |
| Decision/readings layer | `Smart Vote` | `smartvote` / `SmartVote` | UI text uses two words |
| Expertise/ethics layer | `EkoH` | `ekoh` | Preserve capitalization |
| Voting app | `Kollective Intelligence` | `kollective_intelligence` | Existing backend app name |
| Collaboration module | `KeenKonnect` | `keenkonnect` | Existing platform module |
| Learning/certification module | `KonnectED` | `konnected` | Existing platform module |
| Creative module | `Kreative` | `kreative` | Existing platform module |

---

## 5. Global Strategy Variables

```yaml
KINTSUGI_UPDATE_TYPE: "documentation-first architecture upgrade"
IMPLEMENTATION_STYLE: "partial native mimic"
FULL_EXTERNAL_MERGE_ALLOWED: false
ANNEX_FIRST_PASS_ALLOWED: false
BIG_BANG_REWRITE_ALLOWED: false
EXISTING_ROUTE_FAMILIES_STABLE: true
EXISTING_ETHIKOS_FRAME_STABLE: true
DOCS_BEFORE_CODE: true
CODE_INSPECTION_AFTER_DOCS: true
BACKLOG_AFTER_DOCS_AND_CODE_READING: true
GENERATE_ONE_FILE_PER_PARALLEL_CONVERSATION: true
````

### Meaning

* `documentation-first architecture upgrade` means the docs define contracts before implementation backlog.
* `partial native mimic` means selected external patterns are reimplemented natively inside ethiKos.
* `FULL_EXTERNAL_MERGE_ALLOWED = false` forbids merging entire external civic platforms into the current Konnaxion stack.
* `ANNEX_FIRST_PASS_ALLOWED = false` means first pass does not create sidecar integrations.
* `EXISTING_ROUTE_FAMILIES_STABLE = true` means the current `/ethikos/*` route families remain the product surface.

---

## 6. First-Pass OSS Scope Variables

```yaml
FIRST_PASS_OSS_SOURCES:
  - "Consider.it"
  - "Kialo-style argument mapping"
  - "Loomio"
  - "Citizen OS"
  - "Decidim"
  - "CONSUL Democracy"
  - "DemocracyOS"

DEFERRED_OSS_SOURCES:
  - "Polis"
  - "LiquidFeedback"
  - "All Our Ideas"
  - "Your Priorities"
  - "OpenSlides"
```

### Per-source status

```yaml
OSS_SOURCE_STATUS:
  CONSIDER_IT: "first_pass_mimic"
  KIALO_STYLE: "first_pass_mimic"
  LOOMIO: "first_pass_mimic"
  CITIZEN_OS: "first_pass_mimic"
  DECIDIM: "first_pass_mimic"
  CONSUL_DEMOCRACY: "first_pass_mimic"
  DEMOCRACY_OS: "first_pass_mimic"

  POLIS: "deferred_public_credit_only"
  LIQUID_FEEDBACK: "deferred_public_credit_only"
  ALL_OUR_IDEAS: "deferred"
  YOUR_PRIORITIES: "deferred"
  OPENSLIDES: "deferred_possible_future_annex"
```

### Naming rule

External project names MAY appear in inspiration or matrix sections. They MUST NOT become Konnaxion route names, backend app names, or database namespaces in the first pass.

Forbidden first-pass examples:

```txt
/kialo
/api/kialo/...
konnaxion.kialo
PolisEngine
LiquidFeedbackVote
OpenSlidesSession
```

---

## 7. Ownership Variables

```yaml
KORUM_OWNS:
  - "Ethikos topics used as debate/deliberation containers"
  - "Arguments"
  - "Threaded argument graph"
  - "Topic-level stance events"
  - "Moderation on debate artifacts"

KONSULTATIONS_OWNS:
  - "Intake"
  - "Consultations"
  - "Citizen suggestions"
  - "Ballot capture"
  - "Result snapshots"
  - "Impact tracking"

SMART_VOTE_OWNS:
  - "Derived readings"
  - "Lens declarations"
  - "Aggregations"
  - "Result publication"

EKOH_OWNS:
  - "Expertise context"
  - "Ethics context"
  - "Cohort eligibility"
  - "Domain vectors"
  - "Snapshot and audit context"
```

### Ownership rule

Korum and Konsultations are ethiKos ownership domains. Smart Vote and EkoH interact with them through declared readings, snapshots, context, and derived artifacts. They MUST NOT mutate upstream debate or ballot facts.

---

## 8. Write-Rule Variables

```yaml
FOREIGN_TOOLS_WRITE_CORE_TABLES: false
SMART_VOTE_MUTATES_KORUM_RECORDS: false
SMART_VOTE_MUTATES_KONSULTATIONS_RECORDS: false
SMART_VOTE_WRITES_ONLY_DERIVED_ARTIFACTS: true
EKOH_IS_VOTING_ENGINE: false
EKOH_MUTATES_VOTES: false
WEIGHTED_OUTCOME_REQUIRES_REPRODUCIBILITY: true
READING_FORMULA: "Reading = f(BaselineEvents, LensDeclaration, SnapshotContext?)"
```

### Meaning

* Foreign tools may be inspiration sources or future annexes.
* Foreign tools MUST NOT write directly into Korum or Konsultations core tables.
* Smart Vote writes readings, not facts.
* EkoH supplies context, not votes.
* Weighted or filtered outcomes must be reproducible from declared inputs.

---

## 9. Current Backend App Variables

```yaml
BACKEND:
  ROOT_PACKAGE: "backend"
  DJANGO_PROJECT: "config"
  ROOT_URLCONF: "config.urls"
  API_ROUTER_FILE: "config/api_router.py"
  AUTH_USER_MODEL: "users.User"
  DEFAULT_API_STYLE: "Django REST Framework ViewSet + Serializer + Router"

BACKEND_APPS:
  USERS_APP: "konnaxion.users"
  ETHIKOS_APP: "konnaxion.ethikos"
  KOLLECTIVE_INTELLIGENCE_APP: "konnaxion.kollective_intelligence"
  KEENKONNECT_APP: "konnaxion.keenkonnect"
  KONNECTED_APP: "konnaxion.konnected"
  KREATIVE_APP: "konnaxion.kreative"
```

### Backend naming rules

* Use `users.User`, never `auth.User`.
* Use `konnaxion.ethikos`, not `konnaxion.deliberation`.
* Use `konnaxion.kollective_intelligence`, not `konnaxion.smartvote` for the existing voting app.
* Do not create `konnaxion.kialo` in first pass.
* Do not rename existing apps.

---

## 10. Current Frontend Route Variables

```yaml
FRONTEND:
  FRAMEWORK: "Next.js App Router"
  PRIMARY_ROUTE_SURFACE: "/ethikos/*"
  ETHIKOS_LAYOUT_RULE: "All ethiKos pages remain inside the existing Ethikos/global shell."
  DO_NOT_CREATE_SECOND_SHELL: true
  DO_NOT_CREATE_KIALO_ROUTE_FAMILY: true
  DO_NOT_CREATE_KINTSUGI_TOP_LEVEL_APP: true
  USE_SERVICES_LAYER: true
```

### Current ethiKos route families

```yaml
ETHIKOS_ROUTE_FAMILIES:
  DECIDE:
    PREFIX: "/ethikos/decide/*"
    ROUTES:
      - "/ethikos/decide/elite"
      - "/ethikos/decide/public"
      - "/ethikos/decide/results"
      - "/ethikos/decide/methodology"

  DELIBERATE:
    PREFIX: "/ethikos/deliberate/*"
    ROUTES:
      - "/ethikos/deliberate/elite"
      - "/ethikos/deliberate/[topic]"
      - "/ethikos/deliberate/guidelines"

  TRUST:
    PREFIX: "/ethikos/trust/*"
    ROUTES:
      - "/ethikos/trust/profile"
      - "/ethikos/trust/badges"
      - "/ethikos/trust/credentials"

  PULSE:
    PREFIX: "/ethikos/pulse/*"
    ROUTES:
      - "/ethikos/pulse/overview"
      - "/ethikos/pulse/live"
      - "/ethikos/pulse/health"
      - "/ethikos/pulse/trends"

  IMPACT:
    PREFIX: "/ethikos/impact/*"
    ROUTES:
      - "/ethikos/impact/feedback"
      - "/ethikos/impact/outcomes"
      - "/ethikos/impact/tracker"

  LEARN:
    PREFIX: "/ethikos/learn/*"
    ROUTES:
      - "/ethikos/learn/changelog"
      - "/ethikos/learn/glossary"
      - "/ethikos/learn/guides"

  INSIGHTS:
    PREFIX: "/ethikos/insights"
    ROUTES:
      - "/ethikos/insights"

  ADMIN:
    PREFIX: "/ethikos/admin/*"
    ROUTES:
      - "/ethikos/admin/audit"
      - "/ethikos/admin/moderation"
      - "/ethikos/admin/roles"
```

### Route interpretation variables

```yaml
PRIMARY_DELIBERATION_ROUTE: "/ethikos/deliberate/*"
PRIMARY_DECISION_ROUTE: "/ethikos/decide/*"
PRIMARY_IMPACT_ROUTE: "/ethikos/impact/*"
PRIMARY_ADMIN_ROUTE: "/ethikos/admin/*"
PRIMARY_TRUST_ROUTE: "/ethikos/trust/*"
PRIMARY_PULSE_ROUTE: "/ethikos/pulse/*"
PRIMARY_LEARN_ROUTE: "/ethikos/learn/*"
PRIMARY_INSIGHTS_ROUTE: "/ethikos/insights"
```

### Route anti-drift rules

Do not replace the implemented route surface with older conceptual routes such as:

```txt
/debate
/consult
/reputation
/platforms/konnaxion/ethikos/korum
/platforms/konnaxion/ethikos/konsultations
/platforms/konnaxion/ethikos/kintsugi
```

Those may be referenced as conceptual/public-doc surfaces, but the implementation upgrade targets `/ethikos/*`.

---

## 11. Current API Endpoint Variables

```yaml
API_BASE: "/api/"

CURRENT_ENDPOINTS_CANONICAL:
  ETHIKOS_TOPICS: "/api/ethikos/topics/"
  ETHIKOS_STANCES: "/api/ethikos/stances/"
  ETHIKOS_ARGUMENTS: "/api/ethikos/arguments/"
  ETHIKOS_CATEGORIES: "/api/ethikos/categories/"
  KOLLECTIVE_VOTES: "/api/kollective/votes/"

CURRENT_ENDPOINTS_COMPATIBILITY:
  DELIBERATE_ALIAS: "/api/deliberate/..."
  DELIBERATE_ELITE_ALIAS: "/api/deliberate/elite/..."

LEGACY_OR_PROBLEMATIC_ENDPOINTS:
  API_HOME_PREFIX: "/api/home/*"
```

### Endpoint naming rules

* Use `/api/ethikos/topics/`, not `/api/deliberation/topics/`.
* Use `/api/ethikos/arguments/`, not `/api/claims/`.
* Use `/api/kollective/votes/` for the current Kollective vote API.
* Do not expand `/api/home/*`.
* Compatibility aliases may be documented but should not become the preferred canonical API surface.

---

## 12. Current Backend Model Variables

```yaml
CURRENT_ETHIKOS_MODELS:
  - "EthikosCategory"
  - "EthikosTopic"
  - "EthikosStance"
  - "EthikosArgument"

CURRENT_ETHIKOS_MODEL_SEMANTICS:
  EthikosCategory: "Topic grouping."
  EthikosTopic: "Main debate / consultation prompt container."
  EthikosStance: "Per-user numeric topic-level stance constrained to -3..+3."
  EthikosArgument: "Threaded discussion entry; may have parent and pro/con side."
```

### Current model naming rules

* `EthikosTopic` remains the canonical current topic/discussion container.
* `EthikosArgument` remains the canonical current argument/claim record.
* `EthikosStance` remains topic-level stance, not argument-level impact voting.
* `EthikosCategory` remains the topic grouping model.
* Do not rename `EthikosArgument` to `Claim`.
* Do not rename `EthikosTopic` to `Discussion`.
* Conceptual aliases are allowed only when explicitly mapped.

---

## 13. Current Model Field Semantics

```yaml
ETHIKOS_TOPIC_FIELDS_CANONICAL:
  - "title"
  - "description"
  - "status"
  - "category"
  - "created_by"
  - "total_votes"
  - "last_activity"
  - "created_at"
  - "updated_at"
  - "expertise_category"

ETHIKOS_TOPIC_STATUS_VALUES:
  - "open"
  - "closed"
  - "archived"

ETHIKOS_STANCE_FIELDS_CANONICAL:
  - "user"
  - "topic"
  - "value"
  - "timestamp"

ETHIKOS_STANCE_VALUE_RANGE: "-3..+3"
ETHIKOS_STANCE_UNIQUENESS: "one stance per user/topic"

ETHIKOS_ARGUMENT_FIELDS_CANONICAL:
  - "topic"
  - "user"
  - "content"
  - "side"
  - "parent"
  - "is_hidden"
  - "created_at"
  - "updated_at"

ETHIKOS_ARGUMENT_SIDE_VALUES:
  - "pro"
  - "con"
  - "neutral"

ETHIKOS_CATEGORY_FIELDS_CANONICAL:
  - "name"
  - "description"
```

---

## 14. Proposed New Model Names

The following names are reserved for future Kintsugi implementation planning. They are not necessarily implemented yet.

```yaml
PROPOSED_NEW_MODELS:
  DECISION:
    - "DecisionProtocol"
    - "DecisionRecord"
    - "EligibilityRule"

  SMART_VOTE_READING:
    - "LensDeclaration"
    - "ReadingResult"

  DRAFTING:
    - "Draft"
    - "DraftVersion"
    - "Amendment"
    - "RationalePacket"

  IMPACT:
    - "ImpactTrack"
    - "ImpactUpdate"

  EXTERNAL_TOOL_BOUNDARY:
    - "ExternalArtifact"
    - "ProjectionMapping"

  KIALO_STYLE:
    - "ArgumentSource"
    - "ArgumentImpactVote"
    - "ArgumentSuggestion"
    - "ArgumentLink"
    - "ArgumentBookmark"
    - "DiscussionPerspective"
    - "DiscussionTemplate"
    - "DiscussionGroup"
    - "DiscussionParticipantRole"
    - "DiscussionVisibilitySetting"
    - "DiscussionExport"
```

### First-pass model priority

```yaml
FIRST_PASS_MODEL_PRIORITY:
  MUST_CONSIDER:
    - "DecisionProtocol"
    - "DecisionRecord"
    - "LensDeclaration"
    - "ReadingResult"
    - "Draft"
    - "DraftVersion"
    - "Amendment"
    - "RationalePacket"
    - "ImpactTrack"
    - "ArgumentSource"
    - "ArgumentImpactVote"
    - "ArgumentSuggestion"
    - "DiscussionParticipantRole"
    - "DiscussionVisibilitySetting"

  DEFER:
    - "ArgumentBookmark"
    - "ArgumentLink"
    - "DiscussionTemplate"
    - "DiscussionGroup"
    - "DiscussionPerspective"
    - "DiscussionExport"
```

### Proposed model naming rules

* Proposed models MUST be additive.
* Proposed models MUST NOT replace current core models.
* Proposed models MUST NOT require destructive migrations to existing Ethikos tables.
* Proposed models MUST be confirmed in `08_DATA_MODEL_AND_MIGRATION_PLAN.md` before implementation.

---

## 15. Canonical Kialo-Style Naming Variables

Kialo-style naming is conceptual and belongs under Korum / Deliberate. It does not create a separate Kialo module.

```yaml
KIALO:
  STRATEGY: "native_mimic"
  ROUTE_SCOPE: "/ethikos/deliberate/*"
  BACKEND_SCOPE: "konnaxion.ethikos"
  CREATE_KIALO_BACKEND_APP: false
  CREATE_KIALO_FRONTEND_ROUTE: false
  IMPORT_KIALO_CODE: false
  ROLE_IN_KINTSUGI: "Canonical structured deliberation UX reference for Korum."
```

### Kialo-style canonical mapping

```yaml
KIALO_CANONICAL_MAPPING:
  KIALO_DISCUSSION: "EthikosTopic"
  KIALO_THESIS: "Topic thesis/prompt field; current fallback is EthikosTopic.title + EthikosTopic.description"
  KIALO_CLAIM: "EthikosArgument"
  KIALO_PRO_CON_EDGE: "EthikosArgument.parent + EthikosArgument.side"
  KIALO_SOURCE: "ArgumentSource"
  KIALO_IMPACT_VOTE: "ArgumentImpactVote"
  KIALO_SUGGESTED_CLAIM: "ArgumentSuggestion"
  KIALO_PERSPECTIVE: "DiscussionPerspective or Smart Vote lens depending context"
  KIALO_PARTICIPANT_ROLE: "DiscussionParticipantRole"
```

### Kialo-style value constants

```yaml
KIALO_EDGE_SIDE_VALUES:
  - "pro"
  - "con"
  - "neutral"

KIALO_IMPACT_VOTE_RANGE: "0..4"
KIALO_IMPACT_VOTE_MEANING: "veracity + relevance to parent"
KIALO_IMPACT_VOTE_IS_TOPIC_STANCE: false
KIALO_IMPACT_VOTE_IS_SMART_VOTE_BALLOT: false

KIALO_ROLES:
  - "owner"
  - "admin"
  - "editor"
  - "writer"
  - "suggester"
  - "viewer"

KIALO_ANONYMITY_MODES:
  - "standard"
  - "anonymous"

KIALO_AUTHOR_VISIBILITY:
  - "never"
  - "admins_only"
  - "all"

KIALO_VOTE_VISIBILITY:
  - "all"
  - "admins_only"
  - "self_only"

KIALO_DISCUSSION_TOPOLOGY:
  - "single_thesis"
  - "multi_thesis"

KIALO_MINIMAP_MODES:
  - "tree"
  - "sunburst"
```

### Kialo-style first-pass features

```yaml
KIALO_FIRST_PASS_FEATURES:
  - "Argument tree using current EthikosArgument parent + side"
  - "Claim/source links"
  - "Role-aware suggested claims"
  - "Impact vote separated from topic stance"
  - "Author visibility settings"
  - "Voting visibility settings"
  - "Basic topic info/background panel"
```

### Kialo-style deferred features

```yaml
KIALO_DEFERRED_FEATURES:
  - "Small group mode"
  - "Sunburst minimap"
  - "Clone-from-template"
  - "Export discussion"
  - "Custom perspectives"
  - "Claim extraction into new discussion"
  - "Move/link claim across discussions"
```

### Kialo anti-drift rules

```yaml
KIALO_ANTI_DRIFT_RULES:
  - "Do not rename EthikosArgument to Claim."
  - "Do not create konnaxion.kialo."
  - "Do not create /kialo routes."
  - "Do not treat Kialo impact votes as Ethikos stances."
  - "Do not treat Kialo impact votes as Smart Vote ballots."
  - "Do not expose anonymous identities to normal participants."
  - "Do not publish suggested claims without approval when role is suggester."
```

---

## 16. Vote-Type Naming Variables

There are three distinct vote/reading concepts. They MUST NOT be merged.

```yaml
VOTE_TYPE_SEPARATION:
  ETHIKOS_STANCE:
    MODEL: "EthikosStance"
    RANGE: "-3..+3"
    LEVEL: "topic-level"
    OWNER: "Korum"
    MEANING: "User stance on topic."

  KIALO_IMPACT_VOTE:
    MODEL: "ArgumentImpactVote"
    RANGE: "0..4"
    LEVEL: "argument/claim-level"
    OWNER: "Korum"
    MEANING: "Impact of a claim on its parent; combines veracity and relevance."

  SMART_VOTE_READING:
    MODEL: "ReadingResult"
    RANGE: "not fixed; depends on lens and modality"
    LEVEL: "derived aggregation"
    OWNER: "Smart Vote"
    MEANING: "Published derived reading of baseline events."
```

### Critical vote rules

```yaml
CLAIM_IMPACT_VOTE_IS_TOPIC_STANCE: false
CLAIM_IMPACT_VOTE_IS_SMART_VOTE_BALLOT: false
ETHIKOS_STANCE_IS_READING: false
SMART_VOTE_READING_IS_SOURCE_FACT: false
EKOH_IS_VOTING_ENGINE: false
```

---

## 17. Smart Vote and EkoH Naming Variables

```yaml
SMART_VOTE_NAMING:
  UI_TEXT: "Smart Vote"
  CODE_CLASS: "SmartVote"
  CODE_MODULE: "smartvote"
  URL_SLUG: "smart-vote"

EKOH_NAMING:
  UI_TEXT: "EkoH"
  CODE_MODULE: "ekoh"
  SNAPSHOT_LEGACY_FIELD: "ekoh_snapshot_id"
  SNAPSHOT_CANONICAL_FIELD: "snapshot_ref"
```

### Reading variables

```yaml
SMART_VOTE_EKOH:
  BASELINE_READING: "raw_unweighted"
  WEIGHTED_READING: "declared_lens_output"
  READING_REPRODUCIBLE: true
  READING_INPUTS:
    - "BaselineEvents"
    - "LensDeclaration"
    - "SnapshotContext"
  SNAPSHOT_FIELD: "snapshot_ref"
  LEGACY_EKOH_SNAPSHOT_FIELD: "ekoh_snapshot_id"
  LENS_ID_FIELD: "reading_key"
  LENS_HASH_FIELD: "lens_hash"
  RESULT_PAYLOAD_FIELD: "results_payload"
  COMPUTED_AT_FIELD: "computed_at"
```

### Minimum reading fields

```yaml
READING_RESULT_MINIMUM_FIELDS:
  - "reading_key"
  - "lens_hash"
  - "snapshot_ref"
  - "computed_at"
  - "topic_id or consultation_id"
  - "results_payload"
```

### Reading naming rules

* `baseline` means raw unweighted result.
* `reading` means derived result.
* `lens` means declared transformation/aggregation logic.
* `snapshot_ref` points to audit context.
* `ekoh_snapshot_id` may appear as legacy/compatibility naming, but `snapshot_ref` is preferred in Kintsugi docs.
* Do not use `weighted_vote` to describe upstream facts.
* Do not use `SmartVoteResult` as a replacement for `ReadingResult` unless a later implementation ADR approves it.

---

## 18. Canonical Object Names

```yaml
CANONICAL_OBJECTS:
  - "ProblemStatement"
  - "IntakeSubmission"
  - "IntakeQueue"
  - "Topic"
  - "TopicTag"
  - "Option"
  - "OptionSet"
  - "Constraint"
  - "ConstraintSet"
  - "Argument"
  - "ArgumentGraph"
  - "ArgumentEdge"
  - "ArgumentSource"
  - "ArgumentImpactVote"
  - "ArgumentSuggestion"
  - "StanceEvent"
  - "BallotEvent"
  - "Draft"
  - "DraftVersion"
  - "Amendment"
  - "RationalePacket"
  - "DecisionProtocol"
  - "DecisionRecord"
  - "BaselineResult"
  - "ReadingResult"
  - "LensDeclaration"
  - "SnapshotRef"
  - "ImpactTrack"
  - "ImpactUpdate"
  - "ExternalArtifact"
  - "ProjectionMapping"
  - "ModerationAction"
  - "AuditEvent"
```

### Object naming rules

* Use `Argument`, not `DebatePost`.
* Use `ArgumentGraph`, not `DebateTree`.
* Use `StanceEvent`, not `OpinionVote`.
* Use `BallotEvent`, not `VoteRecord`, when referring to raw ballot capture.
* Use `ReadingResult`, not `WeightedResult`, when referring to Smart Vote outputs.
* Use `LensDeclaration`, not `VoteLens`.
* Use `ImpactTrack`, not `ProjectImpact`, when referring to ethiKos accountability truth.
* Use `ExternalArtifact` and `ProjectionMapping` for annex boundaries.

---

## 19. Canonical Event Names

```yaml
CANONICAL_EVENTS:
  - "TopicCreated"
  - "TopicClosed"
  - "StanceRecorded"
  - "ArgumentCreated"
  - "ArgumentUpdated"
  - "ArgumentHidden"
  - "ArgumentSourceAttached"
  - "ArgumentImpactVoteRecorded"
  - "ArgumentSuggestionSubmitted"
  - "ArgumentSuggestionAccepted"
  - "ArgumentSuggestionRejected"
  - "DraftCreated"
  - "DraftVersionCreated"
  - "AmendmentSubmitted"
  - "DecisionOpened"
  - "DecisionClosed"
  - "DecisionPublished"
  - "ReadingComputed"
  - "ReadingPublished"
  - "ReadingInvalidated"
  - "ImpactUpdated"
  - "ModerationActionRecorded"
```

### Event naming rules

* Event names use PascalCase.
* Event names describe facts that occurred.
* Event names MUST NOT include UI names unless the event is specifically a UI audit event.
* `ReadingComputed` does not mean the result was published.
* `DecisionClosed` does not mean the decision was implemented.

---

## 20. Payload Shape Names

```yaml
REQUIRED_PAYLOAD_SHAPES:
  - "TopicPayload"
  - "StancePayload"
  - "ArgumentPayload"
  - "ArgumentTreePayload"
  - "ArgumentNodePayload"
  - "ArgumentSourcePayload"
  - "ArgumentImpactVotePayload"
  - "ArgumentSuggestionPayload"
  - "DecisionRecordPayload"
  - "DecisionProtocolPayload"
  - "LensDeclarationPayload"
  - "ReadingResultPayload"
  - "DraftPayload"
  - "DraftVersionPayload"
  - "AmendmentPayload"
  - "ImpactTrackPayload"
  - "DiscussionSettingsPayload"
  - "ParticipantRolePayload"
```

### Payload constants

```yaml
PAYLOAD_CONSTANTS:
  ID_TYPE_CURRENT_ETHIKOS: "integer"
  DATE_FORMAT: "ISO_8601"
  PAGINATION_STYLE: "DRF-compatible"
  ERROR_STYLE: "DRF-compatible"
  STANCE_VALUE_RANGE: "-3..+3"
  CLAIM_IMPACT_RANGE: "0..4"
```

### Payload naming rules

* Payload names use PascalCase.
* API JSON fields use snake_case when aligned with Django/DRF.
* Frontend TypeScript types MAY use PascalCase interfaces with camelCase internal field names only if the service layer maps them explicitly.
* Avoid ad-hoc payload names such as `TopicDTO`, `VoteData`, or `KialoPayload` unless a service file already uses them and maps them to canonical names.

---

## 21. Enum Names and Values

```yaml
ENUMS:
  TOPIC_STATUS:
    - "open"
    - "closed"
    - "archived"

  ARGUMENT_SIDE:
    - "pro"
    - "con"
    - "neutral"

  DECISION_STATUS:
    - "draft"
    - "open"
    - "closed"
    - "published"
    - "archived"

  DRAFT_STATUS:
    - "draft"
    - "review"
    - "accepted"
    - "superseded"
    - "archived"

  IMPACT_STATUS:
    - "planned"
    - "in_progress"
    - "blocked"
    - "completed"
    - "cancelled"

  READING_STATUS:
    - "pending"
    - "computed"
    - "published"
    - "invalidated"

  AUTHOR_VISIBILITY:
    - "never"
    - "admins_only"
    - "all"

  VOTE_VISIBILITY:
    - "all"
    - "admins_only"
    - "self_only"

  PARTICIPATION_TYPE:
    - "standard"
    - "anonymous"

  DISCUSSION_TOPOLOGY:
    - "single_thesis"
    - "multi_thesis"
```

### Enum naming rules

* Enum names use uppercase snake case in documentation.
* Enum values use lowercase snake case unless matching existing implementation.
* Do not invent synonyms like `active`, `finished`, `hidden`, `private_only`, or `moderators` unless an implementation contract adds them.
* If current code uses `null` for neutral argument side, docs MAY mention compatibility but canonical Kintsugi naming is `neutral`.

---

## 22. Frontend Component Naming Variables

```yaml
FRONTEND_SURFACES_TO_REFERENCE:
  EXISTING_LAYOUT_COMPONENTS:
    - "MainLayout"
    - "EthikosPageShell"
    - "PageContainer"
    - "Ant Design App context"

  DO_NOT_DUPLICATE:
    - "global shell"
    - "module shell"
    - "theme system"
    - "navigation system"
```

### Kialo-style frontend surfaces

```yaml
KIALO_STYLE_FRONTEND_SURFACES:
  - "ArgumentTreeView"
  - "ArgumentNodeCard"
  - "ArgumentMinimap"
  - "ArgumentSourcesPanel"
  - "GuidedVotingDrawer"
  - "PerspectiveSelector"
  - "SuggestedClaimsPanel"
  - "ParticipantRoleSettings"
  - "DiscussionSettingsPanel"
  - "AnonymousModeBanner"
```

### Frontend naming rules

* All new ethiKos pages remain under `/ethikos/*`.
* All new ethiKos page UIs should use `EthikosPageShell` or the current shell pattern.
* Do not create `KintsugiPageShell`.
* Do not create `KialoPageShell`.
* Do not create a new global navigation system.
* Service functions should live in the existing service layer pattern.

---

## 23. Service-Layer Naming Variables

```yaml
SERVICE_LAYER_POLICY:
  USE_EXISTING_SERVICES_FOLDER: true
  DO_NOT_INVENT_API_CLIENT_PATTERN: true
  ALL_NEW_API_CALLS_SHOULD_HAVE_SERVICE_WRAPPER: true
  NO_RAW_FETCH_FROM_COMPONENTS_UNLESS_DOCUMENTED: true
```

### Service names to preserve or align

```yaml
SERVICE_NAMES:
  ETHIKOS_SERVICE: "services/ethikos"
  DELIBERATE_SERVICE: "services/deliberate"
  DECIDE_SERVICE: "services/decide"
  IMPACT_SERVICE: "services/impact"
  LEARN_SERVICE: "services/learn"
  ADMIN_SERVICE: "services/admin"
```

### Service naming rules

* Prefer verbs such as `fetch`, `create`, `update`, `submit`, `publish`, `compute`.
* Avoid external-source names in service function names unless clearly pattern-specific.
* Use `fetchTopicPreview`, not `fetchKialoPreview`.
* Use `submitArgumentImpactVote`, not `submitKialoVote`.
* Use `fetchReadingResults`, not `fetchWeightedVotes`.

---

## 24. Mimic vs Annex Naming Variables

```yaml
MIMIC_VS_ANNEX:
  DEFAULT_EXTERNAL_TOOL_STRATEGY: "mimic"
  MIMIC_FIRST_PASS: true
  ANNEX_REQUIRES_ISOLATION: true
  ANNEX_REQUIRES_REPLACEABILITY: true
  ANNEX_REQUIRES_NO_CORE_TABLE_WRITES: true
  ANNEX_REQUIRES_LICENSE_CLEARANCE: true
  ANNEX_REQUIRES_ADAPTER_LAYER: true
  FULL_CODE_IMPORT_DEFAULT: false

ANNEX_BOUNDARY_OBJECTS:
  - "ExternalArtifact"
  - "ProjectionMapping"
```

### Mimic naming rule

Use external tool names only in matrix rows, comments, or source references. Do not embed external tool names in canonical backend models unless explicitly approved by an ADR.

Correct:

```txt
ArgumentImpactVote
DecisionProtocol
ImpactTrack
ExternalArtifact
```

Incorrect:

```txt
KialoVote
LoomioProposal
DecidimProcess
ConsulThreshold
DemocracyOSForum
```

---

## 25. Known Bug Naming Variables

```yaml
KNOWN_BUGS:
  BUG_001:
    ID: "BUG_001"
    TITLE: "Deliberate preview drawer shows 'Preview / No data'"
    STATUS: "known_open"
    CLASSIFICATION: "targeted_bugfix_not_architecture"
    DO_NOT_USE_TO_REDESIGN_KINTSUGI: true
```

### Bug naming rules

* Known bugs must be listed in `17_KNOWN_BUGS_AND_NON_KINTSUGI_ITEMS.md`.
* Bugs must not drive architecture changes unless escalated through an ADR.
* The preview drawer bug may require service/payload fixes, but it does not justify route or model redesign.

---

## 26. Documentation File Name Variables

```yaml
DOCUMENT_PACK:
  00: "00_KINTSUGI_START_HERE.md"
  01: "01_ETHIKOS_KINTSUGI_EXECUTION_STRATEGY.md"
  02: "02_SOURCE_OF_TRUTH_AND_DRIFT_CONTROL.md"
  03: "03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md"
  04: "04_CANONICAL_NAMING_AND_VARIABLES.md"
  05: "05_CURRENT_STATE_BASELINE.md"
  06: "06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md"
  07: "07_API_AND_SERVICE_CONTRACTS.md"
  08: "08_DATA_MODEL_AND_MIGRATION_PLAN.md"
  09: "09_SMART_VOTE_EKOH_READING_CONTRACT.md"
  10: "10_FIRST_PASS_INTEGRATION_MATRIX.md"
  11: "11_MIMIC_VS_ANNEX_RULEBOOK.md"
  12: "12_CANONICAL_OBJECTS_AND_EVENTS.md"
  13: "13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md"
  14: "14_FRONTEND_ALIGNMENT_CONTRACT.md"
  15: "15_BACKEND_ALIGNMENT_CONTRACT.md"
  16: "16_TEST_AND_SMOKE_CONTRACT.md"
  17: "17_KNOWN_BUGS_AND_NON_KINTSUGI_ITEMS.md"
  18: "18_ADR_REGISTER.md"
  19: "19_OSS_CODE_READING_PLAN.md"
  20: "20_AI_GENERATION_GUARDRAILS.md"
  21: "21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md"
  22: "22_IMPLEMENTATION_BACKLOG_TEMPLATE.md"
```

### Canonical folder

```yaml
TARGET_DOC_FOLDER:
  CANONICAL_PATH: "docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/"
```

---

## 27. Reserved Terms

These terms are reserved and must keep their meanings.

| Term                | Canonical meaning                                               |
| ------------------- | --------------------------------------------------------------- |
| `Baseline`          | Raw unweighted aggregation of recorded events                   |
| `Reading`           | Declared derived aggregation, usually Smart Vote-owned          |
| `Lens`              | Declared transformation/filtering/weighting rule                |
| `SnapshotRef`       | Audit pointer for reproducible context                          |
| `Korum`             | Debate/argumentation ownership domain                           |
| `Konsultations`     | Intake/consultation/ballot/impact ownership domain              |
| `Smart Vote`        | Reading and publication layer                                   |
| `EkoH`              | Expertise/ethics context layer                                  |
| `Mimic`             | Native pattern reimplementation                                 |
| `Annex`             | Isolated sidecar/adapted external tool                          |
| `ExternalArtifact`  | Raw external artifact with provenance                           |
| `ProjectionMapping` | Mapping from external IDs to internal canonical objects         |
| `Claim`             | Conceptual Kialo-style argument unit; maps to `EthikosArgument` |
| `Impact Vote`       | Claim-level `0..4` score; not a topic stance                    |
| `Stance`            | Topic-level user stance `-3..+3`                                |

---

## 28. Forbidden Names and Substitutions

| Forbidden or discouraged | Use instead                      | Reason                                 |
| ------------------------ | -------------------------------- | -------------------------------------- |
| `DeliberationTopic`      | `EthikosTopic` or `Topic`        | Preserve existing model                |
| `DebatePost`             | `EthikosArgument` or `Argument`  | Preserve current semantics             |
| `OpinionVote`            | `EthikosStance` or `StanceEvent` | Stance is canonical                    |
| `KialoClaim`             | `EthikosArgument` / `Argument`   | No Kialo module in first pass          |
| `KialoVote`              | `ArgumentImpactVote`             | Avoid external naming                  |
| `VoteLens`               | `LensDeclaration`                | Canonical Smart Vote naming            |
| `WeightedResult`         | `ReadingResult`                  | Reading is broader and auditable       |
| `SmartVoteResult`        | `ReadingResult`                  | Avoid coupling object name to UI layer |
| `EkoHVote`               | Not allowed                      | EkoH does not vote                     |
| `/api/deliberation/...`  | `/api/ethikos/...`               | Preserve existing API                  |
| `/kialo/*`               | `/ethikos/deliberate/*`          | Kialo is mimic only                    |
| `konnaxion.kialo`        | `konnaxion.ethikos`              | No new backend app                     |
| `KintsugiShell`          | `EthikosPageShell`               | No second shell                        |

---

## 29. Parallel AI Generation Header

Every parallel AI conversation generating one Kintsugi doc SHOULD include the following instruction:

```text
Use 04_CANONICAL_NAMING_AND_VARIABLES.md as binding context.

Generate only the assigned document.
Do not reinterpret scope.
Do not introduce routes, models, endpoints, or architecture that conflict with the canonical variables.
If a prior document conflicts with this naming file, this naming file wins for names.
If this naming file conflicts with current code reality, current code reality wins for implemented names.
```

---

## 30. Anti-Drift Rules

```yaml
ANTI_DRIFT_RULES:
  - "Do not rename existing backend apps."
  - "Do not rename existing Ethikos models."
  - "Do not invent new route families."
  - "Do not create a separate Kialo module."
  - "Do not create a separate Kintsugi app."
  - "Do not convert EkoH into a voting engine."
  - "Do not let Smart Vote mutate upstream facts."
  - "Do not treat Kialo impact votes as Ethikos stances."
  - "Do not treat Kialo impact votes as Smart Vote ballots."
  - "Do not expand /api/home/*."
  - "Do not replace /api/ethikos/* with /api/deliberation/*."
  - "Do not use external OSS names as internal canonical model names."
  - "Do not generate implementation backlog inside naming/strategy docs."
  - "Do not use deferred OSS sources as first-pass implementation targets."
```

---

## 31. Non-Goals

This document does not:

* define the complete Kintsugi strategy;
* define database schema details;
* define migrations;
* define serializers;
* define frontend components in detail;
* define the route-by-route implementation plan;
* define the Smart Vote formula;
* define the EkoH snapshot schema;
* define the Kialo-style feature implementation;
* define the OSS code-reading procedure;
* generate implementation tasks.

Those belong to related docs.

---

## 32. Related Documents

| File                                            | Relationship                      |
| ----------------------------------------------- | --------------------------------- |
| `00_KINTSUGI_START_HERE.md`                     | Entry point and reading order     |
| `01_ETHIKOS_KINTSUGI_EXECUTION_STRATEGY.md`     | Strategic frame                   |
| `02_SOURCE_OF_TRUTH_AND_DRIFT_CONTROL.md`       | Source priority and drift rules   |
| `03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md`      | Ownership and write rules         |
| `05_CURRENT_STATE_BASELINE.md`                  | Current implementation state      |
| `06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md`     | Route mapping                     |
| `07_API_AND_SERVICE_CONTRACTS.md`               | API/service details               |
| `08_DATA_MODEL_AND_MIGRATION_PLAN.md`           | Schema/migration details          |
| `09_SMART_VOTE_EKOH_READING_CONTRACT.md`        | Smart Vote/EkoH reading rules     |
| `10_FIRST_PASS_INTEGRATION_MATRIX.md`           | OSS pattern matrix                |
| `11_MIMIC_VS_ANNEX_RULEBOOK.md`                 | External integration strategy     |
| `12_CANONICAL_OBJECTS_AND_EVENTS.md`            | Object/event definitions          |
| `13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md` | Payload and serializer contracts  |
| `14_FRONTEND_ALIGNMENT_CONTRACT.md`             | Frontend rules                    |
| `15_BACKEND_ALIGNMENT_CONTRACT.md`              | Backend rules                     |
| `16_TEST_AND_SMOKE_CONTRACT.md`                 | Test contract                     |
| `17_KNOWN_BUGS_AND_NON_KINTSUGI_ITEMS.md`       | Known non-architecture issues     |
| `18_ADR_REGISTER.md`                            | Architecture decisions            |
| `19_OSS_CODE_READING_PLAN.md`                   | OSS code inspection procedure     |
| `20_AI_GENERATION_GUARDRAILS.md`                | AI-specific guardrails            |
| `21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md`   | Kialo-style deliberation contract |
| `22_IMPLEMENTATION_BACKLOG_TEMPLATE.md`         | Future backlog format             |

---

## 33. Final Canonical Assertion

The ethiKos Kintsugi upgrade is a documentation-first, partial-native-mimic architecture upgrade.

The canonical implementation surface remains:

```txt
/ethikos/*
/api/ethikos/*
konnaxion.ethikos
EthikosTopic
EthikosStance
EthikosArgument
EthikosCategory
```

Korum and Konsultations remain ethiKos ownership domains.
Smart Vote publishes declared readings.
EkoH provides expertise and ethics context.
Kialo-style patterns strengthen `/ethikos/deliberate/*` without creating a Kialo module.
External civic tools are first-pass inspirations, not direct merges.

This document is the naming and variable authority for all other Kintsugi upgrade documentation.

```

Sources used for alignment: current ethiKos route/API/model reality, backend conventions, Smart Vote/EkoH boundary variables, and the Kialo-style deliberation corpus. :contentReference[oaicite:0]{index=0} :contentReference[oaicite:1]{index=1} :contentReference[oaicite:2]{index=2}
```

---

## V4.1 canonical EkoH access names

```yaml
EKOH_RATING_VISIBILITY: [public, scoped, private]
EKOH_RATING_ACCESS_LEVEL: [ratings, history]
EKOH_ACCESS_MODELS:
  - RatingVisibilitySetting
  - RatingAccessScope
  - RatingScopeSubject
  - RatingAccessGrant
EKOH_ACCESS_RESOLVER: resolve_rating_access
```

These names are canonical. Business-role names such as CEO or Supervisor are not EkoH role enums.

