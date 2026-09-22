"""Construit data/partis.json, le registre unique des partis.

Les mêmes faits sont aujourd'hui écrits dans trois endroits qui ne se
parlent pas : PARTIS_META de js/quiz.js, le littéral PARTIS de
face-a-face.html, et le bloc `parti-hero-meta` de chaque fiche.
Ce script les rapproche et SIGNALE les divergences au lieu d'en choisir
une en silence — c'est le désaccord lui-même qui est l'information utile.

Choix de la valeur retenue : la fiche parti fait foi, parce qu'elle est
la surface la plus détaillée et qu'elle concorde avec partis.html. Toute
valeur divergente est conservée dans `variantes` et la confiance est
abaissée : personne ne doit croire qu'un arbitrage a été fait alors
qu'il ne l'a pas été.
"""
import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from jsdata import eval_litteral, ecrire_json

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(RACINE, "data")

# Partis présents au quiz (7) et au comparateur (8, avec le PCF).
FICHIERS = {
    "rn": "parti-rassemblement-national.html",
    "lr": "parti-les-republicains.html",
    "renaissance": "parti-renaissance.html",
    "modem": "parti-modem.html",
    "ps": "parti-parti-socialiste.html",
    "lfi": "parti-la-france-insoumise.html",
    "eelv": "parti-europe-ecologie.html",
}


def lire_fiche(fichier):
    """Extrait le bloc parti-hero-meta d'une fiche."""
    html = open(os.path.join(RACINE, fichier), encoding="utf-8").read()
    bloc = re.search(r'<div class="parti-hero-meta">(.*?)</div>', html, re.S).group(1)
    champ = lambda lab: (
        m.group(1).strip()
        if (m := re.search(r"<strong>%s\s*:</strong>([^<]*)" % lab, bloc)) else None
    )
    lien = re.search(r'<a href="(https?://[^"]+)"', bloc)
    return {
        "nom": re.search(r"<h1>([^<]+)</h1>", html).group(1).strip(),
        "ideologie": champ("Idéologie"),
        "chef": champ("Chef"),
        "fonde_en": champ("Fondé en"),
        "site": lien.group(1) if lien else None,
    }


def env(valeur, confiance, variantes=None, note=None):
    e = {"valeur": valeur, "sources": [], "verifie_le": None,
         "confiance": confiance, "auteur": "humain"}
    if variantes:
        e["variantes"] = variantes
    if note:
        e["note"] = note
    return e


def main():
    meta = eval_litteral(os.path.join(RACINE, "js", "quiz.js"),
                         "const PARTIS_META = {", "const THEMES = {", "PARTIS_META")
    faf = eval_litteral(os.path.join(RACINE, "face-a-face.html"),
                        "const PARTIS = {", "const THEMES = [", "PARTIS")

    registre, divergences = {}, []
    for pid in faf:
        f = faf[pid]
        fiche = lire_fiche(FICHIERS[pid]) if pid in FICHIERS else None
        au_quiz, a_fiche = pid in meta, fiche is not None

        # ── Nom : arbitrer entre les trois surfaces ───────────────────
        noms = {"comparateur": f["nom"]}
        if au_quiz:
            noms["quiz"] = meta[pid]["nom"]
        if a_fiche:
            noms["fiche"] = fiche["nom"]
        nom = noms.get("fiche", noms["comparateur"])
        if len(set(noms.values())) > 1:
            divergences.append(("nom", pid, dict(noms)))

        # ── Dirigeant : la divergence la plus fréquente ───────────────
        chefs = {"comparateur": f["chef"]}
        if a_fiche:
            chefs["fiche"] = fiche["chef"]
        chef = chefs.get("fiche", chefs["comparateur"])
        chef_diverge = len(set(chefs.values())) > 1
        if chef_diverge:
            divergences.append(("dirigeant", pid, dict(chefs)))

        registre[pid] = {
            "nom": nom,
            "sigle": f["sigle"],
            "slug": meta[pid]["slug"] if au_quiz else pid,
            "fichier": FICHIERS.get(pid),
            "couleur": f["couleur"],
            "couleurBg": f["couleurBg"],
            "axe": f["axe"],
            "ideologie": fiche["ideologie"] if a_fiche else None,
            "dirigeant": env(
                chef,
                "a_verifier",
                variantes=dict(chefs) if chef_diverge else None,
                note="Les surfaces du site ne s'accordent pas sur ce nom."
                     if chef_diverge else None,
            ),
            "fonde_en": env(fiche["fonde_en"], "a_verifier") if a_fiche else None,
            # L'année seule, quand le libellé en contient une exploitable
            # ("1969 (Congrès d'Épinay 1971)" -> 1969).
            "fonde_annee": (
                int(m.group(1))
                if a_fiche and (m := re.match(r"\s*(\d{4})", fiche["fonde_en"])) else None
            ),
            "site": env(fiche["site"], "a_verifier") if a_fiche else None,
            "perimetre": {
                "quiz": au_quiz,
                "comparateur": True,
                "fiche": a_fiche,
                "footer": a_fiche,
            },
        }
        if not au_quiz:
            registre[pid]["raison_hors_quiz"] = (
                "Poids non documentés au même niveau que les sept autres partis."
            )

    ecrire_json(os.path.join(DATA, "partis.json"), registre)

    print("partis.json : %d partis" % len(registre))
    for pid, p in registre.items():
        per = p["perimetre"]
        print("  %-12s %-6s quiz=%-5s comparateur=%-5s fiche=%-5s"
              % (pid, p["sigle"], per["quiz"], per["comparateur"], per["fiche"]))
    print()
    print("DIVERGENCES ENTRE SURFACES : %d" % len(divergences))
    for champ, pid, vals in divergences:
        print("  %s / %s" % (pid, champ))
        for surface, v in sorted(vals.items()):
            print("      %-13s %s" % (surface, v))


if __name__ == "__main__":
    main()
