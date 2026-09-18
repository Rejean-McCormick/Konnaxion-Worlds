param(
    [int]$Port = 8301
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $repo 'backend'
$venvPython = Join-Path $backend '.venv\Scripts\python.exe'
Set-Location $backend

function Get-UvCommand {
    $cmd = Get-Command uv -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    return $null
}

$uv = Get-UvCommand
if (-not (Test-Path $venvPython)) {
    Write-Host '[Konnaxion/Koali] Creating Python 3.12 virtual environment...'
    if ($uv) {
        & $uv venv .venv --python 3.12
    } elseif (Get-Command py -ErrorAction SilentlyContinue) {
        & py -3.12 -m venv .venv
    } else {
        throw 'Python 3.12 environment missing. Install uv or Python 3.12 (py launcher).'
    }
    if ($LASTEXITCODE -ne 0) { throw 'Failed to create Konnaxion virtual environment.' }
}

& $venvPython -c 'import celery, django, uvicorn' 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host '[Konnaxion/Koali] Installing backend dependencies into .venv...'
    if ($uv) {
        & $uv pip install --python $venvPython -r requirements\local.txt
    } else {
        & $venvPython -m pip install -r requirements\local.txt
    }
    if ($LASTEXITCODE -ne 0) { throw 'Konnaxion dependency installation failed.' }
}

$env:DJANGO_SETTINGS_MODULE = 'config.settings.local'
Write-Host '[Konnaxion/Koali] Applying migrations...'
& $venvPython manage.py migrate --noinput
if ($LASTEXITCODE -ne 0) { throw 'Konnaxion migrations failed.' }

Write-Host "[Konnaxion/Koali] Starting API on http://127.0.0.1:$Port"
& $venvPython -m uvicorn config.asgi:application --host 127.0.0.1 --port $Port --reload
exit $LASTEXITCODE
