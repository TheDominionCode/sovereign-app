import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BookOpen,
  Calendar,
  Activity,
  Target,
  DollarSign,
  Heart,
  Image as ImageIcon,
  Sparkles,
  Shield,
  MessageCircle,
  StickyNote,
  Lock,
  Home as HomeIcon,
} from "lucide-react";
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

// Every module the user will find in the planner sidebar, with a one-line
// description in Nataly's voice. Lucide icons mirror what's used inside the
// planner itself so the gallery matches what they're about to walk into.
const FEATURES = [
  { icon: HomeIcon,      name: "Summary",            body: "Your one-screen morning. Three Things, stat circles, today at a glance." },
  { icon: BookOpen,      name: "Daily Planner",      body: "To-dos, the weekly schedule, today's wins, gratitude, journal, tomorrow." },
  { icon: Activity,      name: "Habits & Water",     body: "Routines, water glasses, the rhythm of the days you're proud of." },
  { icon: Calendar,      name: "Calendar",           body: "Events by day, week, year. Connected to your planner — your wins show up here too." },
  { icon: Target,        name: "Goals",              body: "The 3, 6, 12-month picture. Track progress without nagging notifications." },
  { icon: DollarSign,    name: "Personal Finance",   body: "Income, expenses, savings goals. What's coming in, what's going out, what's yours to keep." },
  { icon: Heart,         name: "Cycle & Mood",       body: "Track your cycle, mood, symptoms, vitamins. Quietly. For you." },
  { icon: ImageIcon,     name: "Vision Board",       body: "Photos + captions of the life you're building toward. Look at it. Often." },
  { icon: Sparkles,      name: "Affirmations",       body: "50+ to start, plus the ones you write yourself. Daily streak counter." },
  { icon: Shield,        name: "Boundaries",         body: "Scripts and reminders for the moments you need to say no without flinching." },
  { icon: MessageCircle, name: "Speak Eloquently",   body: "Rehearse the hard conversation. Refine the email. Pick your words." },
  { icon: StickyNote,    name: "Notes",              body: "Private, encrypted on your device. For the thoughts that aren't ready for anywhere else." },
  { icon: Lock,          name: "Logins & Passwords", body: "Encrypted on your device. Sovereign never sees them. Neither does anyone else." },
];

// Pick the user's first name without ever falling back to an email-derived
// guess (those produce ugly greetings like "Hello, Iconic"). Returns null if
// no real name is on file, which lets the page render an un-personalized but
// still warm "Hello." instead.
function firstNameOrNull(...candidates: Array<string | null | undefined>): string | null {
  for (const raw of candidates) {
    if (!raw) continue;
    const cleaned = String(raw).trim();
    if (!cleaned) continue;
    return cleaned.split(/\s+/)[0];
  }
  return null;
}

export default async function WelcomePage({ searchParams }: { searchParams: SearchParams }) {
  const { next } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect(`/login?next=${encodeURIComponent("/welcome")}`);

  // Pull the user's name. Best sources in priority order:
  //   1. profiles.full_name (synced from raw_user_meta_data at signup)
  //   2. user.user_metadata.full_name (signup form input, before sync)
  // No email-derived guesses — we'd rather say "Hello." than "Hello, Iconic."
  const admin = createAdminClient();
  let profileFullName: string | null = null;
  try {
    const { data } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    profileFullName = (data?.full_name as string | null) ?? null;
  } catch {
    profileFullName = null;
  }
  const metadataFullName = (user.user_metadata?.full_name as string | undefined) ?? null;
  const firstName = firstNameOrNull(profileFullName, metadataFullName);
  const greeting = firstName ? `Hello, ${firstName}.` : "Hello.";
  const ctaName = firstName ? `Ready, ${firstName}?` : "Ready?";
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
            {greeting}
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
              {firstName ? `${firstName}, ` : ""}I built Sovereign because I was tired of being scattered. Seven apps open at any
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

        {/* WHAT'S NEW — refreshed for every release so new signups walk in
            knowing the latest. Keep this list short (~8 items) and in the
            user's voice — what changed for HER, not the engineering of it. */}
        <section className="rounded-2xl border border-[#d9cdb8] bg-white p-7 sm:p-9 shadow-sm mb-10">
          <div className="text-[10px] tracking-[0.18em] uppercase text-[#856a3f] font-semibold mb-3">
            Latest updates
          </div>
          <h2
            className="font-serif text-3xl mb-5"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Fresh from this week
          </h2>
          <ul className="space-y-2.5 text-sm text-[#2c2926]">
            {[
              "Weekly Schedule now reads like Google Calendar — full-duration colored blocks with the title in white.",
              "Pick a color category for every task (Family · Personal · Work · Self-care · Spiritual · Other) and rename them to mean whatever fits your life.",
              "Mark tasks as permanent — every day, or every Monday, at the same time. They appear forever, no re-entry.",
              "Tap any empty cell on the schedule to add a task at that exact time.",
              "Tasks that overlap stack with every title visible instead of hiding behind each other.",
              "Personal Finance: a new Subscriptions tab with cost, login email, and password — all in one place.",
              "Vision Board: arrows on every card so you can reorder your dream lineup.",
              "Affirmations now translate to Spanish (all 30 default ones).",
              "You stay signed in — no more daily re-login on the phone.",
            ].map((line) => (
              <li key={line} className="flex gap-2.5 leading-relaxed">
                <span className="text-[#5b7351] flex-shrink-0 mt-0.5">✓</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
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

        {/* WHAT'S INSIDE — feature tour */}
        <section className="mb-10">
          <div className="text-[10px] tracking-[0.18em] uppercase text-[#856a3f] font-semibold mb-4">
            What you&apos;ll see inside
          </div>
          <p className="text-sm italic text-[#6b6258] mb-5">
            Every section of Sovereign in one line. You don&apos;t have to use them all
            — pick the ones that fit your life and ignore the rest.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.name}
                  className="rounded-xl border border-[#d9cdb8] bg-white p-4 flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-[#f4f7ee] border border-[#d3e0c5] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-[#5b7351]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#1a1816] mb-0.5">{f.name}</div>
                    <div className="text-xs text-[#2c2926] leading-relaxed">{f.body}</div>
                  </div>
                </div>
              );
            })}
          </div>
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
            {ctaName}
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
