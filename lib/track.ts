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
  | "finance_click";

export interface TrackPayload {
  quoteCode?: string;
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
