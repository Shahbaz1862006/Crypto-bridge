import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../routes/paths';
import { useBridgeStore } from '../store/bridgeStore';
import { validateReference, normalizeReference } from '../utils/referenceValidation';
import type { ReferenceType } from '../store/types';
import { StepIndicator } from '../components/StepIndicator';

export function VerifyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const txIdParam = searchParams.get('txId');
  const [localError, setLocalError] = useState<string | null>(null);

  const order = useBridgeStore((s) => s.order);
  const merchantHistory = useBridgeStore((s) => s.merchantHistory);
  const setMerchantTxId = useBridgeStore((s) => s.setMerchantTxId);
  const setReferenceNumber = useBridgeStore((s) => s.setReferenceNumber);
  const verifyReference = useBridgeStore((s) => s.verifyReference);

  const {
    usdtAmount,
    inrAmount,
    selectedBeneficiary,
    coolingEndsAt,
    referenceType,
    referenceNumber,
    verificationErrorMessage,
    invoiceStatus,
    expectedInrAmount,
  } = order;

  const touch = useBridgeStore((s) => s.touch);

  const now = Date.now();
  const usedCooling = coolingEndsAt !== null && now >= coolingEndsAt;

  const refType: ReferenceType | null = referenceType ?? (order.paymentMethod === 'UPI' ? 'UTR' : order.paymentMethod === 'BANK' ? 'BRN' : null);

  const validation = useMemo(() => {
    if (!refType) return { valid: false, error: undefined };
    return validateReference(referenceNumber, refType);
  }, [referenceNumber, refType]);

  const canSubmit = refType !== null && validation.valid;
  const isVerifying = invoiceStatus === 'VERIFYING';
  const displayError = localError ?? verificationErrorMessage;

  useEffect(() => {
    if (txIdParam && !order.merchantTxId) {
      const tx = merchantHistory.find((t) => t.id === txIdParam);
      if (tx && (tx.status === 'PAYMENT_VERIFICATION' || tx.status === 'PENDING')) {
        setMerchantTxId(tx.id);
        useBridgeStore.setState((s) => ({
          order: {
            ...s.order,
            invoiceStatus: 'READY_FOR_VERIFICATION',
            usdtAmount: tx.amountUsdt,
            inrAmount: Math.round(tx.amountUsdt * (s.order.exchangeRate || 83) * 100) / 100,
            expectedInrAmount: Math.round(tx.amountUsdt * (s.order.exchangeRate || 83) * 100) / 100,
            referenceType: tx.beneficiary ? 'BRN' : 'UTR',
            referenceNumber: '',
          },
        }));
      }
    }
  }, [txIdParam, order.merchantTxId, merchantHistory, setMerchantTxId]);

  useEffect(() => {
    if (!refType) {
      useBridgeStore.setState((s) => ({
        order: {
          ...s.order,
          referenceType: s.order.paymentMethod === 'UPI' ? 'UTR' : s.order.paymentMethod === 'BANK' ? 'BRN' : null,
        },
      }));
    }
  }, [refType, order.paymentMethod]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setReferenceNumber(v);
    setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !refType) return;
    touch();
    setLocalError(null);
    useBridgeStore.setState((s) => ({
      order: {
        ...s.order,
        referenceNumber: normalizeReference(s.order.referenceNumber),
      },
    }));

    const result = await verifyReference();
    if (result.success) {
      await new Promise((r) => setTimeout(r, 50));
      navigate(ROUTES.BRIDGE.SUCCESS, { replace: true });
    } else {
      setLocalError(result.error ?? 'Verification failed');
    }
  };

  const handleRetry = () => {
    setLocalError(null);
    useBridgeStore.setState((s) => ({
      order: {
        ...s.order,
        verificationErrorMessage: null,
        verificationErrorCode: null,
      },
    }));
  };

  const label = refType === 'BRN' ? 'BRN (Bank Reference Number)' : 'UTR (UPI Transaction Reference)';
  const placeholder = refType === 'BRN' ? 'Enter BRN' : 'Enter UTR';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="max-w-[480px] mx-auto px-4 pt-0 pb-8"
      >
        <StepIndicator current={2} total={3} />

        <h1 className="text-2xl font-semibold text-white mb-6">
          Payment Verification
        </h1>

        <div className="p-4 rounded-xl bg-slate-800 border border-slate-600 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">USDT</span>
            <span className="text-white font-medium">{usdtAmount} USDT</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">INR</span>
            <span className="text-white font-medium">
              ₹{(expectedInrAmount || inrAmount).toLocaleString('en-IN')}
            </span>
          </div>
          {selectedBeneficiary && (
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Beneficiary</span>
              <span className="text-white font-medium truncate max-w-[200px]">
                {selectedBeneficiary.displayName}
              </span>
            </div>
          )}
          {usedCooling && (
            <span className="inline-block mt-2 px-2 py-0.5 rounded bg-primary/20 text-primary text-xs">
              Cooling completed
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="ref-input" className="block text-slate-300 mb-2">
              {label}
            </label>
            <input
              id="ref-input"
              type="text"
              value={referenceNumber}
              onChange={handleChange}
              onBlur={(e) => {
                const v = e.target.value.trim().toUpperCase();
                if (v !== referenceNumber) setReferenceNumber(v);
              }}
              className="w-full min-h-[44px] px-4 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:border-primary focus:outline-none uppercase"
              placeholder={placeholder}
              autoComplete="off"
            />
            {!validation.valid && referenceNumber.trim() && refType && (
              <p className="mt-2 text-sm text-red-400">
                {validation.error ?? `Enter a valid ${refType}`}
              </p>
            )}
            {displayError && validation.valid && (
              <p className="mt-2 text-sm text-red-400">{displayError}</p>
            )}
          </div>

          {(displayError) && (
            <button
              type="button"
              onClick={handleRetry}
              className="w-full min-h-[44px] rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Retry
            </button>
          )}

          {!displayError && (
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full min-h-[44px] rounded-xl bg-primary text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90"
            >
              Confirm
            </button>
          )}
        </form>
      </motion.div>

      {isVerifying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-xl bg-slate-800 border border-slate-600 p-6 flex flex-col items-center gap-4"
          >
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-white font-medium">Wait, payment processing…</p>
          </motion.div>
        </div>
      )}
    </>
  );
}
