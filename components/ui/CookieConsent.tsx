'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  // /find has a sticky bottom CTA; keep the card out of its way.
  const aboveCta = usePathname()?.startsWith('/find');

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem('cookie-consent', 'accepted');
    window.dispatchEvent(new Event('sb-consent-change'));
    setVisible(false);
  }

  function decline() {
    localStorage.setItem('cookie-consent', 'declined');
    window.dispatchEvent(new Event('sb-consent-change'));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className={`fixed z-[300] ${aboveCta ? 'bottom-24' : 'bottom-3'} left-3 right-3 sm:right-auto sm:max-w-sm bg-white border border-line rounded-card shadow-lift p-4`}
    >
      <p className="text-ink-soft text-sm leading-snug">
        We use cookies to measure site traffic. OK?{' '}
        <a href="/privacy" className="text-ink underline underline-offset-2">Privacy</a>
      </p>
      <div className="flex gap-2 mt-3">
        <button
          onClick={decline}
          className="flex-1 min-h-10 rounded-full border border-line text-ink text-sm font-semibold hover:border-ink-soft transition-colors duration-150"
        >
          No thanks
        </button>
        <button
          onClick={accept}
          className="flex-1 min-h-10 rounded-full bg-ink text-white text-sm font-semibold hover:bg-ink-soft transition-colors duration-150"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
