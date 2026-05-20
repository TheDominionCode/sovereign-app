"use client";

import { Fragment, useState } from "react";
import { startCheckoutAction } from "./pricing/actions";

const landingCss = `
  :root{
    --ivory:#f5efe6;
    --cream:#ece3d3;
    --sand:#dccdb4;
    --ink:#1a1816;
    --char:#2c2926;
    --muted:#6b6258;
    --gold:#a8895a;
    --gold-deep:#856a3f;
    --line:#d9cdb8;
    --soft:#ffffff;
  }
  .landing-root *{box-sizing:border-box;margin:0;padding:0}
  .landing-root{
    font-family:'Inter',sans-serif;
    background:var(--ivory);
    color:var(--ink);
    line-height:1.6;
    font-weight:300;
    -webkit-font-smoothing:antialiased;
  }
  .landing-root .serif{font-family:'Cormorant Garamond',serif}
  .landing-root .italic{font-style:italic;font-weight:400;color:var(--gold-deep)}
  .landing-root a{color:inherit;text-decoration:none}
  .landing-root .container{max-width:1180px;margin:0 auto;padding:0 28px}

  .landing-root nav{
    position:sticky;top:0;z-index:50;
    background:rgba(245,239,230,0.88);
    backdrop-filter:blur(14px);
    -webkit-backdrop-filter:blur(14px);
    border-bottom:1px solid rgba(168,137,90,0.18);
  }
  .landing-root .nav-row{
    display:flex;align-items:center;justify-content:space-between;
    padding:18px 0;
  }
  .landing-root .logo{
    font-family:'Cormorant Garamond',serif;
    font-size:24px;letter-spacing:0.32em;font-weight:500;
    text-transform:uppercase;
  }
  .landing-root .logo span{font-style:italic;letter-spacing:0;color:var(--gold-deep);text-transform:lowercase;padding-right:6px;font-weight:400}
  .landing-root .nav-links{display:flex;gap:36px;align-items:center}
  .landing-root .nav-links a{font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:var(--char);transition:color .2s}
  .landing-root .nav-links a:hover{color:var(--gold-deep)}
  .landing-root .nav-cta{
    background:var(--gold-deep);color:var(--ivory);
    padding:11px 22px;border-radius:999px;
    font-size:11px;letter-spacing:0.2em;text-transform:uppercase;
    transition:all .25s;
  }
  .landing-root .nav-cta:hover{background:var(--char);color:#fff}
  .landing-root .nav-price{
    display:inline-flex;align-items:baseline;gap:6px;
    padding:8px 16px;border:1px solid var(--gold-deep);
    border-radius:999px;background:transparent;
    transition:all .25s;
    font-family:'Cormorant Garamond',serif;
  }
  .landing-root .nav-price:hover{background:var(--gold-deep);color:var(--ivory)}
  .landing-root .nav-price:hover .nav-price-label,
  .landing-root .nav-price:hover .nav-price-amt{color:var(--ivory)}
  .landing-root .nav-price-label{
    font-family:'Inter',sans-serif;
    font-size:10px;letter-spacing:0.22em;
    text-transform:uppercase;color:var(--muted);
    transition:color .25s;
  }
  .landing-root .nav-price-amt{
    font-size:18px;font-weight:500;font-style:italic;
    color:var(--gold-deep);transition:color .25s;
  }
  .landing-root .nav-price-suffix{
    font-size:11px;letter-spacing:0.16em;text-transform:uppercase;
    font-family:'Inter',sans-serif;font-style:normal;color:var(--muted);margin-left:2px;
  }
  .landing-root .nav-right{display:flex;align-items:center;gap:14px}
  .landing-root .burger{display:none;font-size:22px;cursor:pointer}
  .landing-root .lang-toggle{
    display:inline-flex;align-items:center;
    border:1px solid var(--gold-deep);border-radius:999px;padding:2px;
  }
  .landing-root .lang-toggle button{
    font-family:'Inter',sans-serif;font-size:10px;letter-spacing:0.14em;
    text-transform:uppercase;padding:5px 11px;border-radius:999px;
    background:transparent;border:none;cursor:pointer;color:var(--gold-deep);
    transition:all .2s;
  }
  .landing-root .lang-toggle button.active{background:var(--gold-deep);color:var(--ivory)}
  .landing-root .nav-login{
    font-size:12px;letter-spacing:0.22em;text-transform:uppercase;
    color:var(--char);transition:color .2s;
  }
  .landing-root .nav-login:hover{color:var(--gold-deep)}

  .landing-root .hero{
    position:relative;
    padding:90px 0 110px;
    overflow:hidden;
  }
  .landing-root .hero-grid{
    display:grid;grid-template-columns:1.05fr 0.95fr;
    gap:80px;align-items:center;
  }
  .landing-root .eyebrow{
    font-size:11px;letter-spacing:0.42em;text-transform:uppercase;
    color:var(--gold-deep);margin-bottom:28px;
    display:inline-flex;align-items:center;gap:14px;
  }
  .landing-root .eyebrow::before{content:"";width:30px;height:1px;background:var(--gold-deep)}
  .landing-root h1{
    font-family:'Cormorant Garamond',serif;
    font-size:clamp(48px,7vw,92px);
    line-height:0.98;font-weight:500;
    letter-spacing:-0.01em;
    text-transform:uppercase;
    margin-bottom:32px;
  }
  .landing-root h1 .italic{text-transform:lowercase;letter-spacing:0}
  .landing-root .hero-sub{
    font-size:18px;color:var(--muted);max-width:520px;
    margin-bottom:44px;line-height:1.7;
  }
  .landing-root .cta-row{display:flex;gap:16px;flex-wrap:wrap;align-items:center}
  .landing-root .btn{
    display:inline-flex;align-items:center;gap:10px;
    padding:18px 32px;border-radius:999px;
    font-size:12px;letter-spacing:0.22em;text-transform:uppercase;
    font-weight:500;cursor:pointer;border:none;
    transition:all .25s;
  }
  .landing-root .btn-primary{background:var(--gold-deep);color:var(--ivory)}
  .landing-root .btn-primary:hover{background:var(--char);transform:translateY(-1px)}
  .landing-root .btn-ghost{
    background:transparent;border:1px solid var(--gold-deep);color:var(--gold-deep);
  }
  .landing-root .btn-ghost:hover{background:var(--gold-deep);color:var(--ivory)}
  .landing-root .trust-row{
    margin-top:38px;display:flex;align-items:center;gap:18px;
    font-size:13px;color:var(--muted);
  }
  .landing-root .trust-row .dot{width:6px;height:6px;background:var(--gold);border-radius:50%}
  .landing-root .hero-visual{
    position:relative;aspect-ratio:4/5;
    border-radius:6px;overflow:hidden;
    background:linear-gradient(160deg,#3d342a 0%,#1a1816 70%);
    box-shadow:0 30px 60px -20px rgba(26,24,22,0.35);
  }
  .landing-root .hero-visual img{
    position:absolute;inset:0;
    width:100%;height:100%;
    object-fit:cover;object-position:center;
    display:block;
  }
  .landing-root .hero-visual::after{
    content:"";position:absolute;inset:0;z-index:1;
    background:linear-gradient(180deg,transparent 45%,rgba(26,24,22,0.55) 100%);
    pointer-events:none;
  }
  .landing-root .hero-quote{
    position:absolute;left:32px;bottom:32px;right:32px;
    font-family:'Cormorant Garamond',serif;
    color:var(--ivory);font-style:italic;font-size:22px;
    line-height:1.4;z-index:2;
    text-shadow:0 2px 16px rgba(0,0,0,0.4);
  }
  .landing-root .hero-quote::before{
    content:"";display:block;width:36px;height:1px;
    background:rgba(245,239,230,0.6);margin-bottom:14px;
  }

  .landing-root .strip{
    background:var(--gold-deep);color:var(--ivory);
    padding:22px 0;overflow:hidden;
    border-top:1px solid var(--gold);
    border-bottom:1px solid var(--gold);
  }
  .landing-root .strip-inner{
    display:flex;gap:60px;white-space:nowrap;
    animation:landingScroll 35s linear infinite;
    font-family:'Cormorant Garamond',serif;
    font-style:italic;font-size:20px;letter-spacing:0.05em;
  }
  .landing-root .strip-inner span{display:inline-flex;align-items:center;gap:60px}
  .landing-root .strip-inner span::after{content:"✦";color:var(--ivory)}
  @keyframes landingScroll{
    0%{transform:translateX(0)}
    100%{transform:translateX(-50%)}
  }

  .landing-root section{padding:120px 0}
  .landing-root .section-eyebrow{
    text-align:center;
    font-size:11px;letter-spacing:0.42em;text-transform:uppercase;
    color:var(--gold-deep);margin-bottom:24px;
  }
  .landing-root h2{
    font-family:'Cormorant Garamond',serif;
    font-size:clamp(38px,5.5vw,68px);
    line-height:1.02;font-weight:500;
    letter-spacing:-0.01em;text-transform:uppercase;
    text-align:center;margin-bottom:24px;
  }
  .landing-root h2 .italic{text-transform:lowercase}
  .landing-root .section-sub{
    text-align:center;font-size:17px;color:var(--muted);
    max-width:640px;margin:0 auto 70px;line-height:1.7;
  }

  .landing-root .pillars{background:var(--cream)}
  .landing-root .pillar-grid{
    display:grid;grid-template-columns:repeat(3,1fr);gap:48px;
  }
  .landing-root .pillar{
    background:var(--ivory);
    padding:48px 36px;border-radius:4px;
    border:1px solid var(--line);
    transition:all .3s;
  }
  .landing-root .pillar:hover{transform:translateY(-4px);box-shadow:0 24px 50px -25px rgba(26,24,22,0.2)}
  .landing-root .pillar-num{
    font-family:'Cormorant Garamond',serif;
    font-style:italic;font-size:48px;color:var(--gold-deep);
    line-height:1;margin-bottom:24px;
  }
  .landing-root .pillar h3{
    font-family:'Cormorant Garamond',serif;
    font-size:28px;font-weight:500;
    text-transform:uppercase;letter-spacing:0.02em;
    margin-bottom:14px;
  }
  .landing-root .pillar p{color:var(--muted);font-size:15px;line-height:1.7}

  .landing-root .trial{
    background:var(--ink);color:var(--ivory);
    text-align:center;padding:90px 0;
    border-top:1px solid var(--gold-deep);
    border-bottom:1px solid var(--gold-deep);
  }
  .landing-root .trial .section-eyebrow{color:var(--gold)}
  .landing-root .trial h2{color:var(--ivory)}
  .landing-root .trial h2 .italic{color:var(--gold)}
  .landing-root .trial p{color:rgba(245,239,230,0.7);max-width:580px;margin:0 auto 36px;font-size:17px}
  .landing-root .trial .btn-primary{background:var(--ivory);color:var(--ink)}
  .landing-root .trial .btn-primary:hover{background:var(--gold);color:var(--ink)}
  .landing-root .trial-meta{
    margin-top:24px;font-size:12px;letter-spacing:0.16em;
    text-transform:uppercase;color:rgba(245,239,230,0.5);
  }

  .landing-root .pricing{background:var(--ivory)}
  .landing-root .price-grid{
    display:grid;grid-template-columns:repeat(4,1fr);gap:22px;
  }
  .landing-root .price-card{
    background:#fff;
    border:1px solid var(--line);
    border-radius:4px;
    padding:42px 28px;
    display:flex;flex-direction:column;
    transition:all .3s;
    position:relative;
  }
  .landing-root .price-card:hover{
    transform:translateY(-4px);
    box-shadow:0 24px 50px -25px rgba(26,24,22,0.18);
    border-color:var(--gold);
  }
  .landing-root .price-card.featured{
    background:var(--gold-deep);
    color:var(--ivory);
    border-color:var(--gold-deep);
    transform:scale(1.03);
    box-shadow:0 24px 50px -20px rgba(133,106,63,0.4);
  }
  .landing-root .price-card.featured:hover{transform:scale(1.03) translateY(-4px)}
  .landing-root .badge{
    position:absolute;top:-12px;left:50%;
    transform:translateX(-50%);
    background:var(--ivory);color:var(--gold-deep);
    font-size:10px;letter-spacing:0.24em;
    text-transform:uppercase;font-weight:600;
    padding:6px 16px;border-radius:999px;
    white-space:nowrap;
    border:1px solid var(--gold);
  }
  .landing-root .price-tier{
    font-family:'Cormorant Garamond',serif;
    font-size:22px;text-transform:uppercase;
    letter-spacing:0.08em;font-weight:500;
    margin-bottom:8px;
  }
  .landing-root .price-tag{
    font-family:'Cormorant Garamond',serif;
    font-size:56px;font-weight:500;line-height:1;
    margin:18px 0 6px;
  }
  .landing-root .price-tag .cents{font-size:24px;color:var(--muted);vertical-align:top;margin-left:2px}
  .landing-root .price-card.featured .price-tag .cents{color:rgba(245,239,230,0.6)}
  .landing-root .price-period{
    font-size:12px;letter-spacing:0.18em;text-transform:uppercase;
    color:var(--muted);margin-bottom:8px;
  }
  .landing-root .price-card.featured .price-period{color:rgba(245,239,230,0.6)}
  .landing-root .price-savings{
    font-family:'Cormorant Garamond',serif;
    font-style:italic;font-size:15px;color:var(--gold-deep);
    margin-bottom:30px;min-height:22px;
  }
  .landing-root .price-card.featured .price-savings{color:var(--gold)}
  .landing-root .price-features{
    list-style:none;margin:0 0 32px;
    border-top:1px solid var(--line);padding-top:24px;
    flex:1;
  }
  .landing-root .price-card.featured .price-features{border-top-color:rgba(245,239,230,0.15)}
  .landing-root .price-features li{
    font-size:14px;padding:8px 0;color:var(--char);
    display:flex;align-items:flex-start;gap:10px;
  }
  .landing-root .price-card.featured .price-features li{color:rgba(245,239,230,0.85)}
  .landing-root .price-features li::before{
    content:"✦";color:var(--gold-deep);font-size:11px;
    margin-top:3px;
  }
  .landing-root .price-card.featured .price-features li::before{color:var(--gold)}
  .landing-root .price-btn{
    width:100%;padding:16px;
    background:transparent;border:1px solid var(--gold-deep);
    color:var(--gold-deep);text-align:center;
    font-size:11px;letter-spacing:0.22em;text-transform:uppercase;
    font-weight:500;cursor:pointer;border-radius:999px;
    transition:all .25s;
  }
  .landing-root .price-btn:hover{background:var(--gold-deep);color:var(--ivory)}
  .landing-root .price-card.featured .price-btn{
    background:var(--ivory);border-color:var(--ivory);color:var(--gold-deep);
  }
  .landing-root .price-card.featured .price-btn:hover{background:var(--char);border-color:var(--char);color:var(--ivory)}
  .landing-root .price-fine{
    text-align:center;color:var(--muted);font-size:13px;
    margin-top:48px;font-style:italic;
    font-family:'Cormorant Garamond',serif;
  }

  .landing-root .testimonials{background:var(--cream)}
  .landing-root .quote-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;margin-top:20px}
  .landing-root .quote{
    background:var(--ivory);padding:42px 32px;
    border:1px solid var(--line);border-radius:4px;
  }
  .landing-root .stars{color:var(--gold);font-size:14px;letter-spacing:4px;margin-bottom:18px}
  .landing-root .quote p{
    font-family:'Cormorant Garamond',serif;
    font-size:21px;line-height:1.5;font-style:italic;
    color:var(--char);margin-bottom:24px;
  }
  .landing-root .quote-author{
    font-size:12px;letter-spacing:0.22em;
    text-transform:uppercase;color:var(--gold-deep);
  }

  .landing-root .faq{background:var(--ivory)}
  .landing-root .faq-list{max-width:780px;margin:0 auto}
  .landing-root details{
    border-bottom:1px solid var(--line);
    padding:28px 0;cursor:pointer;
  }
  .landing-root details:first-child{border-top:1px solid var(--line)}
  .landing-root summary{
    list-style:none;
    font-family:'Cormorant Garamond',serif;
    font-size:24px;font-weight:500;
    display:flex;justify-content:space-between;align-items:center;
    gap:24px;
  }
  .landing-root summary::-webkit-details-marker{display:none}
  .landing-root summary::after{
    content:"+";font-size:28px;color:var(--gold-deep);
    transition:transform .25s;font-weight:300;
  }
  .landing-root details[open] summary::after{content:"−"}
  .landing-root details p{
    color:var(--muted);font-size:15px;line-height:1.75;
    margin-top:14px;padding-right:48px;
  }

  .landing-root .final-cta{
    background:
      linear-gradient(180deg,rgba(26,24,22,0.6),rgba(26,24,22,0.85)),
      radial-gradient(circle at 50% 30%,#5c4a32,#1a1816 75%);
    color:var(--ivory);text-align:center;
  }
  .landing-root .final-cta h2{color:var(--ivory)}
  .landing-root .final-cta h2 .italic{color:var(--gold)}
  .landing-root .final-cta p{color:rgba(245,239,230,0.75);max-width:560px;margin:0 auto 40px;font-size:17px}
  .landing-root .final-cta .btn-primary{background:var(--gold);color:var(--ink)}
  .landing-root .final-cta .btn-primary:hover{background:var(--ivory)}

  .landing-root footer{
    background:var(--ink);color:rgba(245,239,230,0.7);
    padding:60px 0 36px;
  }
  .landing-root .foot-grid{
    display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:48px;
    margin-bottom:48px;
  }
  .landing-root .foot-grid h4{
    font-family:'Cormorant Garamond',serif;
    color:var(--ivory);font-size:18px;
    text-transform:uppercase;letter-spacing:0.18em;
    font-weight:500;margin-bottom:18px;
  }
  .landing-root .foot-grid a{display:block;font-size:14px;padding:4px 0;transition:color .2s}
  .landing-root .foot-grid a:hover{color:var(--gold)}
  .landing-root .foot-grid p{font-size:14px;line-height:1.7;max-width:340px}
  .landing-root .foot-grid .logo{color:var(--ivory);margin-bottom:18px;font-size:22px}
  .landing-root .foot-grid .logo span{color:var(--gold)}
  .landing-root .foot-bottom{
    border-top:1px solid rgba(245,239,230,0.12);
    padding-top:28px;
    display:flex;justify-content:space-between;align-items:center;
    font-size:12px;letter-spacing:0.1em;
    color:rgba(245,239,230,0.45);
  }

  .landing-root .trial-form{display:inline-block}
  .landing-root .price-form{margin-top:auto}

  @media (max-width:960px){
    .landing-root .hero-grid{grid-template-columns:1fr;gap:48px}
    .landing-root .pillar-grid,
    .landing-root .quote-grid{grid-template-columns:1fr;gap:20px}
    .landing-root .price-grid{grid-template-columns:1fr 1fr;gap:18px}
    .landing-root .price-card.featured{transform:none}
    .landing-root .price-card.featured:hover{transform:translateY(-4px)}
    .landing-root section{padding:80px 0}
    .landing-root .nav-links{display:none}
    .landing-root .burger{display:block}
    .landing-root .foot-grid{grid-template-columns:1fr 1fr;gap:32px}
  }
  @media (max-width:560px){
    .landing-root .price-grid{grid-template-columns:1fr}
    .landing-root .foot-grid{grid-template-columns:1fr}
    .landing-root .foot-bottom{flex-direction:column;gap:10px;text-align:center}
    .landing-root .cta-row{flex-direction:column;align-items:stretch}
    .landing-root .btn{justify-content:center}
  }
`;

