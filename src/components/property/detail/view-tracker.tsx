"use client";

import { useEffect } from "react";
import { recordPropertyView } from "@/app/actions/views";

/** Counts one view per listing per browser session (sessionStorage, essential). */
export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `sp-viewed:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked: still count, at most once per page load.
    }
    void recordPropertyView(slug);
  }, [slug]);
  return null;
}
