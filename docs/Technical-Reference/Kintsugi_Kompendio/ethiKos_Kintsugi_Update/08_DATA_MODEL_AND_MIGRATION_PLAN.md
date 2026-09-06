# 08 — Data Model and Migration Plan

**File:** `08_DATA_MODEL_AND_MIGRATION_PLAN.md`
**Doc pack:** ethiKos Kintsugi Update Documentation Pack
**Status:** Draft for parallel documentation generation
**Mode:** Documentation-first architecture planning
**Primary owner:** ethiKos / Kintsugi planning
**Related docs:**

* `02_SOURCE_OF_TRUTH_AND_DRIFT_CONTROL.md`
* `03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md`
* `04_CANONICAL_NAMING_AND_VARIABLES.md`
* `06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md`
* `07_API_AND_SERVICE_CONTRACTS.md`
* `09_SMART_VOTE_EKOH_READING_CONTRACT.md`
* `12_CANONICAL_OBJECTS_AND_EVENTS.md`
* `13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md`
* `15_BACKEND_ALIGNMENT_CONTRACT.md`
* `20_AI_GENERATION_GUARDRAILS.md`
* `21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md`

---

## 1. Purpose

This document defines the **data model and migration plan** for the ethiKos Kintsugi upgrade.

The purpose is to provide a stable, non-drifting database design strategy that allows ethiKos to evolve from its current structured deliberation core into the Kintsugi civic pipeline without breaking existing routes, models, services, serializers, or migrations.

The Kintsugi upgrade MUST preserve the current ethiKos backend core:

* `EthikosCategory`
* `EthikosTopic`
* `EthikosStance`
* `EthikosArgument`

The current ethiKos backend is canonically centered on topics, stances, arguments, and categories, with frontend routes already implemented under `/ethikos/*` and backend API routes under `/api/ethikos/*`. 

This document does **not** define final implementation code. It defines the intended model boundaries, migration sequence, ownership rules, field semantics, and anti-drift constraints that future code generation MUST follow.

---

## 2. Scope

This document covers:

1. Current ethiKos data baseline.
2. Models that MUST be preserved.
3. Models that MAY be added for the Kintsugi first pass.
4. Models that SHOULD be deferred.
5. Migration sequencing.
6. Ownership boundaries between Korum, Konsultations, Smart Vote, EkoH, and annex/mimic integrations.
7. Required constraints, indexes, and immutability rules.
8. Explicit anti-drift rules for future AI-assisted implementation.

This document does **not** cover:

* Final serializer definitions.
* Final endpoint implementation.
* Frontend component implementation.
* Full OSS repository integration.
* Full backlog sequencing.
* Direct import of external civic-tech codebases.
* Replacement of the existing ethiKos backend app.

---

## 3. Canonical Variables Used

The following variables are binding for this document.

```yaml
DOCUMENT_NAME: "08_DATA_MODEL_AND_MIGRATION_PLAN.md"
KINTSUGI_UPDATE_TYPE: "documentation-first architecture upgrade"
IMPLEMENTATION_STYLE: "partial native mimic"
FULL_EXTERNAL_MERGE_ALLOWED: false
ANNEX_FIRST_PASS_ALLOWED: false
BIG_BANG_REWRITE_ALLOWED: false

PRIMARY_BACKEND_APP: "konnaxion.ethikos"
PRIMARY_ROUTE_SURFACE: "/ethikos/*"
PRIMARY_API_PREFIX: "/api/ethikos/*"

CURRENT_ETHIKOS_MODELS:
  - "EthikosCategory"
  - "EthikosTopic"
  - "EthikosStance"
  - "EthikosArgument"

BREAK_EXISTING_MODELS: false
RENAME_EXISTING_MODELS: false
DELETE_EXISTING_FIELDS: false
ADD_NON_BREAKING_TABLES_ALLOWED: true
ADD_NON_BREAKING_FIELDS_ALLOWED: true

KORUM_OWNS:
  - "topics"
  - "stances"
  - "arguments"
  - "argument moderation"

KONSULTATIONS_OWNS:
  - "intake"
  - "ballots"
  - "result snapshots"
  - "impact tracking"

SMART_VOTE_OWNS:
  - "readings"
  - "lens declarations"
  - "aggregations"
  - "result publication"

EKOH_OWNS:
  - "expertise context"
  - "ethics context"
  - "cohort eligibility"
  - "snapshots"

KIALO_STRATEGY: "native_mimic"
KIALO_ROUTE_SCOPE: "/ethikos/deliberate/*"
KIALO_BACKEND_SCOPE: "konnaxion.ethikos"
KIALO_CLAIM_MAPPING: "Claim -> EthikosArgument"
KIALO_IMPACT_VOTE_IS_TOPIC_STANCE: false

SMART_VOTE_MUTATES_SOURCE_FACTS: false
FOREIGN_TOOLS_WRITE_CORE_TABLES: false
```

---

## 4. Source-of-Truth Priority

When data model questions conflict, use this priority order:

1. **Current code snapshot**
   Determines current files, apps, routes, models, migrations, serializers, and registered endpoints.

2. **Boundaries and ownership contracts**
   Determines which module owns which data and which module is allowed to write.

3. **Kintsugi clean-slate plan**
   Determines first-pass scope, deferred scope, and documentation-first ordering.

4. **Kialo-style argument mapping contract**
   Determines structured deliberation concepts for Korum / Deliberate.

5. **OSS source docs**
   Provide pattern inspiration only. They do not override ethiKos architecture.

6. **Older conceptual docs**
   Useful only after being corrected against the current route and model reality.

---

## 5. Current Data Baseline

### 5.1 Current backend app

The current canonical backend app for ethiKos is:

```txt
konnaxion.ethikos
```

The backend uses Django REST Framework ViewSets, serializers, and a central API router. The project documentation and code snapshot identify `/api/ethikos/topics/`, `/api/ethikos/stances/`, `/api/ethikos/arguments/`, and `/api/ethikos/categories/` as the canonical ethiKos API routes, with compatibility aliases under `/api/deliberate/...` and `/api/deliberate/elite/...`. 

### 5.2 Current canonical models

The current canonical models are:

```txt
EthikosCategory
EthikosTopic
EthikosStance
EthikosArgument
```

