/**
 * SolarBuilders.ng — shop cart / order builder
 *
 * This is NOT a checkout. We take no card payment: the cart builds an **order
 * request** that reaches us, we confirm today's price with the distributor, and
 * only then does the customer pay. Every label in the UI must reflect that.
 *
 * Cart lines reference real catalogue products from lib/brands.ts by
 * `brandSlug + model`, so a saved cart re-prices itself whenever the catalogue
 * is refreshed rather than freezing a stale number.
 */

import {
  BRANDS,
  getBrand,
  type Brand,
  type Product,
  type ProductCategory,
} from "./brands";
import type { TierQuote } from "./quote";
import type { CartLine } from "./cartStorage";

export { CART_STORAGE_KEY, readCart, writeCart, addLine, setQty } from "./cartStorage";
export type { CartLine } from "./cartStorage";

export interface ResolvedLine extends CartLine {
  brand: Brand;
  product: Product;
  lineLow: number;
  lineHigh: number;
  lineBest: number;
}

export interface CartTotals {
  low: number;
  best: number;
  high: number;
  items: number;
}

// ─────────────────────────────────────────────────────────
// CATALOGUE LOOKUP
// ─────────────────────────────────────────────────────────

export interface CatalogueItem {
  brand: Brand;
  product: Product;
  /** stable id used in URLs and cart lines */
  id: string;
}

/** Every priced product across all brands, flattened for the shop. */
export function catalogue(): CatalogueItem[] {
  return BRANDS.flatMap((brand) =>
    brand.products.map((product) => ({ brand, product, id: `${brand.slug}::${product.model}` })),
  );
}

export function findProduct(brandSlug: string, model: string): CatalogueItem | undefined {
  const brand = getBrand(brandSlug);
  const product = brand?.products.find((p) => p.model === model);
  return brand && product ? { brand, product, id: `${brand.slug}::${product.model}` } : undefined;
}

/** Midpoint of a listing range — what we show as the working figure. */
export function midPrice(p: Product): number {
  return Math.round((p.priceLow + p.priceHigh) / 2);
}

/** The size of a product in its category's own unit (kVA / kWh / W). */
export function productSize(p: Product): number | undefined {
  return p.kva ?? p.kwh ?? p.watts;
}

// ─────────────────────────────────────────────────────────
// CART MATHS
// ─────────────────────────────────────────────────────────

export function resolveCart(lines: CartLine[]): ResolvedLine[] {
  return lines.flatMap((line) => {
    const found = findProduct(line.brandSlug, line.model);
    if (!found || line.qty < 1) return [];
    const { brand, product } = found;
    return [
      {
        ...line,
        brand,
        product,
        lineLow: product.priceLow * line.qty,
        lineHigh: product.priceHigh * line.qty,
        lineBest: midPrice(product) * line.qty,
      },
    ];
  });
}

export function cartTotals(resolved: ResolvedLine[]): CartTotals {
  return resolved.reduce<CartTotals>(
    (acc, l) => ({
      low: acc.low + l.lineLow,
      best: acc.best + l.lineBest,
      high: acc.high + l.lineHigh,
      items: acc.items + l.qty,
    }),
    { low: 0, best: 0, high: 0, items: 0 },
  );
}

// ─────────────────────────────────────────────────────────
// QUOTE → CART
// ─────────────────────────────────────────────────────────

/**
 * Some catalogue rows are guide prices rather than a live listing we saw in a
 * cart. Fine to publish with a caveat, wrong to auto-select into someone's
 * order — we'd be quoting a number no seller has confirmed.
 */
function isGuidePriceOnly(p: Product): boolean {
  return /guide/i.test(p.note ?? "");
}

/** Rows we publish but must never auto-select into an order. */
function isAutoMatchable(p: Product): boolean {
  return !p.excludeFromAutoMatch && !isGuidePriceOnly(p);
}

/**
 * Pick the catalogue product that best fits a required size.
 *
 * Prefers the smallest product at or above the requirement (undersizing an
 * inverter trips it), then — among products in that same size band — the best
 * value per unit. Picking purely by size would hand someone a ₦271/W panel
 * when a ₦173/W panel of the same wattage is on the same page.
 */
