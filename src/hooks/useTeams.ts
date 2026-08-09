import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Team, TeamMember, SharedJob, JobPosting } from '@/types';

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setTeams(data as Team[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const createTeam = useCallback(async (name: string, description?: string) => {
    const { data, error } = await supabase
      .from('teams')
      .insert({ name, description })
      .select()
      .maybeSingle();
    if (error) throw error;
    if (data) {
      setTeams((prev) => [data as Team, ...prev]);
      // Add owner as a team member
      await supabase
        .from('team_members')
        .insert({ team_id: (data as Team).id, role: 'owner', status: 'accepted', joined_at: new Date().toISOString() });
    }
    return data as Team | null;
  }, []);

  const deleteTeam = useCallback(async (id: string) => {
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) throw error;
    setTeams((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { teams, loading, createTeam, deleteTeam, refetch: fetch };
}

export function useTeamMembers(teamId: string | null) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!teamId) { setMembers([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: true });
    if (!error && data) setMembers(data as TeamMember[]);
    setLoading(false);
  }, [teamId]);

  useEffect(() => { fetch(); }, [fetch]);

  const inviteMember = useCallback(async (email: string) => {
    const { data, error } = await supabase
      .from('team_members')
      .insert({ team_id: teamId, invited_email: email, status: 'pending' })
      .select()
      .maybeSingle();
    if (error) throw error;
    if (data) setMembers((prev) => [...prev, data as TeamMember]);
    return data;
  }, [teamId]);

  const removeMember = useCallback(async (id: string) => {
    const { error } = await supabase.from('team_members').delete().eq('id', id);
    if (error) throw error;
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return { members, loading, inviteMember, removeMember, refetch: fetch };
}

export function useSharedJobs(teamId: string | null) {
  const [sharedJobs, setSharedJobs] = useState<SharedJob[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!teamId) { setSharedJobs([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('shared_jobs')
      .select('*, job_postings(*)')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });
    if (!error && data) setSharedJobs(data as SharedJob[]);
    setLoading(false);
  }, [teamId]);

  useEffect(() => { fetch(); }, [fetch]);

  const shareJob = useCallback(async (jobId: string, note?: string) => {
    const { data, error } = await supabase
      .from('shared_jobs')
      .insert({ team_id: teamId, job_id: jobId, note })
      .select()
      .maybeSingle();
    if (error) {
      // Already shared - ignore unique constraint
      if (error.code === '23505') return null;
      throw error;
    }
    if (data) {
      // Fetch the full shared job with job_postings
      const { data: full } = await supabase
        .from('shared_jobs')
        .select('*, job_postings(*)')
        .eq('id', (data as SharedJob).id)
        .maybeSingle();
      if (full) setSharedJobs((prev) => [full as SharedJob, ...prev]);
    }
    return data;
  }, [teamId]);

  const unshareJob = useCallback(async (id: string) => {
    const { error } = await supabase.from('shared_jobs').delete().eq('id', id);
    if (error) throw error;
    setSharedJobs((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { sharedJobs, loading, shareJob, unshareJob, refetch: fetch };
}

export function useUserJobsForSharing() {
  const [savedJobs, setSavedJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('saved_jobs')
        .select('job_postings(*)')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setSavedJobs(data.map((d: any) => d.job_postings as JobPosting).filter(Boolean));
      }
      setLoading(false);
    }
    load();
  }, []);

  return { savedJobs, loading };
}
