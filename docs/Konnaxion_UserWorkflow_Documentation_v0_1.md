# Konnaxion — Documentation légère des User Workflows

Version: v0.1
Statut: brouillon de travail
Format: document unique, non exhaustif
Objectif: décrire les parcours utilisateur principaux sans transformer le document en spécification complète écran par écran.
Périmètre: Konnaxion, avec accent sur ethiKos, Smart Vote/EkoH, keenKonnect, KonnectED et Kreative.
Principe: raconter les parcours comme des expériences utilisateur, puis relier chaque parcours aux modules, sous-modules et sorties attendues.


## 1. Intention du document

- Ce document sert de base commune pour comprendre comment un utilisateur traverse Konnaxion.
- Il ne remplace pas les contrats techniques, les routes, les modèles ou les plans de migration.
- Il transforme l’architecture modulaire en parcours compréhensibles par des humains.
- Il reste volontairement non exhaustif.
- Il ne décrit pas chaque bouton, chaque état d’erreur ou chaque permission fine.
- Il identifie les moments où un module commence, où un autre prend le relais, et ce que l’utilisateur comprend à chaque étape.
- Il aide aussi les futures sessions d’IA à générer des écrans, des textes d’aide ou des tickets sans réinventer les workflows.

Le document répond à une question simple:

> Si une personne utilise Konnaxion pour apprendre, délibérer, décider, construire, collaborer ou publier une œuvre, quel chemin suit-elle?


## 2. Règles de cadrage

- Un seul document.
- Pas exhaustif.
- Environ 1000 lignes.
- Style lisible, narratif et fonctionnel.
- Pas une spec technique complète.
- Pas une liste de tous les endpoints.
- Pas une matrice complète de permissions.
- Pas une réécriture de l’architecture.
- Pas de nouvelle route inventée.
- Pas de nouveau shell d’interface.
- Les modules existants restent les points d’entrée.
- Les sous-modules expliquent les parcours, mais ne remplacent pas les modules.


## 3. Structure de lecture

- Chaque module est présenté par son rôle utilisateur.
- Chaque sous-module est présenté par ce que l’utilisateur veut accomplir.
- Chaque parcours est décrit avec une situation concrète.
- Les sorties attendues sont indiquées quand elles sont importantes.
- Les intégrations Kintsugi/Kompendio sont mentionnées seulement aux endroits pertinents.
- Les annexes futures sont distinguées des capacités natives.
- Les workflows sont racontés en langage produit, pas en langage base de données.


## 4. Définitions rapides

- **Module:** Grand domaine fonctionnel de Konnaxion, par exemple ethiKos ou KonnectED.
- **Sous-module:** Capacité plus précise à l’intérieur d’un module, par exemple Korum, Konsultations ou CertifiKation.
- **Workflow utilisateur:** Chemin parcouru par une personne pour atteindre un résultat compréhensible.
- **Sortie utilisateur:** Résultat visible ou utile: vote, certificat, projet, archive, portefeuille, décision, rapport, etc.
- **Baseline:** Lecture brute ou non pondérée d’un résultat.
- **Reading / Lens:** Lecture déclarée d’un résultat, par exemple pondérée ou filtrée.
- **Kintsugi:** Approche d’intégration harmonisée de capacités externes ou open-source sous un même toit, sans fusion brute.
- **Kompendio:** Couche de références, standards, fiches, charts et packs réutilisables.


## 5. Vue d’ensemble des modules

Konnaxion peut être lu comme une boucle complète:

```text
Apprendre
→ se qualifier
→ participer
→ délibérer
→ décider
→ construire
→ documenter
→ publier
→ mesurer l’impact
```

- **ethiKos:** délibération, consultation, décision, impact et légitimité.
- **Kollective Intelligence:** réputation, expertise, EkoH, Smart Vote et lectures de résultats.
- **keenKonnect:** exécution de projets, collaboration, stockage et références de build.
- **KonnectED:** apprentissage, ressources, évaluations, certifications et preuves de compétence.
- **Kreative:** création, patrimoine, archives, expositions, collaboration créative et profils.


## 6. Personas de référence

- **Maya — citoyenne participante:** veut comprendre un débat et voter sans être experte.
- **Nadia — facilitatrice:** veut organiser une consultation et éviter que le débat devienne chaotique.
- **Samuel — expert métier:** veut contribuer sans imposer son autorité comme vérité unique.
- **Lina — apprenante:** veut suivre un parcours, prouver ses compétences et obtenir une certification.
- **Omar — builder:** veut coordonner un projet, préserver les fichiers et produire un pack reproductible.
- **Ariane — artiste ou médiatrice culturelle:** veut publier une œuvre, l’archiver et collaborer.
- **Équipe admin — gouvernance et modération:** veut auditer, configurer, modérer et préserver la confiance.


## 7. Principes UX communs

