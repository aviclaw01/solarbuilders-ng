/**
 * Storing inbound contact that is not a priced request.
 *
 * The two routes here — the homepage "size it for me" modal and the contact
 * form — used to email and nothing else. If Resend was down or unkeyed, the
 * route answered 500 and the lead was gone: no row, no record, nothing to
 * follow up. The homepage modal is the site's top-of-funnel capture, so that
 * was the busiest channel with the weakest guarantee.
 *
 * The contract now matches api/quote-request: two independent sinks, and the
 * caller reports honestly which of them worked.
 *
 *   { ok: true, emailed, stored }
 *
 * `ok` is true when EITHER sink took it. Both failing is a 500, because then
 * we genuinely do not have it.
 */

export type LeadKind = "lead_capture" | "contact";

export interface LeadRow {
  kind: LeadKind;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  location?: string | null;
  message?: string | null;
  /** Kind-specific fields; keeps a new form from needing a migration. */
  payload?: Record<string, unknown>;
}

/**
 * Insert one lead. Never throws — a storage failure must not cost the caller
 * its email, which may be the only copy.
 *
 * Returns false when Supabase is unconfigured, unreachable, or rejects the
 * row. The caller turns that into `stored: false` rather than an error, and
 * decides what to tell the visitor based on whether the email also failed.
 */
export async function storeLead(row: LeadRow): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url.includes("your-project")) return false;

  // The table enforces this too (leads_reachable), but failing here gives a
  // log line naming the route instead of an opaque 400 from PostgREST.
  if (!row.phone?.trim() && !row.email?.trim()) {
    console.error(`[leads] refusing to store a ${row.kind} with no phone and no email`);
    return false;
  }

  try {
    const res = await fetch(`${url}/rest/v1/leads`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        kind: row.kind,
        name: row.name || null,
        phone: row.phone || null,
        email: row.email || null,
        location: row.location || null,
        message: row.message || null,
        payload: row.payload ?? {},
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[leads] insert failed for ${row.kind}:`, res.status, (await res.text()).slice(0, 200));
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[leads] insert error for ${row.kind}:`, err);
    return false;
  }
}
