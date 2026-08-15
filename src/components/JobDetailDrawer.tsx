import { useState, useEffect, useMemo } from 'react';
import {
  X, MapPin, Building2, ExternalLink, Briefcase, Clock, ShieldCheck, AlertTriangle,
  Zap, Heart, Globe, Wallet, Users, Send, CheckCircle2, Calendar,
} from 'lucide-react';
import type { JobPosting } from '@/types';
import { supabase } from '@/lib/supabase';
import { timeAgo, formatSalary, parseJobDescription, extractRequirements } from '@/lib/utils';
import { DomainIcon } from './DomainIcon';

interface JobDetailDrawerProps {
  job: JobPosting | null;
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onApply?: (job: JobPosting) => void;
}

const FRESHNESS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  fresh: { label: 'Fresh', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  active: { label: 'Active', color: 'text-sky-700', bg: 'bg-sky-50', dot: 'bg-sky-500' },
  aging: { label: 'Aging', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  stale: { label: 'Stale', color: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-500' },
};

export function JobDetailDrawer({ job, isOpen, onClose, userId, onApply }: JobDetailDrawerProps) {
  const [saved, setSaved] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (job) {
      setSaved(job.is_saved || false);
      setApplied(false);
      if (userId) {
        supabase
          .from('job_applications')
          .select('id')
          .eq('user_id', userId)
          .eq('job_id', job.id)
          .maybeSingle()
          .then(({ data }) => setApplied(!!data));
      }
    }
  }, [job, userId]);

  const { sections, fullText } = useMemo(
    () => parseJobDescription(job?.description ?? null),
    [job?.description]
  );
  const requirements = useMemo(
    () => extractRequirements(job?.description ?? null),
    [job?.description]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen || !job) return null;

  const domain = job.domains;
  const freshness = FRESHNESS_CONFIG[job.freshness_label] || FRESHNESS_CONFIG.active;
  const salaryStr = formatSalary(job.salary_min, job.salary_max, job.currency);

  async function toggleSave() {
    if (!userId || !job) return;
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

  async function handleApply() {
    if (!userId || !job) return;
    await supabase.from('job_applications').insert({
      user_id: userId,
      job_id: job.id,
      status: 'applied',
    });
    setApplied(true);
    onApply?.(job);
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 p-5">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            {job.company_logo ? (
              <img
                src={job.company_logo}
                alt={job.company}
                className="h-14 w-14 shrink-0 rounded-xl border border-slate-100 bg-white object-contain p-1.5"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200">
                <Building2 className="h-6 w-6 text-slate-400" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold leading-tight text-slate-900">{job.title}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-slate-600">
                <span className="font-medium">{job.company}</span>
                {job.location && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="flex items-center gap-0.5">
                      <MapPin className="h-3 w-3" /> {job.location}
                    </span>
                  </>
                )}
              </div>

              {/* Badges row */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${freshness.bg} ${freshness.color}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${freshness.dot}`} />
                  {freshness.label}
                </span>
                {job.trust_score >= 75 ? (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    <ShieldCheck className="h-3 w-3" /> Trust {job.trust_score}
                  </span>
                ) : job.trust_score >= 50 ? (
                  <span className="flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
                    <ShieldCheck className="h-3 w-3" /> Trust {job.trust_score}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                    <AlertTriangle className="h-3 w-3" /> Trust {job.trust_score}
                  </span>
                )}
                {job.is_remote && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Remote</span>
                )}
                {job.job_type && (
                  <span className="flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    <Briefcase className="h-3 w-3" /> {job.job_type}
                  </span>
                )}
                {typeof job.match_score === 'number' && job.match_score > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-bold text-violet-700">
                    <Zap className="h-3 w-3" /> {job.match_score}% match
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="ml-3 shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Quick info grid */}
          <div className="grid grid-cols-2 gap-3 border-b border-slate-200 p-5 sm:grid-cols-4">
            <InfoTile icon={<Wallet className="h-4 w-4" />} label="Salary" value={salaryStr || 'Not disclosed'} />
            <InfoTile icon={<Briefcase className="h-4 w-4" />} label="Job type" value={job.job_type || 'Not specified'} />
            <InfoTile icon={<Clock className="h-4 w-4" />} label="Posted" value={timeAgo(job.posted_at)} />
            <InfoTile
              icon={<Users className="h-4 w-4" />}
              label="Experience"
              value={job.experience || 'Not specified'}
            />
          </div>

          {/* Tags */}
          {job.tags && job.tags.length > 0 && (
            <div className="border-b border-slate-200 p-5">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Skills & Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {job.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                      job.matched_skills?.some((s) => s.toLowerCase() === tag.toLowerCase())
                        ? 'bg-violet-50 text-violet-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              {job.matched_skills && job.matched_skills.length > 0 && (
                <p className="mt-2 text-xs text-violet-600">
                  <Zap className="mr-1 inline h-3 w-3" />
                  {job.matched_skills.length} skill{job.matched_skills.length > 1 ? 's' : ''} matched your profile
                </p>
              )}
            </div>
          )}

          {/* Requirements */}
          {requirements.length > 0 && (
            <div className="border-b border-slate-200 p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                <CheckCircle2 className="h-4 w-4 text-sky-600" />
                Requirements
              </h3>
              <ul className="space-y-2">
                {requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Job description sections */}
          <div className="p-5">
            <h3 className="mb-3 text-sm font-bold text-slate-900">Job Description</h3>

            {sections.length > 0 ? (
              <div className="space-y-4">
                {sections.map((section, i) => (
                  <div key={i}>
                    {section.heading && (
                      <h4 className="mb-1.5 text-sm font-semibold text-slate-800">{section.heading}</h4>
                    )}
                    <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {fullText || 'No detailed description available for this job.'}
              </p>
            )}
          </div>

          {/* Company info */}
          <div className="border-t border-slate-200 bg-slate-50 p-5">
            <h3 className="mb-3 text-sm font-bold text-slate-900">About {job.company}</h3>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              {job.company_website && (
                <a
                  href={job.company_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 font-medium text-sky-600 transition hover:bg-sky-50"
                >
                  <Globe className="h-4 w-4" /> Visit website
                </a>
              )}
              {domain && (
                <div className="flex items-center gap-1.5">
                  <span className={`flex h-6 w-6 items-center justify-center rounded ${domain.color} text-white`}>
                    <DomainIcon name={domain.icon} className="h-3 w-3" />
                  </span>
                  <span className="font-medium text-slate-700">{domain.name}</span>
                </div>
              )}
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Calendar className="h-3.5 w-3.5" /> Fetched {timeAgo(job.fetched_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Sticky action bar */}
        <div className="flex items-center gap-3 border-t border-slate-200 bg-white p-4">
          {userId && (
            <button
              onClick={toggleSave}
              disabled={savingJob}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                saved
                  ? 'border-red-200 bg-red-50 text-red-600'
                  : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Heart className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
              {saved ? 'Saved' : 'Save'}
            </button>
          )}

          {userId && !applied && (
            <button
              onClick={handleApply}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 active:scale-[0.98]"
            >
              <Send className="h-4 w-4" /> Track Application
            </button>
          )}

          {userId && applied && (
            <div className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Application tracked
            </div>
          )}

          {job.apply_url && (
            <a
              href={job.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]"
            >
              Apply on site <ExternalLink className="h-4 w-4" />
            </a>
          )}

          {!userId && job.apply_url && (
            <a
              href={job.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]"
            >
              Apply <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
        {icon}
        {label}
      </div>
      <p className="truncate text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
