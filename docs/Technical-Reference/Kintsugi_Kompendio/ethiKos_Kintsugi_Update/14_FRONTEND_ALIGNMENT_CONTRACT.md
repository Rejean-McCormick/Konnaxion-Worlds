# 14 — Frontend Alignment Contract

**Document ID:** `14_FRONTEND_ALIGNMENT_CONTRACT.md`  
**Pack:** ethiKos Kintsugi Update Documentation Pack  
**Status:** Frontend contract  
**Last aligned:** 2026-04-25  
**Primary purpose:** prevent frontend drift during the ethiKos Kintsugi upgrade.

---

## 1. Purpose

This document defines the frontend alignment rules for the ethiKos Kintsugi upgrade.

It fixes how Kintsugi work must fit into the existing Konnaxion frontend architecture:

- the existing `/ethikos/*` route family remains canonical;
- the existing global layout remains canonical;
- the existing `EthikosPageShell` remains the module page wrapper;
- the existing service layer remains the API access boundary;
- external civic-tech patterns are mimicked inside ethiKos, not imported as separate frontend apps;
- Smart Vote, EkoH, Kialo-style argument mapping, and other Kintsugi patterns must appear through existing route families unless a later ADR approves a new surface.

This document is binding for all frontend implementation planning and AI-generated frontend documentation.

---

## 2. Scope

This contract governs:

- ethiKos frontend routes;
- ethiKos page layout rules;
- module shell usage;
- page shell usage;
- service-layer API access;
- frontend component naming;
- route-family responsibilities;
- Kialo-style frontend surfaces;
- Smart Vote/EkoH frontend boundaries;
- frontend handling of known legacy/loose mappings;
- frontend anti-drift rules.

This contract does **not** define backend models, serializers, migrations, Smart Vote formulas, EkoH scoring logic, or detailed implementation tasks.

Those belong to:

- `08_DATA_MODEL_AND_MIGRATION_PLAN.md`
- `09_SMART_VOTE_EKOH_READING_CONTRACT.md`
- `13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md`
- `15_BACKEND_ALIGNMENT_CONTRACT.md`
- `22_IMPLEMENTATION_BACKLOG_TEMPLATE.md`

---

## 3. Canonical Variables Used

This document depends on the following canonical variables from `04_CANONICAL_NAMING_AND_VARIABLES.md`.

