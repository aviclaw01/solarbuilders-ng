"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

/** Records which dead URLs people actually hit, so redirects go where they matter. */
export default function NotFoundTracker() {
  useEffect(() => {
    track("not_found");
  }, []);
  return null;
}
