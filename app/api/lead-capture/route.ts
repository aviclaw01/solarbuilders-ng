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
  requiredPhone,
  requiredState,
  type FieldErrors,
} from "@/lib/validation";
import { FROM_EMAIL, LEAD_EMAILS } from "@/lib/site";

/**
 * Calculator lead capture (the "want us to size it for you?" modal).
 *
 * Same contract as api/contact: rate-limited, honeypotted, validated per field
 * server-side, everything escaped before it reaches the email template.
 * The modal's system-size picker is a fixed list — enforced here, so a crafted
 * payload can't inject arbitrary text into the subject line.
 *
 *   200 { ok: true }   400 { ok: false, error, fields? }   429 { ok: false, error }
 */

export const dynamic = "force-dynamic";

const RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 5 };
const SYSTEM_SIZES = [
  "Not sure yet",
  "1–2kVA (small home)",
  "3–5kVA (medium home)",
  "5–10kVA (large home/office)",
  "10kVA+ (commercial)",
];

export async function POST(req: Request) {
  const limit = rateLimit(`lead-capture:${clientIp(req)}`, RATE_LIMIT);
  if (limit.limited) {
    return tooManyRequests(
      "Too many requests from this connection. Please wait a few minutes, or reach us on WhatsApp.",
      limit.retryAfterSec,
    );
  }

  const parsed = await readJson(req);
  if (!parsed.ok) return fail("Invalid request. Please refresh and try again.", 400);

  if (isHoneypotFilled(parsed.data)) {
    console.warn("[lead-capture] honeypot tripped from", clientIp(req));
    return Response.json({ ok: true });
  }

  const validated = validateFields(parsed.data, {
    whatsapp: requiredPhone("WhatsApp number"),
    state: requiredState("State"),
    systemSize: (v) => {
      const s = typeof v === "string" ? v.trim() : "";
      if (!s) return "System size is required.";
      if (!SYSTEM_SIZES.includes(s)) return "Pick a system size from the list.";
      return null;
    },
  });
  if (!validated.ok) {
    return fail("Please fix the highlighted fields.", 400, validated.errors as FieldErrors);
  }

  const whatsapp = String(parsed.data.whatsapp).trim().slice(0, 30);
  const state = String(parsed.data.state).trim();
  const systemSize = String(parsed.data.systemSize).trim();

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: FROM_EMAIL,
        to: LEAD_EMAILS,
        subject: `[SolarBuilders] 🔥 New Lead — ${state} — ${systemSize}`,
        html: `<h2>New Lead from Calculator</h2><p><b>WhatsApp:</b> ${esc(whatsapp)}<br/><b>State:</b> ${esc(state)}<br/><b>System Size:</b> ${esc(systemSize)}</p>`,
      });
    } catch (err) {
      console.error("[lead-capture] Resend failed:", err);
      return fail("We couldn't send that just now. Please try again in a minute, or message us on WhatsApp.", 500);
    }
  } else {
    console.warn("[lead-capture] RESEND_API_KEY not set — lead NOT emailed");
    return fail("We couldn't send that just now. Please try again in a minute, or message us on WhatsApp.", 500);
  }

  return Response.json({ ok: true });
}

