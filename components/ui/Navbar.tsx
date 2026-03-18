'use client';
import Link from 'next/link';
import { useState } from 'react';
import { X, Menu, Zap } from 'lucide-react';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="bg-[#0F172A] sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#F59E0B] rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#0F172A]" fill="currentColor" />
              </div>
              <span style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="font-bold text-lg text-white">
                SolarBuilders<span className="text-[#F59E0B]">.ng</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/calculator" className="text-[#F59E0B] font-semibold text-sm hover:text-white transition-colors" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
                ⚡ Calculator
              </Link>
              <Link href="/marketplace" className="text-[#94A3B8] text-sm hover:text-white transition-colors">
                Marketplace
              </Link>
              <Link href="/for-builders" className="text-[#94A3B8] text-sm hover:text-white transition-colors">
                For Builders
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/for-builders"
                className="bg-[#F59E0B] text-[#0F172A] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#D97706] transition-colors"
                style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
              >
                List Free →
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setOpen(true)}
              className="md:hidden text-white p-2"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {open && (
        <div className="fixed inset-0 bg-[#0F172A] z-[200] flex flex-col p-6">
          <div className="flex justify-between items-center mb-12">
            <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
              <div className="w-8 h-8 bg-[#F59E0B] rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#0F172A]" fill="currentColor" />
              </div>
              <span style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="font-bold text-lg text-white">
                SolarBuilders<span className="text-[#F59E0B]">.ng</span>
              </span>
            </Link>
            <button onClick={() => setOpen(false)} className="text-white p-2">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col gap-6">
            <Link href="/calculator" onClick={() => setOpen(false)}
              style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
              className="text-[#F59E0B] font-bold text-2xl">
              ⚡ Solar Calculator
            </Link>
            <Link href="/marketplace" onClick={() => setOpen(false)}
              style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
              className="text-white font-semibold text-xl">
              🔍 Marketplace
            </Link>
            <Link href="/for-builders" onClick={() => setOpen(false)}
              style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
              className="text-white font-semibold text-xl">
              🏗️ For Builders
            </Link>
          </div>

          <div className="mt-auto">
            <div className="border-t border-white/10 pt-6">
              <Link
                href="/for-builders"
                onClick={() => setOpen(false)}
                className="block w-full bg-[#F59E0B] text-[#0F172A] py-4 rounded-xl text-center font-semibold text-lg"
                style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
              >
                List Your Business Free →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