The current technical reference defines these as the canonical current ethiKos tables, with `EthikosTopic` as the debate/consultation prompt, `EthikosStance` as a topic-level numeric stance, and `EthikosArgument` as a threaded discussion entry with optional parent and side semantics. 

### 5.3 Current model semantics

#### `EthikosCategory`

Purpose:

```txt
Thematic grouping for ethiKos topics.
```

Current role:

* Groups topics.
* Supports category selection at topic creation.
* Used by frontend filtering and topic organization.

Preservation rule:

```yaml
RENAME_MODEL: false
DELETE_MODEL: false
BREAK_EXISTING_SERIALIZER_FIELDS: false
```

---

#### `EthikosTopic`

Purpose:

```txt
Main debate, deliberation, or consultation prompt container.
```

Current role:

* Holds topic title and description.
* Tracks status such as `open`, `closed`, `archived`.
* Links to category.
* Links to creator.
* May include `expertise_category`.
* Acts as the current root object for both deliberation and decision surfaces.

Preservation rule:

```yaml
RENAME_MODEL: false
DELETE_MODEL: false
USE_AS_KIALO_DISCUSSION_CONTAINER: true
USE_AS_KONSULTATION_TOPIC_CONTAINER: true
```

Kintsugi mapping:

```yaml
EthikosTopic:
  Korum: "Discussion / thesis container"
  Konsultations: "Consultation prompt / issue container"
  Kialo-style: "Discussion"
  DemocracyOS-style: "Proposal debate container"
  Loomio-style: "Proposal discussion anchor"
```

---

#### `EthikosStance`

Purpose:

```txt
Per-user topic-level stance.
```

Current role:

* Stores one user’s position on one topic.
* Uses numeric stance value constrained to `-3..+3`.
* Must remain distinct from Kialo-style argument impact voting and Smart Vote readings.

Preservation rule:

```yaml
RENAME_MODEL: false
DELETE_MODEL: false
STANCE_VALUE_RANGE: "-3..+3"
CLAIM_IMPACT_VOTE_IS_STANCE: false
SMART_VOTE_READING_IS_STANCE: false
```

Kintsugi mapping:

```yaml
EthikosStance:
  Owner: "Korum"
  Level: "topic-level"
  Meaning: "User stance on a topic"
  Not: "claim-level impact vote"
  Not: "Smart Vote reading"
```

---

#### `EthikosArgument`

Purpose:

```txt
Threaded argument / claim under an ethiKos topic.
```

Current role:

* Stores argument text.
* Links to topic.
* Links to user.
* Supports optional `parent`.
* Supports optional `side`, such as pro/con.
* Supports moderation visibility through `is_hidden`.

The backend model includes `parent`, `side`, and `is_hidden`, which makes it suitable as the native foundation for Kialo-style claim graphs without renaming or replacing it. 

Preservation rule:

```yaml
RENAME_MODEL: false
DELETE_MODEL: false
DO_NOT_RENAME_TO_CLAIM: true
USE_AS_KIALO_CLAIM: true
```

Kintsugi mapping:

```yaml
EthikosArgument:
  Korum: "Argument node"
  Kialo-style: "Claim"
  Consider.it-style: "Reason"
  DemocracyOS-style: "Discussion argument"
```

---

## 6. Non-Breaking Migration Policy

The Kintsugi data model MUST follow a non-breaking migration strategy.

### 6.1 Allowed

The following are allowed:

```yaml
ADD_NEW_TABLES: true
ADD_NULLABLE_FIELDS: true
ADD_FIELDS_WITH_SAFE_DEFAULTS: true
ADD_INDEXES: true
ADD_CONSTRAINTS_ONLY_AFTER_DATA_VALIDATION: true
ADD_READ_ONLY_DERIVED_TABLES: true
ADD_SERVICE_LAYER_AROUND_EXISTING_MODELS: true
```

### 6.2 Forbidden

The following are forbidden in the Kintsugi first pass:

```yaml
RENAME_EXISTING_TABLES: false
RENAME_EXISTING_MODELS: false
DELETE_EXISTING_TABLES: false
DELETE_EXISTING_FIELDS: false
CHANGE_PRIMARY_KEY_TYPES: false
CHANGE_EXISTING_ENDPOINT_PREFIXES: false
CHANGE_ETHIKOS_STANCE_RANGE: false
MERGE_SMART_VOTE_INTO_ETHIKOS_STANCE: false
MERGE_KIALO_IMPACT_VOTES_INTO_ETHIKOS_STANCE: false
CREATE_KIALO_APP: false
CREATE_FULL_OSS_IMPORT_TABLES: false
```

### 6.3 Migration safety rule

Every Kintsugi migration MUST be safe under the following assumption:

```txt
Existing ethiKos topics, stances, arguments, categories, users, and votes already exist and must remain readable after migration.
```

---

## 7. Ownership Boundaries

### 7.1 Korum-owned data

Korum owns the structured debate layer.

Korum-owned objects:

```txt
EthikosTopic
EthikosStance
EthikosArgument
ArgumentSource
ArgumentImpactVote
ArgumentSuggestion
DiscussionParticipantRole
DiscussionVisibilitySetting
ModerationAction
```

Korum MAY write:

* topic deliberation metadata;
* argument graph metadata;
* topic-level stances;
* claim-level impact votes;
* claim sources;
* suggested claims;
* visibility settings.

Korum MUST NOT write:

* Smart Vote derived readings;
* EkoH expertise scores;
* Konsultations ballot results;
* external tool source tables.

---

### 7.2 Konsultations-owned data

Konsultations owns intake, ballots, result snapshots, and impact tracking.

Konsultations-owned objects:

```txt
IntakeSubmission
DecisionRecord
BallotEvent
ImpactTrack
ImpactUpdate
```

Konsultations MAY write:

* intake submissions;
* consultation options;
* ballot events;
* baseline result snapshots;
* impact tracking updates.

Konsultations MUST NOT write:

* Kialo-style claim impact votes;
* Smart Vote weighted readings;
* EkoH expertise snapshots.

---

### 7.3 Smart Vote-owned data

Smart Vote owns derived readings and published interpretations.

Smart Vote-owned objects:

```txt
LensDeclaration
ReadingResult
BaselineResult
```

Smart Vote MAY write:

