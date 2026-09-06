# **keenKonnect — Kintsugi v1 (Hybrid)**

**An accessible technical spec for an “open builder stack under one roof”**  
**Scope:** Kintsugi track (toolchain integration). *(Kompendio \= reference repertory; separate spec.)*  
**Deployment posture:** Hybrid (SaaS \+ self-host / on-prem)

---

## **1\) What is keenKonnect**

keenKonnect is a **builder execution environment**: a place to run real-world projects with a tight link between:

* **work coordination** (plans, tasks, decisions, accountability)  
* **artifacts** (CAD exports, docs, BOMs, test notes, photos, releases)  
* **reproducibility** (what was built, with what sources, by whom, and in what version)

If “GitHub” made software collaboration and release reproducible, keenKonnect is aiming at the same property for **physical builds**.

## **2\) What is Kintsugi (in keenKonnect)**

Kintsugi is the approach for **bringing open-source building blocks under one coherent roof**—without merging everything into a monolith.

It is:

* a curated set of **open-source primitives** (inventory/BOM, docs, search, storage, forge)  
* a strict set of **integration contracts** so these primitives behave like one product  
* a hybrid-safe packaging posture so the same experience works in SaaS and self-host

It is not:

* a full CAD platform replacement  
* a giant proprietary-catalog mirror  
* “connect everything” in v1

## 

## **3\) The problem Kintsugi solves**

Builders typically have:

* docs in one system  
* BOM/inventory elsewhere  
* files scattered across drives  
* no unified permissions  
* weak provenance (what is the source of truth?)  
* no reliable release bundle that can be recreated later

Kintsugi solves this by turning those scattered tools into **lanes** that share:

* one identity layer  
* one permission model  
* one event/audit surface  
* one artifact/release packaging model

## 

## 

## **4\) Core principles**

### **4.1 Annex vs Mimic**

* **Annex**: integrate an open-source service as a sidecar when it’s modular, isolable, and worth it.  
* **Mimic**: implement the pattern natively when annexing would create licensing risk, UX fragmentation, or dual-truth issues.

### **4.2 One roof experience**

Kintsugi must feel like a single product: unified login, consistent permissions, stable project links, consistent “where is the file / BOM / doc?” answers.

### **4.3 No dual truth**

Every object that matters must have a canonical identity and lifecycle inside keenKonnect, even if it is authored in a sidecar.

### **4.4 Reproducible releases**

A build is not “done” unless it can produce a **Release Pack**: manifests \+ artifacts \+ pinned references (and optionally checksums/signatures).

### **4.5 Hybrid by default**

Everything must work for:

* hosted SaaS  
* self-host/on-prem  
* “restricted” environments (policy, sovereignty, intermittent connectivity)

## 

## **5\) The integration contract (what makes it “one roof”)**

Any annexed component must satisfy these contracts:

1. **Identity & access**  
   * OIDC/SSO integration  
   * role/group mapping to keenKonnect permissions  
2. **Canonical IDs**  
   * every external object maps to a keenKonnect canonical ID  
   * no “two sources of truth” for the same thing  
3. **Events**  
   * changes produce events that land in the project timeline (who/what/when)  
4. **Artifact contract**  
   * important outputs must be capturable as artifacts in Stockage (with version semantics)  
5. **Portability**  
   * export path exists (pack/dataset/manifest) for migrations, audits, offline use

If a tool cannot meet these contracts, it stays “external reference” (Kompendio) or is mimicked.

## **6\) The Kintsugi lanes (what is gathered in open source)**

Kintsugi v1 is a small set of lanes with default choices \+ optional alternatives.

### **Lane A — Parts / BOM / inventory (the open backbone)**

**Default:** **InvenTree**

* Why: API-friendly inventory \+ BOM backbone, easy to integrate into build workflows.

**Optional:** **Part-DB**

* Why: component inventory workflows that some teams prefer.  
* Note: treat as opt-in lane where licensing and deployment policy allow it.

**Loud credit:**  
InvenTree and Part-DB communities have already solved years of practical inventory/BOM edge cases. Kintsugi is explicitly built to *not reinvent that wheel*, but to integrate it into a reproducible build lifecycle.

---

### **Lane B — Search & indexing (find anything across projects)**

**Default:** **OpenSearch**

* Why: a search/index foundation to unify discovery across projects, docs, BOM, artifacts, and later Kompendio references.

**Loud credit:**  
OpenSearch makes it realistic to give builders one search bar across “everything that matters,” without forcing a single storage format.

---

### **Lane C — Collaborative docs (specs, build logs, checklists)**

**Default:** **Etherpad**

* Why: lightweight real-time collaboration for specs/logs that become build evidence.

**Optional:** **HedgeDoc**

* Why: Markdown-first collaborative notes, preferred by some teams.

