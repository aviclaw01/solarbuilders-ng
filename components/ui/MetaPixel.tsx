'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useTrackingConsent } from './useTrackingConsent';

/**
 * Meta (Facebook/Instagram) pixel — consent-gated and environment-driven.
 *
 * Loads only after the visitor accepts the cookie banner, and renders nothing
 * while NEXT_PUBLIC_META_PIXEL_ID is unset, so an unconfigured deploy sends
 * nothing to Meta.
 *
 * The base snippet fires one PageView on load. The App Router changes pages
 * without a full reload, so later navigations send their own PageView here —
 * otherwise ads audiences would only ever see the landing page.
 *
 * To switch it on: set NEXT_PUBLIC_META_PIXEL_ID in Vercel Production.
 */

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

type Fbq = (...args: unknown[]) => void;

export default function MetaPixel() {
  const consented = useTrackingConsent();
  const pathname = usePathname();
  const firstPath = useRef<string | null>(null);

  useEffect(() => {
    if (!PIXEL_ID || !consented) return;
    // The base snippet already counted the page it loaded on.
    if (firstPath.current === null) {
      firstPath.current = pathname;
      return;
    }
    const fbq = (window as unknown as { fbq?: Fbq }).fbq;
    fbq?.('track', 'PageView');
  }, [pathname, consented]);

  if (!PIXEL_ID || !consented) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
        document,'script','https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${PIXEL_ID}');
        fbq('track', 'PageView');
      `}
    </Script>
  );
}
