/**
 * Cart persistence, split out from lib/cart.ts on purpose.
 *
 * lib/cart.ts imports the whole product catalogue (lib/brands.ts, ~61KB of
 * source) so it can re-price saved lines. The navbar's cart badge only needs to
 * count them, and importing lib/cart there dragged the entire catalogue into the
 * shared client bundle on every page. Nothing in this file touches the
 * catalogue, so a component that only reads or writes the cart can import it
 * without paying for the brand data.
 *
 * lib/cart.ts re-exports everything here, so existing call sites are unchanged.
 */

export const CART_STORAGE_KEY = "sb_cart_v1";

export interface CartLine {
  brandSlug: string;
  model: string;
  qty: number;
}

export function readCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((l) => l && typeof l.brandSlug === "string" && typeof l.model === "string")
      .map((l) => ({ brandSlug: l.brandSlug, model: l.model, qty: Math.max(1, Math.min(99, Number(l.qty) || 1)) }));
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
    window.dispatchEvent(new CustomEvent("sb-cart-change"));
  } catch {
    /* private mode / storage disabled — the cart just won't persist */
  }
}

export function addLine(lines: CartLine[], brandSlug: string, model: string, qty = 1): CartLine[] {
  const i = lines.findIndex((l) => l.brandSlug === brandSlug && l.model === model);
  if (i === -1) return [...lines, { brandSlug, model, qty }];
  const next = [...lines];
  next[i] = { ...next[i], qty: Math.min(99, next[i].qty + qty) };
  return next;
}

export function setQty(lines: CartLine[], brandSlug: string, model: string, qty: number): CartLine[] {
  if (qty < 1) return lines.filter((l) => !(l.brandSlug === brandSlug && l.model === model));
  return lines.map((l) => (l.brandSlug === brandSlug && l.model === model ? { ...l, qty: Math.min(99, qty) } : l));
}
