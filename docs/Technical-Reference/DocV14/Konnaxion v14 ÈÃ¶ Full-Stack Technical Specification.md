# Konnaxion Platform Technical Specification v14
## Updated implementation-aligned edition

This document specifies the Konnaxion Platform architecture and components, aligned with the current v14 codebase and the present implementation state. The platform comprises five primary modules — **Kollective intelligence**, **ethiKos**, **keenKonnect**, **KonnectED**, **Kreative** — plus a common core and a cross-module **Insights / Reports** slice.

The specification preserves the branded Konnaxion nomenclature while distinguishing clearly between:

- **implemented and build-clean functionality**
- **current backend canonical models and endpoints**
- **planned or target-state capabilities not yet fully realized**

The platform currently uses a **Next.js frontend** for the rich product UI, a **Django + DRF backend** for module APIs, **PostgreSQL** as the primary relational store, and **Celery + Redis** for background processing.

---

# 1. Common / Core Platform

## 1.1 Frontend (Common)

- **Next.js App Router frontend**  
  The main product UI is implemented in Next.js with TypeScript. Module UIs live in the frontend application and share a common shell, page layout pattern, and module-specific page shells.

- **Shared shell and layout system**  
  Global navigation, search, user context, notifications, and page framing are shared across modules. Each major module plugs into the global shell rather than acting as a separate top-level app.

- **Reusable design system**  
  The implementation uses Ant Design and shared layout primitives to keep page composition consistent. Module pages are built from shared containers, cards, tables, forms, and chart components.

- **Unified session and profile context**  
  Authentication, profile identity, and permissions flow through the shared frontend application rather than being duplicated per module.

- **Cross-module reporting surface**  
  The analytics slice is implemented as routes under `/reports`, with separate pages for the report hub, custom builder, Smart Vote, Usage, and API performance.

## 1.2 Backend (Common)

- **Django modular monolith**  
  The backend is a Django project composed of local apps:
  - `users`
  - `kollective_intelligence`
  - `ethikos`
  - `keenkonnect`
  - `konnected`
  - `kreative`

- **REST API with DRF**  
  The frontend consumes JSON APIs exposed through the central DRF router under `/api/...`.

- **Canonical API routing**  
  Common examples:
  - `/api/users/...`
  - `/api/ethikos/topics/`
  - `/api/ethikos/stances/`
  - `/api/ethikos/arguments/`
  - `/api/ethikos/categories/` (when available)
  - `/api/keenkonnect/projects/`
  - `/api/kollective/votes/`
  - `/api/konnected/resources/`
  - `/api/kreative/artworks/`

- **Compatibility aliases**  
  Ethikos is also exposed through compatibility route families:
  - `/api/deliberate/...`
  - `/api/deliberate/elite/...`

- **Shared services**  
  Authentication, user profile APIs, notifications, background tasks, and common moderation infrastructure are shared at the core layer.

## 1.3 Database (Common)

- **Primary PostgreSQL database**  
  PostgreSQL stores user accounts, module entities, moderation metadata, and shared reference data.

- **Unified user model**  
  A custom `users.User` model is used throughout the platform.

- **Shared domain references**  
  Common taxonomies, moderation records, notifications, and search-related indices belong to the cross-module core.

- **Search support**  
  Global search is backed by shared indexing patterns and/or PostgreSQL search features, allowing discovery across multiple modules.

## 1.4 DevOps (Common)

- **Containerized deployment**  
  The platform is structured for Docker-based development and production deployment.

- **Background processing**  
  Celery and Redis support asynchronous jobs such as notification delivery, media processing, indexing, and export tasks.

- **Monitoring and release pipeline**  
  Health checks, build pipelines, and standard deployment flows are part of the baseline stack.

- **Production build validation**  
  The current frontend build completes successfully in production mode, including the Ethikos and Reports routes.

---

# 2. Kollective Intelligence

## 2.1 Purpose

Kollective intelligence provides the merit-weighted, cross-module decision and reputation substrate of Konnaxion. It includes **EkoH**, **Smart Vote**, and **Konsensus** concepts.

## 2.2 Frontend

- Shared dashboards and result surfaces for weighted participation
- Reputation and influence visibility
- Cross-module aggregation views used by decision-centric modules

## 2.3 Backend

- Weighted voting and reputation logic
- Expertise and ethics weighting
- Vote aggregation and result persistence
- Cross-module influence and analytics support

## 2.4 Database

Representative tables include:

- `UserExpertiseScore`
- `UserEthicsScore`
- `ExpertiseCategory`
- `Vote`
- `VoteResult`
- `IntegrationMapping`

## 2.5 Notes

Kollective intelligence remains the cross-module intelligence substrate rather than an isolated content module.

---

# 3. ethiKos

ethiKos is the platform’s structured deliberation and consultation module. In the current implementation, the canonical backend core is centered on **topics, stances, arguments, and categories**. More advanced or AI-assisted features remain target-state capabilities rather than the current canonical implementation.

