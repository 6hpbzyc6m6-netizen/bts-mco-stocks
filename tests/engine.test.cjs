const { test } = require("node:test");
const assert = require("node:assert/strict");
const { calculate, validate, METHODS } = require("../engine.js");
const scenarios = require("../scenarios.js");
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} ≠ ${b}`);
const scenario = (movements) => ({
  name: "Test",
  salePrice: 20,
  movements: movements.map((m, i) => ({
    date: `2026-03-${String(i + 1).padStart(2, "0")}`,
    type: m[0],
    qty: m[1],
    cost: m[2] ?? null,
  })),
});
function conservation(s) {
  for (const method of METHODS) {
    const r = calculate(s, method);
    near(r.value + r.outValue, r.totalValue);
    assert.equal(
      r.qty,
      s.movements.reduce((q, m) => q + (m.type === "out" ? -m.qty : m.qty), 0),
    );
    assert.ok(r.rows.every((row) => row.qtyRemaining >= 0));
    if (method === "fifo") {
      near(
        r.lots.reduce((v, l) => v + l.qty * l.cost, 0),
        r.value,
      );
      assert.equal(
        r.lots.reduce((q, l) => q + l.qty, 0),
        r.qty,
      );
    }
  }
}
test("SPORTÉO : trois stocks finaux, sorties et lots PEPS", () => {
  const s = scenarios[0],
    m = calculate(s, "moving"),
    p = calculate(s, "period"),
    f = calculate(s, "fifo");
  assert.equal(m.qty, 35);
  near(m.value, 402.5);
  near(p.value, 396.6666666666667);
  near(f.value, 425);
  assert.deepEqual(
    f.rows.filter((r) => r.type === "out").map((r) => r.exitValue),
    [300, 295],
  );
  assert.deepEqual(
    f.lots.map((l) => [l.qty, l.cost]),
    [
      [5, 13],
      [30, 12],
    ],
  );
  near(m.margin, 482.5);
  conservation(s);
});
test("Entrées successives et variations des coûts", () => {
  const s = scenario([
    ["initial", 10, 10],
    ["purchase", 10, 20],
    ["purchase", 20, 5],
  ]);
  for (const method of METHODS) {
    const r = calculate(s, method);
    near(r.value, 400);
    assert.equal(r.qty, 40);
  }
  near(calculate(s, "moving").rows[1].unitRemaining, 15);
  conservation(s);
});
test("Sorties successives, coûts identiques", () => {
  const s = scenario([
    ["initial", 20, 7.15],
    ["purchase", 10, 7.15],
    ["out", 5],
    ["out", 12],
  ]);
  for (const m of METHODS) {
    const r = calculate(s, m);
    near(r.value, 13 * 7.15);
    near(r.outValue, 17 * 7.15);
  }
  conservation(s);
});
test("PEPS : sortie sur trois lots et épuisement exact", () => {
  const s = scenario([
      ["initial", 4, 10],
      ["purchase", 6, 12],
      ["purchase", 8, 15],
      ["out", 12],
      ["out", 6],
    ]),
    r = calculate(s, "fifo");
  assert.deepEqual(
    r.rows[3].used.map((l) => l.qty),
    [4, 6, 2],
  );
  near(r.rows[3].exitValue, 142);
  assert.equal(r.rows[3].before.length, 3);
  assert.deepEqual(
    r.rows[3].after.map((l) => l.qty),
    [6],
  );
  assert.equal(r.lots.length, 0);
  assert.equal(r.qty, 0);
  conservation(s);
});
test("Stock nul, réapprovisionnement et coût gratuit", () => {
  const s = scenario([
    ["initial", 0, 0],
    ["purchase", 10, 0],
    ["out", 10],
    ["purchase", 3, 14],
    ["out", 1],
  ]);
  near(calculate(s, "moving").value, 28);
  near(calculate(s, "fifo").value, 28);
  conservation(s);
  for (const m of METHODS) {
    const empty = calculate(scenario([["initial", 0, 0]]), m);
    assert.equal(empty.value, 0);
    assert.equal(empty.average, 0);
  }
});
test("Coûts décroissants et précision intermédiaire", () => {
  const s = scenario([
    ["initial", 3, 10.01],
    ["purchase", 7, 4.37],
    ["out", 4],
    ["purchase", 3, 1.11],
    ["out", 2],
  ]);
  const r = calculate(s, "moving");
  near(r.rows[1].unitRemaining, 6.062);
  near(r.value, ((6 * 6.062 + 3 * 1.11) / 9) * 7);
  conservation(s);
});
test("Tous les exercices respectent les identités quantité et valeur", () =>
  scenarios.forEach(conservation));
test("Validation des quantités, dates, prix et chronologie", () => {
  for (const s of [
    scenario([
      ["initial", 2, 10],
      ["out", 3],
    ]),
    scenario([["initial", 1.5, 10]]),
    scenario([["initial", 1, -1]]),
    scenario([["purchase", 1, 1]]),
    scenario([
      ["initial", 1, 1],
      ["initial", 1, 1],
    ]),
    scenario([
      ["initial", 1, 1],
      ["out", 0],
    ]),
  ])
    assert.throws(() => validate(s));
  const s = scenario([
    ["initial", 1, 1],
    ["out", 1],
  ]);
  s.movements[1].date = "2026-02-30";
  assert.throws(() => validate(s));
  s.movements[1].date = "2026-01-01";
  assert.throws(() => validate(s));
  s.salePrice = Infinity;
  assert.throws(() => validate(s));
  assert.throws(() => calculate(scenarios[0], "unknown"));
});
test("Le moteur ne modifie pas les données et les instantanés de lots", () => {
  const s = structuredClone(scenarios[0]),
    before = structuredClone(s);
  const f = calculate(s, "fifo");
  assert.deepEqual(s, before);
  assert.equal(f.rows[2].before[0].qty, 40);
  assert.equal(f.rows[2].used[0].qty, 30);
  assert.equal(f.rows[2].after[0].qty, 10);
});
test("Conservation sur 100 scénarios déterministes à coûts variables", () => {
  let seed = 12345;
  function random() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  for (let n = 0; n < 100; n++) {
    let stock = Math.floor(random() * 20);
    const moves = [["initial", stock, random() * 30]];
    for (let i = 0; i < 20; i++) {
      if (stock > 0 && random() < 0.5) {
        const q = 1 + Math.floor(random() * stock);
        moves.push(["out", q]);
        stock -= q;
      } else {
        const q = 1 + Math.floor(random() * 15);
        moves.push(["purchase", q, random() * 30]);
        stock += q;
      }
    }
    conservation(scenario(moves));
  }
});
