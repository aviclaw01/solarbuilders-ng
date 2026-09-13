import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { HEADLINE_PACKAGES, PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { formatNaira } from '@/lib/quote';

export const metadata: Metadata = {
  title: 'Carbon, FairMoney, or Renmoney: Best Solar Loans in Nigeria 2026',
  description: 'Compare solar financing options in Nigeria — Carbon, FairMoney, Renmoney, PAYG schemes and bank loans — with real monthly repayment maths for a ₦3.8M 5kVA/10kWh lithium system and a ₦2M starter (September 2026 prices).',
  keywords: ['solar loan Nigeria', 'solar financing Nigeria', 'pay as you go solar Nigeria', 'Carbon solar loan', 'FairMoney solar loan'],
  openGraph: {
    title: 'Best Solar Loans in Nigeria 2026 — Carbon, FairMoney & More',
    description: 'Compare solar financing options in Nigeria to fund your solar installation.',
    url: 'https://solarbuildersng.com/blog/solar-loans-nigeria',
    type: 'article',
  },
  alternates: { canonical: 'https://solarbuildersng.com/blog/solar-loans-nigeria' },
};

const starter = HEADLINE_PACKAGES[0]; // 1.5–2.5kVA · 5kWh lithium
const family = HEADLINE_PACKAGES[2]; // 5kVA · 10kWh lithium

export default function SolarLoansPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <article className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-8">
          <Link href="/" className="hover:text-slate-900">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-slate-900">Blog</Link>
          <span>/</span>
          <span className="text-slate-900">Solar Loans Nigeria</span>
        </div>

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
            The biggest barrier to solar in Nigeria isn&apos;t technology or availability — it&apos;s upfront cost. As of {PRICES_LAST_UPDATED_LABEL}, a {family.label} system for a family home with one AC costs {formatNaira(family.low)}–{formatNaira(family.high)} installed, and even a {starter.label} starter (lights, fans, TV, fridge) is {formatNaira(starter.low)}–{formatNaira(starter.high)}. Most middle-class Nigerian families don&apos;t have that sitting in a savings account. The good news: the financing options have improved, and a proper itemised quote makes applying much easier.
          </p>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">First: get a quote a lender can read</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Every lender below will ask what the money is for and how much you need. &quot;Solar, about ₦4 million&quot; is a weak answer. An itemised quote — inverter, battery modules, panels, mounting and protection, labour, each with a price — is a strong one. Our <Link href="/calculator" className="text-amber-600 font-semibold hover:underline">calculator</Link> produces exactly that, with a quote code and a PDF you can attach to a loan application or show a bank officer. Build the quote first, then borrow the number on it, not a guess.
          </p>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Option 1: Fintech personal loans (Carbon, FairMoney, Renmoney)</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            These platforms offer personal loans with no collateral — just your BVN, employment details, and sometimes a salary account. Rates are high but access is fast.
          </p>
          <div className="space-y-4 mb-6">
            {[
              {
                name: 'Carbon (formerly Paylater)',
                rate: '2–5% monthly',
                limit: 'Up to ₦2,000,000',
                term: '3–12 months',
                pros: 'Instant approval, clean app, flexible repayment',
                cons: 'High interest rate; limit covers a starter system, not a 5kVA/10kWh build on its own',
              },
              {
                name: 'FairMoney',
                rate: '2.5–4.5% monthly',
                limit: 'Up to ₦1,500,000',
                term: '3–18 months',
                pros: 'Quick disbursement, good for salaried earners',
                cons: 'Shorter terms mean higher monthly payments; limit is below most full-system quotes',
              },
              {
                name: 'Renmoney',
                rate: '2–3.5% monthly',
                limit: 'Up to ₦6,000,000',
                term: '3–24 months',
                pros: 'Higher loan amounts, longer terms, lower rates than others — the only fintech here that covers a 5kVA/10kWh system outright',
                cons: 'Stricter qualification, slower approval',
              },
            ].map(option => (
              <div key={option.name} className="bg-white border border-slate-100 rounded-2xl p-6">
                <h3 className="font-heading font-bold text-slate-900 text-lg mb-3">{option.name}</h3>
                <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-slate-500 text-xs mb-1">Rate</p>
                    <p className="font-semibold text-slate-900">{option.rate}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-slate-500 text-xs mb-1">Limit</p>
                    <p className="font-semibold text-slate-900">{option.limit}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-slate-500 text-xs mb-1">Term</p>
                    <p className="font-semibold text-slate-900">{option.term}</p>
                  </div>
                </div>
                <div className="text-sm space-y-1">
                  <p><span className="text-emerald-600 font-semibold">Pros:</span> <span className="text-slate-600">{option.pros}</span></p>
                  <p><span className="text-red-500 font-semibold">Cons:</span> <span className="text-slate-600">{option.cons}</span></p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">What the repayments actually look like</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Two systems, priced from our calculator at {PRICES_LAST_UPDATED_LABEL} rates: a <strong>₦3,800,000</strong> 5kVA / 10kWh lithium family system (mid-range of {formatNaira(family.low)}–{formatNaira(family.high)}) and a <strong>₦2,000,000</strong> 5kWh lithium starter. The illustrations below use flat monthly interest on the original principal, which is how most Nigerian fintech loans are quoted — always confirm the lender&apos;s own repayment schedule, as reducing-balance loans cost less.
          </p>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border border-slate-100 rounded-2xl overflow-hidden">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left p-4 font-heading font-semibold">Loan</th>
                  <th className="text-left p-4 font-heading font-semibold">Rate × term</th>
                  <th className="text-left p-4 font-heading font-semibold">Total repaid</th>
                  <th className="text-left p-4 font-heading font-semibold">Per month</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['₦3.8M system — fintech (Carbon/FairMoney-style)', '3%/mo × 12 months', '₦5,168,000', '₦430,667'],
                  ['₦3.8M system — Renmoney', '2.5%/mo × 24 months', '₦6,080,000', '₦253,333'],
                  ['₦3.8M system — bank loan, ₦3M cap + ₦800k cash', '2%/mo × 24 months on ₦3M', '₦4,440,000', '₦185,000'],
                  ['₦2M starter — fintech', '3%/mo × 12 months', '₦2,720,000', '₦226,667'],
                  ['₦2M starter — Renmoney', '2.5%/mo × 18 months', '₦2,900,000', '₦161,111'],
                ].map(([loan, terms, total, monthly]) => (
                  <tr key={loan} className="border-t border-slate-100">
                    <td className="p-4 text-slate-600">{loan}</td>
                    <td className="p-4 text-slate-600">{terms}</td>
                    <td className="p-4 text-slate-900">{total}</td>
                    <td className="p-4 font-semibold text-amber-600">{monthly}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-slate-600 leading-relaxed mb-6">
            The comparison that matters: a Lagos household running a generator 6 hours a day spends roughly ₦260,000 a month on fuel and servicing. A 24-month Renmoney repayment on the full family system is about the same as that fuel bill — and when the loan ends, the system keeps running for a decade on lithium. The 12-month fintech route is faster but the monthly figure is heavy; it suits the ₦2M starter far better than the ₦3.8M build.
          </p>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Option 2: Solar-specific PAYG (Pay-As-You-Go) schemes</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            These companies install the system and you pay monthly — like a utility bill. When you&apos;ve paid the total cost, you own the system outright.
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            Providers operating in Nigeria include Arnergy Solar, Rensource, and d.light. Monthly payments typically start at ₦15,000–₦50,000 depending on system size. The downside: you don&apos;t choose the equipment, so you get whatever system they&apos;ve standardised on, and the total paid over the term is usually well above the cash price.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-amber-800 text-sm font-semibold">PAYG caveat: You&apos;re locked into their ecosystem. If the company folds, your system support could disappear. Stick to established providers with proven track records.</p>
          </div>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Option 3: Bank loans</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Several Nigerian banks offer specific solar loans at lower rates than fintech:
          </p>
          <ul className="space-y-2 text-slate-600 mb-6 list-disc list-inside">
            <li><strong>Access Bank Solar Loan:</strong> ~2% monthly, up to ₦3M, 12–36 months</li>
            <li><strong>GTBank Energy Loan:</strong> Competitive rates for salaried GTBank customers</li>
            <li><strong>Stanbic IBTC Solar Loan:</strong> Good rates for employed individuals</li>
          </ul>
          <p className="text-slate-600 leading-relaxed mb-6">
            Bank loans are cheaper but slower — expect 2–4 weeks for approval vs same-day for fintech. Worth it if you can wait. Note the ₦3M cap: on a ₦3.8M system you would cover the balance in cash, which is where the quote PDF earns its keep — the bank sees exactly what the ₦3M buys. Banks in particular want an itemised, dated quote from a named supplier, so attach the PDF.
          </p>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Option 4: Staged payment on the build</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Not a loan, but it changes how much you need to borrow. A solar build is naturally staged: equipment has to be paid for before it is delivered, labour is paid on commissioning. Deposit-plus-balance is the normal structure, and it means the last part of the money is only due once the system is running.
          </p>
          <p className="text-slate-600 leading-relaxed mb-6">
            Combine that with a smaller loan — for example, borrow the equipment portion and pay labour and balance from salary a month later — and the monthly figures above come down. Never pay 100% upfront to anyone, financed or not.
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
                  ['Need money in 24 hours, starter system (≤ ₦2M)', 'Carbon or FairMoney'],
                  ['Full 5kVA/10kWh system, want one loan for all of it', 'Renmoney (24 months)'],
                  ['Salaried employee, can wait 2–4 weeks', 'Bank loan (cheapest) + cash for the balance'],
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
            If someone offers you solar with &quot;zero upfront, unlimited payment plan&quot; from an unknown company — run. Solar scams in Nigeria typically follow one of three patterns:
          </p>
          <ul className="space-y-2 text-slate-600 mb-6 list-disc list-inside">
            <li>Collecting upfront payment then disappearing before installation</li>
            <li>Installing underspec equipment (cheap batteries, fake brand panels)</li>
            <li>Inflating system size recommendations to charge more</li>
          </ul>
          <p className="text-slate-600 leading-relaxed">
            A priced, itemised quote is your defence against all three: you know what each part should cost (see current vendor prices on our <Link href="/brands" className="text-amber-600 font-semibold hover:underline">brands page</Link>), you know the size your appliances actually need, and there is no lump sum to hide behind. When we manage a build, we confirm every line against current stock and use installers we have <Link href="/verified" className="text-amber-600 font-semibold hover:underline">already vetted</Link>.
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
      <Footer />
    </div>
  );
}
