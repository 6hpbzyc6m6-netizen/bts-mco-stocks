/* Tests du comportement des événements sans navigateur ni dépendance DOM. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
function app() {
  const nodes = new Map(),
    events = {},
    writes = [];
  function element(selector) {
    if (!nodes.has(selector)) {
      const handlers = {};
      const el = {
        value: "",
        textContent: "",
        innerHTML: "",
        open: false,
        handlers,
        addEventListener: (name, fn) => (handlers[name] = fn),
        setAttribute() {},
        focus() {},
        reset() {
          node("#teacher-password").value = "";
        },
        showModal() {
          this.open = true;
        },
        close() {
          this.open = false;
          handlers.close?.();
        },
      };
      nodes.set(selector, el);
    }
    return nodes.get(selector);
  }
  function node(selector) {
    return selector === "#answers-form"
      ? nodes.get(selector) || null
      : element(selector);
  }
  const document = {
    querySelector: node,
    querySelectorAll: () => [],
    addEventListener: (name, fn) => (events[name] = fn),
  };
  const context = vm.createContext({
    document,
    window: { scrollTo() {} },
    StockEngine: require("../engine.js"),
    StockScenarios: require("../scenarios.js"),
    localStorage: {
      getItem: () => null,
      setItem: (...args) => writes.push(args),
    },
    Intl,
    FormData: class {
      constructor(form) {
        return Object.entries(form.values);
      }
    },
  });
  vm.runInContext(
    fs.readFileSync(require.resolve("../app.js"), "utf8"),
    context,
  );
  return {
    node,
    nodes,
    writes,
    context,
    read: (code) => vm.runInContext(code, context),
    click(dataset = {}, id = "") {
      events.click({ target: { closest: () => ({ dataset, id }) } });
    },
    submit(selector) {
      element(selector).handlers.submit({ preventDefault() {} });
    },
  };
}
test("Mot de passe : refus, annulation et absence de changement de mode", () => {
  const a = app();
  a.click({ mode: "teacher" });
  assert.equal(a.node("#teacher-dialog").open, true);
  assert.equal(a.read("mode"), "student");
  a.node("#teacher-password").value = "incorrect";
  a.submit("#teacher-form");
  assert.equal(a.read("mode"), "student");
  assert.match(a.node("#teacher-error").textContent, /incorrect/);
  assert.equal(a.node("#teacher-password").value, "");
  a.click({}, "teacher-cancel");
  assert.equal(a.node("#teacher-dialog").open, false);
  assert.equal(a.read("mode"), "student");
});
test("Mot de passe correct, retour étudiant, nouveau verrou et rechargement", () => {
  const a = app();
  a.click({ mode: "teacher" });
  a.node("#teacher-password").value = "MCO1234";
  a.submit("#teacher-form");
  assert.equal(a.read("mode"), "teacher");
  assert.equal(a.node("#teacher-dialog").open, false);
  assert.equal(a.node("#teacher-password").value, "");
  a.click({ mode: "student" });
  assert.equal(a.read("mode"), "student");
  assert.equal(a.read("visible()"), false);
  a.click({ mode: "teacher" });
  assert.equal(a.read("mode"), "student");
  assert.equal(a.node("#teacher-dialog").open, true);
  assert.ok(a.writes.every(([, value]) => !value.includes("MCO1234")));
  assert.equal(app().read("mode"), "student");
});
test("Les réponses sont conservées pendant la navigation et les changements d’aide", () => {
  const a = app();
  a.nodes.set("#answers-form", {
    values: { finalQty: "18", "moving-value": "144,00" },
  });
  a.click({ view: "moving" });
  assert.equal(a.read("answers.finalQty"), "18");
  assert.equal(a.read('answers["moving-value"]'), "144,00");
  a.click({ view: "practice" });
  assert.match(a.node("#content").innerHTML, /value="144,00"/);
  a.click({ method: "fifo" });
  assert.equal(a.read("selectedMethod"), "fifo");
  assert.match(a.node("#content").innerHTML, /value="144,00"/);
});
test("Parcours : débutant par défaut, énoncé et boutons à chaque étape de travail", () => {
  const a = app();
  assert.match(a.read("scenario.name"), /Premiers pas/);
  for (const view of ["moving", "period", "fifo", "practice"]) {
    a.click({ view });
    const html = a.node("#content").innerHTML;
    assert.match(html, /Énoncé de l’exercice/);
    assert.match(html, /Stock initial/);
    assert.match(html, /Étape précédente/);
    assert.match(html, /aria-current="step"/);
  }
});
