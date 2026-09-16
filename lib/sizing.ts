/**
 * SolarBuilders.ng — Long-tail sizing scenarios
 *
 * Every page under /sizing is a question a Nigerian actually types
 * ("what size inverter for 1.5hp ac", "what can a 5kva inverter run").
 * The answers are NOT written here — they are computed by lib/quote.ts at
 * build time from the appliance lists below, so a page can never drift from
 * the calculator or from lib/prices.ts.
 *
 * The appliance table below mirrors STEP1/2/3_APPLIANCES in
 * app/calculator/page.tsx — same ids, names, watts and default hoursPerDay —
 * so `quoteUrl()` reopens the exact same load in the calculator and the
 * calculator reproduces the exact same numbers.
 *
 * A few trades need loads the calculator has no preset for (clippers, a PA
 * system). Those are declared in CUSTOM_APPLIANCES with an explicit wattage;
 * the calculator restores non-preset ids as user-added custom appliances, so
 * they still round-trip through ?q=.
 */

import { buildQuote, type Quote, type QuoteAppliance } from "./quote";

// ─────────────────────────────────────────────────────────
// APPLIANCE TABLE — mirrors app/calculator/page.tsx
// ─────────────────────────────────────────────────────────

export type Preset = Omit<QuoteAppliance, "qty">;

/**
 * hoursPerDay = effective running hours, exactly as the calculator defaults
 * them. Fridge/freezer compressors cycle, so 8h ≈ a full day of cooling.
 */
const PRESETS: Preset[] = [
  // Step 1 — big loads
  { id: "ac_1hp", name: "Air Con (1HP)", watts: 900, hoursPerDay: 4 },
  { id: "ac_1_5hp", name: "Air Con (1.5HP)", watts: 1200, hoursPerDay: 4 },
  { id: "ac_2hp", name: "Air Con (2HP)", watts: 1800, hoursPerDay: 4 },
  { id: "deep_freezer", name: "Deep Freezer", watts: 250, hoursPerDay: 8 },
  { id: "refrigerator", name: "Refrigerator", watts: 200, hoursPerDay: 8 },
  { id: "water_pump", name: "Water Pump", watts: 750, hoursPerDay: 2 },
  { id: "washing_machine", name: "Washing Machine", watts: 600, hoursPerDay: 1 },
  { id: "water_heater", name: "Water Heater", watts: 2000, hoursPerDay: 1 },
  { id: "electric_iron", name: "Electric Iron", watts: 1200, hoursPerDay: 0.5 },
  // Step 2 — everyday electronics
  { id: "tv_32", name: 'TV (32")', watts: 60, hoursPerDay: 6 },
  { id: "tv_55", name: 'TV (55"+)', watts: 150, hoursPerDay: 6 },
  { id: "laptop", name: "Laptop", watts: 65, hoursPerDay: 8 },
  { id: "desktop_pc", name: "Desktop PC", watts: 200, hoursPerDay: 8 },
  { id: "microwave", name: "Microwave", watts: 1000, hoursPerDay: 0.5 },
  { id: "blender", name: "Blender", watts: 500, hoursPerDay: 0.3 },
  { id: "standing_fan", name: "Standing Fan", watts: 75, hoursPerDay: 8 },
  { id: "decoder", name: "DSTV/Decoder", watts: 25, hoursPerDay: 6 },
  // Step 3 — small always-on loads
  { id: "led_bulb", name: "LED Bulb", watts: 10, hoursPerDay: 8 },
  { id: "phone_charger", name: "Phone Charger", watts: 15, hoursPerDay: 4 },
  { id: "wifi_router", name: "WiFi Router", watts: 15, hoursPerDay: 24 },
  { id: "ceiling_fan", name: "Ceiling Fan", watts: 70, hoursPerDay: 8 },
  { id: "security_light", name: "Security Light", watts: 30, hoursPerDay: 12 },
  { id: "cctv", name: "CCTV System", watts: 50, hoursPerDay: 24 },
];

/**
 * Trade loads the calculator has no preset for. Wattages are the nameplate
 * ratings of the equipment these businesses actually plug in; they ride in the
 * ?q= payload and appear in the calculator as custom appliances.
 */
