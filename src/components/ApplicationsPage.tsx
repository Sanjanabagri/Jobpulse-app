import { useState, useCallback } from 'react';
import { Loader2, Briefcase, Building2, MapPin, ExternalLink, Eye, GripVertical, LayoutGrid, List } from 'lucide-react';
import { useJobApplications } from '@/hooks/useApplications';
import { useAuth } from '@/hooks/useAuth';
import type { ApplicationStatus, JobApplication, JobPosting } from '@/types';
import { JobDetailDrawer } from './JobDetailDrawer';

const KANBAN_COLUMNS: { status: ApplicationStatus; label: string; color: string; dot: string; bg: string }[] = [
  { status: 'applied', label: 'Applied', color: 'text-sky-700', dot: 'bg-sky-500', bg: 'bg-sky-50' },
  { status: 'reviewing', label: 'Reviewing', color: 'text-amber-700', dot: 'bg-amber-500', bg: 'bg-amber-50' },
  { status: 'interview', label: 'Interview', color: 'text-violet-700', dot: 'bg-violet-500', bg: 'bg-violet-50' },
  { status: 'offer', label: 'Offer', color: 'text-emerald-700', dot: 'bg-emerald-500', bg: 'bg-emerald-50' },
  { status: 'rejected', label: 'Rejected', color: 'text-red-700', dot: 'bg-red-500', bg: 'bg-red-50' },
  { status: 'withdrawn', label: 'Withdrawn', color: 'text-slate-600', dot: 'bg-slate-400', bg: 'bg-slate-100' },
];

export function ApplicationsPage() {
  const { applications, loading, updateStatus, withdrawApplication } = useJobApplications();
  const auth = useAuth();
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ApplicationStatus | null>(null);

  const stats = {
    total: applications.length,
    active: applications.filter((a) => !['rejected', 'withdrawn'].includes(a.status)).length,
    interviews: applications.filter((a) => a.status === 'interview').length,
    offers: applications.filter((a) => a.status === 'offer').length,
  };

  const handleDrop = useCallback(
    (status: ApplicationStatus) => {
      if (draggedId) {
        const app = applications.find((a) => a.id === draggedId);
        if (app && app.status !== status) {
          updateStatus(draggedId, status);
        }
      }
      setDraggedId(null);
      setDragOverColumn(null);
    },
    [draggedId, applications, updateStatus]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  const grouped: Record<ApplicationStatus, JobApplication[]> = {
    applied: [], reviewing: [], interview: [], offer: [], rejected: [], withdrawn: [],
  };
  applications.forEach((app) => grouped[app.status].push(app));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Applications</h2>
          <p className="mt-1 text-sm text-slate-500">Track your job applications and their status.</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              viewMode === 'kanban' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid className="h-4 w-4" /> Board
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <List className="h-4 w-4" /> List
          </button>
        </div>
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
      ) : viewMode === 'kanban' ? (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
            {KANBAN_COLUMNS.map((col) => (
              <div
                key={col.status}
                className={`w-72 shrink-0 rounded-2xl border-2 transition-colors ${
                  dragOverColumn === col.status ? 'border-sky-400 bg-sky-50/30' : 'border-slate-200 bg-slate-50/50'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOverColumn(col.status); }}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={() => handleDrop(col.status)}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                    <span className={`text-sm font-semibold ${col.color}`}>{col.label}</span>
                  </div>
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-2 text-xs font-bold text-slate-500">
                    {grouped[col.status].length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2 px-2 pb-3">
                  {grouped[col.status].map((app) => (
                    <KanbanCard
                      key={app.id}
                      app={app}
                      onDragStart={() => setDraggedId(app.id)}
                      onDragEnd={() => { setDraggedId(null); setDragOverColumn(null); }}
                      onViewDetails={() => setSelectedJob(app.job_postings ?? null)}
                      onWithdraw={() => withdrawApplication(app.id)}
                      isDragging={draggedId === app.id}
                    />
                  ))}
                  {grouped[col.status].length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center">
                      <p className="text-xs text-slate-400">Drop here</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <ListCard
              key={app.id}
              app={app}
              onStatusChange={(status) => updateStatus(app.id, status)}
              onWithdraw={() => withdrawApplication(app.id)}
              onViewDetails={() => setSelectedJob(app.job_postings ?? null)}
            />
          ))}
        </div>
      )}

      <JobDetailDrawer
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        userId={auth.user?.id}
        profile={auth.profile}
      />
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

function KanbanCard({
  app,
  onDragStart,
  onDragEnd,
  onViewDetails,
  onWithdraw,
  isDragging,
}: {
  app: JobApplication;
  onDragStart: () => void;
  onDragEnd: () => void;
  onViewDetails: () => void;
  onWithdraw: () => void;
  isDragging: boolean;
}) {
  const job = app.job_postings;
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group cursor-grab rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md active:cursor-grabbing ${
        isDragging ? 'opacity-50 ring-2 ring-sky-400' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-slate-400" />
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-slate-900">{job?.title ?? 'Unknown position'}</h4>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
            <Building2 className="h-3 w-3" />
            {job?.company ?? 'Unknown company'}
          </p>
          {job?.location && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-400">
              <MapPin className="h-3 w-3" /> {job.location}
            </p>
          )}
        </div>
      </div>

      {app.cover_note && (
        <p className="mt-2 rounded-lg bg-slate-50 px-2 py-1.5 text-xs italic text-slate-500 line-clamp-2">"{app.cover_note}"</p>
      )}

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
        <div className="flex items-center gap-1">
          {job && (
            <button
              onClick={onViewDetails}
              className="rounded-md p-1 text-slate-400 transition hover:bg-sky-50 hover:text-sky-600"
              title="View details"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}
          {job?.apply_url && (
            <a
              href={job.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md p-1 text-slate-400 transition hover:bg-sky-50 hover:text-sky-600"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            onClick={onWithdraw}
            className="rounded-md p-1 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
            title="Withdraw"
          >
            <span className="text-xs font-medium">Withdraw</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ListCard({
  app,
  onStatusChange,
  onWithdraw,
  onViewDetails,
}: {
  app: JobApplication;
  onStatusChange: (status: ApplicationStatus) => void;
  onWithdraw: () => void;
  onViewDetails: () => void;
}) {
  const job = app.job_postings;
  const [showSelector, setShowSelector] = useState(false);
  const currentCol = KANBAN_COLUMNS.find((c) => c.status === app.status)!;

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
            <span className="text-xs text-slate-400">
              Applied {new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {job && (
            <button
              onClick={onViewDetails}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-sky-50 hover:text-sky-600"
              title="View details"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          {job?.apply_url && (
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
            onClick={onWithdraw}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            Withdraw
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => setShowSelector(!showSelector)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${currentCol.color.replace('text-', 'border-').replace('-700', '-200')} ${currentCol.bg} ${currentCol.color}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${currentCol.dot}`} />
          {currentCol.label}
        </button>
        {showSelector && (
          <div className="flex flex-wrap gap-1.5">
            {KANBAN_COLUMNS.map((col) => (
              <button
                key={col.status}
                onClick={() => { onStatusChange(col.status); setShowSelector(false); }}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                  col.status === app.status ? `${col.bg} ${col.color}` : 'border border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {col.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
