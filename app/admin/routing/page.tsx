import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock,
  Inbox,
  MapPin,
  Route,
  ShieldCheck,
  Undo2,
  Zap,
} from "lucide-react";
import { formatNaira } from "@/lib/quote";
import {
  dbGetChecked,
  supabaseEnv,
  routingCandidates,
  type DbResult,
} from "@/lib/partner-db";
import { capabilityFrom, commissionRateOf, type PartnerJobRow } from "@/lib/partners";
import {
  commissionAmount,
  guessCity,
  guessState,
  isOfferExpired,
  rankPartners,
  sizeBucketFromText,
  OFFER_WINDOW_HOURS,
  type PartnerVerdict,
  type RequestProfile,
} from "@/lib/routing";
import { autoRouteJob, offerJob, releaseOffer } from "./actions";

/**
 * The routing desk — where a customer request becomes an offer to one partner.
 *
 * Auth: proxy.ts, superadmin tier. Nothing in this file decides access.
 *
 * Data: PostgREST with the service-role key, same plain-fetch pattern as the
 * other admin pages. Server component, no client JS: filters are links and
 * every action is a plain form posting to a server action in ./actions.ts.
 *
 * The rules this page has to make visible, not just obey (PARTNER-PIPELINE.md):
 *   L9  — a job is OFFERED to one partner, never broadcast. One live job per
 *         request, enforced by a partial unique index in Postgres. An offer
 *         expires after 24h and frees the request.
 *   L5  — a partner with commission outstanding gets no new work.
 *   L10 — availability is derived (open jobs vs cap, confirmation freshness),
 *         not just self-declared.
 *   L15 — the engine's reasons are printed. A partner who was skipped shows
 *         WHY they were skipped, so a bad match is visible rather than silent.
 *
 * This page never decides eligibility itself. It renders what lib/routing.ts
 * says, and the server action re-scores independently before it writes — so a
 * stale page cannot offer work to a partner who has since been blocked.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Routing — SolarBuilders admin",
  robots: { index: false, follow: false },
};

const QUEUE_LIMIT = 60;

type Source = "quote_request" | "order_request";

interface RequestRow {
  id: number;
  created_at: string;
  reference: string | null;
  quote_code: string | null;
  name: string | null;
  phone: string | null;
  location: string | null;
  note: string | null;
  summary: string | null;
  total_best: number | null;
  item_count: number | null;
  needs_install: boolean | null;
  status: string | null;
}

interface QueueItem {
  source: Source;
  req: RequestRow;
  /** Offers already made on this request that no longer block a new one. */
  history: PartnerJobRow[];
}

// ─────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────

/**
 * A job that stops this request being offered again (L9).
 *
 * This must match liveJobFor() in ./actions.ts exactly — ANY `offered` row
 * blocks, expiry included. The page used to ignore expired offers, so it would
 * list a request as routable that offerJob then refused, and offerJob reports
 * nothing back: the admin clicked Offer and watched nothing happen.
 *
 * Ignoring expiry here is safe because routingCandidates() runs
 * expireStaleOffers() before this is called, which flips a lapsed offer out of
 * `offered` — so a genuinely expired offer has already stopped blocking.
 */
function blocksRouting(job: PartnerJobRow): boolean {
  return job.status === "accepted" || job.status === "completed" || job.status === "offered";
}

function key(source: string, id: number): string {
  return `${source}:${id}`;
}

async function loadQueue(now: Date): Promise<
  | { ok: true; items: QueueItem[]; live: Map<string, PartnerJobRow> }
  | { ok: false; detail: string }