## 3.1 Frontend (Implemented Route Surface)

The current Ethikos frontend is implemented under `/ethikos/...` with the following page groups:

### Debate / Decision routes
- `/ethikos/decide/elite`
- `/ethikos/decide/public`
- `/ethikos/decide/results`
- `/ethikos/decide/methodology`

### Deliberation routes
- `/ethikos/deliberate/elite`
- `/ethikos/deliberate/[topic]`
- `/ethikos/deliberate/guidelines`

### Trust routes
- `/ethikos/trust/profile`
- `/ethikos/trust/badges`
- `/ethikos/trust/credentials`

### Pulse routes
- `/ethikos/pulse/overview`
- `/ethikos/pulse/live`
- `/ethikos/pulse/health`
- `/ethikos/pulse/trends`

### Impact routes
- `/ethikos/impact/feedback`
- `/ethikos/impact/outcomes`
- `/ethikos/impact/tracker`

### Learning and analytics routes
- `/ethikos/learn/changelog`
- `/ethikos/learn/glossary`
- `/ethikos/learn/guides`
- `/ethikos/insights`

### Admin routes
- `/ethikos/admin/audit`
- `/ethikos/admin/moderation`
- `/ethikos/admin/roles`

### Frontend implementation notes

- The Ethikos frontend uses `EthikosPageShell` and `PageContainer` consistently.
- The route structure is deeper and more explicit than the older simplified navigation concept that referred only to `/debate`, `/consult`, or `/reputation`.
- Decision, deliberation, pulse, trust, impact, learning, and admin are all first-class implemented page groups.

## 3.2 Backend (Canonical Current Scope)

The current canonical Ethikos backend is exposed under:

- `/api/ethikos/topics/`
- `/api/ethikos/stances/`
- `/api/ethikos/arguments/`
- `/api/ethikos/categories/` (when registered)

Compatibility aliases also exist:

- `/api/deliberate/...`
- `/api/deliberate/elite/...`

### Current backend semantics

- **Topics** are the main debate / consultation objects.
- **Stances** store one user’s numeric position on a topic.
- **Arguments** store threaded discussion entries and replies.
- **Categories** group topics thematically.

### Current participation rule notes

The user model already contains Ethikos-specific semantics such as `is_ethikos_elite`, and the backend code documents `can_participate_in_ethikos` rules for staff, klones, and explicitly flagged elite users.

## 3.3 Database (Canonical Current Models)

Current canonical Ethikos tables:

- `EthikosCategory`
- `EthikosTopic`
- `EthikosStance`
- `EthikosArgument`

### Key semantics

- `EthikosTopic`
  - debate / consultation prompt
  - status such as `open`, `closed`, `archived`

- `EthikosStance`
  - linked to a topic and a user
  - integer stance value constrained to **-3 … +3**

- `EthikosArgument`
  - linked to a topic
  - text body
  - optional `parent` for threaded replies
  - optional side / moderation flags depending on serializer configuration

### Important implementation note

The following were described in broader concept documents but are **not** part of the current canonical implementation set:
- AI clones
- comparative analysis logs
- debate archives
- automated summaries

## 3.4 Functional Frontend Interpretation

### Decide
The current Decide surfaces derive decisions and results from Ethikos topics and stances, including closed-topic result views and methodology pages explaining weighted and nuanced participation.

### Deliberate
The current Deliberate surfaces render structured topic threads, threaded arguments, and stance capture around the `-3 … +3` model.

### Pulse
Pulse acts as the analytics and participation-monitoring layer for Ethikos, with dedicated overview, live, health, and trend pages.

### Trust
Trust covers profile credibility, badges, and credentials in the context of debate legitimacy and expertise signaling.

### Impact
Impact translates consultations / debates into feedback, outcomes, and tracker views.

### Learn
Learn provides static or semi-static educational and explanatory material:
- changelog
- glossary
- guides

### Admin
Admin currently includes:
- audit
- moderation
- role management

## 3.5 DevOps / Operational Notes

- Ethikos participates in the standard frontend production build and now builds cleanly.
- Ethikos frontend pages are part of successful static generation / route preparation in the production build.
- Runtime verification is still required for live API-backed behavior even after build success.

---

# 4. keenKonnect

keenKonnect remains the project collaboration and resource-sharing module.

## 4.1 Frontend

It includes project browsing, workspaces, team matching, document/resource access, and sustainability-related project views.

## 4.2 Backend

Canonical backend routes include:
- `/api/keenkonnect/projects/`
- `/api/keenkonnect/resources/`
- `/api/keenkonnect/tasks/`
- `/api/keenkonnect/messages/`
- `/api/keenkonnect/teams/`
- `/api/keenkonnect/ratings/`
- `/api/keenkonnect/tags/`

## 4.3 Database

Representative entities include:
- project
- project resource
- task
- message
- team membership
- rating
- tag

## 4.4 DevOps

Object storage, collaboration performance, and media handling remain central operational concerns for this module.

---

# 5. KonnectED

