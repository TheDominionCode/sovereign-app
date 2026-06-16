import type { CustomerRow } from "../_data";
import { fmtDate, daysFromNow } from "../_data";

function statusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    trialing:           { bg: "bg-amber-50",   text: "text-amber-700",   label: "Trial" },
    active:             { bg: "bg-emerald-50", text: "text-emerald-700", label: "Active" },
    past_due:           { bg: "bg-rose-50",    text: "text-rose-700",    label: "Past due" },
    canceled:           { bg: "bg-stone-100",  text: "text-stone-500",   label: "Canceled" },
    incomplete:         { bg: "bg-stone-100",  text: "text-stone-500",   label: "Incomplete" },
    incomplete_expired: { bg: "bg-stone-100",  text: "text-stone-500",   label: "Expired" },
    unpaid:             { bg: "bg-rose-50",    text: "text-rose-700",    label: "Unpaid" },
    paused:             { bg: "bg-stone-100",  text: "text-stone-500",   label: "Paused" },
  };
  const m = map[status] ?? { bg: "bg-stone-100", text: "text-stone-500", label: status || "—" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium tracking-wider uppercase ${m.bg} ${m.text}`}>
      {m.label}
    </span>
  );
}

// Rich "Last active" cell — shows the actual date PLUS a green badge if
// they've been around in the last 24h, an amber badge if 1-7 days ago,
// and a rose badge if ≥ 8 days. Null = never been active since the
// last_active_at column was added (will populate on their next visit).
function lastActiveCell(iso: string | null | undefined) {
  if (!iso) {
    return <span className="italic text-stone-400">never</span>;
  }
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  let label: string;
  let tone: { bg: string; text: string };
  if (hours < 1) {
    label = "just now";
    tone = { bg: "bg-emerald-50", text: "text-emerald-700" };
  } else if (hours < 24) {
    label = `${hours}h ago`;
    tone = { bg: "bg-emerald-50", text: "text-emerald-700" };
  } else if (days < 7) {
    label = `${days}d ago`;
    tone = { bg: "bg-amber-50", text: "text-amber-700" };
  } else {
    label = `${days}d ago`;
    tone = { bg: "bg-rose-50", text: "text-rose-700" };
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${tone.bg} ${tone.text}`}>
      {label}
    </span>
  );
}

type Variant = "default" | "active" | "trial" | "canceled";

export default function CustomerTable({
  rows,
  variant = "default",
  emptyMessage = "Nothing here yet.",
}: {
  rows: CustomerRow[];
  variant?: Variant;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-12 text-center italic text-stone">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50">
            <tr className="text-left text-[10px] tracking-[0.18em] uppercase text-stone-500">
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Phone</th>
              <th className="px-4 py-2 font-medium">Plan</th>
              {variant === "default" && <th className="px-4 py-2 font-medium">Status</th>}
              {variant === "trial" && <th className="px-4 py-2 font-medium">Trial ends</th>}
              {variant === "active" && <th className="px-4 py-2 font-medium">Renews</th>}
              {variant === "canceled" && <th className="px-4 py-2 font-medium">Canceled on</th>}
              {variant === "default" && (
                <>
                  <th className="px-4 py-2 font-medium">Trial ends</th>
                  <th className="px-4 py-2 font-medium">Renews / Ends</th>
                </>
              )}
              <th className="px-4 py-2 font-medium">Signed up</th>
              <th className="px-4 py-2 font-medium">Last active</th>
              <th className="px-4 py-2 font-medium">Last sign-in</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const trialDays = daysFromNow(r.trialEnd);
              return (
                <tr key={r.id} className="border-t border-stone-100 hover:bg-stone-50/60">
                  <td className="px-4 py-2.5 text-stone-800 whitespace-nowrap">
                    <a href={`mailto:${r.email}`} className="hover:text-forest hover:underline">{r.email}</a>
                  </td>
                  <td className="px-4 py-2.5 text-stone-700 whitespace-nowrap">{r.name || <span className="italic text-stone-400">—</span>}</td>
                  <td className="px-4 py-2.5 text-stone-700 whitespace-nowrap">
                    {r.phone
                      ? <a href={`tel:${r.phone.replace(/[^+\d]/g, "")}`} className="hover:text-forest hover:underline">{r.phone}</a>
                      : <span className="italic text-stone-400">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-stone-700 whitespace-nowrap">{r.plan?.label ?? <span className="italic text-stone-400">—</span>}</td>
                  {variant === "default" && <td className="px-4 py-2.5">{statusBadge(r.status)}</td>}
                  {variant === "trial" && (
                    <td className="px-4 py-2.5 text-stone-700 whitespace-nowrap">
                      {fmtDate(r.trialEnd)}
                      {trialDays != null && (
                        <span className={`ml-2 text-[11px] italic ${trialDays <= 1 ? "text-rose-600" : trialDays <= 3 ? "text-amber-700" : "text-stone-500"}`}>
                          {trialDays === 0 ? "today" : trialDays === 1 ? "tomorrow" : trialDays < 0 ? `${-trialDays}d overdue` : `in ${trialDays}d`}
                        </span>
                      )}
                    </td>
                  )}
                  {variant === "active" && (
                    <td className="px-4 py-2.5 text-stone-700 whitespace-nowrap">
                      {fmtDate(r.periodEnd)}
                      {r.cancelAtPeriodEnd && <span className="ml-2 text-[10px] italic text-rose-600">cancels here</span>}
                    </td>
                  )}
                  {variant === "canceled" && (
                    <td className="px-4 py-2.5 text-stone-700 whitespace-nowrap">{fmtDate(r.canceledAt || r.periodEnd)}</td>
                  )}
                  {variant === "default" && (
                    <>
                      <td className="px-4 py-2.5 text-stone-600 whitespace-nowrap">{fmtDate(r.trialEnd)}</td>
                      <td className="px-4 py-2.5 text-stone-600 whitespace-nowrap">{fmtDate(r.periodEnd)}</td>
                    </>
                  )}
                  <td className="px-4 py-2.5 text-stone-600 whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{lastActiveCell(r.lastActive)}</td>
                  <td className="px-4 py-2.5 text-stone-600 whitespace-nowrap">{fmtDate(r.lastSignIn)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
