# ethiKos — Unified Civic Deliberation & Decision Engine

**A unified civic deliberation, drafting, and decision pipeline**  
**#kintsugi edition — harmonizing the best civic tech patterns into one orchestrated flow**

**Author:** Réjean McCormick  
**Status:** Merged master draft  
**Purpose:** combine the strongest strategic framing, architecture logic, and staged operating model for ethiKos into one canonical public-facing master document.

---

## 1) Executive summary

This update transforms **Konnaxion’s ethiKos** from a structured debate module into a **full-spectrum civic intelligence system**: one that combines **crowd sentiment mapping, structured reasoning, collaborative drafting, formal decision-making, and accountability workflows**.

Instead of merging outside civic platforms directly into the core stack, Konnaxion adopts a **Mimic vs Annex** strategy:

- **Mimic** when a platform’s ideas are strong but the codebase is too heavy, copyleft, architecturally incompatible, or likely to dominate the product.
- **Annex** when a feature is modular, permissively licensed, and can be isolated safely as a sidecar.

The result is not a clone of other civic systems. It is a coherent civic engine that **orchestrates the best ideas in computational democracy without inheriting unnecessary technical debt, governance confusion, or license risk**.

---

## 2) Why this upgrade exists

Online debate fails for structural reasons:

- chronological feeds reward repetition, outrage, and dominance,
- threads collapse into identity conflict instead of converging on decisions,
- “consensus” becomes a popularity contest instead of a clarity mechanism,
- even when a vote happens, follow-through often disappears.

**ethiKos vNext** restructures participation into distinct stages, each optimized for a different job:

1. **Discovery** — surface the real landscape of opinions  
2. **Deliberation** — capture the “why,” not the noise  
3. **Drafting** — convert agreement into text people can sign  
4. **Decision** — choose an outcome using a clear protocol  
5. **Accountability** — track implementation and keep receipts

This is the **#kintsugi approach**: consolidate what works, harmonize it, and orchestrate it into one coherent civic engine.

---

## 3) Strategic principle: Mimic vs Annex

### Mimic (native re-implementation)

Use when:

- the source license is **AGPL/GPL**,
- the stack is incompatible or too invasive,
- the platform is effectively a full civic operating system,
- Konnaxion needs sovereignty, long-term stability, and a unified UX.

### Annex (sidecar / optional integration)

Use when:

- the source license is **MIT / BSD / Apache**,
- the feature is modular and isolatable,
- integration can add speed without corrupting the core architecture,
- the component can remain replaceable.

This keeps Konnaxion architecturally coherent while still learning from proven civic technology patterns.

---

## 4) Core architecture principle: many inputs, one common reading layer

ethiKos introduces multiple ways to participate — tri-votes, reasons, proposals, drafting, decision protocols — without creating separate incompatible decision systems for each.

Instead, the architecture converges into a shared aggregation and publication layer built around **Smart Vote**. That means civic input can be:

- compared fairly,
- audited consistently,
- analyzed through multiple legitimate lenses,
- displayed in ways that resist manipulation.

This is not about claiming a single “correct” outcome. It is about supporting **multiple legitimate readings of the same civic input**, clearly declared and reproducible.

---

## 5) Smart Vote, explained simply

Smart Vote is not a power-grab mechanism. It is a **reading and aggregation layer** that can be turned on or off depending on the decision context.

### Smart Vote stores votes in a standardized way

Each vote or recorded signal can be represented as:

- **who** participated,
- **what object** they acted on (topic, statement, reason, proposal, etc.),
- the **raw value** of that action,
- optional **metadata** (region, cohort, language, role, etc.),
- optional **weighting inputs** for declared alternative readings.

### Smart Vote enables multiple lenses on the same result

#### Lens A — 1 person = 1 vote

This is the baseline democratic reading:

- everyone counts equally,
- it is simple, understandable, and universally legible,
- it remains available as the canonical baseline.

Best suited for:

- broad civic consultations,
- public referendums,
- high-trust situations,
- contexts where equality of influence is the primary legitimacy principle.

#### Lens B — quality-weighted reading

This is an optional clarity layer:

- participation can be weighted using declared expertise, trusted participation history, or other governed criteria,
- not to silence anyone, but to increase signal resolution where competence matters.

Best suited for:

- scientific or medical domains,
- high-risk decisions,
- technical governance,
- professional standards and safety questions.

**Important:** ethiKos can show both readings side by side. The baseline remains visible; no single lens is forced.

---

## 6) Cohort filters: the library of readings

ethiKos results should support filters that help communities understand **who agrees with what** without fragmenting the process into separate debates.

Examples:

- region / jurisdiction,
- language,
- age bands where appropriate,
- role (citizen, stakeholder, organization member),
- field of expertise,
- level of expertise,
- verified cohorts.

