# **Inventory of platform-specific functionalities**

> **Update note**
>
> This inventory now distinguishes between:
>
> - **Current implemented / surfaced functionality** — reflected in the current frontend route structure and UI specs
> - **Target-state / roadmap functionality** — still valid as product intent, but not necessarily represented as a fully implemented surface today

| Module | Sub-module | Display Name → Code Name | Purpose / Behaviour | Status / Current Surface |
| ----- | ----- | ----- | ----- | ----- |
| **Kollective Intelligence** | **EkoH** | Multidimensional Scoring → `multidimensional_scoring` | Compute per-user/content scores along axes (quality, frequency, relevance, expertise). | Target-state / canonical capability |
|  |  | Criteria Customization → `configuration_weights` | Admin/community adjust weighting parameters for each scoring axis. | Target-state / canonical capability |
|  |  | Automatic Contextual Analysis → `contextual_analysis` | AI adjusts sub-scores in real time based on topic, history, complexity. | Target-state / canonical capability |
|  |  | Dynamic Privacy → `privacy_settings` | Apply anonymity / pseudonym modes while still displaying merit scores. | Target-state / canonical capability |
|  |  | History & Traceability → `score_history` | Persist every score recalculation & configuration change for audit. | Target-state / canonical capability |
|  |  | Interactive Visualizations → `score_visualization` | Serve aggregated data for live dashboards, skill-maps, matrices. | Target-state / canonical capability |
|  |  | Expertise Classification by Field → `expertise_field_classification` | Bind each sub-score to a formal domain (Agronomy, HR, etc.). | Target-state / canonical capability |
|  | **Smart Vote** | Dynamic Weighted Voting → `dynamic_weighted_vote` | Re-weights every vote in real time using the voter’s EkoH score. | Target-state / canonical capability |
|  |  | Flexible Voting Modalities → `voting_modalities` | Supports approval, ranking, rating, preferential ballots. | Target-state / canonical capability |
|  |  | Emerging Expert Detection → `emerging_expert_detection` | Flags users whose EkoH score is rising sharply. | Target-state / canonical capability |
|  |  | Transparency of Results → `vote_transparency` | Publishes raw + weighted values and context (no private data). | Target-state / canonical capability |
|  |  | Advanced Result Visualizations → `vote_result_visualization` | Generates histograms, network graphs, interactive maps of outcomes. | Target-state / canonical capability |
|  |  | Cross-Module Integration → `cross_module_vote_integration` | Makes Smart Vote accessible from all modules (KonnectED, et al.). | Target-state / canonical capability |

