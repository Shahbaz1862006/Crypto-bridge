import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBridgeStore } from '../store/bridgeStore';
import { ROUTES } from '../routes/paths';

export function CoolingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const txIdParam = searchParams.get('txId');
  const [coolingEndedToast, setCoolingEndedToast] = useState(false);

  const order = useBridgeStore((s) => s.order);
  const merchantHistory = useBridgeStore((s) => s.merchantHistory);
  const { coolingEndsAt, invoiceStatus } = order;
  const touch = useBridgeStore((s) => s.touch);
  const tickCooling = useBridgeStore((s) => s.tickCooling);
  const resumeCoolingFromTx = useBridgeStore((s) => s.resumeCoolingFromTx);

  const txFromHistory = txIdParam ? merchantHistory.find((t) => t.id === txIdParam) : null;
  const effectiveCoolingEndsAt = coolingEndsAt ?? txFromHistory?.coolingEndsAt ?? null;
  const now = Date.now();
  const coolingPassed = effectiveCoolingEndsAt !== null && now >= effectiveCoolingEndsAt;
  const isResumeMode = Boolean(txIdParam);
  const timeRemaining =
    effectiveCoolingEndsAt && !coolingPassed ? effectiveCoolingEndsAt - now : 0;

  useEffect(() => {
    if (txIdParam) {
      resumeCoolingFromTx(txIdParam);
    }
  }, [txIdParam, resumeCoolingFromTx]);

  useEffect(() => {
    if (!effectiveCoolingEndsAt && !txIdParam) {
      navigate(ROUTES.BRIDGE.BENEFICIARY, { replace: true });
    }
  }, [effectiveCoolingEndsAt, txIdParam, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      tickCooling();
    }, 1000);
    return () => clearInterval(interval);
  }, [tickCooling]);

  useEffect(() => {
    if (effectiveCoolingEndsAt !== null && Date.now() >= effectiveCoolingEndsAt && invoiceStatus === 'READY_FOR_VERIFICATION') {
      setCoolingEndedToast(true);
      const t = setTimeout(() => setCoolingEndedToast(false), 5000);
      return () => clearTimeout(t);
    }
  }, [effectiveCoolingEndsAt, invoiceStatus]);

  const handleProceedToVerify = () => {
    touch();
    navigate(ROUTES.BRIDGE.VERIFY);
  };

  const formatTime = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full pt-0 pb-8"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {isResumeMode && (
          <p className="mb-4 px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-sm">
            Cooling in progress — resumed from Transaction History
          </p>
        )}

        <h1 className="mt-2 mb-6 text-2xl font-semibold text-gray-900">
          Cooling Period
        </h1>

        {effectiveCoolingEndsAt != null ? (
          <>
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] mb-6 shadow-[var(--shadow)]">
              <p className="text-[var(--text)] text-sm">
                You can go back to merchant. This transaction will stay Pending
                until cooling ends.
              </p>
            </div>

            {!coolingPassed ? (
              <div className="space-y-6">
                <div className="text-center py-6">
                  <p className="text-4xl font-mono font-bold text-[var(--green)]">
                    {formatTime(timeRemaining)}
                  </p>
                  <p className="text-[var(--muted)] mt-2">Time remaining</p>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      touch();
                      navigate(ROUTES.MERCHANT.HISTORY);
                    }}
                    className="min-h-[44px] w-full sm:max-w-md sm:px-8 rounded-xl bg-[var(--green)] text-white font-semibold hover:bg-[var(--green-hover)]"
                  >
                    Go to Merchant
                  </button>
                  <p className="text-[var(--muted)] text-sm text-center">
                    Or stay here and wait for the countdown
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {coolingEndedToast && (
                  <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--green)] text-[var(--green)] shadow-[var(--shadow)]">
                    Cooling ended. Please verify payment.
                  </div>
                )}
                <div className="flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={handleProceedToVerify}
                    className="min-h-[44px] w-full sm:max-w-md sm:px-8 rounded-xl bg-[var(--green)] text-white font-semibold hover:bg-[var(--green-hover)]"
                  >
                    Verify Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      touch();
                      navigate(ROUTES.MERCHANT.HISTORY);
                    }}
                    className="min-h-[44px] w-full sm:max-w-md sm:px-8 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-gray-100"
                  >
                    Go to Merchant
                  </button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </motion.div>
  );
}
