/**
 * The slice of lib/brands.ts the quote engine needs to price a chosen brand:
 * every manufacturer's inverters, lithium modules and panels with their size
 * and price. Built on the server and handed to client pages as a prop, so the
 * full catalogue (75KB, contacts and all) never ships to the browser.
 *
 * Prices are the catalogue's, which already include the sourcing fee.
 */
import { manufacturers } from "./brands";

export interface LiteProduct {
  slug: string;
  brand: string;
  model: string;
  spec: string;
  /** kVA, kWh or W, by category */
  size: number;
  low: number;
  high: number;
}

export interface LiteCatalogue {
  inverter: LiteProduct[];
  battery: LiteProduct[];
  panel: LiteProduct[];
}

/** Guide prices with no live listing stay out: a brand choice prices off real listings only. */
const GUIDE = /guide/i;

export function liteCatalogue(): LiteCatalogue {
  const out: LiteCatalogue = { inverter: [], battery: [], panel: [] };
  for (const b of manufacturers()) {
    for (const p of b.products) {
      if (p.excludeFromAutoMatch || GUIDE.test(`${p.note ?? ""} ${p.spec}`)) continue;
      const size = p.category === "inverter" ? p.kva : p.category === "battery" ? p.kwh : p.category === "panel" ? p.watts : undefined;
      if (!size || (p.category !== "inverter" && p.category !== "battery" && p.category !== "panel")) continue;
      // 12/24V lead-acid or small packs are not modules for a home bank
      if (p.category === "battery" && /tubular|lead|gel|agm/i.test(p.spec)) continue;
      out[p.category].push({ slug: b.slug, brand: b.name, model: p.model, spec: p.spec, size, low: p.priceLow, high: p.priceHigh });
    }
  }
  return out;
}
