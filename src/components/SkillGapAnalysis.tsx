import { useMemo } from 'react';
import { CheckCircle2, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import type { JobPosting, ExtendedProfile } from '@/types';

interface SkillGapAnalysisProps {
  job: JobPosting;
  profile: ExtendedProfile | null;
}

export function SkillGapAnalysis({ job, profile }: SkillGapAnalysisProps) {
  const analysis = useMemo(() => {
    const jobSkills = (job.tags || []).map((t) => t.toLowerCase());
    const userSkills = (profile?.skills || []).map((s) => s.toLowerCase());

    if (jobSkills.length === 0) return null;
    if (userSkills.length === 0) return { matched: [], missing: job.tags || [], partial: [], coverage: 0 };

    const matched: string[] = [];
    const missing: string[] = [];
    const partial: string[] = [];

    for (let i = 0; i < (job.tags || []).length; i++) {
      const tag = (job.tags || [])[i];
      const tagLower = tag.toLowerCase();
      const exactMatch = userSkills.some((s) => s === tagLower);
      const partialMatch = userSkills.some((s) => s.includes(tagLower) || tagLower.includes(s));

      if (exactMatch) {
        matched.push(tag);
      } else if (partialMatch) {
        partial.push(tag);
      } else {
        missing.push(tag);
      }
    }

    const coverage = Math.round((matched.length / jobSkills.length) * 100);
    return { matched, missing, partial, coverage };
  }, [job, profile]);

  if (!analysis) return null;

  const { matched, missing, partial, coverage } = analysis;

  return (
    <div className="border-b border-slate-200 p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
        <TrendingUp className="h-4 w-4 text-violet-600" />
        Skill Gap Analysis
      </h3>

      {/* Coverage bar */}
      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Your skill coverage</span>
          <span className={`text-sm font-bold ${
            coverage >= 70 ? 'text-emerald-600' : coverage >= 40 ? 'text-amber-600' : 'text-red-500'
          }`}>
            {coverage}%
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              coverage >= 70 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
              coverage >= 40 ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
              'bg-gradient-to-r from-red-400 to-red-600'
            }`}
            style={{ width: `${Math.max(coverage, 3)}%` }}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {/* Matched skills */}
        {matched.length > 0 && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-800">You have ({matched.length})</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {matched.map((s) => (
                <span key={s} className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Partial match */}
        {partial.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-semibold text-amber-800">Close match ({partial.length})</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {partial.map((s) => (
                <span key={s} className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Missing skills */}
        {missing.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs font-semibold text-red-800">Missing ({missing.length})</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {missing.map((s) => (
                <span key={s} className="rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {missing.length > 0 && (
        <p className="mt-3 text-xs text-slate-500">
          Focus on learning the missing skills to improve your match score for this role.
        </p>
      )}
    </div>
  );
}
