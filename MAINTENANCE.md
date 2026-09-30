# Tenir VoteClair à jour, à la main

Ce document décrit comment actualiser le site **sans clé API et sans IA**.

Rien ici n'est un pis-aller. `data/` est la source de vérité, les outils de
`tools/` sont du calcul local déterministe, et aucun d'eux n'a d'accès réseau. La
clé API n'apparaît qu'à deux lignes de tout le dépôt — `anthropic_api_key` et
`uses: anthropics/claude-code-action` dans `.github/workflows/veille.yml`. Elle
n'achetait qu'une chose : que la recherche des faits se fasse toute seule. Le reste
de la chaîne — vérification, projection, contrôles, publication — n'en a jamais eu
besoin.

## La boucle

```bash
python3 tools/perimes.py                 # 1. ce qui est à revérifier
                                         # 2. recherche à la main (voir plus bas)
                                         # 3. édition de data/sources.json puis data/*.json
python3 tools/verifier.py                # 4. doit afficher « RESULTAT : OK »
python3 tools/projeter.py --verifier     # 5. montre les écarts, n'écrit rien
python3 tools/projeter.py                # 6. applique aux pages HTML
```

Puis une branche, une Pull Request, et la fusion publie.

`main` est protégée : les poussées directes sont refusées, une relecture de Code
Owner est exigée. **Ne nommez jamais votre branche `veille/proposition`** — ce nom
déclenche dans `verification.yml` un garde-fou destiné aux propositions de l'agent,
qui rejetterait votre travail.

## Étape 2 — chercher

`perimes.py` donne pour chaque fait le rang de source exigé (`rang<=N`) et si deux
sources sont nécessaires.

| Rang | Ce que c'est |
|---|---|
| **1** | Journal officiel, Légifrance, Conseil constitutionnel, décret |
| **2** | Site officiel du parti, statuts déposés, programme officiel |
| **3** | Assemblée nationale, Sénat, CNCCFP, ministère de l'Intérieur |
| **4** | Presse, agrégateur, encyclopédie collaborative — **jamais suffisant seul** |

`rang_max_publiable` vaut 3 : rien de fondé uniquement sur de la presse ne peut
porter la mention `confirme`.

## Étape 3 — écrire

**D'abord la source**, dans `data/sources.json`. C'est un dictionnaire plat à neuf
champs, dont l'identifiant est libre (convention : `src:<sujet>-<qualificatif>`) :

```json
"src:decret-2024-527-legislatives": {
  "libelle_cite": "Décret n° 2024-527 du 9 juin 2024 portant convocation des électeurs…",
  "editeur": "Légifrance / JORF",
  "rang": 1,
  "url": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000049689654",
  "date_publication": "2024-06-10",
  "annee_citee": null,
  "consulte_le": "2026-09-23",
  "archive": null,
  "note": "Article 1 : convocation le dimanche 30 juin 2024…"
}
```

Seuls `rang` et `url` sont lus par les outils. Les sept autres champs existent pour
le relecteur humain : ce sont eux qui rendent une vérification refaisable dans deux
ans.

**Ensuite le fait.** Un objet de `data/` est un fait dès qu'il porte `valeur` **et**
`confiance` :

```json
"dirigeant": {
  "valeur": "Bruno Retailleau",
  "sources": ["src:lr-site-officiel", "src:lcp-congres-lr-2025"],
  "verifie_le": "2026-09-22",
  "confiance": "confirme",
  "auteur": "humain",
  "note": "Élu président des Républicains le 18 mai 2025…"
}
```

`confiance` vaut `confirme`, `a_verifier`, `propose`, `perime` ou `a_faire` — toute
autre valeur fait échouer `verifier.py`.

**Si la valeur n'a pas changé, ne rafraîchissez que `verifie_le`.** C'est un
résultat utile, pas un échec : cela prouve qu'on a regardé.

**Si vous ne trouvez pas de source suffisante, ne publiez pas.** Laissez la valeur
en place, mettez `confiance` à `a_verifier`, et dites dans `note` ce qui manque. Une
information absente nuit moins qu'une information inventée.

## Les six pièges

**1. `python3 tools/projeter.py --help` réécrit les fichiers HTML.** Il n'y a pas
d'`argparse` : `main()` teste seulement si `--verifier` ou `--couverture` figure
dans `sys.argv`, et tout le reste tombe en mode application. Les deux seules
invocations sans effet de bord sont `--verifier` et `--couverture`.

**2. Ne retouchez jamais une entrée existante de `sources.json`.** `garde_fou.py`
la rejette en `SOURCE REECRITE`. Une source est un constat daté : si elle a changé,
on en ajoute une nouvelle sous un autre identifiant.

**3. `"confiance": "confirme"` exige au moins une source de rang ≤ 3.** Sinon
`verifier.py` échoue en dur sur `test_rang_source`.

