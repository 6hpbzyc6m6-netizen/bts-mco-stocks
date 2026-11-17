(function (root) {
  const scenarios = [
    {
      name: "SPORTÉO · Équipements sportifs",
      level: "BTS MCO",
      salePrice: 20,
      movements: [
        { date: "2026-03-01", type: "initial", qty: 40, cost: 10 },
        { date: "2026-03-05", type: "purchase", qty: 20, cost: 13 },
        { date: "2026-03-10", type: "out", qty: 30 },
        { date: "2026-03-15", type: "purchase", qty: 30, cost: 12 },
        { date: "2026-03-20", type: "out", qty: 25 },
      ],
    },
    {
      name: "01 · Premiers pas",
      level: "Débutant",
      salePrice: 15,
      movements: [
        { date: "2026-03-01", type: "initial", qty: 20, cost: 8 },
        { date: "2026-03-03", type: "purchase", qty: 10, cost: 8 },
        { date: "2026-03-06", type: "out", qty: 12 },
      ],
    },
    {
      name: "02 · Des prix qui évoluent",
      level: "Intermédiaire",
      salePrice: 25,
      movements: [
        { date: "2026-03-01", type: "initial", qty: 10, cost: 10 },
        { date: "2026-03-04", type: "purchase", qty: 20, cost: 16 },
        { date: "2026-03-08", type: "out", qty: 15 },
        { date: "2026-03-12", type: "purchase", qty: 10, cost: 12 },
        { date: "2026-03-18", type: "out", qty: 10 },
      ],
    },
  ];
  if (typeof module !== "undefined" && module.exports)
    module.exports = scenarios;
  else root.StockScenarios = scenarios;
})(typeof globalThis !== "undefined" ? globalThis : this);
