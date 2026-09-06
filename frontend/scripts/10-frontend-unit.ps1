# 10-frontend-unit.ps1
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
Set-Location (Resolve-Path "$PSScriptRoot\..")

pnpm run typecheck
pnpm run test -- --ci
