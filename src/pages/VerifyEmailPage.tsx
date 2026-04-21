import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useBridgeStore } from '../store/bridgeStore';
import { ROUTES } from '../routes/paths';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const resetBridgeFlow = useBridgeStore((s) => s.resetBridgeFlow);

  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const trimmed = email.trim();
  const isValid = EMAIL_REGEX.test(trimmed);
  const showInvalid = submitError !== null || (touched && trimmed.length > 0 && !isValid);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (submitError) setSubmitError(null);
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) {
      setSubmitError('Invalid Email');
      return;
    }
    navigate(ROUTES.BRIDGE.VERIFY_OTP, { state: { email: trimmed } });
  };

  const handleCancel = () => {
    resetBridgeFlow({ preserveHistory: true });
    navigate(ROUTES.MERCHANT.HOME, { replace: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full pt-0 pb-8"
    >
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
        <h1 className="mt-2 mb-6 text-2xl font-semibold text-[var(--text)]">
          Verify Yourself
        </h1>

        <form onSubmit={handleContinue} className="w-full space-y-4" noValidate>
          <div>
            <label
              htmlFor="verify-email-input"
              className="block text-[var(--text)] mb-2"
            >
              Enter Email
            </label>
            <input
              id="verify-email-input"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={handleChange}
              onBlur={() => setTouched(true)}
              aria-invalid={showInvalid}
              aria-describedby={showInvalid ? 'verify-email-error' : undefined}
              className={`w-full min-h-[44px] px-4 rounded-xl bg-white border text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 ${
                showInvalid
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                  : 'border-[var(--border)] focus:border-[var(--green)] focus:ring-[var(--focus)]'
              }`}
              placeholder="name@example.com"
            />
            {showInvalid && (
              <p
                id="verify-email-error"
                className="mt-2 text-sm text-red-500"
                role="alert"
              >
                Invalid Email
              </p>
            )}
          </div>

          <div className="flex flex-col items-center gap-3 pt-2">
            <button
              type="submit"
              className="min-h-[44px] w-full sm:max-w-md sm:px-8 rounded-xl bg-[var(--green)] text-white font-semibold hover:bg-[var(--green-hover)] transition-colors"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="min-h-[44px] w-full sm:max-w-md sm:px-8 rounded-xl border border-[var(--border)] text-[var(--muted)] hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
