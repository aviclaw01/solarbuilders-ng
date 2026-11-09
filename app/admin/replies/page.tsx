import type { Metadata } from "next";
import PageHeader from "@/components/ui/AdminPageHeader";
import RepliesClient from "./RepliesClient";

/**
 * WhatsApp reply playbook — searchable, copyable replies for whoever answers
 * the line. Content is lib/reply-playbook.ts (templates only, no customer data).
 *
 * Auth: HTTP Basic for /admin/* in proxy.ts. Nothing is read or stored.
 */
export const metadata: Metadata = {
  title: "Replies — SolarBuilders admin",
  robots: { index: false, follow: false },
};

export default function RepliesPage() {
  return (
    <>
      <PageHeader
        title="Replies"
        subtitle="Find the kind of message you got, copy the reply, fill in the [brackets], send. Follow-ups are on day 1, 3 and 7."
      />
      <RepliesClient />
    </>
  );
}
