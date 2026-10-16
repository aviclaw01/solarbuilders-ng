/**
 * Backup copy of every lead and order in a Google Sheet.
 *
 * The sheet runs scripts/sheets-webhook.gs as an Apps Script web app; we POST
 * one row per submission to its URL with a shared secret. The script writes
 * each field under the column whose header matches the key, and adds any
 * missing column, so the sheet can be laid out to match the other order sheet
 * (solar.nexprove.com) without a code change. `source` tells the two apart.
 *
 * Off until SHEETS_WEBHOOK_URL and SHEETS_WEBHOOK_SECRET are set. Never throws
 * and never delays the answer by more than a few seconds: Supabase stays the
 * record of truth, the sheet is the copy.
 */

export interface SheetRow {
  /** "quote_request" | "order_request" | "need" | "contact_now" | … */
  type: string;
  ref?: string | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  location?: string | null;
  details?: string | null;
  amount?: number | null;
  page?: string | null;
  utm?: string | null;
}

export const SHEET_SOURCE = "solarbuildersng.com";

export async function appendToSheet(row: SheetRow): Promise<boolean> {
  const url = process.env.SHEETS_WEBHOOK_URL;
  const secret = process.env.SHEETS_WEBHOOK_SECRET;
  if (!url || !secret) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        row: {
          date: new Date().toISOString(),
          source: SHEET_SOURCE,
          status: "New",
          ...row,
        },
      }),
      signal: AbortSignal.timeout(5000),
      // Apps Script answers with a redirect to the result
      redirect: "follow",
    });
    if (!res.ok) console.error("[sheets] append failed:", res.status);
    return res.ok;
  } catch (err) {
    console.error("[sheets] append error:", err);
    return false;
  }
}
