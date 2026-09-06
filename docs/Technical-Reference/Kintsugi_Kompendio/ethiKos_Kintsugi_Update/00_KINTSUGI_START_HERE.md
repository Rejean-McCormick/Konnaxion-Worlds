# 00 — Kintsugi Start Here

**File:** `00_KINTSUGI_START_HERE.md`  
**Pack:** ethiKos Kintsugi Update Documentation Pack  
**Canonical path:** `docs/Technical-Reference/Kintsugi_Kompendio/ethiKos_Kintsugi_Update/`  
**Version:** `2026-04-25-kintsugi-doc-pack-v1`  
**Status:** Canonical entry point  
**Primary audience:** Réjean McCormick, future AI sessions, maintainers, implementers  
**Module:** `ethiKos`  
**Platform:** `Konnaxion`

---

## 1. Purpose

This document is the entry point for the complete **ethiKos Kintsugi Upgrade** documentation pack.

Its purpose is to prevent scope drift, architecture drift, naming drift, route drift, model drift, and AI-generated inconsistency while preparing the next major ethiKos upgrade.

This pack exists because the Kintsugi update is not a small bugfix, not a cosmetic rewrite, and not a direct import of external civic-tech platforms. It is a documentation-first architecture upgrade that turns the existing ethiKos module into a more complete civic deliberation, drafting, decision-formation, and accountability engine.

The documentation pack MUST be read and generated before implementation backlog generation.

---

## 2. What Kintsugi means in this upgrade

The Kintsugi update is a **partial native mimic** strategy.

It means:

- keep the existing ethiKos frame;
- keep the existing `/ethikos/*` route families;
- keep the current backend ownership boundaries;
- learn from selected civic-tech systems;
- reimplement only selected patterns natively;
- avoid full external code merges;
- avoid premature annex/sidecar integration;
- document contracts first;
- inspect code second;
- generate implementation backlog only after the docs are stable.

Kintsugi does **not** mean merging other civic platforms into Konnaxion.

---

## 3. Canonical one-line definition

**ethiKos Kintsugi Upgrade** is a documentation-first, native-mimic upgrade that extends ethiKos into a structured civic deliberation, consultation, drafting, decision, and accountability engine while preserving current routes, backend ownership, and source-of-truth boundaries.

---

## 4. Current stable baseline

The following baseline is treated as the current known platform state before the Kintsugi upgrade.

```yaml
CURRENT_BASELINE:
  FRONTEND_BUILD_WORKS: true
  PLAYWRIGHT_SMOKE_RAN_SUCCESSFULLY: true
  BACKEND_LOCAL_STARTUP_WORKS_WITH_UV: true
  AUTH_CSRF_CATEGORY_TOPIC_CREATION_FIXED: true
  ARGUMENT_POSTING_WORKS: true
  EKOH_MIGRATION_0002_CREATED_AND_APPLIED: true
  REMAINING_VISIBLE_ETHIKOS_BUG: "Deliberate preview drawer shows 'Preview / No data'"
````

The preview drawer bug is a known targeted bugfix. It MUST NOT be used as a reason to redesign the Kintsugi architecture.

---

## 5. Primary strategy variables

All documents in this pack MUST respect the following constants.

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
```

If another document, prompt, or AI session conflicts with these variables, this document wins unless explicitly superseded by a later canonical ADR.

---

## 6. Source-of-truth priority order

When sources conflict, use this priority order.

```yaml
SOURCE_PRIORITY_ORDER:
  1_CODE_SNAPSHOT_REALITY:
    description: "Routes, files, current endpoints, current models, current implementation state."
  2_BOUNDARIES_DOC:
    description: "Korum/Konsultations/Smart Vote/EkoH ownership, write rules, and pipeline."
  3_CLEAN_SLATE_PLAN:
    description: "First-pass scope, no full merge, docs first, code inspection second."
  4_KIALO_CORE_DOCS:
    description: "Structured deliberation contract for /ethikos/deliberate/*."
  5_OSS_SOURCE_DOCS:
    description: "Pattern inspiration only; never direct merge in first pass."
  6_PRIOR_MASTER_DOCS:
    description: "Use only after correcting scope and route reality."
```

Implementation reality comes from the current Konnaxion code snapshot.
Ownership reality comes from the boundaries contract.
Deliberation UX reality comes from the Kialo-style contract.
OSS documents are inspiration sources only.

---

## 7. First-pass OSS scope

The following sources are allowed in first pass as **native mimic inspirations only**.

