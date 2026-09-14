**Stockage (Secure Repository & Versioned Storage)** — second sub‑module under **keenKonnect**.  
 Implements five services with defined code‑names, backed by project‑scoped resource models and fixed storage/search parameters.

---

### **1\) Functional Services (and expected files)**

Code‑names come from the v14 services inventory; each maps to a Django service module imported by API controllers and Celery tasks.

| Display name | Code name / service | Purpose / behavior | Likely file or module |
| ----- | ----- | ----- | ----- |
| Secure Repository | `secure_document_storage` | Persist files with authenticated access and per‑project visibility. | `apps/keenkonnect/services/secure_storage.py` |
| Automatic Versioning | `document_versioning` | Maintain sequential revisions; enable diff/rollback semantics. | `apps/keenkonnect/services/document_versioning.py` |
| Intelligent Indexing | `intelligent_indexing` | Extract metadata/keywords; update full‑text search index. | `apps/keenkonnect/services/indexing.py` |
| Real‑Time Sync | `real_time_sync` | Broadcast file add/update/delete to active collaborators. | `apps/keenkonnect/services/real_time_sync.py`, `apps/keenkonnect/channels/consumers.py` |
| Fine‑Grained Permissions | `granular_permissions` | Enforce document‑level ACLs beyond project roles. | `apps/keenkonnect/services/permissions.py` |

---

### **2\) Backend Functionalities**

* **Upload & storage pipeline.** Accept files under an explicit size/type policy; persist metadata and storage URL on the `ProjectResource` table; store blobs in the configured media bucket (S3/MinIO).

* **Versioning semantics.** Expose create‑new‑revision, list revisions, restore, and compute diffs via `document_versioning`. The Database Reference documents `ProjectResource` as the current file record; dedicated version entities are not detailed there and can be added alongside this service.

* **Indexing & search.** On upload/update, `intelligent_indexing` extracts text/keywords and refreshes the platform’s PostgreSQL full‑text index (SEARCH\_BACKEND=“postgres”), enabling global search and in‑workspace filtering.

* **Access control.** Enforce read/write/admin by project membership (`ProjectTeam`) and, where required, per‑document ACL through `granular_permissions`. Current schema formalizes project‑level roles; document‑level ACL tables are not enumerated in the v14 schema file.

* **Real‑time notifications.** `real_time_sync` uses Django Channels over Redis to push “file added/updated/removed” events to clients in `/projects/[slug]` workspaces.

---

### **3\) Database Models**

Stockage persists file metadata as project resources; project membership governs default access.

| Table / Model | Purpose | Key fields (abridged) |
| ----- | ----- | ----- |
| `ProjectResource` | Link a document/file (blueprint, image, 3D model, guide) to a project. | `id`, `project`, `title`, `url`, `added_by`, timestamps |
| `Project` | Workspace container for resources and collaboration. | `id`, `title`, `description`, `creator`, `category`, `status` |
| `ProjectTeam` | Membership & role for access control. | `id`, `project`, `user`, `role`, `joined_at` |
| `Tag` | Reusable keywords for classification (optional). | `id`, `name` |

*Notes.* The schema file does not list dedicated version/ACL tables for documents; if `document_versioning`/`granular_permissions` introduces them, add to the canonical schema alongside `ProjectResource`.

---

### **4\) Supporting Configuration (frozen)**

* **File size cap:** `MAX_BLUEPRINT_UPLOAD_MB = 150`.

* **Allowed types:** `[".pdf", ".png", ".jpg", ".glb", ".gltf", ".stl"]`.

* **Search backend:** `SEARCH_BACKEND = "postgres"` (tsvector indexing).

* **Realtime layer:** Channels backend \= `channels_redis.core.RedisChannelLayer`.

* **Media root/bucket:** `MEDIA_ROOT=/app/media/` (object storage mount used across modules).

---

### **5\) Routes & UI Surface**

* Users access Stockage features inside project workspaces: **/projects** and **/projects/\[slug\] → “Blueprints” tab** for uploads, previews, version/history, and permissions UI. Route ownership lives with keenKonnect.

---

### **6\) Runtime & Real‑Time**

* **Object storage & previews.** Files live in the media bucket; optional workers can generate previews/conversions (e.g., glTF thumbnails) per the technical spec’s storage guidance.

* **WebSockets.** Document events publish to project channel groups so collaborators see updates without refresh.

---

### **Summary**

Stockage provides `secure_document_storage`, `document_versioning`, `intelligent_indexing`, `real_time_sync`, and `granular_permissions`. Today’s schema centers on `ProjectResource` within `/projects/[slug]` workspaces, governed by `ProjectTeam` roles, with search on PostgreSQL tsvectors and real‑time updates via Channels/Redis. Version and per‑document ACL tables can be added when those services move from interface to implementation.     

