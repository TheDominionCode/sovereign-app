import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Welcome — Sovereign" };

type SearchParams = Promise<{ next?: string }>;

const HOW_IT_WORKS = [
  {
    title: "Start with your three things",
    body: "Every morning, write the three things that, if done, would make today a good day. They become your anchor — everything else is bonus.",
  },
  {
    title: "Build your day around them",
    body: "Add to-dos, schedule your habits, log your wins. The planner stays simple on purpose — one screen, no apps to switch between.",
  },
  {
    title: "Track what matters to you",
    body: "Cycle, mood, water, vitamins, finances, goals, vision board, gratitude. Use what serves you, ignore the rest.",
  },
  {
    title: "Come back to your sovereignty",
    body: "Affirmations, boundaries, journal. The features no other app gives you because they don't think you need them. You do.",
  },
];

function pickFirstName(fullName: string | null | undefined, email: string): string {
  if (fullName && fullName.trim()) {
    return fullName.trim().split(/\s+/)[0];
  }
  const local = email.split("@")[0] ?? "";
  return (
    local
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim()
      .split(/\s+/)[0] || "friend"
  );
}

export default async function WelcomePage({ searchParams }: { searchParams: SearchParams }) {
  const { next } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect(`/login?next=${encodeURIComponent("/welcome")}`);

  // Pull the user's name (best-effort) so the greeting feels personal. The
  // welcome page renders fine even if the profile row hasn't been synced yet.
  const admin = createAdminClient();
  let fullName: string | null = null;
  try {
    const { data } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    fullName = (data?.full_name as string | null) ?? null;
  } catch {
    fullName = null;
  }
  const firstName = pickFirstName(fullName, user.email);
  const continueHref = next && next.startsWith("/") ? next : "/app";

  return (
    <main className="min-h-screen bg-[#f5efe6] text-[#1a1816] py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* HERO */}
        <div className="text-center mb-12">
          <div className="text-[11px] tracking-[0.3em] uppercase text-[#856a3f] mb-4">
            Welcome to Sovereign
          </div>
          <h1
            className="font-serif text-5xl sm:text-6xl leading-tight mb-4"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Hello, {firstName}.
          </h1>
          <p
            className="font-serif text-xl italic text-[#856a3f]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            You&apos;re in. Take a breath. This is yours now.
          </p>
        </div>

        {/* FOUNDER'S LETTER */}
        <section className="rounded-2xl border border-[#d9cdb8] bg-white p-7 sm:p-9 shadow-sm mb-10">
          <div className="text-[10px] tracking-[0.28em] uppercase text-[#856a3f] font-semibold mb-3">
            A letter from Nataly
          </div>
          <h2
            className="font-serif text-3xl mb-5 leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Why you&apos;re here
          </h2>
          <div
            className="space-y-4 text-[15px] leading-relaxed text-[#2c2926]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            <p>
              I built Sovereign because I was tired of being scattered. Seven apps open at any
              given time, none of them talking to each other, all of them designed to keep
              me using them instead of <em>living</em>. So I built one quiet place that
              holds my whole life.
            </p>
            <p>
              You don&apos;t need to learn it. You don&apos;t need to set it up. Just open it
              every morning, write the three things that matter today, and let the rest
              follow. Use the parts that serve you. Ignore the parts that don&apos;t.
              You&apos;re sovereign — over your time, your body, your money, your story.
              The app is just here to hold space.
            </p>
            <p>
              If you have a win, share it. If something&apos;s broken, tell me. If a feature
              would change everything, ask for it. I read every message.
            </p>
            <p className="italic text-[#856a3f] pt-2">— Nataly</p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mb-10">
          <div className="text-[10px] tracking-[0.18em] uppercase text-[#856a3f] font-semibold mb-4">
            How to use it
          </div>
          <ol className="space-y-3">
            {HOW_IT_WORKS.map((step, i) => (
              <li
                key={step.title}
                className="rounded-xl border border-[#d9cdb8] bg-white p-5 sm:p-6 flex items-start gap-5"
              >
                <div
                  className="font-serif text-3xl italic text-[#856a3f] leading-none flex-shrink-0 w-10"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  0{i + 1}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#1a1816] mb-1">{step.title}</div>
                  <div className="text-sm text-[#2c2926] leading-relaxed">{step.body}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ADD TO HOME SCREEN */}
        <section className="rounded-2xl border border-[#d9cdb8] bg-white p-7 sm:p-9 shadow-sm mb-10">
          <div className="text-[10px] tracking-[0.28em] uppercase text-[#856a3f] font-semibold mb-3">
            Put Sovereign on your home screen
          </div>
          <h2
            className="font-serif text-3xl mb-5 leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            One tap, every morning
          </h2>
          <p className="text-[#2c2926] leading-relaxed mb-6">
            Sovereign works best when it&apos;s where your other apps are — right on your
            home screen. Takes 10 seconds. No app store, no install. Pinky promise.
          </p>

          {/* iOS */}
          <div className="rounded-lg border border-[#d9cdb8] bg-[#f5efe6]/40 p-5 mb-4">
            <div className="text-[11px] tracking-[0.18em] uppercase text-[#856a3f] font-semibold mb-3">
              📱 On iPhone (Safari)
            </div>
            <ol className="space-y-2 text-sm text-[#2c2926] list-decimal pl-5 leading-relaxed">
              <li>
                Tap the <span className="font-semibold">Share button</span> at the bottom of
                Safari — the square with an arrow pointing up.
              </li>
              <li>
                Scroll down in the share menu and tap{" "}
                <span className="font-semibold">&ldquo;Add to Home Screen.&rdquo;</span>
              </li>
              <li>
                You&apos;ll see the Sovereign icon and name. Tap{" "}
                <span className="font-semibold">&ldquo;Add&rdquo;</span> in the top right.
              </li>
              <li>
                Look at your home screen — there it is. Tap it any time and it opens like a
                real app, no browser bar.
              </li>
            </ol>
          </div>

          {/* Android */}
          <div className="rounded-lg border border-[#d9cdb8] bg-[#f5efe6]/40 p-5">
            <div className="text-[11px] tracking-[0.18em] uppercase text-[#856a3f] font-semibold mb-3">
              🤖 On Android (Chrome)
            </div>
            <ol className="space-y-2 text-sm text-[#2c2926] list-decimal pl-5 leading-relaxed">
              <li>
                Tap the <span className="font-semibold">three-dot menu</span> in the top
                right of Chrome.
              </li>
              <li>
                Tap <span className="font-semibold">&ldquo;Add to Home screen&rdquo;</span>{" "}
                or <span className="font-semibold">&ldquo;Install app.&rdquo;</span>
              </li>
              <li>
                Tap <span className="font-semibold">&ldquo;Install&rdquo;</span> to
                confirm.
              </li>
              <li>The Sovereign icon appears on your home screen.</li>
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border border-[#d9cdb8] bg-[#1a1816] text-[#f5efe6] p-8 text-center">
          <h2
            className="font-serif text-3xl mb-3"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Ready, {firstName}?
          </h2>
          <p className="text-sm italic text-[#c9a961] mb-6">
            Open your planner. Write the three things that matter today. Begin.
          </p>
          <Link
            href={continueHref}
            className="inline-block w-full sm:w-auto px-8 py-3 text-xs font-semibold tracking-wider uppercase rounded-lg text-[#1a1816] bg-[#c9a961] hover:bg-[#b09869] transition-colors"
          >
            Open my Sovereign →
          </Link>
          <p className="text-[11px] italic text-[#a8a29e] mt-4">
            You can come back to this page any time at <code>/welcome</code>.
          </p>
        </section>
      </div>
    </main>
  );
}
