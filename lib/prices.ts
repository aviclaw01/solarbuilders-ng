/**
 * SolarBuilders.ng — Nigerian market price constants
 *
 * SINGLE SOURCE OF TRUTH for every ₦ figure the calculator, quote card,
 * compare page and blog pages show. Update here, nowhere else.
 *
 * Source: research/2026-10-nigeria-solar-price-refresh.md (9 Oct 2026, ~45 live pages)
 *   on top of research/2026-09-nigeria-solar-price-research.md
 *   ~130 priced data points from 38 live Nigerian vendor pages + 14 2026 guides
 *   (Felicity NG, Zit, Jumia, Jiji, Me3, Gennex, Solar Depot, Kasot, EnergyMall,
 *   Nature Solar, GoSolarMart, Abuja Solar, Solar Village …).
 *
 * "best" = marketplace price a buyer can actually get in Lagos/Abuja.
 * "low"  = Alaba/Jiji bulk-wholesale floor.  "high" = showroom / Jumia single-unit.
 */

export const PRICES_LAST_UPDATED = "2026-10-09";

/**
 * Our sourcing fee: every item we buy from a third-party seller is shown at the
 * market price we found plus this fraction. It is applied once — in the quote
 * engine's equipment/BOS lines and to the catalogue in lib/brands.ts — so every
 * ₦ the site shows already includes it. The constants in this file stay as the
 * raw market prices we observed.
 */
export const SOURCING_MARGIN = 0.05;
export const SOURCING_MARGIN_LABEL = `${Math.round(SOURCING_MARGIN * 100)}%`;

/** Market price → the price we charge, rounded to the nearest ₦100. */
export function withSourcingMargin(amount: number): number {
  return Math.round((amount * (1 + SOURCING_MARGIN)) / 100) * 100;
}
export const PRICES_LAST_UPDATED_LABEL = "October 2026";
export const USD_NGN_RATE = 1385; // parallel sell, 11 Sep 2026

export interface PriceRange {
  low: number;
  best: number;
  high: number;
}

/** Hybrid inverter — ₦ per kVA, by brand tier */
export const INVERTER_PER_KVA: Record<InverterTier, PriceRange> = {
  budget: { low: 90_000, best: 120_000, high: 200_000 },
  mid: { low: 100_000, best: 135_000, high: 210_000 },
  premium: { low: 205_000, best: 245_000, high: 350_000 }, // Deye SG-series hybrid, not the OG01 off-grid class
};

/** Small inverters cost more per kVA: ≤2.5kVA ×1.3, 3–3.6kVA ×1.1 (Oct 2026 listings). */
export function inverterSizeFactor(kva: number): number {
  if (kva <= 2.5) return 1.3;
  if (kva < 5) return 1.1;
  return 1;
}

export type InverterTier = "budget" | "mid" | "premium";

export const INVERTER_BRANDS: Record<InverterTier, string[]> = {
  budget: ["Felicity", "Sako", "SRNE", "Yohako"],
  mid: ["Growatt", "Luxpower", "Must", "Solis"],
  premium: ["Deye", "Victron"],
};

