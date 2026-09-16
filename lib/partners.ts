/**
 * SolarBuilders.ng — the verified-partner programme (shared domain module).
 *
 * Everything both the browser and the server need to agree on lives here: the
 * vocabulary of the form, the pipeline stages, what each stage tells the
 * applicant, server-side validation, and the projection that turns a private
 * partner record into the shape a public profile is allowed to show.
 *
 * Deliberately pure: no database, no secrets, no env vars, no node built-ins.
 * It is safe to import from a 'use client' component. Anything that touches
 * Supabase, Resend or PARTNER_TOKEN_SECRET lives in the server-only
 * lib/partner-db.ts, lib/partner-mail.ts, lib/partner-auth.ts and
 * lib/partner-storage.ts instead.
 *
 * The "(L1)"…"(L18)" tags in comments refer to the loophole list the pipeline was
 * designed against; each tag marks the rule that closes that loophole.
 */

// ─────────────────────────────────────────────────────────────────────────────
// VOCABULARY — shared by the form, the admin dashboard and the public profile
// ─────────────────────────────────────────────────────────────────────────────

export const PARTNER_KINDS = [
  { id: "installer", label: "Installer", hint: "We install systems for customers" },
  { id: "vendor", label: "Vendor / retailer", hint: "We sell equipment from stock" },
  { id: "manufacturer", label: "Manufacturer / distributor", hint: "We supply at trade or distributor terms" },
  { id: "both", label: "Installer and vendor", hint: "We supply the equipment and install it" },
] as const;
export type PartnerKind = (typeof PARTNER_KINDS)[number]["id"];

export const SERVICE_TYPES = [
  { id: "full_install", label: "Full installation", hint: "Design, mounting, wiring, commissioning" },
  { id: "repair", label: "Repair & maintenance", hint: "Faults, upgrades, battery swaps" },
  { id: "parts", label: "Equipment supply", hint: "Inverters, batteries, panels, BOS" },
  { id: "prebuilt", label: "Pre-built packages", hint: "Bundled kits with published prices" },
  { id: "survey", label: "Site survey & design", hint: "Load audit, roof and cable plan" },
] as const;
export type ServiceId = (typeof SERVICE_TYPES)[number]["id"];

/**
 * The size buckets, used by BOTH the form and the routing engine. The exact
 * strings matter: coverage matching compares them, so do not "tidy" the dashes.
 */
export const SYSTEM_SIZES = ["1–2kVA", "3–5kVA", "5–10kVA", "10kVA+"] as const;
export type SystemSize = (typeof SYSTEM_SIZES)[number];

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT (Abuja)", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara",
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// PIPELINE STAGES
// ─────────────────────────────────────────────────────────────────────────────

export const PARTNER_STATUSES = [
  "submitted", "under_review", "info_requested", "approved", "rejected", "suspended",
] as const;
export type PartnerStatus = (typeof PARTNER_STATUSES)[number];

export interface StatusMeta {
  /** admin-facing label */
  label: string;
  /** the sentence the applicant sees on /partners/status — no jargon */
  applicantLine: string;
  /** what happens next, and whose move it is */
  nextStep: string;
  /** chip colours, matching the chips already used on the admin dashboards */
  chip: string;
}

