# Konnaxion World Manager — Neon fix v1

Source: Code_snapshot_Konnaxion_Worlds(4).zip

Change unique:
- `Konnaxion_World_Manager.pyw` : `_ensure_backend()` no longer asks Docker Compose to start nonexistent service `db`.
- Existing `django` service remains responsible for connecting to Neon through `.envs/.local/.postgres`.

No backend models, migrations, seed packs, or database content are changed by this ZIP.
