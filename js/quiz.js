/* ============================================================
   VoteClair — quiz.js  v2
   31 questions : profil · positions (scale) · dilemmes
   + étape de pondération thématique avant résultats
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
  economie:      { label: "Économie & fiscalité",      icon: "💶" },
  environnement: { label: "Environnement & énergie",   icon: "🌿" },
  securite:      { label: "Sécurité & justice",        icon: "🛡️"  },
  social:        { label: "Social & travail",           icon: "🤝" },
  europe:        { label: "Europe & géopolitique",     icon: "🇪🇺" },
  immigration:   { label: "Immigration",               icon: "🌍" },
  institutions:  { label: "Institutions & démocratie", icon: "🏛️"  },
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

/* ================================================================
   LES 31 QUESTIONS
   ================================================================ */
const QUESTIONS = [

  /* ── 1-4 : Profil sociologique (poids 0.5) ── */
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

  /* ── 5-24 : Positions idéologiques (scale 1-5) ── */
  {
    id: 5, type: "scale", theme: "securite",
    question: "La sécurité et l'ordre public sont pour moi une priorité électorale.",
    scaleMin: "Pas du tout", scaleMax: "Absolument",
    weights: { 1: { lfi: 1, eelv: 1 }, 2: { ps: 1, eelv: 1 }, 3: { renaissance: 1, modem: 1 }, 4: { lr: 2, rn: 1 }, 5: { rn: 3, lr: 2 } },
  },
  {
    id: 6, type: "scale", theme: "environnement",
    question: "La protection de l'environnement doit être la priorité n°1 des politiques publiques.",
    scaleMin: "Pas du tout", scaleMax: "Absolument",
    weights: { 1: { rn: 1, lr: 1 }, 2: { rn: 1, lr: 1 }, 3: { renaissance: 1, modem: 1 }, 4: { ps: 1, lfi: 1 }, 5: { eelv: 4, lfi: 1 } },
  },
  {
    id: 7, type: "scale", theme: "economie",
    question: "Les grandes fortunes et grandes entreprises paient trop peu d'impôts en France.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { lr: 2, renaissance: 1 }, 2: { lr: 1, renaissance: 1 }, 3: { modem: 1 }, 4: { ps: 1, eelv: 1 }, 5: { lfi: 3, ps: 1 } },
  },
  {
    id: 8, type: "scale", theme: "immigration",
    question: "L'immigration en France est trop importante et doit être davantage contrôlée.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { lfi: 1, eelv: 1 }, 2: { ps: 1, eelv: 1 }, 3: { renaissance: 1, modem: 1 }, 4: { lr: 2, renaissance: 1 }, 5: { rn: 4, lr: 1 } },
  },
  {
    id: 9, type: "scale", theme: "social",
    question: "La réforme des retraites à 64 ans était une décision économiquement nécessaire.",
    scaleMin: "Tout à fait faux", scaleMax: "Tout à fait vrai",
    weights: { 1: { lfi: 2, ps: 1 }, 2: { lfi: 1, ps: 1, rn: 1 }, 3: { modem: 1 }, 4: { renaissance: 1, lr: 1 }, 5: { lr: 2, renaissance: 2 } },
  },
  {
    id: 10, type: "scale", theme: "environnement",
    question: "Le développement du nucléaire civil est indispensable pour l'avenir énergétique de la France.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { eelv: 3, lfi: 1 }, 2: { eelv: 1, ps: 1 }, 3: { ps: 1, modem: 1 }, 4: { renaissance: 2, lr: 1 }, 5: { lr: 3, renaissance: 2, rn: 1 } },
  },
  {
    id: 11, type: "scale", theme: "social",
    question: "Le SMIC devrait être porté à 1 600 € net immédiatement.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { lr: 2, renaissance: 1 }, 2: { lr: 1, renaissance: 1 }, 3: { modem: 1 }, 4: { ps: 1, eelv: 1 }, 5: { lfi: 4, ps: 1, rn: 1 } },
  },
  {
    id: 12, type: "scale", theme: "europe",
    question: "L'Union Européenne protège bien les intérêts économiques et politiques de la France.",
    scaleMin: "Pas du tout", scaleMax: "Tout à fait",
    weights: { 1: { rn: 2, lfi: 2 }, 2: { rn: 1, lfi: 1 }, 3: { lr: 1, ps: 1 }, 4: { renaissance: 1, modem: 1 }, 5: { renaissance: 2, modem: 2, eelv: 1 } },
  },
  {
    id: 13, type: "scale", theme: "institutions",
    question: "Les législatives devraient utiliser un scrutin proportionnel pour mieux représenter les opinions.",
    scaleMin: "Pas du tout", scaleMax: "Tout à fait",
    weights: { 1: { lr: 1, renaissance: 1 }, 2: { renaissance: 1 }, 3: { modem: 1, ps: 1 }, 4: { eelv: 1, lfi: 1 }, 5: { lfi: 2, eelv: 2, rn: 1 } },
  },
  {
    id: 14, type: "scale", theme: "social",
    question: "L'hôpital public est en crise et nécessite un investissement massif et urgent de l'État.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { lr: 1 }, 2: { lr: 1, renaissance: 1 }, 3: { renaissance: 1, modem: 1 }, 4: { ps: 1, eelv: 1 }, 5: { lfi: 3, ps: 2, eelv: 1 } },
  },
  {
    id: 15, type: "scale", theme: "social",
    question: "Les loyers dans les grandes villes devraient être encadrés et plafonnés par l'État.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { lr: 2, renaissance: 1 }, 2: { lr: 1, renaissance: 1 }, 3: { modem: 1 }, 4: { ps: 1, eelv: 1 }, 5: { lfi: 3, ps: 1, eelv: 1 } },
  },
  {
    id: 16, type: "scale", theme: "economie",
    question: "La France devrait mener une politique industrielle protectionniste pour relocaliser les emplois.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { lr: 1, renaissance: 1, modem: 1 }, 2: { renaissance: 1 }, 3: { ps: 1, modem: 1 }, 4: { lfi: 1, rn: 1 }, 5: { rn: 3, lfi: 2 } },
  },
  {
    id: 17, type: "scale", theme: "europe",
    question: "La France devrait s'engager davantage pour soutenir l'Ukraine face à la Russie.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { rn: 2, lfi: 2 }, 2: { rn: 1, lfi: 1 }, 3: { modem: 1, ps: 1 }, 4: { renaissance: 2, lr: 1 }, 5: { renaissance: 2, lr: 2, eelv: 1 } },
  },
  {
    id: 18, type: "scale", theme: "immigration",
    question: "La France devrait accueillir davantage de réfugiés et régulariser les travailleurs sans-papiers.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { rn: 3, lr: 2 }, 2: { rn: 1, lr: 1 }, 3: { renaissance: 1, modem: 1 }, 4: { ps: 1, eelv: 1 }, 5: { lfi: 3, eelv: 2, ps: 1 } },
  },
  {
    id: 19, type: "scale", theme: "environnement",
    question: "L'agriculture française doit évoluer vers le bio et l'agroécologie, même si les prix augmentent.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { rn: 1, lr: 1 }, 2: { rn: 1, renaissance: 1 }, 3: { modem: 1, ps: 1 }, 4: { ps: 1, lfi: 1 }, 5: { eelv: 4, lfi: 1 } },
  },
  {
    id: 20, type: "scale", theme: "economie",
    question: "Les services publics (éducation, énergie, transports) ne doivent pas être privatisés.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { lr: 2, renaissance: 1 }, 2: { lr: 1, renaissance: 1 }, 3: { modem: 1 }, 4: { ps: 1, rn: 1 }, 5: { lfi: 3, ps: 2, eelv: 1, rn: 1 } },
  },
  {
    id: 21, type: "scale", theme: "social",
    question: "Des lois contraignantes avec sanctions sont nécessaires pour imposer l'égalité salariale femmes-hommes.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { rn: 1, lr: 1 }, 2: { rn: 1, lr: 1 }, 3: { renaissance: 1, modem: 1 }, 4: { ps: 1, eelv: 1 }, 5: { lfi: 2, eelv: 3, ps: 1 } },
  },
  {
    id: 22, type: "scale", theme: "economie",
    question: "La dette publique est un problème grave qui doit être réduit rapidement, quitte à couper des dépenses.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { lfi: 2, eelv: 1 }, 2: { lfi: 1, ps: 1 }, 3: { ps: 1, rn: 1 }, 4: { renaissance: 1, modem: 1 }, 5: { lr: 3, renaissance: 2 } },
  },
  {
    id: 23, type: "scale", theme: "institutions",
    question: "Je fais confiance aux grands médias pour m'informer de façon indépendante et objective.",
    scaleMin: "Pas du tout", scaleMax: "Tout à fait",
    weights: { 1: { lfi: 2, rn: 2 }, 2: { lfi: 1, rn: 1 }, 3: { ps: 1, modem: 1 }, 4: { renaissance: 1, modem: 1 }, 5: { renaissance: 2, modem: 1 } },
  },
  {
    id: 24, type: "scale", theme: "institutions",
    question: "Les citoyens devraient pouvoir déclencher des référendums d'initiative populaire.",
    scaleMin: "Pas d'accord", scaleMax: "Tout à fait d'accord",
    weights: { 1: { lr: 1, renaissance: 1 }, 2: { renaissance: 1, modem: 1 }, 3: { modem: 1, ps: 1 }, 4: { eelv: 1, ps: 1 }, 5: { lfi: 2, eelv: 2, rn: 2 } },
  },

  /* ── 25-31 : Dilemmes d'arbitrage ── */
  {
    id: 25, type: "dilemma", theme: "environnement",
    question: "Si vous deviez choisir entre ces deux priorités...",
    optionA: {
      label: "🏭 Priorité à l'emploi industriel",
      description: "Soutenir la relance industrielle et réduire le chômage, même si cela ralentit la transition écologique.",
      weights: { rn: 2, lr: 2, renaissance: 1 },
    },
    optionB: {
      label: "🌿 Priorité à la transition climatique",
      description: "Accélérer la décarbonation de l'économie, même si cela coûte des emplois industriels à court terme.",
      weights: { eelv: 4, lfi: 1, ps: 1 },
    },
  },
  {
    id: 26, type: "dilemma", theme: "economie",
    question: "Sur la politique fiscale, quelle approche vous correspond le mieux ?",
    optionA: {
      label: "📉 Baisser les impôts",
      description: "Réduire la fiscalité pour libérer entreprises et ménages, et stimuler la croissance par l'initiative privée.",
      weights: { lr: 3, renaissance: 2 },
    },
    optionB: {
      label: "⚖️ Redistribuer la richesse",
      description: "Augmenter l'imposition des grandes fortunes pour financer les services publics et réduire les inégalités.",
      weights: { lfi: 3, ps: 2, eelv: 1 },
    },
  },
  {
    id: 27, type: "dilemma", theme: "securite",
    question: "Pour réduire la délinquance, quelle stratégie privilégiez-vous ?",
    optionA: {
      label: "📷 Renforcer la surveillance et les peines",
      description: "Développer la vidéosurveillance, alourdir les sanctions et augmenter les effectifs de police.",
      weights: { rn: 3, lr: 2, renaissance: 1 },
    },
    optionB: {
      label: "🏫 Investir dans la prévention sociale",
      description: "Financer l'éducation, les services sociaux et la médiation pour s'attaquer aux causes profondes.",
      weights: { lfi: 2, ps: 2, eelv: 2 },
    },
  },
  {
    id: 28, type: "dilemma", theme: "europe",
    question: "Quelle vision de la place de la France en Europe vous correspond ?",
    optionA: {
      label: "🇪🇺 Plus d'intégration européenne",
      description: "Transférer davantage de compétences à l'UE pour peser plus fort face aux grandes puissances mondiales.",
      weights: { renaissance: 3, modem: 3, eelv: 1 },
    },
    optionB: {
      label: "🏳 Plus de souveraineté nationale",
      description: "Récupérer des compétences de l'UE pour que la France décide seule de ses politiques économiques et sociales.",
      weights: { rn: 3, lfi: 2, lr: 1 },
    },
  },
  {
    id: 29, type: "dilemma", theme: "social",
    question: "Quelle vision du marché du travail vous correspond le mieux ?",
    optionA: {
      label: "📈 Flexibiliser pour créer de l'emploi",
      description: "Faciliter embauches et licenciements pour stimuler l'emploi, quitte à accepter plus de précarité.",
      weights: { lr: 3, renaissance: 2 },
    },
    optionB: {
      label: "🤝 Protéger les salariés",
      description: "Renforcer les droits des travailleurs et encadrer les licenciements, même si cela peut freiner les embauches.",
      weights: { lfi: 2, ps: 3, eelv: 1, rn: 1 },
    },
  },
  {
    id: 30, type: "dilemma", theme: "immigration",
    question: "Quelle politique migratoire vous semble la plus juste ?",
    optionA: {
      label: "🔒 Quotas et priorité nationale",
      description: "Fixer des quotas annuels d'immigration et donner la priorité aux Français dans l'accès aux droits sociaux.",
      weights: { rn: 4, lr: 1 },
    },
    optionB: {
      label: "🌍 Intégration et régularisation",
      description: "Régulariser les sans-papiers qui travaillent et ouvrir des voies légales d'immigration et d'intégration.",
      weights: { lfi: 2, eelv: 2, ps: 2, modem: 1 },
    },
  },
  {
    id: 31, type: "dilemma", theme: "institutions",
    question: "Quel modèle institutionnel vous convient le mieux ?",
    optionA: {
      label: "💼 Exécutif présidentiel fort",
      description: "Conserver un président avec des pouvoirs étendus, capable de décisions rapides sans blocage parlementaire.",
      weights: { renaissance: 2, lr: 2, rn: 1 },
    },
    optionB: {
      label: "🗳 Démocratie délibérative",
      description: "Rééquilibrer les pouvoirs vers le Parlement et les citoyens, avec référendums et assemblées constituantes.",
      weights: { lfi: 3, eelv: 2, ps: 1 },
    },
  },
];

