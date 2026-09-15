import Link from "next/link";
import { BarChart3, ExternalLink, Inbox, ShoppingCart } from "lucide-react";

/**
 * Shared header nav for the internal admin area.
 *
 * Deliberately a server component with an explicit `active` prop rather than
 * a client component reading usePathname() — the admin pages ship no client
 * JS at all (filters are links, status controls are plain forms + server
 * actions) and this keeps it that way.
 *
 * Add to a new admin page with a single line:  <AdminNav active="orders" />
 */

export type AdminSection = "leads" | "orders" | "funnel";

const LINKS: { key: AdminSection; href: string; label: string; icon: React.ReactNode }[] = [
  { key: "leads", href: "/admin/leads", label: "Leads", icon: <Inbox className="w-3.5 h-3.5" /> },
  { key: "orders", href: "/admin/orders", label: "Orders", icon: <ShoppingCart className="w-3.5 h-3.5" /> },
  { key: "funnel", href: "/admin/funnel", label: "Funnel", icon: <BarChart3 className="w-3.5 h-3.5" /> },
];

export default function AdminNav({ active }: { active?: AdminSection }) {
  return (
    <nav
      aria-label="Admin sections"
      className="flex flex-wrap items-center gap-2 mb-6 -mt-1"
    >
      {LINKS.map((l) => {
        const isActive = l.key === active;
        return (
          <Link
            key={l.key}
            href={l.href}
            aria-current={isActive ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
              isActive
                ? "bg-[#0A0F1E] text-white border-[#0A0F1E]"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
            }`}
          >
            {l.icon}
            {l.label}
          </Link>
        );
      })}

      <Link
        href="/"
        className="ml-auto inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        Back to site <ExternalLink className="w-3.5 h-3.5" />
      </Link>
    </nav>
  );
}
