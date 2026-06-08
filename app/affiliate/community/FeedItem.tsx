"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { FeedPost } from "@/lib/affiliate/data";
import type { CommunityTheme } from "@/lib/affiliate/themes";
import {
  deleteOwnPostAction,
  editOwnPostAction,
  toggleReactionAction,
} from "./actions";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

// Long-form date stamp shown beneath the relative time, e.g.
// "Jun 7, 2026 · 9:47 PM". Format is locale-sensitive so non-US viewers
// see their own date order.
function fullStamp(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

// Display label for the author. Prefers their full name (captured at post
// time from public.profiles.full_name); falls back to a title-cased version
// of the email's local part so we never show the raw email to the rest of
// the community. e.g. "amanda.brooks@gmail.com" → "Amanda Brooks".
function displayName(name: string | null, email: string): string {
  if (name && name.trim()) return name.trim();
  const local = email.split("@")[0] ?? "";
  return (
    local
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim() || email
  );
}

export default function FeedItem({
  post,
  viewerId,
  theme,
}: {
  post: FeedPost;
  viewerId: string | null;
  theme: CommunityTheme;
}) {
  const isOwn = viewerId === post.author_id;
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    { reacted: post.reacted_by_me, count: post.reaction_count },
    (_state, next: { reacted: boolean; count: number }) => next,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(post.body);
  const [savedBody, setSavedBody] = useState(post.body);
  const [error, setError] = useState<string | null>(null);

  const onTap = () => {
    if (pending) return;
    const wasReacted = optimistic.reacted;
    const nextReacted = !wasReacted;
    const nextCount = Math.max(0, optimistic.count + (nextReacted ? 1 : -1));
    startTransition(async () => {
      setOptimistic({ reacted: nextReacted, count: nextCount });
      await toggleReactionAction(post.id);
    });
  };

  const onSaveEdit = () => {
    setError(null);
    const trimmed = draft.trim();
    if (!trimmed) {
      setError("Post can't be empty.");
      return;
    }
    startTransition(async () => {
      const res = await editOwnPostAction(post.id, trimmed);
      if (!res.ok) {
        setError(res.error ?? "Couldn't save your edit.");
        return;
      }
      setSavedBody(trimmed);
      setIsEditing(false);
    });
  };

  const onDelete = () => {
    if (typeof window === "undefined") return;
    const ok = window.confirm("Delete this post? This can't be undone.");
    if (!ok) return;
    startTransition(async () => {
      const res = await deleteOwnPostAction(post.id);
      if (!res.ok) setError(res.error ?? "Couldn't delete your post.");
    });
  };

  return (
    <article
      className="rounded-2xl border p-5 sm:p-6 shadow-sm"
      style={{ backgroundColor: theme.card, borderColor: theme.border }}
    >
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <div className="text-xs font-semibold" style={{ color: theme.text }}>
          {displayName(post.author_name, post.author_email)}
        </div>
        <div className="text-[10px] tracking-[0.18em] uppercase text-right" style={{ color: theme.muted }}>
          {relativeTime(post.created_at)}
        </div>
      </div>
      <div className="text-[11px] mb-3" style={{ color: theme.muted }}>
        {fullStamp(post.created_at)}
      </div>

      {isEditing ? (
        <>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            className="block w-full px-3 py-2 border rounded-lg text-sm outline-none resize-none"
            style={{
              backgroundColor: theme.background,
              color: theme.text,
              borderColor: theme.border,
            }}
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onSaveEdit}
              disabled={pending}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg disabled:opacity-50"
              style={{ backgroundColor: theme.accent, color: theme.card }}
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setDraft(savedBody);
                setError(null);
              }}
              disabled={pending}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg disabled:opacity-50"
              style={{ backgroundColor: theme.background, color: theme.text, border: `1px solid ${theme.border}` }}
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <p
          className="text-sm leading-relaxed whitespace-pre-wrap break-words"
          style={{ color: theme.text }}
        >
          {savedBody}
        </p>
      )}

      {post.image_url && (
        <div className="mt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image_url}
            alt=""
            className="max-h-[480px] w-full rounded-lg border object-cover"
            style={{ borderColor: theme.border }}
            loading="lazy"
          />
        </div>
      )}

      {error && (
        <div
          className="mt-3 text-xs rounded-lg px-3 py-2 border"
          style={{ backgroundColor: "#fef2f2", color: "#7c2d2d", borderColor: "#fecaca" }}
        >
          {error}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onTap}
          disabled={pending}
          aria-pressed={optimistic.reacted}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors disabled:opacity-60"
          style={{
            borderColor: optimistic.reacted ? theme.accent : theme.border,
            backgroundColor: optimistic.reacted ? theme.background : theme.card,
            color: optimistic.reacted ? theme.reactionActive : theme.muted,
          }}
        >
          <span aria-hidden>{optimistic.reacted ? "❤" : "♡"}</span>
          <span>{optimistic.count.toLocaleString()}</span>
        </button>

        {isOwn && !isEditing && (
          <div className="ml-auto flex items-center gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => {
                setDraft(savedBody);
                setIsEditing(true);
                setError(null);
              }}
              className="px-2.5 py-1 rounded-md font-semibold"
              style={{
                backgroundColor: theme.background,
                color: theme.accent,
                border: `1px solid ${theme.border}`,
              }}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={pending}
              className="px-2.5 py-1 rounded-md font-semibold"
              style={{ backgroundColor: "#dc2626", color: "#ffffff" }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
