/**
 * The catalogue-request outreach to every brand we list — the message and the
 * status ladder behind /admin/suppliers. Rows live in Supabase
 * `brand_outreach` (supabase/brand_outreach.sql).
 */
import { CONTACT_WHATSAPP, LEAD_EMAILS, SITE_NAME, SITE_URL } from "./site";

export const OUTREACH_STATUSES = [
  "to_contact",
  "emailed",
  "replied",
  "catalogue_in",
  "deal",
  "no_reply",
  "declined",
] as const;
export type OutreachStatus = (typeof OUTREACH_STATUSES)[number];

export function isOutreachStatus(v: unknown): v is OutreachStatus {
  return typeof v === "string" && (OUTREACH_STATUSES as readonly string[]).includes(v);
}

export interface OutreachRow {
  slug: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  linkedin: string | null;
  facebook: string | null;
  x: string | null;
  contact_page: string | null;
  source: string | null;
  research_note: string | null;
  status: string;
  notes: string | null;
  contacted_at: string | null;
}

const PHONE_DISPLAY = `+${CONTACT_WHATSAPP.slice(0, 3)} ${CONTACT_WHATSAPP.slice(3, 6)} ${CONTACT_WHATSAPP.slice(6, 9)} ${CONTACT_WHATSAPP.slice(9)}`;

export function outreachSubject(brand: string): string {
  return `Featuring ${brand} on ${SITE_NAME} — catalogue request`;
}

export function outreachBody(brand: string): string {
  return [
    `Hello ${brand} team,`,
    "",
    `I'm writing from ${SITE_NAME} (${SITE_URL}), a Nigerian platform that helps homes and businesses size, price and buy solar systems. ${brand} is already listed on our site, and customers regularly ask us to build systems with your products.`,
    "",
    "We'd like to feature your range properly, with accurate models, specs and prices. Could you send us your current product catalogue and price list for the Nigerian market?",
    "",
    "Once we've reviewed it we'd like to talk about working together. Could you also share a phone or WhatsApp number for the right person on your side, so we can structure this properly?",
    "",
    `You can reach us on ${PHONE_DISPLAY} (call or WhatsApp) or at ${LEAD_EMAILS[0]}.`,
    "",
    "Thank you,",
    SITE_NAME,
  ].join("\n");
}

/** Short WhatsApp/DM version of the same ask. */
export function outreachDm(brand: string): string {
  return `Hello ${brand} team — this is ${SITE_NAME} (${SITE_URL}). We list ${brand} and our customers ask for it. Could you send your current Nigerian catalogue and price list, and a number for the right person so we can discuss featuring your products? Thank you. ${PHONE_DISPLAY} · ${LEAD_EMAILS[0]}`;
}

export function mailtoLink(to: string, brand: string): string {
  return `mailto:${to}?subject=${encodeURIComponent(outreachSubject(brand))}&body=${encodeURIComponent(outreachBody(brand))}`;
}

export type OutreachChannel = "email" | "whatsapp" | "instagram" | "facebook" | "linkedin" | "x" | "phone";

export interface DraftRow {
  slug: string;
  channel: OutreachChannel;
  to_addr: string | null;
  subject: string | null;
  body: string;
  status: "draft" | "sent" | "failed";
  error: string | null;
  sent_at: string | null;
}

/** "08012345678" / "+234 801…" → "2348012345678" for wa.me */
export function waDigits(p: string): string {
  const d = p.replace(/\D/g, "");
  return d.startsWith("0") ? `234${d.slice(1)}` : d;
}

/**
 * The default draft for a brand: an email when we have an address, otherwise
 * a DM on the best route we found — WhatsApp, then socials, then a call.
 * Null when we found no route at all.
 */
export function defaultDraft(
  slug: string,
  brand: string,
  c: Pick<OutreachRow, "email" | "phone" | "whatsapp" | "instagram" | "facebook" | "linkedin" | "x">,
): DraftRow | null {
  const base = { slug, status: "draft" as const, error: null, sent_at: null };
  if (c.email) return { ...base, channel: "email", to_addr: c.email, subject: outreachSubject(brand), body: outreachBody(brand) };
  const dm = outreachDm(brand);
  if (c.whatsapp) return { ...base, channel: "whatsapp", to_addr: waDigits(c.whatsapp), subject: null, body: dm };
  for (const ch of ["instagram", "facebook", "linkedin", "x"] as const) {
    if (c[ch]) return { ...base, channel: ch, to_addr: c[ch], subject: null, body: dm };
  }
  if (c.phone) return { ...base, channel: "phone", to_addr: c.phone, subject: null, body: dm };
  return null;
}
