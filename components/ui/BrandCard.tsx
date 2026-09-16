import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';
import { type Brand, CATEGORY_LABEL, TIER_LABEL, headlineUnitPrice } from '@/lib/brands';
import BrandMark from './BrandMark';

const TIER_STYLE: Record<string, string> = {
  budget: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  mid: 'bg-amber-50 text-amber-700 border-amber-200',
  premium: 'bg-slate-900 text-white border-slate-900',
};

export default function BrandCard({ brand }: { brand: Brand }) {
  const unit = headlineUnitPrice(brand);
  return (
    <Link
      href={`/brands/${brand.slug}`}
      className="group bg-white rounded-2xl border border-slate-100 hover:border-amber-400 p-5 flex flex-col transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <BrandMark brand={brand} size={36} />
          <h3 className="font-heading font-extrabold text-slate-900 text-lg leading-tight group-hover:text-amber-600 transition-colors">
            {brand.name}
          </h3>
        </div>
        {brand.kind === 'manufacturer' && brand.tier ? (
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border whitespace-nowrap ${TIER_STYLE[brand.tier]}`}>
            {TIER_LABEL[brand.tier]}
          </span>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border bg-sky-50 text-sky-700 border-sky-200 whitespace-nowrap">
            Vendor
          </span>
        )}
      </div>
      <p className="text-slate-500 text-sm leading-snug mb-3 flex-1">{brand.tagline}</p>
      <p className="text-slate-500 text-xs flex items-center gap-1 mb-3">
        <MapPin className="w-3 h-3" /> {brand.origin}
      </p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {brand.categories.map((c) => (
          <span key={c} className="text-[11px] bg-slate-50 text-slate-600 border border-slate-100 px-2 py-0.5 rounded-full">
            {CATEGORY_LABEL[c]}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between mt-auto">
        <span className="font-heading font-bold text-amber-700 text-sm">
          {unit ??
            (brand.carries?.length
              ? `Stocks ${brand.carries.slice(0, 3).map((s) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())).join(', ')}${brand.carries.length > 3 ? ' +' : ''}`
              : brand.pricesPublic ? 'Prices online' : 'Quote only')}
        </span>
        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
      </div>
    </Link>
  );
}