/** Lithium LiFePO4 storage — ₦ per kWh nominal, by tier */
export const LITHIUM_PER_KWH: Record<InverterTier, PriceRange> = {
  budget: { low: 185_000, best: 205_000, high: 245_000 }, // Blue Carbon, ITEL, Cworth — 5kWh module pricing
  mid: { low: 200_000, best: 255_000, high: 330_000 }, // Felicity, Growatt, Dyness
  premium: { low: 250_000, best: 275_000, high: 375_000 }, // Deye SE-G5.1 / Felicity LPBF
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
export const PANEL_PER_WP: PriceRange = { low: 190, best: 220, high: 260 };
/** Retail is now mostly 585–625W modules */
export const PANEL_WATTS = 600;
export const PANEL_BRANDS = ["Jinko", "JA Solar", "Longi", "Trina", "Canadian Solar"];

/**
 * Balance of system — LEGACY fraction, kept only for blog copy that quotes a
 * percentage. The quote engine now prices BOS line by line from BOS_ITEMS.
 */
export const BOS_FRACTION: PriceRange = { low: 0.08, best: 0.12, high: 0.18 };

/**
 * Balance of system, itemised. Each entry is a unit price; the quote engine
 * decides quantities from the system size. An engineer's BOM, not a % guess —
 * the old 12%-of-equipment lot hid the breakers, SPDs, earthing and the
 * extinguisher that every proper lithium install needs.
 */
export const BOS_ITEMS = {
  /** Aluminium rails, mid/end clamps, L-feet — per panel */
  mounting_per_panel: { low: 25_000, best: 35_000, high: 45_000 },
  /** 6mm² twin-core DC PV cable — per metre of run */
  pv_cable_per_m: { low: 4_500, best: 5_000, high: 6_500 },
  /** MC4 connector pair */
  mc4_pair: { low: 2_000, best: 3_000, high: 4_000 },
  /** PV combiner box + 2-pole 63A DC breaker + DC SPD (~₦40k + 16k + 15k) — per 2 strings */
  pv_combiner: { low: 50_000, best: 70_000, high: 120_000 },
  /** 125A DC battery breaker, battery fuse, 25mm² cable pair with lugs (≤5kVA) */
  battery_protection: { low: 70_000, best: 110_000, high: 200_000 },
  /** Same with a 160A+ MCCB and heavier cable (above 5kVA) */
  battery_protection_large: { low: 120_000, best: 175_000, high: 300_000 },
  /** Two 2-pole 63A AC breakers, 4–6 way DB, AC SPD */
  ac_protection: { low: 70_000, best: 100_000, high: 150_000 },
  /** Changeover, inverter ⇄ grid/gen — 63A (≤5kVA); manual to automatic */
  changeover_63a: { low: 10_000, best: 35_000, high: 60_000 },
  /** Changeover 100A (above 5kVA); manual to automatic */
  changeover_100a: { low: 15_000, best: 65_000, high: 120_000 },
  /** Copper earth rod, clamp, 16mm² earth cable */
  earthing_kit: { low: 45_000, best: 75_000, high: 110_000 },
  /** Battery rack / cabinet — needed above 2 lithium modules (not verified in Oct 2026 pass) */
  battery_rack: { low: 60_000, best: 100_000, high: 180_000 },
  /** CO₂ 5kg (₦57k) or DCP 9kg (₦25k) extinguisher beside the battery bank */
  fire_extinguisher: { low: 25_000, best: 55_000, high: 70_000 },
  /** Trunking, conduit, glands, lugs, ties, AC flex — per kVA of inverter */
  sundries_per_kva: { low: 10_000, best: 14_000, high: 22_000 },
} satisfies Record<string, PriceRange>;

/**
 * Contingency on equipment + BOS: the bits a site survey always finds (longer
 * cable run, extra rail, a tired DB) plus price movement since PRICES_LAST_UPDATED.
 */
export const CONTINGENCY_FRACTION: PriceRange = { low: 0.05, best: 0.08, high: 0.12 };

/**
 * Installation labour — REFERENCE ONLY. Not part of any quote total: we do
 * not employ installers and cannot promise what one will charge. Shown as a
 * "typical range" so the buyer is not surprised by the installer's bill.
 */
export const LABOUR_PER_KVA: PriceRange = { low: 30_000, best: 45_000, high: 70_000 };
export const LABOUR_FLOOR = 150_000;

/** Optional add-ons (not in default quote, shown as "ask us") */
export const OPTIONAL_ITEMS = {
  avr_5kva: { label: "AVR / stabiliser (5kVA)", ...({ low: 100_000, best: 150_000, high: 300_000 } as PriceRange) },
  changeover_63a: { label: "Automatic changeover (63A)", ...({ low: 40_000, best: 57_500, high: 160_000 } as PriceRange) },
  wifi_dongle: { label: "WiFi monitoring dongle", ...({ low: 35_000, best: 60_000, high: 80_000 } as PriceRange) },
};

/** Import duty & VAT on panels, inverters, batteries: 0% (NTA s.144, ECOWAS CET) */
export const EQUIPMENT_VAT = 0;

/**
 * Headline package ranges for marketing/SEO pages. Derived by running the quote
 * engine against typical loads — regenerate with `npm run prices:check` after
 * changing anything above. Rounded to nearest ₦50k.
 */
export const HEADLINE_PACKAGES = [
  { label: "1.5–2.5kVA · 5kWh lithium", powers: "Lights, fans, TV, fridge — no AC", low: 2_100_000, high: 4_000_000 },
  { label: "3.5kVA · 5kWh lithium", powers: "Small home, 1 small AC part-time", low: 3_700_000, high: 6_850_000 },
  { label: "5kVA · 10kWh lithium", powers: "Family home with 1 AC", low: 4_600_000, high: 8_350_000 },
  { label: "8–10kVA · 15kWh lithium", powers: "Large home, 2–3 ACs", low: 8_250_000, high: 15_200_000 },
  { label: "15–20kVA · 20–30kWh", powers: "Office / commercial", low: 17_700_000, high: 31_600_000 },
] as const;
