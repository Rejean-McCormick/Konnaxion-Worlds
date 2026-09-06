# 20 — AI Generation Guardrails

**File:** `20_AI_GENERATION_GUARDRAILS.md`  
**Pack:** ethiKos Kintsugi Update Documentation Pack  
**Canonical path:** `docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/`  
**Version:** `2026-04-25-kintsugi-doc-pack-v1`  
**Status:** Canonical AI-generation constraint document  
**Module:** `ethiKos`  
**Platform:** `Konnaxion`

---

## 1. Purpose

This document defines mandatory guardrails for any AI system generating documentation, code plans, implementation tickets, refactors, migrations, tests, or architectural analysis for the **ethiKos Kintsugi Upgrade**.

Its purpose is to prevent:

- route drift;
- naming drift;
- model drift;
- endpoint drift;
- ownership drift;
- OSS integration drift;
- Smart Vote / EkoH semantic drift;
- Kialo-style deliberation drift;
- accidental full rewrite proposals;
- premature implementation backlog generation;
- contradictory documents created in parallel AI conversations.

This document is especially important because the Kintsugi documentation pack may be generated across multiple parallel AI conversations. Every AI session MUST obey this file and the canonical variables defined in `00_KINTSUGI_START_HERE.md`.

---

## 2. Scope

This document applies to all AI-generated work related to the ethiKos Kintsugi Upgrade, including:

- Kintsugi documentation files;
- route plans;
- API plans;
- data model plans;
- migration plans;
- frontend plans;
- backend plans;
- ADRs;
- OSS code-reading plans;
- implementation backlog templates;
- future implementation tickets;
- code-generation prompts;
- refactor prompts;
- test-generation prompts;
- bugfix prompts that touch Kintsugi-adjacent areas.

This document applies whether the AI session is generating one file, several files, code patches, review comments, or implementation steps.

---

## 3. Canonical variables used

```yaml id="3jqbmr"
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
````

```yaml id="n6b9yq"
PRIMARY_ROUTE_SURFACE: "/ethikos/*"

ETHIKOS_ROUTE_FAMILIES:
  DECIDE: "/ethikos/decide/*"
  DELIBERATE: "/ethikos/deliberate/*"
  TRUST: "/ethikos/trust/*"
  PULSE: "/ethikos/pulse/*"
  IMPACT: "/ethikos/impact/*"
  LEARN: "/ethikos/learn/*"
  INSIGHTS: "/ethikos/insights"
  ADMIN: "/ethikos/admin/*"
```

```yaml id="kppdy5"
CURRENT_ETHIKOS_MODELS:
  - "EthikosCategory"
  - "EthikosTopic"
  - "EthikosStance"
  - "EthikosArgument"

CURRENT_ENDPOINTS_CANONICAL:
  ETHIKOS_TOPICS: "/api/ethikos/topics/"
  ETHIKOS_STANCES: "/api/ethikos/stances/"
  ETHIKOS_ARGUMENTS: "/api/ethikos/arguments/"
  ETHIKOS_CATEGORIES: "/api/ethikos/categories/"
  KOLLECTIVE_VOTES: "/api/kollective/votes/"
```

```yaml id="c1wtyr"
OWNERSHIP:
  KORUM_OWNS:
    - "Topics"
    - "Arguments"
    - "Threaded argument graph"
    - "Topic-level stance events"
    - "Debate moderation"

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
    - "Snapshots"
```

```yaml id="ou9a60"
KIALO:
  STRATEGY: "native_mimic"
  ROUTE_SCOPE: "/ethikos/deliberate/*"
  BACKEND_SCOPE: "konnaxion.ethikos"
  CREATE_KIALO_BACKEND_APP: false
  CREATE_KIALO_FRONTEND_ROUTE: false
  IMPORT_KIALO_CODE: false
```

---

## 4. Source-of-truth priority order

When an AI session sees conflicting information, it MUST use this priority order.

```yaml id="b4rz8b"
SOURCE_PRIORITY_ORDER:
  1_CODE_SNAPSHOT_REALITY:
    description: "Routes, files, current endpoints, current models, current implementation state."

  2_BOUNDARIES_DOC:
    description: "Korum/Konsultations/Smart Vote/EkoH ownership, write rules, pipeline."

  3_CLEAN_SLATE_PLAN:
    description: "First-pass scope, no full merge, docs first, code inspection second."

  4_KIALO_CORE_DOCS:
    description: "Structured deliberation contract for /ethikos/deliberate/*."

  5_OSS_SOURCE_DOCS:
    description: "Pattern inspiration only; never direct merge in first pass."

  6_PRIOR_MASTER_DOCS:
    description: "Use only after correcting scope and route reality."
