# 15 — Backend Alignment Contract

**File:** `15_BACKEND_ALIGNMENT_CONTRACT.md`
**Pack:** ethiKos Kintsugi Update Documentation Pack
**Status:** Normative backend contract for Kintsugi implementation planning
**Last aligned:** 2026-04-25
**Purpose:** Prevent backend drift while extending ethiKos for the Kintsugi upgrade.

---

## 1. Purpose

This document defines the backend alignment contract for the ethiKos Kintsugi upgrade.

It fixes how backend work must be designed, named, routed, migrated, tested, and integrated so that future implementation does not drift into:

* invented Django apps;
* invented API prefixes;
* renamed canonical models;
* accidental Smart Vote mutation of upstream facts;
* EkoH becoming a voting engine;
* Kialo-style features becoming a separate backend module;
* direct foreign-tool writes into ethiKos core tables;
* backend changes that conflict with the current Konnaxion codebase.

This file is a **backend guardrail**, not an implementation backlog.

---

## 2. Scope

This contract covers:

* Django app ownership;
* REST API routing;
* ViewSet / Serializer / Router conventions;
* model naming and migration rules;
* permission and authentication rules;
* service-layer expectations;
* Smart Vote / EkoH boundaries;
* Kialo-style backend extension rules;
* testing and smoke expectations;
* anti-drift rules for future AI/code generation.

This contract does **not** define:

* full model field specifications;
* final serializer payload shapes;
* frontend implementation;
* exact migration files;
* Smart Vote formulas;
* EkoH scoring formulas;
* Kialo UI behavior;
* OSS code-reading conclusions.

Those belong in related documents listed at the end.

---

## 3. Source Basis

The current backend snapshot identifies the backend as a Django / DRF codebase with a central API router and a `konnaxion.ethikos` app. The backend volume includes `backend/config/api_router.py`, Django settings files, and local apps including `konnaxion.ethikos`, `konnaxion.ekoh`, and `konnaxion.smart_vote`. 

The existing contracts file states that Ethikos uses the `konnaxion.ethikos` backend app exposed under `/api/ethikos/...`, with core endpoints for topics, stances, arguments, and optional categories. 

The Kintsugi boundaries document fixes the ownership model: Korum owns debate topics, arguments, stance scale and moderation; Konsultations owns consultations, intake, ballots, result snapshots and impact tracking; Smart Vote owns readings and must be read-only on upstream facts; EkoH owns expertise/ethics context and is not the voting engine. 

---

## 4. Canonical Variables Used

```yaml id="m2voyl"
DOCUMENT_ID: "15_BACKEND_ALIGNMENT_CONTRACT"
DOCUMENT_ROLE: "Backend implementation alignment contract"

PROJECT_NAME: "Konnaxion"
MODULE_NAME: "ethiKos"
UPDATE_NAME: "Kintsugi"

BACKEND_FRAMEWORK: "Django + Django REST Framework"
DEFAULT_API_STYLE: "DRF ViewSet + Serializer + Router"
PRIMARY_BACKEND_APP: "konnaxion.ethikos"
PRIMARY_API_PREFIX: "/api/ethikos/"
ROOT_URLCONF: "config.urls"
API_ROUTER_FILE: "backend/config/api_router.py"
AUTH_USER_MODEL: "users.User"

CURRENT_ETHIKOS_MODELS:
  - "EthikosCategory"
  - "EthikosTopic"
  - "EthikosStance"
  - "EthikosArgument"

CURRENT_ETHIKOS_VIEWSETS:
  - "CategoryViewSet"
  - "TopicViewSet"
  - "StanceViewSet"
  - "ArgumentViewSet"

CURRENT_CANONICAL_ENDPOINTS:
  - "/api/ethikos/topics/"
  - "/api/ethikos/stances/"
  - "/api/ethikos/arguments/"
  - "/api/ethikos/categories/"

COMPATIBILITY_ENDPOINT_PREFIXES:
  - "/api/deliberate/..."
  - "/api/deliberate/elite/..."

KINTSUGI_BACKEND_POLICY:
  BREAK_EXISTING_MODELS: false
  RENAME_EXISTING_MODELS: false
  DELETE_EXISTING_FIELDS: false
  ADD_NON_BREAKING_TABLES_ALLOWED: true
  ADD_NON_BREAKING_FIELDS_ALLOWED: true
  FULL_OSS_MERGE_ALLOWED: false
  ANNEX_FIRST_PASS_ALLOWED: false

SMART_VOTE_POLICY:
  MUTATES_KORUM_RECORDS: false
  MUTATES_KONSULTATIONS_RECORDS: false
  WRITES_ONLY_DERIVED_ARTIFACTS: true

EKOH_POLICY:
  IS_VOTING_ENGINE: false
  PROVIDES_CONTEXT_ONLY: true

KIALO_POLICY:
  CREATE_BACKEND_APP: false
  IMPORT_CODE: false
  EXTEND_ETHIKOS_APP: true
```

---

## 5. Backend Platform Baseline

The backend stack is:

```txt id="xelgqr"
Django
Django REST Framework
PostgreSQL
Celery
Redis
Cookiecutter-Django-style layout
```

