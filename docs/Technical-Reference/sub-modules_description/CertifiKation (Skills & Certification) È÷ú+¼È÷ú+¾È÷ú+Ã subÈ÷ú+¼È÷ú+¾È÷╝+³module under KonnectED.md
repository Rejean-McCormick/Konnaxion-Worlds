**CertifiKation (Skills & Certification)** — sub‑module under **KonnectED**.  
 Implements five core services with fixed code‑names and routes exposed via the DRF backend and `/certs` UI flows.

---

### **1\) Functional Services (and expected files)**

Code‑names come from the v14 Functional Inventory; each maps 1‑to‑1 to a Django service module (e.g., `services/<code_name>.py`).

| Display name | Code name / service | Purpose / behavior | Likely file or module |
| ----- | ----- | ----- | ----- |
| Certification Paths | `certification_path_management` | Define/maintain modular learning paths and competency milestones. | `services/certification_path_management.py` |
| Automated Evaluation | `automated_evaluation` | Auto‑graded quizzes/tests and score calculation with metadata. | `services/automated_evaluation.py` |
| Peer Validation | `peer_validation` | Mentor/peer approval workflow on submitted evidence tied to an evaluation. | `services/peer_validation.py` |
| Skills Portfolio | `skills_portfolio` | User portfolio of validated skills and artifacts, surfaced in “My Certificates.” | `services/skills_portfolio.py` |
| Interoperability (LMS) | `certification_interoperability` | Map/import/export certifications with external LMS/registries. | `services/certification_interoperability.py` |

The inventory explicitly lists these five services for CertifiKation and describes the code‑name→service convention used across modules.

---

### **2\) Backend Functionalities**

* **Program & curriculum management.** CRUD for *CertificationPath* (name, description), ordering of steps, and visibility rules; exposed via DRF to power `/certs` → “Programs.”

* **Evaluations & scoring.** Creating an *Evaluation* per user/path records `raw_score` and structured `metadata` (e.g., answers, rubric). Pass/fail uses frozen thresholds (see CERT\_PASS\_PERCENT), and retries respect a cooldown policy.

* **Peer validation workflow.** *PeerValidation* ties to an Evaluation; authorized peers issue an `approved`/`rejected` decision that finalizes the evaluation outcome when required by the path.

* **Certificate issuance.** On successful completion (auto‑evaluation and/or peer validation), a **Certificate** record (core/common model) links the user to the earned credential for display and download from `/certs` → “My Certificates.”

* **Skills portfolio linkage.** Portfolio items (evidence, learning artifacts) can be attached to programs and evaluations so achievements surface coherently in the user’s skill profile.

* **Interoperability.** *InteropMapping* maps internal paths to external systems’ identifiers to support import/export and verification workflows.

* **Permissions & roles.** Uses the platform’s unified JWT/RBAC and Krowd user model; module actions inherit common auth and moderation controls.

---

### **3\) Database Models**

These are the concrete tables tied to CertifiKation features; “Certificate” is defined at the common/core layer and consumed here.

| Table / Model | Purpose | Key fields |
| ----- | ----- | ----- |
| **CertificationPath** | Defines a named certification/learning path. | `id`, `name`, `description` |
| **Evaluation** | Stores a user’s attempt and score on a path. | `id`, `user`, `path`, `raw_score`, `metadata` (JSON) |
| **PeerValidation** | Peer/mentor decision for an Evaluation. | `id`, `evaluation`, `peer`, `decision` (enum) |
| **Portfolio** (KonnectED) | User skill/evidence showcase used by skills\_portfolio. | `id`, `user`, `title`, `description`, `items` (M2M) |
| **InteropMapping** | Links internal CertificationPath to external LMS IDs. | `id`, `local_certification`, `external_system`, `external_id` |
| **Certificate** (Core) | Issued credential linking user↔certification. | fields per core “Certificate (CertifiKation)” model |

Model purposes/fields are specified in the v14 schema reference and the core database description.

---

### **4\) Supporting Configuration**

* **Pass threshold:** `CERT_PASS_PERCENT = 80%` (applied by automated\_evaluation/issuance logic).

* **Retry policy:** `QUIZ_RETRY_COOLDOWN_MIN = 30` minutes between failed attempts.

* **Module routes:** `/certs` reserved for the CertifiKation Center (Programs, My Certificates).

---

### **Summary**

CertifiKation delivers end‑to‑end credentialing: define programs (*CertificationPath*), assess learners (*Evaluation*), adjudicate evidence (*PeerValidation*), issue credentials (core *Certificate*), and present outcomes via portfolios and the `/certs` flows. Its five named services (`certification_path_management`, `automated_evaluation`, `peer_validation`, `skills_portfolio`, `certification_interoperability`) are version‑locked in the inventory and backed by concrete schema and parameters.    

