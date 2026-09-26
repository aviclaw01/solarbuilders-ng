import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Mail,
  Phone,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  MIN_COMMISSION_RATE,
  MAX_COMMISSION_RATE,
  PARTNER_STATUS_META,
  VERIFICATION_CHECKS,
  verificationScopeLabel,
  type PartnerInfoRequest,
  type PartnerStatus,
} from "@/lib/partners";
import {
  getPartner,
  jobStatsForPartner,
  listJobsForPartner,
  listPartnerEvents,
  listPaymentsForPartner,
} from "@/lib/partner-db";
import { portalAuthConfigured } from "@/lib/partner-auth";
import { formatNaira } from "@/lib/quote";
import {
  approvePartner,
  confirmPayment,
  markUnderReview,
  redactReferences,
  rejectPartner,
  rejectPayment,
  reissuePortalToken,
  requestInfo,
  saveInternalNotes,
  setListed,
  suspendPartner,
} from "../actions";

/**
 * One application, in full — every piece of evidence, the four checks, and every
 * decision anyone can make about it.
 *
 * This page is where the promise on /verified is actually kept or broken, so it
 * is built to show evidence rather than summaries: the CAC number, the three
 * installs with their photo links, the referees, the warranty terms. The
 * reviewer should never have to take a field on trust.
 *
 * No client JS. Everything is a plain form posting to a server action in
 * ../actions.ts, which is also where the audit trail is written.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Partner application — SolarBuilders admin",
  robots: { index: false, follow: false },
};

const LAGOS = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Lagos",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function fmt(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : LAGOS.format(d);
}

function fmtDay(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "short", year: "numeric" }).format(d);
}

const INPUT =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400";
const LABEL = "block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5";

export default async function AdminPartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const row = await getPartner(id);
  if (!row) notFound();

  const [stats, events, payments, jobs] = await Promise.all([
    jobStatsForPartner(id),
    listPartnerEvents(id),
    listPaymentsForPartner(id),
    listJobsForPartner(id),
  ]);

  const status = (Object.keys(PARTNER_STATUS_META).includes(row.status) ? row.status : "submitted") as PartnerStatus;
  const meta = PARTNER_STATUS_META[status];
  const pendingPayments = payments.filter((p) => p.status === "submitted");
  const portalReady = portalAuthConfigured();
  const infoItems: PartnerInfoRequest[] = row.info_requested ?? [];
  const scopePreview = verificationScopeLabel(row);

  return (
    <>
        <Link
          href="/admin/partners"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> All partners
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
          <div>
            <h1 className="font-heading text-2xl font-extrabold text-slate-900">{row.business_name}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {row.contact_name} · {row.ref} · applied {fmt(row.created_at)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-medium border rounded-full px-2.5 py-1 ${meta.chip}`}>{meta.label}</span>
            {row.verified && (
              <span className="text-xs font-medium border rounded-full px-2.5 py-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                verified to {fmtDay(row.verified_until)}
              </span>
            )}
            {row.slug && (
              <Link
                href={`/partners/${row.slug}`}
                className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
              >
                /partners/{row.slug} <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>

        {!portalReady && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-900">
              <b>Approval is blocked.</b> PARTNER_TOKEN_SECRET is not set, so we cannot issue a portal link — and a
              partner with no way in is worse than a partner still waiting. Set it on the deployment first.
            </p>
          </div>
        )}

        {row.status === "info_requested" && infoItems.length > 0 && (
          <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
            <p className="text-sm font-semibold text-indigo-900 mb-2">Waiting on the applicant for:</p>
            <ul className="space-y-1">
              {infoItems.map((i) => (
                <li key={i.key} className="text-sm text-indigo-800">
                  <b>{i.label}</b> — {i.reason}
                </li>
              ))}
            </ul>
            <p className="text-xs text-indigo-700 mt-2">
              Requested {fmt(row.info_requested_at)}
              {row.info_responded_at ? ` · answered ${fmt(row.info_responded_at)}` : " · not answered yet"}
            </p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_20rem] items-start">
          {/* ── LEFT: the evidence ─────────────────────────────────────── */}
          <div className="space-y-6">
            <Card title="The business">
              <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <Field label="Kind" value={row.kind} />
                <Field label="Years in business" value={row.years_in_business === null ? "—" : `${row.years_in_business}`} />
                <Field label="Based in" value={`${row.city}, ${row.state}`} />
                <Field
                  label="Coverage"
                  value={
                    row.coverage_states && row.coverage_states.length
                      ? row.coverage_states.join(", ")
                      : "—"
                  }
                />
                <Field label="Cities covered" value={(row.coverage_cities ?? []).join(", ") || "—"} />
                <Field label="Services" value={(row.services ?? []).join(", ") || "—"} />
                <Field label="System sizes" value={(row.system_sizes ?? []).join(", ") || "—"} />
                <Field label="Brands" value={row.brands_carried || "—"} />
                <Field
                  label="Capacity"
                  value={
                    row.monthly_capacity === null
                      ? "—"
                      : `${row.monthly_capacity} jobs/month`
                  }
                />
                <Field label="Max travel" value={row.max_travel_km === null ? "—" : `${row.max_travel_km} km`} />
              </dl>
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-100">
                <a href={`mailto:${row.email}`} className="text-sm text-slate-700 hover:text-slate-900 inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {row.email}
                </a>
                <a
                  href={`https://wa.me/${row.whatsapp.replace(/[^0-9]/g, "").replace(/^0/, "234")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-700 hover:text-slate-900 inline-flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" /> {row.whatsapp}
                </a>
                {row.website && (
                  <a href={row.website} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-700 hover:text-slate-900 inline-flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" /> website
                  </a>
                )}
                {row.instagram && <span className="text-sm text-slate-500">{row.instagram}</span>}
              </div>
              {row.applicant_note && (
                <div className="mt-4 rounded-lg bg-amber-50 border border-amber-100 p-3">
                  <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                    Note from the applicant
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{row.applicant_note}</p>
                </div>
              )}
            </Card>

            <Card title="Check 1 — CAC registration">
              <p className="text-sm text-slate-700">
                <span className="font-semibold">Number given:</span> {row.cac_number || "—"}
              </p>
              {row.cac_doc_url ? (
                <a
                  href={row.cac_doc_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-slate-900 font-semibold underline underline-offset-4 mt-2"
                >
                  <FileText className="w-3.5 h-3.5" /> Open the certificate they sent
                </a>
              ) : (
                <p className="text-sm text-amber-700 mt-2">
                  No document supplied — check the number against the registry yourself.
                </p>
              )}
            </Card>

            <Card title="Check 2 — past installations">
              {!row.installs || row.installs.length === 0 ? (
                <p className="text-sm text-amber-700">No installations supplied.</p>
              ) : (
                <ul className="space-y-3">
                  {row.installs.map((inst, i) => (
                    <li key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <div className="text-sm font-semibold text-slate-900">
                        {inst.site || `Installation ${i + 1}`}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {[inst.city, inst.size, inst.year].filter(Boolean).join(" · ") || "no details given"}
                      </div>
                      {inst.photoUrl ? (
                        <a
                          href={inst.photoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-slate-900 font-semibold underline underline-offset-4 mt-2"
                        >
                          <ImageIcon className="w-3.5 h-3.5" /> Open photo
                        </a>
                      ) : (
                        <span className="text-xs text-rose-600 mt-2 inline-block">no photo link — chase this</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-slate-400 mt-3">
                Tick &ldquo;{VERIFICATION_CHECKS[1].label}&rdquo; only after opening every link above.
              </p>
            </Card>

            <Card title="Check 3 — references">
              {row.references_redacted_at && (
                <p className="text-sm text-slate-500 mb-3">
                  Numbers redacted {fmt(row.references_redacted_at)}. The names below are the record that the calls
                  happened.
                </p>
              )}
              {!row.refs || row.refs.length === 0 ? (
                <p className="text-sm text-amber-700">No references supplied.</p>
              ) : (
                <ul className="space-y-2">
                  {row.refs.map((r, i) => (
                    <li key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
                      <div className="font-semibold text-slate-900">{r.name || `Reference ${i + 1}`}</div>
                      {r.phone ? (
                        <a
                          href={`tel:${r.phone}`}
                          className="text-slate-700 hover:text-slate-900 inline-flex items-center gap-1.5 mt-1"
                        >
                          <Phone className="w-3.5 h-3.5" /> {r.phone}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">number redacted</span>
                      )}
                      {r.project && <div className="text-slate-500 text-xs mt-1">{r.project}</div>}
                    </li>
                  ))}
                </ul>
              )}
              {!row.references_redacted_at && row.refs && row.refs.length > 0 && (
                <form action={redactReferences} className="mt-3">
                  <input type="hidden" name="id" value={row.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-slate-200 bg-white hover:border-slate-400 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors"
                  >
                    Calls done — redact the numbers
                  </button>
                </form>
              )}
            </Card>

            <Card title="Check 4 — workmanship warranty">
              <p className="text-sm text-slate-700">
                {row.warranty_months
                  ? `${row.warranty_months} months workmanship warranty claimed.`
                  : "No warranty length given."}
              </p>
              {row.warranty_terms && (
                <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap break-words">{row.warranty_terms}</p>
              )}
              {(row.kind === "vendor" || row.kind === "manufacturer" || row.kind === "both") && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Supply terms</div>
                  <Field label="Price list" value={row.price_list_url ?? "—"} link={row.price_list_url ?? undefined} />
                  <Field label="Trade terms" value={row.trade_terms ?? "—"} />
                  <Field label="Lead time" value={row.lead_time_days === null ? "—" : `${row.lead_time_days} days`} />
                  <Field label="MOQ" value={row.moq === null ? "—" : `${row.moq}`} />
                  <Field label="RMA / failed units" value={row.rma_terms ?? "—"} />
                </div>
              )}
            </Card>

            <Card title="What they agreed to">
              {row.agreements ? (
                <dl className="text-sm space-y-1">
                  {Object.entries(row.agreements).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-b border-slate-100 pb-1">
                      <dt className="text-slate-500">{k}</dt>
                      <dd className="text-slate-900 text-right break-words max-w-[60%]">
                        {v === true ? "accepted" : v === false ? "not accepted" : String(v)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-slate-500">No agreements recorded on this row.</p>
              )}
            </Card>

            <Card title={`Jobs routed (${jobs.length})`}>
              <p className="text-sm text-slate-600 mb-3">
                {stats.completedJobs} completed · {stats.openJobs} open
                {stats.hasDueCommission && (
                  <span className="text-rose-600 font-semibold">
                    {" "}
                    · commission due
                    {stats.commissionOverdueDays !== null && stats.commissionOverdueDays > 0
                      ? `, ${Math.floor(stats.commissionOverdueDays)} days overdue`
                      : ""}
                  </span>
                )}
              </p>
              {jobs.length === 0 ? (
                <p className="text-sm text-slate-500">No jobs routed to this partner yet.</p>
              ) : (
                <ul className="space-y-2">
                  {jobs.map((j) => (
                    <li key={j.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900">{j.reference}</span>
                        <span className="text-xs text-slate-500">
                          {j.status} · commission {j.commission_status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {j.title} · {j.location ?? "no location"}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {j.commission_amount === null
                          ? "no commission set"
                          : `${formatNaira(j.commission_amount)} at ${j.commission_rate}%`}
                        {j.commission_due_at ? ` · due ${fmtDay(j.commission_due_at)}` : ""}
                        {j.routed_by ? ` · routed by ${j.routed_by}` : ""}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title={`Commission payments (${payments.length})`}>
              {payments.length === 0 ? (
                <p className="text-sm text-slate-500">No payments recorded.</p>
              ) : (
                <ul className="space-y-3">
                  {payments.map((p) => (
                    <li key={p.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900 text-sm">{p.invoice_ref}</span>
                        <span
                          className={`text-xs font-medium border rounded-full px-2 py-0.5 ${
                            p.status === "confirmed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : p.status === "rejected"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        expected {formatNaira(p.amount_expected)}
                        {p.amount_paid === null ? "" : ` · claims ${formatNaira(p.amount_paid)}`}
                        {p.method ? ` · ${p.method}` : ""}
                        {p.paid_on ? ` · paid ${p.paid_on}` : ""}
                      </div>
                      {p.bank_ref && <div className="text-xs text-slate-500 mt-0.5">bank ref {p.bank_ref}</div>}
                      {p.receipt_url && (
                        <a
                          href={p.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-slate-900 font-semibold underline underline-offset-4 mt-1 inline-block"
                        >
                          Open the receipt they uploaded
                        </a>
                      )}
                      {p.note && <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap break-words">{p.note}</p>}
                      {p.reject_reason && <p className="text-xs text-rose-700 mt-1">Rejected: {p.reject_reason}</p>}
                      {p.confirmed_at && (
                        <p className="text-xs text-emerald-700 mt-1">
                          Confirmed {fmt(p.confirmed_at)} by {p.confirmed_by ?? "—"}
                        </p>
                      )}

                      {p.status === "submitted" && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">
                            A receipt is a claim. Match this against our own account statement before confirming —
                            confirming is what lifts the partner&apos;s routing block.
                          </p>
                          <form action={confirmPayment} className="space-y-2">
                            <input type="hidden" name="payment_id" value={p.id} />
                            <input type="hidden" name="id" value={row.id} />
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className={LABEL} htmlFor={`amount_paid_${p.id}`}>
                                  Amount seen (₦)
                                </label>
                                <input
                                  id={`amount_paid_${p.id}`}
                                  name="amount_paid"
                                  type="number"
                                  inputMode="numeric"
                                  defaultValue={p.amount_paid ?? p.amount_expected}
                                  className={INPUT}
                                />
                              </div>
                              <div>
                                <label className={LABEL} htmlFor={`bank_ref_${p.id}`}>
                                  Bank ref matched
                                </label>
                                <input
                                  id={`bank_ref_${p.id}`}
                                  name="bank_ref"
                                  type="text"
                                  defaultValue={p.bank_ref ?? ""}
                                  placeholder="NIP reference"
                                  className={INPUT}
                                />
                              </div>
                            </div>
                            <button
                              type="submit"
                              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-sm font-semibold transition-colors inline-flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Confirmed in our statement — clear it
                            </button>
                          </form>
                          <form action={rejectPayment} className="space-y-2 mt-2">
                            <input type="hidden" name="payment_id" value={p.id} />
                            <input type="hidden" name="id" value={row.id} />
                            <input
                              name="reject_reason"
                              type="text"
                              required
                              placeholder="Why it does not match (e.g. no credit on our statement)"
                              className={INPUT}
                            />
                            <button
                              type="submit"
                              className="w-full rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 px-3 py-2 text-sm font-semibold transition-colors inline-flex items-center justify-center gap-1.5"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Not found — send it back
                            </button>
                          </form>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* ── RIGHT: the decisions ───────────────────────────────────── */}
          <div className="space-y-4">
            {row.status === "submitted" && (
              <form action={markUnderReview}>
                <input type="hidden" name="id" value={row.id} />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-slate-900 hover:bg-slate-700 text-white px-4 py-3 text-sm font-semibold transition-colors"
                >
                  Start review
                </button>
              </form>
            )}

            <Card title="Approve">
              <form action={approvePartner} className="space-y-4">
                <input type="hidden" name="id" value={row.id} />
                {row.slug ? (
                  <p className="text-xs text-slate-500">
                    Public URL stays <span className="font-mono text-slate-700">/partners/{row.slug}</span>
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">A public URL will be created from the business name.</p>
                )}

                <div>
                  <span className={LABEL}>What we actually checked</span>
                  <div className="space-y-2">
                    {VERIFICATION_CHECKS.map((c) => (
                      <label key={c.key} className="flex items-start gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          name={c.key}
                          defaultChecked={Boolean(row[c.key])}
                          className="accent-emerald-600 w-4 h-4 mt-0.5 flex-shrink-0"
                        />
                        <span className="text-slate-700">{c.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    The badge will read: <span className="text-slate-600">{scopePreview}</span>
                  </p>
                </div>

                <div>
                  <label className={LABEL} htmlFor="commission_rate">
                    Commission rate (%)
                  </label>
                  <input
                    id="commission_rate"
                    name="commission_rate"
                    type="number"
                    step="0.5"
                    min={MIN_COMMISSION_RATE}
                    max={MAX_COMMISSION_RATE}
                    defaultValue={Number(row.commission_rate) || 5}
                    className={INPUT}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    {MIN_COMMISSION_RATE}–{MAX_COMMISSION_RATE}%. Charged on the equipment order, never on their
                    labour. Stored on the row and copied onto every job.
                  </p>
                </div>

                <div>
                  <label className={LABEL} htmlFor="tier">
                    Tier
                  </label>
                  <select id="tier" name="tier" defaultValue={row.tier} className={INPUT}>
                    <option value="partner">partner — routed work</option>
                    <option value="tracked">tracked — we watch them, no routing yet</option>
                  </select>
                </div>

                <div>
                  <label className={LABEL} htmlFor="public_blurb">
                    Public blurb (optional)
                  </label>
                  <textarea
                    id="public_blurb"
                    name="public_blurb"
                    rows={3}
                    maxLength={400}
                    defaultValue={row.public_blurb ?? ""}
                    placeholder="One or two sentences, in their words."
                    className={`${INPUT} resize-none`}
                  />
                </div>

                <div>
                  <label className={LABEL} htmlFor="highlights">
                    Public highlights (optional)
                  </label>
                  <textarea
                    id="highlights"
                    name="highlights"
                    rows={3}
                    defaultValue={(row.public_highlights ?? []).join("\n")}
                    placeholder={"One per line\n12kW hybrid in Ikoyi\n3-year workmanship warranty"}
                    className={`${INPUT} resize-none`}
                  />
                  <p className="text-xs text-slate-400 mt-1">Plain text only — up to 6 lines.</p>
                </div>

                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" name="listed" defaultChecked={row.listed} className="accent-emerald-600 w-4 h-4" />
                  <span className="text-slate-700">Show on the public directory</span>
                </label>

                <button
                  type="submit"
                  disabled={!portalReady}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-3 text-sm font-semibold transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" /> Approve and send the portal link
                </button>
                <p className="text-xs text-slate-400">
                  Emails {row.email} a private link. Only the hash is stored, so the link cannot be shown again —
                  reissue it below if it is lost.
                </p>
              </form>
            </Card>

            {row.status === "approved" && (
              <Card title="Listing and access">
                <form action={setListed} className="space-y-3">
                  <input type="hidden" name="id" value={row.id} />
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" name="listed" defaultChecked={row.listed} className="accent-emerald-600 w-4 h-4" />
                    <span className="text-slate-700">Show on the public directory</span>
                  </label>
                  <button
                    type="submit"
                    className="w-full rounded-lg border border-slate-200 bg-white hover:border-slate-400 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors"
                  >
                    Save listing
                  </button>
                </form>
                <form action={reissuePortalToken} className="mt-3 pt-3 border-t border-slate-100">
                  <input type="hidden" name="id" value={row.id} />
                  <button
                    type="submit"
                    disabled={!portalReady}
                    className="w-full rounded-lg border border-slate-200 bg-white hover:border-slate-400 disabled:opacity-50 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors"
                  >
                    Reissue portal link (revokes the old one)
                  </button>
                </form>
                <p className="text-xs text-slate-400 mt-2">
                  Issued {fmt(row.portal_token_issued_at)}
                  {row.portal_last_seen_at ? ` · last opened ${fmt(row.portal_last_seen_at)}` : " · never opened"}
                </p>
              </Card>
            )}

            <Card title="Ask for something">
              <form action={requestInfo} className="space-y-3">
                <input type="hidden" name="id" value={row.id} />
                <div>
                  <label className={LABEL} htmlFor="items">
                    What we still need
                  </label>
                  <textarea
                    id="items"
                    name="items"
                    rows={3}
                    required
                    placeholder={"key | Label | why we are asking\ncac_doc_url | CAC certificate link | The number did not match the registry"}
                    className={`${INPUT} resize-none font-mono text-xs`}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    One per line. The middle column is what the applicant reads on /partners/status.
                  </p>
                </div>
                <div>
                  <label className={LABEL} htmlFor="note">
                    A sentence to go with it (optional)
                  </label>
                  <input id="note" name="note" type="text" className={INPUT} placeholder="Happy to approve once we have this." />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 text-sm font-semibold transition-colors"
                >
                  Ask, and email them
                </button>
              </form>
            </Card>

            <Card title="Internal notes">
              <form action={saveInternalNotes} className="space-y-3">
                <input type="hidden" name="id" value={row.id} />
                <textarea
                  name="review_notes"
                  rows={5}
                  defaultValue={row.review_notes ?? ""}
                  placeholder="What we checked, what a referee said, anything the next reviewer needs."
                  className={`${INPUT} resize-none`}
                />
                <button
                  type="submit"
                  className="w-full rounded-lg border border-slate-200 bg-white hover:border-slate-400 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors"
                >
                  Save notes
                </button>
                <p className="text-xs text-slate-400">Never shown to the applicant.</p>
              </form>
            </Card>

            {row.status !== "rejected" && row.status !== "suspended" && (
              <Card title="Reject">
                <form action={rejectPartner} className="space-y-3">
                  <input type="hidden" name="id" value={row.id} />
                  <textarea
                    name="rejected_reason"
                    rows={3}
                    required
                    placeholder="Why, in words they will read on /partners/status."
                    className={`${INPUT} resize-none`}
                  />
                  <button
                    type="submit"
                    className="w-full rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 px-3 py-2 text-sm font-semibold transition-colors"
                  >
                    Reject this application
                  </button>
                  <p className="text-xs text-slate-400">
                    If they were already approved, use Suspend instead — that keeps their history intact.
                  </p>
                </form>
              </Card>
            )}

            {(row.status === "approved" || row.status === "info_requested" || row.status === "under_review") && (
              <Card title="Suspend">
                <form action={suspendPartner} className="space-y-3">
                  <input type="hidden" name="id" value={row.id} />
                  <textarea
                    name="suspended_reason"
                    rows={3}
                    required
                    placeholder="Why the badge is coming off."
                    className={`${INPUT} resize-none`}
                  />
                  <button
                    type="submit"
                    className="w-full rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 px-3 py-2 text-sm font-semibold transition-colors"
                  >
                    Suspend and unlist
                  </button>
                  <p className="text-xs text-slate-400">
                    Takes the badge off the site and stops all routing. Their portal still works, so they can see why.
                  </p>
                </form>
              </Card>
            )}

            <Card title={`Audit trail (${events.length})`}>
              {events.length === 0 ? (
                <p className="text-sm text-slate-500">Nothing recorded yet.</p>
              ) : (
                <ol className="space-y-3">
                  {events.map((e) => (
                    <li key={e.id} className="text-xs">
                      <div className="text-slate-400">{fmt(e.created_at)}</div>
                      <div className="text-slate-800 font-semibold">{e.action}</div>
                      {e.detail && <div className="text-slate-500 break-words">{e.detail}</div>}
                      <div className="text-slate-400">by {e.actor}</div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>
        </div>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-heading font-bold text-slate-900 text-sm mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-slate-900 break-words">
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-slate-700"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}