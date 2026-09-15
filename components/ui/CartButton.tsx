'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { readCart } from '@/lib/cart';

/**
 * Cart-count badge for the navbar.
 *
 * The cart lives in localStorage, which does not exist during SSR. Rendering
 * the count on the first pass would mean the server says "0" and the client
 * says "3" — a hydration mismatch. So `count` starts as null (no badge at all)
 * and is only filled in after mount, which is identical on both sides.
 *
 * Stays in sync via the `sb-cart-change` event that writeCart() dispatches, and
 * via `storage` so a second tab updates too.
 */
export default function CartButton({ className = '' }: { className?: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const sync = () => setCount(readCart().reduce((n, l) => n + l.qty, 0));
    sync();
    window.addEventListener('sb-cart-change', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('sb-cart-change', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const showBadge = count !== null && count > 0;

  return (
    <Link
      href="/cart"
      aria-label={showBadge ? `Your order request — ${count} item${count === 1 ? '' : 's'}` : 'Your order request'}
      className={`relative inline-flex items-center justify-center w-10 h-10 rounded-full text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors ${className}`}
    >
      <ShoppingCart className="w-5 h-5" />
      {showBadge && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-slate-900 text-[11px] font-heading font-bold flex items-center justify-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
