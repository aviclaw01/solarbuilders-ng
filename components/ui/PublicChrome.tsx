'use client';

import { usePathname } from 'next/navigation';
import FloatingWhatsApp from './FloatingWhatsApp';
import CookieConsent from './CookieConsent';

/**
 * Site-wide floating chrome (WhatsApp bubble + cookie banner).
 * Suppressed on the internal admin area, which is staff-only and not indexed.
 */
export default function PublicChrome() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;
  return (
    <>
      <FloatingWhatsApp />
      <CookieConsent />
    </>
  );
}
