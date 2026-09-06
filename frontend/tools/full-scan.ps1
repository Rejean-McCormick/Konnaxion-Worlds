param(
  [switch]$KeepFrontend
)

# tools/full-scan.ps1
# Exécute tous les checks et écrit les rapports dans .\reports\
# Usage: pwsh -NoProfile -ExecutionPolicy Bypass -File tools/full-scan.ps1

$ErrorActionPreference = "Continue"

$root = (Get-Location).Path
$reports = Join-Path $root "reports"
$summaryFile = Join-Path $reports "_summary.txt"

$script:overallExit = 0
$script:failedSteps = [System.Collections.Generic.List[string]]::new()

# Local full-scan defaults. Existing explicit values are preserved.
if ([string]::IsNullOrWhiteSpace($env:API_PROXY_BASE)) {
  $env:API_PROXY_BASE = "http://localhost:8000/api"
}
if ([string]::IsNullOrWhiteSpace($env:INTERNAL_API_BASE)) {
  $env:INTERNAL_API_BASE = $env:API_PROXY_BASE
}

if (Test-Path $reports) {
  Remove-Item -Recurse -Force $reports
}
New-Item -ItemType Directory -Force -Path $reports | Out-Null

function Set-StepFailure([string]$name) {
  $script:overallExit = 1
  if (-not $script:failedSteps.Contains($name)) {
    $script:failedSteps.Add($name)
  }
}

function Run-Step([string]$name, [string]$cmd, [string]$outfile) {
  Write-Host "▶ $name"

  $outputPath = Join-Path $reports $outfile

  cmd.exe /d /s /c $cmd 2>&1 |
    Tee-Object -FilePath $outputPath |
    Out-Null

  $code = $LASTEXITCODE
  if ($null -eq $code) {
    $code = 1
  }

  Add-Content -Path $summaryFile -Value ("[{0}] exit={1}" -f $name, $code)

  if ($code -ne 0) {
    Set-StepFailure $name
  }

  return $code
}

function Stop-ProcessTree([int]$ProcessId) {
  if (-not (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue)) {
    return
  }

  # taskkill /T closes the full Node/Next tree so no descendant can retain
  # redirected stdout/stderr handles and keep a parent runner blocked.
  & taskkill.exe /PID $ProcessId /T /F *> $null

  if ($LASTEXITCODE -ne 0 -and (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue)) {
    Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
  }
}

