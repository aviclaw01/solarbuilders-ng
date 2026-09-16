'use client';

import Script from 'next/script';
import { useTrackingConsent } from './useTrackingConsent';

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
 * To switch it on: set NEXT_PUBLIC_GA_MEASUREMENT_ID in Vercel (Production only, so
 * preview traffic stays out of the numbers) to the G-XXXXXXXXXX id from the GA4 property. No code change.
 */

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function GoogleAnalytics() {
  const consented = useTrackingConsent();

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
