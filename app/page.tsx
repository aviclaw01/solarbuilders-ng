import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { BRANDS, comparisonPairs, manufacturers, vendors } from '@/lib/brands';
import { HEADLINE_PACKAGES, PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { formatNairaShort } from '@/lib/quote';
import {
  ArrowRight,
  Check,
  X,
  ListChecks,
  ReceiptText,
  Wrench,
  Plane,
} from 'lucide-react';
import CountdownCTA from '@/components/ui/CountdownCTA';
import LeadCaptureModal from '@/components/ui/LeadCaptureModal';

/** Verifiable facts about our own research — no invented totals. */
const PRICED_PRODUCTS = BRANDS.reduce((n, b) => n + b.products.length, 0);

export const metadata: Metadata = {
  title: "Real Nigerian Solar Prices — And We Buy It For You | SolarBuilders.ng",
  description: `We publish what solar actually costs in Nigeria (Felicity, Deye, Growatt, Jinko — real listings, ${PRICES_LAST_UPDATED_LABEL}). Size your system free, then we order the equipment and put a vetted installer on the job in Lagos, Abuja, Port Harcourt and beyond.`,
  alternates: { canonical: 'https://solarbuildersng.com' },
};

/**
 * The homepage has one job: get someone a kit. The hero CTA opens /find (three
 * taps to a priced kit); the calculator stays the detailed path.
 *
 * It used to offer three "ways to use this site", a tabbed carousel, four
 * feature cards and five separate CTAs to four destinations. Every one of those
 * is a decision put in front of a person who came to find out a price. Now
 * there is one primary action, repeated, and everything else on the page is a
 * reason to take it. Shop, brands and budget are still one tap away in the nav.
 */
const PRIMARY_CTA = 'Get my solar quote';

/** Homes like yours — the four residential headline packages, straight from lib/prices. */
const HOME_PACKAGES = HEADLINE_PACKAGES.slice(0, 4);

const STEPS = [
  {
    icon: ListChecks,
    title: 'Tell us what you run',
    body: 'Tick your appliances — fridge, fans, an AC. No kVA maths, no technical questions.',
  },
  {
    icon: ReceiptText,
    title: 'See every part, priced',
    body: 'Inverter, battery, panels and installation, each at a real Nigerian price with the date we checked it.',
  },
  {
    icon: Wrench,
    title: 'We buy it and build it',
    body: 'We order the kit, put a vetted installer on the job and get the warranty into your name.',
  },
];

const WITHOUT = [
  'Prices hidden until the last minute',
  'Unknown contractor credentials',
  'Five WhatsApp threads going at once',
  'Warranty? Good luck.',
];

const WITH = [
  'Published prices, each with a source and date',
  'Equipment ordered for you at the quoted price',
  'A vetted installer we put on the job',
  'One company answerable to you',
];

export default function HomePage() {
  const stats = [
    { stat: String(PRICED_PRODUCTS), label: 'Prices tracked, each with a date' },
    { stat: String(manufacturers().length), label: 'Brands priced and compared' },
    { stat: String(vendors().length), label: 'Nigerian sellers monitored' },
    { stat: String(comparisonPairs().length), label: 'Head-to-head comparisons' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        {/* ──────────────── HERO ──────────────── */}
        <section className="relative overflow-hidden px-4 sm:px-6 pt-14 pb-20 md:pt-24 md:pb-28">
          {/* The rising sun: the page's one decorative moment. */}
          <div
            aria-hidden="true"
            className="sun-arc w-[520px] -right-[260px] -top-[180px] md:w-[760px] md:-right-[180px] md:-top-[300px] opacity-70 md:opacity-100"
          />
          <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-16 items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft mb-6">
                <span className="w-2 h-2 rounded-full bg-leaf" aria-hidden="true" />
                Prices checked {PRICES_LAST_UPDATED_LABEL}
              </p>
              <h1 className="font-heading font-extrabold text-ink text-display max-w-[13ch] mb-6">
                Find out what solar really costs your home
              </h1>
              <p className="text-lead text-muted max-w-[34rem] mb-9">
                Tell us what you run. In two minutes you get an itemised quote at real Nigerian prices. Then we buy
                the equipment at that price and put a vetted installer on the job.
              </p>
              <Link href="/find" className="btn btn-sun btn-lg w-full sm:w-auto">
                {PRIMARY_CTA}
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Link>
              <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
                {['Free', 'No sign-up', 'Real Nigerian prices'].map((item) => (
                  <li key={item} className="inline-flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-leaf" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* What homes pay — real ranges, so the price question is answered before the click. */}
            <div className="bg-white/90 backdrop-blur rounded-panel border border-line shadow-lift p-6 sm:p-8">
              <h2 className="font-heading font-bold text-ink text-lg">What Nigerian homes pay, installed</h2>
              <p className="text-sm text-muted mt-1 mb-5">Your quote is built from the appliances you actually run.</p>
              <ul className="divide-y divide-line">
                {HOME_PACKAGES.map((p) => (
                  <li key={p.label} className="py-3.5 flex items-start justify-between gap-4">
                    <span className="min-w-0">
                      <span className="block font-semibold text-ink text-[15px]">{p.powers}</span>
                      <span className="block text-xs text-muted mt-0.5">{p.label}</span>
                    </span>
                    <span className="font-heading font-bold text-ink text-[15px] whitespace-nowrap tabular-nums">
                      {formatNairaShort(p.low)}–{formatNairaShort(p.high)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ──────────────── HOW IT WORKS ──────────────── */}
        <section className="bg-sky px-4 sm:px-6 py-20 md:py-28">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-heading font-extrabold text-ink text-title max-w-[20ch] mb-4">
              Three steps, and only the first one is yours
            </h2>
            <p className="text-lead text-muted max-w-2xl mb-12 md:mb-16">
              Going solar in Nigeria shouldn&apos;t feel like a part-time job.
            </p>
            <ol className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {STEPS.map((step, i) => (
                <li key={step.title} className="bg-white rounded-card shadow-soft p-7">
                  <div className="flex items-center justify-between mb-8">
                    <span className="flex items-center justify-center w-12 h-12 rounded-control bg-sun-wash text-sun-ink">
                      <step.icon className="w-6 h-6" aria-hidden="true" />
                    </span>
                    <span className="font-heading font-extrabold text-4xl text-line tabular-nums" aria-hidden="true">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-ink text-xl mb-2">{step.title}</h3>
                  <p className="text-muted leading-relaxed">{step.body}</p>
                </li>
              ))}
            </ol>
            <div className="mt-12 flex flex-col sm:flex-row sm:items-center gap-4">
              <Link href="/calculator" className="btn btn-sun">
                Start step one
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <p className="text-sm text-muted">
                Nobody pays anything until we&apos;ve re-confirmed today&apos;s price with the distributor.
              </p>
            </div>
          </div>
        </section>

        {/* ──────────────── PRICE RESEARCH ──────────────── */}
        <section className="on-dark bg-ink px-4 sm:px-6 py-20 md:py-24">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-12 items-end">
            <div>
              <h2 className="font-heading font-extrabold text-white text-title mb-4">
                Every figure is a real listing with a date on it
              </h2>
              <p className="text-slate-300 leading-relaxed max-w-lg">
                Not estimates. The price on your quote is the price you pay for the kit.
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-px bg-white/10 rounded-card overflow-hidden">
              {stats.map((item) => (
                <div key={item.label} className="bg-ink p-6 flex flex-col-reverse">
                  <dt className="text-slate-400 text-sm leading-snug mt-1">{item.label}</dt>
                  <dd className="font-heading font-extrabold text-sun text-4xl md:text-5xl tracking-tight tabular-nums">
                    {item.stat}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ──────────────── BEFORE / AFTER ──────────────── */}
        <section className="px-4 sm:px-6 py-20 md:py-28">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-heading font-extrabold text-ink text-title text-center max-w-[18ch] mx-auto mb-12 md:mb-16">
              Stop managing five contractor WhatsApps
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-card bg-sky p-7 md:p-8">
                <h3 className="font-heading font-bold text-ink-soft text-lg mb-6">Going it alone</h3>
                <ul className="space-y-4">
                  {WITHOUT.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-muted">
                      <span className="mt-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 flex-shrink-0">
                        <X className="w-3 h-3 text-slate-600" aria-hidden="true" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-card bg-white border-2 border-sun p-7 md:p-8 shadow-soft">
                <h3 className="font-heading font-bold text-ink text-lg mb-6">With SolarBuilders</h3>
                <ul className="space-y-4">
                  {WITH.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-ink">
                      <span className="mt-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 flex-shrink-0">
                        <Check className="w-3 h-3 text-leaf" aria-hidden="true" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ──────────────── DIASPORA ──────────────── */}
        <section className="px-4 sm:px-6 pb-20 md:pb-28">
          <div className="max-w-5xl mx-auto rounded-panel bg-sun-wash p-8 md:p-12 flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
            <span className="flex items-center justify-center w-14 h-14 rounded-card bg-white text-sun-ink shadow-soft flex-shrink-0">
              <Plane className="w-7 h-7" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <h2 className="font-heading font-extrabold text-ink text-2xl md:text-3xl tracking-tight mb-2">
                Power the home you left behind
              </h2>
              <p className="text-ink-soft leading-relaxed max-w-2xl">
                Fund solar for family in Nigeria from the UK, US or Canada. We keep you updated over WhatsApp, with
                photos from site.
              </p>
            </div>
            <Link
              href="/calculator"
              className="focus-ring inline-flex items-center gap-1.5 font-heading font-bold text-ink underline decoration-sun-deep decoration-2 underline-offset-[6px] hover:decoration-ink whitespace-nowrap"
            >
              Quote for family <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* ──────────────── CLOSING CTA ──────────────── */}
        <CountdownCTA />

        <LeadCaptureModal />
      </main>
      <Footer />
    </div>
  );
}
