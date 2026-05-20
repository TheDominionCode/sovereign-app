-- Sovereign dashboard data model.
-- Every table is user-scoped via user_id -> public.profiles(id) and protected by RLS so a
-- signed-in user sees only their own rows. Child tables (goal_milestones, vitamin_doses,
-- reflection_items, boundary_items) check ownership through their parent.
--
-- Conventions:
--   - id           uuid primary key, default gen_random_uuid()
--   - user_id      uuid not null references profiles(id) on delete cascade
--   - created_at / updated_at  timestamptz, touched by trigger
--   - dates as `date` (not timestamptz) when day-grain is intended

-- ============================================================================
-- Enums
-- ============================================================================
create type public.task_priority as enum ('critical', 'high', 'normal');
create type public.flow_level as enum ('none', 'spotting', 'light', 'medium', 'heavy');
create type public.pf_entry_type as enum ('recurring', 'one-time');
create type public.pf_frequency as enum ('weekly', 'biweekly', 'monthly', 'yearly');
create type public.credit_bureau as enum ('experian', 'equifax', 'transunion');
create type public.reflection_kind as enum ('strengths', 'weaknesses', 'improvements', 'custom');
create type public.boundary_kind as enum ('expectations', 'deal_breakers', 'non_negotiables', 'custom');
create type public.routine_key as enum ('morning', 'afternoon', 'evening', 'workout', 'reading');

-- ============================================================================
-- Helpers
-- ============================================================================

-- Owner check used by child-table policies. Returns true if the calling user
-- owns the given parent row in the named table.
create or replace function public.user_owns(parent_table regclass, parent_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  owner uuid;
begin
  execute format('select user_id from %s where id = $1', parent_table)
    into owner
    using parent_id;
  return owner = auth.uid();
end;
$$;

grant execute on function public.user_owns(regclass, uuid) to authenticated;

-- ============================================================================
-- user_preferences  (one row per user)
-- ============================================================================
create table public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  accent text not null default 'sage',
  lang text not null default 'en',
  calendar_label text not null default 'Calendar',
  show_year_view boolean not null default true,
  show_weekly_schedule boolean not null default true,
  inspiration_img text,
  week_start text not null default 'Monday',
  currency text not null default '$',
  notify_daily boolean not null default true,
  notify_milestones boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;
create policy "user_preferences_select_own" on public.user_preferences for select using (auth.uid() = user_id);
create policy "user_preferences_insert_own" on public.user_preferences for insert with check (auth.uid() = user_id);
create policy "user_preferences_update_own" on public.user_preferences for update using (auth.uid() = user_id);
create policy "user_preferences_delete_own" on public.user_preferences for delete using (auth.uid() = user_id);
create trigger user_preferences_touch before update on public.user_preferences
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- routine_settings  (one row per user — rename / hide built-in habit chips)
-- ============================================================================
create table public.routine_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  morning_label text not null default 'Morning routine',
  afternoon_label text not null default 'Afternoon routine',
  evening_label text not null default 'Evening routine',
  workout_label text not null default 'Workout',
  reading_label text not null default 'Reading 30m',
  morning_hidden boolean not null default false,
  afternoon_hidden boolean not null default false,
  evening_hidden boolean not null default false,
  workout_hidden boolean not null default false,
  reading_hidden boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.routine_settings enable row level security;
create policy "routine_settings_select_own" on public.routine_settings for select using (auth.uid() = user_id);
create policy "routine_settings_insert_own" on public.routine_settings for insert with check (auth.uid() = user_id);
create policy "routine_settings_update_own" on public.routine_settings for update using (auth.uid() = user_id);
create policy "routine_settings_delete_own" on public.routine_settings for delete using (auth.uid() = user_id);
create trigger routine_settings_touch before update on public.routine_settings
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- habits  (custom user-named habits)
-- ============================================================================
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index habits_user_idx on public.habits (user_id, position);
alter table public.habits enable row level security;
create policy "habits_select_own" on public.habits for select using (auth.uid() = user_id);
create policy "habits_insert_own" on public.habits for insert with check (auth.uid() = user_id);
create policy "habits_update_own" on public.habits for update using (auth.uid() = user_id);
create policy "habits_delete_own" on public.habits for delete using (auth.uid() = user_id);
create trigger habits_touch before update on public.habits for each row execute function public.touch_updated_at();

-- ============================================================================
-- planner_days  (one row per user per date)
-- Stores per-day plan: priorities, wins, gratitude, journal, tomorrow,
-- water count, and routine done flags.
-- ============================================================================
create table public.planner_days (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  priorities text[] not null default array[]::text[],
  wins text[] not null default array[]::text[],
  gratitude text not null default '',
  journal text not null default '',
  tomorrow text not null default '',
  water_glasses int not null default 0 check (water_glasses between 0 and 8),
  morning_done boolean not null default false,
  afternoon_done boolean not null default false,
  evening_done boolean not null default false,
  workout_done boolean not null default false,
  reading_done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create index planner_days_user_idx on public.planner_days (user_id, day desc);
alter table public.planner_days enable row level security;
create policy "planner_days_select_own" on public.planner_days for select using (auth.uid() = user_id);
create policy "planner_days_insert_own" on public.planner_days for insert with check (auth.uid() = user_id);
create policy "planner_days_update_own" on public.planner_days for update using (auth.uid() = user_id);
create policy "planner_days_delete_own" on public.planner_days for delete using (auth.uid() = user_id);
create trigger planner_days_touch before update on public.planner_days
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- planner_blocks  (free-text content per hour cell in the weekly schedule)
-- ============================================================================
create table public.planner_blocks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  hour text not null,
  content text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, day, hour)
);

