/**
 * SolarBuilders.ng — Budget-anchored answers
 *
 * The calculator runs one way: appliances in, price out. Nigerians search the
 * other way — "I have 350k set aside for solar installation… kindly advise me
 * if this is feasible", "if your budget is ₦500,000, is solar worth it?".
 * This module inverts lib/quote.ts: given a naira ceiling, it searches the
 * dials the engine already has (how much load, how many hours of backup, which
 * component class, lithium or tubular) and returns the most capable build whose
 * realistic installed price fits.
 *
 * NO PRICE IS WRITTEN HERE. Every figure comes back out of buildQuote(), so a
 * change in lib/prices.ts moves these pages on the next build without anyone
 * editing them — including in the direction that hurts. At September 2026
 * prices the smallest complete system the engine can produce costs more than a
 * million naira, so the three cheapest budget pages have to tell the visitor
 * their money does not buy a solar system. That is the point of the family:
 * a budget page that cannot say "no" is an advert, not an answer.
 *
 * The appliance catalogue is read out of SIZING_SCENARIOS rather than copied,
 * so the loads on these pages are the same loads, with the same default hours,
 * that the /sizing pages and the calculator use.
 */

import { SIZING_RULES, SIZING_SCENARIOS } from "./sizing";
import {
  buildQuote,
  formatNairaShort,
  type BatteryType,
  type BomLine,
  type Quote,
  type QuoteAppliance,
  type QuoteOptions,
  type TierKey,
  type TierQuote,
} from "./quote";
import type { InverterTier } from "./prices";
import { bestBuildWithin, walkBill, type BudgetLookupData, type LookupBuild } from "./budget-lookup";

// ─────────────────────────────────────────────────────────
// APPLIANCE CATALOGUE — borrowed from the sizing scenarios
// ─────────────────────────────────────────────────────────

type Preset = Omit<QuoteAppliance, "qty">;

const CATALOGUE: Map<string, Preset> = (() => {
  const m = new Map<string, Preset>();
  for (const scenario of SIZING_SCENARIOS) {
    for (const ap of scenario.appliances) {
      if (!m.has(ap.id)) m.set(ap.id, { id: ap.id, name: ap.name, watts: ap.watts, hoursPerDay: ap.hoursPerDay });
    }
  }
  return m;
})();

function a(id: string, qty = 1): QuoteAppliance {
  const p = CATALOGUE.get(id);
  if (!p) throw new Error(`lib/budget.ts: no sizing scenario uses appliance "${id}"`);
  return { ...p, qty };
}

// ─────────────────────────────────────────────────────────
// THE LOAD LADDER
// ─────────────────────────────────────────────────────────

export interface LoadRung {
  key: string;
  /** How the pages name this set of appliances, mid-sentence. */
  summary: string;
  appliances: QuoteAppliance[];
}

/**
 * Every rung adds to the one below it, never swaps — the search below assumes
 * a higher rung genuinely runs more, so "the best system this budget buys" is
 * the highest rung that fits. The steps are the order Nigerian households
 * actually add load: light and fans, then the TV, then the fridge, then the
 * freezer, then laundry and ironing, then the pump, then air conditioning.
 */