- Toujours montrer à l’utilisateur où il se trouve dans le processus.
- Toujours séparer contribution, interprétation et décision.
- Toujours distinguer résultat brut et lecture enrichie.
- Toujours rendre les sorties importantes retrouvables.
- Toujours expliquer pourquoi une recommandation ou une pondération existe.
- Toujours éviter qu’un outil externe devienne une source de vérité cachée.
- Toujours permettre de revenir du résultat vers les contributions sources.
- Toujours préférer une interface simple avec des détails progressifs.


## 8. Parcours global: de l’idée à l’impact

Scénario: une communauté veut transformer une place publique.

1. Un problème est soumis dans une consultation.
2. Les propositions sont clarifiées.
3. Les citoyens formulent des arguments.
4. Les positions se structurent.
5. Un vote ou une décision est lancé.
6. Le résultat brut est publié.
7. Des lectures Smart Vote peuvent être comparées.
8. Une décision est adoptée ou rejetée.
9. Des actions d’implémentation sont suivies.
10. Les preuves et résultats sont rendus visibles.

Ce scénario traverse surtout ethiKos, Smart Vote, EkoH et éventuellement keenKonnect pour l’exécution.


## 9. ethiKos — rôle dans l’expérience

ethiKos est l’espace où une communauté transforme du bruit social en décision lisible.

- Il aide à capter les problèmes.
- Il aide à structurer les débats.
- Il aide à organiser la décision.
- Il aide à publier les résultats.
- Il aide à suivre l’impact.
- Il garde les faits sources séparés des lectures interprétatives.

ethiKos n’est pas seulement un forum. C’est un parcours de décision.


## 10. ethiKos — structure d’interface pré-Kintsugi

La visite utilise seulement la surface d’interface existante:

```text
/ethikos
├── /ethikos/decide/*
├── /ethikos/deliberate/*
├── /ethikos/trust/*
├── /ethikos/pulse/*
├── /ethikos/impact/*
├── /ethikos/learn/*
├── /ethikos/insights
└── /ethikos/admin/*
```

Kintsugi n’ajoute pas une nouvelle porte d’entrée visible.
Kintsugi améliore les capacités derrière cette structure.


## 11. ethiKos — histoire principale

Maya arrive dans ethiKos parce que sa ville discute du réaménagement d’une place publique.

Elle voit un sujet actif:

```text
Réaménagement de la Place des Rivières
État: consultation ouverte
Participation: forte
Décision: prévue après délibération
```

Maya ne sait pas encore si elle est pour ou contre.
Elle veut comprendre, contribuer, puis voter.

Le parcours proposé par l’interface est:

1. Lire les guides dans Learn.
2. Observer la situation dans Pulse.
3. Entrer dans le débat dans Deliberate.
4. Comprendre son contexte EkoH dans Trust.
5. Participer à la décision dans Decide.
6. Lire les résultats dans Decide Results ou Insights.
7. Suivre les actions dans Impact.


## 12. ethiKos / Learn — comprendre avant d’agir

Route typique: `/ethikos/learn/guides`

But utilisateur:
- Comprendre comment participer.
- Comprendre les règles de débat.
- Comprendre la différence entre vote brut et lecture pondérée.
- Comprendre le rôle de Smart Vote et EkoH.

Exemple de contenu affiché:

```text
Une délibération sert à comprendre les raisons.
Une décision sert à choisir une option.
Une baseline montre le résultat brut.
Une lecture Smart Vote montre une interprétation déclarée.
```

Workflow:
1. L’utilisateur ouvre Learn.
2. Il lit un guide court.
3. Il consulte le glossaire.
4. Il retourne vers Deliberate ou Decide.

Sortie attendue:
- L’utilisateur sait comment contribuer sans confondre débat, vote et résultat.


## 13. ethiKos / Pulse — observer le climat

Routes typiques:
- `/ethikos/pulse/overview`
- `/ethikos/pulse/live`
- `/ethikos/pulse/health`
- `/ethikos/pulse/trends`

But utilisateur:
- Voir ce qui se passe maintenant.
- Identifier les tensions.
- Identifier les convergences.
- Trouver où sa contribution peut être utile.

Exemple:

```text
Climat du débat:
- consensus partiel sur plus d’arbres
- désaccord fort sur le stationnement
- faible participation des commerçants
- augmentation des arguments sur l’accessibilité
```

Workflow:
1. L’utilisateur ouvre Pulse.
2. Il voit les tendances globales.
3. Il clique sur un signal de tension.
4. Il est redirigé vers le débat ou la décision liée.

Kintsugi:
- Les capacités de cartographie avancée peuvent s’inspirer de Polis.
- Polis reste différé dans la première passe.
- La première version peut mimer certaines idées sans annexion.


## 14. ethiKos / Deliberate — débattre avec structure

Routes typiques:
- `/ethikos/deliberate/elite`
- `/ethikos/deliberate/[topic]`
- `/ethikos/deliberate/guidelines`

But utilisateur:
- Lire une question publique ou experte.
- Comprendre les arguments.
- Exprimer une position.
- Ajouter une raison.
- Répondre à une raison.
- Repérer les preuves, objections et nuances.

Exemple de sujet:

