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
 *
 * One primary button. WhatsApp stays as a quiet text link for people who want
 * to talk first, so it never competes with the quote.
 */
export default function CountdownCTA() {
  return (
    <section className="on-dark relative overflow-hidden bg-night px-4 sm:px-6 py-20 md:py-28">
      <div aria-hidden="true" className="sun-arc w-[640px] left-1/2 -translate-x-1/2 -bottom-[500px] md:w-[900px] md:-bottom-[720px] opacity-60" />
      <div className="relative max-w-3xl mx-auto text-center">
        <h2 className="font-heading font-extrabold text-white text-title mb-5">
          Find out what your system costs
        </h2>
        <p className="text-slate-300 text-lead max-w-xl mx-auto mb-10">
          Two minutes, no sign-up, no phone number needed. You get an itemised quote at real Nigerian prices from{' '}
          {PRICES_LAST_UPDATED_LABEL}, and you keep it whether or not you ever talk to us.
        </p>
        <Link href="/calculator" className="btn btn-sun btn-lg w-full sm:w-auto">
          Get my solar quote <ArrowRight className="w-5 h-5" aria-hidden="true" />
        </Link>
        <p className="mt-8">
          <WhatsAppLink
            text="Hi SolarBuilders, I'd like help working out what system I need."
            placement="home_closing_cta"
            className="focus-ring inline-flex items-center gap-2 text-white font-semibold underline decoration-white/40 underline-offset-4 hover:decoration-white"
          >
            <MessageCircle className="w-4 h-4" aria-hidden="true" /> Rather ask a person first? Message us
          </WhatsAppLink>
        </p>
      </div>
    </section>
  );
}
