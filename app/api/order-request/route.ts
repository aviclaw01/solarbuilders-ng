import {
  rateLimit,
  clientIp,
  tooManyRequests,
  readJson,
  fail,
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
import { Resend } from "resend";
import { FROM_EMAIL, LEAD_EMAILS } from "@/lib/site";
import { findProduct, midPrice } from "@/lib/cart";

/**
 * Shop cart → order request.
 *
 * We take no payment. This records what the customer wants, emails the team and
 * stores it so we can confirm today's price with the distributor and come back
 * with a final figure.
 *
 * Prices are recomputed SERVER-SIDE from the catalogue. The client sends
 * brandSlug + model + qty only — never a price — so a tampered payload cannot
 * put a made-up figure in front of us.
 *
 * Hardened: rate-limited per IP, honeypotted, validated per field, line keys
 * cleaned to catalogue-shaped slugs, all text length-capped and escaped.
 *
 *   200 { ok, reference, emailed, stored, totals, lines }
 *   400 { ok: false, error, fields? }
 *   429 { ok: false, error }
 */

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function reference(): string {
  return `SB-ORD-${Math.random().toString(36).toUpperCase().slice(2, 8)}`;
}

const RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 8 };

/** A catalogue slug/model is [a-z0-9-] — anything else can't match anyway. */
function cleanKey(v: unknown, max: number): string {
  const s = cleanString(v, max).toLowerCase();
  return /^[a-z0-9][a-z0-9-]*$/.test(s) ? s : "";
}

export async function POST(req: Request) {
  const limit = rateLimit(`order-request:${clientIp(req)}`, RATE_LIMIT);
  if (limit.limited) {
    return tooManyRequests(
      "Too many order requests from this connection in the last hour. Please try again later, or message us on WhatsApp.",
      limit.retryAfterSec,
    );
  }

  const parsed = await readJson(req);
  if (!parsed.ok) return fail("Invalid request. Please refresh and try again.", 400);
  if (isHoneypotFilled(parsed.data)) {
    console.warn("[order-request] honeypot tripped from", clientIp(req));
    return Response.json({ ok: true, reference: "SB-ORD-000000", emailed: false, stored: false });
  }

  const body = parsed.data;

  const validated = validateFields(body, {
    name: requiredText("Name", 2, 100),
    phone: requiredPhone("WhatsApp number"),
    email: optionalEmail("Email"),
    location: requiredText("Location", 2, 120),
  });
  if (!validated.ok) {
    return fail("Please fix the highlighted fields.", 400, validated.errors as FieldErrors);
  }

  const name = cleanString(body.name, 100);
  const phone = cleanString(body.phone, 30);
  const email = cleanString(body.email, 254) || undefined;
  const location = cleanString(body.location, 120);
  const note = cleanString(body.note, 2000) || undefined;
  const quoteCode = cleanString(body.quoteCode, 40) || undefined;
  const needsInstall = body.needsInstall !== false;

  if (!Array.isArray(body.lines) || body.lines.length === 0) {
    return fail("The order is empty — add equipment before sending.", 400);
  }
  if (body.lines.length > 50) {
    return fail("Too many lines — split the order or contact us for bulk pricing.", 400);
  }

  // Re-price from the catalogue; drop anything we don't actually sell.
  // brandSlug/model are cleaned to catalogue keys so junk can't reach the
  // email or database; qty is clamped to 1–99.
  const priced = (body.lines as unknown[]).flatMap((raw) => {
    if (raw === null || typeof raw !== "object") return [];
    const l = raw as Record<string, unknown>;
    const found = findProduct(cleanKey(l.brandSlug, 80), cleanKey(l.model, 80));
    if (!found) return [];
    const qty = Math.max(1, Math.min(99, Math.round(Number(l.qty)) || 1));
    const { brand, product } = found;
    return [
      {
        brandSlug: brand.slug,
        brandName: brand.name,
        model: product.model,
        spec: product.spec,
        qty,
        unitLow: product.priceLow,
        unitHigh: product.priceHigh,
        lineBest: midPrice(product) * qty,
      },
    ];
  });

  if (priced.length === 0) {
    return Response.json({ ok: false, error: "None of those items are in the catalogue" }, { status: 400 });
  }

  const totals = priced.reduce(
    (a, l) => ({
      low: a.low + l.unitLow * l.qty,
      best: a.best + l.lineBest,
      high: a.high + l.unitHigh * l.qty,
      items: a.items + l.qty,
    }),
    { low: 0, best: 0, high: 0, items: 0 },
  );

  const ref = reference();
  let emailed = false;
  let stored = false;

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      const rows = priced
        .map(
          (l) =>
            `<tr><td>${l.qty}×</td><td>${esc(l.brandName)} ${esc(l.model)}<br/><small>${esc(l.spec)}</small></td><td align="right">₦${l.lineBest.toLocaleString()}</td></tr>`,
        )
        .join("");
      await resend.emails.send({
        from: FROM_EMAIL,
        to: LEAD_EMAILS,
        replyTo: email,
        subject: `[SolarBuilders] 🛒 Order request ${ref} — ${esc(location)} — ₦${totals.best.toLocaleString()}`,
        html: `
          <h2>Order request ${esc(ref)}</h2>
          <p><b>Name:</b> ${esc(name)}<br/>
             <b>WhatsApp:</b> <a href="https://wa.me/${esc(phone.replace(/\D/g, ""))}">${esc(phone)}</a><br/>
             <b>Email:</b> ${esc(email || "not provided")}<br/>
             <b>Location:</b> ${esc(location)}<br/>
             <b>Installation wanted:</b> ${needsInstall ? "Yes" : "No, supply only"}<br/>
             ${quoteCode ? `<b>From quote:</b> ${esc(quoteCode)}<br/>` : ""}
             <b>Equipment total (midpoint):</b> ₦${totals.best.toLocaleString()} (₦${totals.low.toLocaleString()} – ₦${totals.high.toLocaleString()})</p>
          ${note ? `<p><b>Note:</b><br/>${esc(note)}</p>` : ""}
          <table cellpadding="6" border="0" style="border-collapse:collapse;background:#f6f6f6">${rows}</table>
          <p><small>Prices are our catalogue midpoints. Confirm with the distributor before quoting the customer.</small></p>
        `,
      });
      emailed = true;
    } catch (err) {
      console.error("[order-request] Resend failed:", err);
    }
  } else {
    console.warn("[order-request] RESEND_API_KEY not set — order", ref, "was NOT emailed");
  }

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supaUrl && supaKey && !supaUrl.includes("your-project")) {
    try {
      const res = await fetch(`${supaUrl}/rest/v1/order_requests`, {
        method: "POST",
        headers: {
          apikey: supaKey,
          Authorization: `Bearer ${supaKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          reference: ref,
          name,
          phone,
          email: email || null,
          location,
          note: note || null,
          lines: priced,
          item_count: totals.items,
          total_low: totals.low,
          total_best: totals.best,
          total_high: totals.high,
          quote_code: quoteCode || null,
          needs_install: needsInstall,
        }),
      });
      stored = res.ok;
      if (!res.ok) console.error("[order-request] Supabase insert failed:", res.status, await res.text());
    } catch (err) {
      console.error("[order-request] Supabase failed:", err);
    }
  }

  return Response.json({ ok: true, reference: ref, emailed, stored, totals, lines: priced });
}
