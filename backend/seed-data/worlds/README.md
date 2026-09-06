# Konnaxion World Seed Packs

Each installable World seed lives in its own directory with a `world.yaml`
manifest. `world_contract: kx-world-pack/v1` is mandatory.

A Seed Pack is an immutable **input**. Building it creates a new
`WorldRelease`; selecting a World never imports or resets a seed.

The `demo-alpha` and `demo-beta` packs intentionally reuse actor/category/topic
names. They are acceptance fixtures for proving cross-World isolation.
