# Konnaxion — Engineering & Qualification Status

**Evidence date:** 2026-09-15  
**Release line:** `v0.8.0`  
**Qualification state:** remediation in progress; not all engineering qualification gates are green.

## Purpose

This document is the evidence ledger for current implementation and qualification status. It does not replace the architecture specification. Architecture documents define intended ownership, boundaries, contracts and invariants; this document records what the current code and diagnostics actually demonstrate.

Konnaxion no longer publishes a single aggregate “engineering maturity” or “RC readiness” percentage unless the denominator and calculation method are committed with the evidence. The earlier September 8 percentages are retained only as historical assessments and are not current release claims.

## Status vocabulary

Use these labels consistently:

- **Implemented** — executable code exists for the stated capability.
- **Qualified** — the relevant automated/runtime gate passed in the cited evidence run.
- **Preview** — usable surface exists, but the complete authoritative backend/domain contract is not closed.
- **Deferred** — intentionally outside the current implementation scope.
- **Historical** — retained documentation or design material that is not current authority.
- **PASS / WARN / FAIL / SKIP** — diagnostic verdicts from the named tool. Do not translate a WARN/SKIP into PASS.

Feature lists in the root README describe product scope unless a qualification claim is explicitly attached to them.

## Current qualification snapshot

### LevelUpDiag — full campaign

The 2026-09-15 full campaign covered N00 through N11.

| Level | Domain | Current result | Evidence interpretation |
|---|---|---:|---|
| N00 | Control & Discovery | PASS | Target/toolchain discovered. |
| N01 | Repository & Static | PASS | Required repository surfaces and Git status checks passed. |
| N02 | Backend / Django / DB | PASS | Django system check, migration-drift check and platform smoke passed. |
| N03 | Frontend / Next | FAIL | TypeScript, Jest and Next build passed; ESLint failed. |
| N04 | API Contracts | PASS | Backend/frontend endpoint scans, OpenAPI tests and common-auth contract checks passed. |
| N05 | Runtime & Browser | PASS | Local backend/frontend startup, Ethikos seed and Playwright smoke passed. |
| N06 | Jobs / Redis / Celery | PASS | Celery task tests passed; optional live job probe is not configured. |
| N07 | Security & Auth | WARN | Django deploy check and auth-policy tests passed; Capsule Manager security-gate unit tests had 2 failures / 40 passes. |
| N08 | Capsule Local | PASS | Manager repo, healthcheck source and instance-state tests passed; no capsule file was configured for hashing. |
| N09 | Deployed Runtime | PASS* | DNS/HTTP reachability probes ran; deep remote diagnostic was not configured. See probe-semantics note below. |
| N10 | Deep Scan | WARN | Frontend full-scan and full backend pytest were not fully green. |
| N11 | Correlation & Triage | FAIL | Correlated failure is driven by the current frontend qualification failure. |

#### Current LevelUpDiag remediation items

1. **Frontend lint gate:** the current frontend has one ESLint error plus warnings. N03 is correctly non-green until these are resolved.
2. **Jest fail-open path:** `frontend/tools/full-scan.ps1` still invokes Jest with `--passWithNoTests`. The qualification path should fail when the unit-test suite disappears.
3. **Full-scan orchestration:** N05 proves the local runtime + seeded Playwright flow can pass. The N10 full-scan invokes the smoke configuration without reproducing all N05 backend/seed preconditions, so the full-scan should be made self-contained rather than weakening browser coverage.
4. **Backend full suite:** the N10 run reported **146 passed / 7 failed**. Failures are concentrated in EkoH and TeamBuilder and include missing database relations. Pytest currently defaults to `--reuse-db`; a release qualification should rebuild a clean test database before these failures are classified as independent product defects.
5. **EkoH schema-aware tests:** EkoH uses the dedicated `ekoh_smartvote` PostgreSQL schema and exposes `ekoh_smartvote_db_scope()`. Older EkoH model/service tests should use the same schema scope or a common fixture.
6. **Capsule Manager gate tests:** 2 of 42 security-gate tests fail around `secrets_not_default`. This is a local gate/test alignment defect even though the deployed SecurityDiag runtime-isolation/security-gate level currently passes.
7. **N09 semantics:** a configured URL returning HTTP 404 was classified as a successful remote probe. Until the probe distinguishes reachability from endpoint validity, N09 PASS should be read as reachability evidence, not proof that every configured application route is valid.

### SecurityDiag — release campaign

The 2026-09-15 `release` campaign produced:

