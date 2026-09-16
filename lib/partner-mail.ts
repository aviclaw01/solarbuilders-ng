/**
 * SolarBuilders.ng — partner pipeline email (server-only).
 *
 * One place for every message the pipeline sends, because these emails carry
 * commitments: what we will check, what we owe each other, what is due. Copy
 * written inline at several call sites drifts within a week.
 *
 * Only the two emails the application route sends live here today. The approval,
 * info-request, job-offer and commission emails were drafted against a partner
 * portal that is not built yet; they come back with the portal.
 *
 * Everything here is deliberately plain: no tracking pixels, no marketing footer,
 * no "click here to confirm your slot". If RESEND_API_KEY is missing, `send()`
 * returns false and the caller tells the human the truth rather than pretending
 * the email went out.
 */

import "server-only";
import { Resend } from "resend";
import { FROM_EMAIL, LEAD_EMAILS, SITE_URL } from "./site";
import { kindLabel, serviceLabels, type PartnerApplication } from "./partners";

/** Escape anything interpolated into HTML (text and double- or single-quoted attributes). */
export function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
       email you and list exactly what is missing.</p>
       <p><b>What we never do.</b> We do not charge a listing fee or a verification fee, and we do not sell
       a badge. If anyone asks you for money in our name, it is not us — tell us.</p>
       <p>Questions about your application? Reply to this email and quote your reference.</p>`,
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
