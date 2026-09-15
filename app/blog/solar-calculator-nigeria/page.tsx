import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { HEADLINE_PACKAGES, PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { formatNaira } from '@/lib/quote';

export const metadata: Metadata = {
  title: 'Solar Calculator Nigeria: What Size System Do I Need? — SolarBuilders.ng',
  description: 'How to size a solar system for your Nigerian home: peak kW, kWh per day, lithium battery modules and 550W panels explained. Our free calculator turns your appliance list into an itemised quote with September 2026 prices.',
  keywords: ['solar calculator Nigeria', 'solar system size Nigeria', 'how many solar panels Nigeria', 'kVA solar Nigeria'],
  alternates: { canonical: 'https://solarbuildersng.com/blog/solar-calculator-nigeria' },
};

export default function SolarCalculatorNigeriaPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>

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
          <span>Updated {PRICES_LAST_UPDATED_LABEL}</span>
          <span>·</span>
          <span>7 min read</span>
        </div>

        <div className="space-y-6 text-[#0A0F1E]">
          <p className="text-xl text-[#64748B] leading-relaxed">
            The biggest mistake people make when going solar is buying the wrong size system — too small and the inverter trips every evening, too large and you pay for batteries you never use. Here is how the sizing works, and how our calculator turns it into a priced, itemised quote.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Step 1: List Your Appliances</h2>
          <p className="text-[#64748B] leading-relaxed">
            Start with every appliance you want to run on solar, how many of each, and how many hours a day you use it. Don&apos;t worry about the technical numbers yet — the calculator has an appliance picker with typical wattages built in.
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
          <p className="text-[#64748B] leading-relaxed">
            Note on fridges and freezers: the compressor cycles on and off, so even a fridge plugged in 24 hours only draws power for roughly 8 of them. The calculator already uses that duty cycle.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Step 2: Peak kW and kWh Per Day</h2>
          <p className="text-[#64748B] leading-relaxed">
            Two numbers decide everything. <strong>Peak load</strong> is the wattage of everything that could be on at once — this sizes the inverter. <strong>Daily energy</strong> (kWh per day) is wattage × hours, summed across appliances — this sizes the battery and the panels.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Example: 1 × AC (1,200W, 6h) + 1 × fridge (200W, 8h) + 2 × fans (130W, 12h) + 6 × LED bulbs (60W, 6h) + 1 × TV (60W, 5h). Peak load = 1,650W. Daily energy = 7.2 + 1.6 + 1.56 + 0.36 + 0.3 = about 11 kWh per day. Notice that the AC is 65% of the daily energy on its own — that is why &quot;can I run AC on solar?&quot; is really a battery question.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            The inverter is sized from the full peak load with 25% headroom, rounded up to a standard size: 1,650W × 1.25 = 2,062W, so a 2.5kVA inverter. Systems with more than two battery modules move to a 5kVA 48V inverter, which is what installers actually fit.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Step 3: Battery Capacity (Lithium Modules)</h2>
          <p className="text-[#64748B] leading-relaxed">
            The calculator quotes lithium (LiFePO4) only, in standard 5.12kWh modules — the 48V 100Ah packs sold by Deye, Felicity, Growatt and Dyness. Backup energy = average running load (about 60% of peak) × the hours of backup you want, divided by 90% usable depth of discharge, then rounded up to whole modules. Budget tier plans for 4 hours of night backup, Standard for 6, Premium for 10.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            For the example above at Standard: 1,650W × 0.6 × 6h = 5.94kWh usable, ÷ 0.9 = 6.6kWh nominal, so 2 modules = 10.24kWh. A 5kWh lithium pack costs ₦1,000,000–₦1,350,000 as of {PRICES_LAST_UPDATED_LABEL}, which is why battery is usually the largest line on the quote. Lithium lasts 10+ years (3,000–6,000 cycles) against 2–4 years for tubular batteries, so we no longer quote tubular by default.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Step 4: Panels (550W)</h2>
          <p className="text-[#64748B] leading-relaxed">
            Nigeria gets roughly 5.5 peak sun hours a day. Panel watts needed = daily kWh ÷ (5.5 × 0.78 system efficiency). For 11 kWh per day that is about 2,560Wp, which rounds up to 5 × 550W panels (2.75kWp). Premium tier adds 25% extra panel capacity so batteries still recharge on cloudy days.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Tier-1 panels (Jinko, JA Solar, Longi, Trina, Canadian Solar) cost ₦185–₦300 per Wp as of {PRICES_LAST_UPDATED_LABEL} — roughly ₦100,000–₦165,000 per 550W panel. Import duty and VAT on panels, inverters and batteries are currently 0%.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">What the Calculator Gives You</h2>
          <p className="text-[#64748B] leading-relaxed">
            All of the maths above is built into our <Link href="/calculator" className="text-[#F59E0B] font-semibold hover:underline">free calculator</Link>. You pick appliances and quantities; it shows your peak kW and kWh per day, then three sized systems:
          </p>
          <ul className="space-y-3 text-[#64748B]">
            {[
              ['Budget', 'Felicity / Sako / SRNE inverter, budget-tier lithium (Blue Carbon, ITEL, Cworth), ~4h night backup. Runs essentials; heavy loads only while the sun is up.'],
              ['Standard', 'Growatt / Luxpower / Solis inverter, Felicity / Growatt / Dyness lithium, ~6h backup. What most Nigerian homes install.'],
              ['Premium', 'Deye / Victron inverter, Deye / Felicity lithium, ~10h backup, 25% extra panels and app monitoring.'],
            ].map(([tier, desc], i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#F59E0B] mt-1">•</span>
                <span><strong className="text-[#0A0F1E]">{tier}:</strong> {desc}</span>
              </li>
            ))}
          </ul>
          <p className="text-[#64748B] leading-relaxed">
            Each tier is an itemised bill of materials: hybrid inverter (brand tier and kVA), lithium modules (count and kWh), 550W panels (count), mounting, cables and protection (rails, DC/AC cable, breakers, surge protector, combiner, earthing, changeover), and installation labour. Every line has a low / typical / high price from Nigerian vendor listings, updated {PRICES_LAST_UPDATED_LABEL}. The quote carries a short code (for example <code className="text-sm bg-[#F8FAFC] px-1.5 py-0.5 rounded">SB-2.5K-JZMP0K</code>) that rebuilds the exact same quote later, and you can download it as a PDF or image.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Worked Example</h2>
          <p className="text-[#64748B] leading-relaxed">
            Running the example household above (1,650W peak, ~11 kWh per day) through the calculator at {PRICES_LAST_UPDATED_LABEL} prices gives:
          </p>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-hidden my-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Tier</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">System</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Estimate</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Budget', '2.5kVA · 1 × 5.12kWh · 4 × 550W', '≈ ₦1.9M (₦1.4M – ₦2.6M)'],
                  ['Standard', '2.5kVA · 2 × 5.12kWh · 5 × 550W', '≈ ₦3.5M (₦3.0M – ₦5.0M)'],
                  ['Premium', '5kVA · 3 × 5.12kWh · 6 × 550W', '≈ ₦6.3M (₦5.1M – ₦8.7M)'],
                ].map(([tier, sys, price], i) => (
                  <tr key={i} className={`border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
                    <td className="p-4 font-heading font-semibold text-[#0A0F1E]">{tier}</td>
                    <td className="p-4 text-[#64748B]">{sys}</td>
                    <td className="p-4 font-semibold text-[#F59E0B]">{price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[#64748B] leading-relaxed">
            For reference, these are the typical installed ranges the calculator produces for common Nigerian household sizes:
          </p>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-hidden my-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">System</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Runs</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Installed ({PRICES_LAST_UPDATED_LABEL})</th>
                </tr>
              </thead>
              <tbody>
                {HEADLINE_PACKAGES.map((p, i) => (
                  <tr key={p.label} className={`border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
                    <td className="p-4 font-heading font-semibold text-[#0A0F1E]">{p.label}</td>
                    <td className="p-4 text-[#64748B]">{p.powers}</td>
                    <td className="p-4 font-semibold text-[#F59E0B]">{formatNaira(p.low)} – {formatNaira(p.high)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">From Quote to Installed System</h2>
          <p className="text-[#64748B] leading-relaxed">
            When the quote looks right, tap <strong>Get this system built</strong>. That sends the quote to us and opens WhatsApp. We confirm every line against current vendor stock (the same vendors listed on our <Link href="/brands" className="text-[#F59E0B] font-semibold hover:underline">brands page</Link>), source the equipment, and manage an installer we have <Link href="/verified" className="text-[#F59E0B] font-semibold hover:underline">already vetted</Link> through to commissioning. The calculator estimate is the starting point; the confirmed price comes after we check stock and your site.
          </p>
        </div>

        <div className="mt-12 bg-[#FEF3C7] rounded-2xl p-8">
          <h3 className="font-heading font-bold text-[#0A0F1E] text-xl mb-2">Try the free calculator</h3>
          <p className="text-[#64748B] mb-4">Pick your appliances, get three itemised quotes with a quote code. No signup, no fees.</p>
          <Link href="/calculator" className="inline-flex items-center bg-[#F59E0B] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-bold text-sm hover:bg-[#D97706] transition-colors">
            Get an itemised quote →
          </Link>
        </div>
      </article>

      </main>
      <Footer />
    </div>
  );
}