```

Rules:

* If code snapshot reality conflicts with an older conceptual doc, code snapshot reality wins for current implementation.
* If ownership boundaries conflict with an OSS pattern, ownership boundaries win.
* If an OSS pattern conflicts with ethiKos architecture, mimic the useful pattern only.
* If a generated document conflicts with this guardrail file, this guardrail file wins unless a later ADR explicitly supersedes it.
* If an AI session is unsure whether something is implemented, it MUST mark it as “requires code inspection” rather than inventing an answer.

---

## 5. Generation mode

AI-generated Kintsugi work MUST follow these generation rules.

```yaml id="96khjh"
GENERATION_MODE:
  DOCS_BEFORE_CODE: true
  GENERATE_ONE_FILE_PER_CONVERSATION: true
  EACH_CONVERSATION_MUST_OBEY_CANONICAL_VARIABLES: true
  DO_NOT_REINTERPRET_SCOPE: true
  DO_NOT_CREATE_NEW_ARCHITECTURE_UNLESS_DOC_EXPLICITLY_ASSIGNED: true
  IF_CONFLICT_USE_SOURCE_PRIORITY_ORDER: true
```

For parallel documentation generation:

* one conversation SHOULD generate exactly one document;
* each conversation MUST receive or reference the same canonical variable block;
* each generated document MUST include its own purpose, scope, variables, non-goals, anti-drift rules, and related docs;
* each generated document MUST avoid redefining global constants unless that is its assigned purpose.

---

## 6. Required output style

AI-generated documentation SHOULD use:

```yaml id="uicrtr"
OUTPUT_STYLE:
  LANGUAGE: "English technical documentation unless user explicitly asks French."
  FORMAT: "Markdown"
  TONE: "Precise, normative, implementation-aligned."
  NORMATIVE_TERMS_ALLOWED:
    - "MUST"
    - "MUST NOT"
    - "SHOULD"
    - "MAY"
```

Each document SHOULD include:

```text id="83qp4r"
1. Purpose
2. Scope
3. Canonical variables used
4. Source-of-truth references
5. Non-goals
6. Main contract or content
7. Anti-drift rules
8. Related documents
```

The AI MUST NOT use casual speculation such as:

* “maybe we can just add...”
* “it would be cool to...”
* “let’s merge...”
* “we can replace the architecture with...”
* “I assume the endpoint is...”

If uncertain, the AI MUST write:

```text id="08bxwp"
Requires code inspection before implementation.
```

---

## 7. Absolute forbidden outputs

The following outputs are forbidden across the Kintsugi documentation pack and all related AI work.

```yaml id="6wqdaa"
FORBIDDEN:
  - "Do not propose full external OSS merge."
  - "Do not create a new Kialo app."
  - "Do not create a new top-level Kintsugi frontend app."
  - "Do not rename EthikosArgument to Claim."
  - "Do not rename /api/ethikos/... to /api/deliberation/..."
  - "Do not convert EkoH into a voting engine."
  - "Do not let Smart Vote mutate upstream facts."
  - "Do not let foreign tools write to Korum/Konsultations core tables."
  - "Do not treat Kialo impact votes as Ethikos stances."
  - "Do not treat Kialo impact votes as Smart Vote ballots."
  - "Do not expand /api/home/*."
  - "Do not create a second layout shell."
  - "Do not create a second theme system."
  - "Do not produce implementation tasks before documentation contracts unless generating doc 22."
```

These forbidden outputs are binding.

---

## 8. Route guardrails

The current primary route surface is:

```yaml id="n77mbx"
PRIMARY_ROUTE_SURFACE: "/ethikos/*"
```

Allowed ethiKos route families:

```yaml id="vwtjz8"
ALLOWED_ETHIKOS_ROUTE_FAMILIES:
  - "/ethikos/decide/*"
  - "/ethikos/deliberate/*"
  - "/ethikos/trust/*"
  - "/ethikos/pulse/*"
  - "/ethikos/impact/*"
  - "/ethikos/learn/*"
  - "/ethikos/insights"
  - "/ethikos/admin/*"
```

AI MUST NOT invent new route families such as:

```yaml id="wv7srh"
FORBIDDEN_ROUTE_FAMILIES:
  - "/kialo/*"
  - "/kintsugi/*"
  - "/ethikos/kialo/*"
  - "/ethikos/kintsugi/*"
  - "/platforms/konnaxion/ethikos/*"
  - "/consult/*"
  - "/debate/*"
  - "/deliberation/*"
```

Exception:

* A document MAY mention older conceptual routes as historical or public-facing references.
* A document MUST NOT make them implementation targets unless a later route-plan ADR explicitly approves them.

If a new route is proposed, it MUST be classified as:

```yaml id="qba72z"
NEW_ROUTE_STATUS:
  - "concept_only"
  - "requires_route_plan"
  - "requires_ADR"
  - "not_first_pass"
```

---

## 9. Endpoint guardrails

Canonical API endpoints are:

```yaml id="pivemn"
CURRENT_ENDPOINTS_CANONICAL:
  ETHIKOS_TOPICS: "/api/ethikos/topics/"
  ETHIKOS_STANCES: "/api/ethikos/stances/"
  ETHIKOS_ARGUMENTS: "/api/ethikos/arguments/"
  ETHIKOS_CATEGORIES: "/api/ethikos/categories/"
  KOLLECTIVE_VOTES: "/api/kollective/votes/"