```text
Faut-il réduire le stationnement autour de la Place des Rivières
pour créer plus d’espace piéton et végétalisé?
```

Exemple d’action:

```text
Maya choisit une stance +1.
Elle ajoute une nuance:
« Je suis favorable à plus d’espace vert,
mais seulement si des places accessibles restent près des commerces. »
```

Workflow:
1. L’utilisateur ouvre un topic.
2. Il lit la thèse ou la question.
3. Il consulte les arguments pro et contre.
4. Il choisit une stance de -3 à +3.
5. Il ajoute un argument ou une objection.
6. Il répond à un argument existant.
7. Il suit les changements du débat.

Sorties attendues:
- Stance enregistrée.
- Argument ajouté.
- Graphe argumentatif enrichi.
- Débat plus lisible.

Kintsugi:
- Kialo-style argument mapping est mimé nativement.
- Consider.it-style reason capture est mimé nativement.
- Aucune route `/kialo` n’est créée.
- Les arguments restent des objets ethiKos/Korum.


## 15. ethiKos / Trust — comprendre le contexte de confiance

Routes typiques:
- `/ethikos/trust/profile`
- `/ethikos/trust/badges`
- `/ethikos/trust/credentials`

But utilisateur:
- Comprendre son profil EkoH.
- Voir ses domaines d’expertise.
- Comprendre ses badges.
- Gérer sa visibilité si disponible.
- Comprendre comment son contexte peut être utilisé dans certaines lectures.

Exemple:

```text
Profil EkoH de Maya
Domaine: participation citoyenne
Visibilité: pseudonyme public
Influence: utilisée seulement dans des lectures déclarées
```

Workflow:
1. L’utilisateur ouvre son profil Trust.
2. Il voit ses domaines et badges.
3. Il comprend sa confidentialité.
4. Il retourne vers une décision ou un débat.

Sorties attendues:
- L’utilisateur comprend que EkoH fournit un contexte.
- Il comprend que EkoH ne remplace pas son vote.

Kintsugi:
- EkoH reste natif.
- EkoH n’est pas un moteur de vote.
- EkoH fournit expertise, éthique, cohortes et snapshots.


## 16. ethiKos / Decide — participer à une décision

Routes typiques:
- `/ethikos/decide/public`
- `/ethikos/decide/elite`
- `/ethikos/decide/results`
- `/ethikos/decide/methodology`

But utilisateur:
- Lire la décision à prendre.
- Comprendre les options.
- Participer au vote si admissible.
- Voir la méthode de décision.
- Lire les résultats bruts et les lectures.

Exemple de décision:

```text
Quel scénario doit guider le réaménagement?
A. Place très végétalisée
B. Place mixte
C. Maintien du stationnement
D. Report de la décision
```

Workflow:
1. L’utilisateur ouvre Decide.
2. Il choisit une décision active.
3. Il lit les options.
4. Il consulte la méthode.
5. Il vote.
6. Il reçoit une confirmation.
7. Il revient lire les résultats.

Sorties attendues:
- Vote ou ballot enregistré.
- Résultat baseline disponible après clôture.
- Lectures Smart Vote disponibles si configurées.

Kintsugi:
- Smart Vote produit les lectures dérivées.
- EkoH peut fournir un snapshot de contexte.
- OpenSlides peut devenir une annexe future pour mode assemblée.
- All Our Ideas peut inspirer ou soutenir une priorisation future.
- Your Priorities peut inspirer une priorisation citoyenne future.
- Aucune annexe ne remplace la source de vérité ethiKos/Smart Vote.


## 17. ethiKos / Results — lire les résultats

Route typique: `/ethikos/decide/results`

But utilisateur:
- Comprendre ce qui a été décidé.
- Voir le résultat brut.
- Comparer les lectures déclarées.
- Comprendre la méthode.
- Vérifier que la lecture pondérée ne cache pas la baseline.

Exemple:

```text
Baseline:
Option B: 48%
Option A: 31%
Option C: 15%
Option D: 6%

Lecture expertise mobilité:
Option B reste première.
Option A augmente légèrement.
```

Workflow:
1. L’utilisateur ouvre les résultats.
2. Il voit la baseline.
3. Il active une lecture Smart Vote.
4. Il lit l’explication de la lecture.
5. Il peut revenir aux contributions sources.

Sorties attendues:
- Résultat lisible.
- Méthode transparente.
- Lectures comparables.


## 18. ethiKos / Impact — suivre après la décision

Routes typiques:
- `/ethikos/impact/feedback`
- `/ethikos/impact/outcomes`
- `/ethikos/impact/tracker`

But utilisateur:
- Voir ce qui arrive après une décision.
- Suivre les engagements.
- Ajouter du feedback.
- Voir les preuves d’exécution.
- Comprendre si la décision a réellement produit un changement.

Exemple:

```text
Décision adoptée:
Place mixte avec stationnement partiellement réduit

Actions:
1. Plan préliminaire
2. Consultation accessibilité
3. Test temporaire
4. Rapport d’impact
```

