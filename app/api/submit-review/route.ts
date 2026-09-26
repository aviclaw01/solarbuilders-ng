import {
  rateLimit,
  clientIp,
  tooManyRequests,
  readJson,
  fail,
  esc,
  insertLeadRow,
  isHoneypotFilled,
} from "@/lib/api";
import {
  validateFields,
  requiredText,
  optionalText,
  cleanString,
  type FieldErrors,
} from "@/lib/validation";
import { FROM_EMAIL, LEAD_EMAILS } from "@/lib/site";

/**
 * Review submission — forwarded to the team's inbox for moderation before
 * anything is published. Hardened like every public form: rate limit,
 * honeypot, per-field validation, HTML escaping, and the rating clamped to
 * 1–5 so a crafted payload can't put junk in the email.
 *
 *   200 { ok: true }   400 { ok: false, error, fields? }   429 { ok: false, error }
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
    builderName: requiredText("Builder", 1, 120),
    authorName: requiredText("Your name", 2, 80),
    location: optionalText("Location", 1, 80),
    reviewBody: requiredText("Review", 20, 3000),
  });
  if (!validated.ok) {
    return fail("Please fix the highlighted fields.", 400, validated.errors as FieldErrors);
  }

  const builderSlug = cleanString(parsed.data.builderSlug, 120);
  const builderName = cleanString(parsed.data.builderName, 120);
  const authorName = cleanString(parsed.data.authorName, 80);
  const location = cleanString(parsed.data.location, 80);
  const ratingNum = Number(parsed.data.rating);
  const rating = Number.isFinite(ratingNum) ? Math.max(1, Math.min(5, Math.round(ratingNum))) : 0;
  const reviewBody = cleanString(parsed.data.reviewBody, 3000);

  if (!rating) {
    return fail("Please choose a star rating.", 400, { rating: "Pick a rating from 1 to 5 stars." } as FieldErrors);
  }

  let emailed = false;
  let stored = false;

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: FROM_EMAIL,
        to: LEAD_EMAILS,
        subject: `New Review — ${builderName}`,
        html: `<p><b>Builder:</b> ${esc(builderName)} (${esc(builderSlug)})<br/><b>Author:</b> ${esc(authorName)}<br/><b>Location:</b> ${esc(location || "not given")}<br/><b>Rating:</b> ${rating}/5<br/><b>Review:</b><br/>${esc(reviewBody).replace(/\n/g, "<br/>")}</p>`,
      });
      emailed = true;
    } catch (err) {
      console.error("[submit-review] Resend failed:", err);
    }
  } else {
    console.warn("[submit-review] RESEND_API_KEY not set — relying on the DB sink");
  }

  stored = await insertLeadRow("reviews", {
    builder_slug: builderSlug || null,
    builder_name: builderName,
    author_name: authorName,
    location: location || null,
    rating,
    body: reviewBody,
  });

  if (!emailed && !stored) {
    return fail("We couldn't send your review just now. Please try again in a minute.", 500);
  }

  return Response.json({ ok: true, emailed, stored });
}

