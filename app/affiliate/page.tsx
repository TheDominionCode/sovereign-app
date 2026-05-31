import Link from "next/link";

export const metadata = { title: "The Sovereign Affiliate" };

const css = `
  .aff-root{font-family:'Inter',sans-serif;background:#f5efe6;color:#1a1816;min-height:100vh;font-weight:300;line-height:1.6}
  .aff-root *{box-sizing:border-box;margin:0;padding:0}
  .aff-root a{color:inherit;text-decoration:none}
  .aff-root .serif{font-family:'Cormorant Garamond',serif}
  .aff-root .italic{font-style:italic;color:#856a3f}

  .aff-root .container{max-width:920px;margin:0 auto;padding:0 28px}
  .aff-root .back{display:inline-block;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#856a3f;margin-top:40px}
  .aff-root .back:hover{color:#1a1816}
  .aff-root .eyebrow{font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#856a3f;margin-bottom:18px;text-align:center}

  /* Hero */
  .aff-root .hero{padding:80px 0 64px;text-align:center}
  .aff-root .hero h1{font-family:'Cormorant Garamond',serif;font-size:clamp(48px,7vw,84px);font-weight:400;letter-spacing:-0.02em;line-height:1.02;margin-bottom:24px}
  .aff-root .hero .lead{font-family:'Cormorant Garamond',serif;font-size:24px;line-height:1.5;color:#2c2926;font-style:italic;max-width:680px;margin:0 auto 36px}
  .aff-root .hero .meta{font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:#6b6258}

  /* The story */
  .aff-root .story{padding:80px 0;background:#ece3d3}
  .aff-root .story h2{font-family:'Cormorant Garamond',serif;font-size:clamp(38px,5vw,56px);font-weight:400;line-height:1.1;margin-bottom:28px;text-align:center}
  .aff-root .story p{font-size:17px;line-height:1.85;color:#2c2926;margin-bottom:18px;max-width:680px;margin-left:auto;margin-right:auto}

  /* Numbers grid */
  .aff-root .numbers{padding:80px 0;background:#f5efe6}
  .aff-root .numbers h2{font-family:'Cormorant Garamond',serif;font-size:clamp(38px,5vw,56px);font-weight:400;line-height:1.1;margin-bottom:48px;text-align:center}
  .aff-root .num-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
  .aff-root .num-card{background:#fff;border:1px solid #d9cdb8;padding:36px 28px;border-radius:4px;text-align:center}
  .aff-root .num-card .big{font-family:'Cormorant Garamond',serif;font-size:64px;line-height:1;color:#856a3f;font-weight:400;margin-bottom:12px}
  .aff-root .num-card .big small{font-size:24px;color:#a8895a}
  .aff-root .num-card .label{font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#1a1816;font-weight:500;margin-bottom:8px}
  .aff-root .num-card p{font-size:14px;color:#6b6258;line-height:1.6;font-family:'Cormorant Garamond',serif;font-style:italic}

  /* How it works */
  .aff-root .how{padding:80px 0;background:#ece3d3}
  .aff-root .how h2{font-family:'Cormorant Garamond',serif;font-size:clamp(38px,5vw,56px);font-weight:400;line-height:1.1;margin-bottom:56px;text-align:center}
  .aff-root .steps{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}
  .aff-root .step{text-align:center;padding:0 8px}
  .aff-root .step .num{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:32px;color:#856a3f;margin-bottom:14px}
  .aff-root .step h3{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;margin-bottom:10px;color:#1a1816}
  .aff-root .step p{font-size:14px;line-height:1.7;color:#6b6258}

  /* Qualify */
  .aff-root .qualify{padding:80px 0;background:#f5efe6}
  .aff-root .qualify h2{font-family:'Cormorant Garamond',serif;font-size:clamp(38px,5vw,56px);font-weight:400;line-height:1.1;margin-bottom:28px;text-align:center}
  .aff-root .qualify .sub{font-family:'Cormorant Garamond',serif;font-size:20px;line-height:1.6;color:#2c2926;font-style:italic;max-width:600px;margin:0 auto 36px;text-align:center}
  .aff-root .qualify ul{max-width:560px;margin:0 auto;list-style:none;padding:0}
  .aff-root .qualify li{padding:18px 0;border-bottom:1px solid #d9cdb8;font-family:'Cormorant Garamond',serif;font-size:19px;color:#2c2926;display:flex;gap:14px}
  .aff-root .qualify li:last-child{border-bottom:none}
  .aff-root .qualify li::before{content:"—";color:#856a3f;font-weight:400}

  /* CTA */
  .aff-root .cta-band{padding:96px 0;background:linear-gradient(180deg,rgba(26,24,22,0.6),rgba(26,24,22,0.85)),radial-gradient(circle at 50% 30%,#5c4a32,#1a1816 75%);color:#f5efe6;text-align:center}
  .aff-root .cta-band h2{font-family:'Cormorant Garamond',serif;font-size:clamp(40px,5.5vw,64px);font-weight:400;line-height:1.1;margin-bottom:24px;color:#f5efe6}
  .aff-root .cta-band h2 .italic{color:#a8895a}
  .aff-root .cta-band p{color:rgba(245,239,230,0.78);max-width:560px;margin:0 auto 36px;font-size:17px}
  .aff-root .cta-btn{display:inline-block;padding:20px 44px;background:#a8895a;color:#1a1816;font-size:13px;letter-spacing:0.22em;text-transform:uppercase;border-radius:999px;font-weight:500;transition:all .25s}
  .aff-root .cta-btn:hover{background:#f5efe6}
  .aff-root .cta-fine{margin-top:24px;font-size:12px;color:rgba(245,239,230,0.5);letter-spacing:0.12em}

  /* Fine print */
  .aff-root .fine{padding:60px 0 80px;background:#1a1816;color:rgba(245,239,230,0.55)}
  .aff-root .fine h3{font-family:'Cormorant Garamond',serif;font-size:18px;letter-spacing:0.16em;text-transform:uppercase;color:#a8895a;margin-bottom:18px;font-weight:500}
  .aff-root .fine p{font-size:13px;line-height:1.85;margin-bottom:10px;font-family:'Cormorant Garamond',serif;font-style:italic}

  @media (max-width:760px){
    .aff-root .num-grid{grid-template-columns:1fr;gap:14px}
    .aff-root .steps{grid-template-columns:1fr 1fr;gap:32px 16px}
    .aff-root section{padding:60px 0}
    .aff-root .hero{padding:60px 0 40px}
  }
`;

