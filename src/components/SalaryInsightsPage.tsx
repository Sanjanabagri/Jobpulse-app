import { useState, useMemo, useEffect } from 'react';
import { BarChart3, TrendingUp, Wallet, Globe, Briefcase, Loader2, Award } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { JobPosting, Domain } from '@/types';
import { formatSalary } from '@/lib/utils';
import { DomainIcon } from './DomainIcon';

interface SalaryData {
  jobs: JobPosting[];
  domains: Domain[];
}

export function SalaryInsightsPage() {
  const [data, setData] = useState<SalaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [jobsRes, domainsRes] = await Promise.all([
        supabase.from('job_postings').select('*, domains!inner(slug, name, icon, color, description)').limit(500),
        supabase.from('domains').select('*').order('name'),
      ]);
      setData({
        jobs: (jobsRes.data as JobPosting[]) || [],
        domains: (domainsRes.data as Domain[]) || [],
      });
      setLoading(false);
    }
    load();
  }, []);

  const filteredJobs = useMemo(() => {
    if (!data) return [];
    if (!selectedDomainId) return data.jobs;
    return data.jobs.filter((j) => j.domain_id === selectedDomainId);
  }, [data, selectedDomainId]);

  const salaryStats = useMemo(() => {
    const withSalary = filteredJobs.filter(
      (j) => j.salary_min !== null && j.salary_min !== undefined && j.salary_min > 0
    );
    if (withSalary.length === 0) return { avg: 0, min: 0, max: 0, count: 0, median: 0 };
    const mins = withSalary.map((j) => j.salary_min!);
    const sorted = [...mins].sort((a, b) => a - b);
    const avg = Math.round(mins.reduce((s, v) => s + v, 0) / mins.length);
    const median = sorted[Math.floor(sorted.length / 2)];
    return {
      avg,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      count: withSalary.length,
      median,
    };
  }, [filteredJobs]);

  const domainSalaryData = useMemo(() => {
    if (!data) return [];
    const results: { domain: Domain; avg: number; count: number }[] = [];
    for (const d of data.domains) {
      const domainJobs = data.jobs.filter(
        (j) => j.domain_id === d.id && j.salary_min !== null && j.salary_min !== undefined && j.salary_min > 0
      );
      if (domainJobs.length > 0) {
        const avg = Math.round(domainJobs.reduce((s, j) => s + (j.salary_min || 0), 0) / domainJobs.length);
        results.push({ domain: d, avg, count: domainJobs.length });
      }
    }
    results.sort((a, b) => b.avg - a.avg);
    return results;
  }, [data]);

  const jobTypeData = useMemo(() => {
    const types: Record<string, { avg: number; count: number }> = {};
    for (const j of filteredJobs) {
      if (!j.job_type || j.salary_min === null || j.salary_min === undefined || j.salary_min === 0) continue;
      if (!types[j.job_type]) types[j.job_type] = { avg: 0, count: 0 };
      types[j.job_type].avg += j.salary_min;
      types[j.job_type].count++;
    }
    return Object.entries(types)
      .map(([type, { avg, count }]) => ({ type, avg: Math.round(avg / count), count }))
      .sort((a, b) => b.avg - a.avg);
  }, [filteredJobs]);

  const locationData = useMemo(() => {
    const locs: Record<string, { avg: number; count: number }> = {};
    for (const j of filteredJobs) {
      if (!j.location || j.salary_min === null || j.salary_min === undefined || j.salary_min === 0) continue;
      if (!locs[j.location]) locs[j.location] = { avg: 0, count: 0 };
      locs[j.location].avg += j.salary_min;
      locs[j.location].count++;
    }
    return Object.entries(locs)
      .map(([location, { avg, count }]) => ({ location, avg: Math.round(avg / count), count }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 8);
  }, [filteredJobs]);

  const maxDomainAvg = Math.max(...domainSalaryData.map((d) => d.avg), 1);
  const maxJobTypeAvg = Math.max(...jobTypeData.map((d) => d.avg), 1);
  const maxLocationAvg = Math.max(...locationData.map((d) => d.avg), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
          <BarChart3 className="h-6 w-6 text-sky-600" />
          Salary Insights
        </h2>
        <p className="mt-1 text-sm text-slate-500">Analyze salary trends across domains, locations, and job types.</p>
      </div>

      {/* Domain filter */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedDomainId(null)}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
            !selectedDomainId ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Domains
        </button>
        {data?.domains.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelectedDomainId(d.id)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              selectedDomainId === d.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className={`flex h-4 w-4 items-center justify-center rounded ${d.color} text-white`}>
              <DomainIcon name={d.icon} className="h-2.5 w-2.5" />
            </span>
            {d.name}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard icon={<TrendingUp className="h-5 w-5 text-sky-600" />} label="Average" value={salaryStats.avg > 0 ? formatAvg(salaryStats.avg) : '—'} sub={salaryStats.count > 0 ? `${salaryStats.count} jobs` : 'No data'} />
        <SummaryCard icon={<Wallet className="h-5 w-5 text-emerald-600" />} label="Median" value={salaryStats.median > 0 ? formatAvg(salaryStats.median) : '—'} sub="Middle value" />
        <SummaryCard icon={<Award className="h-5 w-5 text-amber-600" />} label="Highest" value={salaryStats.max > 0 ? formatAvg(salaryStats.max) : '—'} sub="Top salary" />
        <SummaryCard icon={<Briefcase className="h-5 w-5 text-violet-600" />} label="Lowest" value={salaryStats.min > 0 ? formatAvg(salaryStats.min) : '—'} sub="Entry level" />
      </div>

      {salaryStats.count === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <BarChart3 className="mx-auto mb-3 h-12 w-12 text-slate-200" />
          <p className="text-sm font-medium text-slate-600">No salary data available</p>
          <p className="mt-1 text-sm text-slate-400">Jobs in this domain don't have salary information listed yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Salary by Domain chart */}
          {domainSalaryData.length > 0 && !selectedDomainId && (
            <ChartCard title="Average Salary by Domain" icon={<Globe className="h-4 w-4 text-sky-500" />}>
              <div className="space-y-3">
                {domainSalaryData.slice(0, 10).map((d) => (
                  <div key={d.domain.id} className="flex items-center gap-3">
                    <div className="flex w-32 shrink-0 items-center gap-2">
                      <span className={`flex h-5 w-5 items-center justify-center rounded ${d.domain.color} text-white`}>
                        <DomainIcon name={d.domain.icon} className="h-3 w-3" />
                      </span>
                      <span className="truncate text-sm font-medium text-slate-700">{d.domain.name}</span>
                    </div>
                    <div className="h-7 flex-1 overflow-hidden rounded-lg bg-slate-100">
                      <div
                        className="flex h-full items-center justify-end rounded-lg bg-gradient-to-r from-sky-400 to-sky-600 px-3 transition-all duration-500"
                        style={{ width: `${Math.max((d.avg / maxDomainAvg) * 100, 15)}%` }}
                      >
                        <span className="text-xs font-bold text-white">{formatAvg(d.avg)}</span>
                      </div>
                    </div>
                    <span className="w-12 shrink-0 text-right text-xs text-slate-400">{d.count} jobs</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          )}

          {/* Salary by Job Type */}
          {jobTypeData.length > 0 && (
            <ChartCard title="Average Salary by Job Type" icon={<Briefcase className="h-4 w-4 text-amber-500" />}>
              <div className="space-y-3">
                {jobTypeData.map((d) => (
                  <div key={d.type} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 capitalize text-sm font-medium text-slate-700">{d.type}</span>
                    <div className="h-7 flex-1 overflow-hidden rounded-lg bg-slate-100">
                      <div
                        className="flex h-full items-center justify-end rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-3 transition-all duration-500"
                        style={{ width: `${Math.max((d.avg / maxJobTypeAvg) * 100, 15)}%` }}
                      >
                        <span className="text-xs font-bold text-white">{formatAvg(d.avg)}</span>
                      </div>
                    </div>
                    <span className="w-12 shrink-0 text-right text-xs text-slate-400">{d.count} jobs</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          )}

          {/* Salary by Location */}
          {locationData.length > 0 && (
            <ChartCard title="Average Salary by Location" icon={<Globe className="h-4 w-4 text-emerald-500" />}>
              <div className="space-y-3">
                {locationData.map((d) => (
                  <div key={d.location} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 truncate text-sm font-medium text-slate-700">{d.location}</span>
                    <div className="h-7 flex-1 overflow-hidden rounded-lg bg-slate-100">
                      <div
                        className="flex h-full items-center justify-end rounded-lg bg-gradient-to-r from-emerald-400 to-teal-500 px-3 transition-all duration-500"
                        style={{ width: `${Math.max((d.avg / maxLocationAvg) * 100, 15)}%` }}
                      >
                        <span className="text-xs font-bold text-white">{formatAvg(d.avg)}</span>
                      </div>
                    </div>
                    <span className="w-12 shrink-0 text-right text-xs text-slate-400">{d.count} jobs</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          )}
        </div>
      )}
    </div>
  );
}

function formatAvg(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
}

function SummaryCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
    </div>
  );
}

function ChartCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}
