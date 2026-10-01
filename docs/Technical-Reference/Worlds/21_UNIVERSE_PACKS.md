# Universe Packs — canonical composition contract

Contract: `kx-universe-pack/v1`

A Universe Pack is a **control-plane composition artifact**, not a new data-isolation layer.
It composes existing `kx-world-pack/v1` Seed Packs into one Universe and records topology.

## Canonical boundary

```text
Universe Pack
  -> Universe
  -> World bindings (exact Seed Pack versions)
  -> WorldRelation
  -> WorldSubscription
```

It does not own World business data, does not create a shared Universe schema, and does not
replace `WorldRelease`. Each referenced World Pack still builds an isolated Release.

## Manifest

```yaml
universe_contract: kx-universe-pack/v1
universe_key: my-universe
title: My Universe
pack_version: 1.0.0
visibility: private
default_world: my-main-world

requires:
  world_contract: kx-world-pack/v1
  host_contracts:
    - kx-world-personas/v1

worlds:
  - world_key: my-main-world
    seed_pack_key: my-main-world
    seed_version: 1.0.0
    visibility: private

relations: []
subscriptions: []
metadata: {}
```

Every World reference is pinned to an exact Seed Pack version. Fresh Worlds/Universes stay private
while builds run. With `--promote`, all exact target releases are prepared before control-plane
promotion/visibility changes are applied.

## Apply

```bash
python manage.py worlds_apply_universe my-universe --pack-version 1.0.0 --promote
```

`KONNAXION_UNIVERSE_SEED_ROOT` may override the default `seed-data/universes` discovery root.

## Upgrade semantics

A later Universe Pack version composes later exact World Pack versions. Older WorldReleases remain
immutable history. Worlds omitted by a later composition are not automatically deleted or moved.
Relations/subscriptions previously managed by the same Universe Pack are reconciled to the current
manifest.

## Queued bulk apply and progress

Large Universe Packs SHOULD use the persisted World build queue:

```text
python manage.py worlds_apply_universe my-universe \
  --pack-version 1.1.0 \
  --queue --wait --promote
```

Semantics:

1. discover, validate and hash the Seed Pack catalog once for the command;
2. create/update the Universe/World registry without changing live releases;
3. reuse exact matching CURRENT releases;
4. reuse exact matching READY releases;
5. reuse active exact `WorldBuildJob` rows;
6. queue only missing World builds with `promote_after_build=false`;
7. wait for all exact targets to become CURRENT/READY;
8. fail if any target job fails;
9. promote all remaining READY targets and reconcile visibility/topology in one final transaction.

This preserves the existing atomic-composition guarantee: queue workers never expose one World early merely because it finishes before its peers.

Build concurrency is controlled by the existing PostgreSQL advisory-lock slot pool:

```text
KONNAXION_WORLD_BUILD_CONCURRENCY=2
```

Each `WorldBuildJob` persists fine-grained progress in `metadata_json.progress`, including `stage`, `step`, `steps_total`, `percent`, `message`, and `updated_at`. Operators can watch it with:

```text
python manage.py worlds_jobs --universe my-universe --watch
```

### Idempotent topology reconciliation

Relations and subscriptions are upserted before model-level uniqueness validation so re-applying the same Universe Pack does not fail because an identical managed edge already exists. The final transaction still validates each persisted row and rolls back the complete promotion/topology change on any invariant failure.

### Brokerless local execution

For local maintenance without Celery/Redis:

```text
python manage.py worlds_apply_universe my-universe \
  --pack-version 1.1.0 \
  --local-workers 2 \
  --promote
```

`--local-workers N` implies queued + wait semantics but dispatches persisted jobs to N isolated child Django processes via `worlds_run_job`. It does not bypass `WorldBuildJob`, release isolation, checksum validation, PostgreSQL build slots, or atomic final Universe promotion.
