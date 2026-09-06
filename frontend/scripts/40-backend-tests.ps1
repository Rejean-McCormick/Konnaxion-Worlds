# 40-backend-tests.ps1
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$root = Resolve-Path "$PSScriptRoot\.."
$venvPy = Join-Path $root ".venv\Scripts\python.exe"
if (-not (Test-Path $venvPy)) { throw "Venv manquant. Lance d'abord 00-setup.ps1." }

Set-Location "$root\backend"
$env:DJANGO_SETTINGS_MODULE = "config.settings.test"

# Vérifie la config et exécute les tests
& $venvPy manage.py check
& $venvPy -m pytest -q