const CUSTOM_APPLIANCES: Preset[] = [
  { id: "clipper", name: "Hair clipper", watts: 20, hoursPerDay: 6 },
  { id: "hair_blower", name: "Hair dryer / blower", watts: 1200, hoursPerDay: 1 },
  { id: "sound_system", name: "Sound system (amp + speakers)", watts: 600, hoursPerDay: 4 },
];

const BY_ID = new Map<string, Preset>([...PRESETS, ...CUSTOM_APPLIANCES].map((p) => [p.id, p]));

/**
 * The calculator's own appliance wattages, exposed so a page explaining
 * "typical appliance wattage" (inverter-size-guide, the calculator guide)
 * quotes the exact numbers the calculator uses instead of a hand-typed,
 * driftable copy of them.
 */
export const APPLIANCE_PRESETS: readonly Preset[] = PRESETS;

/** Look up one appliance preset's watts by calculator id, for a page quoting a single figure. */
export function presetWatts(id: string): number {
  const p = BY_ID.get(id);
  if (!p) throw new Error(`lib/sizing.ts: unknown appliance id "${id}"`);
  return p.watts;
}

/** Look up an appliance by calculator id and give it a quantity. */
function a(id: string, qty = 1): QuoteAppliance {
  const p = BY_ID.get(id);
  if (!p) throw new Error(`lib/sizing.ts: unknown appliance id "${id}"`);
  return { ...p, qty };
}

// ─────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────

export type SizingCategory = "appliance" | "home" | "business" | "capacity";

export interface SizingScenario {
  slug: string;
  /** The search query, phrased as a question — used as the page title stem. */
  question: string;
  h1: string;
  /** 1–3 sentences of context. Never contains a figure — figures are computed. */
  intro: string;
  appliances: QuoteAppliance[];
  category: SizingCategory;
  relatedSlugs?: string[];
  /**
   * Capacity pages only: the inverter size in the search term. The appliance
   * list is tuned so the engine lands here; sizingIntegrityIssues() flags it
   * if the engine or prices ever move it.
   */
  targetKva?: number;
}

export const SIZING_CATEGORY_LABEL: Record<SizingCategory, string> = {
  appliance: "Sizing for one appliance",
  home: "Sizing for a home",
  business: "Sizing for a business",
  capacity: "What a given inverter runs",
};

export const SIZING_CATEGORY_BLURB: Record<SizingCategory, string> = {
  appliance:
    "You already know the one thing you must keep running. Start from it, then add the rest later.",
  home: "Sized by the number of bedrooms and what is actually plugged in behind each door.",
  business: "Shops, offices and halls, where downtime costs money and the generator bill is the benchmark.",
  capacity: "You have been quoted a size and want to know what it will honestly carry.",
};

// ─────────────────────────────────────────────────────────
// SCENARIOS
// ─────────────────────────────────────────────────────────

/** Capacity pages take their heading from the computed answer, not from a literal. */
function capacityScenario(
  slug: string,
  targetKva: number,
  appliances: QuoteAppliance[],
  intro: string,
  relatedSlugs: string[],
): SizingScenario {
  const kva = buildQuote(appliances).tiers.standard.inverterKva;
  return {
    slug,
    question: `What can a ${kva}kVA inverter run in Nigeria?`,
    h1: `What Can a ${kva}kVA Inverter Run?`,
    intro,
    appliances,
    category: "capacity",
    relatedSlugs,
    targetKva,
  };
}

