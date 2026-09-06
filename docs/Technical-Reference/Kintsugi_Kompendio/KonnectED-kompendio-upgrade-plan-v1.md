# **KonnectED Upgrade  \- Kompendio (Plan v1)**

**Status:** Draft  
**Module:** KonnectED  
**Submodule:** Kompendio (3rd submodule alongside Knowledge \+ CertifiKation)  
**Purpose:** Make the KonnectED loop **portable, governable, and reproducible** by explicitly mapping the *reference standards, tools, libraries, and infrastructures* KonnectED uses (or mimics), and by publishing **versioned Reference Charts** and **integration fiches**.

---

## 

## **1\) Role (why it exists)**

KonnectED vNext targets a full learning loop:

**Learn → Measure → Validate → Certify → Follow-up**

Kompendio is the layer that makes this loop **explicit and reusable**:

* It documents the **reference tech stack** (standards \+ OSS sidecars \+ reference ecosystems).  
* It states clearly **how** KonnectED relates to each item: **Mimic** or **Annex**.  
* It outputs **publishable, versioned, reusable Reference Charts** (builder-grade, not marketing docs).

Core principle: **many tools are possible, but there is one reading layer** — the **Competence Evidence Layer (CEL)**.

## 

## **2\) Integration rule (Mimic vs Annex)**

Kompendio is not “a link list”. It is an **integration repertory**. Each entry must answer: *how does KonnectED use this reference?*

* **Mimic**  
  Replicate the pattern (UX / flow / model) without importing the entire platform.  
* **Annex**  
  Connect an **isolated sidecar**, standards-based, when it accelerates delivery *without capturing sovereignty*.

Interop “backbone” standards to treat as first-class references:

* **OIDC**, **LTI 1.3**, **xAPI**, **Open Badges**

## **3\) What Kompendio contains (three shelves)**

### **Shelf A — Backbone standards (interop & portability)**

These are **mandatory** because they define what “portable” means:

