import { TrendingUp, Globe, Users, Briefcase } from 'lucide-react';
import { useJobStats, useSubscriberCount } from '@/hooks/useData';

export function StatsBar() {
  const { stats, loading } = useJobStats();
  const subscriberCount = useSubscriberCount();

  const cards = [
    { label: 'Total Jobs', value: stats.total, icon: Globe, color: 'text-sky-600', bg: 'bg-sky-50', ring: 'group-hover:ring-sky-200' },
    { label: 'New (24h)', value: stats.newToday, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'group-hover:ring-emerald-200' },
    { label: 'Remote Roles', value: stats.remote, icon: Briefcase, color: 'text-violet-600', bg: 'bg-violet-50', ring: 'group-hover:ring-violet-200' },
    { label: 'Subscribers', value: subscriberCount, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50', ring: 'group-hover:ring-amber-200' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:px-6 sm:grid-cols-4 lg:px-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bg} ring-2 ring-transparent transition-all ${card.ring}`}>
              <Icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {loading ? <span className="inline-block h-6 w-8 animate-pulse rounded bg-slate-100" /> : card.value}
              </p>
              <p className="text-xs font-medium text-slate-500">{card.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
