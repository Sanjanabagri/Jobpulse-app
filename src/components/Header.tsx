import { Zap, RefreshCw, Bell } from 'lucide-react';
import { useState } from 'react';
import { EDGE_FUNCTIONS } from '@/lib/supabase';
import { triggerEdgeFunction } from '@/lib/utils';
import { ProfileMenu } from './ProfileMenu';
import { useNotifications } from '@/hooks/useNotifications';
import type { Profile, Domain } from '@/types';

interface HeaderProps {
  onSubscribe: () => void;
  onRefresh: () => void;
  subscriberCount: number;
  profile: Profile | null;
  domains: Domain[];
  onSignOut: () => void;
  onEditProfile: () => void;
  onNavigate?: (tab: 'feedback' | 'teams' | 'saved' | 'applications' | 'employer' | 'notifications') => void;
}

export function Header({ onSubscribe, onRefresh, subscriberCount, profile, domains, onSignOut, onEditProfile, onNavigate }: HeaderProps) {
  const [fetching, setFetching] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { unreadCount } = useNotifications();

  async function handleFetch() {
    setFetching(true);
    setToast('Crawling job portals...');
    const result = await triggerEdgeFunction(EDGE_FUNCTIONS.fetchJobs);
    setFetching(false);
    if (result.success) {
      const data = result.message as any;
      setToast(`Fetched ${data.fetched} new jobs from ${Object.keys(data.per_source).length} sources`);
      onRefresh();
    } else {
      setToast(`Fetch failed: ${result.message}`);
    }
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/30">
            <Zap className="h-5 w-5 text-white" fill="white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">JobPulse</h1>
            <p className="hidden text-xs text-slate-500 sm:block">Verified jobs. Trust scores. AI matching.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {subscriberCount} subscribed
          </div>

          <button
            onClick={handleFetch}
            disabled={fetching}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${fetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Fetch Jobs</span>
          </button>

          {!profile && (
            <button
              onClick={onSubscribe}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-95"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Subscribe</span>
            </button>
          )}

          {profile && (
            <button
              onClick={() => onNavigate?.('notifications')}
              className="relative inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {profile && (
            <ProfileMenu profile={profile} domains={domains} onSignOut={onSignOut} onEditProfile={onEditProfile} onNavigate={onNavigate} />
          )}
        </div>
      </div>

      {toast && (
        <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}
    </header>
  );
}
