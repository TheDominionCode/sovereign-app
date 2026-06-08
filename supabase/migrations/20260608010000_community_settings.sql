-- Community customization settings. A flat key/value store so the admin can
-- swap the heading quote and color theme on /affiliate/community from her own
-- admin UI without ever needing a code change. Writes are gated by
-- requireAdmin() inside the server action — RLS is locked.
--
-- Keys we use today:
--   quote → the italic line shown under "Wall of wins"
--   theme → one of the preset theme names defined in lib/affiliate/themes.ts

create table if not exists public.community_settings (
  key         text primary key,
  value       text not null,
  updated_at  timestamptz not null default now(),
  updated_by  text
);

alter table public.community_settings enable row level security;

insert into public.community_settings (key, value) values
  ('quote', 'What''s possible for her is already on its way to you.'),
  ('theme', 'sand')
on conflict (key) do nothing;
