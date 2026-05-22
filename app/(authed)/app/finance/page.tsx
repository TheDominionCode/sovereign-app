import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import type {
  PfCreditScoreRow,
  PfExpenseRow,
  PfIncomeRow,
  PfInvestmentRow,
  PfSavingsGoalRow,
  UserPreferencesRow,
} from "@/lib/dashboard/types";
import { FREQ_TO_MONTHLY, fmtDate, money, num, todayISO } from "@/lib/dashboard/format";
import { PageHeader, Panel, Tabs, EmptyState, ProgressBar, TrashIcon, PlusIcon } from "../_components/ui";
import { BUREAUS, EXPENSE_CATEGORIES, FINANCE_TABS, FREQUENCIES, INVESTMENT_TYPES } from "./constants";
import {
  addBill,
  addCreditScore,
  addExpense,
  addIncome,
  addInvestment,
  addSavingsGoal,
  deleteExpense,
  deleteIncome,
  deleteInvestment,
  deleteSavingsGoal,
  updateSaved,
} from "./actions";

type SearchParams = Promise<{ tab?: string }>;

type Flowable = { entry_type: string; frequency: string; amount: number; entry_date: string };
function monthlyOf(it: Flowable, ym: string): number {
  if (it.entry_type === "one-time") return it.entry_date.startsWith(ym) ? num(it.amount) : 0;
  return num(it.amount) * (FREQ_TO_MONTHLY[it.frequency] ?? 1);
}

const input = "px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white";

