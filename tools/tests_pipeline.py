"""Verifie que le garde-fou refuse ce qu'il doit refuser.

Un garde-fou qu'on ne teste pas est une croyance, pas une protection. On
lui soumet ici les six situations qui comptent, dans un clone jetable :
trois qu'il doit laisser passer, trois qu'il doit bloquer.

Le cas 4 est le plus important. La veille a le droit de modifier le HTML,
mais seulement en le derivant de data/. Si le garde-fou acceptait le
fichier entier des lors qu'une projection a eu lieu, il suffirait d'une
phrase glissee dans une fiche parti pour la publier sans relecture.

  python3 tools/tests_pipeline.py
"""
import os, sys, json, shutil, tempfile, subprocess

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# On se compare a la branche courante du depot, pas a `main` : les outils
# testes peuvent n'exister que sur la branche de travail.
BASE = subprocess.run(["git", "branch", "--show-current"], cwd=RACINE,
                      capture_output=True, text=True).stdout.strip() or "main"


def sh(cwd, *a, **kw):
    return subprocess.run(a, cwd=cwd, capture_output=True, text=True, **kw)


def git(cwd, *a):
    r = sh(cwd, "git", *a)
    if r.returncode and "nothing to commit" not in r.stdout:
        raise SystemExit("git %s : %s%s" % (" ".join(a), r.stdout, r.stderr))
    return r.stdout


def maj_json(cwd, rel, muter):
    p = os.path.join(cwd, rel)
    with open(p, encoding="utf-8") as f:
        d = json.load(f)
    muter(d)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=2)
        f.write("\n")


def scenario(nom, attendu, motif, preparer):
    """attendu : 'accepte' ou 'refuse'. motif : fragment attendu du refus."""
    clone = tempfile.mkdtemp(prefix="voteclair-test-")
    try:
        sh(None, "git", "clone", "-q", "--no-hardlinks", RACINE, clone)
        git(clone, "checkout", "-q", "-B", "essai", "origin/%s" % BASE)
        preparer(clone)
        git(clone, "add", "-A")
        git(clone, "-c", "user.email=t@t", "-c", "user.name=t",
            "commit", "-q", "--allow-empty", "-m", "essai")
        r = sh(clone, sys.executable, "tools/garde_fou.py", "origin/%s" % BASE)
        refuse = r.returncode != 0
        ok = (refuse and attendu == "refuse") or (not refuse and attendu == "accepte")
        if ok and motif:
            ok = motif in r.stdout
        print("  %-4s %-52s %s" % ("OK" if ok else "ECHEC", nom,
                                   "refuse" if refuse else "accepte"))
        if not ok:
            print("       attendu : %s %s" % (attendu, motif or ""))
            for l in ((r.stdout + r.stderr).strip().split("\n"))[-8:]:
                print("       | " + l)
        return ok
    finally:
        shutil.rmtree(clone, ignore_errors=True)


# ── Les six situations ────────────────────────────────────────────────

def revalidation(c):
    """La veille reverifie un fait et le redate. Rien ne change a l'ecran."""
    maj_json(c, "data/partis.json",
             lambda d: d["rn"]["dirigeant"].__setitem__("verifie_le", "2026-11-01"))


def veille_projetee(c):
    """Un dirigeant change : data/ puis projection. Le cas nominal."""
    maj_json(c, "data/partis.json",
             lambda d: d["ps"]["dirigeant"].__setitem__("valeur", "Nouveau Dirigeant"))
    sh(c, sys.executable, "tools/projeter.py")


def source_ajoutee(c):
    """Verser une preuve au dossier est permis."""
    maj_json(c, "data/sources.json", lambda d: d.__setitem__("src:essai", {
        "libelle_cite": "Essai", "editeur": "Essai", "rang": 2,
        "url": "https://example.org", "date_publication": None,
        "annee_citee": None, "consulte_le": "2026-09-22",
        "archive": None, "note": None}))


def poids_modifie(c):
    """Une IA qui deraille et retouche la ponderation du quiz."""
    def m(d):
        q = list(d["poids"])[0]
        o = list(d["poids"][q])[0]
        d["poids"][q][o] = 99
    maj_json(c, "data/poids/rn.json", m)


def html_retouche(c):
    """Projection legitime, plus une phrase glissee a la main."""
    maj_json(c, "data/partis.json",
             lambda d: d["ps"]["dirigeant"].__setitem__("valeur", "Nouveau Dirigeant"))
    sh(c, sys.executable, "tools/projeter.py")
    p = os.path.join(c, "parti-parti-socialiste.html")
    s = open(p, encoding="utf-8").read().replace(
        "<h1>", "<h1>SOUS-TITRE AJOUTE ", 1)
    open(p, "w", encoding="utf-8").write(s)


def noyau_touche(c):
    """Le calcul de correspondance du quiz."""
    p = os.path.join(c, "js", "quiz.js")
    s = open(p, encoding="utf-8").read()
    open(p, "w", encoding="utf-8").write(s.replace("'use strict';", "'use strict'; /* x */", 1))


def publication_sans_source(c):
    """Un fait passe en 'confirme' sans la source que la politique exige."""
    def m(d):
        d["modem"]["dirigeant"]["confiance"] = "confirme"
        d["modem"]["dirigeant"]["sources"] = []
        d["modem"]["dirigeant"]["verifie_le"] = "2026-09-22"
    maj_json(c, "data/partis.json", m)


CAS = [
    ("revalidation sans changement",            "accepte", None,              revalidation),
    ("mise a jour de data/ puis projection",    "accepte", None,              veille_projetee),
    ("ajout d'une source",                      "accepte", None,              source_ajoutee),
    ("retouche d'un poids du quiz",             "refuse",  "CHAMP GELE",      poids_modifie),
    ("HTML retouche a la main en plus",         "refuse",  "HORS PROJECTION", html_retouche),
    ("modification du noyau (js/quiz.js)",      "refuse",  "HORS PERIMETRE",  noyau_touche),
    ("publication sans source suffisante",      "refuse",  "SOURCE FAIBLE",   publication_sans_source),
]


def main():
    print("GARDE-FOU — %d situations\n" % len(CAS))
    resultats = [scenario(n, a, m, p) for n, a, m, p in CAS]
    print()
    if all(resultats):
        print("Les %d situations se comportent comme prevu." % len(CAS))
        return 0
    print("%d situation(s) en echec." % resultats.count(False))
    return 1


if __name__ == "__main__":
    sys.exit(main())
