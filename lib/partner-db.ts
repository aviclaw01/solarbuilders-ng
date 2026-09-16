/**
 * SolarBuilders.ng — partner pipeline data access (server-only).
 *
 * One place where the partner tables are read and written, following the pattern
 * already used by app/api/quote-request/route.ts and the admin dashboards:
 * plain `fetch` against Supabase PostgREST with the service-role key. No ORM, no
 * Supabase client library, no caching — every page that uses this is
 * `force-dynamic` because the numbers change under you.
 *
 * Two rules this module exists to enforce:
 *   1. `supabaseEnv()` returns null instead of throwing, so a deployment without
 *      Supabase shows an honest empty state rather than a crash or invented data.
 *   2. Every read that feeds a public page goes through `listPublicPartners()`,
 *      which projects to the safe columns. Nothing else may be used for public
 *      rendering — that is how phone numbers and bank details stay off the site.
 */

import "server-only";
import {
  PARTNER_KINDS,
  PARTNER_STATUSES,
  type PartnerEventRow,
  type PartnerJobRow,
  type PartnerPaymentRow,
  type PartnerRow,
} from "./partners";

/** Columns safe to render on the public site. Deliberately narrow (L8a, L14). */
export const PUBLIC_PARTNER_COLUMNS = [
  "id",
  "slug",
  "kind",
  "business_name",
  "city",
  "state",
  "coverage_states",
  "services",
  "system_sizes",
  "brands_carried",
  "years_in_business",
  "warranty_months",
  "verified_at",
  "verified_until",
  "verification_scope",
  "check_cac",
  "check_installs",
  "check_references",
  "check_warranty",
  "public_blurb",
  "public_highlights",
  "tier",
  "status",
  "verified",
  "listed",
].join(",");

let warnedMissingEnv = false;

export function supabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url.includes("your-project")) {
    if (!warnedMissingEnv) {
      warnedMissingEnv = true;
      console.error(
        "[partner-db] NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — partner programme storage is disabled",
      );
    }
    return null;
  }
  return { url, key };
}

export type DbResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; body: string }
  | { ok: false; status: 0; body: "not-configured" };

/**
 * One PostgREST call. `path` is everything after `/rest/v1/`, including the
 * query string. Never logs the key; never returns a row count as success.
 */
