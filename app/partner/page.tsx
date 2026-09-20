import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import {
  AlertTriangle,
  Banknote,
  CalendarCheck,
  CheckCircle2,
  Clock,
  FileText,
  Inbox,
  MapPin,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { readPartnerSession } from '@/lib/partner-auth';
import { listJobsForPartner, listPaymentsForPartner, commissionBank } from '@/lib/partner-db';
import { PARTNER_STATUS_META, commissionRateOf, type PartnerJobRow, type PartnerRow } from '@/lib/partners';
import {
  AVAILABILITY_STALE_DAYS,
  OFFER_WINDOW_HOURS,
  commissionStatusFor,
  invoiceRef,
  isOfferExpired,
} from '@/lib/routing';
import { formatNaira } from '@/lib/quote';
import PortalForm, { SubmitButton } from '@/components/ui/PortalForm';
import {
  acceptOffer,
  confirmAvailability,
  declineOffer,
  markComplete,
  respondToInfoRequest,
  submitReceipt,
} from './actions';

/**
 * The partner portal.
 *
 * Everything a partner can do with us happens here, because of L8: job detail
 * and the customer's number stay inside the portal rather than going out by
 * WhatsApp, so the relationship does not walk out of the door on the first job.
 *
 * Sections, in the order a partner needs them:
 *   1. anything we are waiting on from them (info requests)
 *   2. offers, with the 24h clock (L9)
 *   3. work in hand
 *   4. commission owed, on OUR figure, with the invoice reference (L6, L13)
 *   5. availability, which has to be confirmed to stay in routing (L10)
 *
 * Auth is the session cookie only. readPartnerSession(true) re-reads the row on
 * every request so a suspension takes effect immediately.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Partner Portal — SolarBuilders.ng',
  description: 'Your jobs, commission and availability.',
  robots: { index: false, follow: false },
};

const LOGIN_ERRORS = {
  link: {
    tone: 'rose' as const,
    title: 'That link no longer works',
    body:
      'Portal links are replaced whenever we issue a new one. If you have an older email from us, try the most recent — otherwise ask us for a fresh link and we will send it straight away.',
  },
  unavailable: {
    tone: 'amber' as const,
    title: 'We could not check your link just now',
    body:
      'This is a problem on our side, not with your link. Give it a minute and open the link again. If it keeps happening, message us.',
  },
};

type Props = { searchParams: Promise<{ error?: string }> };

export default async function PartnerPortalPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const loginError = error === 'link' || error === 'unavailable' ? LOGIN_ERRORS[error] : null;
  const partner = await readPartnerSession(true);

  if (!partner) return <SignedOut loginError={loginError} />;

  const now = new Date();
  const [jobs, payments] = await Promise.all([
    listJobsForPartner(partner.id, 100),
    listPaymentsForPartner(partner.id, 50),
  ]);

  const offers = jobs.filter((j) => j.status === 'offered' && !isOfferExpired(j.offer_expires_at, now));
  const active = jobs.filter((j) => j.status === 'accepted');
  const owing = jobs.filter((j) => j.status === 'completed' && ['due', 'overdue', 'receipt_uploaded'].includes(j.commission_status));
  const settled = jobs.filter((j) => j.commission_status === 'confirmed' || j.commission_status === 'waived');

  const meta = PARTNER_STATUS_META[partner.status as keyof typeof PARTNER_STATUS_META] ?? PARTNER_STATUS_META.submitted;
  const confirmedDaysAgo = partner.availability_confirmed_at
    ? (now.getTime() - new Date(partner.availability_confirmed_at).getTime()) / 86_400_000
    : null;
  const availabilityStale = confirmedDaysAgo === null || confirmedDaysAgo > AVAILABILITY_STALE_DAYS;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <header>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">
            {partner.business_name || partner.contact_name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${meta.chip}`}>
              {meta.label}
            </span>
            {partner.verified && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                <ShieldCheck className="w-3 h-3" aria-hidden="true" /> Verified partner
              </span>
            )}
          </div>
          <p className="text-slate-600 text-sm mt-2 leading-relaxed">{partner.status_note || meta.nextStep}</p>
        </header>

        {partner.status === 'suspended' && (
          <Banner tone="rose" icon={AlertTriangle} title="Your account is suspended">
            {partner.suspended_reason || 'Talk to us before anything else — no new work will be offered while this stands.'}
          </Banner>
        )}

        {partner.status === 'info_requested' && (partner.info_requested?.length ?? 0) > 0 && (
          <Section title="We need a little more from you" icon={FileText}>
            <PortalForm action={respondToInfoRequest} className="space-y-4">
              {(partner.info_requested ?? []).map((item) => (
                <div key={item.key}>
                  <label htmlFor={`info__${item.key}`} className="block font-heading font-semibold text-slate-900 text-sm">
                    {item.label}
                  </label>
                  <p className="text-slate-600 text-sm mb-1.5">{item.reason}</p>
                  <textarea
                    id={`info__${item.key}`}
                    name={`info__${item.key}`}
                    rows={3}
                    maxLength={2000}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-400"
                  />
                </div>
              ))}
              <SubmitButton>Send it back to the reviewer</SubmitButton>
            </PortalForm>
          </Section>
        )}

        {/* ── OFFERS (L9) ───────────────────────────────────────── */}
        <Section title={`Offers${offers.length ? ` (${offers.length})` : ''}`} icon={Inbox}>
          {offers.length === 0 ? (
            <Quiet>
              Nothing on offer right now. When we route a job to you it appears here and you have{' '}
              {OFFER_WINDOW_HOURS} hours to take it before it moves on.
            </Quiet>
          ) : (
            <ul className="space-y-4">
              {offers.map((job) => (
                <li key={job.id} className="border border-amber-200 bg-amber-50/40 rounded-2xl p-4">
                  <JobHead job={job} />
                  <p className="text-amber-900 text-xs mt-2 inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    Expires {new Date(job.offer_expires_at).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}
                  </p>
                  {job.detail && <p className="text-slate-700 text-sm mt-2 whitespace-pre-wrap">{job.detail}</p>}
                  <p className="text-slate-500 text-xs mt-2">
                    The customer&apos;s contact details appear once you accept.
                  </p>

                  <div className="flex flex-wrap gap-3 mt-3">
                    <PortalForm action={acceptOffer}>
                      <input type="hidden" name="job_id" value={job.id} />
                      <SubmitButton>Accept this job</SubmitButton>
                    </PortalForm>

                    <PortalForm action={declineOffer} className="flex-1 min-w-[260px]">
                      <input type="hidden" name="job_id" value={job.id} />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name="reason"
                          required
                          minLength={3}
                          maxLength={300}
                          placeholder="Why not? e.g. too far, no capacity"
                          aria-label={`Reason for declining ${job.reference}`}
                          className="flex-1 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400"
                        />
                        <SubmitButton variant="secondary">Decline</SubmitButton>
                      </div>
                    </PortalForm>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* ── WORK IN HAND (L16) ────────────────────────────────── */}
        <Section title={`Work in hand${active.length ? ` (${active.length})` : ''}`} icon={CalendarCheck}>
          {active.length === 0 ? (
            <Quiet>Nothing accepted at the moment.</Quiet>
          ) : (
            <ul className="space-y-4">
              {active.map((job) => (
                <li key={job.id} className="border border-slate-200 rounded-2xl p-4 bg-white">
                  <JobHead job={job} />
                  {job.detail && <p className="text-slate-700 text-sm mt-2 whitespace-pre-wrap">{job.detail}</p>}
                  {(job.customer_name || job.customer_phone) && (
                    <p className="text-slate-700 text-sm mt-2 inline-flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      {job.customer_name}
                      {job.customer_phone ? ` · ${job.customer_phone}` : ''}
                    </p>
                  )}
                  <PortalForm action={markComplete} className="mt-3">
                    <input type="hidden" name="job_id" value={job.id} />
                    <SubmitButton variant="secondary">Mark the work complete</SubmitButton>
                    <p className="text-slate-500 text-xs mt-1.5">
                      This closes the job and makes the commission due. Only mark it complete once the customer has the
                      system working.
                    </p>
                  </PortalForm>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* ── COMMISSION (L6, L7, L13) ──────────────────────────── */}
        <Section title="Commission" icon={Banknote}>
          <p className="text-slate-600 text-sm mb-3 leading-relaxed">
            Commission is {commissionRateOf(partner)}% of the job value on our record. We do not take the customer&apos;s
            money — you invoice them, and you settle our fee separately.
          </p>

          {owing.length === 0 ? (
            <Quiet>Nothing outstanding.</Quiet>
          ) : (
            <ul className="space-y-4">
              {owing.map((job) => {
                // A REJECTED claim must not block a resubmission. Rejecting
                // puts the job back to `due`, so without this the partner sees
                // "Status: rejected" forever, can never resubmit, and the L5
                // gate keeps them out of every future offer permanently.
                const claims = payments.filter((p) => p.job_id === job.id);
                const claim = claims.find((p) => p.status !== 'rejected') ?? null;
                const rejected = !claim ? claims.find((p) => p.status === 'rejected') ?? null : null;
                return (
                  <li key={job.id} className="border border-slate-200 rounded-2xl p-4 bg-white">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-mono text-sm font-semibold text-slate-900">{invoiceRef(job.reference)}</span>
                      <span className="font-heading font-extrabold text-slate-900">
                        {formatNaira(job.commission_amount ?? 0)}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mt-1">
                      For {job.reference}
                      {job.commission_due_at
                        ? ` · due ${new Date(job.commission_due_at).toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos' })}`
                        : ''}
                      {commissionStatusFor(job.commission_due_at, now, job.commission_status) === 'overdue'
                        ? ' · overdue'
                        : ''}
                    </p>

                    {claim ? (
                      <p className="mt-3 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                        You sent {formatNaira(claim.amount_paid ?? 0)} on {claim.paid_on}, reference{' '}
                        <span className="font-mono">{claim.bank_ref}</span>. Status: <b>{claim.status}</b>. We confirm it
                        against our own statement before it clears — a receipt on its own is not proof the money landed.
                      </p>
                    ) : (
                      <>
                        {rejected && (
                          <p className="mt-3 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                            We could not match your last receipt
                            {rejected.bank_ref ? <> (reference <span className="font-mono">{rejected.bank_ref}</span>)</> : null}
                            {rejected.reject_reason ? <>: {rejected.reject_reason}</> : '.'} Send it again below with the
                            correct details and we will check straight away.
                          </p>
                        )}
                        <ReceiptForm jobId={job.id} />
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {settled.length > 0 && (
            <p className="text-slate-500 text-sm mt-4">
              {settled.length} commission{settled.length === 1 ? '' : 's'} cleared. Thank you.
            </p>
          )}

          <BankDetails />
        </Section>

        {/* ── AVAILABILITY (L10) ────────────────────────────────── */}
        <Section title="Availability" icon={CheckCircle2}>
          <p className="text-slate-600 text-sm mb-3 leading-relaxed">
            Confirm you are taking work at least every {AVAILABILITY_STALE_DAYS} days. If you go quiet we stop offering
            you jobs rather than sending work that sits unanswered.
          </p>
          {availabilityStale && (
            <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3">
              {confirmedDaysAgo === null
                ? 'You have not confirmed yet, so you are not in the routing pool.'
                : `Last confirmed ${Math.round(confirmedDaysAgo)} days ago — you are out of the routing pool until you confirm.`}
            </p>
          )}
          <PortalForm action={confirmAvailability} className="flex flex-wrap items-center gap-2">
            <label htmlFor="availability" className="sr-only">
              Your availability
            </label>
            <select
              id="availability"
              name="availability"
              defaultValue={partner.availability}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400"
            >
              <option value="available">Taking new jobs</option>
              <option value="busy">Busy — not right now</option>
              <option value="paused">Paused</option>
            </select>
            <SubmitButton>Confirm</SubmitButton>
          </PortalForm>
        </Section>
      </main>
      <Footer />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// PIECES
// ─────────────────────────────────────────────────────────

function ReceiptForm({ jobId }: { jobId: number }) {
  return (
    <PortalForm action={submitReceipt} className="mt-3 space-y-2">
      <input type="hidden" name="job_id" value={jobId} />
      <div className="grid sm:grid-cols-2 gap-2">
        <label className="text-xs text-slate-500">
          Amount you sent
          <input
            type="number"
            name="amount_paid"
            required
            min={1}
            step={100}
            className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 mt-0.5"
          />
        </label>
        <label className="text-xs text-slate-500">
          Date sent
          <input
            type="date"
            name="paid_on"
            required
            className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 mt-0.5"
          />
        </label>
      </div>
      <label className="text-xs text-slate-500 block">
        Bank / NIP transaction reference — this is what we match against our statement
        <input
          type="text"
          name="bank_ref"
          required
          minLength={4}
          maxLength={120}
          className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 mt-0.5"
        />
      </label>
      <label className="text-xs text-slate-500 block">
        Receipt (JPG, PNG, WebP, HEIC or PDF, up to 5MB)
        <input
          type="file"
          name="receipt"
          accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
          className="block w-full text-sm text-slate-700 mt-0.5 file:mr-3 file:rounded-full file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm"
        />
      </label>
      <label className="text-xs text-slate-500 block">
        …or paste a link to it instead
        <input
          type="url"
          name="receipt_url"
          placeholder="https://"
          className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 mt-0.5"
        />
      </label>
      <SubmitButton>Send the receipt</SubmitButton>
    </PortalForm>
  );
}

function BankDetails() {
  const bank = commissionBank();
  if (!bank) {
    return (
      <p className="text-slate-500 text-sm mt-4">
        Ask us for the account details before you send anything — we have not published them here.
      </p>
    );
  }
  return (
    <div className="mt-4 border border-slate-200 rounded-2xl p-4 bg-white">
      <p className="text-[11px] uppercase tracking-wide font-semibold text-slate-500 mb-1">Send commission to</p>
      <p className="text-slate-900 text-sm">
        {bank.accountName} · {bank.bankName} · <span className="font-mono">{bank.accountNumber}</span>
      </p>
      <p className="text-slate-500 text-xs mt-1">Quote the invoice reference so we can match it.</p>
    </div>
  );
}

function JobHead({ job }: { job: PartnerJobRow }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-sm font-semibold text-slate-900">{job.reference}</span>
        <span className="font-heading font-bold text-slate-900">{job.title}</span>
      </div>
      <p className="text-slate-500 text-sm mt-0.5 flex flex-wrap items-center gap-x-3">
        {job.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            {job.location}
          </span>
        )}
        {job.budget_best ? <span>Customer&apos;s figure: {formatNaira(job.budget_best)}</span> : null}
        {job.commission_amount ? <span>Our commission: {formatNaira(job.commission_amount)}</span> : null}
      </p>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Inbox;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-heading font-bold text-slate-900 text-lg mb-3 flex items-center gap-2">
        <Icon className="w-5 h-5 text-amber-500" aria-hidden="true" /> {title}
      </h2>
      {children}
    </section>
  );
}

function Quiet({ children }: { children: React.ReactNode }) {
  return <p className="text-slate-500 text-sm border border-slate-200 rounded-2xl px-4 py-3 bg-white">{children}</p>;
}

function Banner({
  tone,
  icon: Icon,
  title,
  children,
}: {
  tone: 'rose' | 'amber';
  icon: typeof AlertTriangle;
  title: string;
  children: React.ReactNode;
}) {
  const c = tone === 'rose' ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-amber-50 border-amber-200 text-amber-900';
  return (
    <div className={`border rounded-3xl p-5 flex gap-3 ${c}`}>
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <h2 className="font-heading font-bold mb-1">{title}</h2>
        <p className="text-sm leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

function SignedOut({ loginError }: { loginError: (typeof LOGIN_ERRORS)[keyof typeof LOGIN_ERRORS] | null }) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-12">
        {loginError && (
          <Banner tone={loginError.tone} icon={loginError.tone === 'rose' ? AlertTriangle : Clock} title={loginError.title}>
            {loginError.body}
          </Banner>
        )}
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center mt-6">
          <ShieldCheck className="w-12 h-12 text-amber-500 mx-auto mb-4" aria-hidden="true" />
          <h2 className="font-heading font-bold text-slate-900 text-xl mb-2">This portal opens from your own link</h2>
          <p className="text-slate-600 leading-relaxed">
            There is no password to remember. We email every approved partner a private link, and opening it signs you in
            on this device for 30 days. Ask us for a new link any time — the old one stops working when we do.
          </p>
          <p className="text-slate-600 leading-relaxed mt-3">
            Not a partner yet?{' '}
            <Link href="/for-builders" className="underline underline-offset-4 hover:text-slate-900">
              Apply to work with us
            </Link>
            . Already applied?{' '}
            <Link href="/partners/status" className="underline underline-offset-4 hover:text-slate-900">
              Check your application status
            </Link>
            .
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
