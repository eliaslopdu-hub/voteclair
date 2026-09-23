"""Projette data/ sur les surfaces du site. C'est data/ qui fait foi.

Sans cet outil, la chaine de veille s'arrete a mi-chemin : une PR fusionnee
ne modifie que data/, et le visiteur continue de lire l'ancien HTML. Le
site avait deja tout l'appareillage pour extraire le HTML vers data/ ; il
manquait le retour.

PRINCIPE — substitution ciblee, pas regeneration de page.
Chaque fait connu de data/ est ecrit a un endroit precis du HTML, et
seul cet endroit est reecrit. Une page n'est donc jamais reconstruite a
partir d'un gabarit : sa mise en forme, ses commentaires et ses
particularites (la couleur de lien de Renaissance, plus sombre que sa
couleur de marque parce qu'illisible sur blanc) survivent intactes. Le
diff d'une mise a jour tient en quelques lignes et reste relisible, ce
qui est la condition pour qu'un humain valide en quelques minutes.

GARANTIE — couverture complete du perimetre automatisable.
`--couverture` verifie que tout champ marque auto=true dans
data/politique-veille.json est bien projete quelque part. Si la veille
peut modifier un fait que personne ne sait afficher, la boucle est
rompue sans que rien ne le signale : ce controle l'interdit.

  python3 tools/projeter.py --verifier     rien n'est ecrit ; sort 1 si
                                           le site s'ecarte de data/
  python3 tools/projeter.py --couverture   controle du perimetre
  python3 tools/projeter.py                applique
"""
import sys, os, re, json, datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import politique as P

RACINE = P.RACINE
AUJ = datetime.date.today()

# Chaque projection se declare ici : quel fait, vers quel endroit.
# `chemin` sert au controle de couverture ; il doit correspondre aux
# motifs de data/politique-veille.json.
edits = []      # (chemin_data, fichier, ancien, nouveau)
manques = []


