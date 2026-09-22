"""Extrait le calendrier électoral vers data/elections.json.

Corrige au passage le défaut de modélisation d'origine : le champ `type`
mélangeait la NATURE du scrutin (nationale, locale, date butoir) et son
ÉTAT TEMPOREL (passe). C'est ce mélange qui laissait les municipales de
mars 2026 affichées comme « à venir, date estimée » six mois après le
scrutin. Ici, `nature` ne dit que la nature ; l'état passé se dérive de
la date, et ne peut donc plus se désynchroniser.

Les `lien` d'origine pointent vers service-public.fr ou vie-publique.fr :
ce sont des pages qui expliquent le déroulement d'un scrutin, pas des
actes qui en fixent la date. Ils sont conservés comme liens
d'information, et la date reste explicitement non sourcée — c'est le
décret de convocation au Journal officiel qui fera foi, et c'est ce que
la veille aura à récupérer.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from jsdata import eval_litteral, ecrire_json

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(RACINE, "data")

# Les trois entrées marquées `passe` retrouvent leur nature réelle.
NATURE_RETABLIE = {
    "euro-2024": "nationale",
    "legis-2024-1": "nationale",
    "legis-2024-2": "nationale",
}


def main():
    E = eval_litteral(os.path.join(RACINE, "calendrier.html"),
                      "const ELECTIONS", "\n/*", "ELECTIONS")
    out = []
    retablies = 0
    for e in E:
        nature = e["type"]
        if nature == "passe":
            nature = NATURE_RETABLIE.get(e["id"])
            if not nature:
                raise SystemExit("nature inconnue pour l'entrée passée %r" % e["id"])
            retablies += 1
        out.append({
            "id": e["id"],
            "nature": nature,
            "date": {
                "valeur": e["date"],
                "sources": [],
                "verifie_le": None,
                # `statut` porte l'officialisation : une date confirmée l'est
                # par décret, une date estimée ne l'est pas encore. Aucune des
                # deux n'est adossée à une source dans les données d'origine.
                "confiance": "a_verifier",
                "auteur": "humain",
            },
            "statut": e["statut"],
            "titre": e["titre"],
            "sous_titre": e["sous_titre"],
            "emoji": e["emoji"],
            "couleur": e["couleur"],
            "description": e["description"],
            "qui_vote": e["qui_vote"],
            "ce_qui_est_elu": e["ce_qui_est_elu"],
            "date_inscription": e.get("date_inscription"),
            "lien_infos": e.get("lien"),
        })

    ecrire_json(os.path.join(DATA, "elections.json"), {
        "note": "L'état « passé » se dérive de la date, il n'est pas stocké. "
                "`nature` ne décrit que la nature du scrutin.",
        "elections": out,
    })
    natures = {}
    for e in out:
        natures[e["nature"]] = natures.get(e["nature"], 0) + 1
    print("elections.json : %d entrées, %d natures rétablies" % (len(out), retablies))
    print("  répartition :", ", ".join("%s=%d" % kv for kv in sorted(natures.items())))
    print("  dates sourcées : 0/%d — toutes à récupérer (décret de convocation)" % len(out))


if __name__ == "__main__":
    main()
