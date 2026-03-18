'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { BUILDERS, formatNaira } from '@/lib/mock-data';
import { Star, MapPin, CheckCircle, Filter, Zap, X } from 'lucide-react';

const LOCATIONS = ['All Nigeria', 'Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Enugu'];
const SERVICE_TYPES = ['Full Installation', 'Commercial', 'Residential', 'Off-grid', 'Hybrid', 'Repair'];

function VerifiedBadge({ small = false }) {
  return (
    <span className={`inline-flex items-center gap-1 bg-[#10B981] text-white font-semibold rounded-full ${small ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}>
      <CheckCircle className={small ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      {small ? 'Verified' : 'Nexprove Verified'}
    </span>
  );
}

export default function MarketplacePage() {
  const [locationFilter, setLocationFilter] = useState('All Nigeria');
  const [serviceFilter, setServiceFilter] = useState<string[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');

  const filtered = BUILDERS.filter(b => {
    if (locationFilter !== 'All Nigeria' && b.state !== locationFilter) return false;
    if (verifiedOnly && !b.verified) return false;
    if (serviceFilter.length > 0 && !serviceFilter.some(s => b.services.includes(s))) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'price_low') return a.startingPrice - b.startingPrice;
    if (sortBy === 'price_high') return b.startingPrice - a.startingPrice;
    // recommended: verified first, then rating
    if (a.verified && !b.verified) return -1;
    if (!a.verified && b.verified) return 1;
    return b.rating - a.rating;
  });

  const toggleService = (service: string) => {
    setServiceFilter(prev =>
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="text-2xl md:text-3xl font-bold text-[#0F172A] mb-2">
              Verified solar builders near you
            </h1>
            <p className="text-[#64748B] text-sm">
              {sorted.length} builder{sorted.length !== 1 ? 's' : ''} found
              {locationFilter !== 'All Nigeria' ? ` in ${locationFilter}` : ' across Nigeria'}
            </p>
          </div>
          <button
            onClick={() => setShowFilterDrawer(true)}
            className="md:hidden flex items-center gap-2 bg-white border border-[#E2E8F0] px-4 py-2.5 rounded-xl text-[#0F172A] font-semibold text-sm shadow-sm"
          >
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>

        <div className="md:grid md:grid-cols-4 md:gap-6">
          {/* Sidebar filters — Desktop */}
          <aside className="hidden md:block md:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-5 sticky top-20">
              <h3 style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="font-bold text-[#0F172A] mb-4">Filters</h3>

              {/* Location */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-3">Location</p>
                <div className="flex flex-wrap gap-2">
                  {LOCATIONS.map(loc => (
                    <button
                      key={loc}
                      onClick={() => setLocationFilter(loc)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                        locationFilter === loc
                          ? 'bg-[#0F172A] text-white'
                          : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service type */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-3">Service Type</p>
                <div className="space-y-2">
                  {SERVICE_TYPES.map(service => (
                    <label key={service} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={serviceFilter.includes(service)}
                        onChange={() => toggleService(service)}
                        className="accent-[#F59E0B] w-4 h-4"
                      />
                      <span className="text-sm text-[#0F172A]">{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Verified only */}
              <div className="mb-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={() => setVerifiedOnly(!verifiedOnly)}
                    className="accent-[#10B981] w-4 h-4"
                  />
                  <span className="text-sm font-semibold text-[#0F172A]">Verified builders only</span>
                </label>
              </div>

              <button
                onClick={() => { setLocationFilter('All Nigeria'); setServiceFilter([]); setVerifiedOnly(false); }}
                className="text-sm text-[#64748B] hover:text-[#0F172A] underline"
              >
                Reset filters
              </button>
            </div>
          </aside>

          {/* Main content */}
          <main className="md:col-span-3">
            {/* Sort bar */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto hide-scrollbar pb-1">
              {[
                { value: 'recommended', label: 'Recommended' },
                { value: 'rating', label: 'Highest Rated' },
                { value: 'price_low', label: 'Price: Low' },
                { value: 'price_high', label: 'Price: High' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`flex-shrink-0 text-sm px-4 py-2 rounded-full font-medium transition-colors ${
                    sortBy === opt.value
                      ? 'bg-[#0F172A] text-white'
                      : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Builder cards */}
            {sorted.length > 0 ? (
              <div className="space-y-4">
                {sorted.map(builder => {
                  const waLink = `https://wa.me/${builder.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I found you on SolarBuilders.ng. I'm interested in a solar installation.`)}`;

                  return (
                    <div key={builder.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                      <div className="md:flex">
                        {/* Photo */}
                        <div className="md:w-64 md:flex-shrink-0">
                          <img
                            src={builder.coverImage}
                            alt={builder.name}
                            className="w-full h-48 md:h-full object-cover"
                          />
                        </div>
                        {/* Content */}
                        <div className="p-5 flex-1">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              {builder.verified && <div className="mb-2"><VerifiedBadge /></div>}
                              <h3 style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="font-bold text-[#0F172A] text-xl">{builder.name}</h3>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-[#64748B] text-sm mb-2">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{builder.location}, {builder.state}</span>
                          </div>

                          <div className="flex items-center gap-1 mb-3">
                            <Star className="w-4 h-4 text-[#F59E0B] fill-current" />
                            <span className="font-semibold text-[#0F172A] text-sm">{builder.rating}</span>
                            <span className="text-[#64748B] text-sm">({builder.reviewCount} reviews)</span>
                          </div>

                          <p className="text-[#F59E0B] font-bold text-lg mb-3">
                            From {formatNaira(builder.startingPrice)}
                          </p>

                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {builder.services.slice(0, 3).map(service => (
                              <span key={service} className="bg-[#F1F5F9] text-[#64748B] text-xs font-medium px-2.5 py-1 rounded-full">
                                {service}
                              </span>
                            ))}
                          </div>

                          <div className="flex gap-2">
                            <Link href={`/builders/${builder.slug}`}
                              className="flex-1 border border-[#0F172A] text-[#0F172A] text-sm font-semibold py-2.5 rounded-lg text-center hover:bg-[#0F172A] hover:text-white transition-colors">
                              View Profile
                            </Link>
                            <a href={waLink} target="_blank" rel="noopener noreferrer"
                              className="flex-1 bg-[#25D366] text-white text-sm font-semibold py-2.5 rounded-lg text-center hover:bg-[#22c55e] transition-colors flex items-center justify-center gap-1">
                              💬 Contact on WhatsApp
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">⚡</div>
                <h3 style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="text-2xl font-bold text-[#0F172A] mb-3">No verified builders in this area yet</h3>
                <p className="text-[#64748B] mb-6">We&apos;re still growing! Try expanding your location filter.</p>
                <button
                  onClick={() => { setLocationFilter('All Nigeria'); setServiceFilter([]); setVerifiedOnly(false); }}
                  className="bg-[#F59E0B] text-[#0F172A] px-6 py-3 rounded-lg font-bold hover:bg-[#D97706] transition-colors"
                  style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
                >
                  Browse All Nigeria
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showFilterDrawer && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={() => setShowFilterDrawer(false)}>
          <div className="bg-white rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="font-bold text-[#0F172A] text-xl">Filters</h3>
              <button onClick={() => setShowFilterDrawer(false)} className="text-[#64748B]">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-5">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-3">Location</p>
              <div className="flex flex-wrap gap-2">
                {LOCATIONS.map(loc => (
                  <button key={loc} onClick={() => setLocationFilter(loc)}
                    className={`text-sm px-3 py-2 rounded-full font-medium transition-colors ${locationFilter === loc ? 'bg-[#0F172A] text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={verifiedOnly} onChange={() => setVerifiedOnly(!verifiedOnly)} className="accent-[#10B981] w-4 h-4" />
                <span className="font-semibold text-[#0F172A]">Verified builders only</span>
              </label>
            </div>

            <button
              onClick={() => setShowFilterDrawer(false)}
              className="w-full bg-[#F59E0B] text-[#0F172A] py-4 rounded-xl font-bold text-lg"
              style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
            >
              Show {sorted.length} Results →
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
