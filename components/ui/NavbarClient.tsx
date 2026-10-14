'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { X, Menu, Phone, ChevronDown, MessageCircle, ArrowRight } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import CartButton from '@/components/ui/CartButton';
import { CONTACT_WHATSAPP, whatsappLink } from '@/lib/site';
import type { MenuGroup, MenuItem } from '@/components/ui/navTypes';

/**
 * Interactive half of the navbar.
 *
 * The menu copy is derived from the price/brand/sizing tables, which are large.
 * Building it here would pull lib/brands.ts, lib/quote.ts and lib/sizing.ts into
 * the browser bundle on every page just to label a dropdown, so Navbar.tsx (a
 * server component) computes the data and hands it over as plain props.
 */
export default function NavbarClient({
  menus,
  plainLink,
}: {
  menus: MenuGroup[];
  plainLink: MenuItem;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  /** the menu button a panel was opened from, so Escape can hand focus back */
  const triggerRef = useRef<HTMLButtonElement | null>(null);
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
        // Closing unmounts whatever held focus, which otherwise dumps a keyboard
        // user back at the top of the document. Hand it back to the trigger.
        setOpenMenu((current) => {
          if (current) triggerRef.current?.focus();
          return null;
        });
        setOpen((wasOpen) => {
          if (wasOpen) burgerRef.current?.focus();
          return false;
        });
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

  /**
   * The sheet covers the page visually but the page behind it stays in the tab
   * order, so a keyboard user opening the menu used to tab through content they
   * cannot see. Move focus in on open and cycle Tab within the sheet.
   */
  useEffect(() => {
    if (!open) return;
    const sheet = sheetRef.current;
    if (!sheet) return;
    const focusables = () =>
      [...sheet.querySelectorAll<HTMLElement>('a[href],button:not([disabled])')].filter(
        (el) => el.offsetWidth > 0 || el.offsetHeight > 0,
      );
    focusables()[0]?.focus();
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !sheet.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !sheet.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onTab);
    return () => document.removeEventListener('keydown', onTab);
  }, [open]);

  const isActive = (group: MenuGroup) => group.items.some((i) => pathname === i.href.split('?')[0]);

  return (
    <>
      <nav
        aria-label="Primary"
        className={`sticky top-0 z-50 transition-[background-color,box-shadow,border-color] duration-200 border-b ${
          scrolled ? 'backdrop-blur-md bg-white/85 border-line shadow-soft' : 'bg-white border-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 md:h-[72px]" ref={navRef}>
            <Link href="/" className="flex items-center min-h-[44px]" aria-label="SolarBuilders.ng home">
              <span className="md:hidden"><Logo variant="horizontal" size="sm" colorMode="light" /></span>
              <span className="hidden md:inline-flex"><Logo variant="horizontal" size="md" colorMode="light" /></span>
            </Link>

            {/* Desktop: three grouped menus */}
            <div className="hidden md:flex items-center gap-1">
              {menus.map((group, gi) => {
                const expanded = openMenu === group.label;
                const panelId = `nav-panel-${gi}`;
                const alignRight = gi === menus.length - 1;
                return (
                  <div key={group.label} className="relative" onMouseLeave={() => setOpenMenu(null)}>
                    <button
                      onClick={(e) => {
                        triggerRef.current = e.currentTarget;
                        setOpenMenu(expanded ? null : group.label);
                      }}
                      onMouseEnter={() => setOpenMenu(group.label)}
                      aria-expanded={expanded}
                      aria-controls={panelId}
                      className={`focus-ring flex items-center gap-1 px-3.5 h-11 rounded-full text-[15px] font-medium transition-colors ${
                        isActive(group) || expanded ? 'text-ink bg-sky' : 'text-ink-soft hover:text-ink hover:bg-sky'
                      }`}
                    >
                      {group.label}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </button>

                    {expanded && (
                      <div id={panelId} className={`absolute top-full pt-2 w-[580px] max-w-[calc(100vw-3rem)] z-50 ${alignRight ? 'right-0' : 'left-0'}`}>
                        <div className="bg-white rounded-card border border-line shadow-lift p-3 grid grid-cols-[1fr_1fr] gap-2">
                          <div>
                            {group.items.map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                className="focus-ring block px-3 py-2.5 rounded-control hover:bg-sky transition-colors"
                              >
                                <span className="block text-sm font-semibold text-ink">{item.label}</span>
                                {item.hint && <span className="block text-xs text-muted mt-0.5">{item.hint}</span>}
                              </Link>
                            ))}
                          </div>
                          <Link
                            href={group.featured.href}
                            className="focus-ring group/card rounded-control bg-sun-wash p-4 flex flex-col hover:bg-amber-100/70 transition-colors"
                          >
                            <span className="text-xs font-semibold text-sun-ink">
                              {group.featured.eyebrow}
                            </span>
                            <span className="font-heading font-bold text-ink text-base mt-1">
                              {group.featured.title}
                            </span>
                            {group.featured.stat && (
                              <span className="font-heading font-extrabold text-ink text-lg mt-1.5 tracking-tight">
                                {group.featured.stat}
                              </span>
                            )}
                            <span className="text-xs text-muted leading-relaxed mt-1.5 flex-1">
                              {group.featured.body}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink mt-3">
                              Open <ArrowRight className="w-3 h-3 transition-transform group-hover/card:translate-x-0.5" aria-hidden="true" />
                            </span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <Link
                href={plainLink.href}
                className={`focus-ring flex items-center px-3.5 h-11 rounded-full text-[15px] font-medium transition-colors ${
                  pathname === plainLink.href ? 'text-ink bg-sky' : 'text-ink-soft hover:text-ink hover:bg-sky'
                }`}
              >
                {plainLink.label}
              </Link>
            </div>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-2">
              <a
                href={whatsappLink('Hi SolarBuilders, I have a question about going solar.')}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring hidden lg:flex items-center gap-1.5 text-ink-soft text-[15px] font-medium hover:text-ink transition-colors h-11 px-3 rounded-full"
              >
                <MessageCircle className="w-4 h-4" />
                Talk to us
              </a>
              <CartButton />
              <Link href="/find" className="btn btn-sun !min-h-[44px] !px-5 text-[15px]">
                Get my quote
              </Link>
            </div>

            {/* Mobile actions */}
            <div className="md:hidden flex items-center gap-0.5">
              {!pathname?.startsWith('/calculator') && !pathname?.startsWith('/find') && (
                <Link href="/find" className="btn btn-sun !min-h-[40px] !px-4 text-sm !shadow-none mr-1">
                  Get quote
                </Link>
              )}
              <CartButton />
              <button
                ref={burgerRef}
                onClick={() => setOpen(true)}
                className="text-slate-900 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Open menu"
                aria-expanded={open}
                aria-controls="mobile-menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile sheet — grouped, not a flat list */}
      {open && (
        <div
          id="mobile-menu"
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fixed inset-0 bg-white z-[200] flex flex-col md:hidden"
        >
          <div className="flex justify-between items-center px-4 h-16 border-b border-line flex-shrink-0">
            <Link href="/" onClick={() => setOpen(false)} className="flex items-center">
              <Logo variant="horizontal" size="md" colorMode="light" />
            </Link>
            <button
              onClick={() => {
                setOpen(false);
                burgerRef.current?.focus();
              }}
              className="text-slate-900 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6">
            <Link
              href="/find"
              onClick={() => setOpen(false)}
              className="btn btn-sun btn-lg w-full mb-8"
            >
              Get my solar quote <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Link>

            {menus.map((group) => (
              <div key={group.label} className="mb-7">
                <p className="text-sm font-heading font-bold text-muted mb-1">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="block py-3 min-h-[48px]">
                      <span className="block font-heading font-semibold text-ink text-lg">{item.label}</span>
                      {item.hint && <span className="block text-sm text-muted">{item.hint}</span>}
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            <div className="pt-2 border-t border-line">
              <Link
                href={plainLink.href}
                onClick={() => setOpen(false)}
                className="block py-3 font-heading font-semibold text-ink text-lg min-h-[48px]"
              >
                {plainLink.label}
                <span className="block text-sm text-muted font-normal">Installers, vendors and distributors</span>
              </Link>
            </div>
          </div>

          <div className="px-4 pb-6 pt-4 border-t border-line flex-shrink-0 grid grid-cols-2 gap-3">
            <a
              href={`tel:+${CONTACT_WHATSAPP}`}
              className="btn btn-outline"
            >
              <Phone className="w-4 h-4" /> Call
            </a>
            <a
              href={whatsappLink('Hi SolarBuilders, I have a question about going solar.')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn bg-[#0E7568] hover:bg-[#075E54] text-white"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          </div>
        </div>
      )}
    </>
  );
}
