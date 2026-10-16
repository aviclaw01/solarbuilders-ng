import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import WhatsAppLink from '@/components/ui/WhatsAppLink';
import { HEADLINE_PACKAGES, PRICES_LAST_UPDATED } from '@/lib/prices';
import { formatNairaShort } from '@/lib/quote';
import { SITE_URL } from '@/lib/site';
import { ArrowRight, MapPin, MessageCircle, Zap } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "2026-10-09" → "October 2026", straight from the price table's date. */
function monthYear(iso: string): string {
  const [y, m] = iso.split('-');
  const name = MONTHS[Number(m) - 1];
  return name && y ? `${name} ${y}` : iso;
}

const PRICED_MONTH = monthYear(PRICES_LAST_UPDATED);

/** Every city page here also uses this package as its "common home" example. */
const EXAMPLE = HEADLINE_PACKAGES[2];

/**
 * One row per page that exists under app/solar/. The note is lifted from that
 * city page's own intro — do not write a new local claim here; change the city
 * page first, then mirror it.
 */
const CITIES: { slug: string; name: string; note: string }[] = [
  {
    slug: 'lagos',
    name: 'Lagos',
    note: 'Nigeria’s biggest solar market, and its most competitive — which is why prices vary so much from Alaba to Lekki.',
  },
  {
    slug: 'abuja',
    name: 'Abuja',
    note: 'Among the best sun in Nigeria, but equipment is trucked in from Lagos, so prices run a little higher.',
  },
  {
    slug: 'port-harcourt',
    name: 'Port Harcourt',
    note: 'Diesel costs and an unreliable grid make it one of the most cost-effective cities in Nigeria to go solar.',
  },
  {
    slug: 'kano',
    name: 'Kano',
    note: 'High irradiance and minimal cloud cover, so you need fewer panels per kWh than in the south.',
  },
  {
    slug: 'enugu',
    name: 'Enugu',
    note: 'Like much of the South-East, most homes depend on generators — solar is the exit.',
  },
];

const TITLE = `Solar in Nigerian Cities: Prices & Quotes (${PRICED_MONTH})`;
const DESCRIPTION = `Solar prices and quotes for Lagos, Abuja, Port Harcourt, Kano and Enugu. A ${EXAMPLE.label} system runs ${formatNairaShort(EXAMPLE.low)}–${formatNairaShort(EXAMPLE.high)} before installation at ${PRICED_MONTH} prices.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/solar`, type: 'website' },
  alternates: { canonical: `${SITE_URL}/solar` },
};

export default function SolarCitiesPage() {
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Solar prices and quotes by Nigerian city',
    itemListElement: CITIES.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `Solar in ${c.name}`,
      url: `${SITE_URL}/solar/${c.slug}`,
    })),
  };

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <Navbar />
      <main>
        <div className="bg-white border-b border-slate-100 px-6 py-14 md:py-20">
          <div className="max-w-6xl mx-auto">
            <Breadcrumbs trail={[{ label: 'Solar by city' }]} className="mb-6" />
            <span className="text-amber-700 text-sm font-semibold tracking-wide uppercase">Solar by city</span>
            <h1 className="font-heading font-extrabold text-slate-900 text-4xl md:text-5xl mt-3 mb-4">
              Solar in Nigerian cities: prices &amp; quotes
            </h1>
            <p className="text-slate-500 text-lg max-w-2xl">
              Pick your city for local prices, the vendors that serve it, and an itemised quote. Sun, supply and how far
              the kit travels all differ by city. Prices checked {PRICED_MONTH}.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link
                href="/calculator"
                className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-full px-6 py-3 font-semibold text-sm transition-colors min-h-[48px]"
              >
                <Zap className="w-4 h-4" fill="currentColor" /> Size my system
              </Link>
              <WhatsAppLink
                text={'Hi SolarBuilders, I want a solar quote for my city.'}
                placement="solar_index"
                className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-400 text-slate-700 rounded-full px-6 py-3 font-semibold text-sm transition-colors min-h-[48px]"
              >
                <MessageCircle className="w-4 h-4" /> Ask us for a quote
              </WhatsAppLink>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CITIES.map((c) => (
              <Link
                key={c.slug}
                href={`/solar/${c.slug}`}
                className="group bg-white rounded-2xl border border-slate-100 hover:border-amber-400 p-5 flex flex-col transition-colors"
              >
                <h2 className="font-heading font-extrabold text-slate-900 text-lg leading-tight group-hover:text-amber-600 transition-colors flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0" /> Solar in {c.name}
                </h2>
                <p className="text-slate-500 text-sm leading-snug mb-4 flex-1">{c.note}</p>
                <p className="text-slate-500 text-xs mb-1">{EXAMPLE.label} · {EXAMPLE.powers}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-heading font-bold text-amber-700 text-sm">
                    {formatNairaShort(EXAMPLE.low)}–{formatNairaShort(EXAMPLE.high)}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>

          <p className="text-slate-500 text-sm mt-6 max-w-2xl">
            Example prices are before installation, from Nigerian listings checked {PRICED_MONTH}. We re-confirm every
            price before you pay anyone.
          </p>

          <div className="flex flex-wrap gap-3 mt-10">
            <Link href="/brands" className="text-amber-700 font-semibold text-sm hover:underline underline-offset-4">
              Prices by brand →
            </Link>
            <Link href="/sizing" className="text-amber-700 font-semibold text-sm hover:underline underline-offset-4">
              What size do I need? →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
