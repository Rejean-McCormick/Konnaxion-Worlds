# World Manager UI

The existing `Konnaxion_Ethikos_Seed_Manager.pyw` should evolve into a **Konnaxion World Manager**.

It should stop presenting "one selected seed" as the top-level object.

## 1. Main layout

```text
+----------------------------------------------------------------+
| KONNAXION WORLD MANAGER                                        |
+---------------------------+------------------------------------+
| WORLDS                    | CUNY Political Philosophy          |
|                           |                                    |
| ● CUNY Philosophy         | Status: active                     |
| ● Hydro / AI              | Current release: 12                |
| ● Québec Democracy        | Seed: 1.3.0                        |
| ○ Basic Income            | Dirty: no                          |
|                           | Actors: 13                         |
|                           | Topics: 10                         |
|                           |                                    |
|                           | [Open] [Build Release]             |
|                           | [Snapshot] [Clone] [Archive]       |
+---------------------------+------------------------------------+
```

## 2. World status

Suggested icons/states:

```text
○ no release
◌ building
◐ validating
● ready/active
△ dirty
! failed
⊘ archived
```

Do not use "active" to mean "currently selected in my browser."

## 3. Release panel

Show:
- release number;
- seed pack/version/checksum;
- migration fingerprints;
- build status;
- dirty state;
- build/validation logs;
- promoted timestamp.

Actions:
- inspect;
- promote;
- snapshot;
- restore;
- compare;
- purge if allowed.

## 4. Seed Library panel

The manager discovers:

```text
seed-data/worlds/*/world.yaml
```

Show:
- Pack version;
- schema contract;
- required fixtures;
- checksum;
- validation;
- which Worlds/Releases use it.

Actions:
- validate;
- build new World;
- build new Release for an existing World.

## 5. In-app World switcher

Header:

```text
WORLD [ CUNY Philosophy ▼ ]
```

Selection is navigation only.

For small installations, a simple list is acceptable. For the production target of ~120 Worlds, the selector MUST remain usable without scrolling through an unstructured 120-item list.

Required UX at that scale:
- type-ahead search by title/key;
- current World clearly visible;
- recent Worlds and/or favorites SHOULD be surfaced;
- optional category/tag/status filtering;
- inaccessible, archived or release-less Worlds MUST NOT appear as ordinary selectable active destinations;
- switching remains a hard navigation in v1.

Example:

```text
WORLD [ Québec Democracy ▼ ]

Search: [ hydro____________ ]
Recent
  Québec Democracy
  CUNY Philosophy

Results
  Hydro / AI Governance
  Hydro / Water Policy
```

If the target World does not support the exact current route, navigate to that World's dashboard.

## 6. View As

Separate control:

```text
VIEW AS [ Public Viewer ▼ ]
```

Never combine the World and View As controls into one identity selector.

## 7. Safety copy

Buttons must be precise:

Bad:
- `Activate`
- `Reset`
- `Delete`

Better:
- `Open World`
- `Promote Release 13`
- `Rebuild from Seed`
- `Restore Snapshot into New Release`
- `Archive World`
- `Purge Release`

## 8. Preview

Before building:
- validate Seed Pack;
- summarize actors/topics/EkoH/sources;
- show expected fixture requirements;
- show collision/identity warnings;
- show generated internal persona usernames;
- show target schema names.

## 9. Drift indicator

World Manager should display:

```text
Architecture lock: KX-WORLDS-1
Seed baseline: clean / dirty
Schema contract: pass / fail
Migration fingerprint: pass / mismatch
```

This makes system drift visible to humans, not only CI.

## 10. 120-World operations view

The World Manager SHOULD support bulk operational visibility without encouraging bulk destructive actions.

Recommended list columns/filters:
- World key/title;
- status;
- current Release number/state;
- dirty flag;
- last validation time/result;
- Seed Pack/version;
- last snapshot;
- storage/size estimate when available.

Recommended aggregate counters:

```text
Worlds: 120
Active: 112
Maintenance: 3
Archived: 5
Without current Release: 0
Unhealthy current Releases: 0
Build jobs: 2 running / 4 queued
```

Bulk build/validate operations SHOULD use queued jobs with explicit concurrency limits. `Select/Open World` remains an individual navigation operation and MUST never become a bulk server activation command.