Workflow:
1. La décision est clôturée.
2. Des actions sont créées.
3. Un responsable ou une équipe est associé.
4. Des preuves et statuts sont publiés.
5. Les utilisateurs peuvent donner du feedback.
6. Le suivi est clôturé ou révisé.

Kintsugi:
- Les patterns d’accountability peuvent s’inspirer de Decidim ou CONSUL.
- Ils sont mimés nativement.
- L’exécution peut être liée à keenKonnect.
- La vérité d’impact reste dans ethiKos/Konsultations.


## 19. ethiKos / Insights — interpréter sans confondre

Route typique: `/ethikos/insights`

But utilisateur:
- Analyser les résultats.
- Comparer baseline et lectures.
- Explorer les cohortes.
- Lire les tendances.
- Comprendre l’évolution d’un débat.

Workflow:
1. L’utilisateur choisit un sujet ou une décision.
2. Il voit les faits sources.
3. Il compare les lectures.
4. Il filtre par cohorte ou période.
5. Il exporte ou partage un résumé si disponible.

Sorties attendues:
- Analyse lisible.
- Comparaison reproductible.
- Audit possible.


## 20. ethiKos / Admin — gouverner le système

Routes typiques:
- `/ethikos/admin/audit`
- `/ethikos/admin/moderation`
- `/ethikos/admin/roles`

But utilisateur admin:
- Auditer les contributions et résultats.
- Modérer les contenus signalés.
- Gérer les rôles.
- Gérer l’éligibilité.
- Préserver la traçabilité.

Workflow:
1. L’admin consulte les événements sources.
2. Il vérifie les lectures et snapshots.
3. Il traite les signalements.
4. Il ajuste les rôles ou permissions.
5. Il documente les actions importantes.

Kintsugi:
- Les annexes futures doivent rester isolées.
- Une annexe ne doit pas écrire dans les tables de Korum ou Konsultations.
- OpenSlides peut être envisagé pour un mode assemblée futur.
- Les sorties d’annexes doivent devenir des artefacts ou projections vérifiables.


## 21. Kollective Intelligence — rôle utilisateur

Kollective Intelligence n’est pas toujours visible comme un module narratif séparé.
Il fournit des capacités transversales qui apparaissent dans les workflows.

- EkoH rend visibles expertise, réputation, éthique et confiance.
- Smart Vote rend visibles les votes, modalités, résultats et lectures.
- Insights rend les résultats comparables.


## 22. EkoH — workflow utilisateur

But utilisateur:
- Comprendre son influence contextuelle.
- Voir ses domaines d’expertise.
- Comprendre son score éthique ou ses badges.
- Choisir une visibilité publique, pseudonyme ou privée si disponible.

Scénario:

```text
Samuel est urbaniste.
Il contribue à un débat sur la mobilité.
Son expertise peut être utilisée dans une lecture déclarée.
Le public voit toujours la baseline.
La lecture experte est seulement une interprétation supplémentaire.
```

Workflow:
1. L’utilisateur contribue dans un module.
2. Les signaux pertinents alimentent son profil.
3. EkoH calcule ou met à jour un contexte.
4. Le contexte peut être utilisé par Smart Vote.
5. Les changements restent auditables.

Sorties attendues:
- Profil de confiance.
- Domaines d’expertise.
- Historique ou trace.
- Snapshot utilisé pour une lecture.


## 23. Smart Vote — workflow utilisateur

But utilisateur:
- Voter selon une modalité déclarée.
- Voir le résultat brut.
- Comparer les lectures pondérées ou filtrées.
- Comprendre la méthode de calcul.

Workflow:
1. Une cible de vote est ouverte.
2. Une modalité est choisie.
3. L’utilisateur vote.
4. Le vote brut est enregistré.
5. Smart Vote calcule un résultat.
6. Des lectures peuvent être publiées.
7. Les résultats deviennent visibles dans ethiKos ou Insights.

Sorties attendues:
- Vote enregistré.
- VoteResult ou équivalent.
- Baseline.
- ReadingResults.
- Explication de méthode.


## 24. keenKonnect — rôle dans l’expérience

keenKonnect est l’espace où une décision, une idée ou un apprentissage peut devenir un projet réel.

- Konstruct sert à exécuter le projet.
- Stockage sert à préserver les fichiers et versions.
- Kompendio sert à guider le projet avec des références fiables.


## 25. keenKonnect / Konstruct — exécuter un projet

But utilisateur:
- Créer un projet.
- Inviter une équipe.
- Définir des tâches.
- Discuter.
- Joindre des ressources.
- Suivre l’avancement.

Scénario:

```text
Après la décision sur la place publique,
une équipe crée un projet keenKonnect:
« Prototype de mobilier temporaire pour la Place des Rivières ».
```

Workflow:
1. L’utilisateur ouvre le Project Studio.
2. Il crée ou rejoint un espace projet.
3. Il définit les rôles.
4. Il crée des tâches.
5. Il ajoute des ressources.
6. L’équipe communique dans le chat.
7. L’IA peut résumer les décisions et prochaines actions.

