-- Real Google Calendar connections (read-only import). One row per user —
-- v1 supports a single Google account per user. Tokens are written/read
-- only by server-side route handlers using the service-role client
-- (app/api/calendar/*); the browser never sees access_token/refresh_token.

create table public.calendar_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'google' check (provider in ('google')),

  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz not null,
  calendar_id text not null default 'primary',

  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reuses the same trigger function other migrations already created; safe
-- to redefine if this migration ever runs on a fresh database on its own.
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'calendar_connections_updated_at') then
    create trigger calendar_connections_updated_at before update on public.calendar_connections for each row execute function set_updated_at();
  end if;
end $$;

alter table public.calendar_connections enable row level security;

-- Users can see whether they're connected and disconnect themselves.
-- Token writes (insert/update, i.e. the actual OAuth exchange + refresh)
-- only ever happen via the service-role client server-side.
create policy "calendar_connections: read own"
  on public.calendar_connections for select
  using (auth.uid() = user_id);

create policy "calendar_connections: delete own"
  on public.calendar_connections for delete
  using (auth.uid() = user_id);
