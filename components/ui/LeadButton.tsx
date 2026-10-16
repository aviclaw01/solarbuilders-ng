'use client';

import type { ReactNode } from 'react';
import { openChooser, openContact } from './LeadModals';

/** A button for server-rendered pages that opens the quote chooser or the contact form. */
export default function LeadButton({
  kind,
  placement,
  className,
  children,
}: {
  kind: 'chooser' | 'contact';
  placement: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={() => (kind === 'chooser' ? openChooser(placement) : openContact(placement))} className={className}>
      {children}
    </button>
  );
}