Sorties attendues:
- Projet.
- Équipe.
- Tâches.
- Messages.
- Ressources.
- Résumé ou recommandations.


## 26. keenKonnect / Stockage — préserver les artefacts

But utilisateur:
- Déposer des fichiers.
- Versionner des documents.
- Contrôler l’accès.
- Indexer les ressources.
- Retrouver ce qui a été utilisé.

Workflow:
1. L’utilisateur dépose un fichier dans un projet.
2. Le type et la taille sont validés.
3. Le fichier devient une ressource projet.
4. Une version est créée.
5. L’indexation rend le fichier retrouvable.
6. Les collaborateurs reçoivent une mise à jour.

Sorties attendues:
- ProjectResource.
- Historique de version.
- Permissions appliquées.
- Index de recherche.
- Événement de synchronisation.


## 27. keenKonnect / Kompendio — guider le build

But utilisateur:
- Trouver des plateformes ou références fiables.
- Comparer des références.
- Créer des Reference Charts.
- Attacher des stacks de référence à un projet.
- Exporter des packs réutilisables.

Scénario:

```text
Omar veut construire un banc modulaire.
Il cherche des références de matériaux, d’assemblage et de sécurité.
Kompendio lui fournit un stack de références vérifiées.
Ce stack est attaché au projet keenKonnect.
```

Workflow:
1. L’utilisateur recherche une plateforme de référence.
2. Il consulte une fiche.
3. Il vérifie les preuves.
4. Il ajoute une référence à un chart.
5. Le chart est revu.
6. Le chart est publié ou attaché au projet.
7. Un pack exportable est généré.

Sorties attendues:
- Reference Platform.
- Reference Chart.
- Reference Stack.
- Evidence artifact.
- Export pack.


## 28. keenKonnect — Release Pack

But utilisateur:
- Rendre un projet reproductible.
- Préserver les documents essentiels.
- Lier les références utilisées.
- Exporter une version partageable.

Workflow:
1. Le projet atteint une étape de publication.
2. Les fichiers importants sont sélectionnés.
3. Les références Kompendio sont épinglées.
4. Les tâches et décisions importantes sont résumées.
5. Un Release Pack est généré.
6. Le pack peut être archivé, partagé ou vérifié.

Sorties attendues:
- Manifest.
- Artefacts.
- Références épinglées.
- Versions.
- Éventuels checksums ou signatures.


## 29. KonnectED — rôle dans l’expérience

KonnectED est l’espace où l’utilisateur apprend, pratique, prouve, valide et certifie.

La boucle générale est:

```text
Learn → Measure → Validate → Certify → Follow-up
```

- Knowledge fournit les ressources et parcours.
- CertifiKation fournit évaluations, validations et certificats.
- Kompendio documente les standards, outils et références d’interopérabilité.


## 30. KonnectED / Knowledge — apprendre

But utilisateur:
- Explorer une bibliothèque.
- Trouver une ressource.
- Suivre un cours.
- Recevoir des recommandations.
- Participer à un forum.
- Contribuer à du contenu.

Scénario:

```text
Lina veut comprendre les bases de l’aménagement participatif.
Elle ouvre Knowledge.
Elle suit un module court.
Sa progression est enregistrée.
```

Workflow:
1. L’utilisateur ouvre le catalogue.
2. Il cherche une ressource.
3. Il ouvre un cours ou une leçon.
4. Il progresse dans le contenu.
5. Il pose une question dans le forum.
6. Il reçoit une recommandation.
7. Sa progression est mise à jour.

Sorties attendues:
- LearningProgress.
- KnowledgeRecommendation.
- ForumTopic ou ForumPost.
- CoCreationContribution si contribution.


## 31. KonnectED / CertifiKation — prouver et certifier

But utilisateur:
- Choisir un programme.
- Suivre des jalons.
- Passer une évaluation.
- Soumettre une preuve.
- Recevoir une validation pair ou mentor.
- Obtenir un certificat.
- Ajouter une preuve au portfolio.

Workflow:
1. L’utilisateur choisit une CertificationPath.
2. Il consulte les compétences attendues.
3. Il réalise les activités requises.
4. Il passe une évaluation.
5. Il soumet un artefact si nécessaire.
6. Un pair ou mentor valide.
7. Le certificat est émis.
8. Le portfolio est mis à jour.

Sorties attendues:
- Evaluation.
- PeerValidation.
- Certificate.
- Portfolio item.


## 32. KonnectED / Competence Evidence Layer

But utilisateur:
- Ne pas perdre les preuves d’apprentissage.
- Pouvoir relier cours, évaluations, artefacts et certificats.
- Rendre les compétences portables.

Exemple d’évidence:

```text
Qui: Lina
Quoi: module d’aménagement participatif
Quand: session du 12 mai
Résultat: 86%
Artefact: plan annoté
Vérification: mentor approuvé
```

Workflow:
1. Une activité produit une preuve.
2. La preuve est normalisée.
3. Elle peut alimenter une évaluation.
4. Elle peut soutenir un certificat.
5. Elle peut apparaître dans un portfolio.
6. Elle peut être exportée ou vérifiée.


