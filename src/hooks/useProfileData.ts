import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { WorkExperience, Education, Resume, CompanyReview, JobAlert, EmployerApplication, EmployerApplicationStatus } from '@/types';

// ============ WORK EXPERIENCE ============

export function useWorkExperience() {
  const [items, setItems] = useState<WorkExperience[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('work_experience')
      .select('*')
      .order('is_current', { ascending: false })
      .order('start_date', { ascending: false });
    if (!error && data) setItems(data as WorkExperience[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const add = useCallback(async (input: Omit<WorkExperience, 'id' | 'user_id' | 'created_at'>) => {
    const { data, error } = await supabase.from('work_experience').insert(input).select('*').single();
    if (error) throw error;
    setItems((prev) => [data as WorkExperience, ...prev]);
    return data as WorkExperience;
  }, []);

  const update = useCallback(async (id: string, input: Partial<WorkExperience>) => {
    const { data, error } = await supabase.from('work_experience').update(input).eq('id', id).select('*').single();
    if (error) throw error;
    setItems((prev) => prev.map((w) => (w.id === id ? (data as WorkExperience) : w)));
  }, []);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from('work_experience').delete().eq('id', id);
    if (error) throw error;
    setItems((prev) => prev.filter((w) => w.id !== id));
  }, []);

  return { items, loading, add, update, remove, refetch: fetch };
}

// ============ EDUCATION ============

export function useEducations() {
  const [items, setItems] = useState<Education[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('educations')
      .select('*')
      .order('end_year', { ascending: false });
    if (!error && data) setItems(data as Education[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const add = useCallback(async (input: Omit<Education, 'id' | 'user_id' | 'created_at'>) => {
    const { data, error } = await supabase.from('educations').insert(input).select('*').single();
    if (error) throw error;
    setItems((prev) => [...prev, data as Education]);
    return data as Education;
  }, []);

  const update = useCallback(async (id: string, input: Partial<Education>) => {
    const { data, error } = await supabase.from('educations').update(input).eq('id', id).select('*').single();
    if (error) throw error;
    setItems((prev) => prev.map((e) => (e.id === id ? (data as Education) : e)));
  }, []);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from('educations').delete().eq('id', id);
    if (error) throw error;
    setItems((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { items, loading, add, update, remove, refetch: fetch };
}

// ============ RESUMES ============

export function useResumes() {
  const [items, setItems] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setItems(data as Resume[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const upload = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}.${ext}`;
    const filePath = `${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, file);
    if (uploadError) throw uploadError;

    // Deactivate previous resumes
    await supabase.from('resumes').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');

    const { data, error } = await supabase
      .from('resumes')
      .insert({ file_path: filePath, file_name: file.name, file_size: file.size, is_active: true })
      .select('*')
      .single();
    if (error) throw error;
    setItems((prev) => [data as Resume, ...prev.map((r) => ({ ...r, is_active: false }))]);
    return data as Resume;
  }, []);

  const remove = useCallback(async (id: string, filePath: string) => {
    await supabase.storage.from('resumes').remove([filePath]);
    const { error } = await supabase.from('resumes').delete().eq('id', id);
    if (error) throw error;
    setItems((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const setActive = useCallback(async (id: string) => {
    await supabase.from('resumes').update({ is_active: false }).neq('id', id);
    const { error } = await supabase.from('resumes').update({ is_active: true }).eq('id', id);
    if (error) throw error;
    setItems((prev) => prev.map((r) => ({ ...r, is_active: r.id === id })));
  }, []);

  const getPublicUrl = useCallback((filePath: string) => {
    return supabase.storage.from('resumes').getPublicUrl(filePath).data.publicUrl;
  }, []);

  return { items, loading, upload, remove, setActive, getPublicUrl, refetch: fetch };
}

// ============ COMPANY REVIEWS ============

export function useCompanyReviews(companyName?: string) {
  const [reviews, setReviews] = useState<CompanyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('company_reviews').select('*').order('created_at', { ascending: false });
    if (companyName) {
      query = query.ilike('company_name', companyName);
    }
    const { data, error } = await query;
    if (!error && data) {
      const list = data as CompanyReview[];
      setReviews(list);
      if (list.length > 0) {
        setAvgRating(list.reduce((sum, r) => sum + r.rating, 0) / list.length);
        setReviewCount(list.length);
      }
    }
    setLoading(false);
  }, [companyName]);

  useEffect(() => { fetch(); }, [fetch]);

  const addReview = useCallback(async (input: Omit<CompanyReview, 'id' | 'user_id' | 'created_at'>) => {
    const { data, error } = await supabase.from('company_reviews').insert(input).select('*').single();
    if (error) throw error;
    setReviews((prev) => [data as CompanyReview, ...prev]);
    return data as CompanyReview;
  }, []);

  return { reviews, loading, avgRating, reviewCount, addReview, refetch: fetch };
}

// ============ JOB ALERTS ============

export function useJobAlerts() {
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('job_alerts')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setAlerts(data as JobAlert[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addAlert = useCallback(async (input: Omit<JobAlert, 'id' | 'user_id' | 'created_at' | 'last_triggered_at'>) => {
    const { data, error } = await supabase.from('job_alerts').insert(input).select('*').single();
    if (error) throw error;
    setAlerts((prev) => [data as JobAlert, ...prev]);
    return data as JobAlert;
  }, []);

  const toggleAlert = useCallback(async (id: string, isActive: boolean) => {
    const { error } = await supabase.from('job_alerts').update({ is_active: isActive }).eq('id', id);
    if (error) throw error;
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_active: isActive } : a)));
  }, []);

  const removeAlert = useCallback(async (id: string) => {
    const { error } = await supabase.from('job_alerts').delete().eq('id', id);
    if (error) throw error;
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { alerts, loading, addAlert, toggleAlert, removeAlert, refetch: fetch };
}

// ============ EMPLOYER APPLICATIONS (ATS) ============

export function useEmployerApplications(jobId?: string) {
  const [applications, setApplications] = useState<EmployerApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('employer_applications')
      .select('*, employer_jobs(*, company_profiles(*), domains(*)), profiles!employer_applications_applicant_user_id_fkey(full_name, headline, skills, experience_years, current_job_title)')
      .order('applied_at', { ascending: false });
    if (jobId) {
      query = query.eq('job_id', jobId);
    }
    const { data, error } = await query;
    if (!error && data) {
      setApplications(data as EmployerApplication[]);
    }
    setLoading(false);
  }, [jobId]);

  useEffect(() => { fetch(); }, [fetch]);

  const updateStatus = useCallback(async (id: string, status: EmployerApplicationStatus, notes?: string) => {
    const updateData: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (notes !== undefined) updateData.employer_notes = notes;
    const { error } = await supabase.from('employer_applications').update(updateData).eq('id', id);
    if (error) throw error;
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status, employer_notes: notes ?? a.employer_notes } : a)));
  }, []);

  return { applications, loading, updateStatus, refetch: fetch };
}
