import type { Metadata } from 'next';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { ShieldCheck, AlertTriangle, Clock } from 'lucide-react';
import { readPartnerSession } from '@/lib/partner-auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Partner Portal — SolarBuilders.ng',
  description: 'Partner dashboard: application status, job offers, commission tracking, and receipt upload.',
  robots: { index: false, follow: false },
};

/**
 * `?error=` is set by /partner/login when a link could not be redeemed.
 *   link        — the token is dead, already replaced, or absent
 *   unavailable — we could not reach the database; the link may be fine
 * They are deliberately different messages: telling a partner their link is
 * dead when the database merely blipped costs us a reissue and their trust.
 */
const LOGIN_ERRORS = {
  link: {
    icon: AlertTriangle,
    tone: 'rose',
    title: 'That link no longer works',
    body:
      'Portal links are single-purpose and are replaced whenever we issue a new one. ' +
      'If you have an older email from us, try the most recent one — otherwise ask us for a fresh link and we will send it straight away.',
  },
  unavailable: {
    icon: Clock,
    tone: 'amber',
    title: 'We could not check your link just now',
    body:
      'This is a problem on our side, not with your link. Give it a minute and open the link again. ' +
      'If it keeps happening, message us and we will sort it out.',
  },
} as const;

type Props = { searchParams: Promise<{ error?: string }> };

export default async function PartnerPortalPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const loginError = error === 'link' || error === 'unavailable' ? LOGIN_ERRORS[error] : null;
  const partner = await readPartnerSession(true);

  if (!partner) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="max-w-3xl mx-auto px-6 py-12">
          {loginError && (
            <div
              className={`rounded-3xl p-6 mb-6 border ${
                loginError.tone === 'rose' ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'
              }`}
            >
              <div className="flex gap-3">
                <loginError.icon
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    loginError.tone === 'rose' ? 'text-rose-600' : 'text-amber-600'
                  }`}
                  aria-hidden="true"
                />
                <div>
                  <h2
                    className={`font-heading font-bold mb-1 ${
                      loginError.tone === 'rose' ? 'text-rose-900' : 'text-amber-900'
                    }`}
                  >
                    {loginError.title}
                  </h2>
                  <p className={`text-sm leading-relaxed ${loginError.tone === 'rose' ? 'text-rose-800' : 'text-amber-800'}`}>
                    {loginError.body}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center">
            <ShieldCheck className="w-12 h-12 text-amber-500 mx-auto mb-4" aria-hidden="true" />
            <h2 className="font-heading font-bold text-slate-900 text-xl mb-2">This portal opens from your own link</h2>
            <p className="text-slate-600 leading-relaxed">
              There is no password to remember. We email every approved partner a private link, and opening it signs you
              in on this device for 30 days. Ask us for a new link any time — the old one stops working when we do.
            </p>
            <p className="text-slate-600 leading-relaxed mt-3">
              Not a partner yet?{' '}
              <a href="/for-builders" className="underline underline-offset-4 hover:text-slate-900">
                Apply to work with us
              </a>
              . Already applied?{' '}
              <a href="/partners/status" className="underline underline-offset-4 hover:text-slate-900">
                Check your application status
              </a>
              .
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="font-heading text-2xl font-extrabold text-slate-900 mb-4">
          Welcome, {partner.business_name || partner.contact_name}
        </h1>
        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
          {partner.status}
        </span>
      </main>
    </div>
  );
}
