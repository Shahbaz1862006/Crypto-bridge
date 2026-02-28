import { useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useBridgeStore } from '../store/bridgeStore';
import { ReceiptCard } from './ReceiptCard';
import { ConfirmModal } from './ConfirmModal';
import { downloadReceiptPdf } from '../utils/receiptPdf';

const WITHDRAW_FEE_PERCENT = 30;

function formatUsdt(n: number): string {
  return `${n.toFixed(2)} USDT`;
}

function WithdrawFeeBreakdown({
  purchasedUsdt,
  feeUsdt,
  finalUsdt,
}: {
  purchasedUsdt: number;
  feeUsdt: number;
  finalUsdt: number;
}) {
  return (
    <div className="space-y-4">
      <p className="text-[var(--muted)] text-sm">
        If you withdraw to your personal wallet, a 30% withdrawal fee will be deducted from your purchased USDT.
      </p>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3 text-sm">
        <div className="flex justify-between items-baseline">
          <span className="text-[var(--muted)]">Purchased Amount:</span>
          <span className="text-[var(--text)] font-medium">{formatUsdt(purchasedUsdt)}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[var(--muted)]">30% Withdrawal Fee:</span>
          <span className="text-red-600 font-medium">- {formatUsdt(feeUsdt)}</span>
        </div>
        <div className="border-t border-[var(--border)] pt-3 mt-3">
          <div className="flex justify-between items-baseline">
            <span className="text-[var(--muted)]">Final Amount You Will Receive:</span>
            <span className="text-[var(--green)] font-bold">{formatUsdt(finalUsdt)}</span>
          </div>
        </div>
      </div>

      <p className="text-[var(--muted)] text-sm">
        <span className="text-[var(--text)]">{formatUsdt(purchasedUsdt)}</span>
        {' - '}
        <span className="text-red-600">{formatUsdt(feeUsdt)}</span>
        {' = '}
        <span className="text-[var(--green)] font-semibold">{formatUsdt(finalUsdt)}</span>
        <span className="text-[var(--muted)]"> (after 30% fee deduction)</span>
      </p>
    </div>
  );
}

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}


export function SuccessModal({ isOpen, onClose }: SuccessModalProps) {
  const order = useBridgeStore((s) => s.order);
  const markSendToWallet = useBridgeStore((s) => s.markSendToWallet);
  const ensureMerchantTxForSuccess = useBridgeStore((s) => s.ensureMerchantTxForSuccess);
  const touch = useBridgeStore((s) => s.touch);

  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [pdfToast, setPdfToast] = useState(false);
  const [copyToast, setCopyToast] = useState(false);

  const purchasedUsdt = order.purchasedUsdt || order.usdtAmount;
  const withdrawFeeUsdt = Math.round(purchasedUsdt * (WITHDRAW_FEE_PERCENT / 100) * 100) / 100;
  const withdrawReceiveUsdt = Math.round((purchasedUsdt - withdrawFeeUsdt) * 100) / 100;

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      ensureMerchantTxForSuccess();
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape, ensureMerchantTxForSuccess]);

  const handleSendToMerchant = () => {
    touch();
    onClose();
    window.location.href = `${window.location.origin}/merchant`;
  };

  const handleWithdrawToWallet = () => {
    touch();
    setShowWalletModal(true);
  };

  const handleWalletContinue = () => {
    if (isWithdrawing) return;
    touch();
    setIsWithdrawing(true);
    markSendToWallet();
    setShowWalletModal(false);
    window.location.href = 'https://pikeswop.com/';
  };

  const handleCopyReceipt = () => {
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2000);
  };

  const handleDownloadPdf = () => {
    downloadReceiptPdf(order);
    setPdfToast(true);
    setTimeout(() => setPdfToast(false), 3000);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const buttonsDisabled = isWithdrawing;

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(17,24,39,0.35)] backdrop-blur-sm overflow-y-auto"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-5xl rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow)] overflow-hidden my-8"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-1 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 lg:p-8">
            {/* Left column: Success text + CTAs */}
            <div className="lg:col-span-5 flex flex-col">
              <h2 id="success-modal-title" className="text-2xl font-semibold text-[var(--text)] mb-2">
                Success
              </h2>
              <p className="text-[var(--muted)] mb-2">
                You have successfully purchased {purchasedUsdt} USDT.
              </p>
              <p className="text-[var(--text)] mb-4">What would you like to do next?</p>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleSendToMerchant}
                  disabled={buttonsDisabled}
                  className="min-h-[44px] w-full rounded-xl bg-[var(--green)] text-white font-semibold hover:bg-[var(--green-hover)] disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                >
                  Send to Merchant
                </button>
                <button
                  type="button"
                  onClick={handleWithdrawToWallet}
                  disabled={buttonsDisabled}
                  className="min-h-[44px] w-full rounded-xl border-2 border-[var(--green)] text-[var(--green)] font-semibold hover:bg-[var(--green)]/10 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                >
                  Withdraw to personal wallet
                </button>
              </div>
            </div>

            {/* Right column: Receipt card */}
            <div className="lg:col-span-7">
              <ReceiptCard
                order={order}
                onCopyReceipt={handleCopyReceipt}
                onDownloadPdf={handleDownloadPdf}
              />
            </div>
          </div>
        </motion.div>
      </div>

      <ConfirmModal
        isOpen={showWalletModal}
        onClose={() => !isWithdrawing && setShowWalletModal(false)}
        title="Withdraw to personal wallet"
        message={
          <WithdrawFeeBreakdown
            purchasedUsdt={purchasedUsdt}
            feeUsdt={withdrawFeeUsdt}
            finalUsdt={withdrawReceiveUsdt}
          />
        }
        confirmLabel="Continue with withdrawal"
        cancelLabel="Cancel"
        onConfirm={handleWalletContinue}
        loading={isWithdrawing}
        confirmDisabled={purchasedUsdt <= 0}
      />

      {pdfToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-sm shadow-[var(--shadow)]">
          PDF generated
        </div>
      )}

      {copyToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-sm shadow-[var(--shadow)]">
          Receipt copied
        </div>
      )}
    </>
  );
}
