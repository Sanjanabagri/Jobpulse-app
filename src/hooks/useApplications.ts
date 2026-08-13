import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { JobApplication, ApplicationStatus } from '@/types';

export function useJobApplications() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('job_applications')
      .select('*, job_postings(*)')
      .order('applied_at', { ascending: false });
    if (!error && data) setApplications(data as JobApplication[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const applyToJob = useCallback(async (jobId: string, coverNote?: string) => {
    const { data, error } = await supabase
      .from('job_applications')
      .insert({ job_id: jobId, cover_note: coverNote || null })
      .select('*, job_postings(*)')
      .single();
    if (error) throw error;
    setApplications((prev) => [data as JobApplication, ...prev]);
    return data as JobApplication;
  }, []);

  const updateStatus = useCallback(async (id: string, status: ApplicationStatus) => {
    const { error } = await supabase
      .from('job_applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }, []);

  const withdrawApplication = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('job_applications')
      .delete()
      .eq('id', id);
    if (error) throw error;
    setApplications((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const hasApplied = useCallback((jobId: string) => {
    return applications.some((a) => a.job_id === jobId);
  }, [applications]);

  return { applications, loading, applyToJob, updateStatus, withdrawApplication, hasApplied, refetch: fetchApplications };
}