```

Compatibility endpoints:

```yaml id="w90t43"
CURRENT_ENDPOINTS_COMPATIBILITY:
  DELIBERATE_ALIAS: "/api/deliberate/..."
  DELIBERATE_ELITE_ALIAS: "/api/deliberate/elite/..."
```

Legacy/problematic endpoints:

```yaml id="rgfuto"
LEGACY_OR_PROBLEMATIC_ENDPOINTS:
  API_HOME_PREFIX: "/api/home/*"
  RULE: "Do not expand /api/home/* usage. Replace, isolate, or mark legacy."
```

AI MUST NOT invent or promote endpoints such as:

```yaml id="ltrz3r"
FORBIDDEN_OR_UNAPPROVED_ENDPOINTS:
  - "/api/deliberation/*"
  - "/api/kialo/*"
  - "/api/kintsugi/*"
  - "/api/citizenos/*"
  - "/api/loomio/*"
  - "/api/decidim/*"
  - "/api/consul/*"
  - "/api/democracyos/*"
```

If a future endpoint is needed, it MUST be defined in:

```text id="b0zqwz"
07_API_AND_SERVICE_CONTRACTS.md
13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md
15_BACKEND_ALIGNMENT_CONTRACT.md
18_ADR_REGISTER.md
```

---

## 10. Model guardrails

Current ethiKos models are:

```yaml id="jt7tv3"
CURRENT_ETHIKOS_MODELS:
  - "EthikosCategory"
  - "EthikosTopic"
  - "EthikosStance"
  - "EthikosArgument"
```

AI MUST preserve these rules:

```yaml id="bfh5a3"
MODEL_RULES:
  BREAK_EXISTING_MODELS: false
  RENAME_EXISTING_MODELS: false
  DELETE_EXISTING_FIELDS: false
  ADD_NON_BREAKING_TABLES_ALLOWED: true
  ADD_NON_BREAKING_FIELDS_ALLOWED: true
  MIGRATIONS_REQUIRED_FOR_NEW_MODELS: true
  FUTURE_MAKEMIGRATIONS_DRIFT_MUST_BE_AVOIDED: true
```

Forbidden model changes:

```yaml id="9x35n1"
FORBIDDEN_MODEL_CHANGES:
  - "Do not rename EthikosArgument to Claim."
  - "Do not rename EthikosTopic to Discussion."
  - "Do not rename EthikosStance to Vote."
  - "Do not remove EthikosArgument.parent."
  - "Do not remove EthikosArgument.side."
  - "Do not replace EthikosStance with Smart Vote."
  - "Do not store drafting version history directly inside EthikosArgument."
  - "Do not store Smart Vote readings directly as source facts on Korum records."
```

Allowed model planning:

```yaml id="fv3d0s"
ALLOWED_MODEL_PLANNING:
  - "Add non-breaking support tables."
  - "Add non-breaking fields after migration review."
  - "Create derived-artifact tables for readings."
  - "Create drafting tables separate from arguments."
  - "Create Kialo-style support tables inside konnaxion.ethikos."
  - "Create annex boundary tables only as ExternalArtifact and ProjectionMapping."
```

---

## 11. Ownership guardrails

Ownership MUST remain stable.

```yaml id="rzweg3"
OWNERSHIP_GUARDRAILS:
  KORUM:
    MUST_OWN:
      - "Topics used for deliberation"
      - "Arguments"
      - "Argument graph"
      - "Topic-level stance events"
      - "Debate moderation"

  KONSULTATIONS:
    MUST_OWN:
      - "Intake"
      - "Consultation ballots"
      - "Citizen suggestions"
      - "Result snapshots"
      - "Impact tracking"

  SMART_VOTE:
    MUST_OWN:
      - "Readings"
      - "Lens declarations"
      - "Aggregations"
      - "Published result interpretations"

  EKOH:
    MUST_OWN:
      - "Expertise context"
      - "Ethics context"
      - "Cohort eligibility"
      - "Snapshot context"
```

AI MUST NOT:

* assign impact truth to KeenKonnect;
* assign source facts to Smart Vote;
* assign vote mutation to EkoH;
* assign Korum arguments to an external tool;
* assign Konsultations ballots to an external tool;
* merge Korum and Konsultations ownership without an ADR.

---

## 12. Smart Vote and EkoH guardrails

Smart Vote is a reading and aggregation layer.
EkoH is an expertise, ethics, cohort, and snapshot context layer.

They MUST NOT be collapsed.

```yaml id="1aoh2g"
SMART_VOTE_EKOH_RULES:
  SMART_VOTE_MUTATES_KORUM_RECORDS: false
  SMART_VOTE_MUTATES_KONSULTATIONS_RECORDS: false
  SMART_VOTE_WRITES_ONLY_DERIVED_ARTIFACTS: true
  EKOH_IS_VOTING_ENGINE: false
  EKOH_MUTATES_VOTES: false
  WEIGHTED_OUTCOME_REQUIRES_REPRODUCIBILITY: true
  READING_FORMULA: "Reading = f(BaselineEvents, LensDeclaration, SnapshotContext?)"
