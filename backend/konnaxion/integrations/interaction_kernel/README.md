# Konnaxion Interaction Kernel adapter

This package is the Konnaxion boundary for Interaction Kernel `ik/1.1`.

## Ownership

It does **not** own Konnaxion domain state. `DecisionRecord` and
`InteractionEmission` are persisted by the World-owned `ethikos` app. This
package maps that state to/from IK records.

## Supported flows

### Konnaxion → Orgo

`DecisionRecord` publication and execution are separate operations:

1. close a `DecisionRecord`;
2. `POST /api/w/{world_key}/deliberate/decision-records/{id}/publish/` freezes its artifact snapshot;
3. `POST /api/w/{world_key}/deliberate/decision-records/{id}/execute/` creates/replays one durable
   `governance.decision.execute` emission;
4. Celery delivers the release-pinned emission to `IK_ORGO_INTERACTIONS_URL`.

Publishing never implicitly creates Orgo work.

### Orgo → Konnaxion

The existing `/api/integrations/orgo/konnaxion/...` bridge remains supported.
An additive IK ingress is available at:

`POST /api/integrations/ik/konnaxion/{world_key}/interactions/`

It currently accepts `accountability.impact.publish@1.0.0` and maps it into the
existing hardened `validate_publish_request()` / `OrgoImpactPublication` path.

## Reliability

`InteractionEmission` stores delivery state in the same World domain schema as
the source decision. Celery receives the exact `WorldRelease.id`, so retries do
not silently move to a newer current release.

Delivery is at-least-once. Idempotency is based on a stable producer key plus
`ik.request-fingerprint/jcs-rfc8785+sha256/v1`.

## Configuration

See `backend/env.example` for:

- `IK_ORGO_INTERACTIONS_URL`
- `IK_ORGO_TOKEN`
- `IK_ORGO_TARGET_ORGANIZATION`
- `IK_ORGO_TARGET_WORLD`
- retry/time-out settings
- `ORGO_KONNAXION_BRIDGE_TOKEN`

An empty outbound URL/token fails closed and eventually marks the emission
`dead`; it never falls back to an untrusted endpoint.
