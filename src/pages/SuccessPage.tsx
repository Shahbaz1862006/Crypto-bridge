import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useBridgeStore } from '../store/bridgeStore';
import { ROUTES } from '../routes/paths';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { ReceiptCard } from '../components/ReceiptCard';
import { ConfirmModal } from '../components/ConfirmModal';

const WITHDRAW_FEE_PERCENT = 30;

export function SuccessPage() {
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [pdfToast, setPdfToast] = useState(false);
  const [copyToast, setCopyToast] = useState(false);

  const order = useBridgeStore((s) => s.order);
  const merchantHistory = useBridgeStore((s) => s.merchantHistory);
  const ensureMerchantTxForSuccess = useBridgeStore((s) => s.ensureMerchantTxForSuccess);

  const {
    purchasedUsdt,
    orderId,
    merchantTxId,
  } = order;

  const touch = useBridgeStore((s) => s.touch);
  const finalizeSend = useBridgeStore((s) => s.finalizeSend);
  const markSendToWallet = useBridgeStore((s) => s.markSendToWallet);

  const merchantTx = merchantTxId
    ? merchantHistory.find((t) => t.id === merchantTxId) ?? null
    : merchantHistory.find((t) => t.relatedOrderId === orderId) ?? null;

  const withdrawReceiveUsdt = Math.round(
    purchasedUsdt * (1 - WITHDRAW_FEE_PERCENT / 100) * 100
  ) / 100;

  useEffect(() => {
    ensureMerchantTxForSuccess();
  }, [ensureMerchantTxForSuccess]);

  const handleSendToMerchant = async () => {
    if (sending) return;
    touch();
    setSending(true);
    try {
      await finalizeSend();
      navigate(ROUTES.MERCHANT.HISTORY, { replace: true });
    } catch {
      setSending(false);
    }
  };

  const handleWithdrawToWallet = () => {
    touch();
    setShowWalletModal(true);
  };

  const handleWalletContinue = () => {
    if (withdrawing) return;
    touch();
    setWithdrawing(true);
    markSendToWallet();
    setShowWalletModal(false);
    window.location.href = 'https://pikeswop.com/';
  };

  const handleDownloadPdf = () => {
    setPdfToast(true);
    setTimeout(() => setPdfToast(false), 3000);
  };

  const handleCopyReceipt = () => {
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2000);
  };

  const isBusy = sending || withdrawing;
  const buttonsDisabled = isBusy;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="w-full pt-0 pb-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column: Step indicator + Title + success message + buttons (sticky on desktop) */}
          <div className="lg:col-span-5 lg:sticky lg:top-6 lg:self-start">
            <h1 className="text-2xl font-semibold text-[var(--text)] mb-2">Success</h1>
            <p className="text-[var(--muted)] mb-2">
              You have successfully purchased {purchasedUsdt} USDT.
            </p>
            <p className="text-[var(--text)] mb-4">What would you like to do next?</p>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSendToMerchant}
                disabled={buttonsDisabled}
                className="min-h-[44px] w-full rounded-xl bg-[var(--green)] text-white font-semibold hover:bg-[var(--green-hover)] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Send to Merchant
              </button>
              <button
                type="button"
                onClick={handleWithdrawToWallet}
                disabled={buttonsDisabled}
                className="min-h-[44px] w-full rounded-xl border-2 border-[var(--green)] text-[var(--green)] font-semibold hover:bg-[var(--green)]/10 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Withdraw to personal wallet
              </button>
            </div>
          </div>

          {/* Right column: Receipt */}
          <div className="lg:col-span-7">
            <ReceiptCard
              order={order}
              merchantTx={merchantTx}
              onCopyReceipt={handleCopyReceipt}
              onDownloadPdf={handleDownloadPdf}
            />
          </div>
        </div>
      </motion.div>

      <ConfirmModal
        isOpen={showWalletModal}
        onClose={() => !withdrawing && setShowWalletModal(false)}
        title="Withdraw to personal wallet"
        message={
          <>
            <p className="mb-2">
              If you withdraw to your personal wallet, 30% fees will be deducted.
            </p>
            <p className="text-[var(--text)] font-medium">
              Total you will receive: {withdrawReceiveUsdt} USDT
            </p>
          </>
        }
        confirmLabel="Continue"
        cancelLabel="Cancel"
        onConfirm={handleWalletContinue}
        loading={withdrawing}
      />

      {sending && (
        <LoadingOverlay message="Sending to merchant…" />
      )}

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