const LADDER: LoadRung[] = [
  {
    key: "lights-fans",
    summary: "lights, one fan, phone charging and the router",
    appliances: [a("led_bulb", 4), a("standing_fan"), a("phone_charger", 2), a("wifi_router")],
  },
  {
    key: "lights-fans-tv",
    summary: "lights through the flat, two fans, the TV and decoder",
    appliances: [
      a("led_bulb", 6),
      a("ceiling_fan"),
      a("standing_fan"),
      a("tv_32"),
      a("decoder"),
      a("phone_charger", 2),
      a("wifi_router"),
    ],
  },
  {
    key: "fridge",
    summary: "lights, fans, the TV and a fridge running day and night",
    appliances: [
      a("led_bulb", 8),
      a("ceiling_fan"),
      a("standing_fan"),
      a("tv_32"),
      a("decoder"),
      a("refrigerator"),
      a("phone_charger", 3),
      a("wifi_router"),
    ],
  },
  {
    key: "freezer",
    summary: "a fridge, a deep freezer, a laptop, fans, lights and a security light",
    appliances: [
      a("led_bulb", 10),
      a("ceiling_fan", 2),
      a("standing_fan"),
      a("tv_32"),
      a("decoder"),
      a("refrigerator"),
      a("deep_freezer"),
      a("laptop"),
      a("phone_charger", 3),
      a("wifi_router"),
      a("security_light"),
    ],
  },
  {
    key: "laundry",
    summary: "the fridge and freezer, the washing machine, CCTV, fans and lights",
    appliances: [
      a("led_bulb", 10),
      a("ceiling_fan", 2),
      a("standing_fan", 2),
      a("tv_32"),
      a("decoder"),
      a("refrigerator"),
      a("deep_freezer"),
      a("laptop"),
      a("phone_charger", 4),
      a("wifi_router"),
      a("security_light"),
      a("cctv"),
      a("washing_machine"),
    ],
  },
  {
    key: "ironing",
    summary: "a family's whole non-cooling load — fridge, freezer, laundry, ironing, two TVs and CCTV",
    appliances: [
      a("led_bulb", 12),
      a("ceiling_fan", 3),
      a("standing_fan", 2),
      a("tv_55"),
      a("tv_32"),
      a("decoder", 2),
      a("refrigerator"),
      a("deep_freezer"),
      a("laptop", 2),
      a("phone_charger", 4),
      a("wifi_router"),
      a("security_light"),
      a("cctv"),
      a("washing_machine"),
      a("electric_iron"),
    ],
  },
  {
    key: "pump",
    summary: "a family's whole non-cooling load plus the borehole pump and the microwave",
    appliances: [
      a("led_bulb", 12),
      a("ceiling_fan", 3),
      a("standing_fan", 2),
      a("tv_55"),
      a("tv_32"),
      a("decoder", 2),
      a("refrigerator"),
      a("deep_freezer"),
      a("laptop", 2),
      a("phone_charger", 4),
      a("wifi_router"),
      a("security_light"),
      a("cctv"),
      a("washing_machine"),
      a("electric_iron"),
      a("water_pump"),
      a("microwave"),
    ],
  },
  {
    key: "ac-1hp",
    summary: "a family's whole load, the borehole pump, and one 1HP air conditioner",
    appliances: [
      a("ac_1hp"),
      a("led_bulb", 12),
      a("ceiling_fan", 3),
      a("standing_fan", 2),
      a("tv_55"),
      a("tv_32"),
      a("decoder", 2),
      a("refrigerator"),
      a("deep_freezer"),
      a("laptop", 2),
      a("phone_charger", 4),
      a("wifi_router"),
      a("security_light"),
      a("cctv"),
      a("washing_machine"),
      a("electric_iron"),
      a("water_pump"),
      a("microwave"),
    ],
  },
  {
    key: "ac-1-5hp",
    summary: "a family's whole load, the borehole pump, and a 1.5HP air conditioner",
    appliances: [
      a("ac_1_5hp"),
      a("led_bulb", 14),
      a("ceiling_fan", 3),
      a("standing_fan", 2),
      a("tv_55"),
      a("tv_32"),
      a("decoder", 2),
      a("refrigerator"),
      a("deep_freezer"),
      a("laptop", 2),
      a("phone_charger", 4),
      a("wifi_router"),
      a("security_light"),
      a("cctv"),
      a("washing_machine"),
      a("electric_iron"),
      a("water_pump"),
      a("microwave"),
    ],
  },
  {
    key: "ac-two",
    summary: "a four-bedroom house with a 1.5HP and a 1HP air conditioner in it",
    appliances: [
      a("ac_1_5hp"),
      a("ac_1hp"),
      a("led_bulb", 16),
      a("ceiling_fan", 4),
      a("standing_fan", 2),
      a("tv_55"),
      a("tv_32", 2),
      a("decoder", 2),
      a("refrigerator"),
      a("deep_freezer"),
      a("laptop", 2),
      a("desktop_pc"),
      a("phone_charger", 5),
      a("wifi_router"),
      a("security_light", 2),
      a("cctv"),
      a("washing_machine"),
      a("electric_iron"),
      a("water_pump"),
      a("microwave"),
    ],
  },
  {
    key: "ac-three",
    summary: "a large house with two 1.5HP ACs and a 2HP AC running",
    appliances: [
      a("ac_1_5hp", 2),
      a("ac_2hp"),
      a("led_bulb", 20),
      a("ceiling_fan", 5),
      a("standing_fan", 3),
      a("tv_55"),
      a("tv_32", 2),
      a("decoder", 3),
      a("refrigerator"),
      a("deep_freezer"),
      a("laptop", 2),
      a("desktop_pc", 2),
      a("phone_charger", 6),
      a("wifi_router"),
      a("security_light", 2),
      a("cctv"),
      a("washing_machine"),
      a("electric_iron"),
      a("water_pump"),
      a("microwave"),
    ],
  },
];

