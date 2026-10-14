'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Info, Minus, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import ProductImage from '@/components/ui/ProductImage';
import { CATEGORY_LABEL, TIER_LABEL, type BrandTier, type ProductCategory } from '@/lib/brands';
import { addLine, readCart, writeCart } from '@/lib/cart';
import { track } from '@/lib/track';
import { formatNaira } from '@/lib/quote';

/**
 * The shop listing.
 *
 * This is a price list with an order pad attached, not a checkout. Adding a
 * product puts it on an order request; we confirm today's price with the
 * distributor before anybody pays anything. Nothing here takes money and
 * nothing here promises stock — we don't hold stock, so we don't claim to.
 *
 * Vendor source URLs, vendor names and contact details are deliberately NOT
 * rendered: we buy on the customer's behalf, and handing over the seller is
 * handing away the order.
 */

export type SizeUnit = 'kVA' | 'kWh' | 'W';

/** Serialisable product row — built on the server, safe to send to the browser. */
export interface ShopItem {
  id: string;
  brandSlug: string;
  brandName: string;
  brandLogo?: string;
  brandTier?: BrandTier;
  category: ProductCategory;
  model: string;
  spec: string;
  image?: string;
  /** kVA / kWh / W, in the unit below */
  size?: number;
  unit?: SizeUnit;
  priceLow: number;
  priceHigh: number;
  priceMid: number;
  /** ₦ per kVA / kWh / W */
  unitPrice?: number;
  seenOn: string;
  note?: string;
  /** reason this row is never auto-picked into a quote (still buyable by hand) */
  caveat?: string;
}

interface Band {
  key: string;
  label: string;
  /** exclusive lower bound, inclusive upper bound */
  min: number;
  max: number;
}

const CATEGORY_ORDER: ProductCategory[] = ['inverter', 'battery', 'panel', 'controller', 'package'];

/** The unit a category is measured in. Categories without one can't be ranked by value. */
const CATEGORY_UNIT: Partial<Record<ProductCategory, SizeUnit>> = {
  inverter: 'kVA',
  battery: 'kWh',
  panel: 'W',
};
const TIERS: BrandTier[] = ['budget', 'mid', 'premium'];

const PRICE_BANDS: Band[] = [
  { key: 'u500k', label: 'Under ₦500k', min: 0, max: 500_000 },
  { key: '500k-1m', label: '₦500k – ₦1M', min: 500_000, max: 1_000_000 },
  { key: '1m-3m', label: '₦1M – ₦3M', min: 1_000_000, max: 3_000_000 },
  { key: 'o3m', label: 'Over ₦3M', min: 3_000_000, max: Number.POSITIVE_INFINITY },
];

/** Size bands only exist where the category has a single meaningful unit. */
const SIZE_BANDS: Partial<Record<ProductCategory, Band[]>> = {
  inverter: [
    { key: 's', label: 'Up to 3kVA', min: 0, max: 3 },
    { key: 'm', label: '3 – 5kVA', min: 3, max: 5 },
    { key: 'l', label: '5 – 10kVA', min: 5, max: 10 },
    { key: 'xl', label: 'Over 10kVA', min: 10, max: Number.POSITIVE_INFINITY },
  ],
  battery: [
    { key: 's', label: 'Up to 5kWh', min: 0, max: 5 },
    { key: 'm', label: '5 – 10kWh', min: 5, max: 10 },
    { key: 'l', label: '10 – 20kWh', min: 10, max: 20 },
    { key: 'xl', label: 'Over 20kWh', min: 20, max: Number.POSITIVE_INFINITY },
  ],
  panel: [
    { key: 's', label: 'Up to 450W', min: 0, max: 450 },
    { key: 'm', label: '450 – 550W', min: 450, max: 550 },
    { key: 'l', label: '550 – 650W', min: 550, max: 650 },
    { key: 'xl', label: 'Over 650W', min: 650, max: Number.POSITIVE_INFINITY },
  ],
};

type SortKey = 'price-asc' | 'price-desc' | 'value';

const inBand = (b: Band, v: number) => v > b.min && v <= b.max;

