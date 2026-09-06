# keenKonnect — Kompendio (v1)

**The builder reference layer:** a curated repertory of **reference platforms** plus **versioned reference charts**, connected to projects and preserved as reproducible artifacts.

Kompendio is the third submodule of **keenKonnect**, alongside:

- **Konstruct** — run the build (projects, tasks, coordination)
- **Stockage** — preserve the build (files, releases, bundles)
- **Kompendio** — guide the build (reference stack, charts, trust)

Kompendio does not replace external tools. It makes them **legible, comparable, auditable, and reusable** in a build workflow.

---

## 0) Where Kompendio fits

keenKonnect has three submodules:

1. **Konstruct** — project collaboration and execution
2. **Stockage** — secure repository and artifact preservation
3. **Kompendio** — reference repertory, builder charts, and trust

Kompendio solves a practical builder problem:

**Which websites and platforms are actually the reference stack for this build, and can we trust them?**

It turns that answer into something reusable, versioned, and project-attachable.

---

## 1) What Kompendio is (in one sentence)

Kompendio is a **reference platform repertory** at the **website/platform level** that produces **builder charts**, **trusted reference stacks**, and **exportable reference packs** that can be pinned to projects.

Key point: Kompendio deals with **widescale reference sites** as reference objects, not random internal pages.

---

## 2) Purpose

Kompendio provides:

- a directory of reference platforms
- a trust and rating system backed by evidence
- **Reference Charts** (curated cheat sheets and summaries) that are versioned and publish-gated
- project attachment so references become part of execution, not bookmarks
- exportable packs for reproducibility, offline use, and deployment portability

---

## 3) What Kompendio is — and is not

### Is

- A curated repertory of **reference platforms** at the website/platform level
- A publishing pipeline for **charts** and **trusted reference sets**
- A decision-support layer with **raw scoring** and a future-ready **advisory scoring** path
- A reproducibility layer that preserves what was relied on for a build

### Is not (v1)

- A crawler of entire sites
- A mirror of proprietary catalogs or datasets
- A replacement CAD tool
- A universal connector platform for every external site
- A full-blown BOM ingestion engine for every source

---

## 4) Design principles (non-negotiable)

1. **Website-level objects**
   - Kompendio stores platforms and a small set of canonical entrypoints, not millions of internal pages.

2. **Mimic vs Annex**
   - By default, Kompendio mimics useful patterns from reference ecosystems (indexing, matrices, curation) without ingesting proprietary datasets.
   - Optional open-source systems may be **annexed as sidecars** only when they are worth isolating cleanly.

3. **Evidence-first**
   - Every rating and chart claim must be backed by explicit evidence: links, docs, screenshots, exports, or equivalent artifacts.

4. **Fail-closed publishing**
   - If verification or review fails, it does not publish.

5. **Portability**
   - Outputs are exportable as versioned packs so projects can reproduce decisions later.

6. **Trust over vibes**
   - If it cannot be checked, it cannot be published as Trusted.

---

## 5) What Kompendio integrates with

Kompendio has three integration layers:

1. **Core Konnaxion integrations** (always-on inside keenKonnect)
2. **Annexable open-source sidecars** (optional but first-class)
3. **External reference ecosystem** (usually link plus metadata, not data mirroring)

### 5.1 Core Konnaxion integrations (always-on)

These are built-in dependencies that make Kompendio operationally useful:

- **Konstruct (Projects / Tasks)**
  - Attach **Reference Stacks** and chart versions to projects
  - Link tasks to charts or platforms (for example, “use chart X” or “order from catalog Y”)

- **Stockage (Repository / Artifacts)**
  - Store chart exports (PDF, MD, CSV), evidence snapshots, and versioned packs
  - Preserve **what was relied on** for a build so it stays reproducible

- **Identity + Permissions (RBAC)**
  - Control who can publish, review, or mark something as Trusted
  - Support moderation and credibility

- **Search**
  - Make Kompendio usable at scale across platforms, stacks, and charts

- **Optional later: EkoH / Smart Vote**
  - Add an advisory score layer with expert weighting while keeping raw scoring visible

### 5.2 Annexable open-source sidecars (optional, explicit, supported)

These do not replace Kompendio. They extend it as isolated sidecars.

**Identity & access**

- **Keycloak (OIDC)** — unified login for sidecars when self-hosting

**Storage**

- **MinIO** or **SeaweedFS** — S3-compatible artifact storage for packs, evidence, and exports

**Search**

- **OpenSearch** — indexing and retrieval across Kompendio entities and chart content

**Real-time docs (optional collaborative editing)**

- **HedgeDoc**
- **Etherpad**
- **OnlyOffice**
- **Collabora**

These can support collaborative editing, with outputs preserved back into Stockage.

**Inventory / BOM sidecars**

- **InvenTree**
- **Part-DB**
- **PartKeepr** (legacy / optional)

Kompendio does not need to ingest full inventories in v1. It can reference these tools as platforms and optionally sync summaries later without becoming the system of record.

