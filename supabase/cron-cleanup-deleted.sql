-- Run AFTER deploying the Edge Function "cleanup-deleted" and creating Vault secrets.
-- This schedules a daily purge of files that have been soft-deleted for more than 5 days.
--
-- 1) Create secrets in Supabase Dashboard → SQL Editor (or Vault):
--    vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'project_url');
--    vault.create_secret('YOUR_SERVICE_ROLE_KEY', 'service_role_key');
--
-- 2) Deploy the function: supabase functions deploy cleanup-deleted
--
-- 3) Run this block (replace job name if you already have one):

SELECT cron.schedule(
  'cleanup-deleted-files',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/cleanup-deleted',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  ) AS request_id;
  $$
);

-- To remove the job later: SELECT cron.unschedule('cleanup-deleted-files');
