import type { Metadata } from 'next';
import { cache } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import { supabaseEnv, dbGetChecked, PUBLIC_PARTNER_COLUMNS, jobStatsForPartner } from '@/lib/partner-db';
import { publicPartnerProfile, VERIFICATION_CHECKS, type PartnerRow } from '@/lib/partners';
import { SITE_URL, whatsappLink } from '@/lib/site';
import { ShieldCheck, MapPin, Wrench, CheckCircle, ArrowRight, MessageCircle, CalendarCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

/**
 * KNOWN, UNFIXED: an unknown slug here still answers 200 with the not-found
 * body — a soft-404. The four sibling routes in this commit were fixed with
 * `dynamicParams = false`; that does not apply here, because this route is
 * data-driven and has no generateStaticParams. notFound() in generateMetadata,
 * dropping force-dynamic, and revalidate = 0 were all tried and none changed
 * the status. Low urgency while `partners` has no rows, so there are no real
 * profile URLs to crawl. See #28.
 */

type Props = { params: Promise<{ slug: string }> };

/**
 * One lookup per request, shared by generateMetadata and the page.
 *
 * Three outcomes kept distinct on purpose. getPublicPartnerBySlug goes through
 * dbGet, which returns [] for a genuine miss AND for a network failure — so an
 * outage would 404 a real partner's profile, un-publishing someone we vouched
 * for. dbGetChecked keeps the difference.
 */
const lookup = cache(
  async (
    slug: string,
  ): Promise<{ state: 'found'; row: PartnerRow } | { state: 'missing' } | { state: 'unavailable' }> => {
    if (!supabaseEnv()) return { state: 'missing' };
    const res = await dbGetChecked<PartnerRow>('partners', {
      select: PUBLIC_PARTNER_COLUMNS,
      slug: `eq.${slug}`,
      status: 'eq.approved',
      verified: 'eq.true',
      listed: 'eq.true',
      limit: '1',
    });
    if (!res.ok) return { state: 'unavailable' };
    return res.data[0] ? { state: 'found', row: res.data[0] } : { state: 'missing' };
  },
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const found = await lookup(slug);
  // notFound() HERE as well as in the component. Metadata resolves first, and
  // returning a valid object for a missing row lets the response head go out
  // as 200 — which is how this served a "not found" body under HTTP 200.
  if (found.state === 'missing') notFound();
  if (found.state === 'unavailable') {
    return { title: 'Partner profile unavailable', robots: { index: false, follow: false } };
  }
  const row = found.row;
  const profile = publicPartnerProfile(row, 0);
  return {
    title: `${profile.name} — Verified ${profile.kindLabel} in ${profile.city}`,
    description: `${profile.name} is a verified partner in ${profile.city}, ${profile.state}. Verified on what we actually checked: ${profile.scope}.`,
    alternates: { canonical: `${SITE_URL}/partners/${profile.slug}` },
  };
}

export default async function PartnerProfilePage({ params }: Props) {
  const { slug } = await params;
  const found = await lookup(slug);
  if (found.state === 'missing') notFound();

  // A read failure must NOT 404. A real partner's profile vanishing because
  // Supabase blipped is worse than a soft-404: it tells a crawler the page is
  // gone and tells a customer the partner is not real.
  if (found.state === 'unavailable') {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h1 className="font-heading text-2xl font-extrabold text-slate-900 mb-3">
            We could not load this profile just now
          </h1>
          <p className="text-slate-600 leading-relaxed">
            This is a problem on our side, not a partner who has gone away. Try again in a moment, or{' '}
            <Link href="/partners" className="underline underline-offset-4 hover:text-slate-900">
              see every verified partner
            </Link>
            .
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  const row = found.row;

  const stats = await jobStatsForPartner(row.id);
  const p = publicPartnerProfile(row, stats.completedJobs);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/partners" className="text-slate-500 text-sm hover:text-slate-900 inline-flex items-center gap-1 mb-8 underline-offset-4 hover:underline">
          All verified partners
        </Link>

        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">{p.name}</h1>
          <VerifiedBadge partner={p} linked={false} />
        </div>
        <p className="text-slate-500 mb-8 flex items-center gap-2">
          <MapPin className="w-4 h-4" /> {p.city}, {p.state} · {p.kindLabel}
        </p>



        <section className="border border-slate-200 rounded-3xl p-6 mb-8">
          <h2 className="font-heading font-bold text-slate-900 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" /> What we verified
          </h2>
          <p className="text-slate-700 text-sm leading-relaxed mb-4">
            {p.scope}. Every partner claims the same four checks; this badge means these ones were done.
          </p>
          <div className="space-y-2">
            {VERIFICATION_CHECKS.map((c) => {
              const done = p.checks.find((x) => x.key === c.key)?.done ?? false;
              return (
                <div key={c.key} className="flex items-start gap-2 text-sm">
                  {done ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <span className="w-4 h-4 flex-shrink-0 mt-0.5 rounded-full border border-slate-300" aria-hidden />
                  )}
                  <span className={done ? 'text-slate-800' : 'text-slate-400 line-through'}>{c.label}</span>
                </div>
              );
            })}
          </div>
          {p.verifiedUntil && (
            <p className="text-slate-500 text-xs mt-4 flex items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5" /> Re-verification due by {p.verifiedUntil}.
            </p>
          )}
        </section>

        <section className="border border-slate-200 rounded-3xl p-6 mb-8">
          <h2 className="font-heading font-bold text-slate-900 mb-4">The business</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            {[
              ['Kind of business', p.kindLabel],
              ['Based in', `${p.city}, ${p.state}`],
              ['Coverage', p.coverageStates.length > 1 ? `${p.coverageStates.length} states, home state ${p.state}` : p.state],
              ['Services', p.serviceLabels.join(', ') || '—'],
              ['System sizes', p.systemSizes.join(', ') || '—'],
              ['Brands', p.brandsCarried || '—'],
              ['Years in business', p.yearsInBusiness === null ? '—' : `${p.yearsInBusiness}+`],
              ['Workmanship warranty', p.warrantyMonths ? `${p.warrantyMonths} months` : '—'],
              ['Jobs completed with us', String(p.completedJobs)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">{label}</dt>
                <dd className="text-slate-900 text-right">{value}</dd>
              </div>
            ))}
          </dl>
          {p.highlights.length > 0 && (
            <div className="mt-5">
              <h3 className="font-heading font-semibold text-slate-900 text-sm mb-2">Highlights from their work</h3>
              <ul className="space-y-1.5">
                {p.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2 text-slate-700 text-sm">
                    <Wrench className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="bg-slate-900 rounded-3xl p-8 text-center">
          <ShieldCheck className="w-8 h-8 text-amber-400 mx-auto mb-3" />
          <h2 className="font-heading font-extrabold text-white text-xl mb-2">Want this partner on your job?</h2>
          <p className="text-slate-300 text-sm max-w-md mx-auto mb-6 leading-relaxed">
            You do not call them directly. Build a quote, send it to us, and we confirm prices, run the survey and put
            them on the job — with the paperwork that badge stands for.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/calculator"
              className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-full px-6 py-3 font-heading font-bold text-sm transition-colors min-h-[48px]"
            >
              Build a quote <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={whatsappLink(`Hi SolarBuilders, I saw ${p.name} on your verified partners and want to discuss a job.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#22c55e] text-white rounded-full px-6 py-3 font-heading font-bold text-sm transition-colors min-h-[48px]"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp us
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