create index planner_blocks_user_day_idx on public.planner_blocks (user_id, day);
alter table public.planner_blocks enable row level security;
create policy "planner_blocks_select_own" on public.planner_blocks for select using (auth.uid() = user_id);
create policy "planner_blocks_insert_own" on public.planner_blocks for insert with check (auth.uid() = user_id);
create policy "planner_blocks_update_own" on public.planner_blocks for update using (auth.uid() = user_id);
create policy "planner_blocks_delete_own" on public.planner_blocks for delete using (auth.uid() = user_id);
create trigger planner_blocks_touch before update on public.planner_blocks
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- planner_habit_completions  (per-day completion of a custom habit)
-- ============================================================================
create table public.planner_habit_completions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  day date not null,
  primary key (user_id, habit_id, day)
);

create index planner_habit_completions_user_day_idx on public.planner_habit_completions (user_id, day);
alter table public.planner_habit_completions enable row level security;
create policy "phc_select_own" on public.planner_habit_completions for select using (auth.uid() = user_id);
create policy "phc_insert_own" on public.planner_habit_completions for insert with check (auth.uid() = user_id);
create policy "phc_delete_own" on public.planner_habit_completions for delete using (auth.uid() = user_id);

-- ============================================================================
-- tasks
-- ============================================================================
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  day date not null default current_date,
  done boolean not null default false,
  priority public.task_priority not null default 'normal',
  category text not null default 'personal',
  time_label text,
  recurring boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_user_day_idx on public.tasks (user_id, day);
create index tasks_user_done_idx on public.tasks (user_id, done);
alter table public.tasks enable row level security;
create policy "tasks_select_own" on public.tasks for select using (auth.uid() = user_id);
create policy "tasks_insert_own" on public.tasks for insert with check (auth.uid() = user_id);
create policy "tasks_update_own" on public.tasks for update using (auth.uid() = user_id);
create policy "tasks_delete_own" on public.tasks for delete using (auth.uid() = user_id);
create trigger tasks_touch before update on public.tasks for each row execute function public.touch_updated_at();

-- ============================================================================
-- calendar_events
-- ============================================================================
create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  time_label text,
  title text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index calendar_events_user_day_idx on public.calendar_events (user_id, day);
alter table public.calendar_events enable row level security;
create policy "calendar_events_select_own" on public.calendar_events for select using (auth.uid() = user_id);
create policy "calendar_events_insert_own" on public.calendar_events for insert with check (auth.uid() = user_id);
create policy "calendar_events_update_own" on public.calendar_events for update using (auth.uid() = user_id);
create policy "calendar_events_delete_own" on public.calendar_events for delete using (auth.uid() = user_id);
create trigger calendar_events_touch before update on public.calendar_events
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- goals + goal_milestones
-- ============================================================================
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text not null default 'Personal',
  deadline date,
  progress int not null default 0 check (progress between 0 and 100),
  why text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index goals_user_idx on public.goals (user_id);
