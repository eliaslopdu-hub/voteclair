"""Controle les invariants de data/ et chiffre la dette de sourcage.

Deux categories de resultat, volontairement distinguees :

  ERREUR  un invariant structurel est viole. La CI doit echouer : c'est
          un defaut introduit par une modification.
  DETTE   un fait est publie sans source, sans date de verification, ou
          sur une source perimee. C'est l'etat herite du site, pas une
          regression. On le compte et on le compare a une reference
          (data/tests-baseline.json) : la CI echoue si la dette AUGMENTE.

Confondre les deux rendrait la CI rouge en permanence, donc inutile.
"""
import sys, os, json, re, hashlib, datetime

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(RACINE, "data")
AUJOURD_HUI = datetime.date.today()

erreurs, dette = [], {}


def err(test, msg):
    erreurs.append((test, msg))


def dett(cle, n=1):
    dette[cle] = dette.get(cle, 0) + n


def lire(*p):
    return json.load(open(os.path.join(DATA, *p), encoding="utf-8"))


def enveloppes(obj, chemin=""):
    """Parcourt recursivement et rend chaque enveloppe de fait rencontree."""
    if isinstance(obj, dict):
        if "valeur" in obj and "confiance" in obj:
            yield chemin, obj
            return
        for k, v in obj.items():
            yield from enveloppes(v, "%s.%s" % (chemin, k) if chemin else k)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from enveloppes(v, "%s[%d]" % (chemin, i))


# ── Chargement ────────────────────────────────────────────────────────
partis = lire("partis.json")
themes = lire("themes.json")
sources = lire("sources.json")
distances = lire("distances.json")
questions = lire("questions.json")
gel = lire("questions-ordre-v1.json")
elections = lire("elections.json")
politique = lire("politique-veille.json")
poids = {f[:-5]: lire("poids", f) for f in sorted(os.listdir(os.path.join(DATA, "poids")))}
positions = {f[:-5]: lire("positions", f) for f in sorted(os.listdir(os.path.join(DATA, "positions")))}

CONFIANCES = {"confirme", "a_verifier", "propose", "perime", "a_faire"}

# ── test_source_obligatoire / rang / fraicheur ────────────────────────
corpus = {"partis": partis, "distances": distances["paires"],
          "elections": elections["elections"], "positions": positions}
n_faits = 0
for racine, obj in corpus.items():
    for chemin, e in enveloppes(obj, racine):
        n_faits += 1
        if e["confiance"] not in CONFIANCES:
            err("test_confiance_valide", "%s : confiance %r inconnue" % (chemin, e["confiance"]))
        for sid in e.get("sources", []):
            if sid not in sources:
                err("test_source_obligatoire", "%s : source inconnue %r" % (chemin, sid))
        if not e.get("sources"):
            dett("faits sans aucune source")
        if e.get("verifie_le") is None:
            dett("faits jamais verifies")
        if e["confiance"] == "confirme":
            rangs = [sources[s]["rang"] for s in e.get("sources", []) if s in sources]
            if not rangs or min(rangs) > politique["rang_max_publiable"]:
                err("test_rang_source",
                    "%s : marque 'confirme' sans source de rang <= %d"
                    % (chemin, politique["rang_max_publiable"]))
        if e["confiance"] == "perime":
            dett("faits sur source perimee")

# ── test_source_url ───────────────────────────────────────────────────
for sid, s in sources.items():
    if not s.get("url"):
        dett("sources sans URL")
    if s["rang"] not in (1, 2, 3, 4):
        err("test_rang_source", "%s : rang %r hors bareme" % (sid, s["rang"]))

# ── test_symetrie_matrice ─────────────────────────────────────────────
ids_comp = sorted(p for p, v in partis.items() if v["perimetre"]["comparateur"])
attendues = {"|".join(sorted([a, b])) for i, a in enumerate(ids_comp) for b in ids_comp[i + 1:]}
if set(distances["paires"]) != attendues:
    manquantes = attendues - set(distances["paires"])
    surplus = set(distances["paires"]) - attendues
    if manquantes:
        err("test_symetrie_matrice", "paires manquantes : %s" % sorted(manquantes)[:5])
    if surplus:
        err("test_symetrie_matrice", "paires en trop : %s" % sorted(surplus)[:5])
for cle, paire in distances["paires"].items():
    if sorted(paire) != sorted(distances["themes"]):
        err("test_symetrie_matrice", "%s : themes incomplets" % cle)
    for t, e in paire.items():
        v = e["valeur"]
        if not isinstance(v, int) or not 0 <= v <= 100:
            err("test_symetrie_matrice", "%s/%s : valeur %r hors [0,100]" % (cle, t, v))

# ── test_partition_themes ─────────────────────────────────────────────
can = set(themes["canoniques"])
for nom, vue in themes["vues"].items():
    vus = [c for t in vue["themes"] for c in t["canoniques"]]
    inconnus = sorted(set(vus) - can)
    doubles = sorted({c for c in vus if vus.count(c) > 1})
    absents = sorted(can - set(vus))
    if inconnus:
        err("test_partition_themes", "vue %s : canoniques inconnus %s" % (nom, inconnus))
    if doubles:
        err("test_partition_themes", "vue %s : double comptage %s" % (nom, doubles))
    if vue["complet"] and absents:
        err("test_partition_themes", "vue %s declaree complete mais omet %s" % (nom, absents))
    if absents != sorted(vue["omissions"]):
        err("test_partition_themes",
            "vue %s : omissions declarees %s, reelles %s" % (nom, sorted(vue["omissions"]), absents))