def html_echappe(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def js_chaine_simple(s):
    """Chaine entre apostrophes, comme les litteraux du site."""
    return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'"


def libelle_lien(url):
    """« https://www.republicains.fr » -> « republicains.fr ↗ »."""
    return re.sub(r"^https?://(www\.)?", "", url).rstrip("/") + " ↗"


def remplacer_unique(chemin, fichier, texte, motif, neuf, drapeaux=0):
    """Substitue l'unique occurrence de `motif`, ou signale le probleme."""
    trouves = list(re.finditer(motif, texte, drapeaux))
    if len(trouves) != 1:
        manques.append("%s : %d occurrence(s) de %s dans %s"
                       % (chemin, len(trouves), motif[:60], fichier))
        return texte
    m = trouves[0]
    ancien = m.group(0)
    if ancien == neuf:
        return texte
    edits.append((chemin, fichier, ancien.strip(), neuf.strip()))
    return texte[:m.start()] + neuf + texte[m.end():]


def sub_champ(chemin, fichier, texte, motif, valeur, rendu):
    """Substitue un champ et journalise l'ancienne et la nouvelle valeur.

    `motif` doit capturer en groupe 1 ce qui precede la valeur, et en
    groupe 2 l'ancienne valeur. On journalise la valeur, pas la ligne :
    c'est ce que le relecteur compare.
    """
    m = re.search(motif, texte, re.S)
    if m is None:
        manques.append("%s : repere introuvable dans %s" % (chemin, fichier))
        return texte
    ancien = m.group(2)
    neuf = rendu(valeur)
    if ancien == neuf:
        return texte
    edits.append((chemin, fichier, ancien, neuf))
    return texte[:m.start()] + m.group(1) + neuf + texte[m.end():]


def lire_du_disque(f):
    return open(os.path.join(RACINE, f), encoding="utf-8").read()


# Point d'injection : le garde-fou remplace ce lecteur pour projeter sur
# le HTML de la branche de base, et prouver ainsi qu'un diff HTML ne
# contient rien d'autre que la projection des donnees.
LECTEUR = lire_du_disque


def lire(f):
    return LECTEUR(f)


def reinitialiser():
    """Vide les journaux : necessaire entre deux projections successives."""
    del edits[:], manques[:]


def projeter_tout(partis, elections):
    """Rend {fichier: texte projete}. N'ecrit rien."""
    sortie = {}
    projeter_partis(partis, sortie)
    projeter_elections(elections, sortie)
    return sortie


# ── Les projections ───────────────────────────────────────────────────

def projeter_partis(partis, sortie):
    """dirigeant et site, sur les trois surfaces qui les affichent."""

    # a) partis.html — une carte par parti, reperee par le lien vers sa fiche.
    f = "partis.html"
    texte = sortie.get(f, lire(f))
    for pid, p in partis.items():
        if not p["perimetre"].get("fiche"):
            continue
        blocs = [m for m in re.finditer(
            r'<article class="parti-card fade-in">.*?</article>', texte, re.S)
            if 'href="%s"' % p["fichier"] in m.group(0)]
        if len(blocs) != 1:
            manques.append("partis.%s : %d carte(s) dans partis.html" % (pid, len(blocs)))
            continue
        d, fin = blocs[0].span()
        bloc = texte[d:fin]
        neuf = bloc

        neuf = sub_champ(
            "partis.%s.dirigeant" % pid, f, neuf,
            r'(<p class="parti-card-chef">Chef de file : <strong>)([^<]*)',
            p["dirigeant"]["valeur"], html_echappe)
        if p.get("site"):
            neuf = sub_champ(
                "partis.%s.site" % pid, f, neuf,
                r'(<a href=")([^"]*)(?=" target="_blank" rel="noopener" class="btn-parti-ext">)',
                p["site"]["valeur"], lambda v: v)
        if neuf != bloc:
            texte = texte[:d] + neuf + texte[fin:]
    sortie[f] = texte

    # b) la fiche de chaque parti — bloc parti-hero-meta.
    for pid, p in partis.items():
        if not p["perimetre"].get("fiche"):
            continue
        f = p["fichier"]
        texte = sortie.get(f, lire(f))
        m = re.search(r'<div class="parti-hero-meta">.*?</div>', texte, re.S)
        if not m:
            manques.append("partis.%s : parti-hero-meta introuvable dans %s" % (pid, f))
            continue
        d, fin = m.span()
        bloc = neuf = texte[d:fin]
        neuf = sub_champ(
            "partis.%s.dirigeant" % pid, f, neuf,
            r'(<strong>Chef\s*:</strong> )([^<]*)',
            p["dirigeant"]["valeur"], html_echappe)
        if p.get("site"):
            url = p["site"]["valeur"]
            neuf = sub_champ("partis.%s.site" % pid, f, neuf,
                             r'(<a href=")([^"]*)', url, lambda v: v)
            neuf = sub_champ("partis.%s.site" % pid + " (libelle)", f, neuf,
                             r'(<a href="[^"]*"[^>]*>)([^<]*)(?=</a>)',
                             url, libelle_lien)
        if neuf != bloc:
            texte = texte[:d] + neuf + texte[fin:]
        sortie[f] = texte

    # c) face-a-face.html — le litteral PARTIS.
    f = "face-a-face.html"
    texte = sortie.get(f, lire(f))
    d = texte.index("const PARTIS = {")
    fin = texte.index("const THEMES = [", d)
    bloc = texte[d:fin]
    neuf = bloc
    for pid, p in partis.items():
        if not p["perimetre"].get("comparateur"):
            continue
        chef = (p["dirigeant"].get("variantes") or {}).get("comparateur") \
            or p["dirigeant"]["valeur"]
        neuf = sub_champ(
            "partis.%s.dirigeant" % pid, f, neuf,
            r"(%s:\s*\{[^}]*?chef:\s*)('(?:[^'\\]|\\.)*')" % re.escape(pid),
            chef, js_chaine_simple)
    if neuf != bloc:
        texte = texte[:d] + neuf + texte[fin:]
    sortie[f] = texte


def projeter_elections(elections, sortie):
    """date, statut, et `type` — dont l'etat « passe » se derive de la date."""
    f = "calendrier.html"
    texte = sortie.get(f, lire(f))
    for e in elections["elections"]:
        eid = e["id"]
        blocs = list(re.finditer(r"\{\s*\n\s*id: '%s',.*?\n  \},"
                                 % re.escape(eid), texte, re.S))
        if len(blocs) != 1:
            manques.append("elections.%s : %d bloc(s) dans calendrier.html" % (eid, len(blocs)))
            continue
        d, fin = blocs[0].span()
        bloc = neuf = texte[d:fin]
        date = e["date"]["valeur"]
        # `type` porte la nature du scrutin. L'etat temporel se derive de
        # la date a l'affichage (estPassee), il n'est plus recopie ici :
        # c'est ce doublon qui avait laisse les municipales de mars 2026
        # annoncees comme a venir.
        for champ, valeur in (("date", date), ("statut", e["statut"]),
                              ("type", e["nature"])):
            neuf = sub_champ("elections.%s.%s" % (eid, champ), f, neuf,
                             r"(\n    %s: )('[^']*')" % champ,
                             valeur, js_chaine_simple)
        if neuf != bloc:
            texte = texte[:d] + neuf + texte[fin:]
    sortie[f] = texte


# ── Controle de couverture ────────────────────────────────────────────

# Un champ auto=true doit etre projete, ou bien porter ici la raison
# explicite pour laquelle il ne s'affiche pas.
NON_AFFICHES = {
    "sources.*.archive": "Copie Wayback : metadonnee de tracabilite, "
                         "jamais affichee au visiteur.",
}
COUVERTS = {"elections.*.date", "elections.*.statut",
            "partis.*.dirigeant", "partis.*.site"}


def couverture():
    pol = P.charger()
    autos = [m for m, r in pol["champs"].items() if r.get("auto")]
    trous = []
    print("COUVERTURE DU PERIMETRE AUTOMATISABLE\n")
    for m in sorted(autos):
        if m in COUVERTS:
            print("  projete        %s" % m)
        elif m in NON_AFFICHES:
            print("  non affiche    %s — %s" % (m, NON_AFFICHES[m]))
        else:
            print("  TROU           %s" % m)
            trous.append(m)
    print()
    if trous:
        print("%d champ(s) modifiable(s) par la veille ne sont projetes nulle part.\n"
              "Une PR les modifiant serait fusionnee sans que le site change." % len(trous))
        return 1
    print("Tout champ que la veille peut modifier atteint le site.")
    return 0


def charger_donnees():
    return (json.load(open(os.path.join(P.DATA, "partis.json"), encoding="utf-8")),
            json.load(open(os.path.join(P.DATA, "elections.json"), encoding="utf-8")))


def main():
    if "--couverture" in sys.argv:
        return couverture()

    partis, elections = charger_donnees()

    sortie = projeter_tout(partis, elections)

    verifier = "--verifier" in sys.argv
    print("PROJECTION DE data/ SUR LE SITE".ljust(46) + AUJ.isoformat().rjust(20))
    print("=" * 66)

    if manques:
        print("\nREPERES INTROUVABLES (%d) — le HTML a bouge sous l'outil :" % len(manques))
        for m in manques:
            print("  " + m)
        print("\nRien n'a ete ecrit.")
        return 2

    if not edits:
        print("\nLe site est deja conforme a data/. Aucune ecriture.")
        return 0

    print("\n%d ecart(s) entre data/ et le site :\n" % len(edits))
    for chemin, f, ancien, neuf in edits:
        print("  %-34s %s" % (chemin, f))
        print("      %s" % ancien[:88])
        print("   -> %s" % neuf[:88])

    if verifier:
        print("\nMode verification : rien n'a ete ecrit. Le site s'ecarte de data/.")
        return 1

    ecrits = 0
    for f, texte in sortie.items():
        chemin = os.path.join(RACINE, f)
        if open(chemin, encoding="utf-8").read() == texte:
            continue          # ne pas toucher un fichier qui ne change pas
        with open(chemin, "w", encoding="utf-8") as fh:
            fh.write(texte)
        ecrits += 1
    print("\n%d fichier(s) reecrit(s)." % ecrits)
    return 0


if __name__ == "__main__":
    sys.exit(main())