create index goals_user_progress_idx on public.goals (user_id, progress);
alter table public.goals enable row level security;
create policy "goals_select_own" on public.goals for select using (auth.uid() = user_id);
create policy "goals_insert_own" on public.goals for insert with check (auth.uid() = user_id);
create policy "goals_update_own" on public.goals for update using (auth.uid() = user_id);
create policy "goals_delete_own" on public.goals for delete using (auth.uid() = user_id);
create trigger goals_touch before update on public.goals for each row execute function public.touch_updated_at();

create table public.goal_milestones (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  position int not null default 0,
  text text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create index goal_milestones_goal_idx on public.goal_milestones (goal_id, position);
alter table public.goal_milestones enable row level security;
create policy "goal_milestones_select_own" on public.goal_milestones for select
  using (public.user_owns('public.goals'::regclass, goal_id));
create policy "goal_milestones_insert_own" on public.goal_milestones for insert
  with check (public.user_owns('public.goals'::regclass, goal_id));
create policy "goal_milestones_update_own" on public.goal_milestones for update
  using (public.user_owns('public.goals'::regclass, goal_id));
create policy "goal_milestones_delete_own" on public.goal_milestones for delete
  using (public.user_owns('public.goals'::regclass, goal_id));

-- ============================================================================
-- affirmations + affirmation_picks
-- ============================================================================
create table public.affirmations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  category text not null default 'Confidence',
  favorite boolean not null default false,
  custom boolean not null default true,
  created_at timestamptz not null default now()
);

create index affirmations_user_idx on public.affirmations (user_id);
create index affirmations_user_favorite_idx on public.affirmations (user_id, favorite);
alter table public.affirmations enable row level security;
create policy "affirmations_select_own" on public.affirmations for select using (auth.uid() = user_id);
create policy "affirmations_insert_own" on public.affirmations for insert with check (auth.uid() = user_id);
create policy "affirmations_update_own" on public.affirmations for update using (auth.uid() = user_id);
create policy "affirmations_delete_own" on public.affirmations for delete using (auth.uid() = user_id);

create table public.affirmation_picks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  affirmation_id uuid not null references public.affirmations(id) on delete cascade,
  primary key (user_id, day)
);

alter table public.affirmation_picks enable row level security;
create policy "affirmation_picks_select_own" on public.affirmation_picks for select using (auth.uid() = user_id);
create policy "affirmation_picks_insert_own" on public.affirmation_picks for insert with check (auth.uid() = user_id);
create policy "affirmation_picks_update_own" on public.affirmation_picks for update using (auth.uid() = user_id);
create policy "affirmation_picks_delete_own" on public.affirmation_picks for delete using (auth.uid() = user_id);

-- ============================================================================
-- vision_cards
-- ============================================================================
create table public.vision_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  caption text,
  img_url text,
  why text,
  letter text,
  target_date date,
  achieved boolean not null default false,
  achieved_at date,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vision_cards_user_idx on public.vision_cards (user_id, position);
create index vision_cards_user_achieved_idx on public.vision_cards (user_id, achieved);
alter table public.vision_cards enable row level security;
create policy "vision_cards_select_own" on public.vision_cards for select using (auth.uid() = user_id);
create policy "vision_cards_insert_own" on public.vision_cards for insert with check (auth.uid() = user_id);
create policy "vision_cards_update_own" on public.vision_cards for update using (auth.uid() = user_id);
create policy "vision_cards_delete_own" on public.vision_cards for delete using (auth.uid() = user_id);
create trigger vision_cards_touch before update on public.vision_cards
  for each row execute function public.touch_updated_at();