```yaml
FRONTEND:
  FRAMEWORK: "Next.js App Router"
  PRIMARY_ROUTE_SURFACE: "/ethikos/*"
  ETHIKOS_LAYOUT_RULE: "All ethiKos pages remain inside the existing Ethikos/global shell."
  DO_NOT_CREATE_SECOND_SHELL: true
  DO_NOT_CREATE_KIALO_ROUTE_FAMILY: true
  DO_NOT_CREATE_KINTSUGI_TOP_LEVEL_APP: true
  USE_SERVICES_LAYER: true

PRIMARY_DELIBERATION_ROUTE: "/ethikos/deliberate/*"
PRIMARY_DECISION_ROUTE: "/ethikos/decide/*"
PRIMARY_IMPACT_ROUTE: "/ethikos/impact/*"
PRIMARY_ADMIN_ROUTE: "/ethikos/admin/*"
PRIMARY_TRUST_ROUTE: "/ethikos/trust/*"
PRIMARY_PULSE_ROUTE: "/ethikos/pulse/*"
PRIMARY_LEARN_ROUTE: "/ethikos/learn/*"
PRIMARY_INSIGHTS_ROUTE: "/ethikos/insights"

CURRENT_ENDPOINTS_CANONICAL:
  ETHIKOS_TOPICS: "/api/ethikos/topics/"
  ETHIKOS_STANCES: "/api/ethikos/stances/"
  ETHIKOS_ARGUMENTS: "/api/ethikos/arguments/"
  ETHIKOS_CATEGORIES: "/api/ethikos/categories/"
  KOLLECTIVE_VOTES: "/api/kollective/votes/"

LEGACY_OR_PROBLEMATIC_ENDPOINTS:
  API_HOME_PREFIX: "/api/home/*"

KIALO:
  STRATEGY: "native_mimic"
  ROUTE_SCOPE: "/ethikos/deliberate/*"
  BACKEND_SCOPE: "konnaxion.ethikos"
  CREATE_KIALO_BACKEND_APP: false
  CREATE_KIALO_FRONTEND_ROUTE: false
  IMPORT_KIALO_CODE: false
````

---

## 4. Current Frontend Reality

The ethiKos frontend already has a real route surface.

The Kintsugi upgrade MUST target the existing route families:

```txt
/ethikos/decide/*
/ethikos/deliberate/*
/ethikos/trust/*
/ethikos/pulse/*
/ethikos/impact/*
/ethikos/learn/*
/ethikos/insights
/ethikos/admin/*
```

The Kintsugi upgrade MUST NOT replace this surface with older conceptual routes such as:

```txt
/debate
/consult
/reputation
/platforms/konnaxion/ethikos/korum
/platforms/konnaxion/ethikos/konsultations
/platforms/konnaxion/ethikos/kintsugi
```

Those may appear in strategic or public documentation only if clearly marked as conceptual or future-facing.

---

## 5. Frontend Architecture Principles

### 5.1 Preserve the existing shell

All ethiKos pages MUST remain inside the existing Konnaxion global layout and ethiKos module shell.

The implementation contract is:

```txt
App Router route
  -> /ethikos segment layout
    -> MainLayout
      -> ethiKos watermark/context
        -> Ant Design App provider
          -> EthikosPageShell
            -> Page content
```

Do not create:

```txt
KintsugiShell
KialoShell
KorumShell
KonsultationsShell
SmartVoteShell
```

unless a future ADR explicitly approves it.

### 5.2 Preserve the module page wrapper

All ethiKos pages SHOULD use:

```tsx
import EthikosPageShell from '@/app/ethikos/EthikosPageShell';
```

The page shell owns:

* page title;
* subtitle/helper text;
* optional meta title;
* optional section label;
* primary action;
* secondary actions;
* central content width;
* consistent spacing.

Individual pages MUST NOT define their own large competing header outside the shell.

### 5.3 Preserve the service layer

Frontend API access MUST go through service modules.

Allowed pattern:

```txt
page/component -> hook/service -> request helper -> /api/...
```

Forbidden pattern:

```txt
page/component -> raw fetch('/api/...')
```

Raw fetches inside page components are allowed only for explicitly documented legacy exceptions.

### 5.4 Preserve one coherent UX

External civic-tech inspirations MUST be translated into native ethiKos components.

For example:

| Source pattern              | Frontend expression                                                     |
| --------------------------- | ----------------------------------------------------------------------- |
| Kialo argument map          | `ArgumentTreeView` under `/ethikos/deliberate/*`                        |
| Consider.it pro/con reasons | structured reason capture inside Deliberate                             |
| Loomio proposals            | decision protocol UI inside Decide                                      |
| Citizen OS drafting         | draft/versioning UI inside Decide or a bounded ethiKos drafting surface |
| Decidim accountability      | tracker/outcomes UI inside Impact                                       |
| CONSUL thresholds           | eligibility/threshold UI inside Decide/Admin                            |
| DemocracyOS proposal debate | proposal-centric discussion inside Decide/Deliberate                    |

Do not create separate frontend apps for these sources.

---

## 6. Route-Family Contract

## 6.1 Decide

### Canonical route family

```txt
/ethikos/decide/*
```

### Current routes

```txt
/ethikos/decide/elite
/ethikos/decide/public
/ethikos/decide/results
/ethikos/decide/methodology
```

### Kintsugi role

Decide owns the frontend surfaces for:

* decision protocols;
* public ballots;
* elite/expert decision views;
* methodology explanations;
* Smart Vote reading display;
* result publication;
* comparison of baseline vs declared readings.

### Allowed patterns

Decide MAY mimic:

* Loomio proposal lifecycle;
* CONSUL proposal thresholds;
* DemocracyOS proposal-centered debate;
* Smart Vote result publication;
* EkoH-informed reading explanations.

### Required frontend posture

Decide pages MUST distinguish:

```txt
raw stance/ballot
baseline result
Smart Vote reading
EkoH context
```

Decide pages MUST NOT imply that EkoH directly votes.

### Preferred component names

```txt
DecisionProtocolPanel
DecisionRecordCard
PublicBallotPanel
EliteDecisionPanel
ReadingComparisonTable
BaselineResultCard
SmartVoteReadingCard
MethodologyExplainer
EligibilityNotice
```

---

## 6.2 Deliberate

### Canonical route family

```txt
/ethikos/deliberate/*
```

### Current routes

```txt
/ethikos/deliberate/elite
/ethikos/deliberate/[topic]
/ethikos/deliberate/guidelines
```

### Kintsugi role

Deliberate owns Korum’s frontend surfaces:

* topic-level deliberation;
* structured arguments;
* pro/con mapping;
* Kialo-style claim graph;
* Consider.it-style reason capture;
* argument sources;
* claim impact voting;
* suggested claims;
* role-aware discussion controls;
* moderation visibility.

### Kialo-style scope

Kialo-style features MUST live inside `/ethikos/deliberate/*`.

They MUST NOT create:

```txt
/kialo
/ethikos/kialo
/api/kialo
konnaxion.kialo
```

### Required conceptual mapping

```txt
Kialo Discussion -> EthikosTopic
Kialo Claim -> EthikosArgument
Kialo Pro/Con edge -> EthikosArgument.parent + EthikosArgument.side
Kialo Source -> ArgumentSource
Kialo Impact Vote -> ArgumentImpactVote
Kialo Suggested Claim -> ArgumentSuggestion
```

### Required vote separation

Deliberate pages MUST distinguish:

| Concept              |    Range | Meaning                                   |
| -------------------- | -------: | ----------------------------------------- |
| `EthikosStance`      | `-3..+3` | user stance on topic                      |
| `ArgumentImpactVote` |   `0..4` | impact of an argument/claim on its parent |
| `ReadingResult`      | variable | Smart Vote derived reading                |

### Preferred component names

```txt
ArgumentTreeView
ArgumentNodeCard
ArgumentMinimap
ArgumentSourcesPanel
ArgumentImpactVoteControl
GuidedVotingDrawer
SuggestedClaimsPanel
DiscussionSettingsPanel
ParticipantRoleSettings
AnonymousModeBanner
DeliberationGuidelinesPanel
TopicPreviewDrawer
```

### Known issue

The current visible bug:

```txt
BUG_001 = Deliberate preview drawer shows "Preview / No data"
```

This is a targeted bugfix item.

It MUST NOT be used as justification for a route redesign or new data model unless a later investigation proves that a model addition is required.

---

## 6.3 Trust

### Canonical route family

```txt
/ethikos/trust/*
```

### Current routes

```txt
/ethikos/trust/profile
/ethikos/trust/badges
/ethikos/trust/credentials
```

### Kintsugi role

Trust owns frontend visibility for:

* EkoH-informed profile signals;
* expertise credentials;
* ethics/trust markers;
* participation credibility indicators;
* badge or credential display.

### Required boundaries

Trust MAY display EkoH-derived context.

Trust MUST NOT:

* display EkoH as a voting engine;
* imply that expertise automatically overrides baseline votes;
* expose sensitive EkoH details beyond visibility permissions;
* mix private scoring internals into public decision screens without a declared lens or visibility rule.

### Preferred component names

```txt
TrustProfileCard
ExpertiseCredentialList
EthicsContextPanel
BadgeGrid
CohortEligibilityBadge
SnapshotContextNotice
```

---

## 6.4 Pulse

### Canonical route family

```txt
/ethikos/pulse/*
```

### Current routes

```txt
/ethikos/pulse/overview
/ethikos/pulse/live
/ethikos/pulse/health
/ethikos/pulse/trends
```

### Kintsugi role

Pulse owns civic health and live participation signals:

* participation volume;
* topic activity;
* deliberation health;
* argument balance;
* stance distribution;
* trend lines;
* live decision/process state.

### Required boundaries

Pulse MAY aggregate signals from ethiKos, Smart Vote readings, and EkoH context.

Pulse MUST NOT become the source of truth for decisions.

Pulse dashboards are interpretive views, not canonical records.

### Preferred component names

```txt
PulseOverviewDashboard
LiveParticipationPanel
DeliberationHealthCard
TrendLineChart
ArgumentBalanceMeter
StanceDistributionChart
CivicSignalFeed
```

---

## 6.5 Impact

### Canonical route family

```txt
/ethikos/impact/*
```

### Current routes

```txt
/ethikos/impact/feedback
/ethikos/impact/outcomes
/ethikos/impact/tracker
```

### Kintsugi role

Impact owns accountability surfaces:

* implementation tracking;
* outcome reporting;
* feedback loops;
* public accountability snapshots;
* follow-through state after decisions.

### Required boundary correction

Impact may currently have loose frontend mappings to KeenKonnect project data. Kintsugi must treat this as a temporary or legacy adapter pattern.

Canonical Kintsugi ownership is:

```txt
Impact truth -> ethiKos / Konsultations
Project execution handoff -> KeenKonnect
```

Impact MUST NOT be documented as owned by KeenKonnect.

### Preferred component names

```txt
ImpactTrackerTable
OutcomeCard
FeedbackPanel
AccountabilityTimeline
ImplementationStatusBadge
PublicReceiptPanel
HandoffLinkCard
```

---

## 6.6 Learn

### Canonical route family

```txt
/ethikos/learn/*
```

### Current routes

```txt
/ethikos/learn/changelog
/ethikos/learn/glossary
/ethikos/learn/guides
```

### Kintsugi role

Learn owns public explanation:

* Kintsugi methodology;
* glossary;
* user guides;
* change log;
* meaning of readings/lenses;
* difference between stance, ballot, impact vote, and reading;
* public explanation of Smart Vote and EkoH boundaries.

### Required boundaries

Learn pages may explain external inspirations, but must not imply direct dependency or merged external code.

### Preferred component names

```txt
GlossaryList
GuideSection
MethodologyGuide
KintsugiExplainer
ReadingLensExplainer
ChangeLogTimeline
```

---

## 6.7 Insights

### Canonical route

```txt
/ethikos/insights
```

### Kintsugi role

Insights owns analytical interpretation:

* reading comparison;
* cross-module civic analytics;
* topic-level signal interpretation;
* cohort views;
* Smart Vote result comparison;
* EkoH-contextualized analytics where declared.

### Required boundaries

Insights MAY compose data from:

```txt
/api/ethikos/topics/
/api/ethikos/stances/
/api/ethikos/arguments/
/api/kollective/votes/
```

Insights MUST use service wrappers.

Insights MUST NOT embed raw aggregation fetches directly inside page components.

### Preferred component names

```txt
ReadingComparisonDashboard
CohortSignalChart
TopicInsightCard
SmartVoteLensTable
BaselineVsWeightedPanel
ExpertiseContextChart
```

---

## 6.8 Admin

### Canonical route family

```txt
/ethikos/admin/*
```

### Current routes

```txt
/ethikos/admin/audit
/ethikos/admin/moderation
/ethikos/admin/roles
```

### Kintsugi role

Admin owns governance controls:

* audit views;
* moderation views;
* participant roles;
* permission management;
* visibility controls;
* Kialo-style role settings;
* anonymous participation controls;
* suggested-claim approval queues.

### Required boundaries

Admin MAY expose privileged views that normal participants cannot see.

Admin MUST NOT leak anonymous identities to non-admin users.

### Preferred component names

```txt
AuditLogTable
ModerationQueue
RoleMatrix
VisibilitySettingsPanel
SuggestedClaimApprovalQueue
AnonymousParticipationControls
AdminOnlyIdentityPanel
```

---

## 7. Shell and Layout Contract

## 7.1 Segment layout

The `/ethikos/*` segment layout is responsible for:

* wrapping ethiKos content in `MainLayout`;
* preserving the global app navigation;
* defaulting sidebar context to ethiKos when absent;
* providing Ant Design `App` context;
* applying the ethiKos watermark;
* providing a Suspense fallback.

Pages MUST NOT duplicate this behavior.

## 7.2 Page shell

`EthikosPageShell` is responsible for:

* visible page title;
* subtitle;
* meta title;
* optional inferred section label;
* primary action;
* secondary actions;
* content max width.

Pages SHOULD NOT render a competing top-level `h1` outside `EthikosPageShell`.

## 7.3 Page container

`PageContainer`, `ProCard`, tables, lists, cards, forms, and charts may be used inside `EthikosPageShell`.

Recommended nesting:

```tsx
<EthikosPageShell
  title="..."
  subtitle="..."
  primaryAction={...}
  secondaryActions={...}
>
  <PageContainer>
    {/* page content */}
  </PageContainer>
