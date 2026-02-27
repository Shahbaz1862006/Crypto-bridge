import { useNavigate } from 'react-router-dom';
import { useBridgeStore } from '../store/bridgeStore';
import { ROUTES } from '../routes/paths';

export function MerchantHomePage() {
  const navigate = useNavigate();
  const resetBridgeFlow = useBridgeStore((s) => s.resetBridgeFlow);

  const handleDeposit = () => {
    resetBridgeFlow({ preserveHistory: true });
    navigate(ROUTES.BRIDGE.EXPLAIN, { replace: true });
  };

  return (
    <div className="flex flex-col min-h-[60vh] justify-center items-center px-6">
      <h1 className="text-2xl font-semibold text-[var(--text)] mb-12 self-start">Merchant</h1>
      <button
        type="button"
        onClick={handleDeposit}
        className="min-h-[52px] px-12 rounded-xl bg-[var(--green)] text-white font-semibold text-lg hover:bg-[var(--green-hover)] transition-colors shadow-[var(--shadow)]"
      >
        Deposit via Fastpikeswop
      </button>
    </div>
  );
}
