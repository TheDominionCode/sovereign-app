-- Affiliate program + Wall-of-Wins community.
--
-- Three tables:
--   affiliate_applications — who applied, what they wrote, pending/approved/rejected.
--   community_posts        — the wins feed, each row goes through admin approval.
--   community_reactions    — one "tap" per user per post, used as a like.
--
-- Plus a `community-images` Storage bucket for optional photos attached to posts.
-- RLS is enabled everywhere with NO public policies — every read and write goes
-- through server actions running with the service-role admin client, which both
-- bypasses RLS and re-checks identity via requireAdmin() / requireApprovedAffiliate().

-- ───────────────────────────────────────────────────────────────────────────────
-- Affiliate applications
-- One row per user (the latest application). Status moves pending → approved
-- when the admin clicks "Approve" in /admin/affiliates, or pending → rejected.
-- A rejected user can re-apply; we just upsert by user_id and reset to pending.
-- ───────────────────────────────────────────────────────────────────────────────
create table if not exists public.affiliate_applications (
  id          bigserial primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  email       text not null,
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  message     text,
  applied_at  timestamptz not null default now(),
  decided_at  timestamptz,
  decided_by  text,
  unique (user_id)
);

create index if not exists affiliate_applications_status_idx on public.affiliate_applications (status);
alter table public.affiliate_applications enable row level security;

-- ───────────────────────────────────────────────────────────────────────────────
-- Community posts (wall of wins)
-- status = 'pending'   → only visible in /admin/community
-- status = 'approved'  → visible in /affiliate/community feed
-- status = 'rejected'  → never shown, kept for audit
-- status = 'hidden'    → was approved, admin took it down
-- reaction_count is a denormalized counter the reaction server action keeps in sync.
-- ───────────────────────────────────────────────────────────────────────────────
create table if not exists public.community_posts (
  id              bigserial primary key,
  author_id       uuid not null references auth.users(id) on delete cascade,
  author_email    text not null,
  body            text not null,
  image_path      text,
  status          text not null default 'pending' check (status in ('pending','approved','rejected','hidden')),
  created_at      timestamptz not null default now(),
  approved_at     timestamptz,
  approved_by     text,
  reaction_count  int not null default 0
);

create index if not exists community_posts_status_created_idx on public.community_posts (status, created_at desc);
alter table public.community_posts enable row level security;

-- ───────────────────────────────────────────────────────────────────────────────
-- Community reactions
-- Composite PK (post_id, user_id) means a user can only react once per post;
-- the second insert is a no-op, the reaction toggles off via delete.
-- ───────────────────────────────────────────────────────────────────────────────
create table if not exists public.community_reactions (
  post_id     bigint not null references public.community_posts(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.community_reactions enable row level security;

-- ───────────────────────────────────────────────────────────────────────────────
-- Storage bucket for post images.
-- Public so the admin-approved image URLs can be loaded directly by browsers
-- without juggling signed URLs in the feed. Names are random uuids generated
-- server-side so unguessable.
-- ───────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('community-images', 'community-images', true)
on conflict (id) do nothing;
