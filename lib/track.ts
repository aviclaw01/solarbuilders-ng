/**
 * SolarBuilders.ng — first-party funnel tracking.
 *
 * Fire-and-forget events to /api/track, stored in Supabase `site_events`.
 * This is how we know which pages produce WhatsApp conversations and which
 * quotes get downloaded — the numbers we need before claiming anything about
 * lead volume.
 *
 * Deliberately minimal: no cookies, no third-party script, no device or
 * personal identifiers. Only the event name, the page it happened on, the
 * quote code/tier if relevant, and campaign params already in the URL.
 */

export type TrackEvent =
  | "whatsapp_click" // any WhatsApp button, anywhere on the site
  | "quote_generated" // calculator produced a quote card
  | "quote_download" // PDF or image saved
  | "quote_share"
  | "quote_form_open" // "Get this system built" modal opened
  | "quote_form_submit" // form submitted (the row also lands in quote_requests)
  | "finance_open"
  | "finance_click"
  | "cart_add" // shop → "Add to order"
  | "order_form_open"
  | "order_submit";

export interface TrackPayload {
  quoteCode?: string;
  /** catalogue line, e.g. "deye::SUN-5K-SG 1-phase" */
  item?: string;
  tier?: string;
  amount?: number;
  lender?: string;
  /** where the click happened, e.g. "floating", "quote_card", "brand:deye" */
  placement?: string;
  format?: string;
}

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign"] as const;

function campaign(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const out: Record<string, string> = {};
  try {
    const p = new URLSearchParams(window.location.search);
    for (const k of UTM_KEYS) {
      const v = p.get(k);
      if (v) out[k] = v.slice(0, 64);
    }
  } catch {
    /* ignore */
  }
  return out;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Fan-out to GA4 and the Meta Pixel when their scripts are on the page.
 *
 * Both scripts only load after the cookie banner is accepted, so a missing
 * global means the visitor declined (or analytics is unconfigured) — sending
 * nothing is the consent mechanism working, not a bug.
 *
 * Pixel events map to Meta's standard events where one fits (so Ads Manager
 * can optimise on them); everything else goes out as a custom event with the
 * same name the funnel already uses.
 */
const PIXEL_STANDARD: Partial<Record<TrackEvent, string>> = {
  whatsapp_click: "Contact",
  cart_add: "AddToCart",
  quote_form_open: "InitiateCheckout",
  order_form_open: "InitiateCheckout",
  quote_form_submit: "Lead",
  order_submit: "Lead",
  quote_generated: "ViewContent",
};

function fanOut(event: TrackEvent, payload: TrackPayload): void {
  const value = typeof payload.amount === "number" && payload.amount > 0 ? payload.amount : undefined;
  try {
    window.gtag?.("event", event, { ...payload });
  } catch {
    /* analytics must never break the page */
  }
  try {
    if (!window.fbq) return;
    const standard = PIXEL_STANDARD[event];
    const params = { ...payload, currency: "NGN", ...(value !== undefined ? { value } : {}) };
    if (standard) window.fbq("track", standard, params);
    else window.fbq("trackCustom", event, params);
  } catch {
    /* analytics must never break the page */
  }
}

/**
 * Never throws, never blocks navigation. Uses sendBeacon so the request
 * survives the page being unloaded by a WhatsApp/app handoff.
 */
export function track(event: TrackEvent, payload: TrackPayload = {}): void {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({
      event,
      path: window.location.pathname.slice(0, 200),
      referrer: document.referrer ? new URL(document.referrer).host.slice(0, 120) : undefined,
      ...campaign(),
      ...payload,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
    }
    // GA4 / Pixel, only when their consent-gated scripts are actually loaded.
    fanOut(event, payload);
  } catch {
    /* tracking must never break the page */
  }
}

/**
 * Adds campaign params to a URL we put inside a WhatsApp message, so a click
 * back to the site is attributable.
 */
export function withCampaign(url: string, source: string, medium = "whatsapp"): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}utm_source=${encodeURIComponent(source)}&utm_medium=${encodeURIComponent(medium)}`;
}
