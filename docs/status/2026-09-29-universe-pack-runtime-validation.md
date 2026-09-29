# Konnaxion_Worlds status — Universe Pack runtime validation

Date: 2026-09-29  
Repository: `Konnaxion_Worlds`  
Status: **validated through Konnaxion host / operational**

## Summary

`Konnaxion_Worlds` now supports a reproducible Universe composition layer above existing World Packs without introducing a shared Universe business-data schema.

The engine continues to own canonical Universe/World/Release lifecycle semantics.

Contracts exercised in the validated rollout:

- `kx-universe-pack/v1`
- `kx-world-pack/v1`
- `kx-world-personas/v1`
- `ethikos-demo-scenario/v3`

## Universe Pack support

The engine now discovers and applies Universe Pack manifests from the same seed-data family as World Packs.

When `KONNAXION_UNIVERSE_SEED_ROOT` is not explicitly configured, Universe discovery follows the configured `KONNAXION_WORLD_SEED_ROOT` and resolves its sibling `universes/` directory.

This keeps standalone Worlds support intact while allowing the Konnaxion host to own the physical seed-data location.

## Management command

Canonical command:

```text
worlds_apply_universe <universe_key> --pack-version <semver> [--promote]
```

`--pack-version` is deliberately used instead of `--version` because Django reserves the global `--version` option.

The command performs exact Universe Pack version selection, resolves exact World Pack versions, builds the target WorldReleases, applies declared topology, and optionally promotes the complete target composition.

## Runtime validation

The command was exercised successfully through the real Konnaxion host for:

| Universe | Pack version | Worlds built | Worlds promoted |
| --- | ---: | ---: | ---: |
| `unesco` | `1.4.0` | 7 | 7 |
| `cuba-2026` | `0.2.0` | 1 | 1 |
| `kristal-farms` | `0.4.0` | 11 | 11 |
| `levis` | `0.4.0` | 17 | 17 |

Total normalized rollout:

```text
36 WorldReleases built
36 WorldReleases promoted
0 failed normalized WorldReleases
```

All normalized Worlds reached `r1 (current)`.

## Architecture confirmed

Validated ownership remains:

```text
Konnaxion_Worlds
    owns:
      Universe
      World
      WorldRelease
      WorldRelation
      WorldPublication
      WorldSubscription
      WorldPersona
      WorldPersonaBridge
      Universe Pack / World Pack lifecycle

Konnaxion host
    owns:
      host adapters
      ethiKos scenario import
      Konnaxion-specific auxiliary fixtures
      bridge-User field projection
```

No Universe-specific engine fork or adapter is required.

## Persona behavior

`kx-world-personas/v1` is projected through the host dependency-inversion boundary into the existing Worlds identity primitives.

The strict `identity_binding_only` profile was exercised by the Lévis/Kristal-aligned Universe. This keeps Kristal as external epistemic authority while Konnaxion/Worlds retains only operational identity and binding metadata.

## Release semantics confirmed

Universe application builds exact target WorldRelease versions first and then promotes the target composition.

The runtime validation confirmed that the four normalized Universes can coexist with existing legacy Worlds without cross-World data joins or a shared Universe business schema.

## Compatibility

Existing standalone/legacy World Packs remain supported.

Universe composition is additive:

```text
legacy standalone World Packs
        +
kx-universe-pack/v1 managed World Packs
        =
same Worlds runtime
```

## Known non-blocking host warning

The Konnaxion host currently reports:

```text
urls.W005: URL namespace 'world_runtime' isn't unique.
```

This is a host routing warning and did not block Worlds migrations, builds, validation, or promotion.

## Result

Universe Pack composition is now validated end-to-end through the real Konnaxion host and database with 36 normalized WorldReleases promoted successfully.
