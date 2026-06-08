import Link from "next/link";
import { redirect } from "next/navigation";
import { getAffiliateStatus } from "@/lib/affiliate/guard";
import { applyToAffiliateAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Apply — Sovereign Affiliate" };

type SearchParams = Promise<{ submitted?: string }>;

const PREVIEW_POSTS = [
  {
    name: "Amanda Brooks",
    time: "2h ago",
    body: "First $1,000 month from a single Instagram story. I literally screamed. This app is changing my life.",
    heart: 38,
  },
  {
    name: "Jasmin Carter",
    time: "1d ago",
    body: "Booked 3 calls this week from the link in my bio. I haven't even posted about Sovereign yet — these are people who saw my morning routine reel.",
    heart: 22,
  },
  {
    name: "Kai Mitchell",
    time: "3d ago",
    body: "$487 today. From a comment under a TikTok. Y'all keep posting — the women out there are searching for this.",
    heart: 51,
  },
];

const HOW_IT_WORKS = [
  { n: "01", title: "Apply", body: "Fill out the short form. Nataly reads every one personally. 24-48 hours." },
  { n: "02", title: "Secure your annual", body: "Affiliates have an active annual Sovereign subscription. If you're already paying monthly, you'll just top up the remaining months to a year — no double-charge." },
  { n: "03", title: "Get your link", body: "A private Stripe-tracked referral code that pays you on every sale you bring in." },
  { n: "04", title: "Share + post your wins", body: "Drop your link in your bio, in your stories, in your DMs. Then come back to the wall and tell us what just happened." },
];

export default async function AffiliateApplyPage({ searchParams }: { searchParams: SearchParams }) {
  const { submitted } = await searchParams;
  const info = await getAffiliateStatus();
  if (!info) redirect("/login?next=/affiliate/apply");

  if (info.status === "approved") redirect("/affiliate/community");

  const isPending = info.status === "pending" || submitted === "1";
  const isRejected = info.status === "rejected";

  return (
    <main className="min-h-screen bg-[#f5efe6] text-[#1a1816] py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link href="/os.html" className="text-[11px] tracking-[0.18em] uppercase text-[#856a3f] hover:text-[#1a1816] inline-flex items-center gap-1.5">
            ← Back to app
          </Link>
          <Link href="/affiliate" className="text-[11px] tracking-[0.18em] uppercase text-[#856a3f] hover:text-[#1a1816]">
            Affiliate program →
          </Link>
        </div>

        <h1 className="font-serif text-5xl mt-8 mb-3 leading-tight" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          The Sovereign affiliate community
        </h1>
        <p className="font-serif text-lg italic text-[#856a3f] mb-12" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          A private room where the women already doing this share what just happened.
          The wins, the screenshots, the receipts. You read them like you&apos;re reading
          your own future.
        </p>

        {/* FOUNDER'S LETTER */}
        <section className="rounded-2xl border border-[#d9cdb8] bg-white p-7 sm:p-9 shadow-sm mb-10">
          <div className="text-[10px] tracking-[0.28em] uppercase text-[#856a3f] font-semibold mb-3">
            A letter from Nataly
          </div>
          <h2 className="font-serif text-3xl mb-4 leading-tight" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            Why I built this room
          </h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-[#2c2926]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            <p>
              I built Sovereign because I needed it. Running a business, raising a family,
              trying to keep my body and my soul intact — and seven apps open at any
              given time, none of them talking to each other. Sovereign brought my whole
              life into one quiet place.
            </p>
            <p>
              The affiliate program exists because I want other women to share in what
              this app makes possible. When you bring someone here, you&apos;re not just
              earning a commission — you&apos;re handing her the framework I needed for
              years. You&apos;re making money while making another woman&apos;s life calmer,
              more intentional, more her own.
            </p>
            <p>
              I review every application by hand. This room stays small on purpose —
              I want the women in it to know each other. The wins on the wall are real,
              the support in the DMs is real, and I show up too.
            </p>
            <p className="italic text-[#856a3f] pt-2">— Nataly Graziani, founder</p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mb-12">
          <div className="text-[10px] tracking-[0.18em] uppercase text-[#856a3f] font-semibold mb-4">
            How it works
          </div>
          <ol className="space-y-4">
            {HOW_IT_WORKS.map((step) => (
              <li key={step.n} className="rounded-xl border border-[#d9cdb8] bg-white p-5 sm:p-6 flex items-start gap-5">
                <div className="font-serif text-3xl italic text-[#856a3f] leading-none flex-shrink-0 w-10" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  {step.n}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#1a1816] mb-1">{step.title}</div>
                  <div className="text-sm text-[#2c2926] leading-relaxed">{step.body}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* COMMUNITY PREVIEW */}
        <section className="mb-12">
          <div className="text-[10px] tracking-[0.18em] uppercase text-[#856a3f] font-semibold mb-4">
            What it looks like inside
          </div>
          <div className="space-y-4">
            {PREVIEW_POSTS.map((p, i) => (
              <article key={i} className="rounded-2xl border border-[#d9cdb8] bg-white p-5 sm:p-6 shadow-sm">
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <div className="text-xs font-semibold text-[#1a1816]">{p.name}</div>
                  <div className="text-[10px] tracking-[0.18em] uppercase text-[#6b6258]">{p.time}</div>
                </div>
                <p className="text-sm text-[#2c2926] leading-relaxed">{p.body}</p>
                <div className="mt-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#d9cdb8] text-xs font-semibold text-[#856a3f]">
                    <span aria-hidden>❤</span>
                    <span>{p.heart}</span>
                  </span>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-3 text-[11px] italic text-[#6b6258] text-center">
            (Preview only — the real wall is private, members-only.)
          </div>
        </section>

        {/* APPLY FORM (or pending status) */}
        <section className="rounded-2xl border border-[#d9cdb8] bg-[#1a1816] text-[#f5efe6] p-8 shadow-sm">
          {isPending ? (
            <>
              <div className="text-[11px] tracking-[0.18em] uppercase text-[#c9a961] font-semibold mb-2">
                Application received
              </div>
              <h2 className="font-serif text-3xl mb-3" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                You&apos;re on the list, {info.email}.
              </h2>
              <p className="text-sm leading-relaxed">
                Nataly personally reviews every application. Once approved, you&apos;ll
                be sent to a Stripe checkout to secure (or top up) your annual access.
                From there the wall above goes live for you.
              </p>
              <p className="text-xs italic text-[#a8a29e] mt-4">
                Want to add anything to what you wrote? Update your note below.
              </p>
              <form action={applyToAffiliateAction} className="mt-6 space-y-3">
                <textarea
                  name="message"
                  rows={4}
                  defaultValue={info.message ?? ""}
                  placeholder="Anything else Nataly should know?"
                  className="block w-full px-4 py-3 border border-[#3a342d] rounded-lg bg-[#252320] text-sm outline-none focus:border-[#c9a961] text-[#f5efe6]"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold tracking-wider uppercase rounded-lg text-[#1a1816] bg-[#c9a961] hover:bg-[#b09869] transition-colors"
                >
                  Update application
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="font-serif text-3xl mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Apply for the room
              </h2>
              <p className="text-sm italic text-[#c9a961] mb-4">
                Membership runs annually. If you&apos;re already a monthly Sovereign
                subscriber, you&apos;ll just top up the remaining months at checkout —
                never charged twice for the same time.
              </p>
              {isRejected && (
                <div className="mb-6 p-3 rounded-lg bg-[#3a1a1a] border border-[#7c2d2d] text-sm text-[#fecaca]">
                  Your previous application wasn&apos;t accepted this round, but you&apos;re
                  welcome to re-apply with more context below.
                </div>
              )}
              <form action={applyToAffiliateAction} className="space-y-4">
                <div>
                  <label className="block text-[11px] tracking-[0.18em] uppercase text-[#c9a961] font-semibold mb-2">
                    Why you want in
                  </label>
                  <textarea
                    name="message"
                    rows={6}
                    required
                    defaultValue={info.message ?? ""}
                    placeholder="Tell Nataly a bit about you, your audience, and why you want to promote Sovereign."
                    className="block w-full px-4 py-3 border border-[#3a342d] rounded-lg bg-[#252320] text-sm outline-none focus:border-[#c9a961] text-[#f5efe6]"
                  />
                </div>
                <div className="text-xs italic text-[#a8a29e]">
                  Applying as <span className="font-semibold text-[#f5efe6]">{info.email}</span>
                </div>
                <button
                  type="submit"
                  className="w-full px-5 py-3 text-xs font-semibold tracking-wider uppercase rounded-lg text-[#1a1816] bg-[#c9a961] hover:bg-[#b09869] transition-colors"
                >
                  Submit application
                </button>
                <p className="text-[11px] italic text-[#a8a29e] text-center">
                  Annual checkout opens after Nataly approves you. Nothing is charged yet.
                </p>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
