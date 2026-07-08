create table public.bug_reports (
  id          bigserial primary key,
  user_id     uuid references auth.users(id) on delete set null,
  user_email  text,
  description text not null,
  page        text,
  status      text not null default 'open',
  admin_notes text,
  created_at  timestamptz not null default now()
);

alter table public.bug_reports enable row level security;

-- Authenticated users can submit reports
create policy "users can insert own bug reports"
  on public.bug_reports for insert to authenticated
  with check (auth.uid() = user_id);

-- Users can read their own reports
create policy "users can read own bug reports"
  on public.bug_reports for select to authenticated
  using (auth.uid() = user_id);

-- Service role (admin client) bypasses RLS
