/* Interface statique : données locales seulement, aucune requête réseau. */
"use strict";
const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const money = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    n,
  );
const unit = (n) =>
  new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 4,
    minimumFractionDigits: 2,
  }).format(n);
const date = (s) => s.slice(8, 10) + "/" + s.slice(5, 7);
const clone = (v) => JSON.parse(JSON.stringify(v));
const names = {
  moving: "CUMP après chaque entrée",
  period: "CUMP en fin de période",
  fifo: "PEPS / FIFO",
};
const descriptions = {
  moving: "Le coût moyen est recalculé à chaque nouvel achat.",
  period: "Un coût moyen unique pour l’ensemble de la période.",
  fifo: "Les premiers articles entrés sont les premiers sortis.",
};
const titles = {
  dashboard: "Les stocks, en clair.",
  movements: "Chaque mouvement compte.",
  moving: names.moving,
  period: names.period,
  fifo: names.fifo,
  compare: "Trois méthodes, un même stock.",
  practice: "À vous de jouer.",
};
const subtitles = {
  dashboard: "Explorez les méthodes de valorisation à partir d’un cas concret.",
  movements:
    "Construisez une chronologie cohérente des entrées et des sorties.",
  moving: descriptions.moving,
  period: descriptions.period,
  fifo: descriptions.fifo,
  compare: "Observez les écarts de valorisation et leur effet sur la marge.",
  practice: "Calculez, vérifiez et comprenez les étapes de votre raisonnement.",
};
const palette = [
  "#789558",
  "#b78351",
  "#8070ac",
  "#4c99a4",
  "#ac6679",
  "#a49c43",
];
let scenario = clone(StockScenarios[0]),
  mode = "student",
  view = "dashboard",
  revealed = false,
  progress = {},
  feedback = "",
  answers = {};
