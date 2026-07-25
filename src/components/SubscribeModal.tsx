import { useState } from 'react';
import { X, Mail, Check, Loader2, Bell } from 'lucide-react';
import type { Domain } from '@/types';
import { supabase } from '@/lib/supabase';
import { DomainIcon } from './DomainIcon';

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  domains: Domain[];
}

export function SubscribeModal({ isOpen, onClose, domains }: SubscribeModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedDomainIds, setSelectedDomainIds] = useState<string[]>([]);
  const [locationPref, setLocationPref] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  function toggleDomain(id: string) {
    setSelectedDomainIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    setErrorMsg('');

    const { error } = await supabase.from('subscriptions').upsert({
      email: email.trim().toLowerCase(),
      name: name.trim() || null,
      domain_ids: selectedDomainIds,
      location_pref: locationPref.trim() || null,
      remote_only: remoteOnly,
      is_active: true,
    }, { onConflict: 'email' });

    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
    } else {
      setStatus('success');
    }
  }

  function handleClose() {
    setStatus('idle');
    setEmail('');
    setName('');
    setSelectedDomainIds([]);
    setLocationPref('');
    setRemoteOnly(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
        {status === 'success' ? (
          <div className="flex flex-col items-center p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">You're subscribed!</h2>
            <p className="mt-2 text-sm text-slate-600">
              You'll receive daily job triggers for your selected domains. The agent crawls fresh postings every day and matches them to your preferences.
            </p>
            <button
              onClick={handleClose}
              className="mt-6 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between border-b border-slate-200 p-6">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
                    <Bell className="h-4 w-4 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Join the Community</h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">Get daily job triggers delivered to your inbox, filtered by your domains.</p>
              </div>
              <button onClick={handleClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Email *</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Pick your domains <span className="text-slate-400">(get triggers only for these)</span>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {domains.map((domain) => {
                    const selected = selectedDomainIds.includes(domain.id);
                    return (
                      <button
                        key={domain.id}
                        type="button"
                        onClick={() => toggleDomain(domain.id)}
                        className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition ${
                          selected
                            ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${domain.color} text-white`}>
                          <DomainIcon name={domain.icon} className="h-3.5 w-3.5" />
                        </span>
                        <span className="truncate text-xs font-medium text-slate-700">{domain.name}</span>
                        {selected && <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-900" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Location preference</label>
                  <input
                    type="text"
                    value={locationPref}
                    onChange={(e) => setLocationPref(e.target.value)}
                    placeholder="e.g. Bangalore, Remote, India"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Remote only?</label>
                  <button
                    type="button"
                    onClick={() => setRemoteOnly(!remoteOnly)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                      remoteOnly ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    {remoteOnly ? 'Yes, remote only' : 'No, show all'}
                    <span className={`relative h-5 w-9 rounded-full transition ${remoteOnly ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${remoteOnly ? 'left-4' : 'left-0.5'}`} />
                    </span>
                  </button>
                </div>
              </div>

              {status === 'error' && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading' || !email.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Subscribing...</>
                ) : (
                  <><Bell className="h-4 w-4" /> Subscribe to Daily Triggers</>
                )}
              </button>

              <p className="text-center text-xs text-slate-400">
                Free. No account needed. Unsubscribe anytime.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