The repository includes:

```txt id="o2fy7a"
backend/config/settings/base.py
backend/config/settings/local.py
backend/config/settings/production.py
backend/config/settings/test.py
backend/config/api_router.py
backend/config/urls.py
backend/konnaxion/ethikos/
backend/konnaxion/ekoh/
backend/konnaxion/smart_vote/
```

The Kintsugi backend must extend this stack. It must not introduce a parallel API framework or a second backend architecture.

---

## 6. Canonical Django App Ownership

### 6.1 Current canonical backend app

```txt id="chx1vm"
konnaxion.ethikos
```

This app owns the current Ethikos core:

```txt id="jbnmga"
EthikosCategory
EthikosTopic
EthikosStance
EthikosArgument
```

### 6.2 Target ownership boundaries

| Capability                         | Backend ownership                                                            |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| Debate topics                      | `konnaxion.ethikos`                                                          |
| Topic-level stances                | `konnaxion.ethikos`                                                          |
| Arguments / threaded reasons       | `konnaxion.ethikos`                                                          |
| Argument moderation                | `konnaxion.ethikos`                                                          |
| Kialo-style claim graph extensions | `konnaxion.ethikos`                                                          |
| Consultation intake                | `konnaxion.ethikos`, future Konsultations namespace inside Ethikos if needed |
| Ballot capture                     | `konnaxion.ethikos`, target Konsultations capability                         |
| Decision records                   | `konnaxion.ethikos` unless later split is explicitly approved                |
| Smart Vote readings                | `konnaxion.smart_vote` or existing Kollective Intelligence Smart Vote app    |
| EkoH expertise/ethics context      | `konnaxion.ekoh`                                                             |
| KeenKonnect execution handoff      | `konnaxion.keenkonnect`                                                      |
| External OSS artifacts             | adapter tables only, not core table writes                                   |

### 6.3 Forbidden backend apps in first pass

```txt id="k0ts4l"
konnaxion.kialo
konnaxion.kintsugi
konnaxion.considerit
konnaxion.loomio
konnaxion.decidim
konnaxion.consul
konnaxion.democracyos
```

External tools may inform models, serializers, and service design, but the first-pass implementation is **native mimic**, not a backend app import.

---

## 7. Current Ethikos Backend Core

The current Ethikos backend core must be treated as stable.

### 7.1 Current models

| Model             | Current meaning               | Kintsugi mapping                                               |
| ----------------- | ----------------------------- | -------------------------------------------------------------- |
| `EthikosCategory` | Topic grouping                | Category / taxonomy seed                                       |
| `EthikosTopic`    | Debate or consultation prompt | Korum discussion container; possible Konsultations topic proxy |
| `EthikosStance`   | User topic-level stance       | Raw stance event, `-3..+3`                                     |
| `EthikosArgument` | Threaded discussion entry     | Kialo-style claim node                                         |

The contracts file defines `EthikosTopic`, `EthikosStance`, `EthikosArgument`, and `EthikosCategory` as the current visualized Ethikos entities, including topic status, stance range, argument side/parent threading, and category fields. 

### 7.2 Current route registration

The current `backend/konnaxion/ethikos/urls.py` registers:

```python id="8xf0i8"
router.register(r"topics", TopicViewSet, basename="ethikos-topic")
router.register(r"stances", StanceViewSet, basename="ethikos-stance")
router.register(r"arguments", ArgumentViewSet, basename="ethikos-argument")
```

It conditionally registers:

```python id="g97fpr"
router.register(r"categories", CategoryViewSet, basename="ethikos-category")
```

The backend snapshot confirms this router structure. 

### 7.3 Current ViewSet style

The current ViewSet style is DRF-native:

```txt id="0fli2k"
TopicViewSet = ModelViewSet
StanceViewSet = GenericViewSet + Create/Update/Retrieve/List mixins
ArgumentViewSet = ModelViewSet
CategoryViewSet = optional / read-only where implemented
```

The backend snapshot shows `TopicViewSet`, `StanceViewSet`, and `ArgumentViewSet` using DRF permissions and `perform_create` ownership assignment. 

---

## 8. API Prefix Contract

### 8.1 Canonical API prefix

All current Ethikos core CRUD must remain under:

```txt id="ha59kv"
/api/ethikos/
```

Canonical endpoints:

```txt id="lrl0gu"
/api/ethikos/topics/
/api/ethikos/stances/
/api/ethikos/arguments/
/api/ethikos/categories/
```

### 8.2 Compatibility aliases

The following are compatibility aliases, not separate source-of-truth APIs:

```txt id="h3oydu"
/api/deliberate/...
/api/deliberate/elite/...
```

### 8.3 Forbidden first-pass API prefixes

The Kintsugi first pass must not introduce:

```txt id="ymluyi"
/api/kintsugi/
/api/kialo/
/api/korum/
/api/consultations/
/api/konsultations/
/api/deliberation/
```

unless a later migration plan explicitly defines the prefix, ownership, routing, tests, and backwards compatibility.

### 8.4 Legacy endpoint rule

```txt id="hiydwy"
/api/home/*
```

