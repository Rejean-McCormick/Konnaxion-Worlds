# Konnaxion_Worlds — Tour 5/8 — ACL Universe → World

Ce pack se dépose à la racine `C:\mycode\Konnaxion\Konnaxion_Worlds`.
Aucune installation Python ni dépendance PostgreSQL n'est nécessaire pour les
9 tests autonomes. Les fichiers de correction sont dans `tools/tandem_tour_worlds/payload`.

Exécuter **dans cet ordre** :

```powershell
cd 'C:\mycode\Konnaxion\Konnaxion_Worlds'
.\PREVIEW_WORLDS_TOUR_P1.cmd
.\INSTALL_WORLDS_TOUR_P1.cmd
.\VERIFY_WORLDS_TOUR_P1.cmd
```

Retour arrière en cas de besoin : `.\ROLLBACK_WORLDS_TOUR_P1.cmd`.

Les sauvegardes sont conservées dans `C:\mycode\Konnaxion\Tandem_Local\worlds_tour_p1\backups`.
L'installateur compare SHA-256 et refuse les fichiers divergents. Il ne touche
ni aux bases Neon, ni aux services, ni aux autres univers ou personas.

La vérification autonome ne constitue PAS une qualification multi-tenant réelle.
Lire `docs/status/2026-10-19-tandem-worlds-outer-acl.md`.