/* ================================================================
   ÉTAT
   ================================================================ */
let currentQ     = 0;
let reponses     = {};
let scaleVals    = {};
let themeWeights = {};

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

/* ================================================================
   DÉMARRER
   ================================================================ */
window.startQuiz = function() {
  introEl.style.display = "none";
  mainEl.classList.add("active");
  renderQuestion(0);
};

/* ================================================================
   RENDU D'UNE QUESTION
   ================================================================ */
function renderQuestion(idx) {
  currentQ = idx;
  var q     = QUESTIONS[idx];
  var total = QUESTIONS.length;
  var pct   = Math.round((idx / total) * 100);

  document.getElementById("progress-fill").style.width  = pct + "%";
  document.getElementById("progress-label").textContent = "Question " + (idx + 1) + " / " + total;

  var numEl  = document.getElementById("question-number");
  var textEl = document.getElementById("question-text");
  var cont   = document.getElementById("question-options");

  if (q.type === "dilemma") {
    numEl.textContent = "Dilemme " + (idx - 23);
    numEl.style.color = "#E8C547";
  } else {
    numEl.textContent = "Question " + (idx + 1);
    numEl.style.color = "var(--accent)";
  }

  textEl.textContent = q.question;
  cont.innerHTML     = "";

  if (q.type === "single")   renderSingle(q, idx, cont);
  else if (q.type === "scale")   renderScale(q, idx, cont);
  else if (q.type === "dilemma") renderDilemma(q, idx, cont);

  document.getElementById("btn-prev").disabled     = (idx === 0);
  document.getElementById("btn-next").textContent  =
    (idx === total - 1) ? "Pondérer mes thèmes →" : "Suivant →";
}