```

Canonical reading fields:

```yaml id="8tgctu"
SMART_VOTE_EKOH_FIELDS:
  BASELINE_READING: "raw_unweighted"
  WEIGHTED_READING: "declared_lens_output"
  SNAPSHOT_FIELD: "snapshot_ref"
  LEGACY_EKOH_SNAPSHOT_FIELD: "ekoh_snapshot_id"
  LENS_ID_FIELD: "reading_key"
  LENS_HASH_FIELD: "lens_hash"
  RESULT_PAYLOAD_FIELD: "results_payload"
  COMPUTED_AT_FIELD: "computed_at"
```

AI MUST NOT write:

* “EkoH calculates the vote result”;
* “Smart Vote updates the original stance”;
* “Weighted vote replaces baseline vote”;
* “The expertise score is the vote”;
* “ReadingResult is the source vote”;
* “EkoH is the voting engine.”

Correct phrasing:

```text id="0gus2m"
Smart Vote publishes declared readings derived from baseline events, lens declarations, and optional EkoH snapshot context.
```

---

## 13. Vote-type separation guardrails

AI MUST keep these three concepts separate.

```yaml id="r5s19s"
VOTE_TYPE_SEPARATION:
  ETHIKOS_STANCE:
    RANGE: "-3..+3"
    LEVEL: "topic-level"
    OWNER: "Korum"
    MODEL: "EthikosStance"
    MEANING: "User stance on topic."

  KIALO_IMPACT_VOTE:
    RANGE: "0..4"
    LEVEL: "argument/claim-level"
    OWNER: "Korum"
    PROPOSED_MODEL: "ArgumentImpactVote"
    MEANING: "Impact of a claim on its parent; combines veracity and relevance."

  SMART_VOTE_READING:
    RANGE: "not fixed; depends on lens and modality"
    LEVEL: "derived aggregation"
    OWNER: "Smart Vote"
    PROPOSED_MODEL: "ReadingResult"
    MEANING: "Published derived reading of baseline events."
```

Forbidden conflations:

```yaml id="xv1gsw"
FORBIDDEN_VOTE_CONFLATIONS:
  CLAIM_IMPACT_VOTE_IS_TOPIC_STANCE: false
  CLAIM_IMPACT_VOTE_IS_SMART_VOTE_BALLOT: false
  ETHIKOS_STANCE_IS_READING: false
  SMART_VOTE_READING_IS_SOURCE_FACT: false
