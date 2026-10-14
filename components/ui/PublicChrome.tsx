'use client';

import { usePathname } from 'next/navigation';
import FloatingWhatsApp from './FloatingWhatsApp';
import CookieConsent from './CookieConsent';

/**
 * Site-wide floating chrome (WhatsApp bubble + cookie banner).
 * Suppressed on the internal admin area, which is staff-only and not indexed,
 * and the WhatsApp bubble is left off the /find flow.
 */
export default function PublicChrome() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;
  // /find is a focused, full-screen flow with its own sticky button at the
  // bottom; the WhatsApp bubble would sit on top of it.
  const focused = pathname?.startsWith('/find');
  return (
    <>
      {!focused && <FloatingWhatsApp />}
      <CookieConsent />
    </>
  );
}
