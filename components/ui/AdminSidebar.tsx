'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  ExternalLink,
  Inbox,
  LayoutDashboard,
  Lock,
  Route,
  ShieldCheck,
  ShoppingCart,
} from 'lucide-react';

/**
 * The admin's left nav.
 *
 * Replaces the pill-row AdminNav, which every page rendered itself with a
 * hand-passed `active` prop — so a new section meant editing seven files and
 * remembering the prop. This lives in app/admin/layout.tsx and derives the
 * active item from the path, so adding a section is one line here.
 *
 * Client component only because usePathname needs it. That is a deliberate
 * exception to the admin's no-client-JS rule: the alternative is passing
 * `active` from every page again, which is the thing being removed.
 */

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  /** Needs the senior credential — see proxy.ts SUPER_ONLY_PATHS. */
  senior?: boolean;
}

const GENERAL: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/admin/leads', label: 'Leads', icon: <Inbox className="w-4 h-4" /> },
  { href: '/admin/orders', label: 'Orders', icon: <ShoppingCart className="w-4 h-4" /> },
  { href: '/admin/funnel', label: 'Funnel', icon: <BarChart3 className="w-4 h-4" /> },
];

const SENIOR: NavItem[] = [
  { href: '/admin/partners', label: 'Partners', icon: <ShieldCheck className="w-4 h-4" />, senior: true },
  { href: '/admin/routing', label: 'Routing', icon: <Route className="w-4 h-4" />, senior: true },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Item({ item, pathname, locked }: { item: NavItem; pathname: string; locked: boolean }) {
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-slate-900 text-white'
          : locked
            ? 'text-slate-400 hover:bg-slate-100'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <span className={active ? 'text-amber-400' : locked ? 'text-slate-300' : 'text-slate-400'}>{item.icon}</span>
      {item.label}
      {locked && <Lock className="w-3 h-3 ml-auto text-slate-300" aria-label="needs the senior login" />}
    </Link>
  );
}

export default function AdminSidebar({
  role,
  superConfigured,
}: {
  role: 'admin' | 'superadmin';
  superConfigured: boolean;
}) {
  const pathname = usePathname() || '/admin';
  const locked = (item: NavItem) => Boolean(item.senior) && superConfigured && role !== 'superadmin';

  const nav = (
    <>
      <div className="space-y-0.5">
        {GENERAL.map((i) => (
          <Item key={i.href} item={i} pathname={pathname} locked={false} />
        ))}
      </div>

      <div className="mt-5">
        <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Partner programme
        </p>
        <div className="space-y-0.5">
          {SENIOR.map((i) => (
            <Item key={i.href} item={i} pathname={pathname} locked={locked(i)} />
          ))}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop: a real sidebar. */}
      <aside
        aria-label="Admin sections"
        className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0 border-r border-slate-200 bg-white px-3 py-5 sticky top-0 h-screen"
      >
        <Link href="/admin" className="px-3 mb-5 block">
          <span className="font-heading font-extrabold text-slate-900">SolarBuilders</span>
          <span className="block text-[11px] uppercase tracking-wide text-slate-400">Admin</span>
        </Link>

        {nav}

        <div className="mt-auto pt-4 border-t border-slate-100">
          <p className="px-3 text-[11px] text-slate-400">
            Signed in as <span className="font-semibold text-slate-600">{role}</span>
          </p>
          <Link
            href="/"
            className="mt-1 flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            Back to site <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>

      {/* Mobile: the same items, scrolled horizontally across the top. */}
      <nav
        aria-label="Admin sections"
        className="lg:hidden sticky top-0 z-20 bg-white border-b border-slate-200 overflow-x-auto"
      >
        <div className="flex gap-1 px-3 py-2 min-w-max">
          {[...GENERAL, ...SENIOR].map((i) => (
            <Link
              key={i.href}
              href={i.href}
              aria-current={isActive(pathname, i.href) ? 'page' : undefined}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive(pathname, i.href)
                  ? 'bg-slate-900 text-white'
                  : locked(i)
                    ? 'text-slate-400 bg-slate-50'
                    : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {i.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