// ─────────────────────────────────────────────────────────
// THE BUDGET POINTS
// ─────────────────────────────────────────────────────────

export interface BudgetPoint {
  amount: number;
  /** "₦500k", "₦1.5M" — exactly what formatNairaShort renders. */
  label: string;
  slug: string;
}

/**
 * The amounts §2N of CONTENT-PLAN.md found people actually typing, spaced far
 * enough apart that the engine returns a different system for each. Anything
 * finer (every ₦100k) would produce sibling pages with identical answers.
 */
export const BUDGET_POINTS: BudgetPoint[] = [
  500_000, 800_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000, 5_000_000,
].map((amount) => {
  const label = formatNairaShort(amount);
  const money = label.replace("₦", "").toLowerCase().replace(".", "-");
  return { amount, label, slug: `what-can-${money}-of-solar-get-you-in-nigeria` };
});

export function getBudgetPoint(slug: string): BudgetPoint | undefined {
  return BUDGET_POINTS.find((p) => p.slug === slug);
}

// ─────────────────────────────────────────────────────────
// SEARCH
// ─────────────────────────────────────────────────────────

export interface BudgetBuild {
  rungIndex: number;
  rung: LoadRung;
  quote: Quote;
  tierKey: TierKey;
  tier: TierQuote;
  inverterClass: InverterTier;
  battery: BatteryType;
  /**
   * The figure the budget is tested against: the engine's realistic middle,
   * not its wholesale floor. Quoting the floor is how the rest of the market
   * gets to publish prices nobody can actually buy at.
   */
  price: number;
}

const TIER_KEYS: TierKey[] = ["budget", "standard", "premium"];
const INVERTER_CLASSES: InverterTier[] = ["budget", "mid", "premium"];
const BATTERY_TYPES: BatteryType[] = ["lithium", "tubular"];

/** buildQuote is pure; one call per (rung, class, chemistry) yields all three tiers. */
const QUOTE_CACHE = new Map<string, Quote>();

function quoteFor(rungIndex: number, inverterClass: InverterTier, battery: BatteryType): Quote {
  const key = `${rungIndex}:${inverterClass}:${battery}`;
  const cached = QUOTE_CACHE.get(key);
  if (cached) return cached;
  const options: QuoteOptions = Object.fromEntries(
    TIER_KEYS.map((k) => [k, { inverterTier: inverterClass, battery }]),
  );
  const quote = buildQuote(LADDER[rungIndex].appliances, options);
  QUOTE_CACHE.set(key, quote);
  return quote;
}

function allCandidates(): BudgetBuild[] {
  const out: BudgetBuild[] = [];
  LADDER.forEach((rung, rungIndex) => {
    for (const inverterClass of INVERTER_CLASSES) {
      for (const battery of BATTERY_TYPES) {
        const quote = quoteFor(rungIndex, inverterClass, battery);
        for (const tierKey of TIER_KEYS) {
          const tier = quote.tiers[tierKey];
          out.push({ rungIndex, rung, quote, tierKey, tier, inverterClass, battery, price: tier.total.best });
        }
      }
    }
  });
  return out;
}

/**
 * Which of two affordable builds is the better answer to "what does my money
 * buy". Capacity first — the question is what it will carry — then the things
 * you would spend the remainder on, in the order a buyer regrets skipping
 * them: backup hours, then a chemistry that lasts ten years instead of two or
 * three, then component class, then simply using more of the budget.
 */
function better(x: BudgetBuild, y: BudgetBuild): BudgetBuild {
  const rank = (b: BudgetBuild) => [
    b.rungIndex,
    b.tier.autonomyHours,
    b.battery === "lithium" ? 1 : 0,
    INVERTER_CLASSES.indexOf(b.inverterClass),
    b.price,
  ];
  const rx = rank(x);
  const ry = rank(y);
  for (let i = 0; i < rx.length; i++) {
    if (rx[i] !== ry[i]) return rx[i] > ry[i] ? x : y;
  }
  return x;
}

function bestWithin(budget: number, pool: BudgetBuild[]): BudgetBuild | null {
  return pool.filter((b) => b.price <= budget).reduce<BudgetBuild | null>((best, b) => (best ? better(best, b) : b), null);
}

// ─────────────────────────────────────────────────────────
// WHAT A BUDGET THAT BUYS NOTHING STILL PAYS FOR
// ─────────────────────────────────────────────────────────

