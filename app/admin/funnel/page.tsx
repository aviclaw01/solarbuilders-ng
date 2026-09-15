import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  Activity,
  BarChart3,
  Banknote,
  Download,
  ExternalLink,
  FileText,
  Info,
  MessageCircle,
  ShoppingCart,
} from "lucide-react";
import AdminNav from "@/components/ui/AdminNav";

/**
 * Internal funnel dashboard — what `site_events` is telling us.
 *
 * Auth: HTTP Basic, enforced in proxy.ts for /admin/*. No auth logic here.
 * Data: Supabase PostgREST + service-role key, same plain-fetch pattern as
 * app/api/quote-request/route.ts. No ORM, no chart library, no client JS —
 * the bars are divs with a percentage width.
 *
 * Honesty rules baked into this page, because the numbers are cheap to
 * misread:
 *   - Every number here is an EVENT COUNT, not a person. We set no cookie and
 *     store no visitor id, so one person reloading a page five times is five
 *     events. Conversion percentages are therefore ratios of events.
 *   - Rows are counted in JS after a capped read (see MAX_ROWS). If the range
 *     holds more events than the cap, the page says so instead of quietly
 *     under-reporting.
 *   - With little data the page says "not enough data yet" rather than drawing
 *     confident-looking bars over three rows.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Funnel — SolarBuilders admin",
  robots: { index: false, follow: false },
};

// ─────────────────────────────────────────────────────────
// TYPES & CONSTANTS
// ─────────────────────────────────────────────────────────

/** Hard cap on rows pulled per read. Counting happens in JS, not in SQL. */
const MAX_ROWS = 5000;

/** Below this many events in the range, the page refuses to look confident. */
const SPARSE_THRESHOLD = 25;

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];
const DEFAULT_RANGE: Range = 30;

const TOP_N = 8;

interface SiteEvent {
  created_at: string;
  event: string | null;
  path: string | null;
  referrer_host: string | null;
  quote_code: string | null;
  tier: string | null;
  amount: number | null;
  lender: string | null;
  placement: string | null;
  format: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  item: string | null;
}

function isRange(value: unknown): value is Range {
  const n = Number(value);
  return (RANGES as readonly number[]).includes(n);
}

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

function supabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url.includes("your-project")) return null;
  return { url, key };
}

type FetchResult =
  | { ok: true; rows: SiteEvent[]; totalInRange: number | null }
  | { ok: false; kind: "env" }
  | { ok: false; kind: "http"; status: number }
  | { ok: false; kind: "network" };

/**
 * One capped read of the range. `Prefer: count=exact` makes PostgREST return
 * the true row count in Content-Range even though we only take MAX_ROWS of
 * them — that is how the page knows whether it is showing you everything.
 */
async function fetchEvents(sinceIso: string): Promise<FetchResult> {
  const env = supabaseEnv();
  if (!env) return { ok: false, kind: "env" };

  const params = new URLSearchParams({
    select:
      "created_at,event,path,referrer_host,quote_code,tier,amount,lender,placement,format,utm_source,utm_medium,utm_campaign,item",
    order: "created_at.desc",
    limit: String(MAX_ROWS),
  });
  params.set("created_at", `gte.${sinceIso}`);

  let res: Response;
  try {
    res = await fetch(`${env.url}/rest/v1/site_events?${params.toString()}`, {
      headers: {
        apikey: env.key,
        Authorization: `Bearer ${env.key}`,
        Accept: "application/json",
        Prefer: "count=exact",
      },
      cache: "no-store",
    });
  } catch (err) {
    console.error("[admin/funnel] Supabase fetch failed:", err);
    return { ok: false, kind: "network" };
  }

  if (!res.ok) {
    console.error("[admin/funnel] Supabase read failed:", res.status, await res.text());
    return { ok: false, kind: "http", status: res.status };
  }

  // "0-4999/12345" → 12345. PostgREST answers "*/*" when it cannot count.
  const range = res.headers.get("content-range") ?? "";
  const tail = range.split("/")[1];
  const totalInRange = tail && tail !== "*" ? Number(tail) : null;

  return {
    ok: true,
    rows: (await res.json()) as SiteEvent[],
    totalInRange: Number.isFinite(totalInRange) ? totalInRange : null,
  };
}

interface Bucket {
  label: string;
  count: number;
}

