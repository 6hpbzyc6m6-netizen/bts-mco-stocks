# StockLab - NumWorks / MicroPython (syntaxe Python 3.4)
# Executer le script puis saisir stocks() dans la console.
# Aucun exercice precharge. Montants saisis en euros HT.
# Calculs exacts : fractions de centimes, sans arrondi intermediaire.


def frac(n, d=1):
    a, b = abs(n), abs(d)
    while b:
        a, b = b, a % b
    if d < 0:
        n, d = -n, -d
    return (n // (a or 1), d // (a or 1))


def plus(a, b):
    return frac(a[0] * b[1] + b[0] * a[1], a[1] * b[1])


def fois(a, n):
    return frac(a[0] * n, a[1])


def montant(a, dec=2):
    # a est une fraction de centimes. Arrondi d'affichage au plus proche.
    n, d = a
    sign = "-" if n < 0 else ""
    scale = 10 ** dec
    den = d * 100
    v = (2 * abs(n) * scale + den) // (2 * den)
    tail = str(v % scale)
    return sign + str(v // scale) + "." + "0" * (dec-len(tail)) + tail


def cout_texte(text):
    t = text.strip().replace(",", ".")
    parts = t.split(".")
    if len(parts) > 2 or not parts[0].isdigit():
        raise ValueError("Cout invalide.")
    tail = parts[1] if len(parts) == 2 else ""
    if len(tail) > 2 or (tail and not tail.isdigit()):
        raise ValueError("2 decimales maximum.")
    c = int(parts[0]) * 100 + int((tail + "00")[:2])
    if c > 100000000:
        raise ValueError("Cout maximum : 1000000 E.")
    return c


def verifier(mouvements):
    if not mouvements or len(mouvements) > 31:
        raise ValueError("Initial + 30 mouvements max.")
    stock = 0
    for i in range(len(mouvements)):
        t, q, c = mouvements[i]
        if t not in (0, 1, 2) or (i == 0) != (t == 0):
            raise ValueError("Stock initial en premier.")
        if type(q) != int or q < (0 if t == 0 else 1) or q > 100000:
            raise ValueError("Quantite entiere invalide.")
        if type(c) != int or c < 0 or c > 100000000:
            raise ValueError("Cout invalide.")
        stock += -q if t == 2 else q
        if stock < 0:
            raise ValueError("Stock insuffisant.")
    return stock


def copie(lots):
    return [l[:] for l in lots]


def valoriser(mouvements, methode):
    # methodes : 1 CUMP mobile, 2 CUMP periode, 3 PEPS.
    verifier(mouvements)
    if methode not in (1, 2, 3):
        raise ValueError("Methode inconnue.")
    total_q, total_v = 0, 0
    for t, q, c in mouvements:
        if t != 2:
            total_q += q
            total_v += q * c
    moyen = frac(total_v, total_q) if total_q else (0, 1)
    qte, val, cu, sorties = 0, (0, 1), (0, 1), (0, 1)
    lots, lignes = [], []
    for i in range(len(mouvements)):
        t, q, c = mouvements[i]
        avant, utilises = copie(lots), []
        sortie = (0, 1)
        if t != 2:
            qte += q
            val = plus(val, (q*c, 1))
            if methode == 3 and q:
                lots.append([q, c, i+1])
            if methode == 2:
                cu = moyen
                val = fois(cu, qte)
            else:
                cu = frac(val[0], val[1]*qte) if qte else (0, 1)
        else:
            if methode == 3:
                reste, cout = q, 0
                while reste:
                    lot = lots[0]
                    pris = min(reste, lot[0])
                    utilises.append([pris, lot[1], lot[2]])
                    cout += pris * lot[1]
                    lot[0] -= pris
                    reste -= pris
                    if not lot[0]:
                        lots.pop(0)
                sortie = (cout, 1)
            else:
                sortie = fois(cu, q)
            qte -= q
            val = plus(val, fois(sortie, -1))
            if not qte:
                val = (0, 1)
                if methode == 1:
                    cu = (0, 1)
            sorties = plus(sorties, sortie)
        # index, type, quantite, cout achat, sortie, stock q, stock v, CUMP
        lignes.append((i+1, t, q, c, sortie, qte, val, cu,
                       avant, utilises, copie(lots)))
    return {"q": qte, "v": val, "sorties": sorties,
            "cump": moyen if methode == 2 else cu,
            "lots": lots, "lignes": lignes, "total": total_v}


def page(lignes):
    for start in range(0, len(lignes), 6):
        print("\n" + "-" * 24)
        for line in lignes[start:start+6]:
            print(line)
        input("EXE : suite ")


def entier(label, minimum=1, maximum=100000):
    while True:
        text = input(label).strip()
        if text.isdigit():
            n = int(text)
            if minimum <= n <= maximum:
                return n
        print("Entier de " + str(minimum))
        print("a " + str(maximum) + " attendu.")


def prix():
    while True:
        try:
            return cout_texte(input("Cout unitaire HT E : "))
        except ValueError as e:
            print(str(e))


def saisir():
    page(["VOTRE EXERCICE", "Rien n'est precharge.",
          "Saisir dans l'ordre", "chronologique, sans dates.",
          "Quantites entieres.", "Couts : 2 decimales max."])
    q = entier("Quantite initiale : ", 0)
    c = prix()
    mouvements = [(0, q, c)]
    while True:
        stock = verifier(mouvements)
        print("\nStock : " + str(stock))
        print("1 Achat  2 Sortie")
        print("3 Relire 4 Annuler dernier")
        print("0 Terminer la saisie")
        choix = input("Choix : ").strip()
        if choix == "0":
            return mouvements
        if choix == "3":
            relire(mouvements)
        elif choix == "4":
            if len(mouvements) > 1:
                mouvements.pop()
                print("Dernier mouvement retire.")
            else:
                print("Initial conserve.")
        elif choix in ("1", "2"):
            if len(mouvements) >= 31:
                print("Limite : 30 mouvements.")
                continue
            if choix == "2" and stock == 0:
                print("Sortie impossible : stock nul.")
                continue
            q = entier("Quantite : ", 1,
                       min(stock, 100000) if choix == "2" else 100000)
            c = prix() if choix == "1" else 0
            mouvements.append((int(choix), q, c))
        else:
            print("Choix non reconnu.")


def relire(mouvements):
    lignes = ["VOTRE SAISIE (ordre)"]
    for i in range(len(mouvements)):
        t, q, c = mouvements[i]
        nom = ("Initial", "Achat", "Sortie")[t]
        lignes.append(str(i+1) + " " + nom + " : " + str(q))
        if t != 2:
            lignes.append("CU : " + montant((c, 1)) + " E HT")
    page(lignes)


def voir_lots(titre, lots):
    lignes = [titre]
    if not lots:
        lignes.append("Aucun lot.")
    for q, c, numero in lots:
        lignes.append("Lot " + str(numero) + " : " + str(q) + " unites")
        lignes.append("a " + montant((c, 1)) + " E HT")
    page(lignes)


def detail(resultat, methode):
    for ligne in resultat["lignes"]:
        i, t, q, c, sortie, stock_q, stock_v, cu, avant, pris, apres = ligne
        nom = ("Initial", "Achat", "Sortie")[t]
        lignes = [str(i) + " " + nom + " : " + str(q)]
        if t != 2:
            lignes.append("Entree : " + montant((q*c, 1)) + " E")
        else:
            lignes.append("Sortie : " + montant(sortie) + " E")
            if methode != 3:
                lignes.append("CU sortie : " + montant(frac(sortie[0], sortie[1]*q), 4))
        if methode != 3:
            lignes.append("CUMP : " + montant(cu, 4) + " E")
        lignes += ["Stock : " + str(stock_q) + " unites",
                   "Valeur : " + montant(stock_v) + " E"]
        page(lignes)
        if methode == 3 and t == 2:
            voir_lots("AVANT LA SORTIE", avant)
            voir_lots("LOTS PRELEVES", pris)
            voir_lots("APRES LA SORTIE", apres)


def bilan(mouvements, methode):
    r = valoriser(mouvements, methode)
    titre = ("", "CUMP APRES ENTREE", "CUMP FIN PERIODE", "PEPS / FIFO")[methode]
    lignes = [titre, "Quantite finale : " + str(r["q"]),
              "Stock : " + montant(r["v"]) + " E HT",
              "Sorties : " + montant(r["sorties"]) + " E HT"]
    if methode != 3:
        lignes.append("CUMP : " + montant(r["cump"], 4) + " E")
    page(lignes)
    if methode == 1:
        page(["Le CUMP change a chaque achat.",
              "Sortie au dernier CUMP connu.",
              "Stock nul : CUMP affiche a 0."])
    elif methode == 2:
        page(["CUMP = valeur disponible", "/ quantite disponible.",
              "Initial + tous les achats.",
              "Sorties definitives en fin", "de periode.",
              "Soldes affiches retrospectifs."])
        page(["Regle comptable francaise :", "periode de calcul <= duree",
              "moyenne de stockage."])
    else:
        voir_lots("STOCK FINAL PAR LOT", r["lots"])
        page(["Sortir les lots les plus", "anciens en premier.",
              "Chaque lot garde son cout.", "Numero = rang dans la saisie."])
    if input("Detail ? 1 oui / EXE non : ").strip() == "1":
        detail(r, methode)


def stocks():
    mouvements = saisir()
    while True:
        print("\nRESULTATS")
        print("1 CUMP apres entree")
        print("2 CUMP fin de periode")
        print("3 PEPS / FIFO")
        print("4 Relire la saisie")
        print("5 Nouvel exercice 0 Quitter")
        choix = input("Choix : ").strip()
        if choix == "0":
            return
        elif choix in ("1", "2", "3"):
            bilan(mouvements, int(choix))
        elif choix == "4":
            relire(mouvements)
        elif choix == "5":
            if input("Effacer saisie ? 1 oui : ").strip() == "1":
                mouvements = saisir()
        else:
            print("Choix non reconnu.")
