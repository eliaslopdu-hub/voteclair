"""Extrait le contenu des 7 fiches parti vers data/positions/<parti>.json.

Quatre blocs par fiche : les 10 points de programme et leur source, les
paragraphes « En profondeur », les 4 figures avec leur crédit photo, et
la table des positions par thème.

Le crédit photo est extrait champ par champ (auteur, licence, lien
Commons) plutôt que conservé comme un bloc HTML : c'est une obligation
de licence, pas de la décoration, et le générateur doit pouvoir la
réémettre sans qu'un remaniement de gabarit puisse la perdre.
"""
import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from jsdata import ecrire_json

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(RACINE, "data")
PARTIS = json.load(open(os.path.join(DATA, "partis.json"), encoding="utf-8"))

dec = lambda s: (s or "").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").strip()


def extraire_points(html):
    points = []
    for carte in re.findall(r'<div class="point-card[^"]*">(.*?)</div></div>', html, re.S):
        texte = re.search(r"<p>(.*?)</p>", carte, re.S)
        src = re.search(r'<span class="point-source">\s*Source\s*:\s*(.*?)</span>', carte, re.S)
        points.append({
            "valeur": dec(texte.group(1)) if texte else None,
            "source_citee": dec(src.group(1)) if src else None,
            "sources": [],
            "verifie_le": None,
            "confiance": "a_verifier",
            "auteur": "humain",
        })
    return points


def extraire_profondeur(html):
    bloc = re.search(r'<div class="histoire-section fade-in">(.*?)</div>', html, re.S)
    if not bloc:
        return []
    return [dec(p) for p in re.findall(r"<p[^>]*>(.*?)</p>", bloc.group(1), re.S)]


def extraire_figures(html):
    """Le crédit photo suit la forme « Photo : auteur · licence · Commons ».

    La licence est tantôt un lien (CC BY 4.0, Licence Ouverte, conditions
    du Parlement européen), tantôt du texte nu (« Public domain »). On
    découpe donc sur les séparateurs plutôt que de ne chercher que des
    liens : une licence en texte brut est une licence quand même, et la
    perdre serait un manquement à l'attribution.
    """
    figures = []
    for carte in re.findall(r'<div class="figure-card fade-in">(.*?)</div>\s*(?=<div class="figure-card|</div>)', html, re.S):
        img = re.search(r'<img class="figure-photo" src="([^"]+)" alt="([^"]*)"', carte)
        champ = lambda c: (m.group(1).strip()
                           if (m := re.search(r'<div class="figure-%s">([^<]*)</div>' % c, carte)) else None)
        bio = re.search(r'<p class="figure-bio">(.*?)</p>', carte, re.S)

        credit = re.search(r'<p class="figure-credit">(.*?)</p>', carte, re.S)
        auteur = licence_label = licence_url = commons_url = None
        if credit:
            segments = [x.strip() for x in credit.group(1).split("·")]
            for i, seg in enumerate(segments):
                lien = re.search(r'<a href="([^"]+)"[^>]*>([^<]+)</a>', seg)
                nu = dec(re.sub(r"<[^>]+>", "", seg))
                if i == 0:
                    auteur = dec(re.sub(r"^Photo\s*:\s*", "", nu))
                elif lien and "commons.wikimedia.org" in lien.group(1):
                    commons_url = lien.group(1)
                elif lien:
                    licence_label, licence_url = lien.group(2).strip(), lien.group(1)
                elif nu:
                    licence_label = nu

        figures.append({
            "nom": champ("name"),
            "role": champ("role"),
            "initiales": champ("avatar"),
            "bio": dec(bio.group(1)) if bio else None,
            "photo": img.group(1) if img else None,
            "alt": img.group(2) if img else None,
            "credit_auteur": auteur,
            "licence_label": licence_label,
            "licence_url": licence_url,
            "commons_url": commons_url,
        })
    return figures


def extraire_table(html):
    tbl = re.search(r'<table class="positions-table[^"]*">(.*?)</table>', html, re.S)
    if not tbl:
        return {"entete": None, "lignes": []}
    entete = re.findall(r"<th>(.*?)</th>", tbl.group(1), re.S)
    lignes = [
        {"theme": dec(a), "valeur": dec(b), "sources": [], "verifie_le": None,
         "confiance": "a_verifier", "auteur": "humain"}
        for a, b in re.findall(r"<tr><td>(.*?)</td><td>(.*?)</td></tr>", tbl.group(1), re.S)
    ]
    return {"entete": [dec(x) for x in entete], "lignes": lignes}


def main():
    total = {"points": 0, "figures": 0, "lignes": 0, "photos": 0}
    for pid, p in PARTIS.items():
        if not p["perimetre"]["fiche"]:
            continue
        html = open(os.path.join(RACINE, p["fichier"]), encoding="utf-8").read()
        chemin = os.path.join(DATA, "positions", "%s.json" % pid)
        d = json.load(open(chemin, encoding="utf-8"))

        d["points_programme"] = extraire_points(html)
        d["profondeur"] = extraire_profondeur(html)
        d["figures"] = extraire_figures(html)
        d["positions_fiche"] = extraire_table(html)
        cta = re.search(r'Programme officiel complet.*?<p[^>]*>([^<]+)</p>.*?<a href="([^"]+)"', html, re.S)
        d["programme_officiel"] = {"label": cta.group(1), "url": cta.group(2)} if cta else None
        ecrire_json(chemin, d)

        total["points"] += len(d["points_programme"])
        total["figures"] += len(d["figures"])
        total["lignes"] += len(d["positions_fiche"]["lignes"])
        total["photos"] += sum(1 for f in d["figures"] if f["photo"])
        print("  %-12s %2d points · %2d § · %d figures · %d lignes de table"
              % (pid, len(d["points_programme"]), len(d["profondeur"]),
                 len(d["figures"]), len(d["positions_fiche"]["lignes"])))

    print()
    print("total : %d points, %d figures (%d photos), %d lignes de position"
          % (total["points"], total["figures"], total["photos"], total["lignes"]))


if __name__ == "__main__":
    main()