* declared lens definitions;
* computed reading results;
* publication metadata;
* reproducibility metadata.

Smart Vote MUST NOT mutate:

* `EthikosTopic`
* `EthikosStance`
* `EthikosArgument`
* Konsultations ballot source events
* EkoH expertise source records

The Smart Vote / EkoH integration settings already indicate a separate Smart Vote / EkoH integration layer, with Smart Vote aggregation scheduled separately from ethiKos CRUD behavior. 

---

### 7.4 EkoH-owned data

EkoH owns expertise, ethics, cohort, and snapshot context.

EkoH MAY provide:

* expertise categories;
* cohort eligibility;
* score snapshots;
* contextual analysis;
* ethics/expertise metadata.

EkoH MUST NOT:

* become the voting engine;
* mutate baseline votes;
* mutate topic stances;
* mutate Kialo-style impact votes;
* publish readings without Smart Vote boundary.

---

### 7.5 External tool boundary data

External tools may only be represented through boundary objects.

External tool boundary objects:

```txt
ExternalArtifact
ProjectionMapping
```

Foreign tools MUST NOT write directly to:

```txt
EthikosTopic
EthikosStance
EthikosArgument
DecisionRecord
ReadingResult
ImpactTrack
```

---

## 8. Proposed First-Pass Model Set

The following models are first-pass candidates. They are not all mandatory for the first migration, but they define the allowed model vocabulary.

### 8.1 Decision models

#### `DecisionProtocol`

Purpose:

```txt
Defines how a decision is opened, evaluated, closed, and published.
```

Owner:

```txt
Konsultations / Decide
```

Suggested fields:

```yaml
id: BigAutoField
key: SlugField(unique=True)
label: CharField
description: TextField(blank=True)
protocol_type: CharField
is_active: BooleanField(default=True)
created_at: DateTimeField(auto_now_add=True)
updated_at: DateTimeField(auto_now=True)
```

Suggested `protocol_type` values:

```txt
simple_majority
stance_distribution
consent_check
ranked_option
expertise_weighted_reading
manual_publication
```

Migration notes:

* Add as a standalone table.
* No existing data backfill required.
* Safe first migration candidate.

---

#### `DecisionRecord`

Purpose:

```txt
Represents a formal decision process derived from a topic, consultation, or proposal.
```

Owner:

```txt
Konsultations / Decide
```

Suggested fields:

```yaml
id: BigAutoField
topic: ForeignKey(EthikosTopic, null=True, blank=True)
protocol: ForeignKey(DecisionProtocol, null=True, blank=True)
title: CharField
description: TextField(blank=True)
status: CharField
opened_at: DateTimeField(null=True, blank=True)
closed_at: DateTimeField(null=True, blank=True)
published_at: DateTimeField(null=True, blank=True)
created_by: ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True)
created_at: DateTimeField(auto_now_add=True)
updated_at: DateTimeField(auto_now=True)
```

Suggested `status` values:

```txt
draft
open
closed
published
archived
```

Constraints:

```yaml
closed_at_required_when_status_closed: true
published_at_required_when_status_published: true
```

Indexes:

```yaml
- ["topic"]
- ["status"]
- ["created_by"]
- ["opened_at"]
- ["closed_at"]
```

Migration notes:

* Add after `DecisionProtocol`.
* Existing closed topics MAY later be backfilled into `DecisionRecord`, but first migration SHOULD NOT require this.
* Backfill must be optional and reversible.

---

#### `EligibilityRule`

Purpose:

```txt
Defines who can participate in a decision, ballot, or reading cohort.
```

Owner:

```txt
Konsultations / Admin
```

Suggested fields:

```yaml
id: BigAutoField
decision: ForeignKey(DecisionRecord, null=True, blank=True)
key: SlugField
label: CharField
rule_type: CharField
rule_payload: JSONField(default=dict, blank=True)
is_active: BooleanField(default=True)
created_at: DateTimeField(auto_now_add=True)
updated_at: DateTimeField(auto_now=True)
```

Suggested `rule_type` values:

```txt
public
authenticated
ethikos_elite
staff
ekoh_cohort
manual_allowlist
```

Migration notes:

* First pass optional.
* Useful for CONSUL-style eligibility and route-level elite/public distinction.
* Should not replace existing permissions immediately.

---

## 9. Smart Vote / Reading Models

### 9.1 `LensDeclaration`

Purpose:

```txt
Declares how a Smart Vote reading is computed.
```

Owner:

```txt
Smart Vote
```

Suggested fields:

```yaml
id: BigAutoField
reading_key: SlugField(unique=True)
label: CharField
description: TextField(blank=True)
lens_type: CharField
lens_payload: JSONField(default=dict, blank=True)
lens_hash: CharField(max_length=128)
is_active: BooleanField(default=True)
created_by: ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True)
created_at: DateTimeField(auto_now_add=True)
updated_at: DateTimeField(auto_now=True)
```

Suggested `lens_type` values:

```txt
raw_unweighted
cohort_filtered
expertise_weighted
ethics_adjusted
domain_specific
comparative
```

Constraints:

```yaml
reading_key_unique: true
lens_hash_required: true
```

Migration notes:

* Add before `ReadingResult`.
* `raw_unweighted` SHOULD be seeded as the baseline lens.
* Hash calculation can be service-level; migration does not need to compute all hashes initially.

---

### 9.2 `ReadingResult`

Purpose:

```txt
Stores a computed Smart Vote reading for a topic, decision, or consultation snapshot.
```

Owner:

```txt
Smart Vote
```

Suggested fields:

```yaml
id: BigAutoField
lens: ForeignKey(LensDeclaration)
topic: ForeignKey(EthikosTopic, null=True, blank=True)
decision: ForeignKey(DecisionRecord, null=True, blank=True)
snapshot_ref: CharField(max_length=255, blank=True)
results_payload: JSONField(default=dict)
input_hash: CharField(max_length=128, blank=True)
lens_hash: CharField(max_length=128)
computed_at: DateTimeField
published_at: DateTimeField(null=True, blank=True)
status: CharField
created_at: DateTimeField(auto_now_add=True)
updated_at: DateTimeField(auto_now=True)
```

Suggested `status` values:

```txt
pending
computed
published
invalidated
```

Constraints:

