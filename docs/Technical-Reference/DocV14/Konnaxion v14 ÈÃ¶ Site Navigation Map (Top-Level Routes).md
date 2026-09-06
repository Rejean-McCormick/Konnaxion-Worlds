# Navigation Map

The list below presents **every top-level page (route)** that a user can reach from the main sidebar, module hubs, or intent cards, grouped by module and sub-module.  
Nested **tabs, drawers or modals** are noted → they do **not** create extra routes but keep related tasks together.  
All names preserve the K-branding where still relevant and avoid duplicating boilerplate authentication or error screens.

> **Revision note:** The **ethiKos** and **Insights / Reports** sections below were updated to reflect the currently implemented frontend routes. Other module sections are carried forward from the previous navigation map and should be audited module-by-module in a later doc pass.

---

## Global & Cross-Module Shell

| Route | Page name | What a user achieves |
| ----- | ----- | ----- |
| `/` | **Home / Explore** | Choose an intent card (*Debate*, *Build*, *Learn*, *Showcase*, *Connect*) and see a personalised activity feed drawn from all modules. |
| `/my-work` | **My Work** | Timeline of all debates, projects, certificates and artworks in which the user is involved, with quick-resume links. |
| `/reports` | **Insights Hub** | Entry point to analytics dashboards: Smart Vote, Usage, API Performance, and Custom Reports. |
| `/search` | **Global Search** | Unified keyword search across all content types using the common index. |

---

## Kollective Intelligence

| Route | Page name | In-page tabs / functions | User value |
| ----- | ----- | ----- | ----- |
| `/konsensus` | **Konsensus Center** | *Results* · *Leaderboards* · *Smart Vote* | Observe collective metrics, join merit-weighted polls, inspect influence of expertise. |
| `/ekoh` | **Ekoh Dashboard** | *Score Analytics* · *Voting Weight* · *Expertise Areas* · *Badges* | Understand and explain one’s reputation and influence. |

---

## ethiKos

### Deliberate

| Route | Page name | What the user does |
| ----- | ----- | ----- |
| `/ethikos/deliberate/elite` | **Deliberate · Elite Agora** | Browse and start expert-only structured debates. |
| `/ethikos/deliberate/[topic]` | **Deliberate · Topic** | Read a topic thread, post arguments, and submit a stance on the −3…+3 scale. |
| `/ethikos/deliberate/guidelines` | **Deliberate · Guidelines** | Read participation rules and debate methodology before contributing. |

### Decide

| Route | Page name | What the user does |
| ----- | ----- | ----- |
| `/ethikos/decide/public` | **Decide · Public** | Participate in public consultation-style decisions. |
| `/ethikos/decide/elite` | **Decide · Elite** | Review expert-scoped decision topics and previews. |
| `/ethikos/decide/results` | **Decide · Results** | View aggregated decision outcomes. |
| `/ethikos/decide/methodology` | **Decide · Methodology** | Read how weighted and nuanced decision logic works. |

### Pulse

| Route | Page name | What the user does |
| ----- | ----- | ----- |
| `/ethikos/pulse/health` | **Pulse · Health** | Inspect participation health and balance indicators. |
| `/ethikos/pulse/live` | **Pulse · Live** | Watch live activity and recent participation signals. |
| `/ethikos/pulse/overview` | **Pulse · Overview** | View summary metrics for debate and stance activity. |
| `/ethikos/pulse/trends` | **Pulse · Trends** | Analyse changes in participation and sentiment over time. |

### Impact

| Route | Page name | What the user does |
| ----- | ----- | ----- |
| `/ethikos/impact/feedback` | **Impact · Feedback** | Submit and review structured feedback tied to Ethikos flows. |
| `/ethikos/impact/outcomes` | **Impact · Outcomes** | Inspect aggregated outcomes and participation KPIs. |
| `/ethikos/impact/tracker` | **Impact · Tracker** | Track topic/project-like impact items and status progress. |

### Trust

| Route | Page name | What the user does |
| ----- | ----- | ----- |
| `/ethikos/trust/badges` | **Trust · Badges** | View earned trust / badge signals. |
| `/ethikos/trust/credentials` | **Trust · Credentials** | View and manage credentials-related trust records. |
| `/ethikos/trust/profile` | **Trust · Profile** | Inspect the user’s debate reputation and trust profile. |

### Learn