type Lang = "en" | "es";
type PlanId = "1mo" | "3mo" | "6mo" | "12mo";

type PlanBase = {
  planId: PlanId;
  dollars: string;
  cents: string;
  featured?: boolean;
};

const PLAN_BASE: PlanBase[] = [
  { planId: "1mo", dollars: "$14", cents: ".99" },
  { planId: "3mo", dollars: "$39", cents: ".99" },
  { planId: "6mo", dollars: "$74", cents: ".99", featured: true },
  { planId: "12mo", dollars: "$99", cents: ".99" },
];

// A headline part: a plain string (where "\n" becomes a line break) or
// { i } for a gold italic span.
type Part = string | { i: string };

function renderParts(parts: Part[]) {
  return parts.map((p, idx) => {
    if (typeof p !== "string") {
      return (
        <span key={idx} className="italic">
          {p.i}
        </span>
      );
    }
    const segs = p.split("\n");
    return (
      <Fragment key={idx}>
        {segs.map((s, j) => (
          <Fragment key={j}>
            {s}
            {j < segs.length - 1 && <br />}
          </Fragment>
        ))}
      </Fragment>
    );
  });
}

type PlanCopy = {
  tier: string;
  period: string;
  savings: string;
  features: string[];
  badge?: string;
};

type Copy = {
  nav: { method: string; reviews: string; faq: string; login: string; from: string; startFree: string };
  hero: {
    eyebrow: string;
    title: Part[];
    sub: string;
    ctaPrimary: string;
    ctaGhost: string;
    trust: string;
    quote: Part[];
  };
  strip: string[];
  pillars: {
    eyebrow: string;
    title: Part[];
    sub: string;
    items: { num: string; title: string; desc: string }[];
  };
  trial: { eyebrow: string; title: Part[]; body: string; cta: string; meta: string };
  pricing: { eyebrow: string; title: Part[]; sub: string; fine: string; cardBtn: string };
  plans: Record<PlanId, PlanCopy>;
  reviews: { eyebrow: string; title: Part[]; quotes: { text: string; author: string }[] };
  faq: { eyebrow: string; title: Part[]; items: { q: string; a: string }[] };
  finalCta: { eyebrow: string; title: Part[]; body: string; cta: string };
  footer: {
    tagline: string;
    property: string;
    exploreHead: string;
    explore: { label: string; href: string }[];
    supportHead: string;
    support: { label: string; href: string }[];
    legalHead: string;
    legal: { label: string; href: string }[];
    copyright: string;
    madeWith: string;
  };
};