```yaml
must_reference_topic_or_decision: true
lens_hash_required: true
results_payload_required: true
```

Indexes:

```yaml
- ["lens"]
- ["topic"]
- ["decision"]
- ["status"]
- ["computed_at"]
- ["snapshot_ref"]
```

Migration notes:

* Add after `LensDeclaration`.
* Do not compute readings in schema migration.
* Computation belongs in service/task layer.
* Existing stance data remains source data and must not be overwritten.

---

## 10. Drafting Models

### 10.1 `Draft`

Purpose:

```txt
Represents a collaborative draft derived from a topic, decision, or consultation process.
```

Owner:

```txt
ethiKos bounded drafting capability
```

Suggested fields:

```yaml
id: BigAutoField
topic: ForeignKey(EthikosTopic, null=True, blank=True)
decision: ForeignKey(DecisionRecord, null=True, blank=True)
title: CharField
summary: TextField(blank=True)
status: CharField
created_by: ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True)
created_at: DateTimeField(auto_now_add=True)
updated_at: DateTimeField(auto_now=True)
```

Suggested `status` values:

```txt
draft
review
accepted
superseded
archived
```

Migration notes:

* Add as standalone drafting table.
* Does not replace `EthikosTopic.description`.
* Does not store argument graph content directly.

---

### 10.2 `DraftVersion`

Purpose:

```txt
Stores immutable versions of a Draft.
```

Owner:

```txt
ethiKos bounded drafting capability
```

Suggested fields:

```yaml
id: BigAutoField
draft: ForeignKey(Draft)
version_number: PositiveIntegerField
body: TextField
summary: TextField(blank=True)
created_by: ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True)
created_at: DateTimeField(auto_now_add=True)
```

Constraints:

```yaml
unique_draft_version_number: ["draft", "version_number"]
version_body_immutable_after_creation: true
```

Indexes:

```yaml
- ["draft", "version_number"]
- ["created_at"]
```

Migration notes:

* Add after `Draft`.
* Do not update existing versions in place except through admin-only correction workflows.
* Normal changes create new versions.

---

### 10.3 `Amendment`

Purpose:

```txt
Represents a proposed change to a draft or draft version.
```

Owner:

```txt
ethiKos bounded drafting capability
```

Suggested fields:

```yaml
id: BigAutoField
draft: ForeignKey(Draft)
base_version: ForeignKey(DraftVersion, null=True, blank=True)
title: CharField
body: TextField
rationale: TextField(blank=True)
status: CharField
submitted_by: ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True)
created_at: DateTimeField(auto_now_add=True)
updated_at: DateTimeField(auto_now=True)
resolved_at: DateTimeField(null=True, blank=True)
```

Suggested `status` values:

```txt
submitted
under_review
accepted
rejected
withdrawn
superseded
```

Migration notes:

* Add after `DraftVersion`.
* Must not mutate `DraftVersion` directly.
* Accepted amendments may produce a new `DraftVersion`.

---

### 10.4 `RationalePacket`

Purpose:

```txt
Captures the argumentation, evidence, and decision rationale attached to a draft, decision, or amendment.
```

Owner:

```txt
ethiKos bounded drafting capability / Decide
```

Suggested fields:

```yaml
id: BigAutoField
topic: ForeignKey(EthikosTopic, null=True, blank=True)
decision: ForeignKey(DecisionRecord, null=True, blank=True)
draft: ForeignKey(Draft, null=True, blank=True)
amendment: ForeignKey(Amendment, null=True, blank=True)
summary: TextField
supporting_arguments: ManyToManyField(EthikosArgument, blank=True)
payload: JSONField(default=dict, blank=True)
created_by: ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True)
created_at: DateTimeField(auto_now_add=True)
```

Migration notes:

* First pass optional.
* Useful for turning deliberation outputs into decision-ready explanations.
* Must reference arguments rather than copy argument text unless snapshotting is explicitly required.

---

## 11. Impact Models

### 11.1 `ImpactTrack`

Purpose:

```txt
Tracks implementation, follow-through, and accountability after a decision.
```

Owner:

```txt
Konsultations / Impact
```

Suggested fields:

```yaml
id: BigAutoField
decision: ForeignKey(DecisionRecord, null=True, blank=True)
topic: ForeignKey(EthikosTopic, null=True, blank=True)
title: CharField
description: TextField(blank=True)
status: CharField
owner_label: CharField(blank=True)
public_summary: TextField(blank=True)
started_at: DateTimeField(null=True, blank=True)
due_at: DateTimeField(null=True, blank=True)
completed_at: DateTimeField(null=True, blank=True)
created_by: ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True)
created_at: DateTimeField(auto_now_add=True)
updated_at: DateTimeField(auto_now=True)
```

Suggested `status` values:

```txt
planned
in_progress
blocked
completed
cancelled
```

Indexes:

```yaml
- ["decision"]
- ["topic"]
- ["status"]
- ["due_at"]
```

Migration notes:

* Impact data belongs to ethiKos/Konsultations truth.
* KeenKonnect project references may be linked later, but KeenKonnect must not become the canonical source of civic impact truth.

---

### 11.2 `ImpactUpdate`

Purpose:

```txt
Stores timestamped updates on an ImpactTrack.
```

Owner:

```txt
Konsultations / Impact
```

Suggested fields:

```yaml
id: BigAutoField
impact_track: ForeignKey(ImpactTrack)
title: CharField
body: TextField
status_after_update: CharField(blank=True)
created_by: ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True)
created_at: DateTimeField(auto_now_add=True)
```

Migration notes:

* Add after `ImpactTrack`.
* Supports accountability timeline without mutating old updates.

---

## 12. Kialo-Style Argument Mapping Models

The Kialo-style models extend Korum / Deliberate. They MUST live under the ethiKos backend scope during the first pass.

Kialo-style source material distinguishes claim voting, source attachment, author visibility, voting visibility, and discussion topology. Claim impact voting is explicitly based on a claim’s veracity and relevance to its parent, with ratings from `0` to `4`; this must remain separate from topic-level ethiKos stances. 

### 12.1 `ArgumentSource`

Purpose:

```txt
Attaches a source, citation, quote, or evidence note to an EthikosArgument.
```

Owner:

```txt
Korum / Deliberate
```

Suggested fields:

```yaml
id: BigAutoField
argument: ForeignKey(EthikosArgument)
source_type: CharField
label: CharField(blank=True)
url: URLField(blank=True)
citation: TextField(blank=True)
quote: TextField(blank=True)
note: TextField(blank=True)
created_by: ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True)
created_at: DateTimeField(auto_now_add=True)
updated_at: DateTimeField(auto_now=True)
```

Suggested `source_type` values:

```txt
url
citation
textbook
paper
news
other
```

Indexes:

```yaml
- ["argument"]
- ["created_by"]
```

Migration notes:

* First-pass recommended.
* Does not change `EthikosArgument.content`.
* Supports Kialo-style source/citation behavior.

---

### 12.2 `ArgumentImpactVote`

Purpose:

```txt
Stores claim-level impact votes on an EthikosArgument.
```

Owner:

```txt
Korum / Deliberate
```

Suggested fields:

```yaml
id: BigAutoField
argument: ForeignKey(EthikosArgument)
user: ForeignKey(settings.AUTH_USER_MODEL)
value: PositiveSmallIntegerField
created_at: DateTimeField(auto_now_add=True)
updated_at: DateTimeField(auto_now=True)
```

Constraints:

```yaml
unique_user_argument_vote: ["argument", "user"]
value_min: 0
value_max: 4
```

Indexes:

```yaml
- ["argument"]
- ["user"]
- ["value"]
```

Critical distinction:

```yaml
ArgumentImpactVote_IS_EthikosStance: false
ArgumentImpactVote_IS_BallotEvent: false
ArgumentImpactVote_IS_SmartVoteReading: false
```

Migration notes:

* First-pass recommended.
* Do not merge into `EthikosStance`.
* Do not use for Smart Vote ballot aggregation unless a future reading explicitly declares it as an input.

---

### 12.3 `ArgumentSuggestion`

Purpose:

```txt
Stores proposed claims submitted by users who do not have direct write permission or when moderation requires approval.
```

Owner:

```txt
Korum / Deliberate
```

Suggested fields:

```yaml
id: BigAutoField
topic: ForeignKey(EthikosTopic)
parent_argument: ForeignKey(EthikosArgument, null=True, blank=True)
suggested_side: CharField(blank=True)
content: TextField
status: CharField
submitted_by: ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True)
reviewed_by: ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True)
created_argument: ForeignKey(EthikosArgument, null=True, blank=True)
created_at: DateTimeField(auto_now_add=True)
reviewed_at: DateTimeField(null=True, blank=True)
```

Suggested `status` values:

```txt
submitted
accepted
rejected
withdrawn
superseded
```

Constraints:

```yaml
accepted_suggestion_should_reference_created_argument: true
```

Migration notes:

* First-pass recommended if role-aware participation is introduced.
* Accepting a suggestion creates an `EthikosArgument`; the suggestion itself remains an audit record.

---

### 12.4 `DiscussionParticipantRole`

Purpose:

```txt
Assigns a user a role within a topic/discussion.
```

Owner:

```txt
Korum / Admin
```

Suggested fields:

```yaml
id: BigAutoField
topic: ForeignKey(EthikosTopic)
user: ForeignKey(settings.AUTH_USER_MODEL)
role: CharField
created_by: ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, related_name="+")
created_at: DateTimeField(auto_now_add=True)
updated_at: DateTimeField(auto_now=True)
```

Suggested `role` values:

```txt
owner
admin
editor
writer
suggester
viewer
```

Constraints:

```yaml
unique_topic_user_role: ["topic", "user"]
```

Migration notes:

* Optional first-pass.
* Should not replace Django permissions globally.
* Applies only to ethiKos topic/discussion participation.

---

### 12.5 `DiscussionVisibilitySetting`

Purpose:

```txt
Stores discussion-level visibility, anonymity, author display, voting visibility, and topology settings.
```

Owner:

```txt
Korum / Admin
```

Suggested fields:

```yaml
id: BigAutoField
topic: OneToOneField(EthikosTopic)
participation_type: CharField
author_visibility: CharField
vote_visibility: CharField
discussion_topology: CharField
allow_claim_voting: BooleanField(default=False)
allow_suggestions: BooleanField(default=True)
created_at: DateTimeField(auto_now_add=True)
updated_at: DateTimeField(auto_now=True)
```

Suggested values:

```yaml
participation_type:
  - standard
  - anonymous

author_visibility:
  - never
  - admins_only
  - all

vote_visibility:
  - all
  - admins_only
  - self_only

discussion_topology:
  - single_thesis
  - multi_thesis
```

Kialo-style author display and vote visibility settings are discussion-level controls; author attribution can be hidden, admin-only, or visible to all, and vote visibility can be configured so all users, only admins, or only the voter can see impact votes. 

Migration notes:

* Recommended first-pass if Kialo-style permissions are implemented.
* Existing topics can receive default settings via data migration or lazy creation.
* Recommended defaults:

```yaml
participation_type: "standard"
author_visibility: "all"
vote_visibility: "all"
discussion_topology: "single_thesis"
allow_claim_voting: false
allow_suggestions: true
```

---

## 13. External Tool Boundary Models

### 13.1 `ExternalArtifact`

Purpose:

```txt
Stores metadata about an external artifact without importing or merging the external tool into core ethiKos.
```

Owner:

```txt
Integration boundary
```

Suggested fields:

```yaml
id: BigAutoField
source_system: CharField
artifact_type: CharField
external_id: CharField(blank=True)
title: CharField(blank=True)
metadata: JSONField(default=dict, blank=True)
created_at: DateTimeField(auto_now_add=True)
updated_at: DateTimeField(auto_now=True)
```

Suggested `source_system` values:

```txt
consider_it
kialo_style
loomio
citizen_os
decidim
consul_democracy
democracy_os
other
```

Migration notes:

* First pass optional.
* Required only if an annex/adapter boundary is introduced.
* Does not authorize external tools to write core tables.

---

### 13.2 `ProjectionMapping`

Purpose:

```txt
Maps external artifacts to native ethiKos objects without making the external artifact the source of truth.
```

Owner:

```txt
Integration boundary
```

Suggested fields:

```yaml
id: BigAutoField
external_artifact: ForeignKey(ExternalArtifact)
target_model: CharField
target_id: CharField
mapping_type: CharField
mapping_payload: JSONField(default=dict, blank=True)
created_at: DateTimeField(auto_now_add=True)
updated_at: DateTimeField(auto_now=True)
```

Suggested `mapping_type` values:

```txt
inspiration
projection
import_snapshot
export_snapshot
reference_link
```

Migration notes:

* First pass optional.
* Required for future annex safety.
* Do not use this as a shortcut for full OSS merge.

---

## 14. Deferred Kialo-Style Models

The following models are useful but SHOULD be deferred unless the first-pass scope explicitly expands.

### 14.1 `ArgumentBookmark`

Purpose:

```txt
Allows users to bookmark claims or branches.
```

Status:

```yaml
FIRST_PASS: false
DEFERRED: true
```

Reason:

```txt
Useful UX feature, but not necessary for Kintsugi data legitimacy or migration foundation.
```

---

### 14.2 `ArgumentLink`

Purpose:

```txt
Links claims across branches or discussions.
```

Status:

```yaml
FIRST_PASS: false
DEFERRED: true
```

Reason:

```txt
Cross-discussion links add graph complexity and should follow after the core argument tree is stable.
```

---

### 14.3 `DiscussionTemplate`

Purpose:

```txt
Stores reusable discussion structures.
```

Status:

```yaml
FIRST_PASS: false
DEFERRED: true
```

Reason:

```txt
Template cloning is useful but not essential to first-pass Korum/Kintsugi alignment.
```

---

### 14.4 `DiscussionGroup`

Purpose:

```txt
Supports small group discussion modes.
```

Status:

```yaml
FIRST_PASS: false
DEFERRED: true
```

Reason:

```txt
Small-group mode introduces group partitioning, moderation complexity, and visibility concerns.
```

---

### 14.5 `DiscussionPerspective`

Purpose:

```txt
Stores perspective-specific views of claim impact or argument interpretation.
```

Status:

```yaml
FIRST_PASS: false
DEFERRED: true
```

Reason:

```txt
Perspectives overlap with Smart Vote lenses and must be designed jointly with reading contracts.
```

---

### 14.6 `DiscussionExport`

Purpose:

```txt
Tracks generated exports of discussions or argument trees.
```

Status:

```yaml
FIRST_PASS: false
DEFERRED: true
```

Reason:

```txt
Export is a downstream capability; it should follow after canonical object and snapshot policies are stable.
```

---

## 15. Migration Sequence

The migration sequence MUST minimize risk and keep each migration reversible where practical.

### 15.1 Phase 0 — Baseline verification

Before any Kintsugi migration:

```txt
Verify current migrations apply cleanly.
Verify EthikosCategory exists.
Verify EthikosTopic creation works.
Verify EthikosStance creation works.
Verify EthikosArgument creation works.
Verify EkoH migration 0002 has already been applied.
```

No schema changes in this phase.

---

### 15.2 Phase 1 — Safe Korum extensions

Recommended first migration group:

```txt
ArgumentSource
ArgumentImpactVote
ArgumentSuggestion
DiscussionParticipantRole
DiscussionVisibilitySetting
```

Reason:

* Extends existing Deliberate/Korum data.
* Uses `EthikosTopic` and `EthikosArgument` as anchors.
* Does not affect current topic, stance, or argument writes.
* Enables Kialo-style claim graph refinement.

Required migration properties:

```yaml
depends_on:
  - "ethikos existing latest migration"

data_backfill_required: false
safe_for_empty_tables: true
safe_for_existing_topics: true
```

Optional data migration:

```txt
Create default DiscussionVisibilitySetting for existing topics.
```

This data migration should be safe, idempotent, and rerunnable.

---

### 15.3 Phase 2 — Decision and drafting foundation

Recommended second migration group:

```txt
DecisionProtocol
DecisionRecord
Draft
DraftVersion
Amendment
RationalePacket
```

Reason:

* Adds Decide/Drafting foundation.
* Does not alter `EthikosTopic`.
* Allows topics to become decision anchors without changing topic semantics.

Required migration properties:

```yaml
decision_protocol_seed_allowed: true
existing_topic_backfill_required: false
draft_version_body_immutable_policy_documented: true
```

Optional seed data:

```txt
DecisionProtocol: raw_stance_distribution
DecisionProtocol: consent_check
DecisionProtocol: manual_publication
```

---

### 15.4 Phase 3 — Smart Vote reading foundation

Recommended third migration group:

```txt
LensDeclaration
ReadingResult
```

Reason:

* Adds the reading layer after source data and decision anchors exist.
* Keeps Smart Vote derived outputs separate from stances and ballots.

Required migration properties:

```yaml
seed_baseline_lens: true
compute_readings_in_migration: false
require_lens_hash: true
require_snapshot_ref_field: true
```

Recommended seed data:

```yaml
LensDeclaration:
  reading_key: "raw_unweighted"
  label: "Raw unweighted baseline"
  lens_type: "raw_unweighted"
```

---

### 15.5 Phase 4 — Impact foundation

Recommended fourth migration group:

```txt
ImpactTrack
ImpactUpdate
```

Reason:

* Adds accountability layer after decisions exist.
* Prevents premature coupling to KeenKonnect project data.

Required migration properties:

```yaml
impact_can_reference_decision: true
impact_can_reference_topic: true
keenkonnect_is_not_canonical_impact_truth: true
```

---

### 15.6 Phase 5 — External boundary foundation

Recommended fifth migration group:

```txt
ExternalArtifact
ProjectionMapping
```

Reason:

* Enables future annex/adapter safety.
* Not required for first-pass native mimic if no external artifacts are persisted.

Required migration properties:

```yaml
foreign_tools_write_core_tables: false
external_artifacts_are_not_source_truth: true
projection_mapping_is_boundary_only: true
```

---

## 16. Model Dependency Map

```txt
EthikosCategory
  └── EthikosTopic
        ├── EthikosStance
        ├── EthikosArgument
        │     ├── EthikosArgument.parent
        │     ├── ArgumentSource
        │     ├── ArgumentImpactVote
        │     └── ArgumentSuggestion.parent_argument
        ├── DiscussionVisibilitySetting
        ├── DiscussionParticipantRole
        ├── DecisionRecord
        │     ├── ReadingResult
        │     ├── Draft
        │     └── ImpactTrack
        ├── Draft
        │     ├── DraftVersion
        │     └── Amendment
        └── ReadingResult

DecisionProtocol
  └── DecisionRecord

LensDeclaration
  └── ReadingResult

ImpactTrack
  └── ImpactUpdate

ExternalArtifact
  └── ProjectionMapping
```