## 33. KonnectED / Kompendio — standards et références

But utilisateur:
- Comprendre quels standards et outils soutiennent la portabilité.
- Documenter les choix d’intégration.
- Publier des fiches ou charts de référence.

Exemples de références:
- OIDC pour identité.
- LTI pour lancement d’outils.
- xAPI pour événements d’apprentissage.
- Open Badges pour credentials portables.
- H5P pour activités interactives.
- LRS pour journal d’apprentissage.

Workflow:
1. Une équipe identifie un standard ou outil.
2. Kompendio documente son rôle.
3. Le choix mimic ou annex est explicité.
4. Une fiche est publiée.
5. La fiche devient réutilisable dans les projets.


## 34. Kreative — rôle dans l’expérience

Kreative est l’espace de création, de conservation culturelle, d’archives, de galeries et de collaboration artistique.

- Konservation préserve œuvres, archives, traditions et expositions.
- Kontact relie les personnes, profils, opportunités et collaborations.


## 35. Kreative / Konservation — archiver et exposer

But utilisateur:
- Publier une œuvre.
- Ajouter des métadonnées.
- Créer une galerie.
- Soumettre une tradition culturelle.
- Créer une exposition virtuelle.
- Enrichir le catalogue avec des tags ou classifications.

Scénario:

```text
Ariane numérise une collection de photos locales.
Elle les ajoute à Konservation.
Elle crée une galerie virtuelle sur l’histoire d’un quartier.
```

Workflow:
1. L’utilisateur téléverse une œuvre ou un document.
2. Il ajoute titre, description, média, région ou provenance.
3. Le système génère ou propose des tags.
4. Un modérateur peut approuver si nécessaire.
5. L’œuvre rejoint une galerie ou archive.
6. Une exposition peut être publiée.

Sorties attendues:
- KreativeArtwork.
- Gallery.
- TraditionEntry.
- ArchiveDocument.
- VirtualExhibition.
- AICatalogueEntry.


## 36. Kreative / Kontact — rencontrer et collaborer

But utilisateur:
- Créer un profil professionnel.
- Trouver des collaborateurs.
- Voir des opportunités.
- Créer un espace de collaboration.
- Recevoir des recommandations ou endorsements.

Workflow:
1. L’utilisateur complète son profil.
2. Il lie des œuvres ou tags.
3. Il reçoit des suggestions de contacts.
4. Il répond à une opportunité.
5. Il ouvre ou rejoint un workspace.
6. Une collaboration produit une œuvre, une recommandation ou un signal de confiance.

Sorties attendues:
- Profil.
- CollabSession.
- Opportunity.
- Endorsement.
- Portfolio créatif enrichi.


## 37. Workflow transversal: apprendre puis participer

Scénario:

```text
Lina apprend les bases de l’aménagement participatif dans KonnectED.
Elle obtient une validation de compétence.
Elle participe ensuite à un débat ethiKos sur l’espace public.
Son contexte EkoH peut refléter progressivement son expertise.
```

Workflow:
1. Knowledge fournit le contenu.
2. CertifiKation valide une compétence.
3. Le portfolio garde la preuve.
4. EkoH peut refléter le domaine.
5. ethiKos utilise ce contexte dans certaines lectures.

Sortie utilisateur:
- L’apprentissage devient une capacité civique vérifiable.


## 38. Workflow transversal: décider puis construire

Scénario:

```text
Une communauté adopte une décision dans ethiKos.
Une équipe ouvre un projet dans keenKonnect.
Les artefacts sont stockés dans Stockage.
Les références sont attachées via Kompendio.
Un Release Pack documente le résultat.
```

Workflow:
1. Décision publiée.
2. Action d’impact créée.
3. Projet keenKonnect lié.
4. Équipe et tâches créées.
5. Fichiers et références ajoutés.
6. Pack reproductible publié.

Sortie utilisateur:
- La décision devient une réalisation traçable.


## 39. Workflow transversal: créer puis archiver

Scénario:

```text
Une artiste crée une œuvre avec une équipe.
La collaboration est organisée dans Kontact ou keenKonnect.
Le résultat est publié dans Kreative.
Les documents sont préservés dans Konservation.
```

Workflow:
1. Profil ou opportunité.
2. Collaboration.
3. Production d’un artefact.
4. Publication.
5. Archivage.
6. Exposition ou portfolio.

Sortie utilisateur:
- La création devient visible, attribuée et préservée.


## 40. États d’interface communs

Chaque workflow devrait prévoir au minimum:
- État vide: rien n’a encore été créé.
- État brouillon: l’utilisateur prépare une contribution.
- État en cours: une action est ouverte.
- État soumis: la contribution attend traitement.
- État publié: la sortie est visible.
- État archivé: la sortie reste consultable mais n’est plus active.
- État erreur: quelque chose bloque.
- État permission refusée: l’utilisateur comprend pourquoi.


## 41. États UX par type d’objet

