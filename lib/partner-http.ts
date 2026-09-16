/**
 * SolarBuilders.ng — shared plumbing for the public partner API routes (server-only).
 *
 * /api/partner-apply and /api/partner-status are the only unauthenticated entry
 * points into the partner tables, so both go through the same body cap, the
 * same rate limiter and the same on/off switch.
 */

import "server-only";
import { NextResponse } from "next/server";

/**
 * The public partner endpoints are OFF unless PARTNER_APPLICATIONS_OPEN=1.
 *
 * The public "work with us" form does not post to /api/partner-apply yet, so
 * until it does there is no reason for an unauthenticated endpoint that writes
 * rows and sends email to be reachable.
 */
export function partnerApplicationsOpen(): boolean {
  return process.env.PARTNER_APPLICATIONS_OPEN === "1";
}

export function applicationsClosedResponse(route: string): NextResponse {
  console.warn(`[${route}] called while PARTNER_APPLICATIONS_OPEN is not "1" — endpoint disabled`);
  return NextResponse.json(
    { ok: false, error: "Partner applications are not open online yet. Please message us on WhatsApp." },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}

/** Best-effort client IP. On Vercel the first x-forwarded-for entry is set by the platform. */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return (forwarded?.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim().slice(0, 60);
}

/**
 * Per-instance sliding-window rate limiter.
 *
 * Honest limitation: this Map lives in one serverless instance's memory, so it
 * resets on deploy and never sees a request handled by a sibling instance. It
 * stops one person scripting the endpoint; it is not a defence against a
 * distributed attacker. A shared counter is the real fix.
 */
export function createRateLimiter(opts: { windowMs: number; max: number; maxKeys?: number }) {
  const hits = new Map<string, number[]>();
  const maxKeys = opts.maxKeys ?? 1000;

  return function isRateLimited(key: string): boolean {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < opts.windowMs);
    recent.push(now);
    hits.set(key, recent);

    if (hits.size > maxKeys) {
      for (const [k, v] of hits) {
        if (v.every((t) => now - t >= opts.windowMs)) hits.delete(k);
      }
      // Still too big (a flood of distinct keys): drop the oldest entries.
      while (hits.size > maxKeys) {
        const oldest = hits.keys().next().value;
        if (oldest === undefined) break;
        hits.delete(oldest);
      }
    }
    return recent.length > opts.max;
  };
}

/**
 * Read a JSON body with a hard size cap and a JSON content type. Returns a ready
 * error response on failure, so the route can just return it.
 */
export async function readJsonBody(
  req: Request,
  maxBytes: number,
): Promise<{ ok: true; body: unknown } | { ok: false; response: NextResponse }> {
  const fail = (status: number, error: string) => ({
    ok: false as const,
    response: NextResponse.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } }),
  });

  const type = req.headers.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) {
    return fail(415, "Send the form as JSON.");
  }

  const declared = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > maxBytes) {
    return fail(413, "The form is too large. Shorten the longer answers and try again.");
  }

  let text: string;
  try {
    text = await req.text();
  } catch {
    return fail(400, "We could not read the form. Please try again.");
  }
  if (Buffer.byteLength(text, "utf8") > maxBytes) {
    return fail(413, "The form is too large. Shorten the longer answers and try again.");
  }

  try {
    return { ok: true, body: JSON.parse(text) as unknown };
  } catch {
    return fail(400, "Invalid JSON");
  }
}
