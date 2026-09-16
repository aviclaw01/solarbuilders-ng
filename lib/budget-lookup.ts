/**
 * SolarBuilders.ng — Budget lookup, for the browser
 *
 * lib/budget.ts answers "what does ₦x buy" by pricing every build on the load
 * ladder through buildQuote(). That is fine at build time and wrong in the
 * calculator's client bundle: it drags in lib/sizing.ts and dozens of quote
 * runs to answer a question whose answer is a short sorted list.
 *
 * So the server does the search once (budgetLookupData() in lib/budget.ts) and
 * hands the calculator only the builds that could ever be somebody's best
 * answer, cheapest first. This file has NO IMPORTS on purpose — it is the part
 * that ships to the browser. lib/budget.ts checks at build time that these
 * functions return exactly what budgetAnswer() returns for every budget point,
 * so the two cannot drift apart.
 */

export interface LookupBillLine {
  key: string;
  item: string;
  qty: number;
  unit: string;
  /** The engine's realistic middle for one unit. */
  unitBest: number;
}

export interface LookupBuild {
  /** Installed price the budget is tested against — the engine's `total.best`. */
  price: number;
  low: number;
  high: number;
  /** Index into BudgetLookupData.rungs. */
  rung: number;
  inverterKva: number;
  inverterClass: "budget" | "mid" | "premium";
  batteryKwh: number;
  battery: "lithium" | "tubular";
  panelCount: number;
  panelWatts: number;
  autonomyHours: number;
  tierKey: "budget" | "standard" | "premium";
}

export interface LookupRung {
  summary: string;
  /** The quote's ?q= payload, so "Get this quote" reopens the identical load. */
  payload: string;
}

export interface LookupPoint {
  amount: number;
  label: string;
  slug: string;
}

export interface BudgetLookupData {
  /**
   * Builds that beat every cheaper build, ascending by price. The best build a
   * budget buys is therefore the last entry it can afford.
   */
  frontier: LookupBuild[];
  /** Kept apart from the builds because many builds share a load, and a payload is most of the bytes. */
  rungs: LookupRung[];
  /** The cheapest complete system's bill, in the order an installer buys it. */
  cheapestBill: LookupBillLine[];
  points: LookupPoint[];
}

export function bestBuildWithin(data: BudgetLookupData, budget: number): LookupBuild | null {
  let best: LookupBuild | null = null;
  for (const b of data.frontier) {
    if (b.price > budget) break;
    best = b;
  }
  return best;
}

export interface LookupShortfall {
  shortBy: number;
  covered: Array<{ line: LookupBillLine; qtyCovered: number; fullyCovered: boolean }>;
  stoppedAt: LookupBillLine;
  spentBefore: number;
}

/** The same walk as walkShortfall() in lib/budget.ts: once the money stops, nothing below it is bought. */
export function walkBill(data: BudgetLookupData, budget: number): LookupShortfall {
  const cheapest = data.frontier[0];
  const covered: LookupShortfall["covered"] = [];
  let spent = 0;
  let stoppedIndex = -1;
  let spentAtStop = 0;

  data.cheapestBill.forEach((line, i) => {
    const affordable =
      stoppedIndex >= 0 ? 0 : Math.max(0, Math.min(line.qty, Math.floor((budget - spent) / line.unitBest)));
    const fullyCovered = affordable >= line.qty;
    spent += affordable * line.unitBest;
    if (!fullyCovered && stoppedIndex < 0) {
      stoppedIndex = i;
      spentAtStop = spent;
    }
    covered.push({ line, qtyCovered: affordable, fullyCovered });
  });

  const cut = stoppedIndex < 0 ? data.cheapestBill.length - 1 : stoppedIndex;
  return {
    shortBy: cheapest.price - budget,
    covered,
    stoppedAt: data.cheapestBill[cut],
    spentBefore: stoppedIndex < 0 ? spent : spentAtStop,
  };
}

/**
 * The budget page worth linking to: an exact point, or one within 10% either
 * side, where the page's answer is close enough to be the same conversation.
 */
export function nearestBudgetPoint(data: BudgetLookupData, budget: number): LookupPoint | null {
  let nearest: LookupPoint | null = null;
  for (const p of data.points) {
    const gap = Math.abs(budget - p.amount) / p.amount;
    if (gap <= 0.1 && (!nearest || gap < Math.abs(budget - nearest.amount) / nearest.amount)) nearest = p;
  }
  return nearest;
}
