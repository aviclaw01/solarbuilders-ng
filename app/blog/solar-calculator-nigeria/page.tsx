import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';

export const metadata: Metadata = {
  title: 'Solar Calculator Nigeria: What Size System Do I Need? — SolarBuilders.ng',
  description: 'Learn how to calculate the right solar system size for your Nigerian home. Understand watts, kVA, batteries and panels in plain language. Free calculator included.',
  keywords: ['solar calculator Nigeria', 'solar system size Nigeria', 'how many solar panels Nigeria', 'kVA solar Nigeria'],
  alternates: { canonical: 'https://solarbuildersng.com/blog/solar-calculator-nigeria' },
};

export default function SolarCalculatorNigeriaPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <article className="max-w-3xl mx-auto px-4 py-16">
        <div className="flex items-center gap-2 text-sm text-[#64748B] mb-8">
          <Link href="/" className="hover:text-[#0A0F1E]">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-[#0A0F1E]">Blog</Link>
          <span>/</span>
          <span className="text-[#0A0F1E]">Solar Calculator Guide</span>
        </div>

        <span className="inline-block bg-[#FEF3C7] text-[#0A0F1E] text-xs font-heading font-semibold px-3 py-1 rounded-full mb-6">
          System Sizing
        </span>

        <h1 className="font-heading font-extrabold text-[#0A0F1E] text-4xl md:text-5xl leading-tight mb-6">
          Solar Calculator: What Size System Do I Need?
        </h1>

        <div className="flex items-center gap-4 text-[#94A3B8] text-sm mb-12 pb-8 border-b border-[#E2E8F0]">
          <span>February 2026</span>
          <span>·</span>
          <span>7 min read</span>
        </div>

        <div className="space-y-6 text-[#0A0F1E]">
          <p className="text-xl text-[#64748B] leading-relaxed">
            The biggest mistake people make when going solar is buying the wrong size system — either too small (constant power cuts) or too large (wasted money). Here&apos;s how to get it right.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Step 1: List Your Appliances</h2>
          <p className="text-[#64748B] leading-relaxed">
            Start by writing down every appliance you want to run on solar. For each one, note how many you have and how many hours per day you typically use it. Don&apos;t worry about the technical numbers yet — we&apos;ll handle that.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Common appliances and their approximate wattage:
          </p>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-hidden my-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Appliance</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Typical Wattage</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Air conditioner (1.5HP)', '1,200W'],
                  ['Refrigerator', '150–200W'],
                  ['Deep freezer', '200–300W'],
                  ['Ceiling fan', '60–75W'],
                  ['32" LED TV', '50–70W'],
                  ['LED bulb', '7–15W'],
                  ['Laptop', '45–65W'],
                  ['Water pump', '500–750W'],
                ].map(([appliance, watts], i) => (
                  <tr key={i} className={`border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
                    <td className="p-4 text-[#64748B]">{appliance}</td>
                    <td className="p-4 font-semibold text-[#0A0F1E]">{watts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Step 2: Calculate Your Total Load</h2>
          <p className="text-[#64748B] leading-relaxed">
            Add up the wattage of all appliances you want to run simultaneously. This is your peak load. For example: 1 × AC (1,200W) + 1 × fridge (200W) + 2 × fans (130W) + 6 × LED bulbs (60W) + 1 × TV (60W) = 1,650W total.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            For safety, add 20–25% headroom. So 1,650W × 1.25 = 2,062W, which rounds up to a 3kVA inverter.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Step 3: Choose Your Battery Capacity</h2>
          <p className="text-[#64748B] leading-relaxed">
            Batteries determine how long your system runs without sun or grid. The formula is: (daily energy use in Wh) ÷ (battery voltage × usable depth × efficiency). In practice, for a typical 3kVA residential system in Nigeria running 8–10 hours daily, you&apos;d need 4 × 200Ah batteries.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            More batteries = more backup hours, but also more cost and weight. Your installer will help you find the right balance based on your actual usage pattern.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Step 4: Size Your Solar Panels</h2>
          <p className="text-[#64748B] leading-relaxed">
            Nigeria gets excellent sun — typically 5–6 peak sun hours per day. To calculate panels needed: daily energy use in Wh ÷ (peak sun hours × panel efficiency). For a 3kVA system using 6kWh/day, you&apos;d need approximately 4–6 × 400W panels.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">The Easier Way: Use Our Calculator</h2>
          <p className="text-[#64748B] leading-relaxed">
            All of this math is built into our free solar calculator. You just select your appliances, set quantities, and we calculate your recommended system size, battery count, panel count, and estimated cost — in under 60 seconds.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            After calculating, you can immediately browse verified installers in your city who can handle your exact system size.
          </p>
        </div>

        <div className="mt-12 bg-[#FEF3C7] rounded-2xl p-8">
          <h3 className="font-heading font-bold text-[#0A0F1E] text-xl mb-2">Try the free calculator</h3>
          <p className="text-[#64748B] mb-4">Select your appliances, get your exact system size. No signup, no fees.</p>
          <Link href="/calculator" className="inline-flex items-center bg-[#F59E0B] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-bold text-sm hover:bg-[#D97706] transition-colors">
            Calculate My System →
          </Link>
        </div>
      </article>

      <Footer />
    </div>
  );
}
