import {
  rateLimit,
  clientIp,
  tooManyRequests,
  readJson,
  fail,
  esc,
  isHoneypotFilled,
} from "@/lib/api";
import { validateFields, requiredText, requiredEmail, optionalPhone, type FieldErrors } from "@/lib/validation";
import { FROM_EMAIL, LEAD_EMAILS } from "@/lib/site";
import { storeLead } from "@/lib/leads";

/**
 * Contact form → email to the team.
 *
 * Rate-limited, honeypotted and validated per field; every value is HTML-
 * escaped before it touches the email template. The client renders the same
 * per-field messages from lib/validation.ts while typing, so a 400 with
 * `fields` should be rare — it is the authoritative backstop, not the UX.
 *
 *   200 { ok: true }   400 { ok: false, error, fields? }   429 { ok: false, error }
 */

export const dynamic = "force-dynamic";

const RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 5 };
const RULES = {
  name: requiredText("Name", 2, 100),
  email: requiredEmail("Email"),
  phone: optionalPhone(),
  message: requiredText("Message", 10, 5000),
};

export async function POST(req: Request) {
  const limit = rateLimit(`contact:${clientIp(req)}`, RATE_LIMIT);
  if (limit.limited) {
    return tooManyRequests(
      "Too many messages from this connection. Please wait a few minutes, or reach us on WhatsApp.",
      limit.retryAfterSec,
    );
  }

  const parsed = await readJson(req);
  if (!parsed.ok) return fail("Invalid request. Please refresh and try again.", 400);

  if (isHoneypotFilled(parsed.data)) {
    console.warn("[contact] honeypot tripped from", clientIp(req));
    return Response.json({ ok: true });
  }

  const validated = validateFields(parsed.data, RULES);
  if (!validated.ok) {
    return fail("Please fix the highlighted fields.", 400, validated.errors as FieldErrors);
  }

  const { name, email, phone, message } = parsed.data;
  const clean = {
    name: String(name).trim().slice(0, 100),
    email: String(email).trim().slice(0, 254),
    phone: String(phone ?? "").trim().slice(0, 30),
    message: String(message).trim().slice(0, 5000),
  };

  // Store first, so a Resend outage does not lose the message. Someone who
  // fills in a contact form and hears nothing does not fill it in again.
  const stored = await storeLead({
    kind: "contact",
    name: clean.name,
    email: clean.email,
    phone: clean.phone || null,
    message: clean.message,
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
        replyTo: clean.email,
        subject: `[SolarBuilders] Contact: ${clean.name}`,
        html: `<h2>New Contact Message</h2><p><b>Name:</b> ${esc(clean.name)}<br/><b>Email:</b> ${esc(clean.email)}<br/><b>Phone:</b> ${clean.phone ? esc(clean.phone) : "Not provided"}<br/><b>Message:</b><br/>${esc(clean.message).replace(/\n/g, "<br/>")}</p>`,
      });
      emailed = true;
    } catch (err) {
      console.error("[contact] Resend failed:", err);
    }
  } else {
    console.warn("[contact] RESEND_API_KEY not set — message NOT emailed");
  }

  if (!emailed && !stored) {
    return fail("We couldn't send your message just now. Please try again, or message us on WhatsApp.", 500);
  }

  return Response.json({ ok: true, emailed, stored });
}

