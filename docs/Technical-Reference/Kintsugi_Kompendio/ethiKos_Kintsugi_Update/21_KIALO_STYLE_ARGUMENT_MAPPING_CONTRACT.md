# 21 — Kialo-style Argument Mapping Contract

**File:** `21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md`  
**Pack:** `ethiKos Kintsugi Update Documentation Pack`  
**Canonical path:** `docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/`  
**Status:** Draft for execution alignment  
**Version:** `2026-04-25-kintsugi-doc-pack-v1`  
**Primary module:** `ethiKos`  
**Route scope:** `/ethikos/deliberate/*`  
**Backend scope:** `konnaxion.ethikos`  

---

## 1. Purpose

This document defines the Kialo-style structured argument mapping contract for the ethiKos Kintsugi Upgrade.

Kialo-style argument mapping is the canonical first-pass reference for strengthening **Korum**, the structured deliberation side of ethiKos.

This contract defines how Kialo-style concepts map into the existing ethiKos architecture without importing Kialo code, creating a Kialo module, or renaming existing ethiKos models.

The goal is to turn `/ethikos/deliberate/*` into a stronger structured deliberation workspace using:

- thesis-centered discussions;
- claim-like argument nodes;
- pro/con parent-child relations;
- evidence/source attachments;
- claim-level impact voting;
- suggested claims;
- role-aware participation;
- author visibility settings;
- voting visibility settings;
- optional perspectives;
- optional minimap/tree navigation;
- optional export and template patterns.

This document is normative. Future docs, code-reading plans, payload contracts, frontend plans, and model proposals MUST obey it.

---

## 2. Scope

This document covers the Kialo-style features that may be mimicked inside ethiKos.

It covers:

- canonical Kialo-to-ethiKos concept mapping;
- route scope;
- backend scope;
- frontend scope;
- first-pass features;
- deferred features;
- model candidates;
- payload candidates;
- permissions;
- visibility rules;
- anonymity rules;
- source/evidence rules;
- voting distinctions;
- anti-drift rules.

It does not define:

- exact Django migration files;
- exact serializer implementation;
- exact React component code;
- final visual design;
- final database indexes;
- production permission middleware;
- final export implementation;
- direct Kialo code import.

Those details belong in companion implementation documents.

---

## 3. Canonical Variables Used

