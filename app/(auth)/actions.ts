"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

// If this email is on the admin allow-list, send them to /admin instead of
// the default /app. (The middleware-gated /admin page still re-checks the
// session, so it's safe even if someone forges the email here.)
async function destinationFor(email: string, fallbackNext: string): Promise<string> {
  if (fallbackNext !== "/app") return fallbackNext; // honor explicit ?next=
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("admins")
      .select("email")
      .eq("email", email.toLowerCase())
      .maybeSingle();
    if (data) return "/admin";
  } catch {
    // If the admin lookup fails, fall back to /app — better to send them
    // somewhere than to error out the login flow.
  }
  return fallbackNext;
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
  redirect(await destinationFor(email, next));
}

export async function signUpWithPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const full_name = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const next = sanitizeNext(formData.get("next") as string | null);

  const supabase = await createClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // raw_user_meta_data — the on_auth_user_created trigger copies these
      // into the profiles row on insert.
      data: { full_name, phone },
      emailRedirectTo: `${site}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }
  // If email confirmation is disabled (local default), the user is signed in
  // immediately. If enabled (production), they need to click the email link.
  redirect(next);
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
