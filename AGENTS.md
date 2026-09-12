# Konnaxion local runtime contract

This repository uses a conventional Python runtime for local development.

- Python: 3.12
- Virtual environment: `backend/.venv`
- Package installation: `backend/.venv/Scripts/python.exe -m pip ...`
- Django settings: `config.settings.local`
- Local database configuration: `backend/.env`
- `USE_DOCKER=no` for the local Django process
- The `uv` package manager is **not required** and must not be assumed by scripts or AI tooling.
- `uvicorn` is the ASGI server package; it is unrelated to the `uv` package manager.
- `Konnaxion_World_Manager.pyw` executes Django through `backend/.venv`; it does not run Django through Docker.
- Docker may still be used for optional infrastructure such as Redis/Mailpit, but local Django must not depend on a Docker `django` or `db` service. Host-side Django uses Redis/Mailpit through `127.0.0.1`.
- Never print or commit `DATABASE_URL`. `backend/.env` is gitignored.

Canonical local commands, from `backend`:

```powershell
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py showmigrations worlds
.\.venv\Scripts\python.exe -m pytest
```

For a fresh or repaired environment, run `PREPARE_KONNAXION_LOCAL.ps1` from the repository root.
