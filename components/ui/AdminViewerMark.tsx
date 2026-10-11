'use client';

import { useEffect } from 'react';
import { markAdminViewer } from '@/lib/quote-access';

/** Rendered inside the auth-gated admin shell: this browser may see prices on any quote link. */
export default function AdminViewerMark() {
  useEffect(() => markAdminViewer(), []);
  return null;
}
