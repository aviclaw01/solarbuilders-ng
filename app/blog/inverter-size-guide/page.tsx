import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';

export const metadata: Metadata = {
  title: 'What Size Inverter Do I Need? A Nigerian Guide',
  description: 'Learn how to choose the right inverter size for your Nigerian home. Step-by-step guide covering kVA ratings, load calculations, and recommended systems for Lagos, Abuja, and beyond.',
  keywords: ['inverter size Nigeria', 'what size inverter do I need Nigeria', 'solar inverter guide Nigeria', 'kVA calculator Nigeria'],
  openGraph: {
    title: 'What Size Inverter Do I Need? A Nigerian Guide',
    description: 'Step-by-step guide to choosing the right inverter size for your Nigerian home.',
    url: 'https://solarbuildersng.com/blog/inverter-size-guide',
    type: 'article',
  },
  alternates: { canonical: 'https://solarbuildersng.com/blog/inverter-size-guide' },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "What Size Inverter Do I Need? A Nigerian Guide",
  "description": "Step-by-step guide to choosing the right inverter size for your Nigerian home.",
  "author": { "@type": "Organization", "name": "SolarBuilders.ng" },
  "publisher": { "@type": "Organization", "name": "SolarBuilders.ng" },
  "datePublished": "2026-02-15",
  "url": "https://solarbuildersng.com/blog/inverter-size-guide",
};

