import { useState } from 'react';
import { Bookmark, Loader2, ExternalLink, MapPin, Building2, Trash2, Search } from 'lucide-react';
import { useJobPostings } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import type { JobPosting } from '@/types';
import { timeAgo } from '@/lib/utils';
import { JobDetailDrawer } from './JobDetailDrawer';

export function SavedJobsPage() {
  const auth = useAuth();
  const { jobs, loading, toggleSave } = useJobPostings(null, auth.profile);
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

  const savedJobs = jobs.filter((j) => j.is_saved);
  const filtered = savedJobs.filter((j) =>
    !search ||
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.company.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Saved Jobs</h2>
          <p className="mt-1 text-sm text-slate-500">{savedJobs.length} bookmarked job{savedJobs.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search saved jobs..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <Bookmark className="mx-auto mb-3 h-12 w-12 text-slate-200" />
          <p className="text-sm font-medium text-slate-600">No saved jobs yet</p>
          <p className="mt-1 text-sm text-slate-400">Bookmark jobs from the feed to find them here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => (
            <SavedJobCard key={job.id} job={job} onRemove={() => toggleSave(job.id, true)} onClick={() => setSelectedJob(job)} />
          ))}
        </div>
      )}

      <JobDetailDrawer
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        userId={auth.user?.id}
      />
    </div>
  );
}

function SavedJobCard({ job, onRemove, onClick }: { job: JobPosting; onRemove: () => void; onClick: () => void }) {
  return (
    <div onClick={onClick} className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900">{job.title}</h3>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            <Building2 className="h-3.5 w-3.5" />
            <span>{job.company}</span>
            {job.location && (
              <>
                <span className="text-slate-300">·</span>
                <MapPin className="h-3.5 w-3.5" />
                <span>{job.location}</span>
              </>
            )}
            {job.is_remote && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">Remote</span>
            )}
          </div>
          {job.tags && job.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {job.tags.slice(0, 5).map((tag) => (
                <span key={tag} className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{tag}</span>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-slate-400">Posted {timeAgo(job.posted_at)}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          {job.apply_url && (
            <a
              href={job.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-sky-50 hover:text-sky-600"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <button
            onClick={onRemove}
            className="rounded-lg p-2 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
