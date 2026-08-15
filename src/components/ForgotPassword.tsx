import { useState, useEffect, useRef } from 'react';
import { Zap, Mail, ArrowRight, Loader2, ArrowLeft, KeyRound, ShieldCheck, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ForgotPasswordProps {
  auth: ReturnType<typeof useAuth>;
  onBack: () => void;
}

type Step = 'email' | 'otp' | 'done';

export function ForgotPassword({ auth, onBack }: ForgotPasswordProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await auth.sendResetOTP(email.trim());
      setStep('otp');
      setSecondsLeft(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = pasted.split('').concat(Array(6 - pasted.length).fill(''));
      setOtp(newOtp);
      otpRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  }

  async function handleVerifyAndReset(e: React.FormEvent) {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Enter the 6-digit code');
      return;
    }
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
      await auth.verifyOTPAndReset(email.trim(), otpCode, newPassword);
      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
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
      setOtp(['', '', '', '', '', '']);
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
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
                Enter your email and we'll send you a 6-digit verification code.
              </p>

              <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
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
                    <><Loader2 className="h-4 w-4 animate-spin" /> Sending code...</>
                  ) : (
                    <>Send code <ArrowRight className="h-4 w-4" /></>
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

          {/* Step: OTP + New Password */}
          {step === 'otp' && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50">
                <KeyRound className="h-8 w-8 text-sky-600" />
              </div>
              <h1 className="mt-5 text-center text-xl font-bold text-slate-900">Enter verification code</h1>
              <p className="mt-2 text-center text-sm text-slate-600">
                We sent a 6-digit code to
              </p>
              <p className="mt-0.5 text-center font-semibold text-slate-900">{email}</p>

              <form onSubmit={handleVerifyAndReset} className="mt-6 space-y-5">
                {/* OTP inputs */}
                <div>
                  <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="h-12 w-12 rounded-xl border border-slate-200 bg-white text-center text-lg font-bold text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                      />
                    ))}
                  </div>
                </div>

                {/* New password */}
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

                {/* Confirm password */}
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
                    <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</>
                  ) : (
                    <>Reset password <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              </form>

              {/* Resend */}
              <div className="mt-4 text-center">
                {secondsLeft > 0 ? (
                  <p className="text-sm text-slate-400">Resend code in {secondsLeft}s</p>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={loading}
                    className="text-sm font-medium text-sky-600 transition hover:text-sky-700 disabled:opacity-50"
                  >
                    Resend code
                  </button>
                )}
              </div>

              <button
                onClick={() => { setStep('email'); setError(''); setOtp(['', '', '', '', '', '']); }}
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
                <ShieldCheck className="h-8 w-8 text-emerald-600" />
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
      </div>
    </div>
  );
}
