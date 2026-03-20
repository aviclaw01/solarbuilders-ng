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
  },
  {
    slug: 'inverter-size-guide',
    title: 'What Size Inverter Do I Need? A Nigerian Guide',
    excerpt: 'Choosing the wrong inverter size is one of the most expensive mistakes solar buyers make. This guide helps you calculate exactly what you need.',
    readTime: '7 min read',
    date: 'February 2026',
    tag: 'System Sizing',
  },
  {
    slug: 'generator-vs-solar-lagos',
    title: 'The True Cost of Generator vs Solar in Lagos',
    excerpt: 'Most Lagosians know generators are expensive. But few have done the math. We did — and the numbers over 3 years are eye-opening.',
    readTime: '8 min read',
    date: 'March 2026',
    tag: 'Cost Analysis',
  },
  {
    slug: 'choose-solar-installer-lagos',
    title: 'How to Choose a Solar Installer in Nigeria (Without Getting Scammed)',
    excerpt: 'Not all solar installers are equal. This guide shows you what to look for, the right questions to ask, and red flags to avoid before paying a single naira.',
    readTime: '5 min read',
    date: 'March 2026',
    tag: 'Buyer Guide',
  },
  {
    slug: 'solar-maintenance-nigeria',
    title: 'Solar Panel Maintenance: What Nigerian Homeowners Need to Know',
    excerpt: 'Good news: solar is remarkably low-maintenance. Here\'s what you actually need to do — and what you can safely ignore — in Nigeria\'s climate.',
    readTime: '6 min read',
    date: 'March 2026',
    tag: 'Maintenance',
  },
  {
    slug: 'solar-loans-nigeria',
    title: 'Carbon, FairMoney, or Renmoney: Best Solar Loans in Nigeria',
    excerpt: 'Compare the best solar financing options in Nigeria — fintech loans, bank products, PAYG schemes, and installer payment plans.',
    readTime: '7 min read',
    date: 'March 2026',
    tag: 'Financing',
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="bg-white border-b border-slate-100 px-6 py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-4">
            <span className="text-amber-500 text-sm font-semibold tracking-wide uppercase">Solar Learning Hub</span>
          </div>
          <h1 className="font-heading font-extrabold text-slate-900 text-4xl md:text-5xl mb-4">
            Solar guides for Nigerians
          </h1>
          <p className="text-slate-500 text-xl max-w-2xl">
            No jargon. No fluff. Just what you need to make a smart solar decision.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ARTICLES.map(article => (
            <Link key={article.slug} href={`/blog/${article.slug}`} className="group">
              <div className="bg-white rounded-2xl border border-slate-100 p-6 hover:border-amber-300 transition-all duration-200 h-full flex flex-col">
                <span className="inline-block bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-3 py-1 rounded-full mb-4 self-start">
                  {article.tag}
                </span>
                <h2 className="font-heading font-bold text-slate-900 text-lg mb-3 group-hover:text-amber-500 transition-colors leading-snug flex-1">
                  {article.title}
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">{article.excerpt}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-slate-400 text-xs">{article.date}</span>
                  <span className="text-amber-500 text-xs font-semibold">Read more →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Calculator CTA */}
        <div className="mt-16 bg-slate-900 rounded-2xl p-10 text-center">
          <h3 className="font-heading font-extrabold text-white text-2xl md:text-3xl mb-3">
            Ready to calculate your solar system?
          </h3>
          <p className="text-slate-400 mb-6">Free, takes 5 minutes. No signup required.</p>
          <Link
            href="/calculator"
            className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold rounded-full px-6 py-3 transition-all"
          >
            Calculate My System →
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
