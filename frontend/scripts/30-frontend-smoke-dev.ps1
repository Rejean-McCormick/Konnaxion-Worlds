# 30-frontend-smoke-dev.ps1
param(
  [ValidateSet('audit','gate')] [string]$Mode = 'audit'
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$root = Resolve-Path "$PSScriptRoot\.."
Set-Location $root

function Wait-HttpOk([string]$url, [int]$timeoutSec = 60) {
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  while ($sw.Elapsed.TotalSeconds -lt $timeoutSec) {
    try {
      $r = Invoke-WebRequest -Uri $url -UseBasicParsing -Method Get -TimeoutSec 5
      if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { return $true }
    } catch {}
    Start-Sleep -Seconds 1
  }
  throw "Timeout waiting for $url"
}

# Génère routes
pnpm run routes:gen

# Démarre Next dev
$proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c","pnpm","dev" -NoNewWindow -PassThru
try {
  Wait-HttpOk "http://localhost:3000"
  if ($Mode -eq 'gate') { $env:SMOKE_GATE = '1' } else { Remove-Item Env:\SMOKE_GATE -ErrorAction SilentlyContinue }
  if ($Mode -eq 'gate') { pnpm run smoke:gate } else { pnpm run smoke:dev }
}
finally {
  if ($proc -and -not $proc.HasExited) { cmd /c "taskkill /PID $($proc.Id) /T /F" | Out-Null }
}
