import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AffiliateStatus = "pending" | "approved" | "rejected" | "none";

export type AffiliateInfo = {
  userId: string;
  email: string;
  status: AffiliateStatus;
  message: string | null;
  isAdmin: boolean;
  isOwner: boolean;
};

// Look up the signed-in user's affiliate status. Returns "none" if they've
// never applied. Pure read — does not redirect on its own; callers decide
// what to do with each status.
//
// Admins (rows in public.admins) are always synthetically treated as
// "approved" so the owner / staff can post, react, and view the community
// without going through their own apply/approve flow. The actual
// affiliate_applications row, if any, is preserved underneath.
export async function getAffiliateStatus(): Promise<AffiliateInfo | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const admin = createAdminClient();
  const email = user.email.toLowerCase();

  const [appRes, adminRes] = await Promise.all([
    admin
      .from("affiliate_applications")
      .select("status,message")
      .eq("user_id", user.id)
      .maybeSingle(),
    admin.from("admins").select("email,role").eq("email", email).maybeSingle(),
  ]);

  const isAdmin = !!adminRes.data;
  const isOwner = (adminRes.data as { role?: string } | null)?.role === "owner";
  const rawStatus = (appRes.data?.status as AffiliateStatus) ?? "none";

  return {
    userId: user.id,
    email: user.email,
    status: isAdmin ? "approved" : rawStatus,
    message: appRes.data?.message ?? null,
    isAdmin,
    isOwner,
  };
}

// Server-component guard for the affiliate community feed and post composer.
// Sends the visitor to /login if signed out, /affiliate/apply if they haven't
// applied or are still pending, and /affiliate/rejected if they were turned
// down. Returns the affiliate info on success.
export async function requireApprovedAffiliate(): Promise<AffiliateInfo> {
  const info = await getAffiliateStatus();
  if (!info) redirect("/login?next=/affiliate/community");
  if (info.status === "approved") return info;
  if (info.status === "pending" || info.status === "none") redirect("/affiliate/apply");
  // rejected → fall through to apply page (they can re-apply by writing a new note)
  redirect("/affiliate/apply");
}
