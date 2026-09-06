@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem ===== Settings =====
set "DESTROOT=C:\MyCode\backupsCumulKv14devOk"

rem Source = folder where this script lives (strip trailing backslash to avoid quote-escape issue)
set "SRC=%~dp0"
set "SRCN=%SRC:~0,-1%"
for %%i in ("%SRCN%") do set "PROJNAME=%%~nxi"

rem Timestamp (PowerShell; fallback to DATE/TIME if PS unavailable)
set "TS="
for /f %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm-ss" 2^>nul') do set "TS=%%I"
if not defined TS (
  set "TS=%DATE:~6,4%-%DATE:~3,2%-%DATE:~0,2%_%TIME:~0,2%-%TIME:~3,2%-%TIME:~6,2%"
  set "TS=%TS: =0%"
)

set "DEST=%DESTROOT%\%PROJNAME%_%TS%"
if not exist "%DESTROOT%" mkdir "%DESTROOT%"
mkdir "%DEST%" >nul 2>&1
set "LOG=%DEST%\backup.log"

echo [INFO] SRC  = "%SRCN%"
echo [INFO] DEST = "%DEST%"
echo [INFO] LOG  = "%LOG%"
echo.

echo [INFO] Excluding directories: node_modules .next .turbo .cache .swc artifacts scripts\artifacts playwright-report reports coverage dist
echo [INFO] Excluding files: tsconfig.tsbuildinfo use_client_report.csv use_client_report.json *.log *.tmp *.bak .last-run.json
echo.

echo [DRY-RUN] Listing what would be copied...
robocopy "%SRCN%" "%DEST%" /E /XJ /R:0 /W:0 /L /NFL /NDL /NJH /NJS /NP /XF tsconfig.tsbuildinfo use_client_report.csv use_client_report.json *.log *.tmp *.bak .last-run.json /XD node_modules .next .turbo .cache .swc artifacts "scripts\artifacts" playwright-report reports coverage dist
echo.

echo [COPY] Running robocopy...
robocopy "%SRCN%" "%DEST%" /E /XJ /COPY:DAT /DCOPY:DAT /R:1 /W:1 /MT:16 /TEE /LOG+:"%LOG%" /XF tsconfig.tsbuildinfo use_client_report.csv use_client_report.json *.log *.tmp *.bak .last-run.json /XD node_modules .next .turbo .cache .swc artifacts "scripts\artifacts" playwright-report reports coverage dist

set "RC=%ERRORLEVEL%"
echo.
echo [INFO] Robocopy exit code: %RC%
echo [TAIL] Last 60 lines of log (if present):
powershell -NoProfile -Command "if (Test-Path '%LOG%') { Get-Content -Path '%LOG%' -Tail 60 } else { 'Log not found: %LOG%' }"
echo.
echo [LIST DEST] Top-level items in destination:
dir /a /-c "%DEST%"
echo.

echo [HOLD] Window stays open. Type 'exit' to close.
cmd /K
endlocal
