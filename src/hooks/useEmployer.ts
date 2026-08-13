import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { CompanyProfile, EmployerJob, EmployerJobStatus } from '@/types';

export function useCompanyProfile() {
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCompany = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('company_profiles')
      .select('*')
      .maybeSingle();
    if (!error && data) setCompany(data as CompanyProfile);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCompany(); }, [fetchCompany]);

  const createCompany = useCallback(async (input: {
    name: string; website?: string; description?: string; industry?: string; location?: string; size_range?: string;
  }) => {
    const { data, error } = await supabase
      .from('company_profiles')
      .insert(input)
      .select('*')
      .single();
    if (error) throw error;
    setCompany(data as CompanyProfile);

    await supabase
      .from('profiles')
      .update({ is_employer: true, company_profile_id: (data as CompanyProfile).id })
      .eq('id', (data as CompanyProfile).created_by);

    return data as CompanyProfile;
  }, []);

  const updateCompany = useCallback(async (id: string, input: Partial<CompanyProfile>) => {
    const { data, error } = await supabase
      .from('company_profiles')
      .update(input)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    setCompany(data as CompanyProfile);
    return data as CompanyProfile;
  }, []);

  return { company, loading, createCompany, updateCompany, refetch: fetchCompany };
}

export function useEmployerJobs() {
  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('employer_jobs')
      .select('*, company_profiles(*), domains(*)')
      .order('created_at', { ascending: false });
    if (!error && data) setJobs(data as EmployerJob[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const createJob = useCallback(async (input: {
    company_profile_id: string; title: string; description?: string; location?: string;
    is_remote?: boolean; job_type?: string; experience_level?: string; salary_min?: number;
    salary_max?: number; currency?: string; tags?: string[]; status?: EmployerJobStatus;
    is_promoted?: boolean; domain_id?: string; apply_url?: string;
  }) => {
    const payload = { ...input, posted_at: input.status === 'active' ? new Date().toISOString() : null };
    const { data, error } = await supabase
      .from('employer_jobs')
      .insert(payload)
      .select('*, company_profiles(*), domains(*)')
      .single();
    if (error) throw error;
    setJobs((prev) => [data as EmployerJob, ...prev]);
    return data as EmployerJob;
  }, []);

  const updateJob = useCallback(async (id: string, input: Partial<EmployerJob>) => {
    const { data, error } = await supabase
      .from('employer_jobs')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, company_profiles(*), domains(*)')
      .single();
    if (error) throw error;
    setJobs((prev) => prev.map((j) => (j.id === id ? (data as EmployerJob) : j)));
    return data as EmployerJob;
  }, []);

  const deleteJob = useCallback(async (id: string) => {
    const { error } = await supabase.from('employer_jobs').delete().eq('id', id);
    if (error) throw error;
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  return { jobs, loading, createJob, updateJob, deleteJob, refetch: fetchJobs };
}

export function usePromotedJobs() {
  const [promoted, setPromoted] = useState<EmployerJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('employer_jobs')
        .select('*, company_profiles(*), domains(*)')
        .eq('is_promoted', true)
        .eq('status', 'active')
        .order('posted_at', { ascending: false })
        .limit(5);
      if (!error && data) setPromoted(data as EmployerJob[]);
      setLoading(false);
    })();
  }, []);

  return { promoted, loading };
}
