/*
# Admin Feedback Visibility + Visitor Tracking

## Changes

### 1. Feedback table — allow all authenticated users to read all feedback
Currently `select_own_feedback` only lets users see their own feedback.
We need all authenticated users to see all feedback so the admin overview
can display everyone's feedback.

- Drop `select_own_feedback` policy
- Create `select_all_feedback` policy: all authenticated users can SELECT all rows
- Keep INSERT/UPDATE/DELETE scoped to own user_id (unchanged)

### 2. New table: `visitor_sessions`
Tracks every user visit/sign-in to the app.

- `id` (uuid, PK)
- `user_id` (uuid, nullable — null for anonymous visitors)
- `session_id` (text — random per-browser session id)
- `user_email` (text, nullable — denormalized for admin display)
- `user_name` (text, nullable — denormalized for admin display)
- `is_signin` (boolean — true if this was a sign-in event, false for general visit)
- `page` (text, nullable — which page/tab was viewed)
- `created_at` (timestamptz, default now())

### 3. RLS on `visitor_sessions`
- SELECT: all authenticated users can read (for admin overview)
- INSERT: anon + authenticated can insert (to track visits)
- No UPDATE or DELETE needed

### 4. Index on visitor_sessions.created_at for fast time-range queries
*/

-- 1. Update feedback SELECT policy
DROP POLICY IF EXISTS "select_own_feedback" ON feedback;
DROP POLICY IF EXISTS "select_all_feedback" ON feedback;

CREATE POLICY "select_all_feedback"
ON feedback FOR SELECT
TO authenticated USING (true);

-- 2. Create visitor_sessions table
CREATE TABLE IF NOT EXISTS visitor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  user_email text,
  user_name text,
  is_signin boolean NOT NULL DEFAULT false,
  page text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE visitor_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "visitors_select_all" ON visitor_sessions;
CREATE POLICY "visitors_select_all"
ON visitor_sessions FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "visitors_insert_any" ON visitor_sessions;
CREATE POLICY "visitors_insert_any"
ON visitor_sessions FOR INSERT
TO anon, authenticated WITH CHECK (true);

-- 3. Index for time-range queries
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_created_at ON visitor_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_user_id ON visitor_sessions(user_id) WHERE user_id IS NOT NULL;
