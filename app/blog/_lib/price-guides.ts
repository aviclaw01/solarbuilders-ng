/**
 * Shared arithmetic for the computed price guides (5kVA price, panel price,
 * lithium price, batteries-for-5kVA, …).
 *
 * Nothing in here holds a naira amount. Every figure is either a constant from
 * lib/prices.ts or the quote engine's output for a fixed load, so when the
 * catalogue is refreshed every table on every guide recomputes with it.
 */
import {
  HEADLINE_PACKAGES,
  LITHIUM_MODULE_KWH,
  PRICES_LAST_UPDATED,
  type InverterTier,
  type PriceRange,
} from '@/lib/prices';
import { buildQuote, quoteUrl, type Quote, type QuoteAppliance, type TierQuote } from '@/lib/quote';
import { SIZING_RULES } from '@/lib/sizing';

/** "October 2026" — derived from the date the prices were checked, never typed. */
export const PRICE_MONTH = new Date(`${PRICES_LAST_UPDATED}T00:00:00Z`).toLocaleDateString('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export const TIERS: InverterTier[] = ['budget', 'mid', 'premium'];

export const TIER_NAME: Record<InverterTier, string> = {
  budget: 'Budget class',
  mid: 'Mid class',
  premium: 'Premium class',
};

/** Titles live here so the post's <h1>/<title> and the blog index cannot disagree. */
export const PRICE_GUIDE_TITLES = {
  '5kva-solar-system-price-nigeria': `5kVA Solar System Price in Nigeria (${PRICE_MONTH}), Itemised`,
  'solar-panel-price-nigeria': `Solar Panel Price in Nigeria (${PRICE_MONTH}): Price per Watt and per Panel`,
  'lithium-battery-price-nigeria': `Lithium Battery Price in Nigeria (${PRICE_MONTH}): 5kWh, 10kWh, 15kWh by Brand Tier`,
  'how-many-batteries-for-5kva-inverter': 'How Many Batteries for a 5kVA Inverter? Lithium vs Tubular, with Hours of Backup',
  '3-5kva-solar-system-price-nigeria': `3.5kVA Solar System Price in Nigeria (${PRICE_MONTH}), Itemised`,
  '10kva-solar-system-price-nigeria': `10kVA Solar System Price in Nigeria (${PRICE_MONTH}), Itemised`,
  'inverter-price-nigeria': `Inverter Price in Nigeria (${PRICE_MONTH}): 1.5kVA to 10kVA by Brand Tier`,
  'solar-installation-cost-nigeria': `Solar Installation Cost in Nigeria (${PRICE_MONTH}): Labour, Materials and What a Quote Must Show`,
  'lithium-battery-brands-nigeria': `Lithium Battery Brands in Nigeria (${PRICE_MONTH}): Felicity, Deye, Pylontech, Dyness, Blue Carbon and ITEL Prices`,
  '5kw-hybrid-inverter-price-nigeria': `5kW Hybrid Inverter Price in Nigeria (${PRICE_MONTH}): Deye vs Growatt, Felicity, Luxpower, Solis`,
} as const;

export type PriceGuideSlug = keyof typeof PRICE_GUIDE_TITLES;

/**
 * Reference loads. They mirror PROFILES in scripts/check-headline-prices.mjs
 * exactly, so the itemised Mid-class build on each guide adds up to the
 * HEADLINE_PACKAGES range quoted in its first line. If that script's profiles
 * change, change these with them.
 */
export const LOAD_5KVA: QuoteAppliance[] = [
  { id: 'lights', name: 'LED lights', watts: 40, qty: 10, hoursPerDay: 5 },
  { id: 'fan', name: 'Standing fan', watts: 75, qty: 3, hoursPerDay: 6 },
  { id: 'tv', name: 'TV', watts: 100, qty: 2, hoursPerDay: 5 },
  { id: 'fridge', name: 'Fridge', watts: 150, qty: 1, hoursPerDay: 8 },
  { id: 'freezer', name: 'Chest freezer', watts: 200, qty: 1, hoursPerDay: 8 },
  { id: 'ac-1hp', name: '1HP AC', watts: 750, qty: 1, hoursPerDay: 6 },
  { id: 'pump', name: 'Water pump', watts: 750, qty: 1, hoursPerDay: 1 },
];

export const LOAD_10KVA: QuoteAppliance[] = [
  { id: 'lights', name: 'LED lights', watts: 40, qty: 14, hoursPerDay: 5 },
  { id: 'fan', name: 'Standing fan', watts: 75, qty: 4, hoursPerDay: 6 },
  { id: 'tv', name: 'TV', watts: 100, qty: 2, hoursPerDay: 5 },
  { id: 'fridge', name: 'Fridge', watts: 150, qty: 2, hoursPerDay: 8 },
  { id: 'ac-1hp', name: '1.5HP AC', watts: 1100, qty: 2, hoursPerDay: 6 },
  { id: 'pump', name: 'Water pump', watts: 750, qty: 1, hoursPerDay: 1 },
  { id: 'microwave', name: 'Microwave', watts: 1200, qty: 1, hoursPerDay: 0.5 },
];

export interface TierBuild {
  tier: InverterTier;
  quote: Quote;
  t: TierQuote;
}

/**
 * The same system at each brand class: the engine's Standard sizing for this
 * load, with only the inverter/battery brand class swapped. Sizes stay fixed,
 * so the three rows differ by brand class alone.
 */
export function tierBuilds(appliances: QuoteAppliance[], expectKva?: number): TierBuild[] {
  return TIERS.map((tier) => {
    const quote = buildQuote(appliances, { standard: { inverterTier: tier } });
    const t = quote.tiers.standard;
    // A guide titled "5kVA" must not quietly render a 6kVA build if the engine moves.
    if (expectKva !== undefined && t.inverterKva !== expectKva) {
      throw new Error(`Price guide expected a ${expectKva}kVA build, the engine sized ${t.inverterKva}kVA — update the load`);
    }
    return { tier, quote, t };
  });
}

export function buildFor(builds: TierBuild[], tier: InverterTier): TierBuild {
  return builds.find((b) => b.tier === tier)!;
}

const ZERO: PriceRange = { low: 0, best: 0, high: 0 };

export function sumRanges(...rs: PriceRange[]): PriceRange {
  return rs.reduce((a, b) => ({ low: a.low + b.low, best: a.best + b.best, high: a.high + b.high }), ZERO);
}

export function scaleRange(r: PriceRange, k: number): PriceRange {
  return { low: Math.round(r.low * k), best: Math.round(r.best * k), high: Math.round(r.high * k) };
}

/** One bill-of-materials line's cost, by key ("inverter", "battery", "panels", …). */
export function lineCost(t: TierQuote, key: string): PriceRange {
  return t.bom.find((l) => l.key === key)?.lineCost ?? ZERO;
}

/** Relative link that opens the calculator prefilled with this exact load and brand class. */
export function calculatorHref(build: TierBuild): string {
  return quoteUrl(build.quote, 'standard', '');
}

/** A HEADLINE_PACKAGES row by the start of its label, e.g. "5kVA". Throws if the row is gone. */
export function headlinePackage(prefix: string) {
  const row = HEADLINE_PACKAGES.find((p) => p.label.startsWith(prefix));
  if (!row) throw new Error(`app/blog/_lib/price-guides.ts: no HEADLINE_PACKAGES row starting "${prefix}"`);
  return row;
}

/** 5 → "5", 5.12 → "5.12", 10.24 → "10.24" */
export function num(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}

// ── Battery arithmetic ────────────────────────────────────────────────

/** Usable share of a LiFePO4 module's nominal kWh — the engine's own figure. */
export const LITHIUM_USABLE = SIZING_RULES.lithiumUsableDoD;

/**
 * A 12V 200Ah tubular battery holds 12 × 200 = 2.4kWh nominal, and the engine
 * uses half of it (lead-acid depth of discharge). Mirrors TUBULAR_KWH and
 * TUBULAR_USABLE in lib/quote.ts.
 */
export const TUBULAR_KWH = (12 * 200) / 1000;
export const TUBULAR_USABLE = 0.5;
/** A 48V bank is four 12V batteries in series, so tubular counts go up in fours on a 5kVA. */
export const TUBULAR_SERIES_48V = 4;

export const LITHIUM_MODULE_USABLE_KWH = LITHIUM_MODULE_KWH * LITHIUM_USABLE;
export const TUBULAR_USABLE_KWH = TUBULAR_KWH * TUBULAR_USABLE;

export function lithiumModulesFor(usableKwh: number): number {
  return Math.max(1, Math.ceil(usableKwh / LITHIUM_MODULE_USABLE_KWH));
}

export function tubularCountFor(usableKwh: number, series = TUBULAR_SERIES_48V): number {
  return Math.max(series, Math.ceil(usableKwh / TUBULAR_USABLE_KWH / series) * series);
}
