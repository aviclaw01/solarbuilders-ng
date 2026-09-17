import { NextResponse } from "next/server";
import {
  PARTNER_STATUSES,
  PARTNER_STATUS_META,
  verificationScopeLabel,
  type PartnerRow,
  type PartnerStatus,
} from "@/lib/partners";
import { partnerByRefAndEmail } from "@/lib/partner-db";

/**
 * POST /api/partner-status — an applicant checking their own application.
 *
 * Two rules make this safe to expose without accounts:
 *   1. Reference AND email, both required. On a mismatch we return one message
 *      for both cases, so nobody can use this to learn who has applied (L17).
 *   2. Only the applicant-facing fields come back. Notes written for us, the
 *      references, the CAC document and the bank details stay out of it (L14).
 */

export const dynamic = "force-dynamic";

const RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 10 };
const recentHits = new Map<string, number[]>();

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return (forwarded?.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim().slice(0, 60);
}

/** Per-instance, like the apply route's limiter — see the note there. */
function isRateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (recentHits.get(key) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  hits.push(now);
  recentHits.set(key, hits);
  return hits.length > RATE_LIMIT.max;
}

function metaFor(status: string) {
  const known = (PARTNER_STATUSES as readonly string[]).includes(status);
  return PARTNER_STATUS_META[known ? (status as PartnerStatus) : "submitted"];
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (isRateLimited(clientIp(req))) {
    return NextResponse.json(
      { ok: false, error: "Too many checks from this connection. Please wait a few minutes." },
      { status: 429 },
    );
  }

  const { ref, email } = (body ?? {}) as { ref?: unknown; email?: unknown };
  if (typeof ref !== "string" || typeof email !== "string" || !ref.trim() || !email.trim()) {
    return NextResponse.json(
      { ok: false, error: "Enter both your reference and the email address you applied with." },
      { status: 400 },
    );
  }

  const partner: PartnerRow | null = await partnerByRefAndEmail(ref, email);
  if (!partner) {
    // One message for both a wrong reference and a wrong email (L17).
    return NextResponse.json(
      {
        ok: false,
        error:
          "We could not find an application with that reference and email address. Check the reference in your confirmation email, or message us.",
      },
      { status: 404 },
    );
  }

  const meta = metaFor(partner.status);

  return NextResponse.json({
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
      verifiedAt: partner.verified_at,
      verifiedUntil: partner.verified_until,
      scope: partner.verified ? verificationScopeLabel(partner) : null,
      rejectedReason: partner.rejected_reason,
      suspendedReason: partner.suspended_reason,
      infoRequested: (partner.info_requested ?? []).map((item) => item.label),
      portalIssued: Boolean(partner.portal_token_issued_at),
    },
  });
}