/**
 * SolarBuilders.ng — job routing engine.
 *
 * Decides which verified partners may be offered a job, and in what order, and
 * explains itself. Pure functions only: no database, no clock of its own, no
 * imports. That is deliberate — the routing decision is the part of the partner
 * pipeline most likely to be wrong in a quiet way, so it can be compiled and
 * unit-tested on its own (see scripts/partner-routing.test.mjs).
 *
 * The gate that makes the manual-commission model survivable lives here (L5):
 * a partner with commission outstanding is not offered more work.
 *
 * Rules, in the order they are applied:
 *   1. Cover the state            — hard requirement, not a preference (L15)
 *   2. Offer the required service — an installer-only partner cannot supply equipment
 *   3. Handle that system size    — only when we know the size the job needs
 *   4. Be switched on             — `paused` never gets work
 *   5. Have commission cleared    — the whole point (L5, L6)
 *   6. Be under capacity          — open jobs vs their declared ceiling (L10)
 *   7. Have confirmed availability recently — 14 days (L10)
 * Then scored: city match, size fit, experience, capacity headroom.
 */

/** Hours an offer stands before it expires and the job is released (L9). */
export const OFFER_WINDOW_HOURS = 24;

/** Days after which an unconfirmed availability flag stops counting (L10). */
export const AVAILABILITY_STALE_DAYS = 14;

/** Days a due commission can age before we pause, then suspend, the partner (L5). */
export const COMMISSION_PAUSE_DAYS = 14;
export const COMMISSION_SUSPEND_DAYS = 30;

/**
 * The commission band we will compute. Mirrored by MIN_COMMISSION_RATE /
 * MAX_COMMISSION_RATE in lib/partners.ts (which is what the superadmin form
 * clamps to); the unit test asserts the two agree, so they cannot drift quietly.
 */
export const MIN_COMMISSION_RATE = 0;
export const MAX_COMMISSION_RATE = 25;

export type PartnerAvailability = "available" | "busy" | "paused";

export interface PartnerCapability {
  id: number;
  name: string;
  /** base location, used for the city match */
  city: string;
  state: string;
  /** every state the partner says they serve — must include the request's state */
  coverageStates: string[];
  /** cities they named explicitly, on top of the base city */
  coverageCities: string[];
  /** service ids from lib/partners.ts SERVICE_TYPES */
  services: string[];
  /** system size buckets from lib/partners.ts SYSTEM_SIZES */
  systemSizes: string[];
  availability: PartnerAvailability | string;
  /** declared ceiling on concurrent work; null = no declared cap */
  jobsPerMonthCap: number | null;
  /** live jobs — accepted and in progress. Offers do not count. */
  openJobs: number;
  /** finished jobs with us — the experience signal */
  completedJobs: number;
  /** commission owed to us and not yet confirmed as paid */
  hasDueCommission: boolean;
  /** how long ago that commission fell due, in days; null when nothing is due */
  commissionOverdueDays: number | null;
  /** when the partner last confirmed they can take work; null = never */
  availabilityConfirmedAt: string | null;
}

export interface RequestProfile {
  /** must match a coverageStates entry exactly, e.g. "Lagos" */
  state: string;
  /** used for the city bonus, not a requirement — e.g. "Lekki" */
  city?: string | null;
  /** service ids the job needs; usually ["full_install"] */
  services: string[];
  /** size bucket, when the request tells us; null = any size is acceptable */
  systemSize?: string | null;
  /** does the request want someone on site? */
  needsInstall: boolean;
  /** "now", injected so the caller — and the test — control the clock */
  now: Date;
}

export interface PartnerVerdict {
  partnerId: number;
  name: string;
  score: number;
  eligible: boolean;
  /** why this partner, in words we can print in /admin/routing */
  reasons: string[];
  /** why not — an empty list means eligible */
  blockers: string[];
}

/** Case/space-insensitive compare, so "FCT (Abuja)" and "fct  abuja" agree. */
function same(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function daysSince(iso: string | null, now: Date): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return (now.getTime() - then) / 86_400_000;
}

/** Has this timestamp already passed? Malformed or missing input reads as "yes". */
function isPast(iso: string | null | undefined, now: Date): boolean {
  if (!iso) return true;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return true;
  return t <= now.getTime();
}

