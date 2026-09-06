# 09 — Smart Vote + EkoH Reading Contract

**File:** `09_SMART_VOTE_EKOH_READING_CONTRACT.md`
**Pack:** ethiKos Kintsugi Update Documentation Pack
**Status:** Normative contract
**Audience:** backend, frontend, analytics, Smart Vote, EkoH, ethiKos, future AI/code-generation sessions
**Primary goal:** prevent drift between raw democratic facts, Smart Vote readings, and EkoH-derived context.

---

## 1. Purpose

This document defines the contract between **ethiKos**, **Smart Vote**, and **EkoH** for the Kintsugi upgrade.

The core rule is:

> ethiKos preserves one canonical set of source facts, while Smart Vote may publish multiple declared, reproducible readings of those facts.

This contract exists to prevent four classes of drift:

1. treating weighted results as source facts;
2. treating EkoH as the voting engine;
3. mixing topic-level stances, claim-level impact votes, and Smart Vote readings;
4. allowing derived outputs to mutate Korum or Konsultations records.

The source boundary document defines the principle as **single truth, multiple readings**: baseline outcomes remain visible, while Smart Vote readings are explicitly declared, reproducible transformations bound to an audit context, often an EkoH snapshot. 

---

## 2. Scope

This document governs:

* baseline results;
* Smart Vote readings;
* lens declarations;
* EkoH snapshots;
* weighted / filtered / cohort-specific outputs;
* audit fields required for published readings;
* how readings are shown in `/ethikos/decide/*`, `/ethikos/insights`, `/ethikos/pulse/*`, and related analytics views;
* the separation between `EthikosStance`, `ArgumentImpactVote`, `Vote`, `VoteResult`, and `ReadingResult`.

This document does **not** define the full data model for all Kintsugi entities. That belongs in:

* `08_DATA_MODEL_AND_MIGRATION_PLAN.md`
* `12_CANONICAL_OBJECTS_AND_EVENTS.md`
* `13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md`

---

## 3. Canonical variables used

```yaml
DOCUMENT_ID: "09_SMART_VOTE_EKOH_READING_CONTRACT.md"

PROJECT:
  PLATFORM_NAME: "Konnaxion"
  MODULE_NAME: "ethiKos"
  UPDATE_NAME: "Kintsugi"

PRIMARY_ROUTE_SURFACE: "/ethikos/*"

OWNERSHIP:
  KORUM_OWNS:
    - "topics"
    - "stances"
    - "arguments"
    - "argument moderation"
  KONSULTATIONS_OWNS:
    - "intake"
    - "ballots"
    - "consultation results"
    - "impact tracking"
  SMART_VOTE_OWNS:
    - "readings"
    - "lenses"
    - "aggregations"
    - "result publication"
  EKOH_OWNS:
    - "expertise context"
    - "ethics context"
    - "cohort eligibility"
    - "snapshots"

READING_CONTRACT:
  BASELINE_READING: "raw_unweighted"
  WEIGHTED_READING: "declared_lens_output"
  READING_REPRODUCIBLE: true
  READING_INPUTS:
    - "BaselineEvents"
    - "LensDeclaration"
    - "SnapshotContext"
  SNAPSHOT_FIELD: "snapshot_ref"
  LEGACY_EKOH_SNAPSHOT_FIELD: "ekoh_snapshot_id"
  LENS_ID_FIELD: "reading_key"
  LENS_HASH_FIELD: "lens_hash"
  RESULT_PAYLOAD_FIELD: "results_payload"
  COMPUTED_AT_FIELD: "computed_at"

VOTE_TYPE_SEPARATION:
  ETHIKOS_STANCE_RANGE: "-3..+3"
  KIALO_IMPACT_VOTE_RANGE: "0..4"
  SMART_VOTE_READING_IS_SOURCE_FACT: false
  EKOH_IS_VOTING_ENGINE: false
  SMART_VOTE_MUTATES_SOURCE_FACTS: false
```

---

## 4. Source basis

This contract is grounded in the following current project facts:

1. ethiKos v2 defines **single truth, multiple readings** and assigns Smart Vote to computation/publication of outcomes as readings, while keeping it read-only on Korum/Konsultations facts. 

2. The current Smart Vote backend already contains `Vote`, `VoteResult`, `VoteModality`, and `VoteLedger` concepts, including `raw_value`, `weighted_value`, target typing, and aggregate vote results. 

3. EkoH and Smart Vote are configured as Django apps under `konnaxion.ekoh` and `konnaxion.smart_vote`, with periodic tasks for EkoH score recalculation, contextual analysis, and Smart Vote aggregation. 

4. Existing technical references define EkoH weighting parameters, Smart Vote modalities, and ethiKos stance scale values. 

5. Current frontend routes already expose EkoH and Smart Vote surfaces such as EkoH score, expertise, badges, voting weight, Konsensus, and activity feed. 

