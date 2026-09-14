# Konnaxion Worlds — Interaction Kernel update

## Update baseline

- Source: `Code_snapshot_Konnaxion_Worlds(5).zip`
- IK: `ik/1.1`, reference implementation `1.1.0-dev.2`
- Fingerprint: `ik.request-fingerprint/jcs-rfc8785+sha256/v1`
- Kristal pin: `v5.0.0-rc.1` → `af703bf02ee04a69a5f2ad6694fa8b8e56ae2b19`

## Added

- `DecisionProtocol` and canonical `DecisionRecord`
- immutable published decision artifact + SHA-256 JCS digest
- explicit `publish` and `execute` actions (publication does not imply execution)
- World-owned `InteractionEmission`
- release-pinned Celery delivery with retry/dead state
- Konnaxion IK adapter + canonical fingerprint implementation
- `KonnaxionExport` builder
- additive IK ingress for `accountability.impact.publish`
- `RuntimePackActivationPort` boundary (no local activation owner duplicated)

## Preserved

- current Orgo→Konnaxion bridge routes
- `OrgoImpactPublication`
- World/Release isolation and fail-closed behavior
- existing Korum/Smart Vote/EkoH/domain lifecycles
- no cross-system foreign keys or direct database writes

## Database migration

Apply `ethikos.0007_interaction_kernel_decisions` to every World domain schema
through the existing Konnaxion Worlds migration/release build process.

No existing rows are backfilled.

## Before enabling outbound delivery

Configure an Orgo IK ingress and service identity:

```env
IK_ORGO_INTERACTIONS_URL=https://orgo.example/api/integrations/ik/interactions/
IK_ORGO_TOKEN=...
IK_ORGO_TARGET_ORGANIZATION=...
IK_ORGO_TARGET_WORLD=...
```

Until Orgo is upgraded, leave the outbound URL/token blank. Konnaxion fails
closed; the legacy Orgo→Konnaxion bridge continues to work.

## Validation performed in this delivery

- all changed Python files compile;
- 9/9 Kristal JCS release-candidate vectors pass against the embedded adapter;
- 3/3 IK cross-language fingerprint vectors pass;
- `accountability.impact.publish` maps into the existing
  `validate_publish_request()` contract successfully.

Full Django checks/migration execution require the project's Python environment
(Django is not installed in the artifact-generation runtime).
