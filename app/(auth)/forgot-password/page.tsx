import Link from "next/link";
import { CheckCircle2, Mail } from "lucide-react";
import { forgotPasswordAction } from "../actions";
import SubmitButton from "../_components/SubmitButton";

type SearchParams = Promise<{ error?: string; sent?: string }>;

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error, sent } = await searchParams;

  // Post-submit: replace the form with a clear "check your email" state so
  // it's obvious the submit worked. Sage palette + checkmark icon + the
  // button visibly changes to a "sent" style.
  if (sent === "1") {
    return (
      <div>
        <div className="rounded-2xl border border-sage-pale bg-cream-bg/60 px-6 py-8 text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-sage-pale/70 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-7 h-7 text-forest-deep" />
          </div>
          <h1 className="font-display text-2xl text-forest-deep mb-2">
            Check your email
          </h1>
          <p className="text-sm text-stone leading-relaxed">
            We sent a password-reset link to your inbox. Click the link to set
            a new password.
          </p>
          <p className="mt-3 text-xs italic text-stone-light">
            If you don&apos;t see it in a minute, check your spam folder.
          </p>
        </div>

        <button
          type="button"
          disabled
          className="w-full rounded-md bg-sage-pale text-forest-deep px-4 py-2.5 text-sm font-medium cursor-default flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          Email sent
        </button>

        <p className="mt-8 text-sm text-stone text-center">
          Wrong email?{" "}
          <Link
            href="/forgot-password"
            className="text-forest font-medium hover:underline"
          >
            Try again
          </Link>
        </p>
        <p className="mt-2 text-sm text-stone text-center">
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

  return (
    <div>
      <h1 className="font-display text-3xl text-forest-deep mb-2">
        Reset your password
      </h1>
      <p className="text-stone mb-8">
        Enter the email tied to your Sovereign account and we&apos;ll send you
        a link to set a new password.
      </p>

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
        <SubmitButton label="Send reset link" pendingLabel="Sending…" />
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
