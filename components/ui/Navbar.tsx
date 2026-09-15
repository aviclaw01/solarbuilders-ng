'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { X, Menu, Phone, ChevronDown, MessageCircle } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import CartButton from '@/components/ui/CartButton';
import { CONTACT_WHATSAPP, whatsappLink } from '@/lib/site';

/**
 * Three top-level items, each a small menu, plus one primary action.
 *
 * The site has ~15 destinations. Listing them flat turned the bar into a wall
 * of links, so they are grouped by what someone is trying to do: buy something,
 * check a price, or work out what they need. The calculator is the action
 * rather than a nav item, because it is what we actually want people to do.
 */

interface MenuItem {
  href: string;
  label: string;
  hint?: string;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const MENUS: MenuGroup[] = [
  {
    label: 'Shop',
    items: [
      { href: '/shop', label: 'All equipment', hint: 'Every price we track' },
      { href: '/shop?cat=inverter', label: 'Inverters' },
      { href: '/shop?cat=battery', label: 'Batteries' },
      { href: '/shop?cat=panel', label: 'Solar panels' },
      { href: '/shop?cat=package', label: 'Complete packages' },
    ],
  },
  {
    label: 'Prices',
    items: [
      { href: '/brands', label: 'Prices by brand', hint: 'Felicity, Deye, Growatt, Jinko…' },
      { href: '/compare', label: 'Compare brands', hint: 'Deye vs Felicity, and more' },
      { href: '/blog/solar-cost-nigeria-2026', label: 'What a full system costs' },
    ],
  },
  {
    label: 'Learn',
    items: [
      { href: '/sizing', label: 'Sizing guides', hint: 'What size do I need?' },
      { href: '/how-it-works', label: 'How it works' },
      { href: '/blog', label: 'Solar guides' },
      { href: '/verified', label: 'How we vet installers' },
    ],
  },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on outside click or Escape.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null);
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Navigating closes whatever is open.
  useEffect(() => {
    setOpenMenu(null);
    setOpen(false);
  }, [pathname]);

  // Lock background scroll while the mobile sheet is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isActive = (group: MenuGroup) => group.items.some((i) => pathname === i.href.split('?')[0]);

  return (
    <>
      <nav
        className={`sticky top-0 z-50 transition-all duration-200 ${
          scrolled ? 'backdrop-blur-sm bg-white/90 border-b border-slate-100' : 'bg-white border-b border-slate-100'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16" ref={navRef}>
            <Link href="/" className="flex items-center min-h-[44px]" aria-label="SolarBuilders.ng home">
              <Logo variant="horizontal" size="md" colorMode="light" />
            </Link>

            {/* Desktop: three grouped menus */}
            <div className="hidden md:flex items-center gap-1">
              {MENUS.map((group) => {
                const expanded = openMenu === group.label;
                return (
                  <div key={group.label} className="relative" onMouseLeave={() => setOpenMenu(null)}>
                    <button
                      onClick={() => setOpenMenu(expanded ? null : group.label)}
                      onMouseEnter={() => setOpenMenu(group.label)}
                      aria-expanded={expanded}
                      aria-haspopup="true"
                      className={`flex items-center gap-1 px-3 h-11 rounded-full text-sm font-medium transition-colors ${
                        isActive(group) || expanded ? 'text-slate-900 bg-slate-50' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {group.label}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </button>

                    {expanded && (
                      <div className="absolute left-0 top-full pt-2 w-64 z-50">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-2">
                          {group.items.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="block px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                              <span className="block text-sm font-semibold text-slate-900">{item.label}</span>
                              {item.hint && <span className="block text-xs text-slate-500 mt-0.5">{item.hint}</span>}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-2">
              <a
                href={`tel:+${CONTACT_WHATSAPP}`}
                className="hidden xl:flex items-center gap-1.5 text-slate-600 text-sm font-medium hover:text-amber-600 transition-colors h-11 px-2"
                aria-label="Call SolarBuilders.ng"
              >
                <Phone className="w-4 h-4" />
                +234 916 839 4923
              </a>
              <CartButton />
              <Link
                href="/calculator"
                className="bg-amber-400 hover:bg-amber-500 text-slate-900 px-5 h-11 rounded-full text-sm font-semibold transition-all flex items-center whitespace-nowrap"
              >
                Size my system
              </Link>
            </div>

            {/* Mobile actions */}
            <div className="md:hidden flex items-center gap-1">
              <CartButton />
              <button
                onClick={() => setOpen(true)}
                className="text-slate-900 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile sheet — grouped, not a flat list */}
      {open && (
        <div className="fixed inset-0 bg-white z-[200] flex flex-col md:hidden">
          <div className="flex justify-between items-center px-6 h-16 border-b border-slate-100 flex-shrink-0">
            <Link href="/" onClick={() => setOpen(false)} className="flex items-center">
              <Logo variant="horizontal" size="md" colorMode="light" />
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-900 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <Link
              href="/calculator"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center w-full bg-amber-400 hover:bg-amber-500 text-slate-900 py-4 rounded-full font-heading font-bold text-lg min-h-[56px] mb-8"
            >
              Size my system →
            </Link>

            {MENUS.map((group) => (
              <div key={group.label} className="mb-7">
                <p className="text-xs font-heading font-bold text-slate-400 uppercase tracking-widest mb-2">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="block py-3 min-h-[48px]">
                      <span className="block font-heading font-semibold text-slate-900 text-lg">{item.label}</span>
                      {item.hint && <span className="block text-sm text-slate-500">{item.hint}</span>}
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            <div className="pt-2 border-t border-slate-100">
              <Link
                href="/for-builders"
                onClick={() => setOpen(false)}
                className="block py-3 font-heading font-semibold text-slate-900 text-lg min-h-[48px]"
              >
                Work with us
                <span className="block text-sm text-slate-500 font-normal">Installers, vendors and distributors</span>
              </Link>
            </div>
          </div>

          <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex-shrink-0 grid grid-cols-2 gap-3">
            <a
              href={`tel:+${CONTACT_WHATSAPP}`}
              className="flex items-center justify-center gap-2 border border-slate-200 text-slate-700 py-3.5 rounded-full font-semibold min-h-[52px]"
            >
              <Phone className="w-4 h-4" /> Call
            </a>
            <a
              href={whatsappLink('Hi SolarBuilders, I have a question about going solar.')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#22c55e] text-white py-3.5 rounded-full font-semibold min-h-[52px]"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          </div>
        </div>
      )}
    </>
  );
}
