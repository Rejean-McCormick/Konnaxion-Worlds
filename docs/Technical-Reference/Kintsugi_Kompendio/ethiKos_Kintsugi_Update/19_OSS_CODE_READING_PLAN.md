# 19 — OSS Code Reading Plan

**File:** `19_OSS_CODE_READING_PLAN.md`
**Pack:** ethiKos Kintsugi Update Documentation Pack
**Status:** Normative planning document
**Audience:** architecture, backend, frontend, product, future AI/code-reading sessions
**Primary goal:** define how to inspect downloaded OSS civic-tech repositories without drifting into premature implementation, full merges, or speculative architecture.

---

## 1. Purpose

This document defines the code-reading plan for the first-pass OSS repositories considered in the ethiKos Kintsugi upgrade.

The goal is to inspect external civic-tech repositories **after the Kintsugi documentation contracts are stable**, in order to extract useful patterns for native implementation inside ethiKos.

The code-reading process must answer:

1. What exists in the OSS codebase, not just in product documentation?
2. Which concepts are useful for ethiKos?
3. Which concepts can be mimicked natively?
4. Which concepts should be deferred?
5. Which concepts must not be imported because they conflict with Konnaxion architecture?
6. Which ethiKos route family, model, service, or contract would receive the pattern?

The clean-slate plan explicitly states that OSS repo inspection comes only after documentation is stable, and that the purpose is to confirm real code patterns, avoid assumptions from docs alone, and produce implementation backlog only afterward. 

---

## 2. Scope

This document covers code-reading for the first-pass OSS sources:

```yaml id="6v9mth"
FIRST_PASS_OSS_SOURCES:
  - "Consider.it"
  - "Kialo-style argument mapping"
  - "Loomio"
  - "Citizen OS"
  - "Decidim"
  - "CONSUL Democracy"
  - "DemocracyOS"
```

This document also identifies deferred OSS sources:

```yaml id="k33l6u"
DEFERRED_OSS_SOURCES:
  - "Polis"
  - "LiquidFeedback"
  - "All Our Ideas"
  - "Your Priorities"
  - "OpenSlides"
```

The deferred sources may be referenced for public inspiration or future research, but they are **not part of the first-pass code-reading workload**.

---

## 3. Non-goals

This document does **not** authorize:

* importing OSS code directly into Konnaxion;
* creating new top-level apps for external tools;
* replacing existing `/ethikos/*` routes;
* replacing existing `/api/ethikos/*` endpoints;
* creating a separate Kialo module;
* creating a separate Loomio, Decidim, CONSUL, Citizen OS, or DemocracyOS module;
* writing implementation tasks before the code-reading report is complete;
* rewriting Konnaxion around the architecture of an external project;
* adding GraphQL, WebSocket, Rails, Node, or other foreign stack assumptions into Konnaxion unless explicitly approved in a later ADR.

---

## 4. Canonical variables used

```yaml id="bzihmt"
DOCUMENT_ID: "19_OSS_CODE_READING_PLAN.md"

KINTSUGI:
  UPDATE_TYPE: "documentation-first architecture upgrade"
  IMPLEMENTATION_STYLE: "partial native mimic"
  FULL_EXTERNAL_MERGE_ALLOWED: false
  ANNEX_FIRST_PASS_ALLOWED: false
  DOCS_BEFORE_CODE: true
  CODE_READING_BEFORE_BACKLOG: true

PRIMARY_ROUTE_SURFACE: "/ethikos/*"

CURRENT_ETHIKOS_ROUTES:
  DECIDE: "/ethikos/decide/*"
  DELIBERATE: "/ethikos/deliberate/*"
  TRUST: "/ethikos/trust/*"
  PULSE: "/ethikos/pulse/*"
  IMPACT: "/ethikos/impact/*"
  LEARN: "/ethikos/learn/*"
  INSIGHTS: "/ethikos/insights"
  ADMIN: "/ethikos/admin/*"

CURRENT_ETHIKOS_BACKEND:
  APP: "konnaxion.ethikos"
  API_TOPICS: "/api/ethikos/topics/"
  API_STANCES: "/api/ethikos/stances/"
  API_ARGUMENTS: "/api/ethikos/arguments/"
  API_CATEGORIES: "/api/ethikos/categories/"
  COMPAT_ALIASES:
    - "/api/deliberate/..."
    - "/api/deliberate/elite/..."

CURRENT_ETHIKOS_MODELS:
  - "EthikosCategory"
  - "EthikosTopic"
  - "EthikosStance"
  - "EthikosArgument"

DEFAULT_EXTERNAL_TOOL_STRATEGY: "mimic"

ANNEX_REQUIREMENTS:
  ISOLATED: true
  REPLACEABLE: true
  NO_CORE_TABLE_WRITES: true
  LICENSE_CLEARANCE_REQUIRED: true
  ADAPTER_LAYER_REQUIRED: true

FORBIDDEN_FIRST_PASS:
  FULL_CODE_IMPORT: true
  DIRECT_DB_WRITES_FROM_EXTERNAL_TOOLS: true
  ROUTE_REPLACEMENT: true
  NEW_TOP_LEVEL_FOREIGN_APP: true
```

---

## 5. Source basis

This plan is grounded in the following project facts:

1. The clean-slate Kintsugi plan requires documentation first, then OSS code inspection, then implementation backlog. 

