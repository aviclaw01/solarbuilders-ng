import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/ui/AdminPageHeader";

/**
 * Journeys — where visits go and where they stop.
 *
 * Built on the session_id / visitor_id that lib/track.ts puts on every event
 * (random, made in the browser, not linked to a person). A visit is one
 * session_id; a person is one visitor_id. Staff browsers are left out at the
 * source. Auth: proxy.ts guards /admin/*.
 */

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Journeys — SolarBuilders admin", robots: { index: false, follow: false } };

const MAX_ROWS = 10000;
const RANGES = [1, 7, 30] as const;
type Range = (typeof RANGES)[number];

/** Events that mean the visitor reached us. */
const CONTACT_EVENTS = new Set(["whatsapp_click", "contact_submit", "quote_form_submit", "order_submit", "need_submit"]);
/** Events that mean they started on a quote. */
const QUOTE_EVENTS = new Set(["quote_generated", "kit_chosen", "cart_add", "chooser_open", "contact_open"]);

interface Row {
  created_at: string;
  event: string;
  path: string | null;
  placement: string | null;
  referrer_host: string | null;
  utm_source: string | null;
  entry_ref: string | null;
  session_id: string | null;
  visitor_id: string | null;
  label: string | null;
  target: string | null;
  value: number | null;
}

interface Visit {
  id: string;
  visitor: string | null;
  start: string;
  source: string;
  rows: Row[];
  pages: string[];
  exit: string | null;
  seconds: number;
  contacted: boolean;
  quoted: boolean;
}