export const SIZING_SCENARIOS: SizingScenario[] = [
  // ── One appliance ──────────────────────────────────────
  {
    slug: "what-size-inverter-for-1-5hp-ac",
    question: "What size inverter do I need for a 1.5HP AC in Nigeria?",
    h1: "What Size Inverter for a 1.5HP Air Conditioner?",
    intro:
      "A 1.5HP split unit is the single biggest thing in most Nigerian bedrooms, and it is what decides the inverter size — everything else on the wall is rounding error next to it. This page sizes an inverter, battery and array for that AC on its own, so you can see the true cost of the AC before you add the rest of the house.",
    appliances: [a("ac_1_5hp")],
    category: "appliance",
    relatedSlugs: ["what-size-inverter-for-2hp-ac", "how-many-solar-panels-for-2-bedroom-flat"],
  },
  {
    slug: "what-size-inverter-for-2hp-ac",
    question: "What size inverter do I need for a 2HP AC in Nigeria?",
    h1: "What Size Inverter for a 2HP Air Conditioner?",
    intro:
      "A 2HP AC draws half again what a 1.5HP draws, and on an inverter you pay for that difference three times over — in the inverter, in the battery bank and in the panels. Here is the whole bill for one 2HP unit, before any other load.",
    appliances: [a("ac_2hp")],
    category: "appliance",
    relatedSlugs: ["what-size-inverter-for-1-5hp-ac", "solar-for-4-bedroom-house-with-2-acs"],
  },
  {
    slug: "solar-for-fridge-and-freezer-only",
    question: "What size inverter and solar do I need for a fridge and a deep freezer?",
    h1: "Solar for a Fridge and Deep Freezer Only",
    intro:
      "Plenty of Nigerian households want exactly one thing from solar: food that does not spoil when NEPA takes light for two days. A fridge and a freezer are small in watts but they run around the clock, so the battery matters far more than the inverter.",
    appliances: [a("refrigerator"), a("deep_freezer")],
    category: "appliance",
    relatedSlugs: ["solar-for-lights-fans-and-tv-only", "solar-for-a-shop-in-nigeria"],
  },
  {
    slug: "what-size-solar-for-a-borehole-pump",
    question: "What size solar and inverter do I need for a borehole pump?",
    h1: "What Size Solar System for a Borehole Pump?",
    intro:
      "A borehole pump only runs long enough to fill the tank, so its daily energy is small — but it is a motor, and motors ask for several times their running watts in the first second. That surge, not the daily kWh, is what an undersized inverter fails on.",
    appliances: [a("water_pump")],
    category: "appliance",
    relatedSlugs: ["solar-for-fridge-and-freezer-only", "how-many-solar-panels-for-3-bedroom-flat"],
  },

  // ── Homes ──────────────────────────────────────────────
  {
    slug: "solar-for-lights-fans-and-tv-only",
    question: "What size solar system do I need for lights, fans and a TV only?",
    h1: "Solar for Lights, Fans and TV Only (Essentials)",
    intro:
      "This is the system that replaces the small generator: light in every room, fans moving air, the TV and the router on, and nothing that heats or cools. It is the cheapest honest entry point into solar in Nigeria, and the one most people should start with.",
    appliances: [
      a("led_bulb", 8),
      a("ceiling_fan", 2),
      a("standing_fan"),
      a("tv_32"),
      a("decoder"),
      a("phone_charger", 2),
      a("wifi_router"),
    ],
    category: "home",
    relatedSlugs: ["how-many-solar-panels-for-1-bedroom-flat", "solar-for-fridge-and-freezer-only"],
  },
  {
    slug: "how-many-solar-panels-for-1-bedroom-flat",
    question: "How many solar panels do I need for a 1 bedroom flat in Nigeria?",
    h1: "How Many Solar Panels for a 1 Bedroom Flat?",
    intro:
      "A self-contained or one-bedroom flat with a fridge, fans, a TV and lights — no air conditioning. The fridge and the router run all day, which is what sets the panel count; the fans and lights mostly set the battery.",
    appliances: [
      a("led_bulb", 6),
      a("ceiling_fan"),
      a("standing_fan"),
      a("tv_32"),
      a("decoder"),
      a("refrigerator"),
      a("phone_charger", 2),
      a("wifi_router"),
    ],
    category: "home",
    relatedSlugs: ["how-many-solar-panels-for-2-bedroom-flat", "solar-for-lights-fans-and-tv-only"],
  },
  {
    slug: "how-many-solar-panels-for-2-bedroom-flat",
    question: "How many solar panels do I need for a 2 bedroom flat in Nigeria?",
    h1: "How Many Solar Panels for a 2 Bedroom Flat?",
    intro:
      "A two-bedroom flat with one 1HP AC, a fridge, a freezer, a washing machine and an electric iron. The iron and the AC barely use energy across the day but they are what force the inverter up a size — which is why ironing on solar is a decision, not a detail.",
    appliances: [
      a("ac_1hp"),
      a("refrigerator"),
      a("deep_freezer"),
      a("tv_32"),
      a("decoder"),
      a("ceiling_fan", 2),
      a("standing_fan"),
      a("led_bulb", 10),
      a("phone_charger", 3),
      a("wifi_router"),
      a("electric_iron"),
      a("washing_machine"),
    ],
    category: "home",
    relatedSlugs: ["how-many-solar-panels-for-3-bedroom-flat", "how-many-solar-panels-for-1-bedroom-flat"],
  },
  {
    slug: "how-many-solar-panels-for-3-bedroom-flat",
    question: "How many solar panels do I need for a 3 bedroom flat in Nigeria?",
    h1: "How Many Solar Panels for a 3 Bedroom Flat?",
    intro:
      "Three bedrooms, one 1.5HP AC in the master, two TVs, a fridge and a freezer, plus the laundry and ironing a family actually does. This is the size where roof space starts to matter as much as budget.",
    appliances: [
      a("ac_1_5hp"),
      a("refrigerator"),
      a("deep_freezer"),
      a("tv_55"),
      a("tv_32"),
      a("decoder", 2),
      a("ceiling_fan", 3),
      a("standing_fan", 2),
      a("led_bulb", 14),
      a("phone_charger", 4),
      a("wifi_router"),
      a("electric_iron"),
      a("washing_machine"),
    ],
    category: "home",
    relatedSlugs: ["solar-for-4-bedroom-house-with-2-acs", "how-many-solar-panels-for-2-bedroom-flat"],
  },
  {
    slug: "solar-for-4-bedroom-house-with-2-acs",
    question: "What size solar system do I need for a 4 bedroom house with 2 ACs?",
    h1: "Solar for a 4 Bedroom House with 2 Air Conditioners",
    intro:
      "Four bedrooms, two 1.5HP ACs, a borehole pump, a microwave and the full set of household appliances. At this size the array needs real roof — check that you have an unshaded south-facing plane before you commit.",
    appliances: [
      a("ac_1_5hp", 2),
      a("refrigerator"),
      a("deep_freezer"),
      a("tv_55"),
      a("tv_32", 2),
      a("decoder", 2),
      a("ceiling_fan", 4),
      a("standing_fan", 2),
      a("led_bulb", 20),
      a("phone_charger", 5),
      a("wifi_router"),
      a("electric_iron"),
      a("washing_machine"),
      a("water_pump"),
      a("microwave"),
    ],
    category: "home",
    relatedSlugs: ["how-many-solar-panels-for-3-bedroom-flat", "what-size-inverter-for-2hp-ac"],
  },

  // ── Businesses ─────────────────────────────────────────
  {
    slug: "solar-for-a-shop-in-nigeria",
    question: "What size solar system do I need for a small shop in Nigeria?",
    h1: "Solar for a Small Shop in Nigeria",
    intro:
      "A provisions or drinks shop: a chiller and a freezer that must not thaw, fans, lights, a TV for customers, CCTV and a security light overnight. Nearly all of the load runs while the sun is up, which is the best possible shape for solar.",
    appliances: [
      a("refrigerator"),
      a("deep_freezer"),
      a("ceiling_fan"),
      a("standing_fan"),
      a("led_bulb", 4),
      a("tv_32"),
      a("decoder"),
      a("phone_charger", 2),
      a("security_light"),
      a("cctv"),
      a("wifi_router"),
    ],
    category: "business",
    relatedSlugs: ["solar-for-a-small-office-in-nigeria", "solar-for-fridge-and-freezer-only"],
  },
  {
    slug: "solar-for-a-small-office-in-nigeria",
    question: "What size solar system do I need for a small office in Nigeria?",
    h1: "Solar for a Small Office in Nigeria",
    intro:
      "Three desktops, two laptops, one 1.5HP AC, CCTV, a router that can never blink and the kitchen microwave. Office load is concentrated in working hours, so the panels do most of the work and the battery mainly covers cloud cover and the walk to the car park.",
    appliances: [
      a("desktop_pc", 3),
      a("laptop", 2),
      a("ac_1_5hp"),
      a("led_bulb", 8),
      a("ceiling_fan", 2),
      a("standing_fan"),
      a("wifi_router"),
      a("cctv"),
      a("refrigerator"),
      a("phone_charger", 4),
      a("security_light"),
      a("microwave"),
    ],
    category: "business",
    relatedSlugs: ["solar-for-a-shop-in-nigeria", "what-size-inverter-for-1-5hp-ac"],
  },
  {
    slug: "solar-for-a-barbing-salon-in-nigeria",
    question: "What size solar system do I need for a barbing salon in Nigeria?",
    h1: "Solar for a Barbing Salon or Hair Salon",
    intro:
      "Clippers use almost nothing. The blower and the AC use almost everything — and a salon cannot turn customers away because light went, so this is a trade where the generator runs daily and solar is measured against a petrol bill, not against NEPA.",
    appliances: [
      a("clipper", 4),
      a("hair_blower"),
      a("ac_1hp"),
      a("standing_fan", 2),
      a("ceiling_fan"),
      a("led_bulb", 4),
      a("tv_32"),
      a("decoder"),
      a("phone_charger", 2),
      a("security_light"),
      a("wifi_router"),
    ],
    category: "business",
    relatedSlugs: ["solar-for-a-shop-in-nigeria", "solar-for-a-small-church-or-hall-in-nigeria"],
  },
  {
    slug: "solar-for-a-small-church-or-hall-in-nigeria",
    question: "What size solar system do I need for a small church or hall in Nigeria?",
    h1: "Solar for a Small Church or Hall",
    intro:
      "Ceiling fans over the congregation, lights, a screen and a sound system that must not cut mid-service. A hall's load is spiky — heavy for a few hours, near nothing the rest of the week — so it is sized on the service, and the array recharges across the days in between.",
    appliances: [
      a("led_bulb", 16),
      a("ceiling_fan", 8),
      a("standing_fan", 2),
      a("sound_system"),
      a("tv_55"),
      a("security_light", 2),
      a("wifi_router"),
    ],
    category: "business",
    relatedSlugs: ["solar-for-a-barbing-salon-in-nigeria", "solar-for-a-small-office-in-nigeria"],
  },

  // ── Capacity ("what can X run") ────────────────────────
  capacityScenario(
    "what-can-a-2-5kva-inverter-run",
    2.5,
    [
      a("refrigerator"),
      a("deep_freezer"),
      a("washing_machine"),
      a("tv_32"),
      a("decoder"),
      a("led_bulb", 10),
      a("ceiling_fan", 2),
      a("standing_fan", 2),
      a("laptop"),
      a("phone_charger", 3),
      a("wifi_router"),
      a("cctv"),
      a("security_light"),
    ],
    "This is the entry-level inverter size Nigerian vendors quote for a flat with no air conditioning. The load below is one representative set of appliances that lands on it — not the only one. Swap the washing machine for an iron, or the freezer for a second fan, and you are still inside the same inverter.",
    ["what-can-a-3-5kva-inverter-run", "how-many-solar-panels-for-1-bedroom-flat"],
  ),
  capacityScenario(
    "what-can-a-3-5kva-inverter-run",
    3.5,
    [
      a("ac_1_5hp"),
      a("refrigerator"),
      a("deep_freezer"),
      a("tv_32"),
      a("led_bulb", 8),
      a("ceiling_fan", 2),
      a("standing_fan"),
      a("laptop"),
      a("decoder"),
      a("phone_charger", 3),
      a("wifi_router"),
    ],
    "The size at which one air conditioner becomes possible. The list below is a representative load that lands on this inverter — one 1.5HP AC plus the normal household electronics — not the only combination that fits.",
    ["what-can-a-5kva-inverter-run", "what-size-inverter-for-1-5hp-ac"],
  ),
  capacityScenario(
    "what-can-a-5kva-inverter-run",
    5,
    [
      a("ac_1_5hp", 2),
      a("refrigerator"),
      a("deep_freezer"),
      a("tv_55"),
      a("led_bulb", 10),
      a("ceiling_fan", 2),
      a("laptop", 2),
      a("decoder"),
      a("phone_charger", 4),
      a("wifi_router"),
      a("cctv"),
    ],
    "The most quoted system size in Nigeria. The load below is one representative set that lands on this inverter size — two 1.5HP ACs plus a normal family's electronics — and it is also the page to read if you are asking how many batteries a 5kVA inverter needs.",
    ["what-can-a-10kva-inverter-run", "how-many-solar-panels-for-2-bedroom-flat"],
  ),
  capacityScenario(
    "what-can-a-10kva-inverter-run",
    10,
    [
      a("ac_2hp", 2),
      a("ac_1_5hp"),
      a("refrigerator"),
      a("deep_freezer"),
      a("water_pump"),
      a("washing_machine"),
      a("tv_55"),
      a("tv_32"),
      a("led_bulb", 16),
      a("ceiling_fan", 4),
      a("standing_fan", 2),
      a("decoder", 2),
      a("desktop_pc"),
      a("laptop", 2),
      a("cctv"),
      a("security_light", 2),
      a("wifi_router"),
    ],
    "Whole-house territory: three air conditioners, a borehole pump and everything else, all available at once. The list below is one representative load that lands on this inverter size, not the only one — at this size the battery bank and the roof, not the inverter, are what limit you.",
    ["what-can-a-5kva-inverter-run", "solar-for-4-bedroom-house-with-2-acs"],
  ),
];

