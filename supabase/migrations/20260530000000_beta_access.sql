-- Beta access: friends-and-family testers get into /app without a Stripe
-- subscription. The signup flow stamps `beta_until` on the profile row when
-- a valid invite cookie is present; the subscription gate honors it.

alter table public.profiles
  add column if not exists beta_until timestamptz;

-- The on_auth_user_created trigger needs to copy beta_until from
-- auth.users.raw_user_meta_data (set by signUpWithPasswordAction when the
-- invite cookie is present).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  beta_until_str text;
  beta_until_ts timestamptz;
begin
  beta_until_str := nullif(new.raw_user_meta_data ->> 'beta_until', '');
  if beta_until_str is not null then
    begin
      beta_until_ts := beta_until_str::timestamptz;
    exception when others then
      beta_until_ts := null;
    end;
  end if;

  insert into public.profiles (id, email, full_name, phone, beta_until)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    beta_until_ts
  );
  return new;
end;
$$;
