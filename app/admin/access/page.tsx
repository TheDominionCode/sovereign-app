import { getCustomerRows, fmtDate, daysFromNow } from "../_data";
import { grantAccessUntilAction, revokeAccessAction } from "../actions";
import { requirePermission } from "../guard";

// Force a fresh DB read on every render — never serve a cached customer list
// to the admin, since they expect to see the result of their click immediately.
export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Promise<{ granted?: string; revoked?: string; error?: string }>;

// "Until Friday" preset: returns the upcoming Friday as a YYYY-MM-DD string.
// If today is Friday, returns next Friday (one week out), because by the time
// the user is granting access, "until Friday" almost always means the next
// one, not the one expiring tonight.
function nextFridayDate(): string {
  const d = new Date();
  const day = d.getUTCDay(); // 0=Sun .. 5=Fri .. 6=Sat
  const add = day === 5 ? 7 : (5 - day + 7) % 7 || 7;
  d.setUTCDate(d.getUTCDate() + add);
  return d.toISOString().slice(0, 10);
}

function statusLabel(r: { status: string; betaUntil: string | null }): {
  text: string;
  cls: string;
} {
  const betaActive =
    r.betaUntil && new Date(r.betaUntil).getTime() > Date.now();
  if (betaActive) return { text: "Free access", cls: "bg-sage-pale/60 text-forest-deep" };
  if (r.status === "active") return { text: "Active (paid)", cls: "bg-emerald-50 text-emerald-700" };
  if (r.status === "trialing") return { text: "Stripe trial", cls: "bg-amber-50 text-amber-700" };
  if (r.status === "canceled") return { text: "Canceled", cls: "bg-stone-100 text-stone-500" };
  return { text: "No access", cls: "bg-rose-50 text-rose-700" };
}

export default async function AdminAccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePermission("access");
  const { granted, revoked, error } = await searchParams;
  const rows = await getCustomerRows();
  const friday = nextFridayDate();
  const fridayLabel = new Date(`${friday}T12:00:00Z`).toLocaleDateString(
    undefined,
    { weekday: "long", month: "short", day: "numeric" }
  );

  return (
    <div>
      <div className="mb-6 rounded-xl border border-sage-pale bg-cream-bg/60 px-5 py-4">
        <h2 className="font-display text-xl text-forest-deep mb-1">
          Grant free access (no card needed)
        </h2>
        <p className="text-sm text-stone leading-relaxed">
          Use this to let a tester into the app without going through Stripe.
          The default preset extends access until end-of-day <span className="font-medium text-forest">{fridayLabel}</span>.
          You can also type a custom date per user.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-rose/40 bg-rose/10 px-4 py-2.5 text-sm text-rose">
          Couldn&apos;t update: {error}
        </div>
      )}
      {granted && (
        <div className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          ✓ Access granted until {fmtDate(granted)}.
        </div>
      )}
      {revoked && (
        <div className="mb-4 rounded-md border border-stone-300 bg-stone-50 px-4 py-2.5 text-sm text-stone-600">
          Access revoked.
        </div>
      )}

      <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50">
              <tr className="text-left text-[10px] tracking-[0.18em] uppercase text-stone-500">
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Current status</th>
                <th className="px-4 py-2 font-medium">Free access until</th>
                <th className="px-4 py-2 font-medium">Quick grant</th>
                <th className="px-4 py-2 font-medium">Custom date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const s = statusLabel(r);
                const betaDays = daysFromNow(r.betaUntil);
                const betaActive = betaDays != null && betaDays >= 0;
                return (
                  <tr
                    key={r.id}
                    className="border-t border-stone-100 hover:bg-stone-50/60 align-middle"
                  >
                    <td className="px-4 py-2.5 text-stone-800 whitespace-nowrap">
                      <a
                        href={`mailto:${r.email}`}
                        className="hover:text-forest hover:underline"
                      >
                        {r.email}
                      </a>
                    </td>
                    <td className="px-4 py-2.5 text-stone-700 whitespace-nowrap">
                      {r.name || <span className="italic text-stone-400">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium tracking-wider uppercase ${s.cls}`}
                      >
                        {s.text}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-stone-700 whitespace-nowrap">
                      {r.betaUntil ? (
                        <>
                          {fmtDate(r.betaUntil)}
                          {betaDays != null && (
                            <span
                              className={`ml-2 text-[11px] italic ${
                                betaDays < 0
                                  ? "text-stone-400"
                                  : betaDays <= 1
                                  ? "text-rose-600"
                                  : "text-stone-500"
                              }`}
                            >
                              {betaDays < 0
                                ? "expired"
                                : betaDays === 0
                                ? "today"
                                : betaDays === 1
                                ? "tomorrow"
                                : `in ${betaDays}d`}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="italic text-stone-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <form action={grantAccessUntilAction} className="inline">
                        <input type="hidden" name="user_id" value={r.id} />
                        <input type="hidden" name="until" value={friday} />
                        <button
                          type="submit"
                          className="px-2.5 py-1 rounded-md bg-forest text-white text-xs font-medium hover:bg-forest-deep transition-colors"
                        >
                          Until {fridayLabel.split(",")[0]}
                        </button>
                      </form>
                      {betaActive && (
                        <form action={revokeAccessAction} className="inline ml-2">
                          <input type="hidden" name="user_id" value={r.id} />
                          <button
                            type="submit"
                            className="px-2.5 py-1 rounded-md border border-stone-300 text-stone-600 text-xs font-medium hover:bg-stone-50 hover:text-rose-700 hover:border-rose-300 transition-colors"
                          >
                            Revoke
                          </button>
                        </form>
                      )}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <form
                        action={grantAccessUntilAction}
                        className="inline-flex items-center gap-1.5"
                      >
                        <input type="hidden" name="user_id" value={r.id} />
                        <input
                          type="date"
                          name="until"
                          required
                          min={new Date().toISOString().slice(0, 10)}
                          className="rounded-md border border-stone-300 px-2 py-1 text-xs"
                        />
                        <button
                          type="submit"
                          className="px-2.5 py-1 rounded-md bg-sage-pale text-forest-deep text-xs font-medium hover:bg-sage-pale/80 transition-colors"
                        >
                          Grant
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-xs text-stone-light italic">
        Free access is independent of Stripe. The user can later add a card
        at <span className="font-medium text-stone">/pricing</span> to convert
        to a paid plan; their free access stays valid in the meantime.
      </p>
    </div>
  );
}
