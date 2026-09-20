'use client';

/**
 * Last-resort error boundary. Next.js renders this INSTEAD OF the root layout
 * when the error escapes app/error.tsx — so it must render its own
 * <html> and <body>, and it cannot rely on globals.css or fonts.
 * Inline styles only, so it works even when every stylesheet failed to load.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FFFFFF',
          color: '#0F172A',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '1.5rem',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <p style={{ color: '#D97706', fontWeight: 700, fontSize: 56, margin: '0 0 12px' }}>Oops.</p>
          <h1 style={{ fontWeight: 800, fontSize: 24, margin: '0 0 10px' }}>
            Something broke on our side.
          </h1>
          <p style={{ color: '#64748B', fontSize: 14, margin: '0 0 24px' }}>
            Please try again. If it keeps happening, message us on WhatsApp and we&apos;ll pick it
            up from there.
          </p>
          <button
            onClick={reset}
            style={{
              background: '#F59E0B',
              color: '#0F172A',
              fontWeight: 600,
              border: 'none',
              borderRadius: 9999,
              padding: '12px 28px',
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          {error.digest ? (
            <p style={{ color: '#94A3B8', fontSize: 11, marginTop: 20 }}>
              Reference: <code>{error.digest}</code>
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