```

AI MUST NOT use “vote” generically when the distinction matters.
Use the precise term:

* `EthikosStance`
* `ArgumentImpactVote`
* `BallotEvent`
* `ReadingResult`
* `LensDeclaration`

---

## 14. Kialo-style guardrails

Kialo-style argument mapping is a native mimic reference for Korum under `/ethikos/deliberate/*`.

```yaml id="c8bdcc"
KIALO_GUARDRAILS:
  STRATEGY: "native_mimic"
  ROUTE_SCOPE: "/ethikos/deliberate/*"
  BACKEND_SCOPE: "konnaxion.ethikos"
  CREATE_KIALO_BACKEND_APP: false
  CREATE_KIALO_FRONTEND_ROUTE: false
  IMPORT_KIALO_CODE: false
```

Canonical mapping:

```yaml id="rkjqzh"
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
```

AI MUST NOT:

* create `konnaxion.kialo`;
* create `/kialo`;
* create `/ethikos/kialo`;
* import Kialo code;
* rename `EthikosArgument` to `Claim`;
* collapse Kialo claim impact voting into `EthikosStance`;
* allow suggested claims to publish without approval for `suggester`;
* expose real identities in anonymous mode to normal participants.

AI MAY use “claim” as a UX term if the document clearly states:

```text id="w85wng"
Claim is the Kialo-style conceptual/UX term. The current backend model remains EthikosArgument.
```

---

## 15. External OSS guardrails

First-pass OSS sources:

```yaml id="wkzaj2"
FIRST_PASS_OSS_SOURCES:
  - "Consider.it"
  - "Kialo-style argument mapping"
  - "Loomio"
  - "Citizen OS"
  - "Decidim"
  - "CONSUL Democracy"
  - "DemocracyOS"
```

Deferred OSS sources:

```yaml id="4u0m9a"
DEFERRED_OSS_SOURCES:
  - "Polis"
  - "LiquidFeedback"
  - "All Our Ideas"
  - "Your Priorities"
  - "OpenSlides"
```

AI MUST interpret first-pass OSS sources as pattern inspiration only.

```yaml id="3jipe1"
OSS_RULES:
  DEFAULT_EXTERNAL_TOOL_STRATEGY: "mimic"
  MIMIC_FIRST_PASS: true
  ANNEX_FIRST_PASS_ALLOWED: false
  FULL_CODE_IMPORT_DEFAULT: false
  ANNEX_REQUIRES_ISOLATION: true
  ANNEX_REQUIRES_REPLACEABILITY: true
  ANNEX_REQUIRES_NO_CORE_TABLE_WRITES: true
  ANNEX_REQUIRES_LICENSE_CLEARANCE: true
  ANNEX_REQUIRES_ADAPTER_LAYER: true
```

AI MUST NOT generate first-pass implementation plans for deferred sources.

Allowed language:

```text id="fjbui7"
Polis is deferred and may be referenced only as future inspiration or public credit.
```

Forbidden language:

```text id="lqvzwh"
Implement Polis clustering in first pass.
```

---

## 16. Mimic vs Annex guardrails

Default strategy is native mimic.

```yaml id="ky2xob"
MIMIC_VS_ANNEX:
  DEFAULT_EXTERNAL_TOOL_STRATEGY: "mimic"
  MIMIC_FIRST_PASS: true
  ANNEX_REQUIRES_ISOLATION: true
  ANNEX_REQUIRES_REPLACEABILITY: true
  ANNEX_REQUIRES_NO_CORE_TABLE_WRITES: true
  ANNEX_REQUIRES_LICENSE_CLEARANCE: true
  ANNEX_REQUIRES_ADAPTER_LAYER: true
  FULL_CODE_IMPORT_DEFAULT: false
```

Annex integration is not first pass.

If a future annex is discussed, the AI MUST require:

* `ExternalArtifact`;
* `ProjectionMapping`;
* read-only projection where possible;
* no core table writes;
* license clearance;
* replaceability;
* adapter layer;
* ADR approval.

AI MUST NOT say:

```text id="ma9xfc"
Let's just plug in Decidim/Loomio/Citizen OS directly.
```

AI SHOULD say:

```text id="70do78"
Mimic the pattern natively in ethiKos first. Consider annex only later if isolation, replaceability, license, and adapter requirements are satisfied.
```

---

## 17. Frontend guardrails

The frontend uses the existing Next.js App Router and shared shell.

AI MUST preserve:

```yaml id="6yh91h"
FRONTEND_GUARDRAILS:
  PRIMARY_ROUTE_SURFACE: "/ethikos/*"
  USE_EXISTING_ETHIKOS_LAYOUT: true
  USE_EXISTING_GLOBAL_SHELL: true
  USE_SERVICES_LAYER: true
  DO_NOT_CREATE_SECOND_SHELL: true
  DO_NOT_CREATE_SECOND_THEME_SYSTEM: true
  DO_NOT_CREATE_KIALO_ROUTE_FAMILY: true
  DO_NOT_CREATE_KINTSUGI_TOP_LEVEL_APP: true
```

AI MAY reference these existing shell concepts:

```yaml id="8cx6sw"
EXISTING_LAYOUT_COMPONENTS:
  - "MainLayout"
  - "EthikosPageShell"
  - "PageContainer"
  - "Ant Design App context"
```

AI MUST NOT:

* create a new Ethikos root layout;
* create a separate Kialo shell;
* create a second global navigation;
* create a new theme switcher;
* add direct raw fetches in page components unless explicitly documented as legacy;
* bypass the service layer for new API calls.

New frontend surfaces MUST be mapped to existing route families.

Example:

```yaml id="7vj6t3"
KIALO_STYLE_FRONTEND_SURFACES:
  ArgumentTreeView:
    route: "/ethikos/deliberate/[topic]"
  ArgumentSourcesPanel:
    route: "/ethikos/deliberate/[topic]"
  SuggestedClaimsPanel:
    route: "/ethikos/deliberate/[topic] and /ethikos/admin/moderation"
  GuidedVotingDrawer:
    route: "/ethikos/deliberate/[topic]"
```

---

## 18. Backend guardrails

The backend is Django/DRF.

```yaml id="moyf2g"
BACKEND_GUARDRAILS:
  ETHIKOS_BACKEND_APP: "konnaxion.ethikos"
  KOLLECTIVE_BACKEND_APP: "konnaxion.kollective_intelligence"
  USERS_APP: "konnaxion.users"
  AUTH_USER_MODEL: "users.User"
  ROOT_URLCONF: "config.urls"
  API_ROUTER_FILE: "config/api_router.py"
  DEFAULT_API_STYLE: "Django REST Framework ViewSet + Serializer + Router"
  DEFAULT_DB: "PostgreSQL"
```

AI MUST NOT:

* suggest replacing Django with Rails;
* suggest replacing PostgreSQL with MongoDB;
* suggest adding GraphQL for first-pass CRUD;
* suggest moving Ethikos to a microservice;
* create a new backend app for each OSS source;
* create a second user model;
* reference `auth.User` as the user model;
* bypass DRF serializers/viewsets/routers for standard CRUD.

AI MAY propose new DRF viewsets only if they align with:

* `07_API_AND_SERVICE_CONTRACTS.md`;
* `08_DATA_MODEL_AND_MIGRATION_PLAN.md`;
* `13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md`;
* `15_BACKEND_ALIGNMENT_CONTRACT.md`.

---

## 19. Drafting guardrails

Drafting is a bounded ethiKos capability.

Citizen OS may inspire drafting and versioning, but AI MUST NOT import external collaborative editing infrastructure in first pass.

```yaml id="g3puka"
DRAFTING_GUARDRAILS:
  DRAFTING_IS_BOUNDED_ETHIKOS_CAPABILITY: true
  CITIZEN_OS_STRATEGY: "native_mimic"
  ETHERPAD_ANNEX_FIRST_PASS: false
  DRAFTS_ARE_NOT_ARGUMENTS: true
  DRAFT_VERSIONS_ARE_NOT_ARGUMENT_THREADS: true
```

AI MUST separate:

* `EthikosArgument` = deliberation contribution;
* `Draft` = decision-ready text container;
* `DraftVersion` = versioned text state;
* `Amendment` = proposed text change;
* `RationalePacket` = explanation of text choices.

AI MUST NOT store drafting history directly in argument threads.

---

## 20. Impact guardrails

Impact belongs to Konsultations/accountability truth, not KeenKonnect source truth.

```yaml id="62x1xe"
IMPACT_GUARDRAILS:
  IMPACT_BELONGS_TO: "Konsultations + accountability handoff"
  IMPACT_DOES_NOT_BELONG_TO: "KeenKonnect as source of truth"
  KEENKONNECT_MAY_RECEIVE_HANDOFF: true
  KEENKONNECT_MUST_NOT_OWN_CIVIC_IMPACT_TRUTH: true
```

AI MUST NOT:

* make `Project` the canonical civic impact record;
* treat KeenKonnect as the source of truth for decisions;
* collapse implementation project tracking and civic accountability tracking.

Correct framing:

```text id="0oi55h"
Konsultations owns civic impact tracking. KeenKonnect may receive execution handoff links after a decision.
```

---

## 21. Known bug guardrails

Known bug:

```yaml id="uacfix"
KNOWN_BUGS:
  BUG_001:
    TITLE: "Deliberate preview drawer shows 'Preview / No data'"
    STATUS: "known_open"
    CLASSIFICATION: "targeted_bugfix_not_architecture"
    DO_NOT_USE_TO_REDESIGN_KINTSUGI: true
```

AI MUST NOT use this bug to justify:

* route rewrite;
* service rewrite;
* backend redesign;
* new preview architecture;
* moving deliberation out of Ethikos;
* replacing current pages.

AI MAY say:

```text id="44lo5h"
The preview drawer bug should be tracked separately as a targeted bugfix.
```

---

## 22. Backlog guardrails

The documentation pack must precede the implementation backlog.

AI MUST NOT generate implementation tasks unless the assigned document is:

```text id="6smlo6"
22_IMPLEMENTATION_BACKLOG_TEMPLATE.md
```

or the user explicitly asks for a backlog after the docs have been generated.

Forbidden in most documents:

* “Task 1: create model...”
* “Task 2: update serializer...”
* “Sprint plan...”
* “Implementation tickets...”
* “Patch this file...”

Allowed in planning docs:

```text id="u906ix"
First-pass model candidate
Requires code inspection
Potential future migration
Route target
Service contract target
```

---

## 23. Parallel-generation guardrails

When generating documentation in parallel conversations:

```yaml id="60kpxx"
PARALLEL_GENERATION_RULES:
  ONE_FILE_PER_CONVERSATION: true
  SAME_CANONICAL_VARIABLE_BLOCK_REQUIRED: true
  DO_NOT_GENERATE_OTHER_FILES: true
  DO_NOT_RENUMBER_DOC_PACK: true
  DO_NOT_RENAME_ASSIGNED_FILE: true
  DO_NOT_CHANGE_CANONICAL_FOLDER: true
```

Each generated document MUST include:

```text id="54qwqx"
File name
Pack name
Canonical path
Version
Status
Purpose
Scope
Canonical variables used
Non-goals
Anti-drift rules
Related documents
```

Each generated document SHOULD refer to related documents by filename, not by vague phrasing.

Good:

```text id="4uk9dw"
See 03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md.
```

Bad:

```text id="c2t3u4"
See the other architecture doc.
```

---

## 24. Language guardrails

Default documentation language is English technical documentation.

User-facing conversation may be French if the user writes in French, but generated files SHOULD remain English unless explicitly requested otherwise.

Allowed:

```text id="vp5eal"
Generate the Markdown file in English.
```

Allowed if explicitly requested:

```text id="jck5n2"
Generate the Markdown file in French.
```

If uncertain, generate docs in English.

---

## 25. Naming guardrails

Canonical display names:

```yaml id="oeyonw"
PRODUCT_LANGUAGE:
  ETHIKOS_DISPLAY: "ethiKos"
  KORUM_DISPLAY: "Korum"
  KONSULTATIONS_DISPLAY: "Konsultations"
  SMART_VOTE_DISPLAY: "Smart Vote"
  EKOH_DISPLAY: "EkoH"
  KOLLECTIVE_INTELLIGENCE_DISPLAY: "Kollective Intelligence"
```

Canonical backend references:

```yaml id="cuigub"
BACKEND_NAMES:
  ETHIKOS_BACKEND_APP: "konnaxion.ethikos"
  KOLLECTIVE_BACKEND_APP: "konnaxion.kollective_intelligence"
  USERS_APP: "konnaxion.users"
```

AI MUST NOT introduce inconsistent variants such as:

```yaml id="jzqfs4"
FORBIDDEN_NAME_VARIANTS:
  - "EthicsOS"
  - "EthikosOS"
  - "Ethikos Kialo"
  - "Kialo module"
  - "Kintsugi app"
  - "SmartVote engine replacing Ethikos"
  - "EkoH voting engine"
  - "Korum app separate from Ethikos"
  - "Konsultations app separate from Ethikos"
```

Acceptable internal phrasing:

```text id="cnug2d"
Korum is the structured debate submodule within ethiKos.
Konsultations is the public consultation and accountability submodule within ethiKos.
```

---

## 26. Payload and enum guardrails

AI MUST use the canonical ranges and enum values unless a specific document proposes a change for review.

```yaml id="t17846"
PAYLOAD_CONSTANTS:
  ID_TYPE_CURRENT_ETHIKOS: "integer"
  DATE_FORMAT: "ISO_8601"
  PAGINATION_STYLE: "DRF-compatible"
  ERROR_STYLE: "DRF-compatible"
  STANCE_VALUE_RANGE: "-3..+3"
  CLAIM_IMPACT_RANGE: "0..4"
```

Canonical enums:

```yaml id="feg84n"
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

AI MUST NOT invent alternative enum values unless the document explicitly introduces them as proposed and non-canonical.

---

## 27. Required uncertainty language

When code reality is unknown, AI MUST use uncertainty markers.

Use:

```text id="6nvh1b"
Requires code inspection before implementation.
```

Use:

```text id="ffmaba"
This is a proposed support model, not a confirmed existing model.
```

Use:

```text id="ds7f73"
This is a first-pass candidate, not a committed migration.
```

Do not use:

```text id="bn2ck8"
The code already does this.
```

unless the code snapshot confirms it.

---

## 28. Guardrails by document

## 28.1 `00_KINTSUGI_START_HERE.md`

MUST:

* define the pack;
* define first-pass scope;
* define source priority;
* define current baseline;
* list all docs;
* include final binding statement.

MUST NOT:

* include implementation tickets;
* over-describe every model.

---

## 28.2 `01_ETHIKOS_KINTSUGI_EXECUTION_STRATEGY.md`

MUST:

* explain Kintsugi as native mimic;
* explain the civic workflow;
* define why external tools are inspiration only;
* align with route families.

MUST NOT:

* revive deferred sources as first-pass work;
* propose full platform merge.

---

## 28.3 `02_SOURCE_OF_TRUTH_AND_DRIFT_CONTROL.md`

MUST:

* define source hierarchy;
* define conflict resolution;
* define drift categories;
* define AI behavior under uncertainty.

MUST NOT:

* duplicate all domain contracts.

---

## 28.4 `03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md`

MUST:

* lock Korum/Konsultations/Smart Vote/EkoH ownership;
* lock write rules;
* define stage ownership;
* define foreign tool boundaries.

MUST NOT:

* create new model names casually;
* blur source facts and derived readings.

---

## 28.5 `04_CANONICAL_NAMING_AND_VARIABLES.md`

MUST:

* define names, slugs, enums, route constants, endpoint constants;
* be usable as copy/paste AI context.

MUST NOT:

* include strategy prose beyond what is needed.

---

## 28.6 `05_CURRENT_STATE_BASELINE.md`

MUST:

* reflect current code snapshot reality;
* distinguish confirmed from proposed;
* document known legacy endpoints.

MUST NOT:

* describe future features as current.

---

## 28.7 `06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md`

MUST:

* map Kintsugi onto actual `/ethikos/*` routes;
* identify each route family’s role;
* identify source inspirations per route.

MUST NOT:

* invent a new route family without ADR requirement.

---

## 28.8 `07_API_AND_SERVICE_CONTRACTS.md`

MUST:

* preserve `/api/ethikos/*`;
* identify `/api/home/*` as legacy/problematic;
* require service-layer wrappers.

MUST NOT:

* introduce `/api/deliberation/*`;
* bypass DRF conventions.

---

## 28.9 `08_DATA_MODEL_AND_MIGRATION_PLAN.md`

MUST:

* preserve existing models;
* distinguish existing vs proposed;
* define non-breaking migration strategy.

MUST NOT:

* rename current models;
* generate actual migration code unless explicitly requested later.

---

## 28.10 `09_SMART_VOTE_EKOH_READING_CONTRACT.md`

MUST:

* separate baseline events from readings;
* define lens declarations;
* define snapshot context;
* define reproducibility.

MUST NOT:

* make EkoH the vote engine;
* make readings source facts.

---

## 28.11 `10_FIRST_PASS_INTEGRATION_MATRIX.md`

MUST:

* include only approved first-pass sources;
* mark deferred sources explicitly;
* classify mimic vs annex.

MUST NOT:

* generate backlog tasks;
* promote deferred sources.

---

## 28.12 `11_MIMIC_VS_ANNEX_RULEBOOK.md`

MUST:

* define mimic;
* define annex;
* define no-go criteria;
* define future annex requirements.

MUST NOT:

* allow annex in first pass.

---

## 28.13 `12_CANONICAL_OBJECTS_AND_EVENTS.md`

MUST:

* define domain object vocabulary;
* distinguish conceptual objects from current model names.

MUST NOT:

* force model renames.

---

## 28.14 `13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md`

MUST:

* define JSON shapes;
* define field names;
* define IDs, dates, pagination, errors.

MUST NOT:

* invent backend endpoints outside `07_API_AND_SERVICE_CONTRACTS.md`.

---

## 28.15 `14_FRONTEND_ALIGNMENT_CONTRACT.md`

MUST:

* preserve existing shell;
* preserve route families;
* require service-layer API access;
* define Kialo-style frontend surfaces under Deliberate.

MUST NOT:

* create a second shell;
* create a second theme system.

---

## 28.16 `15_BACKEND_ALIGNMENT_CONTRACT.md`

MUST:

* align with Django/DRF;
* preserve app ownership;
* define serializer/viewset/router expectations.

MUST NOT:

* introduce new backend style casually.

---

## 28.17 `16_TEST_AND_SMOKE_CONTRACT.md`

MUST:

* define minimum tests;
* include existing smoke coverage;
* include no-drift checks.

MUST NOT:

* assume unbuilt features are already testable.

---

## 28.18 `17_KNOWN_BUGS_AND_NON_KINTSUGI_ITEMS.md`

MUST:

* isolate preview drawer bug;
* list exclusions;
* prevent architecture pollution from bugfix work.

MUST NOT:

* solve bugs directly.

---

## 28.19 `18_ADR_REGISTER.md`

MUST:

* list required ADRs;
* assign decision status;
* include consequences.

MUST NOT:

* replace detailed contracts.

---

## 28.20 `19_OSS_CODE_READING_PLAN.md`

MUST:

* define how to inspect OSS repos later;
* distinguish product idea from code reality.

MUST NOT:

* infer code behavior from docs alone.

---

## 28.21 `20_AI_GENERATION_GUARDRAILS.md`

MUST:

* define all AI constraints;
* prevent drift;
* govern parallel generation.

MUST NOT:

* contradict `00_KINTSUGI_START_HERE.md`.

---

## 28.22 `21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md`

MUST:

* define Kialo-style mapping in full;
* define claim/argument distinction;
* define roles, sources, impact votes, visibility settings.

MUST NOT:

* create a Kialo app;
* import Kialo code.

---

## 28.23 `22_IMPLEMENTATION_BACKLOG_TEMPLATE.md`

MUST:

* provide a backlog item format only;
* avoid filling real backlog prematurely unless user explicitly asks later.

MUST NOT:

* generate full implementation plan before contracts are reviewed.

---

## 29. Final AI checklist

Before producing any Kintsugi-related output, an AI session MUST check:

```yaml id="t1hb5w"
FINAL_AI_CHECKLIST:
  - "Am I generating only the assigned document or requested output?"
  - "Am I preserving /ethikos/* route reality?"
  - "Am I preserving /api/ethikos/* endpoint reality?"
  - "Am I preserving current Ethikos models?"
  - "Am I separating EthikosStance, ArgumentImpactVote, and ReadingResult?"
  - "Am I keeping Smart Vote derived-only?"
  - "Am I keeping EkoH as context, not voting engine?"
  - "Am I treating OSS sources as mimic-only in first pass?"
  - "Am I keeping Kialo-style work inside Korum / Deliberate?"
  - "Am I avoiding /api/home/* expansion?"
  - "Am I avoiding implementation tasks unless assigned doc 22?"
  - "Am I marking uncertainty when code inspection is required?"
```

If any answer is “no,” the AI MUST revise before output.

---

## 30. Related documents

This document governs or constrains:

```text id="q9yebx"
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
17_KNOWN_BUGS_AND_NON_KINTSUGI_ITEMS.md
18_ADR_REGISTER.md
19_OSS_CODE_READING_PLAN.md
21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md
22_IMPLEMENTATION_BACKLOG_TEMPLATE.md
```

---

## 31. Final binding statement

```yaml id="4kadx4"
FINAL_BINDING_STATEMENT:
  THIS_DOCUMENT_IS: "The AI-specific guardrail contract for the ethiKos Kintsugi documentation and future implementation planning process."

  ALL_AI_OUTPUTS_MUST:
    - "Preserve ethiKos route reality."
    - "Preserve backend ownership boundaries."
    - "Preserve current model names."
    - "Treat external civic-tech systems as native-mimic inspirations only in first pass."
    - "Separate source facts from derived readings."
    - "Keep Kialo-style features inside Korum under /ethikos/deliberate/*."
    - "Keep Smart Vote as readings, not source mutation."
    - "Keep EkoH as context, not vote engine."
    - "Avoid implementation tasks before documentation contracts."

  PRIMARY_DRIFT_CONTROL_RULE:
    "If an AI output conflicts with this file, the canonical variable block, or the source-of-truth hierarchy, the output is invalid unless a later explicit ADR supersedes it."

