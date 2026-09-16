import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { formatNaira, formatNairaShort } from '@/lib/quote';
import { getScenario, scenarioQuote } from '@/lib/sizing';
import { generatorCostPerDay } from '@/lib/energy-costs';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Carbon, FairMoney, or Renmoney: Best Solar Loans in Nigeria 2026',
  description:
    'Compare solar financing options in Nigeria — fintech personal loans, bank loans, PAYG schemes and staged payment — with repayment maths run against two real, computed system prices (September 2026).',
  keywords: ['solar loan Nigeria', 'solar financing Nigeria', 'pay as you go solar Nigeria', 'Carbon solar loan', 'FairMoney solar loan'],
  openGraph: {
    title: 'Best Solar Loans in Nigeria 2026 — Carbon, FairMoney & More | SolarBuilders.ng',
    description: 'Compare solar financing options in Nigeria to fund your solar installation.',
    url: `${SITE_URL}/blog/solar-loans-nigeria`,
    type: 'article',
  },
  alternates: { canonical: `${SITE_URL}/blog/solar-loans-nigeria` },
};

/**
 * Flat monthly interest on the original principal — how Nigerian fintech
 * personal loans are normally quoted (reducing-balance loans cost less than
 * this). The rate itself is not something we hold a published source for —
 * it varies by lender and by applicant — so it is named as an illustrative
 * range rather than presented as fact, the same way GENSET_HOURS_PER_DAY_ASSUMED
 * is named in lib/energy-costs.ts.
 */
const ILLUSTRATIVE_FLAT_RATE_PCT = { low: 2, high: 3 };

function flatLoan(principal: number, monthlyRatePct: number, months: number) {
  const total = Math.round(principal * (1 + (monthlyRatePct / 100) * months));
  return { total, monthly: Math.round(total / months) };
}