/** Count distinct non-empty values of one field, biggest first. */
function tally(rows: SiteEvent[], pick: (r: SiteEvent) => string | null | undefined): Bucket[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const raw = pick(r);
    if (raw == null) continue;
    const label = String(raw).trim();
    if (!label) continue;
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return (part / whole) * 100;
}

function fmtPct(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${value >= 10 ? Math.round(value) : Math.round(value * 10) / 10}%`;
}

// ─────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ days?: string }>;
}

export default async function AdminFunnelPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const days: Range = isRange(sp.days) ? (Number(sp.days) as Range) : DEFAULT_RANGE;

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const result = await fetchEvents(since.toISOString());

  if (!result.ok) {
    return (
      <Shell days={days}>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-heading font-bold text-rose-900 text-lg">Could not load events</h2>
              <p className="text-rose-800 text-sm mt-1">
                {result.kind === "env" && (
                  <>
                    Supabase is not configured on this deployment. Set{" "}
                    <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                    <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> in the environment, then
                    redeploy.
                  </>
                )}
                {result.kind === "http" && (
                  <>
                    Supabase answered with <b>HTTP {result.status}</b>. Check that the{" "}
                    <code className="font-mono">site_events</code> table exists (see{" "}
                    <code className="font-mono">supabase/site_events.sql</code>) and that the
                    service-role key is current. Full response is in the server logs.
                  </>
                )}
                {result.kind === "network" && (
                  <>Could not reach Supabase at all. See the server logs for the network error.</>
                )}
              </p>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  const rows = result.rows;
  const total = rows.length;
  const truncated = result.totalInRange != null && result.totalInRange > total;

  const countOf = (event: string) => rows.filter((r) => r.event === event).length;

  const quoteFunnel = [
    { key: "quote_generated", label: "Quote generated", count: countOf("quote_generated") },
    { key: "quote_form_open", label: "Contact form opened", count: countOf("quote_form_open") },
    { key: "quote_form_submit", label: "Form submitted", count: countOf("quote_form_submit") },
  ];

  const shopFunnel = [
    { key: "cart_add", label: "Added to cart", count: countOf("cart_add") },
    { key: "order_form_open", label: "Order form opened", count: countOf("order_form_open") },
    { key: "order_submit", label: "Order sent", count: countOf("order_submit") },
  ];

  const whatsappRows = rows.filter((r) => r.event === "whatsapp_click");
  const cartAddRows = rows.filter((r) => r.event === "cart_add");
  const downloadRows = rows.filter((r) => r.event === "quote_download");
  const financeOpenRows = rows.filter((r) => r.event === "finance_open");
  const financeClickRows = rows.filter((r) => r.event === "finance_click");

  const byEvent = tally(rows, (r) => r.event);
  const byPath = tally(rows, (r) => r.path);
  const byPlacement = tally(whatsappRows, (r) => r.placement);
  const byReferrer = tally(rows, (r) => r.referrer_host);
  const byItem = tally(cartAddRows, (r) => r.item);
  const byUtmSource = tally(rows, (r) => r.utm_source);
  const byUtmMedium = tally(rows, (r) => r.utm_medium);
  const byUtmCampaign = tally(rows, (r) => r.utm_campaign);
  const byFormat = tally(downloadRows, (r) => r.format);
  const financeByLender = tally([...financeOpenRows, ...financeClickRows], (r) => r.lender);

  const sparse = total < SPARSE_THRESHOLD;

  return (
    <Shell days={days}>
      {/* Range selector */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin/funnel?days=${r}`}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold border transition-colors ${
                r === days
                  ? "bg-[#0A0F1E] text-white border-[#0A0F1E]"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
              }`}
            >
              Last {r} days
            </Link>
          ))}
        </div>
        <div className="text-xs text-slate-400">
          {total} event{total === 1 ? "" : "s"} counted since{" "}
          {since.toISOString().slice(0, 10)}
          {result.totalInRange != null && ` · ${result.totalInRange} in range`}
        </div>
      </div>

      {/* The standing health warning on every number below */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-600 leading-relaxed">
            These are <b>event counts, not unique visitors</b>. We set no cookie and store no visitor or
            device id, so one person who generates three quotes appears three times, and the percentages
            below are ratios between event counts rather than conversion rates for people. Treat them as
            direction, not measurement. Counting is done in this page from a capped read of the newest{" "}
            {MAX_ROWS.toLocaleString("en-NG")} rows in the range.
          </p>
        </div>
      </div>

      {truncated && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-6">
          This range holds {result.totalInRange?.toLocaleString("en-NG")} events but only the newest{" "}
          {MAX_ROWS.toLocaleString("en-NG")} were read, so every number below under-reports. Pick a
          shorter range for an accurate count.
        </p>
      )}

      {/* Sparse / empty state */}
      {total === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center">
          <Activity className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <h2 className="font-heading font-bold text-slate-900 text-lg">
            No events in the last {days} days
          </h2>
          <p className="text-slate-500 text-sm mt-1 max-w-lg mx-auto">
            Nothing has been recorded in <code className="font-mono">site_events</code> for this range.
            That is the expected state early on — either nobody has been through the funnel yet, or{" "}
            <code className="font-mono">/api/track</code> is not writing. Try a longer range before
            assuming the tracker is broken.
          </p>
          {RANGES.filter((r) => r !== days).map((r) => (
            <Link
              key={r}
              href={`/admin/funnel?days=${r}`}
              className="inline-block mt-3 mx-1 text-sm text-amber-600 font-semibold hover:underline"
            >
              Try last {r} days
            </Link>
          ))}
        </div>
      ) : (
        <>
          {sparse && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 mb-6">
              <h2 className="font-heading font-bold text-amber-900 text-sm">
                Not enough data yet — {total} event{total === 1 ? "" : "s"} in {days} days
              </h2>
              <p className="text-amber-800 text-sm mt-1 leading-relaxed">
                Everything below is real but far too thin to read as a trend. At this volume a single
                person&rsquo;s session moves every percentage on the page. Use it to confirm that
                tracking fires at all; come back for the funnel shape once there are a few hundred
                events.
              </p>
            </div>
          )}

          {/* Funnels */}
          <div className="grid gap-4 lg:grid-cols-2 mb-6">
            <FunnelCard
              icon={<FileText className="w-4 h-4" />}
              title="Calculator → quote request"
              steps={quoteFunnel}
              note="A quote request also lands as a row in quote_requests — see Leads."
            />
            <FunnelCard
              icon={<ShoppingCart className="w-4 h-4" />}
              title="Shop → order request"
              steps={shopFunnel}
              note="cart_add counts every add, so several adds in one cart inflate step one against step two."
            />
          </div>

          {/* Breakdowns */}
          <div className="grid gap-4 lg:grid-cols-2">
            <BarCard
              icon={<MessageCircle className="w-4 h-4" />}
              title="WhatsApp clicks by placement"
              subtitle={`${whatsappRows.length} click${whatsappRows.length === 1 ? "" : "s"} — which spot on the site actually starts conversations`}
              buckets={byPlacement}
              empty="No WhatsApp clicks recorded in this range."
            />
            <BarCard
              icon={<BarChart3 className="w-4 h-4" />}
              title="Busiest paths"
              subtitle="All event types, by the page they fired on"
              buckets={byPath}
              empty="No events carried a path."
            />
            <BarCard
              icon={<ExternalLink className="w-4 h-4" />}
              title="Top referrers"
              subtitle="Referring host, where the browser sent one"
              buckets={byReferrer}
              empty="No referrer recorded — direct visits and apps send none."
            />
            <BarCard
              icon={<ShoppingCart className="w-4 h-4" />}
              title="Most added to cart"
              subtitle={`${cartAddRows.length} cart_add event${cartAddRows.length === 1 ? "" : "s"}`}
              buckets={byItem}
              empty="Nothing added to a cart in this range."
            />
            <BarCard
              icon={<Download className="w-4 h-4" />}
              title="Quote downloads by format"
              subtitle={`${downloadRows.length} download${downloadRows.length === 1 ? "" : "s"}`}
              buckets={byFormat}
              empty="No quote downloads in this range."
            />
            <BarCard
              icon={<Banknote className="w-4 h-4" />}
              title="Finance interest by lender"
              subtitle={`${financeOpenRows.length} opened · ${financeClickRows.length} clicked through`}
              buckets={financeByLender}
              empty="No finance events in this range."
            />
            <BarCard
              icon={<Activity className="w-4 h-4" />}
              title="Campaign source"
              subtitle="utm_source, only on events that carried one"
              buckets={byUtmSource}
              empty="No utm_source on any event — nothing arrived from a tagged campaign link."
            />
            <BarCard
              icon={<Activity className="w-4 h-4" />}
              title="Campaign medium"
              subtitle="utm_medium, only on events that carried one"
              buckets={byUtmMedium}
              empty="No utm_medium on any event."
            />
            {byUtmCampaign.length > 0 && (
              <BarCard
                icon={<Activity className="w-4 h-4" />}
                title="Campaign name"
                subtitle="utm_campaign, only on events that carried one"
                buckets={byUtmCampaign}
                empty="No utm_campaign on any event."
              />
            )}
            <BarCard
              icon={<Activity className="w-4 h-4" />}
              title="All events by type"
              subtitle="Everything recorded in this range"
              buckets={byEvent}
              empty="No events."
              limit={20}
            />
          </div>
        </>
      )}
    </Shell>
  );
}

// ─────────────────────────────────────────────────────────
// PIECES
// ─────────────────────────────────────────────────────────

function Shell({ children, days }: { children: React.ReactNode; days: Range }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#0A0F1E] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <span className="text-[#F59E0B] text-xs font-semibold tracking-wide uppercase">
            Internal · not indexed
          </span>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl mt-1">Funnel</h1>
          <p className="text-slate-400 text-sm mt-1">
            First-party events from the last {days} days. No cookies, no third-party tracker.
          </p>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <AdminNav active="funnel" />
        {children}
      </main>
    </div>
  );
}

function FunnelCard({
  icon,
  title,
  steps,
  note,
}: {
  icon: React.ReactNode;
  title: string;
  steps: { key: string; label: string; count: number }[];
  note?: string;
}) {
  const top = steps[0]?.count ?? 0;
  const allZero = steps.every((s) => s.count === 0);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
        {icon}
        <span>{title}</span>
      </div>

      {allZero ? (
        <p className="text-sm text-slate-500">
          None of these three events fired in this range — nothing to show yet.
        </p>
      ) : (
        <ol className="space-y-1">
          {steps.map((s, i) => {
            const prev = i > 0 ? steps[i - 1].count : null;
            const share = pct(s.count, top || 1);
            return (
              <li key={s.key}>
                {prev !== null && (
                  <div className="pl-3 py-1 text-[11px] text-slate-400">
                    {prev === 0 ? (
                      <span>previous step never fired — no ratio</span>
                    ) : s.count <= prev ? (
                      <span>
                        ↓ {fmtPct(pct(prev - s.count, prev))} drop-off ·{" "}
                        <span className="text-slate-500">{fmtPct(pct(s.count, prev))} carried through</span>
                      </span>
                    ) : (
                      <span>
                        ↑ {fmtPct(pct(s.count, prev))} of the previous step — more events here than
                        before it, so these are not the same sessions
                      </span>
                    )}
                  </div>
                )}
                <div className="rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
                  <div className="relative px-3 py-2">
                    <div
                      className="absolute inset-y-0 left-0 bg-amber-100"
                      style={{ width: `${Math.min(100, share)}%` }}
                      aria-hidden="true"
                    />
                    <div className="relative flex items-baseline justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-800">{s.label}</span>
                      <span className="font-heading font-extrabold text-slate-900 text-lg tabular-nums">
                        {s.count}
                      </span>
                    </div>
                    <div className="relative font-mono text-[11px] text-slate-400">{s.key}</div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {note && <p className="text-[11px] text-slate-400 mt-3 leading-snug">{note}</p>}
    </section>
  );
}

function BarCard({
  icon,
  title,
  subtitle,
  buckets,
  empty,
  limit = TOP_N,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  buckets: Bucket[];
  empty: string;
  limit?: number;
}) {
  const shown = buckets.slice(0, limit);
  const max = shown[0]?.count ?? 0;
  const rest = buckets.length - shown.length;

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
        {icon}
        <span>{title}</span>
      </div>
      {subtitle && <p className="text-[11px] text-slate-400 mt-1 mb-3 leading-snug">{subtitle}</p>}

      {shown.length === 0 ? (
        <p className="text-sm text-slate-500 mt-2">{empty}</p>
      ) : (
        <ul className="space-y-2 mt-2">
          {shown.map((b) => (
            <li key={b.label}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-slate-700 truncate" title={b.label}>
                  {b.label}
                </span>
                <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums shrink-0">
                  {b.count}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mt-1">
                <div
                  className="h-full rounded-full bg-[#F59E0B]"
                  style={{ width: `${Math.max(2, pct(b.count, max || 1))}%` }}
                  aria-hidden="true"
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {rest > 0 && (
        <p className="text-[11px] text-slate-400 mt-3">
          + {rest} more not shown.
        </p>
      )}
    </section>
  );
}
