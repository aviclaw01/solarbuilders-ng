import { appendToSheet } from "@/lib/sheets";
import { rateLimit, clientIp, tooManyRequests, readJson, fail, esc, isHoneypotFilled } from "@/lib/api";
import { validateFields, requiredText, cleanString, type FieldErrors } from "@/lib/validation";
import { FROM_EMAIL, LEAD_EMAILS } from "@/lib/site";

/**
 * A "Get my system built" request from a quote that started on a brand page
 * (components/ui/BuildRequestModal.tsx).
 *
 * No phone or name is asked: the visitor sends the result to us on WhatsApp,
 * which carries their number. What this route adds is the request code they
 * send, minted and filed here first, so a chat that arrives with SB-BR-XXXXXX
 * opens a row in /admin/leads holding the brand, the appliance list, location
 * and budget.
 *
 * Lands in `quote_requests` alongside the calculator's call-back form. Brand,
 * budget and appliances go in `note`, which the leads desk already shows, so
 * no schema change is needed.
 *
 *   200 { ok, stored, reference }    400 { ok: false, error, fields? }    429
 */

const RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 12 };
const MAX_NAIRA = 2_000_000_000;
const SLUG = /^[a-z0-9-]{2,40}$/;

function reference(): string {
  return `SB-BR-${Math.random().toString(36).toUpperCase().slice(2, 8)}`;
}

export async function POST(req: Request) {
  const limit = rateLimit(`build-request:${clientIp(req)}`, RATE_LIMIT);
  if (limit.limited) {
    return tooManyRequests("Too many requests from this connection. Please message us on WhatsApp.", limit.retryAfterSec);
  }

  const parsed = await readJson(req);
  if (!parsed.ok) return fail("Invalid request. Please refresh and try again.", 400);
  if (isHoneypotFilled(parsed.data)) {
    console.warn("[build-request] honeypot tripped from", clientIp(req));
    return Response.json({ ok: true, stored: false, reference: reference() });
  }

  const validated = validateFields(parsed.data, {
    location: requiredText("State", 2, 120),
    quoteCode: (v) => (cleanString(v, 40) ? null : "Quote code is missing — regenerate the quote and try again."),
  });
  if (!validated.ok) return fail("Please fix the highlighted fields.", 400, validated.errors as FieldErrors);

  const body = parsed.data;
  const naira = (v: unknown): number => {
    const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : NaN;
    return n >= 0 && n <= MAX_NAIRA ? n : 0;
  };
  const brandRaw = cleanString(body.brand, 40);
  const brand = SLUG.test(brandRaw) ? brandRaw : "";
  const budget = naira(body.budget);
  const totalBest = naira(body.totalBest);
  const totalLow = naira(body.totalLow);
  const totalHigh = naira(body.totalHigh);
  const tier = cleanString(body.tier, 20);
  const quoteCode = cleanString(body.quoteCode, 40);
  const quoteUrl = cleanString(body.quoteUrl, 300);
  const summary = cleanString(body.summary, 6000);
  const location = cleanString(body.location, 120);
  const appliances = cleanString(body.appliances, 1500);
  const ref = reference();

  const note = [
    brand ? `Brand: ${brand}` : "",
    budget ? `Budget: ₦${budget.toLocaleString()}` : "Budget: not given",
    appliances ? `Powering: ${appliances}` : "",
    "Came from the brand page; reply arrives on WhatsApp with this code.",
  ]
    .filter(Boolean)
    .join("\n");

  let stored = false;
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supaUrl && supaKey && !supaUrl.includes("your-project")) {
    try {
      const res = await fetch(`${supaUrl}/rest/v1/quote_requests`, {
        method: "POST",
        headers: {
          apikey: supaKey,
          Authorization: `Bearer ${supaKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          reference: ref,
          quote_code: quoteCode,
          // Both NOT NULL; the number arrives with the WhatsApp message.
          name: "",
          phone: "",
          location,
          note,
          tier,
          total_best: totalBest,
          total_low: totalLow,
          total_high: totalHigh,
          quote_url: quoteUrl,
          summary,
        }),
      });
      stored = res.ok;
      if (!res.ok) console.error("[build-request] Supabase insert failed:", res.status, await res.text());
    } catch (err) {
      console.error("[build-request] Supabase failed:", err);
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const { Resend } = await import("resend");
      await new Resend(apiKey).emails.send({
        from: FROM_EMAIL,
        to: LEAD_EMAILS,
        subject: `[SolarBuilders] Build request ${ref} — ${esc(brand || "no brand")} — ${esc(location)}`,
        html: `
          <h2>Build request — ${esc(ref)}</h2>
          <p><b>Quote code:</b> ${esc(quoteCode)}<br/>
             <b>Location:</b> ${esc(location)}<br/>
             <b>Estimate:</b> ₦${totalBest.toLocaleString()} (${esc(tier)})</p>
          <pre style="background:#f6f6f6;padding:12px;border-radius:8px;white-space:pre-wrap">${esc(note)}\n\n${esc(summary)}</pre>
          ${/^https:\/\//.test(quoteUrl) ? `<p><a href="${esc(quoteUrl)}">Open this quote</a></p>` : ""}
        `,
      });
    } catch (err) {
      console.error("[build-request] Resend failed:", err);
    }
  }

  await appendToSheet({
    type: "build_request",
    ref: `${ref} / ${quoteCode}`,
    name: null,
    phone: null,
    email: null,
    location,
    details: note,
    amount: totalBest,
    page: quoteUrl,
  });

  return Response.json({ ok: true, stored, reference: ref });
}
