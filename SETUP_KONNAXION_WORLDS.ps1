param(
    [string]$DatabaseUrl = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Venv = Join-Path $Root ".venv"
$Python = Join-Path $Venv "Scripts\python.exe"
$Requirements = Join-Path $Root "backend\requirements-worlds.txt"

if (-not (Test-Path $Python)) {
    $py = Get-Command py -ErrorAction SilentlyContinue
    if ($py) {
        & py -3 -m venv $Venv
    } else {
        $pythonCmd = Get-Command python -ErrorAction Stop
        & $pythonCmd.Source -m venv $Venv
    }
}

& $Python -m pip install --upgrade pip
& $Python -m pip install -r $Requirements

if ($DatabaseUrl) {
    @(
        "KONNAXION_WORLDS_DATABASE_URL=$DatabaseUrl",
        "KONNAXION_WORLDS_DEBUG=true"
    ) | Set-Content -Encoding UTF8 (Join-Path $Root ".env")
} elseif (-not (Test-Path (Join-Path $Root ".env"))) {
    Copy-Item (Join-Path $Root ".env.example") (Join-Path $Root ".env")
    Write-Warning "Created .env from .env.example. Set KONNAXION_WORLDS_DATABASE_URL before using the World Manager."
}

Push-Location (Join-Path $Root "backend")
try {
    & $Python worlds_manage.py check
} finally {
    Pop-Location
}

Write-Host "Konnaxion Worlds standalone environment ready." -ForegroundColor Green
