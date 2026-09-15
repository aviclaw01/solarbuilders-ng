import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';
import WhatsAppLink from '@/components/ui/WhatsAppLink';
import { PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';

/**
 * Closing call to action.
 *
 * This used to be a countdown to "5:00 PM" that reset every day. Nothing
 * happened at 5pm — the calculator is free and always available — so the timer
 * was manufactured urgency on a site whose entire pitch is that the numbers are
 * honest. It is gone. What is left is the real reason to start now.
 */
export default function CountdownCTA() {
  return (
    <section className="bg-amber-400 py-20 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-heading font-extrabold text-slate-900 text-3xl md:text-5xl mb-4">
          Find out what your system costs
        </h2>
        <p className="text-slate-800/80 text-lg mb-8 max-w-xl mx-auto">
          Two minutes, no sign-up, no phone number needed. You get an itemised quote at real Nigerian prices from{' '}
          {PRICES_LAST_UPDATED_LABEL} — and you keep it whether or not you ever talk to us.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/calculator"
            className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-full px-8 py-4 transition-all text-lg"
          >
            Size my system <ArrowRight className="w-5 h-5" />
          </Link>
          <WhatsAppLink
            text="Hi SolarBuilders, I'd like help working out what system I need."
            placement="home_closing_cta"
            className="inline-flex items-center justify-center gap-2 border-2 border-slate-900 text-slate-900 hover:bg-slate-900/10 font-semibold rounded-full px-8 py-4 transition-all text-lg"
          >
            <MessageCircle className="w-5 h-5" /> Ask us first
          </WhatsAppLink>
        </div>
      </div>
    </section>
  );
}
