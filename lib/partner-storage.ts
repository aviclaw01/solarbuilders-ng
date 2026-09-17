/**
 * SolarBuilders.ng — commission receipt storage (server-only).
 *
 * Receipts go into the private `partner-receipts` bucket. The bucket is not
 * public and has no policies: every read is a short-lived signed URL minted here
 * with the service-role key, which is what keeps a screenshot of a transfer out
 * of a public URL space (L7, L14).
 *
 * A receipt upload is a claim, not proof. Confirming it against our own account
 * statement is a human act on /admin/partners/[id] (L7) — nothing in this file
 * changes a payment's status.
 */

import { supabaseEnv } from "./partner-db";

export const RECEIPT_BUCKET = "partner-receipts";

/** Receipts we accept. Anything else is refused before it is read. */
export const RECEIPT_MIME = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
export const RECEIPT_MAX_BYTES = 5 * 1024 * 1024; // 5MB

export function storageConfigured(): boolean {
  return supabaseEnv() !== null;
}

/**
 * Object path for a receipt. Built only from server-side values, so a partner
 * cannot choose where their file lands (no `../`, no cross-partner overwrite).
 */
export function receiptPath(partnerId: number, invoiceRef: string, mime: string): string {
  const ext =
    mime === "application/pdf" ? "pdf" : mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  const safeInvoice = invoiceRef.replace(/[^A-Za-z0-9-]/g, "").slice(0, 40) || "receipt";
  return `partner-${partnerId}/${safeInvoice}-${Date.now().toString(36)}.${ext}`;
}

/** Upload bytes to the private bucket. Returns the object path on success. */
export async function uploadReceipt(
  path: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const env = supabaseEnv();
  if (!env) return { ok: false, error: "Storage is not configured on this deployment." };

  try {
    const res = await fetch(`${env.url}/storage/v1/object/${RECEIPT_BUCKET}/${path}`, {
      method: "POST",
      headers: {
        apikey: env.key,
        Authorization: `Bearer ${env.key}`,
        "Content-Type": contentType,
        "x-upsert": "true",
        "cache-control": "3600",
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
  if (!env || !path) return null;
  try {
    const res = await fetch(`${env.url}/storage/v1/object/sign/${RECEIPT_BUCKET}/${path}`, {
      method: "POST",
      headers: {
        apikey: env.key,
        Authorization: `Bearer ${env.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: expiresInSeconds }),
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
  if (!env || !path) return false;
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