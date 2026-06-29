"use client";

import { useRef, useState, useTransition } from "react";
import { addToCommunityAction } from "./actions";

export default function AddToCommunityForm() {
  const [result, setResult] = useState<{ error?: string; success?: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await addToCommunityAction(formData);
      setResult(res);
      if (res.success) ref.current?.reset();
    });
  }

  return (
    <div className="rounded-xl border border-sage-pale bg-cream-bg/60 px-5 py-5 mb-8">
      <h2 className="font-display text-xl text-forest-deep mb-1">Add someone to the community</h2>
      <p className="text-sm text-stone mb-4 leading-relaxed">
        Bypasses the apply flow and immediately grants community access. The person must already have a Sovereign account.
      </p>

      {result?.success && (
        <div className="mb-3 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          ✓ {result.success}
        </div>
      )}
      {result?.error && (
        <div className="mb-3 rounded-md border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {result.error}
        </div>
      )}

      <form ref={ref} onSubmit={handleSubmit} className="flex gap-2 max-w-md">
        <input
          name="email"
          type="email"
          required
          placeholder="member@email.com"
          className="flex-1 px-3 py-2 rounded-lg border border-stone-200 text-sm focus:border-sage outline-none bg-white"
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-forest text-white text-sm font-medium rounded-lg hover:bg-forest-deep disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {isPending ? "Adding…" : "Add to community"}
        </button>
      </form>
    </div>
  );
}
