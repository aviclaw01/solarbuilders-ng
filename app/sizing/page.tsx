import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import WhatsAppLink from '@/components/ui/WhatsAppLink';
import { ArrowRight, Calculator, MessageCircle } from 'lucide-react';
import { SIZING_SCENARIOS, scenariosByCategory, scenarioQuote } from '@/lib/sizing';
import { formatNairaShort, formatRange } from '@/lib/quote';
import { PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { SITE_URL } from '@/lib/site';

function num(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}

export const metadata: Metadata = {
  title: `Solar & Inverter Sizing Questions, Answered with Real Nigerian Prices`,
  description:
    `What size inverter for a 1.5HP AC, how many panels for a 2 bedroom flat, what a 5kVA inverter really runs — ` +
    `${SIZING_SCENARIOS.length} sizing questions answered with a computed inverter size, battery, panel count and ` +
    `installed price at ${PRICES_LAST_UPDATED_LABEL} Nigerian prices.`,
  keywords: [
    'what size inverter do i need nigeria',
    'how many solar panels nigeria',
    'what can a 5kva inverter run',
    'solar sizing nigeria',
    'inverter size for ac nigeria',
  ],
  openGraph: {
    title: 'Solar & inverter sizing questions, answered with real Nigerian prices',
    description:
      `${SIZING_SCENARIOS.length} sizing questions — each answered with a computed inverter size, battery, panel count and installed price.`,
    url: `${SITE_URL}/sizing`,
    type: 'website',
  },
  alternates: { canonical: `${SITE_URL}/sizing` },
};

export default function SizingHubPage() {
  const groups = scenariosByCategory();
  const waText = `Hi SolarBuilders, I'm trying to size a system and I'm not sure which of your sizing guides matches my place. Can you help? ${SITE_URL}/sizing`;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>

      <header className="bg-white border-b border-slate-100 px-6 py-12 md:py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-heading font-extrabold text-[#0A0F1E] text-3xl md:text-5xl mb-5 max-w-4xl">
            What size solar system do you actually need?
          </h1>
          <p className="text-slate-600 text-lg max-w-3xl leading-relaxed">
            {SIZING_SCENARIOS.length} of the questions Nigerians ask before buying — one air conditioner, a two-bedroom
            flat, a shop, a borehole pump — each answered with an inverter size, a battery size, a panel count and an
            installed price. Nothing here is a guess or a round number copied from a vendor: every figure on every page
            is produced by the same quote engine that powers our calculator, from equipment prices last checked{' '}
            {PRICES_LAST_UPDATED_LABEL}.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-7">
            <Link
              href="/calculator"
              className="inline-flex items-center justify-center gap-2 bg-[#0A0F1E] text-white font-semibold px-6 py-3 rounded-2xl hover:bg-[#1E293B] transition-colors"
            >
              <Calculator className="w-4 h-4" /> Size my own load
            </Link>
            <WhatsAppLink
              text={waText}
              placement="sizing:hub"
              className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-[#0A0F1E] font-semibold px-6 py-3 rounded-2xl hover:border-slate-300 transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> Ask us on WhatsApp
            </WhatsAppLink>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        {groups.map((group) => (
          <section key={group.category} className="mb-14 last:mb-0">
            <h2 className="font-heading font-extrabold text-[#0A0F1E] text-2xl md:text-3xl mb-2">{group.label}</h2>
            <p className="text-slate-500 mb-6 max-w-3xl">{group.blurb}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.scenarios.map((s) => {
                const t = scenarioQuote(s).tiers.standard;
                return (
                  <Link
                    key={s.slug}
                    href={`/sizing/${s.slug}`}
                    className="rounded-2xl border border-slate-100 p-6 hover:border-slate-300 transition-colors flex flex-col"
                  >
                    <h3 className="font-heading font-bold text-[#0A0F1E] text-lg mb-2">{s.h1}</h3>
                    <p className="text-slate-500 text-sm mb-4 flex-1 leading-relaxed">{s.question}</p>
                    <div className="font-heading font-extrabold text-[#0A0F1E]">
                      {num(t.inverterKva)}kVA · {num(t.batteryKwh)}kWh · {t.panelCount} panel
                      {t.panelCount === 1 ? '' : 's'}
                    </div>
                    <div className="text-slate-400 text-sm mt-1">
                      from {formatNairaShort(t.total.low)} installed · {formatRange(t.total)}
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#F59E0B] mt-4">
                      See the full answer <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        <section className="mt-16">
          <div className="rounded-2xl border border-slate-100 p-6 md:p-8">
            <h2 className="font-heading font-bold text-[#0A0F1E] text-xl mb-3">How these numbers are produced</h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              Each page starts from a list of appliances with their watts and the hours they run. The inverter is sized
              from the peak — every appliance on at once — plus headroom, because an undersized inverter trips. The
              battery is sized from the average running load and the hours of backup you want. The array is sized to
              replace the day&apos;s energy at the peak sun hours a Nigerian roof actually gets, after system losses.
              Prices come from one table of Nigerian market rates, last checked {PRICES_LAST_UPDATED_LABEL}, and every
              page shows the low, mid and high of that range rather than a single number we cannot stand behind.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link
                href="/calculator"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A0F1E] border border-slate-200 rounded-2xl px-5 py-3 hover:border-slate-300 transition-colors"
              >
                Build your own list <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/brands"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A0F1E] border border-slate-200 rounded-2xl px-5 py-3 hover:border-slate-300 transition-colors"
              >
                Brand prices in Nigeria <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/compare"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A0F1E] border border-slate-200 rounded-2xl px-5 py-3 hover:border-slate-300 transition-colors"
              >
                Compare brands <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      </main>
      <Footer />
    </div>
  );
}
