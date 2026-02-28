import { useNavigate } from 'react-router-dom';
import { useBridgeStore } from '../store/bridgeStore';
import { ROUTES } from '../routes/paths';
import pikeswopIcon from '../assets/pikeswop-icon.png';

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
        className="min-h-[52px] px-12 rounded-xl bg-white text-[var(--green)] font-semibold text-lg border border-gray-200 shadow-md hover:shadow-lg hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-3"
      >
        <img
          src={pikeswopIcon}
          alt="Fastpikeswop"
          className="h-8 w-auto object-contain shrink-0"
        />
        <span>Deposit via Fastpikeswop</span>
      </button>
    </div>
  );
}
