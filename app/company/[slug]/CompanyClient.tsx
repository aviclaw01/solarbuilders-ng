'use client';

import { useState } from 'react';
import { Star, CheckCircle, MapPin, Phone, Award, Wrench } from 'lucide-react';
import type { Builder } from '@/lib/mock-data';
import { formatNairaFull } from '@/lib/mock-data';
import ReviewForm from '@/components/ui/ReviewForm';

const TABS = ['Products', 'About', 'Gallery', 'Reviews'] as const;
type Tab = typeof TABS[number];

function getOutcome(kva: number): string {
  if (kva <= 3.5) return 'Powers lights, fans, fridge, TV — no AC';
  if (kva <= 5) return 'Powers everything including 1 standard AC unit';
  if (kva <= 7.5) return 'Powers full home — multiple ACs, all appliances';
  return 'Full commercial or large home — unlimited capacity';
}

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

  const waLink = `https://wa.me/${builder.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${builder.name}, I found you on SolarBuilders.ng. I'm interested in a solar installation. Can you help?`)}`;

  return (
    <div className="pb-24 md:pb-8">
      {/* Metrics bar — trust signals */}
      {builder.verified && (
        <div className="bg-[#ECFDF5] border-b border-[#A7F3D0] px-4 py-3">
          <div className="max-w-5xl mx-auto flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-1.5 text-[#065F46]">
              <CheckCircle className="w-4 h-4 text-[#10B981]" />
              <span className="text-sm font-semibold">Nexprove Verified</span>
            </div>
            <div className="h-4 w-px bg-[#A7F3D0] hidden sm:block" />
            <div className="flex items-center gap-1.5 text-[#065F46] text-sm">
              <Award className="w-4 h-4" />
              <span>References checked</span>
            </div>
            <div className="h-4 w-px bg-[#A7F3D0] hidden sm:block" />
            <div className="flex items-center gap-1.5 text-[#065F46] text-sm">
              <Wrench className="w-4 h-4" />
              <span>Portfolio reviewed</span>
            </div>
            <div className="h-4 w-px bg-[#A7F3D0] hidden sm:block" />
            <div className="flex items-center gap-1.5 text-[#065F46] text-sm">
              <Phone className="w-4 h-4" />
              <span>Identity confirmed</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="border-b border-[#E2E8F0] sticky top-0 bg-white z-30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-0 overflow-x-auto hide-scrollbar">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-4 text-sm font-heading font-semibold whitespace-nowrap border-b-2 transition-all duration-200 ${
                  activeTab === tab
                    ? 'border-[#F59E0B] text-[#0F172A]'
                    : 'border-transparent text-[#64748B] hover:text-[#0F172A] hover:border-[#E2E8F0]'
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
              <div
                key={pkg.name}
                className={`group rounded-2xl border-2 p-6 transition-all duration-200 card-hover ${
                  i === 0 ? 'border-[#F59E0B] bg-[#FFFBEB]' : 'border-[#E2E8F0] bg-white'
                }`}
              >
                {i === 0 && (
                  <span className="inline-block bg-[#F59E0B] text-[#0F172A] text-xs font-heading font-bold px-3 py-1 rounded-full mb-3">
                    Most Popular
                  </span>
                )}
                <div className="inline-flex items-center gap-1 bg-[#0F172A] text-[#F59E0B] text-sm font-heading font-extrabold px-3 py-1.5 rounded-lg mb-3">
                  ⚡ {pkg.kva}kVA
                </div>
                <h3 className="font-heading font-bold text-[#0F172A] text-lg mb-2">{pkg.name}</h3>
                <p className="text-[#10B981] font-semibold text-sm mb-2">{getOutcome(pkg.kva)}</p>
                <p className="text-[#64748B] text-sm mb-4 leading-relaxed">{pkg.description}</p>
                <p className="font-heading font-extrabold text-[#F59E0B] text-2xl mb-5">{formatNairaFull(pkg.price)}</p>
                <a
                  href={`${waLink}&text=${encodeURIComponent(`Hi, I'm interested in your ${pkg.name} (${pkg.kva}kVA) package.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-[#25D366] text-white text-center py-3.5 rounded-full font-heading font-bold text-sm hover:bg-[#22c55e] transition-colors"
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
            {/* Stat row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: builder.reviewCount.toString(), label: 'Verified reviews', icon: '⭐' },
                { value: builder.rating.toFixed(1), label: 'Average rating', icon: '📊' },
                { value: `${builder.packages.length}`, label: 'Package options', icon: '📦' },
              ].map(s => (
                <div key={s.label} className="bg-[#F8FAFC] rounded-2xl p-4 text-center border border-[#E2E8F0]">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="font-heading font-extrabold text-[#0F172A] text-2xl">{s.value}</div>
                  <div className="text-[#64748B] text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            <div>
              <h2 className="font-heading font-bold text-[#0F172A] text-xl mb-3">About</h2>
              <p className="text-[#64748B] text-base leading-relaxed">{builder.bio}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-[#64748B]" />
                <span className="text-[#0F172A] font-semibold">{builder.location}, {builder.state}</span>
              </div>
            </div>

            <div>
              <h2 className="font-heading font-bold text-[#0F172A] text-xl mb-4">Services</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {builder.services.map(s => {
                  const d = SERVICE_MAP[s] || { icon: '✅', desc: '' };
                  return (
                    <div key={s} className="flex items-start gap-3 p-4 bg-[#FAFAF7] rounded-xl border border-[#E2E8F0] hover:border-[#F59E0B] transition-colors">
                      <span className="text-xl">{d.icon}</span>
                      <div>
                        <div className="font-heading font-semibold text-[#0F172A] text-sm">{s}</div>
                        <div className="text-[#64748B] text-xs mt-0.5">{d.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="font-heading font-bold text-[#0F172A] text-xl mb-4">Specialties</h2>
              <div className="flex flex-wrap gap-2">
                {builder.specialties.map(s => (
                  <span key={s} className="px-4 py-2 bg-[#FEF3C7] border border-[#FDE68A] text-[#0F172A] text-sm rounded-full font-medium">
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
            <h2 className="font-heading font-bold text-[#0F172A] text-xl mb-4">Project Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="aspect-square bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-center card-hover">
                  <p className="text-[#94A3B8] text-sm font-medium text-center px-4">Photo coming soon</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Reviews ── */}
        {activeTab === 'Reviews' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="font-heading font-bold text-[#0F172A] text-xl">
                Reviews
              </h2>
              <span className="bg-[#F59E0B] text-[#0F172A] text-sm font-heading font-bold px-3 py-1 rounded-full">
                {builder.reviewCount}
              </span>
            </div>
            {builder.reviews.map((review, i) => (
              <div key={i} className="rounded-2xl border border-[#E2E8F0] p-6 bg-white card-hover">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-heading font-semibold text-[#0F172A] text-sm">{review.author}</p>
                    <p className="text-[#94A3B8] text-xs mt-0.5">{review.location} · {review.date}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'text-[#F59E0B] fill-current' : 'text-[#E2E8F0]'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-[#64748B] text-base leading-relaxed">&ldquo;{review.body}&rdquo;</p>
                {review.verified && (
                  <div className="flex items-center gap-1 mt-3 text-[#10B981] text-xs font-medium">
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
