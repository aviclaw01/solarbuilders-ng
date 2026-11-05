'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

/**
 * Meta (Facebook) Pixel — consent-gated and environment-driven, the exact
 * pattern GoogleAnalytics.tsx uses:
 *
 *  - The pixel ID comes from NEXT_PUBLIC_FB_PIXEL_ID (Events Manager →
 *    Data Sources → the pixel → ID). Renders nothing when unset, so an
 *    unconfigured deploy is silent.
 *  - Nothing loads until the cookie banner is accepted; on decline the Pixel
 *    never fires. `fbq('consent', 'grant')` is called on load because the
 *    banner answer is a precondition of the script existing at all.
 *
 * Funnel events (Lead, AddToCart, Contact…) are fanned out from lib/track.ts,
 * which no-ops unless this script actually mounted.
 */
const PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
const CONSENT_KEY = 'cookie-consent';

export default function MetaPixel() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        setConsented(window.localStorage.getItem(CONSENT_KEY) === 'accepted');
      } catch {
        setConsented(false);
      }
    };
    read();
    window.addEventListener('storage', read);
    window.addEventListener('sb-consent-change', read);
    return () => {
      window.removeEventListener('storage', read);
      window.removeEventListener('sb-consent-change', read);
    };
  }, []);

  if (!PIXEL_ID || !consented) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window,document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('consent', 'grant');
        fbq('init', '${PIXEL_ID}');
        fbq('track', 'PageView');
      `}
    </Script>
  );
}
