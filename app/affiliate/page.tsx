import Link from "next/link";

export const metadata = { title: "Affiliate Program · Sovereign" };

const css = `
  .legal-root{font-family:'Inter',sans-serif;background:#f5efe6;color:#1a1816;min-height:100vh;padding:80px 24px;font-weight:300}
  .legal-root .wrap{max-width:780px;margin:0 auto;text-align:center}
  .legal-root a.back{font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#856a3f;margin-bottom:40px;display:inline-block;text-align:left;width:100%}
  .legal-root a.back:hover{color:#1a1816}
  .legal-root h1{font-family:'Cormorant Garamond',serif;font-size:64px;font-weight:400;letter-spacing:-0.01em;line-height:1.05;margin-bottom:18px}
  .legal-root h1 .italic{font-style:italic;color:#856a3f}
  .legal-root .lead{font-family:'Cormorant Garamond',serif;font-size:22px;line-height:1.55;color:#2c2926;font-style:italic;margin-bottom:40px}
  .legal-root .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;text-align:left;margin:48px 0}
  .legal-root .grid > div{background:#fff;border:1px solid #d9cdb8;padding:24px;border-radius:4px}
  .legal-root .grid h3{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;margin-bottom:8px}
  .legal-root .grid p{font-size:14px;line-height:1.7;color:#6b6258}
  .legal-root .cta{display:inline-block;margin-top:24px;padding:18px 36px;background:#1a1816;color:#f5efe6;font-size:13px;letter-spacing:0.22em;text-transform:uppercase;border-radius:999px}
  .legal-root .cta:hover{background:#856a3f}
  .legal-root .fine{margin-top:60px;font-size:13px;color:#6b6258;font-style:italic;font-family:'Cormorant Garamond',serif}
  @media (max-width:760px){.legal-root .grid{grid-template-columns:1fr;gap:18px}.legal-root h1{font-size:44px}}
`;

export default function AffiliatePage() {
  return (
    <div className="legal-root">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="wrap">
        <Link href="/" className="back">← Back to Sovereign</Link>
        <h1>The Sovereign <span className="italic">Affiliate</span></h1>
        <p className="lead">
          Earn a generous commission for every woman you bring home to herself.
        </p>

        <div className="grid">
          <div>
            <h3>How it works</h3>
            <p>Apply, get your unique link, share it with the women in your world. We track every signup that comes from you.</p>
          </div>
          <div>
            <h3>What you earn</h3>
            <p>30% of every plan, every month, for as long as your referral stays. Recurring — not a one-time payout.</p>
          </div>
          <div>
            <h3>Who it&apos;s for</h3>
            <p>Annual subscribers who love Sovereign and want to share it. The affiliate program is included with your 1-year plan.</p>
          </div>
        </div>

        <a href="mailto:hello@sovereignplanner.com?subject=Affiliate%20program" className="cta">Apply by email →</a>

        <div className="fine">
          Affiliate access is included with the 1-year Sovereign plan. Other plans can request to join — we review applications individually.
        </div>
      </div>
    </div>
  );
}