/**
 * Score one partner against one request, with reasons and blockers attached.
 * Never throws on malformed input: a partner row with a missing array simply
 * covers nothing, which fails safe (no offer) rather than open.
 */
export function scorePartner(partner: PartnerCapability, request: RequestProfile): PartnerVerdict {
  const reasons: string[] = [];
  const blockers: string[] = [];
  let score = 0;

  const coverageStates = Array.isArray(partner.coverageStates) ? partner.coverageStates : [];
  const coverageCities = Array.isArray(partner.coverageCities) ? partner.coverageCities : [];
  const services = Array.isArray(partner.services) ? partner.services : [];
  const systemSizes = Array.isArray(partner.systemSizes) ? partner.systemSizes : [];

  // 1. Coverage — a hard requirement. Sending a Lagos partner to Kano is how a
  //    partner learns to decline, and a decline is the most expensive outcome here.
  const coversState =
    coverageStates.some((s) => same(s, request.state)) || same(partner.state, request.state);
  if (coversState) {
    reasons.push(`Covers ${request.state}`);
    score += 25;
  } else {
    blockers.push(`Does not cover ${request.state}`);
  }

  // 2. Services — every required service must be present.
  const missingServices = request.services.filter((need) => !services.includes(need));
  if (missingServices.length === 0) {
    if (request.services.length > 0) {
      reasons.push(`Provides all ${request.services.length} required service(s)`);
      score += 20;
    }
  } else {
    blockers.push(`Missing service: ${missingServices.join(", ")}`);
  }

  // 3. Size — only checked when the request actually tells us the size.
  if (request.systemSize) {
    if (systemSizes.includes(request.systemSize)) {
      reasons.push(`Works at ${request.systemSize}`);
      score += 10;
    } else {
      blockers.push(`Does not declare ${request.systemSize}`);
    }
  }

  // 4. Switched on at all.
  if (partner.availability === "paused") {
    blockers.push("Availability is paused");
  } else if (partner.availability === "busy") {
    blockers.push("Marked busy — not taking work");
  } else if (partner.availability === "available") {
    reasons.push("Available now");
    score += 10;
  } else {
    blockers.push(`Unknown availability "${partner.availability}"`);
  }

  // 5. The commission gate (L5). This is the lever that makes manual payment work:
  //    no new work until the last one is settled. Our number, not theirs (L6).
  if (partner.hasDueCommission) {
    const overdue = partner.commissionOverdueDays ?? 0;
    if (overdue >= COMMISSION_SUSPEND_DAYS) {
      blockers.push(`Commission ${Math.floor(overdue)} days overdue — suspended pending settlement`);
    } else if (overdue >= COMMISSION_PAUSE_DAYS) {
      blockers.push(`Commission ${Math.floor(overdue)} days overdue — paused until paid`);
    } else {
      blockers.push("Commission from the last job is not settled");
    }
  }

  // 6. Capacity (L10) — derived, not taken from a self-declared flag.
  if (typeof partner.jobsPerMonthCap === "number" && partner.jobsPerMonthCap > 0) {
    if (partner.openJobs >= partner.jobsPerMonthCap) {
      blockers.push(`At capacity (${partner.openJobs}/${partner.jobsPerMonthCap} open)`);
    } else {
      const headroom = partner.jobsPerMonthCap - partner.openJobs;
      reasons.push(`${headroom} of ${partner.jobsPerMonthCap} job slots left`);
      score += Math.min(headroom * 3, 12);
    }
  } else {
    reasons.push("No declared monthly cap");
    score += 4;
  }

  // 7. Fresh availability confirmation. A flag nobody has touched in a fortnight
  //    is not evidence of anything.
  const confirmAge = daysSince(partner.availabilityConfirmedAt, request.now);
  if (confirmAge === null) {
    blockers.push("Never confirmed they can take work");
  } else if (confirmAge > AVAILABILITY_STALE_DAYS) {
    blockers.push(`Availability not confirmed for ${Math.floor(confirmAge)} days`);
  } else {
    reasons.push(`Availability confirmed ${Math.max(0, Math.floor(confirmAge))}d ago`);
    score += 6;
  }

  // 8. City match — a bonus, never a requirement. Same city means no travel day.
  const cityMatch =
    same(partner.city, request.city) || coverageCities.some((c) => same(c, request.city));
  if (cityMatch) {
    reasons.push(`Based in or covers ${request.city}`);
    score += 15;
  }

  // 9. Experience with us. Capped, because the tenth job is not ten times better
  //    than the first — it means we already know how they work.
  const experience = Math.min(partner.completedJobs, 10) * 2;
  if (experience > 0) {
    reasons.push(`${partner.completedJobs} completed job(s) with us`);
    score += experience;
  }

  const eligible = blockers.length === 0;
  return {
    partnerId: partner.id,
    name: partner.name,
    // An ineligible partner keeps nothing: it is only ever shown under "why not".
    score: eligible ? Math.max(0, Math.min(100, score)) : 0,
    eligible,
    reasons,
    blockers,
  };
}

