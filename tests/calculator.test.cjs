const { test } = require("node:test");
const assert = require("node:assert/strict");
const { calculate } = require("../calculator.js");
test("Calculatrice : CUMP, virgules, priorités et parenthèses", () => {
  assert.equal(calculate("(400 + 260) / 60"), 11);
  assert.equal(calculate("(330+360)/(30+30)"), 11.5);
  assert.equal(calculate("402,5 + 617.5"), 1020);
  assert.equal(calculate("5 × 13 + 30 × 12"), 425);
  assert.equal(calculate("2 + 3 * 4"), 14);
  assert.equal(calculate("(2 + 3) * 4"), 20);
  assert.equal(calculate("12 ÷ 4"), 3);
});
test("Calculatrice : signes, précision et réutilisation en notation scientifique", () => {
  assert.equal(calculate("-2*-3"), 6);
  assert.equal(calculate("-(3+2)"), -5);
  assert.equal(calculate("1e-7+2e-7"), 3e-7);
  assert.equal(calculate("(1/3)*3"), 1);
  assert.equal(calculate("0"), 0);
});
test("Calculatrice : erreurs explicites et aucune exécution de code", () => {
  for (const expression of [
    "",
    "2+",
    "(2+3",
    "2(3)",
    "2**3",
    "alert(1)",
    "1;2",
    "Infinity",
    "1".repeat(201),
  ])
    assert.throws(() => calculate(expression));
  assert.throws(() => calculate("1/0"), /zéro/);
  assert.throws(() => calculate("1/(2-2)"), /zéro/);
  assert.throws(() => calculate("1e309"), /grand/);
});
