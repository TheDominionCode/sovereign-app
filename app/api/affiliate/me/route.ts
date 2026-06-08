import { NextResponse } from "next/server";
import { getAffiliateStatus } from "@/lib/affiliate/guard";

// Reports the signed-in user's affiliate status. Used by the in-app planner
// (os.html) to decide whether to show the "Community" link in the sidebar.
// Returns { approved: false, isAdmin: false } when signed out or non-affiliate
// — never throws so the in-app fetch can fall through gracefully.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const info = await getAffiliateStatus();
    if (!info) {
      return NextResponse.json({ approved: false, isAdmin: false });
    }
    return NextResponse.json({
      approved: info.status === "approved",
      isAdmin: info.isAdmin,
    });
  } catch {
    return NextResponse.json({ approved: false, isAdmin: false });
  }
}
