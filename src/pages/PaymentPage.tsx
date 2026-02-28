import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import upiLogo from '../assets/upi-logo.png';
import impsLogo from '../assets/imps-logo.png';
import { QRCodeSVG } from 'qrcode.react';
import { useBridgeStore } from '../store/bridgeStore';
import { useOrder } from '../hooks/useOrder';
import { CopyButton } from '../components/CopyButton';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { SuccessModal } from '../components/SuccessModal';
import { FailedModal } from '../components/FailedModal';
import { UPI_BENEFICIARY, DEFAULT_EXCHANGE_RATE } from '../api/mockData';
import { validateReference, normalizeReference } from '../utils/referenceValidation';
import { ROUTES } from '../routes/paths';

const FIXED_USDT = 60;
const FIXED_INR = Math.round(FIXED_USDT * DEFAULT_EXCHANGE_RATE);

export function PaymentPage() {
  const navigate = useNavigate();
  const [utrInput, setUtrInput] = useState('');
  const [utrError, setUtrError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailedModal, setShowFailedModal] = useState(false);

  const { paymentMethod, touch, selectUPI, selectBANK } = useOrder();

  const verifyReference = useBridgeStore((s) => s.verifyReference);

  useEffect(() => {
    useBridgeStore.setState((s) => ({
      order: {
        ...s.order,
        usdtAmount: FIXED_USDT,
        inrAmount: FIXED_INR,
        exchangeRate: DEFAULT_EXCHANGE_RATE,
      },
    }));
  }, []);

  const utrValidation = useMemo(
    () => validateReference(utrInput, 'UTR'),
    [utrInput]
  );
  const canConfirmUtr = utrValidation.valid;

  const handleUPI = () => {
    touch();
    selectUPI();
  };

  const handleBANK = () => {
    touch();
    selectBANK();
    navigate(ROUTES.BRIDGE.BENEFICIARY);
  };

  const handleChangeMethod = () => {
    touch();
    useBridgeStore.setState((s) => ({
      order: { ...s.order, paymentMethod: null },
    }));
  };

  const handleUtrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 22);
    setUtrInput(v);
    setUtrError(null);
  };

  const handleConfirmPayment = async () => {
    if (!canConfirmUtr || isVerifying) return;
    touch();
    setUtrError(null);
    const normalized = normalizeReference(utrInput);
    useBridgeStore.setState((s) => ({
      order: {
        ...s.order,
        referenceNumber: normalized,
        referenceType: 'UTR',
        expectedInrAmount: s.order.inrAmount,
      },
    }));
    setIsVerifying(true);
    try {
      const result = await verifyReference();
      if (result.success) {
        setShowSuccessModal(true);
      } else {
        setUtrError('Invalid reference number');
        setShowFailedModal(true);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFailedTryAgain = () => {
    setUtrError(null);
  };

  const handleFailedChangeMethod = () => {
    handleChangeMethod();
  };

  const upiUri = `upi://pay?pa=rapidogate@hdfc&pn=Rapido%20Gate%20Collections&am=${FIXED_INR.toFixed(2)}&cu=INR`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full pt-0 pb-8"
    >
      <div className="w-full px-6 lg:px-12 2xl:px-16">
        {!paymentMethod ? (
          <div className="w-full max-w-3xl mx-auto px-4 sm:px-6">
            <h1 className="text-2xl font-semibold text-[var(--text)] mb-4">Deposit & Payment</h1>
            <div className="space-y-4">
              <div className="w-full p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between gap-4 shadow-[var(--shadow)]">
                <span className="text-2xl font-bold text-[var(--text)]">{FIXED_USDT} USDT</span>
                <span className="text-2xl font-bold text-[var(--text)]">≈ ₹{FIXED_INR.toLocaleString('en-IN')} INR</span>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleUPI}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-[var(--surface)] border-2 border-[var(--border)] hover:border-[var(--green)] transition-colors text-left shadow-[var(--shadow)]"
                >
                  <div className="w-12 h-12 rounded-lg bg-[var(--green)]/15 flex items-center justify-center overflow-hidden">
                    <img src={upiLogo} alt="UPI" className="h-7 w-auto object-contain" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--text)]">Buy via UPI</h3>
                    <p className="text-sm text-[var(--muted)]">Instant payment via UPI app</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={handleBANK}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-[var(--surface)] border-2 border-[var(--border)] hover:border-[var(--green)] transition-colors text-left shadow-[var(--shadow)]"
                >
                  <div className="w-12 h-12 rounded-lg bg-[var(--green)]/15 flex items-center justify-center overflow-hidden">
                    <img src={impsLogo} alt="IMPS" className="h-7 w-auto object-contain" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--text)]">Buy via IMPS / RTGS / NEFT</h3>
                    <p className="text-sm text-[var(--muted)]">Select beneficiary, then pay</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        ) : paymentMethod === 'UPI' ? (
          <>
            <h1 className="text-2xl font-semibold text-[var(--text)] mb-4">Deposit & Payment</h1>
            <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6 lg:gap-8 items-start w-full">
              {/* 1. Amount summary - order-1 on mobile, left col on desktop */}
              <div className="order-1 w-full flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-4 shadow-[var(--shadow)] lg:col-span-1 lg:col-start-1 lg:row-start-1">
                <span className="text-2xl font-semibold text-[var(--text)]">{FIXED_USDT} USDT</span>
                <span className="text-2xl font-semibold text-[var(--text)]">≈ ₹{FIXED_INR.toLocaleString('en-IN')} INR</span>
              </div>

              {/* 2. Beneficiary card - order-2 on mobile, left col on desktop */}
              <div className="order-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] lg:col-span-1 lg:col-start-1 lg:row-start-2">
                <h3 className="text-[var(--text)] font-medium mb-2">Beneficiary Details</h3>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[var(--muted)] text-sm">Beneficiary Name: </span>
                    <span className="text-[var(--text)]">{UPI_BENEFICIARY.beneficiaryName}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[var(--muted)] text-sm">Bank Name: </span>
                    <span className="text-[var(--text)]">{UPI_BENEFICIARY.bankName}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[var(--muted)] text-sm">UPI ID: </span>
                    <span className="text-[var(--text)] font-mono">{UPI_BENEFICIARY.upiId}</span>
                    <CopyButton text={UPI_BENEFICIARY.upiId} />
                  </div>
                </div>
              </div>

              {/* 3. QR card - order-3 on mobile (above verification), right col on desktop */}
              <div className="order-3 lg:order-3 lg:col-span-1 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:sticky lg:top-6 lg:self-start w-full">
                <div className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col shadow-[var(--shadow)]">
                  <p className="text-[var(--text)] font-medium mb-1">Scan to pay</p>
                  <p className="text-[var(--muted)] text-sm mb-4">Amount: ₹{FIXED_INR.toLocaleString('en-IN')}</p>
                  <div className="w-full rounded-lg border border-[var(--border)] bg-white p-4 flex items-center justify-center">
                    <div className="w-[320px] h-[320px] flex items-center justify-center mx-auto shrink-0">
                      <QRCodeSVG value={upiUri} size={320} level="M" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                    <span className="text-[var(--muted)] text-sm">UPI ID: </span>
                    <span className="text-[var(--green)] font-mono text-sm">{UPI_BENEFICIARY.upiId}</span>
                    <CopyButton text={UPI_BENEFICIARY.upiId} />
                  </div>
                </div>
              </div>

              {/* 4. UTR + Confirm - order-4 on mobile, left col on desktop */}
              <div className="order-4 w-full space-y-4 min-w-0 lg:col-span-1 lg:col-start-1 lg:row-start-3">
                <div className="w-full">
                  <label htmlFor="utr-input" className="block text-[var(--text)] mb-2">Enter UTR / TxID</label>
                  <input
                    id="utr-input"
                    type="text"
                    value={utrInput}
                    onChange={handleUtrChange}
                    placeholder="e.g., 1234567890ABC"
                    className={`w-full min-h-[44px] px-4 rounded-xl bg-white border text-[var(--text)] placeholder-[var(--muted)] focus:ring-2 focus:outline-none font-mono uppercase ${
                      utrError ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-[var(--border)] focus:border-[var(--green)] focus:ring-[var(--focus)]'
                    }`}
                  />
                  {(utrValidation.error || utrError) && (
                    <p className="mt-1 text-sm text-red-500">{utrError ?? utrValidation.error ?? 'Invalid reference number'}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={!canConfirmUtr || isVerifying}
                  className="w-full rounded-xl py-4 text-lg font-semibold bg-[var(--green)] text-white hover:bg-[var(--green-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  I have paid
                </button>
              </div>

              {/* 5. Change method - order-5 on mobile, left col on desktop */}
              <div className="order-5 w-full lg:col-span-1 lg:col-start-1 lg:row-start-4">
                <button
                  type="button"
                  onClick={handleChangeMethod}
                  className="block w-full text-center text-[var(--green)] text-sm hover:underline mt-2"
                >
                  Change method
                </button>
              </div>
            </div>
          </>
        ) : null}

        {isVerifying && (
          <LoadingOverlay message="Wait, payment processing…" />
        )}

        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
        />

        <FailedModal
          isOpen={showFailedModal}
          onClose={() => setShowFailedModal(false)}
          onTryAgain={handleFailedTryAgain}
          onChangeMethod={handleFailedChangeMethod}
          showChangeMethod
        />
      </div>
    </motion.div>
  );
}
