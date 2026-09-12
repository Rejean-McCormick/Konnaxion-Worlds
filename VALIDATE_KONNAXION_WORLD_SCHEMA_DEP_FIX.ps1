& {
    $Root = $PSScriptRoot
    $Backend = Join-Path $Root 'backend'
    $Py = Join-Path $Backend '.venv\Scripts\python.exe'
    $Schema = Join-Path $Backend 'konnaxion\worlds\services\schema.py'

    Write-Host '=== KX WORLD SCHEMA DEPENDENCY FIX VALIDATION ===' -ForegroundColor Cyan

    if (-not (Test-Path -LiteralPath $Py)) {
        Write-Host '[FAIL] backend\.venv Python missing' -ForegroundColor Red
        return
    }
    if (-not (Test-Path -LiteralPath $Schema)) {
        Write-Host '[FAIL] schema.py missing' -ForegroundColor Red
        return
    }

    $Text = Get-Content -LiteralPath $Schema -Raw
    if ($Text -notmatch '_safe_dependency_marker_nodes') {
        Write-Host '[FAIL] dependency marker fix missing' -ForegroundColor Red
        return
    }
    Write-Host '[PASS] dependency marker fix present' -ForegroundColor Green

    $env:USE_DOCKER = 'no'
    $env:DJANGO_SETTINGS_MODULE = 'config.settings.local'
    Set-Location $Backend

    $Check = @(
        & $Py manage.py shell -c @'
from konnaxion.worlds.services.schema import DEFAULT_DOMAIN_APPS, _safe_dependency_marker_nodes

nodes = _safe_dependency_marker_nodes(DEFAULT_DOMAIN_APPS)
assert ('users', '0001_initial') in nodes
assert ('users', '0003_remove_user_avatar_user_profile_artwork') not in nodes
assert ('users', '0004_user_avatar') not in nodes
assert ('users', '0005_user_account_type_user_is_ethikos_elite_and_more') not in nodes
print('users.0001 marker = SAFE')
print('users.0003+ markers = BLOCKED until kreative exists')
'@ 2>&1
    )
    $Code = $LASTEXITCODE
    $Check | ForEach-Object { Write-Host $_ }
    if ($Code -ne 0) {
        Write-Host '[FAIL] migration dependency graph validation failed' -ForegroundColor Red
        return
    }

    & $Py manage.py check
    if ($LASTEXITCODE -ne 0) {
        Write-Host '[FAIL] Django check failed' -ForegroundColor Red
        return
    }

    Write-Host 'VALIDATION_OK KX_WORLD_SCHEMA_DEP_FIX' -ForegroundColor Green
}
