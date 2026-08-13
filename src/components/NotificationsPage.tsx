import { useState } from 'react';
import { Bell, Check, Trash2, X, Briefcase, Users, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { timeAgo } from '@/lib/utils';
import type { NotificationType } from '@/types';

const TYPE_ICONS: Record<NotificationType, typeof Bell> = {
  job_alert: Briefcase,
  application_update: Check,
  team_invite: Users,
  system: AlertCircle,
  promoted: Sparkles,
};

const TYPE_COLORS: Record<NotificationType, string> = {
  job_alert: 'text-sky-600 bg-sky-50',
  application_update: 'text-emerald-600 bg-emerald-50',
  team_invite: 'text-violet-600 bg-violet-50',
  system: 'text-slate-600 bg-slate-100',
  promoted: 'text-amber-600 bg-amber-50',
};

export function NotificationsPage() {
  const { notifications, unreadCount, loading, markAsRead, markAllRead, deleteNotification } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const shown = filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Notifications</h2>
          <p className="mt-1 text-sm text-slate-500">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
            <Check className="h-4 w-4" /> Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-1.5">
        {(['all', 'unread'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filter === f ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}>
            {f === 'all' ? 'All' : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <Bell className="mx-auto mb-3 h-12 w-12 text-slate-200" />
          <p className="text-sm font-medium text-slate-600">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {shown.map((n) => {
            const Icon = TYPE_ICONS[n.type] ?? Bell;
            const colorClass = TYPE_COLORS[n.type] ?? TYPE_COLORS.system;
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 rounded-xl border p-4 transition ${
                  n.is_read ? 'border-slate-100 bg-white' : 'border-sky-100 bg-sky-50/30'
                }`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${n.is_read ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`}>
                      {n.title}
                    </p>
                    {!n.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" />}
                  </div>
                  {n.body && <p className="mt-0.5 text-sm text-slate-500">{n.body}</p>}
                  <p className="mt-1 text-xs text-slate-400">{timeAgo(n.created_at)}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {!n.is_read && (
                    <button onClick={() => markAsRead(n.id)} title="Mark read"
                      className="rounded-lg p-1.5 text-slate-300 transition hover:bg-sky-100 hover:text-sky-600">
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => deleteNotification(n.id)} title="Delete"
                    className="rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