2. The current ethiKos implementation already has first-class route families under `/ethikos/*`, including Decide, Deliberate, Trust, Pulse, Impact, Learn, Insights, and Admin. 

3. The current canonical ethiKos backend is centered on `EthikosTopic`, `EthikosStance`, `EthikosArgument`, and `EthikosCategory`, exposed through `/api/ethikos/topics/`, `/stances/`, `/arguments/`, and `/categories/`. 

4. Konnaxion uses a Next.js App Router frontend and a Django modular monolith backend with REST APIs exposed through DRF under `/api/...`. 

5. External tools must be treated as inspiration sources. The Kintsugi strategy explicitly rejects blind merging and requires either native mimicry or isolated sidecar boundaries. 

6. The Kialo corpus adds specific structured-deliberation concepts such as sources, single-thesis vs multi-thesis topology, perspectives, background info, lifecycle controls, and small-group modes.    

---

## 6. Reading discipline

OSS code reading must follow a strict sequence.

```yaml id="d01hmh"
CODE_READING_SEQUENCE:
  1: "Confirm repository identity"
  2: "Confirm license"
  3: "Confirm stack"
  4: "Map application boundaries"
  5: "Identify data models"
  6: "Identify route/controller/API patterns"
  7: "Identify frontend UX patterns"
  8: "Identify permissions and roles"
  9: "Identify audit/moderation/accountability patterns"
  10: "Extract mimic candidates"
  11: "Reject incompatible patterns"
  12: "Map useful patterns to existing Ethikos route families"
  13: "Produce code-reading report"
  14: "Only then feed implementation backlog"
```

The reader must not jump directly from an OSS feature to a Konnaxion task.

Every pattern must pass through:

```yaml id="8j2b3p"
PATTERN_FILTER:
  - "Is it real in code?"
  - "Is it useful for Kintsugi?"
  - "Can it be mimicked natively?"
  - "Does it preserve Ethikos ownership boundaries?"
  - "Does it fit existing /ethikos/* routes?"
  - "Does it avoid foreign writes to core tables?"
  - "Does it avoid stack capture?"
  - "Does it require a new model, service, or only UI behavior?"
```

---

## 7. Required output per repository

Each OSS code-reading pass must produce a mini-report with this exact structure.

```markdown id="9j46vo"
# OSS Code Reading Report — <Repository Name>

## 1. Repository identity
- Name:
- Local path:
- Upstream URL:
- License:
- Stack:
- Primary language/framework:
- Runtime requirements:
- Database:
- Frontend framework:
- Backend framework:

## 2. Product role
- What civic problem does it solve?
- Which Kintsugi stage does it resemble?
- Which ethiKos route family could receive its pattern?

## 3. Actual code architecture
- App structure:
- Core modules:
- Important models:
- Important controllers/routes/views:
- Important services/jobs:
- Permission/role system:
- Admin/moderation system:
- Test coverage observed:

## 4. Feature inventory
| Feature | Exists in code? | Location | Notes |
|---|---:|---|---|

## 5. Pattern extraction
| Pattern | Mimic candidate? | Annex candidate? | Reject? | Reason |
|---|---:|---:|---:|---|

## 6. Konnaxion mapping
| OSS concept | Ethikos/Konnaxion concept | Route family | Backend owner | Data impact |
|---|---|---|---|---|

## 7. Risks
- License risk:
- Stack mismatch:
- Data ownership risk:
- UX dominance risk:
- Security/privacy risk:
- Migration risk:
- Maintenance risk:

## 8. Decision
- Recommendation: mimic / defer / annex-later / reject
- First-pass priority: high / medium / low / none
- Required Kintsugi docs to update:
- Required ADR if any:

## 9. Evidence
- Files inspected:
- Models inspected:
- Routes inspected:
- Components inspected:
- Tests inspected:
```

---

## 8. Repository reading checklist

Every repository must be inspected against the same checklist.

```yaml id="r56tx9"
REPO_READING_CHECKLIST:
  IDENTITY:
    - "README"
    - "license file"
    - "package manager / dependency file"
    - "deployment files"
    - "documentation index"

  STACK:
    - "frontend framework"
    - "backend framework"
    - "database"
    - "job queue"
    - "auth system"
    - "API style"

  DOMAIN:
    - "core civic entities"
    - "proposal/debate/topic models"
    - "vote/stance models"
    - "comment/argument models"
    - "draft/document models"
    - "process/phase models"
    - "accountability/outcome models"

  INTEGRATION:
    - "API routes"
    - "service layer"
    - "adapters"
    - "webhooks"
    - "exports/imports"
    - "background jobs"

  GOVERNANCE:
    - "roles"
    - "permissions"
    - "moderation"
    - "audit logs"
    - "privacy/confidentiality"
    - "anonymity"

  TESTING:
    - "unit tests"
    - "integration tests"
    - "e2e tests"
    - "fixtures"
    - "seed data"

  EXTRACTABILITY:
    - "standalone pattern"
    - "deeply coupled pattern"
    - "license-sensitive pattern"
    - "too stack-specific"
    - "safe to mimic in Ethikos"
```

---

## 9. Evaluation rubric

Each discovered pattern must be scored.

