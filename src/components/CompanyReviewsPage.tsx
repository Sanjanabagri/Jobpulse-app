import { useState, useEffect, useCallback } from 'react';
import {
  Star, Building2, ThumbsUp, ThumbsDown, Loader2, Plus, X,
  TrendingUp, Search, ChevronDown, ChevronUp,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { CompanyReview, ExtendedProfile } from '@/types';
import { timeAgo } from '@/lib/utils';

interface CompanyReviewsPageProps {
  profile: ExtendedProfile | null;
}

const EMPLOYMENT_STATUSES = ['Current Employee', 'Former Employee', 'Contractor', 'Intern'];

export function CompanyReviewsPage({ profile }: CompanyReviewsPageProps) {
  const [reviews, setReviews] = useState<CompanyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('company_reviews')
      .select('*')
      .order('created_at', { ascending: false });
    setReviews((data as CompanyReview[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const filtered = reviews.filter((r) =>
    r.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.pros?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const companyStats = filtered.reduce((acc, r) => {
    if (!acc[r.company_name]) {
      acc[r.company_name] = { total: 0, sum: 0, recommend: 0 };
    }
    acc[r.company_name].total++;
    acc[r.company_name].sum += r.rating;
    if (r.would_recommend) acc[r.company_name].recommend++;
    return acc;
  }, {} as Record<string, { total: number; sum: number; recommend: number }>);

  const topCompanies = Object.entries(companyStats)
    .map(([name, s]) => ({ name, avg: s.sum / s.total, total: s.total, recommendPct: Math.round((s.recommend / s.total) * 100) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const overallAvg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Company Reviews</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Real reviews from people who worked there.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-700 active:scale-95"
        >
          <Plus className="h-4 w-4" /> Write Review
        </button>
      </div>

      {/* Summary stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <Star className="h-3.5 w-3.5" /> Overall Avg
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{overallAvg.toFixed(1)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <Building2 className="h-3.5 w-3.5" /> Companies
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{Object.keys(companyStats).length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <TrendingUp className="h-3.5 w-3.5" /> Reviews
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{reviews.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <ThumbsUp className="h-3.5 w-3.5" /> Recommend
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {reviews.length > 0 ? Math.round((reviews.filter((r) => r.would_recommend).length / reviews.length) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Top companies */}
      {topCompanies.length > 0 && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">Most Reviewed Companies</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topCompanies.map((c) => (
              <div key={c.name} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-700/30">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{c.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`h-3 w-3 ${n <= Math.round(c.avg) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-600'}`} />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{c.avg.toFixed(1)}</span>
                  <span className="ml-auto text-xs text-slate-400">{c.total} review{c.total > 1 ? 's' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company, title, or pros..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center dark:border-slate-700">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No reviews yet</p>
          <p className="mt-1 text-xs text-slate-400">Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((review) => (
            <ReviewCard key={review.id} review={review} expanded={expandedIds.has(review.id)} onToggle={() => toggleExpand(review.id)} />
          ))}
        </div>
      )}

      {/* Write review form */}
      {showForm && (
        <ReviewFormModal
          profile={profile}
          onClose={() => setShowForm(false)}
          onSubmitted={() => {
            setShowForm(false);
            fetchReviews();
          }}
        />
      )}
    </div>
  );
}

function ReviewCard({ review, expanded, onToggle }: { review: CompanyReview; expanded: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600">
            <Building2 className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{review.company_name}</h3>
            <div className="mt-0.5 flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`h-3.5 w-3.5 ${n <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-600'}`} />
                ))}
              </div>
              <span className="text-xs text-slate-400">{timeAgo(review.created_at)}</span>
            </div>
          </div>
        </div>
        {review.would_recommend ? (
          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <ThumbsUp className="h-3 w-3" /> Recommend
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <ThumbsDown className="h-3 w-3" /> Not
          </span>
        )}
      </div>

      {review.title && <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">{review.title}</p>}

      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        {review.pros && (
          <div className="rounded-xl bg-emerald-50/50 p-3 dark:bg-emerald-900/20">
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Pros</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">{review.pros}</p>
          </div>
        )}
        {review.cons && (
          <div className="rounded-xl bg-red-50/50 p-3 dark:bg-red-900/20">
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Cons</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">{review.cons}</p>
          </div>
        )}
      </div>

      {(review.job_title || review.employment_status) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          {review.job_title && <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">{review.job_title}</span>}
          {review.employment_status && <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">{review.employment_status}</span>}
        </div>
      )}

      {review.pros && review.cons && (review.pros.length > 120 || review.cons.length > 120) && (
        <button onClick={onToggle} className="mt-2 flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700">
          {expanded ? <>Show less <ChevronUp className="h-3 w-3" /></> : <>Show more <ChevronDown className="h-3 w-3" /></>}
        </button>
      )}
    </div>
  );
}

function ReviewFormModal({ profile, onClose, onSubmitted }: { profile: ExtendedProfile | null; onClose: () => void; onSubmitted: () => void }) {
  const [companyName, setCompanyName] = useState('');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [jobTitle, setJobTitle] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState(EMPLOYMENT_STATUSES[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!companyName.trim()) { setError('Company name is required'); return; }
    if (!pros.trim() && !cons.trim()) { setError('Please share at least pros or cons'); return; }
    setSubmitting(true);
    setError(null);
    const { error: insertError } = await supabase.from('company_reviews').insert({
      company_name: companyName.trim(),
      rating,
      title: title.trim() || null,
      pros: pros.trim() || null,
      cons: cons.trim() || null,
      would_recommend: wouldRecommend,
      job_title: jobTitle.trim() || null,
      employment_status: employmentStatus,
    });
    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
    } else {
      onSubmitted();
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-800">
        <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Write a Review</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Company Name *</label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Google, Microsoft, TCS"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Rating *</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRating(n)}
                    className="transition hover:scale-110"
                  >
                    <Star className={`h-7 w-7 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-600'}`} />
                  </button>
                ))}
                <span className="ml-2 text-sm font-medium text-slate-600 dark:text-slate-300">{rating}/5</span>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Review Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your experience"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-emerald-600 dark:text-emerald-400">Pros</label>
                <textarea
                  value={pros}
                  onChange={(e) => setPros(e.target.value)}
                  placeholder="What did you love?"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-red-600 dark:text-red-400">Cons</label>
                <textarea
                  value={cons}
                  onChange={(e) => setCons(e.target.value)}
                  placeholder="What could be better?"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Would you recommend this company?</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setWouldRecommend(true)}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition ${wouldRecommend ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}
                >
                  <ThumbsUp className="h-4 w-4" /> Yes, recommend
                </button>
                <button
                  onClick={() => setWouldRecommend(false)}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition ${!wouldRecommend ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}
                >
                  <ThumbsDown className="h-4 w-4" /> No
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Your Job Title</label>
                <input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Engineer"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Employment Status</label>
                <select
                  value={employmentStatus}
                  onChange={(e) => setEmploymentStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                >
                  {EMPLOYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && <p className="text-sm font-medium text-red-500">{error}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 p-5 dark:border-slate-700">
          <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 active:scale-95 disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </>
  );
}