KonnectED is the learning, certification, and mentorship module.

## 5.1 Frontend

The frontend includes:
- knowledge resources
- certification flows
- exam / evaluation interfaces
- portfolios
- mentorship and learning-path experiences

## 5.2 Backend

Canonical routes include:
- `/api/konnected/resources/`
- `/api/konnected/offline-packages/` (optional)
- `/api/konnected/certifications/paths/`
- `/api/konnected/certifications/evaluations/`
- `/api/konnected/certifications/peer-validations/`
- `/api/konnected/portfolios/`
- `/api/konnected/certifications/exam-attempts/`

## 5.3 Database

Representative entities include:
- knowledge content
- course / path
- certification
- user progress
- user certification
- mentorship records

## 5.4 DevOps

Offline package generation, content delivery, and scaling for educational content remain important to this module.

---

# 6. Kreative

Kreative is the arts, archive, collaboration, and showcase module.

## 6.1 Frontend

The frontend includes:
- dashboards
- galleries and showcases
- archives
- collaborative spaces
- mentorship-oriented creative surfaces

## 6.2 Backend

Canonical routes include:
- `/api/kreative/artworks/`
- `/api/kreative/galleries/`
- `/api/kreative/collab-sessions/`
- related supportive APIs depending on feature group

## 6.3 Database

Representative entities include:
- artwork
- gallery
- collaboration session
- archive / tradition entry
- comments / likes / tags where implemented

## 6.4 DevOps

Media storage, CDN delivery, and optional real-time collaboration are the major operational concerns.

---

# 7. Insights / Reports (Cross-Module Analytics Slice)

Insights / Reports is currently implemented as a separate route family under `/reports` and should be treated as a cross-module analytics slice rather than an informal add-on.

## 7.1 Frontend (Implemented Routes)

Current implemented report routes:

- `/reports`
- `/reports/custom`
- `/reports/smart-vote`
- `/reports/usage`
- `/reports/perf`

### Current page roles

- `/reports`  
  Hub / overview page for the analytics slice

- `/reports/custom`  
  Custom report builder UI

- `/reports/smart-vote`  
  Smart Vote dashboard

- `/reports/usage`  
  Usage and adoption dashboard

- `/reports/perf`  
  API / platform performance dashboard

## 7.2 Frontend implementation notes

- Reports pages use a dedicated `ReportsPageShell`
- The route family is now production-build clean
- The custom report builder and report dashboards are part of the current implemented frontend surface

## 7.3 Backend

The current frontend expects report-oriented APIs of the form:

- `GET /reports/smart-vote`
- `GET /reports/usage`
- `GET /reports/perf`

The reports frontend also includes hook-based analytics access patterns and a custom-report flow.

## 7.4 Database / Storage

The reports slice is documentation-defined as a distinct reporting and analytics layer with its own storage, retention, and aggregation rules. The implementation should continue to distinguish:
- frontend reporting UI
- read-only analytics API
- reporting database / storage layer
- orchestration / monitoring layer

## 7.5 DevOps

This slice should be operated as a reporting-focused subsystem with clear observability, refresh cadence, and retention behavior. UI readiness does not by itself guarantee analytics pipeline completeness; runtime validation remains necessary.

---

# 8. Current Implementation Status Summary

## 8.1 Frontend status

The frontend is currently in a strong implementation state for:

- Ethikos route surfaces
- Reports / Insights route surfaces
- shared shell-based module composition
- production build integrity

## 8.2 Backend status

The backend is canonical and stable at the core model / API level for several modules, but implementation breadth still varies by module. In Ethikos specifically, the canonical core is narrower than the total frontend surface.

## 8.3 Documentation rule

From this version onward, architecture documentation should distinguish explicitly between:

- **canonical implemented models and endpoints**
- **implemented frontend route surfaces**
- **planned / target-state features not yet in the canonical codebase**

This distinction is especially important for:
- ethiKos
- Insights / Reports
- any target-state AI or summary features

---

# 9. Authoritative Route / API Alignment Notes

## 9.1 Ethikos

Use:
- `/ethikos/...` for frontend routes
- `/api/ethikos/...` for canonical backend routes
- `/api/deliberate/...` and `/api/deliberate/elite/...` only as compatibility aliases

Do not document Ethikos as if only `/debate` and `/consult` existed when the implemented UI is now a larger route family.

## 9.2 Reports

Use:
- `/reports`
- `/reports/custom`
- `/reports/smart-vote`
- `/reports/usage`
- `/reports/perf`

These are real implemented routes and should be reflected consistently in navigation, UI specs, and technical references.

---

# 10. Conclusion

Konnaxion v14 is now best understood as:

- a shared Next.js + Django modular platform
- with canonical backend entities and route contracts
- with a richer implemented frontend route surface in Ethikos
- and with a now-clean, implemented Reports / Insights frontend slice

This specification should be treated as the implementation-aligned baseline until a later revision expands the canonical backend scope or formalizes additional target-state features into production code.