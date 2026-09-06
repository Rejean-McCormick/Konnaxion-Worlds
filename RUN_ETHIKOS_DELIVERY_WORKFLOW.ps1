# FILE: RUN_ETHIKOS_DELIVERY_WORKFLOW.ps1
[CmdletBinding()]
param(
  [switch]$Headed,
  [switch]$OpenReport
)

$ErrorActionPreference = 'Stop'
$RepoRoot = $PSScriptRoot
$Frontend = Join-Path $RepoRoot 'frontend'
$AuthState = Join-Path $Frontend 'storageState.delivery.json'

function Assert-HttpReady([string]$Name, [string]$Url) {
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 8
    if ($response.StatusCode -ge 500) {
      throw "$Name returned HTTP $($response.StatusCode)"
    }
  }
  catch {
    throw "$Name is not ready at $Url. $($_.Exception.Message)"
  }
}

if (-not (Test-Path (Join-Path $Frontend 'package.json'))) {
  throw "Konnaxion frontend not found under $Frontend"
}

# Canonical local origins: keep hostnames identical so Django session/CSRF cookies
# work through the Next.js proxy.
if ([string]::IsNullOrWhiteSpace($env:BACKEND_BASE_URL)) {
  $env:BACKEND_BASE_URL = 'http://localhost:8000'
}
if ([string]::IsNullOrWhiteSpace($env:SMOKE_BASE_URL)) {
  $env:SMOKE_BASE_URL = 'http://localhost:3000'
}
if ([string]::IsNullOrWhiteSpace($env:PLAYWRIGHT_AUTH_STATE)) {
  $env:PLAYWRIGHT_AUTH_STATE = 'storageState.delivery.json'
}
if ([string]::IsNullOrWhiteSpace($env:ETHIKOS_TEST_USERNAME)) {
  $env:ETHIKOS_TEST_USERNAME = 'ethikos_seed_user'
}
if ([string]::IsNullOrWhiteSpace($env:ETHIKOS_TEST_EMAIL)) {
  $env:ETHIKOS_TEST_EMAIL = 'ethikos-seed-user@example.com'
}
if ([string]::IsNullOrWhiteSpace($env:ETHIKOS_TEST_PASSWORD)) {
  $env:ETHIKOS_TEST_PASSWORD = 'test-password'
}

Write-Host '=== Ethikos / EkoH / Smart Vote Delivery Workflow ===' -ForegroundColor Cyan
Write-Host "Backend : $($env:BACKEND_BASE_URL)"
Write-Host "Frontend: $($env:SMOKE_BASE_URL)"
Write-Host

Assert-HttpReady 'Django backend' "$($env:BACKEND_BASE_URL.TrimEnd('/'))/admin/login/"
Assert-HttpReady 'Next.js frontend' "$($env:SMOKE_BASE_URL.TrimEnd('/'))/"

Push-Location $Frontend
try {
  if ($Headed) {
    & pnpm exec playwright test `
      -c playwright.delivery.config.ts `
      --project=ethikos-delivery `
      --headed
  }
  else {
    $oldCi = $env:CI
    $env:CI = '1'
    try {
      & pnpm exec playwright test `
        -c playwright.delivery.config.ts `
        --project=ethikos-delivery
    }
    finally {
      $env:CI = $oldCi
    }
  }

  $code = $LASTEXITCODE

  Write-Host
  if ($code -eq 0) {
    Write-Host 'DELIVERY WORKFLOW: PASS' -ForegroundColor Green
    Write-Host 'Evidence: frontend\artifacts\ethikos-delivery-workflow\delivery-evidence.json'
  }
  else {
    Write-Host "DELIVERY WORKFLOW: FAIL (exit=$code)" -ForegroundColor Red
  }

  if ($OpenReport) {
    & pnpm exec playwright show-report artifacts/playwright-delivery-html
  }

  exit $code
}
finally {
  Pop-Location
  Remove-Item $AuthState -Force -ErrorAction SilentlyContinue
}