---

## 5. Core principle

## 5.1 Single truth

The source truth is the set of recorded civic events.

Examples:

```yaml
SOURCE_FACTS:
  - "EthikosStance"
  - "EthikosArgument"
  - "BallotEvent"
  - "Vote"
  - "ModerationAction"
```

Source facts are owned by the module that captured them.

```yaml
SOURCE_FACT_OWNERSHIP:
  EthikosStance: "Korum"
  EthikosArgument: "Korum"
  BallotEvent: "Konsultations"
  Vote: "Smart Vote / Kollective voting substrate"
  ModerationAction: "Korum or Konsultations depending target"
```

A source fact is not a reading.

A source fact must not change just because a new lens is introduced.

---

## 5.2 Multiple readings

A reading is a declared interpretation of the source facts.

Examples:

```yaml
READINGS:
  baseline:
    description: "Raw unweighted result."
  ekoh_weighted_v1:
    description: "Weighted reading using EkoH expertise and ethics context."
  expert_cohort_v1:
    description: "Filtered reading using only users above an expertise threshold."
  public_krowd_v1:
    description: "Public participant reading."
  elite_council_v1:
    description: "Elite or expert-council scoped reading."
```

A reading must always answer:

```yaml
READING_MUST_ANSWER:
  - "What inputs were used?"
  - "What filters were applied?"
  - "What weights were applied?"
  - "Which snapshot/config was used?"
  - "When was it computed?"
  - "Can it be recomputed?"
```

---

## 6. Ownership contract

## 6.1 Korum

Korum owns deliberation facts.

```yaml
KORUM_SOURCE_FACTS:
  - "EthikosTopic"
  - "EthikosStance"
  - "EthikosArgument"
  - "ArgumentSource"
  - "ArgumentImpactVote"
  - "ArgumentSuggestion"
  - "ModerationAction"
```

Korum may expose stance distributions and argument statistics, but it does not own Smart Vote readings.

Korum must not store `weighted_value` as if it were a canonical stance.

---

## 6.2 Konsultations

Konsultations owns consultation and ballot facts.

```yaml
KONSULTATIONS_SOURCE_FACTS:
  - "IntakeSubmission"
  - "Consultation"
  - "BallotEvent"
  - "ConsultationResultSnapshot"
  - "ImpactTrack"
```

Konsultations may store baseline ballot results.

Konsultations must not store an EkoH-weighted outcome as its canonical result unless that value is explicitly marked as a Smart Vote reading.

---

## 6.3 Smart Vote

Smart Vote owns computation and publication of readings.

```yaml
SMART_VOTE_OWNS:
  - "LensDeclaration"
  - "ReadingResult"
  - "Vote aggregation"
  - "VoteResult"
  - "Reading publication"
```

Smart Vote may read Korum and Konsultations facts.

Smart Vote must not mutate Korum or Konsultations facts.

Smart Vote may write only derived artifacts:

```yaml
SMART_VOTE_DERIVED_ARTIFACTS:
  - "ReadingResult"
  - "VoteResult"
  - "AggregationBreakdown"
  - "ReadingAuditRecord"
```

---

## 6.4 EkoH

EkoH owns expertise and ethics context.

```yaml
EKOH_OWNS:
  - "ExpertiseCategory"
  - "UserExpertiseScore"
  - "UserEthicsScore"
  - "ScoreConfiguration"
  - "ScoreHistory"
  - "ConfidentialitySetting"
  - "ContextAnalysisLog"
  - "EmergingExpert"
```

EkoH is not the voting engine.

EkoH provides context to Smart Vote through snapshots, scores, domain vectors, ethics multipliers, and cohort eligibility.

---

## 7. Vote type separation

The Kintsugi upgrade must preserve a strict separation between three vote-like concepts.

| Concept              | Owner      |                Level | Range / shape | Meaning                                   |
| -------------------- | ---------- | -------------------: | ------------- | ----------------------------------------- |
| `EthikosStance`      | Korum      |          topic-level | `-3..+3`      | User stance on a topic                    |
| `ArgumentImpactVote` | Korum      | argument/claim-level | `0..4`        | Impact of a claim on its parent           |
| `Smart Vote Reading` | Smart Vote |    aggregate/derived | lens-specific | Published interpretation of source events |

## 7.1 `EthikosStance`

`EthikosStance` is the canonical topic-level stance.

```yaml
ETHIKOS_STANCE:
  MODEL: "EthikosStance"
  OWNER: "Korum"
  LEVEL: "topic"
  RANGE: "-3..+3"
  MEANING:
    - "-3 strongly against"
    - "0 neutral / undecided"
    - "+3 strongly for"
```

Rules:

```yaml
ETHIKOS_STANCE_RULES:
  - "An EthikosStance is a source fact."
  - "An EthikosStance may be used as input to a baseline result."
  - "An EthikosStance may be used as input to a Smart Vote reading."
  - "An EthikosStance must not store weighted meaning directly."
```

