import type { Metadata } from 'next';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { ShieldCheck } from 'lucide-react';
import { SITE_URL } from '@/lib/site';
import ReviewForm from './ReviewForm';

/**
 * /reviews — where past customers tell us how their install went. This is
 * the link we send after commissioning.
 *
 * Collect only. There is deliberately no list of reviews on this page: we
 * have none we have checked yet, and showing made-up ones is worse than
 * showing nothing. Submissions land on the /admin/leads desk (kind `review`)
 * for a person to verify against a real job.
 */

export const metadata: Metadata = {
  title: 'Leave a review',
  description:
    'Had a solar system sourced or installed through SolarBuilders.ng? Tell us how it went — every review is read by our team before it is used anywhere.',
  alternates: { canonical: `${SITE_URL}/reviews` },
};

export default function ReviewsPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <Navbar />

      <main>
        <section className="bg-white border-b border-slate-100 py-14 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="font-heading font-extrabold text-[#0F172A] text-4xl md:text-5xl mb-4">How did your install go?</h1>
            <p className="text-slate-500 text-lg">
              If we sourced your equipment or sent you an installer, tell us honestly how it went &mdash; the good and
              the bad. It helps the next customer, and it tells us which installers to keep.
            </p>
          </div>
        </section>

        <section className="py-12 px-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-sm text-amber-900">
              <ShieldCheck className="w-5 h-5 flex-shrink-0 text-amber-600" aria-hidden="true" />
              <p>
                Every review is read by a person first and is never published automatically. We use your WhatsApp
                number only to confirm the job was real &mdash; it is never shown.
              </p>
            </div>

            <ReviewForm />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
