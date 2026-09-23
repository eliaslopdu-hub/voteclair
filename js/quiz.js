/* ============================================================
   VoteClair — quiz.js  v3
   Quiz rapide (15Q) + Quiz approfondi (40Q)
   + Profil utilisateur + Résultats personnalisés
   ============================================================ */

'use strict';

/* ── Métadonnées des partis ── */
const PARTIS_META = {
  rn:          { nom: "Rassemblement National", couleur: "#003189", slug: "rassemblement-national" },
  lr:          { nom: "Les Républicains",       couleur: "#0066CC", slug: "les-republicains"       },
  renaissance: { nom: "Renaissance",            couleur: "#FFBE00", slug: "renaissance"            },
  modem:       { nom: "MoDem",                  couleur: "#FF6600", slug: "modem"                  },
  ps:          { nom: "Parti Socialiste",        couleur: "#E75480", slug: "parti-socialiste"      },
  lfi:         { nom: "La France Insoumise",    couleur: "#CC0000", slug: "la-france-insoumise"    },
  eelv:        { nom: "Europe Écologie",        couleur: "#4CAF50", slug: "europe-ecologie"        },
};

/* ── Labels des thèmes ── */
const THEMES = {
  profil:        { label: null },
  economie:      { label: "Économie & fiscalité"      },
  environnement: { label: "Environnement & énergie"   },
  securite:      { label: "Sécurité & justice"        },
  social:        { label: "Social & travail"          },
  europe:        { label: "Europe & géopolitique"     },
  immigration:   { label: "Immigration"               },
  institutions:  { label: "Institutions & démocratie" },
};

/* ── Engagements concrets par parti (top 6 mesures programme) ── */
const ENGAGEMENTS = {
  rn: [
    "Instaurer des quotas annuels d'immigration votés au Parlement",
    "Accorder la priorité nationale dans l'accès aux aides sociales et au logement",
    "Retirer la France du commandement intégré de l'OTAN",
    "Baisser la TVA sur l'énergie et les produits de première nécessité",
    "Rétablir la retraite à 60 ans pour les carrières longues",
    "Rétablir la police de proximité et renforcer les effectifs",
  ],
  lr: [
    "Contrôler strictement l'immigration et renforcer les expulsions",
    "Baisser les charges pour les entreprises et simplifier la fiscalité",
    "Maintenir la retraite à 64 ans",
    "Développer le nucléaire civil avec 14 nouveaux réacteurs",
    "Rétablir les peines planchers pour les récidivistes",
    "Décentraliser et renforcer l'autonomie des collectivités",
  ],
  renaissance: [
    "Réformer les retraites pour assurer l'équilibre financier du système",
    "Viser le plein emploi à 5% de chômage d'ici 2027",
    "Développer le nucléaire civil avec 6 nouveaux EPR",
    "Renforcer la construction européenne (défense, économie, numérique)",
    "Baisser les impôts de production pour les entreprises",
    "Investir massivement dans la santé et réduire les déserts médicaux",
  ],
  modem: [
    "Réformer les institutions pour introduire plus de proportionnelle",
    "Renforcer la démocratie européenne fédérale",
    "Assurer la transition énergétique de façon pragmatique",
    "Faire de l'éducation une priorité nationale — revaloriser les enseignants",
    "Renforcer le dialogue social entre partenaires sociaux",
    "Lutter contre la pauvreté par l'insertion professionnelle",
  ],
  ps: [
    "Abroger la réforme des retraites à 64 ans",
    "Augmenter le SMIC et l'indexer sur l'inflation",
    "Renforcer le service public de santé et réduire les déserts médicaux",
    "Planifier la transition écologique avec investissement public massif",
    "Rétablir l'ISF vert pour une fiscalité plus progressive",
    "Défendre l'égalité femmes-hommes avec une loi-cadre et des sanctions",
  ],
  lfi: [
    "Porter le SMIC à 1 600 € net immédiatement",
    "Instaurer la retraite à 60 ans pour tous",
    "Convoquer une Assemblée constituante pour la VIe République",
    "Bloquer les prix sur les produits de première nécessité",
    "Garantir la gratuité de l'éducation de la crèche à l'université",
    "Sortir du libre-échange et relocaliser l'industrie française",
  ],
  eelv: [
    "Planifier la neutralité carbone avant 2050",
    "Sortir progressivement du nucléaire en faveur des renouvelables",
    "Réformer l'agriculture vers le bio et l'agroécologie",
    "Porter le SMIC à 1 600 € net et instaurer la semaine de 4 jours",
    "Renforcer le droit au logement opposable",
    "Instaurer une taxe carbone aux frontières de l'UE",
  ],
};

/* ── Notes explicatives par parti ── */
const NOTES = {
  rn:          "Vos positions sur la sécurité, l'immigration et la souveraineté nationale s'alignent avec le Rassemblement National.",
  lr:          "Votre conservatisme économique et votre attachement à l'ordre correspondent à la ligne des Républicains.",
  renaissance: "Votre pragmatisme économique et votre attachement à l'Europe rejoignent la ligne de Renaissance.",
  modem:       "Votre positionnement centriste et pro-européen correspond à la ligne du MoDem.",
  ps:          "Vos convictions sociales et votre attachement aux services publics s'alignent avec le Parti Socialiste.",
  lfi:         "Vos positions sur la justice sociale, les salaires et la souveraineté populaire correspondent à La France Insoumise.",
  eelv:        "Votre priorité à l'écologie et à la transformation sociale rejoint les positions d'Europe Écologie.",
};

/* ── Ce que le parti propose aux chefs d'entreprise ── */
const ENGAGEMENTS_GERANT = {
  rn: [
    "Baisse des charges patronales sur les bas et moyens salaires",
    "Préférence nationale dans les marchés publics pour les entreprises françaises",
    "Protection des entreprises françaises face à la concurrence étrangère déloyale",
  ],
  lr: [
    "Baisse de l'impôt sur les sociétés pour les PME et ETI",
    "Simplification du code du travail et facilitation des embauches",
    "Réduction significative des cotisations patronales",
  ],
  renaissance: [
    "Suppression de la CVAE (cotisation sur la valeur ajoutée des entreprises)",
    "France 2030 : plan d'investissement pour l'industrie et l'innovation",
    "Facilitation des négociations salariales au niveau de l'entreprise",
  ],
  modem: [
    "Simplification administrative pour les TPE/PME",
    "Dialogue social renforcé : co-gestion à l'allemande",
    "Renforcement du statut de l'entrepreneur individuel",
  ],
  ps: [
    "Maintien des aides à l'investissement productif",
    "Hausse du SMIC partiellement compensée par des allègements de charges",
    "Fiscalité progressive, mais préservation des PME et entreprises non cotées",
  ],
  lfi: [
    "Partage obligatoire de la valeur entre actionnaires et salariés",
    "Hausse de l'IS pour les grandes entreprises (allègements maintenus pour PME)",
    "Encadrement strict des licenciements économiques",
  ],
  eelv: [
    "Semaine de 4 jours pour améliorer la productivité et le bien-être au travail",
    "Conditionnalité sociale et environnementale des aides publiques aux entreprises",
    "Taxe carbone aux frontières : protection des entreprises françaises face aux importations",
  ],
};

/* ================================================================
   LES 40 QUESTIONS
   Questions 0–14  : Quiz rapide (les 15 plus discriminantes)
   Questions 15–30 : Suite approfondie — questions existantes restantes
   Questions 31–39 : Suite approfondie — 9 nouvelles questions
   ================================================================ */