---

## 7.2 `ArgumentImpactVote`

`ArgumentImpactVote` is a Kialo-style claim-level signal.

```yaml
ARGUMENT_IMPACT_VOTE:
  MODEL: "ArgumentImpactVote"
  OWNER: "Korum"
  LEVEL: "argument / claim"
  RANGE: "0..4"
  MEANING: "Perceived impact, relevance, and/or strength of a claim relative to its parent."
```

Rules:

```yaml
ARGUMENT_IMPACT_VOTE_RULES:
  - "ArgumentImpactVote is not a topic stance."
  - "ArgumentImpactVote is not a Smart Vote ballot."
  - "ArgumentImpactVote may affect argument quality analytics."
  - "ArgumentImpactVote may inform summaries or debate health metrics."
  - "ArgumentImpactVote must not be mixed into baseline decision results unless a lens explicitly declares it as allowed input."
```

---

## 7.3 Smart Vote reading

A Smart Vote reading is an aggregate output.

```yaml
SMART_VOTE_READING:
  MODEL: "ReadingResult"
  OWNER: "Smart Vote"
  LEVEL: "aggregate"
  RANGE: "depends on reading type"
  MEANING: "Declared interpretation of source facts."
```

Rules:

```yaml
SMART_VOTE_READING_RULES:
  - "A Smart Vote reading is not a source fact."
  - "A Smart Vote reading must be reproducible."
  - "A Smart Vote reading must reference its lens."
  - "A Smart Vote reading must reference its EkoH snapshot when EkoH context is used."
  - "A Smart Vote reading must never overwrite baseline results."
```

---

## 8. Baseline result contract

A baseline result is the canonical unweighted aggregation of source events.

```yaml
BASELINE_RESULT:
  reading_key: "baseline"
  weighting: "none"
  source_truth: "raw events"
  snapshot_ref_required: false
  lens_hash_required: true
```

## 8.1 Allowed baseline inputs

Allowed baseline inputs must be raw, source-owned events.

```yaml
BASELINE_ALLOWED_INPUTS:
  KORUM:
    - "EthikosStance"
  KONSULTATIONS:
    - "BallotEvent"
  SMART_VOTE:
    - "Vote.raw_value"
```

## 8.2 Disallowed baseline inputs

```yaml
BASELINE_DISALLOWED_INPUTS:
  - "Vote.weighted_value"
  - "VoteResult.sum_weighted_value"
  - "UserExpertiseScore.weighted_score"
  - "UserEthicsScore"
  - "EkoH-derived multiplier"
  - "ArgumentImpactVote unless explicitly declared in a non-baseline reading"
```

## 8.3 Baseline display rule

Any UI that displays a weighted, filtered, expert-only, cohort-only, or EkoH-adjusted result must also keep the baseline visible or reachable.

```yaml
BASELINE_VISIBILITY_RULE:
  BASELINE_MUST_REMAIN_VISIBLE: true
  WEIGHTED_READING_MAY_BE_HIGHLIGHTED: true
  WEIGHTED_READING_MUST_NOT_ERASE_BASELINE: true
```

---

## 9. Lens declaration contract

A `LensDeclaration` is the contract that defines how a reading is computed.

Every non-trivial reading must have a lens.

## 9.1 Required fields

```yaml
LensDeclaration:
  reading_key:
    type: "string"
    required: true
    examples:
      - "baseline"
      - "ekoh_weighted_v1"
      - "expert_cohort_v1"
      - "public_krowd_v1"
      - "elite_council_v1"

  label:
    type: "string"
    required: true
    examples:
      - "Baseline"
      - "EkoH-weighted"
      - "Expert cohort"
      - "Public Krowd"

  description:
    type: "text"
    required: true

  allowed_inputs:
    type: "array[string]"
    required: true
    examples:
      - "EthikosStance"
      - "BallotEvent"
      - "Vote.raw_value"

  segmentation_rules:
    type: "json"
    required: true
    nullable: false

  weighting_rules:
    type: "json"
    required: true
    nullable: false

  required_snapshot_refs:
    type: "array[string]"
    required: true
    examples:
      - "ekoh_snapshot_id"
      - "score_configuration_hash"

  lens_hash:
    type: "string"
    required: true
    description: "Stable content-addressable hash of the lens declaration."

  version:
    type: "string"
    required: true
    examples:
      - "v1"
      - "v1.1"

  status:
    type: "enum"
    required: true
    values:
      - "draft"
      - "active"
      - "deprecated"
      - "archived"

  created_at:
    type: "datetime"
    required: true

  updated_at:
    type: "datetime"
    required: true
```

## 9.2 Lens hash rule

The `lens_hash` must change when any of the following changes:

