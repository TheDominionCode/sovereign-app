import { getAllApplications } from "@/lib/affiliate/data";
import { decideApplicationAction } from "./actions";
import { requirePermission } from "../guard";

export const dynamic = "force-dynamic";

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

const STATUS_STYLES: Record<string, string> = {
  pending:  "bg-amber-50 text-amber-800 border-amber-200",
  approved: "bg-emerald-50 text-emerald-800 border-emerald-200",
  rejected: "bg-stone-100 text-stone-600 border-stone-200",
};

export default async function AdminAffiliatesPage() {
  await requirePermission("affiliates");
  const apps = await getAllApplications();
  const pending = apps.filter((a) => a.status === "pending");
  const decided = apps.filter((a) => a.status !== "pending");

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-xl text-forest-deep">Pending applications</h2>
          <div className="text-xs italic text-stone">{pending.length} waiting</div>
        </div>
        {pending.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white p-6 text-sm italic text-stone-500">
            No applications waiting on you.
          </div>
        ) : (
          <ul className="space-y-3">
            {pending.map((a) => (
              <li key={a.id} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
                  <div className="text-sm font-semibold text-stone-800">{a.email}</div>
                  <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500">
                    applied {fmt(a.applied_at)}
                  </div>
                </div>
                {a.message ? (
                  <p className="text-sm text-stone-700 whitespace-pre-wrap mb-4 break-words">{a.message}</p>
                ) : (
                  <p className="text-sm italic text-stone-400 mb-4">No note attached.</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <form action={decideApplicationAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="decision" value="approved" />
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white transition-colors"
                      style={{ backgroundColor: "#5b7351" }}
                    >
                      Approve
                    </button>
                  </form>
                  <form action={decideApplicationAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="decision" value="rejected" />
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
                      style={{ backgroundColor: "#fafaf9", color: "#7c2d2d", border: "1px solid #fecaca" }}
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-xl text-forest-deep">Decided</h2>
          <div className="text-xs italic text-stone">{decided.length} total</div>
        </div>
        {decided.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white p-6 text-sm italic text-stone-500">
            Nothing yet.
          </div>
        ) : (
          <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-[10px] tracking-[0.18em] uppercase text-stone-500">
                <tr>
                  <th className="text-left px-4 py-2.5">Email</th>
                  <th className="text-left px-4 py-2.5">Status</th>
                  <th className="text-left px-4 py-2.5">Decided</th>
                  <th className="text-left px-4 py-2.5">By</th>
                  <th className="text-right px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {decided.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-2.5 text-stone-800">{a.email}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] tracking-wider uppercase font-semibold border ${
                          STATUS_STYLES[a.status] ?? STATUS_STYLES.rejected
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-stone-600 text-xs">{fmt(a.decided_at)}</td>
                    <td className="px-4 py-2.5 text-stone-600 text-xs">{a.decided_by ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right">
                      <form action={decideApplicationAction} className="inline-flex gap-1">
                        <input type="hidden" name="id" value={a.id} />
                        <input
                          type="hidden"
                          name="decision"
                          value={a.status === "approved" ? "rejected" : "approved"}
                        />
                        <button
                          type="submit"
                          className="text-[10px] uppercase tracking-wider text-stone-500 hover:text-forest-deep"
                        >
                          flip
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