must not be expanded.

If existing frontend code still touches `/api/home/*`, the backend plan must treat it as legacy and route cleanup work, not a Kintsugi foundation.

---

## 9. Router Alignment Contract

All new Kintsugi backend endpoints must use the existing router pattern.

### Required pattern

```python id="oa7hfg"
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r"<resource>", <ResourceViewSet>, basename="<stable-basename>")
urlpatterns = router.urls
```

### Central registration rule

If a new endpoint is intended to be public under `/api/...`, it must be registered through the existing project API routing structure, not via an ad-hoc URL file bypass.

### Basename rules

Basenames must be:

* stable;
* lowercase;
* hyphenated;
* app-scoped where useful;
* not tied to OSS source names.

Good:

```txt id="r87zjl"
ethikos-decision-record
ethikos-reading-result
ethikos-draft
ethikos-argument-source
ethikos-argument-impact-vote
```

Bad:

```txt id="r4n7xw"
kialo-claim
loomio-proposal
decidim-process
consul-vote
kintsugi-object
```

---

## 10. Model Alignment Contract

### 10.1 Current models must not be renamed

The following are frozen names:

```txt id="xt9rrj"
EthikosCategory
EthikosTopic
EthikosStance
EthikosArgument
```

### 10.2 Conceptual mappings are allowed

Future docs may describe these mappings:

```txt id="igc27v"
EthikosTopic = Discussion / thesis container
EthikosArgument = Claim
EthikosStance = Topic-level stance event
EthikosCategory = Category / taxonomy seed
```

But code generation must not rename the current models.

### 10.3 Non-breaking additions are allowed

Kintsugi may add new tables if they are non-breaking and owned correctly.

Candidate target models include:

```txt id="f6hjfe"
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
ArgumentSource
ArgumentImpactVote
ArgumentSuggestion
DiscussionParticipantRole
DiscussionVisibilitySetting
```

### 10.4 Model names must describe Ethikos concepts, not copied OSS concepts

Use:

```txt id="nao95s"
ArgumentSource
ArgumentImpactVote
ArgumentSuggestion
DecisionRecord
ImpactTrack
```

Avoid:

```txt id="ydksyk"
KialoClaim
LoomioPoll
DecidimProposal
ConsulDebate
DemocracyOSForum
```

OSS names may appear in documentation as source patterns, not model names.

---

## 11. Serializer Alignment Contract

Every new writable model must have an explicit serializer.

### Serializer requirements

A serializer must define:

* model;
* fields;
* read-only fields;
* write-only fields where needed;
* validation rules;
* ownership/user assignment behavior if applicable;
* cross-object consistency checks.

### Existing pattern to preserve

The current `EthikosArgumentSerializer` exposes `parent` as read-only and accepts `parent_id` as write-only, then validates that a parent argument belongs to the same topic. 

This pattern is important for Kialo-style argument graph extensions.

### Required future validation patterns

| Serializer                     | Required validation                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| `ArgumentSourceSerializer`     | Source must belong to an argument in the same topic context                                 |
| `ArgumentImpactVoteSerializer` | Vote must target an existing argument; value must be in allowed range                       |
| `ArgumentSuggestionSerializer` | Suggested claim must be tied to a topic and reviewed before publication if role requires it |
| `DecisionRecordSerializer`     | Decision must reference a valid topic/consultation and protocol                             |
| `ReadingResultSerializer`      | Reading must reference lens, snapshot, input scope, and computed timestamp                  |
| `DraftVersionSerializer`       | Draft version must belong to its draft and preserve immutable version history               |
| `ImpactTrackSerializer`        | Impact item must reference decision or consultation source                                  |

### Serializer anti-drift rules

```txt id="71b0ac"
Do not serialize Smart Vote readings as if they were EthikosStance rows.
Do not serialize Kialo-style impact votes as EthikosStance rows.
Do not expose anonymous author identity fields to non-admin serializers.
Do not accept foreign-tool payloads that write directly into core Korum/Konsultations tables.
```

---

## 12. ViewSet Alignment Contract

### 12.1 Default ViewSet style

Use DRF ViewSets.

Default:

```python id="swe1jx"
class ResourceViewSet(viewsets.ModelViewSet):
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer
    permission_classes = [...]
```

Read-only resources may use:

```python id="ttzmvg"
class ResourceViewSet(viewsets.ReadOnlyModelViewSet):
    ...
```

Limited writable resources may use:

```python id="m3dloe"
class ResourceViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    ...
```

### 12.2 Ownership assignment

For user-owned objects, ownership must be assigned in `perform_create`, not trusted from client payload.

Good:

```python id="jyl5us"
def perform_create(self, serializer):
    serializer.save(user=self.request.user)
```

or:

```python id="8apex0"
def perform_create(self, serializer):
    serializer.save(created_by=self.request.user)
```

The existing Ethikos ViewSets already follow this pattern for topics, stances, and arguments. 

### 12.3 Queryset filtering

ViewSets should implement explicit filtering for scoped resources.

Examples:

```txt id="cj42tk"
topic
user
status
category
decision
draft
reading_key
snapshot_ref
```

