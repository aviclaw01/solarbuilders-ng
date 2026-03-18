'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { X, Menu } from 'lucide-react';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'backdrop-blur-md bg-white/90 border-b border-[#E2E8F0] shadow-sm'
          : 'bg-white border-b border-[#E2E8F0]'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1.5">
              <span className="text-[#F59E0B] text-xl">⚡</span>
              <span className="font-heading font-bold text-lg text-[#0A0F1E]">
                SolarBuilders<span className="text-[#F59E0B]">.ng</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-7">
              <Link href="/calculator" className="text-[#64748B] text-sm hover:text-[#0A0F1E] transition-colors font-medium hover:underline underline-offset-4">
                Calculator
              </Link>
              <Link href="/marketplace" className="text-[#64748B] text-sm hover:text-[#0A0F1E] transition-colors font-medium hover:underline underline-offset-4">
                Marketplace
              </Link>
              <Link href="/blog" className="text-[#64748B] text-sm hover:text-[#0A0F1E] transition-colors font-medium hover:underline underline-offset-4">
                Blog
              </Link>
              <Link href="/about" className="text-[#64748B] text-sm hover:text-[#0A0F1E] transition-colors font-medium hover:underline underline-offset-4">
                About
              </Link>
              <Link href="/for-builders" className="text-[#64748B] text-sm hover:text-[#0A0F1E] transition-colors font-medium hover:underline underline-offset-4">
                For Builders
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/for-builders"
                className="bg-[#F59E0B] text-[#0A0F1E] px-5 py-2.5 rounded-full text-sm font-heading font-bold hover:bg-[#D97706] transition-colors"
              >
                List Free →
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setOpen(true)}
              className="md:hidden text-[#0A0F1E] p-2"
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
            <Link href="/" className="flex items-center gap-1.5" onClick={() => setOpen(false)}>
              <span className="text-[#F59E0B] text-xl">⚡</span>
              <span className="font-heading font-bold text-lg text-[#0A0F1E]">
                SolarBuilders<span className="text-[#F59E0B]">.ng</span>
              </span>
            </Link>
            <button onClick={() => setOpen(false)} className="text-[#0A0F1E] p-2" aria-label="Close menu">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col gap-6">
            {[
              { href: '/calculator', label: '⚡ Calculator' },
              { href: '/marketplace', label: '🔍 Marketplace' },
              { href: '/blog', label: '📖 Blog' },
              { href: '/about', label: 'ℹ️ About' },
              { href: '/for-builders', label: '🏗️ For Builders' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="font-heading text-[#0A0F1E] font-semibold text-xl border-b border-[#E2E8F0] pb-4"
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="mt-auto">
            <Link
              href="/for-builders"
              onClick={() => setOpen(false)}
              className="block w-full bg-[#F59E0B] text-[#0A0F1E] py-4 rounded-full text-center font-heading font-bold text-lg"
            >
              List Your Business Free →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
