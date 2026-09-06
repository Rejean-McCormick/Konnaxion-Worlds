# Konnaxion — Code Alignment Notes

## Purpose

This note identifies the code areas that should be changed so the implementation matches the current Konnaxion architecture.

## 1. Canonical EkoH taxonomy reference

### `backend/konnaxion/ethikos/models.py`

`EthikosTopic.expertise_category` currently references:

```text
kollective_intelligence.ExpertiseCategory
```

Canonical taxonomy is now:

```text
ekoh.ExpertiseCategory
```

The relation and its data migration should be moved to the EkoH-owned taxonomy. New code should not introduce another expertise taxonomy.

## 2. Remove active canonical dependence on `kollective_intelligence`

### `backend/config/settings/base.py`

`konnaxion.kollective_intelligence` is still installed as an active local app.

### `backend/config/api_router.py`

The central router still exposes optional:

```text
/api/kollective/votes/
/api/kollective/vote-results/
```

### `backend/konnaxion/kollective_intelligence/*`

The package itself states that canonical EkoH and Smart Vote ownership has moved elsewhere. Active features should therefore resolve to `konnaxion.ekoh` and `konnaxion.smart_vote` rather than this compatibility package.

Do not delete migrations blindly; the desired final runtime state is simply that this package no longer acts as a canonical service/API owner.

## 3. Konsensus frontend still uses the non-canonical vote API

### `frontend/modules/konsensus/hooks/usePoll.ts`

Reads:

```text
kollective/votes/
```

### `frontend/modules/konsensus/pages/PollPage.tsx`

Posts to the same route and currently sends:

```text
raw_value
weighted_value
```

The client must not supply an authoritative `weighted_value`.

Align this surface to the proper source-ballot contract and, when needed, request a Smart Vote reading separately.

## 4. Smart Vote stores derived weight on the ballot row

### `backend/konnaxion/smart_vote/serializers/ballot.py`

`BallotSerializer.create()` computes `get_weight(...)` during cast and persists `raw_value * weight` into `Vote.weighted_value`.

### `backend/konnaxion/smart_vote/models/core.py`

`Vote` contains `weighted_value`; `VoteResult` contains `sum_weighted_value`.

### `backend/konnaxion/smart_vote/tasks/aggregator.py`

The aggregator sums persisted weighted values into `VoteResult`.

These paths should be changed so that:

```text
source ballot
≠ derived reading weight
≠ derived aggregate
```

If Smart Vote retains a native ballot store, store the source event independently and materialize a derived reading with explicit lens/version/snapshot metadata.

## 5. Preserve the good ethiKos reading path

### `backend/konnaxion/smart_vote/services/reading_service.py`

This path is already strongly aligned:

- reads `EthikosStance` without mutating it;
- uses explicit `SourceConsultationBinding`;
- keeps baseline separate;
- hashes lens configuration;
- hashes EkoH contextual inputs;
- honors advisory-only exclusions without deleting source participation;
- filters participant detail through EkoH rating access.

Do not collapse this boundary into ballot-level `weighted_value` state.

## 6. Persist/recover snapshot inputs for durable published readings

### `backend/konnaxion/smart_vote/services/reading_service.py`

The current endpoint computes `snapshot_ref` from an in-memory payload but no persisted snapshot artifact is evidenced in the inspected code.

If readings are exposed as durable/published results, add a recoverable snapshot/materialized-reading boundary so the exact inputs behind `snapshot_ref` can be replayed.

An on-demand current-state reading can remain ephemeral, but it should be described as such.

## 7. Validate consultation relevance vectors

### `backend/konnaxion/smart_vote/models/consultation_relevance.py`

The model stores per-domain weights but does not itself demonstrate an invariant that the complete vector is normalized.

Add boundary/service validation for the selected lens policy, including non-negative values and the required sum/normalization rule.

## 8. Remove global voting-power semantics from EkoH UI

### `frontend/app/ekoh/voting-influence/current-voting-weight/page.tsx`

The current page uses simulated values and says a user's EkoH reputation gives a global Smart Vote influence percentage.

That conflicts with the contextual model.

Replace it with one of:

- domain expertise display;
- consultation-specific expertise alignment;
- a declared Smart Vote reading weight tied to a specific lens/consultation;
- educational explanation that no universal voting weight exists.

Never display a universal `Smart Vote Weight` derived only from the person.

## 9. Update stale code comments around reading availability

### `frontend/services/decide.ts`

The implementation already calls:

```text
/api/v1/smart-vote/readings/ethikos-topic/<id>/
```

Update the surrounding comments/documentation to match the active API while retaining the rule: never fabricate a reading from baseline.

## 10. Pulse/analytics should stop depending on compatibility vote rows

Current frontend analytics code reads `kollective/votes/` in Pulse calculations. Move those reads to the canonical source/event contract appropriate to the metric being displayed.

Do not mix ethiKos stances, Smart Vote ballots and Smart Vote derived readings into one untyped participation counter.

## 11. Use domain names in active code comments and API documentation

Active router/admin comments and API documentation should name the actual domain responsibility (`structured deliberation`, `argument source`, `argument impact`, etc.). Database migration filenames do not need cosmetic rewriting.

## 12. External ecosystem boundaries are not implemented yet

No active Konnaxion adapter was found for Orgo, Kristal or SemantiK Architect.

When those are implemented, add dedicated boundary packages/adapters rather than importing their internal models.

### Orgo boundary

Needs explicit command/query/event/receipt semantics and correlation/idempotency. No Case↔Topic or Task↔Consultation identity.

### Kristal boundary

Only add when a concrete Kristal artifact use case exists. Preserve Kristal epistemic metadata and do not take ownership of kOA-Linux local activation.

### SemantiK Architect boundary

Use a generation request/response adapter; Architect must not mutate Konnaxion source state.

### kOA-Linux integration

Prefer deployment/component contracts at the platform boundary. Host privilege/resource/lifecycle concerns should not be implemented as Konnaxion business models.

## 13. Areas that are already architecturally strong

Preserve these patterns:

- `konnaxion.ekoh.services.contextual_analysis` is non-authoritative;
- `konnaxion.ekoh.services.rating_access` centralizes disclosure policy;
- `SourceConsultationBinding` is explicit;
- ethiKos stance/argument ownership is local;
- Smart Vote reading baseline and advisory result are separate;
- privacy filtering is performed server-side;
- frontend `decide.ts` does not copy the baseline into the reading when the endpoint returns no reading.
