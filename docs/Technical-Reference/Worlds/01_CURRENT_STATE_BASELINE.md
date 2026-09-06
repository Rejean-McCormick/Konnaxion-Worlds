# Current State Baseline — 2026-09-06 Snapshot

This document records **observed current implementation anchors**. It does not claim that the target World architecture is already implemented.

## 1. Existing useful primitives

### 1.1 EkoH / Smart Vote PostgreSQL scope

Current file:

```text
backend/konnaxion/ekoh/db.py
```

Current behavior:
- defines `set_local_ekoh_smartvote_search_path()`;
- defines `ekoh_smartvote_db_scope()`;
- uses a transaction-local PostgreSQL search path;
- current fixed path is `ekoh_smartvote, public`.

This is the strongest implementation precedent for the future `world_db_scope()`.

### 1.2 DemoScenarioImport provenance tracking

Current file:

```text
backend/konnaxion/ethikos/models_demo.py
```

`DemoScenarioImport` tracks:
- `scenario_key`;
- `object_type`;
- `object_id`;
- `object_label`;
- `source_key`;
- importer identity and timestamp.

Tracked types include:
- user;
- Ethikos category/topic/stance/argument;
- consultation/vote/result/impact item;
- EkoH expertise and ethics scores;
- Smart Vote source bindings.

This is useful provenance but is **not** a full isolation boundary.

### 1.3 Seed importer versions

Current file:

```text
backend/konnaxion/ethikos/demo_import/schema.py
```

The current canonical schema supports:
- `ethikos-demo-scenario/v1`;
- `ethikos-demo-scenario/v2`;
- `ethikos-demo-scenario/v3`.

v3 includes EkoH profiles, consultation/topic relevance and reading exclusions.

The current contract explicitly preserves the distinction between demo source facts and Smart Vote derived readings.

### 1.4 Existing Seed Manager

Current root utility:

```text
Konnaxion_Ethikos_Seed_Manager.pyw
```

It currently:
- selects a repository and seed file;
- calls the canonical importer preview;
- imports a seed;
- resets a scenario;
- starts/checks the backend;
- provides basic test/open actions.

It is currently **seed-centric**, not a multi-World control plane.

## 2. Current contamination risk

The current importer uses global natural keys for several records.

Observed patterns include:

```python
User.objects.update_or_create(username=username, ...)
EthikosCategory.objects.update_or_create(name=name, ...)
EthikosTopic.objects.update_or_create(title=title, ...)
UserExpertiseScore.objects.update_or_create(user=user, category=category, ...)
UserEthicsScore.objects.update_or_create(user=user, ...)
```

This means two scenarios can potentially address and mutate the same underlying object if their global keys collide.

`DemoScenarioImport` helps reset safely, but tracking an object after mutation does not prevent that mutation from having affected another scenario.

The reset logic also intentionally does not delete demo users because user deletion can cascade into unrelated tables.

## 3. Current-to-target conclusion

The current code already has:
- import provenance;
- schema-scoped EkoH operations;
- EkoH + Smart Vote awareness in demo seeds;
- preview/import/reset workflows.

The target Worlds system should extend these patterns rather than replace them with unrelated parallel systems.

However, do not describe the following as already implemented:
- `World`;
- `WorldRelease`;
- `/w/{world_key}` routing;
- multi-World schema pairs;
- World-aware cache/job/search/media scoping;
- atomic release promotion;
- World snapshots;
- World Manager control-plane API.

Those are target features defined by this documentation pack.
