# Implementation Checklist

## Architecture

- [ ] `KX-WORLDS-1` docs committed.
- [ ] Existing AI/domain ownership docs referenced.
- [ ] `konnaxion.worlds` canonical owner created.
- [ ] No alternate scenario-column multi-tenancy introduced.
- [ ] No destructive World toggle.

## Control plane

- [ ] World model.
- [ ] WorldRelease model.
- [ ] WorldMembership.
- [ ] WorldPersona.
- [ ] WorldAuditEvent.
- [ ] Seed provenance.
- [ ] Snapshot registry.

## Context

- [ ] `/w/{world_key}` UI route.
- [ ] `/api/w/{world_key}` runtime route.
- [ ] WorldResolver.
- [ ] request pinning.
- [ ] `WorldRuntime` ContextVar.
- [ ] missing context fails.
- [ ] response headers.

## PostgreSQL

- [ ] generated safe schema names.
- [ ] provisioner.
- [ ] domain scoped migration runner.
- [ ] EkoH/Smart Vote scoped migration runner.
- [ ] schema canaries.
- [ ] nested scope guard.
- [ ] no World-owned fallback tables in control/public after cutover.

## Seeds/import

- [ ] World Pack manifest.
- [ ] pack checksum.
- [ ] release-aware importer.
- [ ] namespaced persona usernames.
- [ ] no title/name natural key collisions.
- [ ] DemoScenarioImport linked to Release.
- [ ] ISCED fixture load per EkoH schema.
- [ ] source-vs-reading contract preserved.

## EkoH/Smart Vote

- [ ] EkoH profile changes with World.
- [ ] Smart Vote binding cannot cross World.
- [ ] reading has World/Release provenance.
- [ ] source rows never receive derived weight.
- [ ] no global person weight.

## Infrastructure

- [ ] cache namespace helper.
- [ ] WorldTask base / explicit task context.
- [ ] Beat enumeration policy.
- [ ] WebSocket namespace/pinning.
- [ ] search filter injection.
- [ ] embedding namespace.
- [ ] media namespace.
- [ ] analytics World fields.
- [ ] structured logs.

## Frontend

- [ ] World switcher.
- [ ] hard-navigation v1.
- [ ] query/cache reset.
- [ ] stale-response rejection.
- [ ] View As separate.
- [ ] current World always visible.

## Releases/ops

- [ ] build new Release.
- [ ] validation report.
- [ ] promote pointer.
- [ ] dirty marker.
- [ ] snapshot.
- [ ] restore to new Release.
- [ ] archive.
- [ ] purge protections.
- [ ] incident runbook.

## Tests

- [ ] two Worlds with colliding display keys.
- [ ] ORM isolation.
- [ ] EkoH isolation.
- [ ] Smart Vote isolation.
- [ ] cache isolation.
- [ ] task isolation.
- [ ] search isolation.
- [ ] WebSocket isolation.
- [ ] media isolation.
- [ ] missing-context failure.
- [ ] public fallback guard.
- [ ] stale frontend response.
- [ ] snapshot/restore.

## AI drift

- [ ] AI_LOCK.yaml read by agent workflow.
- [ ] invariant IDs referenced in PR/task.
- [ ] ADR required for architecture change.
- [ ] current vs target explicitly labeled.
