import Link from "next/link";

export const metadata = { title: "Refund Policy · Sovereign" };

const css = `
  .legal-root{font-family:'Inter',sans-serif;background:#f5efe6;color:#1a1816;min-height:100vh;padding:80px 24px;font-weight:300}
  .legal-root .wrap{max-width:780px;margin:0 auto}
  .legal-root a.back{font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#856a3f;margin-bottom:40px;display:inline-block}
  .legal-root a.back:hover{color:#1a1816}
  .legal-root h1{font-family:'Cormorant Garamond',serif;font-size:56px;font-weight:400;letter-spacing:-0.01em;line-height:1.05;margin-bottom:24px}
  .legal-root .updated{font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#6b6258;margin-bottom:40px}
  .legal-root h2{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:500;margin:36px 0 14px;color:#2c2926}
  .legal-root p{font-size:16px;line-height:1.75;color:#2c2926;margin-bottom:14px}
  .legal-root .callout{background:#ece3d3;border-left:3px solid #856a3f;padding:24px 28px;margin:32px 0;font-family:'Cormorant Garamond',serif;font-size:20px;line-height:1.6;color:#1a1816;font-style:italic}
  .legal-root .foot{margin-top:60px;padding-top:28px;border-top:1px solid #d9cdb8;font-size:13px;color:#6b6258;font-style:italic;font-family:'Cormorant Garamond',serif}
`;

export default function RefundPage() {
  return (
    <div className="legal-root">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="wrap">
        <Link href="/" className="back">← Back to Sovereign</Link>
        <h1>Refund Policy</h1>
        <div className="updated">Last updated · 2026</div>

        <div className="callout">
          All Sovereign subscriptions are non-refundable. Your 3-day free trial is your window to decide.
        </div>

        <h2>Why no refunds</h2>
        <p>
          Sovereign is a digital product. The moment you sign in, you receive every section of the planner —
          Summary, Daily Planner, Goals, Habits, Cycle, Vision Board, Boundaries, Affirmations, Speak Eloquently,
          Personal Finance, Notes, and a private Logins & Passwords vault. Because of this, we offer a
          generous 3-day free trial instead of refunds, so you can use the full product before any payment.
        </p>

        <h2>How the free trial works</h2>
        <p>
          When you choose a plan and add a payment method, you get full access for 72 hours at no charge.
          If Sovereign isn&apos;t for you, cancel before day four and your card is never charged. If you stay,
          your chosen plan begins automatically.
        </p>

        <h2>Cancellation</h2>
        <p>
          You may cancel your subscription at any time from your billing dashboard. After cancellation,
          you keep access through the end of the period you have already paid for. No refunds are issued
          for partial or unused subscription periods.
        </p>

        <h2>Exceptions</h2>
        <p>
          We will issue a refund in two situations: (1) a duplicate charge on your card caused by our error;
          (2) a billing error where the wrong plan was charged. Email us and we&apos;ll fix it.
        </p>

        <h2>Contact</h2>
        <p>
          Billing question? Email{" "}
          <a href="mailto:admin@dominioncodeacademy.com" style={{ color: "#856a3f", textDecoration: "underline" }}>
            admin@dominioncodeacademy.com
          </a>.
        </p>

        <div className="foot">Sovereign — owned & operated by The Dominion Code LLC.</div>
      </div>
    </div>
  );
}