**CAD / geometry helpers (not CAD replacements)**

- **FreeCAD** (headless / CLI workflows)
- **OpenSCAD**
- **SolveSpace**
- **Three.js-based viewers** for STEP/STL preview
- **IFC.js** or equivalent for BIM previews

### 5.3 External reference ecosystem (explicit coverage)

These are reference platforms Kompendio inventories and rates. Integration is generally:

- link plus structured metadata
- evidence snapshots
- export / format notes
- no mirroring of proprietary datasets

Examples include:

**CAD / design platforms**
- cloud CAD ecosystems
- desktop CAD ecosystems
- open CAD ecosystems

**Parts catalogs / procurement**
- industrial catalogs
- electronics distributors
- fastener, bearing, pneumatics, and hydraulics suppliers

**CAD content libraries**
- manufacturer libraries
- aggregators
- community libraries, with IP risk flagged where appropriate

**EDA symbol / footprint sources**
- open library ecosystems
- aggregator references, usually link-only

**BIM object libraries**
- commercial BIM object platforms
- national or institutional BIM libraries

**Materials databases**
- commercial materials databases
- manufacturer datasheets
- institutional and handbook sources

**Standards and handbooks**
- standards bodies
- engineering handbook sites
- institutional references

---

## 6) Integration modes

Every platform or sidecar in Kompendio is assigned an **Integration Mode** so coverage stays explicit.

- **Link-only**
  - Store the platform as a reference with canonical entrypoints and notes
  - No data mirroring

- **Evidence capture**
  - Store screenshots, doc links, exports, and other supporting artifacts for ratings and chart claims

- **Artifact pinning**
  - Attach a platform, stack, or chart version to a project and preserve it in Stockage

- **Connector (sidecar)**
  - Integrate selectively with an OSS system while keeping boundaries explicit and isolated

This keeps Kompendio from drifting into crawler or mirror behavior.

---

## 7) Scope (v1)

### Must-have deliverables

1. **ReferencePlatform Registry**
   - create and edit platforms, tags, domains, types, and entrypoints

2. **Capability Matrix**
   - track formats, APIs, auth, exports, stability notes, and known limitations

3. **Multi-dimensional ratings**
   - vector ratings backed by evidence and reviewer context

4. **Trust states**
   - Draft → Reviewed → Trusted, with explicit promotion gates

5. **Reference Charts**
   - curated, cited, versioned charts with review and publish workflow

6. **Project pinning**
   - attach a Reference Stack and chart versions to a Konstruct project

7. **Export / Import**
   - bundle platforms, charts, evidence pointers, and manifests into a **Reference Pack** with integrity checks

### Explicit non-goals

- automated crawling of internal pages or SKUs
- copying proprietary datasets
- universal connectors for every external service
- complete BOM ingestion from every source

---

## 8) Core objects (data model)

### A) ReferencePlatform

A website/platform-level reference object.

Fields:

- `id`
- `name`
- `canonical_url`
- `type` — CAD, Catalog, Standards, Materials, Reference, BIM, EDA, Library, Community
- `domains[]` — mechanical, electronics, building, fabrication, etc.
- `tags[]` — fasteners, bearings, sheet metal, welding, PCB, etc.
- `access_model` — public, account, paid, API
- `openness_class` — open-source, open-data, proprietary, mixed, unknown
- `ip_risk_flag` — low, medium, high
- `entrypoints[]` — 2 to 10 URLs that matter at widescale
- `capability_matrix`
  - formats
  - exports
  - API availability
  - auth type
  - known limitations
- `trust_state` — Draft, Reviewed, Trusted
- `last_verified_at`

### B) Assessment

An evidence-backed review of a platform or chart.

Fields:

- `id`
- `platform_id` or `chart_id`
- `reviewer_id`
- `reviewer_context` — domain tags, role, optionally “used in project”
- `scores{}` — per-dimension scores
- `evidence_links[]`
- `verification_state` — unverified, peer, expert
- `timestamp`

### C) ReferenceChart

A builder-facing reference chart.

Fields:

- `id`
- `title`
- `scope`
- `content`
- `source_platform_ids[]`
- `claims[]` with citations
- `version`
- `validation_state` — Draft, Reviewed, Published
- `change_log`

### D) ReferenceStack

A curated set of platforms and chart versions for a build context.

Fields:

- `id`
- `name` — for example, “Metal Fab Starter Stack”
- `platform_ids[]`
- `chart_ids[]`
- `intended_context`
- `version`

### E) Dispute / Revalidation

Quality-control structures for maintaining trust.

Fields:

- `dispute_id`
- `target_id`
- `reason`
- `counter_evidence[]`
- `status`
- `revalidation_schedule`
- staleness signals

---

## 9) Ratings model (v1)

### Recommended dimensions

- **Reliability / correctness**
- **Coverage / completeness**
- **Practical usefulness**
- **UX / findability**
- **Interoperability** — formats, APIs, exports
- **Openness** — license clarity, portability
- **Stability** — longevity, predictable URLs

