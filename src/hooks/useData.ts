import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Domain, JobPosting, DailyDigest, JobSource, Profile } from '@/types';

export function useDomains() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('domains')
      .select('*')
      .order('name')
      .then(({ data, error }) => {
        if (!error && data) setDomains(data);
        setLoading(false);
      });
  }, []);

  return { domains, loading };
}

function computeMatchScore(job: JobPosting, profile: Profile): { score: number; matched: string[] } {
  const userSkills = (profile.skills || []).map((s) => s.toLowerCase());
  if (userSkills.length === 0) return { score: 0, matched: [] };

  const jobTags = (job.tags || []).map((t) => t.toLowerCase());
  const jobText = `${job.title} ${jobTags.join(' ')}`;

  const matched = userSkills.filter((s) =>
    jobTags.some((t) => t.includes(s) || s.includes(t)) ||
    jobText.includes(s)
  );

  const score = Math.round((matched.length / userSkills.length) * 100);
  return { score, matched };
}

export function useJobPostings(selectedDomainSlug: string | null, profile: Profile | null) {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    let query = supabase
      .from('job_postings')
      .select('*, domains!inner(slug, name, icon, color, description)')
      .order('posted_at', { ascending: false })
      .limit(120);

    if (selectedDomainSlug) {
      const { data: domain } = await supabase
        .from('domains')
        .select('id')
        .eq('slug', selectedDomainSlug)
        .maybeSingle();
      if (domain) {
        query = query.eq('domain_id', domain.id);
      }
    }

    const { data, error } = await query;
    if (error) {
      setError(error.message);
      setJobs([]);
    } else {
      let jobsData = (data || []) as JobPosting[];

      // Compute match scores if user has a completed profile
      if (profile && profile.skills.length > 0) {
        jobsData = jobsData.map((job) => {
          const { score, matched } = computeMatchScore(job, profile);
          return { ...job, match_score: score, matched_skills: matched };
        });
      }

      // Load saved jobs status if user is authenticated
      if (profile) {
        const { data: saved } = await supabase
          .from('saved_jobs')
          .select('job_id')
          .eq('user_id', profile.id);
        const savedIds = new Set((saved || []).map((s) => s.job_id));
        jobsData = jobsData.map((job) => ({ ...job, is_saved: savedIds.has(job.id) }));
      }

      setJobs(jobsData);
    }
    setLoading(false);
  }, [selectedDomainSlug, profile]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { jobs, loading, error, refetch: fetchJobs };
}

export function useDailyDigests() {
  const [digests, setDigests] = useState<DailyDigest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('daily_digests')
      .select('*, domains!inner(slug, name, icon, color)')
      .order('digest_date', { ascending: false })
      .order('job_count', { ascending: false })
      .limit(36)
      .then(({ data, error }) => {
        if (!error && data) setDigests(data);
        setLoading(false);
      });
  }, []);

  return { digests, loading };
}

export function useJobSources() {
  const [sources, setSources] = useState<JobSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('job_sources')
      .select('*')
      .order('name')
      .then(({ data, error }) => {
        if (!error && data) setSources(data);
        setLoading(false);
      });
  }, []);

  return { sources, loading };
}

export function useSubscriberCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .then(({ count }) => setCount(count ?? 0));
  }, []);

  return count;
}

export function useJobStats() {
  const [stats, setStats] = useState({ total: 0, newToday: 0, remote: 0, perDomain: [] as Array<{ domain: Domain; count: number }> });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { count: total } = await supabase
        .from('job_postings').select('id', { count: 'exact', head: true });
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: newToday } = await supabase
        .from('job_postings').select('id', { count: 'exact', head: true })
        .gte('fetched_at', since);
      const { count: remote } = await supabase
        .from('job_postings').select('id', { count: 'exact', head: true })
        .eq('is_remote', true);

      const { data: domains } = await supabase.from('domains').select('*').order('name');
      const perDomain: Array<{ domain: Domain; count: number }> = [];
      for (const d of domains || []) {
        const { count } = await supabase
          .from('job_postings').select('id', { count: 'exact', head: true })
          .eq('domain_id', d.id);
        if ((count ?? 0) > 0) perDomain.push({ domain: d, count: count ?? 0 });
      }
      perDomain.sort((a, b) => b.count - a.count);

      setStats({ total: total ?? 0, newToday: newToday ?? 0, remote: remote ?? 0, perDomain });
      setLoading(false);
    }
    load();
  }, []);

  return { stats, loading };
}
