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

Possible list:
- CUNY Philosophy;
- Hydro / AI Governance;
- Québec Democracy;
- Clean Sandbox.

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