const COPY: Record<Lang, Copy> = {
  en: {
    nav: { method: "Method", reviews: "Reviews", faq: "FAQ", login: "Log in", from: "From", startFree: "Start Free" },
    hero: {
      eyebrow: "A new way to rise",
      title: ["Live ", { i: "in" }, " your\nSovereign ", { i: "power" }],
      sub: "Sovereign is a quiet practice for the woman who's done shrinking. Daily rituals, mindset work, and intentional design — built to return you to yourself.",
      ctaPrimary: "Start 3 Days Free →",
      ctaGhost: "The Method",
      trust: "3 days free · card on file · cancel anytime",
      quote: ["Sovereignty isn't loud.\nIt's the woman who knows\nher own pace."],
    },
    strip: ["Rooted", "Radiant", "Reverent", "Refined", "Resolute"],
    pillars: {
      eyebrow: "The Method",
      title: ["Three pillars,\none ", { i: "sovereign" }, " woman"],
      sub: "Every ritual inside Sovereign returns to three roots — the foundation of a life lived on your own terms.",
      items: [
        {
          num: "i.",
          title: "Stillness",
          desc: "Guided morning practices, breathwork, and journaling prompts that anchor you before the world has a chance to pull you off-center.",
        },
        {
          num: "ii.",
          title: "Strength",
          desc: "Mindset audios, somatic resets, and weekly intentions designed to rebuild trust with yourself, one decision at a time.",
        },
        {
          num: "iii.",
          title: "Sovereignty",
          desc: "Boundary work, money rituals, and embodiment practices that translate your inner clarity into the way you actually live.",
        },
      ],
    },
    trial: {
      eyebrow: "An invitation",
      title: ["Three days,\non ", { i: "us" }],
      body: "Step inside Sovereign with full access for 72 hours. Add a card to begin — we won't charge until day four, and you can leave anytime before then.",
      cta: "Begin Your Free Trial →",
      meta: "No commitment · Cancel anytime · Card secured by Stripe",
    },
    pricing: {
      eyebrow: "Choose your pace",
      title: ["Find ", { i: "your" }, " plan"],
      sub: "Choosing your plan is more than a subscription — it's a return to yourself. Every option begins with 3 days free.",
      fine: "All plans include a 3-day free trial. Card on file required — you won't be charged until day four.",
      cardBtn: "Start 3 Days Free",
    },
    plans: {
      "1mo": {
        tier: "Monthly",
        period: "Billed every month",
        savings: "",
        features: ["Full library access", "Daily rituals & audios", "Weekly intention drops", "Cancel anytime"],
      },
      "3mo": {
        tier: "3 Months",
        period: "Billed quarterly",
        savings: "save 11% · $13.33/mo",
        features: ["Everything in Monthly", "Quarterly seasonal guide", "Private community access", "Cancel anytime"],
      },
      "6mo": {
        tier: "6 Months",
        period: "Billed every 6 months",
        savings: "save 17% · $12.50/mo",
        features: ["Everything in 3 Months", "Bonus embodiment series", "Quarterly live sessions", "Founder Q&A access"],
        badge: "Most Loved",
      },
      "12mo": {
        tier: "1 Year",
        period: "Billed annually",
        savings: "save 44% · $8.33/mo",
        features: ["Everything in 6 Months", "Full year of seasonal guides", "The Sovereign Annual Retreat", "Lock in this rate for life"],
      },
    },
    reviews: {
      eyebrow: "In her words",
      title: ["The ", { i: "reviews" }],
      quotes: [
        {
          text: "I didn't realize how loud my life had become until Sovereign gave me a quieter way to start every morning. I feel like myself again.",
          author: "— Amara R.",
        },
        {
          text: "This isn't another wellness app. It's a return. Every ritual feels like it was written for me on the day I need it most.",
          author: "— Jules K.",
        },
        {
          text: "Three months in and my boundaries are clearer, my mornings are slower, and my decisions are mine again. Worth every cent.",
          author: "— Sienna M.",
        },
      ],
    },
    faq: {
      eyebrow: "Clarity",
      title: ["Let's clear\nthings ", { i: "up" }],
      items: [
        {
          q: "How does the 3-day free trial work?",
          a: "Choose any plan and add your card to begin. You'll receive full, immediate access to Sovereign for 72 hours. If it's not for you, cancel before day four and you won't be charged a cent. If you stay, your chosen plan begins automatically.",
        },
        {
          q: "Why do you need a card on file?",
          a: "The card on file lets us hold your spot and seamlessly continue your practice if you decide to stay. It's not charged during your trial. Your payment information is encrypted and processed securely through Stripe.",
        },
        {
          q: "Can I cancel anytime?",
          a: "Yes. You can cancel before your trial ends — or at any point during a paid plan — and you'll retain access through the end of your billing period. No hoops, no holds.",
        },
        {
          q: "What's actually inside Sovereign?",
          a: "A growing library of guided rituals, mindset audios, breathwork sessions, journaling prompts, embodiment practices, weekly intentions, and seasonal guides — all designed to be done in small, sustainable pockets of your day.",
        },
        {
          q: "Which plan should I choose?",
          a: "Monthly is perfect if you want to try it out. 3-month and 6-month are for women ready to settle in. The annual plan offers the deepest value and includes our annual retreat — it's the choice for the long road home.",
        },
        {
          q: "Will my price change later?",
          a: "No. The rate you start with is locked in for the length of your plan. Annual subscribers lock in their rate for life — even if pricing changes for new members.",
        },
      ],
    },
    finalCta: {
      eyebrow: "Your invitation",
      title: ["Come home ", { i: "to yourself" }],
      body: "Three days free. No pressure. Just a quiet, beautiful space to begin again.",
      cta: "Start Your 3 Days Free →",
    },
    footer: {
      tagline: "A daily practice for the woman returning to herself. Designed with intention, grounded in ease.",
      property: "A property of The Dominion Code LLC",
      exploreHead: "Explore",
      explore: [
        { label: "The Method", href: "#pillars" },
        { label: "Pricing", href: "#pricing" },
        { label: "Reviews", href: "#reviews" },
        { label: "FAQ", href: "#faq" },
      ],
      supportHead: "Support",
      support: [
        { label: "Contact", href: "#" },
        { label: "Help Center", href: "#" },
        { label: "Manage Plan", href: "/billing" },
        { label: "Affiliate", href: "#" },
      ],
      legalHead: "Legal",
      legal: [
        { label: "Terms", href: "#" },
        { label: "Privacy", href: "#" },
        { label: "Refund Policy", href: "#" },
      ],
      copyright: "© 2026 Sovereign — owned & operated by The Dominion Code LLC. All rights reserved.",
      madeWith: "Made with intention ✦",
    },
  },
  es: {
    nav: { method: "Método", reviews: "Reseñas", faq: "Preguntas", login: "Iniciar sesión", from: "Desde", startFree: "Empezar gratis" },
    hero: {
      eyebrow: "Una nueva forma de elevarte",
      title: ["Vive ", { i: "en" }, " tu\npoder ", { i: "soberano" }],
      sub: "Sovereign es una práctica serena para la mujer que dejó de encogerse. Rituales diarios, trabajo mental y diseño intencional — creados para devolverte a ti misma.",
      ctaPrimary: "Comienza 3 días gratis →",
      ctaGhost: "El método",
      trust: "3 días gratis · tarjeta registrada · cancela cuando quieras",
      quote: ["La soberanía no es ruidosa.\nEs la mujer que conoce\nsu propio ritmo."],
    },
    strip: ["Arraigada", "Radiante", "Reverente", "Refinada", "Resuelta"],
    pillars: {
      eyebrow: "El método",
      title: ["Tres pilares,\nuna mujer ", { i: "soberana" }],
      sub: "Cada ritual dentro de Sovereign vuelve a tres raíces — la base de una vida vivida en tus propios términos.",
      items: [
        {
          num: "i.",
          title: "Quietud",
          desc: "Prácticas matutinas guiadas, respiración y escritura que te anclan antes de que el mundo tenga oportunidad de descentrarte.",
        },
        {
          num: "ii.",
          title: "Fuerza",
          desc: "Audios de mentalidad, reinicios somáticos e intenciones semanales diseñados para reconstruir la confianza en ti misma, una decisión a la vez.",
        },
        {
          num: "iii.",
          title: "Soberanía",
          desc: "Trabajo de límites, rituales de dinero y prácticas de encarnación que traducen tu claridad interior en la forma en que realmente vives.",
        },
      ],
    },
    trial: {
      eyebrow: "Una invitación",
      title: ["Tres días,\npor nuestra ", { i: "cuenta" }],
      body: "Entra a Sovereign con acceso completo durante 72 horas. Agrega una tarjeta para comenzar — no cobramos hasta el cuarto día, y puedes salir en cualquier momento antes.",
      cta: "Comienza tu prueba gratis →",
      meta: "Sin compromiso · Cancela cuando quieras · Tarjeta protegida por Stripe",
    },
    pricing: {
      eyebrow: "Elige tu ritmo",
      title: ["Encuentra ", { i: "tu" }, " plan"],
      sub: "Elegir tu plan es más que una suscripción — es un regreso a ti misma. Cada opción comienza con 3 días gratis.",
      fine: "Todos los planes incluyen una prueba gratis de 3 días. Se requiere tarjeta registrada — no se te cobrará hasta el cuarto día.",
      cardBtn: "Comienza 3 días gratis",
    },
    plans: {
      "1mo": {
        tier: "Mensual",
        period: "Facturado cada mes",
        savings: "",
        features: ["Acceso completo a la biblioteca", "Rituales y audios diarios", "Intenciones semanales", "Cancela cuando quieras"],
      },
      "3mo": {
        tier: "3 meses",
        period: "Facturado trimestralmente",
        savings: "ahorra 11% · $13.33/mes",
        features: ["Todo lo del plan Mensual", "Guía estacional trimestral", "Acceso a la comunidad privada", "Cancela cuando quieras"],
      },
      "6mo": {
        tier: "6 meses",
        period: "Facturado cada 6 meses",
        savings: "ahorra 17% · $12.50/mes",
        features: ["Todo lo del plan de 3 meses", "Serie extra de encarnación", "Sesiones en vivo trimestrales", "Acceso a Q&A con la fundadora"],
        badge: "La favorita",
      },
      "12mo": {
        tier: "1 año",
        period: "Facturado anualmente",
        savings: "ahorra 44% · $8.33/mes",
        features: ["Todo lo del plan de 6 meses", "Un año completo de guías estacionales", "El Retiro Anual Sovereign", "Asegura esta tarifa de por vida"],
      },
    },
    reviews: {
      eyebrow: "En sus palabras",
      title: ["Las ", { i: "reseñas" }],
      quotes: [
        {
          text: "No me daba cuenta de lo ruidosa que se había vuelto mi vida hasta que Sovereign me dio una forma más serena de empezar cada mañana. Vuelvo a sentirme yo misma.",
          author: "— Amara R.",
        },
        {
          text: "Esto no es otra app de bienestar. Es un regreso. Cada ritual se siente escrito para mí justo el día que más lo necesito.",
          author: "— Jules K.",
        },
        {
          text: "A los tres meses, mis límites son más claros, mis mañanas más lentas y mis decisiones vuelven a ser mías. Vale cada centavo.",
          author: "— Sienna M.",
        },
      ],
    },
    faq: {
      eyebrow: "Claridad",
      title: ["Aclaremos\nlas ", { i: "dudas" }],
      items: [
        {
          q: "¿Cómo funciona la prueba gratis de 3 días?",
          a: "Elige cualquier plan y agrega tu tarjeta para comenzar. Recibirás acceso completo e inmediato a Sovereign durante 72 horas. Si no es para ti, cancela antes del cuarto día y no se te cobrará nada. Si te quedas, tu plan elegido comienza automáticamente.",
        },
        {
          q: "¿Por qué necesitan una tarjeta registrada?",
          a: "La tarjeta registrada nos permite reservar tu lugar y continuar tu práctica sin interrupciones si decides quedarte. No se cobra durante tu prueba. Tu información de pago se cifra y se procesa de forma segura a través de Stripe.",
        },
        {
          q: "¿Puedo cancelar cuando quiera?",
          a: "Sí. Puedes cancelar antes de que termine tu prueba — o en cualquier momento durante un plan pago — y mantendrás el acceso hasta el final de tu período de facturación. Sin trabas, sin complicaciones.",
        },
        {
          q: "¿Qué hay realmente dentro de Sovereign?",
          a: "Una biblioteca en crecimiento de rituales guiados, audios de mentalidad, sesiones de respiración, ejercicios de escritura, prácticas de encarnación, intenciones semanales y guías estacionales — todo diseñado para hacerse en pequeños momentos sostenibles de tu día.",
        },
        {
          q: "¿Qué plan debería elegir?",
          a: "El mensual es perfecto si quieres probarlo. Los de 3 y 6 meses son para mujeres listas para asentarse. El plan anual ofrece el mayor valor e incluye nuestro retiro anual — es la opción para el largo camino a casa.",
        },
        {
          q: "¿Cambiará mi precio más adelante?",
          a: "No. La tarifa con la que comienzas queda fija durante la duración de tu plan. Las suscriptoras anuales aseguran su tarifa de por vida — incluso si los precios cambian para nuevas miembros.",
        },
      ],
    },
    finalCta: {
      eyebrow: "Tu invitación",
      title: ["Vuelve ", { i: "a ti misma" }],
      body: "Tres días gratis. Sin presión. Solo un espacio sereno y hermoso para empezar de nuevo.",
      cta: "Comienza tus 3 días gratis →",
    },
    footer: {
      tagline: "Una práctica diaria para la mujer que vuelve a sí misma. Diseñada con intención, arraigada en la calma.",
      property: "Una propiedad de The Dominion Code LLC",
      exploreHead: "Explorar",
      explore: [
        { label: "El método", href: "#pillars" },
        { label: "Precios", href: "#pricing" },
        { label: "Reseñas", href: "#reviews" },
        { label: "Preguntas", href: "#faq" },
      ],
      supportHead: "Soporte",
      support: [
        { label: "Contacto", href: "#" },
        { label: "Centro de ayuda", href: "#" },
        { label: "Gestionar plan", href: "/billing" },
        { label: "Afiliados", href: "#" },
      ],
      legalHead: "Legal",
      legal: [
        { label: "Términos", href: "#" },
        { label: "Privacidad", href: "#" },
        { label: "Política de reembolso", href: "#" },
      ],
      copyright: "© 2026 Sovereign — propiedad y operado por The Dominion Code LLC. Todos los derechos reservados.",
      madeWith: "Hecho con intención ✦",
    },
  },
};