const QUESTIONS = [

  /* ══════════════════════════════════════
     QUIZ RAPIDE — questions 0 à 14
     ══════════════════════════════════════ */

  /* Q0 — Profil */
  {
    id: 2, type: "single", theme: "profil", profileWeight: 0.5,
    question: "Quelle est votre situation professionnelle ?",
    options: ["CDI / Fonctionnaire", "CDD / Intérim", "Au chômage", "Indépendant / Entrepreneur", "Retraité", "Étudiant"],
    weights: {
      "CDI / Fonctionnaire":        { ps: 1, renaissance: 1 },
      "CDD / Intérim":              { lfi: 1, ps: 1 },
      "Au chômage":                 { lfi: 2, rn: 1 },
      "Indépendant / Entrepreneur": { lr: 2, renaissance: 1 },
      "Retraité":                   { rn: 1, lr: 1 },
      "Étudiant":                   { lfi: 1, eelv: 1 },
    },
  },

  /* Q1 — Sécurité */
  {
    id: 5, type: "scale", theme: "securite",
    question: "La sécurité et l'ordre public sont pour moi une priorité électorale.",
    scaleMin: "Pas du tout", scaleMax: "Absolument",
    weights: { 1: { lfi: 1, eelv: 1 }, 2: { ps: 1, eelv: 1 }, 3: { renaissance: 1, modem: 1 }, 4: { lr: 2, rn: 1 }, 5: { rn: 3, lr: 2 } },
  },

  /* Q2 — Environnement */
  {
    id: 6, type: "scale", theme: "environnement",
    question: "La protection de l'environnement doit être la priorité n°1 des politiques publiques.",
    scaleMin: "Pas du tout", scaleMax: "Absolument",
    weights: { 1: { rn: 1, lr: 1 }, 2: { rn: 1, lr: 1 }, 3: { renaissance: 1, modem: 1 }, 4: { ps: 1, lfi: 1 }, 5: { eelv: 4, lfi: 1 } },
  },

  /* Q3 — Économie (grandes fortunes) */
  {
    id: 7, type: "scale", theme: "economie",
    question: "Les grandes fortunes et grandes entreprises paient trop peu d'impôts en France.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { lr: 2, renaissance: 1 }, 2: { lr: 1, renaissance: 1 }, 3: { modem: 1 }, 4: { ps: 1, eelv: 1 }, 5: { lfi: 3, ps: 1 } },
  },

  /* Q4 — Immigration */
  {
    id: 8, type: "scale", theme: "immigration",
    question: "L'immigration en France est trop importante et doit être davantage contrôlée.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { lfi: 1, eelv: 1 }, 2: { ps: 1, eelv: 1 }, 3: { renaissance: 1, modem: 1 }, 4: { lr: 2, renaissance: 1 }, 5: { rn: 4, lr: 1 } },
  },

  /* Q5 — Social (retraites) */
  {
    id: 9, type: "scale", theme: "social",
    question: "La réforme des retraites à 64 ans était une décision économiquement nécessaire.",
    scaleMin: "Tout à fait faux", scaleMax: "Tout à fait vrai",
    weights: { 1: { lfi: 2, ps: 1 }, 2: { lfi: 1, ps: 1, rn: 1 }, 3: { modem: 1 }, 4: { renaissance: 1, lr: 1 }, 5: { lr: 2, renaissance: 2 } },
  },

  /* Q6 — Nucléaire */
  {
    id: 10, type: "scale", theme: "environnement",
    question: "Le développement du nucléaire civil est indispensable pour l'avenir énergétique de la France.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { eelv: 3, lfi: 1 }, 2: { eelv: 1, ps: 1 }, 3: { ps: 1, modem: 1 }, 4: { renaissance: 2, lr: 1 }, 5: { lr: 3, renaissance: 2, rn: 1 } },
  },

  /* Q7 — SMIC */
  {
    id: 11, type: "scale", theme: "social",
    question: "Le SMIC devrait être porté à 1 600 € net immédiatement.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { lr: 2, renaissance: 1 }, 2: { lr: 1, renaissance: 1 }, 3: { modem: 1 }, 4: { ps: 1, eelv: 1 }, 5: { lfi: 4, ps: 1, rn: 1 } },
  },

  /* Q8 — UE */
  {
    id: 12, type: "scale", theme: "europe",
    question: "L'Union Européenne protège bien les intérêts économiques et politiques de la France.",
    scaleMin: "Pas du tout", scaleMax: "Tout à fait",
    weights: { 1: { rn: 2, lfi: 2 }, 2: { rn: 1, lfi: 1 }, 3: { lr: 1, ps: 1 }, 4: { renaissance: 1, modem: 1 }, 5: { renaissance: 2, modem: 2, eelv: 1 } },
  },

  /* Q9 — Protectionnisme */
  {
    id: 16, type: "scale", theme: "economie",
    question: "La France devrait mener une politique industrielle protectionniste pour relocaliser les emplois.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { lr: 1, renaissance: 1, modem: 1 }, 2: { renaissance: 1 }, 3: { ps: 1, modem: 1 }, 4: { lfi: 1, rn: 1 }, 5: { rn: 3, lfi: 2 } },
  },

  /* Q10 — Dette */
  {
    id: 22, type: "scale", theme: "economie",
    question: "La dette publique est un problème grave qui doit être réduit rapidement, quitte à couper des dépenses.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { lfi: 2, eelv: 1 }, 2: { lfi: 1, ps: 1 }, 3: { ps: 1, rn: 1 }, 4: { renaissance: 1, modem: 1 }, 5: { lr: 3, renaissance: 2 } },
  },

  /* Q11 — Référendum */
  {
    id: 24, type: "scale", theme: "institutions",
    question: "Les citoyens devraient pouvoir déclencher des référendums d'initiative populaire.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { lr: 1, renaissance: 1 }, 2: { renaissance: 1, modem: 1 }, 3: { modem: 1, ps: 1 }, 4: { eelv: 1, ps: 1 }, 5: { lfi: 2, eelv: 2, rn: 2 } },
  },

  /* Q12 — Dilemme emploi/climat */
  {
    id: 25, type: "dilemma", theme: "environnement",
    question: "Si vous deviez choisir entre ces deux priorités...",
    optionA: {
      label: "Priorité à l'emploi industriel",
      description: "Soutenir la relance industrielle et réduire le chômage, même si cela ralentit la transition écologique.",
      weights: { rn: 2, lr: 2, renaissance: 1 },
    },
    optionB: {
      label: "Priorité à la transition climatique",
      description: "Accélérer la décarbonation de l'économie, même si cela coûte des emplois industriels à court terme.",
      weights: { eelv: 4, lfi: 1, ps: 1 },
    },
  },

  /* Q13 — Dilemme fiscalité */
  {
    id: 26, type: "dilemma", theme: "economie",
    question: "Sur la politique fiscale, quelle approche vous correspond le mieux ?",
    optionA: {
      label: "Baisser les impôts",
      description: "Réduire la fiscalité pour libérer entreprises et ménages, et stimuler la croissance par l'initiative privée.",
      weights: { lr: 3, renaissance: 2 },
    },
    optionB: {
      label: "Redistribuer la richesse",
      description: "Augmenter l'imposition des grandes fortunes pour financer les services publics et réduire les inégalités.",
      weights: { lfi: 3, ps: 2, eelv: 1 },
    },
  },

  /* Q14 — Dilemme Europe */
  {
    id: 28, type: "dilemma", theme: "europe",
    question: "Quelle vision de la place de la France en Europe vous correspond ?",
    optionA: {
      label: "Plus d'intégration européenne",
      description: "Transférer davantage de compétences à l'UE pour peser plus fort face aux grandes puissances mondiales.",
      weights: { renaissance: 3, modem: 3, eelv: 1 },
    },
    optionB: {
      label: "Plus de souveraineté nationale",
      description: "Récupérer des compétences de l'UE pour que la France décide seule de ses politiques économiques et sociales.",
      weights: { rn: 3, lfi: 2, lr: 1 },
    },
  },

  /* ══════════════════════════════════════
     QUIZ APPROFONDI — suite (questions 15–30)
     Questions existantes non sélectionnées pour le rapide
     ══════════════════════════════════════ */

  /* Q15 — Profil âge */
  {
    id: 1, type: "single", theme: "profil", profileWeight: 0.5,
    question: "Quel est votre âge ?",
    options: ["18-25 ans", "26-40 ans", "41-60 ans", "60 ans et plus"],
    weights: {
      "18-25 ans":     { lfi: 1, eelv: 1 },
      "26-40 ans":     { renaissance: 1, ps: 1 },
      "41-60 ans":     { lr: 1, renaissance: 1 },
      "60 ans et plus":{ rn: 1, lr: 1 },
    },
  },

  /* Q16 — Revenu */
  {
    id: 3, type: "single", theme: "profil", profileWeight: 0.5,
    question: "Quel est votre revenu mensuel net ?",
    options: ["Moins de 1 200 €", "1 200 à 2 500 €", "2 500 à 4 000 €", "Plus de 4 000 €"],
    weights: {
      "Moins de 1 200 €": { lfi: 2, ps: 1, rn: 1 },
      "1 200 à 2 500 €":  { ps: 1, modem: 1, rn: 1 },
      "2 500 à 4 000 €":  { renaissance: 1, lr: 1 },
      "Plus de 4 000 €":  { lr: 2, renaissance: 2 },
    },
  },

  /* Q17 — Lieu */
  {
    id: 4, type: "single", theme: "profil", profileWeight: 0.5,
    question: "Où habitez-vous ?",
    options: ["Grande ville (100 000 hab. et +)", "Ville moyenne", "Zone rurale ou périurbaine", "Outre-mer"],
    weights: {
      "Grande ville (100 000 hab. et +)": { lfi: 1, eelv: 1, ps: 1 },
      "Ville moyenne":                     { renaissance: 1, lr: 1, modem: 1 },
      "Zone rurale ou périurbaine":        { rn: 2, lr: 1 },
      "Outre-mer":                         { lfi: 1, ps: 1 },
    },
  },

  /* Q18 — Proportionnelle */
  {
    id: 13, type: "scale", theme: "institutions",
    question: "Les législatives devraient utiliser un scrutin proportionnel pour mieux représenter les opinions.",
    scaleMin: "Pas du tout", scaleMax: "Tout à fait",
    weights: { 1: { lr: 1, renaissance: 1 }, 2: { renaissance: 1 }, 3: { modem: 1, ps: 1 }, 4: { eelv: 1, lfi: 1 }, 5: { lfi: 2, eelv: 2, rn: 1 } },
  },

  /* Q19 — Hôpital */
  {
    id: 14, type: "scale", theme: "social",
    question: "L'hôpital public est en crise et nécessite un investissement massif et urgent de l'État.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { lr: 1 }, 2: { lr: 1, renaissance: 1 }, 3: { renaissance: 1, modem: 1 }, 4: { ps: 1, eelv: 1 }, 5: { lfi: 3, ps: 2, eelv: 1 } },
  },

  /* Q20 — Logement */
  {
    id: 15, type: "scale", theme: "social",
    question: "Les loyers dans les grandes villes devraient être encadrés et plafonnés par l'État.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { lr: 2, renaissance: 1 }, 2: { lr: 1, renaissance: 1 }, 3: { modem: 1 }, 4: { ps: 1, eelv: 1 }, 5: { lfi: 3, ps: 1, eelv: 1 } },
  },

  /* Q21 — Ukraine */
  {
    id: 17, type: "scale", theme: "europe",
    question: "La France devrait s'engager davantage pour soutenir l'Ukraine face à la Russie.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { rn: 2, lfi: 2 }, 2: { rn: 1, lfi: 1 }, 3: { modem: 1, ps: 1 }, 4: { renaissance: 2, lr: 1 }, 5: { renaissance: 2, lr: 2, eelv: 1 } },
  },

  /* Q22 — Accueil réfugiés */
  {
    id: 18, type: "scale", theme: "immigration",
    question: "La France devrait accueillir davantage de réfugiés et régulariser les travailleurs sans-papiers.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { rn: 3, lr: 2 }, 2: { rn: 1, lr: 1 }, 3: { renaissance: 1, modem: 1 }, 4: { ps: 1, eelv: 1 }, 5: { lfi: 3, eelv: 2, ps: 1 } },
  },

  /* Q23 — Agriculture bio */
  {
    id: 19, type: "scale", theme: "environnement",
    question: "L'agriculture française doit évoluer vers le bio et l'agroécologie, même si les prix augmentent.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { rn: 1, lr: 1 }, 2: { rn: 1, renaissance: 1 }, 3: { modem: 1, ps: 1 }, 4: { ps: 1, lfi: 1 }, 5: { eelv: 4, lfi: 1 } },
  },

  /* Q24 — Services publics */
  {
    id: 20, type: "scale", theme: "economie",
    question: "Les services publics (éducation, énergie, transports) ne doivent pas être privatisés.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { lr: 2, renaissance: 1 }, 2: { lr: 1, renaissance: 1 }, 3: { modem: 1 }, 4: { ps: 1, rn: 1 }, 5: { lfi: 3, ps: 2, eelv: 1, rn: 1 } },
  },

  /* Q25 — Égalité salariale */
  {
    id: 21, type: "scale", theme: "social",
    question: "Des lois contraignantes avec sanctions sont nécessaires pour imposer l'égalité salariale femmes-hommes.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { rn: 1, lr: 1 }, 2: { rn: 1, lr: 1 }, 3: { renaissance: 1, modem: 1 }, 4: { ps: 1, eelv: 1 }, 5: { lfi: 2, eelv: 3, ps: 1 } },
  },

  /* Q26 — Confiance médias */
  {
    id: 23, type: "scale", theme: "institutions",
    question: "Je fais confiance aux grands médias pour m'informer de façon indépendante et objective.",
    scaleMin: "Pas du tout", scaleMax: "Tout à fait",
    weights: { 1: { lfi: 2, rn: 2 }, 2: { lfi: 1, rn: 1 }, 3: { ps: 1, modem: 1 }, 4: { renaissance: 1, modem: 1 }, 5: { renaissance: 2, modem: 1 } },
  },

  /* Q27 — Dilemme sécurité */
  {
    id: 27, type: "dilemma", theme: "securite",
    question: "Pour réduire la délinquance, quelle stratégie privilégiez-vous ?",
    optionA: {
      label: "Renforcer la surveillance et les peines",
      description: "Développer la vidéosurveillance, alourdir les sanctions et augmenter les effectifs de police.",
      weights: { rn: 3, lr: 2, renaissance: 1 },
    },
    optionB: {
      label: "Investir dans la prévention sociale",
      description: "Financer l'éducation, les services sociaux et la médiation pour s'attaquer aux causes profondes.",
      weights: { lfi: 2, ps: 2, eelv: 2 },
    },
  },

  /* Q28 — Dilemme travail */
  {
    id: 29, type: "dilemma", theme: "social",
    question: "Quelle vision du marché du travail vous correspond le mieux ?",
    optionA: {
      label: "Flexibiliser pour créer de l'emploi",
      description: "Faciliter embauches et licenciements pour stimuler l'emploi, quitte à accepter plus de précarité.",
      weights: { lr: 3, renaissance: 2 },
    },
    optionB: {
      label: "Protéger les salariés",
      description: "Renforcer les droits des travailleurs et encadrer les licenciements, même si cela peut freiner les embauches.",
      weights: { lfi: 2, ps: 3, eelv: 1, rn: 1 },
    },
  },

  /* Q29 — Dilemme immigration */
  {
    id: 30, type: "dilemma", theme: "immigration",
    question: "Quelle politique migratoire vous semble la plus juste ?",
    optionA: {
      label: "Quotas et priorité nationale",
      description: "Fixer des quotas annuels d'immigration et donner la priorité aux Français dans l'accès aux droits sociaux.",
      weights: { rn: 4, lr: 1 },
    },
    optionB: {
      label: "Intégration et régularisation",
      description: "Régulariser les sans-papiers qui travaillent et ouvrir des voies légales d'immigration et d'intégration.",
      weights: { lfi: 2, eelv: 2, ps: 2, modem: 1 },
    },
  },

  /* Q30 — Dilemme institutions */
  {
    id: 31, type: "dilemma", theme: "institutions",
    question: "Quel modèle institutionnel vous convient le mieux ?",
    optionA: {
      label: "Exécutif présidentiel fort",
      description: "Conserver un président avec des pouvoirs étendus, capable de décisions rapides sans blocage parlementaire.",
      weights: { renaissance: 2, lr: 2, rn: 1 },
    },
    optionB: {
      label: "Démocratie délibérative",
      description: "Rééquilibrer les pouvoirs vers le Parlement et les citoyens, avec référendums et assemblées constituantes.",
      weights: { lfi: 3, eelv: 2, ps: 1 },
    },
  },

  /* ══════════════════════════════════════
     QUIZ APPROFONDI — 9 nouvelles questions (31–39)
     ══════════════════════════════════════ */

  /* Q31 — IS / Fiscalité entreprises */
  {
    id: 32, type: "scale", theme: "economie",
    question: "L'impôt sur les sociétés en France est trop élevé et nuit à la compétitivité des entreprises.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { lfi: 2, eelv: 1 }, 2: { ps: 1, lfi: 1 }, 3: { modem: 1 }, 4: { renaissance: 1, lr: 1 }, 5: { lr: 3, renaissance: 2 } },
  },

  /* Q32 — Frontières Schengen */
  {
    id: 33, type: "scale", theme: "immigration",
    question: "La France devrait quitter l'espace Schengen pour contrôler ses propres frontières.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { eelv: 2, lfi: 1, renaissance: 1 }, 2: { ps: 1, modem: 1 }, 3: { lr: 1 }, 4: { lr: 2, rn: 1 }, 5: { rn: 4, lfi: 1 } },
  },

  /* Q33 — 100% renouvelables */
  {
    id: 34, type: "scale", theme: "environnement",
    question: "La France devrait viser 100% d'énergies renouvelables d'ici 2050, en sortant du nucléaire.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { lr: 2, renaissance: 1, rn: 1 }, 2: { lr: 1, renaissance: 1 }, 3: { modem: 1 }, 4: { ps: 1, lfi: 1 }, 5: { eelv: 4, lfi: 1 } },
  },

  /* Q34 — Aides sociales conditionnelles */
  {
    id: 35, type: "scale", theme: "social",
    question: "Les aides sociales (RSA, APL…) devraient être conditionnées à des démarches d'insertion ou de bénévolat.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { lfi: 2, eelv: 1, ps: 1 }, 2: { ps: 1 }, 3: { modem: 1 }, 4: { renaissance: 1, lr: 1 }, 5: { lr: 3, rn: 2 } },
  },

  /* Q35 — Élargissement UE */
  {
    id: 36, type: "scale", theme: "europe",
    question: "L'élargissement de l'UE aux pays des Balkans et à l'Ukraine est une bonne chose pour l'Europe.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { rn: 2, lfi: 2 }, 2: { rn: 1, lfi: 1 }, 3: { lr: 1, ps: 1 }, 4: { renaissance: 1, modem: 1 }, 5: { renaissance: 2, modem: 2, eelv: 1 } },
  },

  /* Q36 — Justice restaurative */
  {
    id: 37, type: "scale", theme: "securite",
    question: "Les peines alternatives à la prison (travaux d'intérêt général, bracelets) sont aussi efficaces que l'emprisonnement.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { rn: 2, lr: 2 }, 2: { rn: 1, lr: 1 }, 3: { renaissance: 1, modem: 1 }, 4: { ps: 1, eelv: 1 }, 5: { lfi: 2, eelv: 2, ps: 1 } },
  },

  /* Q37 — Dilemme réforme institutionnelle */
  {
    id: 38, type: "dilemma", theme: "institutions",
    question: "Pour moderniser nos institutions politiques...",
    optionA: {
      label: "Réformer la Ve République",
      description: "Améliorer la constitution actuelle pour mieux équilibrer les pouvoirs sans tout refonder.",
      weights: { renaissance: 2, lr: 2, modem: 2 },
    },
    optionB: {
      label: "Convoquer une VIe République",
      description: "Réunir une assemblée constituante pour rédiger une nouvelle constitution plus démocratique.",
      weights: { lfi: 4, eelv: 2, ps: 1 },
    },
  },

  /* Q38 — Semaine de 4 jours */
  {
    id: 39, type: "scale", theme: "economie",
    question: "La semaine de travail de 4 jours devrait être progressivement introduite en France.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { lr: 2, renaissance: 1 }, 2: { lr: 1, renaissance: 1 }, 3: { modem: 1, ps: 1 }, 4: { ps: 1, eelv: 1 }, 5: { eelv: 3, lfi: 2, ps: 1 } },
  },

  /* Q39 — Budget éducation */
  {
    id: 40, type: "scale", theme: "social",
    question: "L'État devrait augmenter significativement le budget de l'éducation publique, même si cela creuse le déficit.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { lr: 1, renaissance: 1 }, 2: { lr: 1 }, 3: { renaissance: 1, modem: 1 }, 4: { ps: 1, eelv: 1 }, 5: { lfi: 3, eelv: 2, ps: 1 } },
  },
];