-- vision_meta (single row per user — year, statement, top verse for the header)
create table public.vision_meta (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  year int not null default extract(year from current_date),
  statement text not null default 'I walk with clear vision. I move with quiet authority. Nothing meant for me will miss me.',
  top_verse text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.vision_meta enable row level security;
create policy "vision_meta_select_own" on public.vision_meta for select using (auth.uid() = user_id);
create policy "vision_meta_insert_own" on public.vision_meta for insert with check (auth.uid() = user_id);
create policy "vision_meta_update_own" on public.vision_meta for update using (auth.uid() = user_id);
create policy "vision_meta_delete_own" on public.vision_meta for delete using (auth.uid() = user_id);
create trigger vision_meta_touch before update on public.vision_meta
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- notes
-- ============================================================================
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null default '',
  tags text[] not null default array[]::text[],
  pinned boolean not null default false,
  note_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notes_user_idx on public.notes (user_id, pinned desc, note_date desc);
alter table public.notes enable row level security;
create policy "notes_select_own" on public.notes for select using (auth.uid() = user_id);
create policy "notes_insert_own" on public.notes for insert with check (auth.uid() = user_id);
create policy "notes_update_own" on public.notes for update using (auth.uid() = user_id);
create policy "notes_delete_own" on public.notes for delete using (auth.uid() = user_id);
create trigger notes_touch before update on public.notes for each row execute function public.touch_updated_at();

-- ============================================================================
-- credentials  (logins & passwords vault)
-- IMPORTANT: passwords are stored as text here, protected only by RLS. For
-- sensitive accounts the client should encrypt before sending; that's tracked
-- as a follow-up. RLS still prevents cross-user reads.
-- ============================================================================
create table public.credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  site text not null,
  url text,
  username text,
  password text,
  category text not null default 'Personal',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index credentials_user_idx on public.credentials (user_id);
alter table public.credentials enable row level security;
create policy "credentials_select_own" on public.credentials for select using (auth.uid() = user_id);
create policy "credentials_insert_own" on public.credentials for insert with check (auth.uid() = user_id);
create policy "credentials_update_own" on public.credentials for update using (auth.uid() = user_id);
create policy "credentials_delete_own" on public.credentials for delete using (auth.uid() = user_id);
create trigger credentials_touch before update on public.credentials
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- reflection_lists + reflection_items  (Growth & Self: strengths/weaknesses/improvements + custom)
-- ============================================================================
create table public.reflection_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind public.reflection_kind not null,
  title text not null,
  hint text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reflection_lists_user_idx on public.reflection_lists (user_id, position);
alter table public.reflection_lists enable row level security;
create policy "reflection_lists_select_own" on public.reflection_lists for select using (auth.uid() = user_id);
create policy "reflection_lists_insert_own" on public.reflection_lists for insert with check (auth.uid() = user_id);
create policy "reflection_lists_update_own" on public.reflection_lists for update using (auth.uid() = user_id);
create policy "reflection_lists_delete_own" on public.reflection_lists for delete using (auth.uid() = user_id);
create trigger reflection_lists_touch before update on public.reflection_lists
  for each row execute function public.touch_updated_at();

create table public.reflection_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.reflection_lists(id) on delete cascade,
  text text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index reflection_items_list_idx on public.reflection_items (list_id, position);
alter table public.reflection_items enable row level security;
create policy "reflection_items_select_own" on public.reflection_items for select
  using (public.user_owns('public.reflection_lists'::regclass, list_id));
create policy "reflection_items_insert_own" on public.reflection_items for insert
  with check (public.user_owns('public.reflection_lists'::regclass, list_id));
create policy "reflection_items_update_own" on public.reflection_items for update
  using (public.user_owns('public.reflection_lists'::regclass, list_id));
create policy "reflection_items_delete_own" on public.reflection_items for delete
  using (public.user_owns('public.reflection_lists'::regclass, list_id));

-- ============================================================================
-- boundary_lists + boundary_items  (Boundaries: expectations / deal_breakers / non_negotiables + custom)
-- ============================================================================
create table public.boundary_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind public.boundary_kind not null,
  title text not null,
  subtitle text,
  color text not null default '#7a9a6e',
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index boundary_lists_user_idx on public.boundary_lists (user_id, position);
alter table public.boundary_lists enable row level security;
create policy "boundary_lists_select_own" on public.boundary_lists for select using (auth.uid() = user_id);
create policy "boundary_lists_insert_own" on public.boundary_lists for insert with check (auth.uid() = user_id);
create policy "boundary_lists_update_own" on public.boundary_lists for update using (auth.uid() = user_id);
create policy "boundary_lists_delete_own" on public.boundary_lists for delete using (auth.uid() = user_id);
create trigger boundary_lists_touch before update on public.boundary_lists
  for each row execute function public.touch_updated_at();

create table public.boundary_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.boundary_lists(id) on delete cascade,
  text text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index boundary_items_list_idx on public.boundary_items (list_id, position);
alter table public.boundary_items enable row level security;
create policy "boundary_items_select_own" on public.boundary_items for select
  using (public.user_owns('public.boundary_lists'::regclass, list_id));
create policy "boundary_items_insert_own" on public.boundary_items for insert
  with check (public.user_owns('public.boundary_lists'::regclass, list_id));
create policy "boundary_items_update_own" on public.boundary_items for update
  using (public.user_owns('public.boundary_lists'::regclass, list_id));
create policy "boundary_items_delete_own" on public.boundary_items for delete
  using (public.user_owns('public.boundary_lists'::regclass, list_id));

-- ============================================================================
-- elegant_phrases  (Speak Eloquently — custom additions)
-- ============================================================================
create table public.elegant_phrases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null default 'Saying No',
  from_text text not null,
  to_text text not null,
  why text,
  created_at timestamptz not null default now()
);