```yaml
LENS_HASH_REQUIRES_CHANGE_WHEN:
  - "allowed_inputs changes"
  - "segmentation_rules changes"
  - "weighting_rules changes"
  - "required_snapshot_refs changes"
  - "thresholds change"
  - "cohort definitions change"
  - "score configuration reference changes"
```

The `lens_hash` must not change for display-only copy changes unless the change affects interpretation.

---

## 10. Reading result contract

A `ReadingResult` is the stored output of a lens applied to source events.

## 10.1 Required fields

```yaml
ReadingResult:
  id:
    type: "integer or uuid"
    required: true

  reading_key:
    type: "string"
    required: true
    examples:
      - "baseline"
      - "ekoh_weighted_v1"

  lens_hash:
    type: "string"
    required: true

  snapshot_ref:
    type: "string"
    nullable: true
    required_if:
      - "EkoH context is used"
      - "cohort eligibility is derived from EkoH"
      - "expertise weighting is used"
      - "ethics weighting is used"

  target_type:
    type: "string"
    required: true
    examples:
      - "ethikos_topic"
      - "consultation"
      - "decision_record"
      - "project"

  target_id:
    type: "integer or uuid"
    required: true

  computed_at:
    type: "datetime"
    required: true

  source_event_window:
    type: "object"
    required: true
    fields:
      from:
        type: "datetime"
        nullable: true
      to:
        type: "datetime"
        nullable: true

  source_event_counts:
    type: "json"
    required: true

  results_payload:
    type: "json"
    required: true

  audit_payload:
    type: "json"
    required: true

  status:
    type: "enum"
    required: true
    values:
      - "pending"
      - "computed"
      - "published"
      - "invalidated"
      - "archived"
```

## 10.2 Minimal `results_payload`

```json
{
  "summary": {
    "support": 0.0,
    "oppose": 0.0,
    "neutral": 0.0,
    "total_participants": 0
  },
  "distribution": [],
  "breakdowns": {},
  "confidence": {
    "sample_size": 0,
    "minimum_threshold_met": false,
    "notes": []
  }
}
```

## 10.3 Minimal `audit_payload`

```json
{
  "lens_hash": "sha256:...",
  "input_sources": [],
  "input_event_ids_hash": "sha256:...",
  "snapshot_ref": null,
  "score_configuration_hash": null,
  "computed_by": "smart_vote",
  "code_version": null,
  "warnings": []
}
```

---

## 11. EkoH snapshot contract

An EkoH snapshot is a frozen reference to the EkoH context used by a reading.

It may include:

```yaml
EKOH_SNAPSHOT_MAY_INCLUDE:
  - "expertise category taxonomy version"
  - "user expertise scores"
  - "user ethics scores"
  - "score configuration"
  - "cohort eligibility"
  - "domain relevance vector"
  - "privacy/confidentiality settings"
  - "emerging expert markers"
```

## 11.1 Required when EkoH is used

If a reading uses EkoH scores, ethics multipliers, cohort eligibility, expert thresholds, domain relevance, or emerging expert signals, it must include:

```yaml
EKOH_REQUIRED_READING_FIELDS:
  snapshot_ref: "required"
  lens_hash: "required"
  score_configuration_hash: "required"
  computed_at: "required"
  results_payload: "required"
```

## 11.2 EkoH must not mutate votes

```yaml
EKOH_MUTATION_RULES:
  EKOH_MUTATES_ETHIKOS_STANCE: false
  EKOH_MUTATES_BALLOT_EVENT: false
  EKOH_MUTATES_ARGUMENT_IMPACT_VOTE: false
  EKOH_MUTATES_SMART_VOTE_RAW_VALUE: false
```

EkoH may change future readings only by changing the snapshot/context used in a new computation.

Existing published readings must not silently change when EkoH scores change.

---

## 12. Weighting contract

Smart Vote may compute weighted values using EkoH context.

The current Smart Vote architecture includes `Vote.raw_value`, `Vote.weighted_value`, `VoteResult.sum_weighted_value`, and vote modality definitions. 

## 12.1 Raw value

```yaml
RAW_VALUE:
  source: "user action"
  examples:
    - "stance value"
    - "approval value"
    - "rating value"
    - "ranking position"
  mutable_by_smart_vote: false
```

## 12.2 Weighted value

```yaml
WEIGHTED_VALUE:
  source: "Smart Vote computation"
  inputs:
    - "raw_value"
    - "LensDeclaration"
    - "EkoH snapshot if used"
  mutable_by_smart_vote: true
  source_fact: false
```

## 12.3 Weighting function

The exact implementation may vary by modality, but every weighted reading must conceptually follow:

```text
weighted_value = f(raw_value, lens_declaration, ekoh_snapshot_context?)
```

Where:

```yaml
WEIGHTING_INPUTS:
  raw_value:
    required: true
  lens_declaration:
    required: true
  ekoh_snapshot_context:
    required_if:
      - "expertise weighting"
      - "ethics weighting"
      - "cohort filtering"
      - "expert threshold"
```

