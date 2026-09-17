import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { AlertTriangle, Clock, ShieldCheck, UserCheck, UserX, PauseCircle, ArrowRight } from "lucide-react";
import AdminNav from "@/components/ui/AdminNav";
import {
  PARTNER_STATUSES,
  PARTNER_STATUS_META,
  type PartnerRow,
  type PartnerStatus,
} from "@/lib/partners";
import { listPartners, supabaseEnv, jobStatsByPartner } from "@/lib/partner-db";

/**
 * The partner desk: every application, newest first, with the ones that need a
 * decision at the top.
 *
 * Auth is HTTP Basic + the superadmin tier, enforced in proxy.ts for
 * /admin/* (see SUPER_ONLY_PATHS). There is no auth logic in this file, and
 * nothing here acts on the x-sb-* headers except to decide what to SHOW.
 *
 * No client JS: filters are links, every control is a plain form posting to a
 * server action in ./actions.ts.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Partners — SolarBuilders admin",
  robots: { index: false, follow: false },
};

/** The order a reviewer actually works in, not the order the statuses were defined. */
const QUEUE_ORDER: PartnerStatus[] = [
  "submitted",
  "under_review",
  "info_requested",
  "approved",
  "suspended",
  "rejected",
];

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

function isStatus(v: unknown): v is PartnerStatus {
  return typeof v === "string" && (PARTNER_STATUSES as readonly string[]).includes(v);
}

const LAGOS = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Lagos",
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : LAGOS.format(d);
}

/** Whole days between then and now. Negative (bad clock) reads as 0. */
function daysAgo(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}

export default async function AdminPartnersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const activeStatus: PartnerStatus | "all" = isStatus(sp.status) ? sp.status : "all";

  const h = await headers();
  const role = h.get("x-sb-role");
  const superConfigured = h.get("x-sb-super-configured") === "1";
  const actorName = h.get("x-sb-actor") ?? "admin";

  const configured = Boolean(supabaseEnv());
  const rows = configured ? await listPartners({ limit: 500 }) : [];
  const stats = configured ? await jobStatsByPartner() : new Map();

  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.status, (counts.get(r.status) ?? 0) + 1);

  const visible = activeStatus === "all" ? rows : rows.filter((r) => r.status === activeStatus);
  const needsDecision = rows.filter((r) => r.status === "submitted" || r.status === "under_review");

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <h1 className="font-heading text-2xl font-extrabold text-slate-900">Partners</h1>
            <p className="text-sm text-slate-500 mt-1">
              Signed in as <span className="font-medium text-slate-700">{actorName}</span>
              {role === "superadmin" ? " (superadmin)" : " (admin)"}.
            </p>
          </div>
          <Link
            href="/partners"
            className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
          >
            Public directory <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <AdminNav active="partners" />

        {!superConfigured && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900">
              <b>Approval is not separately protected on this deployment.</b> ADMIN_SUPER_USER and
              ADMIN_SUPER_PASSWORD are unset, so the everyday admin login can approve partners. Set both to put
              approval behind its own credential.
            </p>
          </div>
        )}

        {/* Summary strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Stat label="Need a decision" value={needsDecision.length} tone="amber" icon={<Clock className="w-4 h-4" />} />
          <Stat label="Approved" value={counts.get("approved") ?? 0} tone="emerald" icon={<UserCheck className="w-4 h-4" />} />
          <Stat label="Suspended" value={counts.get("suspended") ?? 0} tone="rose" icon={<PauseCircle className="w-4 h-4" />} />
          <Stat label="Rejected" value={counts.get("rejected") ?? 0} tone="slate" icon={<UserX className="w-4 h-4" />} />
        </div>

        {!configured && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            Supabase is not configured on this deployment, so the queue cannot be read. Applications submitted
            through the form were emailed to the team instead.
          </div>
        )}

        {/* Filters — plain links, so the page ships no client JS */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <FilterLink href="/admin/partners" active={activeStatus === "all"}>
            All <span className="text-slate-400">&nbsp;{rows.length}</span>
          </FilterLink>
          {QUEUE_ORDER.map((s) => (
            <FilterLink key={s} href={`/admin/partners?status=${s}`} active={activeStatus === s}>
              {PARTNER_STATUS_META[s].label} <span className="text-slate-400">&nbsp;{counts.get(s) ?? 0}</span>
            </FilterLink>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">
              {rows.length === 0 ? "No applications yet." : "Nothing in this state."}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {visible.map((r) => (
              <PartnerQueueRow key={r.id} row={r} openJobs={stats.get(r.id)?.openJobs ?? 0} />
            ))}
          </ul>
        )}

        <p className="text-xs text-slate-400 mt-8 leading-relaxed">
          Approving a partner publishes a badge on /partners/{`{slug}`} and emails them a private portal link. The
          badge states exactly which of the four checks were done — it never claims more than we looked at.
        </p>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: "amber" | "emerald" | "rose" | "slate";
  icon: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    amber: "text-amber-600",
    emerald: "text-emerald-600",
    rose: "text-rose-600",
    slate: "text-slate-500",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${tones[tone]}`}>
        {icon}
        {label}
      </div>
      <div className="font-heading text-2xl font-extrabold text-slate-900 mt-1">{value}</div>
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
        active
          ? "bg-[#0A0F1E] text-white border-[#0A0F1E]"
          : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
      }`}
    >
      {children}
    </Link>
  );
}

function PartnerQueueRow({
  row,
  openJobs,
}: {
  row: PartnerRow;
  openJobs: number;
}) {
  const meta = PARTNER_STATUS_META[(isStatus(row.status) ? row.status : "submitted") as PartnerStatus];
  const age = daysAgo(row.created_at);
  const checksDone = [row.check_cac, row.check_installs, row.check_references, row.check_warranty].filter(
    Boolean,
  ).length;

  return (
    <li>
      <Link
        href={`/admin/partners/${row.id}`}
        className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-400 transition-colors"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-heading font-bold text-slate-900 truncate">{row.business_name}</span>
              <span className={`text-xs font-medium border rounded-full px-2 py-0.5 ${meta.chip}`}>
                {meta.label}
              </span>
              {row.verified && (
                <span className="text-xs font-medium border rounded-full px-2 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-200">
                  verified · {checksDone}/4
                </span>
              )}
              {row.status === "approved" && !row.listed && (
                <span className="text-xs font-medium border rounded-full px-2 py-0.5 bg-slate-100 text-slate-600 border-slate-200">
                  unlisted
                </span>
              )}
            </div>
            <div className="text-sm text-slate-600 mt-1">
              {row.city}, {row.state} · {row.kind}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {row.ref} · applied {formatDate(row.created_at)}
              {age !== null && age > 2 && (
                <span className="text-amber-600 font-semibold"> · {age} days waiting</span>
              )}
            </div>
          </div>

          <div className="text-right text-xs text-slate-500 shrink-0">
            <div className="font-semibold text-slate-700">{row.verification_scope ?? "not verified"}</div>
            {openJobs > 0 && <div className="text-slate-400">{openJobs} open job{openJobs === 1 ? "" : "s"}</div>}
            {row.contact_name && <div className="text-slate-400">{row.contact_name}</div>}
          </div>
        </div>
      </Link>
    </li>
  );
}
