import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useBridgeStore } from '../store/bridgeStore';
import { SINGLE_BANK_BENEFICIARY } from '../api/mockData';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { PaymentAmountCard, PaymentBeneficiaryCard, PaymentVerificationBlock } from '../components/payment';
import { SuccessModal } from '../components/SuccessModal';
import { validateReference, normalizeReference } from '../utils/referenceValidation';
import { ROUTES } from '../routes/paths';

const COOLING_OPTIONS = [
  { label: 'None', value: 'none', minutes: 0 },
  { label: '30 mins', value: '30m', minutes: 30 },
  { label: '4 hrs', value: '4h', minutes: 240 },
  { label: '6 hrs', value: '6h', minutes: 360 },
  { label: '24 hrs', value: '24h', minutes: 1440 },
  { label: '48 hrs', value: '48h', minutes: 2880 },
] as const;

export function BeneficiaryPage() {
  const navigate = useNavigate();
  const [selectedCooling, setSelectedCooling] = useState<string>('');
  const [brnInput, setBrnInput] = useState('');
  const [brnError, setBrnError] = useState<string | null>(null);
  const [touchedBrn, setTouchedBrn] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const order = useBridgeStore((s) => s.order);
  const { usdtAmount, inrAmount, paymentMethod } = order;

  const isUPI = paymentMethod === 'UPI';
  const inputLabel = isUPI ? 'Enter UTR / TxID' : 'Enter BRN';
  const inputPlaceholder = isUPI ? 'E.G., 1234567890ABC' : 'E.G., BRN123456789';

  const touch = useBridgeStore((s) => s.touch);
  const selectBeneficiary = useBridgeStore((s) => s.selectBeneficiary);
  const setCooling = useBridgeStore((s) => s.setCooling);
  const setCoolingNone = useBridgeStore((s) => s.setCoolingNone);
  const setReferenceNumber = useBridgeStore((s) => s.setReferenceNumber);
  const verifyReference = useBridgeStore((s) => s.verifyReference);

  const brnValidation = useMemo(() => validateReference(brnInput, 'BRN'), [brnInput]);
  const canConfirmBrn = brnValidation.valid;
  const isNoneSelected = selectedCooling === 'none';

  const handleContinueCooling = () => {
    if (!selectedCooling || selectedCooling === 'none') return;
    const option = COOLING_OPTIONS.find((o) => o.value === selectedCooling);
    if (!option) return;
    touch();
    selectBeneficiary({
      id: SINGLE_BANK_BENEFICIARY.id,
      displayName: SINGLE_BANK_BENEFICIARY.displayName,
      bankName: SINGLE_BANK_BENEFICIARY.bankName,
      accountNumberMasked: SINGLE_BANK_BENEFICIARY.accountNumberMasked,
      ifsc: SINGLE_BANK_BENEFICIARY.ifsc,
    });
    setCooling(option.minutes);
    navigate(ROUTES.BRIDGE.COOLING);
  };

  const handleConfirmPayment = async () => {
    if (isVerifying) return;
    if (!canConfirmBrn) {
      setTouchedBrn(true);
      return;
    }
    touch();
    setBrnError(null);
    selectBeneficiary({
      id: SINGLE_BANK_BENEFICIARY.id,
      displayName: SINGLE_BANK_BENEFICIARY.displayName,
      bankName: SINGLE_BANK_BENEFICIARY.bankName,
      accountNumberMasked: SINGLE_BANK_BENEFICIARY.accountNumberMasked,
      ifsc: SINGLE_BANK_BENEFICIARY.ifsc,
    });
    setCoolingNone();
    setReferenceNumber(normalizeReference(brnInput));
    setIsVerifying(true);
    try {
      const result = await verifyReference();
      if (result.success) {
        setShowSuccessModal(true);
      } else {
        setBrnError('Incorrect BRN');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBrnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 22);
    setBrnInput(v);
    setBrnError(null);
  };

  const handleChangeMethod = () => {
    useBridgeStore.setState((s) => ({
      order: { ...s.order, paymentMethod: null },
    }));
    navigate(ROUTES.BRIDGE.PAYMENT, { replace: true });
  };

  const canContinueCooling = Boolean(selectedCooling) && selectedCooling !== 'none';
  const showBrnError = (touchedBrn || brnError) && (brnValidation.error ?? brnError);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full pt-0 pb-8"
    >
      <div className="w-full px-6 lg:px-12 2xl:px-16">
        <h1 className="text-2xl font-semibold text-[var(--text)] mb-2">Payment</h1>
        <p className="text-[var(--muted)] mb-6">
          Transfer funds to the beneficiary below. Then select a cooling period.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Receipt + Beneficiary */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <PaymentAmountCard usdtAmount={usdtAmount} inrAmount={inrAmount} />
          <PaymentBeneficiaryCard
            rows={[
              { label: 'Beneficiary Name', value: SINGLE_BANK_BENEFICIARY.displayName },
              { label: 'Bank Name', value: SINGLE_BANK_BENEFICIARY.bankName },
              {
                label: 'Account Number',
                value: SINGLE_BANK_BENEFICIARY.accountNumberMasked,
                copyValue: SINGLE_BANK_BENEFICIARY.accountNumberMasked,
                mono: true,
              },
              {
                label: 'IFSC',
                value: SINGLE_BANK_BENEFICIARY.ifsc,
                copyValue: SINGLE_BANK_BENEFICIARY.ifsc,
                mono: true,
              },
            ]}
          />
          {isNoneSelected && (
            <div className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col gap-4 shadow-[var(--shadow)]">
              <PaymentVerificationBlock
                inputId="brn-input-inline"
                label={inputLabel}
                placeholder={inputPlaceholder}
                value={brnInput}
                onChange={handleBrnChange}
                error={showBrnError ? (brnError ?? brnValidation.error ?? null) : null}
                canConfirm={canConfirmBrn}
                isVerifying={isVerifying}
                onConfirm={handleConfirmPayment}
                buttonLabel="I have paid"
              />
              <button
                type="button"
                onClick={handleChangeMethod}
                className="block w-full text-center text-[var(--green)] text-sm hover:underline"
              >
                Change method
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Cooling card + Continue button */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 lg:self-start flex flex-col gap-4">
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col shadow-[var(--shadow)]">
            <label htmlFor="cooling-select" className="block text-[var(--text)] font-medium mb-2">
              Cooling period
            </label>
            <select
              id="cooling-select"
              value={selectedCooling}
              onChange={(e) => setSelectedCooling(e.target.value)}
              className="w-full min-h-[44px] px-4 py-3 rounded-xl bg-white border border-[var(--border)] text-[var(--text)] focus:border-[var(--green)] focus:ring-2 focus:ring-[var(--focus)] focus:outline-none"
            >
              <option value="">Select cooling period</option>
              {COOLING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {!isNoneSelected && (
            <button
              type="button"
              onClick={handleContinueCooling}
              disabled={!canContinueCooling}
              className="min-h-[44px] w-full rounded-xl bg-[var(--green)] text-white font-semibold hover:bg-[var(--green-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          )}
        </div>
      </div>
      </div>

      {isVerifying && <LoadingOverlay message="Wait, payment processing…" />}

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />
    </motion.div>
  );
}
