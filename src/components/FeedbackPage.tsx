import { useState } from 'react';
import {
  MessageSquare, Star, Bug, Lightbulb, Heart, Send, Trash2,
  CheckCircle2, Clock, AlertCircle, Loader2,
} from 'lucide-react';
import { useUserFeedback, useAppRating } from '@/hooks/useFeedback';
import type { FeedbackCategory, FeedbackStatus } from '@/types';
import { timeAgo } from '@/lib/utils';

const CATEGORIES: { value: FeedbackCategory; label: string; icon: typeof Bug; color: string }[] = [
  { value: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'feature_request', label: 'Feature Request', icon: Lightbulb, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { value: 'general', label: 'General', icon: MessageSquare, color: 'text-sky-600 bg-sky-50 border-sky-200' },
  { value: 'praise', label: 'Praise', icon: Heart, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
];

const STATUS_STYLES: Record<FeedbackStatus, { label: string; icon: typeof Clock; color: string }> = {
  open: { label: 'Open', icon: AlertCircle, color: 'text-amber-600 bg-amber-50' },
  reviewing: { label: 'Reviewing', icon: Clock, color: 'text-sky-600 bg-sky-50' },
  resolved: { label: 'Resolved', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
};

export function FeedbackPage() {
  const { feedback, loading, submitFeedback, deleteFeedback } = useUserFeedback();
  const { myRating, average, count, submitRating } = useAppRating();

  const [category, setCategory] = useState<FeedbackCategory>('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await submitFeedback(category, subject.trim(), message.trim());
      setSubject('');
      setMessage('');
      setCategory('general');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRatingSubmit() {
    if (!myRating && hoverRating === 0) return;
    const value = hoverRating || myRating?.rating || 0;
    if (value === 0) return;
    setRatingSubmitting(true);
    try {
      await submitRating(value, ratingComment.trim() || undefined);
      setRatingComment('');
      setRatingSuccess(true);
      setTimeout(() => setRatingSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRatingSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Feedback & Ratings</h2>
        <p className="mt-1 text-sm text-slate-500">Help us improve JobPulse. Share your thoughts and rate your experience.</p>
      </div>

      {/* Rating Section */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-5 w-5 text-amber-500" fill="currentColor" />
          <h3 className="text-lg font-semibold text-slate-900">Rate JobPulse</h3>
        </div>

        {/* Average display */}
        {count > 0 && (
          <div className="mb-4 flex items-center gap-4 rounded-xl bg-slate-50 p-3">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900">{average.toFixed(1)}</p>
              <div className="mt-0.5 flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`h-3.5 w-3.5 ${n <= Math.round(average) ? 'text-amber-400' : 'text-slate-200'}`}
                    fill="currentColor"
                  />
                ))}
              </div>
            </div>
            <div className="text-sm text-slate-500">
              Based on {count} {count === 1 ? 'rating' : 'ratings'}
            </div>
          </div>
        )}

        {/* Star selector */}
        <div className="mb-3">
          <p className="mb-2 text-sm font-medium text-slate-700">
            {myRating ? 'Update your rating' : 'Your rating'}
          </p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setHoverRating(n)}
                className="transition hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 transition ${
                    n <= (hoverRating || myRating?.rating || 0)
                      ? 'text-amber-400'
                      : 'text-slate-200'
                  }`}
                  fill="currentColor"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Optional comment */}
        <textarea
          value={ratingComment}
          onChange={(e) => setRatingComment(e.target.value)}
          placeholder="Add a comment (optional)..."
          rows={2}
          className="mb-3 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
        />

        <button
          onClick={handleRatingSubmit}
          disabled={ratingSubmitting || (hoverRating === 0 && !myRating)}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {ratingSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
          {myRating ? 'Update Rating' : 'Submit Rating'}
        </button>

        {ratingSuccess && (
          <p className="mt-2 text-sm font-medium text-emerald-600">Thanks for rating!</p>
        )}
      </div>

      {/* Feedback Form */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-sky-500" />
          <h3 className="text-lg font-semibold text-slate-900">Send Feedback</h3>
        </div>

        {/* Category pills */}
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                  category === cat.value
                    ? cat.color
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{cat.label}</span>
                <span className="sm:hidden">{cat.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            maxLength={120}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us more..."
            rows={4}
            maxLength={2000}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm font-medium text-emerald-600">Feedback sent! Thank you.</p>}
          <button
            type="submit"
            disabled={submitting || !subject.trim() || !message.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit Feedback
          </button>
        </form>
      </div>

      {/* Previous Feedback */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Your Feedback History</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
          </div>
        ) : feedback.length === 0 ? (
          <div className="py-8 text-center">
            <MessageSquare className="mx-auto mb-2 h-10 w-10 text-slate-200" />
            <p className="text-sm text-slate-400">No feedback submitted yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {feedback.map((item) => {
              const cat = CATEGORIES.find((c) => c.value === item.category);
              const status = STATUS_STYLES[item.status];
              const StatusIcon = status.icon;
              const CatIcon = cat?.icon ?? MessageSquare;
              return (
                <div key={item.id} className="rounded-xl border border-slate-100 p-4 transition hover:border-slate-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <CatIcon className={`h-4 w-4 ${cat?.color.split(' ')[0] ?? 'text-slate-400'}`} />
                        <p className="truncate text-sm font-semibold text-slate-900">{item.subject}</p>
                      </div>
                      <p className="mt-1.5 text-sm text-slate-600">{item.message}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                        <span className="text-xs text-slate-400">{timeAgo(item.created_at)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteFeedback(item.id)}
                      className="shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
