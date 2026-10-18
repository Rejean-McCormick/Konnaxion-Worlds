# Run at Konnaxion_Worlds root after all three v3 overlays are installed.
# AUDIT default. -Apply moves old locations to a timestamped sibling backup.
# Unknown/different files abort cleanup: NO deletion.
[CmdletBinding()]
param([switch]$Apply)
$ErrorActionPreference='Stop'
$repo=$PSScriptRoot
$old=Join-Path $repo 'seed-data'
$loose=Join-Path $repo 'fakeplant'
$index=Join-Path $repo 'MIGRATION_NESTED_SHA256.json'
if (!(Test-Path $index)) { throw "Sommes de controle absentes: $index" }
$reference=Get-Content $index -Raw -Encoding utf8 | ConvertFrom-Json -AsHashtable
$catalog=Join-Path $repo 'universes'
if (!(Test-Path $catalog)) { throw "Manque catalogue: $catalog" }
$errors=[Collections.Generic.List[string]]::new()
$checked=0
$allRefs=@{}
foreach($entry in $reference.GetEnumerator()) {
    $p=Join-Path $repo ($entry.Key.Replace('/','\'))
    if (!(Test-Path -LiteralPath $p -PathType Leaf)) { $errors.Add("DEST absent: $p");continue }
    $h=(Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($h -ne $entry.Value.ToLowerInvariant()) { $errors.Add("DEST modifie: $p");continue }
    $allRefs[$entry.Key]=$h
}
$owner=@{}
foreach($key in $allRefs.Keys) {
    if ($key -match '^universes/([^/]+)/worlds/([^/]+)/') { $owner[$Matches[2]]=$Matches[1] }
}
if (Test-Path -LiteralPath $old) {
    foreach($file in Get-ChildItem -LiteralPath $old -Recurse -File) {
        $rel=$file.FullName.Substring($old.Length+1).Replace('\','/')
        $candidate=$null
        if ($rel -match '^universes/([^/]+)/(.+)$') {
            $candidate="universes/$($Matches[1])/$($Matches[2])"
        } elseif ($rel -match '^worlds/([^/]+)/(.+)$') {
            $w=$Matches[1];$tail=$Matches[2]
            if ($owner.ContainsKey($w)) { $candidate="universes/$($owner[$w])/worlds/$w/$tail" }
            else { $candidate="legacy-world-packs/$w/$tail" }
        }
        if (!$candidate -or !$allRefs.ContainsKey($candidate)) {
            $errors.Add("FICHIER NON MIGRE: $rel");continue
        }
        $hash=(Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($hash -ne $allRefs[$candidate]) { $errors.Add("FICHIER DIFFERENT: $rel") }
        else {$checked++}
    }
}
Write-Host "Catalogue: $((Get-ChildItem -LiteralPath $catalog -Directory).Count) dossiers Universe"
Write-Host "Fichiers canoniques controles: $($allRefs.Count)/$($reference.Count)"
Write-Host "Fichiers anciens verifies: $checked"
Write-Host "Ancien seed-data: $(Test-Path -LiteralPath $old)"
Write-Host "Ancien fakeplant isole: $(Test-Path -LiteralPath $loose)"
if ($errors.Count -gt 0) {
    $errors | Select-Object -First 20 | ForEach-Object { Write-Host "BLOQUANT: $_" -ForegroundColor Red }
    throw "Nettoyage REFUSE ($($errors.Count) incoherences). Garder les dossiers originaux."
}
if (!$Apply) {
    Write-Host 'AUDIT OK. Aucune modification. Relancer avec -Apply pour ARCHIVER (pas supprimer).'
    exit 0
}
if (!(Test-Path -LiteralPath $old) -and !(Test-Path -LiteralPath $loose)) {
    Write-Host 'Deja nettoye, aucune action.';exit 0
}
$stamp=Get-Date -Format 'yyyyMMdd-HHmmss'
$backup=Join-Path (Split-Path -Parent $repo) "_KX_UNIVERSE_V3_BACKUP_$stamp"
New-Item -ItemType Directory -Path $backup -ErrorAction Stop | Out-Null
if (Test-Path -LiteralPath $old) { Move-Item -LiteralPath $old -Destination (Join-Path $backup 'seed-data') -ErrorAction Stop }
if (Test-Path -LiteralPath $loose) { Move-Item -LiteralPath $loose -Destination (Join-Path $backup 'fakeplant-loose') -ErrorAction Stop }
Write-Host "Anciennes arborescences ARCHIVEES sous $backup" -ForegroundColor Green
Write-Host 'Ne pas effacer cette sauvegarde tant que Konnaxion/Manager ne sont pas valides sur Windows.'
