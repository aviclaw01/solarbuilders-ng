import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';

export const metadata: Metadata = {
  title: 'How Much Does Solar Cost in Nigeria? (2026 Guide) — SolarBuilders.ng',
  description: 'Complete 2026 guide to solar installation costs in Nigeria. From budget 2kVA systems (₦350k) to full 10kVA solutions (₦1.5M+). Real prices from verified installers.',
  keywords: ['solar cost Nigeria 2026', 'solar price Nigeria', 'how much solar cost Nigeria', 'solar installation price Lagos'],
  openGraph: {
    title: 'How Much Does Solar Cost in Nigeria? (2026 Guide)',
    description: 'Complete breakdown of solar prices in Nigeria — from budget to premium.',
    url: 'https://solarbuilders.ng/blog/solar-cost-nigeria-2026',
    type: 'article',
  },
  alternates: { canonical: 'https://solarbuilders.ng/blog/solar-cost-nigeria-2026' },
};

export default function SolarCostNigeriaPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <article className="max-w-3xl mx-auto px-4 py-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#64748B] mb-8">
          <Link href="/" className="hover:text-[#0A0F1E]">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-[#0A0F1E]">Blog</Link>
          <span>/</span>
          <span className="text-[#0A0F1E]">Solar Cost Nigeria 2026</span>
        </div>

        <span className="inline-block bg-[#FEF3C7] text-[#0A0F1E] text-xs font-heading font-semibold px-3 py-1 rounded-full mb-6">
          Costs & Pricing
        </span>

        <h1 className="font-heading font-extrabold text-[#0A0F1E] text-4xl md:text-5xl leading-tight mb-6">
          How Much Does Solar Cost in Nigeria? (2026 Guide)
        </h1>

        <div className="flex items-center gap-4 text-[#94A3B8] text-sm mb-12 pb-8 border-b border-[#E2E8F0]">
          <span>March 2026</span>
          <span>·</span>
          <span>6 min read</span>
          <span>·</span>
          <span>By SolarBuilders.ng</span>
        </div>

        <div className="prose-content space-y-6 text-[#0A0F1E]">
          <p className="text-xl text-[#64748B] leading-relaxed">
            The most common question we get on SolarBuilders.ng is: "How much will solar cost me?" The honest answer is: it depends. But this guide will give you real numbers, not vague estimates.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Quick Price Summary (2026)</h2>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">System Size</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Best For</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Price Range</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['1–2 kVA', 'Lights, fans, phone charging', '₦150,000 – ₦350,000'],
                  ['3 kVA', 'Average home (no AC)', '₦380,000 – ₦600,000'],
                  ['5 kVA', 'Home with 1 AC unit', '₦650,000 – ₦950,000'],
                  ['7.5–10 kVA', 'Large home or small office', '₦900,000 – ₦1,500,000'],
                  ['15–20 kVA', 'Commercial / business', '₦1,800,000 – ₦3,500,000'],
                ].map(([size, use, price], i) => (
                  <tr key={i} className={`border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
                    <td className="p-4 font-heading font-semibold text-[#0A0F1E]">{size}</td>
                    <td className="p-4 text-[#64748B]">{use}</td>
                    <td className="p-4 font-semibold text-[#F59E0B]">{price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">What&apos;s Included in These Prices?</h2>
          <p className="text-[#64748B] leading-relaxed">
            A complete solar installation in Nigeria typically includes four components: the inverter (the brain), solar panels (the energy source), batteries (the storage), and installation labour. When you see a quoted price from a verified installer on SolarBuilders.ng, it should include all four unless stated otherwise.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Be careful of quotes that seem too cheap — they often exclude batteries (the most expensive component) or use substandard brands. Always ask: "Does this price include everything, installed?"
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">What Drives the Price Up?</h2>
          <ul className="space-y-3 text-[#64748B]">
            {[
              'Battery type: Lead-acid batteries are cheaper but lithium batteries last 3× longer',
              'Panel brand: Tier 1 panels (Longi, JA Solar) cost more but perform better',
              'Location: Lagos and Abuja tend to have higher installation costs than other cities',
              'System complexity: 3-phase systems and hybrid configurations cost more',
              'Accessories: Monitoring apps, auto-transfer switches, cable management',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#F59E0B] mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">What About ROI? When Does Solar Pay Back?</h2>
          <p className="text-[#64748B] leading-relaxed">
            The average Lagos household running a generator spends ₦35,000–₦60,000 per month on fuel. A 3kVA solar system costs around ₦480,000 installed. At ₦40,000/month in generator savings, the system pays back in approximately 12 months. After that, the electricity is essentially free for the next 10–15 years.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Diesel prices have risen sharply since 2023. Every month you wait is another month of generator fuel costs that solar would have eliminated. The ROI on solar in Nigeria is genuinely excellent right now.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">How to Get an Accurate Quote</h2>
          <p className="text-[#64748B] leading-relaxed">
            The most reliable way to get an accurate quote is to first calculate your load — what appliances you actually run, for how many hours. This tells you (and any installer) exactly what size system you need. Without this, you risk buying a system that&apos;s too small (frustrating) or too large (wasted money).
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Use our free solar calculator below to get your estimated system size first, then compare quotes from verified builders in your city.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Final Advice</h2>
          <p className="text-[#64748B] leading-relaxed">
            Don&apos;t just go for the cheapest quote. Nigeria&apos;s solar market has plenty of cut-rate installers who use inferior components or skip critical steps like proper earthing and cable sizing. A slightly more expensive system from a verified, reputable installer will save you significantly in the long run.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            All builders on SolarBuilders.ng are vetted by our team. We check their experience, equipment sourcing, and customer history before approving any listing.
          </p>
        </div>

        {/* Article CTA */}
        <div className="mt-12 bg-[#FEF3C7] rounded-2xl p-8">
          <h3 className="font-heading font-bold text-[#0A0F1E] text-xl mb-2">Calculate exactly what you need</h3>
          <p className="text-[#64748B] mb-4">Our free solar calculator tells you the right system size before you get any quotes.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/calculator" className="inline-flex items-center justify-center gap-2 bg-[#F59E0B] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-bold text-sm hover:bg-[#D97706] transition-colors">
              Calculate My System →
            </Link>
            <Link href="/marketplace" className="inline-flex items-center justify-center gap-2 border-2 border-[#0A0F1E] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-semibold text-sm hover:bg-[#0A0F1E] hover:text-white transition-colors">
              Browse Verified Installers
            </Link>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}
