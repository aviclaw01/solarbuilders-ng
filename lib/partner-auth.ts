/**
 * SolarBuilders.ng — partner portal authentication (server-only).
 *
 * The portal has no passwords and no user accounts. A partner gets a one-time
 * link by email; redeeming it swaps the link for a cookie session. That keeps
 * the operational cost near zero while still being safe enough to hold commission
 * records, which is the level of care this data deserves (L12).
 *
 * Design rules, all of them fixes for a specific hole:
 *   - The token is never stored. Only SHA-256(secret + token) is (L12).
 *   - The token is single-use as a URL: /partner/login redeems it and redirects
 *     to /partner with no query string, so it never sits in the address bar, the
 *     browser history or a Referer header on an outbound click.
 *   - The session cookie is HttpOnly, SameSite=Lax, path=/partner, and derives
 *     from the same token — reissuing a token kills every existing session.
 *   - If PARTNER_TOKEN_SECRET is missing we refuse to log anybody in rather than
 *     fall back to something guessable.
 *
 * Node runtime only (node:crypto, and the route handlers that call it read from
 * Supabase with the service-role key).
 */

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { PartnerRow } from "./partners";
import { dbGet, getPartner } from "./partner-db";

/** Cookie name. Kept out of the `sb-` namespace so it never collides with Supabase. */
export const PORTAL_COOKIE = "partner_session";

/** How long a session lasts without the partner coming back. */
export const SESSION_DAYS = 30;

export const PORTAL_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/partner",
  maxAge: SESSION_DAYS * 24 * 60 * 60,
};

/** Is the portal usable on this deployment at all? */
export function portalAuthConfigured(): boolean {
  return Boolean(process.env.PARTNER_TOKEN_SECRET);
}

/**
 * A 192-bit URL-safe token. Shown once, at approval or on reissue — the admin
 * cannot recover it later, which is the point.
 */
export function generatePortalToken(): string {
  return randomBytes(24).toString("base64url");
}

/**
 * Hash a token for storage/lookup. Returns null when the secret is missing, so
 * callers can fail closed instead of comparing against an empty pepper.
 */
export function hashToken(token: string): string | null {
  const secret = process.env.PARTNER_TOKEN_SECRET;
  if (!secret || !token) return null;
  return createHash("sha256").update(`${secret}:${token}`).digest("hex");
}

/**
 * Look a partner up by the token they presented. The lookup is by hash equality
 * in Postgres, and the token is high-entropy random, so a timing side channel is
 * not a meaningful attack here.
 */
export async function findPartnerByToken(token: string): Promise<PartnerRow | null> {
  const hash = hashToken(token);
  if (!hash) return null;
  const rows = await dbGet<PartnerRow>("partners", {
    select: "*",
    portal_token_hash: `eq.${hash}`,
    limit: "1",
  });
  return rows[0] ?? null;
}

/** Set the session cookie from a redeemable token. Returns false if the token is dead. */
export async function startPartnerSession(token: string): Promise<boolean> {
  const partner = await findPartnerByToken(token);
  if (!partner) return false;
  const jar = await cookies();
  jar.set(PORTAL_COOKIE, token, PORTAL_COOKIE_OPTIONS);
  return true;
}

/** End the session. Safe to call when there is none. */
export async function endPartnerSession(): Promise<void> {
  const jar = await cookies();
  jar.set(PORTAL_COOKIE, "", { ...PORTAL_COOKIE_OPTIONS, maxAge: 0 });
}

/**
 * The partner behind the current request, or null.
 *
 * `revalidate` re-reads the row, which every mutating server action should do so
 * it is acting on the current status (a partner suspended mid-session must not
 * keep accepting jobs).
 */
export async function readPartnerSession(revalidate = true): Promise<PartnerRow | null> {
  const jar = await cookies();
  const token = jar.get(PORTAL_COOKIE)?.value;
  if (!token) return null;
  const partner = await findPartnerByToken(token);
  if (!partner) return null;
  if (!revalidate) return partner;
  // Note the visit, so /admin/partners can show "last seen" and spot a partner
  // who has stopped opening offers.
  return (await getPartner(partner.id)) ?? partner;
}

/** Was this cookie session issued from the token currently on the row? */
export function sessionMatchesRow(token: string, row: PartnerRow): boolean {
  const hash = hashToken(token);
  return Boolean(hash && row.portal_token_hash === hash);
}