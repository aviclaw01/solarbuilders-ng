/**
 * SolarBuilders.ng — the cost of the energy solar replaces
 *
 * lib/prices.ts is the source of truth for everything we sell. This file is
 * the source of truth for everything we are selling *against*: the pump price
 * of petrol, what a generator burns, and what the grid charges a Band A
 * customer. No blog post may hand-type any of these — a payback figure that
 * silently drifts from the fuel price it was computed at is worse than no
 * payback figure at all.
 *
 * Every entry is a published range with the source it came from and the date
 * we read it. Where we could not find a primary source we left it out rather
 * than filling the gap: see the note on load factors below.
 *
 * Researched 15–16 September 2026 (CONTENT-PLAN.md §2F, §2I).
 */

export const ENERGY_COSTS_LAST_CHECKED = "2026-09-16";
export const ENERGY_COSTS_LAST_CHECKED_LABEL = "September 2026";

export interface CostRange {
  low: number;
  high: number;
  /** who published it */
  source: string;
  sourceUrl: string;
}

/** Petrol pump price, ₦ per litre, nationally. */
export const PETROL_PER_LITRE: CostRange = {
  low: 1_100,
  high: 1_500,
  source: "GlobalPetrolPrices / FuelTracker.ng",
  sourceUrl: "https://www.globalpetrolprices.com/Nigeria/gasoline_prices/",
};

/** Litres per hour a 3kVA petrol generator burns at roughly half load. */
export const GENSET_3KVA_LITRES_PER_HOUR = {
  low: 1.5,
  high: 2,
  source: "Lenol — cost of running a generator in Nigeria",
  sourceUrl: "https://lenol.co/blog/guides/cost-of-running-a-generator-in-nigeria",
};

/**
 * Hours a day the generator actually runs. This is the one number in this
 * file that is an assumption rather than a published figure — supply varies
 * street by street — so it is named as such everywhere it is used, and the
 * pages that use it say what changes if your own number is different.
 */
export const GENSET_HOURS_PER_DAY_ASSUMED = 8;

/** Band A energy charge, ₦ per kWh, 2026. */
export const BAND_A_TARIFF: CostRange = {
  low: 209,
  high: 225,
  source: "NaijaSabi — electricity tariff bands 2026",
  sourceUrl: "https://naijasabi.com.ng/electricity-tariff-nigeria-2026-bands/",
};

/** Hours of supply a day Band A is defined by. */
export const BAND_A_PROMISED_HOURS = 20;

/**
 * NERC Net Billing Regulations 2026 — eligibility window in kWp, announced
 * 4 June 2026. A prosumer outside this window cannot export at all.
 */
export const NET_BILLING_MIN_KWP = 50;
export const NET_BILLING_MAX_KWP = 1_500;
export const NET_BILLING_SOURCE_URL =
  "https://www.pulse.ng/story/nigeria-nerc-net-billing-sell-solar-electricity-national-grid-2026060410040301733";

/**
 * Harmattan soiling. Peer-reviewed, West Africa. The high figure is the worst
 * location in the study, not an average — pages using it must say so.
 * "Dust soiling effects on decentralized solar in West Africa", Applied Energy.
 */
export const SOILING_LOSS_PCT = {
  typicalLow: 15,
  typicalHigh: 30,
  worstCase: 50,
  source: "Applied Energy — dust soiling effects on decentralised solar in West Africa",
  sourceUrl: "https://www.sciencedirect.com/science/article/abs/pii/S0306261923003574",
};

/** ₦ per litre × litres per hour × hours → ₦ per day of generator running. */
export function generatorCostPerDay(hoursPerDay = GENSET_HOURS_PER_DAY_ASSUMED): { low: number; high: number } {
  return {
    low: PETROL_PER_LITRE.low * GENSET_3KVA_LITRES_PER_HOUR.low * hoursPerDay,
    high: PETROL_PER_LITRE.high * GENSET_3KVA_LITRES_PER_HOUR.high * hoursPerDay,
  };
}

/** What a given daily consumption costs on a Band A meter, ₦ per year. */
export function bandAAnnualCost(dailyKwh: number): { low: number; high: number } {
  return {
    low: dailyKwh * BAND_A_TARIFF.low * 365,
    high: dailyKwh * BAND_A_TARIFF.high * 365,
  };
}
