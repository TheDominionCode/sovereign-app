"use client";

import { useRef, useState, useTransition } from "react";
import type { CommunityTheme } from "@/lib/affiliate/themes";
import { submitPostAction } from "./actions";

// Compose-a-new-win form. Theme prop is passed in from the server page so
// colors stay in sync with whatever the admin picked in /admin/community.
export default function PostComposer({ theme }: { theme: CommunityTheme }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (formData: FormData) => {
    setError(null);
    setSubmitted(false);
    startTransition(async () => {
      const res = await submitPostAction(formData);
      if (!res.ok) {
        setError(res.error ?? "Something went wrong.");
        return;
      }
      formRef.current?.reset();
      setImagePreview(null);
      setSubmitted(true);
    });
  };

  return (
    <form
      ref={formRef}
      action={onSubmit}
      className="rounded-2xl border p-5 sm:p-6 shadow-sm"
      style={{ backgroundColor: theme.card, borderColor: theme.border }}
    >
      <div
        className="text-[10px] tracking-[0.18em] uppercase font-semibold mb-3"
        style={{ color: theme.accent }}
      >
        Share a win
      </div>
      <textarea
        name="body"
        rows={3}
        required
        placeholder="What just happened? Drop the news, the number, the moment…"
        className="block w-full px-3 py-3 border rounded-lg text-sm outline-none resize-none"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.background,
          color: theme.text,
        }}
      />

      <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
        <label
          htmlFor="composer-image"
          className="cursor-pointer text-xs underline-offset-2 hover:underline"
          style={{ color: theme.accent }}
        >
          {imagePreview ? "Change photo" : "+ Add photo"}
        </label>
        <input
          id="composer-image"
          type="file"
          name="image"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) {
              setImagePreview(null);
              return;
            }
            const reader = new FileReader();
            reader.onload = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
          }}
        />
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2 text-xs font-semibold tracking-wider uppercase rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: theme.text, color: theme.card }}
        >
          {pending ? "Posting…" : "Post"}
        </button>
      </div>

      {imagePreview && (
        <div className="mt-3">
          {/* Local preview only — the actual upload happens in the action. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreview}
            alt=""
            className="max-h-64 rounded-lg border object-cover"
            style={{ borderColor: theme.border }}
          />
        </div>
      )}

      {error && (
        <div
          className="mt-3 text-xs rounded-lg px-3 py-2 border"
          style={{
            backgroundColor: "#fef2f2",
            color: "#7c2d2d",
            borderColor: "#fecaca",
          }}
        >
          {error}
        </div>
      )}

      {submitted && (
        <div
          className="mt-3 text-xs rounded-lg px-3 py-2 border"
          style={{
            backgroundColor: "#f4f7ee",
            color: "#5b7351",
            borderColor: "#d3e0c5",
          }}
        >
          Your win is in! Nataly will review it shortly — once approved it shows up in the feed below.
        </div>
      )}
    </form>
  );
}
