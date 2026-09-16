'use client';

import Script from 'next/script';
import { useTrackingConsent } from './useTrackingConsent';

/**
 * Google Tag Manager — consent-gated and environment-driven.
 *
 * GA4 is NOT loaded through this container. It is already loaded directly by
 * GoogleAnalytics.tsx, so adding a GA4 tag inside GTM would count every page
 * view twice. The container is for tags that come later (conversion pixels,
 * experiments) without a code deploy.
 *
 * The usual <noscript> iframe fallback is deliberately omitted: consent is
 * recorded by JavaScript, so a visitor without JS has never consented.
 *
 * To switch it on: set NEXT_PUBLIC_GTM_ID (GTM-XXXXXXX) in Vercel Production.
 */

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export default function TagManager() {
  const consented = useTrackingConsent();
  if (!GTM_ID || !consented) return null;

  return (
    <Script id="google-tag-manager" strategy="afterInteractive">
      {`
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${GTM_ID}');
      `}
    </Script>
  );
}
