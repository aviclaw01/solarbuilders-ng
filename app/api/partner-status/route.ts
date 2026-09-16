import { NextResponse } from "next/server";
import {
  PARTNER_STATUSES,
  PARTNER_STATUS_META,
  verificationScopeLabel,
  type PartnerStatus,
} from "@/lib/partners";
import { partnerByRefAndEmail } from "@/lib/partner-db";
import {
  applicationsClosedResponse,
  clientIp,
  createRateLimiter,
  partnerApplicationsOpen,
  readJsonBody,
} from "@/lib/partner-http";

/**
 * POST /api/partner-status — an applicant checking their own application.
 *
 * Disabled (503) unless PARTNER_APPLICATIONS_OPEN=1.
 *
 * Two rules make this safe to expose without accounts:
 *   1. Reference AND email, both required. A wrong reference and a wrong email
 *      get the same 404 message, so nobody can use this to learn who has applied.
 *   2. Only applicant-facing fields come back. Review notes, references, CAC
 *      details, contact details and bank details never leave the server.
 */

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 2 * 1024;
const isRateLimited = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 10 });
const noStore = { "Cache-Control": "no-store" };

function metaFor(status: string) {
  const known = (PARTNER_STATUSES as readonly string[]).includes(status);
  return PARTNER_STATUS_META[known ? (status as PartnerStatus) : "submitted"];
}

export async function POST(req: Request) {
  if (!partnerApplicationsOpen()) return applicationsClosedResponse("partner-status");

  if (isRateLimited(clientIp(req))) {
    return NextResponse.json(
      { ok: false, error: "Too many checks from this connection. Please wait a few minutes." },
      { status: 429, headers: noStore },
    );
  }

  const parsed = await readJsonBody(req, MAX_BODY_BYTES);
  if (!parsed.ok) return parsed.response;

  const { ref, email } = (parsed.body ?? {}) as { ref?: unknown; email?: unknown };
  if (typeof ref !== "string" || typeof email !== "string" || !ref.trim() || !email.trim()) {
    return NextResponse.json(
      { ok: false, error: "Enter both your reference and the email address you applied with." },
      { status: 400, headers: noStore },
    );
  }

  const partner = await partnerByRefAndEmail(ref, email);
  if (!partner) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "We could not find an application with that reference and email address. Check the reference in your confirmation email, or message us.",
      },
      { status: 404, headers: noStore },
    );
  }

  const meta = metaFor(partner.status);

  return NextResponse.json(
    {
      ok: true,
      data: {
        businessName: partner.business_name,
        ref: partner.ref,
        kind: partner.kind,
        status: partner.status,
        statusLabel: meta.label,
        applicantLine: partner.status_note || meta.applicantLine,
        nextStep: meta.nextStep,
        submittedAt: partner.created_at,
        verifiedAt: partner.verified ? partner.verified_at : null,
        verifiedUntil: partner.verified ? partner.verified_until : null,
        scope: partner.verified ? verificationScopeLabel(partner) : null,
        rejectedReason: partner.status === "rejected" ? partner.rejected_reason : null,
        suspendedReason: partner.status === "suspended" ? partner.suspended_reason : null,
        infoRequested:
          partner.status === "info_requested" ? (partner.info_requested ?? []).map((item) => item.label) : [],
      },
    },
    { headers: noStore },
  );
}
