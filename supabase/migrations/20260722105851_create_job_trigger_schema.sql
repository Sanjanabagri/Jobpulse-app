/*
# JobPulse — Daily Job-Trigger Platform Schema

## Purpose
A community platform where an agent crawls job portals (RemoteOK, Arbeitnow, and other free APIs),
classifies each posting into a domain, and delivers daily job triggers to subscribers based on
their chosen domains. Includes an AI chatbot for natural-language job discovery.

## New Tables

1. `domains`
   - Lookup table of job domains (e.g. Frontend, Backend, DevOps, Data Science, Mobile, Design, Product, Security, Blockchain, QA).
   - `id` (uuid PK), `slug` (unique short name), `name` (display), `icon` (lucide icon name), `color` (tailwind class), `description`, `created_at`.

2. `job_sources`
   - Tracks each external job portal we aggregate from.
   - `id` (uuid PK), `name`, `slug`, `api_url`, `is_active`, `last_fetched_at`, `created_at`.

3. `job_postings`
   - Stores every aggregated job posting, deduplicated by `external_id` + `source_id`.
   - `id` (uuid PK), `external_id`, `source_id` (FK), `domain_id` (FK, nullable until classified), `title`, `company`, `company_logo`, `description`, `location`, `is_remote`, `job_type`, `salary_min`, `salary_max`, `currency`, `experience`, `tags` (text[]), `apply_url`, `posted_at` (when the source posted it), `fetched_at` (when we ingested it), `created_at`.
   - Unique constraint on `(external_id, source_id)` for deduplication.

4. `subscriptions`
   - Community members who want daily triggers.
   - `id` (uuid PK), `email` (unique), `name`, `domain_ids` (uuid[] of preferred domains), `location_pref`, `remote_only`, `is_active`, `created_at`.
   - No auth required — community is email-based.

5. `daily_digests`
   - One row per domain per day, recording the trigger that was sent to subscribers.
   - `id` (uuid PK), `digest_date` (date), `domain_id` (FK), `job_count`, `top_companies` (text[]), `new_job_ids` (uuid[]), `trigger_sent` (bool), `created_at`.
   - Unique on `(digest_date, domain_id)`.

## Security
- RLS enabled on all tables.
- No auth screen in this app (email-based community), so policies use `TO anon, authenticated` — the anon-key frontend can read public job data and create subscriptions; writes to job_postings/domains/sources/digests are also allowed anon because the edge functions (which use the service role, bypassing RLS) are the real writers, but we keep anon open so the frontend seed/admin tools and the community can interact.

## Important Notes
1. Edge functions use the service role key, which bypasses RLS — they can write freely.
2. The frontend anon client can READ all public job data and CREATE subscriptions.
3. `job_postings.domain_id` is nullable because the fetcher classifies after insert; classification runs in the fetch edge function.
4. Deduplication is enforced by the unique constraint on (external_id, source_id).
*/

-- ============ DOMAINS ============
CREATE TABLE IF NOT EXISTS domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'Briefcase',
  color text NOT NULL DEFAULT 'bg-slate-500',
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_domains" ON domains;
CREATE POLICY "anon_read_domains" ON domains FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_domains" ON domains;
CREATE POLICY "anon_write_domains" ON domains FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_domains" ON domains;
CREATE POLICY "anon_update_domains" ON domains FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ============ JOB SOURCES ============
CREATE TABLE IF NOT EXISTS job_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  api_url text,
  is_active boolean DEFAULT true,
  last_fetched_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE job_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_job_sources" ON job_sources;
