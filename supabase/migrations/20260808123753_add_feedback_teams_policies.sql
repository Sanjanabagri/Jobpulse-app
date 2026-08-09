/*
# Add RLS Policies for Feedback, Ratings, Teams, Members, Shared Jobs

## Security Changes
- feedback: owner-scoped CRUD
- app_ratings: anyone authenticated can SELECT all (for averages); owner-scoped insert/update/delete
- teams: owner can CRUD; members can SELECT
- team_members: team owner or self can manage; team members can SELECT
- shared_jobs: team members can SELECT/INSERT; owner or sharer can DELETE
*/

-- ===== FEEDBACK POLICIES =====
DROP POLICY IF EXISTS "select_own_feedback" ON feedback;
CREATE POLICY "select_own_feedback" ON feedback FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_feedback" ON feedback;
CREATE POLICY "insert_own_feedback" ON feedback FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_feedback" ON feedback;
CREATE POLICY "update_own_feedback" ON feedback FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_feedback" ON feedback;
CREATE POLICY "delete_own_feedback" ON feedback FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===== APP RATINGS POLICIES =====
DROP POLICY IF EXISTS "select_all_ratings" ON app_ratings;
CREATE POLICY "select_all_ratings" ON app_ratings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_rating" ON app_ratings;
CREATE POLICY "insert_own_rating" ON app_ratings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_rating" ON app_ratings;
CREATE POLICY "update_own_rating" ON app_ratings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_rating" ON app_ratings;
CREATE POLICY "delete_own_rating" ON app_ratings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===== TEAMS POLICIES =====
DROP POLICY IF EXISTS "select_team_if_member" ON teams;
CREATE POLICY "select_team_if_member" ON teams FOR SELECT
  TO authenticated USING (
    auth.uid() = owner_id OR
    EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = teams.id AND team_members.user_id = auth.uid() AND team_members.status = 'accepted')
  );

DROP POLICY IF EXISTS "insert_team_if_owner" ON teams;
CREATE POLICY "insert_team_if_owner" ON teams FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_team_if_owner" ON teams;
CREATE POLICY "update_team_if_owner" ON teams FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "delete_team_if_owner" ON teams;
CREATE POLICY "delete_team_if_owner" ON teams FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

-- ===== TEAM MEMBERS POLICIES =====
DROP POLICY IF EXISTS "select_members_if_in_team" ON team_members;
CREATE POLICY "select_members_if_in_team" ON team_members FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = team_members.team_id AND teams.owner_id = auth.uid())
    OR team_members.user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM team_members tm2 WHERE tm2.team_id = team_members.team_id AND tm2.user_id = auth.uid() AND tm2.status = 'accepted')
  );

DROP POLICY IF EXISTS "insert_member_if_team_owner" ON team_members;
CREATE POLICY "insert_member_if_team_owner" ON team_members FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = team_id AND teams.owner_id = auth.uid())
    OR auth.uid() = user_id
  );

DROP POLICY IF EXISTS "update_member_self_or_owner" ON team_members;
CREATE POLICY "update_member_self_or_owner" ON team_members FOR UPDATE
  TO authenticated USING (
    team_members.user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM teams WHERE teams.id = team_members.team_id AND teams.owner_id = auth.uid())
  )
  WITH CHECK (
    team_members.user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM teams WHERE teams.id = team_members.team_id AND teams.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_member_if_owner_or_self" ON team_members;
CREATE POLICY "delete_member_if_owner_or_self" ON team_members FOR DELETE
  TO authenticated USING (
    team_members.user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM teams WHERE teams.id = team_members.team_id AND teams.owner_id = auth.uid())
  );

-- ===== SHARED JOBS POLICIES =====
DROP POLICY IF EXISTS "select_shared_if_team_member" ON shared_jobs;
CREATE POLICY "select_shared_if_team_member" ON shared_jobs FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = shared_jobs.team_id AND teams.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = shared_jobs.team_id AND team_members.user_id = auth.uid() AND team_members.status = 'accepted')
  );

DROP POLICY IF EXISTS "insert_shared_if_team_member" ON shared_jobs;
CREATE POLICY "insert_shared_if_team_member" ON shared_jobs FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = shared_jobs.team_id AND teams.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = shared_jobs.team_id AND team_members.user_id = auth.uid() AND team_members.status = 'accepted')
  );

DROP POLICY IF EXISTS "delete_shared_if_team_member" ON shared_jobs;
CREATE POLICY "delete_shared_if_team_member" ON shared_jobs FOR DELETE
  TO authenticated USING (
    shared_jobs.shared_by = auth.uid()
    OR EXISTS (SELECT 1 FROM teams WHERE teams.id = shared_jobs.team_id AND teams.owner_id = auth.uid())
  );
