import { Resend } from "resend";
import { FROM_EMAIL, LEAD_EMAILS } from "@/lib/site";

/**
 * Receives a quote request from the calculator's "Contact us" form.
 * 1. Emails the team via Resend (if RESEND_API_KEY is set)
 * 2. Inserts a row into Supabase `quote_requests` (if Supabase env is set)
 * The client then opens WhatsApp with the same details prefilled.
 *
 * Returns { ok, emailed, stored } so the client can tell the user honestly
 * what happened instead of pretending.
 */

interface QuoteRequestBody {
  name: string;
  phone: string;
  email?: string;
  location: string;
  note?: string;
  quoteCode: string;
  quoteUrl: string;
  tier: string;
  totalBest: number;
  totalLow: number;
  totalHigh: number;
  summary: string; // plain-text BOM
}

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(req: Request) {
  let body: QuoteRequestBody;
  try {
    body = (await req.json()) as QuoteRequestBody;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { name, phone, email, location, note, quoteCode, quoteUrl, tier, totalBest, totalLow, totalHigh, summary } =
    body;

  if (!name?.trim() || !phone?.trim() || !location?.trim() || !quoteCode) {
    return Response.json({ ok: false, error: "name, phone, location and quoteCode are required" }, { status: 400 });
  }

  let emailed = false;
  let stored = false;

  // 1. Email
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: FROM_EMAIL,
        to: LEAD_EMAILS,
        replyTo: email?.trim() || undefined,
        subject: `[SolarBuilders] 🔥 Quote request ${quoteCode} — ${esc(location)} — ₦${Math.round(totalBest).toLocaleString()}`,
        html: `
          <h2>New quote request — ${esc(quoteCode)}</h2>
          <p><b>Name:</b> ${esc(name)}<br/>
             <b>WhatsApp:</b> <a href="https://wa.me/${esc(phone.replace(/\D/g, ""))}">${esc(phone)}</a><br/>
             <b>Email:</b> ${esc(email || "not provided")}<br/>
             <b>Location:</b> ${esc(location)}<br/>
             <b>Tier:</b> ${esc(tier)}<br/>
             <b>Estimate:</b> ₦${Math.round(totalBest).toLocaleString()} (₦${Math.round(totalLow).toLocaleString()} – ₦${Math.round(totalHigh).toLocaleString()})</p>
          ${note ? `<p><b>Note from customer:</b><br/>${esc(note)}</p>` : ""}
          <pre style="background:#f6f6f6;padding:12px;border-radius:8px;white-space:pre-wrap">${esc(summary)}</pre>
          <p><a href="${esc(quoteUrl)}">Open this quote on the site</a></p>
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
          quote_code: quoteCode,
          name: name.trim(),
          phone: phone.trim(),
          email: email?.trim() || null,
          location: location.trim(),
          note: note?.trim() || null,
          tier,
          total_best: Math.round(totalBest),
          total_low: Math.round(totalLow),
          total_high: Math.round(totalHigh),
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

  return Response.json({ ok: true, emailed, stored });
}
