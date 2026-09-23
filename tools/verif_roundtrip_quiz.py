"""Vérifie que data/ reconstruit exactement les QUESTIONS d'origine.

Si ce test passe, la migration ne peut pas avoir perdu ni déformé un
poids : le JSON contient rigoureusement la même information que le
littéral JS, à la structure près.
"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from jsdata import eval_litteral

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(RACINE, "data")
lire = lambda *p: json.load(open(os.path.join(DATA, *p), encoding="utf-8"))


def reconstruire():
    qs, gel = lire("questions.json"), lire("questions-ordre-v1.json")
    partis = [f[:-5] for f in sorted(os.listdir(os.path.join(DATA, "poids")))]
    poids = {p: lire("poids", p + ".json")["poids"] for p in partis}

    out = []
    for entree in gel["questions"]:
        qid, e = entree["qid"], qs["questions"][entree["qid"]]
        q = {"id": int(qid[1:]), "type": e["type"], "theme": e["theme"],
             "question": e["question"]}
        if e["type"] == "single":
            q["profileWeight"] = e["profileWeight"]
            q["options"] = e["options"]

        # Recompose « option -> parti -> points » depuis « parti -> ... ».
        seaux = {}
        for p in partis:
            for ck, pts in poids[p].get(qid, {}).items():
                seaux.setdefault(ck, {})[p] = pts

        if e["type"] == "scale":
            q["scaleMin"], q["scaleMax"] = e["scaleMin"], e["scaleMax"]
            q["weights"] = {c: seaux.get(c, {}) for c in ("1", "2", "3", "4", "5")}
        elif e["type"] == "single":
            q["weights"] = {lab: seaux.get("o%d" % i, {})
                            for i, lab in enumerate(e["options"])}
        else:
            for cote, ck in (("optionA", "A"), ("optionB", "B")):
                q[cote] = dict(e[cote]); q[cote]["weights"] = seaux.get(ck, {})
        out.append(q)
    return out


def norm(o):
    """Ordre des clés et types numériques ne comptent pas ; les valeurs, si."""
    if isinstance(o, dict):
        return {k: norm(v) for k, v in sorted(o.items()) if not (isinstance(v, dict) and not v)}
    if isinstance(o, list):
        return [norm(x) for x in o]
    return o


origine = eval_litteral(os.path.join(RACINE, "js", "quiz.js"),
                        "const QUESTIONS = [", "const RAPIDE_COUNT", "QUESTIONS")
refait = reconstruire()

a, b = norm(origine), norm(refait)
if a == b:
    tot = sum(len(v) for p in os.listdir(os.path.join(DATA, "poids"))
              for v in lire("poids", p)["poids"].values())
    print("ALLER-RETOUR IDENTIQUE : %d questions, %d emplacements de poids" % (len(refait), tot))
    sys.exit(0)

print("DIVERGENCE")
for i, (x, y) in enumerate(zip(a, b)):
    if x != y:
        print("  question index %d (id=%s)" % (i, origine[i]["id"]))
        for k in sorted(set(x) | set(y)):
            if x.get(k) != y.get(k):
                print("    %s:\n      origine : %s\n      refait  : %s"
                      % (k, json.dumps(x.get(k), ensure_ascii=False)[:200],
                         json.dumps(y.get(k), ensure_ascii=False)[:200]))
        break
sys.exit(1)