export interface CoveredLine {
  line: BomLine;
  /** Units of this line the money reaches — 0 when it runs out before here. */
  qtyCovered: number;
  fullyCovered: boolean;
  /** Running total once this line's covered units are paid for. */
  spent: number;
}

export interface BudgetShortfall {
  /** The cheapest complete system the engine can produce at current prices. */
  cheapest: BudgetBuild;
  shortBy: number;
  lines: CoveredLine[];
  /** The first line the money does not finish paying for. */
  stoppedAt: BomLine;
  /** Spent by the time it gets there. */
  spentBefore: number;
}

/**
 * Walk the cheapest possible bill of materials in the order an installer
 * actually buys it and find out where the money stops. This is the honest
 * shape of the answer below about a million naira: not "here is a smaller
 * system" — there isn't one — but "here is the line of the bill you reach".
 */
function walkShortfall(budget: number, cheapest: BudgetBuild): BudgetShortfall {
  const lines: CoveredLine[] = [];
  let spent = 0;
  let stoppedIndex = -1;

  cheapest.tier.bom.forEach((line, i) => {
    const unit = line.unitCost.best;
    // Once the money stops, it stops — a buyer cannot skip the panels and pay
    // the installer instead, so nothing below the cut-off gets bought either.
    const affordable =
      stoppedIndex >= 0 ? 0 : Math.max(0, Math.min(line.qty, Math.floor((budget - spent) / unit)));
    const fullyCovered = affordable >= line.qty;
    spent += affordable * unit;
    if (!fullyCovered && stoppedIndex < 0) stoppedIndex = i;
    lines.push({ line, qtyCovered: affordable, fullyCovered, spent });
  });

  // A budget in this branch is by definition too small to finish the bill.
  const cut = stoppedIndex < 0 ? cheapest.tier.bom.length - 1 : stoppedIndex;
  return {
    cheapest,
    shortBy: cheapest.price - budget,
    lines,
    stoppedAt: cheapest.tier.bom[cut],
    spentBefore: lines[cut].spent,
  };
}

// ─────────────────────────────────────────────────────────
// THE ANSWER
// ─────────────────────────────────────────────────────────

export interface BudgetAnswer {
  point: BudgetPoint;
  /** null when no complete system fits — then `shortfall` is set. */
  build: BudgetBuild | null;
  shortfall: BudgetShortfall | null;
  /** Budget left after the build. Money the engine could find nothing to do with. */
  leftover: number;
}

const ANSWER_CACHE = new Map<string, BudgetAnswer>();

export function budgetAnswer(point: BudgetPoint): BudgetAnswer {
  const cached = ANSWER_CACHE.get(point.slug);
  if (cached) return cached;

  const candidates = allCandidates();
  const build = bestWithin(point.amount, candidates);
  const cheapest = candidates.reduce((min, b) => (b.price < min.price ? b : min), candidates[0]);

  const answer: BudgetAnswer = {
    point,
    build,
    shortfall: build ? null : walkShortfall(point.amount, cheapest),
    leftover: build ? point.amount - build.price : 0,
  };

  ANSWER_CACHE.set(point.slug, answer);
  return answer;
}

export function budgetAnswers(): BudgetAnswer[] {
  return BUDGET_POINTS.map(budgetAnswer);
}

/** The next budget point up, for the "what would another ₦x add" section. */
export function nextBudgetPoint(point: BudgetPoint): BudgetPoint | undefined {
  return BUDGET_POINTS[BUDGET_POINTS.findIndex((p) => p.slug === point.slug) + 1];
}

export function previousBudgetPoint(point: BudgetPoint): BudgetPoint | undefined {
  const i = BUDGET_POINTS.findIndex((p) => p.slug === point.slug);
  return i > 0 ? BUDGET_POINTS[i - 1] : undefined;
}

/** The cheapest complete system at current prices — the floor every page is measured against. */
export function cheapestCompleteBuild(): BudgetBuild {
  const candidates = allCandidates();
  return candidates.reduce((min, b) => (b.price < min.price ? b : min), candidates[0]);
}

// ─────────────────────────────────────────────────────────
// THE CALCULATOR'S COPY
// ─────────────────────────────────────────────────────────

