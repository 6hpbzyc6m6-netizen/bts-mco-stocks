/* Moteur pur : aucun arrondi intermédiaire ; affichage arrondi par l'interface. */
(function (root) {
  "use strict";
  const METHODS = ["moving", "period", "fifo"];
  function validate(s) {
    if (
      !s ||
      typeof s.name !== "string" ||
      !s.name.trim() ||
      s.name.length > 100
    )
      throw Error("Indiquez un nom de scénario (100 caractères maximum).");
    if (
      !Array.isArray(s.movements) ||
      !s.movements.length ||
      s.movements.length > 500
    )
      throw Error("Le scénario doit contenir entre 1 et 500 mouvements.");
    if (
      s.salePrice !== null &&
      s.salePrice !== undefined &&
      (!Number.isFinite(s.salePrice) || s.salePrice < 0 || s.salePrice > 1e9)
    )
      throw Error("Prix de vente invalide.");
    let q = 0,
      last = "";
    s.movements.forEach((m, i) => {
      if (!m || !["initial", "purchase", "out"].includes(m.type))
        throw Error(`Ligne ${i + 1} : type invalide.`);
      if ((i === 0) !== (m.type === "initial"))
        throw Error("La première ligne doit être le seul stock initial.");
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(m.date) ||
        !Number.isFinite(Date.parse(m.date)) ||
        new Date(m.date).toISOString().slice(0, 10) !== m.date
      )
        throw Error(`Ligne ${i + 1} : date invalide.`);
      if (m.date < last)
        throw Error(`Ligne ${i + 1} : respectez l’ordre chronologique.`);
      last = m.date;
      if (
        !Number.isSafeInteger(m.qty) ||
        m.qty < (m.type === "initial" ? 0 : 1) ||
        m.qty > 1e9
      )
        throw Error(
          `Ligne ${i + 1} : quantité entière ${m.type === "initial" ? "positive ou nulle" : "strictement positive"} requise (maximum : 1 milliard).`,
        );
      if (
        m.type !== "out" &&
        (!Number.isFinite(m.cost) || m.cost < 0 || m.cost > 1e9)
      )
        throw Error(`Ligne ${i + 1} : coût unitaire positif ou nul requis.`);
      q += m.type === "out" ? -m.qty : m.qty;
      if (q < 0)
        throw Error(
          `Ligne ${i + 1} : sortie impossible, stock insuffisant (${q + m.qty} unités disponibles).`,
        );
    });
    return s;
  }
  function calculate(s, method) {
    validate(s);
    if (!METHODS.includes(method)) throw Error("Méthode inconnue.");
    const entries = s.movements.filter((m) => m.type !== "out");
    const totalQty = entries.reduce((a, m) => a + m.qty, 0);
    const totalValue = entries.reduce((a, m) => a + m.qty * m.cost, 0);
    const average = totalQty ? totalValue / totalQty : 0;
    let qty = 0,
      value = 0,
      unit = 0,
      outValue = 0,
      outQty = 0,
      lots = [];
    const rows = s.movements.map((m, i) => {
      const before = lots.map((l) => ({ ...l }));
      let used = [],
        entryValue = 0,
        exitValue = 0,
        exitUnit = null;
      if (m.type !== "out") {
        entryValue = m.qty * m.cost;
        qty += m.qty;
        value += entryValue;
        if (method === "fifo") {
          if (m.qty)
            lots.push({
              id: i,
              label: `Lot ${i + 1}`,
              qty: m.qty,
              cost: m.cost,
              date: m.date,
            });
          unit = qty ? value / qty : 0;
        } else if (method === "period") {
          unit = average;
          value = qty * unit;
        } else unit = qty ? value / qty : 0;
      } else {
        if (method === "fifo") {
          let remaining = m.qty;
          while (remaining > 0) {
            const lot = lots[0],
              take = Math.min(remaining, lot.qty);
            used.push({ ...lot, qty: take });
            exitValue += take * lot.cost;
            lot.qty -= take;
            remaining -= take;
            if (!lot.qty) lots.shift();
          }
          exitUnit = exitValue / m.qty;
        } else {
          exitUnit = unit;
          exitValue = m.qty * unit;
        }
        qty -= m.qty;
        value = method === "period" ? qty * average : value - exitValue;
        if (!qty) {
          value = 0;
          if (method === "moving") unit = 0;
        }
        outValue += exitValue;
        outQty += m.qty;
      }
      return {
        ...m,
        index: i,
        entryValue,
        exitValue,
        exitUnit,
        qtyRemaining: qty,
        unitRemaining: qty ? value / qty : 0,
        valueRemaining: value,
        before,
        used,
        after: lots.map((l) => ({ ...l })),
      };
    });
    return {
      method,
      rows,
      qty,
      value,
      outValue,
      outQty,
      average,
      totalValue,
      lots,
      margin: s.salePrice == null ? null : outQty * s.salePrice - outValue,
    };
  }
  const api = { validate, calculate, METHODS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.StockEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