```yaml
FIRST_PASS_OSS_SOURCES:
  - "Consider.it"
  - "Kialo-style argument mapping"
  - "Loomio"
  - "Citizen OS"
  - "Decidim"
  - "CONSUL Democracy"
  - "DemocracyOS"
```

Their first-pass role is to provide patterns, not code.

---

## 8. Deferred OSS scope

The following sources are explicitly deferred.

```yaml
DEFERRED_OSS_SOURCES:
  - "Polis"
  - "LiquidFeedback"
  - "All Our Ideas"
  - "Your Priorities"
  - "OpenSlides"
```

Deferred means:

* do not include them in the first implementation scope;
* do not build backlog tasks for them now;
* do not create annexes for them now;
* do not import their code;
* mention only as future inspiration or public credit where appropriate.

---

## 9. Core ownership model

The Kintsugi update depends on strict ownership boundaries.

```yaml
OWNERSHIP:
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
    - "Snapshot/audit context"
```

No generated document may redefine these ownership boundaries without creating or referencing an ADR.

---

## 10. Write rules

The following rules are mandatory.

```yaml
WRITE_RULES:
  FOREIGN_TOOLS_WRITE_CORE_TABLES: false
  SMART_VOTE_MUTATES_KORUM_RECORDS: false
  SMART_VOTE_MUTATES_KONSULTATIONS_RECORDS: false
  SMART_VOTE_WRITES_ONLY_DERIVED_ARTIFACTS: true
  EKOH_IS_VOTING_ENGINE: false
  EKOH_MUTATES_VOTES: false
  WEIGHTED_OUTCOME_REQUIRES_REPRODUCIBILITY: true
  READING_FORMULA: "Reading = f(BaselineEvents, LensDeclaration, SnapshotContext?)"
```

Smart Vote publishes readings.
EkoH supplies expertise and ethics context.
Korum and Konsultations own the source facts.

---

## 11. Current backend reality

The current backend is Django/DRF.

```yaml
CURRENT_BACKEND_CORE:
  ETHIKOS_BACKEND_APP: "konnaxion.ethikos"
  KOLLECTIVE_BACKEND_APP: "konnaxion.kollective_intelligence"
  USERS_APP: "konnaxion.users"
  AUTH_USER_MODEL: "users.User"
  ROOT_URLCONF: "config.urls"
  API_ROUTER_FILE: "config/api_router.py"
  DEFAULT_API_STYLE: "Django REST Framework ViewSet + Serializer + Router"
  DEFAULT_DB: "PostgreSQL"
  BACKGROUND_WORKER: "Celery"
  BROKER_RESULT_BACKEND: "Redis"
```

Current ethiKos models:

```yaml
CURRENT_ETHIKOS_MODELS:
  - "EthikosCategory"
  - "EthikosTopic"
  - "EthikosStance"
  - "EthikosArgument"
```

Current canonical endpoints:

```yaml
CURRENT_ENDPOINTS_CANONICAL:
  ETHIKOS_TOPICS: "/api/ethikos/topics/"
  ETHIKOS_STANCES: "/api/ethikos/stances/"
  ETHIKOS_ARGUMENTS: "/api/ethikos/arguments/"
  ETHIKOS_CATEGORIES: "/api/ethikos/categories/"
  KOLLECTIVE_VOTES: "/api/kollective/votes/"
```

Compatibility aliases:

```yaml
CURRENT_ENDPOINTS_COMPATIBILITY:
  DELIBERATE_ALIAS: "/api/deliberate/..."
  DELIBERATE_ELITE_ALIAS: "/api/deliberate/elite/..."
```

Legacy/problematic endpoint family:

```yaml
LEGACY_OR_PROBLEMATIC_ENDPOINTS:
  API_HOME_PREFIX: "/api/home/*"
  RULE: "Do not expand /api/home/* usage. Replace, isolate, or mark legacy."
```

---

## 12. Current frontend route surface

The Kintsugi upgrade targets the existing ethiKos route surface.

```yaml
PRIMARY_ROUTE_SURFACE: "/ethikos/*"
```

Canonical route families:

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

The Kintsugi update MUST NOT create a new top-level Kintsugi app or a new Kialo route family.

---

## 13. Route-family purpose

