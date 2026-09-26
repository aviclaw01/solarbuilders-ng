/**
 * The numbers on /admin.
 *
 * One read per table, counting in Postgres rather than pulling rows: PostgREST
 * returns the exact count in Content-Range when asked for it, so a dashboard
 * that only needs "how many" never transfers the data.
 *
 * Every number is a COUNT OF ROWS, not of people. site_events in particular
 * sets no cookie and stores no visitor id, so one person reloading five times
 * is five events — the funnel page is explicit about this and the overview
 * must not quietly imply otherwise.
 *
 * A failed read is `null`, never 0. "We could not count" and "there are none"
 * look identical on a dashboard and mean opposite things, which is how an
 * outage gets read as a quiet week.
 */

export interface Metric {
  /** null = the read failed. 0 = genuinely none. */
  total: number | null;
  /** Rows created in the last 7 days, same null rule. */
  recent: number | null;
}

export interface AdminMetrics {
  quotes: Metric;
  orders: Metric;
  enquiries: Metric;
  events: Metric;
  partners: Metric;
  jobs: Metric;
  /** True when Supabase is not configured at all — a different story from a failed read. */
  unconfigured: boolean;
}

const EMPTY: Metric = { total: null, recent: null };

function env(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url.includes("your-project")) return null;
  return { url, key };
}

/** Exact row count via Content-Range, transferring no rows. */
async function count(table: string, e: { url: string; key: string }, sinceIso?: string): Promise<number | null> {
  const params = new URLSearchParams({ select: "id", limit: "1" });
  if (sinceIso) params.set("created_at", `gte.${sinceIso}`);
  try {
    const res = await fetch(`${e.url}/rest/v1/${table}?${params.toString()}`, {
      headers: {
        apikey: e.key,
        Authorization: `Bearer ${e.key}`,
        Prefer: "count=exact",
        Range: "0-0",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[admin-metrics] ${table} count failed:`, res.status);
      return null;
    }
    const tail = (res.headers.get("content-range") ?? "").split("/")[1];
    const n = Number(tail);
    return tail && tail !== "*" && Number.isFinite(n) ? n : null;
  } catch (err) {
    console.error(`[admin-metrics] ${table} count error:`, err);
    return null;
  }
}

async function metric(table: string, e: { url: string; key: string }, sinceIso: string): Promise<Metric> {
  const [total, recent] = await Promise.all([count(table, e), count(table, e, sinceIso)]);
  return { total, recent };
}

export async function readAdminMetrics(): Promise<AdminMetrics> {
  const e = env();
  if (!e) {
    return {
      quotes: EMPTY, orders: EMPTY, enquiries: EMPTY,
      events: EMPTY, partners: EMPTY, jobs: EMPTY,
      unconfigured: true,
    };
  }

  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [quotes, orders, enquiries, events, partners, jobs] = await Promise.all([
    metric("quote_requests", e, since),
    metric("order_requests", e, since),
    metric("leads", e, since),
    metric("site_events", e, since),
    metric("partners", e, since),
    metric("partner_jobs", e, since),
  ]);

  return { quotes, orders, enquiries, events, partners, jobs, unconfigured: false };
}

/**
 * Sample numbers for the dev preview.
 *
 * Deliberately NOT written to the database. `.env.local` points at production
 * Supabase, so "seed some mock rows" locally would put fake leads in the real
 * leads desk. This swaps what the page renders and touches nothing.
 */
export const MOCK_METRICS: AdminMetrics = {
  quotes: { total: 47, recent: 9 },
  orders: { total: 12, recent: 3 },
  enquiries: { total: 63, recent: 14 },
  events: { total: 2184, recent: 412 },
  partners: { total: 8, recent: 1 },
  jobs: { total: 19, recent: 5 },
  unconfigured: false,
};
