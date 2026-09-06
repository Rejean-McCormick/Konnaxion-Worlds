# Konnaxion v14 — KonnectED Upgrade \- Kintsugi

## **KonnectED as a Unified Learning, Evaluation & Credentialing Engine**

**(Mimicking & Integrating Best-in-Class Open Learning Platforms)**

**\#kinstugi edition — harmonizing the best open learning & credentialing patterns into one orchestrated flow**

**Author:** Réjean McCormick  
**Date:** 2026-01-28  
**Status:** Public plan v1 (pre-code)  
**Purpose:** explain what’s being built, why it matters, and exactly what is **mimicked vs annexed** from leading open-source learning platforms—before implementation.

---

## **1\. Executive Summary**

This update transforms **Konnaxion’s KonnectED** from a learning library \+ certification area into a **full-spectrum competence engine**—combining:

* **Content delivery**  
* **Structured practice**  
* **Formal evaluation**  
* **Credential issuance**  
* **Post-training performance measurement**

Instead of merging external platforms directly, Konnaxion adopts a **“Mimic vs Annex” strategy**:

* **Mimic** when codebases are heavy, strongly copyleft, or architecturally dominating  
* **Annex** when components are modular, standards-based, and safely isolated as sidecars

The result:  
**Konnaxion becomes a meta-learning platform that orchestrates the best open learning patterns without inheriting technical debt, UI fragmentation, or uncontrolled licensing spillover.**

## **2\) Why this upgrade exists**

Training platforms fail for structural reasons:

* Learning content is fragmented across tools and formats.  
* “Completion” is treated as success, while real performance change is not measured.  
* Assessments are either too weak (MCQ-only) or too heavy (proctoring-only), with no middle path.  
* Credentials are issued as PDFs with no portable verification layer.  
* Organizations end up trapped in vendor ecosystems, unable to move their learning records.

**KonnectED vNext** upgrades the platform into a closed loop:

1. **Learn** (content \+ practice)  
2. **Measure** (assessment \+ feedback \+ telemetry)  
3. **Validate** (peer/expert review where needed)  
4. **Certify** (verifiable credentials)  
5. **Follow-up** (does performance actually improve?)

The goal is not “more features.”  
It is to make learning **accountable and portable**—without surrendering sovereignty to proprietary stacks.

## **3\. Strategic Principle: Mimic vs Annex**

### **Mimic (Native Re-Implementation)**

Used when:

* License is **GPL/AGPL** and the component cannot be cleanly isolated  
* Stack is mismatched or introduces a second “platform shell”  
* Feature scope is broad (full LMS / full assessment suite) and would subsume KonnectED

### **Annex (Sidecar / Optional Integration)**

Used when:

* License is **MIT / BSD / Apache** (or weak copyleft with clean isolation)  
* Component is standards-based (**OIDC, LTI 1.3, xAPI, Open Badges**)  
* Integration accelerates delivery while Konnaxion remains the orchestrator

## **4\) The core architecture principle: many learning tools, one common “evidence layer”**

KonnectED already has two strong pillars:

* **Knowledge** (collaborative learning library \+ course player)  
* **CertifiKation** (paths \+ evaluation \+ peer validation \+ certificates \+ portfolios)

The upgrade principle is to integrate best-in-class open-source tools as bounded sidecars, while keeping one stable internal truth:

### **The Competence Evidence Layer (CEL)**

Everything (courses, quizzes, rubrics, surveys, peer reviews, attendance, artifacts) is normalized into a consistent internal record so it can be:

* audited,  
* compared across courses,  
* reused for credential verification,  
* exported to external ecosystems (LMS/HR, registries),  
* analyzed for actual post-training impact.

This avoids the trap of “one tool per problem” and instead creates **one reading layer for many inputs**.

## **5\) The Competence Evidence Layer (explained simply)**

Each learning signal becomes an **Evidence Item** with a predictable structure:

* **who:** learner (and optionally assessor/mentor)  
* **what:** resource / activity / skill / assessment  
* **when:** timestamp \+ session context  
* **result:** score, rubric outcome, pass/fail, confidence  
* **artifact:** file or link (essay, video, project, code, portfolio object)  
* **provenance:** which tool produced it (native KonnectED / external sidecar)  
* **verification:** automated, peer-approved, or expert-approved

This enables two critical guarantees:

* **Portability:** exportable learning records (xAPI / Open Badges profiles)  
* **Legitimacy:** auditable proof of how a certificate was earned

