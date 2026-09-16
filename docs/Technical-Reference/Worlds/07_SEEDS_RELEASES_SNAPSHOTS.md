# Seed Packs, Releases, Snapshots, Clone and Rollback

## 1. Seed Pack structure

Suggested:

```text
seed-data/worlds/
  cuny-political-philosophy/
    world.yaml
    scenarios/
      political-philosophy.json
    sources/
    media/
    README.md
```

A World can contain multiple scenario payloads.

## 2. Manifest

Example fields:

```yaml
world_key: cuny-political-philosophy
title: CUNY Political Philosophy
pack_version: 1.3.0
world_contract: kx-world-pack/v1

requires:
  ethikos_scenario_schema: ethikos-demo-scenario/v3
  fixtures:
    - isced-f

scenarios:
  - scenarios/political-philosophy.json
```

The pack must have a deterministic checksum.

## 3. Build flow

```text
DISCOVER PACK
    |
VALIDATE MANIFEST
    |
CREATE WorldRelease(status=building)
    |
CREATE domain + ekoh schemas
    |
RUN scoped migrations
    |
LOAD deterministic fixtures
    |
IMPORT scenarios
    |
COMPUTE/prepare derived indexes where required
    |
RUN integrity tests
    |
status=ready
```

Build failure:
- mark Release failed;
- preserve logs;
- do not modify current release.

## 4. Promote flow

Promotion is atomic at the control-plane pointer level:

```text
World.current_release = ready_release
```

Before promotion:
- Release must be `ready`;
- schema canaries must match;
- migration checks pass;
- seed provenance recorded;
- critical smoke tests pass.

After promotion:
- invalidate only World-scoped route/cache metadata as needed;
- existing in-flight requests remain pinned to their previously resolved Release.

## 5. Runtime mutation and dirty state

A current Release can receive legitimate live interactions:
- votes;
- new arguments;
- moderation;
- EkoH changes;
- consultation activity.

Such mutation sets:

```text
is_dirty = true
dirty_since = ...
```

Do not change the stored seed checksum to pretend the seed includes runtime changes.

## 6. Snapshot

Snapshot captures runtime state.

Recommended implementation:
- schema-level logical backup (`pg_dump`/`pg_restore` or equivalent);
- manifest including World/Release IDs and migration fingerprints;
- media manifest/checksum;
- optional search-index rebuild marker rather than backing up disposable indexes.

Snapshot restore:
- creates a new Release;
- restores into new schemas;
- validates;
- then may be promoted.

Never overwrite a current schema pair in place.

## 7. Rollback

Rollback target should be a known good snapshot/release state.

Preferred safe rollback:
1. identify frozen/known-good state;
2. clone/restore it into a new Release;
3. validate;
4. promote the new Release.

This preserves history and avoids mutating an old supposedly known state after rollback.

A faster direct pointer rollback MAY exist for local demo mode, but production-grade mode should prefer restore-to-new-release semantics.

## 8. Clone

Clone creates a new logical World from an existing World state or Seed Pack.

Examples:

```text
CUNY canonical
→ CUNY experimental
```

Cloned World gets:
- new World ID/key;
- new schema pair;
- independent future state.

## 9. Fork

"Fork" is a product-level label for clone + explicit lineage.

Store lineage metadata:

```text
parent_world_id
parent_snapshot_id or parent_release_id
reason
```

There is no live shared mutable storage after the fork.

## 10. Reset

Reset must be scoped.

Possible meanings:
- reset one imported scenario inside a Release;
- rebuild a World from Seed Pack;
- restore a Snapshot.

The UI and API must state which operation is being performed.

"Reset World" must never mean "delete whatever demo data has a prefix."

## Cross-ecosystem naming guard

`Seed Pack`, `WorldRelease` and `Snapshot` are Konnaxion Worlds lifecycle artifacts. They MUST NOT be renamed or documented as Kristal `Runtime Pack`, `Working Exchange`, `Reference Exchange` or `Exchange`.

`promote_release()` changes the Konnaxion-local `World.current_release` pointer. It does not perform host Runtime Pack activation and does not confer Kristal authority recognition.