const RAPIDE_COUNT = 15;

/* ================================================================
   ÉTAT
   ================================================================ */
let currentQ     = 0;
let reponses     = {};
let scaleVals    = {};
let themeWeights = {};
let quizMode     = null;   // 'rapide' | 'approfondi'
let userProfil   = null; // 'gerant' | 'salarie' | 'etudiant' | 'retraite' | 'autre'

QUESTIONS.forEach(function(q, idx) {
  if (q.type === "scale") scaleVals[idx] = 3;
});

/* ================================================================
   DOM
   ================================================================ */
var introEl    = document.getElementById("quiz-intro");
var mainEl     = document.getElementById("quiz-main");
var thematicEl = document.getElementById("quiz-thematic");
var resultsEl  = document.getElementById("quiz-results");
var quickResEl = document.getElementById("quiz-quick-results");

/* ================================================================
   PROFIL UTILISATEUR
   ================================================================ */
window.setUserProfil = function(profil, btnEl) {
  userProfil = profil;
  document.querySelectorAll('.profil-btn').forEach(function(b) { b.classList.remove('selected'); });
  if (btnEl) btnEl.classList.add('selected');
};

/* ================================================================
   DÉMARRER
   ================================================================ */
/* ================================================================
   PARTAGE ET RELECTURE D'UN RÉSULTAT PAR URL
   ----------------------------------------------------------------
   Les réponses sont encodées dans le FRAGMENT de l'URL (#r=…).
   Un fragment n'est jamais transmis au serveur ni à un tiers : une
   opinion politique étant une donnée sensible (art. 9 RGPD), elle ne
   doit jamais transiter par un paramètre de requête classique.
   ================================================================ */