function Stop-ExistingFrontend3000 {
  $listener = Get-NetTCPConnection `
    -LocalPort 3000 `
    -State Listen `
    -ErrorAction SilentlyContinue |
    Select-Object -First 1

  if (-not $listener) {
    return $false
  }

  $pid3000 = $listener.OwningProcess
  $processInfo = Get-CimInstance `
    Win32_Process `
    -Filter "ProcessId=$pid3000" `
    -ErrorAction SilentlyContinue

  $commandLine = [string]$processInfo.CommandLine

  if (
    $processInfo.Name -ne "node.exe" -or
    $commandLine -notmatch '(?i)\bnext\b.*\bstart\b'
  ) {
    throw "Port 3000 occupé par un processus qui n'est pas Next start (PID $pid3000)."
  }

  Write-Host "▶ Arrêt du Next existant sur 3000 (PID $pid3000)"
  Stop-ProcessTree $pid3000

  for ($attempt = 1; $attempt -le 20; $attempt++) {
    $stillListening = Get-NetTCPConnection `
      -LocalPort 3000 `
      -State Listen `
      -ErrorAction SilentlyContinue

    if (-not $stillListening) {
      return $true
    }

    Start-Sleep -Milliseconds 250
  }

  throw "Le port 3000 est toujours occupé après l'arrêt de l'ancien Next."
}

function Start-SmokeServer([int]$port) {
  $node = (Get-Command node.exe -ErrorAction Stop).Source
  $nextBin = Join-Path $root "node_modules\next\dist\bin\next"

  if (-not (Test-Path $nextBin)) {
    throw "Next CLI introuvable: $nextBin"
  }

  $stdout = Join-Path $reports "5_next_smoke_server_stdout.txt"
  $stderr = Join-Path $reports "5_next_smoke_server_stderr.txt"

  $process = Start-Process `
    -FilePath $node `
    -ArgumentList @($nextBin, "start", "-p", [string]$port) `
    -WorkingDirectory $root `
    -RedirectStandardOutput $stdout `
    -RedirectStandardError $stderr `
    -WindowStyle Hidden `
    -PassThru

  $baseUrl = "http://localhost:$port"
  $ready = $false

  for ($attempt = 1; $attempt -le 60; $attempt++) {
    if ($process.HasExited) {
      break
    }

    try {
      $response = Invoke-WebRequest `
        "$baseUrl/healthz" `
        -SkipHttpErrorCheck `
        -TimeoutSec 2

      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        $ready = $true
        break
      }
    }
    catch {
      # Server is still starting.
    }

    Start-Sleep -Milliseconds 500
    $process.Refresh()
  }

  if (-not $ready) {
    if (-not $process.HasExited) {
      Stop-ProcessTree $process.Id
    }

    throw "Le serveur Next smoke n'est pas devenu prêt sur $baseUrl."
  }

  return @{
    Process = $process
    BaseUrl = $baseUrl
  }
}

# 1) TypeScript
Run-Step `
  "TypeScript" `
  "pnpm exec tsc -p tsconfig.json --noEmit --pretty false" `
  "1_typescript.txt" | Out-Null

# 2) ESLint
if (Test-Path ".\node_modules\.bin\eslint.cmd") {
  # ESLint 9: use the supported default formatter.
  Run-Step `
    "ESLint" `
    "pnpm exec eslint . --ext .ts,.tsx --max-warnings=0" `
    "2_eslint.txt" | Out-Null
} else {
  Add-Content -Path $summaryFile -Value "[ESLint] SKIPPED (non installé)"
}

# 3) Next build
# A running `next start` must be stopped before replacing .next; otherwise the
# server can keep references to chunks from the previous build.
$frontendWasRunning = Stop-ExistingFrontend3000

$buildCode = Run-Step `
  "Next build" `
  'set "CI=1" && pnpm exec next build' `
  "3_next_build.txt"

# 4) Jest
if (Test-Path ".\node_modules\.bin\jest.cmd") {
  Run-Step `
    "Jest" `
    "pnpm exec jest --passWithNoTests" `
    "4_jest.txt" | Out-Null
} else {
  Add-Content -Path $summaryFile -Value "[Jest] SKIPPED (non installé)"
}

# 5) Playwright smoke
if (Test-Path ".\node_modules\.bin\playwright.cmd") {
  $smokeServer = $null
  $oldSmokeBase = $env:SMOKE_BASE_URL
  $oldSmokeGate = $env:SMOKE_GATE
  $oldCi = $env:CI

  try {
    if ($buildCode -ne 0) {
      Add-Content -Path $summaryFile -Value "[Playwright SMOKE] SKIPPED (Next build failed)"
    } else {
      Write-Host "▶ Playwright smoke server"
      $smokeServer = Start-SmokeServer 3000

      $env:SMOKE_BASE_URL = $smokeServer.BaseUrl
      $env:SMOKE_GATE = "1"
      $env:CI = "1"

      Run-Step `
        "Playwright SMOKE" `
        "pnpm exec playwright test -c playwright.smoke.config.ts --reporter=line" `
        "5_playwright_smoke.txt" | Out-Null
    }
  }
  catch {
    Add-Content -Path $summaryFile -Value "[Playwright SMOKE] exit=1"
    Add-Content -Path (Join-Path $reports "5_playwright_smoke.txt") -Value $_.Exception.Message
    Set-StepFailure "Playwright SMOKE"
  }
  finally {
    $env:SMOKE_BASE_URL = $oldSmokeBase
    $env:SMOKE_GATE = $oldSmokeGate
    $env:CI = $oldCi

    if ($null -ne $smokeServer -and $null -ne $smokeServer.Process) {
      $pidToStop = $smokeServer.Process.Id

      if ($frontendWasRunning -and $KeepFrontend) {
        Write-Host (
          "Next frais conservé sur http://localhost:3000 (PID {0}) (-KeepFrontend)" -f $pidToStop
        )
      }
      elseif (Get-Process -Id $pidToStop -ErrorAction SilentlyContinue) {
        Write-Host ("▶ Arrêt du serveur Next smoke (PID {0})" -f $pidToStop)
        Stop-ProcessTree $pidToStop
      }
    }
  }
} else {
  Add-Content -Path $summaryFile -Value "[Playwright SMOKE] SKIPPED (non installé)"
}

# 6) Scan patterns PowerShell (anti-patterns ciblés)
$patterns = @(
  @{ name="router.query";               rx="router\.query" },
  @{ name="moment import/use";          rx="\bmoment\b" },
  @{ name="TextArea autosize";          rx="\bautosize\s*=" },
  @{ name="ProTable render(v)";         rx="render:\s*\(v" },
  @{ name="Countdown value non-number"; rx="Statistic\.Countdown\s*value=\{[^}]+\}" },
  @{ name="useRequest<1 generic>";       rx="useRequest<[^,>]+>" },
  @{ name="legacy api import";           rx="from\s+['""](\.\.\/)+api['""]" }
)

$scanFile = Join-Path $reports "6_patterns.txt"
"### Pattern scan" | Out-File -FilePath $scanFile -Encoding utf8

$scanReadErrors = 0

Get-ChildItem -Path $root -Recurse -File -Include *.ts,*.tsx |
  Where-Object {
    $_.FullName -notmatch '\\(?:node_modules|\.next|reports|coverage|playwright-report|test-results|artifacts)\\'
  } |
  ForEach-Object {
    $file = $_.FullName

    try {
      $text = Get-Content -Raw -LiteralPath $file -ErrorAction Stop
    }
    catch {
      $scanReadErrors++
      Add-Content -Path $scanFile -Value (
        "`n-- READ ERROR`n{0}`n  {1}" -f $file, $_.Exception.Message
      )
      return
    }

    if ([string]::IsNullOrEmpty($text)) {
      return
    }

    foreach ($p in $patterns) {
      $matches = [regex]::Matches(
        $text,
        $p.rx,
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
      )

      if ($matches.Count -eq 0) {
        continue
      }

      Add-Content -Path $scanFile -Value ("`n-- {0}`n{1}" -f $file, $p.name)

      $lines = Get-Content -LiteralPath $file
      foreach ($match in $matches) {
        $lineNum = (
          $lines |
            Select-String -SimpleMatch $match.Value |
            Select-Object -First 1
        ).LineNumber

        Add-Content -Path $scanFile -Value (
          "  L{0}: {1}" -f $lineNum, $match.Value.Trim()
        )
      }
    }
  }

if ($scanReadErrors -gt 0) {
  Add-Content -Path $summaryFile -Value ("[Pattern scan] exit=1 read_errors={0}" -f $scanReadErrors)
  Set-StepFailure "Pattern scan"
} else {
  Add-Content -Path $summaryFile -Value "[Pattern scan] exit=0"
}

Write-Host ""
Write-Host "=== Résumé ==="
Get-Content $summaryFile

if ($script:failedSteps.Count -gt 0) {
  Write-Host ""
  Write-Host ("FAILED STEPS: {0}" -f ($script:failedSteps -join ", ")) -ForegroundColor Red
}

Write-Host "Rapports dans: $reports"

exit $script:overallExit
