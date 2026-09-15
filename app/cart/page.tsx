import type { Metadata } from 'next';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import CartClient from './CartClient';
import { PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';

/**
 * The order request page.
 *
 * Not a checkout — no card, no payment, no "buy now". The customer tells us
 * what they want, we confirm today's price with the distributor, then we come
 * back with a final figure.
 *
 * Deliberately not indexed: it is a per-browser working document, and an empty
 * cart in search results helps nobody.
 */
export const metadata: Metadata = {
  title: 'Your order request | SolarBuilders.ng',
  description: 'The equipment you asked us to source. We confirm the price with the distributor before you pay anyone.',
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-6 py-10 md:py-14 w-full">
        <CartClient pricesAsOfLabel={PRICES_LAST_UPDATED_LABEL} />
      </main>
      <Footer />
    </div>
  );
}
