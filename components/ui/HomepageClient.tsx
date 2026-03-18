'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const TICKER_ITEMS = [
  '⚡ Emeka just calculated a 3kVA system in Lagos',
  '⚡ Adaeze requested quotes for a 5kVA system in Abuja',
  '⚡ Tunde connected with SunTech Installs in Lagos',
];

export default function HomepageClient() {
  const [tickerIdx, setTickerIdx] = useState(0);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('sb_exit_banner_dismissed');
    if (!dismissed) setShowBanner(true);

    const interval = setInterval(() => {
      setTickerIdx(i => (i + 1) % TICKER_ITEMS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const dismissBanner = () => {
    localStorage.setItem('sb_exit_banner_dismissed', '1');
    setShowBanner(false);
  };

  return (
    <>
      {/* Social proof ticker */}
      <div className="bg-[#F8FAFC] border-y border-[#E2E8F0] py-3 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <p className="text-[#64748B] text-sm transition-all duration-500">
            {TICKER_ITEMS[tickerIdx]}
          </p>
        </div>
      </div>

      {/* Exit-intent sticky banner (homepage only) */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0F1E] border-t border-white/10 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <p className="text-white text-sm font-medium">
              Get a free solar quote →
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://wa.me/2349168394923?text=Hi%2C%20I%20need%20help%20finding%20a%20solar%20installer"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25D366] text-white text-sm font-heading font-semibold px-4 py-2 rounded-full hover:bg-[#22c55e] transition-colors"
              >
                WhatsApp us
              </a>
              <Link href="/calculator" className="bg-[#F59E0B] text-[#0A0F1E] text-sm font-heading font-semibold px-4 py-2 rounded-full hover:bg-[#D97706] transition-colors">
                Calculator
              </Link>
              <button
                onClick={dismissBanner}
                className="text-[#94A3B8] hover:text-white text-sm px-2"
                aria-label="Dismiss banner"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
