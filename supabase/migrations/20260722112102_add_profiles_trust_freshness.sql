/*
# JobPulse — User Profiles + Trust Score + Freshness System

## Purpose
Adds user authentication profiles, a trust scoring system for job postings, and freshness decay labels.
Every job gets a 0-100 trust score and a freshness label; every user gets a verified profile with skills
that powers personalized match scores.

## New Tables

1. `profiles`
   - Extended user profile linked to Supabase auth.users. Auto-created on signup via trigger.
   - `id` (uuid PK, FK to auth.users CASCADE)
   - `full_name`, `headline`, `bio` (text)
   - `preferred_domain_id` (uuid FK to domains)
   - `skills` (text[])
   - `experience_years` (integer)
   - `current_job_title`, `current_company` (text — renamed from current_role to avoid PG reserved word)
   - `location`, `preferred_location` (text)
   - `remote_only` (boolean)
   - `salary_expectation_min` (integer), `salary_expectation_currency` (text)
   - `profile_completed` (boolean — drives onboarding flow)
   - `verified` (boolean — verification badge)
   - `created_at`, `updated_at`

2. `saved_jobs`
   - Bookmark jobs. `user_id` FK auth.users CASCADE, `job_id` FK job_postings CASCADE. Unique pair.

## Modified Tables

3. `job_postings` — added columns:
   - `trust_score` (integer 0-100, default 50)
   - `freshness_label` (text: 'fresh'|'active'|'aging'|'stale')
   - `company_website` (text)
   - `has_salary` (boolean)

## Security
- `profiles`: RLS, authenticated can read all (community), only owner can write/delete.
- `saved_jobs`: RLS, owner-scoped CRUD.
- Triggers: auto-create profile on signup, auto-update updated_at.

## Backfill
- Existing jobs get freshness_label computed from posted_at age.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  headline text DEFAULT '',
  bio text DEFAULT '',
  preferred_domain_id uuid REFERENCES domains(id) ON DELETE SET NULL,
  skills text[] DEFAULT '{}',
  experience_years integer DEFAULT 0,
  current_job_title text DEFAULT '',
  current_company text DEFAULT '',
  location text DEFAULT '',
  preferred_location text DEFAULT '',
  remote_only boolean DEFAULT false,
  salary_expectation_min integer,
  salary_expectation_currency text DEFAULT 'USD',
  profile_completed boolean DEFAULT false,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_read_all" ON profiles;
CREATE POLICY "profiles_read_all" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- ============ SAVED JOBS ============
CREATE TABLE IF NOT EXISTS saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, job_id)
);

ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_jobs_read_own" ON saved_jobs;
CREATE POLICY "saved_jobs_read_own" ON saved_jobs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_jobs_insert_own" ON saved_jobs;
CREATE POLICY "saved_jobs_insert_own" ON saved_jobs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_jobs_delete_own" ON saved_jobs;
CREATE POLICY "saved_jobs_delete_own" ON saved_jobs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_user ON saved_jobs(user_id);

-- ============ JOB POSTINGS NEW COLUMNS ============
DO $$ BEGIN
  ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS trust_score integer DEFAULT 50;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS freshness_label text DEFAULT 'active';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS company_website text;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS has_salary boolean DEFAULT false;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_job_postings_trust ON job_postings(trust_score DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_freshness ON job_postings(freshness_label);

-- ============ BACKFILL EXISTING JOBS ============
UPDATE job_postings SET freshness_label = CASE
  WHEN posted_at >= now() - interval '1 day' THEN 'fresh'
  WHEN posted_at >= now() - interval '7 days' THEN 'active'
  WHEN posted_at >= now() - interval '30 days' THEN 'aging'
  ELSE 'stale'
END WHERE posted_at IS NOT NULL;

-- ============ TRIGGER: AUTO-CREATE PROFILE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ TRIGGER: UPDATE updated_at ON PROFILES ============
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
