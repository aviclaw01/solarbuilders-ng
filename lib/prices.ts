/**
 * SolarBuilders.ng — Nigerian market price constants
 *
 * SINGLE SOURCE OF TRUTH for every ₦ figure the calculator, quote card,
 * compare page and blog pages show. Update here, nowhere else.
 *
 * Source: research/2026-09-nigeria-solar-price-research.md
 *   ~130 priced data points from 38 live Nigerian vendor pages + 14 2026 guides
 *   (Felicity NG, Zit, Jumia, Jiji, Me3, Gennex, Solar Depot, Kasot, EnergyMall,
 *   Nature Solar, GoSolarMart, Abuja Solar, Solar Village …).
 *
 * "best" = marketplace price a buyer can actually get in Lagos/Abuja.
 * "low"  = Alaba/Jiji bulk-wholesale floor.  "high" = showroom / Jumia single-unit.
 */

export const PRICES_LAST_UPDATED = "2026-09-11";
export const PRICES_LAST_UPDATED_LABEL = "September 2026";
export const USD_NGN_RATE = 1385; // parallel sell, 11 Sep 2026

export interface PriceRange {
  low: number;
  best: number;
  high: number;
}

/** Hybrid inverter — ₦ per kVA, by brand tier */
export const INVERTER_PER_KVA: Record<InverterTier, PriceRange> = {
  budget: { low: 65_000, best: 110_000, high: 160_000 },
  mid: { low: 100_000, best: 125_000, high: 200_000 },
  premium: { low: 230_000, best: 300_000, high: 400_000 },
};

export type InverterTier = "budget" | "mid" | "premium";

export const INVERTER_BRANDS: Record<InverterTier, string[]> = {
  budget: ["Felicity", "Sako", "SRNE", "Yohako"],
  mid: ["Growatt", "Luxpower", "Must", "Solis"],
  premium: ["Deye", "Victron"],
};

/** Lithium LiFePO4 storage — ₦ per kWh nominal, by tier */
export const LITHIUM_PER_KWH: Record<InverterTier, PriceRange> = {
  budget: { low: 130_000, best: 165_000, high: 190_000 }, // Blue Carbon, ITEL, Cworth
  mid: { low: 187_000, best: 205_000, high: 270_000 }, // Felicity, Deye, Growatt, Dyness
  premium: { low: 187_000, best: 210_000, high: 270_000 }, // Deye SE-G5.1 / Felicity LPBF
};

export const LITHIUM_BRANDS: Record<InverterTier, string[]> = {
  budget: ["Blue Carbon", "ITEL", "Cworth"],
  mid: ["Felicity", "Growatt", "Dyness"],
  premium: ["Deye", "Felicity"],
};

/** Standard 48V lithium module — 100Ah × 51.2V = 5.12 kWh (Deye SE-G5.1, Felicity LPBF48100) */
export const LITHIUM_MODULE_KWH = 5.12;

/** Tubular 200Ah 12V lead-acid — reference only, not used in the default quote */
export const TUBULAR_200AH: PriceRange = { low: 160_000, best: 200_000, high: 300_000 };

/** Solar panels — ₦ per Wp, Tier-1 mono/bifacial 550–620W (Jinko, JA, Longi, Trina, Canadian) */
export const PANEL_PER_WP: PriceRange = { low: 185, best: 230, high: 300 };
export const PANEL_WATTS = 550;
export const PANEL_BRANDS = ["Jinko", "JA Solar", "Longi", "Trina", "Canadian Solar"];

/**
 * Balance of system (mounting rails, DC/AC cable, breakers, SPD, combiner box,
 * changeover, earthing, MC4, DB) as a fraction of equipment cost.
 */
export const BOS_FRACTION: PriceRange = { low: 0.08, best: 0.12, high: 0.18 };

/** Installation labour — ₦ per kVA, with a floor for small jobs (Lagos/Abuja/PH roof mount) */
export const LABOUR_PER_KVA: PriceRange = { low: 20_000, best: 30_000, high: 60_000 };
export const LABOUR_FLOOR = 100_000;

/** Optional add-ons (not in default quote, shown as "ask us") */
export const OPTIONAL_ITEMS = {
  avr_5kva: { label: "AVR / stabiliser (5kVA)", ...({ low: 100_000, best: 140_000, high: 300_000 } as PriceRange) },
  changeover_63a: { label: "Automatic changeover (63A)", ...({ low: 15_000, best: 40_000, high: 160_000 } as PriceRange) },
  wifi_dongle: { label: "WiFi monitoring dongle", ...({ low: 30_000, best: 40_000, high: 50_000 } as PriceRange) },
};

/** Import duty & VAT on panels, inverters, batteries: 0% (NTA s.144, ECOWAS CET) */
export const EQUIPMENT_VAT = 0;

/**
 * Headline package ranges for marketing/SEO pages. Derived by running the quote
 * engine against typical loads — regenerate with `npm run prices:check` after
 * changing anything above. Rounded to nearest ₦50k.
 */
export const HEADLINE_PACKAGES = [
  { label: "1.5–2.5kVA · 5kWh lithium", powers: "Lights, fans, TV, fridge — no AC", low: 1_400_000, high: 2_000_000 },
  { label: "3.5kVA · 5kWh lithium", powers: "Small home, 1 small AC part-time", low: 1_800_000, high: 2_600_000 },
  { label: "5kVA · 10kWh lithium", powers: "Family home with 1 AC", low: 3_200_000, high: 4_800_000 },
  { label: "8–10kVA · 15kWh lithium", powers: "Large home, 2–3 ACs", low: 6_000_000, high: 9_500_000 },
  { label: "15–20kVA · 20–30kWh", powers: "Office / commercial", low: 11_000_000, high: 20_000_000 },
] as const;