| Route family            | Kintsugi role                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| `/ethikos/deliberate/*` | Korum, structured argumentation, Kialo-style claim graph, Consider.it-style reason capture |
| `/ethikos/decide/*`     | Decision protocols, ballots, Smart Vote readings, result publication                       |
| `/ethikos/impact/*`     | Accountability, implementation tracking, outcomes, feedback loops                          |
| `/ethikos/pulse/*`      | Participation health, live signals, trends, debate-quality indicators                      |
| `/ethikos/trust/*`      | EkoH visibility, trust profile, credentials, badges                                        |
| `/ethikos/admin/*`      | Audit, moderation, roles, eligibility and governance controls                              |
| `/ethikos/learn/*`      | Guides, glossary, methodology, public explanation                                          |
| `/ethikos/insights`     | Analytics, reading comparison, Smart Vote/EkoH interpretation                              |

---

## 14. Kialo-style deliberation contract summary

Kialo-style argument mapping is a first-pass canonical reference for structured deliberation under Korum.

It is not a separate module.

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

Canonical Kialo-to-ethiKos mapping:

```yaml
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

Critical Kialo rules:

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

## 15. Vote-type separation

The Kintsugi update MUST separate three concepts that are easy to confuse.

```yaml
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

Mandatory separation rules:

```yaml
CRITICAL_VOTE_RULES:
  CLAIM_IMPACT_VOTE_IS_TOPIC_STANCE: false
  CLAIM_IMPACT_VOTE_IS_SMART_VOTE_BALLOT: false
  ETHIKOS_STANCE_IS_READING: false
  SMART_VOTE_READING_IS_SOURCE_FACT: false
```

---

## 16. Kintsugi pipeline

The full civic workflow is expressed as six stages.

| Stage | Name                     | Owner                      | Required outputs                                                        |
| ----- | ------------------------ | -------------------------- | ----------------------------------------------------------------------- |
| 0     | Intake                   | Konsultations              | `ProblemStatement`, `IntakeQueue`, `TopicTags`                          |
| 1     | Discovery / Consultation | Konsultations              | `OptionSet`, `ConstraintSet`, optional `ConsensusMapArtifact`           |
| 2     | Deliberation             | Korum                      | `ArgumentGraph`, `StanceEvents`, `ModerationLog`                        |
| 3     | Drafting                 | ethiKos bounded capability | `Draft`, `VersionHistory`, `Amendments`, `RationalePacket`              |
| 4     | Decision                 | Smart Vote                 | `BaselineResult`, `ReadingResults`, `DecisionRecord`                    |
| 5     | Accountability           | Konsultations + handoff    | `ImpactTrack`, execution handoff links, public accountability snapshots |

The pipeline is a contract. Individual routes may expose only part of it, but generated documents must not collapse all stages into one model or one table.

---

## 17. Data model policy

The Kintsugi update must evolve the data model conservatively.

```yaml
DATA_MODEL_POLICY:
  BREAK_EXISTING_MODELS: false
  RENAME_EXISTING_MODELS: false
  DELETE_EXISTING_FIELDS: false
  ADD_NON_BREAKING_TABLES_ALLOWED: true
  ADD_NON_BREAKING_FIELDS_ALLOWED: true
  MIGRATIONS_REQUIRED_FOR_NEW_MODELS: true
  FUTURE_MAKEMIGRATIONS_DRIFT_MUST_BE_AVOIDED: true
```

Existing models are preserved.

Proposed models may be introduced only through documented migration plans and ownership contracts.

---

## 18. Proposed first-pass model priorities

The following model concepts are candidates for first-pass consideration.

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

This list is not an implementation backlog. It is a planning boundary.

---

## 19. Mimic vs Annex summary

Default external-tool strategy:

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
```

Annex boundary objects:

```yaml
ANNEX_BOUNDARY_OBJECTS:
  - "ExternalArtifact"
  - "ProjectionMapping"
