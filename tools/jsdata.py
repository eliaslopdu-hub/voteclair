"""Extraction de littéraux JavaScript depuis les fichiers du site.

Le site n'a pas de couche de données : ses objets politiques sont des
littéraux JS, dans un .js ou inline dans une page. Plutôt que de les
parser à la main, on demande à node de les évaluer et de nous les rendre
en JSON — c'est la seule méthode qui ne peut pas mal interpréter une
apostrophe française échappée.
"""
import json
import subprocess


def eval_litteral(chemin, debut, fin, nom):
    """Évalue `nom` dans la tranche [debut, fin[ du fichier et le rend en JSON.

    `debut` et `fin` sont des chaînes repères, pas des numéros de ligne :
    le fichier bouge, les repères non.
    """
    src = open(chemin, encoding="utf-8").read()
    i = src.index(debut)
    j = src.index(fin, i) if fin else len(src)
    tranche = src[i:j].rstrip().rstrip(";")
    script = tranche + "\nprocess.stdout.write(JSON.stringify(" + nom + "));"
    res = subprocess.run(
        ["node", "-e", script], capture_output=True, text=True, check=False
    )
    if res.returncode != 0:
        raise RuntimeError(
            "évaluation de %s dans %s : %s" % (nom, chemin, res.stderr.strip())
        )
    return json.loads(res.stdout)


def ecrire_json(chemin, donnees):
    """Écrit du JSON lisible : indenté, accents conservés, saut de ligne final."""
    with open(chemin, "w", encoding="utf-8") as f:
        json.dump(donnees, f, ensure_ascii=False, indent=2)
        f.write("\n")
