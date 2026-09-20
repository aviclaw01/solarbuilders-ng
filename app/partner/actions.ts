"use server";

import { revalidatePath } from "next/cache";
import { readPartnerSession } from "@/lib/partner-auth";
import { dbGet, dbInsert, dbPatch, getJob, logPartnerEvent } from "@/lib/partner-db";
import { commissionRateOf, type PartnerJobRow, type PartnerRow } from "@/lib/partners";
import { invoiceRef, isOfferExpired } from "@/lib/routing";
import {
  RECEIPT_MAX_BYTES,
  RECEIPT_MIME,
  receiptPath,
  storageConfigured,
  uploadReceipt,
} from "@/lib/partner-storage";

/**
 * Server actions for the partner portal.
 *
 * The rule every one of these obeys (PARTNER-PIPELINE.md §5): the partner is
 * derived from the SESSION, never from a form field, and the row being written
 * is checked to belong to them before anything is written. A partner id in a
 * form would be a partner id an attacker can change.
 *
 * `readPartnerSession(true)` re-reads the row each time on purpose, so a
 * partner suspended mid-session cannot keep accepting work (L10).
 */

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const GENERIC = "Something went wrong. Refresh and try again.";

/** The signed-in partner, or null. Never trusts anything in the form. */
async function me(): Promise<PartnerRow | null> {
  try {
    return await readPartnerSession(true);
  } catch (err) {
    console.error("[partner/actions] session read failed:", err);
    return null;
  }
}

/** A job, only if it belongs to the caller. Ownership is checked here, once. */
async function myJob(partner: PartnerRow, jobId: unknown): Promise<PartnerJobRow | null> {
  const id = Number(jobId);
  if (!Number.isInteger(id) || id <= 0) return null;
  const job = await getJob(id);
  if (!job || job.partner_id !== partner.id) return null;
  return job;
}

function done(): void {
  revalidatePath("/partner");
  revalidatePath("/admin/routing");
  revalidatePath("/admin/partners");
}

// ─────────────────────────────────────────────────────────────────────────────
// OFFERS (L9)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Take a job. The database's partial unique index is the real arbiter — two
 * partners racing the same request means one insert wins and the other is
 * rejected, which we report as "no longer available" rather than a crash.
 */
export async function acceptOffer(formData: FormData): Promise<ActionResult> {
  const partner = await me();
  if (!partner) return { ok: false, error: "Your session has expired. Open your portal link again." };
  if (partner.status === "suspended") {
    return { ok: false, error: "Your account is suspended, so new work cannot be accepted. Talk to us first." };
  }

  const job = await myJob(partner, formData.get("job_id"));
  if (!job) return { ok: false, error: GENERIC };
  if (job.status !== "offered") return { ok: false, error: "That offer is no longer open." };
  if (isOfferExpired(job.offer_expires_at, new Date())) {
    return { ok: false, error: "That offer expired and has gone back to the desk. We will re-route it." };
  }

  const res = await dbPatch<PartnerJobRow>(
    "partner_jobs",
    { id: `eq.${job.id}`, status: "eq.offered" },
    { status: "accepted", responded_at: new Date().toISOString(), started_at: new Date().toISOString() },
  );

  if (!res.ok) {
    // 409 is the one-live-job-per-request index doing its job.
    console.error("[partner/actions] acceptOffer failed:", res.status, res.body?.slice(0, 200));
    return {
      ok: false,
      error:
        res.status === 409
          ? "Another partner accepted this first. It is no longer available."
          : "We could not record that just now. Try again in a moment.",
    };
  }
  if (res.data.length === 0) return { ok: false, error: "That offer is no longer open." };

  await logPartnerEvent(partner.id, "partner", "job:accepted", job.reference, job.id);
  done();
  return { ok: true, message: `You have taken ${job.reference}. The customer's contact details are now on the job.` };
}

