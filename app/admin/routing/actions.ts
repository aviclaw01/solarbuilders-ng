"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  commissionAmount,
  guessCity,
  guessState,
  offerExpiry,
  rankPartners,
  sizeBucketFromText,
  type RequestProfile,
} from "@/lib/routing";
import {
  MAX_COMMISSION_RATE,
  MIN_COMMISSION_RATE,
  capabilityFrom,
  commissionRateOf,
  jobRef,
  type PartnerJobRow,
} from "@/lib/partners";
import {
  dbGet,
  dbInsert,
  dbPatch,
  getPartner,
  listJobsForSource,
  logPartnerEvent,
  routingCandidates,
} from "@/lib/partner-db";
import { sendJobOffer } from "@/lib/partner-mail";
import { SITE_URL } from "@/lib/site";

/**
 * Server actions for the routing board.
 *
 * The rule that matters here (L5, L6, L9): a job is only ever offered to a
 * partner the engine says is eligible, with OUR commission figure computed from
 * OUR record. The form carries a partner id and a rate; everything else is
 * recomputed server-side from the request row, so a stale page or a tampered
 * form cannot offer work to a blocked partner.
 *
 * Authorisation is proxy.ts (superadmin tier). x-sb-actor is read only to write
 * the audit trail.
 */

interface SourceRequest {
  id: number;
  reference: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  location: string | null;
  note: string | null;
  quote_code: string | null;
  total_best: number | null;
  summary?: string | null;
  lines?: unknown;
  needs_install?: boolean | null;
  item_count?: number | null;
}

async function actor(): Promise<string> {
  try {
    const h = await headers();
    return (h.get("x-sb-actor") || "admin").slice(0, 80);
  } catch {
    return "admin";
  }
}

function revalidateRouting() {
  revalidatePath("/admin/routing");
  revalidatePath("/admin/partners");
}

/** Read one request row from whichever table it came from. */
async function readRequest(source: string, sourceId: number): Promise<SourceRequest | null> {
  const table = source === "order_request" ? "order_requests" : "quote_requests";
  const rows = await dbGet<SourceRequest>(table, { select: "*", id: `eq.${sourceId}`, limit: "1" });
  return rows[0] ?? null;
}

/** The text a job is sized and matched from. */
function requestText(req: SourceRequest): string {
  const parts = [req.summary, req.note].filter((s): s is string => Boolean(s && s.trim()));
  if (parts.length) return parts.join("\n");
  if (Array.isArray(req.lines)) {
    return (req.lines as { name?: string }[]).map((l) => l?.name ?? "").join("\n");
  }
  return "";
}

/** The profile routing scores against — built from the request row, never the form. */
function profileFor(req: SourceRequest, now: Date): RequestProfile {
  const text = requestText(req);
  return {
    state: guessState(req.location) ?? "",
    city: guessCity(req.location),
    services: ["full_install"],
    systemSize: sizeBucketFromText(text),
    needsInstall: req.needs_install !== false,
    now,
  };
}

function jobTitle(source: string, req: SourceRequest): string {
  if (source === "order_request") {
    const n = req.item_count ?? 0;
    return `Install order ${req.reference ?? `#${req.id}`}${n ? ` — ${n} item${n === 1 ? "" : "s"}` : ""}`;
  }
  return `Quoted system${req.quote_code ? ` ${req.quote_code}` : ""}${req.location ? ` — ${req.location}` : ""}`;
}

/** Is there already a job on this request that blocks a new offer? */
function liveJobFor(jobs: PartnerJobRow[]): PartnerJobRow | undefined {
  return jobs.find((j) => j.status === "accepted" || j.status === "completed" || j.status === "offered");
}

/**
 * Offer one request to one partner. Recomputes eligibility and the commission
 * server-side, so an offer can never be created for a blocked partner.
 */
