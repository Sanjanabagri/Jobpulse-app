import { useState, useEffect } from 'react';
import { Zap, MailCheck, ArrowRight, Loader2, RefreshCw, LogIn } from 'lucide-react';

interface VerifyEmailProps {
  email: string;
  onSignIn: () => void;
  onResend: () => void;
}

export function VerifyEmail({ email, onSignIn, onResend }: VerifyEmailProps) {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  function handleResend() {
    setResending(true);
    onResend();
    setTimeout(() => {
      setResending(false);
      setResent(true);
      setSecondsLeft(30);
    }, 800);
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

        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50">
            <MailCheck className="h-8 w-8 text-sky-600" />
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-900">Check your email</h1>
          <p className="mt-2 text-sm text-slate-600">
            We've sent a confirmation link to
          </p>
          <p className="mt-0.5 font-semibold text-slate-900">{email}</p>
          <p className="mt-3 text-sm text-slate-500">
            Click the link in the email to verify your account, then sign in below.
          </p>

          {/* Resend */}
          <div className="mt-6">
            {resent ? (
              <p className="text-sm text-emerald-600">
                Confirmation email resent{secondsLeft > 0 ? ` · resend in ${secondsLeft}s` : ''}
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending || secondsLeft > 0}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:text-sky-700 disabled:opacity-50"
              >
                {resending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Resend confirmation email
              </button>
            )}
          </div>

          <button
            onClick={onSignIn}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]"
          >
            <LogIn className="h-4 w-4" />
            I've verified — Sign in
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="mt-4 text-xs text-slate-400">
            Didn't get the email? Check your spam folder or resend above.
          </p>
        </div>
      </div>
    </div>
  );
}