async function load(sinceIso: string): Promise<{ rows: Row[]; total: number | null } | { error: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { error: "Supabase is not configured." };
  const params = new URLSearchParams({
    select: "created_at,event,path,placement,referrer_host,utm_source,entry_ref,session_id,visitor_id,label,target,value",
    order: "created_at.asc",
    limit: String(MAX_ROWS),
    created_at: `gte.${sinceIso}`,
  });
  try {
    const res = await fetch(`${url}/rest/v1/site_events?${params}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact" },
      cache: "no-store",
    });
    if (res.status === 400) return { error: "migration" };
    if (!res.ok) return { error: `Supabase answered ${res.status}.` };
    const total = Number(res.headers.get("content-range")?.split("/")[1]);
    return { rows: (await res.json()) as Row[], total: Number.isFinite(total) ? total : null };
  } catch {
    return { error: "Could not reach Supabase." };
  }
}

function visits(rows: Row[]): Visit[] {
  const by = new Map<string, Row[]>();
  for (const r of rows) {
    if (!r.session_id) continue;
    const list = by.get(r.session_id) ?? [];
    list.push(r);
    by.set(r.session_id, list);
  }
  return [...by.entries()].map(([id, rs]) => {
    const pages = rs.filter((r) => r.event === "page_view" && r.path).map((r) => r.path!);
    const first = rs.find((r) => r.event === "page_view") ?? rs[0];
    return {
      id,
      visitor: rs.find((r) => r.visitor_id)?.visitor_id ?? null,
      start: rs[0].created_at,
      source: first.entry_ref || first.utm_source || (first.referrer_host && !first.referrer_host.includes("solarbuilders") ? first.referrer_host : "direct / app"),
      rows: rs,
      pages,
      exit: pages[pages.length - 1] ?? null,
      seconds: rs.filter((r) => r.event === "page_exit").reduce((s, r) => s + (r.value ?? 0), 0),
      contacted: rs.some((r) => CONTACT_EVENTS.has(r.event)),
      quoted: rs.some((r) => QUOTE_EVENTS.has(r.event)),
    };
  });
}

const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");
const mins = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`);

export default async function JourneysPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const sp = await searchParams;
  const days: Range = (RANGES as readonly number[]).includes(Number(sp.days)) ? (Number(sp.days) as Range) : 7;
  const since = new Date(Date.now() - days * 86400_000);
  const data = await load(since.toISOString());

  const header = (
    <>
      <PageHeader title="Journeys" subtitle={`Visits in the last ${days === 1 ? "24 hours" : `${days} days`}: where people went, what they clicked, where they left.`} />
      <div className="flex gap-2 mb-6">
        {RANGES.map((r) => (
          <Link
            key={r}
            href={`/admin/journeys?days=${r}`}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold border ${r === days ? "bg-[#0A0F1E] text-white border-[#0A0F1E]" : "bg-white text-slate-600 border-slate-200"}`}
          >
            {r === 1 ? "24 hours" : `${r} days`}
          </Link>
        ))}
      </div>
    </>
  );

  if ("error" in data) {
    return (
      <>
        {header}
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {data.error === "migration"
            ? "Visit tracking needs one database update (supabase/site_events_journeys.sql). Run it in Supabase, then reload."
            : data.error}
        </p>
      </>
    );
  }

  const all = visits(data.rows);
  const people = new Set(all.map((v) => v.visitor).filter(Boolean)).size;
  const views = data.rows.filter((r) => r.event === "page_view").length;
  const bounced = all.filter((v) => v.pages.length <= 1 && !v.rows.some((r) => r.event === "click")).length;
  const explored = all.filter((v) => v.pages.length >= 2).length;
  const quoted = all.filter((v) => v.quoted).length;
  const contacted = all.filter((v) => v.contacted).length;
  const avgSeconds = all.length ? Math.round(all.reduce((s, v) => s + v.seconds, 0) / all.length) : 0;

  // Per page: views, exits (last page of a visit), time and scroll from page_exit.
  const pageStats = new Map<string, { views: number; exits: number; secs: number[]; depth: number[]; contacts: number }>();
  const stat = (p: string) => {
    let s = pageStats.get(p);
    if (!s) pageStats.set(p, (s = { views: 0, exits: 0, secs: [], depth: [], contacts: 0 }));
    return s;
  };
  for (const r of data.rows) {
    if (!r.path) continue;
    if (r.event === "page_view") stat(r.path).views++;
    if (r.event === "page_exit") {
      stat(r.path).secs.push(r.value ?? 0);
      const d = Number(r.placement?.replace("scroll:", ""));
      if (Number.isFinite(d)) stat(r.path).depth.push(d);
    }
    if (CONTACT_EVENTS.has(r.event)) stat(r.path).contacts++;
  }
  for (const v of all) if (v.exit && !v.contacted) stat(v.exit).exits++;
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
  const pages = [...pageStats.entries()].filter(([, s]) => s.views > 0).sort((a, b) => b[1].views - a[1].views).slice(0, 25);

  // Clicks: what people actually press, per page.
  const clicks = new Map<string, number>();
  for (const r of data.rows) {
    if (r.event !== "click") continue;
    const k = `${r.path ?? ""}\u0000${r.label ?? ""}\u0000${r.target ?? ""}`;
    clicks.set(k, (clicks.get(k) ?? 0) + 1);
  }
  const topClicks = [...clicks.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30);

  const steps = [
    { label: "Visits", n: all.length },
    { label: "Saw 2+ pages", n: explored },
    { label: "Started a quote", n: quoted },
    { label: "Contacted us", n: contacted },
  ];
  const recent = [...all].sort((a, b) => b.start.localeCompare(a.start)).slice(0, 40);
  const noIds = views > 0 && all.length === 0;

  return (
    <>
      {header}
      {noIds && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 mb-6">
          Page views are coming in, but none carry a visit id yet. Run supabase/site_events_journeys.sql in Supabase.
        </p>
      )}
      {data.total != null && data.total > data.rows.length && (
        <p className="text-xs text-amber-700 mb-4">
          Showing the first {data.rows.length} of {data.total} events. Pick a shorter range.
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          ["People", people],
          ["Visits", all.length],
          ["Left without a click", pct(bounced, all.length)],
          ["Avg time per visit", mins(avgSeconds)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-slate-100 bg-white p-4">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{k}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{v}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white p-4 mb-6">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Visit funnel</h2>
        <div className="space-y-2">
          {steps.map((s) => (
            <div key={s.label} className="flex items-center gap-3 text-sm">
              <span className="w-36 shrink-0 text-slate-600">{s.label}</span>
              <div className="flex-1 h-5 bg-slate-100 rounded">
                <div className="h-5 bg-amber-400 rounded" style={{ width: all.length ? `${(s.n / all.length) * 100}%` : 0 }} />
              </div>
              <span className="w-20 text-right font-semibold text-slate-900">
                {s.n} <span className="text-slate-400 font-normal">{pct(s.n, all.length)}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-4 mb-6 overflow-x-auto">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Pages and drop-off</h2>
        <p className="text-xs text-slate-500 mb-3">Left here = visits whose last page this was, without contacting us.</p>
        <table className="w-full text-sm min-w-[620px]">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
              <th className="py-1.5">Page</th>
              <th className="text-right">Views</th>
              <th className="text-right">Left here</th>
              <th className="text-right">Avg time</th>
              <th className="text-right">Avg scroll</th>
              <th className="text-right">Contacts</th>
            </tr>
          </thead>
          <tbody>
            {pages.map(([p, s]) => (
              <tr key={p} className="border-b border-slate-50">
                <td className="py-1.5 text-slate-900 break-all">{p}</td>
                <td className="text-right">{s.views}</td>
                <td className="text-right">
                  {s.exits} <span className="text-slate-400">{pct(s.exits, s.views)}</span>
                </td>
                <td className="text-right">{s.secs.length ? mins(avg(s.secs)) : "—"}</td>
                <td className="text-right">{s.depth.length ? `${avg(s.depth)}%` : "—"}</td>
                <td className="text-right">{s.contacts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-4 mb-6 overflow-x-auto">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">What people click</h2>
        <table className="w-full text-sm min-w-[620px]">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
              <th className="py-1.5">On page</th>
              <th>Clicked</th>
              <th>Goes to</th>
              <th className="text-right">Times</th>
            </tr>
          </thead>
          <tbody>
            {topClicks.map(([k, n]) => {
              const [p, label, target] = k.split("\u0000");
              return (
                <tr key={k} className="border-b border-slate-50">
                  <td className="py-1.5 text-slate-500 break-all">{p}</td>
                  <td className="text-slate-900">{label}</td>
                  <td className="text-slate-500 break-all">{target}</td>
                  <td className="text-right font-semibold">{n}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {topClicks.length === 0 && <p className="text-sm text-slate-500">No clicks recorded yet.</p>}
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Recent visits</h2>
        <ul className="space-y-3">
          {recent.map((v) => (
            <li key={v.id} className="text-sm border-b border-slate-50 pb-3">
              <p className="text-xs text-slate-400">
                {new Date(v.start).toLocaleString("en-GB", { timeZone: "Africa/Lagos", dateStyle: "short", timeStyle: "short" })} ·{" "}
                {v.source} · {mins(v.seconds)}
                {v.contacted && <span className="ml-2 rounded bg-emerald-100 text-emerald-800 px-1.5">contacted</span>}
              </p>
              <p className="text-slate-800 mt-1 leading-relaxed">
                {v.rows
                  .filter((r) => r.event !== "page_exit")
                  .map((r) =>
                    r.event === "page_view"
                      ? r.path
                      : r.event === "click"
                        ? `[${r.label ?? "click"}]`
                        : `(${r.event}${r.placement ? `: ${r.placement}` : ""})`,
                  )
                  .join(" → ")}
              </p>
            </li>
          ))}
        </ul>
        {recent.length === 0 && <p className="text-sm text-slate-500">No visits with an id yet.</p>}
      </section>
    </>
  );
}
