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
  optionalText,
  requiredPhone,
  cleanString,
  type FieldErrors,
} from "@/lib/validation";
import { FROM_EMAIL, LEAD_EMAILS } from "@/lib/site";
import { storeLead } from "@/lib/leads";

/**
 * Customer review — the form at /reviews (app/reviews/ReviewForm.tsx), the
 * link we send customers after an install.
 *
 * MODERATED, NEVER SELF-PUBLISHING. The row lands in `leads` (kind `review`,
 * status `new`) on the /admin/leads desk and in the team's inbox. Nothing on
 * the site reads reviews back out; publishing one is a deliberate human step
 * after checking the WhatsApp number against a real job. The number is for
 * that check only and is never shown.
 *
 * Hardened like every public form: rate limit, honeypot, per-field
 * validation, HTML escaping, and the rating clamped to 1–5.
 *
 *   200 { ok: true, emailed, stored }   400 { ok: false, error, fields? }
 *   429 { ok: false, error }            500 { ok: false, error }
 */

export const dynamic = "force-dynamic";

const RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 3 };

export async function POST(req: Request) {
  const limit = rateLimit(`submit-review:${clientIp(req)}`, RATE_LIMIT);
  if (limit.limited) {
    return tooManyRequests(
      "Too many reviews from this connection. Please try again later, or message us on WhatsApp.",
      limit.retryAfterSec,
    );
  }

  const parsed = await readJson(req);
  if (!parsed.ok) return fail("Invalid request. Please refresh and try again.", 400);

  if (isHoneypotFilled(parsed.data)) {
    console.warn("[submit-review] honeypot tripped from", clientIp(req));
    return Response.json({ ok: true });
  }

  const validated = validateFields(parsed.data, {
    authorName: requiredText("Your name", 2, 80),
    whatsapp: requiredPhone("WhatsApp number"),
    location: optionalText("Location", 2, 80),
    installer: optionalText("Installer", 2, 120),
    reviewBody: requiredText("Review", 20, 3000),
  });
  if (!validated.ok) {
    return fail("Please fix the highlighted fields.", 400, validated.errors as FieldErrors);
  }

  const authorName = cleanString(parsed.data.authorName, 80);
  const whatsapp = cleanString(parsed.data.whatsapp, 30);
  const location = cleanString(parsed.data.location, 80);
  const installer = cleanString(parsed.data.installer, 120);
  const ratingNum = Number(parsed.data.rating);
  const rating = Number.isFinite(ratingNum) ? Math.max(1, Math.min(5, Math.round(ratingNum))) : 0;
  const reviewBody = cleanString(parsed.data.reviewBody, 3000);

  if (!rating) {
    return fail("Please choose a star rating.", 400, { rating: "Pick a rating from 1 to 5 stars." } as FieldErrors);
  }

  const stored = await storeLead({
    kind: "review",
    name: authorName,
    phone: whatsapp,
    location: location || null,
    message: `${rating}/5${installer ? ` — installer: ${installer}` : ""}\n\n${reviewBody}`,
    payload: { rating, installer: installer || null, moderation: "pending" },
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
        subject: `[SolarBuilders] New review (${rating}/5) — moderate before use`,
        html: `<h2>New customer review — not published</h2><p><b>Name:</b> ${esc(authorName)}<br/><b>WhatsApp:</b> ${esc(whatsapp)}<br/><b>Location:</b> ${esc(location || "not given")}<br/><b>Installer:</b> ${esc(installer || "not given")}<br/><b>Rating:</b> ${rating}/5</p><p>${esc(reviewBody).replace(/\n/g, "<br/>")}</p><p>Check the number against a real job before using this anywhere.</p>`,
      });
      emailed = true;
    } catch (err) {
      console.error("[submit-review] Resend failed:", err);
    }
  } else {
    console.warn("[submit-review] RESEND_API_KEY not set — relying on the DB sink");
  }

  if (!emailed && !stored) {
    return fail("We couldn't send your review just now. Please try again in a minute.", 500);
  }

  return Response.json({ ok: true, emailed, stored });
}
