import { useState, useMemo } from 'react';
import {
  MessageSquare, Star, Users, Eye, TrendingUp, LogIn, Calendar,
  Bug, Lightbulb, Heart, CheckCircle2, Clock, AlertCircle, Loader2,
  Search, ChevronRight, BarChart3, UserCircle,
} from 'lucide-react';
import { useAllFeedback, useAllRatings, useVisitorStats, useAdminProfiles } from '@/hooks/useAdminStats';
import type { FeedbackCategory, FeedbackStatus } from '@/types';
import { timeAgo } from '@/lib/utils';

const CATEGORIES: { value: FeedbackCategory; label: string; icon: typeof Bug; color: string }[] = [
  { value: 'bug', label: 'Bug', icon: Bug, color: 'text-red-600 bg-red-50' },
  { value: 'feature_request', label: 'Feature', icon: Lightbulb, color: 'text-amber-600 bg-amber-50' },
  { value: 'general', label: 'General', icon: MessageSquare, color: 'text-sky-600 bg-sky-50' },
  { value: 'praise', label: 'Praise', icon: Heart, color: 'text-emerald-600 bg-emerald-50' },
];

const STATUS_STYLES: Record<FeedbackStatus, { label: string; icon: typeof Clock; color: string }> = {
  open: { label: 'Open', icon: AlertCircle, color: 'text-amber-600 bg-amber-50' },
  reviewing: { label: 'Reviewing', icon: Clock, color: 'text-sky-600 bg-sky-50' },
  resolved: { label: 'Resolved', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
};

type SubPage = 'overview' | 'feedback' | 'ratings' | 'visitors';

export function AdminOverviewPage() {
  const [subPage, setSubPage] = useState<SubPage>('overview');

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-900">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Admin Overview</h2>
          <p className="text-sm text-slate-500">User feedback, ratings, and visit analytics</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1">
        {([
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'feedback', label: 'Feedback', icon: MessageSquare },
          { key: 'ratings', label: 'Ratings', icon: Star },
          { key: 'visitors', label: 'Visitors', icon: Eye },
        ] as { key: SubPage; label: string; icon: typeof BarChart3 }[]).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setSubPage(tab.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap ${
                subPage === tab.key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {subPage === 'overview' && <OverviewTab />}
      {subPage === 'feedback' && <FeedbackTab />}
      {subPage === 'ratings' && <RatingsTab />}
      {subPage === 'visitors' && <VisitorsTab />}
    </div>
  );
}

function OverviewTab() {
  const { feedback, loading: fbLoading } = useAllFeedback();
  const { average, count, distribution } = useAllRatings();
  const { stats, loading: vLoading } = useVisitorStats();
  const { profiles, loading: pLoading } = useAdminProfiles();

  const loading = fbLoading || vLoading || pLoading;

  const feedbackByCategory = CATEGORIES.map((cat) => ({
    ...cat,
    count: feedback.filter((f) => f.category === cat.value).length,
  }));

  const recentFeedback = feedback.slice(0, 5);
  const recentProfiles = profiles.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Visits" value={stats.totalVisits} icon={Eye} color="text-sky-600" bg="bg-sky-50" />
        <StatCard label="Unique Visitors" value={stats.uniqueVisitors} icon={Users} color="text-violet-600" bg="bg-violet-50" />
        <StatCard label="Signed-in Users" value={stats.signedInUsers} icon={LogIn} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Feedback Count" value={feedback.length} icon={MessageSquare} color="text-amber-600" bg="bg-amber-50" />
        <StatCard label="Avg Rating" value={count > 0 ? average.toFixed(1) : '—'} icon={Star} color="text-amber-600" bg="bg-amber-50" />
      </div>

      {/* Visit breakdown */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MiniStat label="Visits Today" value={stats.todayVisits} icon={TrendingUp} />
        <MiniStat label="Visits This Week" value={stats.weekVisits} icon={Calendar} />
        <MiniStat label="Registered Users" value={profiles.length} icon={UserCircle} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rating distribution */}
        {count > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
              <Star className="h-4 w-4 text-amber-500" fill="currentColor" />
              Rating Distribution
            </h3>
            <div className="space-y-2">
              {distribution.map((d) => (
                <div key={d.star} className="flex items-center gap-3">
                  <div className="flex w-16 items-center gap-1">
                    <span className="text-sm font-medium text-slate-700">{d.star}</span>
                    <Star className="h-3 w-3 text-amber-400" fill="currentColor" />
                  </div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all"
                      style={{ width: `${count > 0 ? (d.count / count) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-medium text-slate-500">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedback by category */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
            <MessageSquare className="h-4 w-4 text-sky-500" />
            Feedback by Category
          </h3>
          <div className="space-y-2">
            {feedbackByCategory.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.value} className="flex items-center gap-3">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${cat.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-slate-700">{cat.label}</span>
                  <span className="text-sm font-bold text-slate-900">{cat.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent feedback */}
      {recentFeedback.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-slate-900">Recent Feedback</h3>
          <div className="space-y-3">
            {recentFeedback.map((item) => {
              const cat = CATEGORIES.find((c) => c.value === item.category);
              const CatIcon = cat?.icon ?? MessageSquare;
              return (
                <div key={item.id} className="flex items-start gap-3 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cat?.color ?? 'bg-slate-100 text-slate-400'}`}>
                    <CatIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{item.subject}</p>
                    <p className="truncate text-xs text-slate-500">{item.message}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <span>{item.user_name || item.user_email || 'Anonymous'}</span>
                      <span>·</span>
                      <span>{timeAgo(item.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent users */}
      {recentProfiles.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-slate-900">Recent Users</h3>
          <div className="space-y-2">
            {recentProfiles.map((p) => (
              <div key={p.id} className="flex items-center gap-3 border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-xs font-bold text-white">
                  {(p.full_name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{p.full_name || 'Unknown'}</p>
                  <p className="text-xs text-slate-400">Joined {timeAgo(p.created_at)}</p>
                </div>
                {p.is_employer && (
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">Employer</span>
                )}
                {p.profile_completed ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Complete</span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Pending</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FeedbackTab() {
  const { feedback, loading, updateStatus } = useAllFeedback();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');

  const filtered = useMemo(() => {
    let result = feedback;
    if (filterCat !== 'all') result = result.filter((f) => f.category === filterCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((f) =>
        f.subject.toLowerCase().includes(q) ||
        f.message.toLowerCase().includes(q) ||
        (f.user_name || '').toLowerCase().includes(q) ||
        (f.user_email || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [feedback, search, filterCat]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search feedback..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          <button
            onClick={() => setFilterCat('all')}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap ${
              filterCat === 'all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All ({feedback.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = feedback.filter((f) => f.category === cat.value).length;
            const Icon = cat.icon;
            return (
              <button
                key={cat.value}
                onClick={() => setFilterCat(cat.value)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap ${
                  filterCat === cat.value ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <MessageSquare className="mx-auto mb-3 h-12 w-12 text-slate-200" />
          <p className="text-sm font-medium text-slate-600">No feedback found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const cat = CATEGORIES.find((c) => c.value === item.category);
            const status = STATUS_STYLES[item.status];
            const CatIcon = cat?.icon ?? MessageSquare;
            const StatusIcon = status.icon;
            return (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cat?.color ?? 'bg-slate-100 text-slate-400'}`}>
                    <CatIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-slate-900">{item.subject}</h4>
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-600">{item.message}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-[10px] font-bold text-white">
                          {(item.user_name || item.user_email || 'A').charAt(0).toUpperCase()}
                        </div>
                        {item.user_name || item.user_email || 'Anonymous'}
                      </span>
                      <span>·</span>
                      <span>{timeAgo(item.created_at)}</span>
                    </div>

                    {/* Status changer */}
                    <div className="mt-3 flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">Set status:</span>
                      {(['open', 'reviewing', 'resolved'] as FeedbackStatus[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => updateStatus(item.id, s)}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                            item.status === s
                              ? STATUS_STYLES[s].color
                              : 'border border-slate-200 text-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          {STATUS_STYLES[s].label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RatingsTab() {
  const { ratings, loading, average, count, distribution } = useAllRatings();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
        <Star className="mx-auto mb-3 h-12 w-12 text-slate-200" />
        <p className="text-sm font-medium text-slate-600">No ratings yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-4xl font-bold text-slate-900">{average.toFixed(1)}</p>
            <div className="mt-1 flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`h-4 w-4 ${n <= Math.round(average) ? 'text-amber-400' : 'text-slate-200'}`}
                  fill="currentColor"
                />
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-500">{count} {count === 1 ? 'rating' : 'ratings'}</p>
          </div>
          <div className="flex-1 space-y-2">
            {distribution.map((d) => (
              <div key={d.star} className="flex items-center gap-3">
                <div className="flex w-16 items-center gap-1">
                  <span className="text-sm font-medium text-slate-700">{d.star}</span>
                  <Star className="h-3 w-3 text-amber-400" fill="currentColor" />
                </div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: `${(d.count / count) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right text-xs font-medium text-slate-500">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Individual ratings */}
      <div className="space-y-3">
        {ratings.map((r) => (
          <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-sm font-bold text-white">
                  U
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`h-3.5 w-3.5 ${n <= r.rating ? 'text-amber-400' : 'text-slate-200'}`}
                        fill="currentColor"
                      />
                    ))}
                  </div>
                  {r.comment && <p className="mt-1.5 text-sm text-slate-600">"{r.comment}"</p>}
                  <p className="mt-1.5 text-xs text-slate-400">{timeAgo(r.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VisitorsTab() {
  const { sessions, stats, loading } = useVisitorStats();
  const [filterSignin, setFilterSignin] = useState<'all' | 'signin' | 'visit'>('all');

  const filtered = sessions.filter((s) => {
    if (filterSignin === 'signin') return s.is_signin;
    if (filterSignin === 'visit') return !s.is_signin;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Visits" value={stats.totalVisits} icon={Eye} color="text-sky-600" bg="bg-sky-50" />
        <StatCard label="Unique Browsers" value={stats.uniqueVisitors} icon={Users} color="text-violet-600" bg="bg-violet-50" />
        <StatCard label="Signed-in Users" value={stats.signedInUsers} icon={LogIn} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Visits Today" value={stats.todayVisits} icon={TrendingUp} color="text-amber-600" bg="bg-amber-50" />
      </div>

      {/* Filter */}
      <div className="flex gap-1.5">
        {([
          { key: 'all', label: 'All Activity' },
          { key: 'signin', label: 'Sign-ins Only' },
          { key: 'visit', label: 'Visits Only' },
        ] as { key: typeof filterSignin; label: string }[]).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterSignin(f.key)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              filterSignin === f.key ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Activity log */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <Eye className="mx-auto mb-3 h-12 w-12 text-slate-200" />
          <p className="text-sm font-medium text-slate-600">No visitor activity yet</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="max-h-[500px] overflow-y-auto">
            {filtered.map((s) => (
              <div key={s.id} className="flex items-center gap-3 border-b border-slate-50 px-4 py-3 last:border-0 hover:bg-slate-50/50">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  s.is_signin ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'
                }`}>
                  {s.is_signin ? <LogIn className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {s.user_name || s.user_email || 'Anonymous visitor'}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.is_signin ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'
                    }`}>
                      {s.is_signin ? 'Sign-in' : 'Visit'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {s.page ? `Page: ${s.page}` : 'Session started'} · {timeAgo(s.created_at)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg }: {
  label: string;
  value: number | string;
  icon: typeof Eye;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon }: { label: string; value: number; icon: typeof TrendingUp }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <Icon className="h-4 w-4 text-slate-400" />
      <div>
        <p className="text-lg font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}
