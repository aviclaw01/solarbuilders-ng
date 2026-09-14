import { NextResponse, type NextRequest } from "next/server";

/**
 * HTTP Basic auth for the internal admin area.
 *
 * Protects /admin/* (the leads dashboard) and /api/admin/* (its JSON routes).
 * Nothing else on the site is touched — see `config.matcher` below.
 *
 * Required env vars (Vercel → Project → Settings → Environment Variables):
 *   ADMIN_USER
 *   ADMIN_PASSWORD
 *
 * If either is missing we return 503 rather than falling open, so a
 * misconfigured deploy hides the leads instead of publishing them.
 *
 * Next 16 convention: this is `proxy.ts` exporting `proxy()` (the older
 * `middleware.ts` / `middleware()` naming is deprecated). Never add a
 * `middleware.ts` alongside this file — having both is a hard build error.
 *
 * Runs on the Edge runtime: no node:crypto, no dependencies. The credential
 * comparison hashes both sides with Web Crypto SHA-256 and then compares the
 * digests byte by byte without early exit, so neither the length nor the
 * position of the first difference leaks through response timing.
 */

const REALM = 'Basic realm="SolarBuilders admin", charset="UTF-8"';

/** Constant-time comparison of two equal-length byte arrays. */
function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function sha256(value: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return new Uint8Array(digest);
}

/**
 * Timing-safe string equality. Both sides are hashed to a fixed 32 bytes
 * first, so differing input lengths cannot be distinguished by timing.
 */
async function timingSafeEqualString(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([sha256(a), sha256(b)]);
  return bytesEqual(ha, hb);
}

/** Decode a base64 string to UTF-8 text. Returns null on malformed input. */
function decodeBase64Utf8(b64: string): string | null {
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch {
    return null;
  }
}

function unauthorized(): NextResponse {
  return new NextResponse("Authentication required.\n", {
    status: 401,
    headers: {
      "WWW-Authenticate": REALM,
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function proxy(req: NextRequest) {
  const user = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;

  if (!user || !password) {
    return new NextResponse(
      "Admin area is not configured. Set ADMIN_USER and ADMIN_PASSWORD in the environment (Vercel → Settings → Environment Variables) and redeploy.\n",
      {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
      },
    );
  }

  const header = req.headers.get("authorization");
  if (!header) return unauthorized();

  const [scheme, ...rest] = header.split(" ");
  if (scheme?.toLowerCase() !== "basic" || rest.length === 0) return unauthorized();

  const decoded = decodeBase64Utf8(rest.join(" ").trim());
  if (decoded === null) return unauthorized();

  // Only the FIRST colon separates user from password — passwords may contain colons.
  const sep = decoded.indexOf(":");
  if (sep === -1) return unauthorized();

  const givenUser = decoded.slice(0, sep);
  const givenPassword = decoded.slice(sep + 1);

  // Evaluate both comparisons unconditionally — no short-circuit on the username.
  const [userOk, passwordOk] = await Promise.all([
    timingSafeEqualString(givenUser, user),
    timingSafeEqualString(givenPassword, password),
  ]);

  if (!userOk || !passwordOk) return unauthorized();

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
