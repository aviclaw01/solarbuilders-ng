import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { ShieldCheck } from 'lucide-react';
import { readPartnerSession } from '@/lib/partner-auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Partner Portal — SolarBuilders.ng',
  description: 'Partner dashboard: application status, job offers, commission tracking, and receipt upload.',
  robots: { index: false, follow: false },
};

export default async function PartnerPortalPage() {
  const partner = await readPartnerSession(true);

  if (!partner) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="max-w-3xl mx-auto px-6 py-12">
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center">
            <ShieldCheck className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="font-heading font-bold text-slate-900 text-xl mb-2">Partner Login Required</h2>
            <p className="text-slate-600 leading-relaxed">
              You need a portal login to access this dashboard. If you have a partner token, <a href="/partner/login" className="underline underline-offset-4 hover:text-slate-900">log in here</a>. Otherwise, <a href="/for-builders" className="underline underline-offset-4 hover:text-slate-900">apply to become a verified partner</a>.
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
