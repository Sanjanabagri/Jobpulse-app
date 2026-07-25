import { CalendarClock, ArrowUpRight, Building2 } from 'lucide-react';
import type { DailyDigest } from '@/types';
import { DomainIcon } from './DomainIcon';

export function DigestView({ digests, loading }: { digests: DailyDigest[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-3 p-4 sm:px-6 lg:px-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (digests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <CalendarClock className="h-10 w-10 text-slate-300" />
        <p className="mt-3 font-medium text-slate-600">No daily triggers yet</p>
        <p className="mt-1 text-sm text-slate-400">Triggers are generated after the daily fetch runs.</p>
      </div>
    );
  }

  const today = digests[0]?.digest_date;
  const todayDigests = digests.filter((d) => d.digest_date === today && d.trigger_sent);
  const previousDigests = digests.filter((d) => d.digest_date !== today);

  return (
    <div className="space-y-6 p-4 sm:px-6 lg:px-8">
      {todayDigests.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <h2 className="font-bold text-slate-900">Today's Triggers</h2>
            <span className="text-sm text-slate-400">{today}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {todayDigests.map((digest) => (
              <DigestCard key={digest.id} digest={digest} />
            ))}
          </div>
        </section>
      )}

      {previousDigests.length > 0 && (
        <section>
          <h2 className="mb-3 font-bold text-slate-900">Previous Triggers</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {previousDigests.filter((d) => d.trigger_sent).slice(0, 12).map((digest) => (
              <DigestCard key={digest.id} digest={digest} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function DigestCard({ digest }: { digest: DailyDigest }) {
  const domain = digest.domains;
  if (!domain) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${domain.color} text-white shadow-sm`}>
            <DomainIcon name={domain.icon} className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold text-slate-900">{domain.name}</p>
            <p className="text-xs text-slate-400">{digest.digest_date}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5">
          <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-sm font-bold text-emerald-700">{digest.job_count}</span>
        </div>
      </div>

      {digest.top_companies && digest.top_companies.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="mb-1.5 flex items-center gap-1 text-xs font-medium text-slate-500">
            <Building2 className="h-3 w-3" /> Top companies hiring
          </p>
          <div className="flex flex-wrap gap-1.5">
            {digest.top_companies.slice(0, 5).map((company) => (
              <span key={company} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                {company}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
