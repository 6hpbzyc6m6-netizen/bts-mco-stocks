# StockLab · BTS MCO

Application pédagogique autonome, en français, pour comprendre et comparer la valorisation des stocks. HTML5, CSS3 et JavaScript natif : aucune dépendance, API, base de données ou authentification.

## Version NumWorks

Le dossier [`numworks/`](numworks/README.md) contient un script Python autonome, sans exercice préchargé, pour saisir ses propres mouvements et obtenir les résultats des trois méthodes sur la calculatrice. Cette version est indépendante de l’application web et ne lit pas ses sauvegardes.

## Utilisation

Ouvrir `index.html` directement dans un navigateur récent, y compris hors connexion. Un serveur local facultatif est disponible avec Node.js 18 ou supérieur : `npm start`, puis ouvrir http://127.0.0.1:8000.

- **Tableau de bord** : scénario, chronologie et accès aux trois méthodes.
- **Mouvements** : modifier le stock initial, ajouter, modifier ou supprimer un achat / une sortie ; renseigner le prix de vente HT facultatif. Les mouvements sont triés par date ; à date égale, l'ordre existant est conservé. Le stock initial doit rester en première position. Une modification créant un stock négatif est refusée dans son ensemble.
- **Fiches** : entrées, sorties et stock restant en quantité, coût unitaire et valeur. PEPS détaille les lots avant, utilisés et après chaque sortie, avec un numéro et une couleur constants.
- **Comparaison** : stock final, coût des sorties, écarts par rapport au CUMP mobile, marge brute et graphique de valeur du stock final.
- **Étudiant** (par défaut) : résultats masqués ; saisir les sept réponses dans « S'entraîner ». Les erreurs donnent une piste de calcul. Une réussite complète révèle les fiches. La correction peut aussi être consultée volontairement, sans valider la progression.
- **Enseignant** : corrections immédiatement visibles, scénarios libres et exercices prédéfinis. L’ouverture demande le mot de passe pédagogique `MCO1234`, défini dans `app.js`. Il doit être ressaisi après un retour au mode étudiant ou un rechargement. Il n’est jamais sauvegardé dans le navigateur. Ce verrou côté client ne protège pas les corrections contre l’inspection des sources.
- **Parcours** : exercice 01 débutant (coûts identiques), exercice 02 intermédiaire (coûts variables), puis SPORTÉO niveau BTS. Pour valider un exercice, répondre correctement en mode étudiant avant de révéler la correction ; le scénario doit être celui d'origine. Recharger l'exercice permet une nouvelle tentative.
- **Sauvegarde** : scénario actif et progression dans `localStorage`. Les réponses, le mode et la révélation des corrections ne sont pas persistés. Si le stockage est bloqué, l'application reste utilisable et signale la nécessité d'exporter. Les données dépendent du navigateur et de l'adresse utilisés ; ne pas compter sur leur transfert entre un fichier local et GitHub Pages.
- **JSON** : importer / exporter depuis Mouvements ; les données importées sont validées avant remplacement. Limites : 500 Ko, 500 mouvements, quantités entières de 0 (stock initial) ou 1 à 1 milliard, coûts et prix de 0 à 1 milliard d'euros. Pour les scénarios courants de BTS, ces plafonds sont largement suffisants.
- **Impression / PDF** : utiliser le bouton puis sélectionner une imprimante ou « Enregistrer au format PDF ». La vue courante est imprimée ; l'entraînement corrigé regroupe les trois fiches. Les résultats masqués restent masqués à l'impression. Pour une fiche très large, choisir le format paysage.

## Parcours guidé

L’accueil mène à quatre étapes : lire l’énoncé, comprendre les méthodes, calculer et vérifier, comparer et conclure. Des boutons précédent / suivant et une barre de progression permettent de se repérer. Le premier exercice chargé en l’absence de sauvegarde est le niveau débutant.

L’énoncé est affiché à côté des méthodes et de la saisie des réponses (au-dessus sur petit écran). Chaque méthode dispose de repères de calcul. Dans l’étape de saisie, une aide permet de revoir les formules sans quitter les réponses. Celles-ci sont conservées en mémoire lors des changements de vue ; elles restent réinitialisées si le scénario ou le mode change. Rien n’est transmis au professeur.

### Calculatrice intégrée

Sous l’énoncé, une calculatrice permet les quatre opérations, les parenthèses, la saisie au clavier (Entrée pour calculer), les boutons, la virgule ou le point et la réutilisation du résultat. Elle respecte les priorités opératoires, signale les calculs incomplets et divisions par zéro et conserve le calcul courant pendant la navigation, sans modifier les réponses. L’affichage est limité à 12 chiffres significatifs, le résultat interne n’est pas arrondi. Aucun code saisi n’est exécuté. La calculatrice est masquée à l’impression.

## Calculs

`engine.js` expose `StockEngine.validate(scenario)` et `StockEngine.calculate(scenario, method)` dans le navigateur, et les mêmes fonctions via CommonJS pour les tests. Le moteur est pur et ne modifie pas les mouvements.

