import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { formatNaira, formatRange } from '@/lib/quote';
import { getScenario, scenarioQuote } from '@/lib/sizing';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'How to Check Your Solar Installer Is Actually Qualified (NEMSA, Deposits and Red Flags)',
  description:
    'Three checks before money moves: NEMSA competency certification, a staged payment structure that matches where the cost actually sits, and an itemised bill of materials with model numbers on it.',
  keywords: [
    'how to choose solar installer nigeria',
    'solar installer scam',
    'is my solar installer certified',
    'nemsa certification solar nigeria',
  ],
  openGraph: {
    title: 'How to Check Your Solar Installer Is Actually Qualified',
    description: 'NEMSA, deposit structure and the itemised bill of materials — the three checks that matter.',
    url: `${SITE_URL}/blog/check-solar-installer-qualified-nemsa`,
    type: 'article',
  },
  alternates: { canonical: `${SITE_URL}/blog/check-solar-installer-qualified-nemsa` },
};

const pct = (part: number, whole: number) => `${Math.round((part / whole) * 100)}%`;

export default function CheckInstallerNemsaPage() {
  // The deposit argument is only credible with the cost structure behind it, so
  // it is computed from a real build rather than asserted.
  const scenario = getScenario('how-many-solar-panels-for-3-bedroom-flat')!;
  const quote = scenarioQuote(scenario);
  const t = quote.tiers.standard;
  const equipmentShare = pct(t.equipment.best, t.total.best);
  const bosShare = pct(t.bos.best, t.total.best);
  const labourShare = pct(t.labour.best, t.total.best);
  // Everything that happens on your roof rather than in a warehouse. This is the
  // portion there is never a reason to prepay.
  const siteWorkShare = pct(t.bos.best + t.labour.best, t.total.best);

  const faqs = [
    {
      q: 'Does a solar installer in Nigeria need to be certified?',
      a: 'Electrical installation work in Nigeria falls under NEMSA, the Nigerian Electricity Management Services Agency, which operates a competency certification scheme covering electrical installation personnel including renewable-energy contractors. Ask for the certificate, in the installer’s own name or their company’s, and verify it with NEMSA rather than accepting a photograph of it.',
    },
    {
      q: 'How much deposit should I pay a solar installer?',
      a: `Enough to buy identified equipment, and not a naira more. On a typical build, equipment is about ${equipmentShare} of the installed price, mounting and protection about ${bosShare}, and labour about ${labourShare} — so about ${siteWorkShare} is site work that has not happened when the deposit is asked for. That portion should be paid on delivery and on commissioning, and the deposit itself should buy specific, model-numbered equipment delivered to your address, not a promise.`,
    },
    {
      q: 'What should be on a solar quote?',
      a: 'Every component with its model number, the quantity, and the unit price — inverter, battery, panels, mounting and protection, labour. A lump sum is not a quote, it is a number. Without model numbers you cannot check the price, you cannot claim the warranty, and you have no defence when a different brand arrives on installation day.',
    },
    {
      q: 'How do I know I am not being overcharged?',
      a: `Compare your quote line by line against a published price list. We publish dated per-unit prices for every brand we track, last checked ${PRICES_LAST_UPDATED_LABEL}, and our calculator will build the same system for you to compare against. Price discrimination survives on the buyer having no reference point — a published list removes it.`,
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
        <Breadcrumbs trail={[{ href: '/blog', label: 'Blog' }, { label: 'Checking your installer' }]} className="mb-8" />

        <span className="inline-block bg-[#FEF3C7] text-[#0A0F1E] text-xs font-heading font-semibold px-3 py-1 rounded-full mb-6">
          Buyer Guide
        </span>

        <h1 className="font-heading font-extrabold text-[#0A0F1E] text-4xl md:text-5xl leading-tight mb-6">
          How to Check Your Solar Installer Is Actually Qualified
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
            Three checks, before any money moves. One: a NEMSA competency certificate you have verified, not seen a
            photo of. Two: a payment structure where the deposit buys named equipment delivered to your address, and
            the {siteWorkShare} that is site work waits for the site. Three: an itemised bill of materials with model
            numbers on it.
          </p>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-[#64748B] leading-relaxed text-sm">
              <strong className="text-[#0A0F1E]">Our interest, stated up front.</strong> We earn a procurement margin
              when we buy equipment on a customer{'’'}s behalf, and we manage vetted installers. So we are not a neutral
              party and you should not read this as if we were. What we can do is make every check on this page one you
              can run on <em>us</em> as easily as on anybody else — which is the only version of this article worth
              publishing, given that almost every other scam guide in Nigerian solar was written by someone selling the
              install.
            </p>
          </div>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Check 1 — NEMSA certification</h2>
          <p className="text-[#64748B] leading-relaxed">
            Almost nobody tells Nigerian buyers this exists. The{' '}
            <a href="https://nemsa.gov.ng/competency-certification/" rel="nofollow noopener" target="_blank" className="text-[#B45309] font-semibold hover:underline">
              Nigerian Electricity Management Services Agency
            </a>{' '}
            is the statutory body responsible for electrical safety standards and the enforcement of technical standards
            in the Nigerian electricity supply industry, and it runs a{' '}
            <a href="https://nemsa.gov.ng/wp-content/uploads/2024/05/REVISED-CERTIFICATION-SCHEMES-13052024.pdf" rel="nofollow noopener" target="_blank" className="text-[#B45309] font-semibold hover:underline">
              published competency certification scheme
            </a>{' '}
            covering electrical installation personnel, including renewable-energy contractors.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            What to do with that: ask for the certificate, by name and number, and verify it directly with NEMSA rather
            than accepting a photograph on WhatsApp. Certificates are easy to fake and trivial to check, which is the
            best possible combination for a buyer.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Be fair about what the absence means. Plenty of competent Nigerian solar technicians are not NEMSA-certified,
            because the market grew far faster than the certification did. A missing certificate is not proof of
            incompetence. But it moves the burden of proof, and it should change the other questions you ask — about
            completed installations, about who signs off the electrical work, and about what happens if something burns.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Alongside it, the basics: CAC registration you have looked up rather than been told about, a physical address
            you could actually visit, and past installations with photographs you can trace to a real customer.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Check 2 — make the deposit buy equipment, not a promise</h2>
          <p className="text-[#64748B] leading-relaxed">
            The commonest way Nigerians lose money in solar is not a bad installation. It is a deposit paid to somebody
            who then stops answering the phone — documented cases run from tens of thousands of naira upward, and the
            pattern is always the same: a large up-front payment, a promise, then silence.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            The defence is structural rather than moral. Look at where the cost actually sits on a real build — our{' '}
            {scenario.question.toLowerCase()} Standard system, {formatRange(t.total)} installed:
          </p>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Part of the job</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Cost</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Share</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">When it should be paid</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Equipment (inverter, battery, panels)', t.equipment.best, equipmentShare, 'On order, against an itemised list with model numbers'],
                  ['Mounting, cables & protection', t.bos.best, bosShare, 'On delivery to site'],
                  ['Installation & commissioning', t.labour.best, labourShare, 'On commissioning, after it is tested and working'],
                ].map(([label, cost, share, when], i) => (
                  <tr key={label as string} className={`border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
                    <td className="p-4 font-heading font-semibold text-[#0A0F1E]">{label}</td>
                    <td className="p-4 text-[#64748B]">{formatNaira(cost as number)}</td>
                    <td className="p-4 font-semibold text-[#B45309]">{share}</td>
                    <td className="p-4 text-[#64748B]">{when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[#64748B] text-sm">
            Computed from our quote engine at {PRICES_LAST_UPDATED_LABEL} prices. Quote {quote.code}.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Read the share column carefully, because it cuts both ways. Around {equipmentShare} of a Nigerian solar
            price is hardware, so a large up-front payment is not in itself a red flag — the installer genuinely has to
            buy your equipment before he can install it. That is exactly why {'“'}pay a small deposit{'”'} is useless
            advice here, and why the defence has to be different.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            The defence is that the deposit must convert into <em>identified equipment you can see</em>. Model numbers
            on the invoice, delivery to your address rather than his, and serial numbers recorded on arrival. And the
            remaining {siteWorkShare} — mounting, protection and labour — is work that has not happened when the deposit
            is requested, so there is no legitimate reason for it to be paid in advance. An installer asking for 100%
            before anything is delivered is asking you to carry his entire commercial risk for him.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Two practical additions. Pay a company account, not a personal one — it is the difference between a
            commercial dispute and a police matter. And get the equipment delivered to <em>your</em> site before
            installation day, not held at his. Equipment you can see is equipment that exists.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Check 3 — demand an itemised bill of materials</h2>
          <p className="text-[#64748B] leading-relaxed">
            A lump sum is not a quote. An itemised bill of materials — every component, with its model number, quantity
            and unit price — is the single document that protects you against all three of the common failures at once.
          </p>
          <ul className="space-y-3 text-[#64748B]">
            {[
              ['Substitution at the door', 'The most specific betrayal in this market: panels or an inverter of a different brand arriving on installation day, with an explanation that your brand is no longer available. If the model number is on the quote, that is a breach rather than a debate — and you can say so before anything goes on the roof.'],
              ['Silent downgrading', 'A lump sum lets the specification quietly fall to whatever protects the margin. Model numbers make that impossible.'],
              ['Warranty orphaning', 'You cannot claim on a warranty for a product you cannot name. The serial numbers of what was actually installed belong on your handover document.'],
            ].map(([title, body]) => (
              <li key={title} className="flex items-start gap-2">
                <span className="text-[#B45309] mt-1">•</span>
                <span><strong className="text-[#0A0F1E]">{title}.</strong> {body}</span>
              </li>
            ))}
          </ul>
          <p className="text-[#64748B] leading-relaxed">
            If a quote you have been given is a single number, ask for it broken down. The reaction to that request is
            itself the test. Our{' '}
            <Link href="/calculator" className="text-[#B45309] font-semibold hover:underline">calculator</Link> produces
            an itemised build for exactly this reason — you can take it to any installer and ask them to price against
            it line by line.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Price discrimination, and why we publish prices</h2>
          <p className="text-[#64748B] leading-relaxed">
            One of the stories that circulated in Nigerian solar in 2026 was a man publicly accusing an installer friend
            of charging him considerably more than the same installer had quoted somebody else for comparable work. It
            is an ugly story and it is also completely ordinary, because price discrimination is what happens in any
            market where the buyer has no reference point.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            That is the whole reason we publish prices. Not as a service — as a mechanism. A dated, per-unit, per-brand
            price list means the question stops being {'“'}is this a fair price?{'”'}, which you cannot answer, and
            becomes {'“'}why is this line above the published range for that model?{'”'}, which the person in front of
            you has to answer. Our per-brand prices are on the{' '}
            <Link href="/brands" className="text-[#B45309] font-semibold hover:underline">brands pages</Link> with the
            date we saw each one.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            A quote above the published range is not automatically wrong, incidentally. Distance, a difficult roof,
            three-phase work and better cable all cost real money. What matters is that the person quoting has to name
            the reason instead of relying on your not knowing.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Commissioning: what should be tested and handed over</h2>
          <p className="text-[#64748B] leading-relaxed">
            The job is not finished when the lights come on. Before the final payment, these should be demonstrated in
            front of you:
          </p>
          <ol className="space-y-3 text-[#64748B] list-decimal pl-5">
            <li><strong className="text-[#0A0F1E]">Earthing, proven.</strong> Not {'“'}we earthed it{'”'} — shown, with a reading.</li>
            <li><strong className="text-[#0A0F1E]">Array output under load.</strong> PV voltage and current on the inverter display in daylight, against what the panels are rated for.</li>
            <li><strong className="text-[#0A0F1E]">Battery charge and discharge.</strong> A full charge, then a run on battery with a known load, and the time it holds.</li>
            <li><strong className="text-[#0A0F1E]">Changeover behaviour.</strong> Grid off, grid back on, generator in and out. This is the part that most often turns out to have been assumed rather than tested.</li>
            <li><strong className="text-[#0A0F1E]">Protection devices.</strong> DC isolator, breakers, surge protection — present, correctly rated and labelled.</li>
            <li><strong className="text-[#0A0F1E]">The handover pack.</strong> Serial numbers of everything installed, warranty documents, a wiring diagram of what was actually built, and the monitoring app set up in your name, not the installer{'’'}s.</li>
          </ol>
          <p className="text-[#64748B] leading-relaxed">
            That last point is not a detail. A monitoring account registered to the installer means you lose visibility
            of your own system the day you fall out with him.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Warranty routing — who do you call?</h2>
          <p className="text-[#64748B] leading-relaxed">
            Ask before you buy, and write the answer down: if the inverter fails in year three, who do you call, and what
            do they need from you? There are usually three separate warranties in play — the manufacturer{'’'}s on each
            product, the importer or distributor{'’'}s in Nigeria, and the installer{'’'}s workmanship warranty — and
            they cover different failures.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            The workmanship warranty is the one people forget to ask for, and it is the one that covers the leaking roof
            fixing and the undersized cable. Get its term in writing. Then check what the manufacturer actually publishes
            for the brand you are buying: we list the published warranty and the Nigerian service presence for every
            brand we track on the{' '}
            <Link href="/brands" className="text-[#B45309] font-semibold hover:underline">brand pages</Link>, and where a
            brand publishes nothing we say so rather than repeating a seller{'’'}s claim.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Red flags, in order of how often we see them</h2>
          <ul className="space-y-3 text-[#64748B]">
            {[
              'A lump-sum price with no component list.',
              'Full payment, or near-full payment, demanded before anything is delivered.',
              'A personal bank account.',
              'A price well below the published floor for the components claimed — which usually means the components are not what is claimed.',
              'No physical address, or an address that is a phone number.',
              'Reluctance to put the model numbers in writing.',
              'Sizing offered before your appliances have been asked about.',
              'Pressure to decide today because of a price that expires tonight.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-[#B45309] mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-[#64748B] leading-relaxed">
            The last one deserves a note. Equipment prices in Nigeria genuinely do move with the naira, so an expiring
            quote is not automatically a trick. What tells you which it is: a legitimate expiring quote names the
            components and the date it was priced, so you can check the movement yourself. A pressure tactic does not.
            The related check — whether the hardware itself is what it claims to be — is in{' '}
            <Link href="/blog/fake-solar-panels-nigeria" className="text-[#B45309] font-semibold hover:underline">
              how to tell a real solar panel from a fake one
            </Link>.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">How we do it</h2>
          <p className="text-[#64748B] leading-relaxed">
            You should hold us to everything above. Our process: you build an itemised quote in the{' '}
            <Link href="/calculator" className="text-[#B45309] font-semibold hover:underline">calculator</Link> and get a
            quote code; we confirm every line against current vendor stock before anyone pays; we source the equipment
            and manage an installer we have vetted through to commissioning. What our vetting actually involves is
            written out on{' '}
            <Link href="/verified" className="text-[#B45309] font-semibold hover:underline">how we vet</Link>, and the
            end-to-end process is on{' '}
            <Link href="/how-it-works" className="text-[#B45309] font-semibold hover:underline">how it works</Link>.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            For choosing between installers in a specific city, we have a companion guide on{' '}
            <Link href="/blog/choose-solar-installer-lagos" className="text-[#B45309] font-semibold hover:underline">
              choosing a solar installer in Lagos
            </Link>. And if you have a quote in front of you right now and want a second opinion on it,{' '}
            <Link href="/contact" className="text-[#B45309] font-semibold hover:underline">send it to us</Link> — we will
            tell you which lines look wrong even if you never buy anything from us.
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
          <h3 className="font-heading font-bold text-[#0A0F1E] text-xl mb-2">Get the itemised quote first</h3>
          <p className="text-[#64748B] mb-4">
            Walk into the conversation with a component list and a price range already in your hand. It changes the
            conversation entirely.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/calculator" className="inline-flex items-center justify-center bg-[#F59E0B] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-bold text-sm hover:bg-[#D97706] transition-colors">
              Build an itemised quote →
            </Link>
            <Link href="/verified" className="inline-flex items-center justify-center border-2 border-[#0A0F1E] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-semibold text-sm hover:bg-[#0A0F1E] hover:text-white transition-colors">
              How we vet installers
            </Link>
          </div>
        </div>
      </article>

      </main>
      <Footer />
    </div>
  );
}
