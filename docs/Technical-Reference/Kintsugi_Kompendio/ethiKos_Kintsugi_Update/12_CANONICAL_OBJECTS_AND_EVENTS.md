# 12 — Canonical Objects and Events

**Project:** Konnaxion  
**Module:** ethiKos  
**Upgrade:** Kintsugi  
**Document ID:** `12_CANONICAL_OBJECTS_AND_EVENTS.md`  
**Status:** Canonical architecture contract  
**Version:** `2026-04-25-kintsugi-doc-pack-v1`  
**Audience:** Human maintainers, AI assistants, backend implementers, frontend implementers, documentation generators  
**Purpose:** Define the canonical business objects and lifecycle events used by the ethiKos Kintsugi upgrade.

---

## 1. Purpose

This document defines the canonical **objects** and **events** for the ethiKos Kintsugi upgrade.

It exists to prevent future drift where AI assistants, developers, or parallel documentation passes invent incompatible names, duplicate models, incorrect ownership, or conflicting event semantics.

The core rule is:

```txt
Objects describe civic state.
Events describe civic change.
Readings describe derived interpretation.
````

This document is not a database migration file and is not an implementation backlog. It is the object/event vocabulary that future data models, serializers, frontend payloads, audit logs, and product flows must respect.

---

## 2. Scope

This document covers:

* current canonical Ethikos objects;
* proposed Kintsugi objects;
* Korum deliberation objects;
* Kialo-style structured argument objects;
* Konsultations consultation objects;
* Smart Vote reading objects;
* EkoH context objects;
* drafting/versioning objects;
* impact/accountability objects;
* external integration boundary objects;
* moderation and audit objects;
* canonical events emitted or recorded by those objects;
* object ownership;
* event ownership;
* anti-drift rules.

This document does **not** define:

* database fields in final migration detail;
* serializer JSON schemas in final detail;
* frontend component structure;
* implementation task sequencing;
* UI copy;
* full OSS integration;
* annex/sidecar architecture.

Those are handled by related documents.

---

## 3. Canonical Variables Used

```yaml
PROJECT:
  PLATFORM_NAME: "Konnaxion"
  MODULE_NAME: "ethiKos"
  UPDATE_NAME: "Kintsugi"

IMPLEMENTATION:
  STYLE: "partial native mimic"
  FULL_EXTERNAL_MERGE_ALLOWED: false
  ANNEX_FIRST_PASS_ALLOWED: false
  EXISTING_ROUTE_FAMILIES_STABLE: true
  EXISTING_CORE_MODELS_STABLE: true

CURRENT_ETHIKOS_MODELS:
  - "EthikosCategory"
  - "EthikosTopic"
  - "EthikosStance"
  - "EthikosArgument"

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
  STRATEGY: "native mimic"
  ROUTE_SCOPE: "/ethikos/deliberate/*"
  BACKEND_SCOPE: "konnaxion.ethikos"
  CLAIM_MAPPING: "Claim -> EthikosArgument"
  DISCUSSION_MAPPING: "Discussion -> EthikosTopic"
  IMPACT_VOTE_IS_TOPIC_STANCE: false
```

---

## 4. Object Classification

Objects in this document are classified into four implementation states.

| State                 | Meaning                                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| `existing_core`       | Already exists in the current Ethikos backend and must not be renamed or broken.                               |
| `first_pass_addition` | Proposed for the Kintsugi first-pass native mimic upgrade.                                                     |
| `contract_only`       | Canonical concept that may be represented through existing models or derived payloads before becoming a table. |
| `deferred`            | Valid future object, but not required for the first-pass upgrade.                                              |

---

## 5. Ownership Model

Every canonical object must have exactly one primary owner.

| Owner               | Owns                                                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `Korum`             | Structured debates, topics as deliberation containers, arguments, argument graph, topic stances, moderation on debate artifacts. |
| `Konsultations`     | Intake, consultations, citizen suggestions, ballots, result snapshots, impact tracking.                                          |
| `Smart Vote`        | Derived readings, declared lenses, result interpretation, publication of computed views.                                         |
| `EkoH`              | Expertise context, ethics context, eligibility context, cohort/snapshot metadata.                                                |
| `Drafting`          | Drafts, draft versions, amendments, rationale packets.                                                                           |
| `Admin/Audit`       | Moderation actions, audit events, role changes, governance traceability.                                                         |
| `External Boundary` | Imported/annexed artifacts, projection mappings, provenance records.                                                             |

Ownership defines write authority. It does not prevent other modules from reading or displaying the object.

---

## 6. Current Core Objects

The following objects already exist and are canonical.

### 6.1 `EthikosCategory`

```yaml
OBJECT: "EthikosCategory"
STATUS: "existing_core"
OWNER: "Korum"
CURRENT_MODEL: "EthikosCategory"
ROUTE_SCOPE:
  - "/ethikos/deliberate/*"
  - "/ethikos/decide/*"
API_SCOPE:
  - "/api/ethikos/categories/"
MEANING: "Topic grouping used to organize Ethikos topics."
MUST_NOT:
  - "rename to CategoryGroup"
  - "replace with external taxonomy in first pass"
```

### 6.2 `EthikosTopic`

```yaml
OBJECT: "EthikosTopic"
STATUS: "existing_core"
OWNER: "Korum"
CURRENT_MODEL: "EthikosTopic"
ROUTE_SCOPE:
  - "/ethikos/deliberate/*"
  - "/ethikos/decide/*"
API_SCOPE:
  - "/api/ethikos/topics/"
MEANING: "Main debate, deliberation, or consultation prompt container."
KIALO_MAPPING:
  - "Kialo Discussion -> EthikosTopic"
  - "Kialo Thesis -> EthikosTopic title/description or future thesis field"
MUST_NOT:
  - "rename to KialoDiscussion"
  - "replace with imported discussion model"
  - "move source ownership to Smart Vote"