- `moving` : **CUMP après chaque entrée** = (valeur du stock restant + quantité achetée × coût d'achat) / (quantité restante + quantité achetée). Chaque sortie est valorisée au dernier CUMP. Lorsque le stock est épuisé, sa quantité et sa valeur sont remises à zéro.
- `period` : **CUMP en fin de période** = (valeur initiale + valeur totale des achats) / (quantité initiale + quantités achetées). Toutes les sorties et le stock final sont valorisés à ce coût. Les soldes intermédiaires affichés sont rétrospectifs : la valorisation définitive n'est connue qu'en fin de période. Dans le cadre comptable français, la période de calcul ne doit pas excéder la durée moyenne de stockage ; le logiciel rappelle cette règle mais ne calcule pas automatiquement cette durée.
- `fifo` : **PEPS** prélève successivement les unités dans les lots les plus anciens. Les CU moyens affichés dans la fiche synthétique sont des repères ; les montants proviennent des prélèvements lot par lot.

Marge brute = quantité totale sortie × prix de vente unitaire HT − coût total des sorties. Toutes les sorties sont supposées vendues au même prix, sans frais additionnels ni remise. Sans prix renseigné, la marge n'est pas calculée.

Les calculs conservent la précision des nombres JavaScript, sans arrondi intermédiaire ; l'affichage utilise deux décimales pour les montants et quatre pour les CU. Il peut donc exister un écart d'un centime lorsqu'on additionne manuellement des montants déjà arrondis. Pour les réponses étudiant, une tolérance d'un centime est acceptée sur les valeurs arrondies, et la quantité doit être exacte. Cette application pédagogique n'est pas un logiciel comptable à précision décimale garantie sur des montants extrêmes.

## Référence SPORTÉO

Dates en mars 2026 (l'année n'affecte pas le calcul) : 40 unités à 10 € le 01/03, achat de 20 à 13 € le 05/03, sortie de 30 le 10/03, achat de 30 à 12 € le 15/03, sortie de 25 le 20/03. Prix de vente d'exemple : 20 € HT, modifiable.

| Indicateur | CUMP après entrée | CUMP fin de période | PEPS |
| --- | ---: | ---: | ---: |
| Quantité finale | 35 | 35 | 35 |
| Valeur finale | 402,50 € | 396,67 € | 425,00 € |
| Coût des sorties | 617,50 € | 623,33 € | 595,00 € |
| Marge à 20 € HT | 482,50 € | 476,67 € | 505,00 € |

PEPS : sorties de 300 € puis 295 €. Stock final : 5 unités à 13 € et 30 unités à 12 €. Valeur disponible : 1 020 € ; chiffre d'affaires : 55 × 20 = 1 100 €.

## Tests

Avec Node.js 18 ou supérieur, sans installation de paquet :

```sh
npm test
node --check app.js
```

Les tests couvrent SPORTÉO, entrées et sorties successives, prélèvement PEPS sur plusieurs lots, épuisement exact, stock nul et réapprovisionnement, coûts identiques, hausses / baisses, précision intermédiaire, validation, absence de mutation et identités quantité / valeur. Le workflow `.github/workflows/tests.yml` les exécute sur les pushes et pull requests.

Vérifications manuelles conseillées avant la publication : naviguer sur mobile et PC ; charger chaque exercice ; vérifier le masquage et la correction ; créer un scénario puis tenter une sortie excessive ; modifier / supprimer un achat indispensable ; exporter / réimporter ; recharger pour vérifier la sauvegarde ; imprimer en PDF. La liste décrit les vérifications à faire et ne constitue pas un compte rendu d'exécution.

## Publication GitHub Pages

Dépôt cible uniquement : https://github.com/6hpbzyc6m6-netizen/bts-mco-stocks

1. Relire et fusionner la branche de travail via une pull request vers `main` après validation humaine.
2. Dans **Settings → Pages → Build and deployment**, choisir **Deploy from a branch**.
3. Sélectionner **main** et **/ (root)** puis enregistrer.
4. Attendre la fin du déploiement Pages. L'adresse attendue est https://6hpbzyc6m6-netizen.github.io/bts-mco-stocks/.

`index.html` est à la racine, les chemins des ressources sont relatifs et `.nojekyll` désactive le traitement Jekyll. Aucun build n'est requis. Ne pas activer Pages sur la branche de travail si la publication de production doit attendre la revue.

## Fichiers

- `index.html` : structure, navigation, formulaires et dialogue de mouvements.
- `style.css` : interface responsive, couleurs des méthodes, impression.
- `engine.js` : validation et moteur des trois calculs.
- `scenarios.js` : trois exercices prédéfinis.
- `app.js` : rendu, deux modes, corrections, import/export et persistance.
- `calculator.js`, `tests/calculator.test.cjs` : calcul arithmétique de la calculatrice et tests.
- `tests/engine.test.cjs` : tests automatisés du moteur.
- `tests/interface.test.cjs` : tests des événements de verrouillage, du parcours et de la conservation des réponses (DOM simulé, sans contrôle visuel).
- `package.json`, `scripts/serve.cjs` : commandes de tests et serveur local facultatif.
- `.github/workflows/tests.yml`, `.nojekyll` : vérifications GitHub et compatibilité Pages.

## Limites et données

Quantités entières uniquement ; pas de retours, pertes, TVA, ventes à prix multiples ni valorisation LIFO. Dates en ordre chronologique et pas de fuseaux horaires dans les calculs. Les couleurs de lots sont réutilisées après six lots ; leur numéro distingue toujours les lots. Les exercices ne sont pas un examen sécurisé : les corrections sont présentes côté client et le mot de passe du mode enseignant est lisible dans les sources. Aucun suivi étudiant distant ni export de notes. Le navigateur contrôle le rendu PDF final et la persistance des fichiers ouverts via `file://`.
