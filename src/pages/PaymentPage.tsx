import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useBridgeStore } from '../store/bridgeStore';
import { useOrder } from '../hooks/useOrder';
import { StepIndicator } from '../components/StepIndicator';
import { ROUTES } from '../routes/paths';

export function PaymentPage() {
  const navigate = useNavigate();
  const [usdtInput, setUsdtInput] = useState('');
  const [usdtError, setUsdtError] = useState<string | null>(null);

  const {
    usdtAmount,
    inrAmount,
    exchangeRate,
    rateLoading,
    paymentMethod,
    touch,
    setUsdtAmount,
    selectUPI,
    selectBANK,
  } = useOrder();

  useEffect(() => {
    setUsdtInput(String(usdtAmount));
  }, [usdtAmount]);

  useEffect(() => {
    if (usdtInput === '') return;
    const n = parseFloat(usdtInput);
    if (isNaN(n)) setUsdtError('Enter a valid number');
    else if (n < 10) setUsdtError('Minimum 10 USDT');
    else if (n > 10000) setUsdtError('Maximum 10,000 USDT');
    else {
      setUsdtError(null);
      setUsdtAmount(Math.round(n * 100) / 100);
    }
  }, [usdtInput, setUsdtAmount]);

  const isValid =
    usdtError === null &&
    usdtInput !== '' &&
    parseFloat(usdtInput) >= 10 &&
    parseFloat(usdtInput) <= 10000;

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

  const handleIPaid = () => {
    touch();
    useBridgeStore.setState((s) => ({
      order: {
        ...s.order,
        invoiceStatus: 'READY_FOR_VERIFICATION',
        referenceType: 'UTR',
        referenceNumber: '',
        expectedInrAmount: s.order.inrAmount,
      },
    }));
    navigate(ROUTES.BRIDGE.VERIFY);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-[480px] mx-auto px-4 pt-0 pb-8"
    >
      <StepIndicator current={2} total={3} />

      <h1 className="text-2xl font-semibold text-white mb-6">Deposit & Payment</h1>

      <div className="mb-6">
        <label htmlFor="usdt-input" className="block text-slate-300 mb-2">
          How much USDT do you want to buy?
        </label>
        <input
          id="usdt-input"
          type="number"
          min={10}
          max={10000}
          step={0.01}
          value={usdtInput}
          onChange={(e) => setUsdtInput(e.target.value)}
          className="w-full min-h-[44px] px-4 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:border-primary focus:outline-none"
          placeholder="60"
        />
        {usdtError && <p className="mt-1 text-sm text-red-400">{usdtError}</p>}
        <p className="mt-2 text-slate-400 text-sm">
          ≈ ₹{inrAmount.toLocaleString('en-IN')} INR
        </p>
        <p className="mt-1 text-slate-500 text-sm">
          Live rate: 1 USDT = ₹{exchangeRate}
          {rateLoading && ' (loading…)'}
        </p>
      </div>

      {!paymentMethod ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleUPI}
            disabled={!isValid}
            className="flex items-center gap-4 p-4 rounded-xl bg-slate-800 border-2 border-slate-600 hover:border-primary transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-2xl">
              📱
            </div>
            <div>
              <h3 className="font-semibold text-white">Buy via UPI</h3>
              <p className="text-sm text-slate-400">Instant payment via UPI app</p>
            </div>
          </button>
          <button
            type="button"
            onClick={handleBANK}
            disabled={!isValid}
            className="flex items-center gap-4 p-4 rounded-xl bg-slate-800 border-2 border-slate-600 hover:border-primary transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-2xl">
              🏦
            </div>
            <div>
              <h3 className="font-semibold text-white">Buy via IMPS / RTGS / NEFT</h3>
              <p className="text-sm text-slate-400">Select beneficiary, then pay</p>
            </div>
          </button>
        </div>
      ) : paymentMethod === 'UPI' ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-800 border border-slate-600">
            <p className="text-slate-400 text-sm mb-2">UPI ID</p>
            <p className="text-lg font-mono text-primary">merchant@upi</p>
            <p className="mt-2 text-slate-400 text-sm">
              Amount: ₹{inrAmount.toLocaleString('en-IN')}
            </p>
            <div className="mt-4 w-32 h-32 bg-white rounded-lg flex items-center justify-center text-slate-800 text-xs">
              QR Placeholder
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleIPaid}
              className="min-h-[44px] w-full rounded-xl bg-primary text-black font-semibold hover:bg-primary/90"
            >
              I have paid
            </button>
            <button
              type="button"
              onClick={handleChangeMethod}
              className="text-primary text-sm hover:underline"
            >
              Change method
            </button>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
