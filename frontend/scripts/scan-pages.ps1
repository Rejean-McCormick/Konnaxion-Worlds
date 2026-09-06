# Scan des app/**/page.tsx problématiques et export CSV
[CmdletBinding()]
param(
  [string]$ProjectRoot,
  [string]$OutDir
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# Résolution des chemins même si on exécute inline
$here = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
if (-not $ProjectRoot) { $ProjectRoot = (Resolve-Path (Join-Path $here '..')).Path }
if (-not $OutDir)      { $OutDir      = Join-Path $ProjectRoot 'artifacts' }

$root = Resolve-Path $ProjectRoot
Set-Location $root
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }

Write-Host "Running TypeScript check..."
# Force tableau de lignes
$tscOut = @(& pnpm exec tsc --noEmit 2>&1 | ForEach-Object { "$_" })
$tscLogPath = Join-Path $OutDir "tsc.log"
$tscOut | Set-Content -Encoding UTF8 $tscLogPath

# Erreurs directes sur app/**/page.tsx
$pageErr1 = @(
  $tscOut |
    Where-Object { $_ -match 'app[\\/].+?[\\/]page\.tsx:\d+:\d+\s+-\s+error\s+TS' } |
    ForEach-Object {
      if ($_ -match '(app[\\/].+?[\\/]page\.tsx)') { ($matches[1] -replace '\\','/') }
    }
) | Where-Object { $_ }

# Erreurs indirectes via .next/types (default export manquant)
$pageErr2 = @(
  $tscOut |
    Where-Object { $_ -match '\.next[\\/]types[\\/].+typeof import\(".*?/app/.+?/page"\)' } |
    ForEach-Object {
      if ($_ -match 'import\(".*?/app/(.+?)/page"\)') { "app/$($matches[1])/page.tsx" }
    }
) | Where-Object { $_ }

# Fusion sûre → tableau
[array]$problemFiles = @()
if ($pageErr1) { $problemFiles += $pageErr1 }
if ($pageErr2) { $problemFiles += $pageErr2 }
$problemFiles = $problemFiles | Sort-Object -Unique

Write-Host "Analyzing page files..."
$pagesOnDisk = Get-ChildItem -Recurse -File -Path (Join-Path $root 'app') -Filter 'page.tsx' |
  ForEach-Object { $_.FullName.Substring($root.Path.Length).TrimStart('\','/') }

# Si aucune erreur tsc repérée, on scanne quand même les antipatterns
$targets = if ((@($problemFiles)).Count -gt 0) { $problemFiles } else { $pagesOnDisk }

function Test-FileFlag {
  param([string]$path)
  $text = Get-Content -Raw -Path $path
  $hasDefaultExport = ($text -match '(?m)^\s*export\s+default\s+')
  $usesNextPage    = ($text -match '\bNextPage\b')
  $usesGetLayout   = ($text -match '\.getLayout\s*=')
  $usesRouterQuery = ($text -match '\brouter\.query\b')
  $likelyReturnsJSX = ($text -match 'return\s*<')

  $needle = [regex]::Escape(($path -replace '\\','/'))
  $thisErrCount = (@($tscOut | Where-Object { $_ -match $needle })).Count

  [pscustomobject]@{
    file              = $path
    hasDefaultExport  = $hasDefaultExport
    likelyReturnsJSX  = $likelyReturnsJSX
    usesNextPage      = $usesNextPage
    usesGetLayout     = $usesGetLayout
    usesRouterQuery   = $usesRouterQuery
    tscErrorCount     = $thisErrCount
  }
}

$rows = foreach ($p in $targets) {
  $abs = Join-Path $root $p
  if (Test-Path $abs) { Test-FileFlag -path $abs }
}
$rows = @($rows)

$csv = Join-Path $OutDir "scan-pages.csv"
$rows | Sort-Object -Property @{Expression='tscErrorCount';Descending=$true}, file |
  Export-Csv -NoTypeInformation -Encoding UTF8 -Path $csv

Write-Host ""
Write-Host "Problematic pages (top 30 by tscErrorCount):"
$rows | Sort-Object -Property @{Expression='tscErrorCount';Descending=$true}, file |
  Select-Object -First 30 |
  Format-Table file, tscErrorCount, hasDefaultExport, usesNextPage, usesGetLayout, usesRouterQuery

Write-Host "`nPages totales:`t$(@($pagesOnDisk).Count)"
Write-Host "Pages en erreur:`t$(@($problemFiles).Count)"
Write-Host "CSV:`t`t$csv"
Write-Host "TSC log:`t$tscLogPath"
