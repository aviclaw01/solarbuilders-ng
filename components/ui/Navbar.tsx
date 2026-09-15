'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { X, Menu, Phone, ChevronDown, MessageCircle } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import CartButton from '@/components/ui/CartButton';
import { CONTACT_WHATSAPP, whatsappLink } from '@/lib/site';
import { HEADLINE_PACKAGES, PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { comparisonPairs } from '@/lib/brands';
import { SIZING_SCENARIOS } from '@/lib/sizing';
import { formatNairaShort } from '@/lib/quote';

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

interface Featured {
  href: string;
  eyebrow: string;
  title: string;
  body: string;
  /** big number or price shown on the card */
  stat?: string;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
  featured: Featured;
}

const FAMILY = HEADLINE_PACKAGES[2];
const TOP_COMPARISON = comparisonPairs()[0];

/** Sits beside the menus as a plain link — no dropdown, like Beam's "Our Customers". */
const PLAIN_LINK = { href: '/for-builders', label: 'Work with us' };

const MENUS: MenuGroup[] = [
  {
    label: 'Shop',
    items: [
      { href: '/shop', label: 'All equipment', hint: 'Every price we track' },
      { href: '/shop?cat=inverter', label: 'Inverters' },
      { href: '/shop?cat=battery', label: 'Batteries' },
      { href: '/shop?cat=panel', label: 'Solar panels' },
      { href: '/shop?cat=package', label: 'Complete packages' },
      { href: '/cart', label: 'Your order' },
    ],
    featured: {
      href: '/calculator',
      eyebrow: 'Not sure what fits?',
      title: 'Size your system first',
      body: `Tick your appliances and get an itemised list in two minutes. A family home with one AC runs about ${formatNairaShort(FAMILY.low)}–${formatNairaShort(FAMILY.high)} installed.`,
      stat: `${formatNairaShort(FAMILY.low)}–${formatNairaShort(FAMILY.high)}`,
    },
  },
  {
    label: 'Prices',
    items: [
      { href: '/brands', label: 'Prices by brand', hint: 'Felicity, Deye, Growatt, Jinko…' },
      { href: '/compare', label: 'Compare brands', hint: `${comparisonPairs().length} head-to-head pages` },
      { href: '/blog/solar-cost-nigeria-2026', label: 'What a full system costs' },
      { href: '/blog/inverter-size-guide', label: 'Inverter size guide' },
    ],
    featured: TOP_COMPARISON
      ? {
          href: `/compare/${TOP_COMPARISON.slug}`,
          eyebrow: 'Most compared',
          title: `${TOP_COMPARISON.a.name.split(' ')[0]} vs ${TOP_COMPARISON.b.name.split(' ')[0]}`,
          body: 'Per kVA, per kWh, model by model, with what each is actually good for.',
          stat: 'Head to head',
        }
      : { href: '/compare', eyebrow: 'Compare', title: 'Brand comparisons', body: 'See what each brand costs.' },
  },
  {
    label: 'Resources',
    items: [
      { href: '/sizing', label: 'Sizing guides', hint: `${SIZING_SCENARIOS.length} worked answers` },
      { href: '/blog', label: 'Solar guides', hint: 'Costs, maintenance, financing' },
      { href: '/faq', label: 'FAQs', hint: 'Straight answers, no sales pitch' },
      { href: '/how-it-works', label: 'How it works' },
      { href: '/verified', label: 'How we vet installers' },
      { href: '/blog/solar-loans-nigeria', label: 'Paying for it' },
    ],
    featured: {
      href: '/sizing',
      eyebrow: 'Most asked',
      title: 'What size do I need?',
      body: `Worked answers for ACs, flats, shops and offices — every figure computed, not guessed. Prices from ${PRICES_LAST_UPDATED_LABEL}.`,
      stat: `${SIZING_SCENARIOS.length} guides`,
    },
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
              {MENUS.map((group, gi) => {
                const expanded = openMenu === group.label;
                const alignRight = gi === MENUS.length - 1;
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
                      <div className={`absolute top-full pt-2 w-[580px] max-w-[calc(100vw-3rem)] z-50 ${alignRight ? 'right-0' : 'left-0'}`}>
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-300/40 p-3 grid grid-cols-[1fr_1fr] gap-2">
                          <div>
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
                          <Link
                            href={group.featured.href}
                            className="group/card rounded-xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 p-4 flex flex-col hover:border-amber-300 transition-colors"
                          >
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">
                              {group.featured.eyebrow}
                            </span>
                            <span className="font-heading font-bold text-slate-900 text-base mt-1">
                              {group.featured.title}
                            </span>
                            {group.featured.stat && (
                              <span className="font-heading font-extrabold text-amber-500 text-lg mt-1.5">
                                {group.featured.stat}
                              </span>
                            )}
                            <span className="text-xs text-slate-500 leading-relaxed mt-1.5 flex-1">
                              {group.featured.body}
                            </span>
                            <span className="text-xs font-semibold text-slate-900 mt-3 group-hover/card:text-amber-600 transition-colors">
                              Open →
                            </span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <Link
                href={PLAIN_LINK.href}
                className={`flex items-center px-3 h-11 rounded-full text-sm font-medium transition-colors ${
                  pathname === PLAIN_LINK.href ? 'text-slate-900 bg-slate-50' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {PLAIN_LINK.label}
              </Link>
            </div>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-2">
              <a
                href={whatsappLink('Hi SolarBuilders, I have a question about going solar.')}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center gap-1.5 text-slate-600 text-sm font-medium hover:text-slate-900 transition-colors h-11 px-3"
              >
                <MessageCircle className="w-4 h-4" />
                Talk to us
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
                href={PLAIN_LINK.href}
                onClick={() => setOpen(false)}
                className="block py-3 font-heading font-semibold text-slate-900 text-lg min-h-[48px]"
              >
                {PLAIN_LINK.label}
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
