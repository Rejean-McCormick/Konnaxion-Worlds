# Konnaxion Worlds v0.3.5 — Kristal v6 boundary alignment

**Date:** 2026-10-01

This update aligns the Worlds engine/specification with Kristal Standard 6.0.0 while preserving all Konnaxion ownership and isolation invariants.

## Changed

- added a normative `22_KRISTAL_V6_BOUNDARY.md`;
- added machine-readable `KRISTAL_V6_BOUNDARY.json`;
- added ADR-WLD-022/023/024 for actionability, projection provenance and scope terminology;
- added WLD-045..049 to the AI lock;
- updated active cross-system terminology from v5 artifact language to Kristal v6 `kristal_state`, `record_role`, `applicability` and `actionability`;
- added a stdlib-only boundary checker;
- bumped package metadata to `0.3.5`.

## Explicitly unchanged

- Universe/World/WorldRelease data model;
- routing and request pinning;
- database schema isolation;
- build/promotion behavior;
- Konnaxion ownership of Worlds lifecycle mutations;
- repository boundary forbidding a vendored host IK adapter.

`actionability.mode = automatic` is automation eligibility only. It never grants execution authority.
