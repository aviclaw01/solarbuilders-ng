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
  optionalEmail,
  requiredPhone,
  requiredState,
  cleanString,
  type FieldErrors,
} from "@/lib/validation";
import { FROM_EMAIL, LEAD_EMAILS } from "@/lib/site";

/**
 * Old "work with us" intake, kept for backwards compatibility: it forwards
 * straight to the team's inbox. The full pipeline (verification, references,
 * the verified badge) now lives at /for-builders → api/partner-apply.
 *
 * Hardened to the same standard as the rest of the API: rate limit, honeypot,
 * per-field validation, HTML escaping. `services`/`systemSizes` are coerced to
 * known-safe strings before they are interpolated.
 *
 *   200 { ok: true }   400 { ok: false, error, fields? }   429 { ok: false, error }
 */

export const dynamic = "force-dynamic";

const RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 3 };

const BUSINESS_TYPE_LABEL: Record<string, string> = {
  installer: "Installer",
  vendor: "Vendor / distributor",
  both: "Installer and vendor",
  manufacturer: "Manufacturer / distributor",
};

/** Whitelist for list-shaped fields — never interpolate raw client items. */
const KNOWN_SERVICES = [
  "full_install", "repair", "parts", "prebuilt", "survey",
  "installation", "maintenance", "sales",
];
const KNOWN_SIZES = ["1–2kVA", "3–5kVA", "5–10kVA", "10kVA+"];

function cleanList(v: unknown, known: string[]): string {
  const items = Array.isArray(v) ? v : typeof v === "string" ? [v] : [];
  return items
    .map((i) => (typeof i === "string" ? i.trim() : ""))
    .filter((i) => known.includes(i))
    .join(", ");
}

export async function POST(req: Request) {
  const limit = rateLimit(`builder-signup:${clientIp(req)}`, RATE_LIMIT);
  if (limit.limited) {
    return tooManyRequests(
      "Too many applications from this connection in the last hour. Please try again later, or message us on WhatsApp.",
      limit.retryAfterSec,
    );
  }

  const parsed = await readJson(req);
  if (!parsed.ok) return fail("Invalid request. Please refresh and try again.", 400);

  if (isHoneypotFilled(parsed.data)) {
    console.warn("[builder-signup] honeypot tripped from", clientIp(req));
    return Response.json({ ok: true });
  }

  const validated = validateFields(parsed.data, {
    businessName: requiredText("Business name", 2, 120),
    contactEmail: optionalEmail("Contact email"),
    whatsapp: requiredPhone("WhatsApp number"),
    state: requiredState(),
  });
  if (!validated.ok) {
    return fail("Please fix the highlighted fields.", 400, validated.errors as FieldErrors);
  }

  const businessType = cleanString(parsed.data.businessType, 30);
  const typeLabel = BUSINESS_TYPE_LABEL[businessType] ?? "Not specified";
  const businessName = cleanString(parsed.data.businessName, 120);
  const contactEmail = cleanString(parsed.data.contactEmail, 254);
  const whatsapp = cleanString(parsed.data.whatsapp, 30);
  const city = cleanString(parsed.data.city, 80);
  const state = cleanString(parsed.data.state, 40);
  const yearsInBusiness = cleanString(parsed.data.yearsInBusiness, 40);
  const services = cleanList(parsed.data.services, KNOWN_SERVICES);
  const systemSizes = cleanList(parsed.data.systemSizes, KNOWN_SIZES);
  const startingPrice = cleanString(parsed.data.startingPrice, 40);
  const bio = cleanString(parsed.data.bio, 2000);
  const instagram = cleanString(parsed.data.instagram, 200);

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: FROM_EMAIL,
        to: LEAD_EMAILS,
        replyTo: contactEmail || undefined,
        subject: `[SolarBuilders] Work-with-us application (${typeLabel}) — ${businessName}`,
        html: `
          <h2>New installer / vendor application (legacy form)</h2>
          <p><b>Business type:</b> ${esc(typeLabel)}</p>
          <p><b>Business name:</b> ${esc(businessName)}</p>
          <p><b>Contact email:</b> ${esc(contactEmail || "Not provided")}</p>
          <p><b>WhatsApp:</b> ${esc(whatsapp)}</p>
          <p><b>City / State:</b> ${esc(city || "-")} / ${esc(state)}</p>
          <p><b>Years in business:</b> ${esc(yearsInBusiness)}</p>
          <p><b>Services:</b> ${esc(services || "Not specified")}</p>
          <p><b>System sizes:</b> ${esc(systemSizes || "Not specified")}</p>
          <p><b>Typical 5kVA price:</b> ${esc(startingPrice || "Not provided")}</p>
          <p><b>Description:</b> ${esc(bio || "Not provided").replace(/\n/g, "<br/>")}</p>
          <p><b>Website / Instagram:</b> ${esc(instagram || "Not provided")}</p>
        `,
      });
    } catch (err) {
      console.error("[builder-signup] Resend failed:", err);
      return fail("We couldn't send your application just now. Please try again, or message us on WhatsApp.", 500);
    }
  } else {
    console.warn("[builder-signup] RESEND_API_KEY not set — application NOT emailed");
    return fail("We couldn't send your application just now. Please try again, or message us on WhatsApp.", 500);
  }

  return Response.json({ ok: true });
}

