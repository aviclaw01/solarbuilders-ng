/**
 * First-party event sink for lib/track.ts → Supabase `site_events`.
 *
 * Accepts only a fixed set of event names and a small, typed payload; anything
 * else is dropped. Always returns 204 so a failure here can never surface as a
 * console error on the site. No IP, cookie or device identifier is stored.
 */

const EVENTS = new Set([
  "page_view",
  "not_found",
  "cta_click",
  "need_submit",
  "whatsapp_click",
  "quote_generated",
  "quote_download",
  "quote_share",
  "quote_form_open",
  "quote_form_submit",
  "finance_open",
  "finance_click",
  "cart_add",
  "kit_chosen",
  "order_form_open",
  "order_submit",
  "find_persona",
  "find_hours",
]);

/**
 * site_events.landing_path / entry_ref are declared in supabase/site_events.sql
 * but the ALTER has NOT been applied to the live table yet. PostgREST rejects a
 * payload naming an unknown column and drops the whole event, so these stay
 * out of the insert until the migration is run. Flip to true in the same
 * commit as confirming the columns exist (node scripts/check-db-columns.mjs --live).
 */
const ATTRIBUTION_COLUMNS_LIVE = false;

/** Only the real site may write events; anything else is a script or a scraper. */
const ALLOWED_HOSTS = new Set(["solarbuildersng.com", "www.solarbuildersng.com"]);

function headerHost(v: string | null): string | null {
  if (!v) return null;
  try {
    return new URL(v).hostname;
  } catch {
    return null;
  }
}

/** 404 paths that are vulnerability scanners, not visitors following a dead link. */
const PROBE_PATH = /wp-|\.env|phpmyadmin|\.php|\.\./i;

function str(v: unknown, max: number): string | null {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
}

function int(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null;
}

export async function POST(req: Request) {
  const noContent = new Response(null, { status: 204 });
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const event = str(body.event, 40);
    if (!event || !EVENTS.has(event)) return noContent;

    // Local runs and preview deploys share the production database. Their
    // clicks are test traffic and must not land in the funnel (on 14 Oct 2026
    // agent test runs added ~125 events in one morning).
    const host = new URL(req.url).hostname;
    const isLocal = host === "localhost" || host === "::1" || host.startsWith("127.");
    if (isLocal || (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production")) return noContent;

    if (process.env.VERCEL_ENV === "production") {
      // Browsers always send Origin on a POST (fetch and sendBeacon alike);
      // Referer is the fallback. Neither present, or a foreign host: drop.
      const from = headerHost(req.headers.get("origin")) ?? headerHost(req.headers.get("referer"));
      if (!from || !ALLOWED_HOSTS.has(from)) return noContent;
    }

    const path = str(body.path, 200);
    if (event === "not_found" && (!path || path.length > 120 || PROBE_PATH.test(path))) return noContent;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key || url.includes("your-project")) return noContent;

    const res = await fetch(`${url}/rest/v1/site_events`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        event,
        path,
        referrer_host: str(body.referrer, 120),
        quote_code: str(body.quoteCode, 40),
        tier: str(body.tier, 20),
        amount: int(body.amount),
        lender: str(body.lender, 40),
        placement: str(body.placement, 60),
        item: str(body.item, 120),
        format: str(body.format, 20),
        utm_source: str(body.utm_source, 64),
        utm_medium: str(body.utm_medium, 64),
        utm_campaign: str(body.utm_campaign, 64),
        // undefined keys are dropped by JSON.stringify, so these reach
        // PostgREST only once the flag is on (and the guard still sees them).
        landing_path: ATTRIBUTION_COLUMNS_LIVE ? str(body.landing_path, 200) : undefined,
        entry_ref: ATTRIBUTION_COLUMNS_LIVE ? str(body.entry_ref, 200) : undefined,
      }),
    });
    if (!res.ok) console.error("[track] insert failed:", res.status);
  } catch {
    /* swallow — tracking is never worth an error response */
  }
  return noContent;
}
