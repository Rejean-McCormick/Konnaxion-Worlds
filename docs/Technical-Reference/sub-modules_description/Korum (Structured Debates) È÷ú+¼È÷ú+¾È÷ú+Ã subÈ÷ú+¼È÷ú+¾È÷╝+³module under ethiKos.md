**Korum (Structured Debates)** — sub‑module under **ethiKos**.  
 Implements five core services with defined code‑names, backed by concrete debate/stance/argument models and fixed parameters.

---

### **1\) Functional Services (and expected files)**

Each service name is stable and maps to a dedicated Django service module (file paths reflect the cookiecutter layout; exact filenames may vary by repo).

| Display name | Code name / service | Purpose / behavior | Likely file or module |
| ----- | ----- | ----- | ----- |
| Structured Debates | `structured_debate` | Create and manage ordered debate sequences and topics. | `ethikos/services/structured_debate.py` |
| Klônes IA | `ai_clone_management` | Manage AI expert‑emulating agents for continuity/testing. | `ethikos/services/ai_clone_management.py` |
| Comparative Analysis | `comparative_argument_analysis` | Compare arguments to surface convergences/divergences. | `ethikos/services/comparative_argument_analysis.py` |
| Public Archiving | `public_debate_archive` | Produce immutable debate snapshots for transparency. | `ethikos/services/public_debate_archive.py` |
| Automated Summaries | `automated_debate_summary` | Generate concise, structured debate outcome digests. | `ethikos/services/automated_debate_summary.py` |

---

### **2\) Backend functionalities**

* **Debate lifecycle:** CRUD for topics with status transitions (open/closed/archived), category assignment, and owner/moderation rules; exposed via DRF.

* **Threaded arguments:** Nested replies under each topic with optional “pro/con” flag and moderation hooks.

* **Nuanced stance capture:** Integer stance scale −3…+3 per user/topic; integrates with Smart Vote for weighted aggregation.

* **Weighted results & cohorts:** Results recomputed by expertise cohorts (EkoH) and other filters; realtime push optional via Channels/Redis.

* **Quality & moderation:** Report/auto‑hide thresholds; flagged content routed to shared moderation queue.

---

### **3\) Database models (OLTP)**

Actual implemented tables for Korum (planned AI/summary/archive tables are intentionally omitted in v14).

| Table / Model | Purpose | Key fields |
| ----- | ----- | ----- |
| `EthikosCategory` | Thematic categories for debates. | `id`, `name`, `description` |
| `EthikosTopic` | Debate topic/question. | `id`, `title`, `status`, `start_date`, `end_date` |
| `EthikosStance` | User stance on a topic (−3…+3). | `id`, `topic` (FK), `user` (FK), `value` |
| `EthikosArgument` | User argument/post (threaded). | `id`, `topic` (FK), `author` (FK), `content`, `parent` (FK), `side` (enum, optional) |

Note: AI clones, comparative‑analysis logs, public archives, and debate summaries are listed as services but not present as tables in the current schema snapshot.

---

### **4\) Supporting configuration (frozen)**

* **Stance scale:** −3 … \+3 (0 \= neutral).

* **Expert cohort quorum (display):** 12 distinct experts (Ekoh threshold per domain).

* **Moderation auto‑hide:** Hide an argument after 3 independent reports.

* **AI clone training batch:** 128 records.

---

### **5\) Frontend & navigation**

* **Routes:** `/debate` (Debate Hub: Open / Archived / Start New), `/ethikos/insights` (opinion analytics dashboards).

* **Behavior:** Stance slider (−3…+3), live tallies, cohort filters, threaded arguments; analytics readouts live under Insights.

---

### **6\) Integration points**

* **EkoH & Smart Vote:** Stances are aggregated using EkoH reputation to compute weighted results; outcomes can feed analytics (/reports/smart‑vote).

* **Insights module:** ETL ingests vote/stance facts; dashboards render trends with export limits and privacy safeguards (k‑anonymity, hashed IDs).

---

### **7\) Realtime & ops**

* **Push updates:** Optional WebSocket broadcasts via Django Channels \+ Redis for stance/result changes.

* **Caching & rate control:** Use Redis caching for common cohort filters; apply API throttles consistent with platform policy.

---

### **Summary**

Korum provides structured topic management, nuanced stance capture, and threaded argumentation, with weighted consensus via EkoH/Smart Vote. Its five named services are stable integration points; the production schema covers categories, topics, stances, and arguments, while advanced AI/archive features run as services without additional OLTP tables in v14. Routes and parameters are version‑locked to ensure predictable behavior across UI, API, and analytics.    

