'use client';

import { useState } from 'react';
import { Star, CheckCircle } from 'lucide-react';
import type { Builder } from '@/lib/mock-data';
import { formatNairaFull } from '@/lib/mock-data';
import ReviewForm from '@/components/ui/ReviewForm';

const TABS = ['Products', 'About', 'Gallery', 'Reviews'] as const;
type Tab = typeof TABS[number];

const SERVICE_MAP: Record<string, { icon: string; desc: string }> = {
  'Full Installation': { icon: '🔧', desc: 'End-to-end design, supply, and installation' },
  'System Design': { icon: '📐', desc: 'Custom load analysis and system sizing' },
  'Residential': { icon: '🏠', desc: 'Home systems from 1.5kVA to 15kVA' },
  'Commercial': { icon: '🏢', desc: 'Office and retail solutions, 10kVA+' },
  'Off-grid': { icon: '🔋', desc: 'Complete battery-backed, no PHCN needed' },
  'Hybrid': { icon: '⚡', desc: 'Grid-tied + battery backup systems' },
  'Repair': { icon: '🛠️', desc: 'Fault diagnosis and component replacement' },
  'Maintenance': { icon: '🔍', desc: 'Periodic checks and performance optimization' },
};

export default function CompanyClient({ builder }: { builder: Builder }) {
  const [activeTab, setActiveTab] = useState<Tab>('Products');

  const waLink = `https://wa.me/${builder.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I found you on SolarBuilders.ng. I'm interested in a solar installation. Can you help?`)}`;

  return (
    <div className="pb-24 md:pb-8">
      {/* Tab bar */}
      <div className="border-b border-slate-200 sticky top-0 bg-white z-30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-0 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-4 text-sm font-heading font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-amber-500 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* ── Products ── */}
        {activeTab === 'Products' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {builder.packages.map((pkg, i) => (
              <div key={pkg.name} className={`rounded-2xl border-2 p-6 ${i === 0 ? 'border-amber-500' : 'border-slate-200'}`}>
                {i === 0 && (
                  <span className="inline-block bg-amber-500 text-slate-900 text-xs font-heading font-bold px-3 py-1 rounded-full mb-3">
                    Most Popular
                  </span>
                )}
                <div className="inline-flex items-center gap-1 bg-slate-900 text-amber-400 text-sm font-heading font-extrabold px-3 py-1.5 rounded-lg mb-3">
                  ⚡ {pkg.kva}kVA
                </div>
                <h3 className="font-heading font-bold text-slate-900 text-lg mb-2">{pkg.name}</h3>
                <p className="text-slate-500 text-sm mb-4 leading-relaxed">{pkg.description}</p>
                <p className="font-heading font-extrabold text-amber-500 text-xl mb-4">{formatNairaFull(pkg.price)}</p>
                <a
                  href={`${waLink}&text=${encodeURIComponent(`Hi, I'm interested in your ${pkg.name} (${pkg.kva}kVA) package.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-[#25D366] text-white text-center py-3 rounded-full font-heading font-bold text-sm hover:bg-[#22c55e] transition-colors"
                >
                  💬 Enquire on WhatsApp
                </a>
              </div>
            ))}
          </div>
        )}

        {/* ── About ── */}
        {activeTab === 'About' && (
          <div className="space-y-8">
            <div>
              <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4">About</h2>
              <p className="text-slate-600 text-base leading-relaxed">{builder.bio}</p>
            </div>

            <div>
              <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4">Services</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {builder.services.map(s => {
                  const d = SERVICE_MAP[s] || { icon: '✅', desc: '' };
                  return (
                    <div key={s} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xl">{d.icon}</span>
                      <div>
                        <div className="font-heading font-semibold text-slate-900 text-sm">{s}</div>
                        <div className="text-slate-500 text-xs">{d.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4">Specialties</h2>
              <div className="flex flex-wrap gap-2">
                {builder.specialties.map(s => (
                  <span key={s} className="px-4 py-2 bg-amber-50 border border-amber-200 text-slate-900 text-sm rounded-full font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Gallery ── */}
        {activeTab === 'Gallery' && (
          <div>
            <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4">Project Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="aspect-square bg-slate-100 rounded-xl flex items-center justify-center">
                  <p className="text-slate-400 text-sm font-medium text-center px-4">Photo coming soon</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Reviews ── */}
        {activeTab === 'Reviews' && (
          <div className="space-y-4">
            <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4">
              Reviews <span className="text-amber-500">({builder.reviewCount})</span>
            </h2>
            {builder.reviews.map((review, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-heading font-semibold text-slate-900 text-sm">{review.author}</p>
                    <p className="text-slate-400 text-xs">{review.location} · {review.date}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'text-amber-500 fill-current' : 'text-slate-200'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-slate-600 text-base leading-relaxed">&ldquo;{review.body}&rdquo;</p>
                {review.verified && (
                  <div className="flex items-center gap-1 mt-3 text-emerald-600 text-xs font-medium">
                    <CheckCircle className="w-3 h-3" />
                    Verified purchase
                  </div>
                )}
              </div>
            ))}

            <ReviewForm builderSlug={builder.slug} builderName={builder.name} />
          </div>
        )}
      </div>
    </div>
  );
}
