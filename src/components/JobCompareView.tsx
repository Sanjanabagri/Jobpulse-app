import { useState, useMemo } from 'react';
import { GitCompare, X, Plus, Check, Minus, MapPin, Briefcase, Wallet, Shield, Zap, Clock, Globe, Trash2 } from 'lucide-react';
import type { JobPosting } from '@/types';
import { timeAgo, formatSalary } from '@/lib/utils';
import { DomainIcon } from './DomainIcon';

interface JobCompareViewProps {
  jobs: JobPosting[];
}

const MAX_COMPARE = 3;

export function JobCompareView({ jobs }: JobCompareViewProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedJobs = useMemo(
    () => selectedIds.map((id) => jobs.find((j) => j.id === id)).filter(Boolean) as JobPosting[],
    [selectedIds, jobs]
  );

  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return jobs.slice(0, 20);
    const q = searchQuery.toLowerCase();
    return jobs
      .filter((j) => `${j.title} ${j.company} ${(j.tags || []).join(' ')}`.toLowerCase().includes(q))
      .slice(0, 20);
  }, [jobs, searchQuery]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < MAX_COMPARE ? [...prev, id] : prev
    );
  }

  function removeJob(id: string) {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  }

  function clearAll() {
    setSelectedIds([]);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
            <GitCompare className="h-6 w-6 text-sky-600" />
            Compare Jobs
          </h2>
          <p className="mt-1 text-sm text-slate-500">Pick up to {MAX_COMPARE} jobs and compare them side-by-side.</p>
        </div>
        {selectedIds.length > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <Trash2 className="h-4 w-4" /> Clear
          </button>
        )}
      </div>

      {/* Selection bar */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {selectedJobs.map((job) => (
          <div
            key={job.id}
            className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 py-2 pl-3 pr-2"
          >
            <span className="text-sm font-medium text-sky-900">{job.title}</span>
            <span className="text-xs text-sky-600">· {job.company}</span>
            <button
              onClick={() => removeJob(job.id)}
              className="rounded-lg p-1 text-sky-400 transition hover:bg-sky-100 hover:text-sky-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {selectedIds.length < MAX_COMPARE && (
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex items-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-500 transition hover:border-sky-400 hover:text-sky-600"
          >
            <Plus className="h-4 w-4" /> Add job
          </button>
        )}
      </div>

      {/* Job search dropdown */}
      {searchOpen && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search jobs to compare..."
            autoFocus
            className="mb-3 w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {filteredJobs.map((job) => {
              const isSelected = selectedIds.includes(job.id);
              const isMaxed = selectedIds.length >= MAX_COMPARE && !isSelected;
              return (
                <button
                  key={job.id}
                  disabled={isMaxed}
                  onClick={() => toggleSelect(job.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition disabled:opacity-40 ${
                    isSelected ? 'border-sky-300 bg-sky-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${
                    isSelected ? 'border-sky-500 bg-sky-500 text-white' : 'border-slate-300'
                  }`}>
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{job.title}</p>
                    <p className="text-xs text-slate-500">{job.company} · {job.location || 'Remote'}</p>
                  </div>
                  {job.match_score !== undefined && job.match_score > 0 && (
                    <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-bold text-violet-700">
                      {job.match_score}% match
                    </span>
                  )}
                </button>
              );
            })}
            {filteredJobs.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-400">No jobs found matching your search.</p>
            )}
          </div>
        </div>
      )}

      {/* Comparison table */}
      {selectedJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <GitCompare className="h-7 w-7 text-slate-400" />
          </div>
          <p className="mt-4 font-medium text-slate-700">Select jobs to compare</p>
          <p className="mt-1 text-sm text-slate-500">Add up to {MAX_COMPARE} jobs using the "Add job" button above.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Header row with job cards */}
          <div
            className="grid gap-px border-b border-slate-200 bg-slate-100"
            style={{ gridTemplateColumns: `160px repeat(${selectedJobs.length}, minmax(0, 1fr))` }}
          >
            <div className="bg-slate-50 p-4" />
            {selectedJobs.map((job) => (
              <div key={job.id} className="bg-white p-4">
                <div className="flex items-start gap-3">
                  {job.company_logo ? (
                    <img
                      src={job.company_logo}
                      alt={job.company}
                      className="h-10 w-10 shrink-0 rounded-lg border border-slate-100 bg-white object-contain p-1"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200">
                      <Globe className="h-4 w-4 text-slate-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-slate-900">{job.title}</h3>
                    <p className="truncate text-xs text-slate-500">{job.company}</p>
                  </div>
                </div>
                {job.apply_url && (
                  <a
                    href={job.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 py-2 text-xs font-semibold text-white transition hover:bg-sky-600"
                  >
                    Apply <Globe className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Comparison rows */}
          <CompareRow label="Match Score" icon={<Zap className="h-4 w-4 text-violet-500" />} jobs={selectedJobs}>
            {(job) => {
              const score = job.match_score ?? 0;
              if (score === 0) return <span className="text-slate-400">—</span>;
              const color = score >= 70 ? 'text-emerald-600' : score >= 40 ? 'text-amber-600' : 'text-red-500';
              return (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${score}%` }} />
                  </div>
                  <span className={`text-sm font-bold ${color}`}>{score}%</span>
                </div>
              );
            }}
          </CompareRow>

          <CompareRow label="Trust Score" icon={<Shield className="h-4 w-4 text-sky-500" />} jobs={selectedJobs}>
            {(job) => {
              const s = job.trust_score;
              const color = s >= 75 ? 'text-emerald-600' : s >= 50 ? 'text-sky-600' : 'text-red-500';
              return <span className={`text-sm font-bold ${color}`}>{s}/100</span>;
            }}
          </CompareRow>

          <CompareRow label="Salary" icon={<Wallet className="h-4 w-4 text-emerald-500" />} jobs={selectedJobs}>
            {(job) => {
              const s = formatSalary(job.salary_min, job.salary_max, job.currency);
              return s ? <span className="text-sm font-medium text-slate-800">{s}</span> : <span className="text-slate-400">Not disclosed</span>;
            }}
          </CompareRow>

          <CompareRow label="Location" icon={<MapPin className="h-4 w-4 text-rose-500" />} jobs={selectedJobs}>
            {(job) => <span className="text-sm text-slate-700">{job.location || '—'}</span>}
          </CompareRow>

          <CompareRow label="Remote" icon={<Globe className="h-4 w-4 text-emerald-500" />} jobs={selectedJobs}>
            {(job) => job.is_remote ? (
              <span className="flex items-center gap-1 text-sm font-medium text-emerald-600"><Check className="h-3.5 w-3.5" /> Yes</span>
            ) : (
              <span className="flex items-center gap-1 text-sm text-slate-400"><Minus className="h-3.5 w-3.5" /> No</span>
            )}
          </CompareRow>

          <CompareRow label="Job Type" icon={<Briefcase className="h-4 w-4 text-amber-500" />} jobs={selectedJobs}>
            {(job) => <span className="text-sm text-slate-700">{job.job_type || '—'}</span>}
          </CompareRow>

          <CompareRow label="Experience" icon={<Briefcase className="h-4 w-4 text-slate-500" />} jobs={selectedJobs}>
            {(job) => <span className="text-sm text-slate-700">{job.experience || '—'}</span>}
          </CompareRow>

          <CompareRow label="Freshness" icon={<Clock className="h-4 w-4 text-sky-500" />} jobs={selectedJobs}>
            {(job) => {
              const colors: Record<string, string> = { fresh: 'text-emerald-600', active: 'text-sky-600', aging: 'text-amber-600', stale: 'text-red-500' };
              return <span className={`text-sm font-medium capitalize ${colors[job.freshness_label] || 'text-slate-600'}`}>{job.freshness_label}</span>;
            }}
          </CompareRow>

          <CompareRow label="Posted" icon={<Clock className="h-4 w-4 text-slate-400" />} jobs={selectedJobs}>
            {(job) => <span className="text-sm text-slate-600">{timeAgo(job.posted_at)}</span>}
          </CompareRow>

          <CompareRow label="Domain" icon={<Globe className="h-4 w-4 text-slate-400" />} jobs={selectedJobs} isLast>
            {(job) =>
              job.domains ? (
                <div className="flex items-center gap-1.5">
                  <span className={`flex h-5 w-5 items-center justify-center rounded ${job.domains.color} text-white`}>
                    <DomainIcon name={job.domains.icon} className="h-3 w-3" />
                  </span>
                  <span className="text-sm text-slate-700">{job.domains.name}</span>
                </div>
              ) : (
                <span className="text-slate-400">—</span>
              )
            }
          </CompareRow>

          {/* Skills comparison */}
          <div className="grid gap-px bg-slate-100" style={{ gridTemplateColumns: `160px repeat(${selectedJobs.length}, minmax(0, 1fr))` }}>
            <div className="flex items-center bg-slate-50 p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Skills
            </div>
            {selectedJobs.map((job) => (
              <div key={job.id} className="bg-white p-4">
                <div className="flex flex-wrap gap-1">
                  {(job.tags || []).slice(0, 8).map((tag) => (
                    <span
                      key={tag}
                      className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                        job.matched_skills?.some((s) => s.toLowerCase() === tag.toLowerCase())
                          ? 'bg-violet-50 text-violet-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                  {(!job.tags || job.tags.length === 0) && <span className="text-xs text-slate-400">No tags</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CompareRow({
  label,
  icon,
  jobs,
  children,
  isLast,
}: {
  label: string;
  icon: React.ReactNode;
  jobs: JobPosting[];
  children: (job: JobPosting) => React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div
      className={`grid gap-px bg-slate-100 ${isLast ? '' : ''}`}
      style={{ gridTemplateColumns: `160px repeat(${jobs.length}, minmax(0, 1fr))` }}
    >
      <div className="flex items-center gap-2 bg-slate-50 p-4 text-xs font-medium text-slate-500">
        {icon}
        {label}
      </div>
      {jobs.map((job) => (
        <div key={job.id} className="bg-white p-4">
          {children(job)}
        </div>
      ))}
    </div>
  );
}