```yaml id="b6op6b"
PATTERN_SCORE:
  PRODUCT_FIT:
    0: "not relevant"
    1: "interesting but weak fit"
    2: "useful"
    3: "strong fit"
    4: "core Kintsugi fit"

  ARCHITECTURE_FIT:
    0: "conflicts with Konnaxion"
    1: "requires major rewrite"
    2: "requires significant adaptation"
    3: "fits with modest adaptation"
    4: "fits natively"

  IMPLEMENTATION_COST:
    0: "not implementable"
    1: "high cost"
    2: "medium cost"
    3: "low cost"
    4: "configuration/UI only"

  RISK:
    0: "unacceptable"
    1: "high risk"
    2: "medium risk"
    3: "low risk"
    4: "minimal risk"

  FIRST_PASS_PRIORITY:
    0: "reject"
    1: "defer"
    2: "consider"
    3: "include if easy"
    4: "include"
```

A first-pass mimic candidate should normally score:

```yaml id="tsex46"
FIRST_PASS_MINIMUM:
  PRODUCT_FIT: ">= 3"
  ARCHITECTURE_FIT: ">= 3"
  IMPLEMENTATION_COST: ">= 2"
  RISK: ">= 3"
```

---

## 10. First-pass source plans

## 10.1 Consider.it

```yaml id="w7v4fg"
SOURCE:
  NAME: "Consider.it"
  FIRST_PASS_STATUS: "mimic"
  PRIMARY_KINTSUGI_STAGE: "Stage 2 — Deliberation"
  PRIMARY_ROUTE_TARGET: "/ethikos/deliberate/*"
  SECONDARY_ROUTE_TARGETS:
    - "/ethikos/pulse/*"
    - "/ethikos/insights"
  EXPECTED_PATTERN:
    - "reason capture"
    - "pro/con deliberation compression"
    - "structured rationale summaries"
    - "opinion positioning if present"
```

### Reading goals

Inspect Consider.it for:

* how pro/con reasons are represented;
* whether reasons are separate from votes;
* whether it supports stance positioning;
* how arguments/reasons are clustered or summarized;
* whether participants can compare their position to others;
* what moderation or admin primitives exist;
* whether there are exportable decision artifacts.

### Konnaxion mapping

```yaml id="x4q98a"
CONSIDER_IT_MAPPING:
  reason: "EthikosArgument"
  pro_con_side: "EthikosArgument.side"
  stance_position: "EthikosStance"
  reason_cluster: "ArgumentGraph / future summary artifact"
  route_target: "/ethikos/deliberate/[topic]"
```

### First-pass likely mimic

```yaml id="u9jujl"
FIRST_PASS_MIMIC:
  - "clearer pro/con reason capture"
  - "argument compression panel"
  - "reason summary by stance bucket"
  - "participant-position context if simple"
```

### Defer

```yaml id="hvm0cm"
DEFER:
  - "full opinion-map engine"
  - "complex clustering"
  - "direct external code reuse"
```

---

## 10.2 Kialo-style argument mapping

```yaml id="5aps0h"
SOURCE:
  NAME: "Kialo-style argument mapping"
  FIRST_PASS_STATUS: "mimic"
  PRIMARY_KINTSUGI_STAGE: "Stage 2 — Deliberation"
  PRIMARY_ROUTE_TARGET: "/ethikos/deliberate/[topic]"
  EXPECTED_PATTERN:
    - "thesis"
    - "claim"
    - "pro/con edge"
    - "sources"
    - "impact voting"
    - "discussion topology"
    - "roles"
    - "visibility"
    - "perspectives"
```

Kialo is the canonical first-pass structured deliberation reference for Korum. Its documentation contains explicit patterns for discussion topology, sources, background information, perspectives, scheduled start/stop windows, and small-group controls.    

### Reading goals

Inspect Kialo-style source material for:

* single-thesis vs multi-thesis topology;
* claim creation;
* pro/con relation semantics;
* source/citation attachment;
* discussion-level source views;
* impact vote semantics;
* anonymous discussions;
* author visibility;
* vote visibility;
* participant roles;
* suggested claims;
* perspectives;
* templates;
* small groups;
* discussion lifecycle start/stop;
* export behavior.

### Konnaxion mapping

```yaml id="4g8ydk"
KIALO_MAPPING:
  Discussion: "EthikosTopic"
  Thesis: "EthikosTopic.title + description / future thesis field"
  Claim: "EthikosArgument"
  ProConEdge: "EthikosArgument.parent + EthikosArgument.side"
  Source: "ArgumentSource"
  ImpactVote: "ArgumentImpactVote"
  SuggestedClaim: "ArgumentSuggestion"
  Perspective: "DiscussionPerspective / Smart Vote lens depending context"
  ParticipantRole: "DiscussionParticipantRole"
```

### First-pass likely mimic

```yaml id="28esp2"
FIRST_PASS_MIMIC:
  - "argument tree using current EthikosArgument.parent"
  - "pro/con/neutral side enforcement"
  - "claim source attachment"
  - "discussion-level sources panel"
  - "claim impact vote separated from EthikosStance"
  - "suggested claims queue"
  - "basic participant role settings"
  - "background info block"
  - "single-thesis default"
```

### Defer

```yaml id="wsyspg"
DEFER:
  - "small group mode"
  - "sunburst minimap"
  - "clone-from-template"
  - "custom perspectives"
  - "discussion export"
  - "move/link claim between discussions"
```

