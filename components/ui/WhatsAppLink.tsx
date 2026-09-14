'use client';

import { type ReactNode } from 'react';
import { whatsappLink } from '@/lib/site';
import { track } from '@/lib/track';

interface Props {
  /** message body; any URL inside it should already carry campaign params */
  text: string;
  /** where on the site this link lives, e.g. "brand:deye", "verified_page" */
  placement: string;
  className?: string;
  children: ReactNode;
  quoteCode?: string;
}

/** WhatsApp link that records the click before handing off to the app. */
export default function WhatsAppLink({ text, placement, className, children, quoteCode }: Props) {
  return (
    <a
      href={whatsappLink(text)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track('whatsapp_click', { placement, quoteCode })}
      className={className}
    >
      {children}
    </a>
  );
}
