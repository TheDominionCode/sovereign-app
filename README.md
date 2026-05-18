# Sovereign

The operating system for the woman behind everything. Built with Next.js 15, Supabase, and Tailwind.

## Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Backend**: Supabase (Postgres + Auth + Storage)
- **Styling**: Tailwind CSS v3
- **Charts/Icons**: Recharts + Lucide

## Local setup — first time

You'll need three things installed:

### 1. Node.js (required)

```bash
# Easiest: download the macOS installer from https://nodejs.org
# Or with Homebrew:
brew install node

# Verify (should print v22.x or later):
node --version
```

### 2. Docker Desktop (required for the local Supabase stack)

Download from https://www.docker.com/products/docker-desktop and launch it once. Keep it running while you develop.

### 3. Supabase CLI (required for local dev DB and migrations)

```bash
brew install supabase/tap/supabase

# Verify:
supabase --version
```

If you don't have Homebrew, see https://supabase.com/docs/guides/local-development/cli/getting-started for other install paths.

### 4. Stripe CLI (required to test billing locally)

```bash
brew install stripe/stripe-cli/stripe

# Log in once:
stripe login
```

---

## Running the project

```bash
# install JS dependencies
npm install

# start local Supabase (Postgres + Auth + Studio)
# the first run downloads Docker images — takes a few minutes
npm run db:start

# in a second terminal, start Next.js
npm run dev
```

Open:

- **App**: http://localhost:3000
- **Supabase Studio (local)**: http://localhost:54323
- **Local mail catcher (Inbucket)**: http://localhost:54324 — captures auth emails locally so you can click confirmation links without a real email server.

## Environment variables

`.env.local` is git-ignored. Copy `.env.example` and fill it in. The full list of vars and what each one does is in `.env.example`. Quick summary:

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, plus `STRIPE_PRICE_1MO/_3MO/_6MO/_12MO`
- Site: `NEXT_PUBLIC_SITE_URL`

The publishable keys are safe to expose in browser code — they rely on Row Level Security (RLS) for data isolation. **Every table must have RLS enabled and a policy in place**, or it will be readable by anyone with the URL.

Never commit `SUPABASE_SECRET_KEY` (service role) or `STRIPE_SECRET_KEY`. Both bypass RLS / billing limits.

## Project layout

```
app/                          Next.js App Router pages
  layout.tsx                  Root layout, fonts, metadata
  page.tsx                    Home (signed-out landing)
  globals.css                 Tailwind + base styles
  (auth)/                     Public auth shell + pages
    login/page.tsx            Email/password + Google sign-in
    signup/page.tsx           Account creation
    logout/route.ts           POST sign-out
    actions.ts                Auth server actions
  auth/callback/route.ts      OAuth + email-confirm code exchange
  pricing/                    Public pricing page (4 plan cards)
  billing/                    Authed billing status + Manage portal
  (authed)/                   Gated route group (requires active subscription)
    layout.tsx                Calls requireActiveSubscription()
    app/page.tsx              Placeholder dashboard for 12 modules
  api/stripe/
    checkout/route.ts         POST: create Stripe Checkout session
    portal/route.ts           POST: create Billing Portal session
    webhook/route.ts          POST: verify signature, sync sub state
lib/
  supabase/
    client.ts                 Browser Supabase client
    server.ts                 Server-component Supabase client
    middleware.ts             Session refresh + auth-gate redirect
    admin.ts                  Service-role client (webhook only!)
  stripe/
    server.ts                 Stripe SDK
    plans.ts                  PLANS array, price-id helpers
  billing/
    subscription.ts           requireActiveSubscription(), getActiveSubscription()
middleware.ts                 Edge middleware entry
supabase/
  config.toml                 Local-dev config (ports, auth settings)
  migrations/                 Schema migrations (profiles, subscriptions)
_legacy/                      The original single-file HTML/JSX app (reference)
```

## Build phases

This app is being rebuilt from a single-file HTML React app into a real SaaS. Status:

- [x] **Phase 1**: Project scaffolding — Next.js + Supabase clients + middleware
- [x] **Phase 2 (partial)**: Auth UI — email/password + Google sign-in
- [x] **Phase 3 (partial)**: Schema + RLS for `profiles`, `subscriptions`, `stripe_events`
- [ ] **Phase 4**: Port the existing UI section by section
- [ ] **Phase 5**: Replace localStorage with Supabase queries
- [x] **Phase 6 (partial)**: Stripe billing — checkout, portal, webhook, gating
- [ ] **Phase 6**: Vercel/Netlify deploy + production webhook + monitoring

## Stripe billing

### Plans

| Plan      | Price   | Per month | Save |
|-----------|---------|-----------|------|
| 1 month   | $14.99  | $14.99    | —    |
| 3 months  | $39.99  | $13.33    | 11%  |
| 6 months  | $74.99  | $12.50    | 17%  |
| 12 months | $99.99  | $8.33     | 44%  |

All plans unlock the full app and include a **3-day free trial** (card required upfront, charges on day 4 unless cancelled).

### One-time Stripe Dashboard setup

1. Create the Product **"Sovereign"**.
2. Create four recurring Prices in USD: $14.99/mo, $39.99 every 3 mo, $74.99 every 6 mo, $99.99/yr. Paste their `price_…` IDs into `.env.local` (`STRIPE_PRICE_1MO`, etc.).
3. Enable the **Customer Portal** (Settings → Billing → Customer portal): allow cancel-at-period-end, plan switching across the 4 prices, and payment-method updates. Disable immediate cancellation.

### Local webhook testing

In one terminal, tunnel Stripe events to your dev server:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET` in `.env.local`, then restart `npm run dev`.

### Test cards

| Card                          | Behavior                  |
|-------------------------------|---------------------------|
| `4242 4242 4242 4242`         | Success                   |
| `4000 0000 0000 9995`         | Declined (insufficient funds) |
| `4000 0025 0000 3155`         | Requires 3DS authentication |

### Testing the trial → active transition

Stripe **Test Clocks** let you fast-forward time without waiting 3 real days:

```bash
# Create a clock anchored to now
stripe test_helpers test_clocks create --frozen-time $(date +%s)
# Note the clock id (clock_...)

# Create a customer attached to the clock, then check out using that customer.
# Then advance the clock past the trial:
stripe test_helpers test_clocks advance --id <clock_id> --frozen-time $(date -v +4d +%s)
```

The webhook will receive `customer.subscription.updated` with `status='active'`.

### Production deploy

When you deploy, register the production webhook in the Stripe Dashboard pointing at `https://<your-domain>/api/stripe/webhook` and subscribe to: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`. The production `whsec_…` is **different** from the CLI one — store separately.

## Production Supabase project

Live project: `https://purbwsbryhzfofnwddmg.supabase.co`

The local stack mirrors production schema-wise. Migrations created against the local DB are pushed to production with `npm run db:push` (after linking the project).
