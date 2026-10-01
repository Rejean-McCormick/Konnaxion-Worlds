# Konnaxion Worlds standalone bootstrap

This repository owns a standalone Django bootstrap. The Windows Manager prefers the sibling main Konnaxion runtime when available, and falls back to this standalone bootstrap only when a usable host runtime is absent.

- Manager (normal Windows entry point): `Konnaxion_World_Manager.pyw` (auto-selects hosted Konnaxion runtime first, standalone fallback second)
- Setup recipe: `SETUP_KONNAXION_WORLDS.ps1` (auto-launched by the Manager when `.venv` is missing; manual use remains available for diagnostics)
- Django CLI: `.venv\Scripts\python.exe backend\worlds_manage.py ...`
- Settings: `backend/worlds_config/settings.py`
- Database: `KONNAXION_WORLDS_DATABASE_URL` (PostgreSQL required for World schema operations)

- Scoped API safety: `KONNAXION_WORLDS_ENFORCE_SCOPED_API=true` (default; fail closed)
- Current architecture lock: `KX-UNIVERSES-1` (`KX-WORLDS-1` remains the foundation lock)

## Bulk Universe builds

The standalone manager/CLI can run multi-World Universe builds without Redis/Celery by using persisted local jobs:

```powershell
.\.venv\Scripts\python.exe .\backend\worlds_manage.py worlds_apply_universe <universe> `
  --pack-version <version> `
  --local-workers 2 `
  --promote
```

If the Universe/World seed data lives in the main Konnaxion repository, point the standalone settings at it with `KONNAXION_WORLD_SEED_ROOT` and `KONNAXION_UNIVERSE_SEED_ROOT` in `.env`.
