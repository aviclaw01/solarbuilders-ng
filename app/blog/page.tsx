import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';

export const metadata: Metadata = {
  title: 'Solar Energy Guide for Nigeria — Tips, Costs & Advice',
  description: 'Expert guides on solar energy in Nigeria. Learn about solar costs, how to choose an installer, system sizing, maintenance, and financing for Lagos, Abuja, and more.',
  keywords: ['solar Nigeria guide', 'solar cost Nigeria', 'solar calculator guide', 'solar installer tips Nigeria', 'solar education Nigeria'],
  openGraph: {
    title: 'Solar Energy Blog — SolarBuilders.ng',
    description: 'Expert guides and resources on solar energy in Nigeria.',
    url: 'https://solarbuildersng.com/blog',
    type: 'website',
  },
  alternates: { canonical: 'https://solarbuildersng.com/blog' },
};

const ARTICLES = [
  {
    slug: 'solar-cost-nigeria-2026',
    title: 'How Much Does Solar Cost in Nigeria? (2026 Guide)',
    excerpt: 'A complete breakdown of solar installation costs in Nigeria — from budget 2kVA systems to full 10kVA home solutions. Real prices from verified installers.',
    readTime: '6 min read',
    date: 'March 2026',
    tag: 'Costs & Pricing',
    tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
    featured: true,
  },
  {
    slug: 'generator-vs-solar-lagos',
    title: 'The True Cost of Generator vs Solar in Lagos',
    excerpt: 'Most Lagosians know generators are expensive. But few have done the math. We did — and the numbers over 3 years are eye-opening.',
    readTime: '8 min read',
    date: 'March 2026',
    tag: 'Cost Analysis',
    tagColor: 'bg-red-50 text-red-700 border-red-200',
    featured: true,
  },
  {
    slug: 'inverter-size-guide',
    title: 'What Size Inverter Do I Need? A Nigerian Guide',
    excerpt: 'Choosing the wrong inverter size is one of the most expensive mistakes solar buyers make. This guide helps you calculate exactly what you need.',
    readTime: '7 min read',
    date: 'February 2026',
    tag: 'System Sizing',
    tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
    featured: false,
  },
  {
    slug: 'choose-solar-installer-lagos',
    title: 'How to Choose a Solar Installer in Nigeria (Without Getting Scammed)',
    excerpt: 'Not all solar installers are equal. This guide shows you what to look for, the right questions to ask, and red flags to avoid before paying a single naira.',
    readTime: '5 min read',
    date: 'March 2026',
    tag: 'Buyer Guide',
    tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
    featured: false,
  },
  {
    slug: 'solar-maintenance-nigeria',
    title: 'Solar Panel Maintenance: What Nigerian Homeowners Need to Know',
    excerpt: 'Good news: solar is remarkably low-maintenance. Here\'s what you actually need to do — and what you can safely ignore — in Nigeria\'s climate.',
    readTime: '6 min read',
    date: 'March 2026',
    tag: 'Maintenance',
    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    featured: false,
  },
  {
    slug: 'solar-loans-nigeria',
    title: 'Carbon, FairMoney, or Renmoney: Best Solar Loans in Nigeria',
    excerpt: 'Compare the best solar financing options in Nigeria — fintech loans, bank products, PAYG schemes, and installer payment plans.',
    readTime: '7 min read',
    date: 'March 2026',
    tag: 'Financing',
    tagColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    featured: false,
  },
];

export default function BlogPage() {
  const featured = ARTICLES.filter(a => a.featured);
  const rest = ARTICLES.filter(a => !a.featured);

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <Navbar />

      {/* Header */}
      <div className="bg-[#0F172A] px-6 py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <span className="inline-block text-[#F59E0B] text-sm font-semibold tracking-widest uppercase mb-4">
            Solar Learning Hub
          </span>
          <h1 className="font-heading font-extrabold text-white text-4xl md:text-5xl mb-4 max-w-2xl">
            Solar guides for Nigerians.
          </h1>
          <p className="text-[#94A3B8] text-xl max-w-2xl">
            No jargon. No fluff. Just what you need to make a smart solar decision.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Featured articles — larger */}
        <div className="mb-12">
          <h2 className="font-heading font-bold text-[#0F172A] text-lg mb-6">Featured Guides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featured.map(article => (
              <Link key={article.slug} href={`/blog/${article.slug}`} className="group block">
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 card-hover h-full flex flex-col">
                  <span className={`inline-block border text-xs font-semibold px-3 py-1 rounded-full mb-4 self-start ${article.tagColor}`}>
                    {article.tag}
                  </span>
                  <h2 className="font-heading font-bold text-[#0F172A] text-xl mb-3 group-hover:text-[#F59E0B] transition-colors duration-200 leading-snug flex-1">
                    {article.title}
                  </h2>
                  <p className="text-[#64748B] text-sm leading-relaxed mb-6">{article.excerpt}</p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#E2E8F0]">
                    <div className="flex items-center gap-3">
                      <span className="text-[#94A3B8] text-xs">{article.date}</span>
                      <span className="text-[#94A3B8] text-xs">·</span>
                      <span className="text-[#94A3B8] text-xs">{article.readTime}</span>
                    </div>
                    <span className="text-[#F59E0B] text-sm font-semibold group-hover:translate-x-1 transition-transform duration-200 inline-block">
                      Read →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* All articles */}
        <div>
          <h2 className="font-heading font-bold text-[#0F172A] text-lg mb-6">All Guides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rest.map((article, i) => (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="group block"
                style={{ transitionDelay: `${i * 75}ms` }}
              >
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 card-hover h-full flex flex-col">
                  <span className={`inline-block border text-xs font-semibold px-3 py-1 rounded-full mb-3 self-start ${article.tagColor}`}>
                    {article.tag}
                  </span>
                  <h2 className="font-heading font-bold text-[#0F172A] text-base mb-2 group-hover:text-[#F59E0B] transition-colors duration-200 leading-snug flex-1">
                    {article.title}
                  </h2>
                  <p className="text-[#64748B] text-sm leading-relaxed mb-4 line-clamp-3">{article.excerpt}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[#94A3B8] text-xs">{article.readTime}</span>
                    <span className="text-[#F59E0B] text-xs font-semibold group-hover:translate-x-1 transition-transform duration-200 inline-block">
                      Read →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Calculator CTA */}
        <div className="mt-16 bg-[#0F172A] rounded-2xl p-10 text-center">
          <h3 className="font-heading font-extrabold text-white text-2xl md:text-3xl mb-3">
            Ready to calculate your solar system?
          </h3>
          <p className="text-[#94A3B8] mb-6">Free, takes 5 minutes. No signup required.</p>
          <Link
            href="/calculator"
            className="inline-flex items-center gap-2 bg-[#F59E0B] text-[#0F172A] font-heading font-bold rounded-full px-8 py-4 btn-primary hover:bg-[#D97706]"
          >
            Calculate My System →
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
