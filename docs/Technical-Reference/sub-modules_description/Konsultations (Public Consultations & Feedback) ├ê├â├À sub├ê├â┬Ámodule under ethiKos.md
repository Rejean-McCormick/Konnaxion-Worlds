**Konsultations (Public Consultations & Feedback)** — sub‑module under **ethiKos**.  
 Implements five core services with stable code‑names, backed by consultation/suggestion/vote/result/impact models and frozen routing/analytics invariants.

---

### **1\) Functional Services (and expected files)**

Code‑names map 1:1 to Django service modules; file names follow the `services/<code_name>.py` convention.

| Display name | Code name / service | Purpose / behavior | Likely file or module |
| ----- | ----- | ----- | ----- |
| Public Consultations | `public_consultation` | Create and run time‑boxed civic consultations (setup, schedule, close). | `services/public_consultation.py` |
| Citizen Suggestions | `citizen_suggestion` | Intake pipeline for user‑proposed ideas/amendments feeding into consultations. | `services/citizen_suggestion.py` |
| Weighted Voting (EkoH) | `weighted_consultation_vote` | Cast ballots with optional EkoH‑based weighting; aggregates to results. | `services/weighted_consultation_vote.py` |
| Results Visualization | `consultation_result_visualization` | Compute/serve KPIs and breakdowns for dashboards. | `services/consultation_result_visualization.py` |
| Impact Tracking | `impact_tracking` | Log follow‑up actions and implementation status for adopted proposals. | `services/impact_tracking.py` |

---

### **2\) Backend functionalities**

* **Consultation lifecycle.** CRUD for consultations with scheduling (open/close) and status transitions; business rules on who can launch/manage, exposed via DRF.

* **Suggestion intake → consultation.** Users submit suggestions; moderators/owners triage and link them to an active consultation or backlog for future cycles.

* **Ballots with weighting.** Store raw and EkoH‑weighted ballot values per user/consultation; recompute totals on each vote/change; optional live push via Channels/Redis.

* **Results & dashboards.** Persist snapshot JSONs for totals/segments; serve aggregates to the UI and to the analytics pipeline.

* **Impact follow‑through.** Record action items that implement approved proposals; status progression and audit trail.

---

### **3\) Database models (OLTP)**

Actual tables implemented for Konsultations.

| Table / Model | Purpose | Key fields |
| ----- | ----- | ----- |
| `Consultation` | A consultation instance (time‑boxed). | `id`, `title`, `open_date`, `close_date`, `status` (ENUM) |
| `CitizenSuggestion` | User‑submitted ideas tied to a consultation. | `id`, `consultation` (FK), `author` (FK), `content` |
| `ConsultationVote` | Ballots with raw and EkoH‑weighted values. | `id`, `user` (FK), `consultation` (FK), `raw_value`, `weighted_value` |
| `ConsultationResult` | Aggregated outcomes (snapshot). | `id`, `consultation` (FK), `results_data` (JSONB) |
| `ImpactTrack` | Post‑consultation action log. | `id`, `consultation` (FK), `action`, `status`, `date` |

---

### **4\) Supporting configuration (frozen)**

* **Ballot modalities** (available to consultations via Smart Vote): `approval`, `ranking`, `rating`, `preferential`.

* **Smart‑Vote thresholds** (used when labeling outcomes, platform‑wide): e.g., `CONSENSUS_STRONG_THRESHOLD ≥ 75%` weighted agreement.

* **Route invariants:** `/consult` namespace is owned by **ethiKos** (no other module may claim it).

---

### **5\) Routes & ownership**

* **Primary UI:** `/consult` (**Consultation Hub**) with tabs **Live / Results / Suggest**.

* **Analytics:** `/ethikos/insights` for opinion analytics related to debates/consultations (read‑only).

---

### **6\) Integration points**

* **EkoH weighting & Smart Vote.** Consultation ballots can use the same reputation‑weighted engine as debates; results reflect domain expertise where configured.

* **Insights (ETL \+ dashboards).** Voting events flow to the analytics star schema via `etl_smart_vote` (every 10 min) and power `/reports/smart-vote`.

---

### **7\) Realtime & ops**

* **Live updates:** Optional push of result deltas via Django Channels \+ Redis.

* **Caching:** Use Redis to cache popular result filters/segments to reduce recomputation.

---

**Summary**  
 Konsultations provides time‑boxed consultations, suggestion intake, EkoH‑weighted ballots, and transparent result snapshots through five services (`public_consultation`, `citizen_suggestion`, `weighted_consultation_vote`, `consultation_result_visualization`, `impact_tracking`). Data persists in `Consultation`, `CitizenSuggestion`, `ConsultationVote`, `ConsultationResult`, and `ImpactTrack`; routing is fixed at `/consult`, and analytics integrate with the platform’s Smart‑Vote ETL and dashboards.