/* Encode les réponses sous forme compacte « index:valeur » séparés par des points. */
function encoderReponses() {
  var parts = [];
  QUESTIONS.forEach(function(q, idx) {
    var rep = reponses[idx];
    if (rep === undefined) return;

    var code;
    if (q.type === "scale")        code = String(rep);
    else if (q.type === "dilemma") code = (rep === "optionA") ? "A" : "B";
    else if (q.type === "single")  code = "o" + q.options.indexOf(rep);
    else return;

    parts.push(idx + ":" + code);
  });
  return parts.join(".");
}

/* Opération inverse. Retourne null si la chaîne est invalide. */
function decoderReponses(str) {
  if (!str) return null;
  var out = {};
  var items = str.split(".");

  for (var i = 0; i < items.length; i++) {
    var m = /^(\d+):(o\d+|[AB]|[1-5])$/.exec(items[i]);
    if (!m) return null;

    var idx = parseInt(m[1], 10);
    var val = m[2];
    var q = QUESTIONS[idx];
    if (!q) return null;

    if (q.type === "scale" && /^[1-5]$/.test(val))            out[idx] = parseInt(val, 10);
    else if (q.type === "dilemma" && (val === "A" || val === "B")) out[idx] = (val === "A") ? "optionA" : "optionB";
    else if (q.type === "single" && val.charAt(0) === "o") {
      var oi = parseInt(val.slice(1), 10);
      if (!q.options[oi]) return null;
      out[idx] = q.options[oi];
    } else return null;
  }
  return Object.keys(out).length ? out : null;
}

function lienPartage() {
  var base = window.location.origin + window.location.pathname;
  var frag = "#r=" + encoderReponses();
  if (quizMode) frag += "&m=" + quizMode;
  return base + frag;
}

/* Bloc « partager mon résultat » affiché sous les résultats. */
function blocPartage() {
  return (
    '<div class="qr-partage">' +
      '<div class="qr-partage-title">Partager ce résultat</div>' +
      '<p class="qr-partage-desc">' +
        'Le lien ci-dessous contient tes réponses. Il permet à quelqu\'un d\'ouvrir ' +
        'exactement ce résultat — ou de comparer avec le sien. ' +
        '<strong>Rien n\'est enregistré sur le site</strong> : tout est dans le lien, ' +
        'et le lien ne quitte ton navigateur que si tu le partages toi-même.' +
      '</p>' +
      '<div class="qr-partage-row">' +
        '<input type="text" id="qr-partage-input" class="qr-partage-input" readonly ' +
          'aria-label="Lien vers ce résultat" value="' + lienPartage().replace(/"/g, "&quot;") + '">' +
        '<button type="button" class="btn btn-primary" onclick="copierLienPartage(this)">Copier le lien</button>' +
      '</div>' +
    '</div>'
  );
}

window.copierLienPartage = function(btn) {
  var champ = document.getElementById("qr-partage-input");
  if (!champ) return;

  var fini = function(ok) {
    btn.textContent = ok ? "Lien copié ✓" : "Copie impossible";
    setTimeout(function() { btn.textContent = "Copier le lien"; }, 2000);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(champ.value).then(function() { fini(true); }, function() { fini(false); });
  } else {
    champ.select();
    try { fini(document.execCommand("copy")); } catch (e) { fini(false); }
  }
};

/* Au chargement : si l'URL porte un résultat, on l'affiche directement. */
function chargerDepuisURL() {
  var h = window.location.hash || "";
  if (h.indexOf("#r=") !== 0) return false;

  var corps = h.slice(3);
  var mode  = "rapide";
  var amp   = corps.indexOf("&m=");
  if (amp !== -1) {
    mode  = corps.slice(amp + 3);
    corps = corps.slice(0, amp);
  }

  var rep = decoderReponses(decodeURIComponent(corps));
  if (!rep) return false;

  reponses = rep;
  quizMode = (mode === "approfondi") ? "approfondi" : "rapide";
  scaleVals = {};
  Object.keys(rep).forEach(function(i) {
    if (QUESTIONS[i] && QUESTIONS[i].type === "scale") scaleVals[i] = rep[i];
  });

  if (introEl) introEl.style.display = "none";
  afficherResultatsRapides();
  return true;
}

/* ================================================================
   SAUVEGARDE LOCALE (reprise après interruption)
   ----------------------------------------------------------------
   40 questions, c'est long : un onglet fermé ne doit pas tout perdre.
   Les réponses restent dans le navigateur, rien n'est envoyé nulle part.
   ================================================================ */
var STORAGE_KEY = 'vc_quiz_progres';

function sauvegarderEtat() {
  if (!quizMode) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      v: 1,
      reponses: reponses,
      scaleVals: scaleVals,
      themeWeights: themeWeights,
      currentQ: currentQ,
      quizMode: quizMode,
      userProfil: userProfil,
      date: new Date().toISOString()
    }));
  } catch (e) { /* navigation privée, quota plein : on continue sans sauvegarde */ }
}

function lireEtat() {
  try {
    var brut = localStorage.getItem(STORAGE_KEY);
    if (!brut) return null;
    var d = JSON.parse(brut);
    if (!d || d.v !== 1 || !d.quizMode) return null;
    /* Une reprise n'a de sens que si le quiz est réellement commencé
       et pas encore terminé. */
    var dernier = (d.quizMode === 'approfondi') ? QUESTIONS.length - 1 : RAPIDE_COUNT - 1;
    if (typeof d.currentQ !== 'number' || d.currentQ < 1 || d.currentQ > dernier) return null;
    return d;
  } catch (e) { return null; }
}

function effacerEtat() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}

window.reprendreQuiz = function() {
  var d = lireEtat();
  if (!d) return;
  reponses     = d.reponses     || {};
  scaleVals    = d.scaleVals    || {};
  themeWeights = d.themeWeights || {};
  quizMode     = d.quizMode;
  userProfil   = d.userProfil;

  var banniere = document.getElementById('quiz-reprise');
  if (banniere) banniere.style.display = 'none';
  introEl.style.display = "none";
  mainEl.classList.add("active");
  renderQuestion(d.currentQ);
};

window.ignorerReprise = function() {
  effacerEtat();
  var banniere = document.getElementById('quiz-reprise');
  if (banniere) banniere.style.display = 'none';
};

