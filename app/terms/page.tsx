import Link from "next/link";

export const metadata = { title: "Terms · Sovereign" };

const css = `
  .legal-root{font-family:'Inter',sans-serif;background:#f5efe6;color:#1a1816;min-height:100vh;padding:80px 24px;font-weight:300}
  .legal-root .wrap{max-width:780px;margin:0 auto}
  .legal-root a.back{font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#856a3f;margin-bottom:40px;display:inline-block}
  .legal-root a.back:hover{color:#1a1816}
  .legal-root h1{font-family:'Cormorant Garamond',serif;font-size:56px;font-weight:400;letter-spacing:-0.01em;line-height:1.05;margin-bottom:24px}
  .legal-root .updated{font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#6b6258;margin-bottom:40px}
  .legal-root h2{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:500;margin:36px 0 14px;color:#2c2926}
  .legal-root p{font-size:16px;line-height:1.75;color:#2c2926;margin-bottom:14px}
  .legal-root ul{margin:8px 0 14px 24px;color:#2c2926;font-size:16px;line-height:1.75}
  .legal-root .foot{margin-top:60px;padding-top:28px;border-top:1px solid #d9cdb8;font-size:13px;color:#6b6258;font-style:italic;font-family:'Cormorant Garamond',serif}
`;

export default function TermsPage() {
  return (
    <div className="legal-root">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="wrap">
        <Link href="/" className="back">← Back to Sovereign</Link>
        <h1>Terms of Service</h1>
        <div className="updated">Last updated · 2026</div>

        <p>
          These Terms govern your use of Sovereign, a digital planner operated by The Dominion Code LLC
          (&quot;we&quot;, &quot;us&quot;). By creating an account or starting a trial, you agree to these Terms.
        </p>

        <h2>1. The service</h2>
        <p>
          Sovereign is a subscription-based digital planner. You receive access to every section of the planner —
          Summary, Daily Planner, Goals, Habits, Cycle, Vision Board, Boundaries, Affirmations, Speak Eloquently,
          Personal Finance, Notes, and a private Logins & Passwords vault — for the duration of your active subscription.
        </p>

        <h2>2. Free trial and billing</h2>
        <p>
          All plans begin with a 3-day free trial. A valid payment method is required to start. We will not charge
          your card during the trial. If you do not cancel before day four, your chosen plan begins automatically
          and your card is charged on a recurring basis until you cancel.
        </p>

        <h2>3. Cancellation</h2>
        <p>
          You may cancel at any time from your billing dashboard. After cancellation, you keep access through the
          end of your current paid period. We do not issue refunds for partial or unused periods — see our{" "}
          <Link href="/refund" style={{ color: "#856a3f", textDecoration: "underline" }}>Refund Policy</Link>.
        </p>

        <h2>4. Your content</h2>
        <p>
          Anything you enter into Sovereign (goals, notes, planner entries, journal text, credentials) belongs to
          you. We store it on your behalf to make the planner work across devices. We do not sell, share, or use
          your personal entries for marketing.
        </p>

        <h2>5. Acceptable use</h2>
        <p>
          Don&apos;t use Sovereign to do anything illegal, to harass anyone, or to attempt to break the service.
          We may suspend accounts that do.
        </p>

        <h2>6. Limitation of liability</h2>
        <p>
          Sovereign is provided &quot;as is&quot;. We work hard to keep it reliable, but to the maximum extent
          allowed by law, our liability is limited to the amount you have paid us in the prior twelve months.
        </p>

        <h2>7. Changes</h2>
        <p>
          We may update these Terms. If we make material changes, we&apos;ll let you know in the app or by email
          before they take effect.
        </p>

        <h2>8. Contact</h2>
        <p>
          Questions about these Terms? Email{" "}
          <a href="mailto:admin@dominioncodeacademy.com" style={{ color: "#856a3f", textDecoration: "underline" }}>
            admin@dominioncodeacademy.com
          </a>.
        </p>

        <div className="foot">Sovereign — owned & operated by The Dominion Code LLC.</div>
      </div>
    </div>
  );
}