### Outputs

- **Raw score** — simple aggregate or transparent baseline
- **Advisory score** — reserved for weighted or expert-informed scoring later

In v1, the advisory score can use equal weights while the schema remains future-ready.

---

## 10) Trust and publishing workflow

### 10.1 Platform onboarding

1. Create platform → **Draft**
2. Run auto-checks:
   - required fields present
   - canonical URL present
   - duplicate checks
   - minimum capability matrix complete
   - openness class filled
3. Submit for review
4. Reviewer actions:
   - accept → **Reviewed**
   - reject → back to **Draft** with required fixes
5. Promote to **Trusted** only if evidence threshold is met

### 10.2 Chart publishing

1. Create chart → **Draft**
2. Attach sources, claims, and citations
3. Peer review for accuracy, completeness, and licensing constraints
4. Publish → **Published**, or fail-closed back to Draft / Reviewed
5. Versioning rules:
   - never silently edit a published chart
   - new versions create new immutable releases

### 10.3 Disputes and revalidation

- Any Trusted platform or Published chart may be challenged with counter-evidence
- A challenge triggers re-review
- Re-review may result in:
  - a new version
  - a downgrade in trust state
  - confirmation with no change

### 10.4 Trust states

- **Draft** — proposed, incomplete, or unverified
- **Reviewed** — checked and acceptable
- **Trusted / Published** — safe for reuse in builds

Rule:

**If it cannot be checked, it cannot be published as Trusted.**

---

## 11) What Kompendio produces

### 11.1 Reference Platforms (directory)

For each platform, Kompendio makes explicit:

- what it is for
- what it covers
- how it plugs into workflows
- what formats and exports it supports
- how open or stable it is
- what its trust state is

### 11.2 Reference Charts (builder charts)

Charts are the primary leverage layer:

- curated cheat sheets and comparisons
- sourced and review-gated
- versioned so builds remain reproducible

Examples:

- fastener reference charts
- tolerance charts
- materials comparison charts
- procurement or sourcing references

### 11.3 Reference Stacks (context packs)

A **Reference Stack** is a curated set of platforms and chart versions for a build context, such as:

- metal fabrication
- CNC build
- PCB plus enclosure build
- timber build
- robotics build

### 11.4 Reference Packs (export bundles)

A **Reference Pack** contains:

- selected platforms
- selected charts and versions
- evidence pointers or snapshots
- manifest for integrity validation

---

## 12) Integration with keenKonnect

### With Konstruct (projects)

Kompendio adds a **References** layer inside project execution:

- attach a **Reference Stack** to a project
- pin specific chart versions
- link tasks to charts or platforms
- preserve which references were actually used

### With Stockage (artifacts)

Stockage stores:

- chart exports (PDF, CSV, MD)
- evidence snapshots (screenshots, documents, exports)
- release bundles and Reference Packs

Published charts and stacks are treated as versioned artifacts that can be referenced by builds and releases.

---

## 13) Reference Packs (offline / export)

A **ReferencePack** bundle may contain:

- ReferencePlatforms — metadata, entrypoints, capability matrices
- Assessments — evidence links and scores
- ReferenceCharts — content, citations, versions
- Manifest — hashes and signature-ready structure

Rules:

- import validates integrity before activation
- packs are versioned
- old packs remain usable for reproducibility

---

## 14) UI surface (v1)

### 1. Directory

- filters by domain, type, openness, trust state, access model
- sorts by raw score, advisory score, stability, interoperability

### 2. Platform page

- summary and entrypoints
- capability matrix
- ratings breakdown plus evidence
- trust badge, last verified, audit trail
- attach-to-project action

### 3. Chart page

- chart content
- sources and citations
- version history and validation state
- attach-to-project action

### 4. ReferenceStack builder

- create stacks
- publish stacks
- attach stacks to projects

### 5. Review queue

- items awaiting review
- disputes
- revalidation tasks

---

## 15) Acceptance criteria (definition of done for v1)

Kompendio v1 is done when:

- you can add a reference platform with proper entrypoints and tags
- you can rate it with evidence, not vibes
- you can publish a versioned chart through review gates
- a Konstruct project can pin a Reference Stack and specific chart versions
- Stockage preserves the charts and evidence used for the build
- Reference Packs export and import with integrity validation
- the system clearly distinguishes **link-only** from **annexable sidecar** resources

---

## 16) Roadmap

- **v1** — registry, ratings, charts, trust workflow, project pinning, export packs
- **v1.1** — revalidation cadence, dispute UX, “used in project” attestations
- **v2** — selected OSS sidecars, search and storage enhancements, limited summary sync where appropriate, never proprietary mirroring

---

## 17) Summary

Kompendio is the **reference intelligence layer** of keenKonnect.

It inventories and evaluates the websites and platforms builders actually rely on, turns that knowledge into **versioned charts** and **trusted stacks**, ties those references into project execution, and preserves them as **reproducible artifacts**.

Its core rule is simple:

**If it cannot be checked, it cannot be trusted for reuse.**