## 12.4 Hard rule

`weighted_value` is not the canonical civic fact.

It is a derived value.

---

## 13. Current implementation alignment

## 13.1 Current backend concepts

The current backend already contains Smart Vote concepts that must be respected:

```yaml
CURRENT_SMART_VOTE_MODELS:
  - "Vote"
  - "VoteResult"
  - "VoteModality"
  - "VoteLedger"
```

Known current model semantics:

```yaml
Vote:
  fields:
    - "user"
    - "target_type"
    - "target_id"
    - "modality"
    - "raw_value"
    - "weighted_value"
    - "created_at"

VoteResult:
  fields:
    - "target_type"
    - "target_id"
    - "sum_weighted_value"
    - "vote_count"

VoteModality:
  known_values:
    - "approval"
    - "ranking"
    - "rating"
    - "preferential"
    - "budget_split"

VoteLedger:
  role: "append-only hash ledger for vote audit / anchoring"
```

## 13.2 Current settings

The backend settings include EkoH/Smart Vote apps and scheduled tasks:

```yaml
CURRENT_EKOH_SMART_VOTE_APPS:
  - "konnaxion.ekoh"
  - "konnaxion.smart_vote"

CURRENT_PERIODIC_TASKS:
  - "ekoh-score-recalc"
  - "ekoh-contextual-analysis"
  - "smartvote-vote-aggregate"
```

These tasks align with the Kintsugi requirement that EkoH context and Smart Vote aggregation remain separate responsibilities. 

## 13.3 Current frontend alignment

The existing EkoH route group already exposes Smart Vote surfaces such as voting weight and Konsensus activity. 

Kintsugi must preserve this separation:

```yaml
FRONTEND_ALIGNMENT:
  EKOH_ROUTES:
    role: "identity, expertise, ethics, voting weight visibility"
  ETHIKOS_DECIDE_ROUTES:
    role: "decision workflows and reading publication"
  ETHIKOS_INSIGHTS_ROUTE:
    role: "analytics and reading comparison"
  KONSENSUS:
    role: "Smart Vote / collective poll center"
```

---

## 14. Route display contract

## 14.1 `/ethikos/decide/*`

Decision routes may display:

```yaml
DECIDE_MAY_DISPLAY:
  - "BaselineResult"
  - "ReadingResult"
  - "DecisionRecord"
  - "Lens summary"
  - "EkoH weighted interpretation"
  - "Public vs expert readings"
```

Decision routes must not hide the baseline.

---

## 14.2 `/ethikos/insights`

Insights may display:

```yaml
INSIGHTS_MAY_DISPLAY:
  - "Reading comparison"
  - "Weighted vs unweighted deltas"
  - "Score distributions"
  - "Expertise and ethics breakdowns"
  - "Consensus evolution"
  - "Emerging expert signals"
```

Insights should fetch via a service layer that composes Smart Vote / Kollective data with domain APIs, instead of embedding raw multi-endpoint orchestration inside components. 

---

## 14.3 `/ethikos/pulse/*`

Pulse may display:

```yaml
PULSE_MAY_DISPLAY:
  - "participation health"
  - "current baseline trend"
  - "reading divergence"
  - "expert/public gap"
  - "minimum threshold warnings"
```

Pulse must not present a weighted result as if it were the only public outcome.

---

## 14.4 `/ethikos/trust/*`

Trust routes may display:

```yaml
TRUST_MAY_DISPLAY:
  - "EkoH expertise profile"
  - "EkoH ethics signals"
  - "badges"
  - "credentials"
  - "voting weight explanation"
```

Trust routes must not expose confidential EkoH data beyond the configured visibility rules.

---

## 15. API and service contract

This document does not create final API endpoints by itself. Endpoint definitions belong in `07_API_AND_SERVICE_CONTRACTS.md`.

However, the following rules are binding.

## 15.1 Existing endpoints to respect

```yaml
EXISTING_RELEVANT_ENDPOINTS:
  ETHIKOS_TOPICS: "/api/ethikos/topics/"
  ETHIKOS_STANCES: "/api/ethikos/stances/"
  ETHIKOS_ARGUMENTS: "/api/ethikos/arguments/"
  KOLLECTIVE_VOTES: "/api/kollective/votes/"
  SMART_VOTE_API_V1: "/api/v1/smart-vote/"
  EKOH_API_V1: "/api/v1/ekoh/"
```

The current backend includes `/api/v1/ekoh/` and `/api/v1/smart-vote/` route includes. 

## 15.2 Service-layer rule

Frontend components must not directly orchestrate readings by fetching multiple low-level endpoints inside page components.

```yaml
SERVICE_LAYER_REQUIRED:
  - "services/ethikos"
  - "services/decide"
  - "services/insights"
  - "services/kollective or smart-vote service wrapper"
```