Filtering must not leak private, anonymous, or admin-only data.

---

## 13. Permissions Contract

### 13.1 Default permission baseline

Current Ethikos ViewSets use:

```txt id="udkv63"
IsAuthenticatedOrReadOnly
IsAuthenticated
```

The backend snapshot shows topic and argument ViewSets using authenticated-or-read-only permissions, while stances require authentication. 

### 13.2 Required permission categories

Future Kintsugi backend work must distinguish:

| Permission class    | Use                                                        |
| ------------------- | ---------------------------------------------------------- |
| Public read         | Published topics, public results, public readings          |
| Authenticated write | stance, argument, suggestion, ballot                       |
| Owner edit          | own arguments, own drafts, own suggestions where allowed   |
| Moderator edit      | hide arguments, accept/reject suggestions                  |
| Admin edit          | roles, visibility, audit controls                          |
| System write        | computed readings, scheduled aggregation, snapshot refresh |

### 13.3 Anonymous participation rule

Anonymous participation may hide identity from normal participants.

It must not erase auditability.

Backend must preserve:

```txt id="x8fxf4"
real_user_id or audit principal
public_author_label
visibility mode
admin-only identity access
```

### 13.4 Forbidden permission behavior

```txt id="kzru2d"
Do not trust client-submitted user IDs.
Do not expose anonymous identities to normal participants.
Do not allow Smart Vote to mutate source Ethikos records.
Do not allow foreign-tool adapters to write core table facts directly.
Do not publish suggested claims without review when role requires approval.
```

---

## 14. Authentication Contract

Backend code must use:

```txt id="c0yvrc"
settings.AUTH_USER_MODEL
get_user_model()
request.user
```

It must not import or depend on:

```txt id="yicbvl"
django.contrib.auth.models.User
```

unless only used in a migration-safe, explicitly justified legacy context.

The broader technical instructions identify the custom user model as `users.User`, so new backend work must remain compatible with that user model. 

---

## 15. Migration Contract

### 15.1 General migration policy

Kintsugi backend changes must be additive by default.

Allowed:

```txt id="70e2mm"
Add new tables.
Add nullable fields.
Add fields with safe defaults.
Add indexes.
Add constraints after data migration if needed.
Add read-only projections.
```

Forbidden unless explicitly approved:

```txt id="15m4ba"
Rename current Ethikos models.
Rename current fields used by frontend/services.
Drop existing columns.
Change endpoint semantics without compatibility.
Change stance range.
Change argument side semantics.
Convert existing IDs to UUIDs in-place.
```

### 15.2 Existing EkoH migration note

The current stable baseline includes the EkoH migration `0002...` as created and applied. Future docs must not re-open that migration as an unresolved baseline issue.

### 15.3 Migration file requirements

Every migration plan must specify:

```txt id="i1mlkr"
Django app
model/table added or changed
nullable/default behavior
index impact
data migration need
rollback risk
test command
affected serializers
affected ViewSets
affected frontend service
```

### 15.4 Makemigrations drift prevention

Before generating migrations, implementation work must verify:

```txt id="o0oyhl"
python manage.py makemigrations --check
python manage.py migrate --plan
python manage.py test
```

or the equivalent project command.

---

## 16. Korum Backend Contract

Korum is not a separate Django app in the first pass.

It is the Kintsugi name for the structured debate capabilities inside ethiKos.

### Owned facts

```txt id="mzr6xn"
EthikosTopic
EthikosStance
EthikosArgument
ArgumentSource
ArgumentImpactVote
ArgumentSuggestion
ModerationAction
```

### Korum rules

```txt id="id9pcq"
Korum facts are source facts.
Korum arguments and stances may feed Smart Vote readings.
Korum facts must not be overwritten by Smart Vote.
Korum arguments may be extended with Kialo-style claim graph support.
Korum moderation must be auditable.
```

### Kialo-style backend mapping

| Kialo-style concept | Backend mapping                                                |
| ------------------- | -------------------------------------------------------------- |
| Discussion          | `EthikosTopic`                                                 |
| Thesis              | existing topic title/description, future optional thesis field |
| Claim               | `EthikosArgument`                                              |
| Pro/con relation    | `EthikosArgument.parent` + `EthikosArgument.side`              |
| Source              | `ArgumentSource`                                               |
| Impact vote         | `ArgumentImpactVote`                                           |
| Suggested claim     | `ArgumentSuggestion`                                           |
| Participant role    | `DiscussionParticipantRole`                                    |
| Visibility setting  | `DiscussionVisibilitySetting`                                  |

### Kialo backend forbidden outputs

```txt id="ckff5j"
Do not create konnaxion.kialo.
Do not import Kialo code.
Do not rename EthikosArgument to Claim.
Do not use Kialo impact votes as EthikosStance.
Do not use Kialo impact votes as Smart Vote ballots.
```

---

## 17. Konsultations Backend Contract

Konsultations is a submodule/capability under ethiKos.

It is not currently confirmed as a fully independent backend app.

### Target owned facts

```txt id="asfxcw"
IntakeSubmission
IntakeQueue
ProblemStatement
BallotEvent
ResultSnapshot
ImpactTrack
ImpactUpdate
```

