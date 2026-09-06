@echo off
setlocal

pushd "%~dp0backend"
if errorlevel 1 (
  echo [ERROR] Could not enter backend folder: "%~dp0backend"
  pause
  exit /b 1
)

where uv >nul 2>nul
if errorlevel 1 (
  echo [ERROR] uv is not installed or not in PATH.
  pause
  exit /b 1
)

if not exist ".venv\Scripts\python.exe" (
  echo [INFO] Creating Python 3.12 virtual environment...
  uv venv .venv --python 3.12
  if errorlevel 1 (
    echo [ERROR] Failed to create virtual environment.
    pause
    exit /b 1
  )
)

echo [INFO] Installing dependencies...
uv pip install --python ".venv\Scripts\python.exe" -r requirements\local.txt
if errorlevel 1 (
  echo [ERROR] Dependency install failed.
  pause
  exit /b 1
)

echo [INFO] Applying migrations...
".venv\Scripts\python.exe" manage.py migrate
if errorlevel 1 (
  echo [ERROR] Migrations failed.
  pause
  exit /b 1
)

echo [INFO] Starting backend on http://127.0.0.1:8000 ...
".venv\Scripts\python.exe" -m uvicorn config.asgi:application --host 0.0.0.0 --port 8000 --reload
if errorlevel 1 (
  echo [ERROR] Backend server failed to start.
  pause
  exit /b 1
)

popd
endlocal