export async function offerJob(formData: FormData) {
  const source = String(formData.get("source") ?? "");
  const sourceId = Number(formData.get("source_id"));
  const partnerId = Number(formData.get("partner_id"));
  const installFeeRaw = Number(formData.get("install_fee"));
  const rateRaw = Number(formData.get("commission_rate"));

  if (source !== "quote_request" && source !== "order_request") return;
  if (!Number.isInteger(sourceId) || sourceId <= 0) return;
  if (!Number.isInteger(partnerId) || partnerId <= 0) return;

  const who = await actor();
  const now = new Date();

  const [req, partner, existing, { candidates }] = await Promise.all([
    readRequest(source, sourceId),
    getPartner(partnerId),
    listJobsForSource(source, sourceId),
    routingCandidates(now),
  ]);

  if (!req) {
    console.error("[admin/routing] offerJob: no request", source, sourceId);
    return;
  }
  if (!partner) {
    console.error("[admin/routing] offerJob: no partner", partnerId);
    return;
  }

  // One live job per request. The database enforces this too, but failing here
  // leaves a clearer trail than a 409 from PostgREST.
  const live = liveJobFor(existing);
  if (live) {
    console.error("[admin/routing] offerJob: request already has a live job", live.reference, live.status);
    return;
  }

  // Re-score: the partner must be eligible right now, on their current row.
  const profile = profileFor(req, now);
  const verdict = rankPartners(
    candidates.map((c) => capabilityFrom(c.partner, c.stats)),
    profile,
  ).find((v) => v.partnerId === partnerId);

  if (!verdict || !verdict.eligible) {
    const why = verdict ? verdict.blockers.join("; ") : "not in the routing pool";
    console.error("[admin/routing] offerJob refused:", why);
    await logPartnerEvent(partnerId, who, "offer:refused", why);
    revalidateRouting();
    return;
  }

  const rate = Number.isFinite(rateRaw)
    ? Math.min(MAX_COMMISSION_RATE, Math.max(MIN_COMMISSION_RATE, rateRaw))
    : commissionRateOf(partner);
  const installFee = Number.isFinite(installFeeRaw) && installFeeRaw > 0 ? Math.round(installFeeRaw) : null;

  const reference = jobRef();
  const res = await dbInsert<{ id: number }>("partner_jobs", {
    partner_id: partnerId,
    source,
    source_id: sourceId,
    reference,
    customer_name: req.name,
    customer_phone: req.phone,
    customer_email: req.email,
    customer_ref: req.reference ?? req.quote_code,
    title: jobTitle(source, req),
    location: req.location,
    detail: requestText(req).slice(0, 4000) || null,
    budget_best: req.total_best,
    install_fee: installFee,
    commission_rate: rate,
    commission_amount: commissionAmount({ budgetBest: req.total_best, installFee, ratePercent: rate }),
    commission_status: "none",
    status: "offered",
    offered_at: now.toISOString(),
    offer_expires_at: offerExpiry(now).toISOString(),
    routed_by: who,
  });

  if (!res.ok) {
    console.error("[admin/routing] offerJob insert failed:", res.status, res.body?.slice(0, 200));
    return;
  }

  const jobId = res.data[0]?.id;
  await logPartnerEvent(
    partnerId,
    who,
    "offer:sent",
    `${reference} · ${verdict.reasons.slice(0, 2).join("; ") || "eligible"}`,
    jobId,
  );

  // Tell them. If the email fails the offer still exists and shows up the next
  // time they open the portal, so a mail failure is not fatal.
  const rows = await dbGet<PartnerJobRow>("partner_jobs", { select: "*", id: `eq.${jobId}`, limit: "1" });
  if (rows[0]) await sendJobOffer(partner, rows[0], `${SITE_URL}/partner`);

  revalidateRouting();
}

/**
 * Offer to the best eligible partner, having re-scored the whole pool. Refuses,
 * with a logged reason, when nobody is eligible — rather than offering to
 * whoever happens to be first in the table.
 */
export async function autoRouteJob(formData: FormData) {
  const source = String(formData.get("source") ?? "");
  const sourceId = Number(formData.get("source_id"));
  if (source !== "quote_request" && source !== "order_request") return;
  if (!Number.isInteger(sourceId) || sourceId <= 0) return;

  const who = await actor();
  const now = new Date();

  const [req, existing, { candidates }] = await Promise.all([
    readRequest(source, sourceId),
    listJobsForSource(source, sourceId),
    routingCandidates(now),
  ]);

  if (!req) return;
  if (liveJobFor(existing)) {
    console.error("[admin/routing] autoRoute: request already has a live job");
    return;
  }

  const profile = profileFor(req, now);
  const ranked = rankPartners(
    candidates.map((c) => capabilityFrom(c.partner, c.stats)),
    profile,
  );
  const best = ranked.find((v) => v.eligible);

  if (!best) {
    const why = ranked[0]?.blockers[0] ?? "no partners in the routing pool";
    console.error("[admin/routing] autoRoute: no eligible partner —", why);
    await logPartnerEvent(0, who, "route:no-candidate", `${source} ${sourceId} — ${why}`);
    revalidateRouting();
    return;
  }

  const fd = new FormData();
  fd.set("source", source);
  fd.set("source_id", String(sourceId));
  fd.set("partner_id", String(best.partnerId));
  await offerJob(fd);
}

/** Pull an unanswered offer back so the request can go to someone else (L9). */
export async function releaseOffer(formData: FormData) {
  const jobId = Number(formData.get("job_id"));
  if (!Number.isInteger(jobId) || jobId <= 0) return;
  const who = await actor();

  const rows = await dbGet<Pick<PartnerJobRow, "id" | "partner_id" | "reference" | "status">>("partner_jobs", {
    select: "id,partner_id,reference,status",
    id: `eq.${jobId}`,
    limit: "1",
  });
  const job = rows[0];
  if (!job) return;
  if (job.status !== "offered") {
    console.error("[admin/routing] releaseOffer: job is not an open offer", job.status);
    return;
  }

  const res = await dbPatch(
    "partner_jobs",
    { id: `eq.${jobId}` },
    { status: "expired", responded_at: new Date().toISOString() },
  );
  if (!res.ok) {
    console.error("[admin/routing] releaseOffer failed:", res.status);
    return;
  }

  await logPartnerEvent(job.partner_id, who, "offer:released", `${job.reference} pulled back by the desk`, jobId);
  revalidateRouting();
}