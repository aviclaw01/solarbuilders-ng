import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';

export const metadata: Metadata = {
  title: 'How to Choose a Solar Installer in Lagos — SolarBuilders.ng',
  description: 'Complete guide to finding a reliable solar installer in Lagos. What to look for, red flags to avoid, and questions to ask before paying. Updated for 2026.',
  keywords: ['solar installer Lagos', 'choose solar company Lagos', 'best solar installer Lagos', 'solar installation Lagos guide'],
  openGraph: {
    title: 'How to Choose a Solar Installer in Lagos',
    description: 'What to look for, red flags to avoid, and questions to ask.',
    url: 'https://solarbuilders.ng/blog/choose-solar-installer-lagos',
    type: 'article',
  },
  alternates: { canonical: 'https://solarbuilders.ng/blog/choose-solar-installer-lagos' },
};

export default function ChooseSolarInstallerLagosPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

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
          <span>March 2026</span>
          <span>·</span>
          <span>5 min read</span>
        </div>

        <div className="space-y-6 text-[#0A0F1E]">
          <p className="text-xl text-[#64748B] leading-relaxed">
            Lagos has hundreds of solar companies — from established firms with years of track record to WhatsApp vendors who disappeared after collecting deposits. This guide helps you tell the difference.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">1. Check for a Physical Presence</h2>
          <p className="text-[#64748B] leading-relaxed">
            Any serious solar installer in Lagos should have a verifiable address — a shop, office, or warehouse. Ask for it. You can visit, or simply confirm it exists on Google Maps. Installers who operate purely via WhatsApp with no verifiable address are a significant risk.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            This matters particularly for after-sales service. If something goes wrong with your system 6 months later, you need to be able to reach someone.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">2. Ask for References — and Call Them</h2>
          <p className="text-[#64748B] leading-relaxed">
            Any reputable installer should be happy to give you the phone numbers of 2–3 previous customers. If they&apos;re hesitant, that&apos;s a red flag. When you call, ask specifically: Did they complete the job on time? Did the system work as described? Did they come back when there were issues?
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">3. Ask About Equipment Brands</h2>
          <p className="text-[#64748B] leading-relaxed">
            Good installers know their equipment and can tell you exactly what brands they use and why. Look for inverter brands like Luminous, Victron, SMA, or Growatt. For panels, Tier 1 brands include Longi, JA Solar, and Canadian Solar. Ask what batteries they use and whether they carry genuine products with certificates.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Be cautious of vague answers like "we use quality components." That&apos;s not an answer.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">4. Insist on a Site Survey Before Any Payment</h2>
          <p className="text-[#64748B] leading-relaxed">
            A proper solar installation requires a site survey. The installer should visit your home, assess your roof (or mounting location), check your existing wiring, and understand your load requirements. Any installer who quotes you a price over the phone without a survey is guessing — and you&apos;ll likely pay for that guess later.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">5. Red Flags to Watch For</h2>
          <ul className="space-y-3 text-[#64748B]">
            {[
              'Asking for full payment upfront before installation begins',
              'No written quotation or breakdown of what\'s included',
              'No warranty offered (minimum should be 1 year workmanship)',
              'Unwilling to provide names or phone numbers of past customers',
              'Price significantly lower than all other quotes (often means inferior parts)',
              'No physical address or registered business details',
            ].map((flag, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-red-500 mt-1 font-bold">✕</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">6. Why Verified Matters</h2>
          <p className="text-[#64748B] leading-relaxed">
            On SolarBuilders.ng, every builder carries the Nexprove Verified badge only after passing our review process. We verify their experience, check references, confirm their physical location, and review their equipment sourcing. This doesn&apos;t guarantee perfection, but it significantly reduces your risk.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            The verified badge exists because we&apos;ve heard too many stories of Lagos residents losing ₦400,000+ to unreliable installers. It&apos;s our answer to that problem.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Final Checklist Before You Pay</h2>
          <ul className="space-y-3 text-[#64748B]">
            {[
              'You have a written quote with exact component specs',
              'You\'ve confirmed the installer has a physical presence',
              'You\'ve spoken to at least one previous customer',
              'Payment is structured: deposit + balance on completion',
              'A warranty period is written into the agreement',
              'You know the exact brands of inverter, panels, and batteries',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#059669] mt-1 font-bold">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 bg-[#FEF3C7] rounded-2xl p-8">
          <h3 className="font-heading font-bold text-[#0A0F1E] text-xl mb-2">Find verified solar installers in Lagos</h3>
          <p className="text-[#64748B] mb-4">Every builder on our marketplace has passed our verification process.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/solar/lagos" className="inline-flex items-center justify-center bg-[#F59E0B] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-bold text-sm hover:bg-[#D97706] transition-colors">
              Browse Lagos Installers →
            </Link>
            <Link href="/calculator" className="inline-flex items-center justify-center border-2 border-[#0A0F1E] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-semibold text-sm hover:bg-[#0A0F1E] hover:text-white transition-colors">
              Calculate My System
            </Link>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}
