"use client";

import { Fragment, useEffect, useState } from "react";
import LeaveTestimonialModal from "./_components/LeaveTestimonialModal";
import VisitTracker from "./_components/VisitTracker";
import {
  listApprovedTestimonials,
  type ApprovedTestimonial,
} from "@/lib/actions/testimonial";
import { startCheckoutAction } from "./pricing/actions";

const landingCss = `
  :root{
    --ivory:#f5efe6;
    --cream:#ece3d3;
    --sand:#e8dcc6;
    --ink:#1a1816;
    --char:#2c2926;
    --muted:#6b6258;
    --gold:#b09869;
    --gold-deep:#9a7a4a;
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
  .landing-root .burger{
    display:none;font-size:22px;cursor:pointer;
    background:transparent;border:none;color:var(--ink);
    padding:6px 10px;line-height:1;
  }
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
    background:var(--sand);color:var(--gold-deep);
    padding:22px 0;overflow:hidden;
    border-top:1px solid var(--line);
    border-bottom:1px solid var(--line);
  }
  .landing-root .strip-inner{
    display:flex;gap:60px;white-space:nowrap;
    animation:landingScroll 35s linear infinite;
    font-family:'Cormorant Garamond',serif;
    font-style:italic;font-size:20px;letter-spacing:0.05em;
  }
  .landing-root .strip-inner span{display:inline-flex;align-items:center;gap:60px}
  .landing-root .strip-inner span::after{content:"✦";color:var(--gold-deep)}
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

  .landing-root .pillars{background:var(--cream);padding:120px 0}
  .landing-root .pillar-grid{
    display:grid;grid-template-columns:repeat(3,1fr);gap:36px;margin-top:56px;
  }

  /* Hero — typography-led, centered, with the device mockups beneath the CTA. */
  .landing-root .hero-center{padding:120px 0 60px;text-align:center}
  .landing-root .hero-center .container{max-width:780px}
  .landing-root .hero-center .eyebrow{justify-content:center}
  .landing-root .hero-center .hero-sub{
    margin-left:auto;margin-right:auto;
  }
  .landing-root .hero-center .cta-row{justify-content:center}
  .landing-root .hero-center .trust-row{justify-content:center}
  .landing-root .hero-devices{
    margin-top:60px;display:flex;justify-content:center;
  }
  .landing-root .hero-devices .show-devices{
    position:relative;width:100%;max-width:640px;
    /* Reserve room for the phone overlap so it doesn't get clipped */
    padding-bottom:40px;
  }
  /* Inherit the slim global show-laptop / show-phone styles — only nudge size */
  .landing-root .hero-devices .show-laptop{width:100%;margin:0 auto}

  /* Reviews — approved photos + empty state */
  .landing-root .quote-photo{
    width:56px;height:56px;border-radius:50%;
    object-fit:cover;display:block;margin-bottom:14px;
    border:1px solid var(--line);
  }
  .landing-root .quote-empty{
    margin:32px auto 0;max-width:520px;text-align:center;
    color:var(--muted);font-style:italic;
    font-family:'Cormorant Garamond',serif;font-size:18px;
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

  .landing-root .gallery{padding:80px 0;background:var(--ivory)}
  .landing-root .gallery-grid{
    display:grid;grid-template-columns:repeat(3,1fr);gap:24px;
    max-width: 1400px; margin: 0 auto; padding: 0 24px;
  }
  .landing-root .gallery-img{
    width:100%;aspect-ratio:1/1;object-fit:cover;
  }

  /* ─── SHOWCASE (phone + floating review cards) ─── */
  .landing-root .showcase{padding:120px 0 140px;background:#e7e2d6}
  .landing-root .showcase h2.center,
  .landing-root .showcase .section-sub.center,
  .landing-root .showcase .section-eyebrow.center{text-align:center}
  .landing-root .showcase .section-sub.center{max-width:560px;margin:0 auto}
  .landing-root .showcase-stage{
    position:relative;
    max-width:1100px;margin:64px auto 0;
    min-height:560px;
    display:flex;align-items:center;justify-content:center;
    padding:0 40px;
  }
  /* Laptop + phone composition */
  .landing-root .show-devices{
    position:relative;
    width:100%;max-width:700px;
    display:flex;align-items:center;justify-content:center;
  }

  /* Laptop — slim Apple-MacBook-style bezels */
  .landing-root .show-laptop{
    width:100%;
    filter:drop-shadow(0 24px 40px rgba(26,24,22,0.18));
  }
  .landing-root .show-laptop-screen{
    background:#1a1816;
    border-radius:11px 11px 3px 3px;
    padding:9px 9px 7px;
  }
  .landing-root .show-laptop-img{
    display:block;width:100%;
    aspect-ratio:16/10;object-fit:cover;object-position:top;
    background:var(--ivory);border-radius:3px;
  }
  .landing-root .show-laptop-base{
    height:6px;
    background:linear-gradient(180deg,#4a4540,#2a2521);
    border-radius:0 0 14px 14px;
    margin:0 -14px;position:relative;
  }
  .landing-root .show-laptop-base::before{
    content:"";position:absolute;top:0;left:50%;transform:translateX(-50%);
    width:60px;height:3px;background:rgba(0,0,0,0.4);
    border-radius:0 0 6px 6px;
  }

  /* Phone — slimmer bezel, full screenshot visible (top of the app shows) */
  .landing-root .show-phone{
    position:absolute;
    right:-24px;bottom:-50px;z-index:5;
    width:180px;aspect-ratio:9/19.5;
    background:#1a1816;border-radius:30px;
    padding:4px;
    box-shadow:0 24px 40px -12px rgba(26,24,22,0.38), 0 10px 18px -6px rgba(26,24,22,0.2);
  }
  .landing-root .show-phone-notch{
    position:absolute;top:10px;left:50%;transform:translateX(-50%);
    width:52px;height:14px;background:#1a1816;
    border-radius:10px;z-index:3;
  }
  .landing-root .show-phone-screen{
    width:100%;height:100%;display:block;
    border-radius:26px;
    object-fit:cover;object-position:top;
    background:var(--ivory);
  }

  /* Floating review cards */
  .landing-root .review-card{
    position:absolute;z-index:4;
    width:280px;background:#fff;
    padding:20px 22px;border-radius:14px;
    box-shadow:0 16px 30px -10px rgba(26,24,22,0.18), 0 6px 12px -4px rgba(26,24,22,0.08);
    font-family:'Inter',sans-serif;
  }
  .landing-root .review-stars{color:#f5b04a;font-size:14px;letter-spacing:2px;margin-bottom:6px}
  .landing-root .review-meta{font-size:11px;color:var(--muted);margin-bottom:10px}
  .landing-root .review-title{font-size:14px;font-weight:700;color:var(--ink);margin-bottom:6px}
  .landing-root .review-body{font-size:13px;line-height:1.55;color:var(--char)}
  .landing-root .card-1{top:-20px;left:-30px;transform:rotate(-2deg)}
  .landing-root .card-2{top:42%;right:-80px;transform:rotate(1.5deg)}
  .landing-root .card-3{bottom:-30px;left:0;transform:rotate(-1.2deg)}

  /* ─── FOUNDER ─── */
  .landing-root .founder{padding:120px 0;background:var(--ivory)}
  .landing-root .founder-container{max-width:780px;text-align:center}
  .landing-root .founder-text{text-align:center}
  .landing-root .founder-title{
    font-size:clamp(40px,5.5vw,72px);
    margin-bottom:36px;letter-spacing:-0.01em;
  }
  .landing-root .founder-body{
    font-family:'Cormorant Garamond',serif;
    font-size:22px;line-height:1.7;color:var(--char);
    max-width:680px;margin:0 auto 28px;
  }
  .landing-root .founder-signoff{
    font-family:'Cormorant Garamond',serif;
    font-style:italic;font-size:18px;color:var(--gold-deep);
    letter-spacing:0.04em;
  }
  /* ─── AFFILIATE CARD BUTTON + MODAL ─── */
  /* Bordered "box" link sitting at the bottom of the 1 Year plan card,
     just below the primary "Begin Free Trial" CTA. Visually distinct so
     the user can't miss it, but secondary in weight so it doesn't
     compete with the checkout button. Routes straight to /affiliate. */
  .landing-root .aff-card-btn{
    display:block;width:100%;
    margin-top:14px;margin-bottom:14px;padding:14px 16px;
    border:1px solid var(--gold-deep);border-radius:4px;
    background:transparent;color:var(--gold-deep);
    text-align:center;text-decoration:none;
    font-family:'Inter',system-ui,sans-serif;
    font-size:11px;font-weight:600;letter-spacing:0.22em;
    text-transform:uppercase;
    transition:all .25s;
  }
  .landing-root .aff-card-btn:hover{
    background:var(--gold-deep);color:var(--ivory);
    transform:translateY(-1px);
  }
  .landing-root .price-card.featured .aff-card-btn{
    border-color:var(--gold);color:var(--gold);
  }
  .landing-root .price-card.featured .aff-card-btn:hover{
    background:var(--gold);color:var(--ink);
  }

  .landing-root .aff-modal-backdrop{
    position:fixed;inset:0;z-index:100;
    background:rgba(26,24,22,0.7);
    display:flex;align-items:center;justify-content:center;
    padding:24px;
    animation:affFade .2s ease-out;
  }
  @keyframes affFade { from { opacity:0 } to { opacity:1 } }
  .landing-root .aff-modal{
    background:var(--ivory);
    border-radius:6px;
    max-width:560px;width:100%;
    max-height:90vh;overflow-y:auto;
    padding:56px 48px 44px;
    position:relative;
    box-shadow:0 40px 80px -20px rgba(0,0,0,0.5);
    animation:affSlide .25s ease-out;
  }
  @keyframes affSlide { from { transform:translateY(20px); opacity:0 } to { transform:translateY(0); opacity:1 } }
  .landing-root .aff-modal-close{
    position:absolute;top:14px;right:18px;
    background:none;border:none;cursor:pointer;
    font-size:32px;font-weight:300;line-height:1;
    color:var(--muted);transition:color .2s;
    padding:4px 10px;
  }
  .landing-root .aff-modal-close:hover{color:var(--ink)}
  .landing-root .aff-modal .section-eyebrow.center{
    text-align:center;margin-bottom:14px;
  }
  .landing-root .aff-modal-title{
    font-family:'Cormorant Garamond',serif;
    font-size:40px;font-weight:400;line-height:1.1;
    text-align:center;margin-bottom:20px;
    color:var(--ink);letter-spacing:-0.01em;
  }
  .landing-root .aff-modal-intro{
    font-family:'Cormorant Garamond',serif;
    font-size:18px;line-height:1.65;color:var(--char);
    text-align:center;margin-bottom:32px;font-style:italic;
  }
  .landing-root .aff-modal-steps{
    list-style:none;padding:0;margin:0 0 32px;
    display:flex;flex-direction:column;gap:14px;
  }
  .landing-root .aff-modal-steps li{
    display:flex;gap:14px;align-items:baseline;
    font-size:15px;line-height:1.55;color:var(--char);
    padding-bottom:14px;border-bottom:1px solid var(--line);
  }
  .landing-root .aff-modal-steps li:last-child{border-bottom:none}
  .landing-root .aff-step-num{
    font-family:'Cormorant Garamond',serif;font-style:italic;
    font-size:18px;color:var(--gold-deep);
    flex-shrink:0;min-width:28px;
  }
  .landing-root .aff-modal-math{
    background:var(--cream);
    border-radius:4px;padding:24px;
    margin-bottom:24px;
  }
  .landing-root .aff-math-header{
    font-size:11px;letter-spacing:0.22em;text-transform:uppercase;
    color:var(--gold-deep);margin-bottom:14px;text-align:center;
  }
  .landing-root .aff-modal-math table{
    width:100%;border-collapse:collapse;
  }
  .landing-root .aff-modal-math td{
    padding:10px 0;font-size:15px;color:var(--char);
    border-bottom:1px solid var(--line);
  }
  .landing-root .aff-modal-math tr:last-child td{border-bottom:none}
  .landing-root .aff-modal-math td:last-child{
    text-align:right;font-family:'Cormorant Garamond',serif;
    font-size:20px;color:var(--gold-deep);font-weight:500;
  }
  .landing-root .aff-modal-onetime{
    font-family:'Cormorant Garamond',serif;font-style:italic;
    font-size:15px;line-height:1.6;color:var(--char);
    margin-bottom:14px;text-align:center;
    padding:14px 18px;background:rgba(168,137,90,0.08);
    border-left:3px solid var(--gold);border-radius:0 3px 3px 0;
  }
  .landing-root .aff-modal-fine{
    font-size:12px;line-height:1.65;color:var(--muted);
    margin-bottom:28px;text-align:center;
  }
  .landing-root .aff-modal-cta{
    display:block;text-align:center;
    padding:16px 32px;background:var(--ink);color:var(--ivory);
    border-radius:999px;
    font-size:12px;letter-spacing:0.22em;text-transform:uppercase;
    font-weight:500;text-decoration:none;
    transition:background .2s;
  }
  .landing-root .aff-modal-cta:hover{background:var(--gold-deep)}

  /* ─── LEAVE-A-TESTIMONIAL MODAL ─── */
  .landing-root .testi-cta-row{
    display:flex;justify-content:center;margin-top:48px;
  }
  .landing-root .testi-cta{
    background:transparent;border:1px solid var(--gold-deep);
    color:var(--gold-deep);padding:14px 28px;border-radius:999px;
    font-family:'Inter',system-ui,sans-serif;
    font-size:11px;font-weight:600;letter-spacing:0.22em;
    text-transform:uppercase;cursor:pointer;
    transition:all .25s;
  }
  .landing-root .testi-cta:hover{
    background:var(--gold-deep);color:var(--ivory);
    transform:translateY(-1px);
  }
  .landing-root .testi-backdrop{
    position:fixed;inset:0;z-index:100;
    background:rgba(26,24,22,0.7);
    display:flex;align-items:center;justify-content:center;
    padding:20px;overflow-y:auto;
  }
  .landing-root .testi-modal{
    background:var(--ivory);max-width:520px;width:100%;
    border-radius:8px;padding:32px;
    box-shadow:0 30px 80px rgba(0,0,0,0.4);
  }
  .landing-root .testi-title{
    font-family:'Cormorant Garamond',serif;
    font-size:32px;line-height:1.1;margin-bottom:8px;
    text-transform:uppercase;letter-spacing:0.02em;
  }
  .landing-root .testi-sub{
    color:var(--muted);font-size:14px;line-height:1.6;
    margin-bottom:24px;
  }
  .landing-root .testi-label{
    display:block;font-size:11px;letter-spacing:0.18em;
    text-transform:uppercase;color:var(--gold-deep);
    margin-bottom:8px;margin-top:18px;font-weight:500;
  }
  .landing-root .testi-input,
  .landing-root .testi-textarea{
    width:100%;padding:12px 14px;border:1px solid var(--line);
    border-radius:4px;background:var(--soft);color:var(--ink);
    font-family:'Inter',system-ui,sans-serif;font-size:15px;
    outline:none;transition:border-color .2s;
    box-sizing:border-box;
  }
  .landing-root .testi-textarea{
    resize:vertical;min-height:110px;font-family:inherit;line-height:1.5;
  }
  .landing-root .testi-input:focus,
  .landing-root .testi-textarea:focus{border-color:var(--gold-deep)}
  .landing-root .testi-file{
    width:100%;font-size:13px;color:var(--muted);
  }
  .landing-root .testi-hint{
    font-size:11px;color:var(--muted);margin-top:6px;font-style:italic;
  }
  .landing-root .testi-error{
    margin-top:14px;padding:10px 12px;border-radius:4px;
    background:#f6e9e2;color:#7a3a1a;font-size:13px;
    border:1px solid #e2c5b5;
  }
  .landing-root .testi-actions{
    display:flex;justify-content:flex-end;gap:12px;margin-top:24px;
  }
  .landing-root .testi-btn-ghost{
    background:transparent;border:none;
    color:var(--muted);padding:12px 18px;cursor:pointer;
    font-family:'Inter',system-ui,sans-serif;font-size:12px;
    letter-spacing:0.18em;text-transform:uppercase;font-weight:500;
    transition:color .2s;
  }
  .landing-root .testi-btn-ghost:hover{color:var(--ink)}
  .landing-root .testi-btn-primary{
    background:var(--gold-deep);color:var(--ivory);
    border:none;padding:12px 28px;border-radius:999px;cursor:pointer;
    font-family:'Inter',system-ui,sans-serif;font-size:12px;
    letter-spacing:0.18em;text-transform:uppercase;font-weight:500;
    transition:all .25s;
  }
  .landing-root .testi-btn-primary:hover{background:var(--char)}
  .landing-root .testi-btn-primary:disabled{opacity:0.6;cursor:wait}
  @media (max-width:560px){
    .landing-root .aff-modal{padding:48px 24px 32px}
    .landing-root .aff-modal-title{font-size:32px}
  }

  .landing-root .founder-portrait{
    display:block;width:100%;aspect-ratio:1/1;
    object-fit:cover;border-radius:6px;
    box-shadow:0 24px 50px -16px rgba(26,24,22,0.22);
  }
  @media (max-width:768px){
    .landing-root .founder-portrait{max-width:360px;margin:0 auto}
  }

  /* ─── INSIDE SOVEREIGN — lifestyle compositions (setthepace-style) ─── */
  .landing-root .features{background:var(--soft);padding:120px 0}
  .landing-root .feat-grid{
    display:grid;grid-template-columns:repeat(3,1fr);gap:28px;
    margin-top:56px;
  }
  .landing-root .feat-card{
    display:flex;flex-direction:column;
    background:transparent;border:none;border-radius:8px;overflow:hidden;
    transition:transform .25s;
  }
  .landing-root .feat-card:hover{transform:translateY(-3px)}

  /* Stage = the "photo composition" container. Soft neutral gradient stands
     in for a real lifestyle backdrop. Caption sits at top in white serif. */
  .landing-root .feat-stage{
    position:relative;
    width:100%;aspect-ratio:1/1;
    border-radius:8px;overflow:hidden;
    display:flex;align-items:flex-end;justify-content:center;
    padding:0 0 18px;
    background:
      radial-gradient(ellipse at top, rgba(255,255,255,0.6), transparent 60%),
      linear-gradient(155deg, #d9cdb8 0%, #ece3d3 35%, #f5efe6 70%, #e8dcc6 100%);
    box-shadow:0 24px 50px -25px rgba(26,24,22,0.22);
  }
  .landing-root .feat-caption{
    position:absolute;top:18px;left:24px;right:24px;
    margin:0;text-align:center;
    font-family:'Cormorant Garamond',serif;font-style:italic;
    font-size:16px;line-height:1.35;
    color:#fff;
    text-shadow:0 1px 6px rgba(26,24,22,0.4);
  }

  /* Smaller phone, sitting inside the stage (not overlapping the caption). */
  .landing-root .feat-phone-sm{
    position:relative;width:62%;aspect-ratio:9/18;
    background:#1a1816;border-radius:26px;padding:5px;
    box-shadow:0 22px 40px -12px rgba(26,24,22,0.4),
               0 10px 18px -6px rgba(26,24,22,0.18);
  }
  .landing-root .feat-phone-sm-notch{
    position:absolute;top:8px;left:50%;transform:translateX(-50%);
    width:42px;height:11px;background:#1a1816;
    border-radius:8px;z-index:5;
  }
  .landing-root .feat-screen{
    position:relative;background:#fbfaf6;
    width:100%;height:100%;border-radius:20px;
    overflow:hidden;padding:14px 10px 10px;
  }
  .landing-root .feat-screen-img{
    width:100%;height:100%;display:block;
    object-fit:cover;object-position:top;
    background:var(--ivory);
  }

  /* ── Mockup phone-screen content (sage palette = the inner app) ── */
  .landing-root .ph-stack{
    display:flex;flex-direction:column;height:100%;
    font-family:'Inter',system-ui,sans-serif;color:#1a1816;
  }
  .landing-root .ph-stack.center{align-items:center;text-align:center}
  .landing-root .ph-status{
    font-size:10px;font-weight:600;letter-spacing:0.05em;
    text-align:center;color:#1a1816;margin-bottom:10px;
  }
  .landing-root .ph-h1{
    font-family:'Cormorant Garamond',serif;
    font-size:20px;line-height:1.1;font-weight:500;
    color:#3d5c34;margin-bottom:2px;
  }
  .landing-root .ph-stack.center .ph-h1{color:#3d5c34}
  .landing-root .ph-meta{
    font-size:10px;color:#6b6258;margin-bottom:12px;
  }
  .landing-root .ph-meta.italic{font-style:italic}
  .landing-root .ph-section-title{
    font-size:8px;letter-spacing:0.18em;text-transform:uppercase;
    color:#7a9a6e;font-weight:600;margin-bottom:6px;
  }
  .landing-root .ph-section-title.mt{margin-top:10px}

  /* planner */
  .landing-root .ph-pri{
    display:flex;align-items:center;gap:8px;
    font-size:11px;color:#1a1816;line-height:1.4;margin-bottom:4px;
  }
  .landing-root .ph-pri-n{
    font-family:'Cormorant Garamond',serif;font-style:italic;
    font-size:14px;color:#7a9a6e;width:12px;line-height:1;flex-shrink:0;
  }
  .landing-root .ph-time-row{
    display:flex;gap:8px;font-size:10px;color:#2c2926;line-height:1.5;margin-bottom:3px;
  }
  .landing-root .ph-time{
    font-family:'Courier New',monospace;font-size:9px;font-weight:600;
    color:#5b7351;min-width:60px;flex-shrink:0;
  }

  /* speak */
  .landing-root .ph-pills{
    display:flex;gap:5px;margin-bottom:10px;flex-wrap:wrap;
  }
  .landing-root .ph-pill{
    font-size:9px;padding:3px 8px;border-radius:999px;
    background:#f4f7ee;color:#5b7351;font-weight:500;
  }
  .landing-root .ph-pill.on{background:#7a9a6e;color:#fff}
  .landing-root .ph-phrase{
    background:#fff;border-radius:6px;padding:8px 10px;
    margin-bottom:7px;border:1px solid #e7e2d6;
  }
  .landing-root .ph-phrase-cat{
    font-size:8px;letter-spacing:0.14em;text-transform:uppercase;
    color:#7a9a6e;font-weight:600;margin-bottom:3px;
  }
  .landing-root .ph-phrase-from{
    font-size:10px;font-style:italic;color:#9a9189;
    text-decoration:line-through;text-decoration-color:rgba(154,145,137,0.4);
    line-height:1.3;margin-bottom:3px;
  }
  .landing-root .ph-phrase-to{
    font-size:10px;color:#1a1816;line-height:1.4;font-weight:500;
  }

  /* affirmation */
  .landing-root .ph-aff-card{
    background:linear-gradient(135deg,#f4f7ee,#fff);
    border:1px solid #d3e0c5;border-radius:8px;
    padding:18px 14px;width:100%;
    margin:8px 0 10px;display:flex;flex-direction:column;align-items:center;
    flex:1;justify-content:center;
  }
  .landing-root .ph-aff-mark{
    font-size:12px;color:#7a9a6e;letter-spacing:0.3em;margin-bottom:8px;
  }
  .landing-root .ph-aff-quote{
    font-family:'Cormorant Garamond',serif;font-style:italic;
    font-size:15px;line-height:1.4;color:#1a1816;text-align:center;
  }
  .landing-root .ph-aff-quote em{color:#5b7351;font-style:italic}
  .landing-root .ph-aff-cat{
    font-size:9px;color:#7a9a6e;font-style:italic;margin-top:8px;
  }
  .landing-root .ph-aff-meta{
    font-size:9px;color:#5b7351;font-style:italic;
  }

  /* habits */
  .landing-root .ph-habit{
    display:flex;align-items:center;gap:8px;
    font-size:11px;color:#1a1816;margin-bottom:4px;
  }
  .landing-root .ph-check{
    width:14px;height:14px;border-radius:50%;
    border:1.5px solid #d3e0c5;background:#fff;
    display:inline-flex;align-items:center;justify-content:center;
    font-size:8px;color:#9a9189;flex-shrink:0;
  }
  .landing-root .ph-check.on{background:#7a9a6e;border-color:#7a9a6e;color:#fff}
  .landing-root .ph-water{display:flex;gap:3px;margin-bottom:4px}
  .landing-root .ph-glass{
    width:10px;height:14px;border-radius:2px 2px 4px 4px;
    border:1px solid #d3e0c5;background:transparent;
  }
  .landing-root .ph-glass.on{background:#7a9a6e;border-color:#7a9a6e}
  .landing-root .ph-water-count{
    font-size:9px;color:#5b7351;font-family:'Courier New',monospace;font-weight:600;
  }

  /* growth + finance */
  .landing-root .ph-bullet{
    font-size:11px;color:#1a1816;line-height:1.5;margin-bottom:3px;
  }
  .landing-root .ph-bullet.muted{color:#6b6258}

  /* finance */
  .landing-root .ph-money-row{
    display:flex;gap:6px;margin:6px 0 4px;
  }
  .landing-root .ph-money-cell{
    flex:1;text-align:center;background:#fff;
    border-radius:6px;padding:8px 4px;border:1px solid #e7e2d6;
  }
  .landing-root .ph-money-lbl{
    font-size:8px;letter-spacing:0.18em;text-transform:uppercase;
    color:#7a9a6e;font-weight:600;margin-bottom:2px;
  }
  .landing-root .ph-money-val{
    font-family:'Cormorant Garamond',serif;font-size:13px;
    color:#1a1816;font-weight:500;
  }
  .landing-root .ph-money-val.pos{color:#5b7351}
  .landing-root .ph-money-val.neg{color:#9c6470}
  .landing-root .ph-progress{
    background:#e7e2d6;height:4px;border-radius:999px;overflow:hidden;
    margin-bottom:4px;
  }
  .landing-root .ph-progress-fill{
    height:100%;background:#7a9a6e;border-radius:999px;
  }
  .landing-root .ph-progress-meta{
    font-size:9px;color:#5b7351;font-family:'Courier New',monospace;
    margin-bottom:6px;
  }

  /* Extras for fuller phone screens */
  .landing-root .ph-search{
    font-size:10px;color:#9a9189;background:#fff;
    padding:6px 10px;border-radius:6px;border:1px solid #e7e2d6;
    margin-bottom:8px;
  }
  .landing-root .ph-section-title.center{text-align:center}
  .landing-root .ph-aff-mini{
    font-family:'Cormorant Garamond',serif;font-style:italic;
    font-size:11px;color:#1a1816;line-height:1.4;text-align:center;
    margin-bottom:4px;
  }
  .landing-root .ph-streak{
    display:flex;align-items:baseline;gap:8px;
  }
  .landing-root .ph-streak-num{
    font-family:'Cormorant Garamond',serif;font-size:22px;
    color:#5b7351;font-weight:500;line-height:1;
  }
  .landing-root .ph-streak-lbl{
    font-size:10px;color:#7a9a6e;font-style:italic;
  }
  .landing-root .ph-reflect{
    font-family:'Cormorant Garamond',serif;font-style:italic;
    font-size:12px;color:#3d5c34;line-height:1.45;
    background:#f4f7ee;padding:10px 12px;border-radius:6px;
    border-left:2px solid #7a9a6e;margin:0;
  }
  .landing-root .feat-screen-eyebrow{
    font-size:9px;letter-spacing:0.22em;text-transform:uppercase;
    color:var(--gold-deep);margin-bottom:14px;font-weight:500;
  }
  .landing-root .feat-screen-eyebrow.center{text-align:center}
  .landing-root .feat-screen-divider{
    height:1px;background:var(--line);margin:14px 0;
  }
  .landing-root .feat-label{padding:18px 4px 0;text-align:center;max-width:280px;margin:0 auto}

  /* Content inside the smaller phone needs to scale down to fit the tighter
     viewport — shrink the typography across the board for ph-* elements
     when they live in the small phone. */
  .landing-root .feat-phone-sm .ph-h1{font-size:14px}
  .landing-root .feat-phone-sm .ph-meta{font-size:8px;margin-bottom:8px}
  .landing-root .feat-phone-sm .ph-status{font-size:7px;margin-bottom:6px}
  .landing-root .feat-phone-sm .ph-section-title{font-size:6.5px;margin-bottom:4px}
  .landing-root .feat-phone-sm .ph-section-title.mt{margin-top:6px}
  .landing-root .feat-phone-sm .ph-pri,
  .landing-root .feat-phone-sm .ph-habit,
  .landing-root .feat-phone-sm .ph-bullet{font-size:8px;margin-bottom:2.5px;gap:5px}
  .landing-root .feat-phone-sm .ph-pri-n{font-size:11px;width:9px}
  .landing-root .feat-phone-sm .ph-check{width:10px;height:10px;font-size:6px}
  .landing-root .feat-phone-sm .ph-time-row{font-size:7px;gap:5px;margin-bottom:2px}
  .landing-root .feat-phone-sm .ph-time{font-size:6.5px;min-width:42px}
  .landing-root .feat-phone-sm .ph-pills{gap:3px;margin-bottom:6px}
  .landing-root .feat-phone-sm .ph-pill{font-size:6.5px;padding:2px 5px}
  .landing-root .feat-phone-sm .ph-search{font-size:7px;padding:4px 6px;margin-bottom:5px}
  .landing-root .feat-phone-sm .ph-phrase{padding:5px 6px;margin-bottom:4px;border-radius:4px}
  .landing-root .feat-phone-sm .ph-phrase-cat{font-size:6px;margin-bottom:2px}
  .landing-root .feat-phone-sm .ph-phrase-from,
  .landing-root .feat-phone-sm .ph-phrase-to{font-size:7px;line-height:1.3;margin-bottom:2px}
  .landing-root .feat-phone-sm .ph-aff-card{padding:10px 8px;margin:4px 0 6px}
  .landing-root .feat-phone-sm .ph-aff-mark{font-size:9px;margin-bottom:5px}
  .landing-root .feat-phone-sm .ph-aff-quote{font-size:10px;line-height:1.35}
  .landing-root .feat-phone-sm .ph-aff-cat,
  .landing-root .feat-phone-sm .ph-aff-meta{font-size:7px;margin-top:4px}
  .landing-root .feat-phone-sm .ph-aff-mini{font-size:8px;margin-bottom:2px}
  .landing-root .feat-phone-sm .ph-water{gap:2px;margin-bottom:2px}
  .landing-root .feat-phone-sm .ph-glass{width:6px;height:9px;border-radius:1px 1px 2px 2px}
  .landing-root .feat-phone-sm .ph-water-count{font-size:6.5px}
  .landing-root .feat-phone-sm .ph-streak-num{font-size:15px}
  .landing-root .feat-phone-sm .ph-streak-lbl{font-size:7px}
  .landing-root .feat-phone-sm .ph-reflect{font-size:8px;padding:6px 7px;border-left-width:1.5px}
  .landing-root .feat-phone-sm .ph-money-row{gap:3px;margin:3px 0 2px}
  .landing-root .feat-phone-sm .ph-money-cell{padding:4px 2px;border-radius:3px}
  .landing-root .feat-phone-sm .ph-money-lbl{font-size:5.5px;margin-bottom:1px}
  .landing-root .feat-phone-sm .ph-money-val{font-size:9px}
  .landing-root .feat-phone-sm .ph-progress{height:3px;margin-bottom:2px}
  .landing-root .feat-phone-sm .ph-progress-meta{font-size:6px;margin-bottom:3px}
  .landing-root .feat-name{
    font-family:'Cormorant Garamond',serif;
    font-size:22px;font-weight:500;
    text-transform:uppercase;letter-spacing:0.04em;
    color:var(--ink);margin-bottom:6px;
  }
  .landing-root .feat-desc{
    font-size:13px;color:var(--muted);line-height:1.55;
  }

  /* — planner card content — */
  .landing-root .feat-priorities{
    list-style:none;padding:0;margin:0 0 8px;
    display:flex;flex-direction:column;gap:8px;
  }
  .landing-root .feat-priorities li{
    display:flex;align-items:flex-start;gap:10px;
    font-size:13px;color:var(--ink);line-height:1.4;
  }
  .landing-root .feat-num{
    font-family:'Cormorant Garamond',serif;font-style:italic;
    font-size:18px;color:var(--gold-deep);
    line-height:1;flex-shrink:0;width:14px;
  }
  .landing-root .feat-block{
    display:flex;gap:10px;font-size:11px;color:var(--char);
    margin-top:6px;line-height:1.5;
  }
  .landing-root .feat-block-time{
    font-family:'Courier New',monospace;font-size:10px;
    color:var(--gold-deep);font-weight:600;flex-shrink:0;
    min-width:64px;
  }

  /* — speak card — */
  .landing-root .feat-from{
    font-style:italic;font-size:13px;color:var(--muted);
    text-decoration:line-through;text-decoration-color:rgba(107,98,88,0.4);
    margin:0 0 6px;line-height:1.4;
  }
  .landing-root .feat-to{
    font-size:13px;color:var(--ink);line-height:1.5;
    margin:0;font-weight:500;
  }

  /* — affirmation card — */
  .landing-root .feat-affirmation{
    font-family:'Cormorant Garamond',serif;font-style:italic;
    font-size:18px;line-height:1.4;color:var(--ink);
    text-align:center;flex:1;display:flex;align-items:center;
    justify-content:center;margin:0;
  }
  .landing-root .feat-affirmation-meta{
    text-align:center;font-size:10px;font-style:italic;
    color:var(--gold-deep);margin-top:10px;
  }

  /* — calendar card — */
  .landing-root .feat-cal-head{
    display:grid;grid-template-columns:repeat(7,1fr);gap:2px;
    font-size:9px;color:var(--muted);
    text-align:center;margin-bottom:6px;
  }
  .landing-root .feat-cal-grid{
    display:grid;grid-template-columns:repeat(7,1fr);gap:2px;
    flex:1;
  }
  .landing-root .feat-cal-day{
    position:relative;font-size:11px;color:var(--ink);
    aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;
  }
  .landing-root .feat-cal-day.today{
    background:var(--gold-deep);color:var(--ivory);
    border-radius:4px;font-weight:600;
  }
  .landing-root .feat-cal-dot{
    position:absolute;bottom:3px;left:50%;transform:translateX(-50%);
    width:3px;height:3px;border-radius:50%;background:var(--gold);
  }
  .landing-root .feat-cal-day.today .feat-cal-dot{background:var(--ivory)}

  /* — habits card — */
  .landing-root .feat-habits{
    list-style:none;padding:0;margin:0 0 14px;
    display:flex;flex-direction:column;gap:8px;
  }
  .landing-root .feat-habits li{
    display:flex;align-items:center;gap:10px;
    font-size:13px;color:var(--ink);
  }
  .landing-root .feat-check{
    width:18px;height:18px;border-radius:50%;
    border:1.5px solid var(--line);
    display:inline-flex;align-items:center;justify-content:center;
    font-size:10px;color:var(--muted);flex-shrink:0;
  }
  .landing-root .feat-check.on{
    background:var(--gold-deep);border-color:var(--gold-deep);
    color:var(--ivory);
  }
  .landing-root .feat-water{
    margin-top:auto;display:flex;align-items:center;gap:10px;
    font-size:11px;color:var(--muted);
  }
  .landing-root .feat-water-label{font-style:italic}
  .landing-root .feat-water-row{display:flex;gap:3px;flex:1}
  .landing-root .feat-water-glass{
    width:10px;height:14px;border-radius:2px 2px 4px 4px;
    border:1px solid var(--line);background:transparent;
  }
  .landing-root .feat-water-glass.on{
    background:var(--gold);border-color:var(--gold);
  }
  .landing-root .feat-water-count{
    font-family:'Courier New',monospace;font-size:10px;
    color:var(--gold-deep);font-weight:600;
  }

  /* — vision card — */
  .landing-root .feat-vision-grid{
    display:grid;grid-template-columns:1fr 1fr;gap:8px;flex:1;
  }
  .landing-root .feat-vision-tile{
    background:linear-gradient(135deg,var(--cream),var(--sand));
    border-radius:4px;aspect-ratio:1/1;
    display:flex;align-items:center;justify-content:center;
    padding:8px;text-align:center;
    font-family:'Cormorant Garamond',serif;font-style:italic;
    font-size:13px;color:var(--gold-deep);
  }
  .landing-root .feat-vision-tile.alt{
    background:linear-gradient(135deg,var(--sand),var(--cream));
    color:var(--char);
  }

  /* responsive */
  @media (max-width:900px){
    .landing-root .feat-grid{grid-template-columns:1fr 1fr;gap:20px}
  }
  @media (max-width:560px){
    .landing-root .feat-grid{grid-template-columns:1fr;max-width:380px;margin-left:auto;margin-right:auto}
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
  .landing-root .foot-disclaimer{
    border-top:1px solid rgba(245,239,230,0.12);
    padding:24px 0;
    font-size:12px;line-height:1.7;
    color:rgba(245,239,230,0.55);
    max-width:980px;
    font-style:italic;
    font-family:'Cormorant Garamond',serif;
  }
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
    .landing-root .gallery-grid,
    .landing-root .quote-grid{grid-template-columns:1fr;gap:20px}
    .landing-root .showcase-stage{min-height:auto;flex-direction:column;gap:32px;padding:0 12px}
    .landing-root .show-devices{max-width:420px}
    .landing-root .show-phone{position:static;width:180px;height:370px;margin:0 auto}
    .landing-root .review-card{position:static;width:100%;max-width:340px;transform:none}
    .landing-root .card-1,.landing-root .card-2,.landing-root .card-3{transform:none}
    .landing-root .founder-body{font-size:19px}
    .landing-root .price-grid{grid-template-columns:1fr 1fr;gap:18px}
    .landing-root .price-card.featured{transform:none}
    .landing-root .price-card.featured:hover{transform:translateY(-4px)}
    .landing-root section{padding:80px 0}
    .landing-root .nav-links{display:none}
    /* Mobile drawer — nav-links + nav-right collapse into a vertical panel
       below the top bar when the hamburger is tapped. */
    .landing-root .nav-links.open{
      display:flex;flex-direction:column;align-items:flex-start;
      gap:18px;position:absolute;top:64px;left:0;right:0;
      background:var(--ivory);border-top:1px solid var(--line);
      padding:20px 24px;z-index:50;
      box-shadow:0 16px 40px rgba(26,24,22,0.08);
    }
    .landing-root .nav-links.open .nav-right{
      display:flex;flex-direction:column;align-items:flex-start;
      gap:14px;width:100%;
    }
    .landing-root .nav-links.open .nav-cta,
    .landing-root .nav-links.open .nav-price{width:100%;text-align:center;justify-content:center}
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

  /* =========================================================
     LIFESTYLE GALLERY — "Real life with Sovereign"
     Pinterest-ish grid of in-the-wild photos showing the app
     across real days. Mobile collapses to a single column so
     each image is readable on a phone instead of squashed.
     ========================================================= */
  .landing-root .lifestyle{padding:90px 0;background:linear-gradient(180deg, var(--ivory) 0%, var(--cream) 100%)}
  .landing-root .lifestyle .section-eyebrow.center{margin-bottom:14px}
  .landing-root .lifestyle h2{
    text-align:center;font-family:'Cormorant Garamond',serif;
    font-size:46px;line-height:1.1;letter-spacing:-0.01em;color:var(--ink);
    margin-bottom:18px;font-weight:400;
  }
  .landing-root .lifestyle .section-sub{
    text-align:center;color:var(--muted);font-size:17px;
    max-width:540px;margin:0 auto 56px;line-height:1.6;
  }
  .landing-root .lifestyle-grid{
    display:grid;grid-template-columns:repeat(3,1fr);
    gap:18px;max-width:1180px;margin:0 auto;
  }
  .landing-root .lifestyle-tile{
    position:relative;overflow:hidden;border-radius:14px;
    box-shadow:0 18px 40px rgba(26,24,22,0.08);
    background:var(--cream);transition:transform .35s ease;
  }
  .landing-root .lifestyle-tile:hover{transform:translateY(-3px)}
  .landing-root .lifestyle-tile.tall{aspect-ratio:3/4}
  .landing-root .lifestyle-tile.wide{aspect-ratio:1/1}
  /* Pillar tile — taller bottom panel that carries the roman numeral,
     pillar name, and full description for one of the three brand pillars
     (Stillness · Strength · Sovereignty). Visually heavier than the
     supporting lifestyle tiles so the pillars read first. */
  .landing-root .lifestyle-tile.pillar{aspect-ratio:3/4.4}
  .landing-root .lifestyle-tile.pillar .lifestyle-cap{
    padding:22px 20px 22px;
    background:linear-gradient(180deg, rgba(26,24,22,0) 0%, rgba(26,24,22,0.55) 35%, rgba(26,24,22,0.85) 100%);
  }
  .landing-root .lifestyle-tile.pillar .num{
    font-family:'Cormorant Garamond',serif;
    font-size:13px;font-style:italic;letter-spacing:0.06em;
    color:var(--gold);margin-bottom:6px;
  }
  .landing-root .lifestyle-tile.pillar .name{
    font-family:'Cormorant Garamond',serif;
    font-size:30px;line-height:1.1;color:#fff;margin-bottom:10px;
  }
  .landing-root .lifestyle-tile.pillar .desc{
    font-size:13px;line-height:1.55;color:rgba(245,239,230,0.88);
    max-width:34ch;
  }
  /* Wide showcase tile — the closing "see-inside" image. Spans the full
     grid width on desktop, sits as a hero crescendo under the lifestyle
     grid. Uses object-position:top so the app's title row never crops off
     the top of the screenshot. */
  .landing-root .lifestyle-tile.showcase{
    grid-column:1 / -1;aspect-ratio:16/7;
  }
  .landing-root .lifestyle-tile.showcase img{object-position:top center}
  @media (max-width:960px){
    .landing-root .lifestyle-tile.pillar{aspect-ratio:3/4}
    .landing-root .lifestyle-tile.pillar .name{font-size:24px}
    .landing-root .lifestyle-tile.showcase{aspect-ratio:4/3}
  }
  @media (max-width:560px){
    .landing-root .lifestyle-tile.pillar .name{font-size:22px}
    .landing-root .lifestyle-tile.pillar .desc{font-size:12.5px}
    .landing-root .lifestyle-tile.showcase{aspect-ratio:3/2}
  }
  .landing-root .lifestyle-tile img{
    display:block;width:100%;height:100%;object-fit:cover;
  }
  .landing-root .lifestyle-cap{
    position:absolute;left:0;right:0;bottom:0;padding:18px 18px 20px;
    background:linear-gradient(180deg, rgba(26,24,22,0) 0%, rgba(26,24,22,0.65) 80%);
    color:#fff;
  }
  .landing-root .lifestyle-cap .kicker{
    font-size:10px;letter-spacing:0.24em;text-transform:uppercase;
    color:rgba(255,255,255,0.75);margin-bottom:6px;
  }
  .landing-root .lifestyle-cap .label{
    font-family:'Cormorant Garamond',serif;font-size:22px;font-style:italic;line-height:1.15;
  }
  @media (max-width:960px){
    .landing-root .lifestyle{padding:70px 0}
    .landing-root .lifestyle h2{font-size:36px}
    .landing-root .lifestyle-grid{grid-template-columns:1fr 1fr;gap:14px}
  }
  @media (max-width:560px){
    .landing-root .lifestyle{padding:54px 0}
    .landing-root .lifestyle h2{font-size:30px;line-height:1.15}
    .landing-root .lifestyle .section-sub{font-size:15px;margin-bottom:36px}
    .landing-root .lifestyle-grid{grid-template-columns:1fr;gap:14px}
    .landing-root .lifestyle-tile.tall,
    .landing-root .lifestyle-tile.wide{aspect-ratio:4/5}
    .landing-root .lifestyle-cap{padding:14px 14px 16px}
    .landing-root .lifestyle-cap .label{font-size:20px}
  }

  /* Founder layout — portrait of Nataly on the left, letter on the right,
     so the reader can put a face to the voice. Stacks vertically on
     phones. */
  .landing-root .founder-grid{
    display:grid;grid-template-columns:0.85fr 1.15fr;
    gap:60px;align-items:center;
    max-width:1100px;margin:0 auto;
  }
  .landing-root .founder-portrait-img{
    display:block;width:100%;max-width:420px;
    aspect-ratio:3/4;object-fit:cover;
    border-radius:18px;margin:0 auto;
    box-shadow:0 30px 60px -20px rgba(26,24,22,0.28), 0 12px 24px -10px rgba(26,24,22,0.14);
  }
  .landing-root .founder-text-block{text-align:left}
  .landing-root .founder-text-block .section-eyebrow{justify-content:flex-start}
  @media (max-width:900px){
    .landing-root .founder-grid{
      grid-template-columns:1fr;gap:36px;
    }
    .landing-root .founder-portrait-img{max-width:340px}
    .landing-root .founder-text-block{text-align:center}
    .landing-root .founder-text-block .section-eyebrow{justify-content:center}
  }

  /* =========================================================
     ADDITIONAL MOBILE POLISH — every section on phones
     Existing media queries handle big-ticket layout shifts;
     these add the typography + padding refinements so the
     page feels finished on a phone, not just functional.
     ========================================================= */
  @media (max-width:768px){
    .landing-root .container{padding:0 20px}
    .landing-root .hero{padding:48px 0 56px}
    .landing-root .hero h1,
    .landing-root .hero-center h1{font-size:42px;line-height:1.1}
    .landing-root .hero-sub{font-size:16px}
    .landing-root section{padding:60px 0}
    .landing-root h2{font-size:34px;line-height:1.15}
    .landing-root .section-sub{font-size:15px}
    .landing-root .strip{padding:14px 0}
    .landing-root .strip-inner span{font-size:12px;padding:0 18px}
  }
  @media (max-width:480px){
    .landing-root .hero h1,
    .landing-root .hero-center h1{font-size:36px}
    .landing-root .hero-sub{font-size:15px}
    .landing-root h2{font-size:28px}
    .landing-root .nav-row{padding:12px 0}
    .landing-root .logo{font-size:18px;letter-spacing:0.24em}
    .landing-root .nav-price-amt{font-size:16px}
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
  { planId: "6mo", dollars: "$74", cents: ".99" },
  { planId: "12mo", dollars: "$129", cents: ".99", featured: true },
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
  features: {
    eyebrow: string;
    title: Part[];
    sub: string;
    items: { key: string; name: string; desc: string; caption: string; src?: string }[];
  };
  showcase: {
    eyebrow: string;
    title: Part[];
    sub: string;
    reviews: { author: string; date: string; title: string; body: string }[];
  };
  founder: { eyebrow: string; title: Part[]; name: string; body: string; signoff: string };
  affiliateModal: {
    eyebrow: string;
    title: Part[];
    intro: string;
    steps: string[];
    mathHeader: string;
    mathRows: { label: string; amount: string }[];
    oneTimeNote: string;
    fine: string;
    cta: string;
    ctaHref: string;
    close: string;
    trigger: string;
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
    disclaimer: string;
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
    features: {
      eyebrow: "What's inside",
      title: ["A peek ", { i: "inside" }, " Sovereign"],
      sub: "Twelve modules, gathered into one quiet space — here's a small glimpse.",
      items: [
        { key: "planner",      name: "Daily Planner",     desc: "Top 3 priorities, time blocks, wins",                caption: "Wake up knowing the three things that actually matter today.",                                       src: "/images/screen-planner.png" },
        { key: "speak",        name: "Speak Eloquently",  desc: "130 phrases · saying no, boundaries, hard talks",    caption: "130 ways to say what you mean — without losing yourself.",                                           src: "/images/screen-speak.png" },
        { key: "affirmations", name: "Affirmations",      desc: "A word for today — pick or let it find you",         caption: "A word for today. Pick the one your soul needs, or let it find you.",                                src: "/images/screen-affirmations.png" },
        { key: "habits",       name: "Habits & Water",    desc: "Gentle daily rhythm tracking",                       caption: "The rhythm of a life lived on purpose — your routines, your water, your gentle daily wins.",         src: "/images/screen-habits.png" },
        { key: "growth",       name: "Growth & Self",     desc: "Strengths, weak spots, what to nurture",             caption: "Name your strengths. Notice what you're nurturing. Reflect on who you're becoming.",                src: "/images/screen-growth.png" },
        { key: "finance",      name: "Personal Finance",  desc: "In, out, savings goals, investments",                caption: "Money this month, savings goals, investments — all in one quiet space.",                            src: "/images/screen-finance.png" },
      ],
    },
    showcase: {
      eyebrow: "Inside Sovereign",
      title: ["A quiet ", { i: "home" }, " on your phone"],
      sub: "Open Sovereign and the day softens. Your rituals, your word, your stats — gathered into one calm screen.",
      reviews: [
        {
          author: "Maya R.",
          date: "03/15/2026",
          title: "Life-changing",
          body: "I'm a busy mom with so much on my plate. Having every ritual in one place finally made my mornings feel intentional again.",
        },
        {
          author: "Sienna L.",
          date: "03/22/2026",
          title: "Truly an all-in-one",
          body: "Sovereign was so thought-out — finally a space for the modern woman to come home to herself. Obsessed.",
        },
        {
          author: "Jules K.",
          date: "04/01/2026",
          title: "Spectacular",
          body: "I'm loving it so much. Honestly the best tool to plan my days and return to my own pace. Highly recommend.",
        },
      ],
    },
    founder: {
      eyebrow: "Behind Sovereign",
      title: ["About ", { i: "the" }, " Founder"],
      name: "Nataly",
      body: "Meet Nataly — the visionary behind Sovereign. A creative, a mother, and an entrepreneur who believes the modern woman can hold both strength and stillness in the same day. After years of building, becoming, and finding her way back to herself, she designed Sovereign as the practice she wished she'd had: daily rituals, mindset work, and intentional design — gathered into one quiet, beautiful space. Her mission is simple: to help women everywhere stop shrinking, return to their own pace, and live in their sovereign power.",
      signoff: "— Nataly, founder of Sovereign",
    },
    affiliateModal: {
      eyebrow: "Affiliate Program",
      title: ["The math, ", { i: "honestly" }],
      intro:
        "When you're on the $129.99 Sovereign Annual plan, you get a unique referral link. Every woman who buys the Annual plan through your link earns you 40% — paid as a one-time commission when her free trial converts.",
      steps: [
        "Apply by email and tell us why you love Sovereign",
        "We send your unique referral link within 24 hours of approval",
        "Share it — Instagram, text, voice note, however feels true to you",
        "Get paid on the 1st of the month after your referral's trial converts",
      ],
      mathHeader: "You earn $51.99 every time a referral buys the Year plan. So if in one month…",
      mathRows: [
        { label: "1 Year subscription sold", amount: "$51.99" },
        { label: "5 Year subscriptions sold", amount: "$259.95" },
        { label: "10 Year subscriptions sold", amount: "$519.90" },
        { label: "20 Year subscriptions sold", amount: "$1,039.80" },
      ],
      oneTimeNote:
        "Commission is a one-time payment per referral — not recurring. Paid the month after her trial converts to a paid Annual subscription.",
      fine: "You must keep an active Year subscription to earn commission. If you cancel your own subscription, your referral link is deactivated and any signups after your cancellation don't credit you — even if they fall inside the 60-day cookie window. Monthly, 3-month, and 6-month referrals don't count. Self-referrals don't count.",
      cta: "Read full program details →",
      ctaHref: "/affiliate",
      close: "Close",
      trigger: "Affiliate program · See details →",
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
        features: [
          "Every section of your planner",
          "Summary, Planner, Goals & Habits",
          "Cycle, Vision Board, Boundaries",
          "6 themes · EN / ES · Cancel anytime",
        ],
      },
      "3mo": {
        tier: "3 Months",
        period: "Billed quarterly",
        savings: "save 11% · $13.33/mo",
        features: [
          "Everything in Monthly",
          "Save 11% — rate locked",
          "Sneak peek at what's coming next",
          "Cancel anytime",
        ],
      },
      "6mo": {
        tier: "6 Months",
        period: "Billed every 6 months",
        savings: "save 17% · $12.50/mo",
        features: [
          "Everything in 3 Months",
          "Save 17% — rate locked",
          "Personal welcome from the founder",
          "Early access to new features",
        ],
      },
      "12mo": {
        tier: "1 Year",
        period: "Billed annually",
        savings: "save 28% · $10.83/mo",
        features: [
          "Everything in 6 Months",
          "Save 28% — best value",
          "Access to affiliate program — earn 40% commission",
          "Lock in this rate for life",
        ],
        badge: "✦ Most Loved",
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
          a: "Your whole life, gathered into one calm dashboard. A Summary view (tasks, top priorities, habits, water, vitamins, mood), Daily Planner & Calendar, Goals, Growth & Self, Cycle & Mood, Affirmations, Boundaries, Vision Board, Speak Eloquently, Personal Finance, Notes, and a private Logins & Passwords vault. Six aesthetic themes (Sage, Rose, Lavender, Honey, Ocean, Noir) and full English / Spanish — included in every plan.",
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
        { label: "Contact", href: "mailto:admin@dominioncodeacademy.com" },
        { label: "Help Center", href: "mailto:admin@dominioncodeacademy.com" },
        { label: "Manage Plan", href: "/billing" },
        { label: "Affiliate", href: "/affiliate" },
      ],
      legalHead: "Legal",
      legal: [
        { label: "Terms", href: "/terms" },
        { label: "Privacy", href: "/privacy" },
        { label: "Refund Policy", href: "/refund" },
      ],
      copyright: "© 2026 Sovereign — owned & operated by The Dominion Code LLC. All rights reserved.",
      madeWith: "Made with intention ✦",
      disclaimer:
        "All Sovereign subscriptions are non-refundable. Your 3-day free trial is your window to decide — your card is not charged until day four. You may cancel anytime to stop future billing; access continues through the end of your current paid period. See our Refund Policy, Terms, and Privacy Policy.",
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
    features: {
      eyebrow: "Lo que hay dentro",
      title: ["Un vistazo ", { i: "por dentro" }, " de Sovereign"],
      sub: "Doce módulos, reunidos en un espacio sereno — aquí una pequeña muestra.",
      items: [
        { key: "planner",      name: "Planificador diario",  desc: "Top 3 prioridades, bloques de tiempo, logros",            caption: "Despierta sabiendo las tres cosas que de verdad importan hoy.",                                  src: "/images/screen-planner.png" },
        { key: "speak",        name: "Hablar con elocuencia", desc: "130 frases · decir no, límites, conversaciones difíciles", caption: "130 maneras de decir lo que piensas — sin perderte a ti misma.",                                src: "/images/screen-speak.png" },
        { key: "affirmations", name: "Afirmaciones",          desc: "Una palabra para hoy — eliges o se elige sola",            caption: "Una palabra para hoy. Elige la que tu alma necesita, o deja que te encuentre.",                  src: "/images/screen-affirmations.png" },
        { key: "habits",       name: "Hábitos y agua",        desc: "Ritmo diario gentil",                                       caption: "El ritmo de una vida con propósito — tus rutinas, tu agua, tus pequeños logros diarios.",         src: "/images/screen-habits.png" },
        { key: "growth",       name: "Crecimiento personal", desc: "Fortalezas, puntos débiles, qué nutrir",                    caption: "Nombra tus fortalezas. Observa lo que cultivas. Reflexiona sobre quién te estás convirtiendo.",   src: "/images/screen-growth.png" },
        { key: "finance",      name: "Finanzas personales",  desc: "Entradas, salidas, metas de ahorro, inversiones",          caption: "Dinero del mes, metas de ahorro, inversiones — todo en un espacio sereno.",                       src: "/images/screen-finance.png" },
      ],
    },
    showcase: {
      eyebrow: "Por dentro de Sovereign",
      title: ["Un ", { i: "hogar" }, " sereno en tu teléfono"],
      sub: "Abre Sovereign y el día se suaviza. Tus rituales, tu palabra, tus estadísticas — reunidos en una sola pantalla en calma.",
      reviews: [
        {
          author: "Maya R.",
          date: "15/03/2026",
          title: "Me cambió la vida",
          body: "Soy mamá ocupada con muchísimo encima. Tener cada ritual en un solo lugar finalmente hizo que mis mañanas se sintieran intencionales otra vez.",
        },
        {
          author: "Sienna L.",
          date: "22/03/2026",
          title: "Realmente todo en uno",
          body: "Sovereign está tan bien pensado — por fin un espacio para que la mujer moderna vuelva a sí misma. Obsesionada.",
        },
        {
          author: "Jules K.",
          date: "01/04/2026",
          title: "Espectacular",
          body: "Me encanta tanto. Honestamente la mejor herramienta para planear mis días y volver a mi propio ritmo. Súper recomendado.",
        },
      ],
    },
    founder: {
      eyebrow: "Detrás de Sovereign",
      title: ["Sobre ", { i: "la" }, " Fundadora"],
      name: "Nataly",
      body: "Conoce a Nataly — la visionaria detrás de Sovereign. Creativa, madre y emprendedora que cree que la mujer moderna puede sostener fuerza y quietud en un mismo día. Después de años construyendo, transformándose y encontrando el camino de regreso a sí misma, diseñó Sovereign como la práctica que hubiera querido tener: rituales diarios, trabajo mental y diseño intencional — reunidos en un espacio sereno y hermoso. Su misión es simple: ayudar a mujeres en todo el mundo a dejar de encogerse, volver a su propio ritmo y vivir en su poder soberano.",
      signoff: "— Nataly, fundadora de Sovereign",
    },
    affiliateModal: {
      eyebrow: "Programa de Afiliadas",
      title: ["Las cuentas, ", { i: "honestamente" }],
      intro:
        "Cuando estás en el plan Anual de Sovereign de $129.99, recibes un enlace único de referido. Cada mujer que compre el plan Anual a través de tu enlace te genera 40% — pagado como comisión única cuando su prueba gratuita se convierte.",
      steps: [
        "Aplica por correo y cuéntanos por qué amas Sovereign",
        "Te enviamos tu enlace único en menos de 24 horas tras la aprobación",
        "Compártelo — Instagram, mensaje, nota de voz, como se sienta real para ti",
        "Recibe el pago el día 1 del mes después de que tu referida convierta su prueba",
      ],
      mathHeader: "Ganas $51.99 cada vez que una referida compra el plan Anual. Entonces si en un mes…",
      mathRows: [
        { label: "1 plan Anual vendido", amount: "$51.99" },
        { label: "5 planes Anuales vendidos", amount: "$259.95" },
        { label: "10 planes Anuales vendidos", amount: "$519.90" },
        { label: "20 planes Anuales vendidos", amount: "$1,039.80" },
      ],
      oneTimeNote:
        "La comisión es un pago único por cada referida — no es recurrente. Pagado el mes después de que su prueba se convierta en suscripción Anual paga.",
      fine: "Debes mantener una suscripción Anual activa para ganar comisión. Si cancelas tu propia suscripción, tu enlace de referida se desactiva y cualquier inscripción posterior a tu cancelación no se te acredita — aun si ocurre dentro de la ventana de 60 días. Las referencias a planes Mensual, 3 meses y 6 meses no cuentan. Las auto-referencias no cuentan.",
      cta: "Ver detalles completos del programa →",
      ctaHref: "/affiliate",
      close: "Cerrar",
      trigger: "Programa de afiliadas · Ver detalles →",
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
        features: [
          "Cada sección de tu planificador",
          "Resumen, Planeador, Metas y Hábitos",
          "Ciclo, Tablero de Visión, Límites",
          "6 temas · EN / ES · Cancela cuando quieras",
        ],
      },
      "3mo": {
        tier: "3 meses",
        period: "Facturado trimestralmente",
        savings: "ahorra 11% · $13.33/mes",
        features: [
          "Todo lo del plan Mensual",
          "Ahorra 11% — tarifa asegurada",
          "Vista previa de lo que viene",
          "Cancela cuando quieras",
        ],
      },
      "6mo": {
        tier: "6 meses",
        period: "Facturado cada 6 meses",
        savings: "ahorra 17% · $12.50/mes",
        features: [
          "Todo lo del plan de 3 meses",
          "Ahorra 17% — tarifa asegurada",
          "Bienvenida personal de la fundadora",
          "Acceso anticipado a nuevas funciones",
        ],
      },
      "12mo": {
        tier: "1 año",
        period: "Facturado anualmente",
        savings: "ahorra 28% · $10.83/mes",
        features: [
          "Todo lo del plan de 6 meses",
          "Ahorra 28% — el mejor valor",
          "Acceso al programa de afiliadas — gana 40% de comisión",
          "Asegura esta tarifa de por vida",
        ],
        badge: "✦ La favorita",
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
          a: "Toda tu vida, reunida en un solo panel en calma. Un Resumen (tareas, prioridades, hábitos, agua, vitaminas, ánimo), Planeador y Calendario, Metas, Crecimiento Personal, Ciclo y Ánimo, Afirmaciones, Límites, Tablero de Visión, Habla con Elocuencia, Finanzas Personales, Notas y una bóveda privada de Contraseñas. Seis temas estéticos (Sage, Rose, Lavender, Honey, Ocean, Noir) y bilingüe completo inglés / español — incluido en todos los planes.",
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
        { label: "Contacto", href: "mailto:admin@dominioncodeacademy.com" },
        { label: "Centro de ayuda", href: "mailto:admin@dominioncodeacademy.com" },
        { label: "Gestionar plan", href: "/billing" },
        { label: "Afiliados", href: "/affiliate" },
      ],
      legalHead: "Legal",
      legal: [
        { label: "Términos", href: "/terms" },
        { label: "Privacidad", href: "/privacy" },
        { label: "Política de reembolso", href: "/refund" },
      ],
      copyright: "© 2026 Sovereign — propiedad y operado por The Dominion Code LLC. Todos los derechos reservados.",
      madeWith: "Hecho con intención ✦",
      disclaimer:
        "Todas las suscripciones de Sovereign son no reembolsables. Tu prueba gratuita de 3 días es tu ventana para decidir — tu tarjeta no se cobra hasta el cuarto día. Puedes cancelar en cualquier momento para detener la facturación futura; el acceso continúa hasta el final de tu período pagado. Consulta nuestra Política de reembolso, Términos y Política de privacidad.",
    },
  },
};

export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  const [affModalOpen, setAffModalOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // Approved testimonials are pulled live from the storage bucket and rendered
  // in the reviews section. Hardcoded Maya/Sienna/Jules quotes have been
  // removed — only real, approved submissions appear here now.
  const [approvedReviews, setApprovedReviews] = useState<ApprovedTestimonial[]>([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const c = COPY[lang];

  useEffect(() => {
    let cancelled = false;
    listApprovedTestimonials()
      .then((list) => {
        if (!cancelled) {
          setApprovedReviews(list);
          setReviewsLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setReviewsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <div className="landing-root">
      <VisitTracker slug="landing" />
      <style dangerouslySetInnerHTML={{ __html: landingCss }} />

      <nav>
        <div className="container nav-row">
          <a href="#" className="logo">
            Sovereign
          </a>
          <div className={`nav-links${mobileNavOpen ? " open" : ""}`}>
            <a href="#pillars" onClick={closeMobileNav}>{c.nav.method}</a>
            <a href="#reviews" onClick={closeMobileNav}>{c.nav.reviews}</a>
            <a href="#faq" onClick={closeMobileNav}>{c.nav.faq}</a>
            <div className="nav-right">
              <a href="/login" className="nav-login" onClick={closeMobileNav}>
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
                  $10.83<span className="nav-price-suffix">/mo</span>
                </span>
              </a>
              <a href="#pricing" className="nav-cta">
                {c.nav.startFree}
              </a>
            </div>
          </div>
          <button
            type="button"
            className="burger"
            aria-label="Menu"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            {mobileNavOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      <header className="hero hero-center">
        <div className="container">
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

          {/* Device mockups moved up from the old showcase section — give
              the visitor an immediate visual of the app right under the CTA. */}
          <div className="hero-devices">
            <div className="show-devices">
              <div className="show-laptop">
                <div className="show-laptop-screen">
                  <img
                    src="/images/sovereign-app-desktop.png?v=3"
                    alt="Sovereign on desktop"
                    className="show-laptop-img"
                  />
                </div>
                <div className="show-laptop-base"></div>
              </div>
              <div className="show-phone">
                <div className="show-phone-notch"></div>
                <img
                  src="/images/sovereign-app-screen.png?v=3"
                  alt="Sovereign app summary view"
                  className="show-phone-screen"
                />
              </div>
            </div>
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

      {/* THREE PILLARS — combined into the lifestyle gallery so the
          method and the photos read as one section. First row: 3 pillar
          tiles (Stillness · Strength · Sovereignty) each paired with a
          lifestyle image and the pillar copy. Second row: 3 supporting
          lifestyle tiles. Closing showcase: a wide app screenshot. */}
      <section id="pillars" className="lifestyle">
        <div className="container">
          <div className="section-eyebrow center">{c.pillars.eyebrow}</div>
          <h2>{renderParts(c.pillars.title)}</h2>
          <p className="section-sub">{c.pillars.sub}</p>

          <div className="lifestyle-grid">
            {/* Pillar row — each tile carries a paired lifestyle image and
                the brand-pillar copy (numeral + name + description). */}
            {c.pillars.items.map((item, idx) => {
              const pillarImg = [
                "/images/landing/lifestyle-flatlay.png",        // Stillness — morning ritual
                "/images/landing/lifestyle-habits.png",         // Strength  — daily rhythm
                "/images/landing/lifestyle-vision-screen.jpg",  // Sovereignty — the Vision Board screen
              ][idx] || "/images/landing/lifestyle-flatlay.png";
              return (
                <div key={item.num} className="lifestyle-tile pillar">
                  <img src={pillarImg} alt={item.title} loading="lazy" />
                  <div className="lifestyle-cap">
                    <div className="num">{item.num}</div>
                    <div className="name">{item.title}</div>
                    <div className="desc">{item.desc}</div>
                  </div>
                </div>
              );
            })}

            {/* Supporting lifestyle tiles — the day, in real life. */}
            {[
              {
                src: "/images/landing/lifestyle-signin.png",
                kicker: lang === "es" ? "El regreso" : "Welcome back",
                label: lang === "es" ? "Hábitos antes del café." : "Habits before the coffee.",
              },
              {
                src: "/images/landing/lifestyle-schedule.png",
                kicker: lang === "es" ? "El horario" : "Weekly schedule",
                label: lang === "es" ? "Un día entero, en un vistazo." : "A whole week at a glance.",
              },
              {
                src: "/images/landing/lifestyle-vision.png",
                kicker: lang === "es" ? "Vision Board" : "Vision Board",
                label: lang === "es" ? "La vida que estás construyendo." : "The life you're building.",
              },
            ].map((t) => (
              <div key={t.src} className="lifestyle-tile tall">
                <img src={t.src} alt={t.label} loading="lazy" />
                <div className="lifestyle-cap">
                  <div className="kicker">{t.kicker}</div>
                  <div className="label">{t.label}</div>
                </div>
              </div>
            ))}

          </div>
        </div>
      </section>

      <section className="founder">
        <div className="container">
          <div className="founder-grid">
            {/* Portrait of Nataly — the Bloom Pilates shot. Puts a face
                to the founder letter so it doesn't read as anonymous. */}
            <img
              src="/images/landing/lifestyle-menu.png"
              alt={lang === "es" ? "Nataly, fundadora de Sovereign" : "Nataly, founder of Sovereign"}
              className="founder-portrait-img"
              loading="lazy"
            />
            <div className="founder-text-block">
              <div className="section-eyebrow">{c.founder.eyebrow}</div>
              <h2 className="founder-title">{renderParts(c.founder.title)}</h2>
              <p className="founder-body">{c.founder.body}</p>
              <div className="founder-signoff">{c.founder.signoff}</div>
            </div>
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
                  {/* Affiliate-program box sits ABOVE the primary CTA so the
                      "Begin Free Trial" button stays at the bottom of every
                      card — uniform across the row. Only shown for 1 Year. */}
                  {plan.planId === "12mo" && (
                    <a href="/affiliate" className="aff-card-btn">
                      {c.affiliateModal.trigger}
                    </a>
                  )}
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

          {reviewsLoaded && approvedReviews.length === 0 ? (
            <p className="quote-empty">
              {lang === "es"
                ? "Aún no hay testimonios — sé la primera en compartir tu palabra."
                : "No testimonials yet — be the first to share yours."}
            </p>
          ) : (
            <div className="quote-grid">
              {approvedReviews.map((q) => (
                <div className="quote" key={q.id}>
                  {q.photoUrl && (
                    <img
                      src={q.photoUrl}
                      alt={q.name}
                      className="quote-photo"
                    />
                  )}
                  <div className="stars">✦ ✦ ✦ ✦ ✦</div>
                  <p>&ldquo;{q.quote}&rdquo;</p>
                  <div className="quote-author">— {q.name}</div>
                </div>
              ))}
            </div>
          )}

          <div className="testi-cta-row">
            <LeaveTestimonialModal lang={lang} />
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
          <div className="foot-disclaimer">{c.footer.disclaimer}</div>
          <div className="foot-bottom">
            <div>{c.footer.copyright}</div>
            <div>{c.footer.madeWith}</div>
          </div>
        </div>
      </footer>

      {affModalOpen && (
        <div
          className="aff-modal-backdrop"
          onClick={() => setAffModalOpen(false)}
        >
          <div
            className="aff-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="aff-modal-close"
              onClick={() => setAffModalOpen(false)}
              aria-label={c.affiliateModal.close}
            >
              ×
            </button>
            <div className="section-eyebrow center">
              {c.affiliateModal.eyebrow}
            </div>
            <h3 className="aff-modal-title">
              {renderParts(c.affiliateModal.title)}
            </h3>
            <p className="aff-modal-intro">{c.affiliateModal.intro}</p>

            <ol className="aff-modal-steps">
              {c.affiliateModal.steps.map((s, i) => (
                <li key={i}>
                  <span className="aff-step-num">
                    {["i.", "ii.", "iii.", "iv."][i] ?? `${i + 1}.`}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>

            <div className="aff-modal-math">
              <div className="aff-math-header">
                {c.affiliateModal.mathHeader}
              </div>
              <table>
                <tbody>
                  {c.affiliateModal.mathRows.map((r) => (
                    <tr key={r.label}>
                      <td>{r.label}</td>
                      <td>{r.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="aff-modal-onetime">{c.affiliateModal.oneTimeNote}</p>
            <p className="aff-modal-fine">{c.affiliateModal.fine}</p>

            <a
              href={c.affiliateModal.ctaHref}
              className="aff-modal-cta"
              onClick={() => setAffModalOpen(false)}
            >
              {c.affiliateModal.cta}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
