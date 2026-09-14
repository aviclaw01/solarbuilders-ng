/**
 * First-party event sink for lib/track.ts → Supabase `site_events`.
 *
 * Accepts only a fixed set of event names and a small, typed payload; anything
 * else is dropped. Always returns 204 so a failure here can never surface as a
 * console error on the site. No IP, cookie or device identifier is stored.
 */

const EVENTS = new Set([
  "whatsapp_click",
  "quote_generated",
  "quote_download",
  "quote_share",
  "quote_form_open",
  "quote_form_submit",
  "finance_open",
  "finance_click",
]);

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
        path: str(body.path, 200),
        referrer_host: str(body.referrer, 120),
        quote_code: str(body.quoteCode, 40),
        tier: str(body.tier, 20),
        amount: int(body.amount),
        lender: str(body.lender, 40),
        placement: str(body.placement, 60),
        format: str(body.format, 20),
        utm_source: str(body.utm_source, 64),
        utm_medium: str(body.utm_medium, 64),
        utm_campaign: str(body.utm_campaign, 64),
      }),
    });
    if (!res.ok) console.error("[track] insert failed:", res.status);
  } catch {
    /* swallow — tracking is never worth an error response */
  }
  return noContent;
}
