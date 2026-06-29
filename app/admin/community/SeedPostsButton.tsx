"use client";

import { useState, useTransition } from "react";
import { seedPostsAction } from "./actions";

export default function SeedPostsButton() {
  const [result, setResult] = useState<{ error?: string; success?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const res = await seedPostsAction();
      setResult(res);
    });
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="px-4 py-2 text-sm font-semibold rounded-lg border border-sage text-forest hover:bg-sage-pale disabled:opacity-50 transition-colors"
      >
        {isPending ? "Seeding…" : "Add starter posts"}
      </button>
      <span className="text-xs text-stone-400 italic">
        Inserts 6 example wins so the feed looks alive. Only works when 0 approved posts exist.
      </span>
      {result?.success && (
        <span className="text-sm text-emerald-700 font-medium">✓ {result.success}</span>
      )}
      {result?.error && (
        <span className="text-sm text-rose-600">{result.error}</span>
      )}
    </div>
  );
}