### Hard anti-drift rules

```yaml id="0dql4d"
KIALO_FORBIDDEN:
  - "Do not rename EthikosArgument to Claim."
  - "Do not create a new Kialo app."
  - "Do not create /kialo routes."
  - "Do not treat Kialo impact votes as Ethikos stances."
  - "Do not treat Kialo impact votes as Smart Vote ballots."
```

---

## 10.3 Loomio

```yaml id="o35q1d"
SOURCE:
  NAME: "Loomio"
  FIRST_PASS_STATUS: "mimic"
  PRIMARY_KINTSUGI_STAGE: "Stage 4 — Decision"
  PRIMARY_ROUTE_TARGET: "/ethikos/decide/*"
  SECONDARY_ROUTE_TARGETS:
    - "/ethikos/admin/*"
    - "/ethikos/learn/*"
  EXPECTED_PATTERN:
    - "proposal lifecycle"
    - "decision protocol"
    - "timeboxed decision"
    - "outcome publication"
    - "participant notification"
```

The currently available Loomio documentation focuses on authentication and account linking, so code-reading must go beyond docs and inspect actual proposal, poll, outcome, group, and permission implementation if present. 

### Reading goals

Inspect Loomio for:

* proposal models;
* poll/vote models;
* decision closing behavior;
* outcome publishing;
* group permissions;
* notification triggers;
* timeboxed participation;
* discussion-to-decision transition;
* reason/comment capture around decisions.

### Konnaxion mapping

```yaml id="ttghpi"
LOOMIO_MAPPING:
  group: "Ethikos participation context / future consultation group"
  proposal: "DecisionRecord"
  poll: "DecisionProtocol instance"
  vote: "BallotEvent or Smart Vote Vote depending context"
  outcome: "DecisionRecord.published_outcome"
  closing_at: "DecisionRecord.closes_at"
```

### First-pass likely mimic

```yaml id="z9rd0z"
FIRST_PASS_MIMIC:
  - "decision lifecycle states"
  - "proposal open/close window"
  - "outcome summary"
  - "decision protocol vocabulary"
  - "result publishing pattern"
```

### Defer

```yaml id="coueh7"
DEFER:
  - "full Loomio group model"
  - "email/code auth patterns"
  - "OAuth/SSO account-linking logic"
  - "native Loomio notifications"
```

---

## 10.4 Citizen OS

```yaml id="ba8hio"
SOURCE:
  NAME: "Citizen OS"
  FIRST_PASS_STATUS: "mimic"
  PRIMARY_KINTSUGI_STAGE: "Stage 3 — Drafting"
  PRIMARY_ROUTE_TARGET: "/ethikos/decide/* or future bounded drafting surface"
  SECONDARY_ROUTE_TARGETS:
    - "/ethikos/deliberate/*"
    - "/ethikos/impact/*"
  EXPECTED_PATTERN:
    - "collaborative drafting"
    - "topic phases"
    - "document editing"
    - "versioning"
    - "signing/voting transition"
```

Citizen OS documentation indicates a separated architecture with frontend, API, and Etherpad integration, which makes direct first-pass integration inappropriate. The first pass should mimic drafting patterns, not import infrastructure. 

### Reading goals

Inspect Citizen OS for:

* topic lifecycle states;
* draft/document models;
* versioning patterns;
* comments around text;
* editing permissions;
* transition from discussion to vote;
* Etherpad integration boundaries;
* exports;
* user roles and groups.

### Konnaxion mapping

```yaml id="5h4rl5"
CITIZEN_OS_MAPPING:
  Topic: "EthikosTopic / Consultation"
  DraftDocument: "Draft"
  DraftVersion: "DraftVersion"
  TextProposal: "Amendment"
  VotePhase: "DecisionRecord"
  Comment: "EthikosArgument or DraftComment depending scope"
```

### First-pass likely mimic

```yaml id="fujqbe"
FIRST_PASS_MIMIC:
  - "Draft"
  - "DraftVersion"
  - "Amendment"
  - "RationalePacket"
  - "transition from deliberation to draft to decision"
```

### Defer

```yaml id="9kc77l"
DEFER:
  - "Etherpad integration"
  - "real-time collaborative editing"
  - "full Citizen OS API compatibility"
  - "document signing infrastructure"
```

---

## 10.5 Decidim

```yaml id="q0gf7a"
SOURCE:
  NAME: "Decidim"
  FIRST_PASS_STATUS: "mimic"
  PRIMARY_KINTSUGI_STAGE: "Stage 5 — Process and accountability"
  PRIMARY_ROUTE_TARGET: "/ethikos/impact/*"
  SECONDARY_ROUTE_TARGETS:
    - "/ethikos/admin/*"
    - "/ethikos/pulse/*"
    - "/ethikos/learn/*"
  EXPECTED_PATTERN:
    - "participatory process architecture"
    - "components"
    - "phases"
    - "proposals"
    - "accountability"
    - "admin governance"
```

Decidim’s documentation is developer-oriented and generated through an Antora/AsciiDoc system, with extensive modules beyond the root README. 

### Reading goals

Inspect Decidim for:

* participatory process model;
* component architecture;
* proposals;
* debates;
* meetings;
* consultations;
* surveys;
* accountability components;
* admin permissions;
* audit logs;
* scopes/areas/taxonomies;
* lifecycle phase configuration;
* public result/accountability pages.

