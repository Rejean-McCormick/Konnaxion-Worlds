@echo off
setlocal

pushd "%~dp0frontend"

where pnpm >nul 2>nul
if errorlevel 1 (
  call corepack enable
)

if not exist "node_modules" (
  call pnpm install || exit /b 1
)

call pnpm dev || exit /b 1

popd
endlocal