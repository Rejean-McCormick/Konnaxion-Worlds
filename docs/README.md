# Konnaxion Worlds — Documentation

## Scope

Konnaxion Worlds is the multi-World isolation/runtime capability of Konnaxion. It does not create a second Konnaxion authority and it does not replace Konnaxion domain ownership.

The Worlds package defines how multiple isolated civic environments coexist inside one logical Konnaxion deployment. The local Worlds **control plane** is strictly Konnaxion-internal platform state; it is not the kOA Digital Ecosystem control plane, not an Orgo control plane, not an Interaction Kernel coordinator, not a Kristal authority, and not a kOA-Linux host-activation authority.

## Documentation authority

Read the Worlds documentation in this order:

1. `Technical-Reference/Worlds/20_QUALIFICATION_STATUS.md`
2. `Technical-Reference/Worlds/00_CANONICAL_SPEC.md`
3. `Technical-Reference/Worlds/17_ADR_REGISTER.md`
4. `Technical-Reference/Worlds/01_CURRENT_STATE_BASELINE.md`
5. `Technical-Reference/Worlds/02_GLOSSARY.md`
6. `Technical-Reference/Worlds/03_ARCHITECTURE.md`
7. `Technical-Reference/Worlds/04_DATA_OWNERSHIP_MATRIX.md`
8. `Technical-Reference/Worlds/05_DATA_MODEL.md` through `19_PRODUCTION_SCALE_120_WORLDS.md`
9. `Technical-Reference/Worlds/KONNAXION_WORLDS_FULL_SPEC.md` (generated consolidation)

The Konnaxion core baseline used by this package is documented in `Technical-Reference/Worlds/KONNAXION_BASELINE.md`. Konnaxion core documentation remains authoritative for Konnaxion-wide domain/ownership rules.

## Status rule

`LOCKED TARGET ARCHITECTURE` describes the intended Worlds design. It does not mean the full production target is qualified. Current qualification must be read from `20_QUALIFICATION_STATUS.md` and executable evidence.

## Critical terminology

- `WorldRelease` is a Konnaxion Worlds runtime/data generation. It is **not** a Kristal Reference Exchange.
- `Seed Pack` is authored reproducible World input. It is **not** a Kristal Runtime Pack.
- `Snapshot` is a Konnaxion Worlds state capture. It is **not** a Kristal Exchange.
- `Promote Release` updates `World.current_release`. It is **not** physical Runtime Pack activation.
- `Select/Open World` is navigation/context selection and is not activation.
