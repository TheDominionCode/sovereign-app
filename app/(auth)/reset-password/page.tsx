import { updatePasswordAction } from "../actions";
import PasswordField from "../_components/PasswordField";
import SubmitButton from "../_components/SubmitButton";

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
          <PasswordField id="password" name="password" autoComplete="new-password" minLength={6} />
        </div>
        <div>
          <label
            htmlFor="confirm"
            className="block text-sm font-medium text-ink mb-1.5"
          >
            Confirm new password
          </label>
          <PasswordField id="confirm" name="confirm" autoComplete="new-password" minLength={6} />
        </div>
        <SubmitButton label="Update password" pendingLabel="Updating…" />
      </form>
    </div>
  );
}
