'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Home, RefreshCw, MessageCircle } from 'lucide-react';

import { CONTACT_WHATSAPP } from '@/lib/site';

/**
 * Route-level error boundary. Next.js renders this whenever a page (or its
 * client components) throws during render or data handling — without it a
 * single crash renders a blank page.
 *
 * Note: layouts do NOT re-render inside this boundary, so we render our own
 * chrome-free screen; the user can always reach Home or WhatsApp from here.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the real stack in the console; never shown to the visitor.
    console.error('[route error]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-20">
      <div className="text-center max-w-md">
        <p className="text-amber-600 font-heading font-bold text-7xl mb-4">Oops.</p>
        <h1 className="font-heading font-extrabold text-slate-900 text-3xl mb-3">
          Something broke on our side.
        </h1>
        <p className="text-slate-500 mb-2">
          The error was logged and we&apos;ll look into it. Your progress on other pages is safe —
          nothing you did caused this.
        </p>
        {error.digest && (
          <p className="text-slate-400 text-xs mb-8">
            Reference: <code className="font-mono">{error.digest}</code>
          </p>
        )}
        {!error.digest && <div className="mb-8" />}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold px-6 py-3 rounded-full transition-colors"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" /> Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 border border-slate-200 hover:border-slate-400 text-slate-700 font-semibold px-6 py-3 rounded-full transition-colors"
          >
            <Home className="w-4 h-4" aria-hidden="true" /> Go home
          </Link>
        </div>
        <a
          href={`https://wa.me/${CONTACT_WHATSAPP}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm transition-colors"
        >
          <MessageCircle className="w-4 h-4" aria-hidden="true" /> Stuck? Message us on WhatsApp
        </a>
      </div>
    </div>
  );
}
