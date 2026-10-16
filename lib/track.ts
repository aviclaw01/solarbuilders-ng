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
  | "page_view" // every route change; placement "landing" on a tab's first view
  | "not_found" // a 404 was rendered — path is the dead URL
  | "cta_click" // a primary call-to-action; placement names which one
  | "need_submit" // homepage "tell us what you need" form sent
  | "whatsapp_click" // any WhatsApp button, anywhere on the site
  | "quote_generated" // calculator produced a quote card
  | "quote_download" // PDF or image saved
  | "quote_share"
  | "quote_form_open" // "Get this system built" modal opened
  | "quote_form_submit" // form submitted (the row also lands in quote_requests)
  | "finance_open"
  | "finance_click"
  | "cart_add" // shop → "Add to order"
  | "kit_chosen" // /find → "Choose this kit" (hands off to /cart; not a cart_add)
  | "order_form_open"
  | "order_submit"
  | "find_persona" // /find step 1 — placement is the persona key, or "pick"
  | "find_hours"; // /find step 2 — placement is the hours-off tile, e.g. "12h"

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
type UtmKey = (typeof UTM_KEYS)[number];

/** Session-scoped first-touch attribution. Tab-local, cleared when the tab closes. */
interface Attribution {
  landing_path: string | null;
  entry_ref: string | null;
  utm: Partial<Record<UtmKey, string>>;
}

const ATTR_KEY = "sb_attr";

function urlCampaign(): Partial<Record<UtmKey, string>> {
  const out: Partial<Record<UtmKey, string>> = {};
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

function referrerHost(): string | null {
  try {
    return document.referrer ? new URL(document.referrer).host.slice(0, 120) : null;
  } catch {
    return null;
  }
}

/**
 * Where this visit started: the first page seen in the tab, the external
 * referrer it came from, and its utm_* params. Written once, on the first
 * event of the session (the landing page_view), and read back on every later
 * event so a WhatsApp click three pages in still carries "utm_source=bing".
 * sessionStorage can throw (private mode, blocked storage) — then every field
 * is null and events fall back to the current URL's params only.
 */
function attribution(): Attribution {
  const empty: Attribution = { landing_path: null, entry_ref: null, utm: {} };
  try {
    const raw = window.sessionStorage.getItem(ATTR_KEY);
    if (raw) {
      const a = JSON.parse(raw) as Partial<Attribution>;
      return {
        landing_path: typeof a.landing_path === "string" ? a.landing_path : null,
        entry_ref: typeof a.entry_ref === "string" ? a.entry_ref : null,
        utm: a.utm && typeof a.utm === "object" ? a.utm : {},
      };
    }
    const ref = referrerHost();
    const first: Attribution = {
      landing_path: window.location.pathname.slice(0, 200),
      // A same-site referrer is a reload or a tab restore, not an entry source.
      entry_ref: ref && ref !== window.location.host ? ref : null,
      utm: urlCampaign(),
    };
    window.sessionStorage.setItem(ATTR_KEY, JSON.stringify(first));
    return first;
  } catch {
    return empty;
  }
}

/** UTM on the current URL wins; otherwise the session's landing UTM sticks. */
function campaign(attr: Attribution): Partial<Record<UtmKey, string>> {
  const now = urlCampaign();
  return Object.keys(now).length > 0 ? now : attr.utm;
}

/**
 * Never throws, never blocks navigation. Uses sendBeacon so the request
 * survives the page being unloaded by a WhatsApp/app handoff.
 */
export function track(event: TrackEvent, payload: TrackPayload = {}): void {
  if (typeof window === "undefined") return;
  try {
    const attr = attribution();
    const body = JSON.stringify({
      event,
      path: window.location.pathname.slice(0, 200),
      referrer: referrerHost() ?? undefined,
      landing_path: attr.landing_path ?? undefined,
      entry_ref: attr.entry_ref ?? undefined,
      ...campaign(attr),
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