```yaml
KIALO:
  STRATEGY: "native_mimic"
  ROLE_IN_KINTSUGI: "Canonical structured deliberation UX reference for Korum"
  ROUTE_SCOPE: "/ethikos/deliberate/*"
  BACKEND_SCOPE: "konnaxion.ethikos"
  CREATE_KIALO_BACKEND_APP: false
  CREATE_KIALO_FRONTEND_ROUTE: false
  IMPORT_KIALO_CODE: false

KIALO_CANONICAL_MAPPING:
  KIALO_DISCUSSION: "EthikosTopic"
  KIALO_THESIS: "Topic thesis/prompt field; current fallback is EthikosTopic.title + description"
  KIALO_CLAIM: "EthikosArgument"
  KIALO_PRO_CON_EDGE: "EthikosArgument.parent + EthikosArgument.side"
  KIALO_SOURCE: "ArgumentSource"
  KIALO_IMPACT_VOTE: "ArgumentImpactVote"
  KIALO_SUGGESTED_CLAIM: "ArgumentSuggestion"
  KIALO_PERSPECTIVE: "DiscussionPerspective / Smart Vote lens depending context"
  KIALO_PARTICIPANT_ROLE: "DiscussionParticipantRole"

KIALO_VALUES:
  KIALO_EDGE_SIDE_VALUES:
    - "pro"
    - "con"
    - "neutral"
  KIALO_IMPACT_VOTE_RANGE: "0..4"
  KIALO_IMPACT_VOTE_MEANING: "veracity + relevance to parent"
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

CRITICAL_VOTE_RULES:
  CLAIM_IMPACT_VOTE_IS_TOPIC_STANCE: false
  CLAIM_IMPACT_VOTE_IS_SMART_VOTE_BALLOT: false
  ETHIKOS_STANCE_IS_READING: false
  SMART_VOTE_READING_IS_SOURCE_FACT: false
````

---

## 4. Strategic Position

Kialo-style argument mapping is not a new product module.

It is a structured deliberation pattern to be mimicked inside ethiKos.

The target is:

```txt
/ethikos/deliberate/*
```

The owner is:

```txt
Korum
```

The backend app remains:

```txt
konnaxion.ethikos
```

The existing canonical models remain:

```txt
EthikosTopic
EthikosStance
EthikosArgument
EthikosCategory
```

The Kialo-style upgrade extends this foundation. It does not replace it.

---

## 5. Core Rule

The core rule is:

```txt
Kialo-style claims are UX/domain concepts.
EthikosArgument remains the backend model.
```

The implementation MUST NOT rename `EthikosArgument` to `Claim`.

The implementation MAY use the term “claim” in:

* UI labels;
* user-facing explanations;
* documentation;
* payload aliases;
* frontend component names.

But the backend source of truth remains:

```txt
EthikosArgument
```

---

## 6. Current ethiKos Reality

The current ethiKos backend is centered on:

```txt
EthikosCategory
EthikosTopic
EthikosStance
EthikosArgument
```

The current canonical API endpoints are:

```txt
/api/ethikos/topics/
/api/ethikos/stances/
/api/ethikos/arguments/
/api/ethikos/categories/
```

Compatibility aliases may exist under:

```txt
/api/deliberate/...
/api/deliberate/elite/...
```

The current implemented frontend route surface includes:

```txt
/ethikos/deliberate/elite
/ethikos/deliberate/[topic]
/ethikos/deliberate/guidelines
```

The Kialo-style contract MUST build on this existing reality.

---

## 7. Kialo-style Concepts Retained

The following Kialo-style concepts are retained as first-class design references.

| Kialo-style concept  | Meaning for ethiKos                                |
| -------------------- | -------------------------------------------------- |
| Discussion           | Topic-level deliberation container                 |
| Thesis               | Prompt, proposition, or central question           |
| Claim                | Argument node                                      |
| Pro/Con relation     | Parent-child argument relation with side           |
| Source               | Evidence attached to an argument                   |
| Impact vote          | Claim-level impact score, separate from stance     |
| Suggested claim      | Proposed argument requiring review or acceptance   |
| Participant role     | Per-topic permission level                         |
| Anonymous discussion | Participation mode with identity visibility limits |
| Author visibility    | Whether claim authors are visible                  |
| Vote visibility      | Whether claim impact votes are visible             |
| Background info      | Admin-controlled context block                     |
| Discussion topology  | Single-thesis or multi-thesis structure            |
| Minimap              | Navigation aid for large argument trees            |
| Perspective          | Artificial or lens-based viewpoint over claims     |
| Template             | Reusable discussion structure                      |
| Small group mode     | Branching discussion per cohort/group              |
| Export               | Downloadable discussion or source output           |

---

## 8. Canonical Concept Mapping

## 8.1 Discussion

```txt
Kialo Discussion → EthikosTopic
```

An `EthikosTopic` is the canonical ethiKos container for a structured deliberation.

A topic may represent:

* a single-thesis discussion;
* a multi-thesis discussion;
* a consultation prompt;
* a policy question;
* a proposal debate.

First-pass implementation SHOULD treat existing `EthikosTopic.title` and `EthikosTopic.description` as the fallback thesis/prompt source.

Future implementation MAY add explicit fields such as:

```txt
thesis
discussion_topology
background_info
```

Only non-breaking additions are allowed.

---

## 8.2 Thesis

```txt
Kialo Thesis → Topic thesis / prompt / title + description
```

A thesis is the main claim, proposition, or question being debated.

Single-thesis topology:

```txt
One central thesis
→ pro/con argument tree
```

Multi-thesis topology:

```txt
One central question
→ multiple possible thesis answers
→ each thesis has pro/con branches
```

First pass SHOULD support single-thesis behavior first.

Multi-thesis behavior MAY be represented later through topic options, child thesis objects, or a non-breaking topology extension.

---

## 8.3 Claim

```txt
Kialo Claim → EthikosArgument
```

A claim is a structured argument node.

In ethiKos first pass, the claim maps to the existing `EthikosArgument`.

A claim-like argument SHOULD have:

```txt
id
topic
parent
side
content
author
created_at
updated_at
is_hidden
```

Future non-breaking extensions MAY include:

```txt
summary
claim_type
source_count
impact_score
depth
path
is_suggested
accepted_from_suggestion
```

---

## 8.4 Pro/Con Edge

```txt
Kialo Pro/Con edge → EthikosArgument.parent + EthikosArgument.side
```

The argument graph is represented as a parent-child structure.

Allowed side values:

```txt
pro
con
neutral
```

Rules:

* A root argument MAY have no parent.
* A child argument SHOULD indicate whether it supports or opposes its parent.
* `neutral` MAY be used for clarifications, context notes, or unresolved mapping.
* Cycles MUST NOT be allowed.
* Moving arguments MUST preserve audit history.

---

## 8.5 Source

```txt
Kialo Source → ArgumentSource
```

A source is evidence attached to an argument.

A source SHOULD be treated as a distinct object, not embedded only in the argument body.

First-pass `ArgumentSource` SHOULD support:

```txt
id
argument
url
citation_text
quote
note
created_by
created_at
updated_at
is_removed
```

A discussion-level source view SHOULD be possible.

A source MAY be linked to multiple argument nodes only if `ArgumentSource` or future `ArgumentSourceLink` supports that explicitly.

---

## 8.6 Impact Vote

```txt
Kialo Impact Vote → ArgumentImpactVote
```

An impact vote is a claim-level evaluation.

It is not a topic stance.

It is not a Smart Vote ballot.

It is not a consultation vote.

First-pass range:

```txt
0..4
```

Meaning:

```txt
Claim impact = perceived relevance + strength/veracity relative to its parent.
```

The exact UI labels MAY be refined later, but the storage contract MUST remain separate from `EthikosStance`.

---

## 8.7 Suggested Claim

```txt
Kialo Suggested Claim → ArgumentSuggestion
```

A suggested claim is a proposed argument that is not yet part of the canonical argument tree.

Suggested claims are useful for:

* low-trust participation;
* classroom/moderated contexts;
* public proposal intake;
* reducing vandalism;
* allowing “suggester” role participation.

An `ArgumentSuggestion` SHOULD become an `EthikosArgument` only after acceptance.

Rejected suggestions SHOULD remain auditable.

---

## 8.8 Perspective

```txt
Kialo Perspective → DiscussionPerspective or Smart Vote lens, depending context
```

A perspective can mean two different things.

| Context         | Meaning                                   |
| --------------- | ----------------------------------------- |
| Deliberation UX | Artificial or saved viewpoint over claims |
| Smart Vote      | Declared lens for derived readings        |

This distinction MUST be preserved.

First pass MAY defer custom perspectives unless the data model is already stable.

A perspective MUST NOT mutate source arguments.

---

## 8.9 Participant Role

```txt
Kialo Participant Role → DiscussionParticipantRole
```

Participant roles define what a user may do inside a topic-level deliberation.

Allowed roles:

```txt
owner
admin
editor
writer
suggester
viewer
```

Roles are discussion/topic-specific. They do not replace global user roles.

---

## 9. First-Pass Features

The following Kialo-style features are first-pass candidates.

## 9.1 Argument Tree

Status:

```txt
first_pass_candidate
```

Target route:

```txt
/ethikos/deliberate/[topic]
```

Required behavior:

* render arguments as a tree;
* preserve parent-child relations;
* show `pro`, `con`, or `neutral` side;
* allow expanding/collapsing branches;
* distinguish hidden/moderated arguments;
* preserve current argument posting behavior.

Data impact:

```txt
No breaking change required if EthikosArgument.parent + side already exist.
```

---

## 9.2 Source Attachments

Status:

```txt
first_pass_candidate
```

Target route:

```txt
/ethikos/deliberate/[topic]
```

Required behavior:

* attach source URL or citation to an argument;
* optionally store quote/note;
* show sources on argument detail;
* support discussion-level source list;
* support moderation/removal of sources.

Data impact:

```txt
New table candidate: ArgumentSource
```

---

## 9.3 Argument Impact Vote

Status:

```txt
first_pass_candidate
```

Target route:

```txt
/ethikos/deliberate/[topic]
```

Required behavior:

* let eligible users rate impact of an argument/claim;
* store impact votes separately from topic stances;
* aggregate impact by argument;
* never count impact vote as topic stance;
* never count impact vote as Smart Vote ballot.

Data impact:

```txt
New table candidate: ArgumentImpactVote
```

---

## 9.4 Suggested Claims

Status:

```txt
first_pass_candidate
```

Target routes:

```txt
/ethikos/deliberate/[topic]
/ethikos/admin/moderation
```

Required behavior:

* allow users with `suggester` role to submit suggested claims;
* route suggestions to moderation/approval queue;
* allow admin/editor to accept, reject, or request revision;
* accepted suggestions become canonical `EthikosArgument` records;
* rejected suggestions remain auditable.

Data impact:

```txt
New table candidate: ArgumentSuggestion
```

---

## 9.5 Participant Roles

Status:

```txt
first_pass_candidate
```

Target routes:

```txt
/ethikos/deliberate/[topic]
/ethikos/admin/roles
```

Required behavior:

* support topic-specific roles;
* roles must not replace global auth;
* admin UI may manage participants;
* role decisions should be auditable.

Data impact:

```txt
New table candidate: DiscussionParticipantRole
```

---

## 9.6 Visibility Settings

Status:

```txt
first_pass_candidate
```

Target routes:

```txt
/ethikos/deliberate/[topic]
/ethikos/admin/roles
```

Required behavior:

* configure author visibility;
* configure impact vote visibility;
* configure participation mode;
* preserve privacy rules.

Data impact:

```txt
New table candidate: DiscussionVisibilitySetting
```

---

## 9.7 Background Info

Status:

```txt
first_pass_candidate
```

Target route:

```txt
/ethikos/deliberate/[topic]
```

Required behavior:

* show topic context separate from argument nodes;
* allow admin/moderator editing;
* do not mix background info into the argument tree;
* preserve prompt/context as orientation material.

Data impact:

```txt
Possible non-breaking field on EthikosTopic or separate TopicContext object.
```

---

## 10. Deferred Features

The following Kialo-style features are deferred unless later approved.

| Feature                        | Status            | Reason                                             |
| ------------------------------ | ----------------- | -------------------------------------------------- |
| Sunburst minimap               | Deferred          | Nice UX, not required for first-pass correctness   |
| Small group mode               | Deferred          | Requires cohort/group branching                    |
| Clone-from-template            | Optional/deferred | Useful, but depends on stable templates            |
| Discussion export              | Optional/deferred | Useful after sources and graph contracts stabilize |
| Custom perspectives            | Deferred          | Must avoid confusion with Smart Vote lenses        |
| Claim extraction               | Deferred          | Requires cross-topic graph operations              |
| Cross-discussion claim linking | Deferred          | Requires careful provenance and cycle rules        |
| Contact lists                  | Deferred          | Belongs to broader participant management          |
| Instant access discussions     | Deferred          | Requires access-policy review                      |
| Discussion chat                | Deferred          | Separate from argument graph                       |
| Branch-seen tracking           | Deferred          | Useful for UX, not first-pass architecture         |
| Notifications                  | Deferred          | Requires event/notification contract               |

---

## 11. Explicitly Forbidden First-Pass Behaviors

The following are forbidden:

```txt
Create konnaxion.kialo.
Create /kialo routes.
Import Kialo code.
Rename EthikosArgument to Claim.
Replace EthikosStance with ArgumentImpactVote.
Treat ArgumentImpactVote as Smart Vote ballot.
Treat Kialo perspectives as Smart Vote readings by default.
Expose anonymous identities to normal participants.
Allow suggested claims to publish without approval when role = suggester.
Allow external Kialo data to write directly into EthikosArgument.
Create a second deliberation shell.
Bypass /api/ethikos/* contracts.
```

---

## 12. Role and Permission Contract

## 12.1 Role Hierarchy

Allowed roles:

```txt
viewer
suggester
writer
editor
admin
owner
```

Higher roles inherit lower-role capabilities unless explicitly restricted.

## 12.2 Capabilities Matrix

| Capability                      | Viewer | Suggester | Writer | Editor | Admin | Owner |
| ------------------------------- | -----: | --------: | -----: | -----: | ----: | ----: |
| View discussion                 |    yes |       yes |    yes |    yes |   yes |   yes |
| View visible sources            |    yes |       yes |    yes |    yes |   yes |   yes |
| Submit suggested claim          |     no |       yes |    yes |    yes |   yes |   yes |
| Create canonical claim/argument |     no |        no |    yes |    yes |   yes |   yes |
| Edit own claim                  |     no |        no |    yes |    yes |   yes |   yes |
| Edit others’ claims             |     no |        no |     no |    yes |   yes |   yes |
| Attach source to own claim      |     no |        no |    yes |    yes |   yes |   yes |
| Edit/remove others’ sources     |     no |        no |     no |    yes |   yes |   yes |
| Accept/reject suggestions       |     no |        no |     no |    yes |   yes |   yes |
| Hide/moderate claims            |     no |        no |     no |     no |   yes |   yes |
| Manage roles                    |     no |        no |     no |     no |   yes |   yes |
| Transfer ownership              |     no |        no |     no |     no |    no |   yes |
| Change visibility settings      |     no |        no |     no |     no |   yes |   yes |
| Delete/archive discussion       |     no |        no |     no |     no |    no |   yes |

This matrix is the documentation default. Final implementation MAY adjust details in `15_BACKEND_ALIGNMENT_CONTRACT.md`, but must preserve the overall hierarchy.

---

## 13. Visibility Contract

## 13.1 Author Visibility

Allowed values:

```txt
never
admins_only
all
```

Meaning:

| Value         | Meaning                                                                    |
| ------------- | -------------------------------------------------------------------------- |
| `never`       | Claim authors are hidden from all participants except system/audit context |
| `admins_only` | Claim authors are visible only to admin/owner roles                        |
| `all`         | Claim authors are visible to all participants                              |

Audit logs MUST retain real authorship even when UI hides authors.

## 13.2 Vote Visibility

Allowed values:

```txt
all
admins_only
self_only
```

Meaning:

| Value         | Meaning                                                                       |
| ------------- | ----------------------------------------------------------------------------- |
| `all`         | Aggregated and/or individual impact votes may be shown according to UI policy |
| `admins_only` | Impact vote details are visible only to admin/owner roles                     |
| `self_only`   | A user sees only their own impact vote; aggregate may be hidden               |

Vote visibility applies to `ArgumentImpactVote`, not `EthikosStance`.

## 13.3 Participation Mode

Allowed values:

```txt
standard
anonymous
```

Meaning:

| Value       | Meaning                                                               |
| ----------- | --------------------------------------------------------------------- |
| `standard`  | Normal author display rules apply                                     |
| `anonymous` | Author identity is hidden according to discussion visibility settings |

Anonymous participation MUST NOT erase audit identity.

---

## 14. Voting Contract

The Kialo-style impact vote is distinct from all other ethiKos voting concepts.

## 14.1 EthikosStance

```yaml
MODEL: "EthikosStance"
RANGE: "-3..+3"
LEVEL: "topic-level"
OWNER: "Korum"
MEANING: "User stance on topic."
```

## 14.2 ArgumentImpactVote

```yaml
MODEL: "ArgumentImpactVote"
RANGE: "0..4"
LEVEL: "argument/claim-level"
OWNER: "Korum"
MEANING: "Impact of a claim on its parent; combines relevance and strength/veracity."
```

## 14.3 Smart Vote Reading

```yaml
MODEL: "ReadingResult"
RANGE: "not fixed"
LEVEL: "derived aggregation"
OWNER: "Smart Vote"
MEANING: "Declared reading of baseline events."
```

## 14.4 Forbidden Conflations

```txt
ArgumentImpactVote MUST NOT be stored as EthikosStance.
ArgumentImpactVote MUST NOT be posted to /api/kollective/votes/.
ArgumentImpactVote MUST NOT determine baseline topic outcome.
Smart Vote MUST NOT treat impact votes as ballots unless a future explicit lens says so.
EthikosStance MUST NOT be displayed as claim impact.
```

---

## 15. Discussion Topology Contract

Supported topology values:

```txt
single_thesis
multi_thesis
```

## 15.1 Single Thesis

Single-thesis discussions have one central proposition.

Structure:

```txt
EthikosTopic
└── Thesis / prompt
    ├── pro argument branch
    └── con argument branch
```

First pass SHOULD target this topology.

## 15.2 Multi Thesis

Multi-thesis discussions have one central question and multiple possible thesis answers.

Structure:

```txt
EthikosTopic
└── central question
    ├── thesis option A
    │   ├── pro branch
    │   └── con branch
    ├── thesis option B
    │   ├── pro branch
    │   └── con branch
    └── thesis option C
        ├── pro branch
        └── con branch
```

Multi-thesis support is deferred unless the data model explicitly supports it.

---

## 16. Source and Evidence Contract

Sources are first-class evidence objects.

A source MUST be attached to an argument, not only pasted into text.

## 16.1 `ArgumentSource`

Recommended fields:

```yaml
ArgumentSource:
  id: integer
  argument: FK(EthikosArgument)
  url: string | null
  citation_text: text | null
  quote: text | null
  note: text | null
  created_by: FK(User)
  created_at: datetime
  updated_at: datetime
  is_removed: boolean
  removed_by: FK(User) | null
  removed_at: datetime | null
```

## 16.2 Source Rules

* Sources SHOULD be editable separately from argument text.
* Sources SHOULD be visible on the argument node or detail panel.
* A discussion-level source list SHOULD be available.
* Source removal SHOULD be soft-delete or audit-preserving.
* Sources SHOULD be exportable later.
* Source quality scoring is not first pass unless separately approved.

---

## 17. Suggested Claim Contract

Suggested claims are proposed argument nodes pending review.

## 17.1 `ArgumentSuggestion`

Recommended fields:

```yaml
ArgumentSuggestion:
  id: integer
  topic: FK(EthikosTopic)
  parent: FK(EthikosArgument) | null
  side: "pro | con | neutral"
  content: text
  source_payload: json | null
  suggested_by: FK(User)
  status: "pending | accepted | rejected | revision_requested"
  reviewed_by: FK(User) | null
  reviewed_at: datetime | null
  accepted_argument: FK(EthikosArgument) | null
  created_at: datetime
  updated_at: datetime
```

## 17.2 Suggestion Rules

* `suggester` role may submit suggestions.
* Suggestions are not canonical arguments until accepted.
* Accepted suggestions MUST create or link to an `EthikosArgument`.
* Rejected suggestions MUST remain auditable.
* Revision requests SHOULD preserve prior content.

---

## 18. Participant Role Contract

## 18.1 `DiscussionParticipantRole`

Recommended fields:

```yaml
DiscussionParticipantRole:
  id: integer
  topic: FK(EthikosTopic)
  user: FK(User)
  role: "owner | admin | editor | writer | suggester | viewer"
  assigned_by: FK(User) | null
  assigned_at: datetime
  revoked_at: datetime | null
  is_active: boolean
```

## 18.2 Role Rules

* Roles are scoped to a topic/discussion.
* Global staff status MAY override local permissions for administrative safety.
* Role changes MUST be auditable.
* There SHOULD be exactly one owner unless ownership transfer rules define otherwise.
* Users without explicit role MAY receive default role based on topic visibility.

---

## 19. Discussion Visibility Contract

## 19.1 `DiscussionVisibilitySetting`

Recommended fields:

```yaml
DiscussionVisibilitySetting:
  id: integer
  topic: FK(EthikosTopic)
  participation_type: "standard | anonymous"
  author_visibility: "never | admins_only | all"
  vote_visibility: "all | admins_only | self_only"
  topology: "single_thesis | multi_thesis"
  link_sharing_enabled: boolean
  invite_required: boolean
  created_at: datetime
  updated_at: datetime
```

## 19.2 Visibility Rules

* Anonymous mode changes UI visibility, not audit identity.
* Author visibility and vote visibility are separate settings.
* Link sharing is not equivalent to public visibility.
* Invite-required discussions need explicit participant onboarding.
* Visibility changes SHOULD be recorded in audit logs.

---

## 20. Frontend Contract

Kialo-style UI lives under:

```txt
/ethikos/deliberate/*
```

It MUST use the existing ethiKos shell and page conventions.

Required or candidate components:

```txt
ArgumentTreeView
ArgumentNodeCard
ArgumentNodeDetailPanel
ArgumentSourcesPanel
ArgumentImpactVoteControl
SuggestedClaimsPanel
DiscussionSettingsPanel
ParticipantRoleSettings
AnonymousModeBanner
BackgroundInfoPanel
```

Optional/deferred components:

```txt
ArgumentMinimap
SunburstMap
GuidedVotingDrawer
PerspectiveSelector
DiscussionExportPanel
TemplateCloneDialog
SmallGroupModePanel
```

Frontend rules:

* Do not create a Kialo module.
* Do not create a Kialo route family.
* Do not create a second shell.
* Do not bypass `EthikosPageShell`.
* Do not bypass the services layer.
* Do not treat UI “claim” labels as backend model names.

---

## 21. Backend Contract

Kialo-style features extend:

```txt
konnaxion.ethikos
```

They do not create:

```txt
konnaxion.kialo
```

Current core endpoints remain canonical:

```txt
/api/ethikos/topics/
/api/ethikos/stances/
/api/ethikos/arguments/
/api/ethikos/categories/
```

New endpoints MAY be added under the same prefix, such as:

```txt
/api/ethikos/argument-sources/
/api/ethikos/argument-impact-votes/
/api/ethikos/argument-suggestions/
/api/ethikos/discussion-roles/
/api/ethikos/discussion-settings/
```

Exact endpoint names MUST be finalized in `07_API_AND_SERVICE_CONTRACTS.md`.

Backend rules:

* Use Django REST Framework.
* Use serializers and ViewSets.
* Register with the existing router pattern.
* Preserve `AUTH_USER_MODEL = "users.User"`.
* Preserve current models.
* Add non-breaking models only.
* Add migrations explicitly.
* Add tests for all new write paths.

---

## 22. Payload Contract

Exact payloads are defined in `13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md`.

This document reserves the following payload names.

```txt
ArgumentTreePayload
ArgumentNodePayload
ArgumentSourcePayload
ArgumentImpactVotePayload
ArgumentSuggestionPayload
DiscussionSettingsPayload
ParticipantRolePayload
BackgroundInfoPayload
```

## 22.1 `ArgumentNodePayload`

Candidate shape:

```yaml
ArgumentNodePayload:
  id: string
  topic_id: string
  parent_id: string | null
  side: "pro | con | neutral"
  content: string
  author_display: string | null
  author_visibility: "never | admins_only | all"
  created_at: string
  updated_at: string
  depth: integer
  children_count: integer
  source_count: integer
  impact_summary:
    average: number | null
    count: integer
    viewer_vote: integer | null
  moderation:
    is_hidden: boolean
    hidden_reason: string | null
```

## 22.2 `ArgumentSourcePayload`

Candidate shape:

```yaml
ArgumentSourcePayload:
  id: string
  argument_id: string
  url: string | null
  citation_text: string | null
  quote: string | null
  note: string | null
  created_by_display: string | null
  created_at: string
  is_removed: boolean
```

## 22.3 `ArgumentImpactVotePayload`

Candidate shape:

```yaml
ArgumentImpactVotePayload:
  id: string
  argument_id: string
  value: integer
  value_range: "0..4"
  created_at: string
  updated_at: string
```

## 22.4 `ArgumentSuggestionPayload`

Candidate shape:

```yaml
ArgumentSuggestionPayload:
  id: string
  topic_id: string
  parent_id: string | null
  side: "pro | con | neutral"
  content: string
  suggested_by_display: string | null
  status: "pending | accepted | rejected | revision_requested"
  reviewed_by_display: string | null
  reviewed_at: string | null
  accepted_argument_id: string | null
  created_at: string
```

---

## 23. Admin and Moderation Contract

Kialo-style moderation belongs to:

```txt
/ethikos/admin/moderation
/ethikos/admin/audit
/ethikos/admin/roles
```

Admin surfaces SHOULD support:

* reviewing suggested claims;
* hiding/unhiding arguments;
* editing/removing improper sources;
* assigning participant roles;
* changing visibility settings;
* reviewing audit trails;
* detecting abuse in anonymous mode.

Moderation actions MUST be auditable.

Anonymous mode MUST NOT prevent admin investigation.

---

## 24. Audit Contract

The following events SHOULD be recorded when implemented:

```txt
ArgumentSourceAttached
ArgumentSourceEdited
ArgumentSourceRemoved
ArgumentImpactVoteRecorded
ArgumentSuggestionSubmitted
ArgumentSuggestionAccepted
ArgumentSuggestionRejected
ArgumentSuggestionRevisionRequested
DiscussionRoleAssigned
DiscussionRoleRevoked
DiscussionVisibilityChanged
DiscussionBackgroundInfoChanged
ArgumentMoved
ArgumentHidden
ArgumentUnhidden
```

Audit events SHOULD include:

```yaml
AuditEvent:
  actor: User | service
  action: string
  target_type: string
  target_id: string
  topic_id: string
  before: json | null
  after: json | null
  created_at: datetime
```

---

## 25. Relationship to Smart Vote and EkoH

Kialo-style features live primarily in Korum.

They may later inform Smart Vote readings, but they do not replace Smart Vote.

Rules:

```txt
ArgumentImpactVote is not a Smart Vote ballot.
ArgumentSource is not an EkoH credential.
DiscussionPerspective is not automatically a Smart Vote lens.
Author visibility is not EkoH trust.
Participant role is not global user permission.
```

Possible future Smart Vote integrations:

* argument-quality lens;
* evidence-density lens;
* expert-perspective lens;
* deliberation-depth lens;
* source-supported-claim lens.

These are future derived readings and MUST be declared as lenses before use.

---

## 26. Relationship to Korum

Kialo-style argument mapping is the main UX and data-pattern reference for Korum.

Korum owns:

```txt
EthikosTopic
EthikosStance
EthikosArgument
ArgumentSource
ArgumentImpactVote
ArgumentSuggestion
DiscussionParticipantRole
DiscussionVisibilitySetting
```

Korum does not own:

```txt
Smart Vote readings
EkoH snapshots
Konsultations ballots
Impact tracking
Draft final publication
```

---

## 27. Relationship to Konsultations

Kialo-style deliberation may support Konsultations by clarifying arguments before decision.

However:

* consultation ballots are not claim impact votes;
* result snapshots are not argument trees;
* impact tracking is not Kialo-style deliberation;
* citizen suggestions for consultation may be related to `ArgumentSuggestion`, but they are not automatically the same object.

If Konsultations uses Kialo-style suggestions, the relationship MUST be explicitly modeled.

---

## 28. Non-Goals

This contract does not authorize:

* importing Kialo code;
* cloning Kialo UI exactly;
* creating a Kialo backend app;
* creating `/kialo/*`;
* replacing `EthikosArgument`;
* replacing `EthikosStance`;
* making claim impact votes determine final decisions;
* implementing small group mode immediately;
* implementing custom perspectives immediately;
* implementing discussion export immediately;
* implementing sunburst minimap immediately;
* implementing cross-discussion claim linking immediately;
* implementing Kialo-specific auth;
* implementing Kialo-specific contact lists;
* bypassing ethiKos moderation and audit.

---

## 29. First-Pass Acceptance Criteria

The Kialo-style first pass is successful when:

1. `/ethikos/deliberate/[topic]` can represent arguments as a structured tree.
2. Parent-child pro/con relations are visible.
3. Existing `EthikosArgument` remains the canonical backend model.
4. Topic-level stance remains `EthikosStance` with range `-3..+3`.
5. Claim-level impact vote is modeled separately with range `0..4`.
6. Sources can be attached to arguments as separate evidence objects.
7. Suggested claims can be submitted without becoming canonical immediately.
8. Participant roles are topic-specific.
9. Author visibility and vote visibility are explicit.
10. Anonymous mode hides UI identity but preserves audit identity.
11. No Kialo code is imported.
12. No new Kialo route or backend app is created.

---

## 30. Anti-Drift Rules

These rules are binding.

```txt
Do not rename EthikosArgument to Claim.
Do not create konnaxion.kialo.
Do not create /kialo routes.
Do not import Kialo code.
Do not treat Kialo impact votes as topic stances.
Do not treat Kialo impact votes as Smart Vote ballots.
Do not treat Kialo perspectives as Smart Vote readings unless explicitly declared as lenses.
Do not expose anonymous identities to normal participants.
Do not publish suggested claims without approval when role = suggester.
Do not store sources only as inline text.
Do not bypass /api/ethikos/*.
Do not create a second deliberation shell.
Do not make Kialo the product name of the feature.
```

---

## 31. Related Docs

| File                                            | Relationship                                          |
| ----------------------------------------------- | ----------------------------------------------------- |
| `00_KINTSUGI_START_HERE.md`                     | Pack entry point and baseline                         |
| `01_ETHIKOS_KINTSUGI_EXECUTION_STRATEGY.md`     | Strategy that defines Kialo-style as first-pass mimic |
| `02_SOURCE_OF_TRUTH_AND_DRIFT_CONTROL.md`       | Source priority and conflict resolution               |
| `03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md`      | Korum/Konsultations/Smart Vote/EkoH boundaries        |
| `04_CANONICAL_NAMING_AND_VARIABLES.md`          | Fixed naming and variables                            |
| `06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md`     | Route-level placement under `/ethikos/deliberate/*`   |
| `07_API_AND_SERVICE_CONTRACTS.md`               | Endpoint and service contracts                        |
| `08_DATA_MODEL_AND_MIGRATION_PLAN.md`           | New model candidates and migrations                   |
| `09_SMART_VOTE_EKOH_READING_CONTRACT.md`        | Prevents vote/reading confusion                       |
| `10_FIRST_PASS_INTEGRATION_MATRIX.md`           | Places Kialo-style in first-pass mimic scope          |
| `11_MIMIC_VS_ANNEX_RULEBOOK.md`                 | Confirms native mimic strategy                        |
| `12_CANONICAL_OBJECTS_AND_EVENTS.md`            | Canonical objects/events for argument mapping         |
| `13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md` | Final JSON shape definitions                          |
| `14_FRONTEND_ALIGNMENT_CONTRACT.md`             | Frontend shell/component rules                        |
| `15_BACKEND_ALIGNMENT_CONTRACT.md`              | Django/DRF backend rules                              |
| `16_TEST_AND_SMOKE_CONTRACT.md`                 | Test expectations                                     |
| `18_ADR_REGISTER.md`                            | Records no separate Kialo module decision             |
| `20_AI_GENERATION_GUARDRAILS.md`                | AI anti-drift rules                                   |
| `22_IMPLEMENTATION_BACKLOG_TEMPLATE.md`         | Future task format                                    |

---

## 32. Final Contract

The final Kialo-style contract is:

```txt
Use Kialo as the structured deliberation reference.
Mimic the pattern natively.
Keep everything under /ethikos/deliberate/*.
Keep backend ownership inside konnaxion.ethikos.
Map Discussion to EthikosTopic.
Map Claim to EthikosArgument.
Map Pro/Con relation to parent + side.
Add sources, impact votes, suggestions, roles, and visibility as non-breaking extensions.
Never confuse claim impact with topic stance.
Never create a Kialo module.
Never import Kialo code.
```


Source basis: the Kialo core corpus for discussion topology, roles, sources, voting, anonymity, perspectives, navigation, and participant management; plus the current ethiKos route/API/model reality in the Konnaxion technical references and snapshot. :contentReference[oaicite:0]{index=0} :contentReference[oaicite:1]{index=1} :contentReference[oaicite:2]{index=2} :contentReference[oaicite:3]{index=3} :contentReference[oaicite:4]{index=4} :contentReference[oaicite:5]{index=5}
