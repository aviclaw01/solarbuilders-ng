import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { CheckCircle2, ExternalLink, Mail, MessageCircle, Phone, Send } from "lucide-react";
import PageHeader from "@/components/ui/AdminPageHeader";
import { BRANDS } from "@/lib/brands";
import { LEAD_EMAILS, SITE_NAME } from "@/lib/site";
import { defaultDraft, type DraftRow, type OutreachRow } from "@/lib/brand-outreach";

/**
 * Outreach mailer — the catalogue request to every brand, drafted and held
 * here until someone sends it.
 *
 * Each brand with a contact gets a draft: an email when we found an address,
 * otherwise a DM for its WhatsApp or social page. Nothing goes out on its own.
 * "Reveal" opens the draft to read and edit; Send emails it through Resend.
 * A DM cannot be sent from a server, so its button opens the chat or profile
 * with the text ready, and "Mark sent" records it.
 *
 * Drafts not yet touched are built from the template in lib/brand-outreach.ts
 * on every render; a row in `outreach_drafts` exists once one is edited or sent.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mailer — SolarBuilders admin",
  robots: { index: false, follow: false },
};

const FROM = `${SITE_NAME} <${LEAD_EMAILS[0]}>`;

function supabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url.includes("your-project")) return null;
  return { url, key };
}

async function rest<T>(path: string, init?: RequestInit): Promise<T | null> {
  const env = supabaseEnv();
  if (!env) return null;
  try {
    const res = await fetch(`${env.url}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: env.key,
        Authorization: `Bearer ${env.key}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[admin/mailer]", path, res.status, (await res.text()).slice(0, 200));
      return null;
    }
    // return=minimal writes answer with an empty body, on 200 as well as 201/204.
    const text = await res.text();
    return (text ? JSON.parse(text) : {}) as T;
  } catch (err) {
    console.error("[admin/mailer]", path, err);
    return null;
  }
}

const upsert = (table: string, row: Record<string, unknown>) =>
  rest(`${table}?on_conflict=slug`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ ...row, updated_at: new Date().toISOString() }),
  });

/** The submitted draft, checked against the catalogue. */
function readForm(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  if (!BRANDS.some((b) => b.slug === slug)) return null;
  return {
    slug,
    channel: String(formData.get("channel") ?? "email"),
    to_addr: String(formData.get("to_addr") ?? "").trim().slice(0, 300) || null,
    subject: String(formData.get("subject") ?? "").slice(0, 300) || null,
    body: String(formData.get("body") ?? "").slice(0, 10000),
  };
}

async function saveDraft(formData: FormData) {
  "use server";
  const d = readForm(formData);
  if (!d || !d.body) return;
  await upsert("outreach_drafts", { ...d, status: "draft", error: null });
  revalidatePath("/admin/mailer");
}

async function markContacted(slug: string) {
  const now = new Date().toISOString();
  await upsert("brand_outreach", { slug, status: "emailed", contacted_at: now });
}

async function sendDraft(formData: FormData) {
  "use server";
  const d = readForm(formData);
  if (!d || !d.body || d.channel !== "email" || !d.to_addr || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.to_addr)) return;

  const apiKey = process.env.RESEND_API_KEY;
  let error: string | null = apiKey ? null : "RESEND_API_KEY is not set";
  if (apiKey) {
    try {
      const { Resend } = await import("resend");
      const { error: err } = await new Resend(apiKey).emails.send({
        from: FROM,
        to: d.to_addr,
        replyTo: LEAD_EMAILS[0],
        subject: d.subject ?? "",
        text: d.body,
      });
      if (err) error = `${err.name}: ${err.message}`;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
  }

  if (error) {
    console.error("[admin/mailer] send failed:", d.slug, error);
    await upsert("outreach_drafts", { ...d, status: "failed", error: error.slice(0, 500) });
  } else {
    await upsert("outreach_drafts", { ...d, status: "sent", error: null, sent_at: new Date().toISOString() });
    await markContacted(d.slug);
  }
  revalidatePath("/admin/mailer");
  revalidatePath("/admin/suppliers");
}

async function markSent(formData: FormData) {
  "use server";
  const d = readForm(formData);
  if (!d || !d.body) return;
  await upsert("outreach_drafts", { ...d, status: "sent", error: null, sent_at: new Date().toISOString() });
  await markContacted(d.slug);
  revalidatePath("/admin/mailer");
  revalidatePath("/admin/suppliers");
}

/** Where a DM draft's button goes: the chat with the text in it, or the profile. */
function dmHref(d: DraftRow): string | null {
  if (!d.to_addr) return null;
  if (d.channel === "whatsapp") return `https://wa.me/${d.to_addr}?text=${encodeURIComponent(d.body)}`;
  if (d.channel === "phone") return `tel:${d.to_addr.replace(/[^\d+]/g, "")}`;
  return d.to_addr;
}

const CHANNEL_LABEL: Record<string, string> = {
  email: "Email",
  whatsapp: "WhatsApp",
  instagram: "Instagram DM",
  facebook: "Facebook message",
  linkedin: "LinkedIn message",
  x: "X DM",
  phone: "Call",
};

