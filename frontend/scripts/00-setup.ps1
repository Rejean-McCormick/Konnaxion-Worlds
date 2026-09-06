# 00-setup.ps1
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$root = Resolve-Path "$PSScriptRoot\.."
Set-Location $root

# Node + pnpm
corepack enable | Out-Null
pnpm install --frozen-lockfile

# Playwright (navigateurs)
pnpm run pw:install

# Backend Python (optionnel si tests backend)
if (Test-Path "$root\backend") {
  if (-not (Test-Path "$root\.venv")) { & py -3.12 -m venv "$root\.venv" }
  & "$root\.venv\Scripts\python.exe" -m pip install -U pip wheel
  if (Test-Path "$root\backend\requirements\local.txt") {
    & "$root\.venv\Scripts\pip.exe" install -r "$root\backend\requirements\local.txt"
  } elseif (Test-Path "$root\backend\requirements.txt") {
    & "$root\.venv\Scripts\pip.exe" install -r "$root\backend\requirements.txt"
  }
}

Write-Host "Setup OK"
