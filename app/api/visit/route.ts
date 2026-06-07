import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Public click/visit tracker. The landing page (and any other tracked link)
// fires a fire-and-forget POST here on first session view. We pull the IP,
// referrer, and user-agent from request headers so the page doesn't have to
// send anything sensitive in the body.
//
// Errors are swallowed and a 204 is returned no matter what — analytics
// should never break the visitor's experience.
//
// force-dynamic is critical: without it, the Next.js/Netlify plugin can
// cache a 404 response from build time and refuse to serve real requests
// to this URL even after the route exists.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      slug?: unknown;
      path?: unknown;
    };
    const slug =
      typeof body.slug === "string" && body.slug.trim()
        ? body.slug.trim().slice(0, 100)
        : "landing";
    const path =
      typeof body.path === "string" ? body.path.slice(0, 200) : null;

    const ip =
      request.headers.get("x-nf-client-connection-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;
    const referrer =
      request.headers.get("referer")?.slice(0, 300) || null;
    const userAgent =
      request.headers.get("user-agent")?.slice(0, 400) || null;
    const country =
      request.headers.get("x-nf-geo")?.slice(0, 200) ||
      request.headers.get("x-vercel-ip-country") ||
      null;

    const admin = createAdminClient();
    await admin.from("clicks").insert({
      link_slug: slug,
      path,
      ip,
      referrer,
      user_agent: userAgent,
      country,
    });
  } catch {
    // analytics must never break the page — swallow and move on
  }
  return new NextResponse(null, { status: 204 });
}
