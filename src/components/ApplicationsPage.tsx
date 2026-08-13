import { Loader2, Briefcase, Building2, MapPin, ExternalLink, Clock, X } from 'lucide-react';
import { useJobApplications } from '@/hooks/useApplications';
import { timeAgo } from '@/lib/utils';
import type { ApplicationStatus, JobApplication } from '@/types';

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; dot: string }> = {
  applied: { label: 'Applied', color: 'text-sky-700 bg-sky-50 border-sky-200', dot: 'bg-sky-500' },
  reviewing: { label: 'Reviewing', color: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  interview: { label: 'Interview', color: 'text-violet-700 bg-violet-50 border-violet-200', dot: 'bg-violet-500' },
  offer: { label: 'Offer', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  rejected: { label: 'Rejected', color: 'text-red-700 bg-red-50 border-red-200', dot: 'bg-red-500' },
  withdrawn: { label: 'Withdrawn', color: 'text-slate-600 bg-slate-100 border-slate-200', dot: 'bg-slate-400' },
};

const STATUS_FLOW: ApplicationStatus[] = ['applied', 'reviewing', 'interview', 'offer', 'rejected', 'withdrawn'];

export function ApplicationsPage() {
  const { applications, loading, updateStatus, withdrawApplication } = useJobApplications();

  const stats = {
    total: applications.length,
    active: applications.filter((a) => !['rejected', 'withdrawn'].includes(a.status)).length,
    interviews: applications.filter((a) => a.status === 'interview').length,
    offers: applications.filter((a) => a.status === 'offer').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Applications</h2>
        <p className="mt-1 text-sm text-slate-500">Track your job applications and their status.</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} color="text-slate-900" />
        <StatCard label="Active" value={stats.active} color="text-sky-600" />
        <StatCard label="Interviews" value={stats.interviews} color="text-violet-600" />
        <StatCard label="Offers" value={stats.offers} color="text-emerald-600" />
      </div>

      {applications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <Briefcase className="mx-auto mb-3 h-12 w-12 text-slate-200" />
          <p className="text-sm font-medium text-slate-600">No applications yet</p>
          <p className="mt-1 text-sm text-slate-400">Apply to jobs from the feed to track them here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              onStatusChange={(status) => updateStatus(app.id, status)}
              onWithdraw={() => withdrawApplication(app.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

function ApplicationCard({
  app, onStatusChange, onWithdraw,
}: {
  app: JobApplication;
  onStatusChange: (status: ApplicationStatus) => void;
  onWithdraw: () => void;
}) {
  const job = app.job_postings;
  const config = STATUS_CONFIG[app.status];
  const [showSelector, setShowSelector] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900">{job?.title ?? 'Unknown position'}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Building2 className="h-3.5 w-3.5" />
            <span>{job?.company ?? 'Unknown company'}</span>
            {job?.location && (
              <>
                <span className="text-slate-300">·</span>
                <MapPin className="h-3.5 w-3.5" />
                <span>{job.location}</span>
              </>
            )}
          </div>
          {app.cover_note && (
            <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm italic text-slate-600">"{app.cover_note}"</p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <Clock className="h-3 w-3 text-slate-400" />
            <span className="text-xs text-slate-400">Applied {timeAgo(app.applied_at)}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {job?.apply_url && (
            <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-sky-50 hover:text-sky-600">
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <button onClick={onWithdraw}
            className="rounded-lg p-2 text-slate-300 transition hover:bg-red-50 hover:text-red-500">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Status selector */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => setShowSelector(!showSelector)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${config.color}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
          {config.label}
        </button>
        {showSelector && (
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FLOW.map((status) => (
              <button
                key={status}
                onClick={() => { onStatusChange(status); setShowSelector(false); }}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                  status === app.status ? STATUS_CONFIG[status].color : 'border border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {STATUS_CONFIG[status].label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
