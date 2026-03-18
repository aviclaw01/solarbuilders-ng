import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';

export const metadata: Metadata = {
  title: 'Solar Energy Blog Nigeria — Guides, Costs & Tips | SolarBuilders.ng',
  description: 'Expert guides on solar energy in Nigeria. Learn about solar costs, how to choose an installer, system sizing, and city-by-city guides for Lagos, Abuja, and more.',
  keywords: ['solar Nigeria guide', 'solar cost Nigeria', 'solar calculator guide', 'solar installer tips Nigeria'],
  openGraph: {
    title: 'Solar Energy Blog — SolarBuilders.ng',
    description: 'Expert guides and resources on solar energy in Nigeria.',
    url: 'https://solarbuilders.ng/blog',
    type: 'website',
  },
  alternates: { canonical: 'https://solarbuilders.ng/blog' },
};

const ARTICLES = [
  {
    slug: 'solar-cost-nigeria-2026',
    title: 'How Much Does Solar Cost in Nigeria? (2026 Guide)',
    excerpt: 'A complete breakdown of solar installation costs in Nigeria in 2026 — from budget 2kVA systems to full 10kVA home solutions. Includes price ranges, what drives costs up, and how to avoid being overcharged.',
    readTime: '6 min read',
    date: 'March 2026',
    tag: 'Costs & Pricing',
  },
  {
    slug: 'choose-solar-installer-lagos',
    title: 'How to Choose a Solar Installer in Lagos',
    excerpt: 'Not all solar installers in Lagos are equal. This guide shows you what to look for, the right questions to ask, red flags to avoid, and how to verify a company before paying a single naira.',
    readTime: '5 min read',
    date: 'March 2026',
    tag: 'Buyer Guide',
  },
  {
    slug: 'solar-calculator-nigeria',
    title: 'Solar Calculator: What Size System Do I Need?',
    excerpt: 'A step-by-step guide to calculating the right solar system size for your Nigerian home. Learn about watts, kVA, batteries, and panels — in plain language.',
    readTime: '7 min read',
    date: 'February 2026',
    tag: 'System Sizing',
  },
  {
    slug: 'solar-abuja-2026',
    title: 'Solar in Abuja: Best Installers and Prices 2026',
    excerpt: 'Abuja has excellent solar conditions and a growing market of quality installers. This guide covers everything you need to know about going solar in the FCT in 2026.',
    readTime: '5 min read',
    date: 'February 2026',
    tag: 'City Guide',
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="bg-white border-b border-[#E2E8F0] px-4 py-16 md:py-20">
        <div className="max-w-7xl mx-auto max-w-3xl">
          <h1 className="font-heading font-extrabold text-[#0A0F1E] text-4xl md:text-5xl mb-4">
            Solar guides for Nigerians
          </h1>
          <p className="text-[#64748B] text-xl">
            No jargon. No fluff. Just what you need to make a smart solar decision.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ARTICLES.map(article => (
            <Link key={article.slug} href={`/blog/${article.slug}`} className="group">
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 hover:border-[#F59E0B] hover:shadow-lg transition-all duration-200 h-full">
                <span className="inline-block bg-[#FEF3C7] text-[#0A0F1E] text-xs font-heading font-semibold px-3 py-1 rounded-full mb-4">
                  {article.tag}
                </span>
                <h2 className="font-heading font-bold text-[#0A0F1E] text-xl mb-3 group-hover:text-[#F59E0B] transition-colors leading-snug">
                  {article.title}
                </h2>
                <p className="text-[#64748B] text-sm leading-relaxed mb-6">{article.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8] text-xs">{article.date}</span>
                  <span className="text-[#94A3B8] text-xs">{article.readTime}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Calculator CTA */}
        <div className="mt-16 bg-[#0A0F1E] rounded-2xl p-10 text-center">
          <h3 className="font-heading font-extrabold text-white text-2xl md:text-3xl mb-3">
            Ready to calculate your solar system?
          </h3>
          <p className="text-[#94A3B8] mb-6">Free, takes 60 seconds. No signup required.</p>
          <Link
            href="/calculator"
            className="inline-flex items-center gap-2 bg-[#F59E0B] text-[#0A0F1E] px-7 py-3.5 rounded-full font-heading font-bold text-base hover:bg-[#D97706] transition-colors"
          >
            Calculate My System →
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
