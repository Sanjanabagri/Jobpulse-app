/*
# Add Admin Role + Lock Down Feedback/Visitors to Admin

## Changes

### 1. Add `is_admin` column to `profiles`
- `is_admin boolean NOT NULL DEFAULT false`
- Only the app owner can be admin (set manually via SQL)
- All existing users default to `is_admin = false`

### 2. Restrict feedback SELECT to admin-only
- Drop `select_all_feedback` (currently allows all authenticated users to see all feedback)
- Create `select_all_feedback_admin`: only users where `profiles.is_admin = true` can SELECT all feedback
- Create `select_own_feedback`: regular users can still see their own feedback (for the Feedback tab)
- INSERT/UPDATE/DELETE policies remain unchanged (own user_id scoped)

### 3. Restrict visitor_sessions SELECT to admin-only
- Drop `visitors_select_all`
- Create `visitors_select_admin`: only admin users can read visitor sessions
- INSERT policy unchanged (anon + authenticated can still insert to track visits)

### 4. Update app_ratings SELECT to admin-only for all-ratings view
- Drop `select_all_ratings` (currently allows all authenticated users to see all ratings)
- Create `select_all_ratings_admin`: only admin can see all ratings
- Create `select_own_rating`: regular users can see only their own rating
- INSERT/UPDATE/DELETE policies unchanged

## Security Notes
- Admin check uses: `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)`
- Regular users can still submit feedback and ratings (INSERT unchanged)
- Regular users can see their own feedback/ratings in the Feedback tab
- Only admin sees the Admin Overview tab with everyone's data
*/
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- 2. Feedback: admin sees all, users see own
DROP POLICY IF EXISTS "select_all_feedback" ON feedback;
DROP POLICY IF EXISTS "select_all_feedback_admin" ON feedback;
DROP POLICY IF EXISTS "select_own_feedback" ON feedback;

CREATE POLICY "select_all_feedback_admin"
ON feedback FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "select_own_feedback"
ON feedback FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. Visitor sessions: admin-only SELECT
DROP POLICY IF EXISTS "visitors_select_all" ON visitor_sessions;
DROP POLICY IF EXISTS "visitors_select_admin" ON visitor_sessions;

CREATE POLICY "visitors_select_admin"
ON visitor_sessions FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- 4. App ratings: admin sees all, users see own
DROP POLICY IF EXISTS "select_all_ratings" ON app_ratings;
DROP POLICY IF EXISTS "select_all_ratings_admin" ON app_ratings;
DROP POLICY IF EXISTS "select_own_rating" ON app_ratings;

CREATE POLICY "select_all_ratings_admin"
ON app_ratings FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "select_own_rating"
ON app_ratings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
