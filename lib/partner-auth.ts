/**
 * SolarBuilders.ng — partner portal authentication (server-only).
 *
 * STATUS: library only. The partner portal (/partner) is not built yet, so
 * nothing calls this module today. It is kept, hardened, so the portal can be
 * added without re-deciding the token scheme.
 *
 * The portal has no passwords and no user accounts. A partner gets a private
 * link by email; redeeming it swaps the link for a cookie session.
 *
 * Design rules:
 *   - The token is 192 random bits and is never stored. Only
 *     HMAC-SHA256(PARTNER_TOKEN_SECRET, token) is stored, in portal_token_hash.
 *   - FAILS CLOSED: if PARTNER_TOKEN_SECRET is unset or shorter than 32
 *     characters, no token hashes, no token verifies, nobody logs in. There is
 *     no default or empty-key fallback.
 *   - The stored hash is compared in constant time, even after the database
 *     lookup matched it.
 *   - Tokens expire PORTAL_TOKEN_TTL_DAYS after portal_token_issued_at. A row
 *     with no issue date is treated as expired.
 *   - Reissuing a token (new hash on the row) kills every existing session,
 *     because the session cookie is re-verified against the row on every read.
 */

import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { PartnerRow } from "./partners";
import { dbGet } from "./partner-db";

/** Cookie name. Kept out of the `sb-` namespace so it never collides with Supabase. */
export const PORTAL_COOKIE = "partner_session";

/** How long an issued portal link (and any session made from it) stays valid. */
export const PORTAL_TOKEN_TTL_DAYS = 30;

/** Minimum secret length we accept. Anything shorter is treated as unset. */
const MIN_SECRET_LENGTH = 32;

export const PORTAL_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/partner",
  maxAge: PORTAL_TOKEN_TTL_DAYS * 24 * 60 * 60,
};

let warnedMissingSecret = false;

function tokenSecret(): string | null {
  const secret = process.env.PARTNER_TOKEN_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    if (!warnedMissingSecret) {
      warnedMissingSecret = true;
      console.error(
        `[partner-auth] PARTNER_TOKEN_SECRET is unset or shorter than ${MIN_SECRET_LENGTH} characters — partner portal login is disabled`,
      );
    }
    return null;
  }
  return secret;
}

/** Is portal login usable on this deployment at all? */
export function portalAuthConfigured(): boolean {
  return tokenSecret() !== null;
}

/**
 * A 192-bit URL-safe token. Shown once, at approval or on reissue; the admin
 * cannot recover it later. Returns null when the secret is missing, so a token
 * that could never verify is never handed out.
 */
export function generatePortalToken(): { token: string; hash: string } | null {
  const token = randomBytes(24).toString("base64url");
  const hash = hashToken(token);
  return hash ? { token, hash } : null;
}

/** HMAC a token for storage/lookup. Null when the secret is missing (fail closed). */
export function hashToken(token: string): string | null {
  const secret = tokenSecret();
  if (!secret || typeof token !== "string" || token.length < 16 || token.length > 200) return null;
  return createHmac("sha256", secret).update(token, "utf8").digest("hex");
}

function hexEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ba.length !== 32 || bb.length !== 32) return false;
  return timingSafeEqual(ba, bb);
}

function tokenExpired(row: Pick<PartnerRow, "portal_token_issued_at">, now = Date.now()): boolean {
  if (!row.portal_token_issued_at) return true;
  const issued = new Date(row.portal_token_issued_at).getTime();
  if (Number.isNaN(issued)) return true;
  return now - issued > PORTAL_TOKEN_TTL_DAYS * 86_400_000;
}

/**
 * Does this token belong to this row, and is it still in date? Constant-time
 * compare of the stored HMAC; false whenever the secret is missing.
 */
export function tokenMatchesRow(token: string, row: PartnerRow): boolean {
  const hash = hashToken(token);
  if (!hash || !row.portal_token_hash) return false;
  if (!hexEqual(hash, row.portal_token_hash)) return false;
  return !tokenExpired(row);
}

/**
 * Look a partner up by the token they presented. Suspended and rejected
 * partners get no session.
 */
export async function findPartnerByToken(token: string): Promise<PartnerRow | null> {
  const hash = hashToken(token);
  if (!hash) return null;
  const rows = await dbGet<PartnerRow>("partners", {
    select: "*",
    portal_token_hash: `eq.${hash}`,
    limit: "1",
  });
  const row = rows[0];
  if (!row || !tokenMatchesRow(token, row)) return null;
  if (row.status === "rejected" || row.status === "suspended") return null;
  return row;
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
 * The partner behind the current request, or null. Always re-reads the row, so
 * a partner suspended or reissued mid-session loses access immediately.
 */
export async function readPartnerSession(): Promise<PartnerRow | null> {
  const jar = await cookies();
  const token = jar.get(PORTAL_COOKIE)?.value;
  if (!token) return null;
  return findPartnerByToken(token);
}
