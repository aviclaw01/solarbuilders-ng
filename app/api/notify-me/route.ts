import {
  rateLimit,
  clientIp,
  tooManyRequests,
  readJson,
  fail,
  esc,
  isHoneypotFilled,
} from "@/lib/api";
import { validateFields, requiredEmail, optionalText, cleanString, type FieldErrors } from "@/lib/validation";
import { FROM_EMAIL, LEAD_EMAILS } from "@/lib/site";

/**
 * "Notify me" signup — a bare email (plus optional location) for visitors who
 * want a nudge when new prices or brands land.
 *
 * There is no mail-out infrastructure yet, so requests are acknowledged,
 * rate-limited and emailed to the team like every other lead rather than
 * silently vanishing into an unused table.
 *
 *   200 { ok: true }   400 { ok: false, error, fields? }   429 { ok: false, error }
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
    email: requiredEmail("Email"),
    location: optionalText("Location", 1, 80),
  });
  if (!validated.ok) {
    return fail("Please fix the highlighted fields.", 400, validated.errors as FieldErrors);
  }

  const email = cleanString(parsed.data.email, 254);
  const location = cleanString(parsed.data.location, 80);

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: FROM_EMAIL,
        to: LEAD_EMAILS,
        replyTo: email,
        subject: `[SolarBuilders] Notify Me — ${location || "location not given"}`,
        html: `<h2>Notify Me Request</h2><p><b>Email:</b> ${esc(email)}<br/><b>Location:</b> ${esc(location || "not given")}</p>`,
      });
    } catch (err) {
      console.error("[notify-me] Resend failed:", err);
      return fail("We couldn't save that just now. Please try again in a minute.", 500);
    }
  } else {
    console.warn("[notify-me] RESEND_API_KEY not set — signup NOT emailed:", email);
  }

  return Response.json({ ok: true });
}

