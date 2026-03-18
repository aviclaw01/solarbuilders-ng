'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { BUILDERS, formatNaira } from '@/lib/mock-data';
import { Star, MapPin, CheckCircle } from 'lucide-react';

const LOCATIONS = ['All Nigeria', 'Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Enugu'];
const SERVICE_TYPES = ['Full Installation', 'Commercial', 'Residential', 'Off-grid', 'Hybrid', 'Repair'];

export default function MarketplaceClient() {
  const [locationFilter, setLocationFilter] = useState('All Nigeria');
  const [serviceFilter, setServiceFilter] = useState<string[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const filtered = BUILDERS.filter(b => {
    if (locationFilter !== 'All Nigeria' && b.state !== locationFilter) return false;
    if (verifiedOnly && !b.verified) return false;
    if (serviceFilter.length > 0 && !serviceFilter.some(s => b.services.includes(s))) return false;
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

  const uniqueStates = new Set(BUILDERS.map(b => b.state)).size;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Page header */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-heading font-extrabold text-[#0A0F1E] text-4xl md:text-5xl mb-3">
            Find Solar Installers in Nigeria
          </h1>
          <p className="text-[#64748B] text-lg">
            Browse {BUILDERS.length} verified solar builders across {uniqueStates} states
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-4 py-4 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Location pills */}
            <div className="flex flex-wrap gap-2">
              {LOCATIONS.map(loc => (
                <button
                  key={loc}
                  onClick={() => setLocationFilter(loc)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    locationFilter === loc
                      ? 'bg-[#0A0F1E] text-white'
                      : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#0A0F1E] hover:text-[#0A0F1E]'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
            <div className="h-6 w-px bg-[#E2E8F0] hidden md:block mx-1"></div>
            {/* Verified toggle */}
            <button
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                verifiedOnly
                  ? 'bg-[#059669] text-white'
                  : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#059669] hover:text-[#059669]'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Verified Only
            </button>
          </div>
          {/* Service filters */}
          <div className="flex flex-wrap gap-2 mt-2">
            {SERVICE_TYPES.map(s => (
              <button
                key={s}
                onClick={() => toggleService(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  serviceFilter.includes(s)
                    ? 'bg-[#F59E0B] text-[#0A0F1E]'
                    : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#F59E0B]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {sorted.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="font-heading font-bold text-[#0A0F1E] text-2xl mb-2">No builders found</h3>
            <p className="text-[#64748B] mb-6">Try adjusting your filters</p>
            <button
              onClick={() => { setLocationFilter('All Nigeria'); setServiceFilter([]); setVerifiedOnly(false); }}
              className="bg-[#F59E0B] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-semibold hover:bg-[#D97706] transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <p className="text-[#64748B] text-sm mb-6">{sorted.length} builder{sorted.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sorted.map(builder => {
                const waLink = `https://wa.me/${builder.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hi, I found you on SolarBuilders.ng. I\'m interested in a solar installation.')}`;
                return (
                  <div key={builder.id} className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:border-[#F59E0B] hover:shadow-lg transition-all duration-200">
                    <div className="aspect-video overflow-hidden bg-[#F8FAFC] relative">
                      <Image
                        src={builder.coverImage}
                        alt={`${builder.name} solar installation`}
                        width={400}
                        height={225}
                        className="w-full h-full object-cover"
                      />
                      {builder.verified && (
                        <div className="absolute top-3 right-3">
                          <span className="inline-flex items-center gap-1 bg-[#059669] text-white text-xs font-heading font-semibold px-2.5 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h2 className="font-heading font-bold text-[#0A0F1E] text-lg mb-1">{builder.name}</h2>
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
                        <span className="font-semibold text-sm text-[#0A0F1E]">{builder.rating}</span>
                        <span className="text-[#94A3B8] text-sm">({builder.reviewCount})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {builder.services.slice(0, 3).map(s => (
                          <span key={s} className="text-xs px-2 py-1 bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] rounded-full">{s}</span>
                        ))}
                      </div>
                      <p className="text-[#F59E0B] font-heading font-bold text-base mb-4">
                        From {formatNaira(builder.startingPrice)}
                      </p>
                      <div className="flex gap-2">
                        <Link href={`/builders/${builder.slug}`}
                          className="flex-1 border-2 border-[#0A0F1E] text-[#0A0F1E] text-sm font-heading font-semibold py-2.5 rounded-full text-center hover:bg-[#0A0F1E] hover:text-white transition-colors">
                          View Profile
                        </Link>
                        <a href={waLink} target="_blank" rel="noopener noreferrer"
                          className="flex-1 bg-[#25D366] text-white text-sm font-heading font-semibold py-2.5 rounded-full text-center hover:bg-[#22c55e] transition-colors">
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
        <div className="mt-16 bg-[#FEF3C7] rounded-2xl p-8 md:p-12 text-center">
          <h3 className="font-heading font-extrabold text-[#0A0F1E] text-2xl md:text-3xl mb-3">
            Not sure what size system you need?
          </h3>
          <p className="text-[#64748B] mb-6">Use our free calculator — takes 60 seconds.</p>
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