/* ── Single ── */
function renderSingle(q, idx, cont) {
  q.options.forEach(function(opt) {
    var btn = document.createElement("button");
    btn.className = "option-btn";
    if (reponses[idx] === opt) btn.classList.add("selected");
    btn.innerHTML = '<span class="radio-dot"></span><span>' + opt + "</span>";
    btn.addEventListener("click", function() {
      cont.querySelectorAll(".option-btn").forEach(function(b) { b.classList.remove("selected"); });
      btn.classList.add("selected");
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
    '<input type="range" class="scale-slider" min="1" max="5" value="' + val + '" id="scale-input-' + idx + '">' +
    '<div class="scale-dots">' +
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
    dots.forEach(function(d) { d.classList.toggle("active", parseInt(d.dataset.v) === v); });
    descEl.textContent = scaleDesc(v, q);
    slider.value = v;
  }

  slider.addEventListener("input", function() { update(slider.value); });
  dots.forEach(function(d) { d.addEventListener("click", function() { update(d.dataset.v); }); });
  reponses[idx] = (reponses[idx] !== undefined) ? reponses[idx] : val;
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
    if (reponses[idx] === key) btn.classList.add("selected");
    btn.innerHTML =
      '<span class="dilemma-label">' + opt.label + "</span>" +
      '<span class="dilemma-desc">'  + opt.description + "</span>";
    btn.addEventListener("click", function() {
      wrap.querySelectorAll(".dilemma-btn").forEach(function(b) { b.classList.remove("selected"); });
      btn.classList.add("selected");
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
  if (q.type === "scale" && reponses[currentQ] === undefined) {
    reponses[currentQ] = (scaleVals[currentQ] !== undefined) ? scaleVals[currentQ] : 3;
  }
  if (currentQ < QUESTIONS.length - 1) {
    renderQuestion(currentQ + 1);
  } else {
    afficherEtapeThematique();
  }
};

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
        '<span class="theme-icon">' + meta.icon + "</span>" +
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
function calculerResultats() {
  var scores = { rn: 0, lr: 0, renaissance: 0, modem: 0, ps: 0, lfi: 0, eelv: 0 };

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
    if (q.type === "single")   rawW = q.weights[rep]  || {};
    else if (q.type === "scale")   rawW = q.weights[rep]  || {};
    else if (q.type === "dilemma") rawW = (q[rep] && q[rep].weights) ? q[rep].weights : {};

    Object.entries(rawW).forEach(function(e) {
      if (scores[e[0]] !== undefined) scores[e[0]] += e[1] * mult;
    });
  });

  var total = Object.values(scores).reduce(function(a, b) { return a + b; }, 0);
  if (total === 0) return Object.fromEntries(Object.keys(scores).map(function(k) { return [k, 14]; }));

  var pcts = Object.fromEntries(
    Object.entries(scores).map(function(e) { return [e[0], Math.round((e[1] / total) * 100)]; })
  );
  var sum = Object.values(pcts).reduce(function(a, b) { return a + b; }, 0);
  if (sum !== 100) {
    var top = Object.entries(pcts).sort(function(a, b) { return b[1] - a[1]; })[0][0];
    pcts[top] += 100 - sum;
  }
  return pcts;
}

/* ================================================================
   RÉSULTATS
   ================================================================ */
function afficherResultats() {
  resultsEl.classList.add("active");

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
    if (!isTop) item.style.opacity = "0.55";

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
}

/* ================================================================
   RESET
   ================================================================ */
window.resetQuiz = function() {
  reponses     = {};
  scaleVals    = {};
  themeWeights = {};
  currentQ     = 0;
  QUESTIONS.forEach(function(q, idx) { if (q.type === "scale") scaleVals[idx] = 3; });
  resultsEl.classList.remove("active");
  thematicEl.classList.remove("active");
  introEl.style.display = "block";
};
