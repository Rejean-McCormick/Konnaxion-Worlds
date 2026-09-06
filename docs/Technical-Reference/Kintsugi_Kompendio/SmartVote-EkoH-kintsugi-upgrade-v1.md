# **SmartVote / EkoH — Kintsugi v1**

**Scope:** Upgrade SmartVote into a governance-grade “decision engine” while keeping **EkoH stable as the canonical registry** for expertise indicators \+ ethical multipliers.  
**Deployment posture:** Hybrid (SaaS \+ self-host / on-prem).

---

## **1\) What SmartVote and EkoH are (in your current architecture)**

### **EkoH (stays as-is: registry \+ audit)**

EkoH already defines the canonical objects you need for weighting and explainability:

* expertise domains \+ user expertise scores, ethics multiplier, configuration weights, contextual analysis logs, privacy settings, and score history/audit.

### **Smart Vote (single source of voting truth)**

Smart Vote already defines:

* Vote (raw\_value \+ weighted\_value), vote modalities, aggregated results, and cross-module mapping.  
  And it’s positioned as the single source of voting truth in the platform integrity rules.

## **2\) What “Kintsugi” means here**

Kintsugi is **bringing best open-source building blocks under one coherent roof—without merging everything into a monolith**.  
Key policy: **Mimic vs Annex**. Annex only when a sidecar can be isolated and won’t create licensing/UX/dual-truth problems; otherwise mimic the pattern natively.

## 

## **3\) The target outcome**

SmartVote becomes a “decision engine” that can drive:

* **formal decision mechanics** (time-boxed, thresholded) and **outcome publication**,  
* embedded inside a broader civic workflow (consultation → drafting → voting → execution \+ accountability timelines).

## **4\) Core principles (ported from the Kintsugi plans)**

1. **One-roof experience** (one identity, consistent permissions).  
2. **No dual truth** (canonical IDs \+ lifecycle inside Konnaxion, even if sidecars exist).  
3. **Integration contract for any annexed component**: identity/access, canonical IDs, events, portability/export.  
4. **Architectural integrity**: external apps are mimicked or isolated; never merged into core.  
5. **Hybrid by default**.

## 

## 

## **5\) “Best of each” blueprint (what to mimic vs annex)**

### **A) Mimic Decidim (process \+ legitimacy scaffolding)**

**Mimic these patterns:**

* participation workflows and the **consultation → drafting → voting → execution** pipeline, plus public accountability timelines.  
  **Where it lands in SmartVote/EkoH:**  
* a **Process / Consultation layer** above SmartVote that controls phases, eligibility windows, and what gets published when.

### **B) Mimic LiquidFeedback (delegation \+ voting theory)**

**Mimic these patterns:**

* delegated voting logic \+ “vote flow mathematics”.  
  **What you add (your differentiator):**  
* domain-specific delegation \+ ethical multiplier governance.

### **C) Mimic Decidim Awesome-style governance knobs (scheme registry)**

You cloned decidim-module-decidim\_awesome because it’s useful as a **reference** for “admin-selectable voting mechanics” and “weight breakdown surfaces”. In SmartVote, implement the *idea* as:

* a **VotingScheme registry** (per consultation/component)  
* **validators** (who can vote, allowed ballots, weight constraints)  
* **result presentation adapters** (charts, breakdowns, export)

(Implementation stays native to your stack to avoid platform-shell contamination; consistent with Mimic vs Annex.)

## 

## 

## **6\) SmartVote/EkoH architecture v1**

### **6.1 Canonical modules**

1. **EkoH Registry (stable)**  
* ExpertiseCategory, UserExpertiseScore, UserEthicsScore, ScoreConfiguration, ScoreHistory, privacy \+ context logs.  
2. **SmartVote Engine (upgrade focus)**  
* Vote (raw+weighted), VoteModality, VoteResult, IntegrationMapping.  
3. **Process / Consultation Orchestrator (new)**  
* Implements the “consultation → drafting → voting → execution” pipeline as first-class objects.  
4. **Insights surfaces (read-optimized)**  
* Public dashboards \+ transparency pages (aligned with “outcome publication” in decision stage).

### **6.2 What SmartVote must add to become governance-grade**

* **Policy & phase model** (open/close windows, quorum/threshold, tie-break policy)  
* **Tally backends by modality** (don’t reduce everything to a single sum)  
* **Explainability endpoints** (weight breakdown, without leaking private data)  
* **Export bundles** (portability contract)

These are direct extensions of the integration/portability contract.

## 

## 

## **7\) End-to-end pipeline (SmartVote/EkoH version)**

This is the SmartVote-focused analogue of the ethiKos pipeline stages.

### **Stage 0 — Setup (Process authoring)**

* Define consultation/process, phases, rules, eligible cohorts.

### **Stage 1 — Eligibility \+ Weight snapshot (EkoH)**

* Pull expertise \+ ethics multiplier; apply privacy settings; record weight explanation links.

### **Stage 2 — Decision window (Casting)**

* Votes recorded with raw \+ weighted values (canonical).

### **Stage 3 — Tally**

* Run the correct tally per modality (approval/rating vs ranking/preferential vs delegation-enabled).

### **Stage 4 — Outcome publication**

* Publish formal results \+ transparency views (aligned with “formal outcome publication”).

### **Stage 5 — Execution \+ accountability**

* Link adopted outcomes to “impact tracking” / follow-up actions (execution pipeline).

## 

## **8\) Delivery plan (v1 milestones)**

### **Milestone 1 — “Truth \+ Explainability”**

**Deliverables**

* GET /weights/explain?user\&context returns: category scores, ethics multiplier, config version, and final weight (no private fields).  
* ScoreHistory enforced for any recalculation/config change.  
* Vote writes always store both raw\_value and weighted\_value.

### **Milestone 2 — “Process shell”**

**Deliverables**

* Process/Consultation objects implementing the pipeline structure.  
* Phase gating (open/close) that controls voting availability.  
* Public timeline objects for accountability (who/what/when), consistent with “public accountability timelines”.

### **Milestone 3 — “Modalities done right”**

**Deliverables**

* For each VoteModality, define:  
  * ballot schema,  
  * tally engine,  
  * export format,  
  * deterministic tie-break.  
* Keep VoteResult for simple totals, but store modality-specific outputs (JSON snapshots) for complex tallies.

### **Milestone 4 — “Delegation (Liquid patterns)”**

**Deliverables**

* Delegation logic (domain-scoped) with ethics governance hooks.  
* Anti-capture constraints (limits, decay, transparency views).

### 

### **Milestone 5 — “Cross-module embed”**

**Deliverables**

* IntegrationMapping-based embedding so SmartVote can be used in other modules without duplicating vote logic.

## **9\) Decision on annexing (what you should *not* do in v1)**

* **Do not annex Decidim or Awesome as running sidecars** in v1: they are “platform shells” and violate the “no contamination” posture.  
* **LiquidFeedback core** should be treated as a *reference implementation* first; annex only if you can isolate it behind the integration contract (events \+ portability \+ canonical IDs), otherwise mimic the math in your own tally layer.

## **10\) What stays stable (explicit)**

* EkoH remains the expertise \+ ethics registry and audit backbone.  
* SmartVote remains the single source of voting truth; external inspirations do not become your core runtime.