| **ethiKos** | **Deliberate** | Elite Agora / Expert Deliberation → `elite_deliberation` | Expert-oriented debate listing and entry into topic threads. | **Current implemented surface** (`/ethikos/deliberate/elite`) |
|  |  | Topic Thread / Debate Thread → `debate_thread` | Topic detail, threaded arguments, and stance participation on the canonical −3…+3 scale. | **Current implemented surface** (`/ethikos/deliberate/[topic]`) |
|  |  | Participation Guidelines → `deliberation_guidelines` | Explain rules, norms, and expected debate quality. | **Current implemented surface** (`/ethikos/deliberate/guidelines`) |
|  | **Decide** | Public Consultations → `public_consultation` | Open public consultations with participation and stance capture. | **Current implemented surface** (`/ethikos/decide/public`) |
|  |  | Elite Decisions → `elite_decision_flow` | Expert / elite decision participation surface. | **Current implemented surface** (`/ethikos/decide/elite`) |
|  |  | Results Archive → `decision_results_archive` | Review aggregated decision outcomes and historical result views. | **Current implemented surface** (`/ethikos/decide/results`) |
|  |  | Methodology → `decision_methodology` | Explain the scoring / consultation / weighting logic used in decide flows. | **Current implemented surface** (`/ethikos/decide/methodology`) |
|  | **Trust** | Trust Profile → `trust_profile` | Show reputation, trust, and debate-relevant profile indicators. | **Current implemented surface** (`/ethikos/trust/profile`) |
|  |  | Badges → `trust_badges` | Display recognitions / trust markers tied to user standing. | **Current implemented surface** (`/ethikos/trust/badges`) |
|  |  | Credentials → `credential_management` | Upload and manage credentials that support expertise visibility in debates. | **Current implemented surface** (`/ethikos/trust/credentials`) |
|  | **Pulse** | Health Dashboard → `debate_health_dashboard` | Show quality / participation / health signals for debate activity. | **Current implemented surface** (`/ethikos/pulse/health`) |
|  |  | Live Feed → `debate_live_feed` | Near-real-time participation/activity feed for debate flows. | **Current implemented surface** (`/ethikos/pulse/live`) |
|  |  | Overview Analytics → `opinion_overview` | Summarize participation and debate metrics. | **Current implemented surface** (`/ethikos/pulse/overview`) |
|  |  | Trends Analytics → `opinion_trends` | Show time-based participation / sentiment / activity trends. | **Current implemented surface** (`/ethikos/pulse/trends`) |
|  | **Impact** | Feedback Loop → `feedback_loop` | Capture structured user feedback on Ethikos debates / outcomes. | **Current implemented surface** (`/ethikos/impact/feedback`) |
|  |  | Outcomes → `impact_outcomes` | Summarize implementation / result KPIs flowing from debates and decisions. | **Current implemented surface** (`/ethikos/impact/outcomes`) |
|  |  | Tracker → `impact_tracking` | Track implementation / follow-up state for debate-linked decisions. | **Current implemented surface** (`/ethikos/impact/tracker`) |
|  | **Learn** | Changelog → `ethikos_changelog` | Explain recent changes to Ethikos rules, structure, or experience. | **Current implemented surface** (`/ethikos/learn/changelog`) |
|  |  | Glossary → `ethikos_glossary` | Define concepts, categories, and debate vocabulary. | **Current implemented surface** (`/ethikos/learn/glossary`) |
|  |  | Guides → `ethikos_guides` | Practical guidance for using deliberation, decision, and impact flows. | **Current implemented surface** (`/ethikos/learn/guides`) |
|  | **Admin** | Audit Log → `ethikos_audit_log` | Review administrative actions and operational traceability. | **Current implemented surface** (`/ethikos/admin/audit`) |
|  |  | Moderation → `ethikos_moderation` | Review reports and moderate debate content. | **Current implemented surface** (`/ethikos/admin/moderation`) |
|  |  | Roles → `ethikos_role_admin` | Manage Ethikos-specific administrative access toggles. | **Current implemented surface** (`/ethikos/admin/roles`) |
|  | **Insights** | Opinion Analytics → `opinion_analytics` | Cross-cutting analytics across debates, participation, outcomes, and live metrics. | **Current implemented surface** (`/ethikos/insights`) |
|  | **Roadmap / Target-state** | AI Clones → `ai_clone_management` | Spawn or retire AI agents emulating experts for continuity. | **Target-state / roadmap capability** |
|  |  | Comparative Analysis → `comparative_argument_analysis` | AI compares arguments to surface convergences/divergences. | **Target-state / roadmap capability** |
|  |  | Public Archiving → `public_debate_archive` | Stores immutable snapshots of every debate for transparency. | **Target-state / roadmap capability** |
|  |  | Automated Summaries → `automated_debate_summary` | Generates concise, structured digests of debate outcomes. | **Target-state / roadmap capability** |

| **Reporting & Analytics** | **Insights / Reports** | Insights Home → `insights_home` | Card hub for global analytics entry points. | **Current documented + implemented surface** (`/reports`) |
|  |  | Smart Vote Dashboard → `smart_vote_dashboard` | Voting trends, correlations, and Smart Vote analytics. | **Current documented + implemented surface** (`/reports/smart-vote`) |
|  |  | Usage Dashboard → `usage_dashboard` | MAU / projects / documents / activity views. | **Current documented + implemented surface** (`/reports/usage`) |
|  |  | Performance Dashboard → `performance_dashboard` | API latency, error-rate, and SLO monitoring views. | **Current documented + implemented surface** (`/reports/perf`) |
|  |  | Custom Report Builder → `custom_report_builder` | Compose custom report views from metrics, dimensions, filters, and layout choices. | **Current documented + implemented surface** (`/reports/custom`) |

