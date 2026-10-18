import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Globe, Mail, MessageCircle, Phone } from "lucide-react";
import PageHeader from "@/components/ui/AdminPageHeader";
import { getBrand } from "@/lib/brands";
import {
  OUTREACH_STATUSES,
  isOutreachStatus,
  isOutreachSlug,
  mailtoLink,
  outreachCopy,
  outreachTargets,
  waDigits,
  type OutreachRow,
} from "@/lib/brand-outreach";

/**
 * Supplier outreach desk — every brand and vendor we list, plus the prospects
 * we want to feature, the contacts we found for each, and where the
 * conversation stands.
 *
 * Listed brands come from lib/brands.ts (the catalogue); prospects, contacts
 * and status from Supabase `brand_outreach`. "Email" opens your mail app with the catalogue
 * request already written; nothing is sent from here. Auth is proxy.ts.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Suppliers — SolarBuilders admin",
  robots: { index: false, follow: false },
};

function supabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url.includes("your-project")) return null;
  return { url, key };
}

async function fetchRows(): Promise<OutreachRow[] | null> {
  const env = supabaseEnv();
  if (!env) return null;
  try {
    const res = await fetch(`${env.url}/rest/v1/brand_outreach?select=*`, {
      headers: { apikey: env.key, Authorization: `Bearer ${env.key}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[admin/suppliers] read failed:", res.status, (await res.text()).slice(0, 200));
      return null;
    }
    return (await res.json()) as OutreachRow[];
  } catch (err) {
    console.error("[admin/suppliers] read failed:", err);
    return null;
  }
}

async function updateOutreach(formData: FormData) {
  "use server";

  const slug = String(formData.get("slug") ?? "");
  const status = formData.get("status");
  const notes = String(formData.get("notes") ?? "").slice(0, 2000);
  if (!isOutreachSlug(slug) || !isOutreachStatus(status)) {
    console.error("[admin/suppliers] rejected update", slug, status);
    return;
  }
  const env = supabaseEnv();
  if (!env) return;

  const patch: Record<string, unknown> = { slug, status, notes: notes || null, updated_at: new Date().toISOString() };
  if (status === "emailed" && formData.get("was") !== "emailed") patch.contacted_at = new Date().toISOString();

  try {
    const res = await fetch(`${env.url}/rest/v1/brand_outreach?on_conflict=slug`, {
      method: "POST",
      headers: {
        apikey: env.key,
        Authorization: `Bearer ${env.key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(patch),
      cache: "no-store",
    });
    if (!res.ok) console.error("[admin/suppliers] upsert failed:", res.status, await res.text());
  } catch (err) {
    console.error("[admin/suppliers] upsert failed:", err);
  }
  revalidatePath("/admin/suppliers");
}

const STATUS_STYLE: Record<string, string> = {
  to_contact: "bg-slate-100 text-slate-700",
  emailed: "bg-sky-100 text-sky-800",
  replied: "bg-amber-100 text-amber-800",
  catalogue_in: "bg-violet-100 text-violet-800",
  deal: "bg-emerald-100 text-emerald-800",
  no_reply: "bg-rose-50 text-rose-700",
  declined: "bg-rose-100 text-rose-800",
};

export default async function SuppliersPage({ searchParams }: { searchParams: Promise<{ status?: string; group?: string }> }) {
  const { status: filter, group } = await searchParams;
  const rows = await fetchRows();
  const bySlug = new Map((rows ?? []).map((r) => [r.slug, r]));

  const everyone = outreachTargets(rows).map((t) => {
    const r = bySlug.get(t.slug);
    const listed = getBrand(t.slug);
    return {
      brand: t,
      row: r,
      origin: listed?.origin ?? t.category ?? "",
      status: r?.status ?? "to_contact",
      email: r?.email ?? null,
      phone: r?.phone ?? listed?.phones?.[0] ?? null,
      whatsapp: r?.whatsapp ?? listed?.whatsapp ?? null,
    };
  });
  const prospectCount = everyone.filter((x) => x.brand.prospect).length;
  const all = group === "new" ? everyone.filter((x) => x.brand.prospect) : group === "listed" ? everyone.filter((x) => !x.brand.prospect) : everyone;
  const counts = Object.fromEntries(OUTREACH_STATUSES.map((s) => [s, all.filter((x) => x.status === s).length]));
  const list = isOutreachStatus(filter) ? all.filter((x) => x.status === filter) : all;
  const groupQs = group === "new" || group === "listed" ? `group=${group}&` : "";

  return (
    <div>
      <PageHeader
        title="Suppliers"
        subtitle={`${everyone.length - prospectCount} brands and vendors we list, ${prospectCount} new ones we want to feature. Email opens your mail app with the message written; mark it emailed once sent.`}
      />

      {rows === null && (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Couldn&apos;t read brand_outreach from Supabase — showing catalogue contacts only; saves will not stick.
        </p>
      )}

      <div className="mb-2 flex flex-wrap gap-2 text-xs">
        {[
          ["", `Everyone ${everyone.length}`],
          ["listed", `Listed ${everyone.length - prospectCount}`],
          ["new", `New brands ${prospectCount}`],
        ].map(([g, label]) => (
          <Link
            key={g}
            href={g ? `/admin/suppliers?group=${g}` : "/admin/suppliers"}
            className={`rounded-full px-3 py-1.5 border font-semibold ${(group ?? "") === g || (!g && group !== "new" && group !== "listed") ? "bg-[#0E7568] text-white border-[#0E7568]" : "bg-white border-slate-200"}`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <Link href={`/admin/suppliers${groupQs ? `?${groupQs.slice(0, -1)}` : ""}`} className={`rounded-full px-3 py-1.5 border ${!isOutreachStatus(filter) ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200"}`}>
          All {all.length}
        </Link>
        {OUTREACH_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/suppliers?${groupQs}status=${s}`}
            className={`rounded-full px-3 py-1.5 border ${filter === s ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200"}`}
          >
            {s.replace("_", " ")} {counts[s]}
          </Link>
        ))}
      </div>

      <div className="space-y-2">
        {list.map(({ brand: b, row: r, origin, status, email, phone, whatsapp }) => {
          const socials = [
            ["Instagram", r?.instagram],
            ["LinkedIn", r?.linkedin],
            ["Facebook", r?.facebook],
            ["X", r?.x],
            ["Contact page", r?.contact_page],
          ].filter((s): s is [string, string] => !!s[1]);
          return (
            <div key={b.slug} className="rounded-2xl border border-slate-200 bg-white p-4 grid gap-3 lg:grid-cols-12">
              <div className="lg:col-span-3">
                <div className="flex items-center gap-2">
                  {b.prospect ? (
                    <span className="font-heading font-bold text-slate-900">{b.name}</span>
                  ) : (
                    <Link href={`/brands/${b.slug}`} className="font-heading font-bold text-slate-900 hover:underline">
                      {b.name}
                    </Link>
                  )}
                  {b.prospect && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">new</span>}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[status] ?? STATUS_STYLE.to_contact}`}>
                    {status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {b.kind}
                  {origin && ` · ${origin}`}
                  {r?.contacted_at && ` · emailed ${r.contacted_at.slice(0, 10)}`}
                </p>
                {r?.research_note && <p className="text-[11px] text-slate-500 mt-1">{r.research_note}</p>}
              </div>

              <div className="lg:col-span-5 flex flex-wrap items-start gap-1.5 text-xs">
                {email ? (
                  <a href={mailtoLink(email, b)} className="inline-flex items-center gap-1 rounded-full bg-slate-900 text-white px-3 py-1.5 font-semibold">
                    <Mail className="w-3.5 h-3.5" /> Email {email}
                  </a>
                ) : (
                  <span className="rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-slate-400">no email found</span>
                )}
                {whatsapp && (
                  <a
                    href={`https://wa.me/${waDigits(whatsapp)}?text=${encodeURIComponent(outreachCopy(b).dm)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-[#0E7568] text-white px-3 py-1.5 font-semibold"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                )}
                {phone && (
                  <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-slate-700">
                    <Phone className="w-3.5 h-3.5" /> {phone}
                  </a>
                )}
                {b.website && (
                  <a href={b.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-slate-700">
                    <Globe className="w-3.5 h-3.5" /> site
                  </a>
                )}
                {socials.map(([label, href]) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="rounded-full border border-slate-200 px-3 py-1.5 text-slate-700">
                    {label}
                  </a>
                ))}
              </div>

              <form action={updateOutreach} className="lg:col-span-4 flex flex-col gap-1.5">
                <input type="hidden" name="slug" value={b.slug} />
                <input type="hidden" name="was" value={status} />
                <div className="flex gap-1.5">
                  <select
                    name="status"
                    defaultValue={status}
                    aria-label={`Status for ${b.name}`}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                  >
                    {OUTREACH_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="rounded-lg bg-slate-900 hover:bg-slate-700 text-white px-3 py-1 text-xs font-semibold">
                    Save
                  </button>
                </div>
                <textarea
                  name="notes"
                  defaultValue={r?.notes ?? ""}
                  rows={2}
                  maxLength={2000}
                  placeholder="Who replied, their number, next step…"
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700"
                />
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
