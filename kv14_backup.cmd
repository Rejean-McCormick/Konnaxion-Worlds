@echo off
setlocal enableextensions

rem ==== Settings ====
set "DEST=C:\MyCode\backupsCumulKv14devOk"

rem Source folder is the folder containing this script
set "SRC=%~dp0"
for %%i in ("%SRC:~0,-1%") do set "PROJNAME=%%~nxi"

rem Timestamp via PowerShell: yyyy-MM-dd_HHmmss (locale-independent)
for /f %%I in ('powershell -NoProfile -Command "(Get-Date).ToString(\"yyyy-MM-dd_HHmmss\")"') do set "TS=%%I"

set "BACKUP_DIR=%DEST%\%PROJNAME%_%TS%"
if not exist "%DEST%" mkdir "%DEST%"
mkdir "%BACKUP_DIR%" >nul 2>&1

echo Source: "%SRC%"
echo Target: "%BACKUP_DIR%"

rem ==== Excludes (no stray quotes) ====
set "EXCLUDE_DIRS=/XD node_modules .next .swc artifacts scripts\artifacts playwright-report"
set "EXCLUDE_FILES=/XF tsconfig.tsbuildinfo *.log *.tmp .last-run.json use_client_report.csv use_client_report.json"

rem ==== Copy (append '.' to avoid quoted trailing-backslash issue) ====
robocopy "%SRC%." "%BACKUP_DIR%." /E /R:1 /W:1 /NFL /NDL /NP %EXCLUDE_DIRS% %EXCLUDE_FILES%

set "RC=%ERRORLEVEL%"
echo Robocopy exit code: %RC%
if %RC% LSS 8 (
  echo Backup completed.
  echo Saved to: "%BACKUP_DIR%"
) else (
  echo Backup had errors. Review output above.
)

echo.
echo Tip: To hardcode source, replace the line 'set "SRC=%%~dp0"' with:
echo   set "SRC=C:\MyCode\Konnaxionv14\frontend"
echo.

pause
endlocal
