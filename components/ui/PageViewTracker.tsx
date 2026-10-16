"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/track";

/**
 * First-party page views → /api/track → Supabase `site_events`.
 *
 * Before this existed the funnel only knew about clicks, so "which pages do
 * people actually land on, and from where" was unanswerable. The first view
 * of a tab is tagged `placement: "landing"` (sessionStorage, not a cookie) so
 * entry pages can be told apart from internal navigation.
 */
export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/partner")) return;
    let landing = false;
    try {
      if (!sessionStorage.getItem("sb_seen")) {
        sessionStorage.setItem("sb_seen", "1");
        landing = true;
      }
    } catch {
      /* storage blocked — count it as a plain view */
    }
    track("page_view", landing ? { placement: "landing" } : {});
  }, [pathname]);

  return null;
}
