/*
# Add Feedback, Ratings, and Teams Tables (Schema Only)

## Purpose
Creates tables for feedback, app ratings, teams, team members, and shared jobs.

## New Tables
1. `feedback` — user feedback (bugs, feature requests, general, praise)
2. `app_ratings` — 1-5 star ratings, one per user
3. `teams` — team groups with owner
4. `team_members` — membership/invites for teams
5. `shared_jobs` — jobs shared within a team

RLS enabled on all tables. Policies added in a follow-up migration.
*/

-- ===== FEEDBACK =====
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'general',
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- ===== APP RATINGS =====
CREATE TABLE IF NOT EXISTS app_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE app_ratings ENABLE ROW LEVEL SECURITY;

-- ===== TEAMS =====
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- ===== TEAM MEMBERS =====
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  invited_email text,
  status text NOT NULL DEFAULT 'pending',
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id),
  UNIQUE(team_id, invited_email)
);
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- ===== SHARED JOBS =====
CREATE TABLE IF NOT EXISTS shared_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, job_id)
);
ALTER TABLE shared_jobs ENABLE ROW LEVEL SECURITY;

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_app_ratings_user_id ON app_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_jobs_team_id ON shared_jobs(team_id);