try {
  const stored = JSON.parse(localStorage.getItem("stocklab-v1"));
  if (stored) {
    StockEngine.validate(stored.scenario);
    scenario = stored.scenario;
    if (stored.progress && typeof stored.progress === "object")
      progress = stored.progress;
  }
} catch (e) {
  /* Une sauvegarde invalide est ignorée. */
}
function save() {
  try {
    localStorage.setItem("stocklab-v1", JSON.stringify({ scenario, progress }));
    $("#save-status").textContent = "● Sauvegardé sur cet appareil";
  } catch (e) {
    $("#save-status").textContent =
      "⚠ Sauvegarde indisponible : exportez en JSON";
  }
}
function notify(msg) {
  $("#notice").textContent = msg;
}
function visible() {
  return mode === "teacher" || revealed;
}
function results() {
  return Object.fromEntries(
    StockEngine.METHODS.map((m) => [m, StockEngine.calculate(scenario, m)]),
  );
}
function stat(label, number, note, featured = false) {
  return `<div class="stat ${featured ? "featured" : ""}"><div class="label">${label}<span>↗</span></div><div class="number">${number}</div><p>${note}</p></div>`;
}
function dashboard(r) {
  const final = r.moving.qty;
  const entries = scenario.movements
    .filter((m) => m.type !== "out")
    .reduce((n, m) => n + m.qty, 0);
  return `<div class="stats">${stat("Unités disponibles au total", entries + "<small>unités</small>", "Stock initial + achats")}${stat("Sorties de la période", r.moving.outQty + "<small>unités</small>", scenario.movements.filter((m) => m.type === "out").length + " mouvements de sortie")}${stat("Stock final", visible() ? final + "<small>unités</small>" : "À calculer", visible() ? "Identique pour les trois méthodes" : "Entraînez-vous pour le découvrir", true)}${stat("Méthodes à explorer", "03", "Deux CUMP et la méthode PEPS")}</div><div class="section-title"><div><h2>Une situation. Trois approches.</h2><p>Choisissez une méthode pour dérouler la fiche de stock.</p></div><span class="step">01 — 03</span></div><div class="method-grid">${StockEngine.METHODS.map((m, i) => `<article class="method-card"><div class="method-top"><span class="method-number">0${i + 1}</span><span class="method-kicker">${["COÛT MOYEN MOBILE", "COÛT MOYEN PÉRIODIQUE", "PREMIER ENTRÉ, PREMIER SORTI"][i]}</span></div><h3>${["CUMP après entrée", "CUMP fin de période", "PEPS / FIFO"][i]}</h3><p>${descriptions[m]}</p><div class="method-result"><small>Valeur du stock final</small><strong class="${visible() ? "" : "hidden-result"}">${visible() ? money(r[m].value) : "À vous de la calculer"}</strong></div><button class="button secondary" data-view="${m}">Explorer la méthode <span>→</span></button></article>`).join("")}</div><div class="bottom-grid"><section class="panel"><div class="panel-title"><h2>La vie de votre stock</h2><small>${scenario.movements.length} mouvements</small></div><div class="timeline">${scenario.movements
    .slice(0, 8)
    .map(
      (m) =>
        `<div class="event ${m.type === "out" ? "out" : ""}"><i>${m.type === "out" ? "−" : "+"}</i><b>${date(m.date)}</b><span>${m.qty} unités</span><br><small>${m.type === "initial" ? "Stock initial" : m.type === "purchase" ? "Achat" : "Sortie"}</small></div>`,
    )
    .join(
      "",
    )}</div>${scenario.movements.length > 8 ? '<p class="legend">Les huit premiers mouvements sont représentés.</p>' : ""}</section><section class="panel tip"><div class="eyebrow">✦ LE REPÈRE À RETENIR</div><h3>La quantité reste. La valeur change.</h3><p>Les méthodes de valorisation donnent la même quantité finale, mais peuvent modifier la valeur du stock et le coût des sorties.</p></section></div>${!visible() ? '<div class="actions" style="margin-top:20px"><button class="button primary" data-view="practice">Commencer un exercice →</button></div>' : ""}`;
}
function movements() {
  return `<section class="panel"><div class="toolbar"><label>Nom du scénario<input id="name-input" maxlength="100" value="${esc(scenario.name)}"></label><label>Prix de vente unitaire HT (€)<input id="sale-input" type="number" min="0" max="1000000000" step="any" placeholder="Facultatif" value="${scenario.salePrice ?? ""}"></label><div class="actions"><button id="add-movement" class="button primary">+ Ajouter</button><button id="export" class="button secondary">Exporter JSON</button><button id="import" class="button secondary">Importer JSON</button></div></div><p class="teacher-note">${mode === "teacher" ? "Mode enseignant sans authentification : cet espace n’est pas privé." : "Vous pouvez modifier les données pour expérimenter."} Les dates sont triées automatiquement ; à date égale, l’ordre des lignes est conservé. Quantités entières.</p><div class="table-wrap"><table><thead><tr><th>Date</th><th>Mouvement</th><th>Quantité</th><th>Coût unitaire HT</th><th>Valeur de l’entrée</th><th>Actions</th></tr></thead><tbody>${scenario.movements.map((m, i) => `<tr><td>${date(m.date)}<small>/${m.date.slice(0, 4)}</small></td><td><span class="type-label ${m.type === "out" ? "out" : ""}">${m.type === "initial" ? "Stock initial" : m.type === "out" ? "Sortie" : "Achat"}</span></td><td>${m.qty}</td><td>${m.type === "out" ? "—" : money(m.cost)}</td><td>${m.type === "out" ? "—" : money(m.qty * m.cost)}</td><td><button class="row-action" data-edit="${i}" aria-label="Modifier la ligne ${i + 1}">Modifier</button>${i ? `<button class="row-action delete" data-delete="${i}" aria-label="Supprimer la ligne ${i + 1}">Supprimer</button>` : ""}</td></tr>`).join("")}</tbody></table></div></section>`;
}
function lotsHTML(lots) {
  return lots.length
    ? `<div class="lots">${lots.map((l) => `<span class="lot" style="--lot-color:${palette[l.id % palette.length]}">${esc(l.label)} · ${l.qty} × ${money(l.cost)}</span>`).join("")}</div>`
    : '<p class="empty">Aucun lot : stock nul.</p>';
}
function formula(method, r) {
  if (method === "moving")
    return `<p class="formula">CUMP = (valeur du stock précédent + valeur de l’entrée) ÷ (quantité précédente + quantité entrée)</p><p>Chaque sortie utilise le dernier CUMP connu. Le coût moyen est conservé sans arrondi intermédiaire.</p>`;
  if (method === "period")
    return `<p class="formula">CUMP = (valeur initiale + valeur des achats) ÷ (quantité initiale + quantités achetées)</p>${visible() ? `<p>Soit ${money(r.totalValue)} ÷ ${scenario.movements.filter((m) => m.type !== "out").reduce((a, m) => a + m.qty, 0)} = <strong>${unit(r.average)} € HT / unité</strong>.</p>` : ""}<p>Les sorties sont valorisées définitivement en fin de période. Les valeurs intermédiaires de la fiche sont rétrospectives.</p><p>Dans le cadre comptable français, la période de calcul ne doit pas excéder la durée moyenne de stockage.</p>`;
  return "<p>Une sortie épuise les lots les plus anciens avant de prélever dans les suivants. Chaque lot conserve son coût d’achat. Son numéro et sa couleur restent identiques dans toute la fiche.</p>";
}
function stockTable(r) {
  return `<div class="table-wrap"><table><thead><tr><th rowspan="2">Date</th><th rowspan="2">Mouvement</th><th colspan="3">Entrées</th><th colspan="3">Sorties</th><th colspan="3">Stock restant</th></tr><tr><th>Qté</th><th>CU HT</th><th>Valeur HT</th><th>Qté</th><th>CU HT${r.method === "fifo" ? " moyen" : ""}</th><th>Valeur HT</th><th>Qté</th><th>CU HT${r.method === "fifo" ? " moyen" : ""}</th><th>Valeur HT</th></tr></thead><tbody>${r.rows.map((m) => `<tr><td>${date(m.date)}</td><td>${m.type === "initial" ? "Initial" : m.type === "purchase" ? "Achat" : "Sortie"}</td><td>${m.type === "out" ? "—" : m.qty}</td><td>${m.type === "out" ? "—" : unit(m.cost)}</td><td>${m.type === "out" ? "—" : money(m.entryValue)}</td><td>${m.type === "out" ? m.qty : "—"}</td><td>${m.type === "out" ? unit(m.exitUnit) : "—"}</td><td>${m.type === "out" ? money(m.exitValue) : "—"}</td><td>${m.qtyRemaining}</td><td>${unit(m.unitRemaining)}</td><td><strong>${money(m.valueRemaining)}</strong></td></tr>`).join("")}</tbody></table></div><p class="legend">CU : coût unitaire. Coûts affichés à 4 décimales ; montants à 2 décimales. Les calculs utilisent toute la précision disponible.${r.method === "fifo" ? " Les CU moyens sont des repères ; les sorties sont calculées lot par lot." : ""}</p>`;
}
function methodView(r) {
  return `<section class="panel"><div class="panel-title"><h2>La méthode, pas à pas</h2><span class="tag">${r.method === "fifo" ? "Lots distincts" : "Coût moyen"}</span></div><div class="explanation">${formula(r.method, r)}</div>${
    !visible()
      ? `<p>Les données du scénario sont disponibles dans « Mouvements ». Les fiches chiffrées seront accessibles après la correction.</p><button class="button primary" data-view="practice">Saisir mes réponses →</button>`
      : `<div class="stats">${stat("Quantité finale", r.qty + "<small>unités</small>", "Stock initial + entrées − sorties")}${stat("Valeur du stock final", money(r.value), "Coût de conservation en stock", true)}${stat("Coût total des sorties", money(r.outValue), r.outQty + " unités sorties")}${stat("Marge brute", r.margin === null ? "—" : money(r.margin), r.margin === null ? "Renseignez un prix dans Mouvements" : "Chiffre d’affaires HT − coût des sorties")}</div><h3>Fiche de stock · ${names[r.method]}</h3>${stockTable(r)}${
          r.method === "fifo"
            ? `<div class="section-title"><h2>Suivre les lots PEPS</h2></div>${r.rows
                .filter((m) => m.type === "out")
                .map(
                  (m) =>
                    `<article class="lot-detail"><h3>Sortie du ${date(m.date)} · ${m.qty} unités · ${money(m.exitValue)}</h3><div class="lot-step"><div><small>01 · Lots avant la sortie</small>${lotsHTML(m.before)}</div><div><small>02 · Prélèvements effectués</small>${lotsHTML(m.used)}<p class="legend">${m.used.map((l) => `${l.qty} × ${money(l.cost)}`).join(" + ")} = ${money(m.exitValue)}</p></div><div><small>03 · Lots après la sortie</small>${lotsHTML(m.after)}</div></div></article>`,
                )
                .join(
                  "",
                )}<h3>Composition du stock final</h3>${lotsHTML(r.lots)}`
            : ""
        }`
  }</section>`;
}
function compare(r) {
  if (!visible())
    return '<section class="panel"><h2>Comparez après avoir calculé</h2><p>Complétez les réponses pour les trois méthodes, puis affichez la correction pour explorer les écarts.</p><button class="button primary" data-view="practice">S’entraîner →</button></section>';
  const values = Object.values(r),
    min = Math.min(...values.map((v) => v.value)),
    max = Math.max(...values.map((v) => v.value));
  return `<section class="panel"><h2>Les résultats côte à côte</h2><p class="legend">Écart calculé par rapport au CUMP après chaque entrée.</p><div class="table-wrap"><table><thead><tr><th>Indicateur</th>${StockEngine.METHODS.map((m) => `<th>${names[m]}</th>`).join("")}</tr></thead><tbody>${[
    ["Quantité finale", (v) => v.qty + " unités"],
    ["Stock final HT", (v) => money(v.value)],
    ["Coût total des sorties HT", (v) => money(v.outValue)],
    ["Écart du stock final", (v) => money(v.value - r.moving.value)],
    [
      "Marge brute",
      (v) => (v.margin === null ? "Non renseignée" : money(v.margin)),
    ],
  ]
    .map(
      ([label, fn]) =>
        `<tr><td>${label}</td>${values.map((v) => `<td>${fn(v)}</td>`).join("")}</tr>`,
    )
    .join(
      "",
    )}</tbody></table></div></section><div class="bottom-grid"><section class="panel"><div class="panel-title"><h2>Valeur du stock final</h2><small>En euros HT · origine : 0</small></div>${values.map((v, i) => `<div class="chart-row"><div class="chart-label"><span>${names[v.method]}</span><strong>${money(v.value)}</strong></div><div class="bar-track" role="img" aria-label="${names[v.method]} : ${money(v.value)}"><div class="bar" style="width:${max ? (v.value / max) * 100 : 0}%;background:${[palette[0], palette[1], palette[2]][i]}"></div></div></div>`).join("")}</section><section class="panel tip"><div class="eyebrow">LIRE LES ÉCARTS</div><h3>${money(max - min)} entre les valeurs extrêmes</h3><p>La valeur totale disponible est identique : ${money(r.moving.totalValue)}. Chaque méthode répartit cette valeur entre les sorties et le stock final.</p><p>À chiffre d’affaires identique, une hausse du coût des sorties diminue la marge brute du même montant. En période de hausse régulière des coûts, PEPS tend à conserver les lots récents, plus chers, en stock.</p></section></div>`;
}
function practice(r) {
  let done = Object.keys(progress).filter((k) => progress[k] === true).length;
  return `<section class="panel"><div class="panel-title"><h2>Votre parcours d’apprentissage</h2><small>Débutant → Intermédiaire → BTS MCO</small></div><p class="legend">Chargez les exercices dans l’ordre 01, 02, puis SPORTÉO. Les acquis sont enregistrés uniquement pour les scénarios prédéfinis, sans modification.</p><div class="progress-track"><span style="width:${(done / 3) * 100}%"></span></div><p class="progress-label">${done} / 3 exercices validés</p></section><section class="panel" style="margin-top:18px"><h2>Quelle valeur reste-t-il en stock ?</h2><p class="legend">Utilisez la chronologie de l’onglet Mouvements. Arrondissez vos montants au centime ; la virgule et le point sont acceptés.</p><form id="answers-form"><label>Quantité finale (unités)<input name="finalQty" type="text" inputmode="numeric" value="${esc(answers.finalQty ?? "")}" required></label>${StockEngine.METHODS.map((m) => `<div class="answer-block"><h3>${names[m]}</h3><div class="practice-fields"><label>Valeur du stock final (€)<input name="${m}-value" inputmode="decimal" value="${esc(answers[m + "-value"] ?? "")}" required></label><label>Coût total des sorties (€)<input name="${m}-outValue" inputmode="decimal" value="${esc(answers[m + "-outValue"] ?? "")}" required></label></div></div>`).join("")}<div class="actions" style="margin-top:20px"><button class="button primary" type="submit">Vérifier mes réponses</button><button type="button" id="show-correction" class="button secondary">Afficher la correction détaillée</button></div></form><div class="feedback" id="feedback" aria-live="polite">${feedback}</div></section>${visible() ? `<section class="panel" style="margin-top:18px"><h2>Correction détaillée</h2><p class="legend">La quantité finale vaut ${scenario.movements.filter((m) => m.type !== "out").reduce((n, m) => n + m.qty, 0)} − ${r.moving.outQty} = ${r.moving.qty} unités.</p>${StockEngine.METHODS.map((m) => `<div class="answer-block"><h3>${names[m]}</h3><div class="explanation">${formula(m, r[m])}</div>${stockTable(r[m])}<p class="legend">Valeur disponible ${money(r[m].totalValue)} = sorties ${money(r[m].outValue)} + stock final ${money(r[m].value)}.</p><button class="button secondary" data-view="${m}">Ouvrir la fiche ${m === "fifo" ? "et les lots" : ""} →</button></div>`).join("")}</section>` : ""}`;
}
function render() {
  const r = results();
  $("#page-title").textContent = titles[view];
  $("#page-subtitle").textContent = subtitles[view];
  $("#breadcrumb-current").textContent =
    view === "dashboard"
      ? "Tableau de bord"
      : view === "movements"
        ? "Mouvements"
        : view === "compare"
          ? "Comparaison"
          : view === "practice"
            ? "S’entraîner"
            : names[view];
  $("#scenario-name").textContent = scenario.name;
  $("#scenario-description").textContent =
    `${date(scenario.movements[0].date)} au ${date(scenario.movements.at(-1).date)} · ${scenario.movements[0].date.slice(0, 4)} · ${scenario.movements.length} mouvements`;
  $("#movement-count").textContent = scenario.movements.length;
  $("#level-tag").textContent = scenario.level || "Scénario libre";
  document
    .querySelectorAll("[data-mode]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.mode === mode)),
    );
  document
    .querySelectorAll("nav [data-view]")
    .forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  $("#content").innerHTML =
    view === "dashboard"
      ? dashboard(r)
      : view === "movements"
        ? movements()
        : view === "compare"
          ? compare(r)
          : view === "practice"
            ? practice(r)
            : methodView(r[view]);
}
function invalidate() {
  revealed = false;
  feedback = "";
  answers = {};
  save();
  render();
}
function commit(candidate) {
  try {
    StockEngine.validate(candidate);
    scenario = candidate;
    invalidate();
    notify(
      "Scénario enregistré. Les réponses précédentes ont été réinitialisées.",
    );
    return true;
  } catch (e) {
    notify(e.message);
    return false;
  }
}
function openMovement(i) {
  const m =
    i === null
      ? {
          type: "purchase",
          date: scenario.movements.at(-1).date,
          qty: 1,
          cost: 0,
        }
      : scenario.movements[i];
  $("#edit-index").value = i === null ? "" : i;
  $("#dialog-title").textContent =
    i === null ? "Ajouter un mouvement" : "Modifier le mouvement";
  $("#type").value = m.type;
  $("#type").disabled = i === 0;
  $('#type option[value="initial"]').disabled = i !== 0;
  $("#date").value = m.date;
  $("#qty").value = m.qty;
  $("#cost").value = m.cost ?? 0;
  $("#form-error").textContent = "";
  costVisibility();
  $("#movement-dialog").showModal();
}
function costVisibility() {
  $("#cost-label").hidden = $("#type").value === "out";
  $("#cost").required = $("#type").value !== "out";
  $("#qty").min = $("#type").value === "initial" ? 0 : 1;
}
function exportJSON() {
  const blob = new Blob(
    [JSON.stringify({ version: 1, ...scenario }, null, 2)],
    { type: "application/json" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "stocklab-scenario.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.view) {
    view = b.dataset.view;
    notify("");
    render();
    return;
  }
  if (b.dataset.mode) {
    mode = b.dataset.mode;
    revealed = false;
    feedback = "";
    answers = {};
    notify(
      mode === "teacher"
        ? "Mode enseignant : corrections visibles. Cet espace est accessible sans authentification."
        : "Mode étudiant : les résultats sont masqués.",
    );
    render();
    return;
  }
  if (b.dataset.edit !== undefined) openMovement(Number(b.dataset.edit));
  if (b.dataset.delete !== undefined) {
    const next = clone(scenario);
    next.movements.splice(Number(b.dataset.delete), 1);
    commit(next);
  }
  if (b.id === "add-movement") openMovement(null);
  if (b.id === "cancel") $("#movement-dialog").close();
  if (b.id === "export") exportJSON();
  if (b.id === "import") $("#import-file").click();
  if (b.id === "print") window.print();
  if (b.id === "show-correction") {
    captureAnswers();
    revealed = true;
    feedback =
      "<p>Correction consultée. Pour valider le parcours, répondez correctement avant de consulter la correction.</p>";
    render();
  }
});
$("#type").addEventListener("change", costVisibility);
$("#movement-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const i = $("#edit-index").value;
  const m = {
    type: $("#type").value,
    date: $("#date").value,
    qty: Number($("#qty").value),
    cost: $("#type").value === "out" ? null : Number($("#cost").value),
  };
  const next = clone(scenario);
  if (i === "") next.movements.push(m);
  else next.movements[Number(i)] = m;
  next.movements.sort((a, b) => a.date.localeCompare(b.date));
  try {
    StockEngine.validate(next);
    scenario = next;
    $("#movement-dialog").close();
    invalidate();
    notify("Mouvement enregistré.");
  } catch (err) {
    $("#form-error").textContent = err.message;
  }
});
$("#scenario-picker").addEventListener("change", (e) => {
  scenario = clone(StockScenarios[Number(e.target.value)]);
  invalidate();
  notify("Exercice chargé et sauvegardé.");
});
document.addEventListener("change", (e) => {
  if (e.target.id === "name-input") {
    const next = clone(scenario);
    next.name = e.target.value;
    commit(next);
  }
  if (e.target.id === "sale-input") {
    const next = clone(scenario);
    next.salePrice = e.target.value === "" ? null : Number(e.target.value);
    commit(next);
  }
});
$("#import-file").addEventListener("change", async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    if (f.size > 500000)
      throw Error("Fichier trop volumineux (500 Ko maximum).");
    const data = JSON.parse(await f.text());
    if (data.version !== 1)
      throw Error("Format non reconnu : version 1 requise.");
    const next = {
      name: data.name,
      level: "Scénario importé",
      salePrice: data.salePrice ?? null,
      movements: data.movements,
    };
    commit(next);
  } catch (err) {
    notify("Import impossible : " + err.message);
  } finally {
    e.target.value = "";
  }
});
function captureAnswers() {
  const f = $("#answers-form");
  if (f) answers = Object.fromEntries(new FormData(f));
}
function numeric(raw) {
  const normalized = String(raw ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");
  return /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)
    ? Number(normalized)
    : NaN;
}
document.addEventListener("submit", (e) => {
  if (e.target.id !== "answers-form") return;
  e.preventDefault();
  captureAnswers();
  const r = results();
  let all = true;
  const messages = [];
  function check(key, expected, label, hint, isQty = false) {
    const val = numeric(answers[key]);
    const correct =
      Number.isFinite(val) &&
      (isQty
        ? val === expected
        : Math.abs(val - Math.round((expected + Number.EPSILON) * 100) / 100) <
          0.010001);
    all = all && correct;
    messages.push(
      `<p class="${correct ? "success" : "error"}">${correct ? "✓" : "↳"} ${label} : ${correct ? "réponse correcte." : !Number.isFinite(val) ? "saisissez un nombre valide." : hint}</p>`,
    );
  }
  check(
    "finalQty",
    r.moving.qty,
    "Quantité finale",
    "Additionnez le stock initial et les achats, puis retirez toutes les sorties.",
    true,
  );
  StockEngine.METHODS.forEach((m) => {
    check(
      m + "-value",
      r[m].value,
      names[m] + " · stock final",
      m === "fifo"
        ? "Reconstituez les lots restants après chaque prélèvement."
        : m === "moving"
          ? "Recalculez le CUMP après chaque achat, avec le stock réellement restant."
          : "Incluez le stock initial et tous les achats dans le coût moyen.",
    );
    check(
      m + "-outValue",
      r[m].outValue,
      names[m] + " · coût des sorties",
      "Vérifiez : valeur disponible = coût des sorties + valeur du stock final.",
    );
  });
  if (all && !revealed && mode === "student") {
    const idx = StockScenarios.findIndex(
      (s) =>
        s.name === scenario.name &&
        s.salePrice === scenario.salePrice &&
        JSON.stringify(s.movements) === JSON.stringify(scenario.movements),
    );
    if (idx >= 0) {
      progress[idx] = true;
      save();
    }
    messages.unshift(
      '<p class="success"><strong>Toutes les réponses sont correctes !</strong></p>',
    );
    revealed = true;
  } else if (all) {
    messages.unshift(
      '<p class="success">Réponses correctes. La correction a déjà été consultée ou le mode enseignant est actif ; le parcours n’est pas validé par cette tentative.</p>',
    );
  }
  feedback = messages.join("");
  render();
});
render();
save();
