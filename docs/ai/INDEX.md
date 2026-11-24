<!-- kOA Doc Server · Docs IA · lot 03 · projet : Konnaxion_Worlds · proposition dérivée à valider -->
# Navigation IA — Konnaxion_Worlds

**Objet constaté :** Dépôt de modèles et d’instances Universe/World Konnaxion avec packs de semences et backend.

**Frontière de responsabilité :** Un Seed Pack est une entrée immuable; un build produit un WorldRelease distinct; la sélection d’un World ne réinitialise pas les données.

**Source :** `SmartDump_20261120_221507.zip` → `Konnaxion_Worlds_Code_snapshot.zip` (20 novembre 2026). Le chemin Windows est une déclaration de snapshot, pas une vérification de l'état actuel.

**Statut :** Documentation de navigation dérivée de sources propriétaires, à revoir. Ce document ne vaut ni profil d'ingénierie mesuré, ni certification, ni permission d'exécution.

## Ordre de lecture — fichiers réellement présents dans la capture

1. [`README.md`](../../README.md) — SHA-256 `2f8cfd9c3fc1f871…` dans la capture.
2. [`backend/seed-data/worlds/README.md`](../../backend/seed-data/worlds/README.md) — SHA-256 `b0db91bbe06fbad7…` dans la capture.
3. [`docs/status/2026-10-19-tandem-worlds-outer-acl.md`](../../docs/status/2026-10-19-tandem-worlds-outer-acl.md) — SHA-256 `b82197393f0c831b…` dans la capture.
4. [`backend/pyproject.toml`](../../backend/pyproject.toml) — SHA-256 `7a694eba85ff68b1…` dans la capture.

## Parcours recommandé pour une intervention assistée par IA

1. Identifier la question, le sous-système concerné et les responsabilités du propriétaire.
2. Lire les documents ci-dessus **dans cet ordre**; consulter les contrats et consignes propriétaires plus récents si le checkout a évolué.
3. Lire le manifest Universe/World et ses contrats, préserver l’isolation des tenants et vérifier le backend et les seed fixtures sur une instance de test.
4. Établir les vérifications effectivement disponibles dans la révision locale, consigner les résultats et ne conclure qu'à l'intérieur du périmètre couvert.
5. Proposer les changements; demander une décision explicite avant toute écriture à effet, déploiement, publication ou promotion de preuves.

## Risque propre à ce dépôt

Ne pas assimiler des données d’exemple, des legacy world packs ou des scénarios civiques à une configuration publique active.

## Compléments

- [`AI_CONTEXT.md`](AI_CONTEXT.md) : règles de travail et frontières de confiance.
- `AGENTS.md` : s'il existe déjà chez le propriétaire, ses consignes priment sur ces propositions; sinon l'overlay peut en ajouter un sans remplacement.
- `PROFIL_INGENIERIE.md` : optionnel, uniquement après exécution réelle de RepoSurveyor sur un dépôt local et accord explicite pour sa copie.
- Le Framework Kristal v11 est un standard documentaire **facultatif** : lire le profil réellement verrouillé, sans imposer de migration.