### Current baseline rule

If current code represents a consultation through `EthikosTopic` and `EthikosStance`, documentation must say so explicitly.

### Future implementation rule

If a distinct Konsultations model set is introduced, it must:

* live inside `konnaxion.ethikos` unless a later ADR says otherwise;
* preserve compatibility with existing topic/stance behavior;
* separate ballot capture from Smart Vote readings;
* provide audit records for result snapshots and impact tracking.

---

## 18. Smart Vote Backend Contract

Smart Vote belongs to Kollective Intelligence, not to Korum.

The backend snapshot includes Smart Vote service code and EkoH/Smart Vote integration settings. The settings add `konnaxion.ekoh` and `konnaxion.smart_vote`, and include periodic Celery schedules for EkoH recalculation, contextual analysis, and Smart Vote aggregation. 

### Smart Vote may write

```txt id="mo67kw"
LensDeclaration
ReadingResult
VoteResult
Breakdown artifacts
Aggregation audit rows
```

### Smart Vote must not write

```txt id="gxur77"
EthikosTopic
EthikosStance
EthikosArgument
Konsultations source ballots
Korum moderation facts
```

### Reading formula

Any weighted or filtered reading must be reproducible:

```txt id="iam0pn"
Reading = f(BaselineEvents, LensDeclaration, SnapshotContext?)
```

This formula is fixed by the boundaries document. 

### Required Smart Vote fields

Future Smart Vote reading models must include or map to:

```txt id="v2r7mr"
reading_key
lens_hash
lens_declaration
snapshot_ref
computed_at
results_payload
input_scope
algorithm_version
```

---

## 19. EkoH Backend Contract

EkoH owns expertise and ethics context.

It is not the voting engine.

### EkoH may provide

```txt id="23rkrh"
expertise domain vectors
ethics multipliers
cohort eligibility
snapshot references
audit context
profile/context serializers
periodic score recalculation
```

### EkoH must not provide

```txt id="5b1fvg"
source ballots
topic stance mutation
argument mutation
decision publication authority
baseline result ownership
```

### EkoH integration rule

When EkoH affects a result, it must do so through a declared Smart Vote lens or reading, not by changing baseline Korum/Konsultations facts.

---

## 20. Drafting Backend Contract

Drafting is a bounded ethiKos capability.

It must not be embedded directly into Korum argument rows.

### Target models

```txt id="kviyla"
Draft
DraftVersion
Amendment
RationalePacket
```

### Drafting rules

```txt id="gxd5v6"
Drafts may reference topics, consultations, or decision records.
Draft versions are append-only.
Amendments must be structured.
Rationale packets must preserve why text changed.
Drafting must not overwrite original arguments or stances.
```

### Suggested route ownership

Until a later API contract defines otherwise, Drafting backend endpoints should remain under:

```txt id="mlh7mw"
/api/ethikos/
```

Possible future resource names:

```txt id="o1aqpt"
/api/ethikos/drafts/
/api/ethikos/draft-versions/
/api/ethikos/amendments/
```

These are target-state candidates, not current baseline endpoints.

---

## 21. Impact Backend Contract

Impact is a Konsultations/accountability capability.

Current endpoint graph analysis identified loose mappings from Impact frontend services into KeenKonnect project APIs. Kintsugi target state must clarify that KeenKonnect may receive execution handoffs, but civic accountability truth belongs to ethiKos/Konsultations. 

### Target owned facts

```txt id="qyhtdm"
ImpactTrack
ImpactUpdate
ExecutionHandoff
PublicAccountabilitySnapshot
```

### Impact rules

```txt id="o5gwsx"
ImpactTrack must reference a decision, consultation, or result snapshot.
Impact updates must preserve timestamp and responsible actor.
Handoffs into KeenKonnect must be links, not ownership transfer of civic truth.
Public accountability snapshots must be reproducible from source records.
```

---

## 22. External Tool Boundary Contract

External OSS tools are pattern sources only in first pass.

### First-pass strategy

```txt id="4fb8vy"
Consider.it = mimic
Kialo-style = mimic
Loomio = mimic
Citizen OS = mimic
Decidim = mimic
CONSUL Democracy = mimic
DemocracyOS = mimic
```

### Deferred

```txt id="t661ya"
Polis
LiquidFeedback
All Our Ideas
Your Priorities
OpenSlides
```

### Adapter-only future boundary

If a future annex is approved, it must use:

```txt id="zcqgwt"
ExternalArtifact
ProjectionMapping
```

Foreign tools must not write directly to:

```txt id="rbfjb4"
EthikosTopic
EthikosStance
EthikosArgument
BallotEvent
DecisionRecord
ImpactTrack
```

---

## 23. Admin Registration Contract

Every new backend model must define whether it appears in Django admin.

### Required admin decision

For each model, specify:

```txt id="v1173z"
admin_registered: true | false
admin_readonly_fields
list_display
search_fields
list_filter
raw_id_fields
audit_visibility
```

### Admin-sensitive objects

The following should generally be admin-visible:

```txt id="hes6ap"
DecisionRecord
LensDeclaration
ReadingResult
ArgumentSuggestion
DiscussionParticipantRole
DiscussionVisibilitySetting
ModerationAction
ImpactTrack
ExternalArtifact
ProjectionMapping
```

### Sensitive admin rule

Anonymous identity mappings and EkoH audit context must be admin-restricted.

---

## 24. Service-Layer Contract

Backend domain logic must not be overloaded into serializers or ViewSets when it becomes non-trivial.

### Use services for

```txt id="8fimbz"
Smart Vote aggregation
EkoH weight lookup
reading computation
decision closing/publication
draft version creation
amendment application
impact snapshot generation
external artifact projection
moderation action recording
```

### Service module pattern

Preferred structure:

```txt id="7pn5d5"
backend/konnaxion/ethikos/services/
backend/konnaxion/smart_vote/services/
backend/konnaxion/ekoh/services/
```

The current backend already uses service modules for EkoH and Smart Vote, including `weight_calculator.py` under Smart Vote services. 

### Service anti-drift rule

```txt id="wn9tm9"
Do not put weighted voting algorithms in EthikosArgumentSerializer.
Do not put EkoH score calculations in Ethikos ViewSets.
Do not put draft versioning rules directly in frontend code.
Do not put complex moderation side effects only in page components.
```

---

## 25. Transaction and Integrity Contract

Backend operations must preserve data integrity.

### Transaction-required operations

Use database transactions for:

```txt id="uxgypv"
closing a decision
publishing a reading
creating a draft version
accepting an amendment
accepting an argument suggestion into an argument
casting or replacing a Smart Vote ballot
updating aggregated result rows
creating impact snapshot records
```

### Uniqueness constraints to consider

Future models should consider uniqueness for:

```txt id="cs78or"
EthikosStance: user + topic
ArgumentImpactVote: user + argument
DiscussionParticipantRole: user + topic/discussion
ReadingResult: reading_key + input_scope + lens_hash + snapshot_ref
DraftVersion: draft + version_number
DecisionRecord: decision_key or topic + protocol + opened_at
```

Do not add constraints blindly; each must be validated against existing data and documented in the migration plan.

---

## 26. Audit Contract

Kintsugi backend changes must preserve auditability.

### Minimum audit fields

Where applicable:

```txt id="ww3fvm"
created_at
updated_at
created_by
updated_by
computed_at
published_at
source_snapshot_ref
lens_hash
algorithm_version
audit_payload
```

### Audit event candidates

```txt id="cygb2x"
TopicCreated
StanceRecorded
ArgumentCreated
ArgumentHidden
ArgumentSourceAttached
ArgumentImpactVoteRecorded
ArgumentSuggestionSubmitted
ArgumentSuggestionAccepted
ArgumentSuggestionRejected
DraftCreated
DraftVersionCreated
AmendmentSubmitted
DecisionOpened
DecisionClosed
ReadingComputed
ReadingPublished
ImpactUpdated
ModerationActionRecorded
ExternalArtifactProjected
```

### Audit anti-drift rules

```txt id="f0jqmb"
Do not make weighted readings unreproducible.
Do not lose the original source event.
Do not overwrite baseline result rows with lens results.
Do not delete moderation history when hiding content.
Do not erase identity mapping required for admin audit in anonymous participation.
```

---

## 27. Test Contract

### 27.1 Existing test state

The current `backend/konnaxion/ethikos/tests.py` is only a stub in the snapshot. 

Kintsugi backend work must add real tests as backend capabilities expand.

### 27.2 Required test categories

Each new backend resource should include tests for:

```txt id="v65z72"
model creation
serializer validation
permission behavior
ViewSet list/retrieve/create/update
ownership assignment
filtering behavior
invalid payload rejection
cross-topic parent/child validation
migration application
admin registration where applicable
```

### 27.3 Ethikos regression tests

Must preserve:

```txt id="xmgu85"
create topic
create stance
update stance
create argument
create reply with valid parent_id
reject reply when parent belongs to another topic
hide/moderate argument if supported
list arguments by topic
```

### 27.4 Smart Vote / EkoH boundary tests

Must verify:

```txt id="b3oifx"
Smart Vote readings do not mutate EthikosStance.
Smart Vote readings do not mutate EthikosArgument.
EkoH context is referenced through snapshot/context fields.
Baseline result can be reproduced without weighted lens.
Weighted reading stores lens/snapshot metadata.
```

### 27.5 Kialo-style tests

Must verify:

```txt id="2xd7dw"
ArgumentImpactVote range is 0..4.
ArgumentImpactVote is not accepted as EthikosStance.
ArgumentSource belongs to an argument.
ArgumentSuggestion requires review when role is suggester.
Anonymous author visibility is enforced.
```

---

## 28. API Documentation Contract

Every new backend endpoint must be documented in:

```txt id="aoz24h"
07_API_AND_SERVICE_CONTRACTS.md
13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md
15_BACKEND_ALIGNMENT_CONTRACT.md if backend convention changes
```

Endpoint docs must specify:

```txt id="lsh5yj"
method
path
ViewSet
serializer
request payload
response payload
permission class
filter params
pagination
error behavior
ownership
source-of-truth status
```

