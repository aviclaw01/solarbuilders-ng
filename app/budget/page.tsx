import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import WhatsAppLink from '@/components/ui/WhatsAppLink';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { ArrowRight, Calculator, MessageCircle, TriangleAlert } from 'lucide-react';
import { BUDGET_POINTS, budgetAnswers, cheapestCompleteBuild } from '@/lib/budget';
import { formatNaira, formatNairaShort, formatRange } from '@/lib/quote';
import { PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { SITE_URL } from '@/lib/site';

function num(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}

export const metadata: Metadata = {
  title: `What Can Your Budget Buy in Solar? ${BUDGET_POINTS.length} Nigerian Budgets, Priced | SolarBuilders.ng`,
  description:
    `${BUDGET_POINTS[0].label} to ${BUDGET_POINTS[BUDGET_POINTS.length - 1].label}: the inverter, battery and panel ` +
    `count each budget actually buys at ${PRICES_LAST_UPDATED_LABEL} Nigerian prices — including the budgets that ` +
    `honestly do not buy a system yet, and exactly how far short they are.`,
  keywords: [
    'what can 500k get me in solar nigeria',
    'solar system for 1 million naira nigeria',
    '2 million naira solar system nigeria',
    'solar price by budget nigeria',
    'cheapest solar system nigeria price',
  ],
  openGraph: {
    title: 'What can your budget buy in solar? Nigerian budgets, priced',
    description:
      `The inverter, battery and panel count each budget buys at ${PRICES_LAST_UPDATED_LABEL} Nigerian prices — and the ones that do not buy a system.`,
    url: `${SITE_URL}/budget`,
    type: 'website',
  },
  alternates: { canonical: `${SITE_URL}/budget` },
};

export default function BudgetHubPage() {
  const answers = budgetAnswers();
  const cheapest = cheapestCompleteBuild();
  const short = answers.filter((a) => !a.build);
  const waText =
    `Hi SolarBuilders, I have a budget in mind for solar and I want to know honestly what it gets me. ` +
    `${SITE_URL}/budget`;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <header className="bg-white border-b border-slate-100 px-6 py-12 md:py-16">
          <div className="max-w-6xl mx-auto">
            <Breadcrumbs trail={[{ label: 'Solar by budget' }]} className="mb-6" />
            <h1 className="font-heading font-extrabold text-[#0A0F1E] text-3xl md:text-5xl mb-5 max-w-4xl">
              &ldquo;I have this much. Can I get a good solar system with it?&rdquo;
            </h1>
            <p className="text-slate-600 text-lg max-w-3xl leading-relaxed">
              Our calculator answers the question the other way round: appliances in, price out. This is the inverse —
              you name the money, and the same engine works out the largest system it actually buys, what that system
              will run, and what it will not. {BUDGET_POINTS.length} budgets, every figure computed from Nigerian
              equipment prices last checked {PRICES_LAST_UPDATED_LABEL}.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-7">
              <Link
                href="/calculator"
                className="inline-flex items-center justify-center gap-2 bg-[#0A0F1E] text-white font-semibold px-6 py-3 rounded-2xl hover:bg-[#1E293B] transition-colors"
              >
                <Calculator className="w-4 h-4" /> Start from my appliances instead
              </Link>
              <WhatsAppLink
                text={waText}
                placement="budget:hub"
                className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-[#0A0F1E] font-semibold px-6 py-3 rounded-2xl hover:border-slate-300 transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> Ask us on WhatsApp
              </WhatsAppLink>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
          {/* The floor — said once, up front, because it governs four of these pages */}
          {short.length > 0 && (
            <section className="mb-14">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-8">
                <div className="flex items-center gap-2 mb-3">
                  <TriangleAlert className="w-5 h-5 text-[#F59E0B]" />
                  <h2 className="font-heading font-bold text-[#0A0F1E] text-xl">
                    {short.length} of these {BUDGET_POINTS.length} budgets do not buy a solar system
                  </h2>
                </div>
                <p className="text-slate-700 leading-relaxed max-w-3xl">
                  The cheapest complete install our price table can produce — smallest hybrid inverter, cheapest
                  batteries, two panels, mounting, cabling and labour — is {formatNaira(cheapest.price)}, with a range
                  across Nigerian suppliers of {formatRange(cheapest.tier.total)}. Anything below that is not a small
                  solar system; it is part of one. Those pages say so and show which line of the bill the money reaches,
                  because &ldquo;no, and here is exactly why&rdquo; is the answer most budget threads never get.
                </p>
              </div>
            </section>
          )}

          <section className="mb-14">
            <h2 className="font-heading font-extrabold text-[#0A0F1E] text-2xl md:text-3xl mb-2">
              Every budget, side by side
            </h2>
            <p className="text-slate-500 mb-6 max-w-3xl">
              The installed price shown is the realistic middle of the range, not the wholesale floor.
            </p>

            <div className="rounded-2xl border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3">Budget</th>
                      <th className="text-right font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3">Inverter</th>
                      <th className="text-right font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3">Battery</th>
                      <th className="text-right font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3">Panels</th>
                      <th className="text-right font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3">Installed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {answers.map((a) => (
                      <tr key={a.point.slug} className="border-b border-slate-100 last:border-0">
                        <th scope="row" className="text-left px-4 py-3">
                          <Link href={`/budget/${a.point.slug}`} className="font-heading font-bold text-[#0A0F1E] hover:text-[#F59E0B]">
                            {a.point.label}
                          </Link>
                        </th>
                        {a.build ? (
                          <>
                            <td className="text-right text-slate-600 px-4 py-3">{num(a.build.tier.inverterKva)}kVA</td>
                            <td className="text-right text-slate-600 px-4 py-3">
                              {num(a.build.tier.batteryKwh)}kWh {a.build.battery === 'tubular' ? 'tubular' : 'lithium'}
                            </td>
                            <td className="text-right text-slate-600 px-4 py-3">{a.build.tier.panelCount}</td>
                            <td className="text-right text-[#0A0F1E] font-medium px-4 py-3 whitespace-nowrap">
                              {formatNaira(a.build.price)}
                            </td>
                          </>
                        ) : (
                          <td className="text-left text-[#B45309] px-4 py-3" colSpan={4}>
                            No complete system — {formatNaira(a.shortfall!.shortBy)} short of the cheapest install
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="mb-14">
            <h2 className="font-heading font-extrabold text-[#0A0F1E] text-2xl md:text-3xl mb-6">
              The full answer for each
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {answers.map((a) => (
                <Link
                  key={a.point.slug}
                  href={`/budget/${a.point.slug}`}
                  className="rounded-2xl border border-slate-100 p-6 hover:border-slate-300 transition-colors flex flex-col"
                >
                  <h3 className="font-heading font-bold text-[#0A0F1E] text-lg mb-2">
                    What can {a.point.label} of solar get you?
                  </h3>
                  {a.build ? (
                    <>
                      <p className="text-slate-500 text-sm mb-4 flex-1 leading-relaxed">
                        Runs {a.build.rung.summary}, with about {a.build.tier.autonomyHours} hours of backup after dark.
                      </p>
                      <div className="font-heading font-extrabold text-[#0A0F1E]">
                        {num(a.build.tier.inverterKva)}kVA · {num(a.build.tier.batteryKwh)}kWh ·{' '}
                        {a.build.tier.panelCount} panel{a.build.tier.panelCount === 1 ? '' : 's'}
                      </div>
                      <div className="text-slate-500 text-sm mt-1">
                        {formatNaira(a.build.price)} installed · {formatRange(a.build.tier.total)}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-slate-500 text-sm mb-4 flex-1 leading-relaxed">
                        Honestly, not a solar system. The money stops at the{' '}
                        {a.shortfall!.stoppedAt.item.toLowerCase()} line of the cheapest possible bill.
                      </p>
                      <div className="font-heading font-extrabold text-[#B45309]">
                        {formatNairaShort(a.shortfall!.shortBy)} short
                      </div>
                      <div className="text-slate-500 text-sm mt-1">
                        cheapest complete install {formatNaira(a.shortfall!.cheapest.price)}
                      </div>
                    </>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#F59E0B] mt-4">
                    See the full answer <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <div className="rounded-2xl border border-slate-100 p-6 md:p-8">
              <h2 className="font-heading font-bold text-[#0A0F1E] text-xl mb-3">How a budget is turned into a system</h2>
              <p className="text-slate-600 leading-relaxed max-w-3xl">
                We take a ladder of household loads, from lights and a fan up to three air conditioners, and run every
                one of them through the same quote engine the calculator uses, at every combination of backup hours,
                component class and battery chemistry the engine supports. Then we keep the most capable build whose
                realistic installed price fits the budget. Nothing is rounded to a marketing number and nothing is
                written by hand: when the price table changes, these pages change with it — including when a budget that
                used to work stops working.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <Link
                  href="/calculator"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A0F1E] border border-slate-200 rounded-2xl px-5 py-3 hover:border-slate-300 transition-colors"
                >
                  Build your own list <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/sizing"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A0F1E] border border-slate-200 rounded-2xl px-5 py-3 hover:border-slate-300 transition-colors"
                >
                  Sizing questions <ArrowRight className="w-4 h-4" />
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
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
