# Konnaxion Worlds — Konnaxion Core Baseline

**Baseline date:** 2026-09-16  
**Purpose:** prevent embedded Konnaxion documentation from drifting independently of the Konnaxion core documentation set.

## Authority

Konnaxion core remains authoritative for Konnaxion-wide domain ownership, API semantics, qualification status and external ecosystem boundaries. Worlds extends Konnaxion with isolation/runtime mechanics; it does not fork those rules.

The current supplied Konnaxion core snapshot includes:

- `Technical-Reference/QUALIFICATION_STATUS.md`;
- `Technical-Reference/BOUNDARIES_AND_OWNERSHIP.md`;
- `Technical-Reference/CONTRACTS.txt`;
- `Technical-Reference/CODE_ALIGNMENT_NOTES.md`;
- `Technical-Reference/INTERACTION_KERNEL_INTEGRATION.md` (added by this documentation alignment update).

## Drift rule

If an embedded/copied Konnaxion document in this package conflicts with the current Konnaxion core repository, the Konnaxion core repository wins for Konnaxion-wide rules. Worlds-specific documents remain authoritative only for Worlds-specific architecture and lifecycle semantics.

Do not maintain independent copies of Konnaxion-wide qualification claims in Worlds. Link/rebase to the Konnaxion core baseline and keep Worlds qualification separate.
