import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBridgeStore } from '../store/bridgeStore';
import { ROUTES } from '../routes/paths';

const RESEND_SECONDS = 50;
const CODE_LENGTH = 6;
const DEMO_INVALID_CODE = '123456';

interface OtpLocationState {
  email?: string;
}

export function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const touch = useBridgeStore((s) => s.touch);

  const state = (location.state ?? {}) as OtpLocationState;
  const email = state.email;

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [resendNonce, setResendNonce] = useState(0);

  useEffect(() => {
    if (!email) {
      navigate(ROUTES.BRIDGE.VERIFY_EMAIL, { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [resendNonce]);

  const canResend = secondsLeft <= 0;
  const isComplete = code.length === CODE_LENGTH;

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D+/g, '').slice(0, CODE_LENGTH);
    setCode(digitsOnly);
    if (error) setError(null);
  };

  const handleResend = () => {
    if (!canResend) return;
    setCode('');
    setError(null);
    setSecondsLeft(RESEND_SECONDS);
    setResendNonce((n) => n + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) {
      setError('Enter the 6-digit code');
      return;
    }
    if (code === DEMO_INVALID_CODE) {
      setError('Invalid Code');
      return;
    }
    touch();
    navigate(ROUTES.BRIDGE.EXPLAIN);
  };

  if (!email) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full pt-0 pb-8"
    >
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
        <h1 className="mt-2 mb-4 text-2xl font-semibold text-[var(--text)]">
          Verification
        </h1>
        <p className="mb-6 text-[var(--muted)] leading-relaxed">
          Enter 6-digit verification code sent on{' '}
          <span className="text-[var(--text)] font-medium">{email}</span>.
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-4" noValidate>
          <div>
            <label
              htmlFor="verify-otp-input"
              className="block text-[var(--text)] mb-2"
            >
              Enter Code
            </label>
            <input
              id="verify-otp-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={CODE_LENGTH}
              value={code}
              onChange={handleCodeChange}
              aria-invalid={error !== null}
              aria-describedby={error ? 'verify-otp-error' : 'verify-otp-help'}
              className={`w-full min-h-[44px] px-4 rounded-xl bg-white border text-[var(--text)] placeholder-[var(--muted)] tracking-[0.3em] font-medium focus:outline-none focus:ring-2 ${
                error
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                  : 'border-[var(--border)] focus:border-[var(--green)] focus:ring-[var(--focus)]'
              }`}
              placeholder="••••••"
            />

            <div
              id="verify-otp-help"
              className="mt-2 flex flex-wrap items-center gap-2 text-sm"
            >
              {error ? (
                <>
                  <span
                    id="verify-otp-error"
                    className="text-red-500"
                    role="alert"
                  >
                    {error}
                  </span>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={!canResend}
                    className={`font-medium transition-colors ${
                      canResend
                        ? 'text-[var(--green)] hover:underline'
                        : 'text-[var(--muted)] cursor-not-allowed'
                    }`}
                  >
                    Resend
                  </button>
                </>
              ) : (
                <span className="text-[var(--muted)]">
                  Didn’t receive code?{' '}
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResend}
                      className="text-[var(--green)] font-medium hover:underline"
                    >
                      Resend
                    </button>
                  ) : (
                    <span>Resend after {secondsLeft}s</span>
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!isComplete}
              className="min-h-[44px] w-full sm:max-w-md sm:px-8 rounded-xl bg-[var(--green)] text-white font-semibold hover:bg-[var(--green-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