**Loud credit:**  
Etherpad/HedgeDoc are battle-tested “human collaboration primitives.” Kintsugi treats them as the authoring surface, while keenKonnect owns the lifecycle (permissions, snapshots, release inclusion).

---

### **Lane D — Storage substrate (artifacts, exports, evidence)**

**Default:** **SeaweedFS**

* Why: practical storage for large artifacts and object-like workflows.

**Optional:** **Ceph**

* Why: heavy-duty storage for larger or stricter deployments.

**Optional:** **MinIO**

* Why: S3-centric deployments or teams already standardized on MinIO.

**Loud credit:**  
Storage projects like SeaweedFS/Ceph/MinIO represent huge operational maturity. Kintsugi’s job is to standardize artifact semantics and packaging—not rebuild storage.

---

### **Lane E — Forge (scripts, templates, internal tooling)**

**Default:** **Gitea**

* Why: a forge for “code around building”: templates, automation scripts, test harnesses, build recipes, CI for artifacts.

**Optional:** **Forgejo**

* Why: teams that prefer that governance and ecosystem posture.

**Loud credit:**  
Gitea/Forgejo make it feasible to treat “how you build” as versioned knowledge, tied to releases—without forcing full enterprise ALM.

---

### **Lane F — CAD/BIM toolchain (export lanes, not UI takeovers)**

**v1 position:** CAD/BIM tools remain toolchains. Kintsugi standardizes:

* export formats  
* artifact capture  
* traceability (which export belongs to which release/task)

Kintsugi does not attempt to become a CAD frontend in v1.

**Loud credit:**  
Open CAD/BIM ecosystems have deep complexity. Kintsugi’s value is a stable “export → artifact → release” lifecycle that works no matter which authoring tool a team uses.

## 

## **7\) How a project flows end-to-end (user-facing behavior)**

1. Create a project in keenKonnect (Konstruct workspace).  
2. Draft specs and logs in the docs lane; snapshots are captured as project artifacts.  
3. Create/maintain the BOM in the inventory lane; BOM snapshots are captured.  
4. Store CAD exports and build evidence in the storage lane.  
5. Search across everything (metadata \+ content where allowed) via the search lane.  
6. Produce a **Release Pack**:  
   * release manifest (what’s included)  
   * artifact list (with versions/checksums)  
   * pinned references (Kompendio links, if applicable)

## **8\) Boundary with Kompendio (to avoid confusion)**

* **Kintsugi** \= integrated open-source toolchain lanes that power building and reproducibility.  
* **Kompendio** \= repertory of external reference websites \+ curated charts \+ trust signals.

A project uses both:

* Kintsugi to *execute and package* the build  
* Kompendio to *anchor reference-grade external sources* without mirroring them

## **9\) Hybrid deployment policy**

### **Default bundle (lowest friction)**

A hybrid-safe default set should prioritize permissive licensing and operational simplicity:

* InvenTree (inventory/BOM)  
* OpenSearch (search)  
* Etherpad (collab docs)  
* SeaweedFS (storage)  
* Gitea (forge)

### **Optional components (policy-dependent)**

* Part-DB, HedgeDoc, MinIO, Forgejo can be enabled per deployment depending on governance/licensing preferences.

Key requirement: all options still satisfy the **integration contract** so the UX remains unified.

## **10\) Risks and mitigations**

1. **UX fragmentation (too many tools)**  
   * Mitigation: strict integration contract \+ single navigation \+ project-native linking.  
2. **Dual-truth drift**  
   * Mitigation: canonical IDs \+ snapshots \+ “release pack” as the final truth.  
3. **License complexity in hybrid**  
   * Mitigation: permissive-by-default; copyleft components are opt-in and isolated.  
4. **Operational complexity**  
   * Mitigation: keep v1 lane set small; document “known good” deployment profiles.

## **11\) What I’m asking from maintainers and builders**

* Which integration surfaces matter most? (webhooks, exports, auth patterns, APIs)  
* What lane is missing for real-world builds?  
* What breaks most often in hybrid SaaS \+ self-host environments?  
* What must a “Release Pack” contain to be truly reproducible for your workflow?

## **12\) Credits (loud, explicit)**

Kintsugi v1 stands on the shoulders of these open-source projects and the people maintaining them:

* **InvenTree** — inventory & BOM backbone  
* **Part-DB** — component inventory workflows (optional lane)  
* **OpenSearch** — unified search/index foundation  
* **Etherpad** — real-time collaborative notes/logs  
* **HedgeDoc** — Markdown-first collaborative notes (optional lane)  
* **SeaweedFS** — practical artifact/object storage  
* **Ceph** — durable storage for larger deployments (optional lane)  
* **MinIO** — S3-centric storage option (optional lane)  
* **Gitea** — forge for build scripts/templates/workflows  
* **Forgejo** — forge alternative (optional lane)

