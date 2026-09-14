import Image from 'next/image';
import type { Brand } from '@/lib/brands';

/**
 * Visual mark for a brand or vendor.
 *
 * We do NOT ship manufacturer logo files: they are trademarks, and we have no
 * licence to redistribute them. Until a brand supplies artwork (or we get
 * written permission), every brand gets a generated monogram — deterministic
 * colour from the slug, so the same brand always looks the same.
 *
 * To use a real logo later: drop the file at `public/brands/<slug>.svg` (or
 * .png) and set `logo: "/brands/<slug>.svg"` on the brand in lib/brands.ts.
 * Nothing else needs to change.
 */

const PALETTE = [
  { bg: '#FEF3C7', fg: '#B45309' },
  { bg: '#DBEAFE', fg: '#1D4ED8' },
  { bg: '#DCFCE7', fg: '#15803D' },
  { bg: '#FCE7F3', fg: '#BE185D' },
  { bg: '#E0E7FF', fg: '#4338CA' },
  { bg: '#FFE4E6', fg: '#BE123C' },
  { bg: '#CCFBF1', fg: '#0F766E' },
  { bg: '#F1F5F9', fg: '#334155' },
];

function paletteFor(slug: string) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/** "JA Solar" → "JA", "Felicity Solar" → "FS", "Zit Nigeria" → "ZN" */
function initials(name: string): string {
  const words = name.replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

interface Props {
  brand: Pick<Brand, 'slug' | 'name'> & { logo?: string };
  size?: number;
  className?: string;
}

export default function BrandMark({ brand, size = 40, className = '' }: Props) {
  const { bg, fg } = paletteFor(brand.slug);
  const px = `${size}px`;

  if (brand.logo) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-xl bg-white border border-slate-100 overflow-hidden flex-shrink-0 ${className}`}
        style={{ width: px, height: px }}
      >
        <Image src={brand.logo} alt="" width={size} height={size} className="object-contain w-full h-full p-1" />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center rounded-xl font-heading font-extrabold flex-shrink-0 ${className}`}
      style={{ width: px, height: px, backgroundColor: bg, color: fg, fontSize: size * 0.38 }}
    >
      {initials(brand.name)}
    </span>
  );
}
