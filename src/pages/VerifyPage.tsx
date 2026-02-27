import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../routes/paths';
import { useBridgeStore } from '../store/bridgeStore';
import { validateReference, normalizeReference } from '../utils/referenceValidation';
import type { ReferenceType } from '../store/types';

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
        className="w-full pt-0 pb-8"
      >
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 space-y-4">
          <h1 className="text-2xl font-semibold text-[var(--text)]">
            Payment Verification
          </h1>

          <div className="w-full p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow)]">
            <div className="grid grid-cols-[minmax(0,6rem)_1fr] gap-x-4 gap-y-3 text-sm">
              <span className="text-[var(--muted)]">USDT</span>
              <span className="text-[var(--text)] font-medium">{usdtAmount} USDT</span>
              <span className="text-[var(--muted)]">INR</span>
              <span className="text-[var(--text)] font-medium">
                ₹{(expectedInrAmount || inrAmount).toLocaleString('en-IN')}
              </span>
              {selectedBeneficiary && (
                <>
                  <span className="text-[var(--muted)]">Beneficiary</span>
                  <span className="text-[var(--text)] font-medium truncate">
                    {selectedBeneficiary.displayName}
                  </span>
                </>
              )}
            </div>
            {usedCooling && (
              <span className="inline-block mt-3 px-2 py-0.5 rounded bg-[var(--green)]/15 text-[var(--green)] text-xs">
                Cooling completed
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label htmlFor="ref-input" className="block text-[var(--text)] mb-2">
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
              className="w-full min-h-[44px] px-4 rounded-xl bg-white border border-[var(--border)] text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--green)] focus:ring-2 focus:ring-[var(--focus)] focus:outline-none uppercase"
              placeholder={placeholder}
              autoComplete="off"
            />
            {!validation.valid && referenceNumber.trim() && refType && (
              <p className="mt-2 text-sm text-red-500">
                {validation.error ?? `Enter a valid ${refType}`}
              </p>
            )}
            {displayError && validation.valid && (
              <p className="mt-2 text-sm text-red-500">{displayError}</p>
            )}
          </div>

          {(displayError) && (
            <button
              type="button"
              onClick={handleRetry}
              className="w-full min-h-[44px] rounded-xl border border-[var(--border)] text-[var(--muted)] hover:bg-gray-100"
            >
              Retry
            </button>
          )}

          {!displayError && (
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full min-h-[44px] rounded-xl bg-[var(--green)] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--green-hover)]"
            >
              Confirm
            </button>
          )}
          </form>
        </div>
      </motion.div>

      {isVerifying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(17,24,39,0.35)] backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-xl bg-[var(--surface)] border border-[var(--border)] p-6 flex flex-col items-center gap-4 shadow-[var(--shadow)]"
          >
            <div className="w-10 h-10 border-2 border-[var(--green)] border-t-transparent rounded-full animate-spin" />
            <p className="text-[var(--text)] font-medium">Wait, payment processing…</p>
          </motion.div>
        </div>
      )}
    </>
  );
}