/**
 * The sizing rules the engine applies, restated here ONLY so the pages can
 * explain them in plain English. Nothing is sized from these numbers — they
 * mirror the assumptions documented at the top of lib/quote.ts, which is where
 * the arithmetic actually happens. Keep them in step with that file.
 */
export const SIZING_RULES = {
  inverterHeadroom: 1.25,
  loadFactor: 0.6,
  peakSunHours: 5.5,
  systemEfficiency: 0.78,
  lithiumUsableDoD: 0.9,
} as const;

// ─────────────────────────────────────────────────────────
// LOOKUPS
// ─────────────────────────────────────────────────────────

export function getScenario(slug: string): SizingScenario | undefined {
  return SIZING_SCENARIOS.find((s) => s.slug === slug);
}

export interface SizingCategoryGroup {
  category: SizingCategory;
  label: string;
  blurb: string;
  scenarios: SizingScenario[];
}

const CATEGORY_ORDER: SizingCategory[] = ["appliance", "home", "business", "capacity"];

export function scenariosByCategory(): SizingCategoryGroup[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    label: SIZING_CATEGORY_LABEL[category],
    blurb: SIZING_CATEGORY_BLURB[category],
    scenarios: SIZING_SCENARIOS.filter((s) => s.category === category),
  })).filter((g) => g.scenarios.length > 0);
}

