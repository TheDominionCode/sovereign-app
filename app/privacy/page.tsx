import Link from "next/link";

export const metadata = { title: "Privacy · Sovereign" };

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

export default function PrivacyPage() {
  return (
    <div className="legal-root">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="wrap">
        <Link href="/" className="back">← Back to Sovereign</Link>
        <h1>Privacy Policy</h1>
        <div className="updated">Last updated · 2026</div>

        <p>
          Sovereign is built around the idea that your inner life is your own. This policy explains exactly
          what we collect, why, and what we never do with it.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>Account info — your name and email, when you sign up.</li>
          <li>Payment info — handled entirely by Stripe. We never see or store your card number.</li>
          <li>Your planner data — the entries you type into the planner (goals, habits, notes, etc.).</li>
          <li>Basic usage analytics — anonymous, aggregated counts to know what&apos;s being used.</li>
        </ul>

        <h2>Where it lives</h2>
        <p>
          Your account and planner data are stored in Supabase (PostgreSQL) on encrypted servers. Each user&apos;s
          data is isolated from every other user&apos;s by row-level security.
        </p>

        <h2>What we never do</h2>
        <ul>
          <li>We do not sell your data — ever.</li>
          <li>We do not read your journal entries, affirmations, notes, or any private content.</li>
          <li>We do not share your data with advertisers.</li>
        </ul>

        <h2>Cookies</h2>
        <p>
          We use functional cookies to keep you signed in. No third-party advertising cookies.
        </p>

        <h2>Your rights</h2>
        <p>
          You can request a copy of your data, or delete your account entirely, at any time. Email us and
          we&apos;ll process it within 7 days.
        </p>

        <h2>Children</h2>
        <p>
          Sovereign is not directed at users under 16. If you believe a child has created an account, contact
          us and we&apos;ll remove it.
        </p>

        <h2>Contact</h2>
        <p>
          Privacy questions? Email{" "}
          <a href="mailto:admin@dominioncodeacademy.com" style={{ color: "#856a3f", textDecoration: "underline" }}>
            admin@dominioncodeacademy.com
          </a>.
        </p>

        <div className="foot">Sovereign — owned & operated by The Dominion Code LLC.</div>
      </div>
    </div>
  );
}
