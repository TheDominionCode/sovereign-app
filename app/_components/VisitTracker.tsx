"use client";

import { useEffect } from "react";

// Fires a single fire-and-forget POST to /api/track when the page first loads,
// then sets a sessionStorage flag so refreshes inside the same browser tab don't
// double-count. Closing the tab or opening a fresh one counts as a new visit.
export default function VisitTracker({ slug = "landing" }: { slug?: string }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `sov:tracked:${slug}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");

    fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        path: window.location.pathname + window.location.search,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [slug]);

  return null;
}
