import { NextResponse, type NextRequest } from "next/server";
import { startPartnerSession, portalAuthConfigured } from "@/lib/partner-auth";

/**
 * The partner portal's front door (L12).
 *
 * A partner never gets a password. They get a one-time link by email, and
 * opening it swaps the token in the URL for an HttpOnly cookie. This route is
 * that swap, and it is the only place the token is ever read from a URL.
 *
 *   GET /partner/login?t=<token>
 *     ├─ live token → set the session cookie, 303 → /partner   (query stripped)
 *     └─ anything else → 303 → /partner?error=link
 *
 * Why it redirects rather than rendering: the token must not survive in the
 * address bar, the browser history, or a Referer header on the partner's next
 * outbound click. A 303 to a clean path is what removes it. Nothing here
 * renders HTML, so there is no page the token could be reflected into.
 *
 * Why every failure looks identical: a dead token, a missing `t`, a malformed
 * `t` and an unconfigured deployment all land on the same URL. Distinguishing
 * them would turn this endpoint into an oracle for which tokens exist.
 *
 * Node runtime, not Edge: lib/partner-auth.ts hashes with node:crypto.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** One destination for every outcome, so failures are indistinguishable. */
function go(req: NextRequest, query = ""): NextResponse {
  // 303 specifically: the browser must follow with GET regardless of method,
  // and must not treat the result as a cacheable representation of this URL.
  const res = NextResponse.redirect(new URL(`/partner${query}`, req.nextUrl.origin), 303);
  // The token is in this request's URL. Nothing may cache it, and the next
  // navigation must not carry it onward in a Referer header.
  res.headers.set("Cache-Control", "no-store, max-age=0");
  res.headers.set("Referrer-Policy", "no-referrer");
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export async function GET(req: NextRequest) {
  // Fail closed when the pepper is missing rather than comparing against an
  // empty secret. hashToken() already returns null in that case; this is the
  // earlier, cheaper exit.
  if (!portalAuthConfigured()) {
    console.error("[partner/login] PARTNER_TOKEN_SECRET is not set — refusing every login");
    return go(req, "?error=link");
  }

  const token = req.nextUrl.searchParams.get("t")?.trim();
  if (!token) return go(req, "?error=link");

  let ok = false;
  try {
    ok = await startPartnerSession(token);
  } catch (err) {
    // A database failure must not read as "your link is dead" — that sends a
    // partner to ask for a reissue they do not need. Tell them to retry.
    console.error("[partner/login] session lookup failed:", err);
    return go(req, "?error=unavailable");
  }

  if (!ok) return go(req, "?error=link");

  // Redeeming does not burn the token: the cookie derives from it, and the
  // admin reissuing a token is what kills existing sessions.
  return go(req);
}
