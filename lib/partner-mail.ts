/**
 * SolarBuilders.ng — partner pipeline email (server-only).
 *
 * One place for every message the pipeline sends, because these emails carry
 * commitments: what we will check, what we owe each other, what is due. Copy
 * written inline at four different call sites drifts within a week.
 *
 * Everything here is deliberately plain: no tracking pixels, no marketing footer,
 * no "click here to confirm your slot". If RESEND_API_KEY is missing, `send()`
 * returns false and the caller tells the human the truth rather than pretending
 * the email went out.
 */

import { Resend } from "resend";
import { FROM_EMAIL, LEAD_EMAILS, SITE_URL } from "./site";
import {
  kindLabel,
  serviceLabels,
  type PartnerApplication,
  type PartnerInfoRequest,
  type PartnerJobRow,
  type PartnerRow,
} from "./partners";

/** Escape anything interpolated into HTML. */
export function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Naira, grouped. Local, to keep this module free of the pricing tables. */
function naira(n: number | null | undefined): string {
  return `₦${Number(n ?? 0).toLocaleString("en-NG")}`;
}

function shell(heading: string, bodyHtml: string, signature = "— SolarBuilders.ng"): string {
  return `
  <div style="font:15px/1.6 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;max-width:620px">
    <h2 style="font-size:19px;margin:0 0 14px">${esc(heading)}</h2>
    ${bodyHtml}
    <p style="color:#64748b;font-size:13px;margin-top:22px">${esc(signature)}<br>
      11 Mogbonjubola St, Gbagada, Lagos · <a href="${SITE_URL}" style="color:#64748b">solarbuildersng.com</a></p>
  </div>`;
}

/** Send one plain HTML email. Never throws; returns whether it was accepted. */
export async function send(
  to: string | string[],
  subject: string,
  html: string,
  replyTo?: string,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[partner-mail] RESEND_API_KEY not set — nothing sent:", subject);
    return false;
  }
  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({ from: FROM_EMAIL, to, subject, html, replyTo: replyTo || undefined });
    return true;
  } catch (err) {
    console.error("[partner-mail] Resend failed:", err);
    return false;
  }
}

