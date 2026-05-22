import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import type { CredentialRow } from "@/lib/dashboard/types";
import { PageHeader, EmptyState } from "../_components/ui";
import { CRED_CATEGORIES } from "./constants";
import { addCredential, deleteCredential, updateCredential } from "./actions";
import { CredentialCard } from "./_components/credential-card";

type SearchParams = Promise<{ cat?: string }>;

export default async function CredentialsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireActiveSubscription();
  const { cat = "All" } = await searchParams;

  const supabase = await createClient();
  let req = supabase.from("credentials").select("*").order("site", { ascending: true });
  if (cat !== "All") req = req.eq("category", cat);
  const creds = ((await req).data as CredentialRow[] | null) ?? [];

  const cats = ["All", ...CRED_CATEGORIES];

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <PageHeader
        title="Logins & Passwords"
        subtitle="A private vault for the credentials you actually use."
      />

      <div className="mb-5 p-3 rounded-lg border border-gold/40 bg-gold/10 text-xs text-ink flex items-start gap-2">
        <span>
          Stored on your account and protected by row-level security. For
          highest-sensitivity accounts, a dedicated password manager is still
          best practice.
        </span>
      </div>

      <details className="mb-6 rounded-lg border border-stone-200 bg-white">
        <summary className="cursor-pointer p-4 text-sm font-medium text-ink">
          + Add login
        </summary>
        <form action={addCredential} className="p-4 border-t border-stone-200 grid sm:grid-cols-2 gap-3">
          <input name="site" required placeholder="Site / app name" className="px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white" />
          <input name="url" placeholder="URL (optional)" className="px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white" />
          <input name="username" placeholder="Username / email" className="px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white" />
          <input name="password" placeholder="Password" className="px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white font-mono" />
          <select name="category" defaultValue="Personal" className="px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white">
            {CRED_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <textarea name="notes" rows={1} placeholder="Notes (security questions, recovery…)" className="sm:col-span-2 px-3 py-2 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white" />
          <button type="submit" className="self-start px-4 py-2 bg-sage text-white text-sm font-medium rounded hover:bg-forest">
            Add login
          </button>
        </form>
      </details>

      <div className="flex flex-wrap gap-2 mb-5">
        {cats.map((c) => (
          <a
            key={c}
            href={c === "All" ? "/app/credentials" : `/app/credentials?cat=${encodeURIComponent(c)}`}
            className={`px-3 py-1.5 text-xs rounded border ${
              cat === c ? "bg-sage text-white border-sage" : "border-stone-200 text-stone hover:border-sage"
            }`}
          >
            {c}
          </a>
        ))}
      </div>

      {creds.length === 0 ? (
        <div className="rounded-lg border border-stone-200 bg-white p-12">
          <EmptyState>No logins saved yet. Add your first above.</EmptyState>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {creds.map((cred) => (
            <CredentialCard
              key={cred.id}
              cred={cred}
              updateAction={updateCredential}
              deleteAction={deleteCredential}
            />
          ))}
        </div>
      )}
    </div>
  );
}
