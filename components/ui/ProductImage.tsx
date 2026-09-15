import Image from 'next/image';
import type { Product, ProductCategory } from '@/lib/brands';
import attribution from '@/public/products/attribution.json';

/**
 * Visual for a catalogue product.
 *
 * We do NOT hotlink vendor product photos. They are copyrighted, they are
 * served from sites with bot protection (Zit already 403s a plain request), and
 * a shop whose images break at random is worse than one with none. So we fetch
 * once, convert to WebP and serve the result from our own domain:
 * `node scripts/fetch-product-images.ts` writes /public/products/*.webp and
 * records where every file came from in public/products/manifest.json.
 *
 * Those are plain static files under /public, so next/image needs no
 * `remotePatterns` entry for them — remotePatterns is only for images loaded
 * from another origin, and we deliberately have none.
 *
 * Products we could not source a photo for keep the drawn category
 * illustration, which loads instantly and costs nothing.
 */

/** path → the site we took the photo from, written by the fetch script. */
const SOURCE_HOST: Record<string, string> = attribution;

function sourceHost(image?: string, imageSource?: string): string | undefined {
  if (!image) return undefined;
  if (SOURCE_HOST[image]) return SOURCE_HOST[image];
  if (!imageSource) return undefined;
  try {
    return new URL(imageSource).host.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

const TINT: Record<ProductCategory, { bg: string; ink: string; accent: string }> = {
  inverter: { bg: '#F1F5F9', ink: '#334155', accent: '#F59E0B' },
  battery: { bg: '#ECFDF5', ink: '#166534', accent: '#10B981' },
  panel: { bg: '#EFF6FF', ink: '#1E3A8A', accent: '#3B82F6' },
  controller: { bg: '#FEF3C7', ink: '#92400E', accent: '#F59E0B' },
  package: { bg: '#F5F3FF', ink: '#4338CA', accent: '#8B5CF6' },
};

function Illustration({ category }: { category: ProductCategory }) {
  const { ink, accent } = TINT[category];

  if (category === 'panel') {
    return (
      <svg viewBox="0 0 120 80" fill="none" className="w-full h-full" aria-hidden="true">
        <rect x="14" y="12" width="92" height="52" rx="3" fill="white" stroke={ink} strokeWidth="2.5" />
        {[0, 1, 2].map((r) =>
          [0, 1, 2, 3].map((c) => (
            <rect
              key={`${r}-${c}`}
              x={19 + c * 22}
              y={17 + r * 16}
              width="18"
              height="12"
              rx="1"
              fill={accent}
              opacity={0.18 + (r + c) * 0.045}
            />
          )),
        )}
        <path d="M60 64v8M44 72h32" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (category === 'battery') {
    return (
      <svg viewBox="0 0 120 80" fill="none" className="w-full h-full" aria-hidden="true">
        <rect x="24" y="16" width="72" height="48" rx="6" fill="white" stroke={ink} strokeWidth="2.5" />
        <rect x="34" y="12" width="12" height="6" rx="2" fill={ink} />
        <rect x="74" y="12" width="12" height="6" rx="2" fill={ink} />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={33} y={27 + i * 8} width={54} height="4" rx="2" fill={accent} opacity={i === 3 ? 0.25 : 0.85} />
        ))}
        <circle cx="86" cy="57" r="3" fill={accent} />
      </svg>
    );
  }

  if (category === 'controller') {
    return (
      <svg viewBox="0 0 120 80" fill="none" className="w-full h-full" aria-hidden="true">
        <rect x="32" y="14" width="56" height="52" rx="6" fill="white" stroke={ink} strokeWidth="2.5" />
        <circle cx="60" cy="34" r="11" fill="none" stroke={accent} strokeWidth="3" />
        <path d="M60 27v7l5 4" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
        <rect x="42" y="52" width="36" height="4" rx="2" fill={accent} opacity="0.5" />
      </svg>
    );
  }

  if (category === 'package') {
    return (
      <svg viewBox="0 0 120 80" fill="none" className="w-full h-full" aria-hidden="true">
        <rect x="10" y="14" width="44" height="26" rx="2" fill="white" stroke={ink} strokeWidth="2.5" />
        {[0, 1].map((r) =>
          [0, 1, 2].map((c) => (
            <rect key={`${r}-${c}`} x={14 + c * 14} y={18 + r * 10} width="10" height="7" rx="1" fill={accent} opacity={0.3 + r * 0.2} />
          )),
        )}
        <rect x="64" y="14" width="30" height="30" rx="5" fill="white" stroke={ink} strokeWidth="2.5" />
        <rect x="71" y="22" width="16" height="3" rx="1.5" fill={accent} />
        <rect x="71" y="29" width="10" height="3" rx="1.5" fill={accent} opacity="0.5" />
        <rect x="30" y="48" width="58" height="20" rx="4" fill="white" stroke={ink} strokeWidth="2.5" />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={37 + i * 17} y={54} width="11" height="8" rx="1.5" fill={accent} opacity="0.7" />
        ))}
      </svg>
    );
  }

  // inverter
  return (
    <svg viewBox="0 0 120 80" fill="none" className="w-full h-full" aria-hidden="true">
      <rect x="28" y="10" width="64" height="60" rx="7" fill="white" stroke={ink} strokeWidth="2.5" />
      <rect x="37" y="19" width="46" height="18" rx="3" fill={ink} opacity="0.08" />
      <path d="M57 22l-6 9h7l-4 7 10-10h-7l4-6z" fill={accent} />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={37} y={45 + i * 7} width={46} height="3" rx="1.5" fill={ink} opacity={0.18} />
      ))}
      <circle cx="78" cy="62" r="3" fill={accent} />
    </svg>
  );
}

/** Only the fields the visual needs, so callers can pass a lean shop item. */
export type ProductImageInput = Pick<Product, 'category' | 'model' | 'spec'> & {
  image?: string;
  /** optional — the host is otherwise looked up from the fetch manifest */
  imageSource?: string;
};

interface Props {
  product: ProductImageInput;
  className?: string;
}

export default function ProductImage({ product, className = '' }: Props) {
  const tint = TINT[product.category] ?? TINT.inverter;
  const host = sourceHost(product.image, product.imageSource);

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-xl ${className}`}
      style={{ backgroundColor: tint.bg }}
    >
      {product.image ? (
        <>
          <Image
            src={product.image}
            alt={`${product.model} — ${product.spec}`}
            fill
            sizes="(max-width: 640px) 100vw, 320px"
            className="object-contain p-3"
            // Manufacturer / vendor product shot. Credited on hover rather than
            // in a caption — a card is for reading the price, not the credits.
            title={host ? `${product.model} — manufacturer/vendor photo via ${host}` : undefined}
          />
          {host && <span className="sr-only">Product photo via {host}</span>}
        </>
      ) : (
        <div className="w-full h-full p-3">
          <Illustration category={product.category} />
        </div>
      )}
    </div>
  );
}
