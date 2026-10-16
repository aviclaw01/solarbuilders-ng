/**
 * The old installer-marketplace profile URLs (/builders/<slug>). Those
 * companies were never real partners, so there is nothing to redirect to:
 * 410 tells crawlers the page is gone for good, which clears it from the
 * index faster than a 404 and, unlike the old 308 to /brands, is not read as
 * a soft 404.
 */
export function GET() {
  return new Response('Gone', {
    status: 410,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex' },
  });
}
