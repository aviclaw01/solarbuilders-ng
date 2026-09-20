/**
 * Route-change fallback shown while a dynamic segment streams in
 * (/partners/[slug], the admin dashboards). Static pages are prerendered and
 * never show this. Kept brand-consistent with app/not-found.tsx.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center" role="status">
        <div
          className="w-10 h-10 border-3 border-slate-200 border-t-amber-400 rounded-full animate-spin mx-auto mb-4"
          aria-hidden="true"
        />
        <p className="text-slate-500 text-sm">Loading…</p>
      </div>
    </div>
  );
}
