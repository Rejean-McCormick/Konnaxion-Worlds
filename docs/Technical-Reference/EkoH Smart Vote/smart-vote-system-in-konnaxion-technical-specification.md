# Smart Vote in Konnaxion — Technical Specification

## Status and authority

This specification follows the current ethiKos Kintsugi boundary:

> **ethiKos preserves canonical source facts. Smart Vote publishes declared, reproducible readings. EkoH supplies contextual profile data.**

Smart Vote must not mutate source ballots, source stances, arguments, or canonical baseline results.

## 1. Ownership boundaries

| Concern | Canonical owner |
| --- | --- |
| Topic / deliberation facts | ethiKos |
| Public ballot / decision facts | Konsultations / ethiKos decision layer |
| Domain expertise profile | EkoH |
| Reliability / ethics context | EkoH |
| Consultation domain relevance | Smart Vote reading context / governed consultation configuration |
| Derived weighted result | Smart Vote |
| Reading presentation | ethiKos Decide / Insights / Pulse |

EkoH is not a voting engine. Smart Vote is not the owner of the underlying civic fact.

## 2. Source facts and baseline

A source ballot records what the participant actually submitted. For an ethiKos stance this may be a value in `-3..+3`; for other ballot modalities it may be approval, ranking, rating, or allocation data.

The source event must remain unchanged by later interpretation.

The baseline is computed from those source facts under the declared baseline rule, normally preserving one-person-one-vote political equality where applicable.

## 3. EkoH expertise vector

Each participant may have an EkoH expertise vector:

```text
S(u) = { domain_id -> normalized_score }
```

Current normalized contract:

```text
0.0 <= S(u,d) <= 1.0
```

Scores are domain-specific and should be evidence-backed.

## 4. Consultation relevance vector

Each Smart Vote reading that uses expertise declares a relevance vector:

```text
R(c) = { domain_id -> relevance_weight }
```

Requirements:

```text
0.0 <= R(c,d) <= 1.0
Σ R(c,d) = 1.0
```

The domain mix is part of the lens declaration and must be reviewable. Expertise in domains with zero relevance contributes no expertise bonus.

## 4.1 Canonical source binding

Smart Vote must not infer a source object by title. The current mapping model is:

```text
SourceConsultationBinding
  source_type
  source_id
  source_key
  consultation -> Smart Vote Consultation
  metadata_json
```

For ethiKos, `source_type = "ethikos_topic"` and `source_id` is the canonical `EthikosTopic` primary key represented as text. Demo schema v3 imports `topic_relevance`; the importer creates the binding and persists the vector as `ConsultationRelevance` rows.

This keeps ownership explicit:

```text
EthikosTopic + EthikosStance = source facts
SourceConsultationBinding     = cross-subsystem reference
ConsultationRelevance         = Smart Vote lens context
Smart Vote reading            = derived output
```

## 5. Contextual expertise alignment

The expertise alignment for user `u` in consultation `c` is:

```text
A(u,c) = Σd R(c,d) × S(u,d)
```

With normalized inputs, `A(u,c)` is normally in `0..1`.

This number means **fit between the participant's demonstrated expertise and the declared knowledge needs of this question**. It does not mean the participant is generally more important.

## 6. Advisory reading weight

The current advisory formula is:

```text
bonus(u,c)  = min(A(u,c), expertise_bonus_cap)
weight(u,c) = 1 + bonus(u,c) × ethics_modifier(u)
```

Where:

- `1` is the baseline participation entitlement inside this reading;
- `A(u,c)` is contextual expertise alignment;
- `expertise_bonus_cap` limits concentration;
- `ethics_modifier(u)` is an optional governed EkoH reliability modifier.

The neutral reliability modifier is `1.0`.

This formula produces a **reading weight**, not a replacement ballot.

## 7. Derived reading

For a numeric ballot value `v(u,c)`, a simple weighted reading can use:

```text
weighted_contribution(u,c) = v(u,c) × weight(u,c)
```

Aggregation depends on ballot modality. Approval, rating, ranking, preferential, and budget-allocation ballots require modality-specific aggregation rules.

The output must be labeled as a derived Smart Vote reading.

## 8. Reading contract

A published reading should contain enough metadata to be reproduced:

```json
{
  "target_type": "ethikos_topic",
  "target_id": 123,
  "baseline": {
    "reading_key": "baseline",
    "lens_hash": "sha256:...",
    "snapshot_ref": null,
    "computed_at": "...",
    "results_payload": {}
  },
  "readings": [
    {
      "reading_key": "ekoh_weighted_v1",
      "lens_hash": "sha256:...",
      "snapshot_ref": "ekoh_snapshot:...",
      "computed_at": "...",
      "results_payload": {}
    }
  ]
}
```

At minimum a derived reading should identify:

- `reading_key`;
- `lens_hash` or equivalent immutable lens identity;
- `snapshot_ref` for EkoH inputs when applicable;
- `computed_at`;
- target topic/consultation;
- result payload;
- method/version metadata.

## 9. Baseline and reading display

User interfaces must show the baseline separately from any derived reading.

Correct:

```text
Public baseline           +0.8
Relevant-expertise lens   +1.4
```

Incorrect:

```text
Final truth               +1.4
```

A large divergence between readings is itself useful information and should not be hidden.

## 10. Privacy

A reading may use authorized EkoH information without publishing individual private scores. Reading publication and EkoH profile visibility are separate governance decisions.

The public result payload should expose only the detail permitted by the applicable privacy and governance policy.

## 11. Demo import contract

For current demo schema v3:

- source consultation votes import `raw_value` only;
- `weighted_value` is forbidden as a source field;
- EkoH profiles may be imported as contextual demo data;
- consultation relevance vectors may be declared and validated;
- Smart Vote readings must be computed from source facts rather than supplied as canonical JSON facts.

Legacy schema v1/v2 may retain `weighted_value` only for backward compatibility.

## 12. Current implementation state

The current Smart Vote backend includes a ballot-casting endpoint and the core EkoH weight calculation service. A canonical published-reading API matching the contract above is not yet implemented in the current code snapshot.

Until that endpoint exists, frontend pages must not fabricate a Smart Vote reading from the baseline or derive a global user voting weight locally.

## 13. Invariants

- Source ballot ≠ weighted reading.
- Baseline ≠ expert reading.
- EkoH ≠ Smart Vote.
- Expertise ≠ authority.
- Majority ≠ truth.
- Expert consensus ≠ democratic mandate.
- One lens ≠ reality.
- Smart Vote must not mutate source facts.
