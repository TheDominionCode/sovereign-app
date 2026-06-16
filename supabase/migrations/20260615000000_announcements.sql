-- In-app announcements: short messages the owner can broadcast to every
-- signed-in user from /admin/announcements. They show as a popup the
-- next time the user opens the planner, are dismissed with one tap,
-- and stay dismissed forever for that user. NOT the same as the
-- affiliate community feed — these are owner-broadcast only.

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text,                                   -- optional headline (e.g. "Big news!")
  body text not null,                           -- the actual message
  emoji text,                                   -- single decorative emoji (e.g. "✨")
  audience text not null default 'all'          -- 'all' | 'paying' | 'trialing'
    check (audience in ('all', 'paying', 'trialing')),
  active boolean not null default true,         -- can deactivate to stop showing to new users
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index announcements_active_idx on public.announcements (active, created_at desc);

-- Per-user dismissal log — once a user taps "Got it" we drop a row here so
-- the announcement never reappears for them. The popup query joins on this
-- table and excludes anything already dismissed.
create table public.announcement_dismissals (
  user_id uuid not null references auth.users(id) on delete cascade,
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  dismissed_at timestamptz not null default now(),
  primary key (user_id, announcement_id)
);

alter table public.announcements enable row level security;
alter table public.announcement_dismissals enable row level security;

-- Anyone signed in can see active announcements; the audience filter is
-- enforced in app code against the user's subscription status.
create policy "announcements: read active"
  on public.announcements for select
  using (active = true);

-- Users can only read / write their OWN dismissal log.
create policy "dismissals: read own"
  on public.announcement_dismissals for select
  using (auth.uid() = user_id);

create policy "dismissals: insert own"
  on public.announcement_dismissals for insert
  with check (auth.uid() = user_id);
