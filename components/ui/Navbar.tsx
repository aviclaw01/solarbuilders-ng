'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { X, Menu } from 'lucide-react';
import Logo from '@/components/ui/Logo';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/calculator', label: 'Size My System' },
    { href: '/marketplace', label: 'Find Builders' },
    { href: '/blog', label: 'Solar Guides' },
    { href: '/for-builders', label: 'List Your Company' },
  ];

  return (
    <>
      <nav className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'backdrop-blur-sm bg-white/90 border-b border-slate-100'
          : 'bg-white border-b border-slate-100'
      }`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Logo variant="horizontal" size="md" colorMode="light" />
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-7">
              {navLinks.map(({ href, label }) => (
                <Link key={href} href={href} className="text-slate-600 text-sm hover:text-slate-900 transition-colors font-medium">
                  {label}
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/for-builders"
                className="bg-amber-400 hover:bg-amber-500 text-slate-900 px-5 py-2 rounded-full text-sm font-semibold transition-all"
              >
                Get Listed Free
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setOpen(true)}
              className="md:hidden text-slate-900 p-2"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {open && (
        <div className="fixed inset-0 bg-white z-[200] flex flex-col p-6">
          <div className="flex justify-between items-center mb-12">
            <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
              <Logo variant="horizontal" size="md" colorMode="light" />
            </Link>
            <button onClick={() => setOpen(false)} className="text-slate-900 p-2" aria-label="Close menu">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col gap-6">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="font-heading text-slate-900 font-semibold text-xl border-b border-slate-100 pb-4"
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="mt-auto">
            <Link
              href="/for-builders"
              onClick={() => setOpen(false)}
              className="block w-full bg-amber-400 hover:bg-amber-500 text-slate-900 py-4 rounded-full text-center font-heading font-bold text-lg transition-all"
            >
              Get Listed Free →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