**4. Ajouter un fait sans source fait *monter* la dette et casse la CI.** Les cinq
compteurs de « DETTE HERITEE » sont comparés à `data/tests-baseline.json` : ils
peuvent stagner ou baisser, jamais augmenter. Remplir `sources` et `verifie_le` les
fait toujours baisser.

**5. N'éditez jamais un fichier HTML à la main.** `projeter.py --verifier` tourne
sur chaque PR et sur chaque poussée vers `main`, et rejette toute divergence entre
le HTML et `data/`. Une correction saisie directement dans la page serait écrasée à
la projection suivante.

**6. `rang_min` et `double_source` ne sont pas contrôlés sur une branche humaine.**
`garde_fou.py` ne les applique qu'aux PR issues de `veille/proposition`
(`verification.yml`, ligne 70). Sur votre branche, `verifier.py` ne vérifie que la
règle générale du rang ≤ 3. **Le respect du rang exigé et de la double source est
donc une discipline, pas un garde-fou.** C'est le point où ce dépôt vous fait
confiance.

## Le contrôle complet

À passer avant tout commit :

```bash
python3 tools/verifier.py && python3 tools/verif_roundtrip_quiz.py &&
python3 tools/verif_roundtrip_comparateur.py && python3 tools/projeter.py --verifier &&
python3 tools/projeter.py --couverture && python3 tools/tests_pipeline.py
```

## Toutes les commandes

| Commande | Effet |
|---|---|
| `perimes.py` | ce qui est à revérifier |
| `perimes.py --json` | même chose, pour un script |
| `verifier.py` | invariants + dette |
| `verifier.py --ecrire-baseline` | **écrit** `data/tests-baseline.json` |
| `projeter.py` | **écrit** les pages HTML |
| `projeter.py --verifier` | écarts seulement, n'écrit rien |
| `projeter.py --couverture` | tout champ automatisable atteint-il le site ? |
| `garde_fou.py [base]` | contrôle de périmètre contre une référence git |
| `verif_roundtrip_quiz.py`, `verif_roundtrip_comparateur.py`, `tests_pipeline.py` | tests de régression (exigent `node`) |

## Ce que la projection touche

`projeter.py` n'écrit que quatre familles de fichiers, et seulement quatre champs :
`partis.*.dirigeant`, `partis.*.site`, `elections.*.date`, `elections.*.statut`.

- `partis.html` — carte de chaque parti
- `parti-*.html` — fiches, nom de fichier lu dans `partis.json`
- `face-a-face.html` — littéral JS du comparateur
- `calendrier.html` — littéral JS du calendrier

Tout le reste du site (`index.html`, `quiz.html`, `methodologie.html`,
`institutions.html`, `histoire.html`…) n'est jamais réécrit. `data/sources.json`
n'est projeté nulle part : les sources servent au relecteur et aux garde-fous, pas
au visiteur.

## Échéances

| Quand | Quoi |
|---|---|
| **avant le 7 février 2027** | Parution du décret de convocation de la présidentielle. C'est lui, et lui seul, qui autorise à passer les dates des 18 avril et 2 mai 2027 en `confiance: "confirme"` — source Légifrance, rang 1. Jusque-là elles restent en `a_verifier`, quoi qu'annoncent les communiqués. |
| **15 janvier 2027** | Gel éditorial conseillé : plus de refonte, seulement des corrections de fait. |
| **mi-mars 2027** | Liste officielle du Conseil constitutionnel : bascule du périmètre « partis » vers « candidats ». |

## L'agent de veille

`.github/workflows/veille.yml` automatisait l'étape 2 contre paiement à l'API
Anthropic. **Sa planification est désactivée.**

Sa première exécution réelle, le 23 septembre 2026, a échoué : `--allowedTools`
(ligne 111) accorde `Edit` mais pas `Write`, alors que le prompt impose de créer
`data/veille/rapport-du-jour.md`, fichier et dossier inexistants. Quatre refus de
permission, 5,30 $ dépensés, aucune proposition produite.

Pour le réveiller un jour, dans cet ordre :

1. corriger la ligne 111 en `…,Edit,Write(data/veille/*),Bash(python3 tools/*)` ;
2. corriger le commentaire de la ligne 10, qui annonce « quelques centimes par
   exécution » là où le relevé réel est de 5,30 $ ;
3. `gh workflow enable veille.yml --repo eliaslopdu-hub/voteclair`.

Sachez avant de le faire que la porte de coût de l'étape 1 ne ferme jamais tout à
fait : `elections.*.date` est déclaré à `cadence_jours: 7` contre un cron mensuel,
si bien qu'il y aura toujours quelque chose à traiter. Les six scrutins déjà tenus
ont été figés le 23 septembre 2026 pour limiter ce bruit, mais les deux dates de
2027 ressortiront à chaque passage — ce qui est précisément le but jusqu'au décret.
