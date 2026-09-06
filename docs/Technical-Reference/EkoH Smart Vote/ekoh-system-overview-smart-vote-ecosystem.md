# EkoH System Overview

## Status

This document describes the current architectural role of **EkoH** inside Konnaxion and ethiKos.

The binding separation is:

- **ethiKos / Konsultations** own source participation facts.
- **EkoH** supplies contextual expertise, reliability, provenance, and privacy-aware profile data.
- **Smart Vote** may use an EkoH snapshot to publish a declared, reproducible reading of source facts.

EkoH is **not** the voting engine and an EkoH-weighted result is **not** the canonical source result.

## 1. Purpose

EkoH helps answer a narrow question:

> What competence and reliability context is relevant to this contribution, for this domain, at this time?

It does not assign a universal rank to a person. Expertise is contextual and domain-bounded. A strong economics profile may matter greatly for a fiscal consultation and provide little or no additional signal for a software-security question.

## 2. Domain-bounded expertise

EkoH represents expertise as a vector across a governed knowledge taxonomy. The current implementation uses `ExpertiseCategory` and `UserExpertiseScore`.

Conceptually:

```text
user expertise = {
  domain A: score,
  domain B: score,
  domain C: score,
  ...
}
```

Scores must be grounded in evidence such as verified credentials, documented practice, validated contributions, peer review, or other governed sources. Absence of expertise in a domain is not a penalty; it simply means no expertise bonus is available for that domain.

The current scoring contract normalizes domain expertise to `0..1`.

## 3. Evidence and provenance

An EkoH score should be explainable. The system should be able to answer:

- Which domain is being scored?
- Which evidence contributed?
- Which rules transformed that evidence into the current score?
- When was the score computed?
- Which version of the scoring policy was used?
- Can the subject challenge or correct the evidence?

Automated analysis may assist classification or propose adjustments, but probabilistic output must not silently become authoritative profile state.

## 4. Reliability / ethics signal

EkoH may expose a governed reliability or ethics modifier. This is a cross-cutting signal, not a declaration of a person's moral worth.

The modifier must be:

- explainable;
- governed;
- appealable where appropriate;
- bounded;
- subject to privacy rules;
- separable from domain expertise.

For demo data where no defensible evidence exists, the neutral value is `1.0`.

## 5. Consultation relevance

A consultation or declared Smart Vote lens specifies which expertise domains are relevant and their relative importance.

Example:

```text
Federal fiscal question
Economics            40%
Public administration 20%
Statistics            15%
Political science     15%
Welfare               10%
```

The weights form a relevance vector and should normally sum to `1.0`.

This prevents expertise from leaking across unrelated domains.

## 5.1 Source binding

A Smart Vote consultation used for an ethiKos topic must be bound explicitly to that source object. The current binding is `SourceConsultationBinding`:

```text
source_type = ethikos_topic
source_id   = <EthikosTopic primary key>
consultation = <Smart Vote Consultation UUID>
```

The binding prevents title-based guessing and lets the same source facts be read through Smart Vote without transferring ownership of the topic. Demo schema v3 uses `topic_relevance` for this path.

## 6. EkoH and Smart Vote

For participant `u` and consultation `c`, Smart Vote may compute contextual expertise alignment from:

```text
alignment(u,c) = Σ relevance(c,d) × expertise(u,d)
```

EkoH provides the expertise data. Smart Vote owns the derived reading.

The public or canonical baseline remains a separate result. A weighted reading must not overwrite source ballots, stances, arguments, or baseline outcomes.

## 7. Multiple readings

The architectural rule is:

> Single source facts, multiple declared readings.

Examples of possible readings include:

- public baseline;
- relevant-expertise advisory reading;
- affected-group reading;
- jurisdictional reading;
- expert-panel reading.

A lens is a method of interpretation, not truth. A reading must identify its method, inputs, snapshot, and computation time.

## 8. Privacy and confidentiality

EkoH profile data can be sensitive. Visibility settings must be respected independently from the existence of a reading.

A Smart Vote reading may use an authorized EkoH snapshot without exposing every participant's private domain scores publicly.

Public, pseudonymous, anonymous, and institutionally private contexts must remain distinguishable.

## 9. Current implementation boundary

The current EkoH API exposes a read-only user profile with:

- user identity/display information;
- confidentiality level;
- per-domain weighted expertise scores;
- ethics/reliability score.

The profile is context. It is not a fixed global Smart Vote weight.

## 10. Invariants

- Expertise ≠ sovereignty.
- Competence ≠ political mandate.
- Political equality ≠ epistemic equivalence.
- EkoH ≠ Smart Vote.
- EkoH score ≠ universal human rank.
- AI output ≠ canonical EkoH state.
- Weighted reading ≠ source fact.
- Lens ≠ truth.
- Baseline results remain visible.
