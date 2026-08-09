import { useState } from 'react';
import {
  Users, Plus, Trash2, Mail, Copy, Check, Loader2,
  UserPlus, Briefcase, Share2, X, Clock, CheckCircle2, ExternalLink,
} from 'lucide-react';
import { useTeams, useTeamMembers, useSharedJobs, useUserJobsForSharing } from '@/hooks/useTeams';
import { useJobPostings } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { timeAgo } from '@/lib/utils';
import type { Team } from '@/types';

export function TeamsPage() {
  const auth = useAuth();
  const { teams, loading, createTeam, deleteTeam } = useTeams();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const team = await createTeam(teamName.trim(), teamDesc.trim() || undefined);
      if (team) {
        setSelectedTeam(team);
        setShowCreate(false);
        setTeamName('');
        setTeamDesc('');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  if (selectedTeam) {
    return (
      <TeamDetail
        team={selectedTeam}
        onBack={() => setSelectedTeam(null)}
        currentUserId={auth.user?.id ?? null}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Teams</h2>
          <p className="mt-1 text-sm text-slate-500">Create teams, invite teammates, and share jobs together.</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Team</span>
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Team name (e.g. Frontend Squad)"
              maxLength={80}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
            <textarea
              value={teamDesc}
              onChange={(e) => setTeamDesc(e.target.value)}
              placeholder="What's this team about? (optional)"
              rows={2}
              maxLength={300}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={creating || !teamName.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:opacity-50"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create Team
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Teams list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        </div>
      ) : teams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <Users className="mx-auto mb-3 h-12 w-12 text-slate-200" />
          <p className="text-sm font-medium text-slate-600">No teams yet</p>
          <p className="mt-1 text-sm text-slate-400">Create a team to start sharing jobs with your teammates.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team)}
              className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-sky-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/20">
                  <Users className="h-5 w-5 text-white" />
                </div>
                {team.owner_id === auth.user?.id && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">Owner</span>
                )}
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-900">{team.name}</h3>
              {team.description && <p className="mt-1 text-sm text-slate-500 line-clamp-2">{team.description}</p>}
              <p className="mt-2 text-xs text-slate-400">Created {timeAgo(team.created_at)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TeamDetail({ team, onBack, currentUserId }: { team: Team; onBack: () => void; currentUserId: string | null }) {
  const { members, loading: membersLoading, inviteMember, removeMember } = useTeamMembers(team.id);
  const { sharedJobs, loading: sharedLoading, shareJob, unshareJob } = useSharedJobs(team.id);
  const { savedJobs } = useUserJobsForSharing();
  const auth = useAuth();
  const { jobs } = useJobPostings(null, auth.profile);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [showSharePicker, setShowSharePicker] = useState(false);
  const [shareNote, setShareNote] = useState('');
  const [copied, setCopied] = useState(false);

  const isOwner = team.owner_id === currentUserId;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError(null);
    try {
      await inviteMember(inviteEmail.trim());
      setInviteEmail('');
    } catch (err: any) {
      setInviteError(err.code === '23505' ? 'This email has already been invited.' : err.message);
    } finally {
      setInviting(false);
    }
  }

  function copyInviteLink() {
    const url = `${window.location.origin}/?team=${team.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleShareJob(jobId: string) {
    try {
      await shareJob(jobId, shareNote.trim() || undefined);
      setShareNote('');
      setShowSharePicker(false);
    } catch (err: any) {
      // ignore duplicate
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Back button + header */}
      <button onClick={onBack} className="mb-4 text-sm font-medium text-sky-600 transition hover:text-sky-700">
        ← Back to Teams
      </button>

      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/20">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">{team.name}</h2>
            {team.description && <p className="text-sm text-slate-500">{team.description}</p>}
          </div>
        </div>
        {isOwner && (
          <button
            onClick={() => {
              if (confirm('Delete this team? All members and shared jobs will be removed.')) {
                deleteTeam(team.id);
                onBack();
              }
            }}
            className="rounded-lg p-2 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Members */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-slate-400" />
            <h3 className="text-base font-semibold text-slate-900">Members</h3>
          </div>

          {/* Invite form */}
          {isOwner && (
            <form onSubmit={handleInvite} className="mb-4 space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="teammate@email.com"
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Invite
                </button>
              </div>
              {inviteError && <p className="text-sm text-red-600">{inviteError}</p>}
            </form>
          )}

          {/* Share invite link */}
          <button
            onClick={copyInviteLink}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-600"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Link copied!' : 'Copy invite link'}
          </button>

          {/* Member list */}
          {membersLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-xs font-bold text-white">
                      {(m.invited_email || 'TM').split('@')[0].slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {m.invited_email || 'Team member'}
                      </p>
                      <div className="flex items-center gap-1.5">
                        {m.role === 'owner' && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">Owner</span>
                        )}
                        <span className={`inline-flex items-center gap-1 text-xs ${
                          m.status === 'accepted' ? 'text-emerald-600' : m.status === 'pending' ? 'text-amber-500' : 'text-slate-400'
                        }`}>
                          {m.status === 'accepted' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {m.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isOwner && m.role !== 'owner' && (
                    <button
                      onClick={() => removeMember(m.id)}
                      className="rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shared Jobs */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-slate-400" />
              <h3 className="text-base font-semibold text-slate-900">Shared Jobs</h3>
            </div>
            <button
              onClick={() => setShowSharePicker(!showSharePicker)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
            >
              <Plus className="h-3.5 w-3.5" />
              Share a job
            </button>
          </div>

          {/* Job picker */}
          {showSharePicker && (
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <input
                type="text"
                value={shareNote}
                onChange={(e) => setShareNote(e.target.value)}
                placeholder="Add a note (optional)..."
                className="mb-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none"
              />
              <div className="max-h-64 space-y-1.5 overflow-y-auto">
                {/* Show saved jobs first, then recent jobs */}
                {[...savedJobs, ...jobs.filter((j) => !savedJobs.some((s) => s.id === j.id))]
                  .slice(0, 20)
                  .map((job) => (
                    <button
                      key={job.id}
                      onClick={() => handleShareJob(job.id)}
                      className="flex w-full items-center gap-2 rounded-lg border border-slate-100 bg-white p-2.5 text-left transition hover:border-sky-200 hover:bg-sky-50"
                    >
                      <Briefcase className="h-4 w-4 shrink-0 text-slate-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{job.title}</p>
                        <p className="truncate text-xs text-slate-400">{job.company}</p>
                      </div>
                      <Share2 className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Shared jobs list */}
          {sharedLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            </div>
          ) : sharedJobs.length === 0 ? (
            <div className="py-8 text-center">
              <Share2 className="mx-auto mb-2 h-10 w-10 text-slate-200" />
              <p className="text-sm text-slate-400">No jobs shared yet</p>
              <p className="text-xs text-slate-400">Share jobs with your team to collaborate.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sharedJobs.map((sj) => (
                <div key={sj.id} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {sj.job_postings && (
                        <>
                          <p className="truncate text-sm font-medium text-slate-800">{sj.job_postings.title}</p>
                          <p className="truncate text-xs text-slate-400">{sj.job_postings.company}</p>
                        </>
                      )}
                      {sj.note && <p className="mt-1 text-xs italic text-slate-500">"{sj.note}"</p>}
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-xs text-slate-400">{timeAgo(sj.created_at)}</span>
                        {sj.job_postings?.url && (
                          <a
                            href={sj.job_postings.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-xs font-medium text-sky-600 hover:text-sky-700"
                          >
                            View <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                    {(isOwner || sj.shared_by === currentUserId) && (
                      <button
                        onClick={() => unshareJob(sj.id)}
                        className="shrink-0 rounded-lg p-1 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
