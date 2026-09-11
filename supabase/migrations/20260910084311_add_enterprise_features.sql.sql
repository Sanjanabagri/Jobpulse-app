/*
# Enterprise Features: Work History, Education, Resumes, Company Reviews, Job Alerts, Employer ATS

## New Tables

1. `work_experience` — User work history timeline (multiple entries per user)
   - id, user_id (auth.uid default), company, title, start_date, end_date (null = current), 
     description, location, is_current

2. `educations` — User education history
   - id, user_id (auth.uid default), institution, degree, field_of_study, start_year, end_year,
     grade_percentage, description

3. `resumes` — User resume file references (Supabase Storage paths)
   - id, user_id (auth.uid default), file_path, file_name, file_size, is_active (only one active at a time)

4. `company_reviews` — Reviews of companies by users (for Glassdoor-like feature)
   - id, user_id (auth.uid default), company_name, rating (1-5), title, pros, cons, would_recommend,
     job_title, employment_status, created_at

5. `job_alerts` — Saved search alerts (user creates filter criteria, gets notified)
   - id, user_id (auth.uid default), name, domain_id, keywords, is_remote, job_type, min_trust_score,
     is_active, last_triggered_at

6. `employer_applications` — Full application pipeline for employer-posted jobs
   - id, job_id (FK employer_jobs), applicant_user_id (auth.uid default), cover_note, resume_path,
     status (applied/screening/interview/offer/rejected/hired), employer_notes, applied_at, updated_at

## Modified Tables
- `job_applications` — ADD COLUMN cover_note text (was in type but missing from DB)

## Security
- All new tables: RLS enabled, owner-scoped CRUD (4 policies each)
- `employer_applications`: employer (job owner) can SELECT applications on their jobs; applicant can SELECT their own
- `company_reviews`: all authenticated can read, only owner can insert/update/delete their own

## Important Notes
- `work_experience`, `educations`, `resumes`, `job_alerts`: standard owner-scoped (auth.uid = user_id)
- `employer_applications`: dual access — applicant sees own, employer sees applications on jobs they posted
- `company_reviews`: public read (all authenticated), owner-scoped writes
*/

-- 1. Work Experience
CREATE TABLE IF NOT EXISTS work_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  company text NOT NULL,
  title text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  description text,
  location text,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE work_experience ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_work_experience" ON work_experience;
CREATE POLICY "select_own_work_experience" ON work_experience FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_work_experience" ON work_experience;
CREATE POLICY "insert_own_work_experience" ON work_experience FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_work_experience" ON work_experience;
CREATE POLICY "update_own_work_experience" ON work_experience FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_work_experience" ON work_experience;
CREATE POLICY "delete_own_work_experience" ON work_experience FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 2. Educations
CREATE TABLE IF NOT EXISTS educations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  institution text NOT NULL,
  degree text NOT NULL,
  field_of_study text,
  start_year int,
  end_year int,
  grade_percentage text,
  description text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE educations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_educations" ON educations;
CREATE POLICY "select_own_educations" ON educations FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_educations" ON educations;
CREATE POLICY "insert_own_educations" ON educations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_educations" ON educations;
CREATE POLICY "update_own_educations" ON educations FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_educations" ON educations;
CREATE POLICY "delete_own_educations" ON educations FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 3. Resumes
CREATE TABLE IF NOT EXISTS resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_resumes" ON resumes;
CREATE POLICY "select_own_resumes" ON resumes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_resumes" ON resumes;
CREATE POLICY "insert_own_resumes" ON resumes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_resumes" ON resumes;
CREATE POLICY "update_own_resumes" ON resumes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_resumes" ON resumes;
CREATE POLICY "delete_own_resumes" ON resumes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 4. Company Reviews
CREATE TABLE IF NOT EXISTS company_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  pros text,
  cons text,
  would_recommend boolean NOT NULL DEFAULT true,
  job_title text,
  employment_status text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE company_reviews ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read reviews (public read)
DROP POLICY IF EXISTS "select_all_company_reviews" ON company_reviews;
CREATE POLICY "select_all_company_reviews" ON company_reviews FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_company_review" ON company_reviews;
CREATE POLICY "insert_own_company_review" ON company_reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_company_review" ON company_reviews;
CREATE POLICY "update_own_company_review" ON company_reviews FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_company_review" ON company_reviews;
CREATE POLICY "delete_own_company_review" ON company_reviews FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 5. Job Alerts
CREATE TABLE IF NOT EXISTS job_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  domain_id uuid,
  keywords text,
  is_remote boolean,
  job_type text,
  min_trust_score int,
  is_active boolean NOT NULL DEFAULT true,
  last_triggered_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE job_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_job_alerts" ON job_alerts;