---

## 17. Index Strategy

### 17.1 Required indexes

The following indexes SHOULD be included where models are implemented.

```yaml
EthikosTopic:
  existing:
    - ["status"]
    - ["category"]
    - ["created_by"]

EthikosStance:
  required:
    - ["topic"]
    - ["user"]
    - ["value"]

EthikosArgument:
  existing_or_required:
    - ["topic"]
    - ["user"]
    - ["parent"]
    - ["side"]
    - ["is_hidden"]

ArgumentSource:
  required:
    - ["argument"]
    - ["created_by"]

ArgumentImpactVote:
  required:
    - ["argument"]
    - ["user"]
    - ["value"]

ArgumentSuggestion:
  required:
    - ["topic"]
    - ["parent_argument"]
    - ["status"]
    - ["submitted_by"]

DecisionRecord:
  required:
    - ["topic"]
    - ["protocol"]
    - ["status"]
    - ["opened_at"]
    - ["closed_at"]

ReadingResult:
  required:
    - ["lens"]
    - ["topic"]
    - ["decision"]
    - ["status"]
    - ["computed_at"]
    - ["snapshot_ref"]

ImpactTrack:
  required:
    - ["decision"]
    - ["topic"]
    - ["status"]
    - ["due_at"]
```

### 17.2 Unique constraints

Recommended unique constraints:

```yaml
EthikosStance:
  - ["topic", "user"]

ArgumentImpactVote:
  - ["argument", "user"]

DiscussionVisibilitySetting:
  - ["topic"]

DiscussionParticipantRole:
  - ["topic", "user"]

DraftVersion:
  - ["draft", "version_number"]

LensDeclaration:
  - ["reading_key"]

ReadingResult:
  recommended_contextual_uniqueness:
    - ["lens", "topic", "decision", "snapshot_ref", "input_hash"]
```

---

## 18. Data Integrity Rules

### 18.1 Topic-level stance integrity

```yaml
EthikosStance.value:
  min: -3
  max: 3
```

Rules:

* A stance is a user’s position on a topic.
* A stance is not a claim impact vote.
* A stance is not a ballot event unless an explicit decision protocol says it is used as one of its inputs.
* A stance is not a Smart Vote reading.

---

### 18.2 Claim-level impact vote integrity

```yaml
ArgumentImpactVote.value:
  min: 0
  max: 4
```

Rules:

* Impact votes evaluate an argument/claim.
* Impact votes evaluate relevance and veracity relative to the parent claim.
* Impact votes do not replace topic stances.
* Impact votes must support visibility rules.
* Impact votes may be hidden from peers depending on `DiscussionVisibilitySetting.vote_visibility`.

---

### 18.3 Reading integrity

```yaml
ReadingResult:
  must_have_lens: true
  must_have_results_payload: true
  must_have_lens_hash: true
  must_have_computed_at: true
```

Rules:

* Readings are derived outputs.
* Readings must be reproducible.
* Readings must not mutate baseline records.
* Readings must declare their lens.
* Readings must be invalidated, not silently overwritten, when source assumptions change.

---

### 18.4 Draft version integrity

Rules:

* `DraftVersion` is immutable after creation.
* New draft changes create new versions.
* Amendments may produce draft versions.
* Drafts do not replace topics.
* Drafts do not replace decisions.

---

### 18.5 External artifact integrity

Rules:

* External artifacts are boundary references.
* Projection mappings are not source truth.
* External artifacts must not own core ethiKos records.
* Direct writes from external systems into core tables are forbidden.

---

## 19. Backfill Policy

Backfills MUST be optional, explicit, and idempotent.

### 19.1 Allowed backfills

Allowed:

```txt
Create default DiscussionVisibilitySetting rows for existing topics.
Seed baseline LensDeclaration.
Seed basic DecisionProtocol rows.
```

### 19.2 Forbidden backfills

Forbidden in first-pass migration:

```txt
Convert all closed EthikosTopic rows into DecisionRecord automatically.
Convert all EthikosStance rows into ballots automatically.
Convert all EthikosArgument rows into a new Claim table.
Convert all current frontend mock data into database records.
Compute Smart Vote readings inside schema migrations.
```

### 19.3 Idempotency rule

Every data migration MUST be safe to rerun in development.

Pattern:

```txt
get_or_create by stable key
do not duplicate rows
do not mutate user-generated text
do not infer sensitive identity data
```

---

## 20. App Placement Policy

### 20.1 First-pass app placement

First-pass Kintsugi data model extensions SHOULD live in:

```txt
konnaxion.ethikos
```

Unless a pre-existing canonical app already owns the data.

### 20.2 Smart Vote and EkoH exceptions

Smart Vote / EkoH data MAY live in their existing integration apps if they already exist in the codebase.

Allowed:

```txt
konnaxion.smart_vote
konnaxion.ekoh
```

Required boundary:

```txt
Smart Vote/EkoH models must not mutate ethiKos source models.
```

### 20.3 Forbidden new apps

The following new apps MUST NOT be created in the first pass:

```txt
konnaxion.kialo
konnaxion.loomio
konnaxion.decidim
konnaxion.consul
konnaxion.democracyos
konnaxion.polis
konnaxion.liquid_feedback
```

---

## 21. Suggested Migration File Grouping

The final migration numbering will depend on the current repository state. The following names are conceptual.

```txt
000X_kintsugi_korum_argument_extensions.py
000X_kintsugi_decision_and_drafting_foundation.py
000X_kintsugi_smart_vote_reading_foundation.py
000X_kintsugi_impact_foundation.py
000X_kintsugi_external_artifact_boundaries.py
```

If implemented in separate apps:

```txt
ethikos/000X_kintsugi_korum_argument_extensions.py
ethikos/000X_kintsugi_decision_and_drafting_foundation.py
ethikos/000X_kintsugi_impact_foundation.py
ethikos/000X_kintsugi_external_artifact_boundaries.py
smart_vote/000X_lens_declaration_and_reading_result.py
```

