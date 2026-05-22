-- Cloud storage for the self-contained Sovereign app (public/os.html).
-- The app persists everything through a single key/value `storage` wrapper
-- (window.storage seam). Rather than model its ~24 modules individually, we
-- back that wrapper with one per-user key/value table so data syncs across
-- devices exactly as the app already writes it. Value is the raw JSON string
-- the app stores (kept as text for an exact round-trip with localStorage).

create table public.app_state (
  user_id uuid not null references public.profiles(id) on delete cascade,
  key text not null,
  value text,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.app_state enable row level security;

create policy "app_state: select own"
  on public.app_state for select
  using (auth.uid() = user_id);

create policy "app_state: insert own"
  on public.app_state for insert
  with check (auth.uid() = user_id);

create policy "app_state: update own"
  on public.app_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "app_state: delete own"
  on public.app_state for delete
  using (auth.uid() = user_id);
