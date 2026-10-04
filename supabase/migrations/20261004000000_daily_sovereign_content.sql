-- Upgrades daily_resets into the richer "Sovereign Daily Content" model:
-- title, word of the day, a proper scripture breakdown (reference /
-- translation / text / reflection as distinct fields), metacognition and
-- alignment prompts, plus the computed day-of-year metadata (days_remaining,
-- season) that drives the 12-season yearly progression. Extends the
-- existing table in place — does NOT create a parallel table.

alter table public.daily_resets
  add column if not exists title_en text,
  add column if not exists title_es text,
  add column if not exists word_of_day_en text,
  add column if not exists word_of_day_es text,
  add column if not exists word_definition_en text,
  add column if not exists word_definition_es text,
  add column if not exists scripture_reference text,
  add column if not exists scripture_translation text not null default 'NASB',
  add column if not exists scripture_text_en text,
  add column if not exists scripture_text_es text,
  add column if not exists metacognition_prompt_en text,
  add column if not exists metacognition_prompt_es text,
  add column if not exists alignment_prompt_en text,
  add column if not exists alignment_prompt_es text,
  add column if not exists days_remaining integer,
  add column if not exists season text,
  add column if not exists admin_edited boolean not null default false,
  add column if not exists admin_edited_sections jsonb not null default '[]'::jsonb, -- which section keys Nataly has hand-edited (spec §20/§21 per-section protection)
  add column if not exists needs_review boolean not null default false;

comment on column public.daily_resets.scripture_reflection_en is 'Reflection text only as of 2026-10-04 — the verse itself now lives in scripture_text_en/es.';
comment on column public.daily_resets.scripture_reflection_es is 'Reflection text only as of 2026-10-04 — the verse itself now lives in scripture_text_en/es.';

-- content_date (the existing `date` column) is the real identity key per
-- spec §2 — one row per calendar date, shared by every user. day_number is
-- now always computed from `date` (day-of-year), not admin-typed, so it no
-- longer needs its own uniqueness guarantee.
drop index if exists daily_resets_day_number_idx;
create unique index if not exists daily_resets_date_unique_idx on public.daily_resets (date);

-- Backfill days_remaining/season for any rows created before this migration
-- (just the one test row from initial development) so existing data stays
-- consistent with the new computed fields.
do $$
declare
  r record;
  day_of_year int;
  days_in_year int;
begin
  for r in select id, date from public.daily_resets where days_remaining is null or season is null loop
    day_of_year := r.date - date_trunc('year', r.date)::date + 1;
    days_in_year := case when (extract(year from r.date)::int % 4 = 0 and extract(year from r.date)::int % 100 <> 0)
                           or extract(year from r.date)::int % 400 = 0
                         then 366 else 365 end;
    update public.daily_resets
      set days_remaining = days_in_year - day_of_year,
          season = case
            when day_of_year <= 30 then 'Identity'
            when day_of_year <= 60 then 'Mind + Metacognition'
            when day_of_year <= 90 then 'Discipline + Habits'
            when day_of_year <= 120 then 'Confidence + Embodiment'
            when day_of_year <= 150 then 'Relationships + Communication'
            when day_of_year <= 180 then 'Money + Stewardship'
            when day_of_year <= 210 then 'Purpose + Vision'
            when day_of_year <= 240 then 'Spiritual Maturity'
            when day_of_year <= 270 then 'Leadership'
            when day_of_year <= 300 then 'CEO Identity + Sales'
            when day_of_year <= 330 then 'Integration + Dominion'
            else 'Mastery + Continuation'
          end
      where id = r.id;
  end loop;
end $$;

-- Generation attempt log (spec §32) — admin-only, no public policy.
create table public.daily_content_generation_logs (
  id bigserial primary key,
  content_date date not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'running' check (status in ('running', 'success', 'failure', 'skipped_exists')),
  error_message text,
  model text,
  generation_attempt integer not null default 1,
  created_at timestamptz not null default now()
);

create index daily_content_generation_logs_date_idx on public.daily_content_generation_logs (content_date desc, started_at desc);

alter table public.daily_content_generation_logs enable row level security;
-- No select/insert/update policies for anon/authenticated — service-role
-- (the Edge Function + admin actions) is the only writer/reader, same
-- pattern as every other admin-only table in this project.

-- Small generic key/value settings store (spec §37) — avoids a new
-- migration every time a future on/off toggle is needed.
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.app_settings enable row level security;
-- Admin-only, same reasoning as the generation log table above.

insert into public.app_settings (key, value) values
  ('daily_content_auto_publish', 'false'::jsonb),
  ('daily_generation_enabled', 'true'::jsonb),
  ('default_scripture_translation', '"NASB"'::jsonb),
  ('default_ai_model', '"claude-sonnet-5"'::jsonb)
on conflict (key) do nothing;
