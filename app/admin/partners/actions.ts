"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  VERIFICATION_CHECKS,
  VERIFICATION_VALID_MONTHS,
  MIN_COMMISSION_RATE,
  MAX_COMMISSION_RATE,
  PARTNER_STATUSES,
  slugify,
  uniqueSlug,
  verificationScopeLabel,
  type PartnerInfoRequest,
  type PartnerRow,
  type PartnerStatus,
  type VerificationCheckKey,
} from "@/lib/partners";
import {
  dbPatch,
  getPartner,
  logPartnerEvent,
  slugsTaken,
  supabaseEnv,
} from "@/lib/partner-db";
import { generatePortalToken, hashToken, portalAuthConfigured } from "@/lib/partner-auth";
import { sendApproved, sendInfoRequested } from "@/lib/partner-mail";
import { SITE_URL } from "@/lib/site";

/**
 * Server actions for the partner desk — everything that changes a partner row.
 *
 * Three rules this file exists to hold:
 *
 *   1. Authorisation is the proxy's job (proxy.ts, HTTP Basic, superadmin tier
 *      for /admin/partners). Nothing here decides who may act. The `x-sb-actor`
 *      header is read ONLY to write an honest audit trail — proxy.ts sets it on
 *      the way in and the pages themselves never allow anything on its say-so.
 *   2. Every change writes a partner_events row. Approval, rejection, suspension
 *      and commission decisions are exactly the things we will need to explain
 *      to a partner six months from now, and the partner row only keeps the
 *      latest state.
 *   3. Numbers are re-validated here, not trusted from the form. A commission
 *      rate is clamped into the same band lib/routing.ts computes with (L6).
 */

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function actor(): Promise<string> {
  try {
    const h = await headers();
    return (h.get("x-sb-actor") || "admin").slice(0, 80);
  } catch {
    return "admin";
  }
}

function revalidatePartner(id?: number) {
  revalidatePath("/admin/partners");
  revalidatePath("/admin/routing");
  revalidatePath("/partners");
  if (id) revalidatePath(`/admin/partners/${id}`);
}

function isPartnerStatus(v: unknown): v is PartnerStatus {
  return typeof v === "string" && (PARTNER_STATUSES as readonly string[]).includes(v);
}

/** Trim, drop empties, cap length — for anything a human typed into a form. */
function cleanText(v: FormDataEntryValue | null, max = 400): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

/** Clamp a submitted commission rate into the band routing.ts will use. */
function clampRate(v: FormDataEntryValue | null, fallback: number): number {
  const n = Number(typeof v === "string" ? v : NaN);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(MAX_COMMISSION_RATE, Math.max(MIN_COMMISSION_RATE, Math.round(n * 100) / 100));
}

/** Which of the four checks the reviewer ticked. */
function checksFrom(formData: FormData): Record<VerificationCheckKey, boolean> {
  const out = {} as Record<VerificationCheckKey, boolean>;
  for (const c of VERIFICATION_CHECKS) out[c.key] = formData.get(c.key) === "on";
  return out;
}

/** The clean, non-HTML highlights a public profile may carry (L11). */
function highlightsFrom(formData: FormData): string[] {
  return String(formData.get("highlights") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/[<>]/g, "").slice(0, 140))
    .slice(0, 6);
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW PIPELINE
// ─────────────────────────────────────────────────────────────────────────────

/** "Received" → "Under review". Records that a human has opened it. */
export async function markUnderReview(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  const who = await actor();

  const row = await getPartner(id);
  if (!row) return;

  await dbPatch<PartnerRow>("partners", { id: `eq.${id}` }, { status: "under_review" });
  await logPartnerEvent(id, who, "status:under_review", "Review opened");
  revalidatePartner(id);
}

/** Free-text internal note. Never shown to the applicant (L14). */
export async function saveInternalNotes(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  const notes = cleanText(formData.get("review_notes"), 4000);
  const who = await actor();

  await dbPatch<PartnerRow>("partners", { id: `eq.${id}` }, { review_notes: notes });
  await logPartnerEvent(id, who, "notes:saved", notes ? `${notes.length} chars` : "cleared");
  revalidatePartner(id);
}

