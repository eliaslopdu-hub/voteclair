"""Refuse une modification automatique qui sortirait de son perimetre.

Se lance sur une branche de veille, avant la fusion :

    python3 tools/garde_fou.py origin/main

Quatre interdits, dans cet ordre de gravite :

  1. toucher autre chose que data/          — le noyau (quiz, methodologie,
     design, calcul de correspondance) est fige. Une automatisation qui
     modifie quiz.js change le sens des reponses deja donnees.
  2. toucher un champ marque auto=false     — poids, distances, questions,
     ideologie, perimetre : ce sont des jugements politiques.
  3. reecrire une source existante          — on ajoute une preuve, on ne
     retouche pas celles qui ont deja servi a valider un fait.
  4. publier un fait sans source suffisante — `confirme` exige une source
     du rang declare, et deux sources quand le champ l'exige.

Le diff se fait feuille par feuille, pas enveloppe par enveloppe : tous les
fichiers de data/ ne sont pas au format enveloppe (data/poids/ contient des
entiers nus), et un controle qui ne verrait que les enveloppes laisserait
passer une modification des poids du quiz.

Le garde-fou de plateforme (.github/CODEOWNERS) fait le meme travail cote
GitHub. Les deux, parce que celui-ci est du code, et que du code se trompe.
"""
import sys, os, json, subprocess

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import politique as P
import projeter

refus = []


def git(*a):
    return subprocess.run(["git"] + list(a), cwd=P.RACINE,
                          capture_output=True, text=True, check=True).stdout


def charge_a(ref, rel):
    try:
        return json.loads(git("show", "%s:%s" % (ref, rel)))
    except subprocess.CalledProcessError:
        return None


def feuilles(obj, chemin=""):
    """Rend (chemin, valeur) pour chaque feuille scalaire de l'arbre."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            yield from feuilles(v, "%s.%s" % (chemin, k) if chemin else k)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from feuilles(v, "%s[%d]" % (chemin, i))
    else:
        yield chemin, obj


def regle_couvrante(pol, chemin):
    """La regle du chemin, ou de son plus proche ancetre qui en a une.

    `partis.lr.dirigeant.valeur` n'a pas de regle propre ; c'est
    `partis.*.dirigeant` qui la porte.
    """
    segs = chemin.split(".")
    for i in range(len(segs), 0, -1):
        r = P.regle(pol, ".".join(segs[:i]))
        if r is not None:
            return ".".join(segs[:i]), r
    return None, None


def controle_fichier(pol, rel, prefixe, base, sources):
    avant, apres = charge_a(base, rel), charge_a("HEAD", rel)
    fa = dict(feuilles(avant, prefixe)) if avant is not None else {}
    fb = dict(feuilles(apres, prefixe)) if apres is not None else {}

    # Une source nouvelle est une preuve versee au dossier, pas un fait
    # publie : on l'autorise. Retoucher une source existante, non.
    sources_avant = set((avant or {}).keys()) if prefixe == "sources" else set()

    for chemin in sorted(set(fa) | set(fb)):
        if fa.get(chemin, object()) == fb.get(chemin, object()):
            continue
        if prefixe == "sources":
            sid = chemin.split(".")[1] if "." in chemin else None
            if sid is not None and sid not in sources_avant:
                continue                      # ajout d'une source : permis
            if chemin.endswith(".archive"):
                continue                      # copie Wayback : permis
            refus.append("SOURCE REECRITE  %s — une source qui a deja servi "
                         "ne se retouche pas" % chemin)
            continue
        motif, r = regle_couvrante(pol, chemin)
        if r is None:
            refus.append("SANS REGLE       %s — aucune regle ne couvre ce "
                         "chemin ; par defaut, interdit" % chemin)
        elif not r.get("auto"):
            refus.append("CHAMP GELE       %s (regle %s) — auto=false%s"
                         % (chemin, motif,
                            " : " + r["justification"] if r.get("justification") else ""))

    # Rang et nombre de sources, sur les enveloppes passees en 'confirme'.
    if apres is None:
        return
    ea = dict(P.enveloppes(avant, prefixe)) if avant is not None else {}
    for chemin, env in P.enveloppes(apres, prefixe):
        if ea.get(chemin) == env or env.get("confiance") != "confirme":
            continue
        _, r = regle_couvrante(pol, chemin)
        if r is None or not r.get("auto"):
            continue
        mini = r.get("rang_min", pol["rang_max_publiable"])
        rangs = [sources[s]["rang"] for s in env.get("sources", []) if s in sources]
        if not rangs or min(rangs) > mini:
            refus.append("SOURCE FAIBLE    %s — marque 'confirme' sans source "
                         "de rang <= %d" % (chemin, mini))
        elif r.get("double_source") and len(env.get("sources", [])) < 2:
            refus.append("SOURCE UNIQUE    %s — ce champ exige deux sources "
                         "independantes" % chemin)


def controle_projection(base, modifies):
    """Autorise un diff HTML s'il n'est QUE la projection de data/.

    La veille ecrit dans data/, puis lance tools/projeter.py : la PR
    contient donc des fichiers HTML. Les refuser en bloc casserait la
    chaine ; les accepter en bloc rouvrirait la porte que ce garde-fou
    est cense fermer.

    On tranche en rejouant la projection : on part du HTML de la branche
    de base, on y projette les donnees de la branche proposee, et le
    resultat doit etre exactement le HTML propose. Si un caractere a ete
    ajoute a la main quelque part dans ces fichiers, l'egalite tombe.
    """
    html_modifies = [f for f in modifies if not f.startswith("data/")]
    if not html_modifies:
        return

    try:
        partis = charge_a("HEAD", "data/partis.json")
        elections = charge_a("HEAD", "data/elections.json")
        projeter.LECTEUR = lambda f: git("show", "%s:%s" % (base, f))
        projeter.reinitialiser()
        attendu = projeter.projeter_tout(partis, elections)
    except Exception as e:                       # noqa: BLE001
        refus.append("PROJECTION IMPOSSIBLE — %s : dans le doute, on refuse." % e)
        return
    finally:
        projeter.LECTEUR = projeter.lire_du_disque

    for f in html_modifies:
        if f not in attendu:
            refus.append("HORS PERIMETRE   %s — ce fichier n'est pas produit par "
                         "la projection ; le noyau du site est fige." % f)
            continue
        if git("show", "HEAD:%s" % f) != attendu[f]:
            refus.append("HORS PROJECTION  %s — ce fichier contient des "
                         "modifications que la projection de data/ ne produit "
                         "pas. Une main est passee par la." % f)


def main(base):
    pol = P.charger()
    modifies = [l for l in git("diff", "--name-only", "%s...HEAD" % base).split("\n") if l]
    if not modifies:
        print("Aucun fichier modifie.")
        return 0

    print("Fichiers modifies (%d) :" % len(modifies))
    for f in modifies:
        print("   ", f)
    print()

    controle_projection(base, modifies)

    index = {rel: prefixe for rel, prefixe, _ in P.fichiers_data()}
    sources = charge_a("HEAD", "data/sources.json") or {}
    for rel in modifies:
        if rel.startswith("data/") and rel.endswith(".json") and rel in index:
            controle_fichier(pol, rel, index[rel], base, sources)

    if refus:
        print("REFUS (%d) — cette branche ne peut pas etre fusionnee telle quelle :\n"
              % len(refus))
        for m in refus:
            print("  " + m)
        print("\nCe n'est pas un bug : la politique de veille interdit ces "
              "modifications sans arbitrage humain.")
        return 1
    print("Perimetre respecte : modifications recevables.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "origin/main"))