### Konnaxion mapping

```yaml id="3thg7x"
DECIDIM_MAPPING:
  ParticipatoryProcess: "Ethikos Process / ConsultationProcess"
  Phase: "ProcessPhase"
  Proposal: "DecisionRecord or Draft depending stage"
  AccountabilityResult: "ImpactTrack"
  AdminPermission: "Ethikos admin role"
  Taxonomy: "EthikosCategory / TopicTag"
```

### First-pass likely mimic

```yaml id="6y0qnx"
FIRST_PASS_MIMIC:
  - "process phases"
  - "accountability tracker"
  - "public milestone/status view"
  - "admin process controls"
  - "taxonomy-aware process grouping"
```

### Defer

```yaml id="hdwa84"
DEFER:
  - "full component marketplace"
  - "full Decidim admin architecture"
  - "direct GraphQL/API compatibility"
  - "full participatory-space abstraction"
```

---

## 10.6 CONSUL Democracy

```yaml id="nr6atv"
SOURCE:
  NAME: "CONSUL Democracy"
  FIRST_PASS_STATUS: "mimic"
  PRIMARY_KINTSUGI_STAGE: "Stage 4/5 — Decision and accountability"
  PRIMARY_ROUTE_TARGET: "/ethikos/decide/*"
  SECONDARY_ROUTE_TARGETS:
    - "/ethikos/admin/*"
    - "/ethikos/impact/*"
  EXPECTED_PATTERN:
    - "proposal thresholds"
    - "eligibility"
    - "census"
    - "participatory budgeting concepts"
    - "admin customization"
```

CONSUL documentation includes customization surfaces for controllers, components, models, routes, CSS, tests, and translations, which suggests strong platform-level coupling; first pass should mimic policy patterns, not stack structure. 

### Reading goals

Inspect CONSUL for:

* proposal model;
* support/endorsement thresholds;
* voting eligibility;
* census integration;
* budget allocation;
* admin controls;
* moderation;
* result publication;
* accountability tracking;
* customization extension points.

### Konnaxion mapping

```yaml id="weqi5e"
CONSUL_MAPPING:
  Proposal: "DecisionRecord"
  SupportThreshold: "EligibilityRule / DecisionProtocol.threshold"
  CensusEligibility: "EligibilityRule"
  BudgetVote: "Future decision modality"
  ResultPublication: "ReadingResult / DecisionRecord outcome"
  Accountability: "ImpactTrack"
```

### First-pass likely mimic

```yaml id="g3afep"
FIRST_PASS_MIMIC:
  - "eligibility rules"
  - "proposal thresholds"
  - "public participation gates"
  - "support count / threshold display"
  - "accountability-style status"
```

### Defer

```yaml id="zz6xco"
DEFER:
  - "full participatory budgeting"
  - "census integration"
  - "Rails customization pattern"
  - "direct CONSUL route/controller model"
```

---

## 10.7 DemocracyOS

```yaml id="avlmda"
SOURCE:
  NAME: "DemocracyOS"
  FIRST_PASS_STATUS: "mimic"
  PRIMARY_KINTSUGI_STAGE: "Stage 2/4 — Deliberation and decision"
  PRIMARY_ROUTE_TARGET: "/ethikos/decide/*"
  SECONDARY_ROUTE_TARGETS:
    - "/ethikos/deliberate/*"
    - "/ethikos/admin/*"
  EXPECTED_PATTERN:
    - "proposal-centric policy debate"
    - "forum/topic organization"
    - "commentary around proposals"
    - "roles and permissions"
    - "visibility configuration"
```

DemocracyOS documentation includes configuration and install docs, suggesting that code-reading should focus on proposal, topic, forum, role, and permission models rather than operational setup. 

### Reading goals

Inspect DemocracyOS for:

* proposal/topic models;
* forum or space models;
* discussion/comment models;
* vote behavior;
* role/permission settings;
* visibility settings;
* tags/categories;
* admin configuration;
* notification and activity patterns.

### Konnaxion mapping

```yaml id="3ew1k3"
DEMOCRACY_OS_MAPPING:
  Proposal: "DecisionRecord"
  Forum: "Ethikos process or category context"
  Topic: "EthikosTopic"
  Comment: "EthikosArgument"
  Vote: "BallotEvent or Smart Vote Vote depending decision context"
  Visibility: "DiscussionVisibilitySetting"
```

### First-pass likely mimic

```yaml id="0vck29"
FIRST_PASS_MIMIC:
  - "proposal-centric debate page"
  - "clear proposal status"
  - "discussion attached to policy/proposal"
  - "visibility/role controls"
```

### Defer

```yaml id="itdnht"
DEFER:
  - "full DemocracyOS configuration model"
  - "foreign forum architecture"
  - "direct Mongo/Node assumptions"
```

---

## 11. Deferred source policy

The following sources are not part of first-pass code reading.

```yaml id="blcznk"
DEFERRED_SOURCE_POLICY:
  Polis:
    status: "deferred_public_credit_only"
    reason: "valuable consensus/opinion mapping, but not first-pass scope"
  LiquidFeedback:
    status: "deferred_public_credit_only"
    reason: "delegation/governance math too complex for first pass"
  All_Our_Ideas:
    status: "deferred"
    reason: "pairwise ranking not required in first-pass Kintsugi"
  Your_Priorities:
    status: "deferred"
    reason: "idea intake/prioritization later"
  OpenSlides:
    status: "deferred_possible_future_annex"
    reason: "assembly/parliament mode is outside first-pass Ethikos route upgrade"
```

