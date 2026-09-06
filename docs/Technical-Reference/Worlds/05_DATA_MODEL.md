# Target Data Model

Canonical owner: `konnaxion.worlds`.

Names below are target conceptual names; exact Django field naming may adapt to project conventions without changing semantics.

## 1. World

```python
class World(models.Model):
    key
    title
    description
    status
    current_release
    visibility
    created_by
    created_at
    updated_at
    archived_at
```

Constraints:
- `key` globally unique;
- only one `current_release`;
- current release must belong to same World;
- archived World cannot accept normal writes.

Suggested status:
- `active`;
- `maintenance`;
- `archived`.

## 2. WorldRelease

```python
class WorldRelease(models.Model):
    world
    release_number
    status

    domain_schema
    ekoh_schema

    seed_pack_key
    seed_version
    seed_checksum
    scenario_schema_version

    domain_migration_fingerprint
    ekoh_migration_fingerprint
    fixture_checksum

    build_started_at
    build_finished_at
    promoted_at

    is_dirty
    dirty_since

    build_metadata_json
    validation_report_json
```

Status:
- `building`;
- `validating`;
- `ready`;
- `current`;
- `frozen`;
- `failed`;
- `archived`.

Constraints:
- `(world, release_number)` unique;
- schema names globally unique;
- failed release cannot be promoted;
- release from another World cannot become current.

## 3. SeedPackRecord

Registry/provenance, not raw content storage:

```python
class SeedPackRecord(models.Model):
    key
    version
    manifest_path
    checksum
    scenario_schema_version
    discovered_at
    metadata_json
```

A file-system/Git Seed Pack remains source of truth.

## 4. WorldMembership

```python
class WorldMembership(models.Model):
    world
    user
    role
    is_active
```

Suggested roles:
- owner;
- maintainer;
- presenter;
- member;
- viewer.

This is authorization/access, not ethiKos participant role.

## 5. WorldPersona

Compatibility/presentation mapping:

```python
class WorldPersona(models.Model):
    world
    source_key
    bridge_user
    display_name
    persona_type
    metadata_json
```

Persona type examples:
- simulated_person;
- cited_thinker;
- citizen;
- expert;
- organization;
- demo_actor.

Constraints:
- `(world, source_key)` unique;
- bridge user may not be reassigned silently to another persona.

## 6. WorldSnapshot

```python
class WorldSnapshot(models.Model):
    world
    source_release
    label
    status
    manifest_json
    artifact_location
    checksum
    created_by
    created_at
```

A snapshot is restored into a **new Release**. It should not overwrite the current Release in place.

## 7. WorldAuditEvent

```python
class WorldAuditEvent(models.Model):
    world
    release
    actor
    event_type
    request_id
    metadata_json
    created_at
```

High-value events:
- world_created;
- release_build_started;
- release_build_failed;
- release_ready;
- release_promoted;
- release_rollback;
- snapshot_created;
- snapshot_restored;
- world_archived;
- release_purged;
- view_as_started/stopped.

## 8. Existing DemoScenarioImport

Do not replace it merely because Worlds exist.

Its role becomes:

```text
WorldRelease
  contains
    one or more imported Scenarios
      tracked by DemoScenarioImport
```

Add a Release relationship or equivalent unambiguous provenance.

Future uniqueness should include Release context.

`scenario_key` alone must not imply global isolation.
