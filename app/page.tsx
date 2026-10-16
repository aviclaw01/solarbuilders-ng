import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import ProductImage from '@/components/ui/ProductImage';
import BrandMark from '@/components/ui/BrandMark';
import NeedBox from '@/components/ui/NeedBox';
import PriceStamp from '@/components/ui/PriceStamp';
import { CATEGORY_LABEL, getBrand, getComparison, type Brand, type ComparisonPair, type ProductCategory } from '@/lib/brands';
import { catalogue, midPrice } from '@/lib/cart';
import { PERSONAS } from '@/lib/find-personas';
import { HEADLINE_PACKAGES, PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { formatNaira, formatNairaShort } from '@/lib/quote';
import { ArrowRight, Briefcase, Building2, GraduationCap, Home, Laptop, ListChecks, Store, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: "Real Nigerian Solar Prices — And We Buy It For You | SolarBuilders.ng",
  description: `We publish what solar actually costs in Nigeria (Felicity, Deye, Growatt, Jinko — real listings, ${PRICES_LAST_UPDATED_LABEL}). Size your system free, then we order the equipment and connect you with an installer we have checked (CAC, past installs, references) in Lagos, Abuja, Port Harcourt and beyond.`,
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

/** Brands people search for by name. Filtered against the catalogue so a renamed slug drops out instead of 404ing. */
const POPULAR_BRAND_SLUGS = ['deye', 'felicity', 'growatt', 'ja-solar', 'jinko', 'dyness'];
const COMPARE_SLUGS = ['growatt-vs-luxpower', 'deye-vs-growatt', 'deye-vs-felicity'];

function popularBrands(): Brand[] {
  return POPULAR_BRAND_SLUGS.map((s) => getBrand(s)).filter((b): b is Brand => Boolean(b));
}

function popularComparisons(): ComparisonPair[] {
  return COMPARE_SLUGS.map((s) => getComparison(s)).filter((c): c is ComparisonPair => Boolean(c));
}

export default function HomePage() {
  const featured = featuredProducts();
  const brands = popularBrands();
  const comparisons = popularComparisons();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        {/* ──────────────── HERO ──────────────── */}
        <section className="px-4 sm:px-6 pt-16 pb-14 md:pt-28 md:pb-20 text-center">
          <h1 className="font-heading font-extrabold text-ink text-display max-w-[14ch] mx-auto">
            Solar for your home, priced in three taps
          </h1>
          <p className="text-lead text-muted max-w-2xl mx-auto mt-6">Pick your home, see your kit and the price. Free, no sign-up.</p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
            <Link href="/find" className="btn btn-sun btn-lg w-full sm:w-auto">
              Find my kit
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Link>
            <Link href="/calculator" className="font-heading font-bold text-ink hover:text-sun-ink inline-flex items-center gap-1.5 min-h-12">
              Size it from my appliances <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link href="/shop" className="font-heading font-bold text-ink hover:text-sun-ink inline-flex items-center gap-1.5 min-h-12">
              Shop equipment <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
          <PriceStamp className="mt-6" />

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
                href="/calculator"
                className="flex items-center gap-3 rounded-card border border-line px-4 py-4 font-semibold text-ink hover:border-ink-soft transition-colors duration-150"
              >
                <ListChecks className="w-5 h-5 text-ink-soft shrink-0" aria-hidden="true" />
                Pick appliances
              </Link>
            </li>
          </ul>
        </section>

        {/* ──────────────── TELL US WHAT YOU NEED ──────────────── */}
        <section aria-labelledby="need-home-title" className="px-4 sm:px-6 pb-16 md:pb-24">
          <div className="max-w-5xl mx-auto bg-night rounded-panel px-5 py-10 sm:px-10 md:px-14 md:py-14 grid md:grid-cols-[1fr_1.35fr] gap-8 md:gap-12 items-start">
            <div className="text-left">
              <p className="text-sm font-semibold text-sun">Not sure what to pick?</p>
              <h2 id="need-home-title" className="font-heading font-extrabold text-white text-title mt-3">
                Tell us what you need
              </h2>
              <p className="text-lead text-white/75 mt-4">
                Write it the way you&apos;d say it. It opens WhatsApp with your message ready, and a person reads it.
              </p>
            </div>
            <NeedBox placement="home" headingId="need-home-title" />
          </div>
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

        {/* ──────────────── POPULAR BRANDS + COMPARE ──────────────── */}
        {(brands.length > 0 || comparisons.length > 0) && (
          <section className="px-4 sm:px-6 pb-16 md:pb-24">
            <div className="max-w-6xl mx-auto space-y-12">
              {brands.length > 0 && (
                <div>
                  <div className="flex items-end justify-between gap-4 mb-6">
                    <h2 className="font-heading font-extrabold text-ink text-2xl sm:text-3xl">Popular brands</h2>
                    <Link href="/brands" className="inline-flex items-center gap-1.5 font-heading font-bold text-ink hover:text-sun-ink whitespace-nowrap">
                      All brands <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  </div>
                  <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {brands.map((b) => (
                      <li key={b.slug}>
                        <Link
                          href={`/brands/${b.slug}`}
                          className="flex items-center gap-3 rounded-card bg-canvas px-4 py-4 hover:bg-sky transition-colors duration-150"
                        >
                          <BrandMark brand={b} size={36} />
                          <span className="min-w-0">
                            <span className="block font-heading font-bold text-ink leading-tight truncate">{b.name}</span>
                            <span className="block text-xs text-muted mt-0.5 truncate">
                              {b.categories.map((c) => CATEGORY_LABEL[c]).join(' · ')}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {comparisons.length > 0 && (
                <div>
                  <h2 className="font-heading font-extrabold text-ink text-2xl sm:text-3xl mb-6">Compare</h2>
                  <ul className="grid sm:grid-cols-3 gap-3">
                    {comparisons.map((c) => (
                      <li key={c.slug}>
                        <Link
                          href={`/compare/${c.slug}`}
                          className="flex items-center justify-between gap-3 rounded-card border border-line px-5 py-4 font-heading font-bold text-ink hover:border-ink-soft transition-colors duration-150"
                        >
                          <span>
                            {c.a.name} <span className="text-muted font-semibold">vs</span> {c.b.name}
                          </span>
                          <ArrowRight className="w-4 h-4 text-ink-soft shrink-0" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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

      </main>
      <Footer />
    </div>
  );
}
