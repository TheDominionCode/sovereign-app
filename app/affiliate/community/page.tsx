import Link from "next/link";
import { requireApprovedAffiliate } from "@/lib/affiliate/guard";
import { getApprovedFeed, getCommunitySettings } from "@/lib/affiliate/data";
import { getThemeOrDefault } from "@/lib/affiliate/themes";
import PostComposer from "./PostComposer";
import FeedItem from "./FeedItem";

export const dynamic = "force-dynamic";

export const metadata = { title: "Community — Sovereign Affiliate" };

export default async function AffiliateCommunityPage() {
  const me = await requireApprovedAffiliate();
  const [feed, settings] = await Promise.all([
    getApprovedFeed(me.userId),
    getCommunitySettings(),
  ]);
  const theme = getThemeOrDefault(settings.theme);

  return (
    <main
      className="min-h-screen py-12 px-5"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Sticky-feeling back link so the community never feels like a dead
            end — one tap takes you straight to the planner. */}
        <Link
          href="/os.html"
          className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase hover:underline mb-6"
          style={{ color: theme.accent }}
        >
          ← Back to app
        </Link>
        <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
          <h1
            className="font-serif text-4xl"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              color: theme.text,
            }}
          >
            Wall of wins
          </h1>
          <p
            className="text-sm italic mt-0.5"
            style={{ color: theme.accent, fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Growth becomes stronger when it&apos;s shared.
          </p>
          <Link
            href="/affiliate"
            className="text-[11px] tracking-[0.18em] uppercase hover:underline"
            style={{ color: theme.accent }}
          >
            Affiliate program →
          </Link>
        </div>
        <p className="italic mb-8" style={{ color: theme.accent }}>
          {settings.quote}
        </p>

        <div className="mb-8">
          <PostComposer theme={theme} />
        </div>

        {feed.length === 0 ? (
          <div
            className="rounded-2xl border border-dashed p-10 text-center"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.card,
              color: theme.muted,
            }}
          >
            <div className="text-sm mb-1" style={{ color: theme.text }}>
              No wins on the wall yet.
            </div>
            <div className="text-xs italic">
              Be the first — share something above and Nataly will approve it.
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {feed.map((p) => (
              <FeedItem key={p.id} post={p} viewerId={me.userId} theme={theme} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
