import { useState, useEffect } from 'react';
import { Zap, Mail, ArrowRight, Loader2, ArrowLeft, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ForgotPasswordProps {
  auth: ReturnType<typeof useAuth>;
  onBack: () => void;
}

type Step = 'email' | 'reset' | 'done';

export function ForgotPassword({ auth, onBack }: ForgotPasswordProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === 'true') {
      setStep('reset');
    }
  }, []);

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await auth.sendResetOTP(email.trim());
      setStep('reset');
      setSecondsLeft(60);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await auth.verifyOTPAndReset('', '', newPassword);
      setStep('done');
      const url = new URL(window.location.href);
      url.searchParams.delete('reset');
      window.history.replaceState({}, '', url.toString());
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Click the link in your email first.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (secondsLeft > 0) return;
    setLoading(true);
    setError('');
    try {
      await auth.sendResetOTP(email.trim());
      setSecondsLeft(60);
    } catch (err: any) {
      setError(err.message || 'Failed to resend email');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-sky-500/30">
            <Zap className="h-6 w-6 text-white" fill="white" />
          </div>
          <span className="text-xl font-bold text-slate-900">JobPulse</span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          {/* Step: Email */}
          {step === 'email' && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50">
                <Mail className="h-8 w-8 text-sky-600" />
              </div>
              <h1 className="mt-5 text-center text-xl font-bold text-slate-900">Forgot password?</h1>
              <p className="mt-2 text-center text-sm text-slate-600">
                Enter your email and we'll send you a secure link to reset your password.
              </p>

              <form onSubmit={handleSendEmail} className="mt-6 space-y-4">
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

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Sending link...</>
                  ) : (
                    <>Send reset link <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              </form>

              <button
                onClick={onBack}
                className="mt-4 flex w-full items-center justify-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-700"
              >
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </button>
            </>
          )}

          {/* Step: Reset (after clicking email link or waiting) */}
          {step === 'reset' && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50">
                <Lock className="h-8 w-8 text-sky-600" />
              </div>
              <h1 className="mt-5 text-center text-xl font-bold text-slate-900">Set new password</h1>
              <p className="mt-2 text-center text-sm text-slate-600">
                {email ? (
                  <>We sent a reset link to <span className="font-semibold text-slate-900">{email}</span>. Click the link in the email, then set your new password below.</>
                ) : (
                  <>Click the link in your email, then enter your new password below.</>
                )}
              </p>

              <form onSubmit={handleResetPassword} className="mt-6 space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">New password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Confirm password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</>
                  ) : (
                    <>Reset password <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              </form>

              {/* Resend */}
              {email && (
                <div className="mt-4 text-center">
                  {secondsLeft > 0 ? (
                    <p className="text-sm text-slate-400">Resend link in {secondsLeft}s</p>
                  ) : (
                    <button
                      onClick={handleResend}
                      disabled={loading}
                      className="text-sm font-medium text-sky-600 transition hover:text-sky-700 disabled:opacity-50"
                    >
                      Resend reset link
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={() => { setStep('email'); setError(''); }}
                className="mt-3 flex w-full items-center justify-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-700"
              >
                <ArrowLeft className="h-4 w-4" /> Change email
              </button>
            </>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h1 className="mt-5 text-center text-xl font-bold text-slate-900">Password reset!</h1>
              <p className="mt-2 text-center text-sm text-slate-600">
                Your password has been updated successfully. You can now sign in with your new password.
              </p>

              <button
                onClick={onBack}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]"
              >
                Back to sign in <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          Your password is securely reset via Supabase Auth
        </p>
      </div>
    </div>
  );
}
