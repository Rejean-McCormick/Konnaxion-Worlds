$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Python = Join-Path $Root ".venv\Scripts\python.exe"

if (-not (Test-Path $Python)) {
    throw "Missing .venv. Run SETUP_KONNAXION_WORLDS.ps1 first."
}

$Required = @(
    "backend\worlds_manage.py",
    "backend\worlds_config\settings.py",
    "backend\worlds_config\urls.py",
    "backend\konnaxion\worlds\models.py",
    "backend\konnaxion\worlds\services\schema.py"
)
foreach ($Relative in $Required) {
    if (-not (Test-Path (Join-Path $Root $Relative))) {
        throw "Missing standalone file: $Relative"
    }
}

Push-Location (Join-Path $Root "backend")
try {
    & $Python -m compileall -q konnaxion worlds_config worlds_manage.py
    if ($LASTEXITCODE -ne 0) { throw "Python compile check failed." }
    & $Python worlds_manage.py check
    if ($LASTEXITCODE -ne 0) { throw "Django system check failed." }
} finally {
    Pop-Location
}

Write-Host "Konnaxion Worlds standalone validation OK." -ForegroundColor Green
