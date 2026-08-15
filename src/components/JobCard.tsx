import { MapPin, Building2, ExternalLink, Briefcase, Clock, ShieldCheck, AlertTriangle, Zap, Heart } from 'lucide-react';
import { useState } from 'react';
import type { JobPosting } from '@/types';
import { timeAgo } from '@/lib/utils';
import { DomainIcon } from './DomainIcon';
import { supabase } from '@/lib/supabase';

const FRESHNESS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  fresh: { label: 'Fresh', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  active: { label: 'Active', color: 'text-sky-700', bg: 'bg-sky-50', dot: 'bg-sky-500' },
  aging: { label: 'Aging', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  stale: { label: 'Stale', color: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-500' },
};

function TrustBadge({ score }: { score: number }) {
  if (score >= 75) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
        <ShieldCheck className="h-3 w-3" />
        {score}
      </span>
    );
  }
  if (score >= 50) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
        <ShieldCheck className="h-3 w-3" />
        {score}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
      <AlertTriangle className="h-3 w-3" />
      {score}
    </span>
  );
}

interface JobCardProps {
  job: JobPosting;
  userId?: string;
  onClick?: (job: JobPosting) => void;
}

export function JobCard({ job, userId, onClick }: JobCardProps) {
  const domain = job.domains;
  const freshness = FRESHNESS_CONFIG[job.freshness_label] || FRESHNESS_CONFIG.active;
  const [saved, setSaved] = useState(job.is_saved || false);
  const [savingJob, setSavingJob] = useState(false);

  async function toggleSave() {
    if (!userId) return;
    setSavingJob(true);
    if (saved) {
      await supabase.from('saved_jobs').delete().eq('user_id', userId).eq('job_id', job.id);
      setSaved(false);
    } else {
      await supabase.from('saved_jobs').insert({ user_id: userId, job_id: job.id });
      setSaved(true);
    }
    setSavingJob(false);
  }

  return (
    <article
      onClick={() => onClick?.(job)}
      className={`group relative rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start gap-4">
        {job.company_logo ? (
          <img
            src={job.company_logo}
            alt={job.company}
            className="h-12 w-12 shrink-0 rounded-xl border border-slate-100 bg-white object-contain p-1"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200">
            <Building2 className="h-5 w-5 text-slate-400" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-slate-900 group-hover:text-sky-700">
                {job.title}
              </h3>
              <p className="mt-0.5 text-sm text-slate-600">{job.company}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {userId && (
                <button
                  onClick={toggleSave}
                  disabled={savingJob}
                  className={`rounded-lg p-1.5 transition ${saved ? 'text-red-500' : 'text-slate-300 hover:text-slate-500'}`}
                >
                  <Heart className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
                </button>
              )}
              {job.apply_url && (
                <a
                  href={job.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-600 active:scale-95"
                >
                  Apply
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>

          {/* Match score badge */}
          {typeof job.match_score === 'number' && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1">
                <Zap className="h-3 w-3 text-violet-600" />
                <span className="text-xs font-bold text-violet-700">{job.match_score}% match</span>
              </div>
              {job.matched_skills && job.matched_skills.length > 0 && (
                <span className="text-xs text-slate-400">
                  {job.matched_skills.slice(0, 3).join(', ')}
                  {job.matched_skills.length > 3 ? ` +${job.matched_skills.length - 3}` : ''}
                </span>
              )}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${freshness.dot}`} />
              <span className={`font-medium ${freshness.color}`}>{freshness.label}</span>
            </span>
            <TrustBadge score={job.trust_score} />
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {job.location}
              </span>
            )}
            {job.is_remote && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                Remote
              </span>
            )}
            {job.job_type && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {job.job_type}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {timeAgo(job.posted_at)}
            </span>
          </div>

          {job.tags && job.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.tags.slice(0, 6).map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {domain && (
            <div className="mt-3 flex items-center gap-1.5">
              <span className={`flex h-5 w-5 items-center justify-center rounded ${domain.color} text-white`}>
                <DomainIcon name={domain.icon} className="h-3 w-3" />
              </span>
              <span className="text-xs font-medium text-slate-600">{domain.name}</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
