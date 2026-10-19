# TANDEM — Tour 5/8 — Konnaxion_Worlds P1 (2026-10-19)

## Objet et contrat

Le modèle canonique `KX-UNIVERSES-1` indique que l'accès à un Universe est une
**frontière externe de gouvernance** (voir `docs/Technical-Reference/Worlds/20_UNIVERSES.md`).
Le runtime et le catalogue vérifiaient déjà ce périmètre, mais `can_manage_world()`
acceptait auparavant un mainteneur/membre ou créateur de World sans vérifier
que son accès à l'Universe privé parent était toujours valide.

## Modification ciblée

Le résolveur commun vérifie désormais `can_access_universe()` AVANT les droits
de gestion d'un World. Le changement s'applique aux API et chemins qui réutilisent
`can_manage_world()`: édition, publications, souscriptions, gestion des membres,
build, promotion, rollback et snapshots.

- L'appartenance active à un Universe privé est obligatoire pour les gestionnaires
  du World (sauf propriétaire/créateur de l'Universe ou personnel global autorisé).
- Dans un Universe public, les ACL du World restent inchangées.
- Un World public ne rend jamais public un Universe privé.
- Pas de changement au modèle, aux migrations, aux contenus des Universe Packs,
  aux WorldReleases, ni aux six Worlds FakePlant.
- Aucune activation du SSO ou connexion à Konfid n'est incluse.

## Qualification

Les neuf tests autonomes rejouent le code exact des fonctions de permission via
son AST, sans dépendre de Django et sans accès réseau. Six tests Django natifs
sont ajoutés au dépôt pour la prochaine campagne **sur une DB de test isolée**.
L'installation n'exécute PAS ces tests Django et n'ouvre jamais Neon.

Contrôles à terminer : suite Django, séparation des schémas PostgreSQL,
publication et promotion concurrentes, isolation multi-World sur le runtime,
FakePlant 900 personas, redéploiement du paquet dans le runtime hôte.

Les environnements hôtes Konnaxion et les services Docker doivent être actualisés
séparément, avec qualification de release. Cette installation modifie uniquement
les fichiers sources du dépôt Konnaxion_Worlds.
