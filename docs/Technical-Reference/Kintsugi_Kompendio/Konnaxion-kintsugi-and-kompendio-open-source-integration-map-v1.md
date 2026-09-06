# **Konnaxion: Kintsugi \+ Kompendio Open-Source Integration Map**

##  **Konnaxion is already the backbone**

**Konnaxion already exists** as the coordination “spine” of the kOA ecosystem: a public shell that links education, building, and governance modules into one coherent loop—without creating new silos.

It’s not optimized for “just shipping features,” but for **governability under real constraints** (offline/local capability, auditability, modularity, and resistance to capture).

## **How to read the open-source list**

This inventory is structured in two layers that sit **on top of Konnaxion**:

* **Kintsugi** \= the “open-source under one roof” layer: a curated set of primitives integrated as lanes, held together by shared contracts (identity, permissions, event/audit surface, artifact/release packaging) so they behave like one product across SaaS and self-host deployments.

* **Kompendio** \= the “reference \+ integration map” layer: not a link list, but an **integration repertory** that makes dependencies explicit (what we **Annex** as sidecars vs what we **Mimic** as native patterns), and publishes versioned charts/fiches you can pin to projects.


## KonnectED (upgrade track)

| Area | Standards / protocols | Annexed (integrated sidecars) | Mimicked (pattern sources; not annexed by default) | Core stack that stays stable |
| :---- | :---- | :---- | :---- | :---- |
| **Kintsugi** | OIDC (SSO), LTI 1.3 (tool launch), xAPI (event capture), Open Badges; S3 API for object storage; OIDC/SAML \+ JWT coexistence via Keycloak-style SSO | **H5P**, **SQL LRS (xAPI)**, **Safe Exam Browser (SEB)**, **Kolibri**, **Keycloak**, **OpenSearch**, **SeaweedFS** (and allow MinIO-style) | **Moodle** (default mimic; optional annex as separate service), **TAO CE** (default mimic; optional annex as separate service), **Open Badges model** (default mimic; optional annex issuer like Badgr/EduBadges), **LimeSurvey** (baseline questionnaires) | Next.js, Django, Postgres, Celery, unified auth \+ RBAC, Insights |
| **Kompendio**  | **OIDC**, **LTI 1.3 (+ Advantage)**, **xAPI**, **cmi5**, **Open Badges 3.0**; comparison refs: **QTI**, Common Cartridge/Thin CC, OneRoster, Caliper, SCORM | Activity engines: Moodle, H5P, TAO, SEB, LimeSurvey, LRS (Learning Locker / SQL LRS), Open Badges issuers (Badgr / EduBadges) | (Kompendio’s job is to map Mimic vs Annex explicitly per entry) | Sovereign infra shelf: Keycloak, OpenSearch, SeaweedFS/MinIO |

## keenKonnect (upgrade track)

| Area | Integrated tech | Standards / contracts | Reference ecosystem (tracked as references, not sidecars) |
| :---- | :---- | :---- | :---- |
| **Kintsugi** | Lanes: **InvenTree** (default) / Part-DB (opt); **OpenSearch**; **Etherpad** (default) / HedgeDoc (opt); **SeaweedFS** (default) / Ceph (opt) / MinIO (opt); **Gitea** (default) / Forgejo (opt); CAD/BIM lane \= export→artifact→release standardization | Integration contract: OIDC/SSO, canonical IDs, event surface, artifact capture, portability/export; Release Pack can include checksums/signatures | — |
| **Kompendio** | Annexable sidecars: **Keycloak (OIDC)**; **MinIO or SeaweedFS**; **OpenSearch**; **HedgeDoc / Etherpad / OnlyOffice / Collabora**; **InvenTree / Part-DB / PartKeepr**; **FreeCAD (headless/CLI)**, **OpenSCAD**, **SolveSpace**; web viewers (**Three.js-based**, **IFC.js**) | Integration modes: link-only, evidence capture, artifact pinning, connector (sidecar) | Catalogs/libs/dbs tracked as references (examples): TraceParts-like, PARTcommunity (CADENAS)-like, 3D ContentCentral-like, GrabCAD-like; KiCad libs, SnapEDA-like, Octopart-like; BIMobject-like, NBS-like; MatWeb-like; ISO/ASME/DIN-like; NIST/USDA-like |

## ethiKos (upgrade track)

| Area | Annexed (integrated sidecars) | Mimicked (pattern sources) | Core stack \+ binding protocols |
| :---- | :---- | :---- | :---- |
| **Kintsugi** | **OpenSlides** (optional), **Your Priorities** (optional), **All Our Ideas** (optional) | Polis (incl. PCA \+ clusters), Consider.it (+ Kialo patterns), CitizenOS patterns, Loomio (+ Smart Vote), Decidim \+ CONSUL, LiquidFeedback, DemocracyOS | Django monolith \+ Insights; **Celery \+ Redis**; **API \+ JWT SSO**; **Smart Vote** as voting truth source |

**Kompendio (TBD)**