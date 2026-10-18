/**
 * Outreach to brands — the catalogue request to every brand we list, and the
 * "want to be featured?" pitch to prospects we don't list yet — plus the
 * status ladder behind /admin/suppliers. Rows live in Supabase
 * `brand_outreach` (supabase/brand_outreach.sql); a prospect is a row with
 * `prospect = true` carrying its own name and kind.
 */
import { BRANDS, type BrandKind } from "./brands";
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
  prospect: boolean;
  name: string | null;
  kind: string | null;
  category: string | null;
  website: string | null;
}

/** A brand_outreach key: a listed brand's slug or a prospect's. */
export function isOutreachSlug(v: unknown): v is string {
  return typeof v === "string" && /^[a-z0-9-]{2,60}$/.test(v);
}

/** Someone we write to: a brand we list, or a prospect row. */
export interface OutreachTarget {
  slug: string;
  name: string;
  kind: BrandKind;
  prospect: boolean;
  category: string | null;
  website: string | null;
}

/** Listed brands first (catalogue order), then prospects by name. */
export function outreachTargets(rows: OutreachRow[] | null): OutreachTarget[] {
  const listed: OutreachTarget[] = BRANDS.map((b) => ({
    slug: b.slug,
    name: b.name,
    kind: b.kind,
    prospect: false,
    category: null,
    website: b.website ?? null,
  }));
  const taken = new Set(listed.map((t) => t.slug));
  const prospects: OutreachTarget[] = (rows ?? [])
    .filter((r) => r.prospect && r.name && !taken.has(r.slug))
    .map((r) => ({
      slug: r.slug,
      name: r.name!,
      kind: (r.kind === "vendor" ? "vendor" : "manufacturer") as BrandKind,
      prospect: true,
      category: r.category,
      website: r.website,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...listed, ...prospects];
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

/** The pitch to a brand we don't list yet: would they like to be featured? */
export function prospectSubject(brand: string): string {
  return `Featuring ${brand} on ${SITE_NAME} — are you in?`;
}

export function prospectBody(brand: string, kind: BrandKind): string {
  const offer =
    kind === "vendor"
      ? `We buy equipment for our customers from trusted Nigerian suppliers, and we'd like ${brand} to be one of them, with a supplier page on our site and orders for the systems we build placed with you.`
      : `We'd like to add ${brand} to the brands we feature: a brand page on our site, your products offered in the quotes customers build, and orders for those systems sourced through your official channel in Nigeria.`;
  return [
    `Hello ${brand} team,`,
    "",
    `I'm writing from ${SITE_NAME} (${SITE_URL}), a Nigerian platform that helps homes and businesses size, price and buy solar systems. Customers pick the appliances they want to power, get a sized quote, and we put the system together for them.`,
    "",
    offer,
    "",
    "Are you in? If so, could you send us your current product catalogue and price list for the Nigerian market, and a phone or WhatsApp number for the right person on your side so we can set this up properly?",
    "",
    `You can reach us on ${PHONE_DISPLAY} (call or WhatsApp) or at ${LEAD_EMAILS[0]}.`,
    "",
    "Thank you,",
    SITE_NAME,
  ].join("\n");
}

export function prospectDm(brand: string): string {
  return `Hello ${brand} team — this is ${SITE_NAME} (${SITE_URL}). We help Nigerian homes and businesses size and buy solar systems, and we'd like to feature ${brand} on our platform. Are you in? If so, could you send your current catalogue and price list, and a number for the right person? Thank you. ${PHONE_DISPLAY} · ${LEAD_EMAILS[0]}`;
}

export function outreachCopy(t: Pick<OutreachTarget, "name" | "kind" | "prospect">): { subject: string; body: string; dm: string } {
  return t.prospect
    ? { subject: prospectSubject(t.name), body: prospectBody(t.name, t.kind), dm: prospectDm(t.name) }
    : { subject: outreachSubject(t.name), body: outreachBody(t.name), dm: outreachDm(t.name) };
}

export function mailtoLink(to: string, t: Pick<OutreachTarget, "name" | "kind" | "prospect">): string {
  const { subject, body } = outreachCopy(t);
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
  t: OutreachTarget,
  c: Pick<OutreachRow, "email" | "phone" | "whatsapp" | "instagram" | "facebook" | "linkedin" | "x">,
): DraftRow | null {
  const base = { slug: t.slug, status: "draft" as const, error: null, sent_at: null };
  const { subject, body, dm } = outreachCopy(t);
  if (c.email) return { ...base, channel: "email", to_addr: c.email, subject, body };
  if (c.whatsapp) return { ...base, channel: "whatsapp", to_addr: waDigits(c.whatsapp), subject: null, body: dm };
  for (const ch of ["instagram", "facebook", "linkedin", "x"] as const) {
    if (c[ch]) return { ...base, channel: ch, to_addr: c[ch], subject: null, body: dm };
  }
  if (c.phone) return { ...base, channel: "phone", to_addr: c.phone, subject: null, body: dm };
  return null;
}