### OpenAPI / schema rule

If the project uses DRF Spectacular/OpenAPI generation, new ViewSets and serializers must be schema-friendly:

```txt id="xmqmgo"
explicit fields
explicit serializer classes
no undocumented dynamic payloads
stable enum values
stable read/write field separation
```

---

## 29. Environment and Settings Contract

Kintsugi backend work must not add untracked settings.

Any new setting must specify:

```txt id="h6qm99"
setting name
default value
environment variable if any
local behavior
production behavior
test behavior
security implications
```

Existing EkoH / Smart Vote integration settings already define app additions, Celery beat schedules, database search path, and Kafka bootstrap configuration. 

### Settings anti-drift rules

```txt id="ep8wqt"
Do not add hardcoded production values.
Do not add settings only in local.py.
Do not add Celery schedules without documenting owner and cadence.
Do not add Kafka/event settings unless implementation actually uses them.
```

---

## 30. Background Tasks Contract

Background tasks may be used for:

```txt id="z93fva"
EkoH score recalculation
Smart Vote aggregation
reading recomputation
impact snapshot refresh
reporting/analytics refresh
```

They must not be used as a substitute for missing transactional writes.

### Task requirements

Each task must document:

```txt id="yz307h"
task name
owning app
input scope
idempotency rule
schedule if periodic
retry behavior
side effects
audit output
```

---

## 31. Error Handling Contract

Backend errors must remain DRF-compatible.

### Required patterns

```txt id="g20gqg"
400 for validation errors
401 for unauthenticated writes
403 for forbidden actions
404 for missing resources or inaccessible resources where appropriate
409 for conflict/idempotency collision where explicitly implemented
500 only for unexpected errors
```

### Error shape

Use DRF-standard error shapes unless a future API contract defines a project-wide envelope.

Example:

```json id="af9gs4"
{
  "parent_id": ["The parent belongs to another topic."]
}
```

or:

```json id="tvf3a0"
{
  "detail": "You do not have permission to perform this action."
}
```

---

## 32. Pagination and Filtering Contract

List endpoints should use DRF-compatible pagination and explicit query filters.

Recommended filters by resource:

| Resource              | Filters                                                         |
| --------------------- | --------------------------------------------------------------- |
| Topics                | `status`, `category`, `created_by`, `expertise_category`        |
| Stances               | `topic`, `user` where allowed                                   |
| Arguments             | `topic`, `parent`, `side`, `is_hidden` where admin              |
| Argument sources      | `argument`, `topic`                                             |
| Argument impact votes | `argument`, `topic`, `user` where allowed                       |
| Suggestions           | `topic`, `status`, `submitted_by`                               |
| Decisions             | `topic`, `status`, `protocol`                                   |
| Readings              | `reading_key`, `topic`, `decision`, `lens_hash`, `snapshot_ref` |
| Drafts                | `topic`, `decision`, `status`                                   |
| Impact tracks         | `decision`, `status`, `owner`                                   |

Filtering must not leak hidden, anonymous, admin-only, or draft-only information.

---

## 33. Versioning Contract

The Kintsugi first pass must use current API versioning conventions.

Do not invent:

```txt id="pkt551"
/api/v2/ethikos/
/api/v1/kintsugi/
/api/graphql/
```

unless a future ADR and API migration plan explicitly approve it.

### Version fields inside records

For derived/computed outputs, prefer record-level versioning fields:

```txt id="5qrt57"
algorithm_version
schema_version
lens_version
snapshot_version
```

instead of changing endpoint version prematurely.

---

## 34. Security Contract

Backend implementation must preserve:

```txt id="8tl8h9"
authentication for writes
owner checks
admin-only moderation controls
anonymous identity protection
auditability
no client-submitted authority fields
no direct external writes into core facts
```

### Sensitive fields

Sensitive fields must be hidden from public serializers unless explicitly authorized:

```txt id="1p8rh7"
internal user ID in anonymous mode
EkoH private score components
raw ethics sub-scores
admin moderation notes
hidden argument content
lens internals if not public
external adapter credentials
```

---

## 35. Data Privacy Contract

Kintsugi backend additions must distinguish:

| Data class                    | Visibility                                      |
| ----------------------------- | ----------------------------------------------- |
| Public topic                  | public                                          |
| Public argument               | public                                          |
| Hidden argument               | moderator/admin                                 |
| Anonymous public label        | public                                          |
| Anonymous real identity       | admin/audit only                                |
| User stance                   | user/admin or aggregated public depending route |
| Baseline result               | public when published                           |
| Smart Vote reading            | public when published                           |
| EkoH private score components | restricted                                      |
| Draft in progress             | restricted until published                      |
| Impact snapshot               | public when published                           |

---

## 36. Backend-to-Frontend Alignment

Backend resources must align with frontend service contracts.

### Required matching docs

Every backend endpoint added or changed must be reflected in:

```txt id="n84xgz"
06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md
07_API_AND_SERVICE_CONTRACTS.md
13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md
14_FRONTEND_ALIGNMENT_CONTRACT.md
15_BACKEND_ALIGNMENT_CONTRACT.md
16_TEST_AND_SMOKE_CONTRACT.md
```