If a future reader inspects these anyway, the result must be stored in a future research note, not folded into first-pass Kintsugi backlog.

---

## 12. Cross-source comparison matrix

After all first-pass repos are read, produce a comparison table.

```markdown id="m66jcf"
| Source | Real code feature | Useful pattern | Route target | Data target | Mimic now | Defer | Reject | Notes |
|---|---|---|---|---|---:|---:|---:|---|
| Consider.it | | | /ethikos/deliberate/* | EthikosArgument | | | | |
| Kialo-style | | | /ethikos/deliberate/* | EthikosArgument + extensions | | | | |
| Loomio | | | /ethikos/decide/* | DecisionRecord | | | | |
| Citizen OS | | | Drafting / Decide | Draft / Amendment | | | | |
| Decidim | | | /ethikos/impact/* | ProcessPhase / ImpactTrack | | | | |
| CONSUL Democracy | | | /ethikos/decide/* | EligibilityRule / DecisionProtocol | | | | |
| DemocracyOS | | | /ethikos/decide/* | DecisionRecord / EthikosArgument | | | | |
```

---

## 13. Required final OSS reading deliverables

The OSS code-reading phase must produce these outputs before implementation backlog generation.

```yaml id="6ongkh"
REQUIRED_DELIVERABLES:
  - "OSS_READING_REPORT_CONSIDER_IT.md"
  - "OSS_READING_REPORT_KIALO_STYLE.md"
  - "OSS_READING_REPORT_LOOMIO.md"
  - "OSS_READING_REPORT_CITIZEN_OS.md"
  - "OSS_READING_REPORT_DECIDIM.md"
  - "OSS_READING_REPORT_CONSUL_DEMOCRACY.md"
  - "OSS_READING_REPORT_DEMOCRACY_OS.md"
  - "OSS_CROSS_SOURCE_COMPARISON.md"
  - "OSS_PATTERN_TO_ETHIKOS_ROUTE_MAPPING.md"
  - "OSS_RISK_AND_LICENSE_NOTES.md"
```

These are working reports, not permanent Kintsugi pack files unless promoted later.

---

## 14. Evidence rules

Every OSS code-reading report must cite concrete evidence.

```yaml id="l5i90p"
EVIDENCE_REQUIRED:
  - "file path inspected"
  - "model/entity file path"
  - "controller/view/route file path"
  - "frontend component file path"
  - "test file path if available"
  - "configuration file path"
  - "license file path"
```

Forbidden evidence style:

```yaml id="6gf6lq"
FORBIDDEN_EVIDENCE:
  - "The docs say it has X, so code must have X."
  - "The product is known for X, so implement X."
  - "This seems similar to Konnaxion, so merge it."
  - "The README implies a feature, so assume its data model."
```

Correct evidence style:

```yaml id="4od0tb"
CORRECT_EVIDENCE:
  - "Feature found in model file X and controller Y."
  - "Docs mention feature, but code path not found."
  - "Code implements feature, but stack coupling is too high."
  - "Pattern is useful, but must be mimicked as native Ethikos data."
```

---

## 15. License and dependency review

Before any pattern is promoted to implementation backlog, record:

```yaml id="nbss53"
LICENSE_REVIEW_FIELDS:
  repository_name: ""
  license_detected: ""
  license_file_path: ""
  copyleft_risk: "none | low | medium | high | unknown"
  attribution_required: "yes | no | unknown"
  code_reuse_allowed: "yes | no | unknown"
  mimic_allowed: "yes | no | unknown"
  notes: ""
```

First-pass Kintsugi assumes:

```yaml id="wmz27h"
LICENSE_POLICY:
  DIRECT_CODE_REUSE_DEFAULT: false
  PRODUCT_PATTERN_MIMIC_DEFAULT: true
  ATTRIBUTION_REQUIRED_IN_PUBLIC_CREDIT: true
  LEGAL_REVIEW_REQUIRED_FOR_IMPORT: true
```

---

## 16. Stack compatibility review

Each repo must be classified by stack compatibility.

```yaml id="xti57y"
STACK_COMPATIBILITY_LEVELS:
  native_fit:
    description: "Pattern fits Konnaxion's Next.js + Django/DRF architecture."
  mimic_fit:
    description: "Pattern useful but source stack differs; mimic natively."
  adapter_fit_later:
    description: "Could become a sidecar or adapter later."
  reject:
    description: "Stack or architecture conflicts with Konnaxion goals."
```

Expected defaults:

```yaml id="xebkpd"
EXPECTED_STACK_DEFAULTS:
  ConsiderIt: "mimic_fit"
  KialoStyle: "mimic_fit"
  Loomio: "mimic_fit"
  CitizenOS: "mimic_fit"
  Decidim: "mimic_fit"
  CONSULDemocracy: "mimic_fit"
  DemocracyOS: "mimic_fit"
```

---

## 17. Route-mapping discipline

All useful patterns must map to existing ethiKos route families.

The current route structure is already explicit and should not be replaced by older simplified `/debate`, `/consult`, or `/reputation` concepts. 

