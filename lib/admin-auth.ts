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

/** The Basic credential on the current request as [user, password], or null. */
async function basicCredential(): Promise<[string, string] | null> {
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
  return [decoded.slice(0, sep), decoded.slice(sep + 1)];
}

/** Both comparisons always run, so timing does not reveal which half was wrong. */
function matches(cred: [string, string], user: string, password: string): boolean {
  const userOk = safeEqual(cred[0], user);
  const passwordOk = safeEqual(cred[1], password);
  return userOk && passwordOk;
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
  const cred = await basicCredential();
  return cred && matches(cred, superUser, superPassword) ? superUser : null;
}

/**
 * The admin user name when the request carries the normal admin credential or
 * the superadmin one, otherwise null. For actions on the regular admin pages
 * (leads, orders), which had relied on the proxy alone — the same gap described
 * at the top of this file. Fails closed when neither credential is configured.
 */
export async function requireAdmin(): Promise<string | null> {
  const cred = await basicCredential();
  if (!cred) return null;

  const user = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;
  if (user && password && matches(cred, user, password)) return user;

  return requireSuperadmin();
}
