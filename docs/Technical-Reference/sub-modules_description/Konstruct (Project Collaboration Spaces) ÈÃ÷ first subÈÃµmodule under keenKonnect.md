**Konstruct (Project Collaboration Spaces)** — first sub‑module under **keenKonnect**.  
 Implements five core services with concrete code‑names, backed by project/task/chat models and fixed parameters.

---

### **1\) Functional Services (and expected files)**

| Display name | Code name / service | Purpose / behavior | Likely file or module | Status |
| ----- | ----- | ----- | ----- | ----- |
| Virtual Collaboration Spaces | `collaboration_space` | Create/join project rooms with membership, roles, and access rules. | `keenkonnect/services/collaboration_space.py` | Implemented (projects & teams) |
| Project Management Tools | `project_task_management` | Tasks, Kanban states, assignees, due dates, and activity logs. | `keenkonnect/services/project_task_management.py` | Implemented (tasks) |
| Real‑Time Editing | `real_time_document_editing` | Synchronous co‑editing of docs; conflict resolution (OT/CRDT pattern). | `keenkonnect/services/real_time_document_editing.py` | Planned (MVP uses resource versioning) |
| Integrated Chat & Video | `integrated_communication` | Per‑project chat via sockets; optional video sessions via provider. | `keenkonnect/services/integrated_communication.py` | Chat implemented; video wired by env |
| AI Collaborative Analysis | `ai_collaboration_analysis` | Live summaries, action suggestions, and collaborator recommendations. | `keenkonnect/services/ai_collaboration_analysis.py` | Implemented (summaries/reco service) |

Code‑names and scope are defined in the v14 service inventory.

---

### **2\) Backend Functionalities**

* **Project lifecycle & membership.** Create/update/archive projects; manage membership and roles; enforce access on project‑scoped endpoints.

* **Tasking.** CRUD tasks with statuses (todo/in‑progress/done/blocked), assignment, due dates, ordering; emits project activity events.

* **Resources & blueprints.** Attach documents and 3D assets; optional background conversion/previews for CAD/3D models (e.g., glTF) via worker jobs.

* **Collaboration channels.** Real‑time project chat over WebSockets; optional video sessions bound by provider config; rate‑limits and moderation hooks applied.

* **Real‑time document editing (MVP).** Until dedicated models land, uses resource versioning plus optimistic locking; planned upgrade to true real‑time persistence.

* **AI assistance.** Generate meeting notes, decisions, and next‑actions from chat/tasks; recommend collaborators based on skills/Ekoh domains.

---

### **3\) Database Models (OLTP)**

Actual models present in the codebase for Konstruct‑level collaboration; names/purposes below.

| Table / Model | Purpose | Key fields (abridged) |
| ----- | ----- | ----- |
| `Project` | Project workspace container. | `id`, `title`, `description`, `creator`, `category`, `status` |
| `ProjectResource` | Files/links attached to a project (incl. blueprints). | `id`, `project`, `title`, `url`, `added_by` |
| `ProjectTask` | Tasks/milestones for the project. | `id`, `project`, `title`, `description`, `assignee`, `status`, `due_date` |
| `ProjectMessage` | Project chat/message history. | `id`, `project`, `sender`, `content` |
| `ProjectTeam` | Membership and roles. | `id`, `project`, `user`, `role`, `joined_at` |
| `ProjectRating` | Community validation signal. | `id`, `project`, `user`, `rating`, `comment` |
| `Tag` | Reusable keyword taxonomy. | `id`, `name` |

**Not present (planned names suggested by docs):** `RealTimeDocument`, `DocumentRevision`, `VideoSession`, `AIInteractionLog`. The schema note explicitly calls these out as missing today.

---

### **4\) Supporting Configuration (frozen)**

| Parameter | Location | Final value / notes |
| ----- | ----- | ----- |
| `MAX_BLUEPRINT_UPLOAD_MB` | `settings.STORAGE` | **150 MB** maximum per file |
| `ALLOWED_BLUEPRINT_TYPES` | `ProjectResource` | `[".pdf", ".png", ".jpg", ".glb", ".gltf", ".stl"]` |
| `COLLAB_SPACE_MEMBER_CAP` | `CollaborationSpace` | **40** members per space |
| `AI_SUGGESTION_TOP_N` | `settings.KEENKONNECT` | **8** collaborator suggestions |
| `VIDEO_SESSION_PROVIDER` | env `KC_VIDEO_PROVIDER` | `"livekit"` (self‑hosted) |

These parameters are locked in the Global Parameter Reference.

---

### **5\) Routes & UI Surface**

* **/projects** → Project Studio (Browse, Create, My Projects).

* **/projects/\[slug\]** → Single Workspace with tabs: **Overview**, **Tasks**, **Blueprints**, **Chat**, **AI Insights**, **Settings**.  
   Top‑level routing invariants assign these paths to the keenKonnect app.

---

### **6\) Runtime & real‑time**

* **WebSockets:** Django Channels \+ Redis for chat/notifications; project‑scoped groups per workspace.

* **File storage:** Object storage (S3/MinIO) for blueprints; optional preview/convert workers for 3D assets.

* **Video:** Session bootstrap via the configured provider (`KC_VIDEO_PROVIDER`).

---

### **Summary**

Konstruct exposes five services—`collaboration_space`, `project_task_management`, `real_time_document_editing`, `integrated_communication`, `ai_collaboration_analysis`—implemented over the `Project`, `ProjectTask`, `ProjectMessage`, `ProjectTeam`, `ProjectResource`, `ProjectRating`, and `Tag` models, with fixed size/type/member caps and dedicated routes under `/projects`. Real‑time editing is currently backed by resource versioning, with dedicated models planned.    

