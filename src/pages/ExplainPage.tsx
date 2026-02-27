import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useBridgeStore } from '../store/bridgeStore';
import { parseQueryParams } from '../utils/queryParams';
import { ROUTES } from '../routes/paths';


export function ExplainPage() {
  const navigate = useNavigate();
  const params = parseQueryParams();
  const createOrder = useBridgeStore((s) => s.createOrder);
  const touch = useBridgeStore((s) => s.touch);
  const resetBridgeFlow = useBridgeStore((s) => s.resetBridgeFlow);

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
    resetBridgeFlow({ preserveHistory: true });
    navigate(ROUTES.MERCHANT.HISTORY, { replace: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full pt-0 pb-8"
    >
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
        <h1 className="mt-2 mb-4 text-2xl font-semibold text-gray-900">
          Buy Crypto
        </h1>
        <p className="mb-8 text-[var(--muted)] leading-relaxed">
          Your deposit will be processed via crypto bridge. We will use your INR payment to purchase USDT. Then you can send it to the merchant or withdraw to a personal wallet.
        </p>

        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleContinue}
            className="min-h-[44px] w-full sm:max-w-md sm:px-8 rounded-xl bg-[var(--green)] text-white font-semibold hover:bg-[var(--green-hover)] transition-colors"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="min-h-[44px] w-full sm:max-w-md sm:px-8 rounded-xl border border-[var(--border)] text-[var(--muted)] hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
}
