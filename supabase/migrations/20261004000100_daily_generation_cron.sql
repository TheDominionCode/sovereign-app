-- Schedules the daily generation Edge Function (spec §6). This is a
-- SEPARATE job from the existing Netlify-scheduled publish function
-- (netlify/functions/publish-daily-resets.mts, untouched) — generation and
-- publishing are different concerns, not a duplicate scheduler.
--
-- IMPORTANT — one manual step this migration deliberately does NOT do:
-- it does not (and must not) embed the real service-role key in a file
-- that gets committed to git. Before this cron job can actually call the
-- Edge Function, run the snippet in the comment block at the bottom of
-- this file ONCE, directly in the Supabase SQL editor (never as a
-- migration), with your real service-role key.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Replace <PROJECT_REF> with your actual Supabase project ref before this
-- migration is applied (same ref as NEXT_PUBLIC_SUPABASE_URL).
select cron.schedule(
  'generate-daily-sovereign-content',
  '0 11 * * *', -- 6:00 AM Eastern ≈ 11:00 UTC; adjust to taste
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/generate-daily-sovereign-content',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ---------------------------------------------------------------------
-- ONE-TIME MANUAL STEP (run in the Supabase SQL editor, NOT as a
-- migration — this is the only place the real key should ever appear,
-- and it should never be pasted into a file that gets committed):
--
--   select vault.create_secret('paste-your-real-service-role-key-here', 'service_role_key');
--
-- Without this, the cron job above will fire but the Authorization header
-- will be blank and the Edge Function call will fail with 401 — check
-- supabase.daily_content_generation_logs or cron.job_run_details if the
-- automation doesn't seem to be running.
-- ---------------------------------------------------------------------
