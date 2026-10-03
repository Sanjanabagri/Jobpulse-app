import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, Briefcase, Send, Target, Zap, ArrowRight, Clock,
  Building2, MapPin, Award, Sparkles, BarChart3, Loader2, CheckCircle2,
  AlertCircle, Flame, Lightbulb, ExternalLink,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { JobPosting, JobApplication, ExtendedProfile, Domain, ApplicationStatus } from '@/types';
import { timeAgo, formatSalary } from '@/lib/utils';
import { DomainIcon } from './DomainIcon';

interface CareerDashboardProps {
  profile: ExtendedProfile | null;
  jobs: JobPosting[];
  applications: JobApplication[];
  domains: Domain[];
  onNavigate: (tab: string) => void;
  onViewJob: (job: JobPosting) => void;
}

export function CareerDashboard({ profile, jobs, applications, domains, onNavigate, onViewJob }: CareerDashboardProps) {
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [recentDigests, setRecentDigests] = useState<{ date: string; count: number } | null>(null);

  useEffect(() => {
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)
      .then(({ count }) => setUnreadNotifications(count ?? 0));

    supabase
      .from('daily_digests')
      .select('digest_date, job_count')
      .order('digest_date', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setRecentDigests({ date: data[0].digest_date, count: data[0].job_count });
      });
  }, []);

  const recommendedJobs = useMemo(() => {
    return jobs
      .filter((j) => !applications.some((a) => a.job_id === j.id))
      .sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0))
      .slice(0, 4);
  }, [jobs, applications]);

  const pipeline = useMemo(() => {
    const active = applications.filter((a) => !['rejected', 'withdrawn'].includes(a.status));
    const stages: { status: ApplicationStatus; label: string; count: number; color: string }[] = [
      { status: 'applied', label: 'Applied', count: 0, color: 'bg-sky-500' },
      { status: 'reviewing', label: 'Reviewing', count: 0, color: 'bg-amber-500' },
      { status: 'interview', label: 'Interview', count: 0, color: 'bg-violet-500' },
      { status: 'offer', label: 'Offer', count: 0, color: 'bg-emerald-500' },
    ];
    active.forEach((a) => {
      const stage = stages.find((s) => s.status === a.status);
      if (stage) stage.count++;
    });
    return { stages, activeCount: active.length };
  }, [applications]);

  const skillGaps = useMemo(() => {
    if (!profile || profile.skills.length === 0) return [];
    const allTags = new Set<string>();
    recommendedJobs.forEach((j) => (j.tags || []).forEach((t) => allTags.add(t.toLowerCase())));
    const userSkills = new Set(profile.skills.map((s) => s.toLowerCase()));
    const gaps: { skill: string; frequency: number }[] = [];
    const tagCounts: Record<string, number> = {};
    recommendedJobs.forEach((j) => (j.tags || []).forEach((t) => {
      const tl = t.toLowerCase();
      if (!userSkills.has(tl)) tagCounts[tl] = (tagCounts[tl] || 0) + 1;
    }));
    Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .forEach(([skill, frequency]) => gaps.push({ skill, frequency }));
    return gaps;
  }, [profile, recommendedJobs]);

  const stats = {
    totalJobs: jobs.length,
    matchedJobs: jobs.filter((j) => (j.match_score ?? 0) >= 50).length,
    appliedCount: applications.length,
    interviewCount: applications.filter((a) => a.status === 'interview').length,
    offerCount: applications.filter((a) => a.status === 'offer').length,
  };

  const topDomain = useMemo(() => {
    if (!profile?.preferred_domain_id) return null;
    return domains.find((d) => d.id === profile.preferred_domain_id) ?? null;
  }, [profile, domains]);

  const firstName = profile?.full_name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Greeting */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{greeting}, {firstName}</h2>
          <p className="mt-1 text-sm text-slate-500">Here's your career overview for today.</p>
        </div>
        {unreadNotifications > 0 && (
          <button
            onClick={() => onNavigate('notifications')}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
          >
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">{unreadNotifications}</span>
            New alerts
          </button>
        )}
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DashStat icon={<Briefcase className="h-5 w-5" />} label="Available Jobs" value={stats.totalJobs} color="text-sky-600" bg="bg-sky-50" />
        <DashStat icon={<Target className="h-5 w-5" />} label="Good Matches" value={stats.matchedJobs} color="text-violet-600" bg="bg-violet-50" />
        <DashStat icon={<Send className="h-5 w-5" />} label="Applications" value={stats.appliedCount} color="text-amber-600" bg="bg-amber-50" />
        <DashStat icon={<Award className="h-5 w-5" />} label="Interviews" value={stats.interviewCount} color="text-emerald-600" bg="bg-emerald-50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - pipeline + recommended jobs */}
        <div className="space-y-6 lg:col-span-2">
          {/* Application Pipeline */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <BarChart3 className="h-4 w-4 text-sky-500" />
                Application Pipeline
              </h3>
              <button
                onClick={() => onNavigate('applications')}
                className="flex items-center gap-1 text-xs font-medium text-sky-600 transition hover:text-sky-700"
              >
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {pipeline.activeCount === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center">
                <Send className="mx-auto mb-2 h-8 w-8 text-slate-200" />
                <p className="text-sm font-medium text-slate-600">No active applications</p>
                <button
                  onClick={() => onNavigate('jobs')}
                  className="mt-2 text-sm font-medium text-sky-600 hover:text-sky-700"
                >
                  Browse jobs to apply
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {pipeline.stages.map((stage, i) => (
                  <div key={stage.status} className="flex flex-1 items-center">
                    <div className="flex-1 rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-center">
                      <div className={`mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full ${stage.color} text-white`}>
                        <span className="text-sm font-bold">{stage.count}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-600">{stage.label}</p>
                    </div>
                    {i < pipeline.stages.length - 1 && (
                      <ArrowRight className="mx-1 h-4 w-4 shrink-0 text-slate-300" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {stats.offerCount > 0 && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">You have {stats.offerCount} job offer{stats.offerCount > 1 ? 's' : ''}!</span>
              </div>
            )}
          </div>

          {/* Recommended Jobs */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Sparkles className="h-4 w-4 text-violet-500" />
                Recommended for You
              </h3>
              <button
                onClick={() => onNavigate('jobs')}
                className="flex items-center gap-1 text-xs font-medium text-sky-600 transition hover:text-sky-700"
              >
                More jobs <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {recommendedJobs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center">
                <Briefcase className="mx-auto mb-2 h-8 w-8 text-slate-200" />
                <p className="text-sm text-slate-500">No new recommendations right now.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recommendedJobs.map((job) => (
                  <RecommendedJobRow key={job.id} job={job} onClick={() => onViewJob(job)} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column - skill gaps + quick actions */}
        <div className="space-y-6">
          {/* Profile completeness */}
          {profile && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                <Target className="h-4 w-4 text-sky-500" />
                Profile Strength
              </h3>
              <ProfileStrengthBar profile={profile} />
            </div>
          )}

          {/* Skill Gaps */}
          {skillGaps.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Skills to Learn
              </h3>
              <p className="mb-3 text-xs text-slate-500">Frequently required in jobs matching your profile but not in your skill set yet.</p>
              <div className="space-y-2">
                {skillGaps.map((gap) => (
                  <div key={gap.skill} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-sm font-medium capitalize text-slate-700">{gap.skill}</span>
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                      <Flame className="h-3 w-3" />
                      {gap.frequency} job{gap.frequency > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-slate-900">Quick Actions</h3>
            <div className="space-y-2">
              <QuickAction icon={<Briefcase className="h-4 w-4" />} label="Browse Jobs" onClick={() => onNavigate('jobs')} />
              <QuickAction icon={<BarChart3 className="h-4 w-4" />} label="Salary Insights" onClick={() => onNavigate('insights')} />
              <QuickAction icon={<Send className="h-4 w-4" />} label="My Applications" onClick={() => onNavigate('applications')} />
              <QuickAction icon={<TrendingUp className="h-4 w-4" />} label="Daily Triggers" onClick={() => onNavigate('triggers')} />
            </div>
          </div>

          {/* Latest digest */}
          {recentDigests && (
            <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 p-5">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-sky-900">
                <Clock className="h-4 w-4" />
                Latest Digest
              </h3>
              <p className="text-xs text-sky-700">
                {recentDigests.count} new jobs were indexed on {new Date(recentDigests.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.
              </p>
              <button
                onClick={() => onNavigate('triggers')}
                className="mt-2 flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-900"
              >
                View digest <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DashStat({ icon, label, value, color, bg }: { icon: React.ReactNode; label: string; value: number; color: string; bg: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${bg} ${color}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

function RecommendedJobRow({ job, onClick }: { job: JobPosting; onClick: () => void }) {
  const matchScore = job.match_score ?? 0;
  const matchColor = matchScore >= 70 ? 'text-emerald-600 bg-emerald-50' : matchScore >= 40 ? 'text-amber-600 bg-amber-50' : 'text-slate-500 bg-slate-50';
  const salary = formatSalary(job.salary_min, job.salary_max, job.currency);

  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:border-slate-200 hover:bg-slate-50"
    >
      {job.company_logo ? (
        <img
          src={job.company_logo}
          alt={job.company}
          className="h-10 w-10 shrink-0 rounded-lg border border-slate-100 bg-white object-contain p-1"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200">
          <Building2 className="h-4 w-4 text-slate-400" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-sky-700">{job.title}</p>
        <p className="truncate text-xs text-slate-500">
          {job.company}
          {job.location ? ` · ${job.location}` : ''}
          {job.is_remote ? ' · Remote' : ''}
        </p>
        {salary && <p className="mt-0.5 text-xs font-medium text-emerald-600">{salary}</p>}
      </div>
      <div className="shrink-0 text-right">
        {matchScore > 0 && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${matchColor}`}>
            <Zap className="h-3 w-3" />{matchScore}%
          </span>
        )}
        <p className="mt-1 text-xs text-slate-400">{timeAgo(job.posted_at)}</p>
      </div>
    </button>
  );
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition group-hover:bg-sky-100 group-hover:text-sky-600">
        {icon}
      </span>
      {label}
      <ArrowRight className="ml-auto h-4 w-4 text-slate-300" />
    </button>
  );
}

function ProfileStrengthBar({ profile }: { profile: ExtendedProfile }) {
  const checks = [
    { label: 'Name & headline', done: !!profile.full_name && !!profile.headline },
    { label: 'Skills added', done: profile.skills.length >= 3 },
    { label: 'Location set', done: !!profile.location },
    { label: 'Experience years', done: profile.experience_years > 0 },
    { label: 'Preferred domain', done: !!profile.preferred_domain_id },
    { label: 'Salary expectation', done: profile.salary_expectation_min !== null && profile.salary_expectation_min > 0 },
  ];
  const completed = checks.filter((c) => c.done).length;
  const percentage = Math.round((completed / checks.length) * 100);
  const strength = percentage >= 80 ? 'Strong' : percentage >= 50 ? 'Good' : 'Weak';
  const color = percentage >= 80 ? 'text-emerald-600' : percentage >= 50 ? 'text-amber-600' : 'text-red-500';

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className={`text-sm font-bold ${color}`}>{strength}</span>
        <span className="text-sm font-bold text-slate-700">{percentage}%</span>
      </div>
      <div className="mb-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            percentage >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
            percentage >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
            'bg-gradient-to-r from-red-400 to-red-600'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="space-y-1.5">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-2 text-xs">
            {c.done ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 text-slate-300" />
            )}
            <span className={c.done ? 'text-slate-600' : 'text-slate-400'}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