### Service wrapper rule

The frontend must call backend endpoints through service wrappers.

Backend docs should therefore name the expected frontend service owner:

```txt id="1m6v7l"
frontend/services/deliberate.ts
frontend/services/decide.ts
frontend/services/impact.ts
frontend/services/pulse.ts
frontend/services/admin.ts
```

or whichever current service file is actually used.

---

## 37. First-Pass Backend Priorities

This contract does not create a backlog, but it defines likely backend priority areas for future backlog generation.

### Stabilize existing core

```txt id="oyodnx"
EthikosTopic API
EthikosStance API
EthikosArgument API
EthikosCategory API
topic preview service/API shape
argument filtering by topic
```

### Add Kialo-style minimum backend support

```txt id="a6952o"
ArgumentSource
ArgumentImpactVote
ArgumentSuggestion
DiscussionParticipantRole
DiscussionVisibilitySetting
```

### Add decision/readings support

```txt id="9v941e"
DecisionProtocol
DecisionRecord
LensDeclaration
ReadingResult
```

### Add drafting/accountability support

```txt id="nj3zbo"
Draft
DraftVersion
Amendment
RationalePacket
ImpactTrack
ImpactUpdate
```

These are target candidates only. The final backlog belongs in:

```txt id="e0ndzj"
22_IMPLEMENTATION_BACKLOG_TEMPLATE.md
```

---

## 38. Non-Goals

This backend contract does not:

* generate migrations;
* generate model code;
* generate serializers;
* generate ViewSets;
* define final field lists;
* define Smart Vote formulas;
* define EkoH score logic;
* define frontend components;
* define product copy;
* import OSS code;
* propose a full external merge.

---

## 39. Anti-Drift Rules

Future backend generation must obey:

```txt id="deks5l"
Do not create a new backend app for Kialo.
Do not create a new backend app for Kintsugi.
Do not import OSS backend code.
Do not rename EthikosTopic.
Do not rename EthikosStance.
Do not rename EthikosArgument.
Do not rename EthikosCategory.
Do not change EthikosStance range from -3..+3.
Do not treat ArgumentImpactVote as EthikosStance.
Do not treat Smart Vote ReadingResult as a source ballot.
Do not let Smart Vote mutate Korum/Konsultations source facts.
Do not let EkoH become the voting engine.
Do not write foreign tool data directly into Korum/Konsultations core tables.
Do not expand /api/home/*.
Do not invent /api/kintsugi/*.
Do not invent /api/kialo/*.
Do not skip serializers for new resources.
Do not skip tests for new backend behavior.
Do not create implementation tasks inside this document.
```

---

## 40. Required Backend Review Checklist

Before any Kintsugi backend PR, verify:

```txt id="l72ww0"
[ ] Does this preserve /api/ethikos/* as the canonical Ethikos API prefix?
[ ] Does this preserve current Ethikos models?
[ ] Does this use DRF ViewSet + Serializer + Router conventions?
[ ] Does this assign ownership from request.user, not client payload?
[ ] Does this avoid direct OSS-code import?
[ ] Does this avoid creating konnaxion.kialo?
[ ] Does this preserve Smart Vote read-only behavior on upstream facts?
[ ] Does this preserve EkoH as context, not voting engine?
[ ] Does this avoid expanding /api/home/*?
[ ] Does this include migrations if models changed?
[ ] Does this include tests?
[ ] Does this update API/payload/frontend contract docs if endpoint shapes changed?
[ ] Does this preserve anonymous/audit separation where applicable?
[ ] Does this document target-state vs current-state clearly?
```

---

## 41. Related Documents

This backend contract must be read with:

```txt id="ceflir"
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
16_TEST_AND_SMOKE_CONTRACT.md
17_KNOWN_BUGS_AND_NON_KINTSUGI_ITEMS.md
20_AI_GENERATION_GUARDRAILS.md
21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md
22_IMPLEMENTATION_BACKLOG_TEMPLATE.md
```

---

## 42. Final Contract Statement

The Kintsugi backend implementation must extend the existing Django/DRF backend, especially `konnaxion.ethikos`, without replacing the current Ethikos core.

The current backend truth is:

```txt id="z6plfs"
App: konnaxion.ethikos
API prefix: /api/ethikos/
Current models: EthikosCategory, EthikosTopic, EthikosStance, EthikosArgument
Current pattern: DRF ViewSet + Serializer + Router
Compatibility aliases: /api/deliberate/... and /api/deliberate/elite/...
```

The Kintsugi backend may add non-breaking models, serializers, ViewSets, services, tasks, and audit records.

It must not rename the current core, import OSS systems, create a Kialo backend app, or allow Smart Vote/EkoH/external tools to mutate Korum/Konsultations source facts.

---

## V4.1 EkoH rating-access resolver

All backend consumers that disclose individual EkoH rating data MUST use `konnaxion.ekoh.services.rating_access.resolve_rating_access`. Modules MUST NOT infer EkoH access from strings such as CEO, manager, supervisor, or Ethikos role labels. EkoH remains self-contained apart from the configured user model and generic external scope identifiers.

