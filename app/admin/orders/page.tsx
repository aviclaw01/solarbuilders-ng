import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  AlertTriangle,
  Clock,
  Hammer,
  Inbox,
  MessageCircle,
  Package,
  Phone,
  Search,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import AdminNav from "@/components/ui/AdminNav";
import { formatNaira } from "@/lib/quote";

/**
 * Internal order-requests dashboard — every cart sent from /shop, newest first.
 *
 * These are NOT paid orders. Somebody filled a cart at catalogue prices and
 * asked us to confirm. The job of this page is to get that list in front of a
 * distributor fast, so the line items are the centre of the design.
 *
 * Auth: HTTP Basic, enforced in proxy.ts for /admin/*. No auth logic here.
 * Data: Supabase PostgREST + service-role key, same plain-fetch pattern as
 * app/api/quote-request/route.ts. No ORM, no client JS.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order requests — SolarBuilders admin",
  robots: { index: false, follow: false },
};

// ─────────────────────────────────────────────────────────
// TYPES & CONSTANTS
// ─────────────────────────────────────────────────────────

const STATUSES = ["new", "confirming", "quoted", "won", "lost"] as const;
type Status = (typeof STATUSES)[number];

/** Statuses that count toward the (very rough) open-order estimate. */
const OPEN_STATUSES: readonly Status[] = ["new", "confirming"];

const MAX_ROWS = 500;

interface OrderLine {
  brandSlug?: string | null;
  brandName?: string | null;
  model?: string | null;
  spec?: string | null;
  qty?: number | null;
  unitLow?: number | null;
  unitHigh?: number | null;
  lineBest?: number | null;
}

interface OrderRequest {
  id: number;
  created_at: string;
  reference: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  location: string | null;
  note: string | null;
  lines: unknown;
  item_count: number | null;
  total_low: number | null;
  total_best: number | null;
  total_high: number | null;
  quote_code: string | null;
  needs_install: boolean | null;
  status: string | null;
}

const STATUS_STYLES: Record<Status, string> = {
  new: "bg-amber-50 text-amber-700 border-amber-200",
  confirming: "bg-sky-50 text-sky-700 border-sky-200",
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
 * wa.me needs an international number with no punctuation. Nigerian customers
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

/**
 * `lines` is jsonb written by the cart. Trust nothing about its shape — a
 * malformed row must degrade to "no line items" rather than crash the page.
 */
function parseLines(value: unknown): OrderLine[] {
  let raw: unknown = value;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];
  return raw.filter((l): l is OrderLine => typeof l === "object" && l !== null);
}

function lineLabel(l: OrderLine): string {
  const brand = (l.brandName || l.brandSlug || "").trim();
  const model = (l.model || "").trim();
  return [brand, model].filter(Boolean).join(" ") || "Unnamed item";
}

/**
 * Plain text we paste into WhatsApp to a distributor. Deliberately carries no
 * catalogue prices — we are asking them for a price, not quoting them ours.
 */
function supplierText(o: OrderRequest, lines: OrderLine[]): string {
  const out: string[] = [
    `SolarBuilders.ng — request for pricing`,
    `Ref: ${o.reference || `order ${o.id}`}`,
    `Deliver to: ${o.location || "location not given"}`,
    `Installation needed: ${o.needs_install === false ? "no, supply only" : "yes"}`,
    ``,
    `Items (${lines.length || o.item_count || 0}):`,
  ];
  if (lines.length === 0) {
    out.push(`  (no line items recorded on this order)`);
  } else {
    for (const l of lines) {
      const qty = Number(l.qty) > 0 ? Number(l.qty) : 1;
      const spec = (l.spec || "").trim();
      out.push(`  ${qty} x ${lineLabel(l)}${spec ? ` — ${spec}` : ""}`);
    }
  }
  out.push(``, `Please confirm availability, unit price and lead time.`);
  return out.join("\n");
}

function supabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url.includes("your-project")) return null;
  return { url, key };
}

type FetchResult =
  | { ok: true; rows: OrderRequest[] }
  | { ok: false; kind: "env" }
  | { ok: false; kind: "http"; status: number }
  | { ok: false; kind: "network" };

