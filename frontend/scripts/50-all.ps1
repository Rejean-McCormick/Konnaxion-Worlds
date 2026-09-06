# 50-all.ps1
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$root = Resolve-Path "$PSScriptRoot\.."
Set-Location $root

pwsh -File "$PSScriptRoot\00-setup.ps1"
pwsh -File "$PSScriptRoot\10-frontend-unit.ps1"
pwsh -File "$PSScriptRoot\20-frontend-ct.ps1"
pwsh -File "$PSScriptRoot\31-frontend-smoke-prod.ps1" -Mode gate
pwsh -File "$PSScriptRoot\40-backend-tests.ps1"

Write-Host "✅ Tests OK"
