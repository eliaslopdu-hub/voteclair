"""Extrait les données du comparateur face-à-face vers data/.

Produit :
  - data/sources.json    registre des sources citées, avec leur rang
  - data/distances.json  triangle supérieur de la matrice de distance
  - data/positions/<parti>.json  le texte de position par thème

Deux choix méritent d'être explicités.

1. La matrice est stockée en triangle supérieur. Mesure faite sur les
   448 couples de face-a-face.html : zéro asymétrie, écart maximum 0.
   Stocker une seule direction garantit la symétrie par construction au
   lieu de l'espérer, et supprime 224 valeurs à maintenir en double.

2. Les sources sont enregistrées SANS URL. Le site cite des libellés
   ("Programme RN — 2022, rassemblementnational.fr") et non des liens.
   Inventer les URL correspondantes serait précisément l'erreur que ce
   chantier cherche à rendre impossible : on enregistre `url: null` et
   `confiance: "perime"`, et le vérificateur comptera la dette.
"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from jsdata import eval_litteral, ecrire_json

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FAF = os.path.join(RACINE, "face-a-face.html")
DATA = os.path.join(RACINE, "data")


def slug_source(pid, libelle):
    return "src:%s-programme-2022" % pid


def main():
    P = eval_litteral(FAF, "const PARTIS = {", "const THEMES = [", "PARTIS")
    THEMES = eval_litteral(FAF, "const THEMES = [", "/* ── État", "THEMES")
    ordre_themes = [t["key"] for t in THEMES]
    ids = list(P.keys())

    # ── 1. Registre des sources ───────────────────────────────────────
    sources = {}
    for pid, p in P.items():
        libelles = {pos["source"] for pos in p["positions"].values()}
        if len(libelles) != 1:
            raise SystemExit("%s cite %d libellés distincts" % (pid, len(libelles)))
        libelle = libelles.pop()
        sources[slug_source(pid, libelle)] = {
            "libelle_cite": libelle,
            "editeur": p["nom"],
            "rang": 2,
            "url": None,
            "date_publication": None,
            "annee_citee": 2022,
            "consulte_le": None,
            "archive": None,
            "note": "URL non renseignée : le site cite un libellé, pas un lien. "
                    "À compléter avec le programme officiel publié par le parti.",
        }

    # ── 2. Positions par parti ────────────────────────────────────────
    os.makedirs(os.path.join(DATA, "positions"), exist_ok=True)
    for pid, p in P.items():
        sid = slug_source(pid, "")
        chemin = os.path.join(DATA, "positions", "%s.json" % pid)
        existant = {}
        if os.path.exists(chemin):
            existant = json.load(open(chemin, encoding="utf-8"))
        existant["parti"] = pid
        existant["comparateur"] = {
            t: {
                "valeur": p["positions"][t]["texte"],
                "sources": [sid],
                "verifie_le": None,
                "confiance": "perime",
                "auteur": "humain",
            }
            for t in ordre_themes
        }
        ecrire_json(chemin, existant)

    # ── 3. Matrice de distance, triangle supérieur ────────────────────
    paires, asym = {}, 0
    for i, a in enumerate(ids):
        for b in ids[i + 1:]:
            cle = "|".join(sorted([a, b]))
            x, y = sorted([a, b])
            entree = {}
            for t in ordre_themes:
                va = P[x]["positions"][t]["scores"].get(y)
                vb = P[y]["positions"][t]["scores"].get(x)
                if va != vb:
                    asym += 1
                    raise SystemExit("asymétrie %s/%s sur %s : %s vs %s" % (x, y, t, va, vb))
                entree[t] = {
                    "valeur": va,
                    "sources": [slug_source(x, ""), slug_source(y, "")],
                    "verifie_le": None,
                    "confiance": "perime",
                    "auteur": "humain",
                }
            paires[cle] = entree

    ecrire_json(os.path.join(DATA, "sources.json"), sources)
    ecrire_json(os.path.join(DATA, "distances.json"), {
        "echelle": {"0": "positions quasi identiques", "100": "opposition frontale"},
        "themes": ordre_themes,
        "note": "Triangle supérieur uniquement : la clé est la paire d'identifiants "
                "triée alphabétiquement. La symétrie est garantie par construction.",
        "paires": paires,
    })

    print("sources.json    : %d sources (toutes rang 2, sans URL)" % len(sources))
    print("distances.json  : %d paires x %d thèmes = %d valeurs (au lieu de %d)"
          % (len(paires), len(ordre_themes), len(paires) * len(ordre_themes),
             len(ids) * (len(ids) - 1) * len(ordre_themes)))
    print("positions/      : %d partis x %d thèmes" % (len(P), len(ordre_themes)))


if __name__ == "__main__":
    main()
