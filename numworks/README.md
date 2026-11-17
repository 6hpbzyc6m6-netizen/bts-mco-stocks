# Stocks sur NumWorks

Un seul fichier à installer : **[`stocks.py`](stocks.py)**. Aucun exercice préchargé, aucune connexion nécessaire pendant l’utilisation et aucun module externe.

## Installation

1. Ouvrir l’[éditeur Python NumWorks](https://my.numworks.com/python).
2. Créer un script nommé `stocks.py` et y copier tout le contenu du fichier fourni. Les tests `test_stocks.py` ne sont pas à transférer.
3. Brancher la calculatrice en USB et utiliser la commande de transfert proposée par NumWorks. Suivre les indications de connexion du navigateur ; ne pas supprimer les autres scripts pour faire de la place sans les avoir sauvegardés.
4. Sur la calculatrice, ouvrir **Python**, puis exécuter/importer le script `stocks`.
5. Dans la console, saisir **`stocks()`**, puis valider avec EXE. Si l’import automatique est désactivé, saisir d’abord `from stocks import *`.

Le [manuel officiel Python](https://www.numworks.com/manual/python/) décrit l’import des scripts et la console. Le programme utilise uniquement une syntaxe compatible Python 3.4, des listes, des tuples, des chaînes et les fonctions standard `input` / `print`. Il ne se lance pas automatiquement à l’import afin de ne pas bloquer l’ouverture de la console.

## Utilisation par l’élève

1. Appuyer sur EXE pour lire les consignes.
2. Saisir la quantité initiale, puis son coût unitaire HT en euros.
3. Ajouter les achats et sorties **dans l’ordre chronologique**. Les dates ne sont pas demandées : chaque opération reçoit un numéro.
4. Pour chaque achat, saisir quantité et coût unitaire ; pour une sortie, uniquement la quantité. Les quantités impossibles sont refusées.
5. Utiliser **3 Relire** pour vérifier ou **4 Annuler dernier** pour retirer le dernier mouvement. Une erreur plus ancienne se corrige en retirant les mouvements suivants puis en les ressaisissant. Le stock initial se corrige en relançant `stocks()`.
6. Choisir **0 Terminer la saisie**.
7. Consulter la méthode souhaitée :
   - **1 CUMP après entrée** ;
   - **2 CUMP fin de période** ;
   - **3 PEPS / FIFO**.
8. À la fin de chaque bilan, saisir **1** pour afficher le détail, ou EXE pour revenir au menu des méthodes. Les mêmes données servent aux trois méthodes ; aucune nouvelle saisie n’est nécessaire.

Chaque page attend EXE. Le menu final permet aussi de relire les données, de saisir un nouvel exercice (avec confirmation) ou de quitter.

## Informations affichées

Pour chaque méthode : quantité finale, valeur du stock final HT et coût total des sorties HT. Pour les CUMP : coût moyen unitaire à quatre décimales ; pour PEPS : composition finale des lots, avec quantité et coût d’achat.

Le détail présente les entrées et sorties valorisées, les soldes successifs et, pour chaque sortie PEPS, les lots **avant**, **prélevés** et **après** la sortie. Un lot garde le numéro du mouvement qui l’a créé : les numéros ne sont donc pas nécessairement consécutifs.

Des rappels expliquent chaque méthode. En CUMP de fin de période, les soldes sont rétrospectifs ; la période de calcul ne doit pas dépasser la durée moyenne de stockage dans le cadre comptable français.

## Précision et limites

- Quantités entières : de 1 à 100 000 par mouvement ; stock initial éventuellement nul.
- Coûts unitaires : positifs ou nuls, maximum 1 000 000 €, avec **deux décimales maximum**. Virgule et point acceptés ; saisir `0,50` plutôt que `,50`.
- Jusqu’à 30 mouvements après le stock initial, afin de limiter la mémoire utilisée et le volume d’affichage sur la calculatrice.
- Les coûts sont stockés en centimes entiers. Les CUMP et valeurs intermédiaires sont conservés sous forme de fractions réduites, sans flottants ni arrondis intermédiaires. Seul l’affichage est arrondi (au centime le plus proche, demi-centime vers le haut ; CU à quatre décimales).
- Le CUMP mobile est affiché à zéro lorsque le stock est nul. Le CU réellement utilisé pour la dernière sortie figure dans son détail.
- Pas de prix de vente, de marge, de TVA, de retours ni de quantités fractionnaires.
- Les données saisies sont temporaires : elles ne sont ni enregistrées dans le script ni transférées vers le site web. Quitter la fonction, interrompre le programme ou relancer `stocks()` ne permet pas de reprendre l’exercice précédent.
- Le programme utilise des libellés français sans accents pour un affichage simple sur petit écran. `E` désigne l’euro.

## Tests effectués

Depuis la racine du dépôt :

```sh
python3 -m unittest discover -s numworks -p 'test_*.py' -v
```

Six tests automatisés CPython réussis : résultats SPORTÉO et lots PEPS ; conservation exacte des valeurs et quantités sur plusieurs cas (stock nul, coûts identiques et variables, sorties multi-lots, réapprovisionnement) ; validation ; saisie interactive simulée sans données préchargées ; arrondi et analyse syntaxique Python 3.4 ; taille du fichier et présence du repère de fin.

La source complète a aussi été compilée avec `mpy-cross` MicroPython 1.17 : compilation réussie. Ce contrôle vérifie la syntaxe MicroPython, pas l’exécution ni l’affichage sur calculatrice.

SPORTÉO n’apparaît que dans les tests sur ordinateur, jamais dans le script élève. Résultats de contrôle : 402,50 € (CUMP mobile), 396,67 € (CUMP période), 425 € (PEPS), avec 35 unités finales.

**Limite de vérification : pas de test exécuté sur une NumWorks réelle ou son émulateur.** La syntaxe compatible ne garantit pas à elle seule le comportement et la mémoire disponible sur chaque version de la calculatrice. Un essai sur une calculatrice est nécessaire avant diffusion à toute la classe.

## Si « SyntaxError » apparaît à l’import

Une erreur à une ligne de texte ne signifie pas forcément que cette ligne est fautive : un guillemet ou une parenthèse peut manquer juste avant, ou le transfert peut être incomplet. Le fichier d’origine dépassait 9 Ko ; la version compacte fait moins de 8 Ko. Ce seuil est une précaution de transfert, pas une limite universelle affirmée pour NumWorks.

1. Remplacer **tout** le contenu de l’ancien script par la nouvelle source (bouton Raw / Brut sur GitHub, sans les numéros de ligne ni les balises Markdown).
2. Vérifier dans l’éditeur que la dernière ligne est exactement `# FIN DU SCRIPT - stocks()`.
3. Enregistrer puis transférer à nouveau le script entier.
4. Si le nom est `stock.py`, saisir `from stock import *`, puis `stocks()`. Si le nom est `stocks.py`, saisir `from stocks import *`, puis `stocks()`.
5. Si l’erreur persiste, transmettre le fichier réellement présent dans l’éditeur ou une capture des lignes précédant et suivant la ligne indiquée. Une capture du message seul ne permet pas de vérifier le contenu transféré.
