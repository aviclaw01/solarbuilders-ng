import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import WhatsAppLink from '@/components/ui/WhatsAppLink';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import {
  ArrowRight,
  BatteryCharging,
  Calculator,
  CheckCircle2,
  MessageCircle,
  Sun,
  TriangleAlert,
  Wallet,
  Zap,
} from 'lucide-react';
import {
  BUDGET_POINTS,
  arrayDailyKwh,
  budgetAnswer,
  budgetVariants,
  getBudgetPoint,
  nextBudgetPoint,
  previousBudgetPoint,
  unservedLoads,
  type BudgetAnswer,
  type BudgetBuild,
  type BudgetPoint,
  type UnservedLoad,
} from '@/lib/budget';
import {
  INVERTER_TIER_LABEL,
  formatNaira,
  formatNairaShort,
  formatRange,
  quoteUrl,
} from '@/lib/quote';
import { PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { SITE_URL } from '@/lib/site';

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return BUDGET_POINTS.map((p) => ({ slug: p.slug }));
}

// ─────────────────────────────────────────────────────────
// Formatting — every figure below comes out of the engine
// ─────────────────────────────────────────────────────────

function num(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}

function kwh(n: number): string {
  return `${num(n)}kWh`;
}

function dailyKwhOf(watts: number, qty: number, hoursPerDay: number): number {
  return (watts * qty * hoursPerDay) / 1000;
}

function batteryWord(build: BudgetBuild): string {
  return build.battery === 'tubular' ? 'tubular (lead-acid)' : 'lithium';
}

/** BOM units are singular nouns; "batterys" is the one that does not take a bare -s. */
function units(qty: number, unit: string): string {
  if (qty === 1) return `1 ${unit}`;
  return `${qty} ${unit === 'battery' ? 'batteries' : `${unit}s`}`;
}

/** The covered part of a bill that the money cannot finish, as a list. */
function coveredList(answer: BudgetAnswer): string {
  return answer
    .shortfall!.lines.filter((l) => l.qtyCovered > 0)
    .map((l) => `${l.qtyCovered > 1 ? `${l.qtyCovered} × ` : ''}${l.line.item.toLowerCase()}`)
    .join(', ');
}

/**
 * What the covered part of the bill honestly amounts to. Buying an inverter and
 * a battery is a real purchase; calling it solar is not.
 */
function shortfallVerdict(answer: BudgetAnswer): string {
  const panels = answer.shortfall!.lines.find((l) => l.line.key === 'panels')!;
  if (panels.qtyCovered === 0) {
    return (
      'Without a single panel that is not a solar system at all — it is an inverter and a battery that charge off ' +
      'the grid. A real and common first purchase in Nigeria, but it makes no electricity of its own.'
    );
  }
  if (panels.fullyCovered) {
    return `That is the equipment on the roof and nothing paid to the person fitting it, which is the one line of a solar bill you cannot do without.`;
  }
  return 'One panel is not an array. It charges nothing meaningful on its own, and the rest of the bill is still unpaid.';
}

/** "an 8kVA", "a 5kVA" — the engine's standard sizes include 8, 11 and 18. */
function article(kva: number): string {
  return /^(8|11|18)/.test(num(kva)) ? 'an' : 'a';
}

/** The one-line answer for a budget that does buy something. */
function buildAnswer(build: BudgetBuild): string {
  const kva = build.tier.inverterKva;
  return (
    `${article(kva)} ${num(kva)}kVA inverter, ${kwh(build.tier.batteryKwh)} of ${batteryWord(build)} battery ` +
    `and ${build.tier.panelCount} × ${build.tier.panelWatts}W panels`
  );
}

function titleAnswer(answer: BudgetAnswer): string {
  if (!answer.build) return 'honestly, not a solar system';
  const t = answer.build.tier;
  return `${num(t.inverterKva)}kVA · ${kwh(t.batteryKwh)} · ${t.panelCount} panels`;
}

const UNSERVED_REASON: Record<UnservedLoad['reason'], string> = {
  'over-inverter': 'Not at all — the inverter cannot start it',
  'needs-others-off': 'Only with other things switched off',
};

// ─────────────────────────────────────────────────────────
// FAQs — the phrasings people actually type, answered with figures
// ─────────────────────────────────────────────────────────

