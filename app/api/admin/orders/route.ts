/**
 * Admin JSON API for the order-requests dashboard.
 *
 * PATCH /api/admin/orders  { "id": 12, "status": "confirming" }
 *
 * Sits under /api/admin, so proxy.ts already requires HTTP Basic auth
 * (ADMIN_USER / ADMIN_PASSWORD) before this handler ever runs. It talks to
 * Supabase with the service-role key over PostgREST, the same way
 * app/api/quote-request/route.ts does.
 */

export const dynamic = "force-dynamic";

// Kept local to this module: Next.js route files should only export request
// handlers and route config. The dashboard page declares the same list itself.
const ORDER_STATUSES = ["new", "confirming", "quoted", "won", "lost"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

export async function PATCH(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { id, status } = (body ?? {}) as { id?: unknown; status?: unknown };

  const numericId = typeof id === "number" ? id : typeof id === "string" ? Number(id) : NaN;
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return Response.json({ ok: false, error: "id must be a positive integer" }, { status: 400 });
  }

  if (!isOrderStatus(status)) {
    return Response.json(
      { ok: false, error: `status must be one of: ${ORDER_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supaUrl || !supaKey || supaUrl.includes("your-project")) {
    return Response.json(
      { ok: false, error: "Supabase is not configured on this deployment" },
      { status: 503 },
    );
  }

  let res: Response;
  try {
    res = await fetch(`${supaUrl}/rest/v1/order_requests?id=eq.${numericId}`, {
      method: "PATCH",
      headers: {
        apikey: supaKey,
        Authorization: `Bearer ${supaKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ status }),
      cache: "no-store",
    });
  } catch (err) {
    console.error("[admin/orders] Supabase request failed:", err);
    return Response.json({ ok: false, error: "Could not reach Supabase" }, { status: 502 });
  }

  if (!res.ok) {
    // Never echo the key or the raw PostgREST body — just the status code.
    console.error("[admin/orders] Supabase PATCH failed:", res.status, await res.text());
    return Response.json(
      { ok: false, error: `Supabase rejected the update (HTTP ${res.status})` },
      { status: 502 },
    );
  }

  const rows = (await res.json()) as unknown[];
  if (rows.length === 0) {
    return Response.json({ ok: false, error: `No order with id ${numericId}` }, { status: 404 });
  }

  return Response.json({ ok: true, id: numericId, status });
}
