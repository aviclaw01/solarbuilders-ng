import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import {
  BarChart3,
  Inbox,
  Lock,
  Route,
  ShieldCheck,
  ShoppingCart,
  Unlock,
} from "lucide-react";
import AdminNav from "@/components/ui/AdminNav";

/**
 * The admin home.
 *
 * /admin used to 404: the six sections existed but nothing sat at the root, so
 * the obvious URL to type was the one URL that did not work. This is the door.
 *
 * It also explains the two credential tiers, because "some of these pages give
 * me 403" is otherwise a mystery you have to read proxy.ts to solve.
 *
 * Auth is proxy.ts. Nothing here decides access — the headers it sets are read
 * only to decide what to SHOW, never what to allow.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin — SolarBuilders",
  robots: { index: false, follow: false },
};

interface Section {
  href: string;
  label: string;
  blurb: string;
  icon: React.ReactNode;
  senior?: boolean;
}

const SECTIONS: Section[] = [
  {
    href: "/admin/leads",
    label: "Leads",
    blurb: "Quote requests from the calculator, plus enquiries from the homepage modal and the contact form. Phone, WhatsApp and email on every row.",
    icon: <Inbox className="w-5 h-5" />,
  },
  {
    href: "/admin/orders",
    label: "Orders",
    blurb: "Order requests from the shop cart. Nothing is charged — these are 'confirm the price and come back to me'.",
    icon: <ShoppingCart className="w-5 h-5" />,
  },
  {
    href: "/admin/funnel",
    label: "Funnel",
    blurb: "What site_events is telling us. Event counts, not people — no visitor id is stored.",
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    href: "/admin/partners",
    label: "Partners",
    blurb: "The vetting queue. Approve, reject, request more, suspend, and confirm commission payments.",
    icon: <ShieldCheck className="w-5 h-5" />,
    senior: true,
  },
  {
    href: "/admin/routing",
    label: "Routing",
    blurb: "Offer a customer's job to one partner, with the engine's reasons shown. 24 hours to accept before it frees up.",
    icon: <Route className="w-5 h-5" />,
    senior: true,
  },
];

export default async function AdminHomePage() {
  const h = await headers();
  const isSuper = h.get("x-sb-role") === "superadmin";
  const superConfigured = h.get("x-sb-super-configured") === "1";

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-4xl mx-auto px-6 py-10">
        <AdminNav />

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
          <h1 className="font-heading font-extrabold text-slate-900 text-2xl">Admin</h1>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
              isSuper
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            {isSuper ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            Signed in as {isSuper ? "superadmin" : "admin"}
          </span>
        </div>
        <p className="text-slate-500 text-sm mb-8">Everything that runs the business, in one place.</p>

        <div className="grid sm:grid-cols-2 gap-3">
          {SECTIONS.map((s) => {
            const locked = Boolean(s.senior) && superConfigured && !isSuper;
            return (
              <Link
                key={s.href}
                href={s.href}
                className={`block border rounded-2xl p-4 transition-colors ${
                  locked
                    ? "border-slate-200 bg-slate-50 hover:border-slate-300"
                    : "border-slate-200 hover:border-amber-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={locked ? "text-slate-400" : "text-amber-500"}>{s.icon}</span>
                  <span className="font-heading font-bold text-slate-900">{s.label}</span>
                  {s.senior && (
                    <span
                      className={`ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                        locked
                          ? "bg-white border-slate-200 text-slate-500"
                          : "bg-emerald-50 border-emerald-200 text-emerald-800"
                      }`}
                    >
                      <Lock className="w-2.5 h-2.5" /> senior
                    </span>
                  )}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">{s.blurb}</p>
                {locked && (
                  <p className="text-slate-500 text-xs mt-2">
                    Your login cannot open this. Sign in with the senior credential.
                  </p>
                )}
              </Link>
            );
          })}
        </div>

        <TierExplainer isSuper={isSuper} superConfigured={superConfigured} />
      </main>
    </div>
  );
}

/**
 * Why there are two logins, in the place where the question comes up.
 */
function TierExplainer({ isSuper, superConfigured }: { isSuper: boolean; superConfigured: boolean }) {
  return (
    <section className="mt-10 border border-slate-200 rounded-2xl p-5">
      <h2 className="font-heading font-bold text-slate-900 mb-2">Why two logins</h2>
      <p className="text-slate-600 text-sm leading-relaxed">
        Reading leads and approving a partner are different kinds of act. A lead is our own data. Approving a partner
        publishes <b>our name beside theirs</b> — a customer reads that badge as us vouching for them — and the routing
        desk decides who gets paid work. So the surfaces that make public claims and move money sit behind a separate,
        senior credential, and the day-to-day leads login cannot reach them.
      </p>

      {!superConfigured ? (
        <p className="text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-sm mt-3">
          <b>Not in force.</b> <code className="font-mono">ADMIN_SUPER_USER</code> and{" "}
          <code className="font-mono">ADMIN_SUPER_PASSWORD</code> are unset, so the ordinary login currently opens
          everything. Set both in Vercel and redeploy to switch it on.
        </p>
      ) : isSuper ? (
        <p className="text-slate-600 text-sm leading-relaxed mt-3">
          You are on the senior credential, so everything above is open to you. The ordinary login still works for the
          leads, orders and funnel desks — useful if someone else ever chases leads for you.
        </p>
      ) : (
        <p className="text-slate-600 text-sm leading-relaxed mt-3">
          You are on the ordinary credential. Browsers cache HTTP logins per site, so you cannot simply switch user:
          open a private window, or put the credentials in the URL once —{" "}
          <code className="font-mono">https://user:pass@solarbuildersng.com/admin/partners</code>.
        </p>
      )}
    </section>
  );
}