| Route | Page name | What the user does |
| ----- | ----- | ----- |
| `/ethikos/learn/changelog` | **Learn · Changelog** | Review release notes and product changes. |
| `/ethikos/learn/glossary` | **Learn · Glossary** | Browse core terminology and category vocabulary. |
| `/ethikos/learn/guides` | **Learn · Guides** | Read practical guides for using Ethikos flows. |

### Admin

| Route | Page name | What the user does |
| ----- | ----- | ----- |
| `/ethikos/admin/audit` | **Admin · Audit** | Review audit events and traceability records. |
| `/ethikos/admin/moderation` | **Admin · Moderation** | Moderate topic and contribution flows. |
| `/ethikos/admin/roles` | **Admin · Roles** | Review and manage role-related access within Ethikos. |

### Analytics

| Route | Page name | What the user does |
| ----- | ----- | ----- |
| `/ethikos/insights` | **Opinion Analytics** | Analyse stance shifts, participation metrics, and cross-cutting Ethikos analytics. |

---

## Insights / Reports

| Route | Page name | What the user does |
| ----- | ----- | ----- |
| `/reports` | **Insights** | Open the analytics hub for Smart Vote, Usage, and API Performance. |
| `/reports/custom` | **Custom Report Builder** | Compose ad hoc analytics views by choosing metrics, dimensions, filters, and layout. |
| `/reports/smart-vote` | **Smart Vote Dashboard** | Analyse weighted voting trends and related participation metrics. |
| `/reports/usage` | **Usage Dashboard** | Review adoption, activity, and usage volume metrics. |
| `/reports/perf` | **API Performance Dashboard** | Monitor latency, reliability, and error-rate trends. |

---

## keenKonnect

| Route | Page name | Tabs | User value |
| ----- | ----- | ----- | ----- |
| `/projects` | **Project Studio** | *Browse* · *Create* · *My Projects* | Discover or start collaboration spaces. |
| `/projects/[slug]` | **Workspace** | *Overview* · *Tasks* · *Blueprints* · *Chat* · *AI Insights* · *Settings* | End-to-end project execution with real-time tools. |
| `/impact` | **Impact Dashboard** | Single view | Track sustainability and social-impact metrics across projects. |

---

## KonnectED

| Route | Page name | Tabs | User value |
| ----- | ----- | ----- | ----- |
| `/learn` | **Learning Library** | *Catalog* · *Recommendations* · *Offline Download* | Browse or cache educational content. |
| `/course/[slug]` | **Course Player** | *Lessons* · *Assessments* · *Progress* | Follow sequenced learning and quizzes. |
| `/certs` | **CertifiKation Center** | *Programs* · *My Certificates* | Earn, view and download credentials. |

---

## Kreative (+ Kontact)

| Route | Page name | Tabs | User value |
| ----- | ----- | ----- | ----- |
| `/kreative` | **Creativity Hub** | *Gallery* · *Incubator* · *Virtual Exhibitions* | Showcase art, propose ideas, attend immersive shows. |
| `/art/[id]` | **Artwork Sheet** | *Details* · *Comments* · *Metadata* | Deep dive into a single piece, applaud, discuss. |
| `/archive` | **Konservation Archive** | *Heritage* · *Partners* | Explore cultural-heritage assets. |
| `/connect` | **Connect Center** | *People* · *Opportunities* · *Workspace* | Network with creators, join residencies, open collaboration rooms. |
| `/profile/[user]` | **Public Profile** | *Portfolio* · *Reviews* | View another user’s artistic résumé. |

---

## Communication & Administration

| Route | Page name | Purpose |
| ----- | ----- | ----- |
| `/chat` | **Messenger** | Direct / group chat, video toggle. |
| `/team` | **Team Manager** | Invite members, assign roles. |
| `/admin` | **Admin Console** | Moderation queue, user and stats management. |

---

## Top-Level Route Count

| Module or area | Distinct routes |
| ----- | ----- |
| Global shell & search | 4 |
| Kollective Intelligence | 2 |
| ethiKos | 24 |
| Insights / Reports | 5 |
| keenKonnect | 3 |
| KonnectED | 3 |
| Kreative / Kontact | 5 |
| Communication & Admin | 3 |
| **Total** | **49** |

*(This revision replaces the older compact Ethikos route model with the currently implemented route surface and adds the implemented Reports dashboards.)*