function buildFaqs(answer: BudgetAnswer): Array<{ q: string; a: string }> {
  const { point, build, shortfall } = answer;
  const faqs: Array<{ q: string; a: string }> = [];

  if (build) {
    const t = build.tier;
    const unserved = unservedLoads(build);
    const cannot = unserved.filter((u) => u.reason === 'over-inverter');
    const array = arrayDailyKwh(t);

    faqs.push({
      q: `I have ${point.label} set aside for solar. Kindly advise me if this is feasible.`,
      a:
        `Yes, at ${PRICES_LAST_UPDATED_LABEL} Nigerian prices. ${point.label} buys ${buildAnswer(build)} — ` +
        `${formatNaira(build.price)} installed as a realistic middle estimate, with the whole range running ` +
        `${formatRange(t.total)}. That build is designed to carry ${build.rung.summary}, with about ` +
        `${t.autonomyHours} hours of backup once the sun is down.`,
    });
    faqs.push({
      q: `What will ${point.label} of solar not run?`,
      a:
        (cannot.length > 0
          ? `${cannot.map((u) => u.name).join(', ')} — ${article(t.inverterKva)} ${num(t.inverterKva)}kVA inverter ` +
            `cannot start ${cannot.length === 1 ? 'it' : 'them'} at all. `
          : '') +
        (unserved.length > 0
          ? `Of the heavy loads we check, these are the ones this build will not carry alongside everything else: ` +
            `${unserved.map((u) => u.name).join(', ')}. `
          : `Of the heavy loads we check, none is beyond this inverter. `) +
        `Separately, the array makes about ${kwh(Math.round(array * 10) / 10)} on an average Nigerian day against ` +
        `${kwh(build.quote.dailyKwh)} of daily load, so the shortfall comes from the grid or a generator. A build at ` +
        `this budget supplements NEPA; it does not replace it.`,
    });
    faqs.push({
      q: `How many batteries and panels is that?`,
      a:
        `${t.batteryModules} × ${build.battery === 'tubular' ? '200Ah 12V tubular batteries' : 'LiFePO4 modules'} ` +
        `(${kwh(t.batteryKwh)} installed) and ${t.panelCount} × ${t.panelWatts}W panels, ${num(t.arrayKwp)}kWp of array. ` +
        `Count ${t.panelCount} panels onto one unshaded roof plane before you commit — each is a little over 2m long.`,
    });
  }

  if (shortfall) {
    const s = shortfall;
    faqs.push({
      q: `I have ${point.label} for solar. Can I get a good solar system with it?`,
      a:
        `Not at ${PRICES_LAST_UPDATED_LABEL} Nigerian prices. The cheapest complete system our price table can produce — ` +
        `the smallest hybrid inverter, the cheapest batteries, two panels, wiring and labour — is ${formatNaira(s.cheapest.price)}, ` +
        `so ${point.label} is ${formatNaira(s.shortBy)} short. Spending it anyway means buying part of a system: the money ` +
        `runs out at the "${s.stoppedAt.item}" line of the bill, having covered ${formatNaira(s.spentBefore)}.`,
    });
    faqs.push({
      q: `So what does ${point.label} actually buy?`,
      a: `Working down that same bill: ${coveredList(answer)}. ${shortfallVerdict(answer)}`,
    });
  }

  faqs.push({
    q: `Are these prices real, and when were they checked?`,
    a:
      `Every figure on this page is computed from one table of Nigerian market prices, last checked ${PRICES_LAST_UPDATED_LABEL}, ` +
      `using the same engine as our calculator. We publish a low, a middle and a high for each line rather than one number: ` +
      `the low is the Alaba/wholesale floor, the high is showroom retail, and real installs land between them. Prices move, ` +
      `so treat the date as part of the answer.`,
  });

  return faqs;
}

