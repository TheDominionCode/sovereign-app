import Link from "next/link";

// Public demo of the in-app profile dropdown so the owner can SEE what every
// user sees in the planner without needing to be logged in. Side-by-side:
// what a non-affiliate sees (faded Community link → routes to /affiliate/apply)
// versus what an approved affiliate sees (green Community link → routes
// straight to /affiliate/community).
//
// This is a visual mock — it renders the same Tailwind classes the real
// dropdown uses inside os.html, but it's fully static so the only goal here
// is "show me what the button looks like and let me click it."

export const metadata = { title: "Dropdown preview — Sovereign" };

function Dropdown({
  variant,
  title,
}: {
  variant: "affiliate" | "non-affiliate" | "admin";
  title: string;
}) {
  const isAffiliate = variant === "affiliate" || variant === "admin";
  const isAdmin = variant === "admin";
  const communityHref = isAffiliate ? "/affiliate/community" : "/affiliate/preview";

  return (
    <div className="space-y-3">
      <div className="text-[11px] tracking-[0.18em] uppercase text-stone-500 font-semibold">
        {title}
      </div>
      <div className="relative">
        <div className="w-72 bg-white border border-stone-200 rounded-lg shadow-xl overflow-hidden">
          {/* Header — mock user */}
          <div className="p-4 border-b border-stone-100 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#a8c090] to-[#5b7351] flex items-center justify-center text-sm font-bold text-white">
              {isAffiliate ? "NG" : "AB"}
            </div>
            <div className="min-w-0">
              <div className="font-medium text-sm truncate">
                {isAffiliate ? "Nataly Graziani" : "Sample User"}
              </div>
              <div className="text-[10px] text-stone-500 truncate">
                {isAffiliate ? "natalyg" : "sample"}
              </div>
            </div>
          </div>
          {/* Menu items */}
          <div className="p-2">
            <button className="w-full px-3 py-2 text-left text-sm rounded hover:bg-[#f4f7ee] flex items-center gap-2">
              <svg className="w-4 h-4 text-[#7a9a6e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Upload picture
            </button>

            {/* Community — the star of the show */}
            <Link
              href={communityHref}
              className={`w-full px-3 py-2 text-left text-sm rounded flex items-center gap-2 ${
                isAffiliate
                  ? "text-[#5b7351] font-medium hover:bg-[#f4f7ee]"
                  : "text-stone-400 hover:bg-stone-50 hover:text-stone-600"
              }`}
            >
              <svg
                className={`w-4 h-4 ${isAffiliate ? "fill-[#5b7351]" : "fill-none"}`}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Community
            </Link>

            {/* Admin dashboard is ONLY shown to actual admins (rows in the
                public.admins table). Approved affiliates do NOT get admin —
                they just get the Community link in green. */}
            {isAdmin && (
              <>
                <div className="border-t border-stone-100 my-1" />
                <button className="w-full px-3 py-2 text-left text-sm rounded hover:bg-[#f4f7ee] flex items-center gap-2 text-[#5b7351] font-medium">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 4l3 12 7-4 7 4 3-12-6 4-4-6-4 6-6-4z" />
                  </svg>
                  Admin dashboard
                </button>
              </>
            )}

            <div className="border-t border-stone-100 my-1" />
            <button className="w-full px-3 py-2 text-left text-sm rounded hover:bg-rose-50 hover:text-rose-600 flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Log out
            </button>
          </div>
        </div>
      </div>
      <div className="text-xs italic text-stone-500 max-w-[18rem]">
        {variant === "non-affiliate" && "Outlined faded star + gray text. Clicking opens the apply page (founder letter + how it works + form). No Admin dashboard."}
        {variant === "affiliate" && "Filled green star + bold text. Clicks straight to the Wall of wins. NO Admin dashboard — affiliates do not get admin access."}
        {variant === "admin" && "Admins get both: green Community AND the Admin dashboard link. This is the owner / staff view. Affiliates never see this combination unless they're also explicitly added to the admins table."}
      </div>
    </div>
  );
}

export default function DropdownDemoPage() {
  return (
    <main className="min-h-screen bg-[#f5efe6] text-[#1a1816] py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link
            href="/os.html"
            className="text-[11px] tracking-[0.18em] uppercase text-[#856a3f] hover:text-[#1a1816]"
          >
            ← Back to app
          </Link>
          <Link
            href="/affiliate/preview"
            className="text-[11px] tracking-[0.18em] uppercase text-[#856a3f] hover:text-[#1a1816]"
          >
            See the apply page →
          </Link>
        </div>

        <h1
          className="font-serif text-5xl mt-8 mb-3 leading-tight"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          The profile dropdown
        </h1>
        <p
          className="font-serif text-lg italic text-[#856a3f] mb-12"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Both states, side by side. Click either Community star to follow that
          person&apos;s actual path.
        </p>

        <div className="grid sm:grid-cols-3 gap-8 mb-12">
          <Dropdown variant="non-affiliate" title="A regular user — not yet in" />
          <Dropdown variant="affiliate" title="An approved affiliate (NOT admin)" />
          <Dropdown variant="admin" title="An admin (the owner — you)" />
        </div>

        <section className="rounded-2xl border border-[#d9cdb8] bg-white p-7 sm:p-9 shadow-sm">
          <h2
            className="font-serif text-2xl mb-3"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Two different things, not one
          </h2>
          <ul className="space-y-3 text-sm text-[#2c2926] leading-relaxed">
            <li>
              <span className="font-semibold text-[#1a1816]">Admin</span> = a row in the
              <code className="mx-1 px-1 bg-stone-100 rounded">public.admins</code>table.
              Controlled by the owner. Gets access to all <code>/admin/*</code>pages
              (Customers, Revenue, Analytics, Affiliates moderation, etc.).
            </li>
            <li>
              <span className="font-semibold text-[#1a1816]">Approved affiliate</span> =
              a row in <code className="mx-1 px-1 bg-stone-100 rounded">public.affiliate_applications</code>
              with status &apos;approved&apos;. Gets access to the Wall of wins. <span className="italic">Does
              NOT get any admin access.</span>
            </li>
            <li>
              <span className="font-semibold text-[#1a1816]">One-way override:</span> admins are
              treated as approved affiliates automatically — so the owner can see the
              community without applying to herself. Approval the other direction never
              happens.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