CREATE POLICY "select_own_job_alerts" ON job_alerts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_job_alerts" ON job_alerts;
CREATE POLICY "insert_own_job_alerts" ON job_alerts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_job_alerts" ON job_alerts;
CREATE POLICY "update_own_job_alerts" ON job_alerts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_job_alerts" ON job_alerts;
CREATE POLICY "delete_own_job_alerts" ON job_alerts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 6. Employer Applications (ATS pipeline for employer-posted jobs)
CREATE TABLE IF NOT EXISTS employer_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES employer_jobs(id) ON DELETE CASCADE,
  applicant_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_note text,
  resume_path text,
  status text NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','screening','interview','offer','rejected','hired')),
  employer_notes text,
  applied_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE employer_applications ENABLE ROW LEVEL SECURITY;

-- Applicant can see their own applications
DROP POLICY IF EXISTS "select_own_employer_applications" ON employer_applications;
CREATE POLICY "select_own_employer_applications" ON employer_applications FOR SELECT
  TO authenticated USING (auth.uid() = applicant_user_id);
-- Employer (job owner) can see applications on their jobs
DROP POLICY IF EXISTS "select_employer_job_applications" ON employer_applications;
CREATE POLICY "select_employer_job_applications" ON employer_applications FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM employer_jobs ej WHERE ej.id = employer_applications.job_id AND ej.company_profile_id IN (SELECT id FROM company_profiles WHERE created_by = auth.uid()))
  );
-- Only applicant can insert their own application
DROP POLICY IF EXISTS "insert_own_employer_application" ON employer_applications;
CREATE POLICY "insert_own_employer_application" ON employer_applications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = applicant_user_id);
-- Employer can update status/notes on applications for their jobs; applicant can withdraw (update own)
DROP POLICY IF EXISTS "update_employer_application" ON employer_applications;
CREATE POLICY "update_employer_application" ON employer_applications FOR UPDATE
  TO authenticated USING (
    auth.uid() = applicant_user_id
    OR EXISTS (SELECT 1 FROM employer_jobs ej WHERE ej.id = employer_applications.job_id AND ej.company_profile_id IN (SELECT id FROM company_profiles WHERE created_by = auth.uid()))
  )
  WITH CHECK (
    auth.uid() = applicant_user_id
    OR EXISTS (SELECT 1 FROM employer_jobs ej WHERE ej.id = employer_applications.job_id AND ej.company_profile_id IN (SELECT id FROM company_profiles WHERE created_by = auth.uid()))
  );
-- Only applicant can delete (withdraw) their own application
DROP POLICY IF EXISTS "delete_own_employer_application" ON employer_applications;
CREATE POLICY "delete_own_employer_application" ON employer_applications FOR DELETE
  TO authenticated USING (auth.uid() = applicant_user_id);

-- Add cover_note column to job_applications if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'cover_note') THEN
    ALTER TABLE job_applications ADD COLUMN cover_note text;
  END IF;
END $$;

-- Add resume_path column to job_applications if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'resume_path') THEN
    ALTER TABLE job_applications ADD COLUMN resume_path text;
  END IF;
END $$;

-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for resumes bucket (only owner can read/write their own files)
DROP POLICY IF EXISTS "select_own_resumes_storage" ON storage.objects;
CREATE POLICY "select_own_resumes_storage" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'resumes' AND owner = auth.uid());
DROP POLICY IF EXISTS "insert_own_resumes_storage" ON storage.objects;
CREATE POLICY "insert_own_resumes_storage" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'resumes' AND owner = auth.uid());
DROP POLICY IF EXISTS "update_own_resumes_storage" ON storage.objects;
CREATE POLICY "update_own_resumes_storage" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'resumes' AND owner = auth.uid());
DROP POLICY IF EXISTS "delete_own_resumes_storage" ON storage.objects;
CREATE POLICY "delete_own_resumes_storage" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'resumes' AND owner = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_work_experience_user ON work_experience(user_id);
CREATE INDEX IF NOT EXISTS idx_educations_user ON educations(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_user ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_company_reviews_company ON company_reviews(company_name);
CREATE INDEX IF NOT EXISTS idx_job_alerts_user ON job_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_employer_applications_job ON employer_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_employer_applications_applicant ON employer_applications(applicant_user_id);
