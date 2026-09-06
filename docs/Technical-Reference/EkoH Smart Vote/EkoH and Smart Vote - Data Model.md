# EkoH and Smart Vote — Data Model

## Canonical EkoH models

```text
ExpertiseCategory
UserExpertiseScore
UserEthicsScore
ScoreConfiguration
ScoreHistory
ConfidentialitySetting
RatingVisibilitySetting
RatingAccessScope
RatingScopeSubject
RatingAccessGrant
ContextAnalysisLog
```

## Canonical Smart Vote context models

```text
Consultation
ConsultationRelevance
SourceConsultationBinding
```

## Current Smart Vote ballot/aggregate models

```text
VoteModality
Vote
VoteResult
VoteLedger
```

These physical models exist in the current code. Their use must obey the architecture rule that source participation and derived weighting are distinct. `weighted_value` and weighted aggregate state are not a substitute for a versioned reading contract.

## Binding

`SourceConsultationBinding` uses:

```text
source_type
source_id
source_key
consultation
metadata_json
```

For ethiKos:

```text
source_type = "ethikos_topic"
source_id   = string form of EthikosTopic primary key
```

This preserves source ownership and avoids title-based matching.

## Relevance

`ConsultationRelevance` binds a Smart Vote consultation to an EkoH `ExpertiseCategory` with a weight and optional criteria metadata.

Input validation should ensure the relevance vector is non-negative and normalized according to the declared lens policy.

## Reading

A reading is not currently represented by a dedicated persisted model in the inspected code; the ethiKos reading endpoint computes it on demand. Durable publication/replay requires persistent or recoverable inputs/reading artifacts.