- **Débat:** brouillon, ouvert, fermé, archivé
- **Consultation:** préparation, ouverte, clôturée, résultats publiés
- **Vote:** non ouvert, ouvert, soumis, clôturé
- **Projet:** idée, en cours, complété, validé
- **Tâche:** todo, doing, done, blocked
- **Ressource:** brouillon, publiée, versionnée, archivée
- **Évaluation:** non commencée, en cours, soumise, réussie, échouée
- **Certificat:** en attente, émis, révoqué si applicable
- **Œuvre:** brouillon, soumise, approuvée, publiée, archivée


## 42. Permissions — niveau narratif

Ce document ne définit pas toutes les permissions.
Il recommande seulement de présenter les rôles de manière compréhensible.

- Visiteur: peut lire ce qui est public.
- Membre: peut contribuer selon les règles.
- Contributeur vérifié: peut participer à certains espaces.
- Expert ou mentor: peut valider ou commenter dans son domaine.
- Owner ou responsable: peut gérer un projet, une consultation ou un contenu.
- Modérateur: peut traiter les signalements.
- Admin: peut configurer, auditer et gouverner.


## 43. Règles de lisibilité des résultats

- Toujours afficher le résultat brut quand il existe.
- Toujours nommer une lecture enrichie.
- Toujours expliquer les inputs d’une lecture.
- Toujours permettre de distinguer vote, stance, argument et lecture.
- Toujours éviter les scores opaques.
- Toujours relier un résultat à sa méthode.
- Toujours garder une trace de publication.


## 44. Règles Kintsugi dans les workflows

- Mimic signifie reproduire un pattern utile dans Konnaxion.
- Annex signifie connecter un outil isolé comme sidecar.
- La première passe privilégie le mimic natif.
- Une annexe ne doit pas capturer la vérité du module.
- Une annexe doit respecter identité, permissions, événements et export.
- Une annexe doit produire des artefacts ou projections vérifiables.
- Une annexe ne doit pas imposer un second shell utilisateur.


## 45. Où les annexes peuvent apparaître

- **OpenSlides:** mode assemblée formelle; zone: ethiKos / admin ou decide methodology; statut: future annexe isolée.
- **Your Priorities:** priorisation citoyenne; zone: ethiKos / consultations ou decide public; statut: future option.
- **All Our Ideas:** comparaison paire-à-paire; zone: ethiKos / priorisation; statut: future option.
- **Polis:** cartographie de consensus; zone: ethiKos / pulse ou insights; statut: différé.
- **H5P:** activités interactives; zone: KonnectED / Knowledge; statut: annexe possible.
- **LRS xAPI:** journal de preuves d’apprentissage; zone: KonnectED / evidence; statut: annexe possible.
- **InvenTree:** BOM/inventaire; zone: keenKonnect / Kintsugi lanes; statut: annexe possible.
- **Etherpad/HedgeDoc:** édition collaborative; zone: keenKonnect / docs; statut: annexe possible.
- **OpenSearch:** recherche; zone: transversal; statut: annexe possible.


## 46. Anti-patterns à éviter

- Transformer un workflow en liste d’endpoints.
- Cacher une décision derrière un score non expliqué.
- Faire croire qu’une lecture pondérée remplace le résultat brut.
- Créer un module externe visible pour chaque inspiration.
- Multiplier les menus au lieu de clarifier les parcours.
- Mélanger débat, vote, évaluation et réputation.
- Faire écrire une annexe dans les tables de vérité.
- Ajouter une nouvelle interface avant de clarifier la sortie utilisateur.


## 47. Gabarit court pour documenter un workflow

À utiliser pour les prochaines itérations:

```text
Nom du workflow:
Module:
Sous-module:
Utilisateur principal:
Situation de départ:
Objectif utilisateur:
Étapes:
1.
2.
3.
Sortie attendue:
États importants:
Permissions importantes:
Liens avec autres modules:
Kintsugi / Kompendio:
Questions ouvertes:
```


## 48. Exemple de fiche workflow: débat ethiKos

```text
Nom du workflow: Participer à un débat structuré
Module: ethiKos
Sous-module: Korum
Utilisateur principal: citoyen ou expert
Situation de départ: un sujet est ouvert
Objectif: comprendre les arguments et contribuer
Étapes:
1. Ouvrir le topic
2. Lire la thèse
3. Lire les arguments pro/con
4. Choisir une stance
5. Ajouter un argument
6. Répondre ou suivre
Sortie: stance + argument
Kintsugi: Kialo/Consider.it mimés nativement
```


## 49. Exemple de fiche workflow: certification KonnectED

```text
Nom du workflow: Obtenir une certification
Module: KonnectED
Sous-module: CertifiKation
Utilisateur principal: apprenant
Situation de départ: un programme est disponible
Objectif: prouver une compétence
Étapes:
1. Choisir un parcours
2. Suivre les ressources
3. Passer une évaluation
4. Soumettre une preuve
5. Recevoir validation
6. Obtenir certificat
Sortie: certificat + portfolio
Kintsugi: evidence layer + standards portables
```


## 50. Exemple de fiche workflow: projet keenKonnect

