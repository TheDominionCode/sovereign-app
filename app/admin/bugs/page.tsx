import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "../guard";
import { updateBugStatusAction, updateBugNotesAction, deleteBugAction } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type BugReport = {
  id: number;
  user_email: string | null;
  description: string;
  page: string | null;
  status: "open" | "in_progress" | "resolved";
  admin_notes: string | null;
  created_at: string;
};

const STATUS_STYLES: Record<string, string> = {
  open:        "bg-rose-50 text-rose-700 border border-rose-200",
  in_progress: "bg-amber-50 text-amber-700 border border-amber-200",
  resolved:    "bg-[#f4f7ee] text-[#5b7351] border border-[#d3e0c5]",
};

const STATUS_LABELS: Record<string, string> = {
  open:        "Open",
  in_progress: "In Progress",
  resolved:    "Resolved",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export default async function AdminBugsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; saved?: string }>;
}) {
  await requirePermission("bugs");
  const { status: filterStatus, saved } = await searchParams;

  const admin = createAdminClient();
  let query = admin
    .from("bug_reports")
    .select("id,user_email,description,page,status,admin_notes,created_at")
    .order("created_at", { ascending: false });

  if (filterStatus && filterStatus !== "all") {
    query = query.eq("status", filterStatus);
  }

  const { data: reports } = await query.limit(200);
  const rows = (reports ?? []) as BugReport[];

  const counts = { open: 0, in_progress: 0, resolved: 0 };
  rows.forEach(r => { if (r.status in counts) counts[r.status as keyof typeof counts]++; });

  return (
    <div className="max-w-5xl">
      <div className="flex items-baseline justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-xl font-semibold text-stone-800">Bug Reports</h1>
          <p className="text-sm text-stone-500 mt-0.5">Submitted by subscribers from inside the app.</p>
        </div>
        <div className="flex gap-3 flex-wrap text-sm">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-medium">
            {counts.open} open
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
            {counts.in_progress} in progress
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4f7ee] text-[#5b7351] border border-[#d3e0c5] font-medium">
            {counts.resolved} resolved
          </span>
        </div>
      </div>

      {saved && (
        <div className="mb-4 px-4 py-2 bg-[#f4f7ee] border border-[#d3e0c5] rounded text-sm text-[#5b7351]">
          Saved.
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[["all", "All"], ["open", "Open"], ["in_progress", "In Progress"], ["resolved", "Resolved"]].map(([val, label]) => (
          <a key={val} href={`/admin/bugs${val === "all" ? "" : `?status=${val}`}`}
            className={`px-3 py-1.5 text-xs rounded border font-medium transition ${
              (filterStatus ?? "all") === val
                ? "bg-stone-800 text-white border-stone-800"
                : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
            }`}>
            {label}
          </a>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="p-16 text-center text-stone-400 text-sm border border-stone-100 rounded-lg">
          No bug reports{filterStatus && filterStatus !== "all" ? ` with status "${filterStatus}"` : ""} yet.
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map(r => (
            <div key={r.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              {/* Header row */}
              <div className="flex items-start gap-3 px-5 py-4 border-b border-stone-100">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[r.status]}`}>
                      {STATUS_LABELS[r.status] ?? r.status}
                    </span>
                    {r.page && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-mono">
                        {r.page}
                      </span>
                    )}
                    <span className="text-[11px] text-stone-400">{fmt(r.created_at)}</span>
                  </div>
                  <div className="text-xs text-stone-500">{r.user_email ?? "—"}</div>
                </div>
                {/* Delete */}
                <form action={deleteBugAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <button type="submit"
                    className="text-[11px] text-stone-400 hover:text-rose-500 transition px-2 py-1 rounded hover:bg-rose-50"
                    onClick={() => { /* no-confirm; server action handles */ }}>
                    Delete
                  </button>
                </form>
              </div>

              {/* Description */}
              <div className="px-5 py-4">
                <p className="text-sm text-stone-800 whitespace-pre-wrap leading-relaxed">{r.description}</p>
              </div>

              {/* Admin actions */}
              <div className="px-5 pb-5 space-y-3">
                {/* Status buttons */}
                <div className="flex gap-2 flex-wrap">
                  {(["open", "in_progress", "resolved"] as const).map(s => (
                    <form key={s} action={updateBugStatusAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value={s} />
                      <button type="submit"
                        className={`px-3 py-1.5 text-xs rounded border font-medium transition ${
                          r.status === s
                            ? STATUS_STYLES[s] + " font-semibold"
                            : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
                        }`}>
                        {STATUS_LABELS[s]}
                      </button>
                    </form>
                  ))}
                </div>

                {/* Admin notes */}
                <form action={updateBugNotesAction} className="flex gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <input
                    type="text"
                    name="admin_notes"
                    defaultValue={r.admin_notes ?? ""}
                    placeholder="Add a note (fix description, PR link, workaround…)"
                    className="flex-1 px-3 py-1.5 text-xs border border-stone-200 rounded focus:border-[#7a9a6e] focus:outline-none"
                  />
                  <button type="submit"
                    className="px-3 py-1.5 text-xs bg-[#7a9a6e] text-white rounded hover:bg-[#5b7351] font-medium">
                    Save note
                  </button>
                </form>
                {r.admin_notes && (
                  <p className="text-xs text-stone-500 italic">Note: {r.admin_notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
