"""Lecture de data/politique-veille.json : resolution d'un chemin vers sa regle.

Un seul endroit sait interpreter les motifs `partis.*.dirigeant` ou `poids.**`,
pour que le rapport de peremption et le garde-fou de la CI ne puissent pas
diverger dans leur lecture de la politique.
"""
import os, json, datetime

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(RACINE, "data")


def charger():
    with open(os.path.join(DATA, "politique-veille.json"), encoding="utf-8") as f:
        return json.load(f)


def _correspond(motif, chemin):
    """`*` couvre un segment, `**` couvre la fin du chemin."""
    mm, cc = motif.split("."), chemin.split(".")
    for i, m in enumerate(mm):
        if m == "**":
            return True
        if i >= len(cc):
            return False
        if m != "*" and m != cc[i]:
            return False
    return len(mm) == len(cc)


def regle(politique, chemin):
    """Rend la regle la plus specifique qui couvre `chemin`, ou None.

    Specificite = nombre de segments litteraux : `partis.*.dirigeant` (2)
    l'emporte sur `partis.**` (1), sinon l'ordre du fichier deciderait.
    """
    trouvees = [
        (sum(1 for s in motif.split(".") if s not in ("*", "**")), motif, r)
        for motif, r in politique["champs"].items()
        if _correspond(motif, chemin)
    ]
    if not trouvees:
        return None
    return max(trouvees, key=lambda t: t[0])[2]


def enveloppes(obj, chemin=""):
    """Meme parcours que tools/verifier.py : rend chaque enveloppe de fait."""
    if isinstance(obj, dict):
        if "valeur" in obj and "confiance" in obj:
            yield chemin, obj
            return
        for k, v in obj.items():
            yield from enveloppes(v, "%s.%s" % (chemin, k) if chemin else k)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from enveloppes(v, "%s[%d]" % (chemin, i))


def fichiers_data():
    """Rend (chemin_relatif, prefixe_logique, contenu) pour chaque JSON de data/."""
    for racine, _, noms in os.walk(DATA):
        for nom in sorted(noms):
            if not nom.endswith(".json"):
                continue
            plein = os.path.join(racine, nom)
            rel = os.path.relpath(plein, RACINE)
            if os.path.basename(racine) in ("poids", "positions"):
                prefixe = "%s.%s" % (os.path.basename(racine), nom[:-5])
            else:
                prefixe = nom[:-5].replace("-", "_")
            with open(plein, encoding="utf-8") as f:
                yield rel, prefixe, json.load(f)


def age_jours(verifie_le, aujourdhui=None):
    if not verifie_le:
        return None
    a = aujourdhui or datetime.date.today()
    d = datetime.date(*map(int, verifie_le.split("-")))
    return (a - d).days