```text
Nom du workflow: Exécuter un projet reproductible
Module: keenKonnect
Sous-module: Konstruct + Stockage + Kompendio
Utilisateur principal: builder
Situation de départ: une idée ou décision doit être réalisée
Objectif: produire un projet documenté
Étapes:
1. Créer un projet
2. Inviter une équipe
3. Créer des tâches
4. Ajouter fichiers
5. Attacher références
6. Générer Release Pack
Sortie: projet + artefacts + références
Kintsugi: lanes open-source possibles
```


## 51. Priorités pour la prochaine version du document

- Transformer les workflows principaux en fiches homogènes.
- Ajouter les rôles par workflow.
- Ajouter les états UI minimums.
- Ajouter les erreurs ou blocages fréquents.
- Ajouter les sorties attendues par écran.
- Ajouter un tableau de navigation par module.
- Ajouter une annexe de microcopies utilisateur.
- Ajouter un index des termes.


## 52. Résumé final

Ce document décrit Konnaxion comme une série de parcours utilisateur plutôt que comme une collection de modules techniques.

La logique principale est:

```text
Comprendre
→ contribuer
→ décider
→ apprendre
→ prouver
→ construire
→ préserver
→ mesurer
```

ethiKos donne la structure civique.
Kollective Intelligence donne les lectures et contextes.
KonnectED transforme l’apprentissage en preuve.
keenKonnect transforme les décisions et idées en projets reproductibles.
Kreative rend la création visible, collaborative et préservée.

Kintsugi et Kompendio ne remplacent pas ces parcours.
Ils renforcent leur cohérence, leur portabilité, leur auditabilité et leur capacité à intégrer des outils sans perdre la source de vérité.


## 53. Notes de conception rapides par écran

- **/ethikos/learn/guides:** rassurer et expliquer avant action.
- **/ethikos/pulse/overview:** montrer l’état du système.
- **/ethikos/deliberate/[topic]:** structurer les raisons.
- **/ethikos/trust/profile:** expliquer la confiance.
- **/ethikos/decide/public:** permettre une décision claire.
- **/ethikos/decide/results:** rendre les résultats comparables.
- **/ethikos/impact/tracker:** suivre la promesse.
- **/ethikos/insights:** interpréter sans confondre.
- **/ethikos/admin/audit:** préserver la vérifiabilité.
- **/projects:** trouver ou créer un espace d’exécution.
- **/projects/[slug]:** coordonner le travail.
- **/learn:** explorer et apprendre.
- **/course/[slug]:** suivre une progression.
- **/certs:** prouver et certifier.
- **/kreative:** créer et exposer.
- **/archive:** préserver et transmettre.
- **/connect:** rencontrer et collaborer.


## 54. Questions ouvertes

- Quels workflows doivent devenir prioritaires pour l’implémentation UI?
- Quels rôles doivent être visibles dès la première version?
- Quels états d’erreur méritent une microcopie dédiée?
- Quels résultats doivent être exportables?
- Quels workflows doivent être testés en smoke test?
- Quels écrans doivent rester publics?
- Quels écrans doivent nécessiter authentification?
- Où faut-il afficher les explications de Smart Vote sans surcharger l’utilisateur?
- Où faut-il afficher les preuves EkoH?
- Quels outils Kintsugi doivent rester seulement mentionnés comme futurs?


## 55. Fin du brouillon

Ce document est une base narrative et fonctionnelle.
Il doit rester vivant, mais ne doit pas devenir une spec technique exhaustive.
Les prochaines versions peuvent ajouter des fiches workflow plus détaillées sans changer l’intention générale.


## 56. Index de workflows potentiels

- Créer une consultation
- Soumettre une suggestion citoyenne
- Trier une suggestion
- Ouvrir un débat
- Prendre position
- Ajouter un argument
- Répondre à un argument
- Signaler un argument
- Modérer un argument
- Clôturer un débat
- Créer une décision
- Configurer une modalité de vote
- Voter
- Publier une baseline
- Publier une lecture Smart Vote
- Comparer deux lectures
- Créer une action d’impact
- Suivre une action
- Ajouter un feedback d’impact
- Auditer une décision
- Consulter son profil EkoH
- Modifier sa visibilité
- Explorer des scores par domaine
- Créer un projet
- Inviter une équipe
- Créer une tâche
- Assigner une tâche
- Joindre un fichier
- Créer une version
- Restaurer une version
- Attacher une référence Kompendio
- Publier un Reference Chart
- Générer un Release Pack
- Chercher une ressource Knowledge
- Suivre un cours
- Participer à un forum
- Créer une contribution de contenu
- Recevoir une recommandation
- Choisir une certification
- Passer une évaluation
- Soumettre une preuve
- Valider comme pair
- Obtenir un certificat
- Mettre à jour un portfolio
- Téléverser une œuvre
- Créer une galerie
- Soumettre une tradition
- Publier une exposition
- Créer un profil créatif
- Trouver une opportunité
- Créer une session de collaboration
- Laisser une recommandation