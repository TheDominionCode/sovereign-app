-- Admins: small allow-list of email addresses that may access /admin.
-- Two roles: `owner` (full + manage other admins) and `member` (read-only).
-- Soft cap of 5 admins is enforced in the application layer, not here.
-- Service role bypasses RLS; we don't grant client-side write access at all.

create table if not exists public.admins (
  email text primary key,
  role text not null default 'member' check (role in ('owner', 'member')),
  added_at timestamptz not null default now(),
  added_by text
);

alter table public.admins enable row level security;

-- An admin can read their own row (used by client-side checks if any).
create policy "admins_select_own"
  on public.admins for select
  using (lower(email) = lower(coalesce(
    (select email from auth.users where id = auth.uid()),
    ''
  )));

-- Seed the founder as owner so /admin works the moment this migration runs.
insert into public.admins (email, role)
values ('iconic.digitals10m@gmail.com', 'owner')
on conflict (email) do update set role = excluded.role;
