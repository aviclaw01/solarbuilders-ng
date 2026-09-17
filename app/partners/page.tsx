import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import { supabaseEnv, listPublicPartners, jobStatsByPartner } from '@/lib/partner-db';
import { publicPartnerProfile, type PublicPartnerProfile } from '@/lib/partners';
import { SITE_URL, whatsappLink } from '@/lib/site';
import { ShieldCheck, MapPin, Wrench, ArrowRight, MessageCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Verified Installers & Vendors',
  description:
    'Every partner here passed the same checks: CAC registration, past installs we have seen photos of, references we called, and a written warranty. Find one in your state.',
  alternates: { canonical: `${SITE_URL}/partners` },
};

export default async function PartnersDirectoryPage() {
  const env = supabaseEnv();
  let profiles: PublicPartnerProfile[] = [];

  if (env) {
    const [rows, stats] = await Promise.all([listPublicPartners(200), jobStatsByPartner()]);
    profiles = rows.map((row) => publicPartnerProfile(row, stats.get(row.id)?.completedJobs ?? 0));
  }

  const byState = new Map<string, PublicPartnerProfile[]>();
  for (const p of profiles) {
    const key = p.state || 'Other';
    const list = byState.get(key) ?? [];
    list.push(p);
    byState.set(key, list);
  }
  const states = [...byState.keys()].sort((a, b) => a.localeCompare(b));

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-1.5 mb-6">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-800 text-sm font-medium">The verified-partner directory</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
            Partners we have actually checked.
          </h1>
          <p className="text-slate-600 text-lg mb-8 leading-relaxed max-w-2xl mx-auto">
            Nobody buys their way onto this page. Each partner here passed CAC, past-installs, reference and warranty
            checks — the same four we describe on{' '}
            <Link href="/verified" className="underline underline-offset-4 hover:text-slate-900">
              how we vet
            </Link>
            . You do not contact them directly; we stay on the job as your agent.
          </p>
        </section>



        <section className="max-w-6xl mx-auto px-6 pb-20">
          {profiles.length === 0 ? (
            <div className="border border-slate-200 rounded-3xl p-10 text-center max-w-2xl mx-auto">
              <ShieldCheck className="w-10 h-10 text-amber-500 mx-auto mb-4" />
              <h2 className="font-heading font-bold text-slate-900 text-xl mb-2">No verified partners listed yet</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                The first cohort is going through verification now. Applications are open — installers, vendors and
                manufacturers can apply in about five minutes.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/for-builders"
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full px-6 py-3 font-heading font-bold text-sm transition-colors min-h-[48px]"
                >
                  Apply to work with us <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href={whatsappLink('Hi SolarBuilders, I need an installer — when will verified partners be listed?')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#22c55e] text-white rounded-full px-6 py-3 font-heading font-bold text-sm transition-colors min-h-[48px]"
                >
                  <MessageCircle className="w-4 h-4" /> Ask us on WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              {states.map((state) => (
                <div key={state}>
                  <h2 className="font-heading font-bold text-slate-900 text-xl mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-amber-500" /> {state}
                    <span className="text-slate-400 text-sm font-normal">({byState.get(state)!.length})</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {byState.get(state)!.map((p) => (
                      <Link
                        key={p.slug}
                        href={`/partners/${p.slug}`}
                        className="border border-slate-200 rounded-2xl p-5 hover:border-amber-300 hover:shadow-sm transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-heading font-bold text-slate-900 leading-snug group-hover:text-amber-600 transition-colors">
                            {p.name}
                          </h3>
                          <VerifiedBadge partner={p} linked={false} size="sm" />
                        </div>
                        <p className="text-slate-500 text-sm mb-3">
                          {p.city} · {p.kindLabel}
                        </p>
                        {p.blurb ? (
                          <p className="text-slate-600 text-sm leading-relaxed mb-3">{p.blurb}</p>
                        ) : (
                          <p className="text-slate-600 text-sm leading-relaxed mb-3">
                            {p.serviceLabels.slice(0, 3).join(' · ')}
                          </p>
                        )}
                        <p className="text-slate-500 text-xs flex items-center gap-1">
                          <Wrench className="w-3.5 h-3.5" /> {p.scope}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              <p className="text-slate-500 text-sm text-center leading-relaxed">
                A badge means the checks passed on the date shown on the profile. It is re-checked yearly, and it comes
                off the moment it should. Something off?{' '}
                <Link href="/contact" className="underline underline-offset-4 hover:text-slate-900">
                  Tell us
                </Link>
                .
              </p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
