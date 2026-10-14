import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import ProductImage from '@/components/ui/ProductImage';
import LeadCaptureModal from '@/components/ui/LeadCaptureModal';
import { CATEGORY_LABEL, type ProductCategory } from '@/lib/brands';
import { catalogue, midPrice } from '@/lib/cart';
import { PERSONAS } from '@/lib/find-personas';
import { HEADLINE_PACKAGES, PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { formatNaira, formatNairaShort } from '@/lib/quote';
import { ArrowRight, Briefcase, Building2, GraduationCap, Home, Laptop, ListChecks, Store, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: "Real Nigerian Solar Prices — And We Buy It For You | SolarBuilders.ng",
  description: `We publish what solar actually costs in Nigeria (Felicity, Deye, Growatt, Jinko — real listings, ${PRICES_LAST_UPDATED_LABEL}). Size your system free, then we order the equipment and put a vetted installer on the job in Lagos, Abuja, Port Harcourt and beyond.`,
  alternates: { canonical: 'https://solarbuildersng.com' },
};

/**
 * The homepage has one job: get someone to a price. Owner's rule: no plenty
 * talk. A headline, a way in (/find), real products, what homes pay. Design
 * rules live in docs/DIRECTION.md.
 */

const PERSONA_ICON = {
  students: GraduationCap,
  techbros: Laptop,
  renters: Users,
  shops: Store,
  family: Home,
  duplex: Building2,
  offices: Briefcase,
} as const;

/** Four photographed products for the strip under the hero: one per category where we can, then the next priciest. */
function featuredProducts() {
  const photographed = catalogue()
    .filter((i) => i.product.image && !i.product.excludeFromAutoMatch)
    .sort((a, b) => midPrice(b.product) - midPrice(a.product));
  const wanted: ProductCategory[] = ['inverter', 'battery', 'panel', 'package'];
  const picked = wanted
    .map((cat) => photographed.find((i) => i.product.category === cat))
    .filter((i): i is NonNullable<typeof i> => Boolean(i));
  for (const i of photographed) {
    if (picked.length >= 4) break;
    if (!picked.includes(i)) picked.push(i);
  }
  return picked;
}

export default function HomePage() {
  const featured = featuredProducts();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        {/* ──────────────── HERO ──────────────── */}
        <section className="px-4 sm:px-6 pt-16 pb-14 md:pt-28 md:pb-20 text-center">
          <p className="text-sm font-semibold text-muted mb-5">Prices checked {PRICES_LAST_UPDATED_LABEL}</p>
          <h1 className="font-heading font-extrabold text-ink text-display max-w-[14ch] mx-auto">
            Solar for your home, priced in three taps
          </h1>
          <p className="text-lead text-muted max-w-2xl mx-auto mt-6">Pick your home, see your kit and the price. Free, no sign-up.</p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
            <Link href="/find" className="btn btn-sun btn-lg w-full sm:w-auto">
              Find my kit
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Link>
            <Link href="/shop" className="font-heading font-bold text-ink hover:text-sun-ink inline-flex items-center gap-1.5 min-h-12">
              Shop equipment <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          {/* Straight into /find with the first answer already given. */}
          <ul className="max-w-4xl mx-auto mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            {PERSONAS.map((p) => {
              const Icon = PERSONA_ICON[p.key];
              return (
                <li key={p.key}>
                  <Link
                    href={`/find?s=hours&p=${p.key}`}
                    className="flex items-center gap-3 rounded-card bg-canvas px-4 py-4 font-semibold text-ink hover:bg-sky transition-colors duration-150"
                  >
                    <Icon className="w-5 h-5 text-ink-soft shrink-0" aria-hidden="true" />
                    {p.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                href="/find?p=pick&s=pick"
                className="flex items-center gap-3 rounded-card border border-line px-4 py-4 font-semibold text-ink hover:border-ink-soft transition-colors duration-150"
              >
                <ListChecks className="w-5 h-5 text-ink-soft shrink-0" aria-hidden="true" />
                Pick appliances
              </Link>
            </li>
          </ul>
        </section>

        {/* ──────────────── REAL PRODUCTS ──────────────── */}
        {featured.length > 0 && (
          <section className="px-4 sm:px-6 py-16 md:py-24">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-end justify-between gap-4 mb-8">
                <h2 className="font-heading font-extrabold text-ink text-title">Real brands, real prices</h2>
                <Link href="/shop" className="hidden sm:inline-flex items-center gap-1.5 font-heading font-bold text-ink hover:text-sun-ink whitespace-nowrap">
                  Shop all <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
              <ul className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6">
                {featured.map(({ brand, product, id }) => (
                  <li key={id}>
                    <Link href={`/shop?cat=${product.category}`} className="group block">
                      <ProductImage
                        product={{ category: product.category, model: product.model, spec: product.spec, image: product.image }}
                        className="aspect-square w-full"
                      />
                      <p className="text-xs font-medium text-muted mt-4">{CATEGORY_LABEL[product.category]}</p>
                      <p className="font-heading font-bold text-ink leading-snug mt-0.5">
                        {brand.name} {product.model}
                      </p>
                      <p className="font-heading font-extrabold text-ink tabular-nums mt-2">
                        {product.priceLow === product.priceHigh ? formatNaira(product.priceLow) : `From ${formatNaira(product.priceLow)}`}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/shop" className="sm:hidden mt-8 btn btn-outline w-full">
                Shop all
              </Link>
            </div>
          </section>
        )}

        {/* ──────────────── WHAT HOMES PAY ──────────────── */}
        <section className="bg-canvas px-4 sm:px-6 py-16 md:py-24">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading font-extrabold text-ink text-title text-center">What homes pay</h2>
            <ul className="mt-10 bg-white rounded-panel divide-y divide-line">
              {HEADLINE_PACKAGES.slice(0, 4).map((p) => (
                <li key={p.label} className="px-5 sm:px-8 py-5 flex items-center justify-between gap-4">
                  <span className="min-w-0">
                    <span className="block font-semibold text-ink">{p.powers}</span>
                    <span className="block text-sm text-muted mt-0.5">{p.label}</span>
                  </span>
                  <span className="font-heading font-bold text-ink whitespace-nowrap tabular-nums">
                    {formatNairaShort(p.low)}–{formatNairaShort(p.high)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-10 text-center">
              <Link href="/find" className="btn btn-sun btn-lg w-full sm:w-auto">
                Find my kit
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <LeadCaptureModal />
      </main>
      <Footer />
    </div>
  );
}
