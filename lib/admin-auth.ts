/**
 * SolarBuilders.ng — superadmin check for server actions (server-only).
 *
 * proxy.ts already gates /admin/partners and /admin/routing, but a Next.js
 * server action is an HTTP endpoint addressed by its action ID, and it can be
 * invoked with a POST to ANY route — including public ones the proxy matcher
 * never sees. So every mutating action on the superadmin pages calls
 * `requireSuperadmin()` first and does nothing unless the request carries the
 * superadmin Basic credential.
 *
 * Fails closed: with ADMIN_SUPER_USER / ADMIN_SUPER_PASSWORD unset, nobody passes.
 */

import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";

/** SHA-256 both sides so length differences cannot leak through timing. */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a, "utf8").digest();
  const hb = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ha, hb);
}

/**
 * The superadmin user name when the current request carries the superadmin
 * credential, otherwise null. Use the returned name as the audit-trail actor.
 */
export async function requireSuperadmin(): Promise<string | null> {
  const superUser = process.env.ADMIN_SUPER_USER;
  const superPassword = process.env.ADMIN_SUPER_PASSWORD;
  if (!superUser || !superPassword) {
    console.error("[admin-auth] ADMIN_SUPER_USER / ADMIN_SUPER_PASSWORD not set — superadmin actions are disabled");
    return null;
  }

  const header = (await headers()).get("authorization");
  if (!header) return null;
  const [scheme, ...rest] = header.split(" ");
  if (scheme?.toLowerCase() !== "basic" || rest.length === 0) return null;

  let decoded: string;
  try {
    decoded = Buffer.from(rest.join(" ").trim(), "base64").toString("utf8");
  } catch {
    return null;
  }
  const sep = decoded.indexOf(":");
  if (sep === -1) return null;

  // Evaluate both comparisons, no short-circuit on the user name.
  const userOk = safeEqual(decoded.slice(0, sep), superUser);
  const passwordOk = safeEqual(decoded.slice(sep + 1), superPassword);
  return userOk && passwordOk ? superUser : null;
}
