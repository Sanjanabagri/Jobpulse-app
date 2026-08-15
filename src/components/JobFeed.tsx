import { useState, useMemo } from 'react';
import { Loader2, Inbox, Menu, Search, ArrowUpDown, ShieldCheck, Info, SlidersHorizontal, X } from 'lucide-react';
import type { JobPosting, Domain } from '@/types';
import { JobCard } from './JobCard';
import { JobDetailDrawer } from './JobDetailDrawer';

type SortKey = 'newest' | 'trust' | 'freshness' | 'match';

const SORT_LABELS: Record<SortKey, string> = {
  newest: 'Newest first',
  trust: 'Trust Score',
  freshness: 'Freshness',
  match: 'Match Score',
};

const FRESHNESS_ORDER: Record<string, number> = { fresh: 0, active: 1, aging: 2, stale: 3 };

interface JobFeedProps {
  jobs: JobPosting[];
  loading: boolean;
  error: string | null;
  selectedDomain: Domain | null;
  onOpenSidebar: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  userId?: string;
  hasProfile?: boolean;
}

export function JobFeed({ jobs, loading, error, selectedDomain, onOpenSidebar, searchQuery, onSearchChange, userId, hasProfile }: JobFeedProps) {
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [jobType, setJobType] = useState<string>('all');
  const [freshness, setFreshness] = useState<string>('all');
  const [hasSalary, setHasSalary] = useState(false);
  const [minTrust, setMinTrust] = useState(0);

  const activeFilterCount = (remoteOnly ? 1 : 0) + (jobType !== 'all' ? 1 : 0) + (freshness !== 'all' ? 1 : 0) + (hasSalary ? 1 : 0) + (minTrust > 0 ? 1 : 0);

  const filtered = useMemo(() => {
    let result = searchQuery.trim()
      ? jobs.filter((j) =>
          `${j.title} ${j.company} ${(j.tags || []).join(' ')} ${j.location || ''}`
            .toLowerCase().includes(searchQuery.toLowerCase())
        )
      : jobs;

    if (remoteOnly) result = result.filter((j) => j.is_remote);
    if (jobType !== 'all') result = result.filter((j) => j.job_type === jobType);
    if (freshness !== 'all') result = result.filter((j) => j.freshness_label === freshness);
    if (hasSalary) result = result.filter((j) => j.has_salary || (j.salary_min !== null && j.salary_min !== undefined));
    if (minTrust > 0) result = result.filter((j) => j.trust_score >= minTrust);

    result = [...result];
    switch (sortKey) {
      case 'trust':
        result.sort((a, b) => b.trust_score - a.trust_score);
        break;
      case 'freshness':
        result.sort((a, b) => (FRESHNESS_ORDER[a.freshness_label] ?? 2) - (FRESHNESS_ORDER[b.freshness_label] ?? 2));
        break;
      case 'match':
        result.sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0));
        break;
      default:
        result.sort((a, b) => new Date(b.posted_at || 0).getTime() - new Date(a.posted_at || 0).getTime());
    }
    return result;
  }, [jobs, searchQuery, sortKey, remoteOnly, jobType, freshness, hasSalary, minTrust]);

  return (
    <div className="min-h-full">
      <div className="sticky top-16 z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={onOpenSidebar}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search title, company, tags..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300"
            >
              <ArrowUpDown className="h-4 w-4 text-slate-400" />
              <span className="hidden sm:inline">{SORT_LABELS[sortKey]}</span>
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-0" onClick={() => setSortOpen(false)} />
                <div className="absolute right-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                  {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => { setSortKey(key); setSortOpen(false); }}
                      className={`flex w-full items-center px-3 py-2 text-sm transition ${
                        sortKey === key ? 'bg-slate-50 font-semibold text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {SORT_LABELS[key]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Filter button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              showFilters || activeFilterCount > 0 ? 'border-sky-300 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-600 px-1 text-[10px] font-bold text-white">{activeFilterCount}</span>
            )}
          </button>

          <div className="hidden items-center gap-2 text-sm text-slate-500 lg:flex">
            <span className="font-semibold text-slate-900">{filtered.length}</span>
            {selectedDomain ? `${selectedDomain.name} jobs` : 'jobs total'}
          </div>
        </div>

        {/* Trust score legend */}
        <div className="flex items-center gap-4 px-4 pb-2.5 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-slate-400" />
            Trust Score:
          </span>
          <span className="flex items-center gap-1">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
            </span>
            75+ High
          </span>
          <span className="flex items-center gap-1">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-50">
              <ShieldCheck className="h-3 w-3 text-sky-600" />
            </span>
            50+ Good
          </span>
          <span className="flex items-center gap-1">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-50">
              <ShieldCheck className="h-3 w-3 text-red-600" />
            </span>
            &lt;50 Verify
          </span>
          {hasProfile && (
            <span className="ml-auto hidden text-slate-400 sm:inline">Match scores based on your profile skills</span>
          )}
        </div>

        {/* Advanced filters panel */}
        {showFilters && (
          <div className="border-t border-slate-200 bg-slate-50/50 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-3">
              {/* Remote only */}
              <button
                onClick={() => setRemoteOnly(!remoteOnly)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  remoteOnly ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${remoteOnly ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                Remote only
              </button>

              {/* Job type */}
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-sky-400 focus:outline-none"
              >
                <option value="all">All job types</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="freelance">Freelance</option>
              </select>

              {/* Freshness */}
              <select
                value={freshness}
                onChange={(e) => setFreshness(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-sky-400 focus:outline-none"
              >
                <option value="all">All freshness</option>
                <option value="fresh">Fresh</option>
                <option value="active">Active</option>
                <option value="aging">Aging</option>
                <option value="stale">Stale</option>
              </select>

              {/* Has salary */}
              <button
                onClick={() => setHasSalary(!hasSalary)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  hasSalary ? 'border-sky-300 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Salary listed
              </button>

              {/* Min trust */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Min trust:</span>
                <input
                  type="range" min="0" max="100" step="25" value={minTrust}
                  onChange={(e) => setMinTrust(parseInt(e.target.value))}
                  className="h-1.5 w-24 cursor-pointer appearance-none rounded-full bg-slate-200 accent-sky-500"
                />
                <span className="text-xs font-bold text-slate-700">{minTrust}</span>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={() => { setRemoteOnly(false); setJobType('all'); setFreshness('all'); setHasSalary(false); setMinTrust(0); }}
                  className="ml-auto flex items-center gap-1 text-xs font-medium text-red-500 transition hover:text-red-600"
                >
                  <X className="h-3 w-3" /> Clear all
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
            <p className="mt-3 text-sm text-slate-500">Loading fresh jobs...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="font-medium text-red-800">Failed to load jobs</p>
            <p className="mt-1 text-sm text-red-600">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <Inbox className="h-7 w-7 text-slate-400" />
            </div>
            <p className="mt-4 font-medium text-slate-700">No jobs found</p>
            <p className="mt-1 text-sm text-slate-500">
              {searchQuery ? 'Try a different search term.' : "The agent hasn't fetched jobs for this domain yet."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
            {filtered.map((job) => (
              <JobCard key={job.id} job={job} userId={userId} onClick={setSelectedJob} />
            ))}
          </div>
        )}
      </div>

      <JobDetailDrawer
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        userId={userId}
      />
    </div>
  );
}
