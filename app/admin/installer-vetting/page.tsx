import type { Metadata } from "next";
import PageHeader from "@/components/ui/AdminPageHeader";
import VettingClient from "./VettingClient";

/**
 * Installer vetting kit — scorecard, paid-trial protocol, photo commissioning
 * checklist, and the outside-Lagos plan. Ops reference, no data stored.
 *
 * Auth: HTTP Basic for /admin/* in proxy.ts. Nothing here reads or writes
 * the database; ticks and scores live in the browser tab and are for printing.
 */
export const metadata: Metadata = {
  title: "Installer vetting — SolarBuilders admin",
  robots: { index: false, follow: false },
};

export default function InstallerVettingPage() {
  return (
    <>
      <PageHeader
        title="Installer vetting"
        subtitle="Score an installer, run the paid trial jobs, and sign off each install from photos. Nothing is saved: print it or screenshot it."
      />
      <VettingClient />
    </>
  );
}