## 15.3 Reading API shape

A future reading endpoint should expose a shape compatible with:

```json
{
  "target_type": "ethikos_topic",
  "target_id": 123,
  "baseline": {
    "reading_key": "baseline",
    "lens_hash": "sha256:...",
    "snapshot_ref": null,
    "computed_at": "2026-04-25T00:00:00Z",
    "results_payload": {}
  },
  "readings": [
    {
      "reading_key": "ekoh_weighted_v1",
      "lens_hash": "sha256:...",
      "snapshot_ref": "ekoh_snapshot:...",
      "computed_at": "2026-04-25T00:00:00Z",
      "results_payload": {}
    }
  ]
}
```

---

## 16. Privacy and confidentiality

EkoH data may be sensitive.

A reading may use EkoH information without exposing individual EkoH scores.

## 16.1 Public output rule

Public readings may expose:

```yaml
PUBLIC_READING_MAY_EXPOSE:
  - "aggregate weighted result"
  - "aggregate expert cohort result"
  - "number of eligible participants"
  - "threshold met / not met"
  - "lens explanation"
```

Public readings must not expose:

```yaml
PUBLIC_READING_MUST_NOT_EXPOSE:
  - "individual private EkoH score"
  - "individual ethics score"
  - "private cohort eligibility reason"
  - "identity behind anonymous or pseudonymous setting"
```

## 16.2 Admin/audit output rule

Admin surfaces may expose more detail only if permissions allow.

```yaml
ADMIN_AUDIT_MAY_EXPOSE:
  - "score configuration hash"
  - "cohort counts"
  - "excluded-event counts"
  - "snapshot reference"
  - "lens declaration"
  - "computation warnings"
```

Even admin surfaces should avoid exposing private score details unless there is a defined operational reason.

---

## 17. Thresholds and confidence

A reading should not imply legitimacy when the data is insufficient.

## 17.1 Minimum fields

Every reading payload should include:

```yaml
READING_CONFIDENCE_FIELDS:
  sample_size: "integer"
  eligible_population_size: "integer | null"
  minimum_threshold_met: "boolean"
  warnings: "array[string]"
```

## 17.2 Example warnings

```yaml
READING_WARNINGS:
  - "insufficient_sample_size"
  - "expert_threshold_not_met"
  - "snapshot_missing"
  - "lens_deprecated"
  - "baseline_event_window_too_small"
  - "cohort_filter_too_narrow"
```

## 17.3 Expert threshold

Existing references define an expert quorum concept for ethiKos results: a minimum expert vote count with EkoH percentile logic. 

This contract does not hard-code all thresholds, but requires any threshold to be declared in the lens.

---

## 18. Invalidating readings

A reading must be invalidated when the inputs or interpretation contract are no longer reliable.

```yaml
INVALIDATE_READING_WHEN:
  - "source events changed after computed_at and reading is not explicitly frozen"
  - "lens declaration changed"
  - "lens_hash changed"
  - "EkoH snapshot was revoked or invalidated"
  - "score configuration was corrected"
  - "privacy rule changed"
  - "bug found in computation"
```

Invalidation must not delete the old reading unless retention policy permits deletion.

Preferred behavior:

```yaml
READING_INVALIDATION_BEHAVIOR:
  - "mark status = invalidated"
  - "store invalidated_at"
  - "store invalidation_reason"
  - "recompute as a new ReadingResult"
```

---

## 19. Publishing rules

## 19.1 Baseline publishing

Baseline may be published when:

```yaml
BASELINE_PUBLISHING_REQUIREMENTS:
  - "source event query succeeded"
  - "source event count is recorded"
  - "result payload is generated"
  - "computed_at is recorded"
```

## 19.2 Weighted reading publishing

Weighted readings may be published only when:

```yaml
WEIGHTED_READING_PUBLISHING_REQUIREMENTS:
  - "LensDeclaration is active"
  - "lens_hash is recorded"
  - "snapshot_ref is recorded if EkoH is used"
  - "source_event_counts are recorded"
  - "audit_payload is recorded"
  - "minimum threshold status is explicit"
  - "baseline remains visible"
```

## 19.3 UI label rule

Every non-baseline reading must be labeled.

Good labels:

```yaml
GOOD_LABELS:
  - "Baseline"
  - "EkoH-weighted reading"
  - "Expert cohort reading"
  - "Public Krowd reading"
  - "Elite council reading"
```

Bad labels:

```yaml
BAD_LABELS:
  - "The result"
  - "True result"
  - "Corrected vote"
  - "Real consensus"
  - "Expert truth"
```

---

## 20. Audit reproducibility

A reading is valid only if it can be recomputed.

## 20.1 Required reproducibility inputs

