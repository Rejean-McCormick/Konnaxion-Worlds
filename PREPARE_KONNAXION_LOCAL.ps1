$ErrorActionPreference = 'Stop'

& {
    $Root = $PSScriptRoot
    $Backend = Join-Path $Root 'backend'
    $EnvFile = Join-Path $Backend '.env'
    $VenvPython = Join-Path $Backend '.venv\Scripts\python.exe'
    $Requirements = Join-Path $Backend 'requirements\local.txt'

    if (-not (Test-Path (Join-Path $Backend 'manage.py'))) {
        throw 'backend\manage.py introuvable.'
    }

    function Get-EnvValueFromFile([string]$Path, [string]$Key) {
        if (-not (Test-Path $Path)) { return $null }
        $Line = Get-Content -LiteralPath $Path -ErrorAction Stop |
            Where-Object { $_ -match ('^\s*' + [regex]::Escape($Key) + '\s*=') } |
            Select-Object -First 1
        if (-not $Line) { return $null }
        return ($Line -split '=', 2)[1].Trim().Trim('"').Trim("'")
    }

    function Set-EnvValue([string]$Path, [string]$Key, [string]$Value) {
        $Lines = @()
        if (Test-Path $Path) {
            $Lines = @(Get-Content -LiteralPath $Path -ErrorAction Stop)
        }
        $Pattern = '^\s*' + [regex]::Escape($Key) + '\s*='
        $Found = $false
        for ($i = 0; $i -lt $Lines.Count; $i++) {
            if ($Lines[$i] -match $Pattern) {
                $Lines[$i] = "$Key=$Value"
                $Found = $true
                break
            }
        }
        if (-not $Found) {
            $Lines += "$Key=$Value"
        }
        Set-Content -LiteralPath $Path -Value $Lines -Encoding utf8NoBOM
    }

    Write-Host "`n=== CONFIGURATION LOCALE ===" -ForegroundColor Cyan

    $DatabaseUrl = $env:KONNAXION_DATABASE_URL
    if (-not $DatabaseUrl) { $DatabaseUrl = $env:DATABASE_URL }
    if (-not $DatabaseUrl) { $DatabaseUrl = Get-EnvValueFromFile $EnvFile 'DATABASE_URL' }

    # One-time compatibility import from the old Docker container metadata.
    # The secret is copied directly to backend/.env and is never printed.
    if (-not $DatabaseUrl) {
        $Docker = Get-Command docker -ErrorAction SilentlyContinue
        if ($Docker) {
            $Line = docker inspect `
                --format '{{range .Config.Env}}{{println .}}{{end}}' `
                konnaxion_local_django 2>$null |
                Where-Object { $_ -match '^DATABASE_URL=' } |
                Select-Object -First 1
            if ($Line) {
                $DatabaseUrl = ($Line -split '=', 2)[1]
                Write-Host '[OK] DATABASE_URL importée depuis les métadonnées Docker historiques (valeur masquée).' -ForegroundColor Green
            }
        }
    }

    if (-not $DatabaseUrl) {
        Write-Host 'Définis KONNAXION_DATABASE_URL dans cette session puis relance ce script. Ne colle pas la valeur dans le chat.' -ForegroundColor Yellow
        throw 'DATABASE_URL introuvable.'
    }

    Set-EnvValue $EnvFile 'DATABASE_URL' $DatabaseUrl
    Set-EnvValue $EnvFile 'USE_DOCKER' 'no'
    Set-EnvValue $EnvFile 'REDIS_URL' 'redis://127.0.0.1:6379/0'
    Set-EnvValue $EnvFile 'EMAIL_HOST' '127.0.0.1'
    Write-Host '[OK] backend\.env prêt (secret non affiché).' -ForegroundColor Green

    Write-Host "`n=== PYTHON 3.12 / VENV ===" -ForegroundColor Cyan
    if (-not (Test-Path $VenvPython)) {
        $PyLauncher = Get-Command py -ErrorAction SilentlyContinue
        if ($PyLauncher) {
            & py -3.12 -m venv (Join-Path $Backend '.venv')
        }
        else {
            $Python = Get-Command python -ErrorAction SilentlyContinue
            if (-not $Python) {
                throw 'Python 3.12 introuvable.'
            }
            $Version = & python -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")'
            if ($Version -ne '3.12') {
                throw "Python 3.12 requis; python pointe vers $Version."
            }
            & python -m venv (Join-Path $Backend '.venv')
        }
        if ($LASTEXITCODE -ne 0 -or -not (Test-Path $VenvPython)) {
            throw 'création de .venv échouée.'
        }
        Write-Host '[OK] .venv créé avec Python 3.12.' -ForegroundColor Green
    }
    else {
        $Version = & $VenvPython -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")'
        if ($Version -ne '3.12') {
            throw "backend\.venv utilise Python $Version; Python 3.12 requis."
        }
        Write-Host '[OK] .venv Python 3.12 existant réutilisé.' -ForegroundColor Green
    }

    Write-Host "`n=== PIP / DÉPENDANCES ===" -ForegroundColor Cyan
    & $VenvPython -m ensurepip --upgrade
    if ($LASTEXITCODE -ne 0) { throw 'ensurepip a échoué.' }
    & $VenvPython -m pip install -r $Requirements
    if ($LASTEXITCODE -ne 0) {
        throw 'installation des dépendances échouée.'
    }

    $env:DATABASE_URL = $DatabaseUrl
    $env:KONNAXION_DATABASE_URL = $DatabaseUrl
    $env:USE_DOCKER = 'no'
    $env:DJANGO_SETTINGS_MODULE = 'config.settings.local'
    if (-not $env:REDIS_URL) { $env:REDIS_URL = 'redis://127.0.0.1:6379/0' }

    Write-Host "`n=== DJANGO CHECK ===" -ForegroundColor Cyan
    Push-Location $Backend
    try {
        & $VenvPython manage.py check
        if ($LASTEXITCODE -ne 0) {
            throw 'Django check a échoué.'
        }
        Write-Host '[OK] Runtime Konnaxion local prêt: venv + pip, sans dépendance au package manager uv.' -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
}
