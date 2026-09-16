import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { ARTICLES } from './articles';

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



export default function BlogPage() {
  const featured = ARTICLES.filter(a => a.featured);
  const rest = ARTICLES.filter(a => !a.featured);

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <Navbar />
      <main>

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
                      <span className="text-[#64748B] text-xs">{article.date}</span>
                      <span className="text-[#64748B] text-xs">·</span>
                      <span className="text-[#64748B] text-xs">{article.readTime}</span>
                    </div>
                    <span className="text-[#B45309] text-sm font-semibold group-hover:translate-x-1 transition-transform duration-200 inline-block">
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
                    <span className="text-[#64748B] text-xs">{article.readTime}</span>
                    <span className="text-[#B45309] text-xs font-semibold group-hover:translate-x-1 transition-transform duration-200 inline-block">
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

      </main>
      <Footer />
    </div>
  );
}
