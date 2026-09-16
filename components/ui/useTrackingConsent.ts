'use client';

import { useEffect, useState } from 'react';

const CONSENT_KEY = 'cookie-consent';

/**
 * True only once the visitor has explicitly accepted the cookie banner.
 *
 * Every tracker (GA4, Tag Manager, the Meta pixel) waits on this so that the
 * NDPR/GDPR banner actually decides something. Declining, or not answering
 * yet, loads nothing. Shared so the three trackers cannot drift into different
 * interpretations of consent.
 */
export function useTrackingConsent(): boolean {
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
    // The banner writes on the same page, so listen for its event as well as
    // the cross-tab storage event.
    window.addEventListener('storage', read);
    window.addEventListener('sb-consent-change', read);
    return () => {
      window.removeEventListener('storage', read);
      window.removeEventListener('sb-consent-change', read);
    };
  }, []);

  return consented;
}