export default function SolarLoansPage() {
  // Same two loads used elsewhere on the site — the 3-bedroom-flat Standard
  // build is the "family" worked example on the payback and generator pages,
  // and the essentials build is the "starter" case on the payback page. Using
  // the same scenarios here means this page cannot quietly disagree with them.
  const familyScenario = getScenario('how-many-solar-panels-for-3-bedroom-flat')!;
  const family = scenarioQuote(familyScenario).tiers.standard;
  const starterScenario = getScenario('solar-for-lights-fans-and-tv-only')!;
  const starter = scenarioQuote(starterScenario).tiers.standard;

  const gen = generatorCostPerDay(6);
  const genMonthly = { low: gen.low * 30, high: gen.high * 30 };

  const familyLoans = [
    { label: `Fintech personal loan, 12 months`, ...flatLoan(family.total.best, ILLUSTRATIVE_FLAT_RATE_PCT.high, 12) },
    { label: `Fintech personal loan, 24 months`, ...flatLoan(family.total.best, ILLUSTRATIVE_FLAT_RATE_PCT.low, 24) },
  ];
  const starterLoans = [
    { label: `Fintech personal loan, 12 months`, ...flatLoan(starter.total.best, ILLUSTRATIVE_FLAT_RATE_PCT.high, 12) },
    { label: `Fintech personal loan, 18 months`, ...flatLoan(starter.total.best, ILLUSTRATIVE_FLAT_RATE_PCT.low, 18) },
  ];

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: 'Carbon, FairMoney, or Renmoney: Best Solar Loans in Nigeria 2026',
    description:
      'Solar financing options in Nigeria compared, with repayment maths run against two real, computed system prices.',
    author: { '@type': 'Organization', name: 'SolarBuilders.ng' },
    publisher: { '@type': 'Organization', name: 'SolarBuilders.ng' },
    datePublished: '2026-03-01',
    dateModified: '2026-09-16',
    url: `${SITE_URL}/blog/solar-loans-nigeria`,
  };

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <Navbar />
      <main>
      <article className="max-w-3xl mx-auto px-6 py-16">
        <Breadcrumbs trail={[{ href: '/blog', label: 'Blog' }, { label: 'Solar loans Nigeria' }]} className="mb-8" />

        <div className="mb-4">
          <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full border border-amber-200">Financing</span>
        </div>
        <h1 className="font-heading font-extrabold text-slate-900 text-4xl md:text-5xl leading-tight mb-4">
          Carbon, FairMoney, or Renmoney: Best Solar Loans in Nigeria
        </h1>
        <div className="flex items-center gap-4 text-slate-400 text-sm mb-12 pb-8 border-b border-slate-100">
          <span>Updated {PRICES_LAST_UPDATED_LABEL}</span>
          <span>·</span>
          <span>8 min read</span>
        </div>

        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 text-lg leading-relaxed mb-6">
            The biggest barrier to solar in Nigeria isn&apos;t technology or availability — it&apos;s upfront cost. As
            of {PRICES_LAST_UPDATED_LABEL}, the Standard build for a {familyScenario.question.toLowerCase()} load
            costs {formatNaira(family.total.best)} installed, and a {starterScenario.question.toLowerCase()} load —
            lights, fans, TV, no AC — is {formatNaira(starter.total.best)}. Most middle-class Nigerian families
            don&apos;t have that sitting in a savings account. The good news: the financing options have improved,
            and a proper itemised quote makes applying much easier.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-amber-800 text-sm">
              A note on the numbers below: the two system prices are computed by our quote engine from{' '}
              {PRICES_LAST_UPDATED_LABEL} Nigerian vendor listings. The lender rates, limits and terms are not — no
              lender publishes a single national rate, and we do not hold a sourced figure for any of them. Where we
              can&apos;t cite a number we have described the product qualitatively instead and told you to get the
              live figure from the lender.
            </p>
          </div>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">First: get a quote a lender can read</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Every lender below will ask what the money is for and how much you need. &quot;Solar, a few million
            naira&quot; is a weak answer. An itemised quote — inverter, battery modules, panels, mounting and
            protection, labour, each with a price — is a strong one. Our{' '}
            <Link href="/calculator" className="text-amber-600 font-semibold hover:underline">calculator</Link>{' '}
            produces exactly that, with a quote code and a PDF you can attach to a loan application or show a bank
            officer. Build the quote first, then borrow the number on it, not a guess.
          </p>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Option 1: Fintech personal loans (Carbon, FairMoney, Renmoney)</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            These platforms offer personal loans with no collateral — just your BVN, employment details, and
            sometimes a salary account. Approval is fast and rates are high; both the rate you are actually offered
            and the limit you are approved for depend on your own risk profile, so treat anything below as a
            starting point for comparison, not a quote.
          </p>
          <div className="space-y-4 mb-6">
            {[
              {
                name: 'Carbon (formerly Paylater)',
                shape: 'Short terms, small-to-mid limits',
                pros: 'Instant in-app approval, flexible repayment, no collateral',
                cons: `Limits are usually enough for a ${starterScenario.question.toLowerCase()} build on their own, rarely a full family system — check your live limit in-app`,
              },
              {
                name: 'FairMoney',
                shape: 'Short terms, geared to salaried earners',
                pros: 'Quick disbursement, good for salary-account customers',
                cons: 'Shorter terms mean a heavier monthly payment for the same principal',
              },
              {
                name: 'Renmoney',
                shape: 'Longer terms, higher limits than the other two',
                pros: 'The fintech most likely to cover a full family system in one loan',
                cons: 'Stricter qualification, slower approval than Carbon or FairMoney',
              },
            ].map((option) => (
              <div key={option.name} className="bg-white border border-slate-100 rounded-2xl p-6">
                <h3 className="font-heading font-bold text-slate-900 text-lg mb-2">{option.name}</h3>
                <p className="text-slate-500 text-xs uppercase tracking-wide font-semibold mb-3">{option.shape}</p>
                <div className="text-sm space-y-1">
                  <p><span className="text-emerald-600 font-semibold">Pros:</span> <span className="text-slate-600">{option.pros}</span></p>
                  <p><span className="text-red-500 font-semibold">Cons:</span> <span className="text-slate-600">{option.cons}</span></p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">What the repayments actually look like</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Two systems, priced by our calculator at {PRICES_LAST_UPDATED_LABEL} rates: the{' '}
            {familyScenario.question.toLowerCase()} Standard build at {formatNaira(family.total.best)}, and the{' '}
            {starterScenario.question.toLowerCase()} build at {formatNaira(starter.total.best)}. The rows below use
            flat monthly interest on the original principal, at {ILLUSTRATIVE_FLAT_RATE_PCT.low}–
            {ILLUSTRATIVE_FLAT_RATE_PCT.high}% a month — an illustrative range for how Nigerian fintech personal
            loans are commonly quoted, not a rate any named lender has published to us. Confirm the lender&apos;s own
            schedule before borrowing; a reducing-balance loan costs less than flat interest on the same headline rate.
          </p>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border border-slate-100 rounded-2xl overflow-hidden">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left p-4 font-heading font-semibold">System</th>
                  <th className="text-left p-4 font-heading font-semibold">Loan</th>
                  <th className="text-left p-4 font-heading font-semibold">Total repaid</th>
                  <th className="text-left p-4 font-heading font-semibold">Per month</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ...familyLoans.map((l) => ({ system: `${formatNairaShort(family.total.best)} family system`, ...l })),
                  ...starterLoans.map((l) => ({ system: `${formatNairaShort(starter.total.best)} starter`, ...l })),
                ].map((row) => (
                  <tr key={`${row.system}-${row.label}`} className="border-t border-slate-100">
                    <td className="p-4 text-slate-600">{row.system}</td>
                    <td className="p-4 text-slate-600">{row.label}</td>
                    <td className="p-4 text-slate-900">{formatNaira(row.total)}</td>
                    <td className="p-4 font-semibold text-amber-600">{formatNaira(row.monthly)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-slate-600 leading-relaxed mb-6">
            The comparison that matters: a Lagos household whose generator runs 6 hours a day spends{' '}
            {formatNaira(genMonthly.low)}–{formatNaira(genMonthly.high)} a month on petrol alone — no oil, no
            servicing, no repairs, because we do not hold a reliable national figure for those (full working in{' '}
            <Link href="/blog/generator-vs-solar-lagos" className="text-amber-600 font-semibold hover:underline">
              generator vs solar in Lagos
            </Link>
            ). A 24-month loan on the family system above sits inside that same monthly range — and once it is repaid
            the fuel bill stops for good while the system keeps running on lithium for a decade or more.
          </p>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Option 2: Solar-specific PAYG (Pay-As-You-Go) schemes</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            These companies install the system and you pay monthly — like a utility bill. When you&apos;ve paid the
            total cost, you own the system outright.
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            Providers operating in Nigeria include Arnergy Solar, Rensource, and d.light. The monthly payment is sized
            to the specific system they install for you, so we cannot quote a national figure here — ask for the full
            repayment schedule before you sign, and compare the total paid over the term against the cash price of an
            equivalent system from our calculator. The downside beyond price: you don&apos;t choose the equipment, so
            you get whatever system they&apos;ve standardised on.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-amber-800 text-sm font-semibold">PAYG caveat: You&apos;re locked into their ecosystem. If the company folds, your system support could disappear. Stick to established providers with proven track records.</p>
          </div>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Option 3: Bank loans</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Several Nigerian banks — Access, GTBank and Stanbic IBTC among them — offer named solar or energy loans,
            generally at lower rates than fintech personal loans but slower to approve (weeks, not the same day) and
            usually capped below a full system price for an unsecured facility. We do not hold a sourced, current
            rate or cap for any of them — ask your own bank for its live terms rather than assuming ours.
          </p>
          <p className="text-slate-600 leading-relaxed mb-6">
            If your bank&apos;s cap is below the system price, the gap is where the quote PDF earns its keep — the
            loan officer sees exactly what the capped amount buys, and you cover the balance in cash or with a
            smaller top-up loan. Banks in particular want an itemised, dated quote from a named supplier, so attach
            the PDF.
          </p>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Option 4: Staged payment on the build</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Not a loan, but it changes how much you need to borrow. A solar build is naturally staged: equipment has
            to be paid for before it is delivered, labour is paid on commissioning. Deposit-plus-balance is the
            normal structure, and it means the last part of the money is only due once the system is running.
          </p>
          <p className="text-slate-600 leading-relaxed mb-6">
            Combine that with a smaller loan — for example, borrow the equipment portion and pay labour and balance
            from salary a month later — and the monthly figures above come down. Never pay 100% upfront to anyone,
            financed or not.
          </p>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Which option should I choose?</h2>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border border-slate-100 rounded-2xl overflow-hidden">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left p-4 font-heading font-semibold">Your situation</th>
                  <th className="text-left p-4 font-heading font-semibold">Best option</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [`Need money fast, ${starterScenario.question.toLowerCase()} build`, 'Carbon or FairMoney'],
                  ['Full family system, want one loan for all of it', 'Renmoney, or whichever fintech quotes the longest term'],
                  ['Salaried employee, can wait 2–4 weeks', 'Bank loan (cheapest) + cash or a top-up loan for the balance'],
                  ['Want zero-hassle, no upfront', 'PAYG scheme'],
                  ['Want to borrow less', 'Smaller loan + staged payment on the build'],
                  ['Diaspora funding family back home', 'Build the quote, send us the quote code on WhatsApp — we manage the build'],
                ].map(([situation, option]) => (
                  <tr key={situation} className="border-t border-slate-100">
                    <td className="p-4 text-slate-600">{situation}</td>
                    <td className="p-4 font-semibold text-slate-900">{option}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Watch out for solar scams</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            If someone offers you solar with &quot;zero upfront, unlimited payment plan&quot; from an unknown
            company — run. Solar scams in Nigeria typically follow one of three patterns:
          </p>
          <ul className="space-y-2 text-slate-600 mb-6 list-disc list-inside">
            <li>Collecting upfront payment then disappearing before installation</li>
            <li>Installing underspec equipment (cheap batteries, fake brand panels)</li>
            <li>Inflating system size recommendations to charge more</li>
          </ul>
          <p className="text-slate-600 leading-relaxed">
            A priced, itemised quote is your defence against all three: you know what each part should cost (see
            current vendor prices on our <Link href="/brands" className="text-amber-600 font-semibold hover:underline">brands page</Link>),
            you know the size your appliances actually need, and there is no lump sum to hide behind. When we manage
            a build, we confirm every line against current stock and use installers we have{' '}
            <Link href="/verified" className="text-amber-600 font-semibold hover:underline">already vetted</Link>.
          </p>
        </div>

        <div className="mt-16 bg-slate-900 rounded-2xl p-10 text-center">
          <h3 className="font-heading font-extrabold text-white text-2xl mb-3">
            Get the quote before you apply for the loan
          </h3>
          <p className="text-slate-400 mb-6">Itemised, priced at {PRICES_LAST_UPDATED_LABEL} rates, downloadable as a PDF for your lender.</p>
          <Link
            href="/calculator"
            className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold rounded-full px-6 py-3 transition-all"
          >
            Get an itemised quote →
          </Link>
        </div>
      </article>
      </main>
      <Footer />
    </div>
  );
}
