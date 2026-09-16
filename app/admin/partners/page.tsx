import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, Search } from "lucide-react";
import { dbGetChecked, listPartners, supabaseEnv } from "@/lib/partner-db";
import { PARTNER_KINDS, PARTNER_STATUSES, PARTNER_STATUS_META, kindLabel, type PartnerStatus } from "@/lib/partners";
import { AdminShell, ConfigError, StatusChip, formatLagos, isPartnerStatus } from "@/components/admin/PartnerAdmin";

/**
 * Partner applications and verified partners — the review queue.
 *
 * Auth: superadmin Basic credential, enforced in proxy.ts (503 when
 * ADMIN_SUPER_USER / ADMIN_SUPER_PASSWORD are unset). This page is read-only;
 * decisions are made on /admin/partners/[id], whose server actions re-verify
 * the credential themselves.
 *
 * Data: lib/partner-db.ts (Supabase PostgREST, service-role key). No client JS:
 * filters are links and a GET form.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Partner applications (admin)",
  robots: { index: false, follow: false },
};

const MAX_ROWS = 300;

interface PageProps {
  searchParams: Promise<{ status?: string; kind?: string; q?: string }>;
}

export default async function AdminPartnersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const activeStatus = isPartnerStatus(sp.status) ? sp.status : "all";
  const activeKind = PARTNER_KINDS.some((k) => k.id === sp.kind) ? (sp.kind as string) : "";
  const rawQuery = (sp.q ?? "").trim().slice(0, 80);

  if (!supabaseEnv()) {
    return (
      <AdminShell title="Partners" active="partners">
        <ConfigError what="env" table="partners" />
      </AdminShell>
    );
  }

  const [list, counts] = await Promise.all([
    listPartners({
      status: activeStatus === "all" ? undefined : activeStatus,
      kind: activeKind || undefined,
      search: rawQuery || undefined,
      limit: MAX_ROWS,
    }),
    dbGetChecked<{ status: string }>("partners", { select: "status", limit: "5000" }),
  ]);

  if (!list.ok) {
    return (
      <AdminShell title="Partners" active="partners">
        <ConfigError what="http" table="partners" />
      </AdminShell>
    );
  }

  const rows = list.data;
  const allStatuses = counts.ok ? counts.data : [];
  const byStatus = Object.fromEntries(
    PARTNER_STATUSES.map((s) => [s, allStatuses.filter((r) => r.status === s).length]),
  ) as Record<PartnerStatus, number>;
  const total = allStatuses.length;

  const href = (status: string) => {
    const p = new URLSearchParams();
    if (status !== "all") p.set("status", status);
    if (activeKind) p.set("kind", activeKind);
    if (rawQuery) p.set("q", rawQuery);
    const qs = p.toString();
    return qs ? `/admin/partners?${qs}` : "/admin/partners";
  };

  return (
    <AdminShell title="Partners" active="partners">
      {/* Status filter */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["all", ...PARTNER_STATUSES] as const).map((s) => {
            const active = s === activeStatus;
            return (
              <Link
                key={s}
                href={href(s)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold border transition-colors ${
                  active
                    ? "bg-[#0A0F1E] text-white border-[#0A0F1E]"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                }`}
              >
                {s === "all" ? "All" : PARTNER_STATUS_META[s].label}
                <span className="ml-1.5 font-mono text-xs opacity-70">{s === "all" ? total : byStatus[s]}</span>
              </Link>
            );
          })}
        </div>

        <form method="get" action="/admin/partners" className="flex flex-wrap items-center gap-2">
          {activeStatus !== "all" && <input type="hidden" name="status" value={activeStatus} />}
          <select
            name="kind"
            defaultValue={activeKind}
            aria-label="Kind of business"
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="">Any kind</option>
            {PARTNER_KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              name="q"
              defaultValue={rawQuery}
              placeholder="Business, reference, email"
              className="w-56 rounded-full border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-slate-400"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-[#F59E0B] hover:bg-amber-500 text-slate-900 px-4 py-2 text-sm font-semibold transition-colors"
          >
            Filter
          </button>
        </form>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center">
          <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <h2 className="font-heading font-bold text-slate-900 text-lg">
            {total === 0 ? "No partner applications yet" : "Nothing matches this filter"}
          </h2>
          <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
            {total === 0
              ? "Applications submitted through /api/partner-apply land here for review."
              : "Clear the filters to see every application."}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
          <div className="hidden md:grid md:grid-cols-12 gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <div className="col-span-2">Received</div>
            <div className="col-span-2">Reference</div>
            <div className="col-span-3">Business</div>
            <div className="col-span-2">Location</div>
            <div className="col-span-1">Kind</div>
            <div className="col-span-2">Status</div>
          </div>
          <ul className="divide-y divide-slate-100">
            {rows.map((p) => (
              <li key={p.id} className="px-4 py-3 md:grid md:grid-cols-12 md:gap-3 md:items-center hover:bg-slate-50/60">
                <div className="md:col-span-2 text-sm text-slate-500">{formatLagos(p.created_at)}</div>
                <div className="md:col-span-2 font-mono text-sm font-semibold text-slate-900">{p.ref}</div>
                <div className="md:col-span-3">
                  <Link
                    href={`/admin/partners/${p.id}`}
                    className="text-sm font-semibold text-slate-900 hover:underline underline-offset-4"
                  >
                    {p.business_name}
                  </Link>
                  <div className="text-xs text-slate-500 truncate">{p.contact_name}</div>
                </div>
                <div className="md:col-span-2 text-sm text-slate-700">
                  {p.city}, {p.state}
                </div>
                <div className="md:col-span-1 text-xs text-slate-500">{kindLabel(p.kind)}</div>
                <div className="md:col-span-2 mt-1 md:mt-0">
                  <StatusChip status={p.status} />
                </div>
              </li>
            ))}
          </ul>
          {rows.length >= MAX_ROWS && (
            <p className="px-4 py-3 text-xs text-slate-500 border-t border-slate-100 bg-slate-50">
              Showing the newest {MAX_ROWS}. Narrow the filters to see older applications.
            </p>
          )}
        </div>
      )}
    </AdminShell>
  );
}
