import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { dbGetChecked, routingCandidates, supabaseEnv } from "@/lib/partner-db";
import { NIGERIAN_STATES, SERVICE_TYPES, SYSTEM_SIZES, capabilityFrom } from "@/lib/partners";
import { guessCity, guessState, rankPartners, sizeBucketFromText } from "@/lib/routing";
import { AdminShell, Card, ConfigError, formatLagos } from "@/components/admin/PartnerAdmin";

/**
 * Job routing — which verified partners could take a customer job, ranked, with
 * the reasons and the blockers spelled out by lib/routing.ts.
 *
 * Read-only by design. Offers are made to the partner directly (phone/WhatsApp)
 * until the partner portal exists; recording offers, acceptance and commission
 * arrives with it. The one write this page can cause is lib/partner-db.ts
 * releasing offers whose 24-hour window has already passed.
 *
 * Auth: superadmin, enforced in proxy.ts. No server actions on this page.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Job routing (admin)",
  robots: { index: false, follow: false },
};

interface Lead {
  id: number;
  created_at: string;
  quote_code: string | null;
  name: string | null;
  location: string | null;
  tier: string | null;
  summary: string | null;
  status: string | null;
}

interface PageProps {
  searchParams: Promise<{ lead?: string; state?: string; city?: string; size?: string; service?: string }>;
}

const INPUT =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400";

export default async function AdminRoutingPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  if (!supabaseEnv()) {
    return (
      <AdminShell title="Job routing" active="routing">
        <ConfigError what="env" table="partners" />
      </AdminShell>
    );
  }

  const leadsRes = await dbGetChecked<Lead>("quote_requests", {
    select: "id,created_at,quote_code,name,location,tier,summary,status",
    status: "in.(new,contacted,quoted)",
    order: "created_at.desc",
    limit: "50",
  });
  const leads = leadsRes.ok ? leadsRes.data : [];

  const leadId = Number(sp.lead);
  const lead = Number.isInteger(leadId) ? leads.find((l) => l.id === leadId) ?? null : null;

  // Explicit form values win; otherwise read them off the selected lead.
  const state =
    (NIGERIAN_STATES as readonly string[]).find((s) => s === sp.state) ?? (lead ? guessState(lead.location) : null);
  const city = (sp.city ?? "").trim().slice(0, 40) || (lead ? guessCity(lead.location) : null);
  const size =
    sp.size === "any"
      ? null
      : ((SYSTEM_SIZES as readonly string[]).find((s) => s === sp.size) ?? (lead ? sizeBucketFromText(lead.summary) : null));
  const service = SERVICE_TYPES.find((s) => s.id === sp.service)?.id ?? "full_install";

  let ranked: ReturnType<typeof rankPartners> = [];
  let releasedOffers = 0;
  let poolSize = 0;
  if (state) {
    const now = new Date();
    const pool = await routingCandidates(now, { ignoreListed: true });
    releasedOffers = pool.releasedOffers;
    poolSize = pool.candidates.length;
    ranked = rankPartners(
      pool.candidates.map((c) => capabilityFrom(c.partner, c.stats)),
      { state, city, services: [service], systemSize: size, needsInstall: service === "full_install", now },
    );
  }
  const eligible = ranked.filter((r) => r.eligible);

  return (
    <AdminShell title="Job routing" active="routing">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <Card title="Open quote requests">
            {!leadsRes.ok ? (
              <p className="text-sm text-rose-700">Could not read quote_requests. See the server logs.</p>
            ) : leads.length === 0 ? (
              <p className="text-sm text-slate-500">No new, contacted or quoted requests.</p>
            ) : (
              <ul className="divide-y divide-slate-100 max-h-[32rem] overflow-y-auto">
                {leads.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/admin/routing?lead=${l.id}`}
                      className={`block py-2 px-2 rounded-lg text-sm ${
                        l.id === lead?.id ? "bg-amber-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <span className="font-mono font-semibold text-slate-900">{l.quote_code || `#${l.id}`}</span>
                      <span className="text-slate-500"> · {formatLagos(l.created_at)}</span>
                      <span className="block text-slate-700">{l.location || "no location"}</span>
                      {l.tier && <span className="block text-xs text-slate-500 capitalize">{l.tier}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card title="Job to place">
            <form method="get" action="/admin/routing" className="grid gap-3 sm:grid-cols-2">
              {lead && <input type="hidden" name="lead" value={lead.id} />}
              <label className="block text-sm text-slate-500">
                State
                <select name="state" defaultValue={state ?? ""} className={`${INPUT} mt-1`}>
                  <option value="">Choose a state</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-500">
                Town or area
                <input name="city" defaultValue={city ?? ""} className={`${INPUT} mt-1`} />
              </label>
              <label className="block text-sm text-slate-500">
                System size
                <select name="size" defaultValue={size ?? "any"} className={`${INPUT} mt-1`}>
                  <option value="any">Any size</option>
                  {SYSTEM_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-500">
                Service needed
                <select name="service" defaultValue={service} className={`${INPUT} mt-1`}>
                  {SERVICE_TYPES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="sm:col-span-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="rounded-full bg-[#F59E0B] hover:bg-amber-500 text-slate-900 px-4 py-2 text-sm font-semibold"
                >
                  Rank partners
                </button>
                {lead && (
                  <span className="text-xs text-slate-500">
                    Pre-filled from {lead.quote_code || `request #${lead.id}`}
                    {lead.location ? ` (“${lead.location}”)` : ""}. Correct anything the guess got wrong.
                  </span>
                )}
              </div>
            </form>
          </Card>

          {!state ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-sm text-slate-500">
              {lead
                ? "Could not tell the state from this request's location. Choose it above."
                : "Pick a quote request, or choose a state, to see who could take the job."}
            </div>
          ) : (
            <Card title={`Ranking for ${state}${city ? `, ${city}` : ""}`}>
              <p className="text-sm text-slate-500 mb-3">
                {poolSize === 0
                  ? "No approved, verified partners yet, so there is nobody to rank."
                  : `${eligible.length} of ${poolSize} verified partner${poolSize === 1 ? "" : "s"} eligible.`}
                {releasedOffers > 0 && ` Released ${releasedOffers} expired offer${releasedOffers === 1 ? "" : "s"}.`}{" "}
                Contact the partner directly to offer the job; offers are not recorded here yet.
              </p>
              {ranked.length > 0 && (
                <ol className="divide-y divide-slate-100">
                  {ranked.map((r, i) => (
                    <li key={r.partnerId} className="py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-slate-500">{i + 1}.</span>
                        {r.eligible ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-label="Eligible" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600" aria-label="Not eligible" />
                        )}
                        <Link
                          href={`/admin/partners/${r.partnerId}`}
                          className="font-semibold text-slate-900 hover:underline underline-offset-4"
                        >
                          {r.name}
                        </Link>
                        {r.eligible && <span className="text-xs font-semibold text-emerald-700">score {r.score}</span>}
                      </div>
                      {r.blockers.length > 0 && (
                        <ul className="mt-1 ml-6 text-sm text-rose-700 list-disc list-inside">
                          {r.blockers.map((b) => (
                            <li key={b}>{b}</li>
                          ))}
                        </ul>
                      )}
                      {r.reasons.length > 0 && (
                        <p className="mt-1 ml-6 text-xs text-slate-500">{r.reasons.join(" · ")}</p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
