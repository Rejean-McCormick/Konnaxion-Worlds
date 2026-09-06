# 20-frontend-ct.ps1
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
Set-Location (Resolve-Path "$PSScriptRoot\..")

pnpm run test:ct -- --reporter=line
