-- Landing-page + link click tracking, written to by the public /api/track
-- endpoint (via the service-role admin client) and read only by the admin
-- pages (also service-role). RLS is enabled with no policies, so direct
-- client access is impossible — only the server can write or read these rows.
create table if not exists public.clicks (
  id          bigserial primary key,
  link_slug   text not null default 'landing',
  path        text,
  clicked_at  timestamptz not null default now(),
  ip          text,
  referrer    text,
  user_agent  text,
  country     text
);

create index if not exists clicks_clicked_at_idx on public.clicks (clicked_at desc);
create index if not exists clicks_link_slug_idx  on public.clicks (link_slug);

alter table public.clicks enable row level security;
-- intentionally no policies — admin client bypasses RLS, everyone else is locked out.
