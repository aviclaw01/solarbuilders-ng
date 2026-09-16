import { NextResponse } from "next/server";
import { partnerRef, validateApplication, type PartnerApplication, type PartnerRow } from "@/lib/partners";
import { createPartner, dbGetChecked, logPartnerEvent, supabaseEnv } from "@/lib/partner-db";
import { notifyTeamOfApplication, sendApplicationReceived } from "@/lib/partner-mail";
import {
  applicationsClosedResponse,
  clientIp,
  createRateLimiter,
  partnerApplicationsOpen,
  readJsonBody,
} from "@/lib/partner-http";

/**
 * POST /api/partner-apply — the front door of the verified-partner pipeline.
 *
 * Disabled (503) unless PARTNER_APPLICATIONS_OPEN=1.
 *
 * The browser is never trusted: everything is re-validated by
 * `validateApplication`, which also normalises and caps every field. Status,
 * tier, listing and verification flags are set here, never sent by the client.
 *
 * Response contract:
 *   200 { ok: true, ref, emailed, stored, duplicate? }
 *       `ref` is null for a duplicate: we never reveal another application's
 *       reference to whoever typed that email address.
 *   400 { ok: false, error, fields? }
 *   413 / 415 body too large / not JSON
 *   429 { ok: false, error }
 *   503 { ok: false, error }   disabled, or nothing could be stored or sent
 */

export const dynamic = "force-dynamic";

/** Terms version recorded against the four ticks. Bump when the wording changes. */
const TERMS_VERSION = "2026-09-16";

/** Generous for the largest valid application (6 installs, 5 refs, 800-char terms). */
const MAX_BODY_BYTES = 64 * 1024;

// Counts every attempt, including ones that fail validation, so leave room for
// an honest applicant fixing a few highlighted fields.
const isRateLimited = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 10 });

/** A repeat application is only "open" while it has not been closed out. */
const OPEN_STATUSES = "in.(submitted,under_review,info_requested,approved)";

const noStore = { "Cache-Control": "no-store" };

export async function POST(req: Request) {
  if (!partnerApplicationsOpen()) return applicationsClosedResponse("partner-apply");

  if (isRateLimited(clientIp(req))) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Too many applications from this connection in the last hour. Please try again later, or message us on WhatsApp.",
      },
      { status: 429, headers: noStore },
    );
  }

  const parsed = await readJsonBody(req, MAX_BODY_BYTES);
  if (!parsed.ok) return parsed.response;
  const payload = (parsed.body ?? {}) as Record<string, unknown>;

  // Honeypot: a field no human sees. Answer like a success so the script that
  // filled it learns nothing, but store nothing and send nothing.
  if (typeof payload.hp === "string" && payload.hp.trim() !== "") {
    console.warn("[partner-apply] honeypot tripped");
    return NextResponse.json({ ok: true, ref: null, emailed: false, stored: false }, { headers: noStore });
  }

  const validated = validateApplication(payload);
  if (!validated.ok) {
    return NextResponse.json(
      { ok: false, error: validated.error, fields: validated.fields },
      { status: 400, headers: noStore },
    );
  }
  const data = validated.data;

  // A second application from the same address while one is still open is the
  // same application. Do not create a second row, and do NOT echo the existing
  // reference: ref + email is the status-lookup credential, and whoever is
  // submitting may not own this address.
  const open = await dbGetChecked<Pick<PartnerRow, "id">>("partners", {
    select: "id",
    email: `eq.${data.email}`,
    status: OPEN_STATUSES,
    limit: "1",
  });
  if (open.ok && open.data[0]) {
    return NextResponse.json(
      { ok: true, ref: null, emailed: false, stored: true, duplicate: true },
      { headers: noStore },
    );
  }

  return handleNewApplication(data);
}

/** Store, email and answer. Split out so the POST handler reads top-down. */
async function handleNewApplication(data: PartnerApplication) {
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
  if (supabaseEnv()) {
    for (let attempt = 0; attempt < 3 && !created; attempt++) {
      created = await createPartner({ ...row, ref: partnerRef() });
    }
  }

  if (created) {
    await logPartnerEvent(created.id, "system", "application_received", `Applied as ${data.kind}`);
  } else {
    // No PII in the log line: the team email (if it sends) carries the details.
    console.error("[partner-apply] could not store the application (see [partner-db] errors above)");
  }

  const ref = created?.ref ?? null;
  const team = await notifyTeamOfApplication(data, ref ?? "NOT STORED", created?.id ?? null);
  // Only promise the applicant a reference we can actually look up.
  const applicant = ref ? await sendApplicationReceived(data, ref) : false;

  if (!created && !team) {
    // Nothing reached us at all. Say so, rather than thank them for nothing.
    return NextResponse.json(
      {
        ok: false,
        error: "We could not receive your application right now. Please message us on WhatsApp instead.",
      },
      { status: 503, headers: noStore },
    );
  }

  return NextResponse.json(
    { ok: true, ref, emailed: applicant && team, stored: Boolean(created) },
    { headers: noStore },
  );
}