```yaml
REPRODUCIBILITY_INPUTS:
  - "target_type"
  - "target_id"
  - "source event query definition"
  - "source event window"
  - "source event ids hash"
  - "lens declaration"
  - "lens_hash"
  - "snapshot_ref if used"
  - "score configuration hash if used"
  - "code version if available"
  - "computed_at"
```

## 20.2 Required reproducibility statement

Every reading documentation or admin detail page should be able to state:

```text
This reading was computed from [source events] using [lens] at [computed_at], with [snapshot_ref], producing [results_payload].
```

---

## 21. Data model implications

The following models are either current, proposed, or required by this contract.

## 21.1 Current or already present concepts

```yaml
CURRENT_OR_EXISTING:
  - "Vote"
  - "VoteResult"
  - "VoteModality"
  - "VoteLedger"
  - "UserExpertiseScore"
  - "UserEthicsScore"
  - "ExpertiseCategory"
  - "ScoreConfiguration"
  - "ScoreHistory"
  - "EthikosStance"
```

## 21.2 Proposed Kintsugi models

```yaml
PROPOSED_FOR_KINTSUGI:
  - "LensDeclaration"
  - "ReadingResult"
  - "ReadingAuditRecord"
  - "SnapshotRef"
```

## 21.3 Fields that must not be added to source tables as shortcuts

Do not add these as canonical source fields on `EthikosStance`, `EthikosArgument`, or ballot source tables:

```yaml
DO_NOT_ADD_AS_SOURCE_TRUTH:
  - "weighted_result"
  - "expert_result"
  - "ekoh_adjusted_value"
  - "final_truth_value"
  - "corrected_stance"
```

If needed, such values belong in `ReadingResult` or another derived artifact.

---

## 22. Example lens declarations

## 22.1 Baseline

```yaml
reading_key: "baseline"
label: "Baseline"
description: "Raw unweighted aggregation of source events."
allowed_inputs:
  - "EthikosStance"
segmentation_rules: {}
weighting_rules:
  type: "none"
required_snapshot_refs: []
lens_hash: "sha256:<computed>"
version: "v1"
status: "active"
```

## 22.2 EkoH-weighted reading

```yaml
reading_key: "ekoh_weighted_v1"
label: "EkoH-weighted reading"
description: "Weighted reading using EkoH domain expertise and ethics context."
allowed_inputs:
  - "EthikosStance"
segmentation_rules:
  include_users: "all_eligible"
weighting_rules:
  type: "ekoh_domain_expertise_and_ethics"
  expertise_source: "UserExpertiseScore"
  ethics_source: "UserEthicsScore"
  cap_source: "ScoreConfiguration"
required_snapshot_refs:
  - "ekoh_snapshot_id"
  - "score_configuration_hash"
lens_hash: "sha256:<computed>"
version: "v1"
status: "active"
```

## 22.3 Expert cohort reading

```yaml
reading_key: "expert_cohort_v1"
label: "Expert cohort reading"
description: "Filtered reading using participants above an EkoH expertise threshold in the topic domain."
allowed_inputs:
  - "EthikosStance"
segmentation_rules:
  cohort: "experts"
  expertise_percentile_min: 75
weighting_rules:
  type: "none_or_declared"
required_snapshot_refs:
  - "ekoh_snapshot_id"
lens_hash: "sha256:<computed>"
version: "v1"
status: "active"
```

---

## 23. Example reading result

```json
{
  "reading_key": "ekoh_weighted_v1",
  "lens_hash": "sha256:7b5f...",
  "snapshot_ref": "ekoh_snapshot:2026-04-25T15:00:00Z",
  "target_type": "ethikos_topic",
  "target_id": 42,
  "computed_at": "2026-04-25T15:30:00Z",
  "source_event_window": {
    "from": "2026-04-01T00:00:00Z",
    "to": "2026-04-25T15:29:59Z"
  },
  "source_event_counts": {
    "EthikosStance": 184,
    "excluded": 3
  },
  "results_payload": {
    "summary": {
      "support": 0.68,
      "oppose": 0.21,
      "neutral": 0.11,
      "total_participants": 181
    },
    "distribution": [
      { "bucket": "-3", "weighted_share": 0.05 },
      { "bucket": "-2", "weighted_share": 0.07 },
      { "bucket": "-1", "weighted_share": 0.09 },
      { "bucket": "0", "weighted_share": 0.11 },
      { "bucket": "+1", "weighted_share": 0.19 },
      { "bucket": "+2", "weighted_share": 0.24 },
      { "bucket": "+3", "weighted_share": 0.25 }
    ],
    "confidence": {
      "sample_size": 181,
      "minimum_threshold_met": true,
      "notes": []
    }
  },
  "audit_payload": {
    "lens_hash": "sha256:7b5f...",
    "input_event_ids_hash": "sha256:91ab...",
    "snapshot_ref": "ekoh_snapshot:2026-04-25T15:00:00Z",
    "score_configuration_hash": "sha256:f310...",
    "computed_by": "smart_vote",
    "warnings": []
  },
  "status": "published"
}
```