```

### 6.3 `EthikosStance`

```yaml
OBJECT: "EthikosStance"
STATUS: "existing_core"
OWNER: "Korum"
CURRENT_MODEL: "EthikosStance"
ROUTE_SCOPE:
  - "/ethikos/deliberate/*"
  - "/ethikos/decide/*"
API_SCOPE:
  - "/api/ethikos/stances/"
MEANING: "Per-user topic-level stance."
VALUE_RANGE: "-3..+3"
LEVEL: "topic"
MUST_NOT:
  - "treat as Kialo impact vote"
  - "treat as Smart Vote reading"
  - "replace with external ballot model"
```

### 6.4 `EthikosArgument`

```yaml
OBJECT: "EthikosArgument"
STATUS: "existing_core"
OWNER: "Korum"
CURRENT_MODEL: "EthikosArgument"
ROUTE_SCOPE:
  - "/ethikos/deliberate/*"
API_SCOPE:
  - "/api/ethikos/arguments/"
MEANING: "Threaded argument or reply attached to an Ethikos topic."
KIALO_MAPPING:
  - "Kialo Claim -> EthikosArgument"
  - "Kialo Pro/Con edge -> EthikosArgument.parent + EthikosArgument.side"
MUST_NOT:
  - "rename to Claim"
  - "replace with DebatePost"
  - "create separate Kialo claim table in first pass unless explicitly approved later"
