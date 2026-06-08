import Link from "next/link";

// Public, login-free preview of the conversion funnel that lives at the top
// of /admin/analytics. Uses the example numbers (24 / 3 / 1) so the owner
// can see what the real card looks like before any traffic has come through.
// Rendered as three big circles in a row so the funnel reads left-to-right.

export const metadata = { title: "Funnel preview — Sovereign Analytics" };

const MOCK = { clicked: 24, trialed: 3, paying: 1 };
const pct = (n: number, d: number) => (d > 0 ? (n / d) * 100 : 0);
const clickToTrial = pct(MOCK.trialed, MOCK.clicked);
const trialToPaying = pct(MOCK.paying, MOCK.trialed);
const clickToPaying = pct(MOCK.paying, MOCK.clicked);

function FunnelCircle({
  label,
  sublabel,
  value,
  ringColor,
  textColor,
  bgColor,
}: {
  label: string;
  sublabel: string;
  value: number;
  ringColor: string;
  textColor: string;
  bgColor: string;
}) {
  return (
    <div className="flex flex-col items-center text-center min-w-[88px]">
      <div
        className="w-[88px] h-[88px] sm:w-[112px] sm:h-[112px] rounded-full flex items-center justify-center shadow-sm"
        style={{
          backgroundColor: bgColor,
          border: `3px solid ${ringColor}`,
        }}
      >
        <div
          className="font-display text-3xl sm:text-4xl leading-none"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            color: textColor,
          }}
        >
          {value.toLocaleString()}
        </div>
      </div>
      <div className="mt-2 text-xs font-semibold text-stone-800">{label}</div>
      <div className="text-[10px] italic text-stone-500">{sublabel}</div>
    </div>
  );
}

function FunnelArrow({ pct, caption }: { pct: number; caption: string }) {
  return (
    <div className="flex flex-col items-center text-center px-1">
      <div className="text-stone-400 text-xl leading-none" aria-hidden>→</div>
      <div className="text-[11px] font-mono text-stone-600 mt-1">{pct.toFixed(1)}%</div>
      <div className="text-[10px] italic text-stone-500">{caption}</div>
    </div>
  );
}

export default function AnalyticsPreviewPage() {
  return (
    <main className="min-h-screen bg-[#f5efe6] text-[#1a1816] py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link href="/os.html" className="text-[11px] tracking-[0.18em] uppercase text-[#856a3f] hover:text-[#1a1816]">
            ← Back to app
          </Link>
          <Link href="/admin/analytics" className="text-[11px] tracking-[0.18em] uppercase text-[#856a3f] hover:text-[#1a1816]">
            Real analytics (login needed) →
          </Link>
        </div>

        <h1
          className="font-serif text-5xl mt-8 mb-3 leading-tight"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Conversion funnel
        </h1>
        <p
          className="font-serif text-lg italic text-[#856a3f] mb-10"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Three circles, drop-off % between each. Example numbers: 24 clicks → 3 trials → 1 paying customer.
        </p>

        {/* THE ACTUAL CARD */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-baseline justify-between mb-5 flex-wrap gap-2">
            <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500 font-medium">
              Conversion funnel (last 30 days)
            </div>
            <div className="text-xs italic text-stone-500">of visits that turned into customers</div>
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
            <FunnelCircle
              label="Clicked"
              sublabel="the link"
              value={MOCK.clicked}
              ringColor="#a8c090"
              textColor="#5b7351"
              bgColor="#f4f7ee"
            />
            <FunnelArrow pct={clickToTrial} caption="trial" />
            <FunnelCircle
              label="Free trial"
              sublabel="signed up"
              value={MOCK.trialed}
              ringColor="#fbbf24"
              textColor="#b45309"
              bgColor="#fef3c7"
            />
            <FunnelArrow pct={trialToPaying} caption="paid" />
            <FunnelCircle
              label="Paying"
              sublabel="customers"
              value={MOCK.paying}
              ringColor="#34d399"
              textColor="#047857"
              bgColor="#d1fae5"
            />
          </div>

          <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between gap-3 flex-wrap">
            <div className="text-sm text-stone-700">
              <span className="font-semibold text-[#5b7351]">{MOCK.paying.toLocaleString()}</span>{" "}
              of{" "}
              <span className="font-semibold text-[#5b7351]">{MOCK.clicked.toLocaleString()}</span>{" "}
              visitors became paying customers.
            </div>
            <div
              className="font-display text-2xl leading-none text-[#5b7351]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {clickToPaying.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Plain-English read */}
        <section className="rounded-2xl border border-[#d9cdb8] bg-white p-7 sm:p-9 shadow-sm mt-10">
          <h3
            className="font-serif text-2xl mb-3"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            What this reading tells you
          </h3>
          <ul className="space-y-3 text-sm text-[#2c2926] leading-relaxed">
            <li>
              <span className="font-semibold text-[#1a1816]">12.5% trial conversion.</span>{" "}
              1 in 8 visitors trusted you enough to start the trial. Healthy at this stage —
              most landing pages convert visitors to trials at 2-5%.
            </li>
            <li>
              <span className="font-semibold text-[#1a1816]">33.3% trial → paid.</span>{" "}
              1 of 3 triallers stayed. Industry benchmark for a freemium tool is 15-25%, so
              you&apos;re above average. If this drops, look at the onboarding experience.
            </li>
            <li>
              <span className="font-semibold text-[#1a1816]">4.2% end-to-end.</span>{" "}
              About 1 in 24 clicks turns into real revenue. Use this for back-of-envelope math:
              1,000 Instagram link clicks ≈ 42 paying customers.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
