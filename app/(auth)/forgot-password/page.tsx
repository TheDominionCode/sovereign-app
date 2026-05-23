import Link from "next/link";
import { forgotPasswordAction } from "../actions";

type SearchParams = Promise<{ error?: string; sent?: string }>;

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error, sent } = await searchParams;

  return (
    <div>
      <h1 className="font-display text-3xl text-forest-deep mb-2">
        Reset your password
      </h1>
      <p className="text-stone mb-8">
        Enter the email tied to your Sovereign account and we&apos;ll send you
        a link to set a new password.
      </p>

      {sent === "1" ? (
        <div className="rounded-md border border-sage-pale bg-cream-bg px-4 py-4 text-sm text-forest mb-6">
          If an account exists for that email, a reset link is on its way.
          Check your inbox (and spam folder, just in case).
        </div>
      ) : null}

      {error && (
        <div className="mb-6 rounded-md border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-rose">
          {error}
        </div>
      )}

      <form action={forgotPasswordAction} className="space-y-4">
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
        <button
          type="submit"
          className="w-full rounded-md bg-forest px-4 py-2.5 text-sm font-medium text-white hover:bg-forest-deep transition-colors"
        >
          Send reset link
        </button>
      </form>

      <p className="mt-8 text-sm text-stone text-center">
        Remembered it?{" "}
        <Link
          href="/login"
          className="text-forest font-medium hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