async function rest<T>(
  path: string,
  init: { method?: string; body?: unknown; prefer?: string } = {},
): Promise<DbResult<T>> {
  const env = supabaseEnv();
  if (!env) return { ok: false, status: 0, body: "not-configured" };

  const headers: Record<string, string> = {
    apikey: env.key,
    Authorization: `Bearer ${env.key}`,
    Accept: "application/json",
  };
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  if (init.prefer) headers.Prefer = init.prefer;

  let res: Response;
  try {
    res = await fetch(`${env.url}/rest/v1/${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    });
  } catch (err) {
    console.error("[partner-db] network failure:", err);
    return { ok: false, status: 502, body: "network" };
  }

  if (!res.ok) {
    // Log the status and PostgREST message server-side; never echo it to a page.
    const body = await res.text().catch(() => "");
    console.error("[partner-db] PostgREST error:", res.status, body.slice(0, 400));
    return { ok: false, status: res.status, body };
  }

  // 204 (Prefer: return=minimal) has no body.
  if (res.status === 204) return { ok: true, data: [] as unknown as T };
  const text = await res.text();
  if (!text) return { ok: true, data: [] as unknown as T };
  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return { ok: false, status: 500, body: "unparseable" };
  }
}

/** Build a query string, dropping empty values. */
function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    sp.set(k, String(v));
  }
  return sp.toString();
}

// ─────────────────────────────────────────────────────────────────────────────
// RAW ACCESS — for anything the specific helpers below do not cover
// ─────────────────────────────────────────────────────────────────────────────

export async function dbGet<T>(table: string, params: Record<string, string | number | undefined>): Promise<T[]> {
  const res = await rest<T[]>(`${table}?${qs(params)}`);
  return res.ok ? res.data : [];
}

export async function dbGetChecked<T>(
  table: string,
  params: Record<string, string | number | undefined>,
): Promise<DbResult<T[]>> {
  return rest<T[]>(`${table}?${qs(params)}`);
}

export async function dbInsert<T>(table: string, rows: unknown, returning = true): Promise<DbResult<T[]>> {
  return rest<T[]>(table, {
    method: "POST",
    body: rows,
    prefer: returning ? "return=representation" : "return=minimal",
  });
}

export async function dbPatch<T>(
  table: string,
  filter: Record<string, string | number>,
  patch: Record<string, unknown>,
): Promise<DbResult<T[]>> {
  return rest<T[]>(`${table}?${qs(filter)}`, {
    method: "PATCH",
    body: patch,
    prefer: "return=representation",
  });
}

/** Count rows matching a filter, using PostgREST's exact count. */
export async function dbCount(
  table: string,
  filter: Record<string, string | number | undefined> = {},
): Promise<number | null> {
  const env = supabaseEnv();
  if (!env) return null;
  const sp = new URLSearchParams(qs({ ...filter, select: "id", limit: "1" }));
  try {
    const res = await fetch(`${env.url}/rest/v1/${table}?${sp.toString()}`, {
      headers: {
        apikey: env.key,
        Authorization: `Bearer ${env.key}`,
        Prefer: "count=exact",
        Range: "0-0",
      },
      cache: "no-store",
    });
    const range = res.headers.get("content-range");
    if (!range) return null;
    const total = Number(range.split("/")[1]);
    return Number.isFinite(total) ? total : null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTNERS
// ─────────────────────────────────────────────────────────────────────────────

export async function createPartner(row: Record<string, unknown>): Promise<PartnerRow | null> {
  const res = await dbInsert<PartnerRow>("partners", row);
  if (!res.ok) return null;
  return res.data[0] ?? null;
}

export async function getPartner(id: number): Promise<PartnerRow | null> {
  const rows = await dbGet<PartnerRow>("partners", { select: "*", id: `eq.${id}`, limit: "1" });
  return rows[0] ?? null;
}

export async function listPartners(opts: {
  status?: string;
  kind?: string;
  /** free-text match on business name, ref or email */
  search?: string;
  limit?: number;
} = {}): Promise<DbResult<PartnerRow[]>> {
  const filter: Record<string, string | number | undefined> = {
    select: "*",
    order: "created_at.desc",
    limit: opts.limit ?? 300,
  };
  // Allow-listed, so a query-string value can never become a PostgREST operator.
  if (opts.status && (PARTNER_STATUSES as readonly string[]).includes(opts.status)) {
    filter.status = `eq.${opts.status}`;
  }
  if (opts.kind && PARTNER_KINDS.some((k) => k.id === opts.kind)) filter.kind = `eq.${opts.kind}`;
  if (opts.search) {
    // PostgREST or=(…) is its own mini-syntax: keep only characters that cannot
    // break out of it (no parens, commas, quotes, backslashes or wildcards).
    const s = opts.search.replace(/[^\p{L}\p{N} @._+-]/gu, " ").replace(/\s{2,}/g, " ").trim().slice(0, 80);
    if (s) filter.or = `(business_name.ilike.*${s}*,ref.ilike.*${s}*,email.ilike.*${s}*)`;
  }
  return dbGetChecked<PartnerRow>("partners", filter);
}

/**
 * Approved, verified and listed, inside the verification window (L1). Reads only
 * the public column set — this is the ONLY function a public page may use.
 */
export async function listPublicPartners(limit = 100): Promise<PartnerRow[]> {
  const rows = await dbGet<PartnerRow>("partners", {
    select: PUBLIC_PARTNER_COLUMNS,
    status: "eq.approved",
    verified: "eq.true",
    listed: "eq.true",
    order: "verified_at.desc.nullslast",
    limit,
  });
  // `verified_until` cannot be filtered through PostgREST without an `or` over two
  // timestamp formats, so the window is applied here, in JS, on verified rows only.
  const now = Date.now();
  return rows.filter((r) => {
    if (!r.verified_until) return true;
    const until = new Date(r.verified_until).getTime();
    return Number.isNaN(until) ? true : until > now;
  });
}

/**
 * The applicant's own status lookup: reference AND email, both required. One
 * without the other returns nothing, so the page cannot be used to find out who
 * has applied (L17).
 */
export async function partnerByRefAndEmail(ref: string, email: string): Promise<PartnerRow | null> {
  const r = ref.trim().toUpperCase().slice(0, 20);
  const e = email.trim().toLowerCase().slice(0, 160);
  if (!/^SB-PTR-[A-Z0-9]{6}$/.test(r) || !e.includes("@")) return null;
  const rows = await dbGet<PartnerRow>("partners", {
    select: "*",
    ref: `eq.${r}`,
    email: `eq.${e}`,
    limit: "1",
  });
  return rows[0] ?? null;
}

/** Slugs already in use, for `uniqueSlug`. */
export async function slugsTaken(): Promise<string[]> {
  const rows = await dbGet<{ slug: string | null }>("partners", { select: "slug", limit: "1000" });
  return rows.map((r) => r.slug).filter((s): s is string => Boolean(s));
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT TRAIL
// ─────────────────────────────────────────────────────────────────────────────

export async function logPartnerEvent(
  partnerId: number,
  actor: string,
  action: string,
  detail?: string,
  jobId?: number,
): Promise<void> {
  await dbInsert(
    "partner_events",
    {
      partner_id: partnerId,
      actor: actor.slice(0, 80),
      action: action.slice(0, 80),
      detail: detail ? detail.slice(0, 1000) : null,
      job_id: jobId ?? null,
    },
    false,
  );
}

export async function listPartnerEvents(partnerId: number, limit = 60): Promise<PartnerEventRow[]> {
  return dbGet<PartnerEventRow>("partner_events", {
    select: "*",
    partner_id: `eq.${partnerId}`,
    order: "created_at.desc",
    limit,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// JOBS
// ─────────────────────────────────────────────────────────────────────────────

export async function listJobsForPartner(partnerId: number, limit = 100): Promise<PartnerJobRow[]> {
  return dbGet<PartnerJobRow>("partner_jobs", {
    select: "*",
    partner_id: `eq.${partnerId}`,
    order: "created_at.desc",
    limit,
  });
}

export async function getJob(id: number): Promise<PartnerJobRow | null> {
  const rows = await dbGet<PartnerJobRow>("partner_jobs", { select: "*", id: `eq.${id}`, limit: "1" });
  return rows[0] ?? null;
}

export async function listJobsForSource(source: string, sourceId: number): Promise<PartnerJobRow[]> {
  return dbGet<PartnerJobRow>("partner_jobs", {
    select: "*",
    source: `eq.${source}`,
    source_id: `eq.${sourceId}`,
    order: "created_at.desc",
  });
}

/**
 * Release offers nobody answered (L9). Called lazily from the admin routing page,
 * so an unanswered offer frees the job without a cron job.
 * Returns how many offers were released.
 */
export async function expireStaleOffers(): Promise<number> {
  const nowIso = new Date().toISOString();
  const res = await dbPatch<PartnerJobRow>(
    "partner_jobs",
    { status: "eq.offered", offer_expires_at: `lt.${nowIso}` },
    { status: "expired", responded_at: nowIso },
  );
  return res.ok ? res.data.length : 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMISSION
// ────────────────────────────────────────────────────────────────────────────

export async function listPaymentsForPartner(partnerId: number, limit = 100): Promise<PartnerPaymentRow[]> {
  return dbGet<PartnerPaymentRow>("partner_payments", {
    select: "*",
    partner_id: `eq.${partnerId}`,
    order: "created_at.desc",
    limit,
  });
}

export async function listPaymentsForJob(jobId: number): Promise<PartnerPaymentRow[]> {
  return dbGet<PartnerPaymentRow>("partner_payments", {
    select: "*",
    job_id: `eq.${jobId}`,
    order: "created_at.desc",
  });
}

export async function listRecentPayments(limit = 100): Promise<PartnerPaymentRow[]> {
  return dbGet<PartnerPaymentRow>("partner_payments", { select: "*", order: "created_at.desc", limit });
}

export interface PartnerJobStats {
  openJobs: number;
  completedJobs: number;
  hasDueCommission: boolean;
  commissionOverdueDays: number | null;
  /** most recent job activity — used to spot a partner who stopped responding */
  lastJobAt: string | null;
}

const EMPTY_STATS: PartnerJobStats = {
  openJobs: 0,
  completedJobs: 0,
  hasDueCommission: false,
  commissionOverdueDays: null,
  lastJobAt: null,
};

/** Job states that mean money is owed to us and not yet confirmed (L5). */
export const COMMISSION_DUE_STATES = ["due", "overdue", "receipt_uploaded"];

/**
 * Aggregate every partner's job state in one read, bucketed in JS.
 *
 * Deliberately not a SQL view or a per-partner count loop: the whole table is a
 * few hundred rows for the foreseeable future, and one read inside a server
 * component is easier to reason about than a dozen round trips.
 */
export async function jobStatsByPartner(now = new Date()): Promise<Map<number, PartnerJobStats>> {
  const jobs = await dbGet<PartnerJobRow>("partner_jobs", { select: "*", limit: "5000" });
  const out = new Map<number, PartnerJobStats>();

  for (const job of jobs) {
    const cur = out.get(job.partner_id) ?? { ...EMPTY_STATS };

    if (job.status === "accepted") cur.openJobs += 1;
    if (job.status === "completed") cur.completedJobs += 1;

    if (COMMISSION_DUE_STATES.includes(job.commission_status)) {
      cur.hasDueCommission = true;
      const dueAt = job.commission_due_at ? new Date(job.commission_due_at).getTime() : null;
      const days = dueAt && !Number.isNaN(dueAt) ? (now.getTime() - dueAt) / 86_400_000 : 0;
      cur.commissionOverdueDays = Math.max(cur.commissionOverdueDays ?? 0, days);
    }

    if (!cur.lastJobAt || job.created_at > cur.lastJobAt) cur.lastJobAt = job.created_at;
    out.set(job.partner_id, cur);
  }

  return out;
}

export async function jobStatsForPartner(partnerId: number, now = new Date()): Promise<PartnerJobStats> {
  const all = await jobStatsByPartner(now);
  return all.get(partnerId) ?? { ...EMPTY_STATS };
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTING POOL
// ─────────────────────────────────────────────────────────────────────────────

export interface RoutingCandidate {
  partner: PartnerRow;
  stats: PartnerJobStats;
}

/**
 * Every partner eligible to be considered for routing, with their live job stats.
 *
 * Called only from /admin/routing (superadmin), so the full row — including the
 * contact details needed to send an offer — is fine here. The routing decision
 * itself is made by `rankPartners()` in lib/routing.ts, which sees only
 * `capabilityFrom()` output and no personal data at all.
 *
 * Also releases expired offers first (L9), so an unanswered offer frees the job
 * the next time an admin looks at this page.
 */
export async function routingCandidates(
  now = new Date(),
  opts: { ignoreListed?: boolean } = {},
): Promise<{ candidates: RoutingCandidate[]; releasedOffers: number }> {
  const releasedOffers = await expireStaleOffers();

  const filter: Record<string, string | number | undefined> = {
    select: "*",
    status: "eq.approved",
    verified: "eq.true",
    order: "business_name.asc",
    limit: "500",
  };
  if (!opts.ignoreListed) filter.listed = "eq.true";

  const [partners, stats] = await Promise.all([dbGet<PartnerRow>("partners", filter), jobStatsByPartner(now)]);

  // A verification past its re-check date no longer counts (L1).
  const current = partners.filter((p) => {
    if (!p.verified_until) return true;
    const until = new Date(p.verified_until).getTime();
    return Number.isNaN(until) ? false : until > now.getTime();
  });

  return {
    releasedOffers,
    candidates: current.map((partner) => ({
      partner,
      stats: stats.get(partner.id) ?? { ...EMPTY_STATS },
    })),
  };
}

/** One public partner by slug, projected to the safe columns only (L8a). */
export async function getPublicPartnerBySlug(slug: string): Promise<PartnerRow | null> {
  const rows = await dbGet<PartnerRow>("partners", {
    select: PUBLIC_PARTNER_COLUMNS,
    slug: `eq.${slug.slice(0, 80)}`,
    status: "eq.approved",
    verified: "eq.true",
    listed: "eq.true",
    limit: "1",
  });
  const row = rows[0];
  if (!row) return null;
  if (row.verified_until) {
    const until = new Date(row.verified_until).getTime();
    if (!Number.isNaN(until) && until <= Date.now()) return null;
  }
  return row;
}
