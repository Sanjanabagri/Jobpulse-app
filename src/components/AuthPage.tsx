import { useState } from 'react';
import { Zap, Mail, Lock, User, Loader2, ArrowRight, Sparkles, ShieldCheck, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { VerifyEmail } from './VerifyEmail';
import { ForgotPassword } from './ForgotPassword';

interface AuthPageProps {
  auth: ReturnType<typeof useAuth>;
}

export function AuthPage({ auth }: AuthPageProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [forgotPassword, setForgotPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        await auth.signUp(email, password, fullName);
        setPendingEmail(email);
      } else {
        await auth.signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  function handleResend() {
    if (pendingEmail) auth.resendConfirmation(pendingEmail).catch(() => {});
  }

  if (forgotPassword) {
    return <ForgotPassword auth={auth} onBack={() => { setForgotPassword(false); setError(''); }} />;
  }

  if (pendingEmail) {
    return (
      <VerifyEmail
        email={pendingEmail}
        onSignIn={() => { setPendingEmail(null); setMode('signin'); }}
        onResend={handleResend}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left panel — branding */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-900 p-12 lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900" />
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 shadow-lg shadow-sky-500/30">
            <Zap className="h-6 w-6 text-white" fill="white" />
          </div>
          <span className="text-xl font-bold text-white">JobPulse</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold leading-tight text-white">
              The job platform that<br />
              <span className="bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">
                verifies what's real.
              </span>
            </h1>
            <p className="mt-4 max-w-md text-lg text-slate-300">
              Every posting gets a Trust Score. Every listing shows freshness. Every job matched to your skills.
              No ghost jobs. No scams. No wasted time.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: ShieldCheck, title: 'Trust Score on every job', desc: '0-100 score from source credibility, company signals, and freshness' },
              { icon: TrendingUp, title: 'Freshness Decay System', desc: 'Fresh, Active, Aging, Stale — instantly see what\'s actually live' },
              { icon: Sparkles, title: 'AI Match Score', desc: 'Jobs matched to your verified profile with skill-level fit percentage' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
                  <f.icon className="h-5 w-5 text-sky-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">{f.title}</p>
                  <p className="text-sm text-slate-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-sm text-slate-500">
          81% of Indian recruiters admit to posting ghost jobs. We're fixing that.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/30">
                <Zap className="h-6 w-6 text-white" fill="white" />
              </div>
              <span className="text-xl font-bold text-slate-900">JobPulse</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {mode === 'signup'
              ? 'Join the community. Get verified job triggers daily.'
              : 'Sign in to access your personalized job feed.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {mode === 'signup' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {mode === 'signin' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => { setForgotPassword(true); setError(''); }}
                  className="text-sm font-medium text-sky-600 transition hover:text-sky-700"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Please wait...</>
              ) : (
                <>
                  {mode === 'signup' ? 'Create account' : 'Sign in'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); }}
              className="font-semibold text-sky-600 hover:text-sky-700"
            >
              {mode === 'signup' ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
