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
 */

interface IncomingLine {
  brandSlug: string;
  model: string;
  qty: number;
}

interface OrderRequestBody {
  name: string;
  phone: string;
  email?: string;
  location: string;
  note?: string;
  lines: IncomingLine[];
  quoteCode?: string;
  needsInstall?: boolean;
}

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function reference(): string {
  return `SB-ORD-${Math.random().toString(36).toUpperCase().slice(2, 8)}`;
}

export async function POST(req: Request) {
  let body: OrderRequestBody;
  try {
    body = (await req.json()) as OrderRequestBody;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { name, phone, email, location, note, quoteCode, needsInstall = true } = body;
  if (!name?.trim() || !phone?.trim() || !location?.trim()) {
    return Response.json({ ok: false, error: "name, phone and location are required" }, { status: 400 });
  }
  if (!Array.isArray(body.lines) || body.lines.length === 0) {
    return Response.json({ ok: false, error: "The order is empty" }, { status: 400 });
  }
  if (body.lines.length > 50) {
    return Response.json({ ok: false, error: "Too many lines" }, { status: 400 });
  }

  // Re-price from the catalogue; drop anything we don't actually sell.
  const priced = body.lines.flatMap((l) => {
    const found = findProduct(String(l.brandSlug), String(l.model));
    const qty = Math.max(1, Math.min(99, Number(l.qty) || 1));
    if (!found) return [];
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
        replyTo: email?.trim() || undefined,
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
          name: name.trim(),
          phone: phone.trim(),
          email: email?.trim() || null,
          location: location.trim(),
          note: note?.trim() || null,
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
