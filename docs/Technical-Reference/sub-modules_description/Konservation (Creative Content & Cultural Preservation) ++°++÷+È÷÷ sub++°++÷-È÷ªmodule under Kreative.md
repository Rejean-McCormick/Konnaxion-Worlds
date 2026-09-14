**Konservation (Creative Content & Cultural Preservation)** — sub‑module under **Kreative**.  
 Implements five core services with named code‑functions, backed by dedicated models and frozen parameters.

---

### **1\) Functional Services (and expected files)**

Code‑names follow the v14 inventory and map 1:1 to service modules.

| Display name | Code name / service | Purpose / behavior | Likely file or module |
| ----- | ----- | ----- | ----- |
| Digital Archives | `digital_archive_management` | Ingest, store, and retrieve digitized artworks and heritage media; handle provenance and rights metadata. | `kreative/services/digital_archive.py` |
| Virtual Exhibitions | `virtual_exhibition` | Build interactive online galleries/VR rooms from curated sets; enforce per‑room capacity; publish exhibits. | `kreative/services/virtual_exhibition.py` |
| Documentation Base | `archive_documentation` | Manage bios, provenance notes, and supplemental documents attached to artworks/galleries. | `kreative/services/archive_documentation.py` |
| AI‑Enriched Catalogue | `ai_enriched_catalogue` | Auto‑classify artworks, generate tags/labels and fill style/medium using ML; writes to tagging/metadata. | `kreative/services/catalogue_ai.py` and `kreative/tasks/ai_enrichment.py` |
| Cultural Partners Integration | `cultural_partner_integration` | Import/sync collections from partner museums/heritage systems; map external metadata to local schema. | `kreative/services/partner_integration.py` and `kreative/tasks/partner_ingest.py` |

Mapping guidance (“each code name maps to a service module”) per the Functional Code‑Name Inventory.

---

### **2\) Backend Functionalities**

* **Artwork & media lifecycle.** Upload, validate, and persist artworks; generate multiple image renditions for fast delivery; enforce upload size and allowed media types.

* **Curation & exhibitions.** Curators assemble **Galleries** (ordered sets) and publish **Virtual Exhibitions** with capacity limits per room.

* **Tagging & discovery.** Global **Tag** vocabulary with many‑to‑many mapping to artworks; AI service can propose tags and styles.

* **Heritage submissions.** Community submits **TraditionEntry** items (media \+ description \+ region) to the archive; moderator approval workflow.

* **Rights, privacy, and moderation.** NSFW flag on upload; shared moderation policies across modules; provenance and creator attribution preserved.

* **API & stack.** Exposed via Django REST Framework to the Next.js frontend; object storage for media; background workers for image/AI pipelines.

---

### **3\) Database Models (OLTP)**

Canonical tables for Konservation content and curation.

| Table / Model | Purpose | Key fields (excerpt) |
| ----- | ----- | ----- |
| `KreativeArtwork` | A single artwork or creative work (image/video/audio/other). | `id`, `artist` (FK User), `title`, `description`, `media_file`, `media_type` (ENUM), `year`, `medium`, `style` |
| `Tag` | Global tagging vocabulary reused by artworks (and other content). | `id`, `name` (unique) |
| `ArtworkTag` | Join table linking artworks ↔ tags (M2M; unique per pair). | `id`, `artwork` (FK), `tag` (FK) |
| `Gallery` | Curated collection or exhibition container. | `id`, `title`, `description`, `created_by` (FK User, nullable), `theme`, `created_at` |
| `GalleryArtwork` | Through‑table to place artworks in a gallery with order. | `id`, `gallery` (FK), `artwork` (FK), `order` |
| `TraditionEntry` | Cultural heritage submission for long‑term archive. | `id`, `title`, `description`, `region`, `media_file`, `submitted_by` (FK, nullable), `submitted_at`, `approved` (bool), `approved_by` (FK, nullable), `approved_at` |

Models live under the Kreative app (e.g., `kreative/models/artwork.py`, `gallery.py`, `tradition.py`).

---

### **4\) Supporting Configuration (frozen)**

Operational parameters and invariants affecting Konservation features.

* **ARTWORK\_MAX\_IMAGE\_MB:** **50 MB** — upload limit for image media.

* **ARTWORK\_RESOLUTIONS:** **\[256, 1024, 2048\]** px — renditions generated on ingest.

* **VIRTUAL\_GALLERY\_CAPACITY:** **24 artworks / room** — enforced by `virtual_exhibition`.

* **NSFW\_FLAG\_REQUIRED:** boolean (default **False**) — surfaced in upload form and display gates.

* **MEDIA\_ROOT:** `/app/media/` — single bucket mount for all modules (shared invariant).

---

### **5\) Routes & Ownership (UI)**

Top‑level navigation and page ownership for this sub‑module.

* **/kreative** — Creativity Hub (tabs: Gallery, Incubator, Virtual Exhibitions).

* **/art/\[id\]** — Artwork Sheet (details, comments, metadata).

* **/archive** — Konservation Archive (Heritage, Partners).

---

### **6\) DevOps & Tasks**

* **Image pipeline.** Celery task generates `ARTWORK_RESOLUTIONS` on upload; stores renditions alongside originals in object storage.

* **AI enrichment.** Scheduled worker applies `ai_enriched_catalogue` to new/updated artworks (tags, style/medium suggestions).

* **Partner ingest.** Periodic sync jobs fetch external collections and map metadata via `cultural_partner_integration`.

* **Publishing.** Exhibition build step compiles gallery selections into front‑end consumables (JSON descriptors / assets), respecting capacity limits.

---

### **Summary**

Konservation provides **digital archiving**, **virtual exhibitions**, **documentation**, **AI‑assisted cataloguing**, and **partner integrations** via the five services above, grounded in the `KreativeArtwork`, `Gallery`, `Tag/ArtworkTag`, and `TraditionEntry` models and governed by fixed upload, rendition, and exhibition parameters.

