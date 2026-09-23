"""Liste les faits dont la cadence de reverification est depassee.

Aucune IA, aucun reseau : on compare `verifie_le` a la cadence declaree dans
data/politique-veille.json. C'est ce rapport qui decide s'il y a lieu de
lancer une recherche — pas l'inverse. Un mois sans fait perime doit pouvoir
se solder par « rien a faire », sinon l'automatisation invente du travail.

  python3 tools/perimes.py           rapport lisible
  python3 tools/perimes.py --json    pour un workflow
"""
import sys, os, json, datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import politique as P

AUJ = datetime.date.today()


def collecter():
    pol = P.charger()
    perimes, jamais, geles = [], [], 0
    for rel, prefixe, contenu in P.fichiers_data():
        for chemin, env in P.enveloppes(contenu, prefixe):
            r = P.regle(pol, chemin)
            if r is None or not r.get("auto"):
                geles += 1
                continue
            cad = r.get("cadence_jours")
            if cad is None:
                continue
            age = P.age_jours(env.get("verifie_le"), AUJ)
            item = {
                "chemin": chemin, "fichier": rel, "valeur": env.get("valeur"),
                "verifie_le": env.get("verifie_le"), "age_jours": age,
                "cadence_jours": cad, "rang_min": r.get("rang_min"),
                "double_source": r.get("double_source", False),
                "sources_attendues": r.get("sources_attendues", []),
            }
            if age is None:
                jamais.append(item)
            elif age > cad:
                perimes.append(item)
    perimes.sort(key=lambda i: -(i["age_jours"] - i["cadence_jours"]))
    return pol, perimes, jamais, geles


def main():
    pol, perimes, jamais, geles = collecter()
    if "--json" in sys.argv:
        json.dump({"date": AUJ.isoformat(), "perimes": perimes,
                   "jamais_verifies": jamais, "faits_geles": geles,
                   "total_a_traiter": len(perimes) + len(jamais)},
                  sys.stdout, ensure_ascii=False, indent=2)
        print()
        return 0

    print("=" * 66)
    print("FAITS A REVERIFIER".ljust(46) + AUJ.isoformat().rjust(20))
    print("=" * 66)
    print("%d faits sont geles par la politique (auto=false) : jamais touches\n"
          "par l'automatisation, quelle que soit leur anciennete.\n" % geles)

    if not perimes and not jamais:
        print("Rien a reverifier. Aucune recherche n'est justifiee aujourd'hui.")
        return 0

    for titre, lot in (("PERIMES — cadence depassee", perimes),
                       ("JAMAIS VERIFIES", jamais)):
        if not lot:
            continue
        print("%s (%d)" % (titre, len(lot)))
        for i in lot[:40]:
            retard = ("+%dj" % (i["age_jours"] - i["cadence_jours"])
                      if i["age_jours"] is not None else "—")
            print("  %-42s %-5s rang<=%s%s" % (
                i["chemin"][:42], retard, i["rang_min"],
                "  2 sources" if i["double_source"] else ""))
        if len(lot) > 40:
            print("  … et %d autres" % (len(lot) - 40))
        print()
    print("Total a traiter : %d" % (len(perimes) + len(jamais)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
