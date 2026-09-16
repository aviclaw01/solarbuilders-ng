import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { HEADLINE_PACKAGES, LABOUR_PER_KVA, PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { formatNaira } from '@/lib/quote';

export const metadata: Metadata = {
  title: 'How to Choose a Solar Installer in Lagos',
  description: 'How to choose a reliable solar installer in Lagos: CAC registration, past installs, references, written warranty, correct sizing and an itemised quote. The same checklist we apply when we vet installers for customer builds. Updated September 2026.',
  keywords: ['solar installer Lagos', 'choose solar company Lagos', 'best solar installer Lagos', 'solar installation Lagos guide'],
  openGraph: {
    title: 'How to Choose a Solar Installer in Lagos',
    description: 'What to look for, red flags to avoid, and the checklist we use when we vet installers.',
    url: 'https://solarbuildersng.com/blog/choose-solar-installer-lagos',
    type: 'article',
  },
  alternates: { canonical: 'https://solarbuildersng.com/blog/choose-solar-installer-lagos' },
};

const starter = HEADLINE_PACKAGES[1]; // 3.5kVA · 5kWh lithium

export default function ChooseSolarInstallerLagosPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>

      <article className="max-w-3xl mx-auto px-4 py-16">
        <div className="flex items-center gap-2 text-sm text-[#64748B] mb-8">
          <Link href="/" className="hover:text-[#0A0F1E]">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-[#0A0F1E]">Blog</Link>
          <span>/</span>
          <span className="text-[#0A0F1E]">Choose Solar Installer Lagos</span>
        </div>

        <span className="inline-block bg-[#FEF3C7] text-[#0A0F1E] text-xs font-heading font-semibold px-3 py-1 rounded-full mb-6">
          Buyer Guide
        </span>

        <h1 className="font-heading font-extrabold text-[#0A0F1E] text-4xl md:text-5xl leading-tight mb-6">
          How to Choose a Solar Installer in Lagos
        </h1>

        <div className="flex items-center gap-4 text-[#94A3B8] text-sm mb-12 pb-8 border-b border-[#E2E8F0]">
          <span>Updated {PRICES_LAST_UPDATED_LABEL}</span>
          <span>·</span>
          <span>6 min read</span>
        </div>

        <div className="space-y-6 text-[#0A0F1E]">
          <p className="text-xl text-[#64748B] leading-relaxed">
            Lagos has hundreds of solar companies — from established firms with years of track record to WhatsApp vendors who disappear after collecting a deposit. This is the checklist we apply before we let an installer anywhere near a customer build. Use it yourself, whoever ends up doing your installation.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            The stakes are real. A {starter.label} system costs {formatNaira(starter.low)}–{formatNaira(starter.high)} installed as of {PRICES_LAST_UPDATED_LABEL}, so a typical 50% deposit is close to ₦1,000,000. That is not money to hand over on a phone call.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">1. CAC Registration and a Physical Presence</h2>
          <p className="text-[#64748B] leading-relaxed">
            Any serious installer is a registered business. Ask for the CAC registration number and check it on the CAC public search. Then ask for a verifiable address — a shop, office or warehouse you could visit, or at least confirm on Google Maps. Installers who operate purely via WhatsApp with no registered business and no address are the single biggest source of &quot;collected deposit, disappeared&quot; stories.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            This matters most for after-sales. If an inverter faults six months later, you need someone you can actually reach.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">2. Three Past Installs — With Photos and Phone Numbers</h2>
          <p className="text-[#64748B] leading-relaxed">
            Ask for at least three completed installations: photos of the panel array, the inverter and battery wall, and the distribution board, plus the customer&apos;s phone number for each. A reputable installer has these on their phone already. Hesitation is a red flag.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            When you call the references, ask specifically: Did they finish on time? Does the system run what was promised? Did they come back when something went wrong? Photos tell you about workmanship — tidy cable runs, labelled breakers, panels on proper rails rather than wooden battens.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">3. Ask Exactly Which Brands — and Check the Prices</h2>
          <p className="text-[#64748B] leading-relaxed">
            Good installers can tell you precisely what they use and why. In the Nigerian market today that means hybrid inverters from Felicity or Sako (budget), Growatt, Luxpower or Solis (mid), and Deye or Victron (premium); Tier-1 panels from Jinko, JA Solar, Longi, Trina or Canadian Solar; and lithium (LiFePO4) batteries from Deye, Felicity, Growatt or Dyness.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Be cautious of &quot;we use quality components&quot; — that is not an answer. Once you have brand names, check what they actually cost from Nigerian vendors on our <Link href="/brands" className="text-[#F59E0B] font-semibold hover:underline">brands and prices page</Link>. If an installer&apos;s equipment line is far above vendor prices, ask why.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">4. Correct Sizing Before Any Quote</h2>
          <p className="text-[#64748B] leading-relaxed">
            An installer who quotes a system size without asking what you run, for how many hours, is guessing. Undersized systems trip constantly; oversized ones waste money on batteries you never use. Do the load calculation yourself first with our <Link href="/calculator" className="text-[#F59E0B] font-semibold hover:underline">free calculator</Link> — it turns your appliance list into peak kW, kWh per day and a sized system — so you walk into every conversation knowing what you need.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Then insist on a site survey before paying anything. Roof condition, cable run lengths and your existing wiring all change the job.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">5. An Itemised Quote, Not a Lump Sum</h2>
          <p className="text-[#64748B] leading-relaxed">
            A proper quote lists every line: inverter (brand, kVA), battery (brand, kWh, number of modules), panels (brand, wattage, count), mounting, cables, breakers and surge protection, and labour — each with its own price. A single &quot;₦2.5M all-in&quot; figure hides where the money goes and makes it impossible to compare quotes.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            As a sanity check on the labour line: roof-mount installation in Lagos runs {formatNaira(LABOUR_PER_KVA.low)}–{formatNaira(LABOUR_PER_KVA.high)} per kVA as of {PRICES_LAST_UPDATED_LABEL}, with a floor of about ₦100,000 for small jobs. So labour on a 5kVA system should sit around ₦100,000–₦300,000, not ₦800,000. Our calculator produces exactly this kind of itemised quote, priced from the same vendor data on the <Link href="/brands" className="text-[#F59E0B] font-semibold hover:underline">brands page</Link>.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">6. A Written Workmanship Warranty</h2>
          <p className="text-[#64748B] leading-relaxed">
            Equipment warranties come from the manufacturer (typically 2–5 years on inverters, 5–10 years on lithium batteries, 10–25 years on panels). Workmanship — the wiring, mounting, earthing and commissioning — is on the installer. Get a minimum of one year in writing, stating what is covered and how quickly they will attend a fault.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">7. Red Flags to Watch For</h2>
          <ul className="space-y-3 text-[#64748B]">
            {[
              'Asking for full payment upfront before installation begins',
              'No written, itemised quotation — just a total',
              'No workmanship warranty offered (minimum should be 1 year, in writing)',
              'Unwilling to provide photos of past installs or phone numbers of past customers',
              'Price far below vendor equipment prices (usually means refurbished or fake-brand parts)',
              'No CAC registration, no physical address',
              'Quoting a system size without asking what you run',
            ].map((flag, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-red-500 mt-1 font-bold">✕</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">How We Apply This Checklist</h2>
          <p className="text-[#64748B] leading-relaxed">
            When you send us a quote from the calculator, we confirm the prices against current vendor stock, source the equipment from Nigerian vendors, and assign an installer we have already vetted against every point above — CAC registration, at least three past installs with photos, references we have called, and a written workmanship warranty. We manage the build through to commissioning.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            The full process is on our <Link href="/verified" className="text-[#F59E0B] font-semibold hover:underline">how we vet installers</Link> page. It does not guarantee perfection, but it removes the guesswork from the part of the job most people get wrong.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Final Checklist Before You Pay</h2>
          <ul className="space-y-3 text-[#64748B]">
            {[
              'You have an itemised written quote with exact brands, kVA, kWh and panel count',
              'The installer is CAC-registered and you have confirmed a physical address',
              'You have seen photos of at least three past installs and spoken to one customer',
              'The system size came from your actual appliance list, not a guess',
              'Payment is structured: deposit + balance on commissioning',
              'A workmanship warranty period is written into the agreement',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#059669] mt-1 font-bold">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 bg-[#FEF3C7] rounded-2xl p-8">
          <h3 className="font-heading font-bold text-[#0A0F1E] text-xl mb-2">Start with an itemised quote</h3>
          <p className="text-[#64748B] mb-4">Pick your appliances, get a priced bill of materials with a quote code, then send it to us on WhatsApp. We source the equipment and manage a vetted installer.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/calculator" className="inline-flex items-center justify-center bg-[#F59E0B] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-bold text-sm hover:bg-[#D97706] transition-colors">
              Get an itemised quote →
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
