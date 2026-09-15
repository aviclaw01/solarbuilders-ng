import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { HEADLINE_PACKAGES, LABOUR_PER_KVA, PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { formatNaira } from '@/lib/quote';

export const metadata: Metadata = {
  title: 'Solar in Abuja: Prices and How to Get It Installed (2026) — SolarBuilders.ng',
  description: 'Solar in Abuja, Nigeria: September 2026 installed prices for 5kWh lithium starters to 10kVA homes, why the FCT is good for solar, and how to go from an itemised quote to a managed installation.',
  keywords: ['solar Abuja 2026', 'solar installer Abuja', 'solar panels Abuja price', 'best solar company Abuja Nigeria'],
  alternates: { canonical: 'https://solarbuildersng.com/blog/solar-abuja-2026' },
};

export default function SolarAbujaPage() {
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
          <span className="text-[#0A0F1E]">Solar Abuja 2026</span>
        </div>

        <span className="inline-block bg-[#FEF3C7] text-[#0A0F1E] text-xs font-heading font-semibold px-3 py-1 rounded-full mb-6">
          City Guide
        </span>

        <h1 className="font-heading font-extrabold text-[#0A0F1E] text-4xl md:text-5xl leading-tight mb-6">
          Solar in Abuja: Prices and How to Get It Installed (2026)
        </h1>

        <div className="flex items-center gap-4 text-[#94A3B8] text-sm mb-12 pb-8 border-b border-[#E2E8F0]">
          <span>Updated {PRICES_LAST_UPDATED_LABEL}</span>
          <span>·</span>
          <span>5 min read</span>
        </div>

        <div className="space-y-6 text-[#0A0F1E]">
          <p className="text-xl text-[#64748B] leading-relaxed">
            Abuja is one of the best cities in Nigeria for solar. Higher-than-average sun, better-than-average grid supply (so smaller, cheaper battery banks work), and a housing stock with proper roofs make the FCT a straightforward place to go solar in 2026. Here is what it costs and how we get it built.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Why Abuja is Good for Solar</h2>
          <p className="text-[#64748B] leading-relaxed">
            The Federal Capital Territory enjoys roughly 6–7 peak sun hours a day — among the best in the country and comfortably above the 5.5 hours our calculator assumes. In practice a panel array in Abuja produces noticeably more per day than the same array in a cloudier coastal city, so you can often get away with one fewer panel for the same daily energy.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Grid supply in Abuja, while still unreliable, is better than most cities — typically 8–12 hours a day in residential areas. That makes a hybrid setup the obvious choice: solar by day, battery through the evening, grid tops up when it is there.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Solar Prices in Abuja ({PRICES_LAST_UPDATED_LABEL})</h2>
          <p className="text-[#64748B] leading-relaxed">
            These are installed ranges — inverter, lithium battery, Tier-1 panels, mounting and protection, and labour — priced from Nigerian vendor listings as of {PRICES_LAST_UPDATED_LABEL}. Most equipment is imported through Lagos and trucked to Abuja, so expect Abuja quotes to land in the middle-to-upper part of each range rather than at the bottom.
          </p>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">System</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Runs</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Installed Price</th>
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
          <p className="text-[#64748B] leading-relaxed">
            Where the money goes: a 5kWh lithium pack is ₦1,000,000–₦1,350,000, Tier-1 panels ₦185–₦300 per Wp (about ₦100,000–₦165,000 per 550W panel), a mid-tier 5kVA hybrid inverter ₦500,000–₦1,000,000, and roof-mount labour {formatNaira(LABOUR_PER_KVA.low)}–{formatNaira(LABOUR_PER_KVA.high)} per kVA. Import duty and VAT on panels, inverters and batteries are 0%. See current vendor prices by brand on our <Link href="/brands" className="text-[#F59E0B] font-semibold hover:underline">brands page</Link>.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Where in Abuja</h2>
          <p className="text-[#64748B] leading-relaxed">
            Roof-mounted systems work anywhere in the FCT. Wuse, Maitama, Garki, Asokoro and Gwarinpa are close to the main equipment dealers, so delivery is quick. Kubwa, Lugbe, Bwari and the outer districts are fine too — the labour line in our quotes covers roof-mount installation across the city, and any extra transport for a far-out site is something we confirm with you on WhatsApp before work starts, never a surprise on the invoice.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Hybrid vs. Off-Grid in Abuja</h2>
          <p className="text-[#64748B] leading-relaxed">
            Because Abuja has more grid hours than most Nigerian cities, hybrid makes the most sense: the inverter uses solar when available, draws from the battery in the evening, and lets grid power top things up when it is there. That usually means you can size for 6 hours of overnight backup — the Standard tier in our calculator — rather than paying for a full off-grid battery bank.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            If you are in an estate with genuinely poor supply, the Premium tier plans for around 10 hours of backup and extra panels for cloudy-day recharge. Either way, lithium is the default: it lasts 10+ years against 2–4 years for tubular batteries.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">How to Get It Installed</h2>
          <p className="text-[#64748B] leading-relaxed">
            The advice for choosing an installer is the same everywhere in Nigeria: CAC registration, past installs with photos, references, a written workmanship warranty, correct sizing and an itemised quote. Abuja has plenty of good companies — and its share of operators who disappeared after collecting deposits.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Our process removes that guesswork. Build your quote in the <Link href="/calculator" className="text-[#F59E0B] font-semibold hover:underline">calculator</Link> (pick appliances, get three itemised tiers with a quote code, download the PDF), then tap &quot;Get this system built&quot; to send it to us on WhatsApp. We confirm prices against current stock, source the equipment from Nigerian vendors, and manage an installer we have <Link href="/verified" className="text-[#F59E0B] font-semibold hover:underline">already vetted</Link> through to commissioning. More on our Abuja service at <Link href="/solar/abuja" className="text-[#F59E0B] font-semibold hover:underline">solar in Abuja</Link>.
          </p>
        </div>

        <div className="mt-12 bg-[#FEF3C7] rounded-2xl p-8">
          <h3 className="font-heading font-bold text-[#0A0F1E] text-xl mb-2">Get an itemised quote for your Abuja home</h3>
          <p className="text-[#64748B] mb-4">Priced from {PRICES_LAST_UPDATED_LABEL} vendor listings. Send it to us on WhatsApp and we handle sourcing and installation.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/calculator" className="inline-flex items-center justify-center bg-[#F59E0B] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-bold text-sm hover:bg-[#D97706] transition-colors">
              Get an itemised quote →
            </Link>
            <Link href="/solar/abuja" className="inline-flex items-center justify-center border-2 border-[#0A0F1E] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-semibold text-sm hover:bg-[#0A0F1E] hover:text-white transition-colors">
              Solar in Abuja
            </Link>
          </div>
        </div>
      </article>

      </main>
      <Footer />
    </div>
  );
}