/** "what we still need from you", as a list */
function infoList(items: PartnerInfoRequest[]): string {
  return `<ul style="padding-left:18px">${items
    .map((i) => `<li style="margin-bottom:6px"><b>${esc(i.label)}</b> — ${esc(i.reason)}</li>`)
    .join("")}</ul>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. APPLICATION RECEIVED (applicant) — sets expectations, states the reference
// ─────────────────────────────────────────────────────────────────────────────

export async function sendApplicationReceived(app: PartnerApplication, ref: string): Promise<boolean> {
  const checklist = [
    app.cacNumber ? `CAC number: ${esc(app.cacNumber)}` : null,
    app.installs.length ? `install photos: ${app.installs.filter((i) => i.photoUrl).length}` : null,
    app.refs.length ? `references: ${app.refs.length}` : null,
    app.warrantyMonths ? `workmanship warranty: ${app.warrantyMonths} months` : null,
    app.priceListUrl ? "price list: received" : null,
    app.rmaTerms ? "RMA terms: received" : null,
  ].filter(Boolean) as string[];

  return send(
    app.email,
    `[SolarBuilders] Application received — ${ref}`,
    shell(
      "We have your application",
      `<p>Thanks ${esc(app.contactName)}. Your reference is <b>${esc(ref)}</b> — keep it; you need it to check your status.</p>
       <p>Here is what we received for <b>${esc(app.businessName)}</b> (${esc(kindLabel(app.kind))}, ${esc(app.city)}, ${esc(app.state)}):</p>
       <ul style="padding-left:18px">${checklist.map((c) => `<li>${c}</li>`).join("")}</ul>
       <p><b>What happens next.</b> A reviewer opens your file within two working days. We check the CAC
       number, look at the install photos, and call the references you gave. If we need anything else we
       email you a link to your partner page and list exactly what is missing.</p>
       <p><b>What we never do.</b> We do not charge a listing fee or a verification fee, and we do not sell
       a badge. If anyone asks you for money in our name, it is not us — tell us.</p>
       <p>Check your status any time at <a href="${SITE_URL}/partners/status">${SITE_URL}/partners/status</a>
       with your reference and this email address.</p>`,
    ),
    app.email,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. TEAM NOTIFICATION — an application has to reach a human
// ─────────────────────────────────────────────────────────────────────────────

export async function notifyTeamOfApplication(
  app: PartnerApplication,
  ref: string,
  id: number | null,
): Promise<boolean> {
  const adminUrl = id ? `${SITE_URL}/admin/partners/${id}` : `${SITE_URL}/admin/partners`;
  return send(
    LEAD_EMAILS,
    `[SolarBuilders] New partner application — ${app.businessName} (${ref})`,
    shell(
      "New partner application",
      `<p><b>${esc(app.businessName)}</b> — ${esc(kindLabel(app.kind))}<br>
          ${esc(app.contactName)} · ${esc(app.email)} · ${esc(app.whatsapp)}<br>
          ${esc(app.city)}, ${esc(app.state)} · ${esc(String(app.yearsInBusiness))} years</p>
       <p><b>Services:</b> ${esc(serviceLabels(app.services).join(", "))}<br>
          <b>Sizes:</b> ${esc(app.systemSizes.join(", "))}<br>
          <b>Covers:</b> ${esc(app.coverageStates.join(", "))}</p>
       <p><b>CAC:</b> ${esc(app.cacNumber)} ${app.cacDocUrl ? `(<a href="${esc(app.cacDocUrl)}">document</a>)` : "(no document link)"}<br>
          <b>Installs submitted:</b> ${app.installs.length} (${app.installs.filter((i) => i.photoUrl).length} with photos)<br>
          <b>References:</b> ${app.refs.length}<br>
          <b>Warranty:</b> ${app.warrantyMonths ? `${app.warrantyMonths} months` : "—"}</p>
       ${app.priceListUrl ? `<p><b>Price list:</b> <a href="${esc(app.priceListUrl)}">${esc(app.priceListUrl)}</a></p>` : ""}
       ${app.note ? `<p><b>Their note:</b><br>${esc(app.note)}</p>` : ""}
       <p>Review and decide: <a href="${adminUrl}">${esc(adminUrl)}</a></p>
       <p style="color:#64748b">Nothing is published until a human approves this on the dashboard.</p>`,
      "— SolarBuilders partner pipeline",
    ),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. APPROVED — the automation handover (L18: this is where "automatic" starts)
// ────────────────────────────────────────────────────────────────────────────

export async function sendApproved(
  partner: PartnerRow,
  portalUrl: string,
  profileUrl: string,
): Promise<boolean> {
  return send(
    partner.email,
    `[SolarBuilders] ${partner.business_name} is approved — verified partner`,
    shell(
      "You are approved",
      `<p>${esc(partner.contact_name)}, ${esc(partner.business_name)} is now a verified partner. Your public
       profile is live: <a href="${profileUrl}">${esc(profileUrl)}</a></p>
       <p>Your badge says exactly what we checked: <b>${esc(partner.verification_scope ?? "")}</b> on
       ${esc(new Date(partner.verified_at ?? Date.now()).toDateString())}. We re-check every 12 months.</p>
       <p><b>Your partner page.</b> This private link is yours — it is how you get work, accept or decline
       jobs, and settle commission. Do not forward it; ask us for a new one if it leaks.</p>
       <p><a href="${portalUrl}" style="display:inline-block;background:#f59e0b;color:#0f172a;font-weight:700;padding:12px 22px;border-radius:999px;text-decoration:none">Open your partner page</a></p>
       <p><b>How the money works.</b> We do not take the customer's payment. You invoice the customer and keep
       it; we invoice you a commission of ${esc(String(partner.commission_rate))}% on each job we route to you,
       with an invoice reference and our bank details. Transfer it, then upload the receipt on your partner
       page. Once we confirm it landed you can take the next job — and not before.</p>
       <p><b>Keep your availability current.</b> Jobs go to whoever confirms they are free. If you have not
       confirmed in 14 days, you stop being offered work until you do.</p>`,
      "— SolarBuilders.ng partner desk",
    ),
    LEAD_EMAILS[0],
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 4. INFO REQUESTED — the "we need one more thing" loop
// ─────────────────────────────────────────────────────────────────────────────

export async function sendInfoRequested(
  partner: PartnerRow,
  items: PartnerInfoRequest[],
  portalUrl: string,
  note?: string | null,
): Promise<boolean> {
  return send(
    partner.email,
    `[SolarBuilders] Two more things before we can finish your verification`,
    shell(
      "We need a little more",
      `<p>${esc(partner.contact_name)}, we are most of the way through ${esc(partner.business_name)}. To finish, we need:</p>
       ${infoList(items)}
       ${note ? `<p><b>Note from the reviewer:</b><br>${esc(note)}</p>` : ""}
       <p><a href="${portalUrl}" style="display:inline-block;background:#f59e0b;color:#0f172a;font-weight:700;padding:12px 22px;border-radius:999px;text-decoration:none">Send what is missing</a></p>
       <p>Nothing else is required from you, and there is nothing to pay.</p>`,
      "— SolarBuilders.ng partner desk",
    ),
    LEAD_EMAILS[0],
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. JOB OFFER — what a routed job looks like from the partner's side
// ─────────────────────────────────────────────────────────────────────────────

export async function sendJobOffer(
  partner: PartnerRow,
  job: PartnerJobRow,
  portalUrl: string,
): Promise<boolean> {
  const hours = Math.max(1, Math.round((new Date(job.offer_expires_at).getTime() - Date.now()) / 3_600_000));
  return send(
    partner.email,
    `[SolarBuilders] Job offer ${job.reference} — ${job.location ?? "details in your partner page"}`,
    shell(
      `Job offered: ${job.reference}`,
      `<p>${esc(partner.contact_name)}, a customer job came in that fits ${esc(partner.business_name)}.</p>
       <table cellpadding="6" style="border-collapse:collapse;background:#f6f6f6">
         <tr><td><b>Job</b></td><td>${esc(job.title)}</td></tr>
         <tr><td><b>Location</b></td><td>${esc(job.location ?? "—")}</td></tr>
         ${job.budget_best ? `<tr><td><b>Customer's budget</b></td><td>${esc(naira(job.budget_best))}</td></tr>` : ""}
         ${job.install_fee ? `<tr><td><b>Offered for the work</b></td><td>${esc(naira(job.install_fee))}</td></tr>` : ""}
         <tr><td><b>Our commission</b></td><td>${esc(naira(job.commission_amount))}${
           job.commission_rate ? ` (${esc(String(job.commission_rate))}%)` : ""
         }</td></tr>
       </table>
       ${job.detail ? `<p><b>What the customer asked for:</b><br>${esc(job.detail)}</p>` : ""}
       <p><a href="${portalUrl}" style="display:inline-block;background:#f59e0b;color:#0f172a;font-weight:700;padding:12px 22px;border-radius:999px;text-decoration:none">Accept or decline</a></p>
       <p>This offer stands for about ${hours} hour${hours === 1 ? "" : "s"}. After that it is released to the
       next partner, so answer either way — a quick decline costs you nothing and keeps you in the rotation.</p>`,
      "— SolarBuilders.ng partner desk",
    ),
    LEAD_EMAILS[0],
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. THE TWO ENDS OF THE COMMISSION LOOP
// ─────────────────────────────────────────────────────────────────────────────

export async function sendReceiptReceived(
  partner: PartnerRow,
  invoiceReference: string,
  amountPaid: number,
): Promise<boolean> {
  return send(
    partner.email,
    `[SolarBuilders] Receipt received — ${invoiceReference}`,
    shell(
      "Receipt received",
      `<p>${esc(partner.contact_name)}, we have your receipt for <b>${esc(invoiceReference)}</b>
       (${esc(naira(amountPaid))}).</p>
       <p><b>What happens now:</b> a person matches that transfer against our account statement. We do not
       treat a receipt as proof on its own — a screenshot is easy, a bank statement is not. Once it matches
       you get a confirmation, and you are offered the next job.</p>
       <p>If the reference or the amount is wrong we will email you, not silently reject it.</p>`,
      "— SolarBuilders.ng partner desk",
    ),
    LEAD_EMAILS[0],
  );
}

export async function sendCommissionConfirmed(partner: PartnerRow, job: PartnerJobRow): Promise<boolean> {
  return send(
    partner.email,
    `[SolarBuilders] Commission confirmed — you are clear for the next job`,
    shell(
      "Confirmed — you are clear again",
      `<p>${esc(partner.contact_name)}, the commission for <b>${esc(job.reference)}</b>
       (${esc(naira(job.commission_amount))}) is confirmed as received. Thank you.</p>
       <p>You are eligible for new work again. We route by coverage, availability and capacity, so keep your
       availability current on your partner page and the jobs will keep coming.</p>`,
      "— SolarBuilders.ng partner desk",
    ),
    LEAD_EMAILS[0],
  );
}