import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';

export const metadata: Metadata = {
  title: 'Carbon, FairMoney, or Renmoney: Best Solar Loans in Nigeria 2026',
  description: 'Compare the best solar financing options in Nigeria — Carbon, FairMoney, Renmoney, Solar Pay-As-You-Go schemes, and bank loans. Find out which works for your budget.',
  keywords: ['solar loan Nigeria', 'solar financing Nigeria', 'pay as you go solar Nigeria', 'Carbon solar loan', 'FairMoney solar loan'],
  openGraph: {
    title: 'Best Solar Loans in Nigeria 2026 — Carbon, FairMoney & More',
    description: 'Compare solar financing options in Nigeria to fund your solar installation.',
    url: 'https://solarbuilders.ng/blog/solar-loans-nigeria',
    type: 'article',
  },
  alternates: { canonical: 'https://solarbuilders.ng/blog/solar-loans-nigeria' },
};

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
          <span>March 2026</span>
          <span>·</span>
          <span>7 min read</span>
        </div>

        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 text-lg leading-relaxed mb-6">
            The biggest barrier to solar in Nigeria isn&apos;t technology or availability — it&apos;s upfront cost. A decent 3.5kVA system costs ₦700,000–₦1,000,000. Most middle-class Nigerian families don&apos;t have that sitting in a savings account. The good news: the financing options have improved significantly.
          </p>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Option 1: Fintech personal loans (Carbon, FairMoney, Renmoney)</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            These platforms offer instant personal loans with no collateral — just your BVN, employment details, and sometimes a salary account. Rates are high but access is fast.
          </p>
          <div className="space-y-4 mb-6">
            {[
              {
                name: 'Carbon (formerly Paylater)',
                rate: '2–5% monthly',
                limit: 'Up to ₦2,000,000',
                term: '3–12 months',
                pros: 'Instant approval, clean app, flexible repayment',
                cons: 'High interest rate; not specifically for solar',
              },
              {
                name: 'FairMoney',
                rate: '2.5–4.5% monthly',
                limit: 'Up to ₦1,500,000',
                term: '3–18 months',
                pros: 'Quick disbursement, good for salaried earners',
                cons: 'Shorter terms mean higher monthly payments',
              },
              {
                name: 'Renmoney',
                rate: '2–3.5% monthly',
                limit: 'Up to ₦6,000,000',
                term: '3–24 months',
                pros: 'Higher loan amounts, longer terms, lower rates than others',
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

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Option 2: Solar-specific PAYG (Pay-As-You-Go) schemes</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            These companies install the system and you pay monthly — like a utility bill. When you&apos;ve paid the total cost, you own the system outright. The panel stays, the meter goes.
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            Providers operating in Nigeria include Arnergy Solar, Rensource, and d.light. Monthly payments typically start at ₦15,000–₦50,000 depending on system size. The downside: you don&apos;t choose your installer, so you get whatever system they&apos;ve standardized on.
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
            Bank loans are cheaper but slower — expect 2–4 weeks for approval vs same-day for fintech. Worth it if you can wait.
          </p>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Option 4: Installer payment plans</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Many verified builders on SolarBuilders.ng offer their own payment plans — typically 30–50% upfront, with the balance over 3–6 months. No interest, no paperwork. Just trust.
          </p>
          <p className="text-slate-600 leading-relaxed mb-6">
            This only works with builders you trust and verify. Using the Nexprove Verified badge is your protection — these builders have been vetted and have reputations to protect.
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
                  ['Need money in 24 hours', 'Carbon or FairMoney'],
                  ['Salaried employee, can wait 2 weeks', 'Bank loan (cheapest)'],
                  ['Want zero-hassle, no upfront', 'PAYG scheme'],
                  ['Trust your builder, good relationship', 'Installer payment plan'],
                  ['Diaspora funding family back home', 'Pay builder directly (build relationship first)'],
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
            Our solution: only deal with builders who have been independently verified. The Nexprove badge on SolarBuilders.ng means we&apos;ve done the vetting work for you.
          </p>
        </div>

        <div className="mt-16 bg-slate-900 rounded-2xl p-10 text-center">
          <h3 className="font-heading font-extrabold text-white text-2xl mb-3">
            Know your system size before you apply for a loan
          </h3>
          <p className="text-slate-400 mb-6">Use our free calculator to get accurate cost estimates.</p>
          <Link
            href="/calculator"
            className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold rounded-full px-6 py-3 transition-all"
          >
            Calculate My System →
          </Link>
        </div>
      </article>
      <Footer />
    </div>
  );
}
