-- Last-active timestamp: updated every time the user opens the planner.
-- Different from auth.users.last_sign_in_at, which only updates when the
-- user re-enters their password. With our 400-day session cookie, sign-in
-- rarely fires — so this column is the real "are they using the app"
-- signal for the admin dashboard.

alter table public.profiles
  add column if not exists last_active_at timestamptz;

create index if not exists profiles_last_active_idx
  on public.profiles (last_active_at desc);