/** Decline, with a reason. The reason is the point — it feeds routing (L15). */
export async function declineOffer(formData: FormData): Promise<ActionResult> {
  const partner = await me();
  if (!partner) return { ok: false, error: "Your session has expired. Open your portal link again." };

  const job = await myJob(partner, formData.get("job_id"));
  if (!job) return { ok: false, error: GENERIC };
  if (job.status !== "offered") return { ok: false, error: "That offer is no longer open." };

  const reason = String(formData.get("reason") ?? "").trim().slice(0, 300);
  if (reason.length < 3) {
    return { ok: false, error: "Tell us why in a few words — it stops us sending you the same mismatch again." };
  }

  const res = await dbPatch<PartnerJobRow>(
    "partner_jobs",
    { id: `eq.${job.id}`, status: "eq.offered" },
    { status: "declined", responded_at: new Date().toISOString(), decline_reason: reason },
  );
  if (!res.ok) return { ok: false, error: "We could not record that just now. Try again in a moment." };
  // Zero rows means the compound filter did not match — someone else moved it.
  if (res.data.length === 0) return { ok: false, error: "That offer is no longer open." };

  await logPartnerEvent(partner.id, "partner", "job:declined", `${job.reference} — ${reason}`, job.id);
  done();
  return { ok: true, message: "Declined. It goes back to the desk for someone else." };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPLETION (L16)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mark the work finished, and make the commission due from OUR figure on the
 * row (L6) — never from anything the partner enters.
 *
 * HONEST LIMITATION, and it is a real gap against L16. This writes `completed`
 * on the partner's word alone. `customer_confirmed_at` exists on the row and
 * NOTHING in this repo writes it, so there is no customer-confirmation step to
 * wait for. That matters because `completed` raises the partner's routing
 * score, frees a capacity slot, and permanently locks the source request out
 * of re-routing through the one-live-job index.
 *
 * Until a confirmation action exists, neither this function nor the UI may
 * claim the customer confirms anything. See issue #44.
 */
export async function markComplete(formData: FormData): Promise<ActionResult> {
  const partner = await me();
  if (!partner) return { ok: false, error: "Your session has expired. Open your portal link again." };

  const job = await myJob(partner, formData.get("job_id"));
  if (!job) return { ok: false, error: GENERIC };
  if (job.status !== "accepted") return { ok: false, error: "Only a job you have accepted can be completed." };

  const now = new Date();
  // Commission falls due on completion. COMMISSION_PAUSE_DAYS (14) and
  // COMMISSION_SUSPEND_DAYS (30) in lib/routing.ts are measured from
  // commission_due_at, so any grace added here is added ON TOP of them — a
  // 14-day window would have meant pause at +28 and suspend at +44, doubling
  // the L5 clock. Due immediately keeps the gate at the 14/30 L5 states.
  const dueAt = now;

  const res = await dbPatch<PartnerJobRow>(
    "partner_jobs",
    { id: `eq.${job.id}`, status: "eq.accepted" },
    {
      status: "completed",
      completed_at: now.toISOString(),
      commission_status: job.commission_amount && job.commission_amount > 0 ? "due" : "none",
      commission_due_at: job.commission_amount && job.commission_amount > 0 ? dueAt.toISOString() : null,
    },
  );
  if (!res.ok) return { ok: false, error: "We could not record that just now. Try again in a moment." };
  if (res.data.length === 0) return { ok: false, error: "That job is no longer in progress." };

  await logPartnerEvent(partner.id, "partner", "job:completed", job.reference, job.id);
  done();
  return {
    ok: true,
    message: "Marked complete. The commission for it is now due.",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMISSION RECEIPTS (L7, L13)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Record a commission payment the partner says they have made.
 *
 * This is a CLAIM, not proof (L7). The row lands as `submitted` and a human
 * matches the bank reference against our own statement before it is confirmed.
 * Nothing here clears a commission or opens the routing gate.
 */
export async function submitReceipt(formData: FormData): Promise<ActionResult> {
  const partner = await me();
  if (!partner) return { ok: false, error: "Your session has expired. Open your portal link again." };

  const job = await myJob(partner, formData.get("job_id"));
  if (!job) return { ok: false, error: GENERIC };
  if (job.status !== "completed") return { ok: false, error: "Commission is only due on a completed job." };

  const bankRef = String(formData.get("bank_ref") ?? "").trim().slice(0, 120);
  if (bankRef.length < 4) {
    return { ok: false, error: "We need the bank or NIP transaction reference — that is what we match against." };
  }

  const paidOnRaw = String(formData.get("paid_on") ?? "").trim();
  const paidOn = /^\d{4}-\d{2}-\d{2}$/.test(paidOnRaw) ? paidOnRaw : null;
  if (!paidOn) return { ok: false, error: "Enter the date you sent it." };

  const amountRaw = Number(formData.get("amount_paid"));
  const amountPaid = Number.isFinite(amountRaw) && amountRaw > 0 ? Math.round(amountRaw) : null;
  if (!amountPaid) return { ok: false, error: "Enter the amount you sent." };

  // The file is optional — a bank reference we can match is the thing that
  // matters. An upload that fails must not lose the rest of the claim.
  let receiptStoredPath: string | null = null;
  const file = formData.get("receipt");
  if (file instanceof File && file.size > 0) {
    if (!RECEIPT_MIME.includes(file.type)) {
      return { ok: false, error: "That file type is not accepted. Send a JPG, PNG, WebP, HEIC or PDF." };
    }
    if (file.size > RECEIPT_MAX_BYTES) {
      return { ok: false, error: `That file is over ${Math.round(RECEIPT_MAX_BYTES / 1024 / 1024)}MB. Send a smaller one.` };
    }
    if (!storageConfigured()) {
      return { ok: false, error: "File storage is not available on this deployment. Paste a link instead." };
    }
    const ref = invoiceRef(job.reference);
    const upload = await uploadReceipt(
      receiptPath(partner.id, ref, file.type),
      new Uint8Array(await file.arrayBuffer()),
      file.type,
    );
    if (!upload.ok) return { ok: false, error: upload.error };
    receiptStoredPath = upload.path;
  }

  const receiptUrl = String(formData.get("receipt_url") ?? "").trim().slice(0, 500);
  if (!receiptStoredPath && !/^https?:\/\//.test(receiptUrl)) {
    return { ok: false, error: "Attach the receipt, or paste a link to it." };
  }

  // One live claim per job. Without this a double submit inserts two payment
  // rows against one invoice reference, and a resubmit after confirmation
  // would drag a cleared commission backwards.
  const existing = await dbGet<{ id: number; status: string }>("partner_payments", {
    select: "id,status",
    job_id: `eq.${job.id}`,
    limit: "10",
  });
  if (existing.some((p) => p.status !== "rejected")) {
    return { ok: false, error: "We already have a receipt for this one. We will come back to you on it." };
  }

  const res = await dbInsert("partner_payments", {
    partner_id: partner.id,
    job_id: job.id,
    invoice_ref: invoiceRef(job.reference),
    // OUR figure, from the job row — never what they typed (L6).
    amount_expected: job.commission_amount ?? 0,
    amount_paid: amountPaid,
    method: "bank_transfer",
    bank_ref: bankRef,
    paid_on: paidOn,
    receipt_url: /^https?:\/\//.test(receiptUrl) ? receiptUrl : null,
    receipt_path: receiptStoredPath,
    status: "submitted",
  });
  if (!res.ok) {
    console.error("[partner/actions] payment insert failed:", res.status);
    return { ok: false, error: "We could not record that just now. Try again in a moment." };
  }

  // Only move a commission that is actually outstanding. Unfiltered, this
  // could drag a `confirmed` commission back to `receipt_uploaded` and re-block
  // the partner.
  const moved = await dbPatch<PartnerJobRow>(
    "partner_jobs",
    { id: `eq.${job.id}`, commission_status: "in.(due,overdue)" },
    { commission_status: "receipt_uploaded" },
  );
  if (!moved.ok || moved.data.length === 0) {
    // The claim is recorded either way; only the job's flag lagged. Say so
    // rather than reporting a clean success we did not achieve.
    console.error("[partner/actions] receipt stored but job flag not moved:", job.reference);
    return {
      ok: true,
      message: "Receipt received. Flagging it on the job did not go through, so we may chase you — quote " + invoiceRef(job.reference) + " if we do.",
    };
  }
  await logPartnerEvent(partner.id, "partner", "commission:receipt", `${invoiceRef(job.reference)} · ${bankRef}`, job.id);
  done();
  return {
    ok: true,
    message: "Received. We check it against our account and confirm — that is when the commission clears.",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AVAILABILITY (L10)
// ─────────────────────────────────────────────────────────────────────────────

/** The weekly tick that keeps a partner in the routing pool. */
export async function confirmAvailability(formData: FormData): Promise<ActionResult> {
  const partner = await me();
  if (!partner) return { ok: false, error: "Your session has expired. Open your portal link again." };

  const wanted = String(formData.get("availability") ?? "available");
  const availability = wanted === "busy" || wanted === "paused" ? wanted : "available";

  const res = await dbPatch(
    "partners",
    { id: `eq.${partner.id}` },
    { availability, availability_confirmed_at: new Date().toISOString() },
  );
  if (!res.ok) return { ok: false, error: "We could not save that just now. Try again in a moment." };

  await logPartnerEvent(partner.id, "partner", "availability:confirmed", availability);
  done();
  return {
    ok: true,
    message:
      availability === "available"
        ? "Confirmed — you are in for new jobs."
        : "Noted. You will not be offered new jobs until you set yourself back to available.",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// INFORMATION REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

/** Answer what a reviewer asked for, and put the application back in the queue. */
export async function respondToInfoRequest(formData: FormData): Promise<ActionResult> {
  const partner = await me();
  if (!partner) return { ok: false, error: "Your session has expired. Open your portal link again." };
  if (partner.status !== "info_requested") return { ok: false, error: "There is nothing outstanding on your application." };

  const answers: Record<string, string> = {};
  for (const item of partner.info_requested ?? []) {
    const value = String(formData.get(`info__${item.key}`) ?? "").trim().slice(0, 2000);
    if (value) answers[item.key] = value;
  }
  if (Object.keys(answers).length === 0) {
    return { ok: false, error: "Fill in at least one of the items before sending." };
  }

  const res = await dbPatch(
    "partners",
    { id: `eq.${partner.id}` },
    { info_response: answers, info_responded_at: new Date().toISOString(), status: "under_review" },
  );
  if (!res.ok) return { ok: false, error: "We could not save that just now. Try again in a moment." };

  await logPartnerEvent(partner.id, "partner", "info:responded", Object.keys(answers).join(", "));
  done();
  return { ok: true, message: "Thank you — your application is back with a reviewer." };
}