/**
 * Rank partners for a request: eligible first, best score first, then stable
 * alphabetical order so two equal partners do not swap places between reloads.
 * Ineligible partners come after them, for the admin's "why not" view.
 */
export function rankPartners(partners: PartnerCapability[], request: RequestProfile): PartnerVerdict[] {
  return partners
    .map((p) => scorePartner(p, request))
    .sort((a, b) => {
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name);
    });
}

/** When an offer made now should expire. */
export function offerExpiry(now: Date): Date {
  return new Date(now.getTime() + OFFER_WINDOW_HOURS * 3_600_000);
}

/** Has this offer run out? Missing or malformed input reads as expired (fail safe). */
export function isOfferExpired(offerExpiresAt: string | null | undefined, now: Date): boolean {
  return isPast(offerExpiresAt, now);
}

/**
 * The commission state a job should carry, given when it fell due (L5). Called
 * when a partner marks a job done, and again on every read so a stale `due`
 * becomes `overdue` without a cron job.
 */
export function commissionStatusFor(
  dueAt: string | null,
  now: Date,
  current: string,
): "due" | "overdue" | "confirmed" | "receipt_uploaded" | "none" | "waived" {
  if (current === "confirmed" || current === "waived" || current === "none") return current;
  if (current === "receipt_uploaded") {
    return isPast(dueAt, now) ? "overdue" : "receipt_uploaded";
  }
  if (!dueAt) return "due";
  return isPast(dueAt, now) ? "overdue" : "due";
}

/**
 * What our commission is on a job. Rounded to the naira.
 *
 * `installFee` is added to the budget because when we place a job we are taking a
 * fee on the whole value the partner invoices; if the partner supplies the
 * equipment themselves, the budget already includes it. Either way this is OUR
 * figure, computed from OUR record — never from what the partner reports (L6).
 */
export function commissionAmount(opts: {
  budgetBest: number | null;
  installFee?: number | null;
  ratePercent: number;
}): number {
  const base = Math.max(0, opts.budgetBest ?? 0) + Math.max(0, opts.installFee ?? 0);
  const rate = Number.isFinite(opts.ratePercent)
    ? Math.max(MIN_COMMISSION_RATE, Math.min(MAX_COMMISSION_RATE, opts.ratePercent))
    : 0;
  return Math.round((base * rate) / 100);
}