</EthikosPageShell>
```

If a page already uses a safe existing layout pattern, preserve it unless there is a specific alignment task.

---

## 8. Service-Layer Contract

All new frontend data access MUST go through service wrappers.

### 8.1 Canonical services

```txt
services/ethikos
services/deliberate
services/decide
services/impact
services/learn
services/admin
services/pulse
```

Existing service names MAY be preserved even if their internal endpoint mapping needs cleanup.

### 8.2 Service function naming

Use descriptive verbs:

```txt
fetchTopic
fetchTopics
fetchTopicDetail
fetchTopicPreview
createTopic
submitStance
submitArgument
submitArgumentImpactVote
fetchArgumentTree
submitSuggestedClaim
fetchDecisionRecords
submitPublicVote
fetchReadingResults
fetchImpactTracker
patchImpactStatus
fetchAuditLog
fetchModerationQueue
```

Avoid names that import external product names into canonical service APIs:

```txt
fetchKialoTree
submitKialoVote
fetchLoomioProposal
fetchDecidimProcess
submitConsulThreshold
```

### 8.3 Request helper

Services SHOULD use the existing request helper pattern.

Preferred structure:

```txt
frontend/services/<domain>.ts
  -> import { get, post, patch, put, del } from './_request'
  -> call canonical API path without duplicating global base logic
