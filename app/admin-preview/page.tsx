import Link from "next/link";
import { PERMISSIONS, GROUP_LABELS, type PermissionGroup } from "@/lib/admin/permissions";

// Public, login-free demo of the per-admin permission model. The owner can
// see WHAT each staff member would experience based on which boxes she
// checks for them on /admin/admins. Three example member configurations
// are rendered side by side so the trade-offs are obvious at a glance.

export const metadata = { title: "Admin role preview — owner vs staff" };

const ALL_TABS = [
  { label: "Overview",      perm: "overview"   },
  { label: "Active",        perm: "active"     },
  { label: "On trial",      perm: "trial"      },
  { label: "Free access",   perm: "access"     },
  { label: "Canceled",      perm: "canceled"   },
  { label: "Revenue",       perm: "revenue"    },
  { label: "Analytics",     perm: "analytics"  },
  { label: "Affiliates",    perm: "affiliates" },
  { label: "Community",     perm: "community"  },
  { label: "Testimonials",  perm: "testimonials" },
  { label: "Admins",        perm: "admins"     },
] as const;

const EXAMPLES: Array<{
  name: string;
  role: "owner" | "member";
  perms: string[];
  email: string;
  blurb: string;
}> = [
  {
    name: "You — the owner",
    role: "owner",
    perms: ["all"],
    email: "iconic.digitals10m@gmail.com",
    blurb:
      "You always have everything. The permissions column on your row is ignored — the role override grants full access.",
  },
  {
    name: "Customer support",
    role: "member",
    perms: ["overview", "active", "trial", "access", "canceled", "testimonials"],
    email: "support@example.com",
    blurb:
      "Helps customers, sees who's paying / on trial / canceled, can grant free access to testers. Cannot see money, cannot moderate the community.",
  },
  {
    name: "Affiliate manager",
    role: "member",
    perms: ["overview", "affiliates", "community", "analytics"],
    email: "affiliates@example.com",
    blurb:
      "Owns the affiliate program — approves applications, moderates the Wall of wins, watches landing visit counts. Doesn't see customers or money.",
  },
];

function MockAdmin({
  role,
  perms,
  email,
}: {
  role: "owner" | "member";
  perms: string[];
  email: string;
}) {
  const isOwner = role === "owner";
  const canSee = (p: string) => isOwner || perms.includes("all") || perms.includes(p);
  const visibleTabs = ALL_TABS.filter((t) => canSee(t.perm));
  const showMRR = canSee("revenue");

  return (
    <div className="rounded-2xl border border-[#d9cdb8] bg-white shadow-sm overflow-hidden">
      <header className="border-b border-stone-200 bg-white px-4 pt-3 pb-0">
        <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
          <div>
            <div className="text-[8px] tracking-[0.3em] uppercase text-[#7a9a6e]">Admin</div>
            <h2
              className="font-display text-base text-[#2a4023]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Sovereign — Customers
            </h2>
          </div>
          <div className="text-[9px] text-stone-600 text-right">
            <span className="text-[#3d5c34] font-medium block truncate max-w-[12rem]">
              {email}
            </span>
            <span
              className={`mt-1 inline-block px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider ${
                isOwner
                  ? "bg-[#d3e0c5]/60 text-[#2a4023]"
                  : "bg-stone-200 text-stone-600"
              }`}
            >
              {role}
            </span>
          </div>
        </div>
        <nav className="flex flex-wrap gap-0.5 border-b border-stone-200 -mx-4 px-4">
          {visibleTabs.map((t) => (
            <span
              key={t.label}
              className="px-2 py-2 text-[10px] border-b-2 -mb-px border-transparent text-stone-600"
            >
              {t.label}
            </span>
          ))}
        </nav>
      </header>
      <div className="px-4 py-4 bg-[#f4f7ee]/30">
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { label: "Total signups", value: "248", show: canSee("overview") },
            { label: "Active subs",   value: "73",  show: canSee("active") },
            { label: "On trial",      value: "14",  show: canSee("trial") },
            { label: "Canceled",      value: "19",  show: canSee("canceled") },
          ]
            .filter((t) => t.show)
            .map((t) => (
              <div
                key={t.label}
                className="rounded-lg border border-stone-200 bg-white p-2 shadow-sm"
              >
                <div className="text-[8px] tracking-[0.18em] uppercase text-stone-500 font-medium mb-1">
                  {t.label}
                </div>
                <div
                  className="font-display text-lg leading-none text-[#5b7351]"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {t.value}
                </div>
              </div>
            ))}
          {showMRR ? (
            <div className="rounded-lg border border-stone-200 bg-white p-2 shadow-sm col-span-2">
              <div className="text-[8px] tracking-[0.18em] uppercase text-stone-500 font-medium mb-1">
                MRR
              </div>
              <div
                className="font-display text-lg leading-none text-[#5b7351]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                $5,847
              </div>
            </div>
          ) : (
            <div
              className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-2 col-span-2 flex flex-col items-center justify-center text-center"
            >
              <div className="text-[8px] tracking-[0.18em] uppercase text-stone-400 font-medium line-through">
                MRR
              </div>
              <div className="text-[9px] italic text-stone-400 mt-0.5">hidden</div>
            </div>
          )}
        </div>
        {showMRR && (
          <div className="rounded-md border border-amber-200 bg-amber-50/40 px-2 py-1.5 text-[9px] italic text-amber-900">
            Trial pipeline: <span className="font-medium not-italic">$486</span>
          </div>
        )}
      </div>
    </div>
  );
}