export default async function MailerPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const { show } = await searchParams;
  const [contacts, saved] = await Promise.all([
    rest<OutreachRow[]>("brand_outreach?select=*"),
    rest<DraftRow[]>("outreach_drafts?select=*"),
  ]);
  const contactBySlug = new Map((contacts ?? []).map((r) => [r.slug, r]));
  const savedBySlug = new Map((saved ?? []).map((r) => [r.slug, r]));

  const drafts = BRANDS.map((b) => {
    const c = contactBySlug.get(b.slug);
    const d = savedBySlug.get(b.slug) ?? (c ? defaultDraft(b.slug, b.name, c) : null);
    return d ? { brand: b, d } : null;
  }).filter((x): x is NonNullable<typeof x> => !!x);
  const noRoute = BRANDS.filter((b) => !drafts.some((x) => x.brand.slug === b.slug));

  const pending = drafts.filter((x) => x.d.status !== "sent");
  const sent = drafts.filter((x) => x.d.status === "sent");
  const list = show === "sent" ? sent : pending;

  return (
    <div>
      <PageHeader
        title="Mailer"
        subtitle={`Catalogue requests to the brands we list. Nothing is sent until you press Send. Emails go from ${LEAD_EMAILS[0]}; replies come back there.`}
      />

      {(contacts === null || saved === null) && (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Couldn&apos;t read the outreach tables from Supabase — drafts may be missing and saves will not stick.
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <Link href="/admin/mailer" className={`rounded-full px-3 py-1.5 border ${show !== "sent" ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200"}`}>
          To send {pending.length}
        </Link>
        <Link href="/admin/mailer?show=sent" className={`rounded-full px-3 py-1.5 border ${show === "sent" ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200"}`}>
          Sent {sent.length}
        </Link>
      </div>

      <div className="space-y-2">
        {list.map(({ brand: b, d }) => {
          const isEmail = d.channel === "email";
          const href = isEmail ? null : dmHref(d);
          return (
            <details key={b.slug} className="group rounded-2xl border border-slate-200 bg-white">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 p-4">
                {isEmail ? <Mail className="w-4 h-4 text-slate-500" /> : d.channel === "phone" ? <Phone className="w-4 h-4 text-slate-500" /> : <MessageCircle className="w-4 h-4 text-slate-500" />}
                <span className="font-heading font-bold text-slate-900">{b.name}</span>
                <span className="text-xs text-slate-500">
                  {CHANNEL_LABEL[d.channel] ?? d.channel} · {d.to_addr}
                </span>
                {d.status === "failed" && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800">failed</span>}
                {d.status === "sent" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                    <CheckCircle2 className="w-3 h-3" /> sent {d.sent_at?.slice(0, 10)}
                  </span>
                )}
                <span className="ml-auto text-xs font-semibold text-slate-500 group-open:hidden">Reveal</span>
                <span className="ml-auto hidden text-xs font-semibold text-slate-500 group-open:inline">Hide</span>
              </summary>

              <form className="space-y-2 border-t border-slate-100 p-4">
                <input type="hidden" name="slug" value={b.slug} />
                <input type="hidden" name="channel" value={d.channel} />
                {d.error && <p className="rounded-lg bg-rose-50 p-2 text-xs text-rose-800">Last send failed: {d.error}</p>}
                <label className="block text-xs font-semibold text-slate-600">
                  To
                  <input name="to_addr" defaultValue={d.to_addr ?? ""} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800" />
                </label>
                {isEmail && (
                  <label className="block text-xs font-semibold text-slate-600">
                    Subject
                    <input name="subject" defaultValue={d.subject ?? ""} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800" />
                  </label>
                )}
                <label className="block text-xs font-semibold text-slate-600">
                  Message
                  <textarea name="body" defaultValue={d.body} rows={isEmail ? 14 : 5} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800" />
                </label>
                <div className="flex flex-wrap gap-2">
                  {isEmail ? (
                    <button formAction={sendDraft} className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 hover:bg-slate-700 px-4 py-2 text-sm font-semibold text-white">
                      <Send className="w-4 h-4" /> {d.status === "sent" ? "Send again" : "Send"}
                    </button>
                  ) : (
                    <>
                      {href && (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#0E7568] hover:bg-[#075E54] px-4 py-2 text-sm font-semibold text-white">
                          <ExternalLink className="w-4 h-4" /> Open {CHANNEL_LABEL[d.channel]}
                        </a>
                      )}
                      <button formAction={markSent} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-slate-900">
                        Mark sent
                      </button>
                    </>
                  )}
                  <button formAction={saveDraft} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-slate-400">
                    Save edits
                  </button>
                </div>
                {!isEmail && d.channel !== "whatsapp" && (
                  <p className="text-[11px] text-slate-500">Copy the message above, open the profile, and paste it as a DM.</p>
                )}
              </form>
            </details>
          );
        })}
        {list.length === 0 && <p className="text-sm text-slate-500">Nothing here.</p>}
      </div>

      {noRoute.length > 0 && show !== "sent" && (
        <p className="mt-6 text-xs text-slate-500">
          No contact route found yet: {noRoute.map((b) => b.name).join(", ")}.
        </p>
      )}
    </div>
  );
}
