import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { whatsappLink } from '@/lib/site';
import StatusChecker from './StatusChecker';

export const metadata: Metadata = {
  title: 'Check Your Partner Application',
  description: 'Track where your SolarBuilders.ng partner application is — received, under review, or approved.',
  robots: { index: false, follow: false },
};

export default function PartnerStatusPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-lg mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h1 className="font-heading text-3xl font-extrabold text-slate-900 mb-3">Check your application</h1>
          <p className="text-slate-600 leading-relaxed">
            Enter the reference from your confirmation email and the email address you applied with.
          </p>
        </div>
        <StatusChecker />
        <p className="text-slate-500 text-sm text-center mt-8 leading-relaxed">
          Lost the reference, or something looks wrong?{' '}
          <a
            href={whatsappLink('Hi SolarBuilders, I applied to work with you and need help checking my application.')}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-slate-900"
          >
            Message us on WhatsApp
          </a>{' '}
          and we will look it up by the email you applied with. Not applied yet?{' '}
          <Link href="/for-builders" className="underline underline-offset-4 hover:text-slate-900">
            Start here
          </Link>.
        </p>
      </main>
      <Footer />
    </div>
  );
}