// ─────────────────────────────────────────────────────────
// PRODUCT CARD
// ─────────────────────────────────────────────────────────

function ProductCard({ item }: { item: ShopItem }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 2200);
    return () => clearTimeout(t);
  }, [added]);

  function handleAdd() {
    writeCart(addLine(readCart(), item.brandSlug, item.model, qty));
    track('cart_add', { item: `${item.brandSlug}::${item.model}`, placement: 'shop' });
    setAdded(true);
    setQty(1);
  }

  const sameLowHigh = item.priceLow === item.priceHigh;

  return (
    <div className="group flex flex-col">
      <Link href={`/brands/${item.brandSlug}`} aria-label={`${item.brandName} ${item.model}`} className="block">
        <ProductImage
          product={{ category: item.category, model: item.model, spec: item.spec, image: item.image }}
          className="aspect-square w-full transition-transform duration-200 group-hover:scale-[1.01] motion-reduce:transition-none"
        />
      </Link>
      <div className="pt-4 flex flex-col flex-1">
        <p className="text-xs font-medium text-muted">{item.brandName}</p>
        <p className="font-heading font-bold text-ink text-[15px] sm:text-base leading-snug mt-0.5 break-words">{item.model}</p>
        <p className="text-muted text-xs mt-1 line-clamp-1">{item.spec}</p>
        <p className="font-heading font-extrabold text-ink text-lg sm:text-xl tabular-nums tracking-tight mt-3">
          {sameLowHigh ? formatNaira(item.priceLow) : `From ${formatNaira(item.priceLow)}`}
        </p>
        {item.caveat && (
          <p className="text-[11px] text-sun-ink mt-1 leading-snug flex gap-1">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-px" aria-hidden="true" />
            <span>{item.caveat}</span>
          </p>
        )}
        <div className="mt-auto pt-3 flex items-center gap-2">
          <div className="hidden sm:flex items-center border border-line rounded-full">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label={`Fewer ${item.model}`}
              className="w-8 h-9 flex items-center justify-center text-muted disabled:opacity-30"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-5 text-center text-sm font-semibold text-ink tabular-nums" aria-live="polite">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(99, q + 1))}
              aria-label={`More ${item.model}`}
              className="w-8 h-9 flex items-center justify-center text-muted"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className={`flex-1 min-h-10 rounded-full px-4 text-sm font-semibold transition-colors duration-150 flex items-center justify-center gap-1.5 ${
              added ? 'bg-leaf text-white' : 'bg-ink text-white hover:bg-ink-soft'
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" aria-hidden="true" /> Added
              </>
            ) : (
              'Add'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Grid({ items }: { items: ShopItem[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10 sm:gap-x-6">
      {items.map((item) => (
        <ProductCard key={item.id} item={item} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// FILTER CONTROLS
// ─────────────────────────────────────────────────────────

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3.5 py-2 text-[13px] font-semibold border whitespace-nowrap transition-colors duration-150 ${
        active ? 'bg-ink text-white border-ink' : 'bg-white text-ink-soft border-line hover:border-ink-soft'
      }`}
    >
      {children}
    </button>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide font-semibold text-slate-500 mb-2">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// INTERACTIVE LISTING
// ─────────────────────────────────────────────────────────

function ShopInner({ items }: { items: ShopItem[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [panelOpen, setPanelOpen] = useState(false);

  const cat = (CATEGORY_ORDER as string[]).includes(searchParams.get('cat') ?? '')
    ? (searchParams.get('cat') as ProductCategory)
    : null;
  const brandSel = useMemo(
    () => new Set((searchParams.get('brands') ?? '').split(',').filter(Boolean)),
    [searchParams],
  );
  const tier = (TIERS as string[]).includes(searchParams.get('tier') ?? '')
    ? (searchParams.get('tier') as BrandTier)
    : null;
  const priceBand = PRICE_BANDS.find((b) => b.key === searchParams.get('price')) ?? null;
  const sizeBands = cat ? SIZE_BANDS[cat] : undefined;
  const sizeBand = sizeBands?.find((b) => b.key === searchParams.get('size')) ?? null;
  const sort: SortKey =
    searchParams.get('sort') === 'price-desc'
      ? 'price-desc'
      : searchParams.get('sort') === 'value' && sizeBands
        ? 'value'
        : 'price-asc';
  const urlQuery = searchParams.get('q') ?? '';

  // Search stays local so typing is instant; the URL catches up after a pause.
  const [query, setQuery] = useState(urlQuery);
  useEffect(() => setQuery(urlQuery), [urlQuery]);

  const update = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      const qs = next.toString();
      router.replace(qs ? `/shop?${qs}` : '/shop', { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (query === urlQuery) return;
    const t = setTimeout(() => update({ q: query.trim() || null }), 300);
    return () => clearTimeout(t);
  }, [query, urlQuery, update]);

  function toggleBrand(slug: string) {
    const next = new Set(brandSel);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    update({ brands: [...next].join(',') || null });
  }

  function setCategory(next: ProductCategory | null) {
    // Size bands and the value sort are category-specific, and a brand that
    // makes no products in the new category would silently filter everything
    // to zero with its chip no longer on screen. Drop all three.
    const stillValid = next
      ? [...brandSel].filter((slug) => items.some((i) => i.brandSlug === slug && i.category === next))
      : [...brandSel];
    update({
      cat: next,
      size: null,
      brands: stillValid.join(',') || null,
      sort: sort === 'value' || sort === 'price-asc' ? null : sort,
    });
  }

  // Brand chips reflect what's actually available in the chosen category.
  const brandOptions = useMemo(() => {
    const map = new Map<string, { slug: string; name: string }>();
    items
      .filter((i) => (cat ? i.category === cat : true))
      .forEach((i) => map.set(i.brandSlug, { slug: i.brandSlug, name: i.brandName }));
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [items, cat]);

  const results = useMemo(() => {
    const needle = urlQuery.trim().toLowerCase();
    const out = items.filter((i) => {
      if (cat && i.category !== cat) return false;
      if (brandSel.size > 0 && !brandSel.has(i.brandSlug)) return false;
      if (tier && i.brandTier !== tier) return false;
      if (priceBand && !inBand(priceBand, i.priceMid)) return false;
      if (sizeBand && !(i.size !== undefined && inBand(sizeBand, i.size))) return false;
      if (needle) {
        const hay = `${i.brandName} ${i.model} ${i.spec}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });

    out.sort((a, b) => {
      if (sort === 'price-desc') return b.priceMid - a.priceMid;
      if (sort === 'value') {
        const av = a.unitPrice ?? Number.POSITIVE_INFINITY;
        const bv = b.unitPrice ?? Number.POSITIVE_INFINITY;
        if (av !== bv) return av - bv;
        return a.priceMid - b.priceMid;
      }
      return a.priceMid - b.priceMid;
    });
    return out;
  }, [items, cat, brandSel, tier, priceBand, sizeBand, urlQuery, sort]);

  const activeCount =
    (cat ? 1 : 0) + brandSel.size + (tier ? 1 : 0) + (priceBand ? 1 : 0) + (sizeBand ? 1 : 0) + (urlQuery ? 1 : 0);

  function clearAll() {
    setQuery('');
    router.replace('/shop', { scroll: false });
  }

  return (
    <div className="grid lg:grid-cols-[240px_1fr] gap-6 lg:gap-10">
      {/* ── Filters ─────────────────────────────── */}
      <div>
        <button
          type="button"
          onClick={() => setPanelOpen((o) => !o)}
          aria-expanded={panelOpen}
          className="lg:hidden w-full flex items-center justify-between border border-line rounded-full px-4 py-2.5 text-sm font-semibold text-ink"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" /> Filters
            {activeCount > 0 && (
              <span className="bg-amber-400 text-slate-900 rounded-full px-2 py-0.5 text-[11px]">{activeCount}</span>
            )}
          </span>
          <span className="text-slate-500 text-xs">{panelOpen ? 'Hide' : 'Show'}</span>
        </button>

        <div className={`${panelOpen ? 'block' : 'hidden'} lg:block mt-3 lg:mt-0 space-y-6 lg:sticky lg:top-24`}>
          <div>
            <label htmlFor="shop-search" className="sr-only">
              Search equipment
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="shop-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search brand, model or spec"
                className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <FilterGroup title="Price">
            {PRICE_BANDS.map((b) => (
              <Chip
                key={b.key}
                active={priceBand?.key === b.key}
                onClick={() => update({ price: priceBand?.key === b.key ? null : b.key })}
              >
                {b.label}
              </Chip>
            ))}
          </FilterGroup>

          {sizeBands && (
            <FilterGroup title="Size">
              {sizeBands.map((b) => (
                <Chip
                  key={b.key}
                  active={sizeBand?.key === b.key}
                  onClick={() => update({ size: sizeBand?.key === b.key ? null : b.key })}
                >
                  {b.label}
                </Chip>
              ))}
            </FilterGroup>
          )}

          <FilterGroup title="Brand class">
            {TIERS.map((t) => (
              <Chip key={t} active={tier === t} onClick={() => update({ tier: tier === t ? null : t })}>
                {TIER_LABEL[t]}
              </Chip>
            ))}
          </FilterGroup>

          <div>
            <p className="text-[11px] uppercase tracking-wide font-semibold text-slate-500 mb-2">Brand</p>
            <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto pr-1">
              {brandOptions.map((b) => (
                <Chip key={b.slug} active={brandSel.has(b.slug)} onClick={() => toggleBrand(b.slug)}>
                  {b.name}
                </Chip>
              ))}
            </div>
          </div>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              <X className="w-3.5 h-3.5" /> Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* ── Results ─────────────────────────────── */}
      <div className="min-w-0">
        <div role="group" aria-label="Category" className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto pb-1 mb-5 [scrollbar-width:none]">
          <Chip active={!cat} onClick={() => setCategory(null)}>
            All
          </Chip>
          {CATEGORY_ORDER.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCategory(cat === c ? null : c)}>
              {CATEGORY_LABEL[c]}
            </Chip>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 mb-6">
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-900">{results.length}</span>{' '}
            {results.length === 1 ? 'product' : 'products'}
            {cat ? ` in ${CATEGORY_LABEL[cat].toLowerCase()}` : ''}
          </p>
          <div className="flex items-center gap-3">
            <label htmlFor="shop-sort" className="sr-only sm:not-sr-only text-xs text-muted">
              Sort
            </label>
            <select
              id="shop-sort"
              value={sort}
              onChange={(e) => update({ sort: e.target.value === 'price-asc' ? null : e.target.value })}
              className="border border-line rounded-full px-3 py-2 text-sm text-ink bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sun-deep"
            >
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              {cat && CATEGORY_UNIT[cat] && <option value="value">Best value (₦ per {CATEGORY_UNIT[cat]})</option>}
            </select>
            <Link href="/cart" className="hidden sm:inline text-sm font-semibold text-ink hover:text-sun-ink whitespace-nowrap">
              Your order →
            </Link>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-2xl p-10 text-center">
            <p className="font-heading font-bold text-slate-900 text-lg">Nothing matches those filters</p>
            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
              We only list equipment we have a real Nigerian price for. Widen the filters, or message us and we&apos;ll
              tell you what it costs to source what you need.
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="mt-5 inline-flex items-center gap-2 bg-[#0A0F1E] text-white rounded-full px-5 py-2.5 text-sm font-semibold"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <Grid items={results} />
        )}
      </div>
    </div>
  );
}

/**
 * The fallback renders the complete, unfiltered catalogue. `useSearchParams`
 * makes the inner tree client-rendered on a statically prerendered route, so
 * the fallback is what search engines see — it has to be the real price list,
 * not a spinner.
 */
export default function ShopClient({ items }: { items: ShopItem[] }) {
  return (
    <Suspense
      fallback={
        <div>
          <p className="text-sm text-slate-500 mb-4">
            <span className="font-semibold text-slate-900">{items.length}</span> products
          </p>
          <Grid items={items} />
        </div>
      }
    >
      <ShopInner items={items} />
    </Suspense>
  );
}