```

In first pass, assume mimic. Do not design annex integration unless the assigned document explicitly concerns future annex rules.

---

## 20. Document pack

The complete documentation pack contains the following files.

```text
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
20_AI_GENERATION_GUARDRAILS.md
21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md
22_IMPLEMENTATION_BACKLOG_TEMPLATE.md
```

---

## 21. Recommended generation order

When generating the pack in parallel AI conversations, each conversation should generate exactly one file.

Recommended order:

```text
1.  00_KINTSUGI_START_HERE.md
2.  02_SOURCE_OF_TRUTH_AND_DRIFT_CONTROL.md
3.  03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md
4.  04_CANONICAL_NAMING_AND_VARIABLES.md
5.  20_AI_GENERATION_GUARDRAILS.md
6.  21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md
7.  01_ETHIKOS_KINTSUGI_EXECUTION_STRATEGY.md
8.  10_FIRST_PASS_INTEGRATION_MATRIX.md
9.  11_MIMIC_VS_ANNEX_RULEBOOK.md
10. 05_CURRENT_STATE_BASELINE.md
11. 06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md
12. 07_API_AND_SERVICE_CONTRACTS.md
13. 08_DATA_MODEL_AND_MIGRATION_PLAN.md
14. 09_SMART_VOTE_EKOH_READING_CONTRACT.md
15. 12_CANONICAL_OBJECTS_AND_EVENTS.md
16. 13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md
17. 14_FRONTEND_ALIGNMENT_CONTRACT.md
18. 15_BACKEND_ALIGNMENT_CONTRACT.md
19. 16_TEST_AND_SMOKE_CONTRACT.md
20. 17_KNOWN_BUGS_AND_NON_KINTSUGI_ITEMS.md
21. 18_ADR_REGISTER.md
22. 19_OSS_CODE_READING_PLAN.md
23. 22_IMPLEMENTATION_BACKLOG_TEMPLATE.md
```

---

## 22. Document responsibilities

| File                                            | Responsibility                               |
| ----------------------------------------------- | -------------------------------------------- |
| `00_KINTSUGI_START_HERE.md`                     | Entry point and orientation                  |
| `01_ETHIKOS_KINTSUGI_EXECUTION_STRATEGY.md`     | Strategic execution framing                  |
| `02_SOURCE_OF_TRUTH_AND_DRIFT_CONTROL.md`       | Source hierarchy and drift prevention        |
| `03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md`      | Ownership and write rules                    |
| `04_CANONICAL_NAMING_AND_VARIABLES.md`          | Names, constants, slugs, enums               |
| `05_CURRENT_STATE_BASELINE.md`                  | Current code and product baseline            |
| `06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md`     | Route-by-route Kintsugi mapping              |
| `07_API_AND_SERVICE_CONTRACTS.md`               | API and frontend service contracts           |
| `08_DATA_MODEL_AND_MIGRATION_PLAN.md`           | Schema and migration strategy                |
| `09_SMART_VOTE_EKOH_READING_CONTRACT.md`        | Baseline, readings, lenses, snapshots        |
| `10_FIRST_PASS_INTEGRATION_MATRIX.md`           | OSS first-pass mimic matrix                  |
| `11_MIMIC_VS_ANNEX_RULEBOOK.md`                 | Rules for mimic, annex, and no-go            |
| `12_CANONICAL_OBJECTS_AND_EVENTS.md`            | Domain objects and event vocabulary          |
| `13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md` | JSON contracts and serializer shape          |
| `14_FRONTEND_ALIGNMENT_CONTRACT.md`             | Next.js, shell, route and service rules      |
| `15_BACKEND_ALIGNMENT_CONTRACT.md`              | Django/DRF alignment rules                   |
| `16_TEST_AND_SMOKE_CONTRACT.md`                 | Test and smoke minimums                      |
| `17_KNOWN_BUGS_AND_NON_KINTSUGI_ITEMS.md`       | Known bugs and exclusions                    |
| `18_ADR_REGISTER.md`                            | Architecture decision records                |
| `19_OSS_CODE_READING_PLAN.md`                   | Future OSS repo inspection plan              |
| `20_AI_GENERATION_GUARDRAILS.md`                | AI-specific generation constraints           |
| `21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md`   | Kialo-style structured deliberation contract |
| `22_IMPLEMENTATION_BACKLOG_TEMPLATE.md`         | Template for later backlog generation        |

---

## 23. Required document sections

Every document in this pack SHOULD include these sections unless the assigned document has a stronger reason to differ.

```text
1. Purpose
2. Scope
3. Canonical variables used
4. Source-of-truth references
5. Non-goals
6. Main contract or content
7. Anti-drift rules
8. Related documents
```

---

## 24. Non-goals for this pack

The Kintsugi documentation pack is not intended to:

* perform the implementation;
* rewrite the whole platform;
* replace current ethiKos routes;
* replace current ethiKos models;
* import external civic-tech code;
* create a new Kialo module;
* create a new Kintsugi frontend app;
* create a full annex integration;
* expand `/api/home/*`;
* turn EkoH into a voting engine;
* let Smart Vote mutate source facts;
* generate a full implementation backlog before docs and code reading are complete.

---

## 25. Known bug boundary

The following item is known and open.

```yaml
KNOWN_BUGS:
  BUG_001:
    TITLE: "Deliberate preview drawer shows 'Preview / No data'"
    STATUS: "known_open"
    CLASSIFICATION: "targeted_bugfix_not_architecture"
    DO_NOT_USE_TO_REDESIGN_KINTSUGI: true
```

This bug should be tracked and fixed, but it MUST NOT dominate the Kintsugi documentation process.

---

## 26. AI generation rules

Any AI session generating one of these docs MUST follow these rules.

```yaml
GENERATION_RULES:
  GENERATE_ONE_FILE_PER_CONVERSATION: true
  EACH_CONVERSATION_MUST_OBEY_CANONICAL_VARIABLES: true
  DO_NOT_REINTERPRET_SCOPE: true
  DO_NOT_CREATE_NEW_ARCHITECTURE_UNLESS_DOC_EXPLICITLY_ASSIGNED: true
  IF_CONFLICT_USE_SOURCE_PRIORITY_ORDER: true
```

Each AI-generated document MUST NOT:

* invent new routes;
* invent new endpoints;
* rename existing canonical models;
* create a new Kialo app;
* create a new top-level Kintsugi app;
* propose a full OSS merge;
* treat Kialo impact votes as topic stances;
* treat Kialo impact votes as Smart Vote ballots;
* expand `/api/home/*`;
* create a second layout shell;
* create a second theme system.

---

## 27. Absolute forbidden outputs

The following outputs are forbidden across the entire pack.

```yaml
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

---

## 28. Required ADRs

The ADR register MUST include at least the following decisions.

```yaml
REQUIRED_ADRS:
  ADR_001: "No full OSS merge"
  ADR_002: "Existing Ethikos route families remain stable"
  ADR_003: "Korum and Konsultations ownership split"
  ADR_004: "Smart Vote publishes readings only"
  ADR_005: "EkoH is context, not voting engine"
  ADR_006: "Drafting is separate bounded capability"
  ADR_007: "External tools use mimic first, annex later"
  ADR_008: "/api/home legacy calls must be removed or isolated"
  ADR_009: "Impact belongs to Ethikos/Konsultations truth, not KeenKonnect truth"
  ADR_010: "Implementation backlog comes after docs and code-reading"
  ADR_011: "Kialo-style features extend Korum; no separate Kialo module"
```

---

## 29. How to use this file

Before generating or editing any Kintsugi document:

1. Read this file.
2. Confirm the assigned document filename.
3. Follow the source-of-truth order.
4. Use the canonical variables.
5. Do not reinterpret the first-pass scope.
6. Do not invent new architecture.
7. Generate only the assigned document.
8. Cross-reference related documents.
9. Keep implementation tasks out unless generating `22_IMPLEMENTATION_BACKLOG_TEMPLATE.md`.

---

## 30. Related documents

This file directly governs or is referenced by:

```text
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
20_AI_GENERATION_GUARDRAILS.md
21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md
22_IMPLEMENTATION_BACKLOG_TEMPLATE.md
```

---

## 31. Final binding statement

For the ethiKos Kintsugi Upgrade documentation pack:

```yaml
FINAL_BINDING_STATEMENT:
  KINTSUGI_IS: "A documentation-first native-mimic architecture upgrade."
  KINTSUGI_IS_NOT: "A full OSS merge, route rewrite, or backend ownership collapse."
  PRIMARY_ROUTE_SURFACE: "/ethikos/*"
  PRIMARY_BACKEND_APP: "konnaxion.ethikos"
  PRIMARY_DELIBERATION_CONTRACT: "Korum + Kialo-style native mimic"
  PRIMARY_DECISION_CONTRACT: "Smart Vote readings over baseline events"
  PRIMARY_EXPERTISE_CONTEXT: "EkoH snapshots and cohort context"
  PRIMARY_DRIFT_CONTROL_RULE: "If a generated document conflicts with this file, this file wins unless a later ADR explicitly supersedes it."
```

---

## V4.1 canonical extension — EkoH rating disclosure

`27_EKOH_RATING_VISIBILITY_AND_ACCESS_CONTRACT.md` is the canonical contract for individual EkoH rating visibility, scoped disclosure, reusable EkoH profile UI, and the boundary between rating disclosure and Smart Vote contextual influence. It MUST be read with `03`, `07`, `08`, `09`, `13`, `14`, `15`, `16`, and `18`.