## **6\) Cohort lenses: results that can be “read” responsibly**

KonnectED should support cohort filters that clarify outcomes without distorting them:

* Organization / program cohort  
* Region / language  
* Role (learner / mentor / assessor)  
* Skill level bands (beginner → advanced)  
* Verified cohorts (credentialed assessors, approved trainers)

This makes it possible to ask:

* “Did cohort A improve more than cohort B?”  
* “Which skills remain weak after the training?”  
* “Where is training working, and where is it performative?”

## **7\. Source Platforms & How Konnaxion Uses Them**

### 

### **A. Moodle — Course & Program Scaffolding (LMS patterns)**

**Status:** MIMICKED (default) / ANNEX (optional if GPL is acceptable as a separate service)  
**What we copy:**

* Course → module → activity structure  
* Gradebook semantics (attempts, partial credit, completion rules)  
* Cohort \+ role patterns (learner, instructor, reviewer)

**What Konnaxion adds:**

* Keep the authoritative learning graph in KonnectED (KnowledgeResource \+ LearningProgress)  
* Route all external identifiers through **InteropMapping** to avoid dual-truth  
* Normalize outputs into **Evaluation.metadata** (single evidence format)

**Result:**  
KonnectED gains mature LMS ergonomics without becoming “another LMS.”

### 

### **B. H5P — Interactive Learning Objects**

**Status:** ANNEX (recommended)  
**What we copy:**

* Interactive content types (interactive video, branching scenarios, drag/drop, quizzes)  
* Reusable content object lifecycle (author → publish → embed → version)

**What Konnaxion adds:**

* Treat each H5P object as a KnowledgeResource (type=lesson/quiz)  
* Track completion in LearningProgress  
* Capture events into Evaluation.metadata and/or xAPI for unified analytics  
* Moderation \+ co-creation governance around content objects

**Result:**  
Fast authoring of high-quality interactive learning units inside /course/\[slug\].

### 

### **C. TAO Community Edition — High-Stakes Assessment Patterns**

**Status:** MIMICKED (default) / ANNEX (optional if AGPL is acceptable as a separate service)  
**What we copy:**

* Item bank → test assembly → delivery → scoring pipeline  
* Exam session patterns (time windows, attempt rules, audit trails)  
* Rubric-driven scoring \+ structured result export

**What Konnaxion adds:**

* Unify scoring into Evaluation.raw\_score \+ Evaluation.metadata  
* Keep certification rules in CertificationPath (thresholds, cooldowns, peer validation)  
* Expose exams through /certs while keeping one identity/RBAC model

**Result:**  
KonnectED gets certification-grade assessment architecture (not just MCQs).

### **D. SQL LRS (xAPI) — Learning Record Store & Evidence Ledger**

**Status:** ANNEX (recommended)  
**What we copy:**

* xAPI statement storage for fine-grained learning/evaluation events  
* Standard event vocabulary across tools (course player, authoring, assessment)

**What Konnaxion adds:**

* A **KonnectED Evidence Gateway** emitting xAPI during: progress, quizzes, peer validations, certificate issuance  
* Roll-up analytics into Insights dashboards (growth, retention, practice-to-performance)  
* Keep minimal OLTP mirrors (Evaluation \+ LearningProgress) for core UX; LRS is the detailed ledger

**Result:**  
A standards-based event backbone enabling performance measurement after training.

### 

### **E. Open Badges (1EdTech) \+ Badgr-style issuance — Verifiable Credentials**

**Status:** MIMICKED (default) / ANNEX (optional sidecar issuer if acceptable)  
**What we copy:**

* Badge classes \+ assertions (issuer, criteria, evidence links)  
* Public verification and portable credential sharing

**What Konnaxion adds:**

* Map Certificate records to Open Badges exports (JSON)  
* Attach Portfolio artifacts \+ Evaluation evidence as badge evidence URLs  
* InteropMapping entries for external registries and verification endpoints

**Result:**  
Credentials become portable and verifiable outside Konnaxion, without rewriting the core credential model.

### **F. Safe Exam Browser (SEB) — Secure Exam Delivery**

**Status:** ANNEX (recommended)  
**What we copy:**

* Locked-down exam client patterns (restrict apps/web, enforce environment constraints)  
* Exam configuration \+ session monitoring patterns (SEB-style)

**What Konnaxion adds:**

* Tie SEB session identifiers to ExamAttempt/Evaluation metadata for audit trails  
* Policy-controlled activation only for high-stakes CertificationPath steps  
* Optional proctor workflow hooks (human review → PeerValidation)

