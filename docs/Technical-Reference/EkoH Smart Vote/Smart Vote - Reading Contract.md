# Smart Vote — Reading Contract

## Core rule

> Source participation and derived interpretation are separate objects.

For ethiKos:

```text
EthikosTopic + EthikosStance
        ↓ source facts
baseline aggregation
        ↓
SourceConsultationBinding
ConsultationRelevance
EkoH context
        ↓
Smart Vote reading
```

## Current endpoint

```text
GET /api/v1/smart-vote/readings/ethikos-topic/<topic_id>/
```

## Current envelope

```json
{
  "target_type": "ethikos_topic",
  "target_id": "...",
  "smart_vote_consultation_id": "...",
  "baseline": {
    "reading_key": "baseline",
    "lens_hash": null,
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

## Lens

Current EkoH reading formula is conceptually:

```text
alignment(u,c) = Σ relevance(c,d) × expertise(u,d)
bonus(u,c)     = min(alignment(u,c), configured_cap)
weight(u,c)    = 1 + bonus(u,c) × ethics_modifier(u)
```

The weight is a **reading weight**, not a global personal voting weight.

## Baseline

The baseline is computed from the source stances without the EkoH lens. It must remain independently identifiable in the response/UI.

## Snapshot identity

The current service hashes the EkoH inputs used by the reading and emits a `snapshot_ref`.

For a reading to be called durably published/replayable, the system must also make the referenced snapshot or equivalent complete inputs recoverable. A hash alone proves identity; it does not store the data.

## Privacy

Participant-level details in a reading are filtered through EkoH rating access. A reading can use authorized context without exposing every private score.

## Prohibitions

- Do not overwrite `EthikosStance` with a weighted value.
- Do not copy baseline into a reading field when no reading exists.
- Do not describe EkoH as assigning a universal voting weight.
- Do not let the client submit an authoritative derived weight.
- Do not hide divergence between baseline and advisory reading.