/* Propose la reprise au chargement de la page. */
function proposerReprise() {
  var d = lireEtat();
  if (!d || !introEl) return;

  var total = (d.quizMode === 'approfondi') ? QUESTIONS.length : RAPIDE_COUNT;
  var banniere = document.createElement('div');
  banniere.id = 'quiz-reprise';
  banniere.className = 'quiz-reprise';
  banniere.innerHTML =
    '<div class="quiz-reprise-texte">' +
      '<strong>Tu as un quiz en cours.</strong> ' +
      'Tu t\'étais arrêté à la question ' + d.currentQ + ' sur ' + total + '.' +
    '</div>' +
    '<div class="quiz-reprise-actions">' +
      '<button type="button" class="btn btn-primary" onclick="reprendreQuiz()">Reprendre où j\'en étais</button>' +
      '<button type="button" class="btn btn-ghost" onclick="ignorerReprise()">Recommencer</button>' +
    '</div>';
  introEl.insertBefore(banniere, introEl.firstChild);
}

if (!chargerDepuisURL() && introEl) proposerReprise();

window.startQuiz = function() {
  effacerEtat();
  var errorEl = document.getElementById('profil-error');
  if (!userProfil) {
    if (errorEl) { errorEl.style.display = 'block'; }
    document.querySelector('.profil-grid').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  if (errorEl) errorEl.style.display = 'none';
  // Pré-remplir Q0 (situation professionnelle) depuis le profil choisi
  var profilMap = {
    gerant:   "Indépendant / Entrepreneur",
    salarie:  "CDI / Fonctionnaire",
    etudiant: "Étudiant",
    retraite: "Retraité",
    autre:    "CDI / Fonctionnaire"
  };
  reponses[0] = profilMap[userProfil] || "CDI / Fonctionnaire";
  quizMode = 'rapide';
  introEl.style.display = "none";
  mainEl.classList.add("active");
  renderQuestion(1); // sauter Q0 déjà rempli
};

window.startApprofondi = function() {
  quizMode = 'approfondi';
  if (quickResEl) quickResEl.classList.remove("active");
  mainEl.classList.add("active");
  renderQuestion(RAPIDE_COUNT);
};

/* ================================================================
   RENDU D'UNE QUESTION
   ================================================================ */
function renderQuestion(idx) {
  currentQ = idx;
  var q = QUESTIONS[idx];
  sauvegarderEtat();

  /* Progress — Q0 est pré-rempli depuis le profil, donc on affiche idx-1 pour le rapide */
  var totalDisplay  = (quizMode === 'approfondi') ? QUESTIONS.length : RAPIDE_COUNT - 1;
  var displayIdx    = (quizMode === 'rapide') ? idx - 1 : idx - RAPIDE_COUNT;
  var pct = Math.round(((displayIdx) / totalDisplay) * 100);

  document.getElementById("progress-fill").style.width  = pct + "%";
  var progressLabel = document.getElementById("progress-label");
  progressLabel.setAttribute("aria-live", "polite");
  progressLabel.textContent = "Question " + (displayIdx + 1) + " / " + totalDisplay;

  /* In approfondi, show the context note */
  var approfondiNote = document.getElementById("approfondi-note");
  if (approfondiNote) {
    approfondiNote.style.display = (quizMode === 'approfondi' && idx === RAPIDE_COUNT) ? "block" : "none";
  }

  var numEl  = document.getElementById("question-number");
  var textEl = document.getElementById("question-text");
  var cont   = document.getElementById("question-options");

  if (q.type === "dilemma") {
    var dilemmaNum = 0;
    for (var i = 0; i <= idx; i++) { if (QUESTIONS[i].type === "dilemma") dilemmaNum++; }
    numEl.textContent = "Dilemme " + dilemmaNum;
    numEl.style.color = "#E8C547";
  } else {
    numEl.textContent = "Question " + (idx + 1);
    numEl.style.color = "var(--accent)";
  }

  textEl.textContent = q.question;
  cont.innerHTML     = "";

  /* Accessibilité : les options forment un groupe de boutons radio dont
     l'intitulé est la question elle-même. */
  if (q.type === "scale") {
    cont.removeAttribute("role");
    cont.removeAttribute("aria-labelledby");
  } else {
    cont.setAttribute("role", "radiogroup");
    cont.setAttribute("aria-labelledby", "question-text");
  }

  if (q.type === "single")       renderSingle(q, idx, cont);
  else if (q.type === "scale")   renderScale(q, idx, cont);
  else if (q.type === "dilemma") renderDilemma(q, idx, cont);

  var firstQ = (quizMode === 'approfondi') ? RAPIDE_COUNT : 1;
  document.getElementById("btn-prev").disabled = (idx <= firstQ);

  var isLastRapide     = (quizMode === 'rapide'      && idx === RAPIDE_COUNT - 1);
  var isLastApprofondi = (quizMode === 'approfondi'  && idx === QUESTIONS.length - 1);
  if (isLastRapide) {
    document.getElementById("btn-next").textContent = "Voir mes résultats →";
  } else if (isLastApprofondi) {
    document.getElementById("btn-next").textContent = "Pondérer mes thèmes →";
  } else {
    document.getElementById("btn-next").textContent = "Suivant →";
  }
}

/* ── Single ── */
function renderSingle(q, idx, cont) {
  q.options.forEach(function(opt) {
    var btn = document.createElement("button");
    btn.className = "option-btn";
    btn.type = "button";
    btn.setAttribute("role", "radio");
    var estChoisi = (reponses[idx] === opt);
    btn.setAttribute("aria-checked", estChoisi ? "true" : "false");
    if (estChoisi) btn.classList.add("selected");
    btn.innerHTML = '<span class="radio-dot" aria-hidden="true"></span><span>' + opt + "</span>";
    btn.addEventListener("click", function() {
      cont.querySelectorAll(".option-btn").forEach(function(b) {
        b.classList.remove("selected");
        b.setAttribute("aria-checked", "false");
      });
      btn.classList.add("selected");
      btn.setAttribute("aria-checked", "true");
      reponses[idx] = opt;
    });
    cont.appendChild(btn);
  });
}

/* ── Scale ── */
function renderScale(q, idx, cont) {
  var val = (scaleVals[idx] !== undefined) ? scaleVals[idx] : 3;
  var div = document.createElement("div");
  div.className = "scale-container";
  div.innerHTML =
    '<div class="scale-labels"><span>' + q.scaleMin + "</span><span>" + q.scaleMax + "</span></div>" +
    '<input type="range" class="scale-slider" min="1" max="5" step="1" value="' + val + '"' +
      ' id="scale-input-' + idx + '"' +
      ' aria-label="' + q.question.replace(/"/g, "&quot;") + '"' +
      ' aria-valuetext="' + scaleDesc(val, q).replace(/"/g, "&quot;") + '">' +
    '<div class="scale-dots" aria-hidden="true">' +
      [1,2,3,4,5].map(function(n) {
        return '<span class="scale-dot' + (n === val ? " active" : "") + '" data-v="' + n + '">' + n + "</span>";
      }).join("") +
    "</div>" +
    '<div class="scale-desc" id="scale-desc-' + idx + '">' + scaleDesc(val, q) + "</div>";
  cont.appendChild(div);

  var slider = div.querySelector(".scale-slider");
  var descEl = div.querySelector(".scale-desc");
  var dots   = div.querySelectorAll(".scale-dot");

  function update(v) {
    v = parseInt(v);
    scaleVals[idx] = v;
    reponses[idx]  = v;
    descEl.classList.remove("scale-desc--empty");
    dots.forEach(function(d) { d.classList.toggle("active", parseInt(d.dataset.v) === v); });
    descEl.textContent = scaleDesc(v, q);
    slider.value = v;
    slider.setAttribute("aria-valuetext", scaleDesc(v, q));
  }

  slider.addEventListener("input", function() { update(slider.value); });
  dots.forEach(function(d) { d.addEventListener("click", function() { update(d.dataset.v); }); });

  /* Tant que l'utilisateur n'a rien fait, la question reste NON RÉPONDUE :
     on n'écrit rien dans `reponses`. Pré-remplir à 3 fausserait le résultat
     (la position neutre favorise mécaniquement les partis du centre). */
  if (reponses[idx] === undefined) {
    dots.forEach(function(d) { d.classList.remove("active"); });
    descEl.textContent = "Déplacez le curseur ou touchez un chiffre pour répondre.";
    descEl.classList.add("scale-desc--empty");
  }
}

function scaleDesc(v, q) {
  var descs = [
    q.scaleMin + " — vous n'accordez aucune importance à cela",
    "Plutôt en désaccord avec cette proposition",
    "Position neutre ou mitigée",
    "Plutôt en accord avec cette proposition",
    q.scaleMax + " — cette proposition vous correspond pleinement",
  ];
  return descs[v - 1] || "";
}

/* ── Dilemma ── */
function renderDilemma(q, idx, cont) {
  var wrap = document.createElement("div");
  wrap.className = "dilemma-options";

  ["optionA", "optionB"].forEach(function(key) {
    var opt = q[key];
    var btn = document.createElement("button");
    btn.className = "dilemma-btn";
    btn.type = "button";
    btn.setAttribute("role", "radio");
    var estChoisi = (reponses[idx] === key);
    btn.setAttribute("aria-checked", estChoisi ? "true" : "false");
    if (estChoisi) btn.classList.add("selected");
    btn.innerHTML =
      '<span class="dilemma-label">' + opt.label + "</span>" +
      '<span class="dilemma-desc">'  + opt.description + "</span>";
    btn.addEventListener("click", function() {
      wrap.querySelectorAll(".dilemma-btn").forEach(function(b) {
        b.classList.remove("selected");
        b.setAttribute("aria-checked", "false");
      });
      btn.classList.add("selected");
      btn.setAttribute("aria-checked", "true");
      reponses[idx] = key;
    });
    wrap.appendChild(btn);
  });
  cont.appendChild(wrap);
}

/* ================================================================
   NAVIGATION
   ================================================================ */
window.prevQuestion = function() {
  if (currentQ > 0) renderQuestion(currentQ - 1);
};

window.nextQuestion = function() {
  var q = QUESTIONS[currentQ];

  /* Une question sans réponse ne doit jamais être comptée comme une réponse
     neutre : on demande à l'utilisateur de se positionner explicitement. */
  if (reponses[currentQ] === undefined) {
    var descEl = document.getElementById("scale-desc-" + currentQ);
    if (descEl) {
      descEl.textContent = "Choisissez une position pour continuer.";
      descEl.classList.add("scale-desc--empty", "scale-desc--warn");
      setTimeout(function() { descEl.classList.remove("scale-desc--warn"); }, 1200);
    }
    var optCont = document.getElementById("question-options");
    if (optCont) optCont.scrollIntoView({ behavior: "smooth", block: "nearest" });
    return;
  }

  if (quizMode === 'rapide' && currentQ === RAPIDE_COUNT - 1) {
    /* Fin du quiz rapide → résultats rapides */
    mainEl.classList.remove("active");
    afficherResultatsRapides();
  } else if (quizMode === 'approfondi' && currentQ === QUESTIONS.length - 1) {
    /* Fin du quiz approfondi → pondération thématique */
    afficherEtapeThematique();
  } else if (currentQ < QUESTIONS.length - 1) {
    renderQuestion(currentQ + 1);
  }
};

/* Rappel permanent du périmètre : un utilisateur proche d'un parti non
   couvert doit pouvoir s'en rendre compte, plutôt que de recevoir un
   résultat faux sans le savoir. */
function blocPerimetre() {
  return (
    '<div class="qr-perimetre">' +
      '<div class="qr-perimetre-title">Ce que ce résultat ne peut pas te dire</div>' +
      '<p>' +
        'Ce quiz couvre <strong>7 partis</strong> : Rassemblement National, Les Républicains, ' +
        'Renaissance, MoDem, Parti Socialiste, La France Insoumise et Europe Écologie.' +
      '</p>' +
      '<p>' +
        'D\'autres formations — <strong>Reconquête, Horizons, le Parti Communiste, Lutte Ouvrière, ' +
        'le NPA</strong> — n\'y figurent pas. Si tu te sens proche de l\'une d\'elles, ce résultat ' +
        'ne peut pas te le dire, et le parti affiché n\'est alors que le plus proche <em>parmi les sept</em>.' +
      '</p>' +
      '<p class="qr-perimetre-links">' +
        '<a href="methodologie.html#partis">Pourquoi ces 7 partis ?</a> · ' +
        '<a href="methodologie.html#validation">Comment ce calcul est vérifié</a> · ' +
        '<a href="contact.html">Signaler une erreur</a>' +
      '</p>' +
    '</div>'
  );
}

/* ================================================================
   DÉSACCORDS AVEC LE PARTI DE TÊTE
   ----------------------------------------------------------------
   Aucun électeur n'est d'accord à 100 % avec un parti. Cet écran
   montre où l'utilisateur s'écarte du parti arrivé en tête : c'est
   ce qui transforme un verdict en matière à réflexion.
   ================================================================ */

/* Position « idéale » d'un parti sur une question = l'option qui lui
   rapporte le plus de points. */
function positionParti(q, parti) {
  var best = null, bestVal = -1;

  if (q.type === "scale") {
    [1, 2, 3, 4, 5].forEach(function(n) {
      var v = (q.weights[n] && q.weights[n][parti]) || 0;
      if (v > bestVal) { bestVal = v; best = n; }
    });
  } else if (q.type === "dilemma") {
    ["optionA", "optionB"].forEach(function(k) {
      var v = (q[k] && q[k].weights && q[k].weights[parti]) || 0;
      if (v > bestVal) { bestVal = v; best = k; }
    });
  }
  return (bestVal > 0) ? { valeur: best, points: bestVal } : null;
}

/* Liste les questions où l'utilisateur s'éloigne le plus du parti donné. */
function genererDesaccords(parti, limite) {
  var ecarts = [];

  QUESTIONS.forEach(function(q, idx) {
    var rep = reponses[idx];
    if (rep === undefined || q.theme === "profil") return;

    var ideal = positionParti(q, parti);
    if (!ideal) return;

    var obtenu = 0;
    if (q.type === "scale")        obtenu = (q.weights[rep] && q.weights[rep][parti]) || 0;
    else if (q.type === "dilemma") obtenu = (q[rep] && q[rep].weights && q[rep].weights[parti]) || 0;

    var manque = ideal.points - obtenu;
    if (manque <= 0) return;                      // accord : rien à signaler

    ecarts.push({
      idx: idx, q: q, rep: rep, ideal: ideal,
      ecart: manque / ideal.points               // 0 = accord total, 1 = opposition franche
    });
  });

  ecarts.sort(function(a, b) { return b.ecart - a.ecart; });
  return ecarts.slice(0, limite || 5);
}

/* Formule en clair « ce que vous avez répondu » / « ce que défend le parti ». */
function libelleReponse(q, val) {
  if (q.type === "scale") {
    var libelles = [
      q.scaleMin, "Plutôt en désaccord", "Position neutre", "Plutôt en accord", q.scaleMax
    ];
    return libelles[val - 1] + " (" + val + "/5)";
  }
  if (q.type === "dilemma") return (q[val] && q[val].label) || "";
  return String(val);
}

function blocDesaccords(parti) {
  var meta = PARTIS_META[parti];
  var liste = genererDesaccords(parti, 5);

  if (!liste.length) {
    return (
      '<div class="desaccords-block">' +
        '<div class="desaccords-title">Tes points de désaccord avec ' + meta.nom + '</div>' +
        '<p class="desaccords-intro">Sur les questions posées, tes réponses rejoignent systématiquement les positions de ce parti. C\'est rare — et ça mérite quand même d\'aller lire son programme en entier.</p>' +
      '</div>'
    );
  }

  var items = liste.map(function(e) {
    return (
      '<li class="desaccord-item">' +
        '<p class="desaccord-question">' + e.q.question + '</p>' +
        '<div class="desaccord-compare">' +
          '<div class="desaccord-vous">' +
            '<span class="desaccord-tag">Ta réponse</span>' +
            '<span>' + libelleReponse(e.q, e.rep) + '</span>' +
          '</div>' +
          '<div class="desaccord-parti" style="border-color:' + meta.couleur + '">' +
            '<span class="desaccord-tag" style="color:' + meta.couleur + '">' + meta.nom + '</span>' +
            '<span>' + libelleReponse(e.q, e.ideal.valeur) + '</span>' +
          '</div>' +
        '</div>' +
      '</li>'
    );
  }).join('');

  return (
    '<div class="desaccords-block">' +
      '<div class="desaccords-title">Là où tu ne suis pas ' + meta.nom + '</div>' +
      '<p class="desaccords-intro">' +
        'Personne n\'est d\'accord à 100 % avec un parti. Voici les ' + liste.length + ' sujets ' +
        'sur lesquels tes réponses s\'écartent le plus des siennes — ce sont souvent les plus ' +
        'intéressants à creuser avant de voter.' +
      '</p>' +
      '<ul class="desaccords-list">' + items + '</ul>' +
    '</div>'
  );
}

/* Bloc de tête des résultats. Sous le seuil de correspondance, on ne
   présente aucun parti comme « proche » : c'est la réponse honnête pour un
   utilisateur dont les positions ne recoupent réellement aucune formation. */
function blocTopParti(topParti, topPct) {
  var meta = PARTIS_META[topParti];

  if (topPct < SEUIL_CORRESPONDANCE) {
    return (
      '<div class="qr-top-parti qr-top-parti--aucun">' +
        '<div class="qr-top-parti-body">' +
          '<div class="qr-top-parti-label">Aucune correspondance nette</div>' +
          '<div class="qr-top-parti-name">Aucun parti ne correspond vraiment à tes réponses</div>' +
          '<p class="qr-top-parti-note">' +
            'Le parti dont tu es le plus proche, ' + meta.nom + ', ne partage que ' + topPct + ' % ' +
            'de tes positions — c\'est trop peu pour parler de proximité. ' +
            'C\'est un résultat fréquent et parfaitement normal : les sept partis couverts ' +
            'ne représentent pas toutes les sensibilités. Le détail ci-dessous reste utile pour ' +
            'voir sur quels sujets tu te rapproches de qui.' +
          '</p>' +
        '</div>' +
      '</div>'
    );
  }

  return (
    '<div class="qr-top-parti">' +
      '<div class="qr-top-parti-color" style="background:' + meta.couleur + '"></div>' +
      '<div class="qr-top-parti-body">' +
        '<div class="qr-top-parti-label">Parti le plus proche</div>' +
        '<div class="qr-top-parti-name" style="color:' + meta.couleur + '">' + meta.nom + '</div>' +
        '<p class="qr-top-parti-note">' + NOTES[topParti] + '</p>' +
      '</div>' +
      '<div class="qr-top-parti-pct" style="color:' + meta.couleur + '">' + topPct + '%</div>' +
    '</div>'
  );
}

/* ================================================================
   RÉSULTATS RAPIDES
   ================================================================ */
function afficherResultatsRapides() {
  if (!quickResEl) return;
  effacerEtat();

  var scores = calculerResultats();
  var sorted = Object.entries(scores).sort(function(a, b) { return b[1] - a[1]; });
  var topParti = sorted[0][0];
  var topPct   = sorted[0][1];
  var topMeta  = PARTIS_META[topParti];

  /* ── Top parti ── */
  var gerantLabel = (userProfil === 'gerant')
    ? "Ce que ce parti propose pour les chefs d'entreprise"
    : (userProfil === 'salarie')
      ? "Ce que ce parti propose pour les salariés"
      : "Ce que ce parti propose concrètement";

  var gerantItems = ENGAGEMENTS_GERANT[topParti] || [];
  var gerantHtml = gerantItems.map(function(item) {
    return '<li>' + item + '</li>';
  }).join('');

  /* ── Barres tous partis ── */
  var barsHtml = sorted.map(function(entry, i) {
    var k   = entry[0];
    var pct = entry[1];
    var m   = PARTIS_META[k];
    return (
      '<div class="result-bar-item">' +
        '<div class="result-bar-header">' +
          '<span class="result-bar-name" style="color:' + m.couleur + '">' + m.nom + '</span>' +
          '<span class="result-bar-pct"  style="color:' + m.couleur + '">' + pct + '%</span>' +
        '</div>' +
        '<div class="result-bar-track">' +
          '<div class="result-bar-fill" style="background:' + m.couleur + ';width:0%" data-target="' + pct + '"></div>' +
        '</div>' +
      '</div>'
    );
  }).join('');

  quickResEl.innerHTML =
    '<h2 style="font-family:\'Playfair Display\',serif;margin-bottom:8px">Tes résultats en 3 minutes</h2>' +
    '<p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:28px">Quiz rapide · ' + nbReponses() + ' questions répondues · Résultats indicatifs</p>' +

    /* Top parti — ou constat qu'aucun parti ne correspond vraiment */
    blocTopParti(topParti, topPct) +

    /* Toutes les barres */
    '<div class="results-bars" style="margin-bottom:28px">' + barsHtml + '</div>' +

    /* Encadré gérant */
    '<div class="qr-gerant-block">' +
      '<div class="qr-gerant-title">' + gerantLabel + '</div>' +
      '<ul class="qr-gerant-list">' + gerantHtml + '</ul>' +
    '</div>' +

    /* Partage du résultat */
    blocPartage() +

    /* Désaccords avec le parti de tête */
    blocDesaccords(topParti) +

    /* Périmètre et limites */
    blocPerimetre() +

    /* Prochaines étapes */
    '<div class="qr-next-steps">' +
      '<div class="qr-next-steps-title">Prochaines étapes</div>' +
      '<ol>' +
        '<li>Vérifier ton inscription sur les listes électorales → <a href="https://www.service-public.fr/particuliers/vosdroits/R12675" target="_blank" rel="noopener">service-public.fr</a></li>' +
        '<li>Consulter le <a href="calendrier.html">calendrier électoral</a> pour la prochaine élection</li>' +
        '<li>En savoir plus sur <a href="parti-' + topMeta.slug + '.html">' + topMeta.nom + '</a></li>' +
      '</ol>' +
    '</div>' +

    /* CTA approfondi */
    '<div class="qr-approfondi-cta">' +
      '<h3 style="font-family:\'Playfair Display\',serif;margin-bottom:8px">Affiner mon résultat</h3>' +
      '<p>Tu as répondu à 15 questions. Pour un résultat plus précis, continue avec 25 questions supplémentaires.</p>' +
      '<button class="btn btn-primary" style="font-size:1rem;padding:14px 32px" onclick="startApprofondi()">Quiz approfondi — 25 questions de plus →</button>' +
      '<p class="qr-approfondi-hint">Tes premières réponses sont conservées — tu ne repars pas de zéro.</p>' +
    '</div>' +

    '<div style="text-align:center;margin-top:24px">' +
      '<button class="btn btn-outline" onclick="resetQuiz()">Recommencer le quiz</button>' +
    '</div>';

  quickResEl.classList.add("active");

  /* Animer les barres */
  requestAnimationFrame(function() {
    setTimeout(function() {
      quickResEl.querySelectorAll(".result-bar-fill").forEach(function(bar) {
        bar.style.transition = "width 1s ease";
        bar.style.width = bar.dataset.target + "%";
      });
    }, 100);
  });

  quickResEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ================================================================
   ÉTAPE THÉMATIQUE
   ================================================================ */
function afficherEtapeThematique() {
  mainEl.classList.remove("active");
  thematicEl.classList.add("active");

  var cont = document.getElementById("theme-sliders");
  cont.innerHTML = "";

  Object.entries(THEMES).forEach(function(entry) {
    var key  = entry[0];
    var meta = entry[1];
    if (key === "profil") return;

    if (!themeWeights[key]) themeWeights[key] = 2;

    var item = document.createElement("div");
    item.className = "theme-slider-item";
    item.innerHTML =
      '<div class="theme-slider-header">' +
        '<span class="theme-label">' + meta.label + "</span>" +
        '<span class="theme-weight-label" id="tw-label-' + key + '">' + weightLabel(themeWeights[key]) + "</span>" +
      "</div>" +
      '<div class="theme-weight-btns" id="tw-btns-' + key + '">' +
        [["1","Peu important"],["2","Important"],["3","Priorité absolue"]].map(function(pair) {
          return '<button class="tw-btn' + (themeWeights[key] === parseInt(pair[0]) ? " active" : "") +
            '" data-v="' + pair[0] + '" onclick="setThemeWeight(\'' + key + "', " + pair[0] + ', this)">' + pair[1] + "</button>";
        }).join("") +
      "</div>";
    cont.appendChild(item);
  });
}

function weightLabel(v) {
  return (["", "Peu important", "Important", "Priorité absolue"])[v] || "";
}

window.setThemeWeight = function(key, val, btnEl) {
  themeWeights[key] = val;
  document.getElementById("tw-btns-" + key).querySelectorAll(".tw-btn").forEach(function(b) {
    b.classList.toggle("active", parseInt(b.dataset.v) === val);
  });
  document.getElementById("tw-label-" + key).textContent = weightLabel(val);
};

window.calculerDepuisThematique = function() {
  thematicEl.classList.remove("active");
  afficherResultats();
};

/* ================================================================
   ALGORITHME
   ================================================================ */
/* Poids maximal que chaque parti peut obtenir sur une question donnée,
   toutes options confondues. Sert de dénominateur : une question où un parti
   peut gagner 4 points ne pèse pas plus qu'une question où il peut en gagner 1. */
function poidsMaxQuestion(q) {
  var opts = [];
  if (q.type === "single")       opts = Object.values(q.weights || {});
  else if (q.type === "scale")   opts = Object.values(q.weights || {});
  else if (q.type === "dilemma") opts = ["optionA", "optionB"].map(function(k) {
    return (q[k] && q[k].weights) ? q[k].weights : {};
  });

  var max = {};
  opts.forEach(function(w) {
    Object.keys(w || {}).forEach(function(p) {
      if (!max[p] || w[p] > max[p]) max[p] = w[p];
    });
  });
  return max;
}

/* Renvoie, pour chaque parti, le POURCENTAGE D'ACCORD ABSOLU :
   points obtenus / points qu'il était possible d'obtenir sur les questions
   répondues. Les partis ne se partagent plus un total de 100 % — chacun est
   mesuré indépendamment, ce qui rend possible un résultat « aucun parti ne
   correspond vraiment ». */
function calculerResultats() {
  var scores = { rn: 0, lr: 0, renaissance: 0, modem: 0, ps: 0, lfi: 0, eelv: 0 };
  var maxima = { rn: 0, lr: 0, renaissance: 0, modem: 0, ps: 0, lfi: 0, eelv: 0 };

  QUESTIONS.forEach(function(q, idx) {
    var rep = reponses[idx];
    if (rep === undefined) return;

    var mult;
    if (q.theme === "profil") {
      mult = q.profileWeight || 0.5;
    } else {
      var tw = themeWeights[q.theme] || 2;
      mult = (tw === 1) ? 0.6 : (tw === 3) ? 2.0 : 1.0;
    }

    var rawW = {};
    if (q.type === "single")       rawW = q.weights[rep]  || {};
    else if (q.type === "scale")   rawW = q.weights[rep]  || {};
    else if (q.type === "dilemma") rawW = (q[rep] && q[rep].weights) ? q[rep].weights : {};

    var maxW = poidsMaxQuestion(q);

    Object.keys(maxima).forEach(function(p) {
      var plafond = maxW[p] || 0;
      if (plafond === 0) return;          // ce parti n'est pas en jeu sur cette question
      maxima[p] += plafond * mult;
      scores[p] += (rawW[p] || 0) * mult;
    });
  });

  var pcts = {};
  Object.keys(scores).forEach(function(p) {
    pcts[p] = (maxima[p] > 0) ? Math.round((scores[p] / maxima[p]) * 100) : 0;
  });
  return pcts;
}

/* Seuil en dessous duquel aucun parti ne peut être présenté comme « proche ». */
var SEUIL_CORRESPONDANCE = 40;

/* Nombre de questions réellement répondues (hors questions de profil). */
function nbReponses() {
  var n = 0;
  QUESTIONS.forEach(function(q, idx) {
    if (q.theme !== "profil" && reponses[idx] !== undefined) n++;
  });
  return n;
}

/* ================================================================
   RÉSULTATS COMPLETS (après approfondi + pondération)
   ================================================================ */
function afficherResultats() {
  resultsEl.classList.add("active");
  effacerEtat();

  var scores = calculerResultats();
  var sorted = Object.entries(scores).sort(function(a, b) { return b[1] - a[1]; });
  var cont   = document.getElementById("results-bars");
  cont.innerHTML = "";

  sorted.forEach(function(entry, i) {
    var parti = entry[0];
    var pct   = entry[1];
    var meta  = PARTIS_META[parti];
    var isTop = (i < 3);

    var item = document.createElement("div");
    item.className = "result-bar-item";

    item.innerHTML =
      '<div class="result-bar-header">' +
        '<span class="result-bar-name" style="color:' + meta.couleur + '">' + meta.nom + "</span>" +
        '<span class="result-bar-pct"  style="color:' + meta.couleur + '">' + pct + "%</span>" +
      "</div>" +
      '<div class="result-bar-track">' +
        '<div class="result-bar-fill" style="background:' + meta.couleur + ';width:0%" data-target="' + pct + '"></div>' +
      "</div>" +
      (isTop
        ? '<p class="result-bar-note">' + NOTES[parti] + "</p>" +
          '<a href="parti-' + meta.slug + '.html" class="result-bar-link">En savoir plus sur ce parti →</a>'
        : "");
    cont.appendChild(item);
  });

  requestAnimationFrame(function() {
    setTimeout(function() {
      document.querySelectorAll(".result-bar-fill").forEach(function(bar) {
        bar.style.transition = "width 1s ease";
        bar.style.width = bar.dataset.target + "%";
      });
    }, 100);
  });

  /* Désaccords + rappel du périmètre, après les barres */
  var extra = document.createElement("div");
  extra.innerHTML = blocPartage() + blocDesaccords(sorted[0][0]) + blocPerimetre();
  cont.parentNode.insertBefore(extra, cont.nextSibling);

  var analyse = genererAnalyse(scores, sorted);
  afficherAnalyse(analyse);
}

/* ================================================================
   ANALYSE POST-RÉSULTATS
   ================================================================ */
function genererAnalyse(scores, sorted) {
  var topParti = sorted[0][0];
  var meta     = PARTIS_META[topParti];
  var themeMap = {};

  QUESTIONS.forEach(function(q, idx) {
    var rep = reponses[idx];
    if (rep === undefined) return;
    if (q.theme === "profil") return;

    var rawW = {};
    if (q.type === "single")       rawW = q.weights[rep] || {};
    else if (q.type === "scale")   rawW = q.weights[rep] || {};
    else if (q.type === "dilemma") rawW = (q[rep] && q[rep].weights) ? q[rep].weights : {};

    var contrib = rawW[topParti] || 0;
    if (contrib <= 0) return;

    var reponseText = "";
    var explication = "";

    if (q.type === "single") {
      reponseText = "Vous avez répondu : " + rep;
    } else if (q.type === "scale") {
      var v = parseInt(rep);
      var labels = [
        "Très en désaccord — « " + q.scaleMin + " »",
        "Plutôt en désaccord avec cette proposition",
        "Position neutre ou mitigée",
        "Plutôt en accord avec cette proposition",
        "Tout à fait d'accord — « " + q.scaleMax + " »",
      ];
      reponseText = labels[v - 1] || "";
    } else if (q.type === "dilemma") {
      var opt = q[rep];
      reponseText = "Vous choisissez : " + opt.label;
      explication = opt.description;
    }

    var themeName = (THEMES[q.theme] && THEMES[q.theme].label) ? THEMES[q.theme].label : q.theme;
    if (!themeMap[q.theme]) themeMap[q.theme] = { label: themeName, items: [] };
    themeMap[q.theme].items.push({
      question:    q.question,
      reponse:     reponseText,
      explication: explication,
      weight:      contrib,
    });
  });

  Object.keys(themeMap).forEach(function(k) {
    themeMap[k].items.sort(function(a, b) { return b.weight - a.weight; });
    themeMap[k].items = themeMap[k].items.slice(0, 3);
  });

  return { parti: topParti, meta: meta, themes: themeMap, scores: scores, sorted: sorted };
}

function afficherAnalyse(analyse) {
  var el = document.getElementById("quiz-analyse");
  if (!el) return;

  var meta      = analyse.meta;
  var topParti  = analyse.parti;
  var themes    = analyse.themes;
  var themeKeys = Object.keys(themes);

  var themesHtml = themeKeys.map(function(k) {
    var theme = themes[k];
    var itemsHtml = theme.items.map(function(item) {
      return (
        '<div class="analyse-item">' +
          '<p class="analyse-question">' + item.question + "</p>" +
          '<p class="analyse-reponse">' + item.reponse + "</p>" +
          (item.explication ? '<p class="analyse-explication">' + item.explication + "</p>" : "") +
        "</div>"
      );
    }).join("");
    return (
      '<div class="analyse-theme-block" style="--accent-bar:' + meta.couleur + '">' +
        '<div class="analyse-theme-name">' + theme.label + "</div>" +
        itemsHtml +
      "</div>"
    );
  }).join("");

  var engagementsHtml = (ENGAGEMENTS[topParti] || []).map(function(eng, i) {
    return (
      '<div class="engagement-item">' +
        '<span class="engagement-num">' + (i + 1) + "</span>" +
        "<span>" + eng + "</span>" +
      "</div>"
    );
  }).join("");

  el.innerHTML =
    '<div class="analyse-intro">' +
      "<h2>Pourquoi " + meta.nom + " ?</h2>" +
      "<p>Voici, question par question, ce qui a orienté votre résultat vers <strong>" + meta.nom + "</strong>. " +
      "Cette analyse vous permet de comprendre concrètement quelles positions vous partagez avec ce parti, " +
      "et à quoi vous vous engagez si vous votez pour lui.</p>" +
    "</div>" +
    (themeKeys.length
      ? '<div class="analyse-section">' +
          '<div class="analyse-section-title">Vos réponses qui ont orienté ce résultat</div>' +
          themesHtml +
        "</div>"
      : "") +
    '<div class="analyse-section">' +
      '<div class="analyse-section-title">Ce à quoi vous vous engagez concrètement</div>' +
      '<p class="analyse-section-intro">Si vous votez <strong>' + meta.nom + "</strong>, voici les principales mesures de leur programme que vous soutiendrez :</p>" +
      '<div class="engagement-list">' + engagementsHtml + "</div>" +
    "</div>" +
    '<div class="analyse-disclaimer">' +
      "<strong>Important</strong> — Cette analyse est basée uniquement sur vos réponses au quiz. " +
      "Elle est indicative et ne reflète pas nécessairement l'ensemble de vos convictions. " +
      "Consultez les programmes officiels avant de vous forger une opinion définitive." +
    "</div>" +
    '<div class="analyse-cta">' +
      '<a href="parti-' + meta.slug + '.html" class="btn btn-primary">En savoir plus sur ' + meta.nom + " →</a>" +
      '<a href="partis.html" class="btn btn-outline">Comparer tous les partis</a>' +
    "</div>";

  el.classList.add("active");
  setTimeout(function() {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 400);
}

/* ================================================================
   RESET
   ================================================================ */
window.resetQuiz = function() {
  effacerEtat();
  reponses     = {};
  scaleVals    = {};
  themeWeights = {};
  currentQ     = 0;
  quizMode     = null;
  userProfil   = null;

  QUESTIONS.forEach(function(q, idx) { if (q.type === "scale") scaleVals[idx] = 3; });

  if (resultsEl)  resultsEl.classList.remove("active");
  if (thematicEl) thematicEl.classList.remove("active");
  if (quickResEl) { quickResEl.classList.remove("active"); quickResEl.innerHTML = ""; }

  var analyseEl = document.getElementById("quiz-analyse");
  if (analyseEl) { analyseEl.classList.remove("active"); analyseEl.innerHTML = ""; }

  /* Reset profil buttons */
  document.querySelectorAll('.profil-btn').forEach(function(b) { b.classList.remove('selected'); });

  introEl.style.display = "block";
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
