import {
  rateLimit,
  clientIp,
  tooManyRequests,
  readJson,
  fail,
  esc,
  isHoneypotFilled,
} from "@/lib/api";
import {
  validateFields,
  requiredText,
  requiredPhone,
  optionalEmail,
  cleanString,
  type FieldErrors,
} from "@/lib/validation";
import { FROM_EMAIL, LEAD_EMAILS } from "@/lib/site";

/**
 * Receives a quote request from the calculator's "Contact us" form.
 * 1. Emails the team via Resend (if RESEND_API_KEY is set)
 * 2. Inserts a row into Supabase `quote_requests` (if Supabase env is set)
 * The client then opens WhatsApp with the same details prefilled.
 *
 * Returns { ok, emailed, stored } so the client can tell the user honestly
 * what happened instead of pretending.
 *
 * Hardened: rate-limited per IP, honeypotted, validated per field, totals
 * coerced to bounded numbers (never trusted from the client), summary
 * length-capped, every interpolated value HTML-escaped, and the quote link
 * only rendered when it is an https URL.
 *
 *   200 { ok, emailed, stored }    400 { ok: false, error, fields? }    429 { ok: false, error }
 */

const RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 8 };
const MAX_NAIRA = 2_000_000_000; // ₦2bn — beyond any system we quote; garbage filter

/**
 * Request reference, minted HERE — #21. `quote.code` is a content hash of the
 * appliance list, so two customers who pick the same appliances get the same
 * code (the "Typical home" preset guarantees it). The content hash stays on
 * the share link; a submitted request gets this unique reference instead, so
 * the team can tell customers apart in the inbox, the dashboard and on a
 * routed job.
 */
function reference(): string {
  return `SB-QR-${Math.random().toString(36).toUpperCase().slice(2, 8)}`;
}

export async function POST(req: Request) {
  const limit = rateLimit(`quote-request:${clientIp(req)}`, RATE_LIMIT);
  if (limit.limited) {
    return tooManyRequests(
      "Too many quote requests from this connection in the last hour. Please try again later, or message us on WhatsApp.",
      limit.retryAfterSec,
    );
  }

  const parsed = await readJson(req);
  if (!parsed.ok) return fail("Invalid request. Please refresh and try again.", 400);
  if (isHoneypotFilled(parsed.data)) {
    console.warn("[quote-request] honeypot tripped from", clientIp(req));
    return Response.json({ ok: true, emailed: false, stored: false });
  }

  const validated = validateFields(parsed.data, {
    name: requiredText("Name", 2, 100),
    phone: requiredPhone("WhatsApp number"),
    email: optionalEmail("Email"),
    location: requiredText("Location", 2, 120),
    quoteCode: (v) => {
      const s = cleanString(v, 40);
      if (!s) return "Quote code is missing — regenerate the quote and try again.";
      return null;
    },
  });
  if (!validated.ok) {
    return fail("Please fix the highlighted fields.", 400, validated.errors as FieldErrors);
  }

  const body = parsed.data;
  // Numbers arrive from our own quote builder, but the client is untrusted —
  // coerce and bound them rather than trusting the JSON shape.
  const naira = (v: unknown): number => {
    const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : NaN;
    return n >= 0 && n <= MAX_NAIRA ? n : 0;
  };
  const totalBest = naira(body.totalBest);
  const totalLow = naira(body.totalLow);
  const totalHigh = naira(body.totalHigh);
  const tier = cleanString(body.tier, 20);
  const quoteCode = cleanString(body.quoteCode, 40);
  const quoteUrl = cleanString(body.quoteUrl, 300);
  const summary = cleanString(body.summary, 6000);
  const name = cleanString(body.name, 100);
  const phone = cleanString(body.phone, 30);
  const email = cleanString(body.email, 254) || undefined;
  const location = cleanString(body.location, 120);
  const note = cleanString(body.note, 2000) || undefined;

  let emailed = false;
  let stored = false;
  const ref = reference();

  // 1. Email
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: FROM_EMAIL,
        to: LEAD_EMAILS,
        replyTo: email,
        subject: `[SolarBuilders] 🔥 Quote request ${ref} — ${esc(location)} — ₦${totalBest.toLocaleString()}`,
        html: `
          <h2>New quote request — ${esc(ref)}</h2>
          <p><b>Request reference:</b> ${esc(ref)}<br/>
             <b>Quote code:</b> ${esc(quoteCode)}<br/>
             <b>Name:</b> ${esc(name)}<br/>
             <b>WhatsApp:</b> <a href="https://wa.me/${esc(phone.replace(/\D/g, ""))}">${esc(phone)}</a><br/>
             <b>Email:</b> ${esc(email || "not provided")}<br/>
             <b>Location:</b> ${esc(location)}<br/>
             <b>Tier:</b> ${esc(tier)}<br/>
             <b>Estimate:</b> ₦${totalBest.toLocaleString()} (₦${totalLow.toLocaleString()} – ₦${totalHigh.toLocaleString()})</p>
          ${note ? `<p><b>Note from customer:</b><br/>${esc(note).replace(/\n/g, "<br/>")}</p>` : ""}
          <pre style="background:#f6f6f6;padding:12px;border-radius:8px;white-space:pre-wrap">${esc(summary)}</pre>
          ${/^https:\/\//.test(quoteUrl) ? `<p><a href="${esc(quoteUrl)}">Open this quote on the site</a></p>` : ""}
        `,
      });
      emailed = true;
    } catch (err) {
      console.error("[quote-request] Resend failed:", err);
    }
  } else {
    console.warn("[quote-request] RESEND_API_KEY not set — quote", quoteCode, "from", phone, "was NOT emailed");
  }

  // 2. Supabase (optional)
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
          name,
          phone,
          email: email || null,
          location,
          note: note || null,
          tier,
          total_best: totalBest,
          total_low: totalLow,
          total_high: totalHigh,
          quote_url: quoteUrl,
          summary,
        }),
      });
      stored = res.ok;
      if (!res.ok) console.error("[quote-request] Supabase insert failed:", res.status, await res.text());
    } catch (err) {
      console.error("[quote-request] Supabase failed:", err);
    }
  }

  return Response.json({ ok: true, emailed, stored, reference: ref });
}