async function fetchOrders(params: URLSearchParams): Promise<FetchResult> {
  const env = supabaseEnv();
  if (!env) return { ok: false, kind: "env" };

  let res: Response;
  try {
    res = await fetch(`${env.url}/rest/v1/order_requests?${params.toString()}`, {
      headers: {
        apikey: env.key,
        Authorization: `Bearer ${env.key}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch (err) {
    console.error("[admin/orders] Supabase fetch failed:", err);
    return { ok: false, kind: "network" };
  }

  if (!res.ok) {
    console.error("[admin/orders] Supabase read failed:", res.status, await res.text());
    return { ok: false, kind: "http", status: res.status };
  }

  return { ok: true, rows: (await res.json()) as OrderRequest[] };
}

// ─────────────────────────────────────────────────────────
// SERVER ACTION — status change
// ─────────────────────────────────────────────────────────

async function updateStatus(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  const status = formData.get("status");

  if (!Number.isInteger(id) || id <= 0) {
    console.error("[admin/orders] updateStatus: bad id", formData.get("id"));
    return;
  }
  if (!isStatus(status)) {
    console.error("[admin/orders] updateStatus: rejected status", status);
    return;
  }

  const env = supabaseEnv();
  if (!env) {
    console.error("[admin/orders] updateStatus: Supabase env missing");
    return;
  }

  try {
    const res = await fetch(`${env.url}/rest/v1/order_requests?id=eq.${id}`, {
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
    if (!res.ok) console.error("[admin/orders] status PATCH failed:", res.status, await res.text());
  } catch (err) {
    console.error("[admin/orders] status PATCH failed:", err);
  }

  revalidatePath("/admin/orders");
}

// ─────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
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
      `(reference.ilike.${like},name.ilike.${like},phone.ilike.${like},location.ilike.${like})`,
    );
  }

  const [stats, list] = await Promise.all([fetchOrders(statsParams), fetchOrders(listParams)]);

  // ── Error state ──────────────────────────────────────
  if (!list.ok) {
    return (
      <Shell>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-heading font-bold text-rose-900 text-lg">Could not load orders</h2>
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
                    <code className="font-mono">order_requests</code> table exists (see{" "}
                    <code className="font-mono">supabase/order_requests.sql</code>) and that the
                    service-role key is current. Full response is in the server logs.
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

  const orders = list.rows;
  const allRows = stats.ok ? stats.rows : orders;

  // ── Summary numbers ─────────────────────────────────
  const total = allRows.length;
  const byStatus = STATUSES.reduce<Record<Status, number>>(
    (acc, s) => {
      acc[s] = allRows.filter((r) => r.status === s).length;
      return acc;
    },
    { new: 0, confirming: 0, quoted: 0, won: 0, lost: 0 },
  );
  const openValue = allRows
    .filter((r) => isStatus(r.status) && OPEN_STATUSES.includes(r.status))
    .reduce((sum, r) => sum + (r.total_best ?? 0), 0);
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const last7 = allRows.filter((r) => new Date(r.created_at).getTime() >= sevenDaysAgo).length;

  const filterHref = (status: string) => {
    const p = new URLSearchParams();
    if (status !== "all") p.set("status", status);
    if (rawQuery) p.set("q", rawQuery);
    const qs = p.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  };

  return (
    <Shell>
      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={<ShoppingCart className="w-4 h-4" />}
          label="Total orders"
          value={String(total)}
        />
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Last 7 days"
          value={String(last7)}
          tone="amber"
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Open, estimate only"
          value={formatNaira(openValue)}
          hint="new + confirming, summed at catalogue midpoints. Nothing is confirmed, priced by a supplier or paid for — this is not revenue."
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

        <form method="get" action="/admin/orders" className="flex items-center gap-2">
          {activeStatus !== "all" && <input type="hidden" name="status" value={activeStatus} />}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              name="q"
              defaultValue={rawQuery}
              placeholder="Reference, name, phone, location"
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
      {orders.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center">
          <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <h2 className="font-heading font-bold text-slate-900 text-lg">
            {total === 0 ? "No order requests yet" : "Nothing matches this filter"}
          </h2>
          <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
            {total === 0 ? (
              <>
                When somebody fills a cart in the shop and sends it, the order — with every line item —
                lands here.
              </>
            ) : (
              <>
                {total} order{total === 1 ? "" : "s"} in total.{" "}
                <Link href="/admin/orders" className="text-amber-600 font-semibold hover:underline">
                  Clear the filters
                </Link>{" "}
                to see them.
              </>
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}

          {orders.length >= MAX_ROWS && (
            <p className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-xs text-slate-500">
              Showing the newest {MAX_ROWS} orders. Narrow the filters to see older ones.
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
            <h1 className="font-heading font-extrabold text-2xl md:text-3xl mt-1">Order requests</h1>
            <p className="text-slate-400 text-sm mt-1">
              Carts sent from the shop. No payment has been taken on any of these.
            </p>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <AdminNav active="orders" />
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
      {hint && <div className="text-xs text-slate-400 mt-1 leading-snug">{hint}</div>}
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

function OrderCard({ order }: { order: OrderRequest }) {
  const lines = parseLines(order.lines);
  const phone = order.phone?.trim() || "";
  const wa = phone ? whatsappDigits(phone) : "";
  const label = order.reference || `order ${order.id}`;

  return (
    <article className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
      {/* Head */}
      <div className="px-4 py-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between border-b border-slate-100">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold text-slate-900 break-all">
              {order.reference || "—"}
            </span>
            <StatusBadge status={order.status} />
            <span className="text-xs text-slate-400">{formatLagos(order.created_at)}</span>
          </div>

          <div className="mt-2 text-sm font-semibold text-slate-900">{order.name || "—"}</div>

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

          {order.email && (
            <a
              href={`mailto:${order.email}`}
              className="block text-xs text-slate-500 hover:text-slate-800 mt-0.5 truncate"
            >
              {order.email}
            </a>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-500">
            <span className="text-slate-700">{order.location || "no location"}</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold ${
                order.needs_install === false
                  ? "bg-slate-50 text-slate-500 border-slate-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              <Hammer className="w-3 h-3" />
              {order.needs_install === false ? "Supply only" : "Installation wanted"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Package className="w-3 h-3" />
              {order.item_count ?? lines.length} item
              {(order.item_count ?? lines.length) === 1 ? "" : "s"}
            </span>
            {order.quote_code && (
              <Link
                href={`/admin/leads?q=${encodeURIComponent(order.quote_code)}`}
                className="font-mono font-semibold text-amber-600 hover:underline"
                title="Find the matching quote request"
              >
                {order.quote_code}
              </Link>
            )}
          </div>
        </div>

        {/* Totals + status control */}
        <div className="shrink-0 md:text-right">
          <div className="font-heading font-extrabold text-slate-900 text-xl">
            {order.total_best == null ? "—" : formatNaira(order.total_best)}
          </div>
          {order.total_low != null && order.total_high != null && (
            <div className="text-xs text-slate-400 leading-tight">
              {formatNaira(order.total_low)} – {formatNaira(order.total_high)}
            </div>
          )}
          <div className="text-[11px] text-slate-400 mt-0.5">catalogue estimate</div>

          <form action={updateStatus} className="flex items-center gap-1.5 mt-3 md:justify-end">
            <input type="hidden" name="id" value={order.id} />
            <select
              name="status"
              defaultValue={isStatus(order.status) ? order.status : "new"}
              aria-label={`Status for ${label}`}
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
      </div>

      {/* Customer note */}
      {order.note && (
        <div className="px-4 py-3 border-b border-slate-100 bg-amber-50/50">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide mb-1">
            Note from customer
          </div>
          <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{order.note}</p>
        </div>
      )}

      {/* Line items — the point of this page */}
      <details open className="group border-b border-slate-100">
        <summary className="cursor-pointer list-none px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 bg-slate-50">
          <span className="group-open:hidden">Show line items ({lines.length})</span>
          <span className="hidden group-open:inline">Hide line items ({lines.length})</span>
        </summary>

        {lines.length === 0 ? (
          <p className="px-4 py-4 text-sm text-slate-500">
            No line items recorded on this order — the <code className="font-mono">lines</code> column was
            empty or unreadable.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  <th className="px-4 py-2 font-semibold w-12">Qty</th>
                  <th className="px-4 py-2 font-semibold">Brand</th>
                  <th className="px-4 py-2 font-semibold">Model</th>
                  <th className="px-4 py-2 font-semibold">Spec</th>
                  <th className="px-4 py-2 font-semibold text-right">Unit range</th>
                  <th className="px-4 py-2 font-semibold text-right">Line total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lines.map((l, i) => (
                  <tr key={i} className="align-top">
                    <td className="px-4 py-2 font-mono font-semibold text-slate-900">
                      {Number(l.qty) > 0 ? Number(l.qty) : 1}
                    </td>
                    <td className="px-4 py-2 text-slate-700">{l.brandName || l.brandSlug || "—"}</td>
                    <td className="px-4 py-2 font-semibold text-slate-900">{l.model || "—"}</td>
                    <td className="px-4 py-2 text-slate-500">{l.spec || "—"}</td>
                    <td className="px-4 py-2 text-right text-slate-500 whitespace-nowrap">
                      {typeof l.unitLow === "number" && typeof l.unitHigh === "number"
                        ? `${formatNaira(l.unitLow)} – ${formatNaira(l.unitHigh)}`
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {typeof l.lineBest === "number" ? formatNaira(l.lineBest) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </details>

      {/* Supplier paste block */}
      <details className="group">
        <summary className="cursor-pointer list-none px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
          <span className="group-open:hidden">Copy order for supplier</span>
          <span className="hidden group-open:inline">Hide supplier text</span>
        </summary>
        <div className="px-4 pb-4">
          <p className="text-[11px] text-slate-400 mb-2">
            Select all and paste into WhatsApp. Carries no catalogue prices on purpose — we are asking
            them to quote, not quoting them.
          </p>
          <pre className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-700 font-mono whitespace-pre-wrap break-words">
            {supplierText(order, lines)}
          </pre>
        </div>
      </details>
    </article>
  );
}
