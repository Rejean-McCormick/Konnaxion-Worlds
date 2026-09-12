$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
$Manager = Join-Path $Root 'Konnaxion_World_Manager.pyw'
$Python = Join-Path $Root 'backend\.venv\Scripts\python.exe'

Write-Host '=== WORLD MANAGER THREADSAFE VALIDATION ===' -ForegroundColor Cyan
if (-not (Test-Path $Manager)) { throw "Manager absent: $Manager" }
if (-not (Test-Path $Python)) { throw "Python absent: $Python" }

$Text = Get-Content -LiteralPath $Manager -Raw
if ($Text -match 'command=lambda c=command: self\._run_async\(c\)') { throw 'Ancien dispatch Tkinter worker encore présent.' }
if ($Text -notmatch 'ttk\.Button\(actions, text=label, command=command\)') { throw 'Dispatch main-thread attendu absent.' }
if ($Text -notmatch 'self\._run_async\(work\)') { throw 'Offload DB attendu absent.' }

& $Python -m py_compile $Manager
if ($LASTEXITCODE -ne 0) { throw 'Compilation Python échouée.' }

Write-Host '[PASS] dialogs Tkinter sur main thread' -ForegroundColor Green
Write-Host '[PASS] DB/subprocess hors main thread' -ForegroundColor Green
Write-Host '[PASS] compilation Python' -ForegroundColor Green
Write-Host 'VALIDATION TERMINEE - World Manager threadsafe' -ForegroundColor Green
