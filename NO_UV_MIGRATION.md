# Konnaxion local runtime — venv/pip

This change removes the `uv` package manager from the local runtime contract while keeping the standard `.venv` directory.

## One-time conversion

From the repository root:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\PREPARE_KONNAXION_LOCAL.ps1
pwsh -NoProfile -ExecutionPolicy Bypass -File .\VALIDATE_KONNAXION_NO_UV.ps1
```

`PREPARE_KONNAXION_LOCAL.ps1` can import the existing Neon `DATABASE_URL` from the historical `konnaxion_local_django` container metadata if needed. It never prints the secret. It persists local settings in the gitignored `backend/.env`.

## Run

```powershell
.\RUN_backend_local.bat
```

World Manager:

```powershell
py -3 .\Konnaxion_World_Manager.pyw
```

The World Manager executes Django through `backend/.venv/Scripts/python.exe` and builds World releases synchronously, so it does not require a Docker Django container or Celery worker.

Docker may still be used independently for optional infrastructure such as Redis/Mailpit. `uvicorn` remains the ASGI server and is unrelated to the `uv` package manager.
