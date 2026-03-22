'use client';
import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem('cookie-consent', 'accepted');
    setVisible(false);
  }

  function decline() {
    localStorage.setItem('cookie-consent', 'declined');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[300] bg-slate-900 border-t border-slate-700 px-4 py-4 md:px-6"
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-slate-300 text-sm flex-1 leading-relaxed">
          We use cookies to improve your experience and analyse site traffic. By continuing, you agree to our use of cookies in line with GDPR and Nigeria&apos;s NDPR.{' '}
          <a href="/privacy" className="text-amber-400 underline hover:text-amber-300 transition-colors">
            Learn more
          </a>
        </p>
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={decline}
            className="min-h-[44px] px-5 py-2.5 rounded-full border border-slate-600 text-slate-300 text-sm font-semibold hover:border-slate-400 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="min-h-[44px] px-5 py-2.5 rounded-full bg-amber-400 hover:bg-amber-500 text-slate-900 text-sm font-semibold transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
