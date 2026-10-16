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
let lastSent: string | null = null;

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/partner")) return;
    const send = () => {
      // One view per path per document, even if the effect re-runs.
      if (lastSent === pathname) return;
      lastSent = pathname;
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
    };
    // Chrome prerenders pages from search results and runs their JS before the
    // visitor opens them; counting then doubled every Google landing. Wait
    // until the page is actually shown.
    const doc = document as Document & { prerendering?: boolean };
    if (doc.prerendering) {
      document.addEventListener("prerenderingchange", send, { once: true });
      return () => document.removeEventListener("prerenderingchange", send);
    }
    send();
  }, [pathname]);

  return null;
}