> {
  const common = { order: "created_at.desc", limit: String(QUEUE_LIMIT) };

  const [quotes, orders, jobs] = await Promise.all([
    dbGetChecked<RequestRow>("quote_requests", {
      select: "id,created_at,quote_code,name,phone,location,note,summary,total_best,status",
      ...common,
    }),
    dbGetChecked<RequestRow>("order_requests", {
      select: "id,created_at,reference,quote_code,name,phone,location,note,total_best,item_count,needs_install,status",
      ...common,
    }),
    dbGetChecked<PartnerJobRow>("partner_jobs", { select: "*", order: "created_at.desc", limit: "2000" }),
  ]);

  const failed = ([quotes, orders, jobs] as DbResult<unknown>[]).find((r) => !r.ok);
  if (failed && !failed.ok) {
    return {
      ok: false,
      detail:
        failed.status === 0
          ? "Supabase is not configured on this deployment."
          : `Supabase answered HTTP ${failed.status}. Check that partner_jobs exists (supabase/partners.sql).`,
    };
  }
  if (!quotes.ok || !orders.ok || !jobs.ok) return { ok: false, detail: "Could not read the routing tables." };

  const byRequest = new Map<string, PartnerJobRow[]>();
  for (const job of jobs.data) {
    const k = key(job.source, job.source_id);
    byRequest.set(k, [...(byRequest.get(k) ?? []), job]);
  }

  const live = new Map<string, PartnerJobRow>();
  for (const [k, list] of byRequest) {
    const blocking = list.find(blocksRouting);
    if (blocking) live.set(k, blocking);
  }

  const items: QueueItem[] = [];
  for (const [source, rows] of [
    ["quote_request", quotes.data],
    ["order_request", orders.data],
  ] as const) {
    for (const req of rows) {
      const k = key(source, req.id);
      if (live.has(k)) continue; // already with a partner
      if (req.status === "lost") continue; // written off by the leads desk
      items.push({ source, req, history: byRequest.get(k) ?? [] });
    }
  }

  items.sort((a, b) => b.req.created_at.localeCompare(a.req.created_at));
  return { ok: true, items, live };
}

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

/** Mirrors actions.ts profileFor — the page must score what the action scores. */
function profileFor(item: QueueItem, now: Date): RequestProfile {
  const text = [item.req.summary, item.req.note].filter(Boolean).join("\n");
  return {
    state: guessState(item.req.location) ?? "",
    city: guessCity(item.req.location),
    services: ["full_install"],
    systemSize: sizeBucketFromText(text),
    needsInstall: item.req.needs_install !== false,
    now,
  };
}