export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  const c = COPY[lang];

  return (
    <div className="landing-root">
      <style dangerouslySetInnerHTML={{ __html: landingCss }} />

      <nav>
        <div className="container nav-row">
          <a href="#" className="logo">
            Sovereign
          </a>
          <div className="nav-links">
            <a href="#pillars">{c.nav.method}</a>
            <a href="#reviews">{c.nav.reviews}</a>
            <a href="#faq">{c.nav.faq}</a>
            <div className="nav-right">
              <a href="/login" className="nav-login">
                {c.nav.login}
              </a>
              <div className="lang-toggle" role="group" aria-label="Language">
                <button
                  type="button"
                  className={lang === "en" ? "active" : ""}
                  aria-pressed={lang === "en"}
                  onClick={() => setLang("en")}
                >
                  EN
                </button>
                <button
                  type="button"
                  className={lang === "es" ? "active" : ""}
                  aria-pressed={lang === "es"}
                  onClick={() => setLang("es")}
                >
                  ES
                </button>
              </div>
              <a href="#pricing" className="nav-price">
                <span className="nav-price-label">{c.nav.from}</span>
                <span className="nav-price-amt">
                  $8.33<span className="nav-price-suffix">/mo</span>
                </span>
              </a>
              <a href="#pricing" className="nav-cta">
                {c.nav.startFree}
              </a>
            </div>
          </div>
          <div className="burger">☰</div>
        </div>
      </nav>

      <header className="hero">
        <div className="container hero-grid">
          <div>
            <div className="eyebrow">{c.hero.eyebrow}</div>
            <h1>{renderParts(c.hero.title)}</h1>
            <p className="hero-sub">{c.hero.sub}</p>
            <div className="cta-row">
              <a href="#pricing" className="btn btn-primary">
                {c.hero.ctaPrimary}
              </a>
              <a href="#pillars" className="btn btn-ghost">
                {c.hero.ctaGhost}
              </a>
            </div>
            <div className="trust-row">
              <span className="dot"></span>
              <span>{c.hero.trust}</span>
            </div>
          </div>

          <div className="hero-visual">
            <img src="/hero.jpg?v=1" alt="Sovereign — strength in stillness" />
            <div className="hero-quote">{renderParts(c.hero.quote)}</div>
          </div>
        </div>
      </header>

      <div className="strip">
        <div className="strip-inner">
          {[...c.strip, ...c.strip].map((word, i) => (
            <span key={i}>{word}</span>
          ))}
        </div>
      </div>

      <section id="pillars" className="pillars">
        <div className="container">
          <div className="section-eyebrow">{c.pillars.eyebrow}</div>
          <h2>{renderParts(c.pillars.title)}</h2>
          <p className="section-sub">{c.pillars.sub}</p>

          <div className="pillar-grid">
            {c.pillars.items.map((item) => (
              <div className="pillar" key={item.num}>
                <div className="pillar-num">{item.num}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="trial">
        <div className="container">
          <div className="section-eyebrow">{c.trial.eyebrow}</div>
          <h2>{renderParts(c.trial.title)}</h2>
          <p>{c.trial.body}</p>
          <a href="#pricing" className="btn btn-primary">
            {c.trial.cta}
          </a>
          <div className="trial-meta">{c.trial.meta}</div>
        </div>
      </section>

      <section id="pricing" className="pricing">
        <div className="container">
          <div className="section-eyebrow">Choose your pace</div>
          <h2>
            Find <span className="italic">your</span> plan
          </h2>
          <p className="section-sub">
            Choosing your plan is more than a subscription — it&apos;s a return
            to yourself. Every option begins with 3 days free.
          </p>

          <div className="price-grid">
            {PLAN_BASE.map((plan) => {
              const pc = c.plans[plan.planId];
              return (
                <div
                  key={plan.planId}
                  className={`price-card${plan.featured ? " featured" : ""}`}
                >
                  {pc.badge && <div className="badge">{pc.badge}</div>}
                  <div className="price-tier">{pc.tier}</div>
                  <div className="price-period">{pc.period}</div>
                  <div className="price-tag">
                    {plan.dollars}
                    <span className="cents">{plan.cents}</span>
                  </div>
                  <div className="price-savings">{pc.savings || " "}</div>
                  <ul className="price-features">
                    {pc.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <form action={startCheckoutAction} className="price-form">
                    <input type="hidden" name="planId" value={plan.planId} />
                    <button type="submit" className="price-btn">
                      {c.pricing.cardBtn}
                    </button>
                  </form>
                </div>
              );
            })}
          </div>

          <p className="price-fine">{c.pricing.fine}</p>
        </div>
      </section>

      <section id="reviews" className="testimonials">
        <div className="container">
          <div className="section-eyebrow">{c.reviews.eyebrow}</div>
          <h2>{renderParts(c.reviews.title)}</h2>

          <div className="quote-grid">
            {c.reviews.quotes.map((q) => (
              <div className="quote" key={q.author}>
                <div className="stars">✦ ✦ ✦ ✦ ✦</div>
                <p>&ldquo;{q.text}&rdquo;</p>
                <div className="quote-author">{q.author}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="faq">
        <div className="container">
          <div className="section-eyebrow">{c.faq.eyebrow}</div>
          <h2>{renderParts(c.faq.title)}</h2>

          <div className="faq-list">
            {c.faq.items.map((item, i) => (
              <details key={i} open={i === 0}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="container">
          <div className="section-eyebrow" style={{ color: "var(--gold)" }}>
            {c.finalCta.eyebrow}
          </div>
          <h2>{renderParts(c.finalCta.title)}</h2>
          <p>{c.finalCta.body}</p>
          <a href="#pricing" className="btn btn-primary">
            {c.finalCta.cta}
          </a>
        </div>
      </section>

      <footer>
        <div className="container">
          <div className="foot-grid">
            <div>
              <div className="logo">Sovereign</div>
              <p>{c.footer.tagline}</p>
              <p
                style={{
                  marginTop: "14px",
                  fontSize: "12px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(245,239,230,0.5)",
                }}
              >
                {c.footer.property}
              </p>
            </div>
            <div>
              <h4>{c.footer.exploreHead}</h4>
              {c.footer.explore.map((l) => (
                <a href={l.href} key={l.label}>
                  {l.label}
                </a>
              ))}
            </div>
            <div>
              <h4>{c.footer.supportHead}</h4>
              {c.footer.support.map((l) => (
                <a href={l.href} key={l.label}>
                  {l.label}
                </a>
              ))}
            </div>
            <div>
              <h4>{c.footer.legalHead}</h4>
              {c.footer.legal.map((l) => (
                <a href={l.href} key={l.label}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>
          <div className="foot-bottom">
            <div>{c.footer.copyright}</div>
            <div>{c.footer.madeWith}</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
