export const defaults = {
  resale: 240,
  units: 4,
  failure: 0.18,
  salvage: 25,
  sellFee: 0.12,
  premium: 0.25,
  vat: 0.2,
  transport: 35,
  targetProfit: 150,
  currentBid: 280,
};
export const controls = [
  {
    key: "resale",
    label: "Working unit resale (£)",
    type: "number",
    min: 0,
    max: 5000,
    step: 5,
  },
  {
    key: "units",
    label: "Units in lot",
    type: "number",
    min: 1,
    max: 100,
    step: 1,
  },
  {
    key: "failure",
    label: "Failure probability (0-1)",
    type: "number",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: "premium",
    label: "Buyer premium (0-1)",
    type: "number",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: "vat",
    label: "VAT on hammer + premium (0-1)",
    type: "number",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: "targetProfit",
    label: "Target profit (£)",
    type: "number",
    min: 0,
    max: 5000,
    step: 10,
  },
  {
    key: "currentBid",
    label: "Hammer bid (£)",
    type: "number",
    min: 0,
    max: 5000,
    step: 10,
  },
];
export function value(i) {
  if (
    ["failure", "sellFee", "premium", "vat"].some(
      (k) => !Number.isFinite(i[k]) || i[k] < 0 || i[k] > 1,
    ) ||
    !Number.isInteger(i.units) ||
    i.units < 1 ||
    ["resale", "salvage", "transport", "targetProfit", "currentBid"].some(
      (k) => !Number.isFinite(i[k]) || i[k] < 0,
    )
  )
    throw Error(
      "Use valid nonnegative amounts, whole units and rates between 0 and 1.",
    );
  const net =
      i.units *
      ((1 - i.failure) * i.resale + i.failure * i.salvage) *
      (1 - i.sellFee),
    factor = (1 + i.premium) * (1 + i.vat),
    budget = (net - i.transport - i.targetProfit) / factor;
  return {
    net,
    maxBid: Math.max(0, budget),
    viable: budget >= 0,
    cost: i.currentBid * factor + i.transport,
    profit: net - i.currentBid * factor - i.transport,
    factor,
  };
}
export function run(i) {
  const r = value(i);
  return {
    summary: !r.viable
      ? "Even a free lot misses the target"
      : i.currentBid > r.maxBid
        ? "This bid misses the target margin"
        : "This bid fits the target margin",
    metrics: {
      "max hammer (£)": r.maxBid.toFixed(2),
      "all-in cost (£)": r.cost.toFixed(2),
      "expected profit (£)": r.profit.toFixed(2),
    },
    columns: [
      "failure assumption",
      "expected net resale (£)",
      "max hammer (£)",
      "profit at bid (£)",
    ],
    rows: [0, 0.1, 0.2, 0.3, 0.5].map((failure) => {
      const v = value({ ...i, failure });
      return [
        failure * 100 + "%",
        v.net.toFixed(2),
        v.maxBid.toFixed(2),
        v.profit.toFixed(2),
      ];
    }),
    steps: [
      "Identify parts and condition",
      "Estimate working resale and faulty salvage",
      "Deduct selling costs and add purchase fees",
      "Solve backwards from the target profit to a hammer limit",
    ],
    artifact: r,
  };
}