```

---

## 7. Canonical Object Registry

This registry defines the complete canonical vocabulary for the Kintsugi upgrade.

| Canonical Object              | Owner                      |                Status | Current / Proposed Representation            | Primary Route Scope                            |
| ----------------------------- | -------------------------- | --------------------: | -------------------------------------------- | ---------------------------------------------- |
| `EthikosCategory`             | Korum                      |       `existing_core` | `EthikosCategory`                            | `/ethikos/deliberate/*`, `/ethikos/decide/*`   |
| `EthikosTopic`                | Korum                      |       `existing_core` | `EthikosTopic`                               | `/ethikos/deliberate/*`, `/ethikos/decide/*`   |
| `EthikosStance`               | Korum                      |       `existing_core` | `EthikosStance`                              | `/ethikos/deliberate/*`                        |
| `EthikosArgument`             | Korum                      |       `existing_core` | `EthikosArgument`                            | `/ethikos/deliberate/*`                        |
| `ProblemStatement`            | Konsultations              |       `contract_only` | field/payload around topic intake            | `/ethikos/decide/*`                            |
| `IntakeSubmission`            | Konsultations              | `first_pass_addition` | proposed model                               | `/ethikos/decide/*`                            |
| `IntakeQueue`                 | Konsultations              |       `contract_only` | queryset/status view                         | `/ethikos/admin/*`                             |
| `TopicTag`                    | Korum                      |       `contract_only` | may reuse category first                     | `/ethikos/deliberate/*`                        |
| `Option`                      | Konsultations              | `first_pass_addition` | proposed model or JSON payload               | `/ethikos/decide/*`                            |
| `OptionSet`                   | Konsultations              |       `contract_only` | grouped options                              | `/ethikos/decide/*`                            |
| `Constraint`                  | Konsultations              | `first_pass_addition` | proposed model or JSON payload               | `/ethikos/decide/*`                            |
| `ConstraintSet`               | Konsultations              |       `contract_only` | grouped constraints                          | `/ethikos/decide/*`                            |
| `ArgumentGraph`               | Korum                      |       `contract_only` | derived from `EthikosArgument.parent + side` | `/ethikos/deliberate/[topic]`                  |
| `ArgumentEdge`                | Korum                      |       `contract_only` | parent/child relation + side                 | `/ethikos/deliberate/[topic]`                  |
| `ArgumentSource`              | Korum                      | `first_pass_addition` | proposed model                               | `/ethikos/deliberate/[topic]`                  |
| `ArgumentImpactVote`          | Korum                      | `first_pass_addition` | proposed model                               | `/ethikos/deliberate/[topic]`                  |
| `ArgumentSuggestion`          | Korum                      | `first_pass_addition` | proposed model                               | `/ethikos/deliberate/[topic]`                  |
| `ArgumentBookmark`            | Korum                      |            `deferred` | proposed model                               | `/ethikos/deliberate/[topic]`                  |
| `ArgumentLink`                | Korum                      |            `deferred` | proposed model                               | `/ethikos/deliberate/[topic]`                  |
| `BallotEvent`                 | Konsultations              | `first_pass_addition` | proposed model or event table                | `/ethikos/decide/*`                            |
| `DecisionProtocol`            | Konsultations / Smart Vote | `first_pass_addition` | proposed model                               | `/ethikos/decide/*`                            |
| `DecisionRecord`              | Konsultations / Smart Vote | `first_pass_addition` | proposed model                               | `/ethikos/decide/results`                      |
| `Draft`                       | Drafting                   | `first_pass_addition` | proposed model                               | `/ethikos/decide/*`                            |
| `DraftVersion`                | Drafting                   | `first_pass_addition` | proposed model                               | `/ethikos/decide/*`                            |
| `Amendment`                   | Drafting                   | `first_pass_addition` | proposed model                               | `/ethikos/decide/*`                            |
| `RationalePacket`             | Drafting                   | `first_pass_addition` | proposed model or JSON artifact              | `/ethikos/decide/*`                            |
| `BaselineResult`              | Smart Vote                 |       `contract_only` | derived from source events                   | `/ethikos/decide/results`                      |
| `LensDeclaration`             | Smart Vote                 | `first_pass_addition` | proposed model                               | `/ethikos/decide/results`, `/ethikos/insights` |
| `ReadingResult`               | Smart Vote                 | `first_pass_addition` | proposed model                               | `/ethikos/decide/results`, `/ethikos/insights` |
| `SnapshotRef`                 | EkoH                       |       `contract_only` | reference to EkoH snapshot/context           | `/ethikos/trust/*`, `/ethikos/insights`        |
| `EligibilityRule`             | EkoH / Konsultations       | `first_pass_addition` | proposed model                               | `/ethikos/admin/roles`                         |
| `CohortContext`               | EkoH                       |       `contract_only` | snapshot/ref payload                         | `/ethikos/trust/*`                             |
| `ImpactTrack`                 | Konsultations              | `first_pass_addition` | proposed model                               | `/ethikos/impact/tracker`                      |
| `ImpactUpdate`                | Konsultations              | `first_pass_addition` | proposed model                               | `/ethikos/impact/*`                            |
| `ExternalArtifact`            | External Boundary          | `first_pass_addition` | proposed append-only model                   | admin/backoffice                               |
| `ProjectionMapping`           | External Boundary          | `first_pass_addition` | proposed mapping model                       | admin/backoffice                               |
| `ModerationAction`            | Admin/Audit                | `first_pass_addition` | proposed model or log entry                  | `/ethikos/admin/moderation`                    |
| `AuditEvent`                  | Admin/Audit                | `first_pass_addition` | proposed model or log entry                  | `/ethikos/admin/audit`                         |
| `DiscussionParticipantRole`   | Korum/Admin                | `first_pass_addition` | proposed model                               | `/ethikos/admin/roles`                         |
| `DiscussionVisibilitySetting` | Korum/Admin                | `first_pass_addition` | proposed model or topic settings             | `/ethikos/deliberate/*`                        |
| `DiscussionPerspective`       | Korum / Smart Vote         |            `deferred` | proposed model                               | `/ethikos/insights`                            |
| `DiscussionTemplate`          | Korum                      |            `deferred` | proposed model                               | `/ethikos/deliberate/*`                        |
| `DiscussionGroup`             | Korum                      |            `deferred` | proposed model                               | `/ethikos/deliberate/*`                        |
| `DiscussionExport`            | Korum                      |            `deferred` | export artifact                              | `/ethikos/deliberate/*`                        |

---

## 8. Object Families

### 8.1 Korum Objects

Korum objects describe structured deliberation.

```yaml
KORUM_OBJECTS:
  existing_core:
    - "EthikosCategory"
    - "EthikosTopic"
    - "EthikosStance"
    - "EthikosArgument"
  first_pass_addition:
    - "ArgumentSource"
    - "ArgumentImpactVote"
    - "ArgumentSuggestion"
    - "DiscussionParticipantRole"
    - "DiscussionVisibilitySetting"
    - "ModerationAction"
  contract_only:
    - "ArgumentGraph"
    - "ArgumentEdge"
  deferred:
    - "ArgumentBookmark"
    - "ArgumentLink"
    - "DiscussionPerspective"
    - "DiscussionTemplate"
    - "DiscussionGroup"
    - "DiscussionExport"
```

Korum owns topic-level deliberation facts.

Korum does not own Smart Vote readings, formal consultation ballots, or EkoH expertise snapshots.

---

### 8.2 Kialo-Style Structured Argument Objects

Kialo-style concepts are mapped into Korum. They do not create a new Kialo module.

| Kialo Concept    | Canonical Kintsugi Object          | Current / Proposed Representation            |
| ---------------- | ---------------------------------- | -------------------------------------------- |
| Discussion       | `EthikosTopic`                     | existing model                               |
| Thesis           | topic prompt / title / description | existing fields first; optional future field |
| Claim            | `EthikosArgument`                  | existing model                               |
| Pro/Con relation | `ArgumentEdge`                     | parent + side                                |
| Claim source     | `ArgumentSource`                   | first-pass addition                          |
| Impact vote      | `ArgumentImpactVote`               | first-pass addition                          |
| Suggested claim  | `ArgumentSuggestion`               | first-pass addition                          |
| Role             | `DiscussionParticipantRole`        | first-pass addition                          |
| Visibility       | `DiscussionVisibilitySetting`      | first-pass addition                          |
| Perspective      | `DiscussionPerspective`            | deferred or Smart Vote lens-adjacent         |
| Template         | `DiscussionTemplate`               | deferred                                     |
| Export           | `DiscussionExport`                 | deferred                                     |

Critical distinction:

```txt
Kialo Claim = UX/conceptual term.
EthikosArgument = backend model name.
Do not rename EthikosArgument to Claim.
```

---

### 8.3 Konsultations Objects

Konsultations objects describe intake, consultation, formal decision input, and public accountability.

```yaml
KONSULTATIONS_OBJECTS:
  first_pass_addition:
    - "IntakeSubmission"
    - "Option"
    - "Constraint"
    - "BallotEvent"
    - "DecisionProtocol"
    - "DecisionRecord"
    - "ImpactTrack"
    - "ImpactUpdate"
  contract_only:
    - "ProblemStatement"
    - "IntakeQueue"
    - "OptionSet"
    - "ConstraintSet"
```

Konsultations owns formal consultation state and result snapshots.

Konsultations does not own Smart Vote’s derived readings.

---

### 8.4 Smart Vote Objects

Smart Vote objects describe derived interpretation of baseline events.

```yaml
SMART_VOTE_OBJECTS:
  first_pass_addition:
    - "LensDeclaration"
    - "ReadingResult"
  contract_only:
    - "BaselineResult"
```

Smart Vote may compute:

* baseline readings;
* cohort-filtered readings;
* expertise-weighted readings;
* ethics-contextualized readings;
* comparative readings.

Smart Vote must not mutate:

* `EthikosStance`;
* `BallotEvent`;
* `EthikosArgument`;
* `EthikosTopic`.

---

### 8.5 EkoH Objects

EkoH objects provide expertise, ethics, eligibility, and context.

```yaml
EKOH_OBJECTS:
  first_pass_addition:
    - "EligibilityRule"
  contract_only:
    - "SnapshotRef"
    - "CohortContext"
    - "ExpertiseContext"
    - "EthicsContext"
```

EkoH is not a voting engine.

EkoH context may be referenced by Smart Vote readings through `snapshot_ref`.

---

### 8.6 Drafting Objects

Drafting objects support the civic transition from deliberation to decision-ready text.

```yaml
DRAFTING_OBJECTS:
  first_pass_addition:
    - "Draft"
    - "DraftVersion"
    - "Amendment"
    - "RationalePacket"
```

Drafting is a bounded capability under ethiKos. It must not overwrite Korum arguments or Konsultations ballots.

---

### 8.7 External Boundary Objects

External boundary objects support future Annex/sidecar integrations without allowing foreign tools to write into core tables.

```yaml
EXTERNAL_BOUNDARY_OBJECTS:
  first_pass_addition:
    - "ExternalArtifact"
    - "ProjectionMapping"
```

`ExternalArtifact` is append-only provenance.

`ProjectionMapping` maps external identifiers to internal canonical identifiers.

No external tool may directly mutate core Korum or Konsultations tables.

---

### 8.8 Admin and Audit Objects

Admin and audit objects record governance actions.

```yaml
ADMIN_AUDIT_OBJECTS:
  first_pass_addition:
    - "ModerationAction"
    - "AuditEvent"
    - "DiscussionParticipantRole"
    - "DiscussionVisibilitySetting"
```

Audit objects must be designed for traceability and reproducibility, not only UI display.

---

## 9. Event Classification

Events are named in past tense.

Event names must use the following pattern:

```txt
<Object><PastTenseVerb>
```

Examples:

```txt
TopicCreated
ArgumentSourceAttached
ReadingComputed
ImpactUpdated
```

Events are classified as:

| Event Type       | Meaning                                                     |
| ---------------- | ----------------------------------------------------------- |
| `source_event`   | A user or system action that changes canonical civic state. |
| `derived_event`  | A computed event derived from source events.                |
| `audit_event`    | A governance, moderation, or system trace event.            |
| `external_event` | A received or mapped event from an external artifact.       |

---

## 10. Canonical Event Envelope

Every canonical event SHOULD be representable using this envelope, even if implemented later as model rows, audit logs, or serialized payloads.

```yaml
CanonicalEventEnvelope:
  event_id: "string or integer"
  event_type: "string"
  event_family: "source_event | derived_event | audit_event | external_event"
  owner: "Korum | Konsultations | Smart Vote | EkoH | Drafting | Admin/Audit | External Boundary"
  actor_id: "nullable user id"
  actor_display: "nullable display string"
  subject_type: "canonical object name"
  subject_id: "object id or stable ref"
  parent_subject_type: "nullable canonical object name"
  parent_subject_id: "nullable object id or stable ref"
  occurred_at: "ISO_8601 datetime"
  payload: "JSON object"
  source_ref: "nullable source/provenance ref"
  snapshot_ref: "nullable EkoH/context snapshot ref"
  trace_id: "nullable request/process id"
```

Minimum event fields:

```yaml
MINIMUM_EVENT_FIELDS:
  - "event_type"
  - "event_family"
  - "owner"
  - "subject_type"
  - "subject_id"
  - "occurred_at"
```

---

## 11. Korum Event Registry

Korum events describe deliberation state changes.

| Event                         | Family         | Subject                       | Trigger                         | Notes                                                                          |
| ----------------------------- | -------------- | ----------------------------- | ------------------------------- | ------------------------------------------------------------------------------ |
| `TopicCreated`                | `source_event` | `EthikosTopic`                | topic created                   | Existing topic creation.                                                       |
| `TopicUpdated`                | `source_event` | `EthikosTopic`                | topic edited                    | Must preserve auditability.                                                    |
| `TopicClosed`                 | `source_event` | `EthikosTopic`                | topic status changed to closed  | May affect Decide/results views.                                               |
| `TopicArchived`               | `source_event` | `EthikosTopic`                | topic archived                  | Must not delete source facts.                                                  |
| `CategoryCreated`             | `source_event` | `EthikosCategory`             | category created                | Admin or seed action.                                                          |
| `CategoryUpdated`             | `source_event` | `EthikosCategory`             | category edited                 | Maintains grouping.                                                            |
| `StanceRecorded`              | `source_event` | `EthikosStance`               | user records stance             | Topic-level `-3..+3`.                                                          |
| `StanceUpdated`               | `source_event` | `EthikosStance`               | user updates stance             | Must preserve current source state; historical audit optional but recommended. |
| `ArgumentCreated`             | `source_event` | `EthikosArgument`             | argument posted                 | Existing core behavior.                                                        |
| `ArgumentUpdated`             | `source_event` | `EthikosArgument`             | argument edited                 | Must preserve moderation trace.                                                |
| `ArgumentHidden`              | `audit_event`  | `EthikosArgument`             | moderation hides argument       | Does not delete argument.                                                      |
| `ArgumentRestored`            | `audit_event`  | `EthikosArgument`             | moderation restores argument    | Reverses hidden state.                                                         |
| `ArgumentParentAssigned`      | `source_event` | `EthikosArgument`             | parent relation set             | Builds argument graph.                                                         |
| `ArgumentSideAssigned`        | `source_event` | `EthikosArgument`             | side set to pro/con/neutral     | Builds Kialo-style edge meaning.                                               |
| `ArgumentSourceAttached`      | `source_event` | `ArgumentSource`              | source added to argument        | Kialo-style source transparency.                                               |
| `ArgumentSourceUpdated`       | `source_event` | `ArgumentSource`              | source edited                   | Must preserve provenance if possible.                                          |
| `ArgumentSourceRemoved`       | `audit_event`  | `ArgumentSource`              | source removed or hidden        | Prefer soft removal.                                                           |
| `ArgumentImpactVoteRecorded`  | `source_event` | `ArgumentImpactVote`          | user votes on claim impact      | Claim-level `0..4`; not a stance.                                              |
| `ArgumentImpactVoteUpdated`   | `source_event` | `ArgumentImpactVote`          | user updates impact vote        | Claim-level only.                                                              |
| `ArgumentSuggestionSubmitted` | `source_event` | `ArgumentSuggestion`          | suggester submits claim         | Not published until accepted.                                                  |
| `ArgumentSuggestionAccepted`  | `audit_event`  | `ArgumentSuggestion`          | editor/admin accepts suggestion | May create `EthikosArgument`.                                                  |
| `ArgumentSuggestionRejected`  | `audit_event`  | `ArgumentSuggestion`          | editor/admin rejects suggestion | Must keep moderation trace.                                                    |
| `DiscussionRoleAssigned`      | `audit_event`  | `DiscussionParticipantRole`   | role assigned                   | Used for Kialo-style permissions.                                              |
| `DiscussionVisibilityChanged` | `audit_event`  | `DiscussionVisibilitySetting` | visibility changed              | Includes anonymity/author/vote visibility.                                     |

---

## 12. Konsultations Event Registry

Konsultations events describe intake, consultation, decision input, and accountability state.

| Event                      | Family         | Subject            | Trigger                           | Notes                                   |
| -------------------------- | -------------- | ------------------ | --------------------------------- | --------------------------------------- |
| `IntakeSubmissionCreated`  | `source_event` | `IntakeSubmission` | citizen/admin submits intake      | May lead to topic or consultation.      |
| `IntakeSubmissionTriaged`  | `audit_event`  | `IntakeSubmission` | admin classifies intake           | Links to pipeline Stage 0.              |
| `ProblemStatementDefined`  | `source_event` | `ProblemStatement` | problem statement accepted        | May be stored as field/payload.         |
| `OptionCreated`            | `source_event` | `Option`           | option added                      | Consultation/decision option.           |
| `OptionUpdated`            | `source_event` | `Option`           | option edited                     | Must preserve audit trace.              |
| `OptionRemoved`            | `audit_event`  | `Option`           | option removed/hidden             | Prefer soft removal.                    |
| `ConstraintCreated`        | `source_event` | `Constraint`       | constraint added                  | Defines feasibility/context.            |
| `ConstraintUpdated`        | `source_event` | `Constraint`       | constraint edited                 | Must preserve trace.                    |
| `ConsultationOpened`       | `source_event` | `DecisionRecord`   | consultation/decision opens       | Protocol governs inputs.                |
| `ConsultationClosed`       | `source_event` | `DecisionRecord`   | consultation/decision closes      | Locks or snapshots input.               |
| `BallotRecorded`           | `source_event` | `BallotEvent`      | formal ballot submitted           | Not same as `EthikosStance`.            |
| `BallotUpdated`            | `source_event` | `BallotEvent`      | ballot changed if protocol allows | Must follow protocol.                   |
| `DecisionProtocolAssigned` | `audit_event`  | `DecisionProtocol` | protocol selected                 | Defines rules.                          |
| `DecisionRecordCreated`    | `source_event` | `DecisionRecord`   | decision record created           | Links source inputs and readings.       |
| `DecisionRecordPublished`  | `source_event` | `DecisionRecord`   | result published                  | Should include baseline + reading refs. |

---

## 13. Drafting Event Registry

Drafting events describe collaborative civic text formation.

| Event                    | Family         | Subject           | Trigger                              | Notes                                          |
| ------------------------ | -------------- | ----------------- | ------------------------------------ | ---------------------------------------------- |
| `DraftCreated`           | `source_event` | `Draft`           | draft initialized                    | May originate from topic, intake, or decision. |
| `DraftVersionCreated`    | `source_event` | `DraftVersion`    | new version saved                    | Version history must remain stable.            |
| `DraftVersionPublished`  | `source_event` | `DraftVersion`    | version published for review         | Public or internal depending status.           |
| `AmendmentSubmitted`     | `source_event` | `Amendment`       | amendment proposed                   | Must link to draft/version.                    |
| `AmendmentAccepted`      | `audit_event`  | `Amendment`       | amendment accepted                   | May create new draft version.                  |
| `AmendmentRejected`      | `audit_event`  | `Amendment`       | amendment rejected                   | Must preserve rationale.                       |
| `RationalePacketCreated` | `source_event` | `RationalePacket` | rationale attached to draft/decision | Links reasons, constraints, readings.          |
| `RationalePacketUpdated` | `source_event` | `RationalePacket` | rationale updated                    | Must preserve traceability.                    |

---

## 14. Smart Vote Event Registry

Smart Vote events are derived or publication events. They do not mutate source facts.

| Event                     | Family          | Subject           | Trigger                            | Notes                                                                   |
| ------------------------- | --------------- | ----------------- | ---------------------------------- | ----------------------------------------------------------------------- |
| `LensDeclarationCreated`  | `source_event`  | `LensDeclaration` | lens declared                      | Defines computation rules.                                              |
| `LensDeclarationUpdated`  | `audit_event`   | `LensDeclaration` | lens updated                       | Should invalidate dependent readings if needed.                         |
| `BaselineResultComputed`  | `derived_event` | `BaselineResult`  | raw aggregation computed           | Uses source events.                                                     |
| `ReadingComputed`         | `derived_event` | `ReadingResult`   | lens-based reading computed        | Must include `reading_key`, `lens_hash`, `snapshot_ref`, `computed_at`. |
| `ReadingPublished`        | `derived_event` | `ReadingResult`   | reading made visible               | Does not replace baseline.                                              |
| `ReadingInvalidated`      | `audit_event`   | `ReadingResult`   | source/lens/snapshot changed       | Requires recomputation or warning.                                      |
| `ResultSnapshotPublished` | `derived_event` | `DecisionRecord`  | decision/result snapshot published | Includes baseline and readings.                                         |

Smart Vote event invariant:

```txt
Smart Vote reads source facts.
Smart Vote writes derived artifacts.
Smart Vote does not mutate source facts.
```

---

## 15. EkoH Event Registry

EkoH events describe expertise, ethics, cohort, and snapshot context.

| Event                      | Family         | Subject            | Trigger                                      | Notes                                  |
| -------------------------- | -------------- | ------------------ | -------------------------------------------- | -------------------------------------- |
| `SnapshotReferenced`       | `audit_event`  | `SnapshotRef`      | reading or decision references EkoH snapshot | Context only.                          |
| `EligibilityRuleCreated`   | `source_event` | `EligibilityRule`  | rule created                                 | May affect consultation participation. |
| `EligibilityRuleUpdated`   | `audit_event`  | `EligibilityRule`  | rule changed                                 | Must be audited.                       |
| `CohortContextAttached`    | `audit_event`  | `CohortContext`    | cohort context linked to lens/decision       | Does not cast votes.                   |
| `ExpertiseContextAttached` | `audit_event`  | `ExpertiseContext` | expertise context linked                     | Does not mutate ballots.               |
| `EthicsContextAttached`    | `audit_event`  | `EthicsContext`    | ethics context linked                        | Does not mutate ballots.               |

EkoH event invariant:

```txt
EkoH provides context.
EkoH does not vote.
EkoH does not own source ballot events.
```

---

## 16. Impact Event Registry

Impact events describe the public accountability loop.

| Event                     | Family         | Subject                            | Trigger                   | Notes                               |
| ------------------------- | -------------- | ---------------------------------- | ------------------------- | ----------------------------------- |
| `ImpactTrackCreated`      | `source_event` | `ImpactTrack`                      | tracking object created   | Links decision to outcome.          |
| `ImpactTrackUpdated`      | `source_event` | `ImpactTrack`                      | tracker state changed     | Supports `/ethikos/impact/tracker`. |
| `ImpactUpdatePublished`   | `source_event` | `ImpactUpdate`                     | public update posted      | Accountability artifact.            |
| `ImpactFeedbackReceived`  | `source_event` | `ImpactUpdate` or feedback payload | feedback submitted        | Supports feedback loop.             |
| `OutcomeMarkedPlanned`    | `source_event` | `ImpactTrack`                      | status set to planned     | Status transition.                  |
| `OutcomeMarkedInProgress` | `source_event` | `ImpactTrack`                      | status set to in progress | Status transition.                  |
| `OutcomeMarkedBlocked`    | `source_event` | `ImpactTrack`                      | status set to blocked     | Requires reason.                    |
| `OutcomeMarkedCompleted`  | `source_event` | `ImpactTrack`                      | status set to completed   | Requires evidence/ref.              |
| `OutcomeMarkedCancelled`  | `source_event` | `ImpactTrack`                      | status set to cancelled   | Requires reason.                    |

Impact invariant:

```txt
Impact belongs to Ethikos/Konsultations accountability truth.
KeenKonnect may receive handoff references, but it does not own Ethikos impact truth.
```

---

## 17. External Boundary Event Registry

External boundary events support future Annex/sidecar integration while preventing direct writes into core tables.

| Event                       | Family           | Subject             | Trigger                                | Notes                                        |
| --------------------------- | ---------------- | ------------------- | -------------------------------------- | -------------------------------------------- |
| `ExternalArtifactReceived`  | `external_event` | `ExternalArtifact`  | external payload received              | Append-only provenance.                      |
| `ExternalArtifactValidated` | `audit_event`    | `ExternalArtifact`  | payload checked                        | Does not mutate core tables directly.        |
| `ExternalArtifactRejected`  | `audit_event`    | `ExternalArtifact`  | payload rejected                       | Preserve reason.                             |
| `ProjectionMappingCreated`  | `audit_event`    | `ProjectionMapping` | external ID mapped to internal ID      | Adapter boundary.                            |
| `ProjectionMappingUpdated`  | `audit_event`    | `ProjectionMapping` | mapping changed                        | Must be audited.                             |
| `ProjectionApplied`         | `audit_event`    | `ProjectionMapping` | projection created via Ethikos service | Must use service layer, not direct DB write. |

External boundary invariant:

```txt
Annex tools write ExternalArtifact and ProjectionMapping only.
Canonical projection must go through Ethikos services.
Foreign tools do not write core Korum/Konsultations tables directly.
```

---

## 18. Admin and Audit Event Registry

Admin and audit events provide traceability.

| Event                      | Family        | Subject                       | Trigger                                      | Notes                                                    |
| -------------------------- | ------------- | ----------------------------- | -------------------------------------------- | -------------------------------------------------------- |
| `ModerationActionRecorded` | `audit_event` | `ModerationAction`            | moderation action taken                      | Required for admin traceability.                         |
| `AuditEventRecorded`       | `audit_event` | `AuditEvent`                  | system/admin event logged                    | Generic audit record.                                    |
| `RoleAssigned`             | `audit_event` | `DiscussionParticipantRole`   | user receives role                           | Role scope must be explicit.                             |
| `RoleRevoked`              | `audit_event` | `DiscussionParticipantRole`   | role removed                                 | Must be audited.                                         |
| `VisibilitySettingChanged` | `audit_event` | `DiscussionVisibilitySetting` | author/vote/participation visibility changed | Important for anonymity.                                 |
| `AnonymousModeEnabled`     | `audit_event` | `DiscussionVisibilitySetting` | anonymous mode enabled                       | Must protect normal participants from identity exposure. |
| `AnonymousModeDisabled`    | `audit_event` | `DiscussionVisibilitySetting` | anonymous mode disabled                      | Must be explicit and audited.                            |

---

## 19. Vote and Reading Separation

The following object distinctions are mandatory.

| Object               | Owner         | Level                  | Range / Form      | Source or Derived? |
| -------------------- | ------------- | ---------------------- | ----------------- | ------------------ |
| `EthikosStance`      | Korum         | Topic                  | `-3..+3`          | Source             |
| `ArgumentImpactVote` | Korum         | Argument/claim         | `0..4`            | Source             |
| `BallotEvent`        | Konsultations | Decision/consultation  | Protocol-specific | Source             |
| `BaselineResult`     | Smart Vote    | Aggregation            | Computed          | Derived            |
| `ReadingResult`      | Smart Vote    | Lens-based aggregation | Computed          | Derived            |
| `SnapshotRef`        | EkoH          | Context                | Reference         | Context            |

Forbidden equivalences:

```txt
ArgumentImpactVote = EthikosStance
ArgumentImpactVote = BallotEvent
EthikosStance = ReadingResult
BallotEvent = ReadingResult
SnapshotRef = vote
EkoH context = vote
Smart Vote reading = source fact
```

---

## 20. Object Lifecycle by Pipeline Stage

| Stage | Name                     | Primary Owner              | Input Objects                                      | Output Objects                                          |
| ----: | ------------------------ | -------------------------- | -------------------------------------------------- | ------------------------------------------------------- |
|     0 | Intake                   | Konsultations              | `IntakeSubmission`                                 | `ProblemStatement`, `IntakeQueue`                       |
|     1 | Discovery / Consultation | Konsultations              | `ProblemStatement`, `Option`, `Constraint`         | `OptionSet`, `ConstraintSet`                            |
|     2 | Deliberation             | Korum                      | `EthikosTopic`, `EthikosArgument`, `EthikosStance` | `ArgumentGraph`, `StanceEvent`, `ModerationAction`      |
|     3 | Drafting                 | Drafting                   | `ArgumentGraph`, `OptionSet`, `ConstraintSet`      | `Draft`, `DraftVersion`, `Amendment`, `RationalePacket` |
|     4 | Decision                 | Konsultations / Smart Vote | `BallotEvent`, `EthikosStance`, `LensDeclaration`  | `BaselineResult`, `ReadingResult`, `DecisionRecord`     |
|     5 | Accountability           | Konsultations              | `DecisionRecord`, `ImpactTrack`                    | `ImpactUpdate`, public accountability snapshot          |

---

## 21. Object Naming Rules

Canonical object names must follow these rules:

1. Use singular nouns.
2. Use PascalCase.
3. Do not encode implementation framework names.
4. Do not encode OSS source names unless the object is explicitly external-boundary/provenance.
5. Prefer domain meaning over UI label.
6. Preserve existing model names exactly.

Valid:

```txt
ArgumentSource
ReadingResult
LensDeclaration
ImpactTrack
ExternalArtifact
ProjectionMapping
```

Invalid:

```txt
KialoClaim
DecidimProposal
LoomioPoll
ConsulVote
WeightedTopicThing
DebatePost
Opinion
```

Exception:

* OSS names may appear in documentation as pattern references, not canonical object names.

---

## 22. Event Naming Rules

Canonical events must follow these rules:

1. Use PascalCase.
2. Use past tense.
3. Start with the object or domain subject.
4. Do not use UI verbs such as “clicked” unless the UI action is the actual audited event.
5. Do not name derived readings as if they are source facts.

Valid:

```txt
TopicCreated
ArgumentSourceAttached
ArgumentImpactVoteRecorded
ReadingComputed
ImpactUpdatePublished
ProjectionMappingCreated
```

Invalid:

```txt
UserClickedVote
KialoClaimMade
SmartVoteChangedStance
EkoHVoted
ResultTruthOverwritten
```

---

## 23. Required Object Invariants

### 23.1 Existing Core Must Remain Stable

```txt
EthikosCategory
EthikosTopic
EthikosStance
EthikosArgument
```

These names must not be replaced or renamed by Kintsugi.

### 23.2 Source Facts Must Remain Source Facts

Source facts include:

```txt
EthikosTopic
EthikosStance
EthikosArgument
ArgumentImpactVote
BallotEvent
DraftVersion
Amendment
ImpactUpdate
```

Source facts must not be overwritten by derived readings.

### 23.3 Readings Must Be Reproducible

Every `ReadingResult` must be reproducible from:

```txt
BaselineEvents + LensDeclaration + SnapshotContext?
```

Required reading fields:

```txt
reading_key
lens_hash
snapshot_ref
computed_at
topic_id or consultation_id
results_payload
```

### 23.4 External Artifacts Must Be Boundary Objects

External artifacts are not canonical civic truth until projected through approved services.

### 23.5 Anonymity Must Be Protected

If `DiscussionVisibilitySetting` enables anonymous participation, ordinary participants must not see hidden author identities.

---

## 24. First-Pass Additions

The following objects are recommended for first-pass consideration.

```yaml
FIRST_PASS_OBJECTS:
  KORUM:
    - "ArgumentSource"
    - "ArgumentImpactVote"
    - "ArgumentSuggestion"
    - "DiscussionParticipantRole"
    - "DiscussionVisibilitySetting"
  KONSULTATIONS:
    - "IntakeSubmission"
    - "Option"
    - "Constraint"
    - "BallotEvent"
    - "DecisionProtocol"
    - "DecisionRecord"
  SMART_VOTE:
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
  EXTERNAL_BOUNDARY:
    - "ExternalArtifact"
    - "ProjectionMapping"
  ADMIN_AUDIT:
    - "ModerationAction"
    - "AuditEvent"
```

These are not automatically implementation tasks. They are canonical object candidates to be considered by:

```txt
08_DATA_MODEL_AND_MIGRATION_PLAN.md
13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md
22_IMPLEMENTATION_BACKLOG_TEMPLATE.md
```

---

## 25. Deferred Objects

The following objects are valid but deferred unless explicitly approved later.

```yaml
DEFERRED_OBJECTS:
  KIALO_STYLE:
    - "ArgumentBookmark"
    - "ArgumentLink"
    - "DiscussionPerspective"
    - "DiscussionTemplate"
    - "DiscussionGroup"
    - "DiscussionExport"
  ADVANCED_CONSENSUS:
    - "PolisCluster"
    - "LiquidDelegation"
    - "PairwisePreference"
  MEETING_FORMALITY:
    - "AgendaItem"
    - "Motion"
    - "RollCall"
```

Deferred means:

* may be mentioned as future work;
* must not drive first-pass migrations;
* must not create first-pass endpoints;
* must not create first-pass route families.

---

## 26. Anti-Drift Rules

The following rules are binding.

### 26.1 Do Not Rename Existing Core

```txt
Do not rename EthikosTopic.
Do not rename EthikosStance.
Do not rename EthikosArgument.
Do not rename EthikosCategory.
```

### 26.2 Do Not Create Duplicate Concept Models

Forbidden duplicates:

```txt
Claim as replacement for EthikosArgument
Opinion as replacement for EthikosStance
KialoDiscussion as replacement for EthikosTopic
WeightedVote as replacement for ReadingResult
```

### 26.3 Do Not Merge Vote Types

```txt
EthikosStance is topic-level.
ArgumentImpactVote is argument-level.
BallotEvent is consultation/decision-level.
ReadingResult is derived.
```

### 26.4 Do Not Move Ownership

```txt
Korum owns deliberation source facts.
Konsultations owns formal consultation inputs and accountability.
Smart Vote owns derived readings.
EkoH owns context only.
```

### 26.5 Do Not Create a Kialo Module

```txt
Do not create /kialo routes.
Do not create konnaxion.kialo.
Do not import Kialo code.
Use Kialo as native mimic inside /ethikos/deliberate/*.
```

### 26.6 Do Not Let Annexes Write Core Tables

```txt
External tools write ExternalArtifact and ProjectionMapping.
They do not write EthikosTopic, EthikosStance, EthikosArgument, BallotEvent, or ReadingResult directly.
```

### 26.7 Do Not Produce Backlog Here

This file defines vocabulary. It does not assign tasks.

---

## 27. Invalid Object/Event Patterns

The following are invalid and must be rejected.

```txt
Object: KialoClaim
Reason: duplicates EthikosArgument and creates OSS naming drift.

Object: SmartVoteStance
Reason: merges source stance with derived reading.

Object: EkoHVote
Reason: EkoH is not a voting engine.

Object: DecidimProcess
Reason: imports OSS product architecture as canonical object.

Object: PolisCluster
Reason: deferred source, not first-pass.

Event: SmartVoteChangedStance
Reason: Smart Vote must not mutate source facts.

Event: EkoHVoted
Reason: EkoH does not vote.

Event: ArgumentImpactVoteBecameBallot
Reason: argument impact votes and ballots are separate object families.
```

---

## 28. Valid Object/Event Patterns

The following are valid.

```txt
Object: ArgumentSource
Reason: supports Kialo-style evidence transparency.

Object: ArgumentImpactVote
Reason: supports Kialo-style claim-level impact voting while preserving EthikosStance.

Object: ReadingResult
Reason: captures Smart Vote derived readings.

Object: LensDeclaration
Reason: makes Smart Vote readings declared and reproducible.

Object: ExternalArtifact
Reason: supports future annex boundaries without direct core writes.

Event: ArgumentSourceAttached
Reason: records evidence added to a claim/argument.

Event: ReadingComputed
Reason: records derived Smart Vote computation.

Event: ProjectionMappingCreated
Reason: records controlled mapping from external artifact to canonical object.
```

---

## 29. Related Docs

This document depends on:

```txt
02_SOURCE_OF_TRUTH_AND_DRIFT_CONTROL.md
03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md
04_CANONICAL_NAMING_AND_VARIABLES.md
05_CURRENT_STATE_BASELINE.md
08_DATA_MODEL_AND_MIGRATION_PLAN.md
09_SMART_VOTE_EKOH_READING_CONTRACT.md
13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md
20_AI_GENERATION_GUARDRAILS.md
21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md
```

This document is referenced by:

```txt
06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md
07_API_AND_SERVICE_CONTRACTS.md
08_DATA_MODEL_AND_MIGRATION_PLAN.md
09_SMART_VOTE_EKOH_READING_CONTRACT.md
13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md
14_FRONTEND_ALIGNMENT_CONTRACT.md
15_BACKEND_ALIGNMENT_CONTRACT.md
16_TEST_AND_SMOKE_CONTRACT.md
18_ADR_REGISTER.md
22_IMPLEMENTATION_BACKLOG_TEMPLATE.md
```

---

## 30. Final Binding Rule

All future Kintsugi docs, code proposals, schema designs, serializer contracts, frontend payloads, and backlog tasks must use this object/event vocabulary unless a later human-approved ADR explicitly supersedes it.

```yaml
FINAL_RULE:
  IF_A_NEW_OBJECT_DUPLICATES_EXISTING_CORE:
    RESULT: "invalid"

  IF_A_NEW_EVENT_MUTATES_THE_WRONG_OWNER:
    RESULT: "invalid"

  IF_A_READING_IS_TREATED_AS_SOURCE_FACT:
    RESULT: "invalid"

  IF_KIALO_TERMS_REPLACE_ETHIKOS_MODEL_NAMES:
    RESULT: "invalid"

  IF_EXTERNAL_TOOLS_WRITE_CORE_TABLES:
    RESULT: "invalid"

  IF_THE_OBJECT_OR_EVENT_IS_NOT_LISTED_HERE:
    ACTION: "add it to this document through explicit review before implementation"
```

This document is the canonical object and event registry for the ethiKos Kintsugi upgrade.