/**
 * "We need one more thing." Stores the itemised list the applicant sees on
 * /partners/status and emails it, so the ask is never only in someone's inbox.
 */
export async function requestInfo(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  const who = await actor();
  const note = cleanText(formData.get("note"), 1000);

  const items: PartnerInfoRequest[] = String(formData.get("items") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((line) => {
      // "key | Label | why we are asking"
      const [key, label, reason] = line.split("|").map((s) => s.trim());
      return {
        key: (key || "item").slice(0, 60),
        label: (label || key || "More information").slice(0, 120),
        reason: (reason || "We need this to finish the check.").slice(0, 300),
      };
    });

  if (items.length === 0) {
    console.error("[admin/partners] requestInfo: no items");
    return;
  }

  const res = await dbPatch<PartnerRow>(
    "partners",
    { id: `eq.${id}` },
    {
      status: "info_requested",
      info_requested: items,
      info_requested_at: new Date().toISOString(),
      status_note: note,
    },
  );
  if (!res.ok) {
    console.error("[admin/partners] requestInfo failed:", res.status);
    return;
  }

  await logPartnerEvent(id, who, "status:info_requested", items.map((i) => i.label).join(", "));

  const row = res.data[0];
  if (row) {
    const portalUrl = portalAuthConfigured() ? `${SITE_URL}/partner/login` : `${SITE_URL}/contact`;
    await sendInfoRequested(row, items, portalUrl, note);
  }

  revalidatePartner(id);
}

// ─────────────────────────────────────────────────────────────────────────────
// APPROVAL — where a claim becomes a public badge (L1, L2, L18)
// ─────────────────────────────────────────────────────────────────────────────

export async function approvePartner(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  const who = await actor();

  const row = await getPartner(id);
  if (!row) {
    console.error("[admin/partners] approve: no partner", id);
    return;
  }

  // The portal link is how a partner receives work, so approving without a
  // configured secret would create a partner with no way in. Refuse instead —
  // the detail page says so before anyone clicks.
  if (!portalAuthConfigured()) {
    console.error("[admin/partners] approve refused: PARTNER_TOKEN_SECRET is not set");
    await logPartnerEvent(id, who, "approve:refused", "PARTNER_TOKEN_SECRET not configured");
    revalidatePartner(id);
    return;
  }

  const checks = checksFrom(formData);
  const rate = clampRate(formData.get("commission_rate"), Number(row.commission_rate) || 5);
  const blurb = cleanText(formData.get("public_blurb"), 400);
  const highlights = highlightsFrom(formData);
  const listed = formData.get("listed") === "on";
  const tier = formData.get("tier") === "tracked" ? "tracked" : "partner";

  // The slug is the public URL. Reuse the existing one, so a re-approval or a
  // re-verification does not break links we have already handed out.
  const slug =
    row.slug && row.slug.trim() ? row.slug : uniqueSlug(slugify(row.business_name), await slugsTaken());

  const now = new Date();
  const until = new Date(now);
  until.setMonth(until.getMonth() + VERIFICATION_VALID_MONTHS);

  const token = generatePortalToken();
  const hash = hashToken(token);
  if (!hash) {
    console.error("[admin/partners] approve refused: could not hash portal token");
    return;
  }

  const scope = verificationScopeLabel({ ...row, ...checks });

  const res = await dbPatch<PartnerRow>(
    "partners",
    { id: `eq.${id}` },
    {
      status: "approved",
      slug,
      ...checks,
      verified: true,
      verified_at: now.toISOString(),
      verified_until: until.toISOString(),
      verified_by: who,
      verification_scope: scope,
      commission_rate: rate,
      tier,
      listed,
      public_blurb: blurb,
      public_highlights: highlights,
      portal_token_hash: hash,
      portal_token_issued_at: now.toISOString(),
      rejected_reason: null,
      suspended_reason: null,
      suspended_at: null,
      info_requested: null,
      info_requested_at: null,
    },
  );

  if (!res.ok) {
    console.error("[admin/partners] approve failed:", res.status, res.body?.slice(0, 200));
    return;
  }

  const approved = res.data[0] ?? row;
  await logPartnerEvent(id, who, "status:approved", `${scope} · ${rate}% · slug ${slug}${listed ? "" : " · UNLISTED"}`);

  const portalUrl = `${SITE_URL}/partner/login?t=${encodeURIComponent(token)}`;
  await sendApproved(approved, portalUrl, `${SITE_URL}/partners/${slug}`);

  revalidatePartner(id);
}

/** Reissue a link without touching the verification. Kills every old session. */
export async function reissuePortalToken(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  const who = await actor();

  if (!portalAuthConfigured()) {
    console.error("[admin/partners] reissue refused: PARTNER_TOKEN_SECRET is not set");
    return;
  }

  const row = await getPartner(id);
  if (!row || row.status !== "approved") return;

  const token = generatePortalToken();
  const hash = hashToken(token);
  if (!hash) return;

  const res = await dbPatch<PartnerRow>(
    "partners",
    { id: `eq.${id}` },
    { portal_token_hash: hash, portal_token_issued_at: new Date().toISOString() },
  );
  if (!res.ok) {
    console.error("[admin/partners] reissue failed:", res.status);
    return;
  }

  await logPartnerEvent(id, who, "portal:reissued", "Previous link (and every session) revoked");

  const portalUrl = `${SITE_URL}/partner/login?t=${encodeURIComponent(token)}`;
  await sendApproved(res.data[0] ?? row, portalUrl, `${SITE_URL}/partners/${row.slug ?? ""}`);

  revalidatePartner(id);
}

/** Turn the public listing on or off without undoing the verification. */
export async function setListed(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  const who = await actor();
  const listed = formData.get("listed") === "on";

  await dbPatch<PartnerRow>("partners", { id: `eq.${id}` }, { listed });
  await logPartnerEvent(id, who, listed ? "listing:on" : "listing:off");
  revalidatePartner(id);
}

// ─────────────────────────────────────────────────────────────────────────────
// REJECTION AND SUSPENSION — both take the badge off, both keep the reason
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A rejection is final for this application, not a ban on the business: the
 * reason is stored and shown to the applicant, and they can apply again with
 * better evidence.
 */
export async function rejectPartner(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  const who = await actor();
  const reason = cleanText(formData.get("rejected_reason"), 1000);

  if (!reason) {
    console.error("[admin/partners] reject: a reason is required");
    return;
  }

  const res = await dbPatch<PartnerRow>(
    "partners",
    { id: `eq.${id}` },
    {
      status: "rejected",
      rejected_reason: reason,
      verified: false,
      listed: false,
      availability: "paused",
      info_requested: null,
      info_requested_at: null,
    },
  );
  if (!res.ok) {
    console.error("[admin/partners] reject failed:", res.status);
    return;
  }

  await logPartnerEvent(id, who, "status:rejected", reason);
  revalidatePartner(id);
}

/**
 * Suspension is for a partner who was approved and should no longer be: the
 * badge comes off the site, the listing goes, and they stop being offered work.
 * The portal link stays alive so they can see the reason and their history.
 */
export async function suspendPartner(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  const who = await actor();
  const reason = cleanText(formData.get("suspended_reason"), 1000);

  if (!reason) {
    console.error("[admin/partners] suspend: a reason is required");
    return;
  }

  const res = await dbPatch<PartnerRow>(
    "partners",
    { id: `eq.${id}` },
    {
      status: "suspended",
      suspended_reason: reason,
      suspended_at: new Date().toISOString(),
      verified: false,
      listed: false,
      availability: "paused",
    },
  );
  if (!res.ok) {
    console.error("[admin/partners] suspend failed:", res.status);
    return;
  }

  await logPartnerEvent(id, who, "status:suspended", reason);
  revalidatePartner(id);
}

/**
 * Redact the referees' phone numbers once the calls are done (L14).
 *
 * The names and what each referee was engaged for stay — that is the evidence
 * the check happened. The numbers are what we no longer need, and should not be
 * sitting in a row we might read six months from now.
 */
export async function redactReferences(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  const who = await actor();

  const row = await getPartner(id);
  if (!row) return;
  if (!row.refs || row.refs.length === 0) return;
  if (row.references_redacted_at) {
    console.error("[admin/partners] redact: already redacted", id);
    return;
  }

  const redacted = row.refs.map((r) => ({
    name: r.name.slice(0, 120),
    phone: "",
    project: (r.project ?? "").slice(0, 200),
  }));

  const res = await dbPatch<PartnerRow>(
    "partners",
    { id: `eq.${id}` },
    { refs: redacted, references_redacted_at: new Date().toISOString() },
  );
  if (!res.ok) {
    console.error("[admin/partners] redact failed:", res.status);
    return;
  }

  await logPartnerEvent(id, who, "references:redacted", `${redacted.length} referee numbers cleared`);
  revalidatePartner(id);
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMISSION — the gate that keeps routing honest (L5, L7)
//
// A receipt upload is a claim, not proof. Nothing here clears a partner's block
// except a human matching the payment against our own bank statement. These two
// actions are that human step.
// ─────────────────────────────────────────────────────────────────────────────

export async function confirmPayment(formData: FormData) {
  const paymentId = Number(formData.get("payment_id"));
  const partnerId = Number(formData.get("id"));
  if (!Number.isInteger(paymentId) || paymentId <= 0) return;
  if (!Number.isInteger(partnerId) || partnerId <= 0) return;
  const who = await actor();
  const amountPaid = Number(formData.get("amount_paid"));
  const bankRef = cleanText(formData.get("bank_ref"), 80);

  const now = new Date().toISOString();
  const paymentRes = await dbPatch<{ job_id: number | null; invoice_ref: string }>(
    "partner_payments",
    { id: `eq.${paymentId}` },
    {
      status: "confirmed",
      confirmed_at: now,
      confirmed_by: who,
      reject_reason: null,
      ...(Number.isFinite(amountPaid) && amountPaid > 0 ? { amount_paid: Math.round(amountPaid) } : {}),
      ...(bankRef ? { bank_ref: bankRef } : {}),
    },
  );
  if (!paymentRes.ok) {
    console.error("[admin/partners] confirmPayment failed:", paymentRes.status);
    return;
  }

  const payment = paymentRes.data[0];

  // Clearing the JOB's commission is what lifts the routing block —
  // hasDueCommission reads the job's commission_status, not the payment row.
  if (payment?.job_id) {
    await dbPatch<{ id: number }>(
      "partner_jobs",
      { id: `eq.${payment.job_id}` },
      { commission_status: "confirmed", commission_cleared_at: now },
    );
  }

  await logPartnerEvent(
    partnerId,
    who,
    "payment:confirmed",
    `${payment?.invoice_ref ?? `payment ${paymentId}`} · matched against our statement${bankRef ? ` (ref ${bankRef})` : ""}`,
    payment?.job_id ?? undefined,
  );
  revalidatePartner(partnerId);
}

export async function rejectPayment(formData: FormData) {
  const paymentId = Number(formData.get("payment_id"));
  const partnerId = Number(formData.get("id"));
  if (!Number.isInteger(paymentId) || paymentId <= 0) return;
  if (!Number.isInteger(partnerId) || partnerId <= 0) return;
  const who = await actor();
  const reason = cleanText(formData.get("reject_reason"), 600);

  if (!reason) {
    console.error("[admin/partners] rejectPayment: a reason is required");
    return;
  }

  const paymentRes = await dbPatch<{ job_id: number | null; invoice_ref: string }>(
    "partner_payments",
    { id: `eq.${paymentId}` },
    { status: "rejected", reject_reason: reason, confirmed_at: null, confirmed_by: null },
  );
  if (!paymentRes.ok) {
    console.error("[admin/partners] rejectPayment failed:", paymentRes.status);
    return;
  }

  const payment = paymentRes.data[0];

  // Back to "due": the partner stays blocked until we can actually match it.
  if (payment?.job_id) {
    await dbPatch<{ id: number }>(
      "partner_jobs",
      { id: `eq.${payment.job_id}` },
      { commission_status: "due", commission_cleared_at: null },
    );
  }

  await logPartnerEvent(
    partnerId,
    who,
    "payment:rejected",
    `${payment?.invoice_ref ?? `payment ${paymentId}`} · ${reason}`,
    payment?.job_id ?? undefined,
  );
  revalidatePartner(partnerId);
}
