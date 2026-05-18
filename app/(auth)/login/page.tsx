import Link from "next/link";
import {
  signInWithPasswordAction,
  signInWithGoogleAction,
} from "../actions";

type SearchParams = Promise<{ next?: string; error?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { next = "/app", error } = await searchParams;

  return (
    <div>
      <h1 className="font-display text-3xl text-forest-deep mb-2">
        Welcome back
      </h1>
      <p className="text-stone mb-8">Sign in to your Sovereign account.</p>

      {error && (
        <div className="mb-6 rounded-md border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-rose">
          {error}
        </div>
      )}

      <form action={signInWithGoogleAction} className="mb-6">
        <input type="hidden" name="next" value={next} />
        <button
          type="submit"
          className="w-full rounded-md border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-cream transition-colors"
        >
          Continue with Google
        </button>
      </form>

      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-stone-200" />
        <span className="text-xs uppercase tracking-wider text-stone-light">
          or
        </span>
        <div className="h-px flex-1 bg-stone-200" />
      </div>

      <form action={signInWithPasswordAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
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
            htmlFor="password"
            className="block text-sm font-medium text-ink mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-forest px-4 py-2.5 text-sm font-medium text-white hover:bg-forest-deep transition-colors"
        >
          Sign in
        </button>
      </form>

      <p className="mt-8 text-sm text-stone text-center">
        New to Sovereign?{" "}
        <Link
          href={`/signup?next=${encodeURIComponent(next)}`}
          className="text-forest font-medium hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
