# World 4 — Débats publics Québec–Canada — instantané 2026

This Seed Pack converts the legacy integrated Canada/Quebec Ethikos demo into a
`kx-world-pack/v1` world.

## Identity

- World key: `canada-quebec-public-debates-2026`
- Scenario key: `canada_quebec_public_debates_2026`
- Pack version: `1.0.0`
- Scenario schema: `ethikos-demo-scenario/v3`

## Canonicality rules

- The original Ethikos seed is copied byte-for-byte under `sources/original/`.
- Ethikos source stances remain canonical source facts.
- The EkoH sidecar is normalized into `ekoh_profiles` and `topic_relevance`.
- `proposed_topic_domain_relevance` is **not** promoted into canonical topics.
- `alignment_preview` is **not** seeded as a result; it remains derived/provenance data.
- Institutional EkoH profiles remain explicitly institutional/advisory.

## Install into Konnaxion_Worlds

Copy this directory to:

`backend/seed-data/worlds/canada-quebec-public-debates-2026/`

Then use the normal Worlds discovery/build/promote workflow.

Important: the current standalone Worlds builder in the supplied snapshot validates
scenario payloads but does not yet execute the domain import; Konnaxion's integrated
Worlds bridge must perform the Ethikos import inside the release schema before promotion.
