& {
    $Root = $PSScriptRoot
    $Schema = Join-Path $Root 'backend\konnaxion\worlds\services\schema.py'
    $Py = Join-Path $Root 'backend\.venv\Scripts\python.exe'

    Write-Host '=== KONNAXION WORLD MIGRATION LEDGER FIX ===' -ForegroundColor Cyan

    if (-not (Test-Path -LiteralPath $Schema)) {
        throw '[FAIL] schema.py absent'
    }

    $Text = Get-Content -LiteralPath $Schema -Raw
    foreach ($Needle in @(
        'def _deduplicate_migration_records',
        'duplicate.id > keeper.id',
        'WHERE NOT EXISTS (',
        '_deduplicate_migration_records(primary_schema)',
        'def _safe_dependency_marker_nodes'
    )) {
        if (-not $Text.Contains($Needle)) {
            throw "[FAIL] marqueur absent: $Needle"
        }
    }
    Write-Host '[PASS] dependency safety + dedup + idempotent seed présents' -ForegroundColor Green

    if (-not (Test-Path -LiteralPath $Py)) {
        throw '[FAIL] backend\.venv\Scripts\python.exe absent'
    }

    & $Py -m py_compile $Schema
    if ($LASTEXITCODE -ne 0) {
        throw '[FAIL] schema.py ne compile pas'
    }
    Write-Host '[PASS] schema.py compile' -ForegroundColor Green

    Push-Location (Join-Path $Root 'backend')
    try {
        & $Py manage.py check
        if ($LASTEXITCODE -ne 0) {
            throw '[FAIL] Django check'
        }
        Write-Host '[PASS] Django check' -ForegroundColor Green
    }
    finally {
        Pop-Location
    }

    Write-Host '[OK] Fix ledger prêt. Relancer Démarrer Bridge.' -ForegroundColor Green
}
