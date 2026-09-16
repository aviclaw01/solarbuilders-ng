/**
 * SolarBuilders.ng — commission receipt storage (server-only).
 *
 * STATUS: library only. Receipts are uploaded from the partner portal, which is
 * not built yet, so nothing calls this module today.
 *
 * Receipts go into the private `partner-receipts` bucket. The bucket is not
 * public and has no policies: every read is a short-lived signed URL minted here
 * with the service-role key.
 *
 * Every function here enforces its own limits rather than trusting the caller:
 *   - content type must be on RECEIPT_MIME AND the bytes must look like that type
 *   - size is capped at RECEIPT_MAX_BYTES
 *   - object paths are built server-side with a random component, never
 *     overwrite (x-upsert: false), and any path passed back in is checked
 *     against the exact shape we generate (no `../`, no other partner's folder)
 *
 * A receipt upload is a claim, not proof. Confirming it against our own account
 * statement is a human act; nothing in this file changes a payment's status.
 */

import "server-only";
import { randomBytes } from "node:crypto";
import { supabaseEnv } from "./partner-db";

export const RECEIPT_BUCKET = "partner-receipts";

/** Receipts we accept. Anything else is refused before it is stored. */
export const RECEIPT_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;
export type ReceiptMime = (typeof RECEIPT_MIME)[number];
export const RECEIPT_MAX_BYTES = 5 * 1024 * 1024; // 5MB

const EXT: Record<ReceiptMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

/** The only object-path shape this module ever writes, reads or deletes. */
const PATH_RE = /^partner-\d{1,12}\/[A-Za-z0-9-]{1,40}-[a-f0-9]{32}\.(jpg|png|webp|pdf)$/;

export function storageConfigured(): boolean {
  return supabaseEnv() !== null;
}

function isReceiptMime(v: string): v is ReceiptMime {
  return (RECEIPT_MIME as readonly string[]).includes(v);
}

/** Check the file's leading bytes match the declared type. */
function magicMatches(bytes: Uint8Array, mime: ReceiptMime): boolean {
  const b = bytes;
  switch (mime) {
    case "image/jpeg":
      return b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case "image/png":
      return b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
    case "image/webp":
      return (
        b.length > 12 &&
        b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && // RIFF
        b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 // WEBP
      );
    case "application/pdf":
      return b.length > 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46; // %PDF
  }
}

/**
 * Object path for a receipt. Built only from server-side values plus 128 random
 * bits, so a partner cannot choose, guess or overwrite where a file lands.
 */
export function receiptPath(partnerId: number, invoiceRef: string, mime: ReceiptMime): string {
  if (!Number.isInteger(partnerId) || partnerId <= 0) throw new Error("bad partner id");
  const safeInvoice = invoiceRef.replace(/[^A-Za-z0-9-]/g, "").slice(0, 40) || "receipt";
  return `partner-${partnerId}/${safeInvoice}-${randomBytes(16).toString("hex")}.${EXT[mime]}`;
}

export function isReceiptPath(path: string): boolean {
  return typeof path === "string" && PATH_RE.test(path);
}

/** Upload bytes to the private bucket. Returns the object path on success. */
export async function uploadReceipt(
  partnerId: number,
  invoiceRef: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const env = supabaseEnv();
  if (!env) return { ok: false, error: "Storage is not configured on this deployment." };

  if (!isReceiptMime(contentType)) {
    return { ok: false, error: "Upload a JPG, PNG, WebP or PDF." };
  }
  if (bytes.byteLength === 0 || bytes.byteLength > RECEIPT_MAX_BYTES) {
    return { ok: false, error: "The file must be smaller than 5MB." };
  }
  if (!magicMatches(bytes, contentType)) {
    return { ok: false, error: "That file does not look like the type it claims to be." };
  }

  let path: string;
  try {
    path = receiptPath(partnerId, invoiceRef, contentType);
  } catch {
    return { ok: false, error: "We could not store the file." };
  }

  try {
    const res = await fetch(`${env.url}/storage/v1/object/${RECEIPT_BUCKET}/${path}`, {
      method: "POST",
      headers: {
        apikey: env.key,
        Authorization: `Bearer ${env.key}`,
        "Content-Type": contentType,
        "x-upsert": "false",
        "cache-control": "no-store",
      },
      body: bytes as unknown as BodyInit,
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[partner-storage] upload failed:", res.status, (await res.text()).slice(0, 300));
      return { ok: false, error: "We could not store the file. Try again, or paste a link instead." };
    }
    return { ok: true, path };
  } catch (err) {
    console.error("[partner-storage] upload error:", err);
    return { ok: false, error: "We could not store the file. Try again, or paste a link instead." };
  }
}

/**
 * A short-lived read URL for a stored receipt. Five minutes is long enough for a
 * human to look at it and short enough to be useless if it leaks.
 */
export async function signedReceiptUrl(path: string, expiresInSeconds = 300): Promise<string | null> {
  const env = supabaseEnv();
  if (!env || !isReceiptPath(path)) return null;
  const ttl = Math.max(30, Math.min(600, Math.round(expiresInSeconds)));
  try {
    const res = await fetch(`${env.url}/storage/v1/object/sign/${RECEIPT_BUCKET}/${path}`, {
      method: "POST",
      headers: {
        apikey: env.key,
        Authorization: `Bearer ${env.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: ttl }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[partner-storage] sign failed:", res.status, (await res.text()).slice(0, 300));
      return null;
    }
    const json = (await res.json()) as { signedURL?: string };
    if (!json.signedURL) return null;
    return json.signedURL.startsWith("http") ? json.signedURL : `${env.url}/storage/v1${json.signedURL}`;
  } catch (err) {
    console.error("[partner-storage] sign error:", err);
    return null;
  }
}

/** Remove a receipt we rejected as unreadable or not ours. */
export async function deleteReceipt(path: string): Promise<boolean> {
  const env = supabaseEnv();
  if (!env || !isReceiptPath(path)) return false;
  try {
    const res = await fetch(`${env.url}/storage/v1/object/${RECEIPT_BUCKET}/${path}`, {
      method: "DELETE",
      headers: { apikey: env.key, Authorization: `Bearer ${env.key}` },
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}
