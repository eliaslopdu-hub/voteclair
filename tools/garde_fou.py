"""Refuse une modification automatique qui sortirait de son perimetre.

Se lance sur une branche de veille, avant la fusion :

    python3 tools/garde_fou.py origin/main

Trois interdits, dans cet ordre de gravite :

  1. toucher autre chose que data/          — le noyau (quiz, methodologie,
     design, calcul de correspondance) est fige. Une automatisation qui
     modifie quiz.js change le sens des reponses deja donnees.
  2. toucher un champ marque auto=false     — poids, distances, questions,
     ideologie, perimetre : ce sont des jugements politiques.
  3. publier un fait sans source suffisante — `confirme` exige une source
     de rang <= rang_min declare pour ce champ.

Le garde-fou de plateforme (.github/CODEOWNERS) fait le meme travail cote
GitHub. Les deux, parce que celui-ci est du code, et que du code se trompe.
"""
import sys, os, json, subprocess

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import politique as P

refus = []


def git(*a):
    return subprocess.run(["git"] + list(a), cwd=P.RACINE,
                          capture_output=True, text=True, check=True).stdout


def charge_a(ref, rel):
    try:
        return json.loads(git("show", "%s:%s" % (ref, rel)))
    except subprocess.CalledProcessError:
        return None


def aplatis(contenu, prefixe):
    return {c: e for c, e in P.enveloppes(contenu, prefixe)} if contenu else {}


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

    # 1. Perimetre de fichiers
    hors = [f for f in modifies if not f.startswith("data/")]
    for f in hors:
        refus.append("HORS PERIMETRE  %s — seul data/ peut etre modifie "
                     "automatiquement ; le noyau du site est fige." % f)

    # 2 et 3. Champ par champ
    index = {rel: prefixe for rel, prefixe, _ in P.fichiers_data()}
    for rel in modifies:
        if not rel.startswith("data/") or not rel.endswith(".json"):
            continue
        prefixe = index.get(rel)
        if prefixe is None:
            continue
        avant = aplatis(charge_a(base, rel), prefixe)
        apres = aplatis(charge_a("HEAD", rel), prefixe)
        sources = charge_a("HEAD", "data/sources.json") or {}

        for chemin in sorted(set(avant) | set(apres)):
            a, b = avant.get(chemin), apres.get(chemin)
            if a == b:
                continue
            r = P.regle(pol, chemin)
            if r is None or not r.get("auto"):
                refus.append("CHAMP GELE      %s — auto=false%s"
                             % (chemin, (" : " + r["justification"])
                                if r and r.get("justification") else ""))
                continue
            if b and b.get("confiance") == "confirme":
                rangs = [sources[s]["rang"] for s in b.get("sources", []) if s in sources]
                mini = r.get("rang_min", pol["rang_max_publiable"])
                if not rangs or min(rangs) > mini:
                    refus.append("SOURCE FAIBLE   %s — marque 'confirme' sans source "
                                 "de rang <= %d" % (chemin, mini))
                elif r.get("double_source") and len(b.get("sources", [])) < 2:
                    refus.append("SOURCE UNIQUE   %s — ce champ exige deux sources "
                                 "independantes" % chemin)

    if refus:
        print("REFUS (%d) — cette branche ne peut pas etre fusionnee telle quelle :\n" % len(refus))
        for m in refus:
            print("  " + m)
        print("\nCe n'est pas un bug : la politique de veille interdit ces "
              "modifications sans arbitrage humain.")
        return 1
    print("Perimetre respecte : modifications recevables.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "origin/main"))
