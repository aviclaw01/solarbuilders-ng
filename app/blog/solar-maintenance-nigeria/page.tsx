import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { PRICES_LAST_UPDATED_LABEL, TUBULAR_200AH } from '@/lib/prices';
import { formatNaira } from '@/lib/quote';

export const metadata: Metadata = {
  title: 'Solar Panel Maintenance: What Nigerian Homeowners Need to Know',
  description: 'Complete guide to maintaining your solar system in Nigeria: cleaning panels, battery care, annual checks, and the real cost of battery replacement — lithium (10+ years) vs tubular (2–4 years) at September 2026 prices.',
  keywords: ['solar panel maintenance Nigeria', 'solar system care Nigeria', 'solar cleaning Nigeria', 'solar battery maintenance'],
  openGraph: {
    title: 'Solar Panel Maintenance: What Nigerian Homeowners Need to Know',
    description: 'Complete guide to maintaining your solar system in Nigeria.',
    url: 'https://solarbuildersng.com/blog/solar-maintenance-nigeria',
    type: 'article',
  },
  alternates: { canonical: 'https://solarbuildersng.com/blog/solar-maintenance-nigeria' },
};

const tubularBankLow = TUBULAR_200AH.low * 4;
const tubularBankHigh = TUBULAR_200AH.high * 4;

