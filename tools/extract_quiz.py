"""Extrait les données du quiz de js/quiz.js vers data/.

Sépare trois choses aujourd'hui mélangées :
  - l'énoncé des questions            -> data/questions.json
  - les poids attribués par parti     -> data/poids/<parti>.json
  - l'ordre gelé pour les liens émis  -> data/questions-ordre-v1.json

Le troisième fichier est le plus important. `encoderReponses()` encode
l'INDICE de la question dans le tableau, et `decoderReponses()` relit
`q.options[oi]` par indice lui aussi. Tout réordonnancement remapperait
silencieusement les liens `#r=` déjà partagés : un lien rouvert
afficherait un autre verdict politique, présenté comme les réponses de
la personne. Ce fichier fige l'ordre pour qu'un test puisse le défendre.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from jsdata import eval_litteral, ecrire_json

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QUIZ = os.path.join(RACINE, "js", "quiz.js")
DATA = os.path.join(RACINE, "data")


def cle_option(q, brut):
    """Clé stable d'une option, indépendante de son libellé.

    Les poids sont indexés par indice (o0, o1…) et non par libellé : une
    correction de typo dans un intitulé ne doit pas faire disparaître
    silencieusement les points d'un parti.
    """
    if q["type"] == "scale":
        return str(brut)
    if q["type"] == "dilemma":
        return "A" if brut == "optionA" else "B"
    return "o%d" % q["options"].index(brut)


def main():
    questions = eval_litteral(QUIZ, "const QUESTIONS = [", "const RAPIDE_COUNT", "QUESTIONS")
    rapide = eval_litteral(QUIZ, "const RAPIDE_COUNT", "\n\n", "RAPIDE_COUNT")
    meta = eval_litteral(QUIZ, "const PARTIS_META = {", "const THEMES = {", "PARTIS_META")
    partis = list(meta.keys())

    ordre, enonces = [], {}
    poids = {p: {} for p in partis}
    gel = {"format": "v1", "note": (
        "Table figée : indice dans QUESTIONS -> identifiant de question, et ordre "
        "des options. Les liens de partage #r= encodent ces indices. Toute "
        "modification de ce fichier invalide des liens déjà en circulation."
    ), "questions": []}

    for idx, q in enumerate(questions):
        qid = "q%d" % q["id"]
        ordre.append(qid)

        e = {"type": q["type"], "theme": q["theme"], "question": q["question"]}
        if q["type"] == "scale":
            e["scaleMin"], e["scaleMax"] = q["scaleMin"], q["scaleMax"]
        elif q["type"] == "single":
            e["options"] = list(q["options"])
            e["profileWeight"] = q["profileWeight"]
        elif q["type"] == "dilemma":
            for cote in ("optionA", "optionB"):
                e[cote] = {k: v for k, v in q[cote].items() if k != "weights"}
        enonces[qid] = e

        gel["questions"].append({
            "index": idx, "qid": qid,
            "options": list(q["options"]) if q["type"] == "single" else None,
        })

        # Les poids : on retourne la structure « option -> parti -> points »
        # en « parti -> question -> option -> points ».
        if q["type"] == "dilemma":
            buckets = {"optionA": q["optionA"]["weights"], "optionB": q["optionB"]["weights"]}
        else:
            buckets = q["weights"]
        for brut, w in buckets.items():
            ck = cle_option(q, brut)
            for p, pts in (w or {}).items():
                if p not in poids:
                    raise SystemExit("parti inconnu dans les poids : %r (%s)" % (p, qid))
                poids[p].setdefault(qid, {})[ck] = pts

    os.makedirs(os.path.join(DATA, "poids"), exist_ok=True)
    ecrire_json(os.path.join(DATA, "questions.json"),
                {"rapide_count": rapide, "ordre": ordre, "questions": enonces})
    ecrire_json(os.path.join(DATA, "questions-ordre-v1.json"), gel)
    for p in partis:
        ecrire_json(os.path.join(DATA, "poids", "%s.json" % p),
                    {"parti": p, "poids": poids[p]})

    print("questions.json          : %d questions, rapide_count=%d" % (len(enonces), rapide))
    print("questions-ordre-v1.json : %d indices gelés" % len(gel["questions"]))
    for p in partis:
        n = sum(len(v) for v in poids[p].values())
        print("poids/%-12s : %2d questions, %3d emplacements" % (p + ".json", len(poids[p]), n))


if __name__ == "__main__":
    main()
