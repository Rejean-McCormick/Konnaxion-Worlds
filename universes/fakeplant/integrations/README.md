# FakePlant — liaison Orgo (préparation)

`orgo.tandem.json` relie le pack **Konnaxion_Worlds/universes/fakeplant**
au pack **Orgo_Worlds/world-packs/fakeplant**.

Ce fichier n'est **pas** un seed Django ni un chargeur Orgo. Il est ignoré par
l'activation canonique `worlds_apply_universe`. Il n'injecte aucune donnée,
n'ouvre aucun accès et ne modifie pas la visibilité public/privé.

Le préflight Capsule Manager vérifie les clés, 6 Worlds et 18 checkpoints.
Les écritures Orgo restent sous l'autorité de `tools/scenario-injector`, avec
identité, permissions et confirmation explicite. Aucune base n'est partagée.
