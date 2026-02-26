import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useBridgeStore } from '../store/bridgeStore';
import { parseQueryParams } from '../utils/queryParams';
import { StepIndicator } from '../components/StepIndicator';
import { ROUTES } from '../routes/paths';


export function ExplainPage() {
  const navigate = useNavigate();
  const params = parseQueryParams();
  const createOrder = useBridgeStore((s) => s.createOrder);
  const touch = useBridgeStore((s) => s.touch);

  const handleContinue = async () => {
    touch();
    await createOrder({
      merchantReturnUrl: params.merchantReturnUrl,
      currency: 'INR',
      coin: params.coin as 'USDT_TRX',
      presetUsdt: params.presetUsdt,
    });
    navigate(ROUTES.BRIDGE.PAYMENT);
  };

  const handleCancel = () => {
    window.location.href = params.merchantReturnUrl + '?status=cancelled';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-[480px] mx-auto px-4 pt-0 pb-8"
    >
      <StepIndicator current={1} total={3} />

      <h1 className="text-2xl font-semibold text-white mb-2">Buy Crypto</h1>
      <p className="text-slate-400 mb-8 leading-relaxed">
        Your deposit will be processed via crypto bridge. We will use your INR payment to purchase USDT. Then you can send it to the merchant or withdraw to a personal wallet.
      </p>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleContinue}
          className="min-h-[44px] w-full rounded-xl bg-primary text-black font-semibold hover:bg-primary/90 transition-colors"
        >
          Continue
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="min-h-[44px] w-full rounded-xl border border-slate-600 text-slate-400 hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}
