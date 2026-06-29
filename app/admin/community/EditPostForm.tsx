"use client";

import { useState, useTransition } from "react";
import { editPostAction } from "./actions";
import type { PostRow } from "@/lib/affiliate/data";

export default function EditPostForm({ post }: { post: PostRow }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(post.body);
  const [authorName, setAuthorName] = useState(post.author_name ?? "");
  const [result, setResult] = useState<{ error?: string; success?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("id", String(post.id));
    fd.set("body", body);
    fd.set("author_name", authorName);
    startTransition(async () => {
      const res = await editPostAction(fd);
      setResult(res);
      if (res.success) setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setResult(null); }}
        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-stone-300 text-stone-700 bg-stone-50 hover:bg-stone-100 transition"
      >
        {open ? "Cancel" : "Edit"}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-3 w-full space-y-3 border-t border-stone-100 pt-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-stone-500 mb-1">
              Display name
            </label>
            <input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full max-w-sm px-3 py-1.5 text-sm rounded-lg border border-stone-200 focus:border-sage outline-none bg-white"
              placeholder="e.g. Amanda R."
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-stone-500 mb-1">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:border-sage outline-none bg-white resize-y"
            />
          </div>
          {result?.error && (
            <p className="text-xs text-rose-600">{result.error}</p>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-1.5 text-sm font-semibold bg-forest text-white rounded-lg hover:bg-forest-deep disabled:opacity-50 transition-colors"
          >
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </form>
      )}
    </>
  );
}