export default function SolarMaintenancePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <article className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-8">
          <Link href="/" className="hover:text-slate-900">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-slate-900">Blog</Link>
          <span>/</span>
          <span className="text-slate-900">Solar Maintenance</span>
        </div>

        <div className="mb-4">
          <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full border border-amber-200">Maintenance</span>
        </div>
        <h1 className="font-heading font-extrabold text-slate-900 text-4xl md:text-5xl leading-tight mb-4">
          Solar Panel Maintenance: What Nigerian Homeowners Need to Know
        </h1>
        <div className="flex items-center gap-4 text-slate-400 text-sm mb-12 pb-8 border-b border-slate-100">
          <span>Updated {PRICES_LAST_UPDATED_LABEL}</span>
          <span>·</span>
          <span>7 min read</span>
        </div>

        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 text-lg leading-relaxed mb-6">
            Good news: solar systems are remarkably low-maintenance. Bad news: &quot;low maintenance&quot; doesn&apos;t mean zero maintenance. In Nigeria&apos;s dusty, humid climate, neglecting your system can reduce efficiency by 20–30%. Here&apos;s what you need to do — what you can ignore — and the one maintenance cost that dwarfs all the others: batteries.
          </p>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Panel cleaning (every 1–3 months)</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Nigeria&apos;s harmattan season deposits thick dust on panels from November to March. During the rainy season, bird droppings and algae can build up. Both reduce how much sunlight reaches your panels.
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            <strong>How to clean:</strong> Use a soft cloth or sponge with clean water. Early morning (before panels heat up) or evening is best. Avoid abrasive materials — they scratch the glass coating. Most homeowners can do this safely from the roof, or hire a cleaner for ₦2,000–₦5,000 per session.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-amber-800 text-sm font-semibold">Harmattan tip: Clean your panels every 3–4 weeks during harmattan season (Nov–Feb). You can visually inspect from the ground — a visibly dusty panel is losing efficiency.</p>
          </div>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Battery maintenance</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Your batteries are the most maintenance-intensive part of the system. What you need to do depends on your battery type:
          </p>
          <div className="space-y-4 mb-6">
            <div className="bg-slate-50 rounded-xl border border-slate-100 p-5">
              <h3 className="font-heading font-semibold text-slate-900 mb-2">Tubular / lead-acid batteries (flooded)</h3>
              <ul className="text-slate-600 text-sm space-y-1 list-disc list-inside">
                <li>Check electrolyte levels monthly — top up with distilled water only</li>
                <li>Clean terminal corrosion with baking soda solution</li>
                <li>Never discharge below 50% capacity — only half the nominal Ah is usable</li>
                <li>Expect a 2–4 year lifespan in Nigerian conditions</li>
              </ul>
            </div>
            <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-5">
              <h3 className="font-heading font-semibold text-slate-900 mb-2">Lithium (LiFePO4) batteries</h3>
              <ul className="text-slate-600 text-sm space-y-1 list-disc list-inside">
                <li>Almost zero maintenance — no electrolyte, no corrosion</li>
                <li>Check the BMS (Battery Management System) app if your inverter or battery has one</li>
                <li>Can discharge to 10–20% safely (about 90% usable)</li>
                <li>Expect 10+ years — 3,000–6,000 charge cycles — which is why it is worth the higher upfront cost</li>
              </ul>
            </div>
          </div>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Battery replacement: the real maintenance cost</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Cleaning and annual checks are pocket change next to batteries. This is where the lithium-vs-tubular decision pays off — or costs you — over the life of the system. Prices below are Nigerian vendor listings as of {PRICES_LAST_UPDATED_LABEL}.
          </p>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border border-slate-100 rounded-2xl overflow-hidden">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left p-4 font-heading font-semibold">Battery bank (~4.6–4.8kWh usable)</th>
                  <th className="text-left p-4 font-heading font-semibold">Cost to replace</th>
                  <th className="text-left p-4 font-heading font-semibold">How often</th>
                  <th className="text-left p-4 font-heading font-semibold">Over 10 years</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Lithium — one 5kWh LiFePO4 pack (Deye, Felicity, Growatt, Dyness)', '₦1,000,000 – ₦1,350,000', 'Every 10+ years', '₦1,000,000 – ₦1,350,000 (the original pack, still running)'],
                  [`Tubular — 4 × 200Ah 12V (${formatNaira(TUBULAR_200AH.low)} – ${formatNaira(TUBULAR_200AH.high)} each)`, `${formatNaira(tubularBankLow)} – ${formatNaira(tubularBankHigh)}`, 'Every 2–4 years', `${formatNaira(tubularBankLow * 3)} – ${formatNaira(tubularBankHigh * 5)} (3–5 banks)`],
                ].map(([bank, cost, freq, tenYear]) => (
                  <tr key={bank} className="border-t border-slate-100">
                    <td className="p-4 text-slate-600">{bank}</td>
                    <td className="p-4 font-semibold text-slate-900">{cost}</td>
                    <td className="p-4 text-slate-600">{freq}</td>
                    <td className="p-4 text-amber-600 font-semibold">{tenYear}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-slate-600 leading-relaxed mb-4">
            The two banks store a similar amount of usable energy: a 5.12kWh lithium module at 90% depth of discharge gives about 4.6kWh, and four 200Ah tubulars (9.6kWh nominal) at the 50% you should never exceed give about 4.8kWh. The tubular bank is cheaper on day one — {formatNaira(tubularBankLow)}–{formatNaira(tubularBankHigh)} against ₦1,000,000–₦1,350,000 — but you buy it three to five times in the period a single lithium pack lasts, and you spend every month topping up electrolyte and cleaning terminals.
          </p>
          <p className="text-slate-600 leading-relaxed mb-6">
            If you already have a tubular bank that is fading, the sensible replacement is usually a lithium module rather than another set of tubulars — provided your inverter supports lithium charging profiles. Most hybrid inverters sold since 2023 do; older units may need a firmware setting or a replacement. Ask before you buy the battery.
          </p>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Annual professional service check</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Once a year, have your installer or a qualified technician inspect:
          </p>
          <ul className="space-y-2 text-slate-600 mb-6 list-disc list-inside">
            <li>All wiring connections — heat and humidity cause connections to loosen</li>
            <li>Inverter ventilation and cooling fans</li>
            <li>Panel mounting brackets (especially after rain or high winds)</li>
            <li>System performance data — compare output to installation specs</li>
            <li>Charge controller / inverter battery settings (especially after a battery change)</li>
          </ul>
          <p className="text-slate-600 leading-relaxed mb-6">
            A professional service call costs ₦15,000–₦40,000 and catches problems before they become expensive.
          </p>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Warning signs to watch for</h2>
          <div className="space-y-3 mb-8">
            {[
              { sign: 'Batteries not holding charge as long as before', action: 'Could be sulfation (tubular) or end of life — get it checked before it strands you overnight' },
              { sign: 'Inverter making unusual sounds or overheating', action: 'Stop using immediately — check ventilation, call your installer' },
              { sign: 'Error lights or fault codes on inverter', action: 'Photograph the code and send it to your installer' },
              { sign: 'Panels producing noticeably less power on sunny days', action: 'Check for shading (new construction nearby?), clean panels, check connections' },
              { sign: 'Burning smell from inverter or battery area', action: 'Disconnect system immediately and call an electrician' },
            ].map(({ sign, action }) => (
              <div key={sign} className="bg-white border border-slate-100 rounded-xl p-4">
                <p className="font-semibold text-slate-900 text-sm mb-1">{sign}</p>
                <p className="text-slate-500 text-sm">{action}</p>
              </div>
            ))}
          </div>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">What you definitely don&apos;t need to do</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Ignore anyone who tells you panels need to be replaced every 5 years. Quality Tier-1 panels (Jinko, JA Solar, Longi, Trina, Canadian Solar) last 20–25 years and come with manufacturer warranties. They lose about 0.5% efficiency per year — barely noticeable.
          </p>
          <p className="text-slate-600 leading-relaxed mb-6">
            You also don&apos;t need to turn off your system during lightning storms — a properly installed system has surge protection. If your installer didn&apos;t include surge protection, that&apos;s a gap worth fixing; it is a standard line in every quote our calculator produces.
          </p>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Maintenance schedule summary</h2>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border border-slate-100 rounded-2xl overflow-hidden">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left p-4 font-heading font-semibold">Task</th>
                  <th className="text-left p-4 font-heading font-semibold">Frequency</th>
                  <th className="text-left p-4 font-heading font-semibold">Cost</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Panel cleaning', 'Monthly (harmattan) / Quarterly (wet season)', '₦0–₦5,000'],
                  ['Visual inspection', 'Monthly', 'Free'],
                  ['Battery electrolyte check (tubular only)', 'Monthly', 'Free'],
                  ['Terminal cleaning (tubular only)', 'Every 3 months', 'Free'],
                  ['Professional service', 'Annually', '₦15,000–₦40,000'],
                  ['Tubular bank replacement (4 × 200Ah)', 'Every 2–4 years', `${formatNaira(tubularBankLow)}–${formatNaira(tubularBankHigh)}`],
                  ['Lithium pack replacement (5kWh)', 'Every 10+ years', '₦1,000,000–₦1,350,000'],
                ].map(([task, freq, cost]) => (
                  <tr key={task} className="border-t border-slate-100">
                    <td className="p-4 text-slate-600">{task}</td>
                    <td className="p-4 text-slate-600">{freq}</td>
                    <td className="p-4 text-amber-600 font-semibold">{cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-16 bg-slate-900 rounded-2xl p-10 text-center">
          <h3 className="font-heading font-extrabold text-white text-2xl mb-3">
            Not installed yet? Start with lithium.
          </h3>
          <p className="text-slate-400 mb-6">Our calculator quotes lithium systems itemised at {PRICES_LAST_UPDATED_LABEL} prices — free, in 5 minutes.</p>
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
