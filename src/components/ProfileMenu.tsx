import { useState, useRef, useEffect } from 'react';
import {
  User, LogOut, ChevronDown, CheckCircle2, Award, MapPin, Target,
  Settings, Bookmark, Eye, Briefcase, Zap, Star, Users, Building2, Bell, Send,
} from 'lucide-react';
import type { Profile, Domain } from '@/types';
import { DomainIcon } from './DomainIcon';

interface ProfileMenuProps {
  profile: Profile;
  domains: Domain[];
  onSignOut: () => void;
  onEditProfile: () => void;
  onNavigate?: (tab: 'feedback' | 'teams' | 'saved' | 'applications' | 'employer' | 'notifications') => void;
}

type View = 'menu' | 'profile';

export function ProfileMenu({ profile, domains, onSignOut, onEditProfile, onNavigate }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('menu');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setView('menu');
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const preferredDomain = domains.find((d) => d.id === profile.preferred_domain_id);

  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(!open); setView('menu'); }}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-2 transition hover:border-slate-300 hover:bg-slate-50"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-bold text-white">
          {initials}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          {/* Header card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-base font-bold text-white">
                {initials}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-semibold text-white">{profile.full_name}</p>
                  {profile.verified && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-sky-400" />}
                </div>
                <p className="truncate text-xs text-slate-400">{profile.headline || 'No headline set'}</p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          {view === 'menu' && (
            <div className="py-1">
              <button
                onClick={() => setView('profile')}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <Eye className="h-4 w-4 text-slate-400" />
                View Profile
              </button>
              <button
                onClick={() => { onEditProfile(); setOpen(false); }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                Edit Profile
              </button>
              <button
                onClick={() => { onNavigate?.('saved'); setOpen(false); }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <Bookmark className="h-4 w-4 text-slate-400" />
                Saved Jobs
              </button>
              <button
                onClick={() => { onNavigate?.('applications'); setOpen(false); }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <Send className="h-4 w-4 text-slate-400" />
                Applications
              </button>
              <button
                onClick={() => { onNavigate?.('employer'); setOpen(false); }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <Building2 className="h-4 w-4 text-slate-400" />
                Employer Dashboard
              </button>
              <button
                onClick={() => { onNavigate?.('notifications'); setOpen(false); }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <Bell className="h-4 w-4 text-slate-400" />
                Notifications
              </button>
              <div className="my-1 border-t border-slate-100" />
              <button
                onClick={() => { onNavigate?.('teams'); setOpen(false); }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <Users className="h-4 w-4 text-slate-400" />
                Teams
              </button>
              <button
                onClick={() => { onNavigate?.('feedback'); setOpen(false); }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <Star className="h-4 w-4 text-slate-400" />
                Feedback & Rating
              </button>
              <div className="my-1 border-t border-slate-100" />
              <button
                onClick={onSignOut}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}

          {/* Profile view */}
          {view === 'profile' && (
            <div className="max-h-[70vh] overflow-y-auto">
              <div className="sticky top-0 flex items-center gap-2 border-b border-slate-100 bg-white px-4 py-2.5">
                <button onClick={() => setView('menu')} className="text-sm font-medium text-sky-600 hover:text-sky-700">
                  Back
                </button>
                <span className="text-sm font-semibold text-slate-900">Profile</span>
              </div>

              <div className="space-y-3 p-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Current role</p>
                    <p className="text-sm font-medium text-slate-800">{profile.current_job_title || 'Not set'}</p>
                    {profile.current_company && <p className="text-xs text-slate-500">at {profile.current_company}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Experience</p>
                    <p className="text-sm font-medium text-slate-800">{profile.experience_years} years</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Location</p>
                    <p className="text-sm font-medium text-slate-800">{profile.location || 'Not set'}</p>
                  </div>
                </div>

                {preferredDomain && (
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-400">Primary domain</p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className={`flex h-5 w-5 items-center justify-center rounded ${preferredDomain.color} text-white`}>
                          <DomainIcon name={preferredDomain.icon} className="h-3 w-3 text-white" />
                        </span>
                        <span className="text-sm font-medium text-slate-800">{preferredDomain.name}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                    <Zap className="h-3.5 w-3.5" /> Skills ({profile.skills.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.length === 0 ? (
                      <p className="text-sm text-slate-400">No skills added yet</p>
                    ) : (
                      profile.skills.map((s) => (
                        <span key={s} className="rounded-md bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                          {s}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                  <div>
                    <p className="text-xs text-slate-400">Preferred location</p>
                    <p className="text-sm font-medium text-slate-800">
                      {profile.remote_only ? 'Remote only' : profile.preferred_location || 'Any'}
                    </p>
                  </div>
                </div>

                {profile.verified && (
                  <div className="flex items-center gap-2 rounded-lg bg-sky-50 px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 text-sky-600" />
                    <span className="text-xs font-medium text-sky-700">Verified account</span>
                  </div>
                )}

                <button
                  onClick={() => { onEditProfile(); setOpen(false); }}
                  className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
