import { updatePasswordAction } from "../actions";

type SearchParams = Promise<{ error?: string }>;

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error } = await searchParams;

  return (
    <div>
      <h1 className="font-display text-3xl text-forest-deep mb-2">
        Set a new password
      </h1>
      <p className="text-stone mb-8">
        Choose a new password for your Sovereign account.
      </p>

      {error && (
        <div className="mb-6 rounded-md border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-rose">
          {error}
        </div>
      )}

      <form action={updatePasswordAction} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-ink mb-1.5"
          >
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
          />
        </div>
        <div>
          <label
            htmlFor="confirm"
            className="block text-sm font-medium text-ink mb-1.5"
          >
            Confirm new password
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-forest px-4 py-2.5 text-sm font-medium text-white hover:bg-forest-deep transition-colors"
        >
          Update password
        </button>
      </form>
    </div>
  );
}
