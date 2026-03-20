'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { BUILDERS, formatNaira } from '@/lib/mock-data';
import { Star, MapPin, CheckCircle, SlidersHorizontal, X } from 'lucide-react';

const LOCATIONS = ['All Nigeria', 'Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Enugu'];
const SERVICE_TYPES = ['Full Installation', 'Commercial', 'Residential', 'Off-grid', 'Hybrid', 'Repair'];
const BUDGET_OPTIONS = ['Any Budget', 'Under ₦500k', '₦500k–₦1M', 'Above ₦1M'];

export default function MarketplaceClient() {
  const [locationFilter, setLocationFilter] = useState('All Nigeria');
  const [serviceFilter, setServiceFilter] = useState<string[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [budgetFilter, setBudgetFilter] = useState('Any Budget');
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySent, setNotifySent] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const filtered = BUILDERS.filter(b => {
    if (locationFilter !== 'All Nigeria' && b.state !== locationFilter) return false;
    if (verifiedOnly && !b.verified) return false;
    if (serviceFilter.length > 0 && !serviceFilter.some(s => b.services.includes(s))) return false;
    if (budgetFilter === 'Under ₦500k' && !b.packages.some(p => p.price < 500000)) return false;
    if (budgetFilter === '₦500k–₦1M' && !b.packages.some(p => p.price >= 500000 && p.price <= 1000000)) return false;
    if (budgetFilter === 'Above ₦1M' && !b.packages.some(p => p.price > 1000000)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.verified && !b.verified) return -1;
    if (!a.verified && b.verified) return 1;
    return b.rating - a.rating;
  });

  const toggleService = (service: string) => {
    setServiceFilter(prev =>
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

  const clearFilters = () => {
    setLocationFilter('All Nigeria');
    setServiceFilter([]);
    setVerifiedOnly(false);
    setBudgetFilter('Any Budget');
  };

  const activeFilterCount = (locationFilter !== 'All Nigeria' ? 1 : 0)
    + serviceFilter.length
    + (verifiedOnly ? 1 : 0)
    + (budgetFilter !== 'Any Budget' ? 1 : 0);

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <Navbar />

      {/* Page header */}
      <div className="bg-[#0F172A] px-4 py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-heading font-extrabold text-white text-4xl md:text-5xl mb-3">
            Find Solar Installers in Nigeria
          </h1>
          <p className="text-[#94A3B8] text-lg">Verified builders · Direct WhatsApp contact · No commission</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-3 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto">
          {/* Location pills + expand toggle */}
          <div className="flex flex-wrap gap-2 items-center">
            {LOCATIONS.map(loc => (
              <button
                key={loc}
                onClick={() => setLocationFilter(loc)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  locationFilter === loc
                    ? 'bg-[#0F172A] text-white scale-105'
                    : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:border-[#0F172A] hover:text-[#0F172A]'
                }`}
              >
                {loc}
              </button>
            ))}
            <div className="h-6 w-px bg-[#E2E8F0] hidden md:block mx-1" />
            <button
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                verifiedOnly
                  ? 'bg-[#10B981] text-white scale-105'
                  : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:border-[#10B981] hover:text-[#10B981]'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Verified Only
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                  filtersExpanded || activeFilterCount > 0
                    ? 'bg-[#F59E0B] border-[#F59E0B] text-[#0F172A]'
                    : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#0F172A]'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </button>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-[#64748B] hover:text-red-500 transition-colors">
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Expanded filters */}
          <div className={`overflow-hidden transition-all duration-300 ${filtersExpanded ? 'max-h-40 mt-3' : 'max-h-0'}`}>
            <div className="space-y-2 pb-2">
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-[#94A3B8] font-medium self-center">Service:</span>
                {SERVICE_TYPES.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleService(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      serviceFilter.includes(s)
                        ? 'bg-[#F59E0B] text-[#0F172A] scale-105'
                        : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:border-[#F59E0B]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-[#94A3B8] font-medium self-center">Budget:</span>
                {BUDGET_OPTIONS.map(b => (
                  <button
                    key={b}
                    onClick={() => setBudgetFilter(b)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      budgetFilter === b
                        ? 'bg-[#0F172A] text-[#F59E0B] scale-105'
                        : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:border-[#0F172A]'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {sorted.length === 0 ? (
          <div className="text-center py-20 max-w-md mx-auto">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="font-heading font-bold text-[#0F172A] text-2xl mb-2">
              No builders match this filter yet
            </h3>
            <p className="text-[#64748B] mb-6">We&apos;re expanding fast. Get notified when a builder joins your area.</p>
            {notifySent ? (
              <p className="text-[#10B981] font-semibold mb-4">Got it! We&apos;ll notify you. ✓</p>
            ) : (
              <div className="flex gap-2 mb-6">
                <input
                  type="email"
                  value={notifyEmail}
                  onChange={e => setNotifyEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 border border-[#E2E8F0] rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[#F59E0B] transition-colors"
                />
                <button
                  onClick={async () => {
                    if (!notifyEmail) return;
                    await fetch('/api/notify-me', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: notifyEmail, location: locationFilter, budget: budgetFilter }),
                    });
                    setNotifySent(true);
                  }}
                  className="bg-[#F59E0B] text-[#0F172A] px-5 py-2.5 rounded-full font-heading font-semibold text-sm hover:bg-[#D97706] transition-colors whitespace-nowrap btn-primary"
                >
                  Notify Me
                </button>
              </div>
            )}
            <button onClick={clearFilters} className="text-[#64748B] text-sm underline hover:text-[#0F172A] transition-colors">
              Browse all builders
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-[#64748B] text-sm">
                <span className="font-semibold text-[#0F172A]">{sorted.length}</span> verified builder{sorted.length !== 1 ? 's' : ''} · Sorted by rating
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sorted.map((builder) => {
                const waLink = `https://wa.me/${builder.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${builder.name}, I found you on SolarBuilders.ng. I'm interested in a solar installation.`)}`;
                return (
                  <div
                    key={builder.id}
                    className="group bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden card-hover"
                  >
                    <div className="aspect-video overflow-hidden bg-[#F8FAFC] relative">
                      <Image
                        src={builder.coverImage}
                        alt={`${builder.name} solar installation`}
                        width={400}
                        height={225}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {builder.verified && (
                        <div className="absolute top-3 right-3">
                          <span className="inline-flex items-center gap-1 bg-[#10B981] text-white text-xs font-heading font-semibold px-2.5 py-1 rounded-full shadow-sm">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {builder.packages.map(pkg => (
                          <span key={pkg.kva} className="inline-flex items-center gap-1 bg-[#0F172A] text-[#F59E0B] text-xs font-heading font-extrabold px-2.5 py-1.5 rounded-lg">
                            ⚡ {pkg.kva}kVA
                          </span>
                        ))}
                      </div>
                      <h2 className="font-heading font-bold text-[#0F172A] text-lg mb-1 group-hover:text-[#F59E0B] transition-colors duration-200">
                        {builder.name}
                      </h2>
                      <div className="flex items-center gap-1 text-[#64748B] text-sm mb-2">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{builder.location}, {builder.state}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-3">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(builder.rating) ? 'text-[#F59E0B] fill-current' : 'text-[#E2E8F0]'}`} />
                          ))}
                        </div>
                        <span className="font-semibold text-sm text-[#0F172A]">{builder.rating}</span>
                        <span className="text-[#94A3B8] text-sm">({builder.reviewCount})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {builder.services.slice(0, 3).map(s => (
                          <span key={s} className="text-xs px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] rounded-full">{s}</span>
                        ))}
                      </div>
                      <p className="text-[#F59E0B] font-heading font-bold text-base mb-4">
                        From {formatNaira(builder.startingPrice)}
                      </p>
                      <div className="flex gap-2">
                        <Link
                          href={`/company/${builder.slug}`}
                          className="flex-1 border-2 border-[#0F172A] text-[#0F172A] text-sm font-heading font-semibold py-2.5 rounded-full text-center hover:bg-[#0F172A] hover:text-white transition-all duration-200"
                        >
                          View Profile
                        </Link>
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-[#25D366] text-white text-sm font-heading font-semibold py-2.5 rounded-full text-center hover:bg-[#22c55e] transition-colors"
                        >
                          💬 WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Calculator CTA */}
        <div className="mt-16 bg-[#0F172A] rounded-2xl p-8 md:p-12 text-center">
          <h3 className="font-heading font-extrabold text-white text-2xl md:text-3xl mb-3">
            Not sure what size system you need?
          </h3>
          <p className="text-[#94A3B8] mb-6">Use our free calculator — takes 60 seconds. Know what you need before talking to anyone.</p>
          <Link
            href="/calculator"
            className="inline-flex items-center gap-2 bg-[#F59E0B] text-[#0F172A] px-8 py-4 rounded-full font-heading font-bold text-base btn-primary hover:bg-[#D97706]"
          >
            Calculate My System →
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
