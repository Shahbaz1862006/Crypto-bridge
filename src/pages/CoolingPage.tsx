import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBridgeStore } from '../store/bridgeStore';
import { StepIndicator } from '../components/StepIndicator';
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
      navigate(ROUTES.BRIDGE.COOLING_SELECT, { replace: true });
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
      className="max-w-[480px] mx-auto px-4 pt-0 pb-8"
    >
      <StepIndicator current={2} total={3} />

      {isResumeMode && (
        <p className="mb-4 px-4 py-2 rounded-lg bg-slate-800/80 border border-slate-600 text-slate-300 text-sm">
          Cooling in progress — resumed from Transaction History
        </p>
      )}

      <h1 className="text-2xl font-semibold text-white mb-4">Cooling Period</h1>

      {effectiveCoolingEndsAt != null ? (
        <>
          <div className="p-4 rounded-xl bg-slate-800 border border-slate-600 mb-6">
            <p className="text-slate-300 text-sm">
              You can go back to merchant. This transaction will stay Pending
              until cooling ends.
            </p>
          </div>

          {!coolingPassed ? (
            <div className="space-y-4">
              <div className="text-center py-6">
                <p className="text-4xl font-mono text-primary">
                  {formatTime(timeRemaining)}
                </p>
                <p className="text-slate-400 mt-2">Time remaining</p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    touch();
                    navigate(ROUTES.MERCHANT.HISTORY);
                  }}
                  className="min-h-[44px] w-full rounded-xl bg-primary text-black font-semibold hover:bg-primary/90"
                >
                  Go to Merchant
                </button>
                <p className="text-slate-500 text-sm text-center">
                  Or stay here and wait for the countdown
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {coolingEndedToast && (
                <div className="p-4 rounded-xl bg-primary/20 border border-primary/50 text-primary">
                  Cooling ended. Please verify payment.
                </div>
              )}
              <button
                type="button"
                onClick={handleProceedToVerify}
                className="min-h-[44px] w-full rounded-xl bg-primary text-black font-semibold hover:bg-primary/90"
              >
                Verify Payment
              </button>
              <button
                type="button"
                onClick={() => {
                  touch();
                  navigate(ROUTES.MERCHANT.HISTORY);
                }}
                className="min-h-[44px] w-full rounded-xl border border-slate-600 text-slate-400 hover:bg-slate-800"
              >
                Go to Merchant
              </button>
            </div>
          )}
        </>
      ) : null}
    </motion.div>
  );
}
