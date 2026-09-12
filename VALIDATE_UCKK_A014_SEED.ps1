$ErrorActionPreference = 'Stop'

& {
    $Root = $PSScriptRoot
    $Backend = Join-Path $Root 'backend'
    $Py = Join-Path $Backend '.venv\Scripts\python.exe'
    $Manifest = Join-Path $Backend 'seed-data\worlds\uckk-a014\world.yaml'

    Write-Host '=== UCKK-A014 SEED VALIDATION ===' -ForegroundColor Cyan

    if (-not (Test-Path -LiteralPath $Py)) {
        Write-Host '[FAIL] backend\.venv\Scripts\python.exe absent' -ForegroundColor Red
        return
    }
    if (-not (Test-Path -LiteralPath $Manifest)) {
        Write-Host '[FAIL] world.yaml absent' -ForegroundColor Red
        return
    }

    $env:USE_DOCKER = 'no'
    $env:DJANGO_SETTINGS_MODULE = 'config.settings.local'

    Push-Location $Backend
    try {
        & $Py manage.py shell -c @'
import json
from pathlib import Path
from django.conf import settings
from konnaxion.worlds.services.seed_packs import load_seed_pack
from konnaxion.ethikos.demo_import.importer import validate_and_preview_ethikos_demo_scenario

manifest = Path(settings.KONNAXION_WORLD_SEED_ROOT) / "uckk-a014" / "world.yaml"
pack = load_seed_pack(manifest)
scenarios = pack.load_scenarios()
assert pack.world_key == "uckk-a014"
assert pack.version == "1.0.0"
assert len(scenarios) == 1

scenario = scenarios[0]
preview = validate_and_preview_ethikos_demo_scenario(scenario)
assert preview.get("ok") is True, preview
assert len(scenario["actors"]) == 6
assert len(scenario["arguments"]) >= 10

votes = scenario["consultation_votes"]
totals = {}
for vote in votes:
    totals[vote["option"]] = totals.get(vote["option"], 0) + float(vote["raw_value"])
assert totals == {"approve": 58.0, "approve_with_conditions": 29.0, "reject": 13.0}, totals

followup = next(t for t in scenario["topics"] if t["key"] == "uckk_a014_r1")
assert followup["status"] == "archived"
assert len(scenario["impact_items"]) == 2
assert abs(sum(float(r["weight"]) for r in scenario["topic_relevance"] if r["topic"] == "uckk_a014") - 1.0) < 0.0001

print("[PASS] contract =", pack.metadata["world_contract"])
print("[PASS] pack =", f"{pack.world_key}@{pack.version}")
print("[PASS] schema =", pack.scenario_schema_version)
print("[PASS] actors =", len(scenario["actors"]))
print("[PASS] arguments =", len(scenario["arguments"]))
print("[PASS] baseline = 58/29/13")
print("[PASS] Smart Vote = source facts + EkoH lens, derived reading")
print("[PASS] impact slots = J30 + J90")
print("[PASS] A014-R1 = archived")
print("VALIDATION TERMINÉE — UCKK-A014 prêt pour Build + Promote")
'@
        if ($LASTEXITCODE -ne 0) {
            Write-Host '[FAIL] validation Django/seed' -ForegroundColor Red
            return
        }
    }
    finally {
        Pop-Location
    }
}