This makes it possible to ask:

- What does the overall crowd think?
- What do local residents think?
- What do professionals think?
- Where do experts disagree with the public?
- Where do groups converge?

This is how ethiKos avoids both extremes:

- purely popular outcomes with low competence,
- purely technocratic outcomes with low legitimacy.

---

## 7) Source platforms and how ethiKos uses them

### A. Polis — consensus mapping

**Status:** MIMICKED  
**Patterns adopted:**

- Agree / Disagree / Pass interaction,
- opinion-space mapping,
- cluster detection,
- bridge-statement discovery.

**What Konnaxion adds:**

- Smart Vote readings,
- cohort filters,
- dual view of crowd topology and credibility topology,
- auditable derivation of outcomes.

**Result:** ethiKos gains computational consensus discovery, not just comment threads.

### B. Loomio — decision protocols

**Status:** MIMICKED  
**Patterns adopted:**

- proposal lifecycle,
- time-boxed decisions,
- consent / objection / approval flows,
- clear outcome publishing.

**What Konnaxion adds:**

- Smart Vote publication layer,
- clearer publication of alternative readings,
- stronger transition from debate to decision.

**Result:** ethiKos gains decision mechanics instead of endless discussion.

### C. Decidim — civic process architecture

**Status:** MIMICKED  
**Patterns adopted:**

- participation workflows,
- consultation → drafting → voting → execution pipelines,
- public accountability timelines.

**What Konnaxion adds:**

- integration with keenKonnect execution,
- governance dashboards and insight surfaces.

**Result:** ethiKos gains legitimacy scaffolding for real process follow-through.

### D. CONSUL Democracy — petitions and budgeting

**Status:** MIMICKED  
**Patterns adopted:**

- petition thresholds,
- proposal gating,
- participatory budgeting mechanics.

**What Konnaxion adds:**

- Smart Vote readings,
- cohort filters,
- optional expertise-aware interpretations.

**Result:** ethiKos gains scalable civic legitimacy mechanics.

### E. Consider.it — deliberation compression

**Status:** MIMICKED  
**Patterns adopted:**

- structured pro/con reasons,
- summarized rationale visualization,
- reflection-first interaction patterns.

**What Konnaxion adds:**

- stronger credibility interpretation,
- anti-troll interaction constraints,
- compatibility with structured decision outputs.

**Result:** ethiKos gains high-signal reasoning instead of flamewars.

### F. Your Priorities — idea intake and ranking

**Status:** ANNEX (optional)  
**Patterns adopted or integrated:**

- lightweight idea submission,
- community prioritization,
- early-stage filtering.

**Result:** a fast ideation intake layer.

### G. All Our Ideas — pairwise voting

**Status:** ANNEX or MIMIC  
**Patterns adopted:**

- pairwise idea ranking,
- popularity-resistant prioritization.

**Result:** better idea filtering before full deliberation.

### H. LiquidFeedback — delegation and voting theory

**Status:** MIMICKED  
**Patterns adopted:**

- delegated voting logic,
- liquid democracy models,
- vote-flow mathematics.

**What Konnaxion adds:**

- domain-specific delegation,
- governance-aware interpretation layers.

**Result:** scalable governance mechanics for larger populations.

### I. DemocracyOS — policy debate UX

**Status:** MIMICKED  
**Patterns adopted:**

- proposal-centric discussion pages,
- clause-level policy review.

**Result:** ethiKos gains legislative-grade policy review patterns.

### J. Citizen OS — collaborative drafting

**Status:** MIMICKED  
**Patterns adopted:**

- co-authoring proposals,
- structured discussion around text,
- draft versioning.

**Result:** a smooth transition from consensus to final policy text.

### K. OpenSlides — assembly and parliamentary mode

**Status:** ANNEX (optional)  
**Patterns adopted or integrated:**

- motions,
- elections,
- formal meeting governance.

**Result:** optional institutional “Parliament Mode.”

---

## 8) The unified ethiKos pipeline

### Stage 0 — Idea intake and early prioritization

**Job:** gather many ideas quickly without chaos.

**What happens:**

- people submit ideas or statements,
- lightweight prioritization helps shortlist items,
- promising inputs move forward to deeper consultation.

**Inspired by / optionally integrated from:**

- Your Priorities,
- All Our Ideas.

**Why it matters:** it prevents “10,000 comments = unusable noise.”

### Stage 1 — Consultation and consensus mapping

**Job:** reveal the real opinion landscape and detect common ground.

**Interaction rules:**

- no reply chains,
- no thread combat,
- simple Agree / Disagree / Pass input where appropriate.

**What the engine produces:**