**Result:**  
Secure-mode certification exams without building a browser.

### 

### **G. Kolibri — Offline-First Learning Distribution**

**Status:** ANNEX (recommended)  
**What we copy:**

* Offline channels and device-friendly content sync patterns  
* Local-first distribution model (portable bundles, low-connectivity deployments)

**What Konnaxion adds:**

* Reuse KonnectED’s offline packaging schedule and map selections to Kolibri channels  
* InteropMapping for content IDs so offline completions reconcile back into LearningProgress/Evaluation  
* Localized catalogs (language \+ cohort filters)

**Result:**  
KonnectED becomes deployable in low-connectivity environments with a single source of truth.

### **H. Keycloak — Identity, SSO, and Cohort/Roles**

**Status:** ANNEX (recommended)  
**What we copy:**

* OIDC/SAML SSO patterns for institutions  
* Group/role management aligned with cohorts and evaluators

**What Konnaxion adds:**

* Map Keycloak groups → Konnaxion RBAC roles (learner/instructor/peer validator)  
* Use Keycloak for enterprise SSO while preserving Konnaxion JWT/RBAC enforcement  
* Cohort claims feed analytics filters (program, region, org, role)

**Result:**  
Institutional onboarding without a parallel identity system.

### 

### **I. OpenSearch — Unified Search Across Learning Assets**

**Status:** ANNEX (recommended)  
**What we copy:**

* Search indexing for heterogeneous content (lessons, resources, programs, badges)  
* Faceted discovery (tags, type, language, cohort)

**What Konnaxion adds:**

* Index KnowledgeResource \+ CertificationPath \+ Certificate metadata for cross-module discovery  
* Keep Postgres search as fallback; use OpenSearch for scale and relevance tuning  
* Expose search in /learn with cohort/language filters

**Result:**  
Discoverability scales as the library becomes large.

### **J. SeaweedFS (S3-compatible object storage) — Evidence & Media Storage**

**Status:** ANNEX (recommended)  
**What we copy:**

* Object-store semantics for large evidence artifacts (S3 API)  
* Separation of binary evidence from relational records

**What Konnaxion adds:**

* Store artifacts referenced by Portfolio items and Evaluation.metadata (submissions, rubrics, media)  
* Immutable-by-default evidence links for auditability (versioned objects)  
* Pluggable deployments (SeaweedFS default; allow MinIO-style installs if desired)

**Result:**  
Serious certification workflows get a clean evidence storage backbone.

## 

## 

## **8\) The KonnectED pipeline (Merged Plan v1)**

### **Stage 0 — Capability Intake & Path Selection**

**Job:** turn “I want to learn X” into a guided path that produces evidence.

**What happens**

* select a Certification Path (program)  
* define baseline self-assessment (optional)  
* set intended outcomes (skills \+ performance indicators)

**Inspired by / optionally integrated**

* Moodle program/course structure patterns  
* LimeSurvey (baseline questionnaires)

---

### **Stage 1 — Course Assembly (Library → Learning Path)**

**Job:** assemble coherent learning experiences from the Knowledge Library.

**Mechanics**

* Knowledge resources become lessons (curated sequences)  
* contributors can co-create updates and improvements  
* course player tracks progress and completion

**Integrated (best open-source options)**

* H5P (interactive learning objects embedded inside lessons)  
* Moodle (optional authoring \+ gradebook sidecar when needed)

**Notes**

* KonnectED remains the canonical catalog (/learn) and player (/course/\[slug\])  
* External tools act as activity engines, not the truth store

---

### **Stage 2 — Practice & Formative Checks (low-stakes measurement)**

**Job:** ensure learners get feedback early, before high-stakes evaluation.

**Mechanics**

* micro-quizzes  
* interactive exercises  
* reflection prompts  
* practice submissions (artifacts)

**Integrated (best open-source options)**

* H5P  
* TAO Community Edition (when stronger item types are needed)

---

### **Stage 3 — Summative Evaluation (high-stakes when required)**

**Job:** generate defensible assessment outcomes.

**Mechanics**

* timed exams, item banks, rubrics  
* secure exam mode when needed  
* capture results into Evaluation \+ metadata

**Integrated (best open-source options)**

* TAO Community Edition  
* Safe Exam Browser (optional lockdown mode)

---

### 

### **Stage 4 — Validation & Certification (from score → credential)**

