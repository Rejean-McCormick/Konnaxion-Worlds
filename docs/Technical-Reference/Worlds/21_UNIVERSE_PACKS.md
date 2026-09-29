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
