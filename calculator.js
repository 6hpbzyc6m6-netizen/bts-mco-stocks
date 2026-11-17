/* Analyseur arithmétique autonome : aucune exécution de code saisi. */
(function (root) {
  "use strict";
  function calculate(expression) {
    const text = String(expression)
      .replace(/\s/g, "")
      .replace(/,/g, ".")
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/−/g, "-");
    if (!text || text.length > 200)
      throw Error("Saisissez un calcul (200 caractères maximum).");
    const tokens = text.match(
      /(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[+*/()\-]/g,
    );
    if (!tokens || tokens.join("") !== text)
      throw Error("Utilisez des nombres, +, −, ×, ÷ et des parenthèses.");
    let index = 0;
    function factor() {
      const token = tokens[index++];
      if (token === "+") return factor();
      if (token === "-") return -factor();
      if (token === "(") {
        const value = sum();
        if (tokens[index++] !== ")") throw Error("Vérifiez les parenthèses.");
        return value;
      }
      if (token === undefined || !/^(?:\d|\.)/.test(token))
        throw Error("Le calcul est incomplet ou mal écrit.");
      const n = Number(token);
      if (!Number.isFinite(n)) throw Error("Nombre trop grand.");
      return n;
    }
    function product() {
      let value = factor();
      while (tokens[index] === "*" || tokens[index] === "/") {
        const op = tokens[index++],
          right = factor();
        if (op === "/" && right === 0)
          throw Error("La division par zéro est impossible.");
        value = op === "*" ? value * right : value / right;
      }
      return value;
    }
    function sum() {
      let value = product();
      while (tokens[index] === "+" || tokens[index] === "-") {
        const op = tokens[index++],
          right = product();
        value = op === "+" ? value + right : value - right;
      }
      return value;
    }
    const result = sum();
    if (index !== tokens.length)
      throw Error("Vérifiez les opérateurs et les parenthèses.");
    if (!Number.isFinite(result)) throw Error("Résultat trop grand.");
    return result;
  }
  if (typeof module !== "undefined" && module.exports)
    module.exports = { calculate };
  else root.StockCalculator = { calculate };
})(typeof globalThis !== "undefined" ? globalThis : this);