- opinion maps,
- participant clusters,
- bridge statements,
- divisive statements.

**Inspired by:** Polis.

### Stage 2 — Deliberation (reasons over reactions)

**Job:** capture the “why” in structured form.

**Mechanics:**

- reasons are stored as pro/con points,
- participants assess reasons for strength and clarity,
- debate becomes legible rather than personal.

**Outputs:**

- strongest reasons for agreement,
- strongest reasons for disagreement,
- summaries of where the tension lives.

**Inspired by:** Consider.it and Kialo-style argument mapping.

### Stage 3 — Drafting (turn consensus into text)

**Job:** convert agreement into a proposal people can adopt.

**Mechanics:**

- collaborative drafting,
- amendment flows,
- version history,
- visible evolution from idea to final text.

**Inspired by:** Citizen OS drafting patterns.

### Stage 4 — Decision (protocols and outcomes)

**Job:** end debate responsibly and publish a clear result.

**Mechanics:**

- proposal cards with time windows,
- selectable decision protocols,
- publishable outcomes with dissent visibility,
- baseline reading plus optional declared readings.

**Inspired by:** Loomio, with optional advanced concepts from LiquidFeedback.

### Stage 5 — Process and accountability

**Job:** prevent participation from becoming performative.

**Mechanics:**

- process phases from consultation to implementation,
- transparency pages with milestones and updates,
- public tracking of what changed, shipped, or stalled.

**Inspired by:** Decidim and CONSUL Democracy.

### Optional module — Assembly / Parliament Mode

**Job:** support formal institutional meetings.

**Optionally integrated from:** OpenSlides.

---

## 9) Mimicked vs integrated: what comes from where

### MIMICKED (native inside ethiKos)

- **Polis** — consultation rules, opinion mapping, bridge statements  
- **Consider.it** — reason capture, deliberation compression  
- **Citizen OS** — collaborative drafting patterns  
- **Loomio** — proposals, decision protocols, outcome publishing  
- **Decidim** — process scaffolding, legitimacy workflows  
- **CONSUL Democracy** — petition and budgeting mechanics  
- **LiquidFeedback** — delegation concepts and governance mathematics  
- **DemocracyOS** — proposal and policy framing UX

### INTEGRATED (optional annex modules)

- **All Our Ideas** — pairwise ranking  
- **Your Priorities** — idea intake and prioritization  
- **OpenSlides** — assembly mode

---

## 10) Architectural integrity

Konnaxion remains:

- a coherent core application stack,
- operationally sovereign,
- analytically auditable,
- able to learn from outside platforms without being captured by them.

External applications are:

- **never merged blindly into the core**,
- either mimicked natively or isolated as sidecars,
- connected only through controlled interfaces and replaceable boundaries.

This preserves long-term product coherence.

---

## 11) Ethical positioning and public credit

ethiKos should explicitly credit its inspirations.

A clear public statement could be:

> ethiKos builds on ideas pioneered by Polis (consensus mapping), Loomio (decision protocols), Decidim and CONSUL (civic workflows), Consider.it (deliberation UX), LiquidFeedback (delegated democracy), and Citizen OS (collaborative drafting).

That positions Konnaxion as **an orchestrator of the best democratic innovations, not a clone**.

---

## 12) Outcome: what Konnaxion becomes

Konnaxion evolves into:

- a **Consensus Engine**,
- a **Reasoning Engine**,
- a **Drafting Engine**,
- a **Decision Engine**,
- a **Civic Process Engine**,
- and, optionally, a more formal **Governance OS** layer for institutional use.

In short:

**Konnaxion becomes a full-stack platform for collective intelligence, democratic legitimacy, and real-world decision-making.**

---

## 13) Why publish this before coding

Civic software usually fails first at the architecture and legitimacy level, not the UI level.

Publishing this merged plan early allows civic builders, researchers, and practitioners to:

- challenge missing edge cases,
- improve legitimacy safeguards,
- suggest interoperability patterns,
- identify architectural risks before they harden into design debt.

---

## 14) Credits and inspirations

This document draws inspiration from:

- Polis,
- Consider.it,
- Citizen OS,
- Loomio,
- Decidim,
- CONSUL Democracy,
- All Our Ideas,
- Your Priorities,
- OpenSlides,
- LiquidFeedback,
- Kialo-style argument mapping patterns,
- DemocracyOS-style policy review patterns.

---

## 15) Suggested companion document structure

This merged master document should sit alongside:

- **ethiKos v2 — Boundaries and articulation with Kintsugi elements** for governance boundaries, canonical objects, ownership, and audit contracts,
- any later short hub/overview page for lighter public onboarding.

That keeps strategy and architecture-legitimacy framing separate from operational contracts.
