/**
 * Who may see the prices on a quote link.
 *
 * A /calculator?q= link carries the appliance list, not the prices, so anyone
 * can open it. The owner wants to hand that link to installers and let them
 * quote blind: an installer should see WHAT the customer needs (load, sizing,
 * bill of materials) but not OUR figures, so the customer gets an independent
 * number to compare against.
 *
 * Prices show when the viewer:
 *  - generated this quote in this browser (code remembered on creation), or
 *  - has opened the admin desk in this browser (admin is behind proxy.ts auth,
 *    so reaching it is the proof; AdminViewerMark records it).
 *
 * This is a presentation rule, not a security boundary — the calculator is
 * public, and anyone can price any list themselves. It only stops the shared
 * link from handing an installer our numbers up front.
 */

const MY_QUOTES_KEY = 'sb_my_quotes';
const ADMIN_KEY = 'sb_admin_viewer';
const MAX_REMEMBERED = 100;

function read(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(MY_QUOTES_KEY) ?? '[]') as unknown;
    return Array.isArray(raw) ? raw.filter((c): c is string => typeof c === 'string') : [];
  } catch {
    return [];
  }
}

export function rememberQuote(code: string): void {
  try {
    const codes = read().filter((c) => c !== code);
    codes.unshift(code);
    localStorage.setItem(MY_QUOTES_KEY, JSON.stringify(codes.slice(0, MAX_REMEMBERED)));
  } catch {
    /* storage disabled — the owner just sees the brief on a shared link */
  }
}

export function ownsQuote(code: string): boolean {
  return read().includes(code);
}

export function markAdminViewer(): void {
  try {
    localStorage.setItem(ADMIN_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function isAdminViewer(): boolean {
  try {
    return localStorage.getItem(ADMIN_KEY) === '1';
  } catch {
    return false;
  }
}

export function canSeePrices(code: string): boolean {
  return isAdminViewer() || ownsQuote(code);
}