* **OIDC (SSO)** — single sign-on baseline for sidecars  
* **LTI 1.3 (+ Advantage services)** — tool launch \+ grade/roster/deep linking  
  [1EdTech LTI](https://www.1edtech.org/standards/lti?utm_source=chatgpt.com)  
* **xAPI** — learning event capture / evidence events  
  [xAPI spec repo](https://github.com/adlnet/xAPI-Spec?utm_source=chatgpt.com)  
* **cmi5** — xAPI profile for LMS-style launch/tracking  
  [cmi5 spec](https://aicc.github.io/CMI-5_Spec_Current/?utm_source=chatgpt.com)  
* **Open Badges 3.0** — verifiable credential export (portable credentials)  
  [Open Badges 3.0](https://www.imsglobal.org/spec/ob/v3p0?utm_source=chatgpt.com)

**v1.1 references to inventory early (comparison standards):**  
QTI, Common Cartridge / Thin CC, OneRoster, Caliper, SCORM legacy.  
[1EdTech specifications](https://www.1edtech.org/specifications?utm_source=chatgpt.com)

### **Shelf B — Activity engines (tools that produce evidence)**

These are the “best OSS options” already aligned with the KonnectED Kintsugi posture (sidecars or patterns):

* **Moodle** — LMS patterns (sometimes annexed)  
* **H5P** — interactive learning objects / activities  
* **TAO Community Edition** — high-stakes assessment patterns  
* **Safe Exam Browser (SEB)** — optional secure exam mode  
* **LimeSurvey** — baseline \+ follow-up measurement  
* **xAPI LRS** (Learning Locker / SQL LRS) — evidence ledger / learning record store  
* **Open Badges issuer** (Badgr / EduBadges) — optional issuance sidecar

*(Kompendio entry for each must specify: Mimic vs Annex, what evidence it emits, and what KonnectED stores.)*

### **Shelf C — Sovereign infrastructure (packs, evidence, discovery)**

These are the enabling components that make KonnectED portable and scalable:

* **Keycloak** — recommended SSO (OIDC)  
* **OpenSearch** — discovery/search at scale  
* **SeaweedFS / MinIO (S3-compatible)** — artifact \+ evidence storage (snapshots, packs)

## 

## 

## **4\) Central object: Evidence (CEL)**

Kompendio KonnectED is governed by the **Competence Evidence Layer (CEL)**: every learning signal becomes a normalized evidence object.

Typical evidence sources:

* quiz results  
* rubrics  
* peer validation  
* attendance/session signals  
* artifacts (files, projects, submissions)  
* follow-up outcomes

CEL must be visible and consistent everywhere via a simple display structure:

**who / what / when / result / artifact / provenance / verification**

This becomes the common language across tools, charts, and credentials.

## 

## 

## **5\) What Kompendio publishes (deliverables)**

### **A) Reference fiches (one page per standard/tool)**

Every fiche must answer:

* **What it is for** in the Learn→Follow-up loop  
* **Mimic vs Annex** (explicit choice \+ rationale)  
* **What evidence it produces** (CEL mapping; xAPI; badges; artifacts)  
* **Constraints** (license, isolation requirements, dual-truth risks, ToS considerations)  
* **Canonical entrypoints** (spec/docs/repo/conformance pages)

### **B) Reference Charts (v1: 6 high-leverage charts)**

1. **Interop Chart**  
   “How everything talks to everything”: OIDC / LTI 1.3 / xAPI / cmi5 / Open Badges  
   [LTI](https://www.1edtech.org/standards/lti?utm_source=chatgpt.com)  
2. **Assessment Ladder Chart**  
   Formative → Summative → Secure mode (H5P / TAO / SEB)  
3. **Credential Portability Chart**  
   Internal certificate → Open Badges export → verification path  
   [Open Badges 3.0](https://www.imsglobal.org/spec/ob/v3p0?utm_source=chatgpt.com)  
4. **Evidence Pattern Chart (CEL)**  
   What “defensible evidence” looks like \+ examples (quiz, rubric, artifact, peer validation)  
5. **Follow-up Impact Chart**  
   Measuring transfer/impact over time (baseline → follow-up → re-assess → artifacts)  
6. **Sovereignty / Deployment Chart**  
   Packs, offline/low connectivity, evidence storage, reproducibility, audit readiness

## 

## 

## **6\) Ratings (human-readable, decision-grade)**

Kompendio rates references using dimensions that are understandable by builders and decision-makers:

* **Interop quality** (standards supported \+ quality of implementation)  
* **Portability** (exports, packs, offline readiness)  
* **Auditability** (traceability, versioning, evidence links)  
* **Governance & longevity** (maturity, community, cadence)  
* **Sovereignty & dependencies** (vendor capture, ToS friction, isolation feasibility)  
* **Learning-outcomes fit** (does it help prove outcomes and impact?)

Ratings should support two views:

* **Raw score** (simple aggregate)  
* **Advisory score** (reserved for later domain-weighted logic)

## 

## 

## **7\) Prioritized backlog**

### **v1 “Ship” (minimum viable Kompendio)**

* Kompendio repertory populated with:  
  * Shelf A backbone standards  
  * Shelf B activity engines  
  * Shelf C sovereign infra  
* The 6 Reference Charts published and versioned  
* Simple lifecycle workflow:  
  **Draft → Reviewed → Published/Trusted**  
* KonnectED integration requirement:  
  Charts and fiches must be usable inside the **Knowledge \+ CertifiKation** flows.

### **v1.1 (evidence \+ interop extensions)**

* Add comparison standards as references (even if not integrated):  
  QTI, Common Cartridge/Thin CC, OneRoster, Caliper, SCORM  
  [1EdTech specifications](https://www.1edtech.org/specifications?utm_source=chatgpt.com)  
* Dispute \+ revalidation workflow (challenge → review → update/new version)  
* “Used in program” attestations (where it’s actually used)

### **v2 (selective annex)**

* Annex additional OSS modules only if:  
  * clearly isolable  
  * standards-compatible  
  * improves outcomes without creating a second truth store  
    Examples: portfolio/evidence sidecar, OSS classroom, OER publishing sidecar.

## 

## 

## **8\) Definition of Done (v1)**

Kompendio KonnectED v1 is “done” when:

* Backbone standards (OIDC, LTI 1.3, xAPI/cmi5, Open Badges) are covered by fiches \+ the Interop Chart.  
  [LTI](https://www.1edtech.org/standards/lti?utm_source=chatgpt.com)  
* Each listed sidecar/tool (Moodle, H5P, TAO, LRS, LimeSurvey, Badges issuer, SEB, OpenSearch, SeaweedFS/MinIO, Keycloak) has a clear fiche:  
  * Mimic vs Annex  
  * evidence mapping to CEL  
  * canonical entrypoints  
* The 6 charts are published, versioned, and usable across the Learn→Follow-up loop.

