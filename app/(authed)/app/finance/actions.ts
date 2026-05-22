"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { todayISO } from "@/lib/dashboard/format";

const amt = (v: FormDataEntryValue | null) => Math.max(0, parseFloat(String(v ?? "")) || 0);

function refresh() {
  revalidatePath("/app/finance");
  revalidatePath("/app");
}

export async function addIncome(formData: FormData) {
  const user = await requireActiveSubscription();
  const source = String(formData.get("source") ?? "").trim();
  if (!source) return;
  const frequency = String(formData.get("frequency") ?? "monthly");
  const supabase = await createClient();
  await supabase.from("pf_income").insert({
    user_id: user.id,
    source,
    amount: amt(formData.get("amount")),
    entry_type: frequency === "one-time" ? "one-time" : "recurring",
    frequency: frequency === "one-time" ? "monthly" : frequency,
    entry_date: todayISO(),
  });
  refresh();
}

export async function addExpense(formData: FormData) {
  const user = await requireActiveSubscription();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const supabase = await createClient();
  await supabase.from("pf_expenses").insert({
    user_id: user.id,
    name,
    amount: amt(formData.get("amount")),
    category: String(formData.get("category") ?? "Other").trim() || "Other",
    entry_type: "one-time",
    frequency: "monthly",
    entry_date: todayISO(),
  });
  refresh();
}

export async function addBill(formData: FormData) {
  const user = await requireActiveSubscription();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const supabase = await createClient();
  await supabase.from("pf_expenses").insert({
    user_id: user.id,
    name,
    amount: amt(formData.get("amount")),
    category: "Bills",
    entry_type: "recurring",
    frequency: String(formData.get("frequency") ?? "monthly"),
    entry_date: todayISO(),
  });
  refresh();
}

export async function deleteExpense(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("pf_expenses").delete().eq("id", id);
  refresh();
}

export async function deleteIncome(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("pf_income").delete().eq("id", id);
  refresh();
}

export async function addSavingsGoal(formData: FormData) {
  const user = await requireActiveSubscription();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const supabase = await createClient();
  await supabase.from("pf_savings_goals").insert({
    user_id: user.id,
    name,
    target_amount: amt(formData.get("target")),
    saved_amount: amt(formData.get("saved")),
  });
  refresh();
}

export async function updateSaved(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("pf_savings_goals").update({ saved_amount: amt(formData.get("saved")) }).eq("id", id);
  refresh();
}

export async function deleteSavingsGoal(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("pf_savings_goals").delete().eq("id", id);
  refresh();
}

export async function addInvestment(formData: FormData) {
  const user = await requireActiveSubscription();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const supabase = await createClient();
  await supabase.from("pf_investments").insert({
    user_id: user.id,
    name,
    amount: amt(formData.get("amount")),
    kind: String(formData.get("kind") ?? "Stocks").trim() || "Stocks",
    entry_date: todayISO(),
  });
  refresh();
}

export async function deleteInvestment(formData: FormData) {
  await requireActiveSubscription();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("pf_investments").delete().eq("id", id);
  refresh();
}

export async function addCreditScore(formData: FormData) {
  const user = await requireActiveSubscription();
  const bureau = String(formData.get("bureau") ?? "");
  const score = parseInt(String(formData.get("score") ?? ""), 10);
  if (!bureau || !score || score < 300 || score > 850) return;
  const supabase = await createClient();
  await supabase.from("pf_credit_scores").insert({
    user_id: user.id,
    bureau,
    score,
    recorded_on: todayISO(),
  });
  refresh();
}