function toLookupBuild(b: BudgetBuild): LookupBuild {
  return {
    price: b.price,
    low: b.tier.total.low,
    high: b.tier.total.high,
    rung: b.rungIndex,
    inverterKva: b.tier.inverterKva,
    inverterClass: b.inverterClass,
    batteryKwh: b.tier.batteryKwh,
    battery: b.battery,
    panelCount: b.tier.panelCount,
    panelWatts: b.tier.panelWatts,
    autonomyHours: b.tier.autonomyHours,
    tierKey: b.tierKey,
  };
}

let LOOKUP: BudgetLookupData | null = null;

/**
 * Everything the calculator's budget mode needs, computed here so the browser
 * never runs the search (see lib/budget-lookup.ts). Only builds that beat
 * every cheaper build are kept — the rest can never be anyone's best answer —
 * which turns a couple of hundred candidates into a list small enough to
 * serialise into the page.
 */
export function budgetLookupData(): BudgetLookupData {
  if (LOOKUP) return LOOKUP;
  // Stable sort, so equal-priced builds keep candidate order and the tie falls
  // the same way it does in bestWithin().
  const sorted = allCandidates().sort((x, y) => x.price - y.price);
  const frontier: BudgetBuild[] = [];
  let best: BudgetBuild | null = null;
  for (const b of sorted) {
    if (!best || (better(best, b) === b && b !== best)) {
      // An equal-priced build that ranks higher replaces its twin outright.
      if (best && best.price === b.price) frontier.pop();
      best = b;
      frontier.push(b);
    }
  }
  LOOKUP = {
    frontier: frontier.map(toLookupBuild),
    rungs: LADDER.map((rung, i) => ({ summary: rung.summary, payload: quoteFor(i, "budget", "lithium").payload })),
    cheapestBill: cheapestCompleteBuild().tier.bom.map((l) => ({
      key: l.key,
      item: l.item,
      qty: l.qty,
      unit: l.unit,
      unitBest: l.unitCost.best,
    })),
    points: BUDGET_POINTS.map(({ amount, label, slug }) => ({ amount, label, slug })),
  };
  return LOOKUP;
}

// ─────────────────────────────────────────────────────────
// THE OTHER WAYS TO SPEND THE SAME MONEY
// ─────────────────────────────────────────────────────────

export interface BudgetVariant {
  label: string;
  build: BudgetBuild;
  /** Signed against the budget: positive means it costs more than the visitor has. */
  overBudgetBy: number;
}

function cheapestOf(pool: BudgetBuild[]): BudgetBuild | null {
  return pool.reduce<BudgetBuild | null>((min, b) => (min && min.price <= b.price ? min : b), null);
}

/**
 * The comparisons a budget thread always ends up arguing about: could I have
 * spent less, what would lithium have cost, and what would it take to add the
 * next thing. Only variants that are genuinely different from the answer are
 * returned, so a page never shows itself back to itself.
 */
export function budgetVariants(answer: BudgetAnswer): BudgetVariant[] {
  const build = answer.build;
  if (!build) return [];

  const candidates = allCandidates();
  const sameLoad = candidates.filter((b) => b.rungIndex === build.rungIndex);
  const out: BudgetVariant[] = [];

  const push = (label: string, b: BudgetBuild | null) => {
    if (!b || b.price === build.price) return;
    if (out.some((v) => v.build.price === b.price)) return;
    out.push({ label, build: b, overBudgetBy: b.price - answer.point.amount });
  };

  push("The same load, built as cheaply as possible", cheapestOf(sameLoad));
  push(
    build.battery === "tubular" ? "The same load on lithium" : "The same load on tubular batteries",
    cheapestOf(sameLoad.filter((b) => b.battery !== build.battery)),
  );
  push(
    "One step more load",
    cheapestOf(candidates.filter((b) => b.rungIndex === build.rungIndex + 1)),
  );

  return out;
}

// ─────────────────────────────────────────────────────────
// WHAT IT WILL NOT RUN
// ─────────────────────────────────────────────────────────

export type UnservedReason = "over-inverter" | "needs-others-off";

export interface UnservedLoad {
  id: string;
  name: string;
  watts: number;
  reason: UnservedReason;
}

/**
 * The loads people ask about by name, biggest first. A budget page that only
 * lists what the money buys is half an answer — every budget thread on
 * Nairaland is really asking what it will not carry.
 */
const NOTABLE_LOADS = [
  "ac_2hp",
  "ac_1_5hp",
  "ac_1hp",
  "electric_iron",
  "water_pump",
  "microwave",
  "washing_machine",
  "deep_freezer",
  "refrigerator",
  "desktop_pc",
];