/** Deterministic invoice reference for a job, so it can be quoted on a call (L13). */
export function invoiceRef(jobReference: string): string {
  return `SB-INV-${jobReference.replace(/^SB-JOB-/, "")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// READING A CUSTOMER REQUEST
//
// Requests arrive as free text ("Lekki, Lagos", "Kado, FCT (Abuja)"). Routing
// needs a state to match coverage against, so it is guessed here, once, in a
// pure function that the test file can hammer — rather than four slightly
// different regexes across the admin pages.
// ────────────────────────────────────────────────────────────────────────────

/** Nigerian states plus the aliases people actually type. */
const STATE_ALIASES: Record<string, string> = {
  abuja: "FCT (Abuja)",
  fct: "FCT (Abuja)",
  "federal capital territory": "FCT (Abuja)",
  lagos: "Lagos",
  "port harcourt": "Rivers",
  ph: "Rivers",
  "ph city": "Rivers",
  rivers: "Rivers",
  ibadan: "Oyo",
  oyo: "Oyo",
  kano: "Kano",
  enugu: "Enugu",
  kaduna: "Kaduna",
  benin: "Edo",
  "benin city": "Edo",
  edo: "Edo",
  asaba: "Delta",
  "warri": "Delta",
  delta: "Delta",
  abeokuta: "Ogun",
  ogun: "Ogun",
  akure: "Ondo",
  ondo: "Ondo",
  oshogbo: "Osun",
  osogbo: "Osun",
  osun: "Osun",
  jos: "Plateau",
  plateau: "Plateau",
  ilorin: "Kwara",
  kwara: "Kwara",
  makurdi: "Benue",
  benue: "Benue",
  calabar: "Cross River",
  "cross river": "Cross River",
  umuahia: "Abia",
  abia: "Abia",
  owerri: "Imo",
  imo: "Imo",
  awka: "Anambra",
  onitsha: "Anambra",
  anambra: "Anambra",
  yola: "Adamawa",
  adamawa: "Adamawa",
  maiduguri: "Borno",
  borno: "Borno",
  sokoto: "Sokoto",
  katsina: "Katsina",
  bauchi: "Bauchi",
  gombe: "Gombe",
  damaturu: "Yobe",
  yobe: "Yobe",
  gusau: "Zamfara",
  zamfara: "Zamfara",
  "dutse": "Jigawa",
  jigawa: "Jigawa",
  birnin: "Kebbi",
  kebbi: "Kebbi",
  lafia: "Nasarawa",
  nasarawa: "Nasarawa",
  minna: "Niger",
  bida: "Niger",
  niger: "Niger",
  lokoja: "Kogi",
  kogi: "Kogi",
  jalingo: "Taraba",
  taraba: "Taraba",
  yenagoa: "Bayelsa",
  bayelsa: "Bayelsa",
  "akwa ibom": "Akwa Ibom",
  uyo: "Akwa Ibom",
  abakaliki: "Ebonyi",
  ebonyi: "Ebonyi",
};

/**
 * Best guess at the state in a free-text location. Returns null when nothing
 * matches — routing then refuses to place the job, which is correct: a job we
 * cannot place is a question for a human, not something to guess at (L15).
 */
export function guessState(location: string | null | undefined): string | null {
  if (!location) return null;
  const text = ` ${location.toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s{2,}/g, " ")} `;
  // Longest alias first, so "akwa ibom" wins over "ibom" and "port harcourt"
  // over a bare "ph" inside another word.
  const aliases = Object.keys(STATE_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of aliases) {
    if (text.includes(` ${alias} `)) return STATE_ALIASES[alias];
  }
  return null;
}

/** The town/area part of a location, for the city-match bonus. */
export function guessCity(location: string | null | undefined): string | null {
  if (!location) return null;
  const first = location
    .split(",")[0]
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!first) return null;
  // "Lagos" alone is a state, not a district — no city bonus either way.
  return first.length > 1 && first.length <= 40 ? first : null;
}

const SIZE_BUCKETS = [
  { max: 2, bucket: "1–2kVA" },
  { max: 5, bucket: "3–5kVA" },
  { max: 10, bucket: "5–10kVA" },
  { max: 999, bucket: "10kVA+" },
] as const;

/**
 * Read a system size out of a quote summary. The calculator writes sizes like
 * "5kVA / 10.24kWh", so the largest kVA mentioned is the one that matters for
 * "can this partner handle it". Returns null when there is no size in the text,
 * in which case routing treats size as unconstrained rather than guessing.
 */
export function sizeBucketFromText(text: string | null | undefined): string | null {
  if (!text) return null;
  const matches = [...text.matchAll(/(\d+(?:\.\d+)?)\s*k?va/gi)].map((m) => Number(m[1]));
  const kva = matches.filter((n) => Number.isFinite(n) && n > 0).sort((a, b) => b - a)[0];
  if (!kva) return null;
  return SIZE_BUCKETS.find((b) => kva <= b.max)?.bucket ?? "10kVA+";
}