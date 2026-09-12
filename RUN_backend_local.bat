@echo off
setlocal

pushd "%~dp0backend"
if errorlevel 1 (
  echo [ERROR] Could not enter backend folder: "%~dp0backend"
  pause
  exit /b 1
)

set "VENV_PY=.venv\Scripts\python.exe"

if not exist "%VENV_PY%" (
  echo [INFO] .venv missing. Preparing standard Python 3.12 environment with pip...
  popd
  pwsh -NoProfile -ExecutionPolicy Bypass -File "%~dp0PREPARE_KONNAXION_LOCAL.ps1"
  if errorlevel 1 (
    echo [ERROR] Local environment preparation failed.
    pause
    exit /b 1
  )
  pushd "%~dp0backend"
)

if not exist ".env" (
  echo [ERROR] backend\.env is missing.
  echo Run PREPARE_KONNAXION_LOCAL.ps1 first.
  pause
  exit /b 1
)

findstr /b /c:"DATABASE_URL=" ".env" >nul 2>nul
if errorlevel 1 (
  echo [ERROR] DATABASE_URL is missing from backend\.env.
  echo Run PREPARE_KONNAXION_LOCAL.ps1 first.
  pause
  exit /b 1
)

set "USE_DOCKER=no"
set "DJANGO_SETTINGS_MODULE=config.settings.local"
if not defined REDIS_URL set "REDIS_URL=redis://127.0.0.1:6379/0"

echo [INFO] Checking Django configuration...
"%VENV_PY%" manage.py check
if errorlevel 1 (
  echo [ERROR] Django check failed.
  pause
  exit /b 1
)

echo [INFO] Starting backend on http://127.0.0.1:8000 ...
"%VENV_PY%" -m uvicorn config.asgi:application --host 0.0.0.0 --port 8000 --reload
if errorlevel 1 (
  echo [ERROR] Backend server failed to start.
  pause
  exit /b 1
)

popd
endlocal
