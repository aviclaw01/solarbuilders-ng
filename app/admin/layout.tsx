import type { Metadata } from "next";
import { headers } from "next/headers";
import AdminSidebar from "@/components/ui/AdminSidebar";

/**
 * The admin shell.
 *
 * Every page used to bring its own chrome — its own min-h-screen, its own
 * max-width, its own background, and its own <AdminNav active="…">. They had
 * drifted: three different backgrounds and four different max-widths across
 * six pages, and adding a section meant editing every one of them.
 *
 * The shell now owns the frame and the nav; pages render only their content.
 *
 * Auth is proxy.ts, which runs before this. The role headers it sets are read
 * here only to decide what the nav SHOWS — never what is allowed.
 */

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const role = h.get("x-sb-role") === "superadmin" ? "superadmin" : "admin";
  const superConfigured = h.get("x-sb-super-configured") === "1";

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <AdminSidebar role={role} superConfigured={superConfigured} />
      <div className="flex-1 min-w-0">
        <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl">{children}</main>
      </div>
    </div>
  );
}