const APPLY_HREF =
  "mailto:hello@sovereignplanner.com?subject=Sovereign%20Affiliate%20Application&body=Hi%20Nataly%2C%0A%0AI%27d%20love%20to%20become%20a%20Sovereign%20affiliate.%0A%0AMy%20email%20on%20Sovereign%3A%20%0AWhy%20I%20use%20it%3A%20%0AHow%20I%20plan%20to%20share%20it%3A%20%0A%0AThank%20you%2C%0A%5BYour%20name%5D";

export default function AffiliatePage() {
  return (
    <div className="aff-root">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="container">
        <Link href="/" className="back">
          ← Back to Sovereign
        </Link>
      </div>

      <section className="hero">
        <div className="container">
          <div className="eyebrow">The Sovereign Affiliate</div>
          <h1>
            Share what brought you <span className="italic">back to yourself</span>
          </h1>
          <p className="lead">
            Earn <strong>40% commission</strong> on every annual Sovereign plan you refer —
            $51.99 per sale, paid as a one-time commission.
          </p>
          <div className="meta">Annual subscribers · One-time commission · Monthly payouts</div>
        </div>
      </section>

      <section className="story">
        <div className="container">
          <h2>For the women who already <span className="italic">live it</span></h2>
          <p>
            Sovereign was built quietly, for women who&apos;d done shrinking. If it gave you a softer
            morning — a daily practice that brought you home to yourself — then someone in your world
            needs to know it exists.
          </p>
          <p>
            The Sovereign Affiliate is for women already inside the Annual plan who want to share
            what works. Not a hustle. Not a funnel. A way to put real money in your pocket for an
            introduction you&apos;d make anyway.
          </p>
          <p>
            We pay <strong>40% on every annual subscription you refer</strong> — $51.99 per sale,
            paid as a one-time commission the month after her free trial converts.
            Refer 10 in a month and you&apos;ve put $519.90 in your pocket.
          </p>
        </div>
      </section>

      <section className="numbers">
        <div className="container">
          <div className="eyebrow">The numbers</div>
          <h2>Honest, generous, simple</h2>
          <div className="num-grid">
            <div className="num-card">
              <div className="big">
                40<small>%</small>
              </div>
              <div className="label">Commission</div>
              <p>On every annual Sovereign plan you refer</p>
            </div>
            <div className="num-card">
              <div className="big">
                $51<small>.99</small>
              </div>
              <div className="label">Per referral</div>
              <p>One-time, paid the month after her trial converts</p>
            </div>
            <div className="num-card">
              <div className="big">
                30<small>d</small>
              </div>
              <div className="label">Cookie window</div>
              <p>If she clicks your link and signs up within 30 days, she&apos;s yours</p>
            </div>
          </div>
        </div>
      </section>

      <section className="how">
        <div className="container">
          <div className="eyebrow">How it works</div>
          <h2>
            Four steps, <span className="italic">no funnel</span>
          </h2>
          <div className="steps">
            <div className="step">
              <div className="num">i.</div>
              <h3>Apply</h3>
              <p>Email us a few lines about why you use Sovereign and how you&apos;d like to share it.</p>
            </div>
            <div className="step">
              <div className="num">ii.</div>
              <h3>Get your link</h3>
              <p>Once approved, you receive a unique referral link and a private commission ledger.</p>
            </div>
            <div className="step">
              <div className="num">iii.</div>
              <h3>Share it</h3>
              <p>Post your honest experience. Stories, screenshots, voice notes — however feels true.</p>
            </div>
            <div className="step">
              <div className="num">iv.</div>
              <h3>Get paid</h3>
              <p>One-time commission lands on the first of the month after her trial converts.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="qualify">
        <div className="container">
          <div className="eyebrow">Who it&apos;s for</div>
          <h2>Real users only</h2>
          <p className="sub">
            We only approve women already on the Annual plan — because the best people to sell
            Sovereign are the ones who actually live in it.
          </p>
          <ul>
            <li>You&apos;re on the $129.99 / year Sovereign Annual plan</li>
            <li>You&apos;ve used the app for at least 14 days</li>
            <li>You&apos;re sharing because you genuinely love it — not as a side hustle</li>
            <li>You agree to the simple terms in the application reply</li>
          </ul>
        </div>
      </section>

      <section className="cta-band">
        <div className="container">
          <div className="eyebrow" style={{ color: "#a8895a" }}>
            Apply
          </div>
          <h2>
            Become a <span className="italic">Sovereign Affiliate</span>
          </h2>
          <p>
            Send a short note. We read every application and respond within 3 days. Approved
            affiliates receive their link within 24 hours after that.
          </p>
          <a href={APPLY_HREF} className="cta-btn">
            Apply by email →
          </a>
          <div className="cta-fine">No application fee · Approval at our discretion</div>
        </div>
      </section>

      <section className="fine">
        <div className="container">
          <h3>The honest fine print</h3>
          <p>
            Commissions are paid only on referrals to the $129.99 / year Sovereign Annual plan.
            Monthly, 3-month, and 6-month plan referrals do not earn commission. Commission is a
            one-time payment of $51.99 per qualified referral — not recurring on renewals.
          </p>
          <p>
            Self-referrals are not eligible. Commission is contingent on the referred customer
            staying past their 3-day free trial and beyond any refund window. If a customer
            cancels or charges back, the corresponding commission is reversed.
          </p>
          <p>
            You must be on the Annual plan to earn commission. Any commissions already earned
            and not yet paid will be honored if you cancel your own subscription.
          </p>
          <p>
            We reserve the right to terminate affiliate participation for any reason, including
            misleading marketing, spam, fraudulent traffic, or anything that conflicts with the
            quiet integrity of the Sovereign brand.
          </p>
          <p>
            Affiliate program terms may evolve; we&apos;ll give 30 days&apos; notice of material
            changes by email.
          </p>
        </div>
      </section>
    </div>
  );
}
