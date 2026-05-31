import Link from "next/link";
import { signUpWithPasswordAction } from "../actions";
import PasswordField from "../_components/PasswordField";
import SubmitButton from "../_components/SubmitButton";

type SearchParams = Promise<{ next?: string; error?: string }>;

export default async function SignupPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { next = "/pricing", error } = await searchParams;

  return (
    <div>
      <h1 className="font-display text-3xl text-forest-deep mb-2">
        Create your account
      </h1>
      <p className="text-stone mb-8">
        Start your 3-day free trial. Card required, cancel anytime.
      </p>

      {error && (
        <div className="mb-6 rounded-md border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-rose">
          {error}
        </div>
      )}

      <form action={signUpWithPasswordAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label
            htmlFor="full_name"
            className="block text-sm font-medium text-ink mb-1.5"
          >
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            autoComplete="name"
            placeholder="Sovereign Woman"
            className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-ink mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
          />
        </div>
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-ink mb-1.5"
          >
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="+1 555 123 4567"
            className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
          />
          <p className="mt-1 text-xs text-stone-light">
            For trial reminders and account help. We don&apos;t share or sell it.
          </p>
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-ink mb-1.5"
          >
            Password
          </label>
          <PasswordField id="password" name="password" autoComplete="new-password" minLength={8} />
          <p className="mt-1 text-xs text-stone-light">At least 8 characters.</p>
        </div>
        <SubmitButton label="Create account" pendingLabel="Creating account…" />
      </form>

      <p className="mt-8 text-sm text-stone text-center">
        Already have an account?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="text-forest font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
