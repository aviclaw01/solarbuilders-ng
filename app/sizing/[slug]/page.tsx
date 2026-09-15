import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import WhatsAppLink from '@/components/ui/WhatsAppLink';
import {
  ArrowRight,
  BatteryCharging,
  CheckCircle2,
  MessageCircle,
  Ruler,
  Sun,
  Zap,
} from 'lucide-react';
import {
  SIZING_RULES,
  SIZING_SCENARIOS,
  getScenario,
  relatedScenarios,
  scenarioQuote,
  type SizingScenario,
} from '@/lib/sizing';
import {
  formatNaira,
  formatNairaShort,
  formatRange,
  quoteUrl,
  type Quote,
  type TierKey,
  type TierQuote,
} from '@/lib/quote';
import { LITHIUM_MODULE_KWH, PANEL_WATTS, PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { SITE_URL } from '@/lib/site';
import { comparisonPairs, type ProductCategory } from '@/lib/brands';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

interface Props {
  params: Promise<{ slug: string }>;
}

const TIER_ORDER: TierKey[] = ['budget', 'standard', 'premium'];

export function generateStaticParams() {
  return SIZING_SCENARIOS.map((s) => ({ slug: s.slug }));
}

// ─────────────────────────────────────────────────────────
// Formatting — every figure below comes from the quote engine
// ─────────────────────────────────────────────────────────

/** 5 → "5", 5.12 → "5.12", 10.5 → "10.5" */
function num(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}

function kwh(n: number): string {
  return `${num(n)}kWh`;
}

function dailyKwhOf(watts: number, qty: number, hoursPerDay: number): number {
  return (watts * qty * hoursPerDay) / 1000;
}

function panelPhrase(t: TierQuote): string {
  return `${t.panelCount} × ${t.panelWatts}W panels (${num(t.arrayKwp)}kWp)`;
}

/** The one-line answer, assembled from the standard tier. */
function headlineAnswer(t: TierQuote): string {
  return `${num(t.inverterKva)}kVA inverter, ${kwh(t.batteryKwh)} lithium battery and ${panelPhrase(t)}`;
}

/** The part of the title that answers the question being asked. */
function titleAnswer(scenario: SizingScenario, t: TierQuote): string {
  if (scenario.category === 'capacity') return `${kwh(t.batteryKwh)} · ${t.panelCount} panels`;
  if (scenario.slug.startsWith('how-many-solar-panels')) {
    return `${t.panelCount} panels · ${num(t.inverterKva)}kVA`;
  }
  return `${num(t.inverterKva)}kVA`;
}

/** Stable per-slug pick so each page links to a different, relevant comparison. */
function slugHash(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h;
}

function relatedComparisons(slug: string) {
  const h = slugHash(slug);
  const out: { slug: string; label: string; note: string }[] = [];
  const byCategory = (c: ProductCategory) => comparisonPairs().filter((p) => p.categories.includes(c));
  const note: Record<ProductCategory, string> = {
    inverter: 'Inverter brands, priced per kVA',
    battery: 'Lithium storage, priced per kWh',
    panel: 'Panels, priced per watt',
    controller: 'Charge controllers',
    package: 'Packaged systems',
  };
  (['inverter', 'battery', 'panel'] as ProductCategory[]).forEach((category, i) => {
    const pool = byCategory(category);
    if (pool.length === 0) return;
    const pair = pool[(h + i * 7) % pool.length];
    if (out.some((x) => x.slug === pair.slug)) return;
    out.push({ slug: pair.slug, label: `${pair.a.name} vs ${pair.b.name}`, note: note[category] });
  });
  return out;
}

// ─────────────────────────────────────────────────────────
// FAQs — every answer is a computed figure
// ─────────────────────────────────────────────────────────

function buildFaqs(scenario: SizingScenario, quote: Quote): Array<{ q: string; a: string }> {
  const t = quote.tiers.standard;
  const b = quote.tiers.budget;
  const p = quote.tiers.premium;

  return [
    {
      q: scenario.question,
      a:
        `${headlineAnswer(t)}. Installed in Lagos, Abuja or Port Harcourt that works out at ${formatRange(t.total)}, ` +
        `with ${formatNaira(t.total.best)} as the realistic middle, at ${PRICES_LAST_UPDATED_LABEL} Nigerian prices. ` +
        `The load is ${num(quote.peakWatts)}W if everything runs at once and ${kwh(quote.dailyKwh)} across a day.`,
    },
    {
      q: `How many batteries does this need?`,
      a:
        `${t.batteryModules} × ${num(LITHIUM_MODULE_KWH)}kWh LiFePO4 module${t.batteryModules === 1 ? '' : 's'}, ` +
        `so ${kwh(t.batteryKwh)} installed. That is sized to carry the average running load of this list for about ` +
        `${t.autonomyHours} hours after dark. Drop to ${b.autonomyHours} hours and it is ${kwh(b.batteryKwh)} ` +
        `(${b.batteryModules} module${b.batteryModules === 1 ? '' : 's'}); go to ${p.autonomyHours} hours and it is ` +
        `${kwh(p.batteryKwh)} (${p.batteryModules} modules).`,
    },
    {
      q: `How many solar panels, and will they cover the load?`,
      a:
        `${panelPhrase(t)}. At the 5.5 peak sun hours a Nigerian roof averages and 78% system efficiency, that array is ` +
        `sized to replace the ${kwh(quote.dailyKwh)} this load uses each day. Each ${PANEL_WATTS}W module is a little over ` +
        `2m long and about 1.1m wide, so count ${t.panelCount} of them on one unshaded roof plane before you commit.`,
    },
    {
      q: `What is the difference between the budget, standard and premium versions?`,
      a:
        `Budget: ${num(b.inverterKva)}kVA, ${kwh(b.batteryKwh)}, ${b.panelCount} panels, about ${b.autonomyHours}h backup — ` +
        `${formatRange(b.total)}. Standard: ${num(t.inverterKva)}kVA, ${kwh(t.batteryKwh)}, ${t.panelCount} panels, about ` +
        `${t.autonomyHours}h — ${formatRange(t.total)}. Premium: ${num(p.inverterKva)}kVA, ${kwh(p.batteryKwh)}, ` +
        `${p.panelCount} panels, about ${p.autonomyHours}h — ${formatRange(p.total)}. The inverter is sized from the same ` +
        `peak load in every tier; what you buy with the extra money is backup hours, panel headroom and inverter class.`,
    },
  ];
}

// ─────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const scenario = getScenario(slug);
  if (!scenario) return { title: 'Sizing guide | SolarBuilders.ng' };

  const quote = scenarioQuote(scenario);
  const t = quote.tiers.standard;
  const title = `${scenario.question} (${titleAnswer(scenario, t)}) | SolarBuilders.ng`;
  const description =
    `${headlineAnswer(t)} — ${formatRange(t.total)} installed at ${PRICES_LAST_UPDATED_LABEL} Nigerian prices. ` +
    `Peak load ${num(quote.peakWatts)}W, ${kwh(quote.dailyKwh)} a day. Every figure computed, with the full bill of materials.`;

  return {
    title,
    description,
    keywords: [
      scenario.question.replace(/\?$/, ''),
      `${scenario.h1} Nigeria`,
      `${num(t.inverterKva)}kVA inverter price Nigeria`,
      'solar sizing Nigeria',
      'inverter size calculator Nigeria',
    ],
    openGraph: {
      title: `${scenario.h1} — ${headlineAnswer(t)}`,
      description,
      url: `${SITE_URL}/sizing/${scenario.slug}`,
      type: 'article',
    },
    alternates: { canonical: `${SITE_URL}/sizing/${scenario.slug}` },
  };
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default async function SizingScenarioPage({ params }: Props) {
  const { slug } = await params;
  const scenario = getScenario(slug);
  if (!scenario) notFound();

  const quote = scenarioQuote(scenario);
  const standard = quote.tiers.standard;
  const faqs = buildFaqs(scenario, quote);
  const related = relatedScenarios(scenario, 4);
  const comparisons = relatedComparisons(scenario.slug);
  const calcUrl = quoteUrl(quote, 'standard', SITE_URL);

  const waText =
    `Hi SolarBuilders, I read ${SITE_URL}/sizing/${scenario.slug} — ` +
    `${headlineAnswer(standard)}, quote ${quote.code}. Can you confirm the size and price for my place?`;

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const answerStats = [
    { icon: Zap, label: 'Inverter', value: `${num(standard.inverterKva)}kVA` },
    { icon: BatteryCharging, label: 'Battery', value: kwh(standard.batteryKwh) },
    { icon: Sun, label: 'Panels', value: `${standard.panelCount} × ${standard.panelWatts}W` },
    { icon: Ruler, label: 'Installed', value: formatRange(standard.total) },
  ];

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Navbar />
      <main>

      {/* Hero — the answer is in the first sentence */}
      <header className="bg-white border-b border-slate-100 px-6 py-12 md:py-16">
        <div className="max-w-6xl mx-auto">
          <Breadcrumbs trail={[{ href: '/sizing', label: 'Sizing guides' }, { label: scenario.question }]} className="mb-6" />
          <nav className="text-sm text-slate-400 mb-6">
            <Link href="/sizing" className="hover:text-slate-700">Sizing</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-600">{scenario.h1}</span>
          </nav>

          <h1 className="font-heading font-extrabold text-[#0A0F1E] text-3xl md:text-5xl mb-5">
            {scenario.h1}
          </h1>

          <p className="text-slate-700 text-lg md:text-xl max-w-3xl leading-relaxed">
            <strong className="font-semibold text-[#0A0F1E]">Short answer:</strong>{' '}
            a {num(standard.inverterKva)}kVA inverter, {kwh(standard.batteryKwh)} of lithium battery and{' '}
            {standard.panelCount} × {standard.panelWatts}W panels — {formatRange(standard.total)} installed.
          </p>

          <p className="text-slate-500 mt-4 max-w-3xl leading-relaxed">{scenario.intro}</p>

          <p className="text-slate-400 text-sm mt-4">
            Quote {quote.code} · equipment priced at Nigerian market rates last checked {PRICES_LAST_UPDATED_LABEL}.
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        {/* The answer box */}
        <section className="mb-16">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 md:p-8">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle2 className="w-5 h-5 text-[#F59E0B]" />
              <h2 className="font-heading font-bold text-[#0A0F1E] text-xl">The answer</h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {answerStats.map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5">
                  <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wide mb-2">
                    <Icon className="w-4 h-4" />
                    {label}
                  </div>
                  <div className="font-heading font-extrabold text-[#0A0F1E] text-xl md:text-2xl">{value}</div>
                </div>
              ))}
            </div>

            <p className="text-slate-700 mt-6 leading-relaxed">
              That is the Standard build for this load: {num(quote.peakWatts)}W if every appliance runs at the same
              moment, {kwh(quote.dailyKwh)} across a normal day, and about {standard.autonomyHours} hours of backup once
              the sun is down. Best single estimate: {formatNaira(standard.total.best)}.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <a
                href={calcUrl}
                className="inline-flex items-center justify-center gap-2 bg-[#0A0F1E] text-white font-semibold px-6 py-3 rounded-2xl hover:bg-[#1E293B] transition-colors"
              >
                Open this exact load in the calculator <ArrowRight className="w-4 h-4" />
              </a>
              <WhatsAppLink
                text={waText}
                placement={`sizing:${scenario.slug}`}
                quoteCode={quote.code}
                className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-[#0A0F1E] font-semibold px-6 py-3 rounded-2xl hover:border-slate-300 transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> Ask us on WhatsApp
              </WhatsAppLink>
            </div>
          </div>
        </section>

        {/* The load */}
        <section className="mb-16">
          <h2 className="font-heading font-extrabold text-[#0A0F1E] text-2xl md:text-3xl mb-3">
            The load this is sized for
          </h2>
          <p className="text-slate-500 mb-6 max-w-3xl">
            {scenario.category === 'capacity'
              ? 'This is one representative load that lands on this inverter size — not the only one. Anything that adds up to the same peak watts and daily kWh sizes the same system.'
              : 'Daily hours are the calculator defaults. Change any of them — and add or remove anything — by opening this load in the calculator.'}
          </p>

          <div className="rounded-2xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left font-semibold text-slate-400 text-xs uppercase tracking-wide px-4 py-3">Appliance</th>
                    <th className="text-right font-semibold text-slate-400 text-xs uppercase tracking-wide px-4 py-3">Watts each</th>
                    <th className="text-right font-semibold text-slate-400 text-xs uppercase tracking-wide px-4 py-3">Qty</th>
                    <th className="text-right font-semibold text-slate-400 text-xs uppercase tracking-wide px-4 py-3">Hours/day</th>
                    <th className="text-right font-semibold text-slate-400 text-xs uppercase tracking-wide px-4 py-3">kWh/day</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.appliances.map((ap) => (
                    <tr key={ap.id} className="border-b border-slate-100 last:border-0">
                      <th scope="row" className="text-left font-medium text-[#0A0F1E] px-4 py-3">{ap.name}</th>
                      <td className="text-right text-slate-600 px-4 py-3">{ap.watts}W</td>
                      <td className="text-right text-slate-600 px-4 py-3">{ap.qty}</td>
                      <td className="text-right text-slate-600 px-4 py-3">{num(ap.hoursPerDay)}</td>
                      <td className="text-right text-[#0A0F1E] font-medium px-4 py-3">
                        {num(dailyKwhOf(ap.watts, ap.qty, ap.hoursPerDay))}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50">
                    <th scope="row" className="text-left font-heading font-bold text-[#0A0F1E] px-4 py-3">Total</th>
                    <td className="text-right font-bold text-[#0A0F1E] px-4 py-3" colSpan={3}>
                      {num(quote.peakWatts)}W peak
                    </td>
                    <td className="text-right font-bold text-[#0A0F1E] px-4 py-3">{num(quote.dailyKwh)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Three tiers */}
        <section className="mb-16">
          <h2 className="font-heading font-extrabold text-[#0A0F1E] text-2xl md:text-3xl mb-3">
            Three ways to build it
          </h2>
          <p className="text-slate-500 mb-6 max-w-3xl">
            Same load, three budgets. The inverter is sized from the full peak in every tier — an undersized inverter
            trips, so that is not where you save. What changes is backup hours, panel headroom and component class.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TIER_ORDER.map((key) => {
              const t = quote.tiers[key];
              const isStandard = key === 'standard';
              return (
                <div
                  key={key}
                  className={`rounded-2xl border p-6 ${
                    isStandard ? 'border-[#F59E0B] bg-amber-50/40' : 'border-slate-100 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-heading font-bold text-[#0A0F1E] text-lg">
                      {t.emoji} {t.label}
                    </h3>
                    {isStandard && (
                      <span className="text-[10px] uppercase tracking-wide font-bold text-[#F59E0B]">Most installed</span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs mb-5">{t.tagline}</p>

                  <dl className="space-y-2 text-sm">
                    {[
                      ['Inverter', `${num(t.inverterKva)}kVA`],
                      ['Battery', `${kwh(t.batteryKwh)} · ${t.batteryModules} module${t.batteryModules === 1 ? '' : 's'}`],
                      ['Panels', `${t.panelCount} × ${t.panelWatts}W · ${num(t.arrayKwp)}kWp`],
                      ['Backup', `about ${t.autonomyHours}h`],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-baseline justify-between gap-3">
                        <dt className="text-slate-500">{label}</dt>
                        <dd className="text-[#0A0F1E] font-medium text-right">{value}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-5 pt-5 border-t border-slate-100">
                    <div className="font-heading font-extrabold text-[#0A0F1E] text-xl">{formatRange(t.total)}</div>
                    <div className="text-slate-400 text-xs mt-1">
                      best estimate {formatNairaShort(t.total.best)} · installed
                    </div>
                  </div>

                  <p className="text-slate-500 text-xs mt-4 leading-relaxed">{t.note}</p>

                  <a
                    href={quoteUrl(quote, key, SITE_URL)}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0A0F1E] mt-4 hover:text-[#F59E0B] transition-colors"
                  >
                    Open in calculator <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
        </section>

        {/* Bill of materials */}
        <section className="mb-16">
          <h2 className="font-heading font-extrabold text-[#0A0F1E] text-2xl md:text-3xl mb-3">
            What you are actually buying (Standard)
          </h2>
          <p className="text-slate-500 mb-6 max-w-3xl">
            Line by line, at Nigerian market prices last checked {PRICES_LAST_UPDATED_LABEL}. The low column is the
            Alaba/wholesale floor, the high column is showroom retail — most real installs land between them.
          </p>

          <div className="rounded-2xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left font-semibold text-slate-400 text-xs uppercase tracking-wide px-4 py-3">Item</th>
                    <th className="text-right font-semibold text-slate-400 text-xs uppercase tracking-wide px-4 py-3">Qty</th>
                    <th className="text-right font-semibold text-slate-400 text-xs uppercase tracking-wide px-4 py-3">Line cost</th>
                    <th className="text-right font-semibold text-slate-400 text-xs uppercase tracking-wide px-4 py-3">Range</th>
                  </tr>
                </thead>
                <tbody>
                  {standard.bom.map((line) => (
                    <tr key={line.key} className="border-b border-slate-100 last:border-0 align-top">
                      <th scope="row" className="text-left px-4 py-3">
                        <span className="font-medium text-[#0A0F1E] block">{line.item}</span>
                        <span className="text-slate-400 text-xs block mt-0.5">{line.spec}</span>
                      </th>
                      <td className="text-right text-slate-600 px-4 py-3 whitespace-nowrap">
                        {line.qty} {line.unit}
                        {line.qty === 1 ? '' : 's'}
                      </td>
                      <td className="text-right text-[#0A0F1E] font-medium px-4 py-3 whitespace-nowrap">
                        {formatNaira(line.lineCost.best)}
                      </td>
                      <td className="text-right text-slate-400 px-4 py-3 whitespace-nowrap">{formatRange(line.lineCost)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50">
                    <th scope="row" className="text-left font-heading font-bold text-[#0A0F1E] px-4 py-3">
                      Installed total
                    </th>
                    <td className="px-4 py-3" />
                    <td className="text-right font-heading font-bold text-[#0A0F1E] px-4 py-3 whitespace-nowrap">
                      {formatNaira(standard.total.best)}
                    </td>
                    <td className="text-right font-bold text-slate-500 px-4 py-3 whitespace-nowrap">
                      {formatRange(standard.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-slate-400 text-sm mt-4 max-w-3xl">
            Equipment {formatRange(standard.equipment)} · mounting, cables and protection {formatRange(standard.bos)} ·
            labour {formatRange(standard.labour)}. Transport outside Lagos, Abuja or Port Harcourt is extra.
          </p>
        </section>

        {/* Why this size */}
        <section className="mb-16">
          <h2 className="font-heading font-extrabold text-[#0A0F1E] text-2xl md:text-3xl mb-6">Why this size</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-slate-100 p-6">
              <h3 className="font-heading font-bold text-[#0A0F1E] mb-2">The inverter comes from the worst moment</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Add up every appliance as if it switched on together — {num(quote.peakWatts)}W here — then add{' '}
                {Math.round((SIZING_RULES.inverterHeadroom - 1) * 100)}% headroom so the unit is never running flat out,
                and round up to a size sold in Nigeria. That gives {num(standard.inverterKva)}kVA. Sizing the inverter on
                an average instead of the peak is the single most common mistake in Nigerian quotes: the system works
                until the day everything is on, then it trips. Motors — pumps, fridges, compressors — also pull several
                times their running watts for the first second, so check the inverter's surge rating, not just its kVA.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 p-6">
              <h3 className="font-heading font-bold text-[#0A0F1E] mb-2">The battery comes from how long you want it</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Nothing runs at peak all night. We take {Math.round(SIZING_RULES.loadFactor * 100)}% of peak as the real
                running load, multiply by the hours of backup you want, and allow for lithium only being safely emptied
                to about {Math.round(SIZING_RULES.lithiumUsableDoD * 100)}%. At {standard.autonomyHours} hours that is{' '}
                {kwh(standard.batteryKwh)} — {standard.batteryModules} module
                {standard.batteryModules === 1 ? '' : 's'} of {num(LITHIUM_MODULE_KWH)}kWh. Because Nigerian solar sits
                alongside the grid rather than replacing it outright, buying backup for every possible hour is where
                budgets get wasted; six hours covers the usual overnight outage.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 p-6">
              <h3 className="font-heading font-bold text-[#0A0F1E] mb-2">The panels come from the day's energy</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                This load uses {kwh(quote.dailyKwh)} a day. A Nigerian roof averages about {SIZING_RULES.peakSunHours}{' '}
                peak sun hours, and roughly {Math.round(SIZING_RULES.systemEfficiency * 100)}% of what the panels make
                survives heat, wiring, the charge controller and the round trip through the battery. Divide one by the
                other and round up to whole {PANEL_WATTS}W modules: {panelPhrase(standard)}. Harmattan dust and a
                genuinely overcast week will cut that — which is why the Premium build adds panels rather than battery.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 p-6">
              <h3 className="font-heading font-bold text-[#0A0F1E] mb-2">What it replaces</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                A generator sized for this load would have to burn fuel for every one of these {kwh(quote.dailyKwh)},
                every day, plus servicing — and it still cannot run quietly at 2am. Solar front-loads that cost into{' '}
                {formatRange(standard.total)} once. Whether that pays back faster than your current fuel bill depends on
                how many hours of supply you actually get, so work it out on your own PHCN hours before you commit — we
                will do that with you rather than sell you a bigger system than the numbers justify.
              </p>
            </div>
          </div>
        </section>

        {/* FAQs — same Q&As as the JSON-LD above */}
        <section className="mb-16">
          <h2 className="font-heading font-extrabold text-[#0A0F1E] text-2xl md:text-3xl mb-6">
            Questions people ask about this
          </h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="rounded-2xl border border-slate-100 p-6">
                <h3 className="font-heading font-bold text-[#0A0F1E] mb-2">{f.q}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mb-16">
          <div className="rounded-2xl bg-[#0A0F1E] text-white p-8 md:p-10">
            <h2 className="font-heading font-extrabold text-2xl md:text-3xl mb-3">
              Your list is not exactly this list
            </h2>
            <p className="text-slate-300 max-w-2xl leading-relaxed">
              Open this exact load in the calculator, add the things you own and delete the things you do not, and the
              inverter, battery, panels and price all move with it. Then send it to us and we will source the equipment
              at the price on the page.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <a
                href={calcUrl}
                className="inline-flex items-center justify-center gap-2 bg-[#F59E0B] text-[#0A0F1E] font-bold px-6 py-3 rounded-2xl hover:bg-amber-400 transition-colors"
              >
                Open this exact load in the calculator <ArrowRight className="w-4 h-4" />
              </a>
              <WhatsAppLink
                text={waText}
                placement={`sizing:${scenario.slug}:footer`}
                quoteCode={quote.code}
                className="inline-flex items-center justify-center gap-2 border border-white/20 text-white font-semibold px-6 py-3 rounded-2xl hover:bg-white/10 transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> Send it to us on WhatsApp
              </WhatsAppLink>
            </div>
          </div>
        </section>

        {/* Cross-links */}
        <section>
          <h2 className="font-heading font-extrabold text-[#0A0F1E] text-2xl md:text-3xl mb-6">Next questions</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {related.map((r) => {
              const rt = scenarioQuote(r).tiers.standard;
              return (
                <Link
                  key={r.slug}
                  href={`/sizing/${r.slug}`}
                  className="rounded-2xl border border-slate-100 p-5 hover:border-slate-300 transition-colors"
                >
                  <span className="font-heading font-bold text-[#0A0F1E] block mb-1">{r.h1}</span>
                  <span className="text-slate-500 text-sm">
                    {num(rt.inverterKva)}kVA · {kwh(rt.batteryKwh)} · {rt.panelCount} panels · from{' '}
                    {formatNairaShort(rt.total.low)}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {comparisons.map((c) => (
              <Link
                key={c.slug}
                href={`/compare/${c.slug}`}
                className="rounded-2xl border border-slate-100 p-5 hover:border-slate-300 transition-colors"
              >
                <span className="font-heading font-bold text-[#0A0F1E] block mb-1">{c.label}</span>
                <span className="text-slate-500 text-sm">{c.note}</span>
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/sizing"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A0F1E] border border-slate-200 rounded-2xl px-5 py-3 hover:border-slate-300 transition-colors"
            >
              All sizing questions <ArrowRight className="w-4 h-4" />
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
              All brand comparisons <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>

      </main>
      <Footer />
    </div>
  );
}
