# FakePlant — source des packs Konnaxion_Worlds

Les six `seed-data/worlds/fp-*` et le manifeste `seed-data/universes/fakeplant` sont les packs d'installation de FakePlant. Leur source canonique reste le Kristal Organisation Portable v1.1; `fakeplant/fixture/` est une projection non modifiable.

Inclus : 900 profils fictifs (non authentifiables), 2 736 appartenances, 47 sujets Ethikos, 16 consultations, 29 projets keenKonnect, 116 messages et 87 tâches conservés en fixtures versionnées. La commande `worlds_apply_universe` importe les scénarios **Ethikos**; elle ne peuple **pas automatiquement** keenKonnect, ni le répertoire des 900 employés, ni les dossiers Orgo. Ceux-ci demandent les commandes correspondantes dans les dépôts hôtes.

Tous les contenus sont fictifs. Aucun lien vers une vraie compagnie, personne ou ERP.

## Test local (sans écriture)

`python tools/fakeplant/validate.py`

## Préparation / déploiement

La commande `worlds_apply_universe` nécessite un Django/PostgreSQL configuré et des chemins de seeds pointant sur les bons répertoires. Pour éviter les chemins par défaut différents de l’installation autonome, partir de `Konnaxion` (application principale), synchroniser les packs avec `python tools/fakeplant/sync_from_worlds.py --apply`, puis utiliser l'outil d'administration Worlds habituel. Exécuter l'installation d'identités seulement après promotion des Worlds.

**Non couvert :** round-trip complet de mutations, déconnexion transactionnelle du Kristal, import natif keenKonnect, autorisations en production. Ne pas confondre la présence des fixtures et leur matérialisation.