/** Quotes are pure and deterministic — build each scenario's once per process. */
const QUOTE_CACHE = new Map<string, Quote>();

export function scenarioQuote(scenario: SizingScenario): Quote {
  const cached = QUOTE_CACHE.get(scenario.slug);
  if (cached) return cached;
  const quote = buildQuote(scenario.appliances);
  QUOTE_CACHE.set(scenario.slug, quote);
  return quote;
}

/** Related scenarios: the declared ones first, then others in the same category. */
export function relatedScenarios(scenario: SizingScenario, limit = 4): SizingScenario[] {
  const declared = (scenario.relatedSlugs ?? [])
    .map((slug) => getScenario(slug))
    .filter((s): s is SizingScenario => Boolean(s));
  const sameCategory = SIZING_SCENARIOS.filter(
    (s) => s.category === scenario.category && s.slug !== scenario.slug,
  );
  const out: SizingScenario[] = [];
  for (const s of [...declared, ...sameCategory]) {
    if (s.slug === scenario.slug) continue;
    if (out.some((x) => x.slug === s.slug)) continue;
    out.push(s);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * Dev aid: capacity slugs carry a kVA in the URL, so if the engine or the
 * price table ever moves a scenario off its target size, the slug lies.
 * Nothing renders this — run it after changing lib/quote.ts or lib/prices.ts.
 */
export function sizingIntegrityIssues(): string[] {
  const issues: string[] = [];
  for (const s of SIZING_SCENARIOS) {
    if (s.targetKva === undefined) continue;
    const actual = scenarioQuote(s).tiers.standard.inverterKva;
    if (actual !== s.targetKva) {
      issues.push(`${s.slug}: slug says ${s.targetKva}kVA, engine computes ${actual}kVA`);
    }
  }
  return issues;
}