export const PARTNER_STATUS_META: Record<PartnerStatus, StatusMeta> = {
  submitted: {
    label: "Received",
    applicantLine: "We have your application.",
    nextStep: "A reviewer opens it within two working days. Nothing is published yet.",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
  },
  under_review: {
    label: "Under review",
    applicantLine: "Someone is checking your details now.",
    nextStep: "We check the CAC number, look at the installs and call the references you gave.",
    chip: "bg-sky-50 text-sky-700 border-sky-200",
  },
  info_requested: {
    label: "We need something else",
    applicantLine: "We need one or two more things from you before we can finish.",
    nextStep: "Reply to our email with the items we listed, quoting your reference.",
    chip: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  approved: {
    label: "Approved — verified partner",
    applicantLine: "You are approved as a verified partner.",
    nextStep: "We contact you when a customer job fits your coverage. Tell us whenever your availability changes.",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Not taken forward",
    applicantLine: "We are not going ahead with this application.",
    nextStep: "The reason is shown below. You are welcome to apply again once it is addressed.",
    chip: "bg-slate-100 text-slate-500 border-slate-200",
  },
  suspended: {
    label: "Suspended",
    applicantLine: "Your account is suspended and no new jobs will be offered.",
    nextStep: "Settle any outstanding commission, then message us to be reinstated.",
    chip: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

export const AVAILABILITIES = ["available", "busy", "paused"] as const;
export type Availability = (typeof AVAILABILITIES)[number];

export const AVAILABILITY_META: Record<Availability, { label: string; hint: string; chip: string }> = {
  available: { label: "Available", hint: "Offer me work", chip: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  busy: { label: "Busy", hint: "Do not offer me work right now", chip: "bg-amber-50 text-amber-700 border-amber-200" },
  paused: { label: "Paused", hint: "Off until I say otherwise", chip: "bg-slate-100 text-slate-500 border-slate-200" },
};

export const PARTNER_TIERS = ["partner", "tracked"] as const;
export type PartnerTier = (typeof PARTNER_TIERS)[number];

/**
 * The four checks from /verified, as data, so the badge, the admin form and the
 * public profile all read from one place (L1, L2).
 */
export const VERIFICATION_CHECKS = [
  { key: "check_cac", label: "CAC registration", short: "CAC" },
  { key: "check_installs", label: "Past installs seen", short: "installs" },
  { key: "check_references", label: "Customer references called", short: "references" },
  { key: "check_warranty", label: "Written workmanship warranty", short: "warranty" },
] as const;
export type VerificationCheckKey = (typeof VERIFICATION_CHECKS)[number]["key"];

/** How long a verification is good for before it must be re-checked (L1). */
export const VERIFICATION_VALID_MONTHS = 12;

/** Default commission on a routed job, until a partner negotiates their own. */
export const DEFAULT_COMMISSION_RATE = 5;

/**
 * The band of commission rates the superadmin form will accept.
 * MUST equal MIN_COMMISSION_RATE / MAX_COMMISSION_RATE in lib/routing.ts, which
 * is where commission_amount is actually computed; the routing unit test asserts
 * the two agree (see scripts/partner-routing.test.mjs).
 */
export const MIN_COMMISSION_RATE = 0;
export const MAX_COMMISSION_RATE = 25;

// ─────────────────────────────────────────────────────────────────────────────
// ROW SHAPES — mirror public.partners / partner_jobs / partner_payments
// (see supabase/partners.sql; keep the two in step)
// ─────────────────────────────────────────────────────────────────────────────

export interface PartnerInstall {
  site: string;
  city: string;
  size: string;
  year: string;
  /** a real photo URL the reviewer opens before ticking "installs seen" (L1) */
  photoUrl: string;
}

export interface PartnerReference {
  name: string;
  /** INTERNAL. Redacted once the calls have been made (L14). */
  phone: string;
  project: string;
}

/** One item in `partners.info_requested` — what we still need from them. */
export interface PartnerInfoRequest {
  /** field key on this interface, e.g. "price_list_url" */
  key: string;
  /** what we call it in the portal */
  label: string;
  /** why we are asking, in one sentence — shown to the partner verbatim */
  reason: string;
}

export interface PartnerRow {
  id: number;
  created_at: string;
  updated_at: string;
  ref: string;
  slug: string | null;
  kind: string;
  business_name: string;
  contact_name: string;
  email: string;
  whatsapp: string;
  city: string;
  state: string;
  years_in_business: number | null;
  website: string | null;
  instagram: string | null;
  applicant_note: string | null;

  services: string[] | null;
  system_sizes: string[] | null;
  coverage_states: string[] | null;
  coverage_cities: string[] | null;
  brands_carried: string | null;
  monthly_capacity: number | null;
  max_travel_km: number | null;

  cac_number: string | null;
  cac_doc_url: string | null;
  installs: PartnerInstall[] | null;
  refs: PartnerReference[] | null;
  references_redacted_at: string | null;
  warranty_months: number | null;
  warranty_terms: string | null;

  check_cac: boolean;
  check_installs: boolean;
  check_references: boolean;
  check_warranty: boolean;

  price_list_url: string | null;
  trade_terms: string | null;
  lead_time_days: number | null;
  moq: number | null;
  rma_terms: string | null;

  status: string;
  tier: string;
  status_note: string | null;
  review_notes: string | null;
  rejected_reason: string | null;
  suspended_reason: string | null;
  suspended_at: string | null;

  verified: boolean;
  verified_at: string | null;
  verified_until: string | null;
  verified_by: string | null;
  verification_scope: string | null;
  /** PostgREST sends numeric as a JSON number, but be tolerant of a string. */
  commission_rate: number | string;

  availability: string;
  jobs_per_month_cap: number | null;
  availability_confirmed_at: string | null;

  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;

  portal_token_hash: string | null;
  portal_token_issued_at: string | null;
  portal_last_seen_at: string | null;

  info_requested: PartnerInfoRequest[] | null;
  info_requested_at: string | null;
  info_response: Record<string, string> | null;
  info_responded_at: string | null;

  listed: boolean;
  public_blurb: string | null;
  public_highlights: string[] | null;
  agreements: Record<string, unknown> | null;
}

export interface PartnerJobRow {
  id: number;
  created_at: string;
  partner_id: number;
  source: string;
  source_id: number;
  reference: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  customer_ref: string | null;
  title: string;
  location: string | null;
  detail: string | null;
  budget_best: number | null;
  install_fee: number | null;
  commission_rate: number | string | null;
  commission_amount: number | null;
  commission_status: string;
  commission_due_at: string | null;
  commission_cleared_at: string | null;
  status: string;
  offered_at: string;
  offer_expires_at: string;
  responded_at: string | null;
  decline_reason: string | null;
  completed_at: string | null;
  customer_confirmed_at: string | null;
  note: string | null;
  routed_by: string | null;
}

export interface PartnerPaymentRow {
  id: number;
  created_at: string;
  partner_id: number;
  job_id: number | null;
  invoice_ref: string;
  amount_expected: number;
  amount_paid: number | null;
  method: string | null;
  bank_ref: string | null;
  paid_on: string | null;
  receipt_url: string | null;
  receipt_path: string | null;
  note: string | null;
  status: string;
  confirmed_at: string | null;
  confirmed_by: string | null;
  reject_reason: string | null;
}

export interface PartnerEventRow {
  id: number;
  created_at: string;
  partner_id: number;
  job_id: number | null;
  actor: string;
  action: string;
  detail: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION — the client is never trusted (L17)
// ─────────────────────────────────────────────────────────────────────────────

export interface PartnerApplication {
  kind: PartnerKind;
  businessName: string;
  contactName: string;
  email: string;
  whatsapp: string;
  city: string;
  state: string;
  yearsInBusiness: number;
  website: string | null;
  instagram: string | null;
  services: string[];
  systemSizes: string[];
  coverageStates: string[];
  coverageCities: string[];
  brandsCarried: string | null;
  monthlyCapacity: number | null;
  maxTravelKm: number | null;
  cacNumber: string;
  cacDocUrl: string | null;
  installs: PartnerInstall[];
  refs: PartnerReference[];
  warrantyMonths: number | null;
  warrantyTerms: string | null;
  priceListUrl: string | null;
  tradeTerms: string | null;
  leadTimeDays: number | null;
  moq: number | null;
  rmaTerms: string | null;
  agreeVerification: boolean;
  agreeCommission: boolean;
  agreeNonCircumvention: boolean;
  agreeData: boolean;
  note: string | null;
}

export type ApplicationValidation =
  | { ok: true; data: PartnerApplication }
  | { ok: false; error: string; fields: string[] };

/** Does this application involve work on a customer's site? */
export function doesInstallWork(kind: PartnerKind): boolean {
  return kind === "installer" || kind === "both";
}

/** Does this application involve supplying equipment? */
export function doesSupply(kind: PartnerKind): boolean {
  return kind === "vendor" || kind === "manufacturer" || kind === "both";
}

/** Trim, drop control characters, and cap length. Plain text only (L11). */
function str(v: unknown, max: number): string {
  if (typeof v !== "string" && typeof v !== "number") return "";
  return String(v)
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, max);
}

function optStr(v: unknown, max: number): string | null {
  return str(v, max) || null;
}

function num(v: unknown, min: number, max: number): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(n)) return null;
  const i = Math.round(n);
  return i < min || i > max ? null : i;
}

/**
 * http(s) only. A `javascript:` or `data:` URL pasted into a photo field would
 * otherwise end up as a link the reviewer clicks (L11).
 */
function httpUrl(v: unknown, max = 500): string | null {
  const s = str(v, max);
  if (!s) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return s;
  } catch {
    return null;
  }
}

function emailOk(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}

/** Nigerian numbers arrive as +234…, 234…, 0803…, with spaces. Digits are what matter. */
function phoneOk(s: string): boolean {
  const digits = s.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

/** Keep only values from an allow-list, de-duplicated, capped in count. */
function pick(v: unknown, allowed: readonly string[], max: number): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const item of v) {
    const s = str(item, 60);
    if (allowed.includes(s) && !out.includes(s)) out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

function fail(error: string, fields: string[]): ApplicationValidation {
  return { ok: false, error, fields };
}

/**
 * Validate and normalise an application. Returns the cleaned payload, or the
 * list of fields that failed (the API route turns those into a 400 for the form
 * to highlight). Nothing here trusts a length, a type or a URL from the browser.
 */
export function validateApplication(input: unknown): ApplicationValidation {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return fail("We could not read the form. Please reload the page and try again.", []);
  }
  const b = input as Record<string, unknown>;

  const kindRaw = str(b.kind, 20);
  const kind = PARTNER_KINDS.find((k) => k.id === kindRaw)?.id;
  if (!kind) return fail("Choose what kind of business you are.", ["kind"]);

  const thisYear = new Date().getFullYear();

  const businessName = str(b.businessName, 120);
  const contactName = str(b.contactName, 120);
  const email = str(b.email, 160).toLowerCase();
  const whatsapp = str(b.whatsapp, 30);
  const city = str(b.city, 60);
  const state = str(b.state, 40);
  const yearsInBusiness = num(b.yearsInBusiness, 0, 80);
  const cacNumber = str(b.cacNumber, 40);

  const bad: string[] = [];
  if (!businessName) bad.push("businessName");
  if (!contactName) bad.push("contactName");
  if (!email || !emailOk(email)) bad.push("email");
  if (!whatsapp || !phoneOk(whatsapp)) bad.push("whatsapp");
  if (!city) bad.push("city");
  if (!state || !NIGERIAN_STATES.includes(state as (typeof NIGERIAN_STATES)[number])) bad.push("state");
  if (yearsInBusiness === null) bad.push("yearsInBusiness");
  if (cacNumber.length < 4) bad.push("cacNumber");
  if (bad.length) return fail("Please check the highlighted fields.", bad);

  const services = pick(b.services, SERVICE_TYPES.map((s) => s.id), SERVICE_TYPES.length);
  if (services.length === 0) return fail("Pick at least one thing you do.", ["services"]);

  const systemSizes = pick(b.systemSizes, SYSTEM_SIZES, SYSTEM_SIZES.length);
  if (systemSizes.length === 0) return fail("Pick at least one system size you work at.", ["systemSizes"]);

  // The base state is always part of coverage: a partner that does not cover
  // where it sits is a contradiction, and routing would reject them for it (L15).
  const coverageStates = pick(b.coverageStates, NIGERIAN_STATES, NIGERIAN_STATES.length);
  if (!coverageStates.includes(state)) coverageStates.unshift(state);

  const installsWanted = doesInstallWork(kind);
  const supplyWanted = doesSupply(kind);

  // ── Installs: only the ones that pass validation survive ────────────────────
  const installsRaw = Array.isArray(b.installs) ? b.installs.slice(0, 6) : [];
  const installs: PartnerInstall[] = [];
  for (const item of installsRaw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const site = str(r.site, 120);
    if (!site) continue;
    installs.push({
      site,
      city: str(r.city, 60) || city,
      size: str(r.size, 40),
      year: str(r.year, 4),
      photoUrl: httpUrl(r.photoUrl) ?? "",
    });
  }
  if (installsWanted) {
    const complete = installs.filter((i) => i.photoUrl);
    if (complete.length < 3) {
      return fail(
        "Three past installations, each with a photo link, are required. It is the main thing we check.",
        ["installs"],
      );
    }
    for (const i of installs) {
      if (i.year && (!/^\d{4}$/.test(i.year) || Number(i.year) < 1990 || Number(i.year) > thisYear + 1)) {
        return fail("Check the years on your past installations.", ["installs"]);
      }
    }
  }

  // ── References ────────────────────────────────────────────────────────────
  // Their phone numbers are third-party personal data: used for the calls, then
  // redacted by the reviewer (L14). Minimum 2 for anyone working on site.
  const refsRaw = Array.isArray(b.refs) ? b.refs.slice(0, 5) : [];
  const refs: PartnerReference[] = [];
  for (const item of refsRaw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const name = str(r.name, 100);
    const phone = str(r.phone, 30);
    if (!name && !phone) continue;
    refs.push({ name, phone, project: str(r.project, 160) });
  }
  const refsMin = installsWanted ? 2 : 1;
  if (refs.filter((r) => r.name && phoneOk(r.phone)).length < refsMin) {
    return fail(
      `We need ${refsMin} customer reference${refsMin === 1 ? "" : "s"} with a name and a phone number we can call.`,
      ["refs"],
    );
  }

  // ── Warranty: required for anyone who touches a customer's site ─────────────
  const warrantyMonths = num(b.warrantyMonths, 0, 240);
  const warrantyTerms = optStr(b.warrantyTerms, 800);
  if (installsWanted && (!warrantyMonths || !warrantyTerms)) {
    return fail("A written workmanship warranty is required, with the terms spelled out.", [
      "warrantyMonths",
      "warrantyTerms",
    ]);
  }

  // ── Supply terms: required for anyone who supplies equipment ────────────────
  const priceListUrl = httpUrl(b.priceListUrl);
  const tradeTerms = optStr(b.tradeTerms, 800);
  const leadTimeDays = num(b.leadTimeDays, 0, 365);
  const rmaTerms = optStr(b.rmaTerms, 800);
  if (supplyWanted) {
    if (!priceListUrl && !tradeTerms) {
      return fail("Send a public price list or catalogue link, or your trade terms in writing.", [
        "priceListUrl",
        "tradeTerms",
      ]);
    }
    if (!leadTimeDays && leadTimeDays !== 0) {
      return fail("Tell us the lead time from order to delivery, in days.", ["leadTimeDays"]);
    }
    if (!rmaTerms) {
      return fail("Tell us in writing who handles a failed unit, and how long a swap takes.", ["rmaTerms"]);
    }
  }

  // ─ Agreements: all four, explicitly (L4, L8, L14) ─────────────────────────
  const agreeVerification = b.agreeVerification === true;
  const agreeCommission = b.agreeCommission === true;
  const agreeNonCircumvention = b.agreeNonCircumvention === true;
  const agreeData = b.agreeData === true;
  const agreementsMissing: string[] = [];
  if (!agreeVerification) agreementsMissing.push("agreeVerification");
  if (!agreeCommission) agreementsMissing.push("agreeCommission");
  if (!agreeNonCircumvention) agreementsMissing.push("agreeNonCircumvention");
  if (!agreeData) agreementsMissing.push("agreeData");
  if (agreementsMissing.length) {
    return fail("Please read and accept the terms at the end of the form.", agreementsMissing);
  }

  return {
    ok: true,
    data: {
      kind,
      businessName,
      contactName,
      email,
      whatsapp,
      city,
      state,
      yearsInBusiness: yearsInBusiness as number,
      website: httpUrl(b.website),
      instagram: optStr(b.instagram, 120),
      services,
      systemSizes,
      coverageStates,
      coverageCities: Array.isArray(b.coverageCities)
        ? (b.coverageCities as unknown[]).map((c) => str(c, 60)).filter(Boolean).slice(0, 20)
        : [],
      brandsCarried: optStr(b.brandsCarried, 400),
      monthlyCapacity: num(b.monthlyCapacity, 0, 100),
      maxTravelKm: num(b.maxTravelKm, 0, 2000),
      cacNumber,
      cacDocUrl: httpUrl(b.cacDocUrl),
      installs,
      refs,
      warrantyMonths,
      warrantyTerms,
      priceListUrl,
      tradeTerms,
      leadTimeDays,
      moq: num(b.moq, 0, 100000),
      rmaTerms,
      agreeVerification,
      agreeCommission,
      agreeNonCircumvention,
      agreeData,
      note: optStr(b.note, 1200),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I confusion

/**
 * Six characters from a 32-letter alphabet (30 bits) using the platform CSPRNG,
 * which exists as `globalThis.crypto` in both browsers and Node 20. Always
 * exactly six characters (Math.random().toString(36) sometimes gave fewer).
 */
function refSuffix(): string {
  const bytes = new Uint8Array(6);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join("");
}

/**
 * Application reference shown to the applicant. Not a secret on its own: the
 * status lookup needs it AND the email address it was issued to.
 */
export function partnerRef(): string {
  return `SB-PTR-${refSuffix()}`;
}

/** Job reference, shared by us and the partner. Not a secret. */
export function jobRef(): string {
  return `SB-JOB-${refSuffix()}`;
}

/** URL-safe slug for the public profile. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-{2,}/g, "-")
    .slice(0, 60)
    .replace(/^-|-$/g, "");
}

/** Make a slug unique against slugs already taken, without a random suffix. */
export function uniqueSlug(base: string, taken: string[]): string {
  const root = base || "partner";
  if (!taken.includes(root)) return root;
  for (let i = 2; i < 100; i++) {
    const candidate = `${root}-${i}`;
    if (!taken.includes(candidate)) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export function kindLabel(kind: string): string {
  return PARTNER_KINDS.find((k) => k.id === kind)?.label ?? "Partner";
}

export function serviceLabels(ids: string[] | null): string[] {
  return (ids ?? []).map((id) => SERVICE_TYPES.find((s) => s.id === id)?.label ?? id).filter(Boolean);
}

/** Commission rate as a number, clamped to the band we accept. */
export function commissionRateOf(row: Pick<PartnerRow, "commission_rate">): number {
  const n = typeof row.commission_rate === "string" ? Number(row.commission_rate) : row.commission_rate;
  if (!Number.isFinite(n)) return DEFAULT_COMMISSION_RATE;
  return Math.max(MIN_COMMISSION_RATE, Math.min(MAX_COMMISSION_RATE, n));
}

/** When a verification done now should be re-checked. */
export function verifiedUntilFrom(from: Date): Date {
  const d = new Date(from.getTime());
  d.setMonth(d.getMonth() + VERIFICATION_VALID_MONTHS);
  return d;
}

/**
 * Is this partner verifiable *right now*? A lapsed verification (L1) or a
 * suspension stops the badge rendering even though the row still says approved.
 * A missing `verified_until` counts as current — those rows predate the column.
 */
export function isVerifiedNow(row: PartnerRow, now: Date): boolean {
  if (!row.verified || row.status !== "approved" || !row.listed) return false;
  if (!row.verified_until) return true;
  const until = new Date(row.verified_until).getTime();
  if (Number.isNaN(until)) return true;
  return until > now.getTime();
}

/** Which of the four checks were actually ticked (L1). */
export function verificationChecksDone(row: PartnerRow): { key: VerificationCheckKey; label: string; done: boolean }[] {
  return VERIFICATION_CHECKS.map((c) => ({ key: c.key, label: c.label, done: row[c.key] === true }));
}

/**
 * The words that go on the badge and the profile (L2). Only checks that were
 * actually ticked are claimed. Counts come from the application itself; when the
 * row we were given does not carry them (e.g. a public projection), no number is
 * claimed at all rather than a made-up default.
 */
export function verificationScopeLabel(row: PartnerRow): string {
  const parts: string[] = [];
  if (row.check_cac) parts.push("CAC");
  if (row.check_installs) {
    const seen = (row.installs ?? []).filter((i) => i.photoUrl).length;
    parts.push(seen > 0 ? `${seen} install${seen === 1 ? "" : "s"}` : "past installs");
  }
  if (row.check_references) {
    const called = (row.refs ?? []).length;
    parts.push(called > 0 ? `${called} reference${called === 1 ? "" : "s"}` : "customer references");
  }
  if (row.check_warranty) parts.push("a written warranty");
  if (parts.length === 0) return "identity and capability";
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC PROJECTION
//
// What the website is allowed to know about a partner. Deliberately excludes
// phone number, email, website, CAC number, bank details and references — we are
// the buyer's agent, so a partner's contact details are ours to hold, not to
// publish. What goes public is evidence of the partnership, not a way to route
// around it (L8a).
// ─────────────────────────────────────────────────────────────────────────────

export interface PublicPartnerProfile {
  slug: string;
  name: string;
  kind: string;
  kindLabel: string;
  city: string;
  state: string;
  coverageStates: string[];
  services: string[];
  serviceLabels: string[];
  systemSizes: string[];
  brandsCarried: string | null;
  yearsInBusiness: number | null;
  warrantyMonths: number | null;
  verifiedAt: string | null;
  verifiedUntil: string | null;
  /** "CAC, 3 installs, 2 references and a written warranty" (L2) */
  scope: string;
  checks: { key: string; label: string; done: boolean }[];
  completedJobs: number;
  blurb: string | null;
  highlights: string[];
  tier: string;
}

export function publicPartnerProfile(row: PartnerRow, completedJobs: number): PublicPartnerProfile {
  return {
    slug: row.slug ?? slugify(row.business_name),
    name: row.business_name,
    kind: row.kind,
    kindLabel: kindLabel(row.kind),
    city: row.city,
    state: row.state,
    coverageStates: row.coverage_states ?? [],
    services: row.services ?? [],
    serviceLabels: serviceLabels(row.services),
    systemSizes: row.system_sizes ?? [],
    brandsCarried: row.brands_carried,
    yearsInBusiness: row.years_in_business,
    warrantyMonths: row.warranty_months,
    verifiedAt: row.verified_at,
    verifiedUntil: row.verified_until,
    scope: row.verification_scope ?? verificationScopeLabel(row),
    checks: verificationChecksDone(row),
    completedJobs,
    blurb: row.public_blurb,
    highlights: (row.public_highlights ?? []).filter((h) => typeof h === "string" && h.trim()).slice(0, 6),
    tier: row.tier,
  };
}

/**
 * Map a partner row plus its live stats onto the shape the routing engine scores.
 * Lives here rather than in lib/routing.ts so that file stays dependency-free and
 * independently testable.
 */
export function capabilityFrom(
  row: PartnerRow,
  stats: {
    openJobs: number;
    completedJobs: number;
    hasDueCommission: boolean;
    commissionOverdueDays: number | null;
  },
): import("./routing").PartnerCapability {
  return {
    id: row.id,
    name: row.business_name,
    city: row.city,
    state: row.state,
    coverageStates: row.coverage_states ?? [],
    coverageCities: row.coverage_cities ?? [],
    services: row.services ?? [],
    systemSizes: row.system_sizes ?? [],
    availability: row.availability,
    jobsPerMonthCap: row.jobs_per_month_cap,
    openJobs: stats.openJobs,
    completedJobs: stats.completedJobs,
    hasDueCommission: stats.hasDueCommission,
    commissionOverdueDays: stats.commissionOverdueDays,
    availabilityConfirmedAt: row.availability_confirmed_at,
  };
}