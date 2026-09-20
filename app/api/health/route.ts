/**
 * GET /api/health — uptime monitoring target.
 *
 * Returns 200 with the state of the pieces the site depends on. Point an
 * external monitor (UptimeRobot, Better Stack…) at this and alert on
 * `ok: false`. Deliberately not in /api/admin: a monitor must be able to
 * reach it without credentials, and it exposes nothing but a status word.
 *
 * `unconfigured` is distinct from `down`: on a fresh deploy without Supabase
 * env vars the site works and forms degrade gracefully, so that is not an
 * incident — but it should never be true in production.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let db: "up" | "down" | "unconfigured" = "unconfigured";
  if (supaUrl && supaKey && !supaUrl.includes("your-project")) {
    try {
      // Cheapest possible query — one column, one row.
      const res = await fetch(`${supaUrl}/rest/v1/order_requests?select=id&limit=1`, {
        headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}` },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      db = res.ok ? "up" : "down";
      if (!res.ok) console.error("[health] Supabase responded", res.status);
    } catch (err) {
      db = "down";
      console.error("[health] Supabase unreachable:", err);
    }
  }

  return Response.json(
    { ok: db === "up", db, ts: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
