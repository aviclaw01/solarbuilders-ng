import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import AdminNav, { type AdminSection } from "@/components/ui/AdminNav";
import { PARTNER_STATUSES, PARTNER_STATUS_META, type PartnerStatus } from "@/lib/partners";

/**
 * Shared server-rendered pieces for /admin/partners and /admin/routing.
 * No client JS: same conventions as the leads and orders dashboards.
 */

const LAGOS_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: "Africa/Lagos",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "14 Sep 2026, 18:42" in Africa/Lagos. */
export function formatLagos(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const parts = LAGOS_FORMAT.formatToParts(d);
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("day")} ${get("month")} ${get("year")}, ${get("hour")}:${get("minute")}`;
}

/** Only ever render http(s) links from applicant-supplied data. */
export function safeHref(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function isPartnerStatus(v: unknown): v is PartnerStatus {
  return typeof v === "string" && (PARTNER_STATUSES as readonly string[]).includes(v);
}

export function StatusChip({ status }: { status: string }) {
  const meta = isPartnerStatus(status) ? PARTNER_STATUS_META[status] : null;
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${
        meta?.chip ?? "bg-slate-100 text-slate-500 border-slate-200"
      }`}
    >
      {meta?.label ?? status}
    </span>
  );
}

export function AdminShell({
  title,
  active,
  children,
}: {
  title: string;
  active: AdminSection;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#0A0F1E] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="text-[#F59E0B] text-xs font-semibold tracking-wide uppercase">
              Internal · superadmin · not indexed
            </span>
            <h1 className="font-heading font-extrabold text-2xl md:text-3xl mt-1">{title}</h1>
          </div>
          <Link href="/" className="text-sm text-slate-300 hover:text-white transition-colors">
            ← Back to site
          </Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <AdminNav active={active} />
        {children}
      </main>
    </div>
  );
}

export function ConfigError({ what, table }: { what: "env" | "http"; table: string }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <h2 className="font-heading font-bold text-rose-900 text-lg">Could not load data</h2>
          <p className="text-rose-800 text-sm mt-1">
            {what === "env" ? (
              <>
                Supabase is not configured on this deployment. Set{" "}
                <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code>, then redeploy.
              </>
            ) : (
              <>
                Supabase refused the read. Check that the <code className="font-mono">{table}</code> table
                exists (apply <code className="font-mono">supabase/partners.sql</code>) and that the
                service-role key is current. Details are in the server logs.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5">
      <h2 className="font-heading font-bold text-slate-900 text-base mb-3">{title}</h2>
      {children}
    </section>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-1.5 grid grid-cols-3 gap-3 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="col-span-2 text-slate-900 break-words">{children ?? "—"}</dd>
    </div>
  );
}
