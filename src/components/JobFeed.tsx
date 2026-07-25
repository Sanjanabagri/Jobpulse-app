import { useState, useMemo } from 'react';
import { Loader2, Inbox, Menu, Search, ArrowUpDown, ShieldCheck, Info } from 'lucide-react';
import type { JobPosting, Domain } from '@/types';
import { JobCard } from './JobCard';

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

  const filtered = useMemo(() => {
    let result = searchQuery.trim()
      ? jobs.filter((j) =>
          `${j.title} ${j.company} ${(j.tags || []).join(' ')} ${j.location || ''}`
            .toLowerCase().includes(searchQuery.toLowerCase())
        )
      : jobs;

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
  }, [jobs, searchQuery, sortKey]);

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
              <JobCard key={job.id} job={job} userId={userId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