---

## 24. Anti-drift rules

```yaml
ANTI_DRIFT_RULES:
  - "Do not call a weighted reading the baseline."
  - "Do not hide the baseline when displaying weighted readings."
  - "Do not let Smart Vote mutate Korum records."
  - "Do not let Smart Vote mutate Konsultations records."
  - "Do not let EkoH mutate votes, stances, or ballots."
  - "Do not treat EkoH as the voting engine."
  - "Do not treat EthikosStance as a Smart Vote reading."
  - "Do not treat ArgumentImpactVote as an EthikosStance."
  - "Do not treat ArgumentImpactVote as a Smart Vote ballot."
  - "Do not store weighted outcomes as canonical consultation results."
  - "Do not publish an EkoH-derived reading without snapshot_ref."
  - "Do not publish a non-baseline reading without lens_hash."
  - "Do not silently recompute published readings without new computed_at."
  - "Do not expose individual private EkoH scores in public reading payloads."
```

---

## 25. Non-goals

This document does not:

* define all Smart Vote UI screens;
* replace the Smart Vote technical specification;
* replace the EkoH schema documentation;
* define every database migration;
* define all endpoints;
* define Kialo-style argument impact voting in full;
* define implementation tasks;
* authorize direct OSS integration;
* authorize any full external merge.

---

## 26. Acceptance checklist

A Smart Vote/EkoH reading implementation is acceptable only if all of the following are true:

```yaml
ACCEPTANCE_CHECKLIST:
  baseline:
    - "Baseline result exists or is explicitly unavailable."
    - "Baseline is raw and unweighted."
    - "Baseline remains visible when readings are shown."

  lens:
    - "Every non-baseline reading has a LensDeclaration."
    - "Every lens has a stable lens_hash."
    - "Allowed inputs are explicit."
    - "Weighting rules are explicit."
    - "Segmentation rules are explicit."

  ekoh:
    - "EkoH-derived readings include snapshot_ref."
    - "EkoH-derived readings include score/config audit references."
    - "Private EkoH data is not leaked in public payloads."

  audit:
    - "computed_at is stored."
    - "source_event_counts are stored."
    - "results_payload is stored."
    - "audit_payload is stored."
    - "reading can be recomputed."

  ownership:
    - "Smart Vote does not mutate upstream Korum/Konsultations facts."
    - "EkoH does not act as the voting engine."
    - "Weighted values are stored as derived artifacts."
```

---

## 27. Related documents

```yaml
RELATED_DOCS:
  - "00_KINTSUGI_START_HERE.md"
  - "02_SOURCE_OF_TRUTH_AND_DRIFT_CONTROL.md"
  - "03_BOUNDARIES_AND_OWNERSHIP_CONTRACTS.md"
  - "04_CANONICAL_NAMING_AND_VARIABLES.md"
  - "06_ROUTE_BY_ROUTE_ETHIKOS_UPGRADE_PLAN.md"
  - "07_API_AND_SERVICE_CONTRACTS.md"
  - "08_DATA_MODEL_AND_MIGRATION_PLAN.md"
  - "12_CANONICAL_OBJECTS_AND_EVENTS.md"
  - "13_PAYLOAD_SHAPES_AND_SERIALIZER_CONTRACTS.md"
  - "14_FRONTEND_ALIGNMENT_CONTRACT.md"
  - "15_BACKEND_ALIGNMENT_CONTRACT.md"
  - "20_AI_GENERATION_GUARDRAILS.md"
  - "21_KIALO_STYLE_ARGUMENT_MAPPING_CONTRACT.md"
```

---

## 28. Final normative summary

```yaml
FINAL_CONTRACT:
  SINGLE_TRUTH: "source events"
  MULTIPLE_READINGS: "declared Smart Vote outputs"
  BASELINE: "raw unweighted aggregation"
  WEIGHTED_RESULT: "derived reading"
  SMART_VOTE_ROLE: "compute and publish readings"
  EKOH_ROLE: "provide expertise/ethics context"
  EKOH_IS_VOTING_ENGINE: false
  SMART_VOTE_MUTATES_SOURCE_FACTS: false
  EKO_H_SNAPSHOT_REQUIRED_WHEN_USED: true
  LENS_HASH_REQUIRED_FOR_EVERY_READING: true
  BASELINE_MUST_REMAIN_VISIBLE: true
```

---

## V4.1 clarification — rating disclosure is not reading ownership

EkoH rating visibility and Smart Vote contextual influence are different contracts. Smart Vote may compute aggregate declared readings from EkoH context while participant-level EkoH-derived detail returned to a caller MUST respect the EkoH disclosure decision. This does not alter the baseline, source stances, or reading formula. See `27_EKOH_RATING_VISIBILITY_AND_ACCESS_CONTRACT.md`.

