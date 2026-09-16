import { NextResponse, type NextRequest } from "next/server";

/**
 * HTTP Basic auth for the internal admin area.
 *
 * Protects /admin/* (the internal dashboards) and /api/admin/* (their JSON routes).
 * /admin/partners and /admin/routing additionally need the superadmin credential.
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

/**
 * Paths that need the superadmin credential when one is configured.
 *
 * These are the surfaces where a person decides that a business becomes a
 * "verified partner", and where job routing is decided. The leads/orders/funnel
 * dashboards stay on the general admin credential.
 *
 * Fails closed: if ADMIN_SUPER_USER / ADMIN_SUPER_PASSWORD are not set, these
 * paths answer 503 for everybody. There is no fallback to the general admin
 * login. Server actions on these pages re-verify the credential themselves
 * (lib/admin-auth.ts), because a server action can be invoked by ID from any
 * route and so is not protected by this matcher alone.
 */
const SUPER_ONLY_PATHS = ["/admin/partners", "/admin/routing", "/api/admin/partners", "/api/admin/routing"];

/**
 * Does this path need the superadmin tier? The path is percent-decoded, lower-cased
 * and de-duplicated of slashes first, so `/admin/%70artners`, `/Admin/partners` or
 * `/admin//partners` cannot slip past a literal prefix match. A path that fails to
 * decode is treated as needing the higher tier (fail closed).
 */
function isSuperOnlyPath(rawPath: string): boolean {
  let path: string;
  try {
    path = decodeURIComponent(rawPath);
  } catch {
    return true;
  }
  path = path.replace(/\/{2,}/g, "/").toLowerCase();
  return SUPER_ONLY_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

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

/**
 * Authenticated, but on the wrong tier. 403 rather than 401 on purpose: the
 * browser must NOT pop the credential box again, because the credentials it
 * already has are valid — they are just not sufficient for this page.
 */
function forbidden(): NextResponse {
  return new NextResponse(
    `This page needs the superadmin credential (ADMIN_SUPER_USER / ADMIN_SUPER_PASSWORD).\n\n` +
      `The admin login you used is valid, but it cannot open the partner or routing pages — approving ` +
      `a partner puts our name next to theirs, so it is deliberately a separate, senior credential.\n`,
    {
      status: 403,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    },
  );
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
  const isAdmin = userOk && passwordOk;

  // ── Second tier: superadmin ────────────────────────────────────────────────
  // Approving a vendor puts our name next to them, so it warrants a credential
  // the everyday leads login does not have. When ADMIN_SUPER_USER and
  // ADMIN_SUPER_PASSWORD are unset the superadmin pages are closed (503), never
  // opened to the general admin login.
  const superUser = process.env.ADMIN_SUPER_USER;
  const superPassword = process.env.ADMIN_SUPER_PASSWORD;
  const superConfigured = Boolean(superUser && superPassword);

  let isSuper = false;
  if (superConfigured) {
    const [suOk, spOk] = await Promise.all([
      timingSafeEqualString(givenUser, superUser as string),
      timingSafeEqualString(givenPassword, superPassword as string),
    ]);
    isSuper = suOk && spOk;
  }

  if (!isAdmin && !isSuper) return unauthorized();

  const needsSuper = isSuperOnlyPath(req.nextUrl.pathname);
  if (needsSuper && !superConfigured) {
    console.error("[proxy] superadmin area requested but ADMIN_SUPER_USER / ADMIN_SUPER_PASSWORD are not set");
    return new NextResponse(
      "The partner and routing pages are not configured. Set ADMIN_SUPER_USER and ADMIN_SUPER_PASSWORD in the environment and redeploy.\n",
      {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
      },
    );
  }
  if (needsSuper && !isSuper) return forbidden();

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
