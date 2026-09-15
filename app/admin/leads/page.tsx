import type { Metadata } from "next";
import Link from "next/link";
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
import AdminNav from "@/components/ui/AdminNav";

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

/** Statuses that count toward the (very rough) pipeline number. */
const PIPELINE_STATUSES: readonly Status[] = ["new", "contacted"];

const MAX_ROWS = 500;

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
  | { ok: true; rows: Lead[] }
  | { ok: false; kind: "env" }
  | { ok: false; kind: "http"; status: number }
  | { ok: false; kind: "network" };

async function fetchLeads(params: URLSearchParams): Promise<FetchResult> {
  const env = supabaseEnv();
  if (!env) return { ok: false, kind: "env" };

  let res: Response;
  try {
    res = await fetch(`${env.url}/rest/v1/quote_requests?${params.toString()}`, {
      headers: {
        apikey: env.key,
        Authorization: `Bearer ${env.key}`,
        Accept: "application/json",
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

  return { ok: true, rows: (await res.json()) as Lead[] };
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
  searchParams: Promise<{ status?: string; q?: string }>;
}

export default async function AdminLeadsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const activeStatus = isStatus(sp.status) ? sp.status : "all";
  const rawQuery = (sp.q ?? "").trim();
  const searchTerm = sanitiseSearch(rawQuery);

  // Unfiltered read powers the summary strip; the filtered read powers the list.
  const statsParams = new URLSearchParams({
    select: "status,total_best,created_at",
    order: "created_at.desc",
    limit: String(MAX_ROWS),
  });

  const listParams = new URLSearchParams({
    select: "*",
    order: "created_at.desc",
    limit: String(MAX_ROWS),
  });
  if (activeStatus !== "all") listParams.set("status", `eq.${activeStatus}`);
  if (searchTerm) {
    const like = `*${searchTerm}*`;
    listParams.set(
      "or",
      `(quote_code.ilike.${like},name.ilike.${like},phone.ilike.${like},location.ilike.${like})`,
    );
  }

  const [stats, list] = await Promise.all([fetchLeads(statsParams), fetchLeads(listParams)]);

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

  const leads = list.rows;
  const allRows = stats.ok ? stats.rows : leads;

  // ── Summary numbers ─────────────────────────────────
  const total = allRows.length;
  const byStatus = STATUSES.reduce<Record<Status, number>>(
    (acc, s) => {
      acc[s] = allRows.filter((r) => r.status === s).length;
      return acc;
    },
    { new: 0, contacted: 0, quoted: 0, won: 0, lost: 0 },
  );
  const pipeline = allRows
    .filter((r) => isStatus(r.status) && PIPELINE_STATUSES.includes(r.status))
    .reduce((sum, r) => sum + (r.total_best ?? 0), 0);
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const last7 = allRows.filter((r) => new Date(r.created_at).getTime() >= sevenDaysAgo).length;

  const filterHref = (status: string) => {
    const p = new URLSearchParams();
    if (status !== "all") p.set("status", status);
    if (rawQuery) p.set("q", rawQuery);
    const qs = p.toString();
    return qs ? `/admin/leads?${qs}` : "/admin/leads";
  };

  return (
    <Shell>
      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<Users className="w-4 h-4" />} label="Total leads" value={String(total)} />
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Last 7 days"
          value={String(last7)}
          tone="amber"
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Pipeline value, estimate only"
          value={formatNaira(pipeline)}
          hint="new + contacted, at the mid-range total"
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

      {!stats.ok && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-6">
          Summary numbers are computed from the filtered rows only — the unfiltered read failed.
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
            {total === 0 ? "No quote requests yet" : "Nothing matches this filter"}
          </h2>
          <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
            {total === 0 ? (
              <>
                When somebody sizes a system on the calculator and submits &ldquo;Get this system
                built&rdquo;, the lead lands here.
              </>
            ) : (
              <>
                {total} lead{total === 1 ? "" : "s"} in total.{" "}
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

          {leads.length >= MAX_ROWS && (
            <p className="px-4 py-3 text-xs text-slate-500 border-t border-slate-100 bg-slate-50">
              Showing the newest {MAX_ROWS} rows. Narrow the filters to see older leads.
            </p>
          )}
        </div>
      )}
    </Shell>
  );
}

// ─────────────────────────────────────────────────────────
// PIECES
// ─────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#0A0F1E] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="text-[#F59E0B] text-xs font-semibold tracking-wide uppercase">
              Internal · not indexed
            </span>
            <h1 className="font-heading font-extrabold text-2xl md:text-3xl mt-1">Quote requests</h1>
          </div>
          <Link href="/" className="text-sm text-slate-300 hover:text-white transition-colors">
            ← Back to site
          </Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <AdminNav active="leads" />
        {children}
      </main>
    </div>
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
