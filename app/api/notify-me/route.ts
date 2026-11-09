import {
  rateLimit,
  clientIp,
  tooManyRequests,
  readJson,
  fail,
  esc,
  isHoneypotFilled,
} from "@/lib/api";
import { validateFields, requiredPhone, cleanString, type FieldErrors } from "@/lib/validation";
import { FROM_EMAIL, LEAD_EMAILS } from "@/lib/site";
import { storeLead } from "@/lib/leads";

/**
 * Price watch — "message me on WhatsApp when these prices change".
 * Called by components/ui/PriceWatch.tsx on the brand pages and price guides.
 *
 * There is no automated mail-out. The row lands in `leads` (kind
 * `price_watch`) where the /admin/leads desk shows it next to every other
 * enquiry, and the team messages the number by hand after a price check.
 * The form says exactly that, so nobody is promised an alert system.
 *
 * Same two independent sinks as api/lead-capture: row AND email, and the
 * answer says which worked.
 *
 *   200 { ok: true, emailed, stored }   400 { ok: false, error, fields? }
 *   429 { ok: false, error }            500 { ok: false, error }
 */

export const dynamic = "force-dynamic";

const RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 4 };

export async function POST(req: Request) {
  const limit = rateLimit(`notify-me:${clientIp(req)}`, RATE_LIMIT);
  if (limit.limited) {
    return tooManyRequests(
      "Too many signups from this connection. Please try again later, or message us on WhatsApp.",
      limit.retryAfterSec,
    );
  }

  const parsed = await readJson(req);
  if (!parsed.ok) return fail("Invalid request. Please refresh and try again.", 400);

  if (isHoneypotFilled(parsed.data)) {
    console.warn("[notify-me] honeypot tripped from", clientIp(req));
    return Response.json({ ok: true });
  }

  const validated = validateFields(parsed.data, {
    whatsapp: requiredPhone("WhatsApp number"),
  });
  if (!validated.ok) {
    return fail("Please fix the highlighted fields.", 400, validated.errors as FieldErrors);
  }

  const whatsapp = cleanString(parsed.data.whatsapp, 30);
  // What they want to hear about, e.g. "Felicity prices"; `source` is the page.
  const topic = cleanString(parsed.data.topic, 120) || "solar prices";
  const source = cleanString(parsed.data.source, 120);

  const stored = await storeLead({
    kind: "price_watch",
    phone: whatsapp,
    message: `Message me when ${topic} change.`,
    payload: { topic, source },
  });

  let emailed = false;
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: FROM_EMAIL,
        to: LEAD_EMAILS,
        subject: `[SolarBuilders] Price watch — ${topic}`,
        html: `<h2>Price watch signup</h2><p><b>WhatsApp:</b> ${esc(whatsapp)}<br/><b>Wants:</b> ${esc(topic)}<br/><b>Page:</b> ${esc(source || "not given")}</p><p>Message them by hand after the next price check.</p>`,
      });
      emailed = true;
    } catch (err) {
      console.error("[notify-me] Resend failed:", err);
    }
  } else {
    console.warn("[notify-me] RESEND_API_KEY not set — relying on the DB sink");
  }

  if (!emailed && !stored) {
    return fail("We couldn't save that just now. Please try again in a minute, or message us on WhatsApp.", 500);
  }

  return Response.json({ ok: true, emailed, stored });
}
