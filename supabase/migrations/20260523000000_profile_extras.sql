-- Profile extras: capture full_name and phone at signup so we can run
-- personalized comms (welcome emails, trial-end nudges, win-back, etc.).
-- Auto-populated by the on_auth_user_created trigger from
-- auth.users.raw_user_meta_data, which the signup server action sets via
-- supabase.auth.signUp({ options: { data: { full_name, phone } } }).

alter table public.profiles
  add column if not exists full_name text,
  add column if not exists phone text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  );
  return new;
end;
$$;