| Level | Domain | Result | Notes |
|---|---|---:|---|
| S00 | Diagnostic Integrity | PASS | Diagnostic integrity checks passed. |
| S01 | Target & Security Context | WARN | Network execution was enabled for the explicit remote/external checks. |
| S02 | Repository Secrets & Artifact Hygiene | WARN | Local untracked environment/secret material was detected for review; it was not reported as tracked release content. One oversized untracked `tsconfig.tsbuildinfo` was not content-scanned. |
| S03 | Supply Chain, Capsule Integrity & Automation | WARN | Some image declarations are not immutably pinned; declared `pnpm audit` / `pip-audit` checks are disabled. |
| S04 | Application Production Security | PASS | Production application-security checks passed. |
| S05 | Clean Host & OS Baseline | PASS | Host baseline checks passed. |
| S06 | SSH Hardening | PASS | SSH hardening checks passed. |
| S07 | Firewall & Listening Ports | PASS | Firewall/listener checks passed. |
| S08 | Docker & Capsule Runtime Policy | PASS | Runtime/container-policy checks passed. |
| S09 | Runtime Isolation, Agent & Security Gate | PASS | Agent/runtime isolation and deployed security-gate evidence passed. |
| S10 | Secrets & Filesystem Permissions | PASS | Remote secret/file-permission checks passed. |
| S11 | Persistence & Incident IOC Scan | PASS | Persistence/IOC checks passed. |
| S12 | External TLS & Attack Surface | PASS | External TLS/public-surface checks passed. |
| S13 | Backup & Recovery Evidence | FAIL | Latest backup evidence was ~71.82 h old against the configured 30 h freshness threshold. |
| S14 | Security Release Gate | FAIL | The combined gate failed because S13 was not release-acceptable. |

### Backup / restore policy

Backup freshness and isolated restore drills are **operational resilience evidence**, not a substitute for application, host, network or runtime security evidence.

For routine engineering/code qualification, Konnaxion does **not** require a fresh backup + isolated restore drill on every run. SecurityDiag's current built-in `release` campaign is intentionally stricter and still includes S13 in S14. Therefore:

- do not claim **“SecurityDiag S14 PASS”** when S13 is stale or missing;
- it is valid to state separately that **S04–S12 passed**;
- treat S13/S14 backup-related failure as an operational-release evidence gap unless another security level also fails;
- run a fresh backup/restore drill when the release process actually requires disaster-recovery evidence.

If the project later changes SecurityDiag so the standard engineering profile excludes S13, that policy change must be explicit in the tool configuration and documentation.

## Test taxonomy

Konnaxion uses several different test layers. They must not be collapsed into a single “frontend tests passed” claim.

| Layer | Primary mechanism | Intended evidence |
|---|---|---|
| Frontend unit | Jest | Isolated hooks/components/helpers. |
| Frontend component | Playwright Component Testing | Component behavior in a browser-like runtime. |
| Frontend/runtime smoke | Playwright smoke | Real routes and selected browser workflows against running services. |
| Delivery / golden path | Playwright delivery workflow | Cross-domain ethiKos → EkoH → Smart Vote behavior. |
| Harvest / targeted regression | Playwright harvest workflows | Broader selected platform regression coverage. |
| Backend unit/integration | pytest / Django test DB | Models, services, APIs, auth, tasks and platform smoke. |
| Engineering qualification | LevelUpDiag | Cross-layer build, contracts, runtime, test and deployment evidence. |
| Security qualification | SecurityDiag | Repo, host, SSH, firewall, Docker, Agent, TLS, secrets and release evidence. |

A green build does not imply a green unit suite; a green smoke run does not imply all unit/integration tests pass; a SecurityDiag host/runtime PASS does not erase a local Capsule Manager unit-test regression.

## Release-status rules

Public/current status text should follow these rules:

1. Do not publish a combined maturity percentage without a committed scoring method and denominator.
2. Do not call a historical validation result “current” after a newer diagnostic contradicts it.
3. Do not claim a full SecurityDiag release PASS when S14 is FAIL.
4. Report operational-resilience evidence separately from core application/security evidence.
5. Label preview/read-only/deferred surfaces explicitly and do not infer persistence or backend authority from UI presence.
6. Historical specifications may describe intended infrastructure or quality gates that no longer exist. They cannot override the canonical documentation order in `docs/README.md`.

## Current closure targets

Before describing the full engineering qualification as green:

- resolve the frontend ESLint gate;
- remove `--passWithNoTests` from the canonical full-scan path;
- make the full-scan browser phase reproduce its backend/seed prerequisites;
- run the backend full suite against a clean test database and fix remaining EkoH/TeamBuilder schema issues;
- resolve the two Capsule Manager `secrets_not_default` security-gate test failures;
- correct LevelUpDiag N09 so reachability and endpoint validity are separate claims;
- review S03 image pinning and optional dependency-audit policy according to the release assurance level actually desired.

OpenAPI/schema-generation warnings and optional deep probes remain visible qualification debt but should not be represented as implemented functionality failures unless their corresponding contract becomes release-blocking.

## Interaction Kernel qualification

Current LevelUpDiag and SecurityDiag evidence qualifies Konnaxion engineering/security surfaces only to the extent stated above. It does **not** by itself qualify the external Interaction Kernel profiles.

As of this documentation update, treat these as **target contracts / integration qualification pending**:

- `governance.decision.execute/1.0.0`;
- `accountability.impact.publish/1.0.0`;
- immutable/read-model `DecisionRecord` emission;
- correlation/idempotency/durable delivery across the Konnaxion↔Orgo boundary;
- Runtime Pack activation delegation when kOA-Linux is present.

The supplied IK migration documentation references an existing/historical `orgo_bridge_*` J30 implementation and `OrgoImpactPublication`. That reference is not sufficient to mark the current Konnaxion snapshot IK-qualified; executable adapter inspection and profile-level integration tests are required.