create index elegant_phrases_user_idx on public.elegant_phrases (user_id);
alter table public.elegant_phrases enable row level security;
create policy "elegant_phrases_select_own" on public.elegant_phrases for select using (auth.uid() = user_id);
create policy "elegant_phrases_insert_own" on public.elegant_phrases for insert with check (auth.uid() = user_id);
create policy "elegant_phrases_update_own" on public.elegant_phrases for update using (auth.uid() = user_id);
create policy "elegant_phrases_delete_own" on public.elegant_phrases for delete using (auth.uid() = user_id);

-- ============================================================================
-- cycle_entries  (one row per user per date — flow, mood, symptoms, notes)
-- ============================================================================
create table public.cycle_entries (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  flow public.flow_level not null default 'none',
  mood text,
  symptoms text[] not null default array[]::text[],
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create index cycle_entries_user_idx on public.cycle_entries (user_id, day desc);
alter table public.cycle_entries enable row level security;
create policy "cycle_entries_select_own" on public.cycle_entries for select using (auth.uid() = user_id);
create policy "cycle_entries_insert_own" on public.cycle_entries for insert with check (auth.uid() = user_id);
create policy "cycle_entries_update_own" on public.cycle_entries for update using (auth.uid() = user_id);
create policy "cycle_entries_delete_own" on public.cycle_entries for delete using (auth.uid() = user_id);
create trigger cycle_entries_touch before update on public.cycle_entries
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- vitamins + vitamin_doses
-- ============================================================================
create table public.vitamins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  dose text,
  time_label text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vitamins_user_idx on public.vitamins (user_id, position);
alter table public.vitamins enable row level security;
create policy "vitamins_select_own" on public.vitamins for select using (auth.uid() = user_id);
create policy "vitamins_insert_own" on public.vitamins for insert with check (auth.uid() = user_id);
create policy "vitamins_update_own" on public.vitamins for update using (auth.uid() = user_id);
create policy "vitamins_delete_own" on public.vitamins for delete using (auth.uid() = user_id);
create trigger vitamins_touch before update on public.vitamins for each row execute function public.touch_updated_at();

create table public.vitamin_doses (
  vitamin_id uuid not null references public.vitamins(id) on delete cascade,
  taken_on date not null,
  primary key (vitamin_id, taken_on)
);

create index vitamin_doses_taken_idx on public.vitamin_doses (taken_on);
alter table public.vitamin_doses enable row level security;
create policy "vitamin_doses_select_own" on public.vitamin_doses for select
  using (public.user_owns('public.vitamins'::regclass, vitamin_id));
create policy "vitamin_doses_insert_own" on public.vitamin_doses for insert
  with check (public.user_owns('public.vitamins'::regclass, vitamin_id));
create policy "vitamin_doses_delete_own" on public.vitamin_doses for delete
  using (public.user_owns('public.vitamins'::regclass, vitamin_id));

-- ============================================================================
-- Personal Finance — income, expenses, savings goals, investments, credit scores
-- ============================================================================
create table public.pf_income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source text not null,
  amount numeric(14, 2) not null default 0,
  entry_type public.pf_entry_type not null default 'recurring',
  frequency public.pf_frequency not null default 'monthly',
  entry_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pf_income_user_date_idx on public.pf_income (user_id, entry_date desc);
alter table public.pf_income enable row level security;
create policy "pf_income_select_own" on public.pf_income for select using (auth.uid() = user_id);
create policy "pf_income_insert_own" on public.pf_income for insert with check (auth.uid() = user_id);
create policy "pf_income_update_own" on public.pf_income for update using (auth.uid() = user_id);
create policy "pf_income_delete_own" on public.pf_income for delete using (auth.uid() = user_id);
create trigger pf_income_touch before update on public.pf_income
  for each row execute function public.touch_updated_at();

create table public.pf_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  amount numeric(14, 2) not null default 0,
  category text not null default 'Other',
  entry_type public.pf_entry_type not null default 'one-time',
  frequency public.pf_frequency not null default 'monthly',
  entry_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pf_expenses_user_date_idx on public.pf_expenses (user_id, entry_date desc);
create index pf_expenses_user_type_idx on public.pf_expenses (user_id, entry_type);
alter table public.pf_expenses enable row level security;
create policy "pf_expenses_select_own" on public.pf_expenses for select using (auth.uid() = user_id);
create policy "pf_expenses_insert_own" on public.pf_expenses for insert with check (auth.uid() = user_id);
create policy "pf_expenses_update_own" on public.pf_expenses for update using (auth.uid() = user_id);
create policy "pf_expenses_delete_own" on public.pf_expenses for delete using (auth.uid() = user_id);
create trigger pf_expenses_touch before update on public.pf_expenses
  for each row execute function public.touch_updated_at();

create table public.pf_savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  target_amount numeric(14, 2) not null default 0,
  saved_amount numeric(14, 2) not null default 0,
  deadline date,
  why text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pf_savings_goals_user_idx on public.pf_savings_goals (user_id);
alter table public.pf_savings_goals enable row level security;
create policy "pf_savings_select_own" on public.pf_savings_goals for select using (auth.uid() = user_id);
create policy "pf_savings_insert_own" on public.pf_savings_goals for insert with check (auth.uid() = user_id);
create policy "pf_savings_update_own" on public.pf_savings_goals for update using (auth.uid() = user_id);
create policy "pf_savings_delete_own" on public.pf_savings_goals for delete using (auth.uid() = user_id);
create trigger pf_savings_goals_touch before update on public.pf_savings_goals
  for each row execute function public.touch_updated_at();

create table public.pf_investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  amount numeric(14, 2) not null default 0,
  kind text not null default 'Stocks',
  entry_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pf_investments_user_idx on public.pf_investments (user_id);
alter table public.pf_investments enable row level security;
create policy "pf_investments_select_own" on public.pf_investments for select using (auth.uid() = user_id);
create policy "pf_investments_insert_own" on public.pf_investments for insert with check (auth.uid() = user_id);
create policy "pf_investments_update_own" on public.pf_investments for update using (auth.uid() = user_id);
create policy "pf_investments_delete_own" on public.pf_investments for delete using (auth.uid() = user_id);
create trigger pf_investments_touch before update on public.pf_investments
  for each row execute function public.touch_updated_at();

create table public.pf_credit_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  bureau public.credit_bureau not null,
  score int not null check (score between 300 and 850),
  recorded_on date not null default current_date,
  created_at timestamptz not null default now()
);

create index pf_credit_scores_user_idx on public.pf_credit_scores (user_id, bureau, recorded_on desc);
alter table public.pf_credit_scores enable row level security;
create policy "pf_credit_scores_select_own" on public.pf_credit_scores for select using (auth.uid() = user_id);
create policy "pf_credit_scores_insert_own" on public.pf_credit_scores for insert with check (auth.uid() = user_id);
create policy "pf_credit_scores_update_own" on public.pf_credit_scores for update using (auth.uid() = user_id);
create policy "pf_credit_scores_delete_own" on public.pf_credit_scores for delete using (auth.uid() = user_id);