/** Time remaining until a future instant. `ago` only ever looks backwards. */
function until(iso: string, now: Date): string {
  const hours = (new Date(iso).getTime() - now.getTime()) / 3_600_000;
  if (!Number.isFinite(hours) || hours <= 0) return "expired";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m left`;
  return `${Math.round(hours)}h left`;
}

function ago(iso: string, now: Date): string {
  const hours = (now.getTime() - new Date(iso).getTime()) / 3_600_000;
  if (!Number.isFinite(hours) || hours < 0) return "just now";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m ago`;
  if (hours < 48) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function label(item: QueueItem): string {
  if (item.source === "order_request") {
    const n = item.req.item_count ?? 0;
    return `${item.req.reference ?? `Order #${item.req.id}`}${n ? ` · ${n} item${n === 1 ? "" : "s"}` : ""}`;
  }
  return item.req.quote_code ?? `Quote #${item.req.id}`;
}

function Empty({ icon: Icon, title, children }: { icon: typeof Inbox; title: string; children: React.ReactNode }) {
  return (
    <div className="border border-slate-200 rounded-3xl p-10 text-center">
      <Icon className="w-10 h-10 text-slate-300 mx-auto mb-4" aria-hidden="true" />
      <h2 className="font-heading font-bold text-slate-900 text-lg mb-2">{title}</h2>
      <div className="text-slate-600 text-sm leading-relaxed max-w-md mx-auto">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────

type Props = { searchParams: Promise<{ source?: string; id?: string }> };

export default async function RoutingPage({ searchParams }: Props) {
  const { source: sourceParam, id: idParam } = await searchParams;
  const now = new Date();

  if (!supabaseEnv()) {
    return (
      <Shell>
        <Empty icon={AlertTriangle} title="Supabase is not configured">
          Set <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> on this deployment and redeploy. Routing reads and
          writes live data — there is nothing to show without it.
        </Empty>
      </Shell>
    );
  }

  const queue = await loadQueue(now);
  if (!queue.ok) {
    return (
      <Shell>
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h2 className="font-heading font-bold text-rose-900 text-lg">Could not load the routing queue</h2>
            <p className="text-rose-800 text-sm mt-1">{queue.detail}</p>
            <p className="text-rose-800 text-sm mt-2">
              This is a read failure, not an empty queue — no request has been skipped, and nothing has been offered.
            </p>
          </div>
        </div>
      </Shell>
    );
  }

  // The pool is fetched once and scored per request. routingCandidates() also
  // expires stale offers as a side effect, which is what frees a request whose
  // 24h window closed (L9).
  const { candidates, releasedOffers } = await routingCandidates(now);
  const capabilities = candidates.map((c) => capabilityFrom(c.partner, c.stats));
  // Each partner's own agreed rate. A flat default here silently offered every
  // job at 5%, so a partner on a negotiated 10% was under-charged unless the
  // admin retyped the box — L6's "our figure", computed from the wrong number.
  const rateByPartner = new Map(candidates.map((c) => [c.partner.id, commissionRateOf(c.partner)]));

  const selectedSource: Source | null =
    sourceParam === "quote_request" || sourceParam === "order_request" ? sourceParam : null;
  const selectedId = Number(idParam);
  const selected =
    selectedSource && Number.isInteger(selectedId)
      ? queue.items.find((i) => i.source === selectedSource && i.req.id === selectedId) ?? null
      : null;

  const verdicts: PartnerVerdict[] = selected ? rankPartners(capabilities, profileFor(selected, now)) : [];
  const eligible = verdicts.filter((v) => v.eligible);
  const blocked = verdicts.filter((v) => !v.eligible);

  return (
    <Shell>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
        <h1 className="font-heading font-extrabold text-slate-900 text-2xl">Routing</h1>
        <p className="text-slate-500 text-sm">
          {queue.items.length} request{queue.items.length === 1 ? "" : "s"} waiting · {candidates.length} partner
          {candidates.length === 1 ? "" : "s"} in the pool
        </p>
      </div>
      <p className="text-slate-500 text-sm mb-6 max-w-2xl leading-relaxed">
        A job is offered to <b>one</b> partner and holds the request for {OFFER_WINDOW_HOURS} hours. If they do not
        answer, it expires and the request comes back here. Nothing is broadcast.
      </p>

      {releasedOffers > 0 && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-6 flex gap-2">
          <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            {releasedOffers} offer{releasedOffers === 1 ? "" : "s"} passed the {OFFER_WINDOW_HOURS}-hour window and{" "}
            {releasedOffers === 1 ? "was" : "were"} released just now. Those requests are back in the queue below.
          </span>
        </p>
      )}

      {candidates.length === 0 && (
        <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 mb-6 flex gap-2">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-400" aria-hidden="true" />
          <span>
            No partners are in the routing pool. A partner enters it once they are <b>approved</b>, <b>verified</b> and{" "}
            <b>listed</b> — check{" "}
            <Link href="/admin/partners" className="underline underline-offset-4">
              the partner queue
            </Link>
            . Until then nothing can be routed.
          </span>
        </p>
      )}

      {!selected && queue.live.size > 0 && <LiveOffers live={queue.live} now={now} />}

      {selected ? (
        <Selected item={selected} eligible={eligible} blocked={blocked} now={now} rateByPartner={rateByPartner} />
      ) : queue.items.length === 0 ? (
        <Empty icon={CheckCircle2} title="Nothing waiting to be routed">
          Every quote and order request either has a partner on it or was closed. New requests appear here as they come
          in.
        </Empty>
      ) : (
        <ul className="space-y-2">
          {queue.items.map((item) => (
            <li key={key(item.source, item.req.id)}>
              <Link
                href={`/admin/routing?source=${item.source}&id=${item.req.id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 border border-slate-200 rounded-2xl px-4 py-3 hover:border-amber-300 transition-colors"
              >
                <span className="font-mono text-sm font-semibold text-slate-900">{label(item)}</span>
                <span className="text-slate-500 text-sm inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                  {item.req.location || "location not given"}
                </span>
                {item.req.total_best ? (
                  <span className="text-slate-700 text-sm font-semibold">{formatNaira(item.req.total_best)}</span>
                ) : null}
                <span className="text-slate-400 text-xs">{ago(item.req.created_at, now)}</span>
                {item.history.length > 0 && (
                  <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                    needs re-route
                  </span>
                )}
                <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}

/**
 * Requests currently held by a partner. They are not in the queue above — one
 * live job per request is the whole point of L9 — but the desk still needs to
 * see them, and needs a way to pull an unanswered offer back before its window
 * closes rather than waiting out the full 24 hours.
 */
function LiveOffers({ live, now }: { live: Map<string, PartnerJobRow>; now: Date }) {
  const jobs = [...live.values()].sort((a, b) => (b.offered_at ?? "").localeCompare(a.offered_at ?? ""));

  return (
    <details className="border border-slate-200 rounded-3xl px-5 py-4 mb-6">
      <summary className="font-heading font-bold text-slate-900 text-sm cursor-pointer">
        {jobs.length} request{jobs.length === 1 ? "" : "s"} currently with a partner
      </summary>
      <ul className="mt-3 space-y-2">
        {jobs.map((job) => (
          <li key={job.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm border-t border-slate-100 pt-2">
            <span className="font-mono font-semibold text-slate-900">{job.reference}</span>
            <span className="text-slate-600">{job.title}</span>
            <span
              className={`text-xs rounded-full px-2 py-0.5 border ${
                job.status === "offered"
                  ? "text-amber-800 bg-amber-50 border-amber-200"
                  : "text-emerald-800 bg-emerald-50 border-emerald-200"
              }`}
            >
              {job.status}
            </span>
            {job.status === "offered" && job.offer_expires_at && (
              <span className="text-slate-400 text-xs">{until(job.offer_expires_at, now)}</span>
            )}
            {job.status === "offered" && (
              <form action={releaseOffer} className="ml-auto">
                <input type="hidden" name="job_id" value={job.id} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-400 rounded-full px-3 py-1 text-xs font-semibold transition-colors"
                >
                  <Undo2 className="w-3 h-3" aria-hidden="true" /> Pull it back
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
      <p className="text-slate-400 text-xs mt-3">
        Pulling an offer back marks it expired and returns the request to the queue. Only an unanswered offer can be
        pulled — once a partner has accepted, the job is theirs.
      </p>
    </details>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>{children}</>
  );
}

// ─────────────────────────────────────────────────────────
// ONE REQUEST
// ─────────────────────────────────────────────────────────

function Selected({
  item,
  eligible,
  blocked,
  now,
  rateByPartner,
}: {
  item: QueueItem;
  eligible: PartnerVerdict[];
  blocked: PartnerVerdict[];
  now: Date;
  rateByPartner: Map<number, number>;
}) {
  const { req } = item;
  // Shown as a guide only; the figure that counts is per-partner, below.
  const topRate = eligible.length > 0 ? (rateByPartner.get(eligible[0].partnerId) ?? 5) : 5;
  const estimate = commissionAmount({ budgetBest: req.total_best, installFee: null, ratePercent: topRate });

  return (
    <div>
      <Link href="/admin/routing" className="text-slate-500 text-sm hover:text-slate-900 underline-offset-4 hover:underline">
        ← the whole queue
      </Link>

      <div className="border border-slate-200 rounded-3xl p-5 mt-4 mb-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="font-heading font-bold text-slate-900 text-lg font-mono">{label(item)}</h2>
          <span className="text-slate-400 text-xs">{ago(req.created_at, now)}</span>
        </div>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-1 mt-3 text-sm">
          <Field label="Customer">{req.name || "—"}</Field>
          <Field label="Location">{req.location || "not given"}</Field>
          <Field label="Their figure">{req.total_best ? formatNaira(req.total_best) : "—"}</Field>
          <Field label={`Commission at ${topRate}%`}>{estimate ? formatNaira(estimate) : "—"}</Field>
        </dl>
        {req.note && <p className="text-slate-600 text-sm mt-3 whitespace-pre-wrap">{req.note}</p>}
        <p className="text-slate-400 text-xs mt-3">
          The customer&apos;s number is not shown here. It travels with the job to the partner who accepts it (L8a).
        </p>
      </div>

      {item.history.length > 0 && (
        <div className="border border-amber-200 bg-amber-50 rounded-3xl p-5 mb-6">
          <h3 className="font-heading font-bold text-amber-900 text-sm mb-2 flex items-center gap-2">
            <Undo2 className="w-4 h-4" aria-hidden="true" /> Already been offered
          </h3>
          <ul className="space-y-1 text-sm text-amber-900">
            {item.history.map((j) => (
              <li key={j.id}>
                <span className="font-mono">{j.reference}</span> — {j.status}
                {j.decline_reason ? <> · &ldquo;{j.decline_reason}&rdquo;</> : null}
              </li>
            ))}
          </ul>
          <p className="text-amber-800 text-xs mt-2">
            A decline is information: if the same reason keeps coming back, the match rule is wrong, not the partner.
          </p>
        </div>
      )}

      {eligible.length === 0 ? (
        <Empty icon={Ban} title="No partner can take this right now">
          {blocked.length === 0 ? (
            <>Nobody is in the routing pool at all, so there is nothing to rank. Approve and list a partner first.</>
          ) : (
            <>
              All {blocked.length} partner{blocked.length === 1 ? "" : "s"} in the pool are blocked for this request —
              each reason is listed below. Routing refuses rather than offering work to someone who cannot take it.
            </>
          )}
        </Empty>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h3 className="font-heading font-bold text-slate-900">
              {eligible.length} partner{eligible.length === 1 ? "" : "s"} can take this
            </h3>
            <form action={autoRouteJob}>
              <input type="hidden" name="source" value={item.source} />
              <input type="hidden" name="source_id" value={req.id} />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full px-4 py-2 text-sm font-heading font-semibold transition-colors"
              >
                <Zap className="w-3.5 h-3.5" aria-hidden="true" /> Offer to the top match
              </button>
            </form>
          </div>

          <ul className="space-y-3 mb-8">
            {eligible.map((v, i) => (
              <li key={v.partnerId} className="border border-slate-200 rounded-2xl p-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-heading font-bold text-slate-900">{v.name}</span>
                  {i === 0 && (
                    <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                      top match
                    </span>
                  )}
                  <span className="text-slate-400 text-xs">score {v.score}</span>
                </div>
                {v.reasons.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {v.reasons.map((r) => (
                      <li key={r} className="text-slate-600 text-sm flex gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        {r}
                      </li>
                    ))}
                  </ul>
                )}
                <form action={offerJob} className="flex flex-wrap items-end gap-2 mt-3">
                  <input type="hidden" name="source" value={item.source} />
                  <input type="hidden" name="source_id" value={req.id} />
                  <input type="hidden" name="partner_id" value={v.partnerId} />
                  <label className="text-xs text-slate-500">
                    Commission %
                    <input
                      type="number"
                      name="commission_rate"
                      defaultValue={rateByPartner.get(v.partnerId) ?? 5}
                      min={0}
                      max={25}
                      step={0.5}
                      className="block w-24 rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-900 mt-0.5"
                    />
                  </label>
                  <label className="text-xs text-slate-500">
                    Install fee (optional)
                    <input
                      type="number"
                      name="install_fee"
                      min={0}
                      step={1000}
                      placeholder="₦"
                      className="block w-36 rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-900 mt-0.5"
                    />
                  </label>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 border border-slate-300 hover:border-slate-900 text-slate-800 rounded-full px-4 py-2 text-sm font-heading font-semibold transition-colors"
                  >
                    Offer to {v.name.split(" ")[0]} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </>
      )}

      {blocked.length > 0 && (
        <div>
          <h3 className="font-heading font-bold text-slate-900 mb-1">
            {blocked.length} partner{blocked.length === 1 ? "" : "s"} skipped
          </h3>
          <p className="text-slate-500 text-sm mb-3">
            Printed so a bad match is visible rather than silent (L15).
          </p>
          <ul className="space-y-2">
            {blocked.map((v) => (
              <li key={v.partnerId} className="border border-slate-100 bg-slate-50 rounded-2xl px-4 py-3">
                <span className="font-heading font-semibold text-slate-700 text-sm">{v.name}</span>
                <ul className="mt-1 space-y-0.5">
                  {v.blockers.map((b) => (
                    <li key={b} className="text-slate-600 text-sm flex gap-1.5">
                      <Ban className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      {b}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="text-slate-500 flex-shrink-0">{label}:</dt>
      <dd className="text-slate-900 font-medium">{children}</dd>
    </div>
  );
}
