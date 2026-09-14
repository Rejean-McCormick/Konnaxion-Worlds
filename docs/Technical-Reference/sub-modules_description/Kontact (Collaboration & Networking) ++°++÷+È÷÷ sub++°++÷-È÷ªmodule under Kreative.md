**Kontact (Collaboration & Networking)** — sub‑module under **Kreative**.  
 Implements **five core services** with stable code‑names and module ownership under the `/connect` and `/profile/[user]` routes.

---

### **1\) Functional Services (and expected files)**

Code‑names are canonical; each maps 1:1 to a Django service module consumed by DRF views and Celery tasks.

| Display name | Code name / service | Purpose / behavior | Likely file or module |
| ----- | ----- | ----- | ----- |
| Professional Profiles | `professional_profile` | Rich public profiles for creators/diffusers: bio, skills, portfolio links; integrates artwork and tags for discovery. | `kreative/services/professional_profile.py` |
| Intelligent Matching | `intelligent_matching` | Recommends people to follow/contact or invite into collaborations based on skills, tags, and activity signals (Ekoh context optional). | `kreative/services/intelligent_matching.py` |
| Collaboration Workspaces | `collaboration_workspace` | Lightweight networking‑context rooms (chat/notes/canvas) to meet, plan, and co‑create; reuses real‑time infra. | `kreative/services/collaboration_workspace.py` |
| Opportunities Board | `opportunity_announcement` | Post/browse residencies, exhibitions, calls, jobs; searchable by tags, region, dates. | `kreative/services/opportunity_announcement.py` |
| Reviews & Endorsements | `partner_recommendation` | Post‑engagement endorsements/ratings to establish trust and reputation between collaborators/hosts. | `kreative/services/partner_recommendation.py` |

---

### **2\) Backend Functionalities**

* **Profiles & portfolios.** Exposes read/write APIs for creator profiles, linking to existing creative assets (artworks, tags) for rich portfolios and searchability.

* **People matching.** `intelligent_matching` ranks suggested contacts via skills/tags overlap and activity; tunable top‑N, and optional Ekoh/Smart‑Vote signals when relevant.

* **Real‑time meetups.** `collaboration_workspace` provisions ephemeral rooms (DM/group), built on the same Channels/Redis stack used elsewhere; participant cap enforced at runtime.

* **Opportunity lifecycle.** `opportunity_announcement` provides CRUD for postings (type, location, dates, attachments), listing/search, and status (open/closed/filled).

* **Trust signals.** `partner_recommendation` lets collaborators leave structured endorsements after a workspace or engagement concludes; surfaced on profile pages.

* **Routes & ownership.** UI/API bound to **/connect** (People, Opportunities, Workspace) and **/profile/\[user\]** (public profile), per navigation invariants.

---

### **3\) Database Models**

The database reference explicitly lists the **CollabSession** table under Kreative/Kontact. Profiles, opportunities, and endorsements use existing/core objects and Kontact app models not enumerated in that reference.

| Table / Model | Purpose | Key fields (excerpt) |
| ----- | ----- | ----- |
| `CollabSession` | Real‑time collaborative session (networking/co‑creation room). | `id`, `name`, `host (FK User)`, `session_type (ENUM)`, `started_at`, `ended_at`, `final_artwork (FK KreativeArtwork, nullable)` |
| *(Reused)* `KreativeArtwork` | Portfolio items surfaced on profiles (read‑only in Kontact). | `id`, `artist (FK)`, `title`, `media_file`, `media_type`, `style` |
| *(Reused)* `Tag` / `ArtworkTag` | Skills/genre tags used for discovery/matching. | `Tag.name (unique)`; `ArtworkTag (artwork, tag)` |

*Note:* Only `CollabSession` is listed under Kontact in the v14 schema reference; other Kontact records (profiles, opportunities, recommendations) are implemented at the app level and/or reuse core tables.

---

### **4\) Supporting Configuration**

Fixed parameters and route invariants that affect Kontact behavior.

* **COLLAB\_CANVAS\_MAX\_USERS:** **6** simultaneous editors in a real‑time room.

* **MEDIA\_ROOT:** `/app/media/` for attachments (shared across modules).

* **Routes reserved:** `/connect`, `/profile/[user]` owned by Kreative/Kontact; additional nested tabs do not create new top‑level routes.

---

### **Summary**

Kontact delivers networking‑centric capabilities via five services — `professional_profile`, `intelligent_matching`, `collaboration_workspace`, `opportunity_announcement`, `partner_recommendation` — integrated with the Kreative domain and routed under `/connect` and `/profile/[user]`. Data persists primarily through `CollabSession` and reused creative/Tag tables; real‑time rooms and matching leverage the platform’s DRF \+ Channels \+ Redis stack and frozen configuration.     