CREATE POLICY "anon_read_job_sources" ON job_sources FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_job_sources" ON job_sources;
CREATE POLICY "anon_write_job_sources" ON job_sources FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_job_sources" ON job_sources;
CREATE POLICY "anon_update_job_sources" ON job_sources FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ============ JOB POSTINGS ============
CREATE TABLE IF NOT EXISTS job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text NOT NULL,
  source_id uuid REFERENCES job_sources(id) ON DELETE CASCADE,
  domain_id uuid REFERENCES domains(id) ON DELETE SET NULL,
  title text NOT NULL,
  company text NOT NULL,
  company_logo text,
  description text,
  location text,
  is_remote boolean DEFAULT false,
  job_type text,
  salary_min integer,
  salary_max integer,
  currency text DEFAULT 'USD',
  experience text,
  tags text[] DEFAULT '{}',
  apply_url text,
  posted_at timestamptz,
  fetched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(external_id, source_id)
);

ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_job_postings" ON job_postings;
CREATE POLICY "anon_read_job_postings" ON job_postings FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_job_postings" ON job_postings;
CREATE POLICY "anon_insert_job_postings" ON job_postings FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_job_postings" ON job_postings;
CREATE POLICY "anon_update_job_postings" ON job_postings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_job_postings_domain ON job_postings(domain_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_fetched ON job_postings(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_posted ON job_postings(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_remote ON job_postings(is_remote);

-- ============ SUBSCRIPTIONS ============
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  domain_ids uuid[] DEFAULT '{}',
  location_pref text,
  remote_only boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_subscriptions" ON subscriptions;
CREATE POLICY "anon_read_subscriptions" ON subscriptions FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_subscriptions" ON subscriptions;
CREATE POLICY "anon_insert_subscriptions" ON subscriptions FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_subscriptions" ON subscriptions;
CREATE POLICY "anon_update_subscriptions" ON subscriptions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ============ DAILY DIGESTS ============
CREATE TABLE IF NOT EXISTS daily_digests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  digest_date date NOT NULL,
  domain_id uuid REFERENCES domains(id) ON DELETE CASCADE,
  job_count integer DEFAULT 0,
  top_companies text[] DEFAULT '{}',
  new_job_ids uuid[] DEFAULT '{}',
  trigger_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(digest_date, domain_id)
);

ALTER TABLE daily_digests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_daily_digests" ON daily_digests;
CREATE POLICY "anon_read_daily_digests" ON daily_digests FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_daily_digests" ON daily_digests;
CREATE POLICY "anon_insert_daily_digests" ON daily_digests FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_daily_digests" ON daily_digests;
CREATE POLICY "anon_update_daily_digests" ON daily_digests FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_daily_digests_date ON daily_digests(digest_date DESC);

-- ============ SEED DATA ============
INSERT INTO domains (slug, name, icon, color, description) VALUES
  ('frontend', 'Frontend', 'MonitorSmartphone', 'bg-sky-500', 'React, Vue, Angular, UI/UX engineering'),
  ('backend', 'Backend', 'Server', 'bg-emerald-500', 'Node.js, Python, Go, Java, API & server engineering'),
  ('fullstack', 'Full Stack', 'Layers', 'bg-violet-500', 'End-to-end web application development'),
  ('devops', 'DevOps & Cloud', 'Cloud', 'bg-orange-500', 'AWS, GCP, Azure, Kubernetes, CI/CD, SRE'),
  ('data-science', 'Data & AI', 'BrainCircuit', 'bg-pink-500', 'Machine learning, data engineering, analytics, AI'),
  ('mobile', 'Mobile', 'Smartphone', 'bg-cyan-500', 'iOS, Android, React Native, Flutter'),
  ('design', 'Design', 'Palette', 'bg-rose-500', 'Product design, UX/UI, graphic, brand'),
  ('product', 'Product', 'Target', 'bg-amber-500', 'Product management, strategy, operations'),
  ('security', 'Security', 'ShieldCheck', 'bg-red-500', 'Cybersecurity, AppSec, pen-testing, compliance'),
  ('blockchain', 'Blockchain', 'Boxes', 'bg-indigo-500', 'Web3, smart contracts, DeFi, Solidity'),
  ('qa', 'QA & Testing', 'Bug', 'bg-lime-600', 'Test automation, QA engineering, SDET'),
  ('devrel', 'DevRel & Community', 'Megaphone', 'bg-teal-500', 'Developer relations, advocacy, community')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO job_sources (name, slug, api_url, is_active) VALUES
  ('RemoteOK', 'remoteok', 'https://remoteok.com/api', true),
  ('Arbeitnow', 'arbeitnow', 'https://www.arbeitnow.com/api/job-board-api', true),
  ('Manual / Community Submit', 'manual', NULL, true)
ON CONFLICT (slug) DO NOTHING;
