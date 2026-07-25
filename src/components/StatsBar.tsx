import { TrendingUp, Globe, Users, CalendarClock } from 'lucide-react';
import { useJobStats, useSubscriberCount } from '@/hooks/useData';

export function StatsBar() {
  const { stats, loading } = useJobStats();
  const subscriberCount = useSubscriberCount();

  const cards = [
    { label: 'Total Jobs', value: stats.total, icon: Globe, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'New (24h)', value: stats.newToday, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Remote Roles', value: stats.remote, icon: Globe, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Subscribers', value: subscriberCount, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:px-6 sm:grid-cols-4 lg:px-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bg}`}>
              <Icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {loading ? '...' : card.value}
              </p>
              <p className="text-xs font-medium text-slate-500">{card.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
