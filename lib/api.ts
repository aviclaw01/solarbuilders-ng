/**
 * Shared server-side helpers for the JSON API routes.
 *
 * Every public POST route should: rate-limit, safely parse the body, validate
 * per field, honeypot-check, HTML-escape anything that lands in an email, and
 * answer with the project's response contract:
 *   200 { ok: true, ... }          400 { ok: false, error, fields? }
 *   429 { ok: false, error }       500 { ok: false, error }
 *
 * `api/partner-apply` and `api/partner-status` predate this module and carry
 * their own (equivalent) limiters — left alone deliberately.
 */

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export interface RateLimitResult {
  limited: boolean;
  /** Seconds until the window clears; for the Retry-After header on 429s. */
  retryAfterSec: number;
}

const recentHits = new Map<string, number[]>();
const MAX_KEYS = 500;

/**
 * Sliding-window rate limiter keyed by an arbitrary string (usually
 * `route:ip`).
 *
 * Honest limitation, same as the limiter in api/partner-apply: this Map lives
 * in one serverless instance's memory, so it resets on deploy and never sees a
 * request handled by a sibling instance. It stops one person scripting a form;
 * it is not a defence against a distributed attacker. The real fix is a shared
 * counter (Upstash/Supabase), worth doing the day these forms attract
 * attention.
 */
export function rateLimit(key: string, { windowMs, max }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const hits = (recentHits.get(key) ?? []).filter((t) => now - t < windowMs);
  hits.push(now);
  recentHits.set(key, hits);
  // Keep the map from growing without bound on a long-lived instance.
  if (recentHits.size > MAX_KEYS) {
    for (const [k, v] of recentHits) {
      if (v.every((t) => now - t > windowMs)) recentHits.delete(k);
    }
  }
  const limited = hits.length > max;
  return { limited, retryAfterSec: limited ? Math.ceil(windowMs / 1000) : 0 };
}

/** Best-effort client IP from the proxy headers Vercel sets. */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return (forwarded?.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim().slice(0, 60);
}

/** Standard 429 answer, with Retry-After so well-behaved clients back off. */
export function tooManyRequests(message: string, retryAfterSec: number): Response {
  return Response.json(
    { ok: false, error: message },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
  );
}

/**
 * Parse a JSON body that must be a plain object. Returns `{ ok: false }` on
 * invalid JSON, arrays, primitives and null — callers answer 400.
 */
export async function readJson(req: Request): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false }> {
  try {
    const body: unknown = await req.json();
    if (body === null || typeof body !== "object" || Array.isArray(body)) return { ok: false };
    return { ok: true, data: body as Record<string, unknown> };
  } catch {
    return { ok: false };
  }
}

/** 400/429-style error body. `fields` carries per-field messages when present. */
export function fail(error: string, status: number, fields?: Record<string, string>): Response {
  return Response.json({ ok: false, error, ...(fields ? { fields } : {}) }, { status });
}

/**
 * PostgREST insert into a Supabase table, with the env-check and error
 * handling every intake route shares. Returns whether the row landed —
 * callers surface that as `stored` so the user never gets a fake success.
 *
 * Service-role key only, same as api/quote-request. Tables live in
 * supabase/leads_pipeline.sql.
 *
 * Only notify-me and submit-review use this: the contact and lead-capture
 * routes store through lib/leads.ts into the unified `leads` table the
 * /admin/leads desk reads, so their tables from an earlier draft of this
 * file were dropped from leads_pipeline.sql.
 */
export async function insertLeadRow(
  table: "notify_me" | "reviews",
  row: Record<string, unknown>,
): Promise<boolean> {
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supaUrl || !supaKey || supaUrl.includes("your-project")) return false;
  try {
    const res = await fetch(`${supaUrl}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        apikey: supaKey,
        Authorization: `Bearer ${supaKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    });
    if (!res.ok) {
      console.error(`[lead-sink] insert into ${table} failed:`, res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[lead-sink] insert into ${table} threw:`, err);
    return false;
  }
}

/**
 * Escape a value for interpolation into HTML email templates. Every string
 * that originated from a visitor MUST pass through this — the same field
 * renders inside our inbox that renders in a browser.
 */
export function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Honeypot check (L17): a field no human ever sees. A filled one means a
 * script. Callers answer with a fake-success so the script learns nothing,
 * then store nothing and send nothing.
 */
export function isHoneypotFilled(data: Record<string, unknown>): boolean {
  return typeof data.hp === "string" && data.hp.trim() !== "";
}
