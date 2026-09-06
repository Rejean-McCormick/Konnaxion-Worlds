# Concatène des app/**/page.tsx dans un TXT avec index.
# PowerShell 7+ recommandé.
[CmdletBinding()]
param(
  # Liste explicite de chemins (relatifs au repo) - optionnel
  [string[]]$Paths,

  # Fichier texte contenant une liste de chemins (un par ligne) - optionnel
  [string]$ListFile,

  # Tente d'extraire les pages fautives depuis la sortie de `tsc --noEmit` (.next/types...) - optionnel
  [switch]$AutoFromTsc,

  # Chemin de sortie du TXT final (par défaut artifacts/pages_concat_YYYYMMDD_HHMMSS.txt)
  [string]$OutFile
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# Racine du projet
$here = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$root = (Resolve-Path (Join-Path $here '.')).Path

# Dossier artifacts
$artifacts = Join-Path $root 'artifacts'
if (-not (Test-Path $artifacts)) { New-Item -ItemType Directory -Path $artifacts | Out-Null }

# Résolution liste de fichiers
function Get-PagesFromTsc {
  $lines = @(& pnpm exec tsc --noEmit 2>&1 | ForEach-Object { "$_" })
  $hits = $lines |
    Where-Object { $_ -match '\.next[\\/]types[\\/].+typeof import\(".*?/app/.+?/page"\)' } |
    ForEach-Object {
      if ($_ -match 'import\(".*?/app/(.+?)/page"\)') { "app/$($matches[1])/page.tsx" }
    } | Sort-Object -Unique
  return ,$hits
}

# 1) Collecte des chemins
$pagePaths = @()
if ($Paths -and $Paths.Count -gt 0) {
  $pagePaths += $Paths
} elseif ($ListFile) {
  if (-not (Test-Path $ListFile)) { throw "ListFile introuvable: $ListFile" }
  $pagePaths += (Get-Content -Raw -Path $ListFile) -split "`r?`n" | Where-Object { $_ -and -not $_.StartsWith('#') }
} elseif ($AutoFromTsc) {
  $pagePaths += Get-PagesFromTsc
} else {
  # Fallback: tout app/**/page.tsx
  $pagePaths += Get-ChildItem -Recurse -File (Join-Path $root 'app') -Filter 'page.tsx' |
                ForEach-Object { $_.FullName.Substring($root.Length).TrimStart('\','/') }
}

# Normalisation / existence
$pagePaths = $pagePaths | Where-Object { $_ } | Sort-Object -Unique
if ($pagePaths.Count -eq 0) {
  throw "Aucun fichier page.tsx trouvé. Fournis -Paths, -ListFile, ou -AutoFromTsc."
}

# Prépare la sortie
if (-not $OutFile) {
  $stamp = (Get-Date).ToString('yyyyMMdd_HHmmss')
  $OutFile = Join-Path $artifacts ("pages_concat_{0}.txt" -f $stamp)
}

# 2) Construit l'index et concatène
$records = @()
$totalFiles = 0
$totalLines = 0

foreach ($rel in $pagePaths) {
  $abs = Join-Path $root $rel
  if (-not (Test-Path $abs)) { continue }
  $text = Get-Content -Raw -Path $abs -Encoding UTF8
  $lines = ($text -split "`r?`n").Count
  $totalFiles++
  $totalLines += $lines
  $records += [pscustomobject]@{
    idx   = $totalFiles
    file  = $rel
    lines = $lines
    text  = $text
  }
}

# 3) Ecrit le TXT
$nl = "`r`n"
$sb = New-Object System.Text.StringBuilder

# En-tête
[void]$sb.AppendLine("PAGES CONCATENEES")
[void]$sb.AppendLine("Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
[void]$sb.AppendLine("Racine: $root")
[void]$sb.AppendLine("Fichiers: $totalFiles   Lignes: $totalLines")
[void]$sb.AppendLine("")

# Index
[void]$sb.AppendLine("=== INDEX ===")
foreach ($r in $records) {
  [void]$sb.AppendLine(("{0,3}. {1}  ({2} lignes)" -f $r.idx, $r.file, $r.lines))
}
[void]$sb.AppendLine("")
[void]$sb.AppendLine("=== CONTENU ===")
[void]$sb.AppendLine("")

# Contenu
foreach ($r in $records) {
  [void]$sb.AppendLine(("----- [{0}] {1} ({2} lignes) -----" -f $r.idx, $r.file, $r.lines))
  [void]$sb.AppendLine($r.text)
  [void]$sb.AppendLine("")
}

# Sauvegarde UTF-8
[System.IO.File]::WriteAllText($OutFile, $sb.ToString(), [System.Text.Encoding]::UTF8)

Write-Host "OK -> $OutFile"
