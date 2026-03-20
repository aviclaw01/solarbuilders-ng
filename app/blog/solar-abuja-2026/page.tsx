import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';

export const metadata: Metadata = {
  title: 'Solar in Abuja: Best Installers and Prices 2026 — SolarBuilders.ng',
  description: 'Complete guide to solar energy in Abuja, Nigeria. Best solar installers, 2026 prices, and everything you need to know about going solar in the FCT.',
  keywords: ['solar Abuja 2026', 'solar installer Abuja', 'solar panels Abuja price', 'best solar company Abuja Nigeria'],
  alternates: { canonical: 'https://solarbuildersng.com/blog/solar-abuja-2026' },
};

export default function SolarAbujaPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

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
          Solar in Abuja: Best Installers and Prices 2026
        </h1>

        <div className="flex items-center gap-4 text-[#94A3B8] text-sm mb-12 pb-8 border-b border-[#E2E8F0]">
          <span>February 2026</span>
          <span>·</span>
          <span>5 min read</span>
        </div>

        <div className="space-y-6 text-[#0A0F1E]">
          <p className="text-xl text-[#64748B] leading-relaxed">
            Abuja is one of the best cities in Nigeria for solar energy. Higher-than-average sun irradiance, a growing middle class that can afford premium systems, and a concentration of quality installers make the FCT an ideal place to go solar in 2026.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Why Abuja is Great for Solar</h2>
          <p className="text-[#64748B] leading-relaxed">
            The Federal Capital Territory enjoys approximately 6–7 peak sun hours daily — among the best in the country. This means solar panels in Abuja generate more energy per panel than in many other Nigerian cities. A 3kVA system in Abuja will typically generate 20–30% more daily energy than the same system in a cloudier coastal city.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            NEPA supply in Abuja, while better than many cities, is still unreliable — averaging 8–12 hours of grid power per day in most residential areas. This makes solar an excellent complement: charge during the day, run at night.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Solar Prices in Abuja (2026)</h2>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">System</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Price Range (Abuja)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['3 kVA (basic home)', '₦420,000 – ₦650,000'],
                  ['5 kVA (with AC)', '₦700,000 – ₦1,000,000'],
                  ['10 kVA (large home)', '₦1,100,000 – ₦1,600,000'],
                  ['15 kVA (commercial)', '₦1,800,000 – ₦2,800,000'],
                ].map(([size, price], i) => (
                  <tr key={i} className={`border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
                    <td className="p-4 text-[#64748B]">{size}</td>
                    <td className="p-4 font-semibold text-[#F59E0B]">{price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Best Areas for Solar in Abuja</h2>
          <p className="text-[#64748B] leading-relaxed">
            Solar installations work across all of Abuja, but certain areas have higher concentrations of quality installers and easier access for equipment delivery. Wuse, Maitama, Garki, Asokoro, and Gwarinpa all have active solar markets with multiple competing installers — which generally means better prices and faster response times.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Areas like Kubwa, Lugbe, and Bwari have slightly fewer installers but are well served by companies operating city-wide.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Hybrid vs. Off-Grid in Abuja</h2>
          <p className="text-[#64748B] leading-relaxed">
            Because Abuja has more grid power than most Nigerian cities, many residents opt for hybrid systems — these use solar when available, top up from the grid when needed, and switch seamlessly. This typically gives a better return on investment than a fully off-grid system, since you can use smaller (cheaper) batteries.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Most verified Abuja installers on SolarBuilders.ng specialise in hybrid systems and can advise on the right configuration for your area and usage.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">How to Choose an Installer in Abuja</h2>
          <p className="text-[#64748B] leading-relaxed">
            The advice is the same everywhere in Nigeria: verify the company, ask for references, insist on a site survey, and get written quotes with full equipment specs. Abuja&apos;s market has plenty of excellent companies — but also its share of operators who disappeared after collecting deposits.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Our verified Abuja builders on SolarBuilders.ng have all been reviewed by our team. Browse them, compare ratings, and reach out directly on WhatsApp.
          </p>
        </div>

        <div className="mt-12 bg-[#FEF3C7] rounded-2xl p-8">
          <h3 className="font-heading font-bold text-[#0A0F1E] text-xl mb-2">Find verified solar installers in Abuja</h3>
          <p className="text-[#64748B] mb-4">Browse our vetted Abuja builders and compare directly.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/solar/abuja" className="inline-flex items-center justify-center bg-[#F59E0B] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-bold text-sm hover:bg-[#D97706] transition-colors">
              Browse Abuja Installers →
            </Link>
            <Link href="/calculator" className="inline-flex items-center justify-center border-2 border-[#0A0F1E] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-semibold text-sm hover:bg-[#0A0F1E] hover:text-white transition-colors">
              Calculate My System
            </Link>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}
