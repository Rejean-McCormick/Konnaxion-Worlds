param(
  # Racine du projet (répertoire où se trouve manage.py)
  [string]$Root = "C:\MonCode\KonnaxionV14\konnaxion",

  # Apps Django (app labels) à inclure dans l'ERD
  [string]$Apps = "ethikos,keenkonnect,konnected,kreative,kollective_intelligence,users",

  # Fichier image de sortie
  [string]$OutFile = ".\docs\erd.png",

  # Si -RelationsSeulement est précisé, on masque les champs et on ne montre que les relations
  [switch]$RelationsSeulement
)

$ErrorActionPreference = "Stop"
Set-Location $Root

# Crée le dossier de sortie si besoin
$dir = Split-Path -Parent $OutFile
if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

# Choisir Python
$pycmd = (Get-Command py -ErrorAction SilentlyContinue)
if ($pycmd) { $PY = $pycmd.Source } else { $PY = (Get-Command python -ErrorAction Stop).Source }

# Créer/activer venv
if (-not (Test-Path ".\.venv\Scripts\Activate.ps1")) { & $PY -m venv .venv }
. ".\.venv\Scripts\Activate.ps1"

# Dépendances Python
& python -m pip install --upgrade pip
$installed = $false
try {
  pip install django-extensions pygraphviz | Out-Null
  $installed = $true
} catch {
  Write-Warning "pygraphviz a échoué; tentative fallback pydot+graphviz (Python)."
}
if (-not $installed) {
  pip install django-extensions pydot graphviz | Out-Null
}

# Vérifier Graphviz côté système (dot.exe)
if (-not (Get-Command dot -ErrorAction SilentlyContinue)) {
  Write-Warning "Graphviz ('dot') introuvable dans le PATH. Installe-le (ex.: choco install graphviz -y), r Ouvre PowerShell et relance le script."
}

# Settings shim : tente local -> base -> production sans modifier ton repo
$shimPath = Join-Path (Get-Location) "temp_settings_for_graph_models.py"
$shim = @"
from importlib import import_module
_candidates = ["config.settings.local", "config.settings.base", "config.settings.production"]
_base = None
_last_err = None
for m in _candidates:
    try:
        _base = import_module(m)
        break
    except Exception as e:
        _last_err = e
if _base is None:
    raise _last_err or ImportError("No usable Django settings module found among %r" % _candidates)

for _k in dir(_base):
    if _k.isupper():
        globals()[_k] = getattr(_base, _k)

try:
    INSTALLED_APPS = list(INSTALLED_APPS)
except NameError:
    INSTALLED_APPS = []
if "django_extensions" not in INSTALLED_APPS:
    INSTALLED_APPS.append("django_extensions")
"@
Set-Content -Path $shimPath -Value $shim -Encoding UTF8

# Construire les arguments graph_models
$appsArgs = @()
if ($Apps -and $Apps.Trim() -ne "") {
  $appsArgs = $Apps.Split(",") | ForEach-Object { $_.Trim() }
} else {
  $appsArgs = @("-a")  # toutes les apps
}

$extra = @("-g")  # group by app
if ($RelationsSeulement) { $extra += "--disable-fields" }

$cmdArgs = @("manage.py","graph_models") + $appsArgs + $extra + @("-o",$OutFile,"--settings","temp_settings_for_graph_models")

Write-Host ">> python $($cmdArgs -join ' ')" -ForegroundColor Cyan
& python @cmdArgs

# Nettoyage
Remove-Item $shimPath -ErrorAction SilentlyContinue
Write-Host "OK: $OutFile" -ForegroundColor Green
