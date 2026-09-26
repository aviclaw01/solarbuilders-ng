import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/ui/AdminPageHeader";
import { revalidatePath } from "next/cache";
import {
  AlertTriangle,
  ArrowUpRight,
  Clock,
  Inbox,
  MessageCircle,
  Phone,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { formatNaira } from "@/lib/quote";

/**
 * Internal leads dashboard — every "Get this system built" submission from
 * the calculator, newest first.
 *
 * Auth: HTTP Basic, enforced in proxy.ts for /admin/* (ADMIN_USER /
 * ADMIN_PASSWORD). There is no auth logic in this file — if you can render
 * it, the middleware already let you through.
 *
 * Data: read straight from Supabase PostgREST with the service-role key,
 * same pattern as app/api/quote-request/route.ts. No ORM, no client JS —
 * filters are links, the status control is a plain form + server action.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leads — SolarBuilders admin",
  robots: { index: false, follow: false },
};

// ─────────────────────────────────────────────────────────
// TYPES & CONSTANTS
// ─────────────────────────────────────────────────────────

const STATUSES = ["new", "contacted", "quoted", "won", "lost"] as const;
type Status = (typeof STATUSES)[number];

/** Rows per page on the quote-request list. */
const PAGE_SIZE = 50;

/** Ceiling on the pipeline-value sum, in case the desk ever fills up. */
const PIPELINE_ROWS_CAP = 500;

/** Newest enquiry rows shown in the enquiries section below the list. */
const ENQUIRY_LIMIT = 100;

/**
 * A row from `leads` — the homepage "size it for me" modal and the contact
 * form. These are NOT priced requests: no quote, no total, and the homepage
 * modal does not even collect a name. They live in their own table for that
 * reason, and they are shown here rather than on a page of their own because
 * AdminNav is owned elsewhere and a page nobody can navigate to is a page
 * nobody reads.
 */
interface Enquiry {
  id: number;
  created_at: string;
  kind: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  location: string | null;
  message: string | null;
  payload: Record<string, unknown> | null;
  status: string;
}

const ENQUIRY_KIND_LABEL: Record<string, string> = {
  lead_capture: "Homepage — size it for me",
  contact: "Contact form",
};

/** Newest enquiry rows, plus the exact total so "newest 100 of N" is honest. */
async function fetchEnquiries(): Promise<
  { ok: true; rows: Enquiry[]; total: number | null } | { ok: false; status: number }
> {
  const env = supabaseEnv();
  if (!env) return { ok: false, status: 0 };
  const params = new URLSearchParams({ select: "*", order: "created_at.desc", limit: String(ENQUIRY_LIMIT) });
  try {
    const res = await fetch(`${env.url}/rest/v1/leads?${params.toString()}`, {
      headers: {
        apikey: env.key,
        Authorization: `Bearer ${env.key}`,
        Accept: "application/json",
        Prefer: "count=exact",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[admin/leads] enquiries read failed:", res.status, (await res.text()).slice(0, 200));
      return { ok: false, status: res.status };
    }
    return { ok: true, rows: (await res.json()) as Enquiry[], total: exactCount(res) };
  } catch (err) {
    console.error("[admin/leads] enquiries fetch failed:", err);
    return { ok: false, status: 502 };
  }
}

interface Lead {
  id: number;
  created_at: string;
  quote_code: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  location: string | null;
  note: string | null;
  tier: string | null;
  total_best: number | null;
  total_low: number | null;
  total_high: number | null;
  quote_url: string | null;
  summary: string | null;
  status: string | null;
}

const STATUS_STYLES: Record<Status, string> = {
  new: "bg-amber-50 text-amber-700 border-amber-200",
  contacted: "bg-sky-50 text-sky-700 border-sky-200",
  quoted: "bg-indigo-50 text-indigo-700 border-indigo-200",
  won: "bg-emerald-50 text-emerald-700 border-emerald-200",
  lost: "bg-slate-100 text-slate-500 border-slate-200",
};

function isStatus(value: unknown): value is Status {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

// en-US for the month abbreviation ("Sep", where en-GB gives "Sept"), and
// hourCycle h23 so midnight renders 00:xx rather than 24:xx.
const LAGOS_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: "Africa/Lagos",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "14 Sep, 18:42" in Africa/Lagos — the only timezone the team works in. */
function formatLagos(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const parts = LAGOS_FORMAT.formatToParts(d);
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("day")} ${get("month")}, ${get("hour")}:${get("minute")}`;
}

/**
 * wa.me needs an international number with no punctuation. Nigerian leads
 * type "0803…" far more often than "+234803…", so normalise the local form.
 */
function whatsappDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  if (digits.length === 10) return `234${digits}`;
  return digits;
}

/**
 * PostgREST `or=(…)` is a comma/paren-delimited mini-syntax, so strip the
 * characters that would let a search term break out of it. What is left is
 * URL-encoded as a whole when the query string is assembled.
 */
function sanitiseSearch(q: string): string {
  return q.replace(/[(),"\\]/g, " ").trim().slice(0, 80);
}

function supabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url.includes("your-project")) return null;
  return { url, key };
}

type FetchResult =
  | { ok: true; rows: Lead[]; total: number | null }
  | { ok: false; kind: "env" }
  | { ok: false; kind: "http"; status: number }
  | { ok: false; kind: "network" };

/**
 * The exact total from a count=exact read's Content-Range ("0-49/183"), or
 * null when the server could not count. null means "unknown", never 0 — the
 * desk renders a dash rather than a confident wrong number.
 */
function exactCount(res: Response): number | null {
  const tail = (res.headers.get("content-range") ?? "").split("/")[1];
  const n = Number(tail);
  return tail && tail !== "*" && Number.isFinite(n) ? n : null;
}

/**
 * One window of the quote-request list: `page` is 1-based, PAGE_SIZE rows,
 * `count=exact` so the pager knows the real total without pulling it. Params
 * carry the ordering and any filters; the caller walks the page back if the
 * URL pointed past the last row (PostgREST answers 416 there).
 */
async function fetchLeads(params: URLSearchParams, page: number): Promise<FetchResult> {
  const env = supabaseEnv();
  if (!env) return { ok: false, kind: "env" };

  const from = (page - 1) * PAGE_SIZE;
  let res: Response;
  try {
    res = await fetch(`${env.url}/rest/v1/quote_requests?${params.toString()}`, {
      headers: {
        apikey: env.key,
        Authorization: `Bearer ${env.key}`,
        Accept: "application/json",
        Prefer: "count=exact",
        Range: `${from}-${from + PAGE_SIZE - 1}`,
      },
      cache: "no-store",
    });
  } catch (err) {
    console.error("[admin/leads] Supabase fetch failed:", err);
    return { ok: false, kind: "network" };
  }

  if (!res.ok) {
    console.error("[admin/leads] Supabase read failed:", res.status, await res.text());
    return { ok: false, kind: "http", status: res.status };
  }

  return { ok: true, rows: (await res.json()) as Lead[], total: exactCount(res) };
}

type StatusCounts = Record<Status, number>;

/**
 * Exact counts per status from one tiny count read per status. Aggregates
 * (`count()`, `sum()`) are switched off on this Supabase project (PGRST123,
 * verified live), so a group-by is not available; counting per status
 * transfers no rows and stays correct as the table outgrows any page size.
 */
async function readStatusCounts(params: URLSearchParams): Promise<StatusCounts | null> {
  const results = await Promise.all(
    STATUSES.map(async (s) => {
      const p = new URLSearchParams(params);
      p.set("status", `eq.${s}`);
      return [s, await readCount(p)] as const;
    }),
  );
  if (results.some(([, n]) => n === null)) return null;
  const out = {} as StatusCounts;
  for (const [s, n] of results) out[s] = n as number;
  return out;
}

/** One exact count; null when the read failed or the server could not count. */
async function readCount(params: URLSearchParams): Promise<number | null> {
  const env = supabaseEnv();
  if (!env) return null;
  try {
    const res = await fetch(`${env.url}/rest/v1/quote_requests?${params.toString()}`, {
      headers: {
        apikey: env.key,
        Authorization: `Bearer ${env.key}`,
        Accept: "application/json",
        Prefer: "count=exact",
        Range: "0-0",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[admin/leads] count read failed:", res.status);
      return null;
    }
    return exactCount(res);
  } catch (err) {
    console.error("[admin/leads] count read failed:", err);
    return null;
  }
}

/**
 * Pipeline estimate: the sum of mid-range totals over the newest open rows
 * (new + contacted). There is no server-side sum on this project, so rows are
 * fetched up to PIPELINE_ROWS_CAP and added here; `capped` lets the card say
 * so instead of quietly pretending the number is the whole pipeline.
 */
async function readPipeline(params: URLSearchParams): Promise<{ value: number; capped: boolean } | null> {
  const env = supabaseEnv();
  if (!env) return null;
  const cappedParams = new URLSearchParams(params);
  cappedParams.set("limit", String(PIPELINE_ROWS_CAP + 1));
  try {
    const res = await fetch(`${env.url}/rest/v1/quote_requests?${cappedParams.toString()}`, {
      headers: { apikey: env.key, Authorization: `Bearer ${env.key}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[admin/leads] pipeline read failed:", res.status);
      return null;
    }
    const rows = (await res.json()) as { total_best: number | null }[];
    const capped = rows.length > PIPELINE_ROWS_CAP;
    const scoped = capped ? rows.slice(0, PIPELINE_ROWS_CAP) : rows;
    return { value: scoped.reduce((sum, r) => sum + (r.total_best ?? 0), 0), capped };
  } catch (err) {
    console.error("[admin/leads] pipeline read failed:", err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// SERVER ACTION — status change
// ─────────────────────────────────────────────────────────

async function updateStatus(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  const status = formData.get("status");

  if (!Number.isInteger(id) || id <= 0) {
    console.error("[admin/leads] updateStatus: bad id", formData.get("id"));
    return;
  }
  if (!isStatus(status)) {
    console.error("[admin/leads] updateStatus: rejected status", status);
    return;
  }

  const env = supabaseEnv();
  if (!env) {
    console.error("[admin/leads] updateStatus: Supabase env missing");
    return;
  }

  try {
    const res = await fetch(`${env.url}/rest/v1/quote_requests?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        apikey: env.key,
        Authorization: `Bearer ${env.key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ status }),
      cache: "no-store",
    });
    if (!res.ok) console.error("[admin/leads] status PATCH failed:", res.status, await res.text());
  } catch (err) {
    console.error("[admin/leads] status PATCH failed:", err);
  }

  revalidatePath("/admin/leads");
}

// ─────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}

export default async function AdminLeadsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const enquiries = await fetchEnquiries();
  const activeStatus = isStatus(sp.status) ? sp.status : "all";
  const rawQuery = (sp.q ?? "").trim();
  const searchTerm = sanitiseSearch(rawQuery);

  // Anything the URL mangles becomes page 1. A page past the end (a stale
  // link after rows are deleted) fails the range read and walks back below.
  const requestedPage = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  // Tiny count reads power the summary strip — exact totals, no row transfer,
  // no ceiling. Summing estimates needs rows, so the pipeline is capped and
  // labelled as such.
  const statusParams = new URLSearchParams({ select: "id", order: "created_at.desc" });
  const recentParams = new URLSearchParams({
    select: "id",
    created_at: `gte.${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}`,
  });
  const pipelineParams = new URLSearchParams({
    select: "total_best",
    status: "in.(new,contacted)",
    order: "created_at.desc",
  });
  // The filtered read powers the list, one page at a time.
  const listParams = new URLSearchParams({
    select: "*",
    order: "created_at.desc",
  });
  if (activeStatus !== "all") listParams.set("status", `eq.${activeStatus}`);
  if (searchTerm) {
    const like = `*${searchTerm}*`;
    listParams.set(
      "or",
      `(quote_code.ilike.${like},name.ilike.${like},phone.ilike.${like},location.ilike.${like})`,
    );
  }

  let page = requestedPage;
  let list: FetchResult = { ok: false, kind: "env" };
  for (;;) {
    list = await fetchLeads(listParams, page);
    if (list.ok || page <= 1) break;
    page -= 1;
  }

  const [statusCounts, recentCount, pipelineStats] = await Promise.all([
    readStatusCounts(statusParams),
    readCount(recentParams),
    readPipeline(pipelineParams),
  ]);

  // ── Error state ──────────────────────────────────────
  if (!list.ok) {
    return (
      <Shell>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-heading font-bold text-rose-900 text-lg">Could not load leads</h2>
              <p className="text-rose-800 text-sm mt-1">
                {list.kind === "env" && (
                  <>
                    Supabase is not configured on this deployment. Set{" "}
                    <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                    <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> in the environment, then
                    redeploy.
                  </>
                )}
                {list.kind === "http" && (
                  <>
                    Supabase answered with <b>HTTP {list.status}</b>. Check that the{" "}
                    <code className="font-mono">quote_requests</code> table exists and that the service-role
                    key is current. Full response is in the server logs.
                  </>
                )}
                {list.kind === "network" && (
                  <>Could not reach Supabase at all. See the server logs for the network error.</>
                )}
              </p>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  const leads = list.ok ? list.rows : [];
  const filteredTotal = list.ok ? list.total : null;
  const pageTotal = leads.length;
  const pageCount = filteredTotal !== null ? Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE)) : 1;
  const firstRow = (page - 1) * PAGE_SIZE + 1;

  // ── Summary numbers (exact, counted server-side) ─────
  const byStatus: Record<Status, number | null> = statusCounts ?? {
    new: null,
    contacted: null,
    quoted: null,
    won: null,
    lost: null,
  };
  const statusValues = Object.values(byStatus);
  const total: number | null = statusValues.every((n) => n === null)
    ? null
    : statusValues.reduce<number>((sum, n) => sum + (n ?? 0), 0);
  const last7 = recentCount;

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (activeStatus !== "all") params.set("status", activeStatus);
    if (rawQuery) params.set("q", rawQuery);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/leads?${qs}` : "/admin/leads";
  };

  const filterHref = (status: string) => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (rawQuery) params.set("q", rawQuery);
    const qs = params.toString();
    return qs ? `/admin/leads?${qs}` : "/admin/leads";
  };

  return (
    <Shell>
      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={<Users className="w-4 h-4" />}
          label="Total leads"
          value={total === null ? "—" : String(total)}
          hint={total === null ? "the exact count read failed — a dash is not a zero" : undefined}
        />
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Last 7 days"
          value={last7 === null ? "—" : String(last7)}
          tone="amber"
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Pipeline value, estimate only"
          value={pipelineStats === null ? "—" : formatNaira(pipelineStats.value)}
          hint={
            pipelineStats === null
              ? "the estimate read failed — a dash is not a zero"
              : pipelineStats.capped
                ? `summed over the newest ${PIPELINE_ROWS_CAP} open leads`
                : "new + contacted, at the mid-range total"
          }
        />
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">By status</div>
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((s) => (
              <span
                key={s}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[s]}`}
              >
                {s} <span className="font-mono">{byStatus[s]}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {statusCounts === null && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-6">
          The summary strip could not be counted exactly, so its numbers show dashes — the list below is unaffected.
        </p>
      )}

      {/* Filters */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["all", ...STATUSES] as const).map((s) => {
            const active = s === activeStatus;
            return (
              <Link
                key={s}
                href={filterHref(s)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold border transition-colors ${
                  active
                    ? "bg-[#0A0F1E] text-white border-[#0A0F1E]"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                }`}
              >
                {s === "all" ? "All" : s}
                {s !== "all" && <span className="ml-1.5 font-mono text-xs opacity-70">{byStatus[s]}</span>}
              </Link>
            );
          })}
        </div>

        <form method="get" action="/admin/leads" className="flex items-center gap-2">
          {activeStatus !== "all" && <input type="hidden" name="status" value={activeStatus} />}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              name="q"
              defaultValue={rawQuery}
              placeholder="Code, name, phone, location"
              className="w-full rounded-full border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-[#F59E0B] hover:bg-amber-500 text-slate-900 px-4 py-2 text-sm font-semibold transition-colors"
          >
            Search
          </button>
          {rawQuery && (
            <Link
              href={filterHref(activeStatus)}
              className="text-sm text-slate-500 hover:text-slate-800 px-2"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Results */}
      {leads.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center">
          <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <h2 className="font-heading font-bold text-slate-900 text-lg">
            {total === 0 && total !== null ? "No quote requests yet" : "Nothing matches this filter"}
          </h2>
          <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
            {total === 0 && total !== null ? (
              <>
                When somebody sizes a system on the calculator and submits &ldquo;Get this system
                built&rdquo;, the lead lands here.
              </>
            ) : (
              <>
                {total === null
                  ? "The exact total could not be counted."
                  : `${total} lead${total === 1 ? "" : "s"} in total.`}{" "}
                <Link href="/admin/leads" className="text-amber-600 font-semibold hover:underline">
                  Clear the filters
                </Link>{" "}
                to see them.
              </>
            )}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
          {/* Column headers — table-like from sm up, hidden on mobile cards */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
            <div className="col-span-2">When</div>
            <div className="col-span-2">Quote</div>
            <div className="col-span-3">Customer</div>
            <div className="col-span-2">Location / tier</div>
            <div className="col-span-1 text-right">Estimate</div>
            <div className="col-span-2">Status</div>
          </div>

          <ul className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <LeadRow key={lead.id} lead={lead} />
            ))}
          </ul>

          <Pager
            page={page}
            pageCount={pageCount}
            pageHref={pageHref}
            shown={pageTotal}
            total={filteredTotal}
            firstRow={firstRow}
          />
        </div>
      )}

      <EnquiriesSection result={enquiries} />
    </Shell>
  );
}

/**
 * Enquiries that carry no quote. Separate from the table above on purpose:
 * they have no quote code, no tier and no estimate, and forcing them into
 * those columns would mean four empty cells and a row that reads as broken.
 */
function EnquiriesSection({
  result,
}: {
  result: { ok: true; rows: Enquiry[]; total: number | null } | { ok: false; status: number };
}) {
  return (
    <section className="mt-10">
      <h2 className="font-heading font-bold text-slate-900 text-lg mb-1">Enquiries</h2>
      <p className="text-slate-500 text-sm mb-4">
        The homepage &ldquo;size it for me&rdquo; modal and the contact form. No quote attached &mdash; somebody asking
        us to get in touch.
        {result.ok && result.total !== null && result.total > result.rows.length && (
          <> Showing the newest {result.rows.length} of {result.total}.</>
        )}
      </p>

      {!result.ok ? (
        <div className="border border-rose-200 bg-rose-50 rounded-2xl px-4 py-3 text-sm text-rose-800">
          {result.status === 0
            ? "Supabase is not configured on this deployment, so enquiries cannot be shown."
            : `Could not read the enquiries table (HTTP ${result.status}). This is a read failure, not an empty inbox — run supabase/leads.sql if the table is missing.`}
        </div>
      ) : result.rows.length === 0 ? (
        <p className="border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-500">
          No enquiries yet. They arrive here as soon as somebody uses the homepage modal or the contact form.
        </p>
      ) : (
        <ul className="border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
          {result.rows.map((e) => {
            const size = typeof e.payload?.systemSize === "string" ? e.payload.systemSize : null;
            const digits = e.phone ? whatsappDigits(e.phone) : "";
            return (
              <li key={e.id} className="px-4 py-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-xs text-slate-400">{formatLagos(e.created_at)}</span>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
                    {ENQUIRY_KIND_LABEL[e.kind] ?? e.kind}
                  </span>
                  {e.name && <span className="font-heading font-semibold text-slate-900">{e.name}</span>}
                  {e.location && <span className="text-sm text-slate-600">{e.location}</span>}
                  {size && <span className="text-sm text-slate-600">{size}</span>}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                  {e.phone && (
                    <>
                      <a href={`tel:${e.phone}`} className="text-xs text-slate-600 hover:text-slate-900">
                        {e.phone}
                      </a>
                      {digits && (
                        <a
                          href={`https://wa.me/${digits}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-600 font-semibold hover:underline"
                        >
                          WhatsApp
                        </a>
                      )}
                    </>
                  )}
                  {e.email && (
                    <a href={`mailto:${e.email}`} className="text-xs text-slate-500 hover:text-slate-800 truncate">
                      {e.email}
                    </a>
                  )}
                </div>

                {e.message && <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{e.message}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// PIECES
// ─────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader title="Quote requests" subtitle="Every 'Get this system built' submission from the calculator." />
      {children}
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "amber";
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <div
        className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide mb-1 ${
          tone === "amber" ? "text-amber-600" : "text-slate-400"
        }`}
      >
        {icon}
        <span>{label}</span>
      </div>
      <div className="font-heading font-extrabold text-slate-900 text-xl md:text-2xl">{value}</div>
      {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const s = isStatus(status) ? status : null;
  const cls = s ? STATUS_STYLES[s] : "bg-slate-100 text-slate-500 border-slate-200";
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {status || "unknown"}
    </span>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  const phone = lead.phone?.trim() || "";
  const wa = phone ? whatsappDigits(phone) : "";

  return (
    <li className="px-4 py-4 sm:grid sm:grid-cols-12 sm:gap-3 sm:items-start hover:bg-slate-50/60 transition-colors">
      {/* When */}
      <div className="sm:col-span-2 flex items-baseline justify-between sm:block">
        <span className="text-sm text-slate-500">{formatLagos(lead.created_at)}</span>
        <span className="sm:hidden">
          <StatusBadge status={lead.status} />
        </span>
      </div>

      {/* Quote code + link */}
      <div className="sm:col-span-2 mt-2 sm:mt-0">
        <div className="font-mono text-sm text-slate-900 font-semibold">{lead.quote_code || "—"}</div>
        {lead.quote_url && (
          <a
            href={lead.quote_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-amber-600 font-semibold hover:underline mt-0.5"
          >
            Open quote <ArrowUpRight className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Customer */}
      <div className="sm:col-span-3 mt-2 sm:mt-0">
        <div className="text-sm font-semibold text-slate-900">{lead.name || "—"}</div>
        {phone ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
            <a
              href={`tel:${phone.replace(/[^\d+]/g, "")}`}
              className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
            >
              <Phone className="w-3 h-3" /> {phone}
            </a>
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold hover:underline"
            >
              <MessageCircle className="w-3 h-3" /> WhatsApp
            </a>
          </div>
        ) : (
          <div className="text-xs text-slate-400 mt-0.5">no phone</div>
        )}
        {lead.email && (
          <a
            href={`mailto:${lead.email}`}
            className="block text-xs text-slate-500 hover:text-slate-800 mt-0.5 truncate"
          >
            {lead.email}
          </a>
        )}
      </div>

      {/* Location / tier */}
      <div className="sm:col-span-2 mt-2 sm:mt-0">
        <div className="text-sm text-slate-700">{lead.location || "—"}</div>
        {lead.tier && <div className="text-xs text-slate-400 capitalize">{lead.tier}</div>}
      </div>

      {/* Estimate */}
      <div className="sm:col-span-1 mt-2 sm:mt-0 sm:text-right">
        <div className="font-heading font-bold text-sm text-slate-900">
          {lead.total_best == null ? "—" : formatNaira(lead.total_best)}
        </div>
        {lead.total_low != null && lead.total_high != null && (
          <div className="text-[11px] text-slate-400 leading-tight">
            {formatNaira(lead.total_low)} – {formatNaira(lead.total_high)}
          </div>
        )}
      </div>

      {/* Status control */}
      <div className="sm:col-span-2 mt-3 sm:mt-0">
        <div className="hidden sm:block mb-1.5">
          <StatusBadge status={lead.status} />
        </div>
        <form action={updateStatus} className="flex items-center gap-1.5">
          <input type="hidden" name="id" value={lead.id} />
          <select
            name="status"
            defaultValue={isStatus(lead.status) ? lead.status : "new"}
            aria-label={`Status for ${lead.quote_code || `lead ${lead.id}`}`}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-slate-400"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 hover:bg-slate-700 text-white px-2.5 py-1 text-xs font-semibold transition-colors"
          >
            Save
          </button>
        </form>
      </div>

      {/* Note + full BOM */}
      {(lead.note || lead.summary) && (
        <details className="sm:col-span-12 mt-3 group">
          <summary className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-800 list-none inline-flex items-center gap-1">
            <span className="group-open:hidden">Show note &amp; system breakdown</span>
            <span className="hidden group-open:inline">Hide note &amp; system breakdown</span>
          </summary>
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            {lead.note && (
              <div className="rounded-xl border border-slate-100 bg-amber-50/50 p-3">
                <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide mb-1">
                  Note from customer
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{lead.note}</p>
              </div>
            )}
            {lead.summary && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                  Bill of materials
                </div>
                <pre className="text-xs text-slate-700 whitespace-pre-wrap break-words font-mono">
                  {lead.summary}
                </pre>
              </div>
            )}
          </div>
        </details>
      )}
    </li>
  );
}

/**
 * Server-rendered pager — no client JS. Links preserve the status and search
 * filters, which is why pageHref exists instead of a bare `?page=`. The row
 * range ("101–150 of 183") is what tells you whether going forward is worth
 * it; on the last page Prev is the only live control.
 */
function Pager({
  page,
  pageCount,
  pageHref,
  shown,
  total,
  firstRow,
}: {
  page: number;
  pageCount: number;
  pageHref: (p: number) => string;
  shown: number;
  total: number | null;
  firstRow: number;
}) {
  const linkCls =
    "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-400 transition-colors";
  const offCls = "rounded-full border border-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-300 select-none";

  // Unknown total with an empty page: the pager cannot say whether older rows
  // exist, so say so instead of showing a disabled control that implies "no".
  if (total === null && shown === 0) {
    return (
      <p className="px-4 py-3 text-xs text-slate-500 border-t border-slate-100 bg-slate-50">
        The exact total could not be counted. Rows past this page may still exist — narrow the
        filters or use the search to reach them.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50">
      <p className="text-xs text-slate-500">
        {shown === 0
          ? "No rows on this page."
          : total !== null
            ? `Showing ${firstRow}–${firstRow + shown - 1} of ${total}`
            : `Showing ${shown} rows on this page`}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={pageHref(page - 1)} prefetch={false} className={linkCls}>
            ← Newer
          </Link>
        ) : (
          <span className={offCls}>← Newer</span>
        )}
        <span className="text-xs text-slate-400 font-mono">
          page {page}
          {total !== null ? ` of ${pageCount}` : ""}
        </span>
        {total !== null && page < pageCount ? (
          <Link href={pageHref(page + 1)} prefetch={false} className={linkCls}>
            Older →
          </Link>
        ) : (
          <span className={offCls} aria-hidden={total === null}>
            Older →
          </span>
        )}
      </div>
    </div>
  );
}