**Job:** convert evidence into a credential that is portable and verifiable.

**Mechanics**

* automated evaluation pass/fail (threshold \+ retry policies)  
* peer/expert validation for artifact-based competencies  
* certificate issuance \+ portfolio attachment

**Integrated (best open-source options)**

* Open Badges (standard for verifiable digital credentials)  
* Badgr Server / EduBadges Server (optional issuer sidecar)

**Notes**

* KonnectED keeps its internal Certificate model as operational truth  
* Open Badges becomes the interoperability/export format

---

### **Stage 5 — Post-Training Performance Follow-Up (the missing piece)**

**Job:** measure whether learning transfers into real performance.

**Mechanics**

* scheduled follow-up surveys  
* re-assessment after a delay  
* evidence of application (work samples, outcomes, peer endorsements)  
* cohort dashboards: before vs after

**Integrated (best open-source options)**

* LimeSurvey (follow-up instruments \+ longitudinal surveys)  
* Learning Locker / SQL LRS (xAPI LRS for standardized telemetry)

**Output**

* “Learning Impact” dashboards per program, cohort, and skill  
* visible proof that training was effective (or wasn’t)

---

## 

## **9\) Mimicked vs Annexed: what comes from where**

### **MIMICKED (native inside KonnectED)**

* Course/player patterns: progress tracking, resume, completion  
* Certification lifecycle: paths → evaluations → peer validation → certificates  
* Portfolio logic: achievements \+ artifacts attached to skills  
* Interoperability mapping model: one canonical mapping layer (InteropMapping)  
* Competence Evidence Layer normalization (Evidence Items → Evaluation/Portfolio/LRS)

### **ANNEXED (bounded sidecars, API-first)**

* Moodle: LMS authoring \+ gradebook workflows (optional)  
* H5P: interactive lesson objects  
* TAO Community Edition: assessment lifecycle \+ item banks (optional)  
* xAPI LRS: Learning Locker or SQL LRS (evidence ledger)  
* LimeSurvey: baseline \+ follow-up evaluation instruments  
* Safe Exam Browser: secure exam mode (optional)  
* Open Badges issuer: Badgr/EduBadges (optional)  
* Keycloak: enterprise identity/SSO (recommended)  
* OpenSearch: large-scale discovery (recommended)  
* SeaweedFS/MinIO: artifact/evidence storage (recommended)

## 

## 

## 

## **10\) What stays stable (Konnaxion integrity)**

This upgrade does **not** require merging foreign codebases into the core stack.

**Core Konnaxion remains:**

* Next.js frontend  
* Django backend (KonnectED app namespace)  
* Postgres operational store  
* Celery for jobs (packaging, scoring, exports, analytics refresh)  
* unified auth \+ RBAC  
* Insights as read-optimized dashboard layer

**External apps are:**

* never merged into core  
* mimicked or isolated as sidecars  
* bound via standards: **OIDC (SSO), LTI 1.3 (tool launch), xAPI (event capture), Open Badges (credential export)** \+ InteropMapping for identifiers

## **11\) Why publish Plan v1 before coding**

Because education platforms fail most often at the architecture level, not the UI level.

This plan is published early so builders and partners can:

* challenge missing evaluation edge cases  
* propose better evidence standards  
* suggest interoperability targets (registries/LMS/HR)  
* catch design debt before it ships

## 

## 

## 

## **12\) Public Credit & Positioning**

KonnectED will explicitly credit inspirations and integrated projects, for example:

*“KonnectED builds on open learning innovations from Moodle (LMS patterns), H5P (interactive learning objects), TAO (assessment architecture), xAPI/LRS tooling, Open Badges ecosystems, Kolibri (offline learning), Keycloak (identity), OpenSearch (discovery), and open object storage for evidence portability.”*

This frames Konnaxion as:

**An orchestrator of the best open learning innovations — not a clone.**

## **13\) Outcome: What KonnectED Becomes**

KonnectED evolves into:

* A **Learning Engine** (library \+ course player \+ interactive authoring)  
* An **Assessment Engine** (formative \+ summative, rubric-based, secure-mode optional)  
* A **Credential Engine** (certificates \+ portable verifiable exports)  
* A **Competence Evidence Engine** (xAPI ledger \+ portfolio artifacts \+ audit trails)  
* An **Offline-Capable Deployment** (packaging \+ sync patterns for low-connectivity contexts)

**In short:**

**KonnectED becomes a full-stack platform for learning accountability, measurable competence, and verifiable certification.**

