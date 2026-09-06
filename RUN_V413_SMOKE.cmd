@echo off
setlocal
set "ROOT=%~dp0"
cd /d "%ROOT%frontend"
set WAVE1_STRICT_UI=1
if "%SMOKE_BASE_URL%"=="" set SMOKE_BASE_URL=http://localhost:3000
npx playwright test -c playwright.smoke.config.ts --project=chromium tests/ethikos-wave1-workflow.spec.ts
exit /b %ERRORLEVEL%
