import ast
import builtins
import importlib.util
import pathlib
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('stocks', pathlib.Path(__file__).with_name('stocks.py'))
s = importlib.util.module_from_spec(spec)
spec.loader.exec_module(s)

class Tests(unittest.TestCase):
    def test_sporteo(self):
        m = [(0,40,1000),(1,20,1300),(2,30,0),(1,30,1200),(2,25,0)]
        self.assertEqual(s.montant(s.valoriser(m,1)['v']), '402.50')
        self.assertEqual(s.montant(s.valoriser(m,2)['v']), '396.67')
        f = s.valoriser(m,3)
        self.assertEqual(s.montant(f['v']), '425.00')
        self.assertEqual([row[4] for row in f['lignes'] if row[1]==2], [(30000,1),(29500,1)])
        self.assertEqual(f['lots'], [[5,1300,2],[30,1200,4]])
        self.assertEqual(f['q'],35)
        self.assertEqual(s.montant(s.valoriser(m,2)['cump'],4),'11.3333')

    def test_coherence(self):
        cases = [ [(0,0,0)], [(0,4,0),(2,4,0),(1,3,1415),(2,1,0)],
                  [(0,4,1000),(1,6,1200),(1,8,1500),(2,12,0),(2,6,0)],
                  [(0,3,1001),(1,7,437),(2,4,0),(1,3,111),(2,2,0)],
                  [(0,20,715),(1,10,715),(2,5,0),(2,12,0)] ]
        for m in cases:
            before = list(m)
            for method in (1,2,3):
                r=s.valoriser(m,method)
                self.assertEqual(s.plus(r['v'],r['sorties']), (r['total'],1))
                self.assertEqual(r['q'],s.verifier(m))
            self.assertEqual(m,before)

    def test_validation(self):
        for m in [[(0,1,100),(2,2,0)],[(1,1,100)],[(0,1.5,100)],[(0,1,-1)],[(0,1,100),(2,0,0)]]:
            with self.assertRaises(ValueError): s.verifier(m)
        for text in ['nan','inf','-1','1.001','1e9','1/2','1000001']:
            with self.assertRaises(ValueError): s.cout_texte(text)
        self.assertEqual(s.cout_texte('12,30'),1230)
        self.assertEqual(s.cout_texte('0'),0)

    def test_saisie_sans_donnees_prechargees(self):
        # EXE intro, stock initial 10 a 2, sortie 4, correction par retrait,
        # achat 5 a 3, sortie 6, fin. Aucun autre mouvement n'est injecte.
        values=['','10','2','2','4','4','1','5','3','2','6','0']
        with patch.object(builtins,'input',side_effect=values), patch.object(builtins,'print'):
            m=s.saisir()
        self.assertEqual(m,[(0,10,200),(1,5,300),(2,6,0)])

    def test_arrondi_exact(self):
        self.assertEqual(s.montant((1,2)), '0.01')
        self.assertEqual(s.montant((1,3)), '0.00')
        self.assertEqual(s.montant((100,3),4), '0.3333')
        source=pathlib.Path(s.__file__).read_text()
        ast.parse(source,feature_version=(3,4))

if __name__ == '__main__': unittest.main()