```yaml id="4glwgq"
ROUTE_MAPPING_RULES:
  ConsiderIt:
    primary: "/ethikos/deliberate/*"
  KialoStyle:
    primary: "/ethikos/deliberate/*"
  Loomio:
    primary: "/ethikos/decide/*"
  CitizenOS:
    primary: "/ethikos/decide/*"
    possible_future: "/ethikos/draft/* only if separately approved"
  Decidim:
    primary: "/ethikos/impact/*"
    secondary: "/ethikos/admin/*"
  CONSULDemocracy:
    primary: "/ethikos/decide/*"
    secondary: "/ethikos/admin/*"
  DemocracyOS:
    primary: "/ethikos/decide/*"
    secondary: "/ethikos/deliberate/*"
```

Forbidden:

```yaml id="2cs3qk"
FORBIDDEN_ROUTE_OUTPUTS:
  - "/kialo"
  - "/loomio"
  - "/decidim"
  - "/consul"
  - "/democracyos"
  - "/kintsugi as separate product app"
  - "/api/deliberation/..."
```

---

## 18. Backend-mapping discipline

The current Konnaxion backend is a Django modular monolith with DRF under `/api/...`; this must remain the implementation reality. 

```yaml id="xxm30m"
BACKEND_MAPPING_RULES:
  KORUM_PATTERNS:
    target_app: "konnaxion.ethikos"
    allowed_current_models:
      - "EthikosTopic"
      - "EthikosStance"
      - "EthikosArgument"
      - "EthikosCategory"

  DECISION_PATTERNS:
    target_app: "konnaxion.ethikos or kollective_intelligence depending exact ownership"
    proposed_models:
      - "DecisionProtocol"
      - "DecisionRecord"
      - "EligibilityRule"

  READING_PATTERNS:
    target_app: "konnaxion.kollective_intelligence / Smart Vote layer"
    proposed_models:
      - "LensDeclaration"
      - "ReadingResult"

  DRAFTING_PATTERNS:
    target_app: "konnaxion.ethikos"
    proposed_models:
      - "Draft"
      - "DraftVersion"
      - "Amendment"
      - "RationalePacket"

  IMPACT_PATTERNS:
    target_app: "konnaxion.ethikos / Konsultations ownership"
    proposed_models:
      - "ImpactTrack"
      - "ImpactUpdate"
```

Forbidden:

```yaml id="d0onjs"
FORBIDDEN_BACKEND_OUTPUTS:
  - "Create konnaxion.kialo"
  - "Create konnaxion.loomio"
  - "Create konnaxion.decidim"
  - "Create Rails sidecar in first pass"
  - "Create Node/Mongo dependency in first pass"
  - "Let external tool write directly to Ethikos core tables"
```

---

## 19. Frontend-mapping discipline

The Konnaxion frontend uses a shared shell, Ant Design, and module-specific page shells. Module pages plug into the global shell rather than acting as separate top-level apps. 

```yaml id="7ynyr4"
FRONTEND_MAPPING_RULES:
  USE_EXISTING_SHELL: true
  USE_ETHIKOS_PAGE_SHELL: true
  USE_PAGE_CONTAINER: true
  USE_SERVICES_LAYER: true
  RAW_FETCH_IN_COMPONENTS: "avoid"
  NEW_TOP_LEVEL_FOREIGN_UI: false
```

Every UI pattern found in OSS must be translated into one of:

```yaml id="gbszt3"
ETHIKOS_UI_TARGETS:
  - "Deliberate topic page"
  - "Argument tree component"
  - "Sources panel"
  - "Decision workflow card"
  - "Decision result view"
  - "Impact tracker"
  - "Admin moderation/audit view"
  - "Insights analytics panel"
  - "Learn/methodology explanation"
```

---

## 20. Security, privacy, and governance review

Every repo must be checked for governance-relevant behavior.

```yaml id="a9i4gr"
SECURITY_PRIVACY_GOVERNANCE_CHECKLIST:
  - "authentication model"
  - "authorization model"
  - "role hierarchy"
  - "anonymous or pseudonymous participation"
  - "author visibility"
  - "vote visibility"
  - "moderation workflow"
  - "audit logs"
  - "export behavior"
  - "personal data exposure"
  - "admin override capabilities"
```

For Kintsugi, these are especially important:

```yaml id="xjov9r"
KINTSUGI_SENSITIVE_AREAS:
  - "anonymous deliberation"
  - "expertise-weighted voting"
  - "EkoH score exposure"
  - "moderator identity visibility"
  - "suggested claim approval"
  - "result publication"
  - "source/evidence export"
```

---

## 21. Code-reading order

Use this exact order.

```yaml id="y1y3ft"
RECOMMENDED_READING_ORDER:
  1:
    source: "Kialo-style"
    reason: "Defines the strongest Korum / Deliberate contract."
  2:
    source: "Consider.it"
    reason: "Complements Kialo with reason capture and deliberation compression."
  3:
    source: "Loomio"
    reason: "Clarifies proposal lifecycle and decision protocols."
  4:
    source: "Citizen OS"
    reason: "Clarifies drafting/versioning patterns."
  5:
    source: "Decidim"
    reason: "Clarifies process/accountability architecture."
  6:
    source: "CONSUL Democracy"
    reason: "Clarifies eligibility and threshold mechanics."
  7:
    source: "DemocracyOS"
    reason: "Clarifies proposal-centric policy debate."
```

