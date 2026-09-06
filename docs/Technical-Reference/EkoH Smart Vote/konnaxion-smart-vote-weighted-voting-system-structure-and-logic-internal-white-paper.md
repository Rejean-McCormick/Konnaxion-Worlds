# Konnaxion Smart Vote — Contextual Collective-Intelligence Readings

## Executive summary

Smart Vote is a mechanism for producing **parallel, declared readings** of collective input. Its purpose is not to replace democratic equality with a permanent hierarchy of experts. It makes relevant expertise legible alongside the public baseline.

The architecture rests on four distinctions:

1. **Political equality is not epistemic equivalence.** Everyone may retain an equal baseline voice while relevant expertise can be examined separately.
2. **Expertise is contextual.** Competence in economics does not create authority in cybersecurity, medicine, education, or Indigenous governance.
3. **A reading is not truth.** A weighted result is an interpretive lens over source facts.
4. **Advice is not decision authority.** Institutions remain responsible for legitimate decisions.

## 1. The problem

Public decisions often combine several kinds of knowledge: lived experience, technical expertise, economic analysis, legal constraints, institutional knowledge, territorial knowledge, and public preference.

A single raw vote can reveal preference but cannot by itself reveal how the result changes when a particular type of relevant knowledge is considered. A single opaque weighted score creates the opposite problem: it hides the democratic baseline and makes the weighting difficult to interpret.

Smart Vote therefore keeps the signals separate.

## 2. Single facts, multiple readings

The canonical rule is:

> **One set of source facts; multiple declared readings.**

For example, an ethiKos consultation might expose:

```text
Public baseline
Relevant-expertise reading
Affected-community reading
Jurisdictional reading
Expert-panel reading
```

These readings can agree or diverge. Neither convergence nor disagreement is automatically truth.

The objective is coherence, not consensus.

## 3. EkoH as the contextual layer

EkoH describes demonstrated expertise by domain. It does not assign a universal rank to the person.

A profile can be visualized as:

```text
Economics              0.92
Public administration  0.78
Software systems       0.20
Environmental science  0.15
```

A different participant may have the inverse profile.

The same person can therefore have strong advisory relevance in one consultation and ordinary baseline influence in another.

## 4. Questions also have profiles

A consultation declares its domain relevance before a weighted reading is computed.

Example A — fiscal policy:

```text
Economics              40%
Public administration  20%
Statistics             15%
Political science      15%
Welfare                 10%
```

Example B — technological sovereignty:

```text
Software / AI          25%
Network / data systems 10%
Economics              20%
Administration         15%
Political science      10%
Law                    10%
Energy                 10%
```

The first question will amplify different participants than the second. That is the point.

## 4.1 Source-target binding

The question remains owned by ethiKos/Konsultations. Smart Vote creates a reading context only after an explicit source-target binding exists. `SourceConsultationBinding` maps an `ethikos_topic` source identifier to the Smart Vote consultation that owns the relevance vector. No runtime component should infer this relationship from matching titles.

For demo schema v3, `topic_relevance` is therefore the preferred import form. The importer creates or updates the binding and writes the declared domain vector to `ConsultationRelevance`.

## 5. Why domain relevance must be visible

The domain vector is part of the governance of the lens. It cannot be a hidden model choice.

Participants should be able to ask:

- Why is economics 30% rather than 10%?
- Why is cybersecurity absent?
- Does the question require Indigenous governance expertise?
- Is the lens missing a materially affected group?

A poor relevance vector can produce a poor reading even if the EkoH profiles themselves are accurate.

## 6. Weighting without sovereignty

A useful conceptual formula is:

```text
alignment = participant expertise · question relevance
reading weight = baseline + bounded contextual bonus
```

The weight exists **for that reading of that question**. It is not attached permanently to the person.

This preserves a core distinction:

> Expertise informs judgment. It does not silently acquire political sovereignty.

## 7. Public baseline remains visible

A Smart Vote implementation should never force observers to choose between democracy and expertise by hiding one of them.

Example:

```text
Public baseline:             61% support
Relevant-expertise reading:  74% support
```

The difference is information. A decision-maker can then inspect why it exists: which domains mattered, which expert cohorts participated, where evidence converged, and which expertise was missing.

The system should also be able to report insufficient coverage rather than imply false confidence.

## 8. Institutions, individuals, and cohorts

An institutional position and an individual EkoH profile are not identical objects.

A ministry, statistical agency, professional association, university, Indigenous nation, private firm, and individual expert may each contribute legitimate knowledge, but they represent different forms of authority and evidence.

Readings should declare how these actor types are included rather than silently combine them into one undifferentiated score.

## 9. Ethics and reliability

EkoH may carry a reliability or ethics modifier, but this must not become a universal morality score.

The signal should concern governed properties such as evidence integrity, declared conflicts, repeated manipulation, or other reviewable conduct. It must be bounded, explainable, privacy-aware, and open to correction.

For demonstrations where no evidence supports differentiation, the neutral multiplier should be used.

## 10. Conflict and recusal

A participant may possess genuine expertise and also have a strong conflict or prior commitment. Those facts can coexist.

The system should support explicit conflict declarations and recusal without erasing the participant's arguments or evidence. A reading can then include, exclude, or separately display the contribution according to its declared rules.

## 11. Confidential contexts

The same core can support public or restricted deliberation. Sensitive diplomatic, security, commercial, cabinet, or other institutional processes may require closed access.

Confidentiality changes who can see or participate; it does not require a different epistemic core. Source facts, provenance, domain relevance, and declared readings can still be governed consistently inside the closed environment.

## 12. AI boundary

AI may assist with:

- domain classification;
- evidence extraction;
- summarization;
- translation;
- comparison;
- anomaly detection;
- proposed relevance vectors.

AI output is not authoritative by default. It must not silently change canonical ballots, EkoH scores, lens definitions, or decision authority.

## 13. Architectural value

The value of Smart Vote is not that experts “win” over the public. The value is that a decision-maker can inspect several legitimate signals without collapsing them into one opaque score.

This makes it possible to ask:

- What does the public prefer?
- What does relevant expertise suggest?
- What do directly affected groups see differently?
- Where is the evidence strong?
- Which domains are underrepresented?
- Where do the readings converge or diverge?

That is a more useful form of collective intelligence than either an unstructured comment stream or an invisible technocratic weighting.

## 14. Canonical invariants

- Coherence ≠ consensus.
- Expertise ≠ sovereignty.
- Competence ≠ mandate.
- Political equality ≠ epistemic equivalence.
- Affectedness ≠ expertise.
- Vote count ≠ collective judgment.
- Majority ≠ truth.
- Expert consensus ≠ democratic mandate.
- One score ≠ one reality.
- Lens ≠ truth.
- Advice ≠ authority.
- AI analysis ≠ automated sovereignty.
- Source facts must not be mutated by derived readings.