# ── test_perimetre ────────────────────────────────────────────────────
qs_notees = [q for q in questions["ordre"] if questions["questions"][q]["theme"] != "profil"]
for pid, p in partis.items():
    per = p["perimetre"]
    if per["quiz"]:
        if pid not in poids:
            err("test_perimetre", "%s au quiz mais data/poids/%s.json absent" % (pid, pid))
        else:
            couvertes = set(poids[pid]["poids"])
            if not couvertes:
                err("test_perimetre", "%s au quiz sans aucun poids" % pid)
            dett("questions notees sans poids (tous partis confondus)",
                 len([q for q in qs_notees if q not in couvertes]))
    if per["comparateur"]:
        comp = positions.get(pid, {}).get("comparateur", {})
        manque = [t for t in distances["themes"] if t not in comp]
        if manque:
            err("test_perimetre", "%s au comparateur, themes absents : %s" % (pid, manque))
    if per["fiche"]:
        if not p.get("fichier") or not os.path.exists(os.path.join(RACINE, p["fichier"])):
            err("test_perimetre", "%s a une fiche mais le fichier est introuvable" % pid)
        d = positions.get(pid, {})
        if len(d.get("points_programme", [])) != 10:
            err("test_perimetre", "%s : %d points au lieu de 10" % (pid, len(d.get("points_programme", []))))
        if len(d.get("figures", [])) != 4:
            err("test_perimetre", "%s : %d figures au lieu de 4" % (pid, len(d.get("figures", []))))
        for i, f in enumerate(d.get("figures", [])):
            if not f.get("licence_label") or not f.get("credit_auteur"):
                err("test_licence_photo", "%s figure %d : attribution incomplete" % (pid, i + 1))

# ── test_ordre_questions_gele ─────────────────────────────────────────
empreinte = hashlib.sha256(
    json.dumps(gel["questions"], ensure_ascii=False, sort_keys=True).encode()
).hexdigest()

# ── test_liens_internes ───────────────────────────────────────────────
pages = [f for f in os.listdir(RACINE) if f.endswith(".html")]
for page in sorted(pages):
    html = open(os.path.join(RACINE, page), encoding="utf-8").read()
    for cible in set(re.findall(r'href="([a-z0-9][a-z0-9._-]*\.html)"', html)):
        if not os.path.exists(os.path.join(RACINE, cible)):
            err("test_liens_internes", "%s -> %s (inexistant)" % (page, cible))
    for src in set(re.findall(r'src="(assets/[^"]+)"', html)):
        if not os.path.exists(os.path.join(RACINE, src)):
            err("test_liens_internes", "%s -> %s (inexistant)" % (page, src))

# ── Rapport ───────────────────────────────────────────────────────────
base_f = os.path.join(DATA, "tests-baseline.json")
base = json.load(open(base_f, encoding="utf-8")) if os.path.exists(base_f) else {}

print("=" * 66)
print("VERIFICATION DE data/            %s" % AUJOURD_HUI)
print("=" * 66)
print("%d faits enveloppes, %d sources, %d partis, %d questions"
      % (n_faits, len(sources), len(partis), len(questions["ordre"])))
print("empreinte de l'ordre gele : %s" % empreinte[:16])
print()

if erreurs:
    print("ERREURS (%d) — invariant structurel viole" % len(erreurs))
    par_test = {}
    for t, m in erreurs:
        par_test.setdefault(t, []).append(m)
    for t in sorted(par_test):
        print("  %s (%d)" % (t, len(par_test[t])))
        for m in par_test[t][:6]:
            print("      " + m)
        if len(par_test[t]) > 6:
            print("      ... et %d autres" % (len(par_test[t]) - 6))
else:
    print("ERREURS : aucune — tous les invariants structurels tiennent.")
print()

print("DETTE HERITEE — a resorber, ne fait pas echouer la CI tant qu'elle n'augmente pas")
aggravee = False
ref = base.get("dette", {})
for cle in sorted(dette):
    avant = ref.get(cle)
    if avant is None:
        marque = "(nouvelle mesure)"
    elif dette[cle] > avant:
        marque, aggravee = "AGGRAVEE (etait %d)" % avant, True
    elif dette[cle] < avant:
        marque = "en baisse (etait %d)" % avant
    else:
        marque = "stable"
    print("  %-52s %5d  %s" % (cle, dette[cle], marque))

gel_ref = base.get("empreinte_ordre_v1")
if gel_ref and gel_ref != empreinte:
    err("test_ordre_questions_gele",
        "l'ordre gele des questions a change : les liens #r= deja partages sont invalides")
    print()
    print("  ORDRE GELE MODIFIE — reference %s, actuel %s" % (gel_ref[:16], empreinte[:16]))

print()
if erreurs:
    print("RESULTAT : ECHEC (%d erreurs)" % len(erreurs))
    sys.exit(1)
if aggravee:
    print("RESULTAT : ECHEC — la dette a augmente")
    sys.exit(1)
print("RESULTAT : OK")
if "--ecrire-baseline" in sys.argv:
    json.dump({"date": str(AUJOURD_HUI), "empreinte_ordre_v1": empreinte, "dette": dette},
              open(base_f, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    open(base_f, "a", encoding="utf-8").write("\n")
    print("Reference ecrite dans data/tests-baseline.json")
