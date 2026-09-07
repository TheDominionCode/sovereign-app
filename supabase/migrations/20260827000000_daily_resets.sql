-- Daily Reset — admin-curated content shown on the AI Coach tab
-- (Sovereign Reset / Today's Principle / Scripture + Reflection / Brain
-- Science / Today's Challenge / Sovereign Thought). Separate system from
-- daily_experience (which powers the Today & Mind pages' rotating content).
--
-- Hard rule enforced in app code, not SQL: AI can create/edit content but
-- can never move a row into 'approved' or 'published' — only an
-- authenticated admin action does that. See app/admin/daily-reset-manager.

create table public.daily_resets (
  id bigserial primary key,
  day_number integer not null,
  date date not null,
  theme text,
  nataly_direction text,          -- last "how I want this changed" instruction given to the AI

  -- Six content sections, bilingual. Stored as sanitized HTML
  -- (bold/italic/lists/paragraphs only — see sanitizeRichText()).
  sovereign_reset_en text,
  sovereign_reset_es text,
  today_principle_en text,
  today_principle_es text,
  scripture_reflection_en text,
  scripture_reflection_es text,
  brain_science_en text,
  brain_science_es text,
  today_challenge_en text,
  today_challenge_es text,
  sovereign_thought_en text,
  sovereign_thought_es text,

  status text not null default 'draft'
    check (status in ('draft', 'pending_approval', 'approved', 'published', 'archived')),
  ai_generated boolean not null default false,
  admin_approved boolean not null default false,
  approved_by text,
  approved_at timestamptz,

  publish_at timestamptz,         -- set by "Schedule Publish"; the scheduled
                                   -- function flips status to 'published' once
                                   -- this is due AND status='approved'
  published_at timestamptz,

  version_number integer not null default 1,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index daily_resets_day_number_idx on public.daily_resets (day_number);
create index daily_resets_status_publish_at_idx on public.daily_resets (status, publish_at);
create index daily_resets_date_idx on public.daily_resets (date);

-- Reuses the same trigger function daily_experience already created; safe to
-- redefine if this migration ever runs on a fresh database on its own.
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'daily_resets_updated_at') then
    create trigger daily_resets_updated_at before update on public.daily_resets for each row execute function set_updated_at();
  end if;
end $$;

-- Append-only version history. Written from application code (not a DB
-- trigger) so each row can carry the correct human-readable change_type
-- ("AI Generated" / "Nataly Edited" / "Approved" / ...) shown in the admin UI.
create table public.daily_reset_versions (
  id bigserial primary key,
  daily_reset_id bigint not null references public.daily_resets(id) on delete cascade,
  version_number integer not null,
  snapshot jsonb not null,
  change_type text not null
    check (change_type in ('created', 'ai_generated', 'edited', 'regenerated_section', 'approved', 'scheduled', 'published', 'unpublished', 'restored')),
  created_at timestamptz not null default now(),
  created_by text
);

create index daily_reset_versions_daily_reset_id_idx on public.daily_reset_versions (daily_reset_id, version_number desc);

-- RLS: only PUBLISHED rows are ever publicly readable. All writes (and the
-- admin dashboard's reads of drafts/pending/approved rows) go through the
-- service-role client, which bypasses RLS entirely.
alter table public.daily_resets enable row level security;
alter table public.daily_reset_versions enable row level security;

create policy "daily_resets: public read published"
  on public.daily_resets for select
  using (status = 'published');
