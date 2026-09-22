"""Emetteurs : transforment les donnees de data/ en litteraux JS et en HTML.

C'est ici que se joue la fidelite. Le generateur ne vaut que s'il
reproduit ce que le site contient deja : tant qu'on ne sait pas
regenerer l'existant, on ne peut rien verifier.

Le style d'ecriture est celui du fichier d'origine : chaines entre
guillemets doubles, apostrophes francaises non echappees quand c'est
possible, deux espaces d'indentation.
"""
import json


def js_chaine(s):
    """Rend une chaine JS. Guillemets doubles, comme le fichier d'origine.

    Les apostrophes francaises sont tres frequentes dans ces textes : en
    guillemets doubles elles n'ont pas besoin d'etre echappees, ce qui
    evite la forme \\' qui parasite la lecture d'un diff.
    """
    return json.dumps(s, ensure_ascii=False)


def js_valeur(v, indent=0, largeur_cle=0):
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return repr(v)
    if isinstance(v, str):
        return js_chaine(v)
    if isinstance(v, list):
        if not v:
            return "[]"
        pad = "  " * (indent + 1)
        corps = ",\n".join(pad + js_valeur(x, indent + 1) for x in v)
        return "[\n%s,\n%s]" % (corps, "  " * indent)
    if isinstance(v, dict):
        return js_objet(v, indent, largeur_cle)
    raise TypeError(type(v))


def js_cle(k):
    """Une cle n'est citee que si elle n'est pas un identifiant JS simple."""
    if k and (k[0].isalpha() or k[0] == "_") and all(c.isalnum() or c == "_" for c in k):
        return k
    return js_chaine(k)


def js_objet(d, indent=0, largeur_cle=0, une_ligne=False):
    if not d:
        return "{}"
    if une_ligne:
        return "{ " + ", ".join(
            "%s: %s" % (js_cle(k), js_valeur(v, indent)) for k, v in d.items()
        ) + " }"
    pad = "  " * (indent + 1)
    lignes = []
    for k, v in d.items():
        cle = js_cle(k) + ":"
        lignes.append("%s%-*s %s" % (pad, largeur_cle, cle, js_valeur(v, indent + 1)))
    return "{\n%s,\n%s}" % (",\n".join(lignes), "  " * indent)


def bloc_commente(titre, corps):
    """Un bandeau de section, dans le style deja utilise par le fichier."""
    return "/* ── %s ── */\n%s" % (titre, corps)


def html_echappe(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def js_table_alignee(entrees, champs, indent=1):
    """Emet des objets d'une ligne avec leurs colonnes alignees entre elles.

    Le fichier d'origine aligne a la main les valeurs d'un meme champ sur
    une colonne commune. Reproduire cette mise en forme n'est pas de la
    coquetterie : sans elle, la premiere generation produirait un diff de
    plusieurs centaines de lignes ou une vraie modification de donnee
    passerait inapercue.

    `entrees` : liste de couples (cle, dict). `champs` : ordre des champs.
    """
    rendus = [
        (cle, {c: js_valeur(d[c]) for c in champs})
        for cle, d in entrees
    ]
    largeur_cle = max(len(c) for c, _ in rendus) + 1
    # Chaque champ sauf le dernier est suivi d'une virgule : la largeur a
    # reserver est celle de la valeur la plus longue, virgule comprise.
    # La derniere colonne est remplie elle aussi : le fichier d'origine
    # aligne l'accolade fermante, et ne pas le faire produirait un diff
    # sur chacune des lignes.
    largeurs = {
        c: max(len(r[c]) for _, r in rendus) + (1 if i < len(champs) - 1 else 0)
        for i, c in enumerate(champs)
    }
    pad = "  " * indent
    lignes = []
    for cle, r in rendus:
        morceaux = []
        for i, c in enumerate(champs):
            val = r[c] + ("," if i < len(champs) - 1 else "")
            morceaux.append("%s: %-*s" % (c, largeurs[c], val))
        lignes.append("%s%-*s { %s },"
                      % (pad, largeur_cle, cle + ":", " ".join(morceaux)))
    return "\n".join(lignes)