export default function InverterSizeGuidePage() {
  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <Navbar />
      <article className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-8">
          <Link href="/" className="hover:text-slate-900">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-slate-900">Blog</Link>
          <span>/</span>
          <span className="text-slate-900">Inverter Size Guide</span>
        </div>

        <div className="mb-4">
          <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full border border-amber-200">System Sizing</span>
        </div>
        <h1 className="font-heading font-extrabold text-slate-900 text-4xl md:text-5xl leading-tight mb-4">
          What Size Inverter Do I Need? A Nigerian Guide
        </h1>
        <div className="flex items-center gap-4 text-slate-400 text-sm mb-12 pb-8 border-b border-slate-100">
          <span>February 2026</span>
          <span>·</span>
          <span>7 min read</span>
        </div>

        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 text-lg leading-relaxed mb-6">
            Choosing the wrong inverter size is one of the most expensive mistakes Nigerian solar buyers make. Too small, and your system struggles or shuts off unexpectedly. Too large, and you&apos;ve spent unnecessarily on capacity you&apos;ll never use. This guide helps you get it right.
          </p>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">What is kVA and why does it matter?</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Inverter capacity is measured in kVA (kilovolt-amperes). Think of it as the &quot;engine size&quot; of your solar system — it determines how much load (appliances) the system can handle at once.
          </p>
          <p className="text-slate-600 leading-relaxed mb-6">
            A common mistake is confusing kVA with kW (kilowatts). For most home applications in Nigeria: <strong>kVA ≈ kW × 1.25</strong>. So if your appliances need 2,400 watts (2.4kW), you need roughly a 3kVA inverter.
          </p>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Step 1: List everything you want to power</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Be honest with yourself here. Write down every appliance you want to run simultaneously during a power outage. This is your <em>peak load</em>.
          </p>
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 mb-6">
            <p className="font-heading font-semibold text-slate-900 mb-4">Common Nigerian home appliances and their wattage:</p>
            <div className="space-y-2 text-sm">
              {[
                ['Air conditioner (1.5HP)', '1,200W'],
                ['Air conditioner (2HP)', '1,800W'],
                ['Refrigerator', '150–200W'],
                ['Deep freezer', '200–300W'],
                ['Washing machine', '500W'],
                ['Water pump (0.5HP)', '370W'],
                ['Television (32")', '60W'],
                ['Television (55")', '120–150W'],
                ['LED bulb', '8–12W'],
                ['Ceiling fan', '60–75W'],
                ['Standing fan', '65–85W'],
                ['Laptop', '45–80W'],
                ['WiFi router', '10–20W'],
                ['DSTV decoder', '20–30W'],
              ].map(([appliance, watts]) => (
                <div key={appliance} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
                  <span className="text-slate-600">{appliance}</span>
                  <span className="font-semibold text-slate-900">{watts}</span>
                </div>
              ))}
            </div>
          </div>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Step 2: Add up your total load</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Example: A typical 3-bedroom Lagos home running 1 AC, 1 fridge, 1 freezer, 2 fans, 2 TVs, and 8 LED lights:
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6">
            <div className="space-y-2 text-sm mb-4">
              {[
                ['1 × AC (1.5HP)', '1,200W'],
                ['1 × Refrigerator', '200W'],
                ['1 × Deep freezer', '250W'],
                ['2 × Ceiling fans', '140W'],
                ['2 × TVs (32")', '120W'],
                ['8 × LED bulbs', '80W'],
              ].map(([item, watts]) => (
                <div key={item} className="flex justify-between">
                  <span className="text-slate-600">{item}</span>
                  <span className="text-slate-700">{watts}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-amber-200 pt-3 flex justify-between font-heading font-bold text-slate-900">
              <span>Total peak load</span>
              <span className="text-amber-600">1,990W</span>
            </div>
          </div>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Step 3: Add a safety buffer</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Inverters should never run at 100% capacity for extended periods — it damages them and shortens their lifespan. Add a 25–30% buffer to your total load. So 1,990W × 1.25 = 2,487W, which means you need at least a <strong>3kVA inverter</strong>.
          </p>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Quick guide: Which kVA do I need?</h2>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border border-slate-100 rounded-2xl overflow-hidden">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left p-4 font-heading font-semibold text-slate-900">Scenario</th>
                  <th className="text-left p-4 font-heading font-semibold text-slate-900">Inverter Size</th>
                  <th className="text-left p-4 font-heading font-semibold text-slate-900">Typical Cost</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Lights, fans, TV, router only', '1–1.5kVA', '₦80k–₦150k'],
                  ['Above + fridge + freezer', '2–3kVA', '₦150k–₦280k'],
                  ['Above + 1 AC (1.5HP)', '3.5–5kVA', '₦280k–₦500k'],
                  ['Multiple ACs + full home', '7.5–10kVA', '₦500k–₦1.2M'],
                  ['Commercial / large estate', '15–20kVA', '₦1.2M+'],
                ].map(([scenario, size, cost]) => (
                  <tr key={scenario} className="border-t border-slate-100">
                    <td className="p-4 text-slate-600">{scenario}</td>
                    <td className="p-4 font-semibold text-slate-900">{size}</td>
                    <td className="p-4 text-amber-600 font-semibold">{cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Should I go hybrid or off-grid?</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            <strong>Hybrid inverters</strong> work with both solar panels and the grid (NEPA). When NEPA is available, it charges your batteries. When it&apos;s out, solar takes over. This is the most popular choice in Lagos and Abuja where NEPA is unreliable but present.
          </p>
          <p className="text-slate-600 leading-relaxed mb-6">
            <strong>Off-grid inverters</strong> work entirely from solar and batteries — no grid connection at all. This is better for remote locations where NEPA doesn&apos;t reach, or for customers who want total energy independence.
          </p>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Common brands in Nigeria</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Reputable inverter brands you&apos;ll encounter from verified installers:
          </p>
          <ul className="space-y-2 text-slate-600 mb-6 list-disc list-inside">
            <li><strong>Victron Energy</strong> — Premium European brand, popular for larger installations</li>
            <li><strong>Growatt</strong> — Good mid-range option, reliable and affordable</li>
            <li><strong>Schneider Electric</strong> — Commercial grade, excellent for businesses</li>
            <li><strong>Luminous</strong> — Popular in residential market, good value</li>
            <li><strong>Felicity Solar</strong> — Made for African markets, excellent warranty support</li>
          </ul>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">What about batteries?</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Your inverter capacity must match your battery bank. A 3kVA inverter typically needs 200–400Ah of battery capacity for 4–8 hours of backup. Lithium (LiFePO4) batteries are better than lead-acid — they last 10+ years vs 2–4 years, and you can discharge them deeper. Budget for lithium if you can.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-16 bg-slate-900 rounded-2xl p-10 text-center">
          <h3 className="font-heading font-extrabold text-white text-2xl mb-3">
            Not sure what size you need?
          </h3>
          <p className="text-slate-400 mb-6">Use our free calculator — it does the math for you in 5 minutes.</p>
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
