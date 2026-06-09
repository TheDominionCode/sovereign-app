"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Beta window — invited testers get this many days of /app access without paying.
const BETA_WINDOW_DAYS = 5;

function originFromHeaders(h: Headers): string {
  // Prefer the deployed origin (works regardless of NEXT_PUBLIC_SITE_URL).
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || (host?.startsWith("localhost") ? "http" : "https");
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

function sanitizeNext(next: string | null | undefined): string {
  if (!next) return "/app";
  if (!next.startsWith("/") || next.startsWith("//")) return "/app";
  return next;
}

export async function signInWithPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = sanitizeNext(formData.get("next") as string | null);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }
  // Everyone — including admins — lands in their personal Sovereign app first.
  // Admins reach the back office via the "← ADMIN" pill that only shows on
  // /app for users on the admins allow-list.
  redirect(next);
}

export async function signUpWithPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const full_name = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  let next = sanitizeNext(formData.get("next") as string | null);

  // Beta invite check — if the visitor has the beta_invite cookie set by
  // middleware AND it matches BETA_INVITE_CODE, stamp beta_until on the
  // profile and bypass the /pricing checkout entirely.
  const cookieStore = await cookies();
  const beta = cookieStore.get("beta_invite")?.value;
  const expected = process.env.BETA_INVITE_CODE;
  const isBeta = Boolean(beta && expected && beta === expected);
  const meta: { full_name: string; phone: string; beta_until?: string } = {
    full_name,
    phone,
  };
  if (isBeta) {
    const until = new Date(Date.now() + BETA_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    meta.beta_until = until.toISOString();
    // Beta testers skip /pricing and land straight in the app.
    next = "/app";
  }

  const supabase = await createClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  // Both the "no email confirmation" path (below) and the "click the link
  // in your email" path land on /welcome first. The email-confirmation
  // callback's `next` is /welcome?next=<original-next> so new users see
  // the founder letter + how-it-works before bouncing into their planner.
  const welcomeNext = `/welcome?next=${encodeURIComponent(next)}`;
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // raw_user_meta_data — the on_auth_user_created trigger copies these
      // into the profiles row on insert.
      data: meta,
      emailRedirectTo: `${site}/auth/callback?next=${encodeURIComponent(welcomeNext)}`,
    },
  });
  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }
  // If email confirmation is disabled (local default), the user is signed in
  // immediately. If enabled (production), they need to click the email link.
  //
  // New signups land on /welcome (founder letter + how-it-works + how to add
  // to home screen). The page has an "Open my Sovereign →" CTA that uses the
  // `next` we collected here so beta testers still skip to /app and paying
  // signups still go through /pricing once they're done reading.
  redirect(welcomeNext);
}

export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    redirect(`/forgot-password?error=${encodeURIComponent("Please enter your email.")}`);
  }
  const supabase = await createClient();
  const origin = originFromHeaders(await headers());
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  // Always redirect to the success state — never reveal whether the email
  // exists (prevents account enumeration).
  if (error && !/rate/i.test(error.message)) {
    // Only surface non-sensitive errors (rate-limit etc. still show success).
    // For now keep it consistent: show generic success.
  }
  redirect("/forgot-password?sent=1");
}

export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (!password || password.length < 6) {
    redirect(`/reset-password?error=${encodeURIComponent("Password must be at least 6 characters.")}`);
  }
  if (password !== confirm) {
    redirect(`/reset-password?error=${encodeURIComponent("Passwords don't match.")}`);
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?error=${encodeURIComponent("Your reset link expired. Request a new one.")}`);
  }
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/app");
}

export async function signInWithGoogleAction(formData: FormData) {
  const next = sanitizeNext(formData.get("next") as string | null);
  const supabase = await createClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${site}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error || !data.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "OAuth init failed")}&next=${encodeURIComponent(next)}`);
  }
  redirect(data.url);
}
