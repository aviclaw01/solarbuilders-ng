import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import { Phone, MapPin, MessageCircle } from 'lucide-react';
import { CONTACT_WHATSAPP, whatsappLink } from '@/lib/site';
import { PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { comparisonPairs } from '@/lib/brands';
import { getScenario } from '@/lib/sizing';

/**
 * The footer doubles as the site index: nav only carries three groups, so the
 * long tail (sizing questions, brand comparisons) lives here. That also spreads
 * internal links to the pages we want to rank.
 *
 * Popular links are resolved from data, so a renamed or removed page drops out
 * of the footer instead of becoming a dead link.
 *
 * This matters for crawling: the header's mega-menus only render their links
 * once opened, so those links are NOT in the static HTML. Every nav destination
 * must therefore also appear here, or search engines will never find it.
 */

const POPULAR_SIZING: { slug: string; label: string }[] = [
  { slug: 'what-size-inverter-for-1-5hp-ac', label: 'For a 1.5HP AC' },
  { slug: 'what-size-inverter-for-2hp-ac', label: 'For a 2HP AC' },
  { slug: 'how-many-solar-panels-for-2-bedroom-flat', label: 'For a 2-bedroom flat' },
  { slug: 'how-many-solar-panels-for-3-bedroom-flat', label: 'For a 3-bedroom flat' },
  { slug: 'what-can-a-5kva-inverter-run', label: 'What 5kVA runs' },
  { slug: 'solar-for-a-shop-in-nigeria', label: 'For a shop' },
].filter((entry) => getScenario(entry.slug));

const POPULAR_COMPARISONS = ['deye-vs-felicity', 'felicity-vs-growatt', 'jinko-vs-longi']
  .map((slug) => comparisonPairs().find((p) => p.slug === slug))
  .filter((p): p is NonNullable<typeof p> => Boolean(p));

const linkCls =
  'text-slate-400 hover:text-white transition-colors underline-offset-4 hover:underline block py-1.5 min-h-[32px]';

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-heading text-white font-semibold mb-3 text-sm">{title}</h2>
      <ul className="space-y-0.5 text-sm">{children}</ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-14 pb-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Brand + contact */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr] gap-10 mb-12">
          <div>
            <Logo variant="horizontal" size="md" colorMode="dark" />
            <p className="text-sm text-slate-400 leading-relaxed mt-4 mb-5">
              We publish what solar actually costs in Nigeria, then buy it for you at that price and put a vetted
              installer on the job.
            </p>
            <address className="not-italic text-sm text-slate-400 leading-relaxed mb-3">
              <span className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  11 Mogbonjubola St,
                  <br />
                  Gbagada, Lagos, Nigeria
                </span>
              </span>
            </address>
            <a
              href={`tel:+${CONTACT_WHATSAPP}`}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-amber-400 transition-colors min-h-[40px]"
            >
              <Phone className="w-4 h-4 text-amber-400 flex-shrink-0" />
              +234 916 839 4923
            </a>
            <a
              href={whatsappLink('Hi SolarBuilders, I have a question about going solar.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#128C7E] hover:bg-[#0E7568] text-white text-sm font-semibold px-4 py-2.5 rounded-full mt-3 transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> Message us
            </a>
          </div>

          <Column title="Shop">
            <li><Link href="/shop" className={linkCls}>All equipment</Link></li>
            <li><Link href="/shop?cat=inverter" className={linkCls}>Inverters</Link></li>
            <li><Link href="/shop?cat=battery" className={linkCls}>Batteries</Link></li>
            <li><Link href="/shop?cat=panel" className={linkCls}>Solar panels</Link></li>
            <li><Link href="/shop?cat=package" className={linkCls}>Complete packages</Link></li>
            <li><Link href="/cart" className={linkCls}>Your order</Link></li>
          </Column>

          <Column title="What size do I need?">
            <li><Link href="/calculator" className={linkCls}>Size my system</Link></li>
            {POPULAR_SIZING.map((entry) => (
              <li key={entry.slug}>
                <Link
                  href={`/sizing/${entry.slug}`}
                 
                  className={linkCls}
                  title={getScenario(entry.slug)?.question}
                >
                  {entry.label}
                </Link>
              </li>
            ))}
            <li><Link href="/sizing" className={linkCls}>All sizing guides</Link></li>
            <li><Link href="/budget" className={linkCls}>What my budget buys</Link></li>
          </Column>

          <Column title="Prices">
            <li><Link href="/brands" className={linkCls}>Prices by brand</Link></li>
            {POPULAR_COMPARISONS.map((p) => (
              <li key={p.slug}>
                <Link href={`/compare/${p.slug}`} className={linkCls}>
                  {p.a.name.split(' ')[0]} vs {p.b.name.split(' ')[0]}
                </Link>
              </li>
            ))}
            <li><Link href="/compare" className={linkCls}>All comparisons</Link></li>
            <li><Link href="/blog/solar-cost-nigeria-2026" className={linkCls}>What a system costs</Link></li>
          </Column>

          <Column title="Company">
            <li><Link href="/how-it-works" className={linkCls}>How it works</Link></li>
            <li><Link href="/faq" className={linkCls}>FAQs</Link></li>
            <li><Link href="/verified" className={linkCls}>How we vet installers</Link></li>
            <li><Link href="/blog" className={linkCls}>Solar guides</Link></li>
            <li><Link href="/about" className={linkCls}>Our story</Link></li>
            <li><Link href="/contact" className={linkCls}>Contact</Link></li>
            <li><Link href="/for-builders" className={linkCls}>Work with us</Link></li>
          </Column>
        </div>

        {/* Honesty strip — the two things people most need to know */}
        <div className="border-t border-white/10 pt-6 grid gap-3 sm:grid-cols-2 mb-6">
          <p className="text-sm text-slate-400">
            <span className="text-slate-300 font-medium">Prices checked {PRICES_LAST_UPDATED_LABEL}.</span>{' '}
            Every figure is a real Nigerian listing with the date we saw it. We re-confirm before you pay anyone.
          </p>
          <p className="text-sm text-slate-400 sm:text-right">
            <span className="text-slate-300 font-medium">No card payments on this site.</span>{' '}
            You pay the market price; our margin comes from our trade terms, not a mark-up on you.
          </p>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} SolarBuilders.ng · Built by{' '}
            <a
              href="https://www.nexprove.com"
              className="text-amber-400 hover:underline underline-offset-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              Nexprove
            </a>
          </p>
          <p className="text-sm text-slate-400">Real solar prices &amp; quotes for Nigeria</p>
        </div>
      </div>
    </footer>
  );
}
