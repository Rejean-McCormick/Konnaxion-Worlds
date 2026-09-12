$ErrorActionPreference = 'Stop'

& {
    $Root = $PSScriptRoot
    $Backend = Join-Path $Root 'backend'
    $Python = Join-Path $Backend '.venv\Scripts\python.exe'
    $Manager = Join-Path $Root 'Konnaxion_World_Manager.pyw'
    $Runner = Join-Path $Root 'RUN_backend_local.bat'
    $EnvFile = Join-Path $Backend '.env'

    $Failed = $false
    function Pass([string]$Text) { Write-Host "[PASS] $Text" -ForegroundColor Green }
    function Fail([string]$Text) { Write-Host "[FAIL] $Text" -ForegroundColor Red; Set-Variable -Name Failed -Value $true -Scope 1 }

    Write-Host "=== KONNAXION NO-UV VALIDATION ===" -ForegroundColor Cyan

    if (Test-Path $Python) { Pass 'backend\.venv\Scripts\python.exe' } else { Fail 'backend\.venv absent' }
    if (Test-Path $Manager) { Pass 'World Manager présent' } else { Fail 'World Manager absent' }
    if (Test-Path $Runner) { Pass 'RUN_backend_local.bat présent' } else { Fail 'RUN_backend_local.bat absent' }

    if (Test-Path $EnvFile) {
        $HasDb = Get-Content -LiteralPath $EnvFile | Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } | Select-Object -First 1
        $NoDocker = Get-Content -LiteralPath $EnvFile | Where-Object { $_ -match '^\s*USE_DOCKER\s*=\s*no\s*$' } | Select-Object -First 1
        if ($HasDb) { Pass 'DATABASE_URL configurée dans backend\.env (valeur non affichée)' } else { Fail 'DATABASE_URL absente de backend\.env' }
        if ($NoDocker) { Pass 'USE_DOCKER=no' } else { Fail 'USE_DOCKER=no absent de backend\.env' }
    }
    else {
        Fail 'backend\.env absent'
    }

    $Forbidden = '(?i)\buv\s+(venv|pip|sync|run|lock|add|remove|python|tool)\b|where\s+uv\b'
    $RuntimeFiles = @($Runner, $Manager, (Join-Path $Root 'AGENTS.md'))
    $Hits = @()
    foreach ($File in $RuntimeFiles) {
        if (Test-Path $File) {
            $Matches = Select-String -LiteralPath $File -Pattern $Forbidden -AllMatches
            if ($Matches) { $Hits += $Matches }
        }
    }
    if ($Hits.Count -eq 0) { Pass 'aucune dépendance au package manager uv dans le runtime canonique' } else { Fail 'référence runtime au package manager uv détectée' }

    if (Test-Path $Python) {
        & $Python -m py_compile $Manager
        if ($LASTEXITCODE -eq 0) { Pass 'World Manager compile' } else { Fail 'World Manager ne compile pas' }

        $env:USE_DOCKER = 'no'
        $env:DJANGO_SETTINGS_MODULE = 'config.settings.local'
        if (-not $env:REDIS_URL) { $env:REDIS_URL = 'redis://127.0.0.1:6379/0' }
        Push-Location $Backend
        try {
            & $Python manage.py check
            if ($LASTEXITCODE -eq 0) { Pass 'Django check' } else { Fail 'Django check' }

            & $Python manage.py showmigrations worlds
            if ($LASTEXITCODE -eq 0) { Pass 'World migrations lisibles' } else { Fail 'World migrations illisibles' }
        }
        finally {
            Pop-Location
        }
    }

    if ($Failed) {
        throw 'VALIDATION ÉCHOUÉE'
    }
    Write-Host "`nVALIDATION TERMINÉE — runtime venv/pip canonique" -ForegroundColor Green
}
