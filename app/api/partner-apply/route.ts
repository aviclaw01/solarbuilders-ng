import { NextResponse } from "next/server";
import { partnerRef, validateApplication, type PartnerApplication, type PartnerRow } from "@/lib/partners";
import { createPartner, dbGet, logPartnerEvent } from "@/lib/partner-db";
import { notifyTeamOfApplication, sendApplicationReceived } from "@/lib/partner-mail";

/**
 * POST /api/partner-apply — the front door of the verified-partner pipeline.
 *
 * The browser is never trusted (L17): everything is re-validated by
 * `validateApplication`, which also normalises and caps every field. Status,
 * tier, listing and verification flags are set here, never sent by the client.
 *
 * Response contract (see PARTNER-PIPELINE.md §5):
 *   200 { ok: true, ref, emailed, stored, duplicate? }
 *   400 { ok: false, error, fields? }
 *   429 { ok: false, error }
 */

export const dynamic = "force-dynamic";

/** Terms version recorded against the four ticks. Bump when the wording changes. */
const TERMS_VERSION = "2026-09-16";

const RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 5 };

/**
 * Per-instance rate limit.
 *
 * Honest limitation: this Map lives in one serverless instance's memory, so it
 * resets on deploy and never sees a request handled by a sibling instance. It
 * stops one person scripting the form; it is not a defence against a distributed
 * attacker. The real fix is a shared counter, worth doing the day this form
 * attracts attention (L17).
 */
const recentHits = new Map<string, number[]>();

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return (forwarded?.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim().slice(0, 60);
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (recentHits.get(key) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  hits.push(now);
  recentHits.set(key, hits);
  // Keep the map from growing without bound on a long-lived instance.
  if (recentHits.size > 500) {
    for (const [k, v] of recentHits) {
      if (v.every((t) => now - t > RATE_LIMIT.windowMs)) recentHits.delete(k);
    }
  }
  return hits.length > RATE_LIMIT.max;
}

/** A repeat application is only "open" while it has not been closed out. */
const OPEN_STATUSES = "in.(submitted,under_review,info_requested,approved)";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const payload = (body ?? {}) as Record<string, unknown>;

  // Honeypot (L17): a field no human sees. Answer exactly like a success so the
  // script that filled it learns nothing, but store nothing and send nothing.
  if (typeof payload.hp === "string" && payload.hp.trim() !== "") {
    console.warn("[partner-apply] honeypot tripped from", clientIp(req));
    return NextResponse.json({ ok: true, ref: "SB-PTR-000000", emailed: false, stored: false });
  }

  if (isRateLimited(clientIp(req))) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Too many applications from this connection in the last hour. Please try again later, or message us on WhatsApp.",
      },
      { status: 429 },
    );
  }

  const validated = validateApplication(payload);
  if (!validated.ok) {
    return NextResponse.json(
      { ok: false, error: validated.error, fields: validated.fields },
      { status: 400 },
    );
  }
  const data = validated.data;

  // A second application from the same address while one is still open is not a
  // new application — it is the same one. Returning the existing reference keeps
  // the queue honest instead of burying the reviewer (L17).
  const open = await dbGet<Pick<PartnerRow, "ref" | "status">>("partners", {
    select: "ref,status",
    email: `eq.${data.email}`,
    status: OPEN_STATUSES,
    limit: "1",
  });
  if (open[0]) {
    return NextResponse.json({ ok: true, ref: open[0].ref, emailed: false, stored: true, duplicate: true });
  }
  return handleNewApplication(data, req);
}

/** Store, email and answer. Split out so the POST handler reads top-down. */
async function handleNewApplication(data: PartnerApplication, req: Request) {
  const row = {
    kind: data.kind,
    business_name: data.businessName,
    contact_name: data.contactName,
    email: data.email,
    whatsapp: data.whatsapp,
    city: data.city,
    state: data.state,
    years_in_business: data.yearsInBusiness,
    website: data.website,
    instagram: data.instagram,
    services: data.services,
    system_sizes: data.systemSizes,
    coverage_states: data.coverageStates,
    coverage_cities: data.coverageCities,
    brands_carried: data.brandsCarried,
    monthly_capacity: data.monthlyCapacity,
    max_travel_km: data.maxTravelKm,
    cac_number: data.cacNumber,
    cac_doc_url: data.cacDocUrl,
    installs: data.installs,
    refs: data.refs,
    warranty_months: data.warrantyMonths,
    warranty_terms: data.warrantyTerms,
    price_list_url: data.priceListUrl,
    trade_terms: data.tradeTerms,
    lead_time_days: data.leadTimeDays,
    moq: data.moq,
    rma_terms: data.rmaTerms,
    applicant_note: data.note,
    status: "submitted",
    tier: "partner",
    listed: false,
    verified: false,
    availability: "available",
    jobs_per_month_cap: data.monthlyCapacity,
    availability_confirmed_at: null,
    // The record of what they agreed to, and when. Four explicit ticks.
    agreements: {
      verification: data.agreeVerification,
      commission: data.agreeCommission,
      nonCircumvention: data.agreeNonCircumvention,
      data: data.agreeData,
      acceptedAt: new Date().toISOString(),
      termsVersion: TERMS_VERSION,
    },
  };

  // `ref` is unique-constrained, so a collision is a conflict we can just retry.
  let created: PartnerRow | null = null;
  for (let attempt = 0; attempt < 3 && !created; attempt++) {
    created = await createPartner({ ...row, ref: partnerRef() });
  }

  if (!created) {
    // Be honest in the logs: the application reached us by email but has no row,
    // so the reviewer has to key it in.
    console.error("[partner-apply] could not store the application; the team email is the only record", {
      email: data.email,
      ip: clientIp(req),
    });
  } else {
    await logPartnerEvent(created.id, "system", "application_received", `Applied as ${data.kind}`);
  }

  const ref = created?.ref ?? "NOT-STORED";
  const [applicant, team] = await Promise.all([
    sendApplicationReceived(data, ref),
    notifyTeamOfApplication(data, ref, created?.id ?? null),
  ]);

  return NextResponse.json({
    ok: true,
    ref: created?.ref ?? null,
    emailed: applicant && team,
    stored: Boolean(created),
  });
}