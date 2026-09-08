**Knowledge (Collaborative Learning Library)** — sub‑module under **KonnectED**.  
 Implements five concrete services with code‑names, backed by specific tables and fixed parameters, and exposed through the **/learn** and **/course/** flows.

---

### **1\) Functional Services (and expected files)**

Code‑name → service module mapping follows the v14 inventory convention.

| Display name | Code name / service | Purpose / behavior | Likely file or module |
| ----- | ----- | ----- | ----- |
| Collaborative Library | `library_resource_management` | CRUD, classify, and publish library resources; enforce type enums and moderation. | `services/library_resource_management.py` |
| Personalized Recommendations | `personalized_recommendation` | Suggest resources per learner profile, usage, and expertise signals. | `services/personalized_recommendation.py` |
| Co‑Creation Tools | `content_co_creation` | Real‑time authoring/versioning of lessons and media with contribution workflow. | `services/content_co_creation.py` |
| Thematic Forums | `thematic_forum` | Subject‑based discussion boards tied to resources and courses. | `services/thematic_forum.py` |
| Learning Progress Tracking | `learning_progress_tracking` | Track per‑user progress and completion across resources/lessons. | `services/learning_progress_tracking.py` |

---

### **2\) Backend Functionalities**

* **Library management & contribution.** Resource CRUD with enforced content types, draft/publish states, and per‑user draft caps; surfaced in **/learn**.

* **Search & discovery.** Full‑text search over titles/descriptions using the platform’s PostgreSQL tsvector backend; results feed the library listing and global search.

* **Recommendations.** Periodic or on‑demand generation of **KnowledgeRecommendation** rows per user; ranking blends popularity, recency, and profile relevance.

* **Co‑creation workflow.** Collaborative editing spaces for lessons/media with versioned **CoCreationContribution** entries; authors can iterate before publishing to the library.

* **Forums.** Topic and post threads by theme/subject with moderation hooks; linked from resource or course views and listed under **/learn**.

* **Progress tracking & player.** The **/course/\[slug\]** player reads/writes **LearningProgress** to drive completion %, resumes, and achievements.

* **Offline distribution.** Scheduled packaging of selected knowledge content for low‑connectivity environments.

---

### **3\) Database Models**

Custom tables for Knowledge, Co‑Creation, and Forums; plus recommendation/progress records.

| Table / Model | Purpose | Key fields |
| ----- | ----- | ----- |
| **KnowledgeResource** | Canonical library item (article, video, lesson, quiz, dataset). | `id`, `title`, `type` *(enum)*, `url`, `author` |
| **KnowledgeRecommendation** | Records a recommended resource for a user. | `id`, `user`, `resource`, `recommended_at` |
| **LearningProgress** | Per‑user progress for a resource/lesson. | `id`, `user`, `resource`, `progress_percent` *(unique per user+resource)* |
| **CoCreationProject** | Collaborative content project container. | `id`, `title`, `status` *(enum)* |
| **CoCreationContribution** | Individual draft/edit within a project. | `id`, `project`, `user`, `content` |
| **ForumTopic** | Thematic forum thread (subject/question). | `id`, `title`, `category`, `creator` |
| **ForumPost** | Post/reply within a topic. | `id`, `topic`, `author`, `content` |

---

### **4\) Supporting Configuration & Routes**

* **Allowed content types (enum):** `article`, `video`, `lesson`, `quiz`, `dataset`.

* **Draft cap:** `MAX_CONTRIBUTION_DRAFTS = 10` per user.

* **Search backend:** `SEARCH_BACKEND = "postgres"` (tsvector).

* **Offline packaging schedule:** `OFFLINE_PACKAGE_CRON = 0 3 * * SUN`.

* **Navigation:** **/learn** (Catalog, Recommendations, Offline Download) and **/course/\[slug\]** (Course Player: Lessons, Assessments, Progress).

---

### **Summary**

Knowledge delivers the learning library and its social layer: resource management, personalized recommendations, collaborative authoring, themed forums, and progress tracking. It provides five named services (`library_resource_management`, `personalized_recommendation`, `content_co_creation`, `thematic_forum`, `learning_progress_tracking`) mapped to Django modules and backed by concrete tables and parameters, integrated with **/learn** and **/course/** UX.    