// ─────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const point = getBudgetPoint(slug);
  if (!point) return { title: 'Solar on a budget | SolarBuilders.ng' };

  const answer = budgetAnswer(point);
  const question = `What can ${point.label} of solar get you in Nigeria?`;
  const description = answer.build
    ? `${point.label} buys ${buildAnswer(answer.build)} — ${formatNaira(answer.build.price)} installed ` +
      `(${formatRange(answer.build.tier.total)}) at ${PRICES_LAST_UPDATED_LABEL} Nigerian prices. What it runs, what it ` +
      `will not run, and the itemised bill.`
    : `At ${PRICES_LAST_UPDATED_LABEL} Nigerian prices ${point.label} does not buy a complete solar system — the cheapest ` +
      `one we can price is ${formatNaira(answer.shortfall!.cheapest.price)}. Here is exactly where the money stops, line by line.`;

  return {
    title: `${question} (${titleAnswer(answer)}) | SolarBuilders.ng`,
    description,
    keywords: [
      `what can ${point.label} of solar get you in nigeria`,
      `${point.label} solar system nigeria`,
      `solar system for ${point.label} nigeria`,
      'solar price nigeria budget',
      'how much solar can i get for my budget nigeria',
    ],
    openGraph: {
      title: `${question} — the honest answer`,
      description,
      url: `${SITE_URL}/budget/${point.slug}`,
      type: 'article',
    },
    alternates: { canonical: `${SITE_URL}/budget/${point.slug}` },
  };
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default async function BudgetPage({ params }: Props) {
  const { slug } = await params;
  const point = getBudgetPoint(slug);
  if (!point) notFound();

  const answer = budgetAnswer(point);
  const faqs = buildFaqs(answer);
  const next = nextBudgetPoint(point);
  const previous = previousBudgetPoint(point);
  const question = `What can ${point.label} of solar get you in Nigeria?`;

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const waText = answer.build
    ? `Hi SolarBuilders, I read ${SITE_URL}/budget/${point.slug} — I have ${point.label} and the page says that is ` +
      `${buildAnswer(answer.build)}, quote ${answer.build.quote.code}. Can you confirm it for my place?`
    : `Hi SolarBuilders, I read ${SITE_URL}/budget/${point.slug} — I have ${point.label} and the page says that is not ` +
      `enough for a full system yet. What would you do with it?`;

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Navbar />
      <main>
        <header className="bg-white border-b border-slate-100 px-6 py-12 md:py-16">
          <div className="max-w-6xl mx-auto">
            <Breadcrumbs trail={[{ href: '/budget', label: 'Solar by budget' }, { label: question }]} className="mb-6" />

            <h1 className="font-heading font-extrabold text-[#0A0F1E] text-3xl md:text-5xl mb-5">
              What Can {point.label} of Solar Get You in Nigeria?
            </h1>

            {answer.build ? (
              <p className="text-slate-700 text-lg md:text-xl max-w-3xl leading-relaxed">
                <strong className="font-semibold text-[#0A0F1E]">Short answer:</strong> {buildAnswer(answer.build)} —{' '}
                {formatNaira(answer.build.price)} installed, which leaves about{' '}
                {formatNaira(answer.leftover)} of your {point.label}. It is built to carry {answer.build.rung.summary}.
              </p>
            ) : (
              <p className="text-slate-700 text-lg md:text-xl max-w-3xl leading-relaxed">
                <strong className="font-semibold text-[#0A0F1E]">Short answer: not a solar system.</strong> At{' '}
                {PRICES_LAST_UPDATED_LABEL} Nigerian prices the cheapest complete install we can price is{' '}
                {formatNaira(answer.shortfall!.cheapest.price)}, so {point.label} is{' '}
                {formatNaira(answer.shortfall!.shortBy)} short. We would rather tell you that than sell you a system that
                disappoints you.
              </p>
            )}

            <p className="text-slate-500 text-sm mt-4">
              Computed from Nigerian equipment prices last checked {PRICES_LAST_UPDATED_LABEL}
              {answer.build ? ` · quote ${answer.build.quote.code}` : ''}.
            </p>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
          {answer.build ? (
            <AffordableSections answer={answer} build={answer.build} point={point} waText={waText} />
          ) : (
            <ShortfallSections answer={answer} point={point} />
          )}

          {/* FAQs — same Q&As as the JSON-LD above */}
          <section className="mb-16">
            <h2 className="font-heading font-extrabold text-[#0A0F1E] text-2xl md:text-3xl mb-6">
              Questions people ask about this budget
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
                Your house is not the house on this page
              </h2>
              <p className="text-slate-300 max-w-2xl leading-relaxed">
                This page starts from a budget and works backwards to a system. The calculator runs the other way: tick
                what you actually own, and it returns the inverter, battery, panel count and price for that exact list.
                Do both and you will know whether your money and your load meet in the middle.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Link
                  href="/calculator"
                  className="inline-flex items-center justify-center gap-2 bg-[#F59E0B] text-[#0A0F1E] font-bold px-6 py-3 rounded-2xl hover:bg-amber-400 transition-colors"
                >
                  <Calculator className="w-4 h-4" /> Size my own load
                </Link>
                <WhatsAppLink
                  text={waText}
                  placement={`budget:${point.slug}:footer`}
                  quoteCode={answer.build?.quote.code}
                  className="inline-flex items-center justify-center gap-2 border border-white/20 text-white font-semibold px-6 py-3 rounded-2xl hover:bg-white/10 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" /> Talk to us about it
                </WhatsAppLink>
              </div>
            </div>
          </section>

          {/* Cross-links */}
          <section>
            <h2 className="font-heading font-extrabold text-[#0A0F1E] text-2xl md:text-3xl mb-6">Other budgets</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {[previous, next].filter((p): p is BudgetPoint => Boolean(p)).map((p) => {
                const other = budgetAnswer(p);
                return (
                  <Link
                    key={p.slug}
                    href={`/budget/${p.slug}`}
                    className="rounded-2xl border border-slate-100 p-5 hover:border-slate-300 transition-colors"
                  >
                    <span className="font-heading font-bold text-[#0A0F1E] block mb-1">
                      What can {p.label} of solar get you?
                    </span>
                    <span className="text-slate-500 text-sm">
                      {other.build
                        ? `${num(other.build.tier.inverterKva)}kVA · ${kwh(other.build.tier.batteryKwh)} · ${
                            other.build.tier.panelCount
                          } panels · ${formatNaira(other.build.price)} installed`
                        : `Not a complete system — ${formatNaira(other.shortfall!.shortBy)} short of the cheapest install`}
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/budget"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A0F1E] border border-slate-200 rounded-2xl px-5 py-3 hover:border-slate-300 transition-colors"
              >
                Every budget, side by side <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/sizing"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A0F1E] border border-slate-200 rounded-2xl px-5 py-3 hover:border-slate-300 transition-colors"
              >
                Start from appliances instead <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/blog/lithium-vs-tubular-battery-nigeria"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A0F1E] border border-slate-200 rounded-2xl px-5 py-3 hover:border-slate-300 transition-colors"
              >
                Lithium vs tubular <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/blog/solar-loans-nigeria"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A0F1E] border border-slate-200 rounded-2xl px-5 py-3 hover:border-slate-300 transition-colors"
              >
                Paying small small <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Branch: the budget buys a complete system
// ─────────────────────────────────────────────────────────

function AffordableSections({
  answer,
  build,
  point,
  waText,
}: {
  answer: BudgetAnswer;
  build: BudgetBuild;
  point: BudgetPoint;
  waText: string;
}) {
  const t = build.tier;
  const quote = build.quote;
  const unserved = unservedLoads(build);
  const variants = budgetVariants(answer);
  const array = Math.round(arrayDailyKwh(t) * 10) / 10;
  const next = nextBudgetPoint(point);
  const nextAnswer = next ? budgetAnswer(next) : null;
  const calcUrl = quoteUrl(quote, build.tierKey, SITE_URL);

  const stats = [
    { icon: Zap, label: 'Inverter', value: `${num(t.inverterKva)}kVA` },
    { icon: BatteryCharging, label: 'Battery', value: kwh(t.batteryKwh) },
    { icon: Sun, label: 'Panels', value: `${t.panelCount} × ${t.panelWatts}W` },
    { icon: Wallet, label: 'Installed', value: formatNaira(t.total.best) },
  ];

  return (
    <>
      <section className="mb-16">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle2 className="w-5 h-5 text-[#F59E0B]" />
            <h2 className="font-heading font-bold text-[#0A0F1E] text-xl">What {point.label} buys</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5">
                <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-wide mb-2">
                  <Icon className="w-4 h-4" />
                  {label}
                </div>
                <div className="font-heading font-extrabold text-[#0A0F1E] text-xl md:text-2xl">{value}</div>
              </div>
            ))}
          </div>

          <p className="text-slate-700 mt-6 leading-relaxed">
            {formatNaira(t.total.best)} is the realistic middle; the full range across Nigerian suppliers is{' '}
            {formatRange(t.total)}. The load it is sized for draws {num(quote.peakWatts)}W with everything on at once and
            uses {kwh(quote.dailyKwh)} across a day, with about {t.autonomyHours} hours of backup after dark. Components
            are {INVERTER_TIER_LABEL[build.inverterClass].toLowerCase()} — {t.inverterBrands.join(', ')} for the
            inverter, {t.batteryBrands.join(', ')} for the battery.
            {answer.leftover > 0
              ? ` That leaves ${formatNaira(answer.leftover)} of your ${point.label}: not nothing, but the next step up in
                 this table costs more than that, so it is change rather than an upgrade.`
              : ''}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <a
              href={calcUrl}
              className="inline-flex items-center justify-center gap-2 bg-[#0A0F1E] text-white font-semibold px-6 py-3 rounded-2xl hover:bg-[#1E293B] transition-colors"
            >
              Open this exact build in the calculator <ArrowRight className="w-4 h-4" />
            </a>
            <WhatsAppLink
              text={waText}
              placement={`budget:${point.slug}`}
              quoteCode={quote.code}
              className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-[#0A0F1E] font-semibold px-6 py-3 rounded-2xl hover:border-slate-300 transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> Ask us on WhatsApp
            </WhatsAppLink>
          </div>
        </div>
      </section>

      {/* Bill of materials */}
      <section className="mb-16">
        <h2 className="font-heading font-extrabold text-[#0A0F1E] text-2xl md:text-3xl mb-3">
          Where every naira goes
        </h2>
        <p className="text-slate-500 mb-6 max-w-3xl">
          Line by line, with model class and quantity, at Nigerian market prices last checked{' '}
          {PRICES_LAST_UPDATED_LABEL}. Ask any installer for a quote in this shape — an itemised bill with brands and
          counts on it is the only thing that stops a cheaper component arriving on installation day.
        </p>

        <div className="rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3">Item</th>
                  <th className="text-right font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3">Qty</th>
                  <th className="text-right font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3">Line cost</th>
                  <th className="text-right font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3">Range</th>
                </tr>
              </thead>
              <tbody>
                {t.bom.map((line) => (
                  <tr key={line.key} className="border-b border-slate-100 last:border-0 align-top">
                    <th scope="row" className="text-left px-4 py-3">
                      <span className="font-medium text-[#0A0F1E] block">{line.item}</span>
                      <span className="text-slate-500 text-xs block mt-0.5">{line.spec}</span>
                    </th>
                    <td className="text-right text-slate-600 px-4 py-3 whitespace-nowrap">
                      {units(line.qty, line.unit)}
                    </td>
                    <td className="text-right text-[#0A0F1E] font-medium px-4 py-3 whitespace-nowrap">
                      {formatNaira(line.lineCost.best)}
                    </td>
                    <td className="text-right text-slate-500 px-4 py-3 whitespace-nowrap">{formatRange(line.lineCost)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50">
                  <th scope="row" className="text-left font-heading font-bold text-[#0A0F1E] px-4 py-3">
                    Installed total
                  </th>
                  <td className="px-4 py-3" />
                  <td className="text-right font-heading font-bold text-[#0A0F1E] px-4 py-3 whitespace-nowrap">
                    {formatNaira(t.total.best)}
                  </td>
                  <td className="text-right font-bold text-slate-500 px-4 py-3 whitespace-nowrap">
                    {formatRange(t.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-slate-500 text-sm mt-4 max-w-3xl">
          Equipment {formatRange(t.equipment)} · mounting, cables and protection {formatRange(t.bos)} · labour{' '}
          {formatRange(t.labour)}. Lagos, Abuja or Port Harcourt roof mount; transport outside those cities is extra.
        </p>
      </section>

      {/* What it runs */}
      <section className="mb-16">
        <h2 className="font-heading font-extrabold text-[#0A0F1E] text-2xl md:text-3xl mb-3">What it will run</h2>
        <p className="text-slate-500 mb-6 max-w-3xl">
          This system is sized for {build.rung.summary} — one representative list, not the only one. Swap like for like
          and the answer does not change; the numbers that matter are the {num(quote.peakWatts)}W peak and the{' '}
          {kwh(quote.dailyKwh)} a day at the bottom of the table.
        </p>

        <div className="rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3">Appliance</th>
                  <th className="text-right font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3">Watts each</th>
                  <th className="text-right font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3">Qty</th>
                  <th className="text-right font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3">Hours/day</th>
                  <th className="text-right font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3">kWh/day</th>
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

      {/* What it will NOT run — the section every budget thread is really asking for */}
      <section className="mb-16">
        <h2 className="font-heading font-extrabold text-[#0A0F1E] text-2xl md:text-3xl mb-3">
          What it will not run
        </h2>
        <p className="text-slate-500 mb-6 max-w-3xl">
          Checked against the same engine, surge included: a motor asks for several times its running watts in the first
          second, which is why an air conditioner that looks like it fits on paper still trips the inverter.
        </p>

        {unserved.length > 0 ? (
          <div className="rounded-2xl border border-slate-100 overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3">Appliance</th>
                    <th className="text-right font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3">Running watts</th>
                    <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3">On this system</th>
                  </tr>
                </thead>
                <tbody>
                  {unserved.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100 last:border-0">
                      <th scope="row" className="text-left font-medium text-[#0A0F1E] px-4 py-3">{u.name}</th>
                      <td className="text-right text-slate-600 px-4 py-3">{u.watts}W</td>
                      <td className="text-left text-slate-600 px-4 py-3">{UNSERVED_REASON[u.reason]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-slate-600 mb-6 max-w-3xl">
            Nothing on our list of heavy household loads is out of reach of this inverter — which is unusual, and worth
            checking against your own appliance plate ratings rather than taking on trust.
          </p>
        )}

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <div className="flex items-center gap-2 mb-2">
            <TriangleAlert className="w-5 h-5 text-slate-500" />
            <h3 className="font-heading font-bold text-[#0A0F1E]">It also will not carry the whole day on its own</h3>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            {t.panelCount} × {t.panelWatts}W panels make about {kwh(array)} on an average Nigerian day, and this load
            uses {kwh(quote.dailyKwh)}. The difference comes from the grid or the generator. That is what a system at
            this budget is: a machine for turning the hours you do get light into quiet, cheap hours you choose. Anyone
            promising you independence from NEPA for {point.label} is selling you something else.
          </p>
        </div>
      </section>

      {/* Other ways to spend the same money */}
      {variants.length > 0 && (
        <section className="mb-16">
          <h2 className="font-heading font-extrabold text-[#0A0F1E] text-2xl md:text-3xl mb-3">
            Other ways to spend {point.label}
          </h2>
          <p className="text-slate-500 mb-6 max-w-3xl">
            The same money, arranged differently. Where a row costs more than your budget, that gap is the honest price
            of the upgrade — not a reason to squeeze it in by cutting the panels or the wiring.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {variants.map((v) => (
              <div key={v.label} className="rounded-2xl border border-slate-100 p-6">
                <h3 className="font-heading font-bold text-[#0A0F1E] mb-3">{v.label}</h3>
                <dl className="space-y-2 text-sm">
                  {[
                    ['Inverter', `${num(v.build.tier.inverterKva)}kVA`],
                    ['Battery', `${kwh(v.build.tier.batteryKwh)} ${batteryWord(v.build)}`],
                    ['Panels', `${v.build.tier.panelCount} × ${v.build.tier.panelWatts}W`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-baseline justify-between gap-3">
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="text-[#0A0F1E] font-medium text-right">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <div className="font-heading font-extrabold text-[#0A0F1E] text-xl">{formatNaira(v.build.price)}</div>
                  <div className={`text-xs mt-1 ${v.overBudgetBy > 0 ? 'text-[#F59E0B]' : 'text-slate-500'}`}>
                    {v.overBudgetBy > 0
                      ? `${formatNaira(v.overBudgetBy)} more than your ${point.label}`
                      : `${formatNaira(-v.overBudgetBy)} less than your ${point.label}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* The upsell, stated as arithmetic */}
      {next && nextAnswer?.build && (
        <section className="mb-16">
          <h2 className="font-heading font-extrabold text-[#0A0F1E] text-2xl md:text-3xl mb-3">
            What another {formatNairaShort(next.amount - point.amount)} would add
          </h2>
          <p className="text-slate-500 mb-6 max-w-3xl">
            The same exercise run at {next.label} instead of {point.label}.
          </p>

          <div className="rounded-2xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3" />
                    <th className="text-right font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3">{point.label}</th>
                    <th className="text-right font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3">{next.label}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Inverter', `${num(t.inverterKva)}kVA`, `${num(nextAnswer.build.tier.inverterKva)}kVA`],
                    ['Battery', `${kwh(t.batteryKwh)} ${batteryWord(build)}`, `${kwh(nextAnswer.build.tier.batteryKwh)} ${batteryWord(nextAnswer.build)}`],
                    ['Panels', `${t.panelCount} × ${t.panelWatts}W`, `${nextAnswer.build.tier.panelCount} × ${nextAnswer.build.tier.panelWatts}W`],
                    ['Daily load it carries', kwh(quote.dailyKwh), kwh(nextAnswer.build.quote.dailyKwh)],
                    ['Installed', formatNaira(build.price), formatNaira(nextAnswer.build.price)],
                  ].map(([label, mine, theirs]) => (
                    <tr key={label} className="border-b border-slate-100 last:border-0">
                      <th scope="row" className="text-left font-medium text-[#0A0F1E] px-4 py-3">{label}</th>
                      <td className="text-right text-slate-600 px-4 py-3">{mine}</td>
                      <td className="text-right text-[#0A0F1E] font-medium px-4 py-3">{theirs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-slate-600 text-sm mt-4 max-w-3xl leading-relaxed">
            In plain terms, {next.label} buys {nextAnswer.build.rung.summary}.{' '}
            <Link href={`/budget/${next.slug}`} className="font-semibold text-[#0A0F1E] hover:text-[#F59E0B]">
              See the full {next.label} build
            </Link>
            .
          </p>
        </section>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Branch: the budget does not buy a complete system
// ─────────────────────────────────────────────────────────

function ShortfallSections({ answer, point }: { answer: BudgetAnswer; point: BudgetPoint }) {
  const s = answer.shortfall!;
  const cheapest = s.cheapest;
  // The first page in the family whose budget actually buys something.
  const firstViable = BUDGET_POINTS.map(budgetAnswer).find((x) => x.build);
  const line = (key: string) => cheapest.tier.bom.find((l) => l.key === key)!;
  const inverterAndBattery = line('inverter').lineCost.best + line('battery').lineCost.best;

  return (
    <>
      <section className="mb-16">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <TriangleAlert className="w-5 h-5 text-[#F59E0B]" />
            <h2 className="font-heading font-bold text-[#0A0F1E] text-xl">
              {point.label} is {formatNaira(s.shortBy)} short
            </h2>
          </div>
          <p className="text-slate-700 leading-relaxed">
            The cheapest complete system this price table can build is {formatNaira(cheapest.price)}:{' '}
            {article(cheapest.tier.inverterKva)} {num(cheapest.tier.inverterKva)}kVA inverter,{' '}
            {kwh(cheapest.tier.batteryKwh)} of{' '}
            {batteryWord(cheapest)} battery, {cheapest.tier.panelCount} × {cheapest.tier.panelWatts}W panels, the
            mounting and cabling, and the installer. Across Nigerian suppliers that same build runs{' '}
            {formatRange(cheapest.tier.total)}, so at the absolute wholesale floor it is{' '}
            {formatNaira(cheapest.tier.total.low)} — still more than {point.label}. And it only carries{' '}
            {cheapest.rung.summary}.
          </p>
          <p className="text-slate-700 leading-relaxed mt-4">
            Every naira on this page is computed from that table, checked {PRICES_LAST_UPDATED_LABEL}. If a vendor quotes
            you a complete solar install for {point.label}, ask them which of the lines below they have left out.
          </p>
        </div>
      </section>

      {/* Where the money stops */}
      <section className="mb-16">
        <h2 className="font-heading font-extrabold text-[#0A0F1E] text-2xl md:text-3xl mb-3">
          Where {point.label} stops
        </h2>
        <p className="text-slate-500 mb-6 max-w-3xl">
          The cheapest complete bill of materials, in the order an installer buys it, with your budget spent down it.
          The money runs out at the {s.stoppedAt.item.toLowerCase()} line, {formatNaira(s.spentBefore)} in.
        </p>

        <div className="rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3">Item</th>
                  <th className="text-right font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3">Unit</th>
                  <th className="text-right font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3">Needed</th>
                  <th className="text-right font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3">{point.label} covers</th>
                  <th className="text-right font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3">Spent</th>
                </tr>
              </thead>
              <tbody>
                {s.lines.map((l) => (
                  <tr key={l.line.key} className={`border-b border-slate-100 last:border-0 ${l.fullyCovered ? '' : 'bg-amber-50/40'}`}>
                    <th scope="row" className="text-left px-4 py-3">
                      <span className="font-medium text-[#0A0F1E] block">{l.line.item}</span>
                      <span className="text-slate-500 text-xs block mt-0.5">{l.line.spec}</span>
                    </th>
                    <td className="text-right text-slate-600 px-4 py-3 whitespace-nowrap">
                      {formatNaira(l.line.unitCost.best)}
                    </td>
                    <td className="text-right text-slate-600 px-4 py-3 whitespace-nowrap">
                      {units(l.line.qty, l.line.unit)}
                    </td>
                    <td className={`text-right px-4 py-3 whitespace-nowrap font-medium ${l.fullyCovered ? 'text-[#0A0F1E]' : 'text-[#B45309]'}`}>
                      {l.qtyCovered} of {l.line.qty}
                    </td>
                    <td className="text-right text-slate-500 px-4 py-3 whitespace-nowrap">{formatNaira(l.spent)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50">
                  <th scope="row" className="text-left font-heading font-bold text-[#0A0F1E] px-4 py-3">
                    Still to find
                  </th>
                  <td className="px-4 py-3" colSpan={3} />
                  <td className="text-right font-heading font-bold text-[#0A0F1E] px-4 py-3 whitespace-nowrap">
                    {formatNaira(s.shortBy)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-slate-600 text-sm mt-4 max-w-3xl leading-relaxed">
          Read down that table and you have the honest version of {point.label}:{' '}
          {coveredList(answer)}. {shortfallVerdict(answer)}
        </p>
      </section>

      {/* What to do instead */}
      <section className="mb-16">
        <h2 className="font-heading font-extrabold text-[#0A0F1E] text-2xl md:text-3xl mb-6">
          Three honest things to do with {point.label}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-slate-100 p-6">
            <h3 className="font-heading font-bold text-[#0A0F1E] mb-2">Buy the inverter and battery now</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              {formatNaira(line('inverter').lineCost.best)} for the {num(cheapest.tier.inverterKva)}kVA hybrid and{' '}
              {formatNaira(line('battery').lineCost.best)} for {kwh(cheapest.tier.batteryKwh)} of battery is{' '}
              {formatNaira(inverterAndBattery)} —{' '}
              {inverterAndBattery <= point.amount
                ? `inside your ${point.label}, with ${formatNaira(point.amount - inverterAndBattery)} to spare`
                : `still ${formatNaira(inverterAndBattery - point.amount)} above your ${point.label}, but far closer than the full install`}
              . A hybrid inverter charges from the grid, so this works from day one and the panels can be added later —
              that is the ordinary way Nigerian homes get there.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 p-6">
            <h3 className="font-heading font-bold text-[#0A0F1E] mb-2">Wait until you have the whole bill</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              {formatNaira(cheapest.price)} is the number to save to, and{' '}
              {firstViable ? `${firstViable.point.label} is the first budget in this family that buys a system worth having` : 'more than that buys a system worth having'}
              . Half a system installed badly costs more to fix than it saved, and an installer who agrees to
              {' '}{point.label} is going to find the difference somewhere in the bill.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 p-6">
            <h3 className="font-heading font-bold text-[#0A0F1E] mb-2">Pay small small</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Instalment and lease-to-own schemes exist in Nigeria and are the most common reply on every budget thread.
              We have written up how they work, what to check and where the costs hide, rather than quote you terms we
              do not set.{' '}
              <Link href="/blog/solar-loans-nigeria" className="font-semibold text-[#0A0F1E] hover:text-[#F59E0B]">
                Read that first
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Point at the first budget that works */}
      {firstViable?.build && (
        <section className="mb-16">
          <h2 className="font-heading font-extrabold text-[#0A0F1E] text-2xl md:text-3xl mb-3">
            The first budget that does buy a system
          </h2>
          <p className="text-slate-600 max-w-3xl leading-relaxed mb-6">
            {firstViable.point.label} buys {buildAnswer(firstViable.build)} — {formatNaira(firstViable.build.price)}{' '}
            installed, carrying {firstViable.build.rung.summary}. That is{' '}
            {formatNaira(firstViable.point.amount - point.amount)} more than you have now, and it is the closest thing to
            a real target.
          </p>
          <Link
            href={`/budget/${firstViable.point.slug}`}
            className="inline-flex items-center gap-2 bg-[#0A0F1E] text-white font-semibold px-6 py-3 rounded-2xl hover:bg-[#1E293B] transition-colors"
          >
            See what {firstViable.point.label} buys <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      )}
    </>
  );
}
