import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { formatNaira } from '@/lib/quote';
import { getScenario, scenarioQuote } from '@/lib/sizing';
import { BAND_A_TARIFF, SOILING_LOSS_PCT } from '@/lib/energy-costs';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Harmattan Is Coming: What Dust Does to Your Panels and What Cleaning Gets Back',
  description:
    'Peer-reviewed West African research puts Harmattan soiling losses as high as 50% in the worst-affected locations. Here is what that costs a Nigerian household per month in naira, how to clean safely, and the three things that void a panel warranty.',
  keywords: [
    'harmattan solar panel',
    'solar panel cleaning nigeria',
    'why is my solar output low',
    'solar panel dust nigeria',
  ],
  openGraph: {
    title: 'Harmattan Is Coming: What Dust Does to Your Panels',
    description: 'Measured soiling losses, priced per month, plus a safe cleaning method.',
    url: `${SITE_URL}/blog/harmattan-solar-panel-cleaning`,
    type: 'article',
  },
  alternates: { canonical: `${SITE_URL}/blog/harmattan-solar-panel-cleaning` },
};

const DAYS_PER_MONTH = 30;

export default function HarmattanCleaningPage() {
  // What a soiling loss is worth in naira: the energy you no longer generate is
  // energy you have to buy back off the meter (or off the gen, which is dearer
  // still — so this is the conservative reading).
  const rows = [
    'solar-for-lights-fans-and-tv-only',
    'how-many-solar-panels-for-2-bedroom-flat',
    'how-many-solar-panels-for-3-bedroom-flat',
    'solar-for-4-bedroom-house-with-2-acs',
  ]
    .map((slug) => getScenario(slug))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map((scenario) => {
      const quote = scenarioQuote(scenario);
      const lostKwhTypical = (quote.dailyKwh * SOILING_LOSS_PCT.typicalHigh) / 100;
      const lostKwhWorst = (quote.dailyKwh * SOILING_LOSS_PCT.worstCase) / 100;
      return {
        scenario,
        quote,
        panels: quote.tiers.standard.panelCount,
        lostKwhTypical,
        costTypical: lostKwhTypical * BAND_A_TARIFF.high * DAYS_PER_MONTH,
        costWorst: lostKwhWorst * BAND_A_TARIFF.high * DAYS_PER_MONTH,
      };
    });

  const main = rows[2];

  const faqs = [
    {
      q: 'How often should I clean my solar panels in Nigeria?',
      a: 'Once before Harmattan begins, then every two to four weeks through the dry season. Outside Harmattan, every couple of months is usually enough in the south; more often near a construction site, an unpaved road or the coast.',
    },
    {
      q: 'How much output do dirty panels lose?',
      a: `Peer-reviewed work on decentralised solar in West Africa reports soiling losses exceeding ${SOILING_LOSS_PCT.worstCase}% in the worst-affected locations, with large year-to-year variation. A soiled array in a typical Nigerian dry season is losing on the order of ${SOILING_LOSS_PCT.typicalLow}–${SOILING_LOSS_PCT.typicalHigh}%. Note that the ${SOILING_LOSS_PCT.worstCase}% figure is the worst location in the study, not an average, and your own loss depends heavily on where you live and how flat your panels lie.`,
    },
    {
      q: 'Can I clean solar panels with soap and a brush?',
      a: 'Water and a soft brush or squeegee, in the early morning or evening. No detergent that leaves a film, no abrasive pad, no pressure washer, and never cold water on hot glass — thermal shock can crack a module and no manufacturer will warrant that.',
    },
    {
      q: 'My output dropped but the panels look clean — what else could it be?',
      a: 'Shading from something that grew or got built, a failed string or a loose MC4 connector, an MPPT or charge-controller fault, a battery that can no longer accept charge, or simply a cloudier month. Check the app or the inverter display before you climb anything: a single dead string shows up as a step change, while soiling shows up as a slow decline.',
    },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Navbar />
      <main>

      <article className="max-w-3xl mx-auto px-6 py-16">
        <Breadcrumbs trail={[{ href: '/blog', label: 'Blog' }, { label: 'Harmattan and panel cleaning' }]} className="mb-8" />

        <span className="inline-block bg-[#FEF3C7] text-[#0A0F1E] text-xs font-heading font-semibold px-3 py-1 rounded-full mb-6">
          Maintenance
        </span>

        <h1 className="font-heading font-extrabold text-[#0A0F1E] text-4xl md:text-5xl leading-tight mb-6">
          Harmattan Is Coming: What Dust Does to Your Panels
        </h1>

        <div className="flex items-center gap-4 text-[#94A3B8] text-sm mb-12 pb-8 border-b border-[#E2E8F0]">
          <span>Updated {PRICES_LAST_UPDATED_LABEL}</span>
          <span>·</span>
          <span>8 min read</span>
          <span>·</span>
          <span>By SolarBuilders.ng</span>
        </div>

        <div className="space-y-6 text-[#0A0F1E]">
          <p className="text-xl text-[#64748B] leading-relaxed">
            Clean your panels before Harmattan starts, then every two to four weeks through it. Dust costs a typical
            Nigerian household on the order of {formatNaira(main.costTypical)} a month in energy it no longer generates,
            and the fix is water, a soft brush and twenty minutes.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">What the research actually shows</h2>
          <p className="text-[#64748B] leading-relaxed">
            Dust on photovoltaic panels in West Africa has been studied properly, which is unusual for a question this
            practical. Work published on decentralised solar in the region reports soiling losses{' '}
            <strong className="text-[#0A0F1E]">exceeding {SOILING_LOSS_PCT.worstCase}%</strong> in the worst-affected
            locations, and year-to-year variation of the same order — one Harmattan is not the next (
            <a href={SOILING_LOSS_PCT.sourceUrl} rel="nofollow noopener" target="_blank" className="text-[#F59E0B] font-semibold hover:underline">
              {SOILING_LOSS_PCT.source}
            </a>
            ).
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Two honest caveats before anyone quotes that number at you. The {SOILING_LOSS_PCT.worstCase}% is the worst
            location in the study, not a Nigerian average, and the studies are regional rather than street-level. What
            the literature supports is the shape of the problem — large, seasonal, and worse the further north and the
            flatter your panels lie — rather than a precise figure for your roof. We have used{' '}
            {SOILING_LOSS_PCT.typicalLow}–{SOILING_LOSS_PCT.typicalHigh}% as the working range below and shown the
            worst case separately, so you can see both.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">What that costs you, in naira</h2>
          <p className="text-[#64748B] leading-relaxed">
            Energy your panels do not make is energy you buy back. Valued at the Band A rate of{' '}
            {formatNaira(BAND_A_TARIFF.high)} per kWh — the conservative choice, since the alternative for most homes is
            generator fuel at several times that — here is what a soiled array costs per month, by household size.
          </p>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-x-auto">
            <table className="w-full text-sm min-w-[660px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Household</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Panels</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">kWh/day</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Lost at {SOILING_LOSS_PCT.typicalHigh}%</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Worst case ({SOILING_LOSS_PCT.worstCase}%)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.scenario.slug} className={`border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
                    <td className="p-4 font-heading font-semibold text-[#0A0F1E]">
                      <Link href={`/sizing/${r.scenario.slug}`} className="hover:text-[#F59E0B]">
                        {r.scenario.question}
                      </Link>
                    </td>
                    <td className="p-4 text-[#64748B]">{r.panels}</td>
                    <td className="p-4 text-[#64748B]">{r.quote.dailyKwh}</td>
                    <td className="p-4 font-semibold text-[#F59E0B]">{formatNaira(r.costTypical)}/mo</td>
                    <td className="p-4 text-[#64748B]">{formatNaira(r.costWorst)}/mo</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[#94A3B8] text-sm">
            Lost energy × {formatNaira(BAND_A_TARIFF.high)}/kWh × {DAYS_PER_MONTH} days. Loads from our sizing pages;
            system prices last checked {PRICES_LAST_UPDATED_LABEL}.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Across a four-month dry season those figures multiply, and they are the pure energy cost. They do not
            include the second-order damage below, which is worse.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">How to clean safely</h2>
          <ol className="space-y-3 text-[#64748B] list-decimal pl-5">
            <li><strong className="text-[#0A0F1E]">Early morning or evening, never midday.</strong> Cold water on glass that has been in the Nigerian sun for four hours is thermal shock, and thermal shock cracks modules.</li>
            <li><strong className="text-[#0A0F1E]">Rinse first, then wipe.</strong> Harmattan dust is abrasive. Wiping it dry drags grit across the glass and leaves fine scratches that scatter light permanently.</li>
            <li><strong className="text-[#0A0F1E]">Plain water and a soft brush or squeegee.</strong> Soft bristles or rubber, on a pole if you can, so you stay off the roof.</li>
            <li><strong className="text-[#0A0F1E]">Do not stand on the panels.</strong> Ever, not even {'“'}carefully{'”'}. Microcracks from foot pressure are invisible and permanent.</li>
            <li><strong className="text-[#0A0F1E]">Check the frames and clamps while you are there.</strong> Thirty seconds, and it is the only inspection most systems ever get.</li>
          </ol>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Three things that void a panel warranty</h2>
          <ul className="space-y-3 text-[#64748B]">
            {[
              ['A pressure washer', 'Forces water past the frame seal and into the laminate. This is the single most common self-inflicted panel failure, and every manufacturer excludes it.'],
              ['Abrasives and harsh chemicals', 'Scouring pads, scrapers, solvents, and anything that etches or leaves a film. Anti-reflective coating does not grow back.'],
              ['Walking on the glass', 'Cells crack under point loads long before the glass does. The module keeps working at reduced output and the warranty claim gets refused on inspection.'],
            ].map(([title, body]) => (
              <li key={title} className="flex items-start gap-2">
                <span className="text-[#F59E0B] mt-1">•</span>
                <span><strong className="text-[#0A0F1E]">{title}.</strong> {body}</span>
              </li>
            ))}
          </ul>
          <p className="text-[#64748B] leading-relaxed">
            Warranty terms differ by manufacturer, and the ones we can verify from published documentation are listed on
            each <Link href="/brands" className="text-[#F59E0B] font-semibold hover:underline">brand page</Link>. Where
            a brand publishes nothing, we say so rather than guessing — which is itself information worth having before
            you buy.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">The knock-on nobody warns you about</h2>
          <p className="text-[#64748B] leading-relaxed">
            A soiled array does not just make less energy. It makes less energy <em>at the wrong time</em> — the
            shortfall lands in the afternoon charging window, so the battery goes into the evening less than full, night
            after night.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            For lithium that is an inconvenience: shorter backup, and the grid or gen filling the gap. For lead-acid it
            is damage. A tubular battery that is chronically undercharged sulphates, and sulphation is what turns a
            four-year battery into a two-year one. If you are running tubular, the cleaning schedule is not about saving
            energy — it is about protecting the most expensive line on your invoice. The full arithmetic on that is in{' '}
            <Link href="/blog/lithium-vs-tubular-battery-nigeria" className="text-[#F59E0B] font-semibold hover:underline">
              lithium vs tubular batteries
            </Link>.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">When dirt is not the problem</h2>
          <p className="text-[#64748B] leading-relaxed">
            Before you blame dust, look at the shape of the drop. Soiling is a <em>gradual</em> decline over weeks that
            recovers the day you clean. If your output fell off a cliff, it is something else:
          </p>
          <ul className="space-y-3 text-[#64748B]">
            {[
              ['Shading', 'A wall, a mast, a tree, a neighbour’s new storey. Partial shade on one panel drags down the whole string it sits in, so a small shadow can cost a large fraction of the array.'],
              ['A dead string', 'One loose or corroded MC4 connector takes out everything downstream of it. Shows up as a sudden step down, not a slow slide.'],
              ['MPPT or charge controller fault', 'The array is fine and the controller is not harvesting it. Compare PV voltage against PV current on the display.'],
              ['The battery, not the panels', 'A pack that can no longer accept charge looks exactly like an array that is no longer producing, from inside the house.'],
              ['It is simply cloudier', 'Rainy-season output is genuinely lower and no amount of cleaning changes that. That is a different problem with a different answer — sizing.'],
            ].map(([title, body]) => (
              <li key={title} className="flex items-start gap-2">
                <span className="text-[#F59E0B] mt-1">•</span>
                <span><strong className="text-[#0A0F1E]">{title}.</strong> {body}</span>
              </li>
            ))}
          </ul>
          <p className="text-[#64748B] leading-relaxed">
            This is the argument for buying an inverter with working monitoring. Being able to see daily production on a
            phone turns {'“'}my solar is not strong again{'”'} into a dated chart, and a dated chart turns a guess into a
            diagnosis. Which brands publish a monitoring app, and whether it works here, is one of the attributes we
            track on every <Link href="/brands" className="text-[#F59E0B] font-semibold hover:underline">brand page</Link>.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">The north/south calendar</h2>
          <p className="text-[#64748B] leading-relaxed">
            Nigeria does not have one dry season. In the south it runs roughly December to March; in the north, roughly
            October to April, with more Harmattan dust and more of it. Practically: Kano and Kaduna need a tighter
            cleaning interval and an earlier start than Lagos or Port Harcourt, and a system in the far north should be
            cleaned before the dust arrives rather than after somebody notices the backup is shorter.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Coastal cities have the mirror-image problem: less dust, more salt and moisture, which attacks terminals,
            enclosures and connectors rather than glass. Different inspection, same discipline.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">The one-page seasonal checklist</h2>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">When</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Do this</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Late November, before Harmattan', 'Full clean. Check every clamp and frame bolt. Note your baseline daily kWh on the app so you have something to compare against.'],
                  ['Through the dry season', 'Rinse every 2–4 weeks. Tighter in the north, after a dust event, or if you are near an unpaved road or building site.'],
                  ['Monthly, all year', 'Glance at daily production. A slow decline is dust; a step change is a fault.'],
                  ['Start of the rains', 'Clean once properly — rain rinses, it does not clean, and it leaves a fine particulate film behind. Check that nothing has worked loose over the dry months.'],
                  ['Annually', 'Have the DC side inspected: connectors, isolator, surge protection and earthing. This is the check that prevents fires, and almost nobody does it.'],
                ].map(([when, what], i) => (
                  <tr key={when} className={`border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
                    <td className="p-4 font-heading font-semibold text-[#0A0F1E] align-top">{when}</td>
                    <td className="p-4 text-[#64748B]">{what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[#64748B] leading-relaxed">
            The rest of the routine — batteries, inverter, wiring — is covered in our{' '}
            <Link href="/blog/solar-maintenance-nigeria" className="text-[#F59E0B] font-semibold hover:underline">
              general maintenance guide
            </Link>. If something is wrong rather than dirty, start with{' '}
            <Link href="/contact" className="text-[#F59E0B] font-semibold hover:underline">a message to us</Link> before
            you let anyone start replacing parts.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Common questions</h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="rounded-2xl border border-[#E2E8F0] p-6">
                <h3 className="font-heading font-bold text-[#0A0F1E] text-base mb-2">{f.q}</h3>
                <p className="text-[#64748B] leading-relaxed text-sm">{f.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 bg-[#FEF3C7] rounded-2xl p-8">
          <h3 className="font-heading font-bold text-[#0A0F1E] text-xl mb-2">Sizing for the dry season, not just for today</h3>
          <p className="text-[#64748B] mb-4">
            Our Premium tier adds panel headroom for exactly this reason. See what each build produces and costs for
            your own load.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/calculator" className="inline-flex items-center justify-center bg-[#F59E0B] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-bold text-sm hover:bg-[#D97706] transition-colors">
              Size my array →
            </Link>
            <Link href="/blog/solar-maintenance-nigeria" className="inline-flex items-center justify-center border-2 border-[#0A0F1E] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-semibold text-sm hover:bg-[#0A0F1E] hover:text-white transition-colors">
              Full maintenance guide
            </Link>
          </div>
        </div>
      </article>

      </main>
      <Footer />
    </div>
  );
}
