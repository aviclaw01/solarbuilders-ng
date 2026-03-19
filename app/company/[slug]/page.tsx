import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import { BUILDERS, getBuilderBySlug } from '@/lib/mock-data';
import { CheckCircle } from 'lucide-react';
import CompanyClient from './CompanyClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return BUILDERS.map(b => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const builder = getBuilderBySlug(slug);
  if (!builder) return { title: 'Company Not Found' };

  return {
    title: `${builder.name} — Solar Installer in ${builder.state} | SolarBuilders.ng`,
    description: builder.bio,
    openGraph: {
      title: `${builder.name} — Solar Installer in ${builder.state}`,
      description: builder.bio,
      url: `https://solarbuilders.ng/company/${builder.slug}`,
      type: 'website',
    },
    alternates: { canonical: `https://solarbuilders.ng/company/${builder.slug}` },
  };
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params;
  const builder = getBuilderBySlug(slug);
  if (!builder) return notFound();

  const waLink = `https://wa.me/${builder.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I found you on SolarBuilders.ng. I'm interested in a solar installation. Can you help?`)}`;

  return (
    <div className="min-h-screen bg-white">
      {/* Branded header — full width cover */}
      <div className="relative h-[300px] overflow-hidden bg-slate-900">
        <Image
          src={builder.coverImage}
          alt={`${builder.name} — solar installer in ${builder.state}`}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="font-heading font-extrabold text-white text-3xl md:text-5xl">{builder.name}</h1>
              {builder.verified && (
                <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-xs font-heading font-semibold px-3 py-1.5 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Verified
                </span>
              )}
            </div>
            {/* Stat pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-white/15 backdrop-blur-sm text-white text-sm font-medium px-3 py-1.5 rounded-full">
                {builder.jobsCompleted}+ Jobs
              </span>
              <span className="bg-white/15 backdrop-blur-sm text-white text-sm font-medium px-3 py-1.5 rounded-full">
                ★ {builder.rating}
              </span>
              <span className="bg-white/15 backdrop-blur-sm text-white text-sm font-medium px-3 py-1.5 rounded-full">
                Since {builder.yearFounded}
              </span>
              <span className="bg-white/15 backdrop-blur-sm text-white text-sm font-medium px-3 py-1.5 rounded-full">
                {builder.responseTime} response
              </span>
            </div>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-full font-heading font-bold text-sm hover:bg-[#22c55e] transition-colors"
            >
              💬 Contact on WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Tabs + content */}
      <CompanyClient builder={builder} />

      {/* Sticky WhatsApp CTA — mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 md:hidden z-40">
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-[#25D366] text-white text-center py-4 rounded-full font-heading font-bold text-base hover:bg-[#22c55e] transition-colors"
        >
          💬 Contact on WhatsApp
        </a>
      </div>

      {/* Powered by badge */}
      <div className="text-slate-400 text-xs text-center py-4">
        Powered by SolarBuilders.ng
      </div>
    </div>
  );
}
