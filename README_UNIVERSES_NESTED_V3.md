# Konnaxion_Worlds — catalogue canonique imbriqué v3

**Source unique** : `C:\mycode\Konnaxion\Konnaxion_Worlds\universes\`.

```text
universes/
  unesco/universe.yaml
  unesco/worlds/unesco-commons/world.yaml
  ...
  cuba-2026/universe.yaml
  cuba-2026/worlds/cuba-koali-offline/world.yaml
  kristal-farms/universe.yaml
  kristal-farms/worlds/kf-fr-ovhcloud/world.yaml
  levis/universe.yaml
  levis/worlds/levis-direction-generale/world.yaml
  fakeplant/universe.yaml
  fakeplant/worlds/fp-administration/world.yaml
  konvergence-koali/universe.yaml
  konvergence-koali/worlds/...
```

**6 Universes / 55 World Packs**, chacun avec son scénario original; **10 autres packs historiques** sauvegardés dans `legacy-world-packs/` et non découverts/chargés automatiquement. Ils ne sont pas associés de force à un des six Universes.

### Règles

- Un Universe est **une unité de portabilité** : `universe.yaml` et tous ses `worlds/<seed_pack_key>/world.yaml`, scénarios et ressources.
- Le moteur Worlds v0.3.7 découvre `universes/*/universe.yaml` et `universes/*/worlds/*/world.yaml` à partir de la même racine. Les identités, versions, relations, visibilités et contrôles de sécurité restent appliqués par le moteur.
- Pas de `seed-data` actif, pas de dossier `fakeplant` autonome à la racine, pas de copie dans `Konnaxion/backend/seed-data` pour une nouvelle installation.
- Le runtime a besoin de **deux variables pointant vers le même dossier `.../Konnaxion_Worlds/universes`** : `KONNAXION_WORLD_SEED_ROOT` et `KONNAXION_UNIVERSE_SEED_ROOT`.
- Déposer le dossier ≠ enregistrer en base. En développement, le lanceur Konnaxion lance une **validation + import uniquement des nouvelles clés Universe** à chaque démarrage. Les Universes déjà installés ne sont jamais re-promus automatiquement.
- Par défaut, FakePlant et Konvergence Koali sont **privés**. Ils restent invisibles pour les visiteurs anonymes, même installés. Le Manager expose leur visibilité YAML et DB.

### Ne pas supprimer de données à l'aveugle

Après l'extraction des trois overlays et les tests, à la racine Worlds :

```powershell
pwsh -NoProfile -File .\MIGRATE_NESTED_CLEANUP.ps1
# Seulement quand l'audit PASS et que le nouveau catalogue marche :
pwsh -NoProfile -File .\MIGRATE_NESTED_CLEANUP.ps1 -Apply
```

Le nettoyage **déplace** `seed-data` et `fakeplant` isolé vers `C:\mycode\Konnaxion\_KX_UNIVERSE_V3_BACKUP_<date>`. Il refuse une source différente ou non migrée. Ne pas effacer ces sauvegardes avant la validation Windows.

`C:\mycode\Konnaxion\konnaxion-universe-seed-standard-v1.1` est **obsolète**. Il n'est plus requis pour la découverte, le chargement ou la gestion; il peut être archivé/supprimé **après** les tests du nouveau système. Ne jamais le réinjecter dans l'arborescence canonique.