export default async function FinancePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireActiveSubscription();
  const { tab = "income" } = await searchParams;
  const ym = todayISO().slice(0, 7);

  const supabase = await createClient();
  const [incRes, expRes, savRes, invRes, credRes, prefRes] = await Promise.all([
    supabase.from("pf_income").select("*").order("entry_date", { ascending: false }),
    supabase.from("pf_expenses").select("*").order("entry_date", { ascending: false }),
    supabase.from("pf_savings_goals").select("*").order("created_at", { ascending: false }),
    supabase.from("pf_investments").select("*").order("created_at", { ascending: false }),
    supabase.from("pf_credit_scores").select("*").order("recorded_on", { ascending: false }),
    supabase.from("user_preferences").select("currency").maybeSingle(),
  ]);
  const income = (incRes.data as PfIncomeRow[] | null) ?? [];
  const expenses = (expRes.data as PfExpenseRow[] | null) ?? [];
  const savings = (savRes.data as PfSavingsGoalRow[] | null) ?? [];
  const investments = (invRes.data as PfInvestmentRow[] | null) ?? [];
  const credit = (credRes.data as PfCreditScoreRow[] | null) ?? [];
  const cur = (prefRes.data as Pick<UserPreferencesRow, "currency"> | null)?.currency ?? "$";

  const oneTime = expenses.filter((e) => e.entry_type === "one-time");
  const bills = expenses.filter((e) => e.entry_type === "recurring");
  const monthlyIncome = income.reduce((s, i) => s + monthlyOf(i, ym), 0);
  const monthlyExpenses = expenses.reduce((s, e) => s + monthlyOf(e, ym), 0);
  const totalSaved = savings.reduce((s, g) => s + num(g.saved_amount), 0);
  const totalInvested = investments.reduce((s, x) => s + num(x.amount), 0);

  const statCards = [
    { label: "MONTHLY INCOME", val: monthlyIncome },
    { label: "MONTHLY EXPENSES", val: monthlyExpenses },
    { label: "MONTHLY NET", val: monthlyIncome - monthlyExpenses },
    { label: "TOTAL SAVED", val: totalSaved },
    { label: "INVESTMENTS", val: totalInvested },
  ];

  const tabs = FINANCE_TABS.map((t) => ({
    label: t.label,
    href: `/app/finance?tab=${t.id}`,
  }));

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <PageHeader title="Personal Finance" subtitle="Income, expenses, savings, investments, credit — saved privately to your account." />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {statCards.map((c) => (
          <div key={c.label} className="rounded-lg p-4 text-center bg-forest text-cream">
            <div className="text-[10px] tracking-[0.18em]">{c.label}</div>
            <div className="font-display text-xl mt-1">{money(c.val, cur)}</div>
          </div>
        ))}
      </div>

      <Tabs items={tabs} active={tab} />

      {tab === "income" && (
        <Panel>
          <form action={addIncome} className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr_auto] gap-2 mb-4">
            <input name="source" required placeholder="Source (Job, side gig…)" className={input} />
            <input name="amount" type="number" step="0.01" placeholder="Amount" className={input} />
            <select name="frequency" defaultValue="monthly" className={input}>
              {[...FREQUENCIES, "one-time"].map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <button type="submit" className="px-4 py-2 bg-forest text-white rounded flex items-center justify-center"><PlusIcon className="w-4 h-4" /></button>
          </form>
          {income.length === 0 ? <EmptyState>No income sources yet.</EmptyState> : (
            <ul className="space-y-2">
              {income.map((i) => (
                <li key={i.id} className="flex items-center gap-3 p-3 rounded border border-stone-200 group">
                  <span className="flex-1 text-sm text-ink">{i.source}</span>
                  <span className="text-xs text-stone-light">{i.entry_type === "recurring" ? i.frequency : fmtDate(i.entry_date)}</span>
                  <span className="font-mono text-forest text-sm">{money(i.amount, cur)}</span>
                  <DeleteForm id={i.id} action={deleteIncome} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {tab === "expenses" && (
        <Panel>
          <form action={addExpense} className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr_auto] gap-2 mb-4">
            <input name="name" required placeholder="Name (Restaurant, Gas…)" className={input} />
            <input name="amount" type="number" step="0.01" placeholder="Amount" className={input} />
            <select name="category" defaultValue="Other" className={input}>
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button type="submit" className="px-4 py-2 bg-forest text-white rounded flex items-center justify-center"><PlusIcon className="w-4 h-4" /></button>
          </form>
          {oneTime.length === 0 ? <EmptyState>No expenses yet.</EmptyState> : (
            <ul className="space-y-2">
              {oneTime.map((e) => (
                <li key={e.id} className="flex items-center gap-3 p-3 rounded border border-stone-200 group">
                  <span className="flex-1 text-sm text-ink">{e.name}</span>
                  <span className="text-xs text-stone-light italic">{e.category}</span>
                  <span className="text-xs text-stone-light font-mono">{fmtDate(e.entry_date)}</span>
                  <span className="font-mono text-rose text-sm">{money(e.amount, cur)}</span>
                  <DeleteForm id={e.id} action={deleteExpense} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {tab === "bills" && (
        <Panel>
          <form action={addBill} className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr_auto] gap-2 mb-4">
            <input name="name" required placeholder="Bill (Rent, Spotify…)" className={input} />
            <input name="amount" type="number" step="0.01" placeholder="Amount" className={input} />
            <select name="frequency" defaultValue="monthly" className={input}>
              {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <button type="submit" className="px-4 py-2 bg-forest text-white rounded flex items-center justify-center"><PlusIcon className="w-4 h-4" /></button>
          </form>
          {bills.length === 0 ? <EmptyState>No bills yet.</EmptyState> : (
            <ul className="space-y-2">
              {bills.map((e) => (
                <li key={e.id} className="flex items-center gap-3 p-3 rounded border border-stone-200 group">
                  <span className="flex-1 text-sm text-ink">{e.name}</span>
                  <span className="text-xs text-stone-light">{e.frequency}</span>
                  <span className="font-mono text-rose text-sm">{money(e.amount, cur)}</span>
                  <span className="text-[10px] text-stone-light">≈ {money(num(e.amount) * (FREQ_TO_MONTHLY[e.frequency] ?? 1), cur)}/mo</span>
                  <DeleteForm id={e.id} action={deleteExpense} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {tab === "goals" && (
        <Panel>
          <form action={addSavingsGoal} className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr_auto] gap-2 mb-4">
            <input name="name" required placeholder="Goal (Emergency fund…)" className={input} />
            <input name="target" type="number" step="0.01" placeholder="Target" className={input} />
            <input name="saved" type="number" step="0.01" placeholder="Saved" className={input} />
            <button type="submit" className="px-4 py-2 bg-forest text-white rounded flex items-center justify-center"><PlusIcon className="w-4 h-4" /></button>
          </form>
          {savings.length === 0 ? <EmptyState>No savings goals yet.</EmptyState> : (
            <div className="space-y-3">
              {savings.map((g) => {
                const pct = num(g.target_amount) > 0 ? Math.min(100, Math.round((num(g.saved_amount) / num(g.target_amount)) * 100)) : 0;
                return (
                  <div key={g.id} className="p-4 rounded-lg border border-stone-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-display text-lg text-ink">{g.name}</span>
                      <span className="text-xs font-mono text-forest">{money(g.saved_amount, cur)} / {money(g.target_amount, cur)} · {pct}%</span>
                    </div>
                    <ProgressBar value={pct} />
                    <div className="flex items-center gap-2 mt-3">
                      <form action={updateSaved} className="flex items-center gap-2 flex-1">
                        <input type="hidden" name="id" value={g.id} />
                        <input name="saved" type="number" step="0.01" defaultValue={num(g.saved_amount)} className={`flex-1 ${input}`} />
                        <button type="submit" className="px-3 py-2 text-xs border border-stone-200 rounded hover:border-sage text-stone">Update</button>
                      </form>
                      <DeleteForm id={g.id} action={deleteSavingsGoal} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      )}

      {tab === "investments" && (
        <Panel>
          <div className="rounded-lg p-4 text-center bg-forest text-cream mb-4 max-w-xs">
            <div className="text-[10px] tracking-[0.18em]">TOTAL PORTFOLIO</div>
            <div className="font-display text-2xl mt-1">{money(totalInvested, cur)}</div>
          </div>
          <form action={addInvestment} className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr_auto] gap-2 mb-4">
            <input name="name" required placeholder="Holding (VTSAX, BTC…)" className={input} />
            <input name="amount" type="number" step="0.01" placeholder="Current value" className={input} />
            <select name="kind" defaultValue="Stocks" className={input}>
              {INVESTMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button type="submit" className="px-4 py-2 bg-forest text-white rounded flex items-center justify-center"><PlusIcon className="w-4 h-4" /></button>
          </form>
          {investments.length === 0 ? <EmptyState>No investments yet.</EmptyState> : (
            <ul className="space-y-2">
              {investments.map((x) => (
                <li key={x.id} className="flex items-center gap-3 p-3 rounded border border-stone-200 group">
                  <span className="text-[10px] tracking-wider px-2 py-0.5 rounded bg-cream-bg text-forest">{x.kind}</span>
                  <span className="flex-1 text-sm text-ink">{x.name}</span>
                  <span className="font-mono text-forest text-sm">{money(x.amount, cur)}</span>
                  <DeleteForm id={x.id} action={deleteInvestment} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {tab === "credit" && (
        <div className="grid md:grid-cols-3 gap-3">
          {BUREAUS.map((b) => {
            const history = credit.filter((c) => c.bureau === b.id);
            const latest = history[0];
            return (
              <Panel key={b.id} title={b.name}>
                <div className="font-display text-4xl text-forest mb-2">{latest ? latest.score : "—"}</div>
                {latest && <div className="text-[10px] text-stone-light mb-3">as of {fmtDate(latest.recorded_on)}</div>}
                <form action={addCreditScore} className="flex gap-2 mb-3">
                  <input type="hidden" name="bureau" value={b.id} />
                  <input name="score" type="number" min={300} max={850} placeholder="New score" className={`flex-1 ${input}`} />
                  <button type="submit" className="px-3 py-2 bg-forest text-white text-xs rounded hover:bg-forest-deep">Log</button>
                </form>
                {history.length > 0 && (
                  <div className="space-y-1">
                    {history.slice(0, 5).map((h) => (
                      <div key={h.id} className="flex items-center justify-between text-xs">
                        <span className="text-stone-light font-mono">{fmtDate(h.recorded_on)}</span>
                        <span className="font-display text-forest">{h.score}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DeleteForm({
  id,
  action,
}: {
  id: string;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label="Delete"
        className="opacity-0 group-hover:opacity-100 p-1 text-stone-light hover:text-rose transition"
      >
        <TrashIcon className="w-3.5 h-3.5" />
      </button>
    </form>
  );
}
