import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { BOS_FRACTION, OPTIONAL_ITEMS, PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { formatNaira, formatRange } from '@/lib/quote';
import { getScenario, scenarioQuote } from '@/lib/sizing';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Can Your Landlord Stop You Installing Solar? A Nigerian Renter’s Guide',
  description:
    'Usually yes — and there are four ways round it. Ground mounts, removable frames, what to put in writing before you spend a naira, and a costed renter’s system at September 2026 prices.',
  keywords: [
    'can i install solar in a rented apartment nigeria',
    'landlord wont allow solar panels',
    'solar for renters nigeria',
    'solar for tenants lagos',
  ],
  openGraph: {
    title: 'Can Your Landlord Stop You Installing Solar? A Renter’s Guide',
    description: 'Four ways round a landlord’s no, and what a takeaway system costs.',
    url: `${SITE_URL}/blog/solar-in-a-rented-apartment-nigeria`,
    type: 'article',
  },
  alternates: { canonical: `${SITE_URL}/blog/solar-in-a-rented-apartment-nigeria` },
};

export default function SolarRentedApartmentPage() {
  // The renter's system: the smallest authored load we publish, because the
  // whole point is something you can pay for, unbolt and carry.
  const scenario = getScenario('solar-for-lights-fans-and-tv-only')!;
  const quote = scenarioQuote(scenario);
  const budget = quote.tiers.budget;
  const standard = quote.tiers.standard;

  // Mounting sits inside the balance-of-system line. A ground frame or a
  // demountable stand is more steel and more cable than a roof rail, which
  // moves you up that band rather than adding a line we do not price.
  const bosSpread = budget.equipment.best * (BOS_FRACTION.high - BOS_FRACTION.best);

  const faqs = [
    {
      q: 'Can a landlord refuse solar panels in Nigeria?',
      a: 'In practice, yes. The roof is the landlord’s property, and most Nigerian tenancy agreements contain a clause against permanent alterations to the structure. Refusing permission to drill into a roof is squarely within that. What a landlord generally cannot do is stop you owning and using a system that does not alter the building — a ground-mounted or free-standing array inside the space you rent is a different conversation.',
    },
    {
      q: 'What can I install as a tenant without touching the roof?',
      a: `A ground-mounted or stand-mounted array in a compound, a balcony or a rear yard, feeding an inverter and battery that sit inside your flat and plug into your own distribution board through a changeover. Our costed renter’s build for lights, fans and a TV is ${formatRange(budget.total)} installed at ${PRICES_LAST_UPDATED_LABEL} prices.`,
    },
    {
      q: 'Does a ground mount cost more than a roof mount?',
      a: `Somewhat. Mounting sits inside the balance-of-system line, which we price at ${Math.round(BOS_FRACTION.best * 100)}–${Math.round(BOS_FRACTION.high * 100)}% of equipment cost. A ground frame or demountable stand needs more steel, a longer DC run and often a concrete footing, so it pushes you toward the top of that band — on this system, roughly ${formatNaira(bosSpread)} more.`,
    },
    {
      q: 'What should I put in writing before installing solar in a rented flat?',
      a: 'Four things: that you own the equipment and may remove it when you leave; who is responsible for making good any fixing points; that the landlord may not treat the system as a fixture or a reason to raise rent; and an indemnity for damage arising from the installation. Get it signed before you pay a deposit on equipment, not after.',
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
        <Breadcrumbs trail={[{ href: '/blog', label: 'Blog' }, { label: 'Solar in a rented apartment' }]} className="mb-8" />

        <span className="inline-block bg-[#FEF3C7] text-[#0A0F1E] text-xs font-heading font-semibold px-3 py-1 rounded-full mb-6">
          Renters
        </span>

        <h1 className="font-heading font-extrabold text-[#0A0F1E] text-4xl md:text-5xl leading-tight mb-6">
          Can Your Landlord Stop You Installing Solar? A Renter{'’'}s Guide
        </h1>

        <div className="flex items-center gap-4 text-[#64748B] text-sm mb-12 pb-8 border-b border-[#E2E8F0]">
          <span>Updated {PRICES_LAST_UPDATED_LABEL}</span>
          <span>·</span>
          <span>9 min read</span>
          <span>·</span>
          <span>By SolarBuilders.ng</span>
        </div>

        <div className="space-y-6 text-[#0A0F1E]">
          <p className="text-xl text-[#64748B] leading-relaxed">
            Usually yes — the roof is his, and most tenancy agreements ban permanent alterations. But four routes get you
            powered anyway: ground mount, a demountable stand, a takeaway system you unbolt when you move, and a written
            agreement that turns his no into a yes. A costed renter{'’'}s build is {formatRange(budget.total)}.
          </p>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-[#64748B] leading-relaxed text-sm">
              <strong className="text-[#0A0F1E]">This is not legal advice.</strong> Nigerian tenancy law varies by state
              and every agreement is different. What follows is what the disputes we can read about actually turn on, and
              what it costs to build around them. If a large sum is involved, have a lawyer read your agreement.
            </p>
          </div>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Why landlords say no</h2>
          <p className="text-[#64748B] leading-relaxed">
            It is worth understanding the refusal before trying to argue with it, because most of the reasons are
            reasonable and only one of them is really about you.
          </p>
          <ul className="space-y-3 text-[#64748B]">
            {[
              ['Roof leaks', 'This is the big one and it is legitimate. Every roof-mount fixing is a hole in a waterproof surface. Done properly with the right flashing it never leaks; done by someone in a hurry it leaks in the first heavy rain and the landlord pays for the ceiling.'],
              ['Fire risk', 'Publicly aired often, and mostly a fear about bad DC wiring rather than about panels. It is answerable with specifics: correctly sized DC cable, a properly rated isolator, surge protection and earthing. A tenant who can name those four things sounds different from one who cannot.'],
              ['Permanent alterations clause', 'Standard in Nigerian tenancy agreements. Read yours. It usually prohibits structural alteration without written consent — which means consent is the mechanism, not a ban.'],
              ['Estate uniformity', 'Some estates have rules about what may appear on a roofline. Annoying, but it is a rule you can design around rather than argue with.'],
              ['He thinks it becomes his', 'The unspoken one. A landlord who believes an expensive system will simply be abandoned at the end of the tenancy behaves very differently from one who knows you are taking it with you — which is why the written agreement below matters more than any technical argument.'],
            ].map(([title, body]) => (
              <li key={title} className="flex items-start gap-2">
                <span className="text-[#B45309] mt-1">•</span>
                <span><strong className="text-[#0A0F1E]">{title}.</strong> {body}</span>
              </li>
            ))}
          </ul>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Route 1 — ground mount or a raised stand</h2>
          <p className="text-[#64748B] leading-relaxed">
            The cleanest answer to {'“'}not on my roof{'”'} is not to use the roof. A frame in a compound, a rear yard,
            a flat balcony or on a boys{'’'} quarters slab keeps the panels entirely off the landlord{'’'}s
            waterproofing, and has two side benefits worth real money: cleaning is a thirty-second job rather than a
            ladder job, and every fault you ever have is reachable without going on a roof.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            What it costs: mounting is part of the balance-of-system line in our quotes, which we price at{' '}
            {Math.round(BOS_FRACTION.low * 100)}–{Math.round(BOS_FRACTION.high * 100)}% of equipment cost depending on
            how much steel, cable and protection the job needs. A ground frame sits at the top of that band rather than
            the middle — on the renter{'’'}s system below, that is on the order of {formatNaira(bosSpread)} more than a
            straightforward roof mount, before any concrete.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            The two real costs of ground mounting are not on the invoice. One is space — panels need an unshaded
            footprint that stays unshaded as the sun moves. The other is security, because a panel at head height is a
            panel somebody can carry. Fence it, bolt it with security fasteners, and light it.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Route 2 — the takeaway system</h2>
          <p className="text-[#64748B] leading-relaxed">
            Design it from the start to be unbolted. That is a real engineering choice with real consequences, and it is
            almost never discussed with Nigerian tenants:
          </p>
          <ul className="space-y-3 text-[#64748B]">
            {[
              'Inverter and battery wall-mounted on a plywood backboard, not chased into the wall. The board comes down; four plugged holes stay behind.',
              'DC and AC runs in surface trunking, not buried in plaster.',
              'Panels on a bolted frame with standard clamps, never glued or riveted.',
              'Tie into your own distribution board through a changeover switch rather than rewiring circuits, so the flat goes back to how you found it by flipping one switch and removing one cable.',
              'Keep every carton, manual and serial number. A system you can prove you bought is a system you can prove you own.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-[#B45309] mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-[#64748B] leading-relaxed">
            One component earns its place here specifically for renters: the changeover. An automatic changeover is{' '}
            {formatNaira(OPTIONAL_ITEMS.changeover_63a.low)}–{formatNaira(OPTIONAL_ITEMS.changeover_63a.high)} depending
            on rating and brand, and it is what lets the system be added to and removed from an existing flat without
            touching the landlord{'’'}s wiring. It is also the part that quietly fails in Nigerian homes — we have seen
            a transfer switch burn out when grid power returned after a month away — so it is worth buying properly
            rated rather than cheap.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Route 3 — put it in writing first</h2>
          <p className="text-[#64748B] leading-relaxed">
            The single most useful suggestion we have seen a Nigerian tenant make on this subject is an{' '}
            <strong className="text-[#0A0F1E]">indemnity letter</strong>: a short written undertaking to repair or
            replace any damage resulting from the installation. It costs nothing, it directly answers the landlord{'’'}s
            actual fear, and it converts a vague risk into a defined one.
          </p>
          <p className="text-[#64748B] leading-relaxed">Four clauses, before you pay any deposit:</p>
          <ol className="space-y-3 text-[#64748B] list-decimal pl-5">
            <li><strong className="text-[#0A0F1E]">Ownership.</strong> The equipment is yours, is not a fixture, and may be removed at the end of the tenancy.</li>
            <li><strong className="text-[#0A0F1E]">Making good.</strong> You will restore fixing points and finishes to their prior condition on removal, and you accept liability for damage arising from the installation.</li>
            <li><strong className="text-[#0A0F1E]">No rent effect.</strong> The installation does not form part of the premises and is not grounds for a rent review.</li>
            <li><strong className="text-[#0A0F1E]">Consent to the specific work.</strong> Attach the actual bill of materials and a description of where things go. Vague consent becomes a dispute; specific consent does not.</li>
          </ol>
          <p className="text-[#64748B] leading-relaxed">
            Hand him the itemised quote with it. An itemised bill of materials with model numbers does more to reassure a
            landlord than any amount of explaining, because it shows him this is engineered rather than improvised — and
            it is what our{' '}
            <Link href="/calculator" className="text-[#B45309] font-semibold hover:underline">calculator</Link> produces
            by default.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Route 4 — make the case, or offer to leave it</h2>
          <p className="text-[#64748B] leading-relaxed">
            Landlords in Nigeria are not being unreasonable when they treat a tenant{'’'}s roof works with suspicion.
            The argument that lands is not environmental and it is not about your comfort — it is that a properly
            installed system increases what the property can command, and that a certified installer plus an indemnity
            letter means his downside is covered.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            And sometimes the right trade is to offer to leave part of it. If you have two years left and the alternative
            is no solar at all, offering the mounting frame and the wiring — not the inverter and battery, which are most
            of the money — in exchange for permission and a rent freeze can be a good deal. Decide that before you start
            the conversation, not during it.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Estates and service charges</h2>
          <p className="text-[#64748B] leading-relaxed">
            In a managed estate you have two counterparties, not one: the landlord and the estate management. Ask
            management for the rules in writing before you ask your landlord for permission — if the estate prohibits
            roof-mounted panels outright, that is the answer and the negotiation with your landlord is moot. Estates
            that run a common generator and bill it through the service charge are also worth asking a second question:
            whether your service charge changes if you stop drawing on it. Usually it does not, which is a real reduction
            in what solar saves you and belongs in your arithmetic.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">A costed renter{'’'}s system</h2>
          <p className="text-[#64748B] leading-relaxed">
            Lights, fans and a TV — {(quote.peakWatts / 1000).toFixed(1)}kW if everything runs at once,{' '}
            {quote.dailyKwh}kWh a day. Deliberately no air conditioner, because the AC is the load that doubles the
            price of everything and is the hardest thing to justify spending on a flat you do not own.
          </p>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Build</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Inverter</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Battery</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Panels</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Installed</th>
                </tr>
              </thead>
              <tbody>
                {[budget, standard].map((t, i) => (
                  <tr key={t.key} className={`border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
                    <td className="p-4 font-heading font-semibold text-[#0A0F1E]">{t.label} — {t.tagline}</td>
                    <td className="p-4 text-[#64748B]">{t.inverterKva}kVA</td>
                    <td className="p-4 text-[#64748B]">{t.batteryKwh}kWh</td>
                    <td className="p-4 text-[#64748B]">{t.panelCount} × {t.panelWatts}W</td>
                    <td className="p-4 font-semibold text-[#B45309]">{formatRange(t.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[#64748B] text-sm">
            Priced from Nigerian vendor listings, last checked {PRICES_LAST_UPDATED_LABEL}. Quote {quote.code}. Full
            bill of materials on the{' '}
            <Link href={`/sizing/${scenario.slug}`} className="text-[#B45309] font-semibold hover:underline">
              lights, fans and TV sizing page
            </Link>.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Two things to notice. The Budget build gets you {budget.autonomyHours} hours of backup and the Standard
            build {standard.autonomyHours}; for a renter the Budget build is often the right answer precisely because
            it is small enough to move. And both are dominated by the battery and the inverter — the parts you take with
            you. The money you leave behind when you move is the mounting and the cable, which is the smallest line on
            the quote. That is the whole argument for solar as a tenant.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            If you have a bigger flat, the{' '}
            <Link href="/sizing/how-many-solar-panels-for-2-bedroom-flat" className="text-[#B45309] font-semibold hover:underline">
              two-bedroom sizing page
            </Link>{' '}
            is the next step up, and the{' '}
            <Link href="/blog/solar-loans-nigeria" className="text-[#B45309] font-semibold hover:underline">
              pay small small options
            </Link>{' '}
            are set out separately for anyone whose landlord said yes before their bank did.
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
          <h3 className="font-heading font-bold text-[#0A0F1E] text-xl mb-2">Build a system you can take with you</h3>
          <p className="text-[#64748B] mb-4">
            Pick your appliances and get an itemised quote with model classes on it — the document to hand your landlord
            with the indemnity letter.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/calculator" className="inline-flex items-center justify-center bg-[#F59E0B] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-bold text-sm hover:bg-[#D97706] transition-colors">
              Build my renter{'’'}s quote →
            </Link>
            <Link href="/sizing/solar-for-lights-fans-and-tv-only" className="inline-flex items-center justify-center border-2 border-[#0A0F1E] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-semibold text-sm hover:bg-[#0A0F1E] hover:text-white transition-colors">
              See the full bill of materials
            </Link>
          </div>
        </div>
      </article>

      </main>
      <Footer />
    </div>
  );
}
