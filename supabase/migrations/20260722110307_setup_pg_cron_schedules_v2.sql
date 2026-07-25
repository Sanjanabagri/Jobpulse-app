/*
# Enable pg_cron for daily job-fetch and digest scheduling

1. Creates the pg_cron extension.
2. Schedules two daily jobs via http_post:
   - fetch-jobs: 06:00 UTC daily
   - daily-digest: 07:00 UTC daily (1h after fetch, so new postings are classified first)
3. Idempotent: unschedules are wrapped in DO blocks with exception handling.
*/

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Safe unschedule (ignore "job not found" errors)
DO $$
BEGIN
  PERFORM cron.unschedule('jobpulse-fetch-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('jobpulse-digest-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Schedule fetch-jobs at 06:00 UTC daily
SELECT cron.schedule(
  'jobpulse-fetch-daily',
  '0 6 * * *',
  $$
  SELECT content FROM http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/fetch-jobs',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Schedule daily-digest at 07:00 UTC daily
SELECT cron.schedule(
  'jobpulse-digest-daily',
  '0 7 * * *',
  $$
  SELECT content FROM http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/daily-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
