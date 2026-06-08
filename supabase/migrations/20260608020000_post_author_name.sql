-- Store the author's display name on each community post so the feed can
-- show "Amanda Brooks" instead of "amanda…@gmail.com". The name is captured
-- at submission time from public.profiles.full_name (falling back to the
-- email username); we store it on the row rather than joining on every
-- read so the feed query stays a single table scan.

alter table public.community_posts
  add column if not exists author_name text;
