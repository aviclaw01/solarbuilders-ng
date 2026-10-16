"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/track";

/**
 * Every click and every page exit, so /admin/journeys can show where people go
 * and where they stop.
 *
 *  - click: any <a> or <button>. label = its visible text (or aria-label),
 *    target = the path it opens, the external host (wa.me, tel:) or "button".
 *    A data-track attribute on it or an ancestor becomes the placement.
 *  - page_exit: sent when the path changes or the tab is hidden. value = whole
 *    seconds on the page (visible time only), placement = "scroll:NN", the
 *    deepest point reached as a % of the page, in steps of 25.
 *
 * Typed text is never read: inputs, selects and textareas are not clicks here.
 */
function describe(el: HTMLElement): { label: string; target: string; placement?: string } {
  const text = (el.getAttribute("aria-label") || el.innerText || el.getAttribute("title") || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  let target = "button";
  if (el instanceof HTMLAnchorElement && el.href) {
    try {
      const u = new URL(el.href);
      if (u.protocol === "tel:" || u.protocol === "mailto:") target = u.protocol.replace(":", "");
      else target = u.host === window.location.host ? u.pathname.slice(0, 200) : u.host;
    } catch {
      /* keep "button" */
    }
  }
  const tagged = el.closest<HTMLElement>("[data-track]");
  return { label: text || "(no text)", target, placement: tagged?.dataset.track?.slice(0, 60) };
}

export default function AutoTrack() {
  const pathname = usePathname();
  const page = useRef({ path: "", visibleMs: 0, shownAt: 0, depth: 0 });

  // Clicks, anywhere, captured before the page handles them.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("a,button");
      if (!el || window.location.pathname.startsWith("/admin")) return;
      track("click", describe(el));
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  // Scroll depth and visible time for the current page; exit on change or hide.
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/partner")) return;
    const p = page.current;
    p.path = pathname;
    p.visibleMs = 0;
    p.shownAt = document.visibilityState === "visible" ? Date.now() : 0;
    p.depth = 0;

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max <= 0 ? 100 : Math.min(100, ((window.scrollY + 1) / max) * 100);
      p.depth = Math.max(p.depth, Math.floor(pct / 25) * 25);
    };
    const flush = () => {
      if (p.shownAt) p.visibleMs += Date.now() - p.shownAt;
      p.shownAt = 0;
      if (p.visibleMs < 1000) return;
      track("page_exit", { path: p.path, value: Math.round(p.visibleMs / 1000), placement: `scroll:${p.depth}` });
      p.visibleMs = 0;
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
      else p.shownAt = Date.now();
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      flush();
    };
  }, [pathname]);

  return null;
}