const PERMS_BY_GROUP = PERMISSIONS.reduce<
  Record<PermissionGroup, typeof PERMISSIONS>
>((acc, p) => {
  (acc[p.group] ||= []).push(p);
  return acc;
}, { customers: [], money: [], growth: [], people: [] });

function CheckboxGridMock({ checked }: { checked: string[] }) {
  const set = new Set(checked);
  return (
    <div className="rounded-2xl border border-[#d9cdb8] bg-white p-5 shadow-sm space-y-5">
      <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500 font-semibold">
        Add a staff admin — what you see on /admin/admins
      </div>
      {(Object.keys(PERMS_BY_GROUP) as PermissionGroup[]).map((group) => (
        <div key={group}>
          <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500 font-semibold mb-2">
            {GROUP_LABELS[group]}
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {PERMS_BY_GROUP[group].map((p) => {
              const on = set.has(p.key);
              return (
                <div
                  key={p.key}
                  className={`flex items-start gap-2 px-3 py-2 rounded-lg border ${
                    on
                      ? "border-[#5b7351] bg-[#f4f7ee]/70"
                      : "border-stone-200 bg-white"
                  }`}
                >
                  <span
                    className={`mt-1 w-4 h-4 rounded-sm border flex items-center justify-center text-[10px] ${
                      on ? "border-[#5b7351] bg-[#5b7351] text-white" : "border-stone-300 bg-white"
                    }`}
                    aria-hidden
                  >
                    {on ? "✓" : ""}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="text-sm text-stone-800 block font-medium">{p.label}</span>
                    <span className="text-[10px] italic text-stone-500 block leading-snug">{p.hint}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminPreviewPage() {
  return (
    <main className="min-h-screen bg-[#f5efe6] text-[#1a1816] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link href="/os.html" className="text-[11px] tracking-[0.18em] uppercase text-[#856a3f] hover:text-[#1a1816]">
            ← Back to app
          </Link>
          <Link href="/admin" className="text-[11px] tracking-[0.18em] uppercase text-[#856a3f] hover:text-[#1a1816]">
            Your real admin →
          </Link>
        </div>

        <h1
          className="font-serif text-5xl mt-8 mb-3 leading-tight"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Per-admin permissions
        </h1>
        <p
          className="font-serif text-lg italic text-[#856a3f] mb-10"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          You decide exactly which sections each staff admin can see. Three
          example configurations below — and the actual checkbox picker
          you&apos;ll see on /admin/admins underneath.
        </p>

        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          {EXAMPLES.map((ex) => (
            <div key={ex.name} className="space-y-2">
              <div className="text-[10px] tracking-[0.18em] uppercase text-[#5b7351] font-semibold">
                {ex.name}
              </div>
              <MockAdmin role={ex.role} perms={ex.perms} email={ex.email} />
              <p className="text-xs italic text-stone-600 leading-relaxed pt-1">{ex.blurb}</p>
            </div>
          ))}
        </div>

        <div className="mb-12">
          <CheckboxGridMock checked={EXAMPLES[1].perms} />
          <p className="text-[11px] italic text-stone-500 text-center mt-3">
            (This is the actual control you&apos;ll see when you click into a staff admin&apos;s row.
            What you check is exactly what they see.)
          </p>
        </div>

        <section className="rounded-2xl border border-[#d9cdb8] bg-white p-7 sm:p-9 shadow-sm">
          <h3
            className="font-serif text-2xl mb-3"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            How it works in practice
          </h3>
          <ol className="space-y-2 text-sm text-[#2c2926] leading-relaxed list-decimal pl-5">
            <li>
              Open <code>/admin/admins</code> on your real admin.
            </li>
            <li>
              Pick &ldquo;Add a staff admin&rdquo; → enter their email → check exactly the
              boxes you want them to see → save.
            </li>
            <li>
              They sign in. Their tab row, their stat tiles, and their pages will all be
              gated to what you checked. The server enforces this even if they try to
              type a URL directly.
            </li>
            <li>
              Need to change someone&apos;s access later? Their row on the admins page
              has the same checkbox grid &mdash; tick / untick → save permissions.
              They&apos;ll see the change on their next page load.
            </li>
          </ol>
        </section>
      </div>
    </main>
  );
}
