"""Vérifie que data/ reconstruit exactement les positions et les 448
scores du comparateur, à partir des 224 valeurs du triangle supérieur.
"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from jsdata import eval_litteral

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(RACINE, "data")
lire = lambda *p: json.load(open(os.path.join(DATA, *p), encoding="utf-8"))

origine = eval_litteral(os.path.join(RACINE, "face-a-face.html"),
                        "const PARTIS = {", "const THEMES = [", "PARTIS")
dist, sources = lire("distances.json"), lire("sources.json")
themes = dist["themes"]
ids = list(origine.keys())

ecarts = []
n_scores = n_textes = 0

for pid in ids:
    pos = lire("positions", "%s.json" % pid)["comparateur"]
    for t in themes:
        n_textes += 1
        if pos[t]["valeur"] != origine[pid]["positions"][t]["texte"]:
            ecarts.append("texte %s/%s" % (pid, t))
        # Le libellé de source doit se retrouver via le registre.
        sid = pos[t]["sources"][0]
        if sources[sid]["libelle_cite"] != origine[pid]["positions"][t]["source"]:
            ecarts.append("source %s/%s" % (pid, t))
        # Les 7 scores de ce parti, reconstruits depuis le triangle.
        for autre in ids:
            if autre == pid:
                continue
            n_scores += 1
            cle = "|".join(sorted([pid, autre]))
            attendu = origine[pid]["positions"][t]["scores"].get(autre)
            obtenu = dist["paires"][cle][t]["valeur"]
            if attendu != obtenu:
                ecarts.append("score %s->%s/%s : %s vs %s" % (pid, autre, t, attendu, obtenu))

if ecarts:
    print("DIVERGENCE (%d)" % len(ecarts))
    for e in ecarts[:15]:
        print("  " + e)
    sys.exit(1)

print("ALLER-RETOUR IDENTIQUE : %d textes de position, %d scores reconstruits "
      "depuis %d valeurs stockées" % (n_textes, n_scores, len(dist["paires"]) * len(themes)))
