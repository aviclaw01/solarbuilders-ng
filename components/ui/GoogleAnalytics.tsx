'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

/**
 * Google Analytics 4 — consent-gated and environment-driven.
 *
 * Two things this fixes:
 *
 * 1. The measurement ID was hardcoded to "G-PLACEHOLDER", so every page view
 *    fired a real request to Google with an ID that collects nothing. It now
 *    comes from NEXT_PUBLIC_GA_MEASUREMENT_ID and renders nothing when unset,
 *    so an unconfigured deploy is silent rather than noisy.
 *
 * 2. It used to load regardless of the cookie banner's answer, which made the
 *    NDPR/GDPR notice decorative. Analytics now waits for an explicit accept
 *    and never loads on decline.
 *
 * To switch it on: set NEXT_PUBLIC_GA_MEASUREMENT_ID in Vercel (Production and
 * Preview) to the G-XXXXXXXXXX id from the GA4 property. No code change.
 */

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const CONSENT_KEY = 'cookie-consent';

export default function GoogleAnalytics() {
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
    // The banner writes on the same page, so listen for its change as well as
    // the cross-tab storage event.
    window.addEventListener('storage', read);
    window.addEventListener('sb-consent-change', read);
    return () => {
      window.removeEventListener('storage', read);
      window.removeEventListener('sb-consent-change', read);
    };
  }, []);

  if (!GA_ID || !consented) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