function bestFit(items: CatalogueItem[], targetSize: number): CatalogueItem | undefined {
  const sized = items.filter((i) => productSize(i.product) && isAutoMatchable(i.product));
  if (sized.length === 0) return undefined;

  const valuePerUnit = (i: CatalogueItem) => midPrice(i.product) / productSize(i.product)!;

  const atOrAbove = sized.filter((i) => productSize(i.product)! >= targetSize);
  if (atOrAbove.length > 0) {
    const smallest = Math.min(...atOrAbove.map((i) => productSize(i.product)!));
    // Anything up to 25% larger counts as the same practical choice; take the
    // best value within that band rather than the first by size.
    const band = atOrAbove.filter((i) => productSize(i.product)! <= smallest * 1.25);
    return band.sort((a, b) => valuePerUnit(a) - valuePerUnit(b))[0];
  }

  // Nothing reaches the target — take the largest we have.
  return sized.sort((a, b) => productSize(b.product)! - productSize(a.product)!)[0];
}

/**
 * How many units to cover a required capacity.
 *
 * Allows a 5% shortfall so a 5.12kWh requirement takes one 5kWh module instead
 * of two — the quote's module size is a modelling assumption, not a spec the
 * customer has to hit exactly.
 */
function unitsFor(required: number, each: number): number {
  return Math.max(1, Math.ceil((required * 0.95) / each));
}

function inCategory(category: ProductCategory, tier?: Brand["tier"]): CatalogueItem[] {
  return catalogue().filter(
    (i) =>
      i.product.category === category &&
      i.brand.kind === "manufacturer" &&
      (tier ? i.brand.tier === tier : true),
  );
}

export interface QuoteMatch {
  lines: CartLine[];
  /** lines we could not fill from the catalogue, e.g. cables and labour */
  unmatched: string[];
}

/**
 * Turn a generated quote tier into real catalogue lines.
 *
 * Mounting/cables/protection and installation are deliberately NOT matched —
 * they are not catalogue products, they are quoted per job. We surface them as
 * `unmatched` so the UI can say so instead of silently dropping them.
 */
export function cartFromQuoteTier(tier: TierQuote): QuoteMatch {
  const lines: CartLine[] = [];
  const unmatched: string[] = [];

  // Inverter — one unit, matched on kVA within the tier's brand class
  const inverterPool = inCategory("inverter", tier.inverterTier);
  const inverter = bestFit(inverterPool.length ? inverterPool : inCategory("inverter"), tier.inverterKva);
  if (inverter) lines.push({ brandSlug: inverter.brand.slug, model: inverter.product.model, qty: 1 });
  else unmatched.push(`${tier.inverterKva}kVA hybrid inverter`);

  // Battery — match one module, then take as many as the bank needs
  if (tier.batteryType === "lithium") {
    // Battery brand does not have to match the inverter's brand tier — they are
    // separate purchases. Try the tier's own brands first, but fall back to the
    // whole catalogue rather than forcing a 14kWh pack onto a 10kWh requirement.
    const MODULE_KWH = 5;
    const tierPick = bestFit(inCategory("battery", tier.inverterTier), MODULE_KWH);
    const oversized = tierPick && (tierPick.product.kwh ?? 0) > MODULE_KWH * 1.5;
    const battery = !tierPick || oversized ? bestFit(inCategory("battery"), MODULE_KWH) ?? tierPick : tierPick;
    if (battery) {
      const each = battery.product.kwh ?? 5;
      lines.push({
        brandSlug: battery.brand.slug,
        model: battery.product.model,
        qty: unitsFor(tier.batteryKwh, each),
      });
    } else {
      unmatched.push(`${tier.batteryKwh}kWh lithium battery`);
    }
  } else {
    // We don't carry tubular batteries in the catalogue — quote them per job.
    unmatched.push(`${tier.batteryModules}× 200Ah tubular battery`);
  }

  // Panels — match on watts, then scale the count so total Wp still lands
  const panel = bestFit(inCategory("panel"), tier.panelWatts);
  if (panel) {
    const each = panel.product.watts ?? tier.panelWatts;
    const totalWp = tier.panelCount * tier.panelWatts;
    lines.push({
      brandSlug: panel.brand.slug,
      model: panel.product.model,
      qty: unitsFor(totalWp, each),
    });
  } else {
    unmatched.push(`${tier.panelCount}× ${tier.panelWatts}W panel`);
  }

  unmatched.push("Mounting, cables and protection", "Installation and commissioning");
  return { lines, unmatched };
}