| **keenKonnect** | **Konstruct** | Virtual Collaboration Spaces → `collaboration_space` | Dedicated project rooms with membership & roles. | Target-state / canonical capability |
|  |  | Project Management Tools → `project_task_management` | Kanban / tasks / milestones inside each space. | Target-state / canonical capability |
|  |  | Real-Time Editing → `real_time_document_editing` | Synchronous co-editing with conflict resolution. | Target-state / canonical capability |
|  |  | Integrated Chat & Video → `integrated_communication` | In-socket messaging and video conferencing per space. | Target-state / canonical capability |
|  |  | AI Collaborative Analysis → `ai_collaboration_analysis` | Summaries & action suggestions generated live during work. | Target-state / canonical capability |
|  | **Stockage** | Secure Repository → `secure_document_storage` | Encrypted file hosting with role-based access. | Target-state / canonical capability |
|  |  | Automatic Versioning → `document_versioning` | Stores every file revision, enables rollback. | Target-state / canonical capability |
|  |  | Intelligent Indexing → `intelligent_indexing` | Auto-tag & keyword extraction for fast search. | Target-state / canonical capability |
|  |  | Real-Time Sync → `real_time_sync` | Pushes file updates instantly to all collaborators. | Target-state / canonical capability |
|  |  | Fine Grained Permissions → `granular_permissions` | Read/write/admin rules per user per document. | Target-state / canonical capability |

| **KonnectED** | **CertifiKation** | Certification Paths → `certification_path_management` | Define modular learning paths linked to competencies. | Target-state / canonical capability |
|  |  | Automated Evaluation → `automated_evaluation` | AI/rule-based tests & auto-grading. | Target-state / canonical capability |
|  |  | Peer Validation → `peer_validation` | Qualified peers approve or reject skill evidence. | Target-state / canonical capability |
|  |  | Skills Portfolio → `skills_portfolio` | Personal showcase of validated competencies & artifacts. | Target-state / canonical capability |
|  |  | Interoperability (LMS) → `certification_interoperability` | Map/import/export certifications with external systems. | Target-state / canonical capability |
|  | **Knowledge** | Collaborative Library → `library_resource_management` | CRUD and classify shared learning resources. | Target-state / canonical capability |
|  |  | Personalized Recommendations → `personalized_recommendation` | ML recommends relevant resources per learner profile. | Target-state / canonical capability |
|  |  | Co-Creation Tools → `content_co_creation` | Real-time authoring/versioning of lessons & media. | Target-state / canonical capability |
|  |  | Thematic Forums → `thematic_forum` | Subject-based discussion boards with moderation. | Target-state / canonical capability |
|  |  | Learning Progress Tracking → `learning_progress_tracking` | Dashboards showing completion %, strengths, goals. | Target-state / canonical capability |

| **Kreative** | **Konservation** | Digital Archives → `digital_archive_management` | Long-term storage of digitized artworks / media. | Target-state / canonical capability |
|  |  | Virtual Exhibitions → `virtual_exhibition` | Interactive online galleries & VR rooms. | Target-state / canonical capability |
|  |  | Documentation Base → `archive_documentation` | Store bios, provenance, supplemental docs. | Target-state / canonical capability |
|  |  | AI Enriched Catalogue → `ai_enriched_catalogue` | Auto-classification & metadata generation for art. | Target-state / canonical capability |
|  |  | Cultural Partners Integration → `cultural_partner_integration` | Sync external museum/heritage collections. | Target-state / canonical capability |
|  | **Kontact** | Professional Profiles → `professional_profile` | Rich artist/diffuser profiles (bio, portfolio, skills). | Target-state / canonical capability |
|  |  | Intelligent Matching → `intelligent_matching` | Recommends contacts/collaborations via skills & style. | Target-state / canonical capability |
|  |  | Collaboration Workspaces → `collaboration_workspace` | Shared project rooms (specific to networking context). | Target-state / canonical capability |
|  |  | Opportunities Board → `opportunity_announcement` | Post & search residencies, exhibitions, calls, jobs. | Target-state / canonical capability |
|  |  | Reviews & Endorsements → `partner_recommendation` | Rate & endorse partners after collaborations. | Target-state / canonical capability |

---

## **How to Use These Code Names**

- **Backend (Django)** — code names map to services, serializers, viewsets, model workflows, or background jobs.
- **Frontend (Next.js / React)** — code names map to page surfaces, hooks, dashboards, or interaction flows.
- **Documentation / roadmap tracking** — treat the **Status / Current Surface** column as the source of truth for whether a capability is already surfaced in the current app or still belongs to target-state planning.

## **Status Semantics**

- **Current implemented surface** — visible in the present route structure and frontend module surfaces.
- **Current documented + implemented surface** — explicitly present both in code and in the current UI spec.
- **Target-state / roadmap capability** — valid architectural/product intent, but not treated as a fully verified surfaced feature in the current implementation.