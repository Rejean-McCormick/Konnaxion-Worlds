**Smart Vote (Weighted Voting System)** — second sub‑module under **Kollective Intelligence**.  
 Implements six core services with explicit code‑names, backed by vote/aggregation models, global parameters, and analytics pipelines.

---

### **1\) Functional Services (and expected files)**

| Display name | Code name / service | Purpose / behavior | Likely file or module |
| ----- | ----- | ----- | ----- |
| Dynamic Weighted Voting | `dynamic_weighted_vote` | Re‑weights each vote in real time using the voter’s EkoH domain weight. | `services/dynamic_weighted_vote.py` |
| Flexible Voting Modalities | `voting_modalities` | Supports approval, ranking, rating, preferential ballots; modality parameters drive tally logic. | `services/voting_modalities.py` |
| Emerging Expert Detection | `emerging_expert_detection` | Flags users whose EkoH score is rising sharply to surface new experts. | `tasks/emerging_expert_detection.py` |
| Transparency of Results | `vote_transparency` | Publishes raw and weighted totals with context (no private data). | `services/vote_transparency.py` |
| Advanced Result Visualizations | `vote_result_visualization` | Produces histograms, distributions, network graphs for outcomes. | `services/vote_result_visualization.py` |
| Cross‑Module Integration | `cross_module_vote_integration` | Makes Smart Vote available across modules (e.g., debates, content, projects). | `services/cross_module_vote_integration.py` |

---

### **2\) Backend Functionalities**

* **Vote intake & aggregation.** API records a per‑user vote on a target (`target_type`, `target_id`), applies EkoH‑weighted scoring, and updates an aggregated result object; concurrency‑safe updates with immediate read‑back for live UIs.

* **Modalities engine.** Aggregation logic switches by `VoteModality` parameters (approval/rating/ranking/preferential); modality configuration stored and read at runtime.

* **Realtime delivery.** Updated tallies pushed via Django Channels \+ Redis for live dashboards and pages displaying current consensus.

* **Cohort/segment views.** Aggregator exposes filtered outcomes (e.g., experts‑only, verified‑only) when the calling module requests segmented results.

* **Cross‑module linkage.** Generic mapping allows any app entity to become a vote target (e.g., debates, consultations, projects).

---

### **3\) Database Models (OLTP)**

| Table / Model | Purpose | Key fields |
| ----- | ----- | ----- |
| `Vote` | Stores each user vote (raw value \+ weighted value). | `id`, `user`, `target_type`, `target_id`, `raw_value`, `weighted_value` |
| `VoteModality` | Config for voting modes (approval, ranking, rating, preferential). | `id`, `name`, `parameters` (JSON) |
| `EmergingExpert` | Flags users with sharp reputation gains. | `id`, `user`, `detection_date`, `score_delta` |
| `VoteResult` | Aggregated totals per target (cumulative weighted sums \+ counts). | `id`, `target_type`, `target_id`, `sum_weighted_value`, `vote_count` |
| `IntegrationMapping` | Cross‑module link from vote context to other modules’ objects. | `id`, `module_name`, `context_type`, `mapping_details` (JSON) |

---

### **4\) Supporting Configuration (frozen)**

* **Vote modalities:** `"approval" | "ranking" | "rating" | "preferential"` (`VOTE_MODALITY_CHOICES`).

* **Emerging expert threshold:** `+15%` EkoH delta over 30 days.

* **Strong consensus threshold:** `≥ 75%` weighted agreement.

---

### **5\) Schedules, Analytics & Runtime**

* **Realtime channel layer:** `channels_redis.core.RedisChannelLayer` used for live result pushes.

* **Analytics ETL:** `etl_smart_vote` runs every **10 minutes** to load OLTP deltas into `smart_vote_fact`; retention **5 years**; cached views power `/reports/smart-vote`.

* **UI surfaces:**

  * **Konsensus Center** (end‑user portal with live polls/results): `/konsensus`.

  * **Insights dashboard (read‑only analytics):** `/reports/smart-vote`.

---

### **Summary**

Smart Vote provides modality‑aware, EkoH‑weighted voting with real‑time aggregation, transparent reporting, and cross‑module targeting. Its models (`Vote`, `VoteModality`, `VoteResult`, `EmergingExpert`, `IntegrationMapping`), frozen parameters, and analytics pipelines make it the consensus backbone across the platform.