---

## 22. Serializer and API Implications

This document does not define final serializers, but the model plan implies future serializers for:

```txt
ArgumentSourceSerializer
ArgumentImpactVoteSerializer
ArgumentSuggestionSerializer
DiscussionVisibilitySettingSerializer
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
```

Serializer implementation MUST be defined in:

```txt
13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md
```

Endpoint implementation MUST be defined in:

```txt
07_API_AND_SERVICE_CONTRACTS.md
```

---

## 23. Admin Implications

The following models SHOULD be registered in Django admin when implemented:

```txt
ArgumentSource
ArgumentImpactVote
ArgumentSuggestion
DiscussionParticipantRole
DiscussionVisibilitySetting
DecisionProtocol
DecisionRecord
LensDeclaration
ReadingResult
Draft
DraftVersion
Amendment
RationalePacket
ImpactTrack
ImpactUpdate
ExternalArtifact
ProjectionMapping
```

Admin list views SHOULD include:

```txt
status
topic
decision
created_by
created_at
updated_at
```

Admin MUST protect:

```txt
DraftVersion immutability
ReadingResult reproducibility fields
anonymous participation identity boundaries
source fact records
```

---

## 24. Testing Requirements

Every implemented migration group MUST include tests or smoke checks.

### 24.1 Migration checks

Required checks:

```txt
python manage.py makemigrations --check
python manage.py migrate
python manage.py check
```

### 24.2 Data integrity checks

Required checks:

```txt
Existing topics remain readable.
Existing stances remain readable.
Existing arguments remain readable.
New ArgumentImpactVote cannot exceed 4.
New ArgumentImpactVote cannot be below 0.
EthikosStance still enforces -3..+3.
ReadingResult requires a lens.
DraftVersion uniqueness holds per draft.
```

### 24.3 API smoke implications

The current smoke baseline already verifies topic, stance, argument, and Kollective vote flows. The Kintsugi migration plan must preserve those current flows and add checks only after endpoints are implemented. 

---

## 25. Rollback Strategy

### 25.1 Schema rollback

Each migration SHOULD be reversible where possible.

Safe rollback candidates:

```txt
ArgumentSource
ArgumentImpactVote
ArgumentSuggestion
DiscussionParticipantRole
DiscussionVisibilitySetting
DecisionProtocol
DecisionRecord
Draft
DraftVersion
Amendment
RationalePacket
ImpactTrack
ImpactUpdate
ExternalArtifact
ProjectionMapping
```

### 25.2 Data rollback limits

The following should be considered audit-sensitive and should not be casually deleted in production:

```txt
ReadingResult
DecisionRecord
DraftVersion
ArgumentImpactVote
ImpactUpdate
ModerationAction
```

### 25.3 Rollback principle

```txt
Development rollback may drop new Kintsugi tables.
Production rollback should disable new features first, preserve audit records where possible, and only drop schema after explicit review.
```

---

## 26. Anti-Drift Rules

Future AI-generated implementation MUST obey the following:

```txt
Do not rename EthikosArgument to Claim.
Do not create a separate Claim model to replace EthikosArgument in first pass.
Do not create a Kialo backend app.
Do not create a Kialo route family.
Do not treat Kialo impact votes as Ethikos stances.
Do not treat Kialo impact votes as Smart Vote ballots.
Do not treat Smart Vote readings as source facts.
Do not mutate source facts from Smart Vote.
Do not mutate source facts from EkoH.
Do not let foreign tools write to core ethiKos tables.
Do not expand /api/home/*.
Do not make KeenKonnect the canonical owner of ethiKos impact tracking.
Do not compute readings in schema migrations.
Do not backfill decisions from topics unless explicitly approved.
Do not add destructive migrations.
Do not rename existing API prefixes.
```

---

## 27. Implementation Readiness Checklist

Before implementing any model from this plan:

```txt
[ ] Confirm latest current migrations.
[ ] Confirm current Ethikos models.
[ ] Confirm current serializers.
[ ] Confirm current API router registrations.
[ ] Confirm existing smoke tests still pass.
[ ] Confirm whether smart_vote and ekoh apps are active in settings.
[ ] Confirm whether new models live in ethikos or smart_vote.
[ ] Confirm payload shapes in doc 13.
[ ] Confirm API contracts in doc 07.
[ ] Confirm AI guardrails in doc 20.
[ ] Confirm Kialo contract in doc 21.
```

---

## 28. Final First-Pass Recommendation

The safest first-pass migration set is:

```txt
ArgumentSource
ArgumentImpactVote
ArgumentSuggestion
DiscussionParticipantRole
DiscussionVisibilitySetting
DecisionProtocol
DecisionRecord
LensDeclaration
ReadingResult
Draft
DraftVersion
Amendment
ImpactTrack
```

The minimum viable first migration is:

```txt
ArgumentSource
ArgumentImpactVote
ArgumentSuggestion
DiscussionVisibilitySetting
```

The migration that MUST NOT happen is:

```txt
Rename EthikosArgument to Claim.
```

The single most important data distinction is:

```txt
EthikosStance != ArgumentImpactVote != SmartVote ReadingResult
```

---

## 29. Related Documents

This document must be interpreted with:

```txt
03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md
07_API_AND_SERVICE_CONTRACTS.md
09_SMART_VOTE_EKOH_READING_CONTRACT.md
12_CANONICAL_OBJECTS_AND_EVENTS.md
13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md
15_BACKEND_ALIGNMENT_CONTRACT.md
20_AI_GENERATION_GUARDRAILS.md
21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md
```

If this document conflicts with the current code snapshot, the code snapshot wins for implementation reality.

If this document conflicts with `03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md`, the boundaries document wins for ownership and write rules.

If this document conflicts with `21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md`, this document wins for migration sequencing, but the Kialo contract wins for Kialo-style semantics.

---

## V4.1 additive EkoH disclosure models

V4.1 adds `RatingVisibilitySetting`, `RatingAccessScope`, `RatingScopeSubject`, and `RatingAccessGrant` inside `konnaxion.ekoh`. This is an additive migration only. Existing EkoH score, ethics, history, audit, and confidentiality models remain unchanged. No organisation/department business model is added to EkoH; external concepts map through generic scope keys.

