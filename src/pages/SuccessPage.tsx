import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useBridgeStore } from '../store/bridgeStore';
import { ROUTES } from '../routes/paths';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { StepIndicator } from '../components/StepIndicator';
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
        className="max-w-[480px] mx-auto px-4 pt-0 pb-8"
      >
        <StepIndicator current={3} total={3} />

        <h1 className="text-2xl font-semibold text-white mb-2">Success</h1>
        <p className="text-slate-400 mb-2">
          You have successfully purchased {purchasedUsdt} USDT.
        </p>
        <p className="text-slate-300 mb-6">What would you like to do next?</p>

        <div className="flex flex-col gap-4 mb-8">
          <button
            type="button"
            onClick={handleSendToMerchant}
            disabled={buttonsDisabled}
            className="min-h-[44px] w-full rounded-xl bg-primary text-black font-semibold hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            Send to Merchant
          </button>

          <div>
            <button
              type="button"
              onClick={handleWithdrawToWallet}
              disabled={buttonsDisabled}
              className="min-h-[44px] w-full rounded-xl border-2 border-primary text-primary font-semibold hover:bg-primary/10 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Withdraw to personal wallet
            </button>
          </div>
        </div>

        <ReceiptCard
          order={order}
          merchantTx={merchantTx}
          onCopyReceipt={handleCopyReceipt}
          onDownloadPdf={handleDownloadPdf}
        />
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
            <p className="text-white font-medium">
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
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-lg bg-slate-700 text-white text-sm shadow-lg">
          PDF generated
        </div>
      )}

      {copyToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-lg bg-slate-700 text-white text-sm shadow-lg">
          Receipt copied
        </div>
      )}
    </>
  );
}