/**
 * Asked of the engine rather than worked out here, so motor startup surge —
 * the reason a 1.5kVA inverter cannot start a 1.5HP AC even though 1,200W
 * looks like it fits — is accounted for exactly as it is everywhere else.
 * If adding the appliance makes the engine ask for a bigger inverter, this
 * inverter will not carry it.
 */
export function unservedLoads(build: BudgetBuild): UnservedLoad[] {
  const already = new Set(build.quote.appliances.map((ap) => ap.id));
  const options: QuoteOptions = {
    [build.tierKey]: { inverterTier: build.inverterClass, battery: build.battery },
  };
  const needs = (appliances: QuoteAppliance[]) =>
    buildQuote(appliances, options).tiers[build.tierKey].inverterKva;

  return NOTABLE_LOADS.filter((id) => !already.has(id))
    .map((id) => {
      const p = CATALOGUE.get(id);
      if (!p) return null;
      const one = { ...p, qty: 1 };
      const reason: UnservedReason | null =
        needs([one]) > build.tier.inverterKva
          ? "over-inverter"
          : needs([...build.quote.appliances, one]) > build.tier.inverterKva
            ? "needs-others-off"
            : null;
      return reason ? { id: p.id, name: p.name, watts: p.watts, reason } : null;
    })
    .filter((x): x is UnservedLoad => x !== null);
}

/** What the array makes on an average Nigerian day, from the same two constants the engine sizes with. */
export function arrayDailyKwh(tier: TierQuote): number {
  return (
    (tier.panelCount * tier.panelWatts * SIZING_RULES.peakSunHours * SIZING_RULES.systemEfficiency) / 1000
  );
}

/**
 * Dev aid, in the spirit of sizingIntegrityIssues(): the family is only worth
 * publishing while each page answers with a different number. Nothing renders
 * this — run it after changing lib/prices.ts or lib/quote.ts.
 */
export function budgetIntegrityIssues(): string[] {
  const issues: string[] = [];

  let previousPeak = 0;
  for (const rung of LADDER) {
    const peak = rung.appliances.reduce((s, ap) => s + ap.watts * ap.qty, 0);
    if (peak <= previousPeak) issues.push(`ladder rung "${rung.key}" does not add load (${peak}W after ${previousPeak}W)`);
    previousPeak = peak;
  }

  const seen = new Map<string, string>();
  for (const answer of budgetAnswers()) {
    const b = answer.build;
    const fingerprint = b
      ? `${b.rungIndex}/${b.tier.inverterKva}/${b.tier.batteryKwh}/${b.battery}/${b.tier.panelCount}/${b.price}`
      : `short/${answer.shortfall?.shortBy}`;
    const clash = seen.get(fingerprint);
    if (clash) issues.push(`${answer.point.label} and ${clash} give the same answer — they should be one page`);
    seen.set(fingerprint, answer.point.label);
  }

  // The calculator answers from the precomputed list, the /budget pages from the
  // full search. A visitor who does both must get the same system back.
  const lookup = budgetLookupData();
  for (const answer of budgetAnswers()) {
    const amount = answer.point.amount;
    const fromLookup = bestBuildWithin(lookup, amount);
    if (answer.build) {
      const b = answer.build;
      const same =
        fromLookup &&
        lookup.rungs[fromLookup.rung].payload === b.quote.payload &&
        fromLookup.tierKey === b.tierKey &&
        fromLookup.inverterClass === b.inverterClass &&
        fromLookup.battery === b.battery &&
        fromLookup.price === b.price;
      if (!same) {
        issues.push(`calculator budget lookup disagrees with the ${answer.point.label} page`);
      }
    } else if (fromLookup) {
      issues.push(`calculator budget lookup finds a build for ${answer.point.label}; the page says none fits`);
    } else {
      const walk = walkBill(lookup, amount);
      if (walk.shortBy !== answer.shortfall!.shortBy || walk.spentBefore !== answer.shortfall!.spentBefore) {
        issues.push(`calculator shortfall walk disagrees with the ${answer.point.label} page`);
      }
    }
  }

  return issues;
}

/**
 * Run the integrity check at module load on the server, so a bad edit fails the
 * build instead of shipping. budgetIntegrityIssues existed but was never called by anything,
 * which meant it protected nothing.
 */
if (typeof window === "undefined") {
  const issues = budgetIntegrityIssues();
  if (issues.length) {
    throw new Error(
      "lib/budget.ts: integrity check failed:\n  " + issues.join("\n  "),
    );
  }
}
