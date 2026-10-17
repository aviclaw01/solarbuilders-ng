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