---

## 22. Promotion rule: from code-reading to backlog

A pattern can enter the implementation backlog only if all conditions are true.

```yaml id="8s1qwc"
PROMOTION_CONDITIONS:
  - "The pattern exists in code or is clearly documented as a product behavior."
  - "The pattern maps to an existing Ethikos route family."
  - "The pattern does not require full external merge."
  - "The pattern can be implemented natively in Konnaxion."
  - "The ownership boundary is clear."
  - "The data model impact is known."
  - "The API/service impact is known."
  - "The test impact is known."
  - "The risk level is acceptable."
  - "The relevant Kintsugi doc is updated or referenced."
```

A pattern must be rejected or deferred if:

```yaml id="dhicf2"
DEFER_OR_REJECT_WHEN:
  - "It requires replacing Ethikos route families."
  - "It requires direct foreign DB writes."
  - "It requires importing a large external stack."
  - "It conflicts with Korum/Konsultations/Smart Vote/EkoH ownership."
  - "It duplicates an existing Konnaxion capability."
  - "It depends on deferred sources."
  - "It cannot be tested safely in the current stack."
```

---

## 23. Anti-drift rules

```yaml id="vyz4ww"
ANTI_DRIFT_RULES:
  - "Do not inspect OSS code before the Kintsugi documentation contracts are stable."
  - "Do not convert repo findings directly into implementation tasks."
  - "Do not assume README/product claims equal implemented code."
  - "Do not import external code in first pass."
  - "Do not create foreign route families."
  - "Do not create foreign Django apps for first-pass mimic."
  - "Do not replace /ethikos/* with OSS-native navigation."
  - "Do not replace /api/ethikos/* with invented endpoints."
  - "Do not expand /api/home/* usage."
  - "Do not treat deferred sources as first-pass."
  - "Do not let a powerful OSS architecture dominate Konnaxion architecture."
  - "Do not mix product strategy, code-reading, and implementation backlog in the same artifact."
```

---

## 24. Acceptance checklist

This document is satisfied when the OSS code-reading phase can produce:

```yaml id="nrl3hi"
ACCEPTANCE_CHECKLIST:
  per_repo_reports:
    - "Each first-pass source has a code-reading report."
    - "Each report identifies stack, license, core models, routes, and permissions."
    - "Each report distinguishes code reality from product idea."
    - "Each report maps patterns to /ethikos/* route families."
    - "Each report recommends mimic, defer, annex-later, or reject."

  cross_source_outputs:
    - "A cross-source comparison matrix exists."
    - "A pattern-to-route mapping exists."
    - "A risk/license note exists."
    - "Deferred sources remain deferred."

  drift_control:
    - "No full merge is recommended."
    - "No external route family is created."
    - "No external app is created for first pass."
    - "No implementation backlog is generated before reading reports."
```

---

## 25. Related documents

```yaml id="npx7yx"
RELATED_DOCS:
  - "00_KINTSUGI_START_HERE.md"
  - "01_ETHIKOS_KINTSUGI_EXECUTION_STRATEGY.md"
  - "02_SOURCE_OF_TRUTH_AND_DRIFT_CONTROL.md"
  - "03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md"
  - "04_CANONICAL_NAMING_AND_VARIABLES.md"
  - "05_CURRENT_STATE_BASELINE.md"
  - "06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md"
  - "07_API_AND_SERVICE_CONTRACTS.md"
  - "08_DATA_MODEL_AND_MIGRATION_PLAN.md"
  - "10_FIRST_PASS_INTEGRATION_MATRIX.md"
  - "11_MIMIC_VS_ANNEX_RULEBOOK.md"
  - "14_FRONTEND_ALIGNMENT_CONTRACT.md"
  - "15_BACKEND_ALIGNMENT_CONTRACT.md"
  - "18_ADR_REGISTER.md"
  - "20_AI_GENERATION_GUARDRAILS.md"
  - "21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md"
  - "22_IMPLEMENTATION_BACKLOG_TEMPLATE.md"
```

---

## 26. Final normative summary

```yaml id="qkpp80"
FINAL_CONTRACT:
  OSS_CODE_READING_PURPOSE: "extract patterns, not import systems"
  FIRST_PASS_STRATEGY: "native mimic"
  FULL_MERGE_ALLOWED: false
  ANNEX_FIRST_PASS_ALLOWED: false
  PRIMARY_ROUTE_SURFACE: "/ethikos/*"
  PRIMARY_BACKEND_STYLE: "Django REST Framework under /api/..."
  PRIMARY_FRONTEND_STYLE: "Next.js App Router inside shared Konnaxion shell"
  FIRST_PASS_SOURCES:
    - "Consider.it"
    - "Kialo-style argument mapping"
    - "Loomio"
    - "Citizen OS"
    - "Decidim"
    - "CONSUL Democracy"
    - "DemocracyOS"
  DEFERRED_SOURCES:
    - "Polis"
    - "LiquidFeedback"
    - "All Our Ideas"
    - "Your Priorities"
    - "OpenSlides"
  OUTPUT_BEFORE_BACKLOG:
    - "per-repo reading reports"
    - "cross-source comparison"
    - "pattern-to-route mapping"
    - "risk/license notes"
```