```

### 8.4 API path policy

Services SHOULD call canonical backend endpoints:

```txt
ethikos/topics/
ethikos/stances/
ethikos/arguments/
ethikos/categories/
kollective/votes/
```

Services MUST NOT expand use of:

```txt
home/*
api/home/*
```

If a legacy path exists, it must be:

* documented;
* isolated;
* scheduled for replacement;
* not reused in new Kintsugi components.

---

## 9. API Alignment Contract

Frontend code MUST preserve these canonical API meanings:

| Frontend concept         | Canonical backend route                             |
| ------------------------ | --------------------------------------------------- |
| Topic list/detail        | `/api/ethikos/topics/`                              |
| Topic stance             | `/api/ethikos/stances/`                             |
| Topic argument           | `/api/ethikos/arguments/`                           |
| Category/glossary source | `/api/ethikos/categories/`                          |
| Kollective vote          | `/api/kollective/votes/`                            |
| Smart Vote reading       | future `ReadingResult` endpoint, defined later      |
| Kialo-style impact vote  | future `ArgumentImpactVote` endpoint, defined later |
| Suggested claim          | future `ArgumentSuggestion` endpoint, defined later |

Do not generate frontend code against undefined endpoints unless the endpoint is marked as proposed and assigned to the relevant backend contract.

---

## 10. State Management and Fetching

Existing pages may use the currently established project patterns, including:

* React local state;
* `useMemo`;
* `useState`;
* `useEffect`;
* React Query where already used;
* `ahooks/useRequest` where already used;
* service wrappers.

### Rules

* Data loading must have explicit loading state.
* Empty collections must render explicit empty states.
* Failed service calls must surface recoverable UI when possible.
* Mutation success should invalidate or refresh related queries.
* Mutation failure should not silently fail.
* Page components should not perform cross-domain aggregation directly; aggregation belongs in services or backend endpoints.

---

## 11. Ant Design and Notification Contract

The ethiKos layout provides Ant Design `App` context.

Pages MAY use:

```tsx
const { message, modal, notification } = App.useApp();
```

Pages MUST NOT mount their own duplicate `App` provider.

Pages SHOULD avoid the deprecated static message pattern where the contextual `App.useApp()` pattern is available.

---

## 12. Styling and Design-System Contract

Frontend Kintsugi work MUST use the current Konnaxion UI stack.

Allowed:

* Ant Design;
* Ant Design Pro Components;
* existing shared layout components;
* existing shared chart/card/table components;
* module page shells;
* current theme context.

Forbidden unless explicitly approved:

* new global CSS framework;
* Tailwind introduction;
* duplicate theme provider;
* duplicate sidebar/navigation system;
* isolated micro-frontend styling;
* raw unscoped CSS that overrides global Konnaxion behavior.

---

## 13. Kialo-Style Frontend Contract

Kialo-style frontend work belongs under `/ethikos/deliberate/*`.

### 13.1 Required native-mimic posture

```yaml
KIALO_STRATEGY: "native_mimic"
KIALO_ROUTE_SCOPE: "/ethikos/deliberate/*"
KIALO_BACKEND_SCOPE: "konnaxion.ethikos"
CREATE_KIALO_FRONTEND_ROUTE: false
CREATE_KIALO_BACKEND_APP: false
IMPORT_KIALO_CODE: false
```

### 13.2 First-pass surfaces

First-pass Kialo-style components MAY include:

```txt
ArgumentTreeView
ArgumentNodeCard
ArgumentSourcesPanel
ArgumentImpactVoteControl
SuggestedClaimsPanel
ParticipantRoleSettings
DiscussionSettingsPanel
AnonymousModeBanner
TopicBackgroundPanel
```

### 13.3 Deferred surfaces

The following are deferred unless explicitly moved into first-pass scope:

```txt
ArgumentMinimapSunburst
DiscussionTemplateClonePanel
DiscussionExportPanel
SmallGroupModePanel
CrossDiscussionClaimLinker
ClaimExtractionPanel
CustomPerspectiveBuilder
```

### 13.4 Kialo-style anti-drift

Do not:

* rename `EthikosArgument` to `Claim`;
* create `/kialo` routes;
* create `KialoPageShell`;
* create `services/kialo`;
* treat argument impact votes as topic stances;
* treat argument impact votes as Smart Vote ballots;
* expose anonymous identities to non-admins;
* publish suggester-submitted claims without approval.

---

## 14. Smart Vote / EkoH Frontend Contract

Smart Vote and EkoH must be represented carefully in the frontend.

### 14.1 Smart Vote frontend role

Smart Vote UI displays:

* baseline results;
* declared readings;
* lens explanations;
* result comparisons;
* publication state;
* reproducibility/audit context.

Smart Vote UI MUST NOT imply that Smart Vote mutates raw facts.

### 14.2 EkoH frontend role

EkoH UI displays:

* expertise context;
* ethics context;
* cohort eligibility;
* snapshot context;
* trust/credential signals.

EkoH UI MUST NOT imply that EkoH directly casts votes.

### 14.3 Required frontend distinctions

Any page showing decision outputs SHOULD distinguish:

```txt
Baseline result
Declared Smart Vote reading
EkoH context/snapshot
Raw user stance or ballot
```

Preferred labels:

```txt
Baseline
Reading
Lens
Snapshot
Expertise context
Ethics context
```

Avoid ambiguous labels:

```txt
weighted truth
EkoH vote
expert vote
final authority
```

---

## 15. Drafting Frontend Contract

Drafting is a bounded Kintsugi capability.

Potential frontend surfaces:

```txt
DraftWorkspace
DraftVersionTimeline
AmendmentPanel
RationalePacketViewer
DraftComparisonView
```

Drafting MAY appear under Decide or a future bounded ethiKos route if approved.

Until an ADR approves a route, do not invent:

```txt
/ethikos/draft
/ethikos/drafting
/ethikos/citizenos
```

Docs may describe drafting conceptually, but implementation routes must be confirmed before frontend generation.

---

## 16. Legacy and Loose Mapping Contract

The current graph contains loose mappings and legacy endpoints.

### 16.1 `/api/home/*`

Kintsugi frontend work MUST NOT expand `/api/home/*`.

Any remaining `/api/home/*` call should be classified as:

```txt
legacy
needs isolation
candidate for replacement
not canonical
```

### 16.2 Deliberate preview

`fetchTopicPreview` may currently map loosely onto topic data.

The frontend contract is:

```txt
TopicPreviewDrawer expects a stable TopicPreviewPayload.
The service layer owns any transformation from current backend topic data to the preview payload.
The page should not hard-code fallback transformations if the service can own them.
```

### 16.3 Impact / KeenKonnect loose mapping

If Impact currently maps to KeenKonnect project data, classify it as a temporary adapter.

Kintsugi frontend documentation must present Impact as ethiKos/Konsultations accountability.

KeenKonnect may be shown as an execution handoff target, not the canonical Impact owner.

---

## 17. Accessibility and Responsiveness

All new ethiKos frontend work SHOULD:

* preserve keyboard navigation;
* use semantic headings inside shell structure;
* ensure tables have row keys and accessible labels;
* ensure charts have readable labels or summaries;
* avoid color-only status communication;
* preserve mobile/responsive behavior;
* avoid layout overflow in tree/graph views;
* provide fallback empty states for missing data.

Argument maps and tree views SHOULD include non-visual navigation alternatives such as list view, outline view, or searchable claim list.

---

## 18. Loading, Empty, and Error States

Each Kintsugi frontend surface MUST define:

```txt
loading state
empty state
error state
success state when applicable
permission denied state when applicable
```

Recommended copy pattern:

| State             | Requirement                                                         |
| ----------------- | ------------------------------------------------------------------- |
| Loading           | Show section-specific loading message                               |
| Empty             | Explain what is missing and how to create it                        |
| Error             | Provide retry or fallback when possible                             |
| Permission denied | Explain that the user lacks access, without leaking restricted data |
| Partial data      | Mark incomplete panels explicitly                                   |

The preview drawer bug demonstrates why silent or generic “No data” states are insufficient for Kintsugi UX.

---

## 19. Permission and Visibility Contract

Frontend visibility must respect role and anonymity rules.

### Required Kialo-style visibility variables

```yaml
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
```

### Frontend rules

* Admin-only identity fields must not render for normal participants.
* Anonymous participation must be visibly marked without revealing identity.
* Suggested claims must show approval state.
* Role-limited actions must be disabled or hidden consistently.
* Permission-denied responses must not leak restricted metadata.

---

## 20. Frontend Testing Contract

Frontend changes for Kintsugi SHOULD include or preserve tests for:

* route rendering;
* shell wrapping;
* service call paths;
* empty states;
* error states;
* topic detail loading;
* argument submission;
* stance submission;
* decision result rendering;
* preview drawer payload handling;
* admin/moderation visibility;
* no accidental `/api/home/*` expansion.

Minimum smoke coverage SHOULD verify that the main ethiKos surfaces render without crashing:

```txt
/ethikos/decide/public
/ethikos/decide/results
/ethikos/deliberate/[topic]
/ethikos/impact/tracker
/ethikos/insights
/ethikos/admin/moderation
```

---

## 21. File Placement Rules

### Existing page routes

Existing App Router pages remain under:

```txt
frontend/app/ethikos/
```

### Shared ethiKos components

New reusable ethiKos components SHOULD live in one of the established frontend locations depending on current repo convention.

Acceptable locations include:

```txt
frontend/app/ethikos/
frontend/modules/ethikos/
frontend/components/
```

The chosen location must avoid duplication and should follow the nearest existing pattern.

### Service wrappers

New service logic SHOULD live under:

```txt
frontend/services/
```

Preferred files:

```txt
frontend/services/ethikos.ts
frontend/services/deliberate.ts
frontend/services/decide.ts
frontend/services/impact.ts
frontend/services/pulse.ts
frontend/services/learn.ts
frontend/services/admin.ts
```

Do not create external-source service files such as:

```txt
frontend/services/kialo.ts
frontend/services/loomio.ts
frontend/services/decidim.ts
```

unless a future annex ADR explicitly approves it.

---

## 22. Frontend Review Checklist

Before accepting any frontend Kintsugi change, verify:

```txt
[ ] The route remains under /ethikos/*.
[ ] The page uses the existing ethiKos/global shell.
[ ] The page does not define a duplicate large header outside EthikosPageShell.
[ ] The page does not create a new shell, theme, or navigation system.
[ ] API calls go through services/*.
[ ] New API calls use canonical /api/ethikos/* or approved endpoints.
[ ] No new /api/home/* usage was added.
[ ] Kialo-style features remain under /ethikos/deliberate/*.
[ ] Smart Vote is shown as readings, not source mutation.
[ ] EkoH is shown as context, not voting.
[ ] Stance, impact vote, ballot, and reading are distinct in UI copy.
[ ] Empty/error/loading states are explicit.
[ ] Permission and anonymity rules are respected.
[ ] New component names use canonical naming.
[ ] The change does not introduce deferred OSS features as first-pass scope.
```

---

## 23. Non-Goals

This frontend contract does not authorize:

* a new `/kialo` frontend app;
* a new `/kintsugi` frontend app;
* a new global layout;
* a second theme system;
* importing external OSS frontend code;
* implementing Polis/LiquidFeedback/OpenSlides first-pass UI;
* replacing REST with GraphQL/WebSockets;
* creating backend models from frontend assumptions;
* changing current route families;
* treating the preview drawer bug as architecture justification.

---

## 24. Anti-Drift Rules

```yaml
FRONTEND_ANTI_DRIFT_RULES:
  - "Do not create a second shell."
  - "Do not create KintsugiShell."
  - "Do not create KialoShell."
  - "Do not create /kialo routes."
  - "Do not create /ethikos/kialo routes."
  - "Do not replace /ethikos/* with conceptual public-doc routes."
  - "Do not bypass the services layer."
  - "Do not add raw fetches inside page components unless explicitly documented."
  - "Do not expand /api/home/*."
  - "Do not rename /api/ethikos/* to /api/deliberation/*."
  - "Do not treat Kialo impact votes as stances."
  - "Do not treat Smart Vote readings as source facts."
  - "Do not present EkoH as a voting engine."
  - "Do not use external OSS names as canonical internal component prefixes."
  - "Do not generate implementation backlog inside this contract."
```

---

## 25. Related Documents

| File                                            | Relationship                                   |
| ----------------------------------------------- | ---------------------------------------------- |
| `00_KINTSUGI_START_HERE.md`                     | Entry point and reading order                  |
| `02_SOURCE_OF_TRUTH_AND_DRIFT_CONTROL.md`       | Source priority and drift resolution           |
| `03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md`      | Korum/Konsultations/Smart Vote/EkoH boundaries |
| `04_CANONICAL_NAMING_AND_VARIABLES.md`          | Naming constants used by this file             |
| `05_CURRENT_STATE_BASELINE.md`                  | Current frontend/backend reality               |
| `06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md`     | Route-specific upgrade plan                    |
| `07_API_AND_SERVICE_CONTRACTS.md`               | API/service call details                       |
| `09_SMART_VOTE_EKOH_READING_CONTRACT.md`        | Smart Vote/EkoH frontend interpretation        |
| `13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md` | Payload shapes expected by frontend services   |
| `15_BACKEND_ALIGNMENT_CONTRACT.md`              | Backend-side counterpart                       |
| `16_TEST_AND_SMOKE_CONTRACT.md`                 | Test expectations                              |
| `17_KNOWN_BUGS_AND_NON_KINTSUGI_ITEMS.md`       | Known bugs and exclusions                      |
| `20_AI_GENERATION_GUARDRAILS.md`                | AI-specific guardrails                         |
| `21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md`   | Kialo-style Deliberate contract                |
| `22_IMPLEMENTATION_BACKLOG_TEMPLATE.md`         | Future task format                             |

---

## 26. Final Canonical Assertion

The frontend Kintsugi upgrade strengthens the existing ethiKos surface.

The canonical frontend surface remains:

```txt
/ethikos/*
```

The canonical shell remains:

```txt
MainLayout -> ethiKos segment layout -> Ant Design App context -> EthikosPageShell
```

The canonical API access pattern remains:

```txt
page/component -> service wrapper -> /api/...
```

Kialo-style patterns belong under:

```txt
/ethikos/deliberate/*
```

Smart Vote readings belong primarily under:

```txt
/ethikos/decide/*
/ethikos/insights
```

EkoH context belongs primarily under:

```txt
/ethikos/trust/*
/ethikos/insights
```

Impact/accountability belongs under:

```txt
/ethikos/impact/*
```

The Kintsugi frontend update is not a new app, not a new shell, and not a direct OSS frontend merge. It is a native alignment and strengthening of the existing ethiKos frontend.

```

Sources used for alignment: current ethiKos layout and shell implementation, route inventory, service/API conventions, shell-nesting rules, endpoint graph, and Kintsugi boundary rules. :contentReference[oaicite:0]{index=0} :contentReference[oaicite:1]{index=1} :contentReference[oaicite:2]{index=2} :contentReference[oaicite:3]{index=3} :contentReference[oaicite:4]{index=4}
```

---

## V4.1 reusable EkoH frontend

Canonical EkoH data access moves to `frontend/services/ekoh.ts`. Reusable display belongs under `frontend/modules/ekoh/components/`. Ethikos may wrap these components with question-specific Smart Vote context, but generic EkoH components MUST NOT import Smart Vote.

