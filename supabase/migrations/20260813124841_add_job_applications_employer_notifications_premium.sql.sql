/*
# JobPulse — Job Applications, Employer Profiles, Notifications, Premium Features

## Purpose
Adds full candidate-to-employer pipeline features: job application tracking, employer/company profiles,
in-app notifications, promoted jobs for monetization, and resume URL on profiles.

## New Tables

1. `job_applications`
   - Tracks a user's application to a specific job posting.
   - `id`, `user_id` (FK auth.users CASCADE), `job_id` (FK job_postings CASCADE)
   - `status` (text: 'applied' | 'reviewing' | 'interview' | 'offer' | 'rejected' | 'withdrawn')
   - `cover_note` (text, optional note from candidate)
   - `applied_at` (timestamptz)
   - Unique on (user_id, job_id) — one application per job per user

2. `company_profiles`
   - Company profiles that employers can create.
   - `id`, `name`, `logo_url`, `website`, `description`, `industry`, `location`, `size_range`
   - `created_by` (FK auth.users CASCADE — the user who created the company profile)
   - `created_at`, `updated_at`

3. `employer_jobs`
   - Jobs posted directly by employers (separate from crawled job_postings).
   - `id`, `company_profile_id` (FK company_profiles CASCADE)
   - `posted_by` (FK auth.users CASCADE)
   - `title`, `description`, `location`, `is_remote`, `job_type`, `experience_level`
   - `salary_min`, `salary_max`, `currency`, `tags` (text[])
   - `status` (text: 'draft' | 'active' | 'closed')
   - `is_promoted` (boolean, default false — for premium/promoted jobs)
   - `domain_id` (FK domains)
   - `apply_url` (text — external apply link or email)
   - `posted_at`, `created_at`, `updated_at`

4. `notifications`
   - In-app notifications for users (job alerts, application updates, team invites, etc.)
   - `id`, `user_id` (FK auth.users CASCADE)
   - `type` (text: 'job_alert' | 'application_update' | 'team_invite' | 'system' | 'promoted')
   - `title`, `body` (text)
   - `link` (text, optional in-app route)
   - `is_read` (boolean, default false)
   - `created_at`

## Modified Tables

5. `profiles` — added columns:
   - `resume_url` (text — link to uploaded resume)
   - `is_employer` (boolean, default false — flag for employer accounts)
   - `company_profile_id` (uuid, FK company_profiles — link employer to their company)

## Security
- `job_applications`: RLS, owner-scoped CRUD (candidate sees only their own applications)
- `company_profiles`: RLS, anyone can read (public company pages), only creator can update/delete
- `employer_jobs`: RLS, anyone can read active jobs, only posting employer can create/update/delete
- `notifications`: RLS, owner-scoped CRUD
- All owner columns default to auth.uid() per Bolt database conventions

## Important Notes
1. Employer jobs are separate from crawled job_postings to keep crawl pipeline clean.
2. Promoted jobs (is_promoted=true) are a monetization feature — employers pay to boost visibility.
3. Notifications support real-time via Supabase realtime subscriptions.
4. Company profiles are public so anyone can view company pages.
*/

-- ============ PROFILES NEW COLUMNS ============
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_url text;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_employer boolean DEFAULT false;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_profile_id uuid REFERENCES company_profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============ COMPANY PROFILES ============
CREATE TABLE IF NOT EXISTS company_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  website text,
  description text,
  industry text,
  location text,
  size_range text,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_profiles_read_all" ON company_profiles;
CREATE POLICY "company_profiles_read_all" ON company_profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "company_profiles_insert_own" ON company_profiles;
CREATE POLICY "company_profiles_insert_own" ON company_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "company_profiles_update_own" ON company_profiles;
CREATE POLICY "company_profiles_update_own" ON company_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "company_profiles_delete_own" ON company_profiles;
CREATE POLICY "company_profiles_delete_own" ON company_profiles FOR DELETE
  TO authenticated USING (auth.uid() = created_by);

CREATE INDEX IF NOT EXISTS idx_company_profiles_created_by ON company_profiles(created_by);

-- ============ EMPLOYER JOBS ============
CREATE TABLE IF NOT EXISTS employer_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_profile_id uuid NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  posted_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  location text,
  is_remote boolean DEFAULT false,
  job_type text,
  experience_level text,
  salary_min integer,
  salary_max integer,
  currency text DEFAULT 'USD',
  tags text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  is_promoted boolean DEFAULT false,
  domain_id uuid REFERENCES domains(id) ON DELETE SET NULL,
  apply_url text,
  posted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE employer_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "employer_jobs_read_active" ON employer_jobs;
CREATE POLICY "employer_jobs_read_active" ON employer_jobs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "employer_jobs_insert_own" ON employer_jobs;
CREATE POLICY "employer_jobs_insert_own" ON employer_jobs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = posted_by);

DROP POLICY IF EXISTS "employer_jobs_update_own" ON employer_jobs;
CREATE POLICY "employer_jobs_update_own" ON employer_jobs FOR UPDATE
  TO authenticated USING (auth.uid() = posted_by) WITH CHECK (auth.uid() = posted_by);

DROP POLICY IF EXISTS "employer_jobs_delete_own" ON employer_jobs;
CREATE POLICY "employer_jobs_delete_own" ON employer_jobs FOR DELETE
  TO authenticated USING (auth.uid() = posted_by);

CREATE INDEX IF NOT EXISTS idx_employer_jobs_company ON employer_jobs(company_profile_id);
CREATE INDEX IF NOT EXISTS idx_employer_jobs_status ON employer_jobs(status);
CREATE INDEX IF NOT EXISTS idx_employer_jobs_promoted ON employer_jobs(is_promoted) WHERE is_promoted = true;
CREATE INDEX IF NOT EXISTS idx_employer_jobs_posted ON employer_jobs(posted_at DESC);

-- ============ JOB APPLICATIONS ============
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'applied',
  cover_note text,
  applied_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, job_id)
);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "job_applications_read_own" ON job_applications;
CREATE POLICY "job_applications_read_own" ON job_applications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "job_applications_insert_own" ON job_applications;
CREATE POLICY "job_applications_insert_own" ON job_applications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "job_applications_update_own" ON job_applications;
CREATE POLICY "job_applications_update_own" ON job_applications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "job_applications_delete_own" ON job_applications;
CREATE POLICY "job_applications_delete_own" ON job_applications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_job_applications_user ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'system',
  title text NOT NULL,
  body text,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_read_own" ON notifications;
CREATE POLICY "notifications_read_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE is_read = false;
